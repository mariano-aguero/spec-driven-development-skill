# Spec-Driven Development Skill — Architecture

Documentation-only Agent Skill. No runtime dependencies, no build step.
Install: `npx skills add mariano-aguero/spec-driven-development-skill`

## File Structure

```
spec-driven-development-skill/
├── SKILL.md                           # Entry point — workflow overview, phase descriptions
├── CLAUDE.md                          # This file — architecture and maintenance guide
├── README.md                          # User-facing documentation
├── CHANGELOG.md                       # Keep-a-Changelog release history
├── package.json                       # npm metadata for skills.sh discovery
├── evals/                             # Behavioral scenarios (≥3 required before release)
├── examples/                          # Worked end-to-end example (magic-link login)
└── references/
    ├── INDEX.md                       # Topic navigation map
    ├── quick-reference.md             # One-page cheat sheet
    ├── artifact-templates.md          # Copy-paste templates for all artifacts
    ├── prompt-patterns.md             # Prompts for every phase and scenario
    ├── workflow-phases.md             # Step-by-step phase instructions
    ├── quality-gates.md               # Per-phase checklists, CI/CD integration
    ├── ai-agent-patterns.md           # Multi-agent patterns, context management
    └── anti-patterns.md               # Failure modes and fixes
```

## Reference File Responsibilities

| File | Contents | Update When |
|------|---------|-------------|
| `SKILL.md` | Workflow overview, phase summaries, artifact structure, context model, comprehension debt | Core workflow changes |
| `artifact-templates.md` | research.md, spec.md, plan.md, data-model.md, contracts/, tasks.md, progress.md templates | Template format evolves |
| `prompt-patterns.md` | Prompts for each phase + research, handover, walkthrough, multi-agent review | Better prompts discovered |
| `workflow-phases.md` | Detailed step-by-step for each phase (0, 0.5, 1–5) | Phase details change |
| `quality-gates.md` | Review checklists (Gate 0, R, 1–5, C), CI/CD scripts, drift classification | New quality checks needed |
| `output-formats.md` | Formats and line budgets for everything the user reads | A command gains user-facing output |
| `enforcement.md` | Hooks, contract locks, worktrees, `AGENTS.md` bridge | A rule becomes mechanically enforceable |
| `ai-agent-patterns.md` | Context engineering, subagent patterns, parallel tasks | New AI agent patterns emerge |
| `anti-patterns.md` | Failure modes with examples and fixes | New failure patterns identified |
| `quick-reference.md` | Summary tables and cheat sheet | Any structural changes |
| `INDEX.md` | Navigation links to all topics | New sections added to any file |

## Maintenance Workflow

### Adding a new phase check

1. Add the check to the relevant gate in `references/quality-gates.md`
2. Add corresponding verification to `references/workflow-phases.md` in the relevant phase
3. Update the gate summary in `references/quick-reference.md`
4. Update `SKILL.md` if the change affects the phase overview

### Adding a new anti-pattern

1. Add to `references/anti-patterns.md` with: symptom, example (wrong vs correct), fix
2. Add to the relevant gate in `references/quality-gates.md` if it's checkable
3. Update `references/INDEX.md` with a link to the new anti-pattern

### Adding a new prompt

1. Add to `references/prompt-patterns.md` under the relevant phase section
2. Reference it in `references/workflow-phases.md` in the corresponding step

### Updating templates

1. Update `references/artifact-templates.md`
2. Verify `references/workflow-phases.md` steps still match the new template
3. Update examples in `references/anti-patterns.md` if they reference template fields

### Changing the workflow structure

1. Update `SKILL.md` — the canonical workflow description
2. Update `references/workflow-phases.md` — step-by-step details
3. Update `references/quick-reference.md` — the summary tables
4. Update `references/INDEX.md` if section names change
5. Bump version in `package.json`

## Budgets (enforced on every release)

These come from Anthropic's skill-authoring spec. Check them before tagging a version.

| Item | Limit | Why |
|------|-------|-----|
| `description` (frontmatter) | ≤1024 chars, target ~120 tokens | Loaded in **every** conversation whether the skill fires or not |
| `SKILL.md` body | <500 lines, target <4000 tokens | Loaded in full whenever the skill activates |
| Reference file with >100 lines | Must open with a `## Contents` section | Agents preview files with partial reads; without a TOC they cannot see what they missed |
| Reference depth | Every file reachable in one hop from `SKILL.md` | Chained references cause partial reads and incomplete information |
| Evals | ≥3 scenarios in `evals/` | Lint proves the files are well-formed, not that the skill works |

Measure before releasing:

```bash
# description and body size
python3 -c "import re;s=open('SKILL.md').read();d=' '.join(re.search(r'description:\s*>?\s*\n?(.*?)(?=\n[a-z_-]+:|\Z)',s.split('---')[1],re.S).group(1).split());print(f'description {len(d)} chars ~{len(d)//4} tok')"
wc -l SKILL.md

# every reference file must have a TOC
for f in references/*.md; do head -20 "$f" | grep -q "^## Contents" || echo "MISSING TOC: $f"; done
```

Reference files may cross-link for convenience, but no piece of information may *require*
following a chain — anything a phase needs is reachable directly from `SKILL.md`.

## Design Decisions

**Why separate files instead of one large SKILL.md?**
The references are loaded on demand. Keeping them separate avoids loading reference material
into every conversation — only the relevant section is loaded when needed. The entry point
has its own budget (above) precisely because this optimization is easy to undo by letting
`SKILL.md` grow.

**Why a dedicated `output-formats.md`?**
Every other reference file defines what to write to a *file*, consumed by the next phase.
`output-formats.md` defines what to show the *human*. Conflating the two is how spec-driven
workflows earn a reputation for ceremony: the user drowns in artifacts that were never
written for them.

**Why no runtime components?**
This skill is documentation only. The workflows it describes run inside the AI agent's
reasoning, not as external scripts. CI/CD scripts in quality-gates.md are provided as
templates for teams to adapt, not as packaged tooling.

**Why copy-paste templates instead of a CLI generator?**
Keeping templates as plain markdown means they work in any environment (Claude Code,
Cursor, web interfaces) without any installation or dependency management.

## Version Policy

- **Patch** (1.0.x): Typo fixes, clarifications that don't change behavior
- **Minor** (1.x.0): New reference files, new templates, new prompts, new anti-patterns
- **Major** (x.0.0): Phase workflow changes, artifact format changes, naming convention changes
