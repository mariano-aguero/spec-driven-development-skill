#!/usr/bin/env node
// Mechanical checks for spec-driven-development artifacts.
// Usage: node sdd-check.mjs [specs-dir-or-feature-dir] [--json]
// The formats parsed here are defined in references/artifact-templates.md.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const STATUSES = ['Draft', 'Approved', 'Planned', 'In Progress', 'Validated', 'Archived']
const PAST_GATE_1 = STATUSES.slice(1)
const DURATION = /\b\d+(\.\d+)?\s*(minutes?|mins?|hours?|hrs?|days?|weeks?)\b/i

// Lines outside code fences and HTML comments, comments stripped, original line
// numbers kept, so the guidance text inside templates never counts as content.
function liveLines(text) {
  const out = []
  let fenced = false
  let commented = false
  text.split('\n').forEach((raw, i) => {
    let line = raw
    if (commented) {
      const end = line.indexOf('-->')
      if (end === -1) return
      commented = false
      line = line.slice(end + 3)
    }
    if (/^\s*```/.test(line)) {
      fenced = !fenced
      return
    }
    if (fenced) return
    line = line.replace(/<!--.*?-->/g, '')
    const open = line.indexOf('<!--')
    if (open !== -1) {
      commented = true
      line = line.slice(0, open)
    }
    out.push({ n: i + 1, text: line })
  })
  return out
}

function section(lines, title) {
  const start = lines.findIndex((l) => l.text.trim() === `## ${title}`)
  if (start === -1) return null
  const rest = lines.slice(start + 1)
  const end = rest.findIndex((l) => /^## /.test(l.text))
  return { line: lines[start].n, lines: end === -1 ? rest : rest.slice(0, end) }
}

function parseHandoff(lines) {
  const sec = section(lines, 'Handoff')
  if (!sec) return null
  const h = { line: sec.line, goal: '', doneWhen: [], isolation: '', stopIf: '' }
  let inDone = false
  for (const { n, text } of sec.lines) {
    const key = text.match(/^(Goal|Done when|Isolation|Permissions|Stop if):\s*(.*)$/)
    if (key) {
      inDone = key[1] === 'Done when'
      if (key[1] === 'Goal') h.goal = key[2].trim()
      if (key[1] === 'Isolation') h.isolation = key[2].trim()
      if (key[1] === 'Stop if') h.stopIf = key[2].trim()
      continue
    }
    const item = text.match(/^\s*-\s*\[[ xX]\]\s*(.*)$/)
    if (inDone && item) h.doneWhen.push({ line: n, text: item[1].trim() })
  }
  return h
}

function parseAcs(lines) {
  const acs = []
  let current = null
  for (const { n, text } of lines) {
    const head = text.match(/^#{2,4}\s+AC-([\w-]+):(.*)$/)
    if (head) {
      const labels = [...head[2].matchAll(/\[([A-Z]+)\]/g)].map((m) => m[1])
      current = {
        id: `AC-${head[1]}`,
        line: n,
        priority: labels.find((l) => ['MUST', 'SHOULD', 'COULD', 'WONT'].includes(l)) ?? null,
        change: labels.find((l) => ['ADDED', 'MODIFIED', 'REMOVED', 'UNCHANGED'].includes(l)) ?? null,
        proof: null,
      }
      acs.push(current)
    } else if (/^#{1,6}\s/.test(text)) {
      current = null
    } else if (current && /^\*\*Proof:\*\*\s*\S/.test(text)) {
      current.proof = n
    }
  }
  return acs
}

// The baseline path is the part before any `@` or space. It resolves against the
// feature dir and each parent, so repo-root-relative paths work from anywhere below.
function resolveBaseline(raw, featureDir) {
  const m = raw.match(/^[\s[`]*([^\s`\]@]+)/)
  if (!m) return { path: '', resolved: false }
  for (let dir = featureDir; ; dir = dirname(dir)) {
    const file = join(dir, m[1])
    if (existsSync(file) && statSync(file).isFile()) return { path: m[1], resolved: true }
    if (dirname(dir) === dir) return { path: m[1], resolved: false }
  }
}

function parseSpec(path, featureDir) {
  const lines = liveLines(readFileSync(path, 'utf8'))
  const header = (name) => {
    const hit = lines.find((l) => l.text.startsWith(`${name}:`))
    return hit ? { line: hit.n, raw: hit.text.slice(name.length + 1).trim() } : null
  }
  const status = header('Status')
  const mode = header('Mode')
  const baseline = header('Baseline')
  return {
    path,
    status: status && {
      line: status.line,
      raw: status.raw,
      value: STATUSES.find((s) => new RegExp(`^${s}\\b`).test(status.raw)) ?? null,
    },
    delta: mode?.raw === 'Delta',
    modeLine: mode?.line ?? 1,
    baseline: baseline && { line: baseline.line, ...resolveBaseline(baseline.raw, featureDir) },
    acs: parseAcs(lines),
    handoff: parseHandoff(lines),
    clarifications: lines
      .filter((l) => l.text.replace(/`[^`]*`/g, '').includes('[NEEDS CLARIFICATION]'))
      .map((l) => l.n),
  }
}

function parseTasks(path) {
  const tasks = []
  let group = ''
  let task = null
  for (const { n, text } of liveLines(readFileSync(path, 'utf8'))) {
    const head = text.match(/^#{2,4}\s+(.*)$/)
    const item = text.match(/^- \[[ xX]\] \*\*(TASK-\d+)\*\*(.*)$/)
    if (head) {
      group = head[1].trim()
      task = null
    }
    if (item) {
      task = { id: item[1], line: n, group, parallel: item[2].includes('[P]'), deps: [], files: [], acs: [] }
      tasks.push(task)
    }
    if (!task) continue
    task.acs.push(...(item ? item[2] : text).match(/\bAC-[\w-]*\w/g) ?? [])
    const deps = text.match(/^\s*-\s*Depends on:\s*(.*)$/)
    if (deps) task.deps.push(...(deps[1].match(/TASK-\d+/g) ?? []))
    const files = text.match(/^\s*-\s*(?:Creates|Modifies):\s*(.*)$/)
    if (files) {
      const quoted = [...files[1].matchAll(/`([^`]+)`/g)].map((m) => m[1])
      task.files.push(...(quoted.length ? quoted : files[1].split(',').map((s) => s.trim()).filter(Boolean)))
    }
  }
  return tasks
}

export function loadFeature(dir) {
  const at = (name) => join(dir, name)
  return {
    dir,
    spec: parseSpec(at('spec.md'), dir),
    tasks: existsSync(at('tasks.md')) ? { path: at('tasks.md'), list: parseTasks(at('tasks.md')) } : null,
    sentinel: existsSync(at('.amend-in-progress')) ? at('.amend-in-progress') : null,
  }
}

// A directory with spec.md is a feature, otherwise its subdirectories are scanned.
// archive/ and _current/ hold history, not features in flight.
export function findFeatures(path) {
  if (existsSync(join(path, 'spec.md'))) return [path]
  return readdirSync(path, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !['archive', '_current'].includes(e.name))
    .map((e) => join(path, e.name))
    .filter((d) => existsSync(join(d, 'spec.md')))
}

const find = (file, line, message) => ({ file, line, message })

// Every task reachable through Depends on, transitively. A task in a cycle
// reaches itself.
function ancestorsOf(tasks) {
  const byId = new Map(tasks.map((t) => [t.id, t]))
  return (id) => {
    const seen = new Set()
    const todo = [...(byId.get(id)?.deps ?? [])]
    while (todo.length) {
      const next = todo.pop()
      if (seen.has(next)) continue
      seen.add(next)
      todo.push(...(byId.get(next)?.deps ?? []))
    }
    return seen
  }
}

export const rules = [
  {
    id: 'status-valid',
    run: ({ spec }) => {
      if (!spec.status) return [find(spec.path, 1, 'spec.md has no Status header')]
      if (spec.status.value) return []
      return [find(spec.path, spec.status.line, `Status "${spec.status.raw}" is not one of: ${STATUSES.join(', ')}`)]
    },
  },
  {
    id: 'ac-unique',
    run: ({ spec }) => {
      const seen = new Set()
      return spec.acs.flatMap((ac) => {
        const dup = seen.has(ac.id)
        seen.add(ac.id)
        return dup ? [find(spec.path, ac.line, `${ac.id} is defined more than once`)] : []
      })
    },
  },
  {
    // [REMOVED] ACs carry no priority and no proof in the delta template.
    id: 'ac-has-proof',
    run: ({ spec }) =>
      spec.acs
        .filter((ac) => ac.priority === 'MUST' && ac.change !== 'REMOVED' && !ac.proof)
        .map((ac) => find(spec.path, ac.line, `${ac.id} is [MUST] and has no **Proof:** line`)),
  },
  {
    id: 'no-open-questions',
    run: ({ spec }) =>
      PAST_GATE_1.includes(spec.status?.value)
        ? spec.clarifications.map((n) =>
            find(spec.path, n, `[NEEDS CLARIFICATION] left in a spec with Status ${spec.status.value}`),
          )
        : [],
  },
  {
    id: 'handoff-complete',
    run: ({ spec }) => {
      const h = spec.handoff
      if (!h) return [find(spec.path, 1, 'spec.md has no ## Handoff block')]
      const missing = [
        !h.goal && 'Goal',
        h.doneWhen.length === 0 && 'Done when (at least one item)',
        !h.isolation && 'Isolation',
        !h.stopIf && 'Stop if',
      ].filter(Boolean)
      return missing.map((part) => find(spec.path, h.line, `Handoff is missing ${part}`))
    },
  },
  {
    id: 'done-when-checkable',
    run: ({ spec }) =>
      (spec.handoff?.doneWhen ?? [])
        .filter((item) => DURATION.test(item.text) && !item.text.includes('`'))
        .map((item) => find(spec.path, item.line, `Done-when "${item.text}" is a time box, name a check that can pass or fail`)),
  },
  {
    id: 'delta-baseline',
    run: ({ spec }) => {
      if (!spec.delta) return []
      if (!spec.baseline) return [find(spec.path, spec.modeLine, 'Mode: Delta has no Baseline header')]
      if (spec.baseline.resolved) return []
      return [find(spec.path, spec.baseline.line, `Baseline "${spec.baseline.path}" does not resolve to an existing file`)]
    },
  },
  {
    id: 'task-refs-ac',
    run: ({ spec, tasks }) => {
      if (!tasks) return []
      const known = new Set(spec.acs.map((ac) => ac.id))
      const ancestors = ancestorsOf(tasks.list)
      const byId = new Map(tasks.list.map((t) => [t.id, t]))
      return tasks.list.flatMap((t) => {
        const unknown = t.acs.filter((id) => !known.has(id))
        if (unknown.length) return [find(tasks.path, t.line, `${t.id} references ${unknown.join(', ')}, not in spec.md`)]
        // Setup and Cleanup tasks carry no AC, and an implementation task
        // inherits the ACs of the test task it depends on.
        if (/^(setup|cleanup)\b/i.test(t.group)) return []
        const covered = t.acs.length > 0 || [...ancestors(t.id)].some((id) => byId.get(id)?.acs.length)
        return covered ? [] : [find(tasks.path, t.line, `${t.id} references no AC, directly or through its dependencies`)]
      })
    },
  },
  {
    id: 'task-graph',
    run: ({ tasks }) => {
      if (!tasks) return []
      const ids = new Set(tasks.list.map((t) => t.id))
      const ancestors = ancestorsOf(tasks.list)
      return tasks.list.flatMap((t) => [
        ...t.deps.filter((d) => !ids.has(d)).map((d) => find(tasks.path, t.line, `${t.id} depends on ${d}, which does not exist`)),
        ...(ancestors(t.id).has(t.id) ? [find(tasks.path, t.line, `${t.id} is part of a dependency cycle`)] : []),
      ])
    },
  },
  {
    id: 'parallel-no-shared-files',
    run: ({ tasks }) => {
      if (!tasks) return []
      const ancestors = ancestorsOf(tasks.list)
      const parallel = tasks.list.filter((t) => t.parallel)
      return parallel.flatMap((a, i) =>
        parallel.slice(i + 1).flatMap((b) => {
          if (ancestors(a.id).has(b.id) || ancestors(b.id).has(a.id)) return []
          return a.files
            .filter((f) => b.files.includes(f))
            .map((f) => find(tasks.path, b.line, `${a.id} and ${b.id} are [P] in the same wave and both write ${f}`))
        }),
      )
    },
  },
  {
    id: 'no-sentinel',
    severity: 'warning',
    run: ({ sentinel }) =>
      sentinel ? [find(sentinel, 1, '.amend-in-progress exists, fine mid-amend but it must not be committed')] : [],
  },
]

export function check(...paths) {
  const features = paths.flatMap(findFeatures).map(loadFeature)
  const findings = features.flatMap((f) =>
    rules.flatMap((rule) => rule.run(f).map((x) => ({ ...x, rule: rule.id, severity: rule.severity ?? 'error' }))),
  )
  return { features: features.length, findings }
}

function main(argv) {
  const json = argv.includes('--json')
  const args = argv.filter((a) => !a.startsWith('--'))
  const paths = (args.length ? args : ['specs']).map((a) => resolve(a))
  const missing = paths.find((p) => !existsSync(p))
  if (missing) {
    console.error(`sdd-check: ${missing} does not exist`)
    return 1
  }
  const { features, findings } = check(...paths)
  const shown = findings.map((x) => ({ ...x, file: relative(process.cwd(), x.file) }))
  const errors = shown.filter((x) => x.severity === 'error').length
  const warnings = shown.length - errors
  if (json) {
    console.log(JSON.stringify({ features, errors, warnings, findings: shown }, null, 2))
  } else {
    for (const x of shown) {
      const tag = x.severity === 'warning' ? 'warning: ' : ''
      console.log(`${x.file}:${x.line}: ${x.rule}: ${tag}${x.message}`)
    }
    console.log(`sdd-check: ${features} features, ${errors} errors, ${warnings} warnings`)
  }
  return errors ? 1 : 0
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = main(process.argv.slice(2))
}
