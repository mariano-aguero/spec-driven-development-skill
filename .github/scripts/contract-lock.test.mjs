import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const doc = readFileSync(join(repo, 'skills/spec-driven-development/references/enforcement.md'), 'utf8')

// The tested hook is the one the doc tells people to copy.
const block = [...doc.matchAll(/```bash\n([\s\S]*?)```/g)].find((m) =>
  m[1].includes('# .claude/hooks/contract-lock.sh'),
)
assert.ok(block, 'enforcement.md has no bash block for contract-lock.sh')

const work = mkdtempSync(join(tmpdir(), 'contract-lock-'))
const hook = join(work, 'contract-lock.sh')
writeFileSync(hook, block[1])

function runHook({ status, amend = false, file = 'contracts/api.md' }) {
  const feature = mkdtempSync(join(work, 'feature-'))
  mkdirSync(join(feature, 'contracts'))
  writeFileSync(join(feature, 'spec.md'), `# Feature\n\nStatus: ${status}\n`)
  if (amend) writeFileSync(join(feature, '.amend-in-progress'), '')
  const input = JSON.stringify({ tool_input: { file_path: join(feature, file) } })
  return spawnSync('bash', [hook], { input, encoding: 'utf8' })
}

test('Draft allows contract writes', () => {
  assert.equal(runHook({ status: 'Draft' }).status, 0)
})

test('Approved allows contract writes, Phase 2 writes them', () => {
  assert.equal(runHook({ status: 'Approved (Gate 1 passed)' }).status, 0)
})

test('Planned blocks and the message names the status', () => {
  const r = runHook({ status: 'Planned (Gate 2 passed)' })
  assert.equal(r.status, 2)
  assert.match(r.stderr, /Status: Planned/)
  assert.match(r.stderr, /\/sdd-change/)
})

test('In Progress blocks', () => {
  assert.equal(runHook({ status: 'In Progress' }).status, 2)
})

test('Planned with .amend-in-progress allows', () => {
  assert.equal(runHook({ status: 'Planned', amend: true }).status, 0)
})

test('a path outside contracts/ is never blocked', () => {
  assert.equal(runHook({ status: 'Planned', file: 'plan.md' }).status, 0)
})
