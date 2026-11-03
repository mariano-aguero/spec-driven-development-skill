#!/usr/bin/env node
// Runs every eval scenario with and without the skill, several trials each,
// grades each transcript with a judge, and reports pass rates and the delta.
// Usage: node .github/scripts/run-evals.mjs --help
import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
  cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, renameSync, rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const evalsDir = join(root, 'evals')
const skillDir = join(root, 'skills/spec-driven-development')
const CONDITIONS = ['with-skill', 'without-skill']
const TIMEOUT_MS = 15 * 60 * 1000

// --setting-sources project keeps the user's own skills and CLAUDE.md out of both
// conditions, so the only difference between them is the copied skill.
const DEFAULT_AGENT_CMD = [
  'claude -p --model sonnet --setting-sources project --strict-mcp-config',
  '--tools "Read,Write,Edit,Glob,Grep,Skill" --permission-mode acceptEdits',
  '--max-turns 25 --output-format stream-json --verbose --no-session-persistence',
].join(' ')
const DEFAULT_JUDGE_CMD = [
  'claude -p --model sonnet --setting-sources project --strict-mcp-config',
  '--tools "" --max-turns 1 --no-session-persistence',
].join(' ')

const HELP = `Usage: node .github/scripts/run-evals.mjs [options]

  --scenario <id>      run one scenario, e.g. 01-triggering (default: all)
  --trials <n>         trials per scenario and condition (default: 3)
  --condition <name>   with-skill or without-skill (default: both)
  --parallel <n>       trials running at once (default: 1)
  --out <file>         markdown report path (default: evals/results/<date>.md,
                       the JSON report is written next to it)
  --judge-only <file>  grade a saved transcript against --scenario and print
                       the judge JSON, without running an agent

Env:
  EVAL_AGENT_CMD   shell command, query on stdin, cwd is the temp project,
                   transcript on stdout (default: claude CLI, sonnet)
  EVAL_JUDGE_CMD   shell command, judge prompt on stdin, JSON on stdout
                   (default: claude CLI, sonnet, no tools)
`

function parseArgs(argv) {
  const opts = { trials: 3, parallel: 1, conditions: CONDITIONS }
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i]
    if (flag === '--help' || flag === '-h') opts.help = true
    else if (flag === '--scenario') opts.scenario = argv[++i]
    else if (flag === '--trials') opts.trials = Number(argv[++i])
    else if (flag === '--parallel') opts.parallel = Number(argv[++i])
    else if (flag === '--out') opts.out = argv[++i]
    else if (flag === '--judge-only') opts.judgeOnly = argv[++i]
    else if (flag === '--condition') {
      opts.conditions = [argv[++i]]
      if (!CONDITIONS.includes(opts.conditions[0])) throw new Error(`unknown condition: ${opts.conditions[0]}`)
    } else throw new Error(`unknown flag: ${flag}`)
  }
  if (!(opts.trials >= 1) || !(opts.parallel >= 1)) throw new Error('--trials and --parallel must be >= 1')
  return opts
}

function loadScenarios(only) {
  const ids = readdirSync(evalsDir)
    .filter((f) => /^\d+-.*\.json$/.test(f))
    .map((f) => f.replace(/\.json$/, ''))
    .sort()
  const picked = only ? ids.filter((id) => id === only) : ids
  if (picked.length === 0) throw new Error(`no scenario matches ${only ?? '*'}`)
  return picked.map((id) => ({ id, ...JSON.parse(readFileSync(join(evalsDir, `${id}.json`), 'utf8')) }))
}

function sh(cmd, { input, cwd }) {
  return new Promise((done) => {
    const child = spawn('sh', ['-c', cmd], { cwd, stdio: ['pipe', 'pipe', 'pipe'] })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (d) => (stdout += d))
    child.stderr.on('data', (d) => (stderr += d))
    const timer = setTimeout(() => child.kill('SIGKILL'), TIMEOUT_MS)
    child.on('error', (e) => done({ code: -1, stdout, stderr: String(e) }))
    child.on('close', (code) => {
      clearTimeout(timer)
      done({ code, stdout, stderr })
    })
    child.stdin.on('error', () => {})
    child.stdin.end(input)
  })
}

// Fixtures name the project's .claude/ directory `dot-claude` so it can be committed.
function buildProject(scenario, condition) {
  const dir = mkdtempSync(join(tmpdir(), `sdd-eval-${scenario.id}-`))
  if (scenario.fixture) {
    cpSync(join(evalsDir, scenario.fixture), dir, { recursive: true })
    if (existsSync(join(dir, 'dot-claude'))) renameSync(join(dir, 'dot-claude'), join(dir, '.claude'))
  }
  if (condition === 'with-skill') {
    const target = join(dir, '.claude/skills')
    mkdirSync(target, { recursive: true })
    cpSync(skillDir, join(target, 'spec-driven-development'), { recursive: true })
  }
  return dir
}

function snapshot(dir, base = dir, out = new Map()) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) snapshot(full, base, out)
    else out.set(full.slice(base.length + 1), createHash('sha1').update(readFileSync(full)).digest('hex'))
  }
  return out
}

function changedFiles(before, after) {
  const lines = []
  for (const [path, hash] of after) {
    if (path.startsWith('.claude/skills/')) continue
    if (!before.has(path)) lines.push(`added ${path}`)
    else if (before.get(path) !== hash) lines.push(`modified ${path}`)
  }
  for (const path of before.keys()) if (!after.has(path)) lines.push(`deleted ${path}`)
  return lines
}

const clip = (s, n) => (s.length > n ? `${s.slice(0, n)}... [${s.length - n} more chars]` : s)

function blockText(block) {
  if (block.type === 'text') return `ASSISTANT: ${block.text}`
  if (block.type === 'tool_use') return `TOOL ${block.name}: ${clip(JSON.stringify(block.input), 3000)}`
  if (block.type === 'tool_result') {
    const body = Array.isArray(block.content) ? block.content.map((c) => c.text ?? '').join('') : String(block.content)
    return `RESULT: ${clip(body, 600)}`
  }
  return ''
}

// stream-json lines become readable turns. Output that is not stream-json passes through,
// so a custom EVAL_AGENT_CMD can print plain text.
function toTranscript(raw) {
  const turns = []
  for (const line of raw.split('\n')) {
    let event
    try {
      event = JSON.parse(line)
    } catch {
      if (line.trim()) turns.push(line)
      continue
    }
    const content = event.message?.content
    if ((event.type === 'assistant' || event.type === 'user') && Array.isArray(content)) {
      turns.push(...content.map(blockText).filter(Boolean))
    }
  }
  return turns.join('\n\n')
}

function judgePrompt(scenario, transcript) {
  const items = scenario.expected_behavior.map((item, i) => `${i + 1}. ${item}`).join('\n')
  return `You grade one run of an AI coding agent against a checklist.

User request given to the agent:
${scenario.query}

Checklist (${scenario.expected_behavior.length} items):
${items}

Grade each item strictly as pass or fail. No partial credit. An item passes only if the
transcript shows the behavior. Absence of evidence is a fail. Do not give credit for intent
or for behavior the agent only described. For every item, quote the transcript text or the
tool call that supports your verdict in "reason". If you cannot quote evidence, the item fails.

Answer with one JSON object and nothing else, in this shape:
{"items":[{"pass":true,"reason":"..."}]}
It must contain exactly ${scenario.expected_behavior.length} entries, in checklist order.

<transcript>
${transcript}
</transcript>`
}

function parseVerdict(text, expected) {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  const parsed = JSON.parse(text.slice(start, end + 1))
  const ok = Array.isArray(parsed.items) && parsed.items.length === expected &&
    parsed.items.every((it) => typeof it.pass === 'boolean')
  if (!ok) throw new Error(`judge returned an invalid verdict: ${clip(text, 300)}`)
  return parsed.items.map((it) => ({ pass: it.pass, reason: String(it.reason ?? '') }))
}

async function judge(scenario, transcript, judgeCmd) {
  const neutral = mkdtempSync(join(tmpdir(), 'sdd-judge-'))
  try {
    let lastError
    for (let attempt = 0; attempt < 2; attempt++) {
      const res = await sh(judgeCmd, { input: judgePrompt(scenario, transcript), cwd: neutral })
      try {
        return parseVerdict(res.stdout, scenario.expected_behavior.length)
      } catch (e) {
        lastError = new Error(`${e.message} (exit ${res.code}) ${clip(res.stderr, 200)}`)
      }
    }
    throw lastError
  } finally {
    rmSync(neutral, { recursive: true, force: true })
  }
}

async function runTrial(scenario, condition, trial, cmds, transcriptDir) {
  const dir = buildProject(scenario, condition)
  try {
    const before = snapshot(dir)
    const res = await sh(cmds.agent, { input: scenario.query, cwd: dir })
    if (res.stdout.trim() === '') throw new Error(`agent produced no output (exit ${res.code}) ${clip(res.stderr, 300)}`)
    const files = changedFiles(before, snapshot(dir))
    const transcript = `${toTranscript(res.stdout)}\n\nFILES AFTER THE RUN:\n${files.join('\n') || '(none changed)'}`
    mkdirSync(transcriptDir, { recursive: true })
    writeFileSync(join(transcriptDir, `${scenario.id}-${condition}-${trial}.txt`), transcript)
    return { items: await judge(scenario, transcript, cmds.judge) }
  } catch (e) {
    return { error: e.message }
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

async function pool(jobs, size) {
  const results = new Array(jobs.length)
  let next = 0
  const worker = async () => {
    while (next < jobs.length) {
      const i = next++
      results[i] = await jobs[i]()
    }
  }
  await Promise.all(Array.from({ length: Math.min(size, jobs.length) }, worker))
  return results
}

const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length

function summarize(scenario, trials) {
  const valid = trials.filter((t) => t.items)
  if (valid.length === 0) return { trials: trials.length, valid: 0, errors: trials.map((t) => t.error) }
  const scores = valid.map((t) => mean(t.items.map((it) => (it.pass ? 1 : 0))))
  return {
    trials: trials.length,
    valid: valid.length,
    overall: mean(scores),
    min: Math.min(...scores),
    max: Math.max(...scores),
    fullPasses: valid.filter((t) => t.items.every((it) => it.pass)).length,
    perItem: scenario.expected_behavior.map((text, i) => ({
      text,
      rate: mean(valid.map((t) => (t.items[i].pass ? 1 : 0))),
    })),
    runs: trials,
  }
}

const pct = (x) => (x === undefined ? 'n/a' : `${Math.round(x * 100)}%`)
const signed = (x) => `${x >= 0 ? '+' : ''}${Math.round(x * 100)} pts`

function markdown(report) {
  const lines = [
    `# Eval results ${report.date}`,
    '',
    `Trials per cell: ${report.trials}. Scores are the share of checklist items passed. Spread is min to max across trials. Full passes count trials where every item passed.`,
    '',
    '| Scenario | Condition | Overall | Spread | Full passes | Items |',
    '|----------|-----------|---------|--------|-------------|-------|',
  ]
  for (const [id, byCondition] of Object.entries(report.scenarios)) {
    for (const condition of CONDITIONS) {
      const s = byCondition[condition]
      if (!s) continue
      if (!s.valid) {
        lines.push(`| ${id} | ${condition} | n/a | n/a | 0/${s.trials} | all trials errored |`)
        continue
      }
      const items = s.perItem.map((p) => pct(p.rate)).join(' ')
      lines.push(`| ${id} | ${condition} | ${pct(s.overall)} | ${pct(s.min)} to ${pct(s.max)} | ${s.fullPasses}/${s.valid} | ${items} |`)
    }
  }
  const deltas = Object.entries(report.scenarios).filter(([, c]) => c['with-skill']?.valid && c['without-skill']?.valid)
  if (deltas.length > 0) {
    lines.push('', '## Delta (with skill minus without)', '', '| Scenario | With | Without | Delta | Spreads overlap |', '|----------|------|---------|-------|-----------------|')
    for (const [id, c] of deltas) {
      const w = c['with-skill']
      const wo = c['without-skill']
      const overlap = w.min <= wo.max && wo.min <= w.max
      lines.push(`| ${id} | ${pct(w.overall)} | ${pct(wo.overall)} | ${signed(w.overall - wo.overall)} | ${overlap ? 'yes' : 'no'} |`)
    }
  }
  return `${lines.join('\n')}\n`
}

async function main() {
  const opts = parseArgs(process.argv.slice(2))
  if (opts.help) return console.log(HELP)

  const cmds = {
    agent: process.env.EVAL_AGENT_CMD || DEFAULT_AGENT_CMD,
    judge: process.env.EVAL_JUDGE_CMD || DEFAULT_JUDGE_CMD,
  }
  const scenarios = loadScenarios(opts.scenario)

  if (opts.judgeOnly) {
    if (scenarios.length !== 1) throw new Error('--judge-only needs --scenario <id>')
    const transcript = readFileSync(opts.judgeOnly, 'utf8')
    return console.log(JSON.stringify({ items: await judge(scenarios[0], transcript, cmds.judge) }, null, 2))
  }

  const date = new Date().toISOString().slice(0, 10)
  const mdPath = resolve(opts.out ?? join(evalsDir, 'results', `${date}.md`))
  const base = mdPath.replace(/\.md$/, '')
  mkdirSync(dirname(mdPath), { recursive: true })

  const cells = scenarios.flatMap((s) => opts.conditions.map((c) => ({ s, c })))
  const jobs = cells.flatMap(({ s, c }) =>
    Array.from({ length: opts.trials }, (_, t) => async () => {
      const result = await runTrial(s, c, t + 1, cmds, `${base}-transcripts`)
      console.error(`${s.id} ${c} trial ${t + 1}: ${result.error ? `error: ${result.error}` : `${result.items.filter((i) => i.pass).length}/${result.items.length}`}`)
      return result
    }))
  const results = await pool(jobs, opts.parallel)

  const report = { date, trials: opts.trials, agentCmd: cmds.agent, judgeCmd: cmds.judge, scenarios: {} }
  cells.forEach(({ s, c }, i) => {
    const trials = results.slice(i * opts.trials, (i + 1) * opts.trials)
    report.scenarios[s.id] ??= {}
    report.scenarios[s.id][c] = summarize(s, trials)
  })
  writeFileSync(`${base}.json`, `${JSON.stringify(report, null, 2)}\n`)
  writeFileSync(mdPath, markdown(report))
  console.log(markdown(report))
  console.error(`wrote ${mdPath} and ${base}.json`)
}

main().catch((e) => {
  console.error(e.message)
  process.exit(1)
})
