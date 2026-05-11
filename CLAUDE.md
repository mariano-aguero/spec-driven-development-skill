# Spec-Driven Development Skill — Architecture

Documentation-only Agent Skill. No runtime dependencies, no build step.
Install: `npx skills add mariano-aguero/spec-driven-development-skill`

## File Structure

```
spec-driven-development-skill/
├── SKILL.md                           # Entry point — workflow overview, phase descriptions
├── CLAUDE.md                          # This file — architecture and maintenance guide
├── README.md                          # User-facing documentation
├── package.json                       # npm metadata for skills.sh discovery
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
| `SKILL.md` | Workflow overview, phase summaries, artifact structure | Core workflow changes |
| `artifact-templates.md` | spec.md, plan.md, data-model.md, contracts/, tasks.md templates | Template format evolves |
| `prompt-patterns.md` | Prompts for each phase + multi-agent review | Better prompts discovered |
| `workflow-phases.md` | Detailed step-by-step for each phase | Phase details change |
| `quality-gates.md` | Review checklists, CI/CD scripts, drift classification | New quality checks needed |
| `ai-agent-patterns.md` | Context management, subagent patterns, parallel tasks | New AI agent patterns emerge |
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

## Design Decisions

**Why separate files instead of one large SKILL.md?**
The references are loaded on demand. Keeping them separate avoids loading 3000+ tokens
of reference material into every conversation — only the relevant section is loaded when needed.

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
