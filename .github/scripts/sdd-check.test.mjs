import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { cpSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { rules } from '../../skills/spec-driven-development/scripts/sdd-check.mjs'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const script = join(repo, 'skills/spec-driven-development/scripts/sdd-check.mjs')
const fixtures = join(repo, '.github/scripts/fixtures/sdd-check')

function run(dir) {
  const r = spawnSync('node', [script, dir, '--json'], { encoding: 'utf8' })
  return { code: r.status, ...JSON.parse(r.stdout) }
}

test('both shipped examples pass clean', () => {
  const r = run(join(repo, 'skills/spec-driven-development/examples/specs'))
  assert.equal(r.features, 2)
  assert.deepEqual(r.findings, [])
  assert.equal(r.code, 0)
})

test('the clean fixture passes', () => {
  const r = run(join(fixtures, 'clean'))
  assert.equal(r.features, 1)
  assert.deepEqual(r.findings, [])
  assert.equal(r.code, 0)
})

for (const rule of rules) {
  test(`${rule.id}: its fixture fires that rule and no other`, () => {
    const r = run(join(fixtures, rule.id))
    assert.ok(r.findings.length > 0, 'no findings')
    assert.deepEqual([...new Set(r.findings.map((f) => f.rule))], [rule.id])
    for (const f of r.findings) assert.match(`${f.file}:${f.line}`, /:\d+$/)
    // Warnings leave the exit code alone.
    assert.equal(r.code, rule.severity === 'warning' ? 0 : 1)
  })
}

test('text output is file:line: rule-id: message', () => {
  const r = spawnSync('node', [script, join(fixtures, 'status-valid')], { encoding: 'utf8' })
  assert.match(r.stdout, /spec\.md:3: status-valid: Status "Wip" is not one of/)
})

test('a missing path exits 1', () => {
  const r = spawnSync('node', [script, join(fixtures, 'nope')], { encoding: 'utf8' })
  assert.equal(r.status, 1)
})

test('no-open-questions ignores the marker inside inline code', () => {
  const dir = mkdtempSync(join(tmpdir(), 'sdd-inline-'))
  cpSync(join(fixtures, 'clean'), dir, { recursive: true })
  const spec = readdirSync(dir, { recursive: true }).map(String).find((f) => f.endsWith('spec.md'))
  const path = join(dir, spec)
  const approved = readFileSync(path, 'utf8').replace(/^Status: Draft$/m, 'Status: Approved')
  writeFileSync(path, approved + '\nThe validator rejects `[NEEDS CLARIFICATION]` past Gate 1.\n')
  assert.deepEqual(run(dir).findings, [])
})

test('several paths are all checked', () => {
  const r = spawnSync('node', [script, join(repo, 'skills/spec-driven-development/examples/specs'), join(fixtures, 'clean'), '--json'], { encoding: 'utf8' })
  assert.equal(JSON.parse(r.stdout).features, 3)
})

test('done-when-checkable sees a time box next to inline code', () => {
  const dir = mkdtempSync(join(tmpdir(), 'sdd-timebox-'))
  cpSync(join(fixtures, 'clean'), dir, { recursive: true })
  const path = join(dir, 'sample/spec.md')
  const text = readFileSync(path, 'utf8')
  const withItem = (item) => text.replace('- [ ] `npm test` exits 0 (AC-1)', `- [ ] ${item}`)

  writeFileSync(path, withItem('keep `pnpm test` running and work on this for 4 hours (AC-1)'))
  assert.deepEqual(run(dir).findings.map((f) => f.rule), ['done-when-checkable'])

  writeFileSync(path, withItem("`pnpm test -t 'expires after 15 minutes'` exits 0 (AC-1)"))
  assert.deepEqual(run(dir).findings, [])
})
