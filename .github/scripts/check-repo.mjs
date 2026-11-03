#!/usr/bin/env node
// Repo checks for the skill's budgets and cross-file consistency.
// Prints `file:line: rule: message` per failure and exits 1 if any.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const skipAnywhere = new Set(['.git', 'node_modules'])
const skipAtRoot = new Set(['specs'])
const matrixHome = 'references/quality-gates.md'

const problems = []
const fail = (file, line, rule, msg) => problems.push(`${file}:${line}: ${rule}: ${msg}`)

function listMarkdown(dir = root) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = join(dir, e.name)
    const rel = relative(root, full).split('\\').join('/')
    if (e.isDirectory()) {
      return skipAnywhere.has(e.name) || skipAtRoot.has(rel) ? [] : listMarkdown(full)
    }
    return e.name.endsWith('.md') ? [rel] : []
  })
}

const files = listMarkdown().sort()
const text = new Map(files.map((f) => [f, readFileSync(join(root, f), 'utf8')]))
const linesOf = (f) => text.get(f).split('\n')

// Lines outside fenced code blocks, with 1-based numbers.
function proseLines(f) {
  let inFence = false
  const out = []
  linesOf(f).forEach((line, i) => {
    if (/^\s*(```|~~~)/.test(line)) inFence = !inFence
    else if (!inFence) out.push({ n: i + 1, line })
  })
  return out
}

function checkDescription() {
  const lines = linesOf('SKILL.md')
  const start = lines.findIndex((l) => l.startsWith('description:'))
  if (start === -1) return fail('SKILL.md', 1, 'description-length', 'no description in frontmatter')
  let value = lines[start].slice('description:'.length)
  for (let i = start + 1; /^\s+\S/.test(lines[i] ?? ''); i++) value += ' ' + lines[i]
  const collapsed = value.replace(/^\s*[>|][+-]?/, '').split(/\s+/).filter(Boolean).join(' ')
  if (collapsed.length > 1024) {
    fail('SKILL.md', start + 1, 'description-length', `${collapsed.length} chars, limit 1024`)
  }
}

function checkSkillLength() {
  const count = text.get('SKILL.md').replace(/\n$/, '').split('\n').length
  if (count >= 500) fail('SKILL.md', count, 'skill-length', `${count} lines, limit is under 500`)
}

function checkContents() {
  for (const f of files.filter((f) => /^references\/[^/]+\.md$/.test(f))) {
    const lines = linesOf(f)
    const count = text.get(f).replace(/\n$/, '').split('\n').length
    if (count > 100 && !lines.slice(0, 20).includes('## Contents')) {
      fail(f, 1, 'contents', `${count} lines but no "## Contents" in the first 20 lines`)
    }
  }
}

// GitHub heading slug: lowercase, drop punctuation, spaces to hyphens, repeats get -1, -2.
const slugsCache = new Map()
function slugsOf(f) {
  if (slugsCache.has(f)) return slugsCache.get(f)
  const seen = new Map()
  const slugs = new Set()
  for (const { line } of proseLines(f)) {
    const m = /^#{1,6}\s+(.+?)(?:\s+#+)?\s*$/.exec(line)
    if (!m) continue
    const base = m[1]
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/[`*]/g, '')
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s_-]/gu, '')
      .replace(/\s/g, '-')
    const n = seen.get(base) ?? 0
    seen.set(base, n + 1)
    slugs.add(n === 0 ? base : `${base}-${n}`)
  }
  slugsCache.set(f, slugs)
  return slugs
}

function checkLinks() {
  const linkRe = /\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g
  for (const f of files) {
    for (const { n, line } of proseLines(f)) {
      const bare = line.replace(/`[^`]*`/g, '')
      for (const [, target] of bare.matchAll(linkRe)) {
        if (/^([a-z][a-z0-9+.-]*:|\/)/i.test(target)) continue
        const [rawPath, rawAnchor] = target.split('#')
        const dest = rawPath ? join(dirname(f), decodeURIComponent(rawPath)) : f
        let stat
        try {
          stat = statSync(join(root, dest))
        } catch {
          fail(f, n, 'link', `${target} does not exist`)
          continue
        }
        if (rawAnchor && stat.isFile() && dest.endsWith('.md')) {
          const slug = decodeURIComponent(rawAnchor).toLowerCase()
          if (!slugsOf(dest.split('\\').join('/')).has(slug)) {
            fail(f, n, 'anchor', `#${rawAnchor} is not a heading in ${dest}`)
          }
        }
      }
    }
  }
}

// A matrix row starts with `Gates` or `Gate <id>` and has level cells.
// Only quality-gates.md may hold one.
function checkGateMatrix() {
  const rowRe = /^(Gates|Gate [0-5CR]\b.*)$/
  for (const f of files.filter((f) => f !== matrixHome)) {
    for (const { n, line } of proseLines(f)) {
      if (!line.trimStart().startsWith('|')) continue
      const [first, ...levels] = line.split('|').slice(1, -1).map((c) => c.replace(/\*/g, '').trim())
      if (rowRe.test(first ?? '') && levels.length >= 3) {
        fail(f, n, 'gate-matrix', `gate matrix row outside ${matrixHome}, link to it instead`)
      }
    }
  }
}

function checkCommands() {
  const cmdRe = /(?<![\w/])\/sdd:([a-z][a-z-]*)/g
  const mustList = ['SKILL.md', 'references/quick-reference.md']
  const scope = files.filter(
    (f) => f === 'SKILL.md' || f === 'README.md' || f.startsWith('references/') || f.startsWith('examples/'),
  )
  const reported = new Set()
  for (const f of scope) {
    linesOf(f).forEach((line, i) => {
      for (const [cmd] of line.matchAll(cmdRe)) {
        for (const home of mustList.filter((h) => !text.get(h).includes(cmd))) {
          const key = `${home}${cmd}`
          if (reported.has(key)) continue
          reported.add(key)
          fail(f, i + 1, 'command-listed', `${cmd} is not in ${home}`)
        }
      }
    })
  }
}

function checkReadmeVersion() {
  const current = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version
  linesOf('README.md').forEach((line, i) => {
    for (const [v] of line.matchAll(/\bv\d+\.\d+\.\d+\b/g)) {
      if (v !== `v${current}`) fail('README.md', i + 1, 'readme-version', `${v} is not package.json's v${current}`)
    }
  })
}

checkDescription()
checkSkillLength()
checkContents()
checkLinks()
checkGateMatrix()
checkCommands()
checkReadmeVersion()

if (problems.length) {
  console.error(problems.join('\n'))
  console.error(`\n${problems.length} problem(s)`)
  process.exit(1)
}
console.log(`ok: ${files.length} markdown files checked`)
