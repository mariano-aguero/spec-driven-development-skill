# Spec-Driven Development Skill

[![skills.sh](https://img.shields.io/badge/skills.sh-spec--driven--development-blue?logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0xMiAyQzYuNDggMiAyIDYuNDggMiAxMnM0LjQ4IDEwIDEwIDEwIDEwLTQuNDggMTAtMTBTMTcuNTIgMiAxMiAyem0tMiAxNWwtNS01IDEuNDEtMS40MUwxMCAxNC4xN2w3LjU5LTcuNTlMMTkgOGwtOSA5eiIvPjwvc3ZnPg==)](https://skills.sh)
[![npm](https://img.shields.io/badge/npx_skills_add-mariano--aguero%2Fspec--driven--development--skill-brightgreen)](https://github.com/mariano-aguero/spec-driven-development-skill)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-1.3.1-orange)](https://github.com/mariano-aguero/spec-driven-development-skill/releases)
[![Claude Code](https://img.shields.io/badge/Claude_Code-compatible-purple)](https://claude.ai/code)
[![Cursor](https://img.shields.io/badge/Cursor-compatible-purple)](https://cursor.sh)
[![GitHub Copilot](https://img.shields.io/badge/GitHub_Copilot-compatible-purple)](https://github.com/features/copilot)

An **Agent Skill** for structured, specification-first development with AI coding agents.
Compatible with Claude Code, Cursor, GitHub Copilot, JetBrains Junie, Windsurf, and similar tools.

## What is Spec-Driven Development?

SDD makes specifications the source of truth. Instead of prompting an AI with vague
descriptions and hoping for the right output, you:

1. **Specify** what to build (requirements, acceptance criteria)
2. **Plan** how to build it (architecture, data model, API contracts)
3. **Break down** work into atomic, dependency-mapped tasks
4. **Implement** with AI constrained by the spec
5. **Validate** that the implementation satisfies the spec

The result: predictable output, traceable decisions, and resilience to pivot requests.

## Installation

```bash
npx skills add mariano-aguero/spec-driven-development-skill
```

The skill activates automatically when you reference spec-driven development, spec authoring,
SDD, requirements planning, or AI implementation guidance.

## Workflow at a Glance

```
/sdd:specify "add user authentication"
  → creates specs/user-auth/spec.md

/sdd:plan
  → creates specs/user-auth/plan.md
  → creates specs/user-auth/data-model.md
  → creates specs/user-auth/contracts/auth-api.md

/sdd:tasks
  → creates specs/user-auth/tasks.md (ordered, with dependencies)

[implement each task with fresh AI context, commit after each]

/sdd:validate
  → produces traceability matrix and drift report
```

## What's Included

| File | Contents |
|------|---------|
| `SKILL.md` | Entry point: workflow, phase descriptions, reference index |
| `references/artifact-templates.md` | Copy-paste templates for all 5 artifact types |
| `references/prompt-patterns.md` | Prompts for every phase and scenario |
| `references/workflow-phases.md` | Step-by-step instructions for each phase |
| `references/quality-gates.md` | Per-phase checklists and CI/CD integration |
| `references/ai-agent-patterns.md` | Multi-agent orchestration, context management |
| `references/anti-patterns.md` | 14 common failure modes with fixes |
| `references/quick-reference.md` | One-page cheat sheet |

## When to Use SDD

**Use it when:**
- AI generates code that ignores your constraints
- Requirements are complex with multiple stakeholders
- The same prompt produces different implementations across sessions
- Your feature touches auth, database schema, or public APIs
- Your team needs shared technical understanding before writing code

**Skip it for:**
- Bug fixes under 30 minutes
- Refactors with no behavior change
- Throwaway prototypes

## Key Principles

**Specifications are not suggestions.** API contracts define the exact shape. Code that
deviates from the contract is drift — fix the code, not the spec.

**Surface assumptions before specifying.** Ask the AI to list its implicit assumptions
about roles, permissions, error behavior, and scope *before* writing the spec. Correcting
a wrong assumption takes seconds; correcting a wrong AC takes a full `/sdd:amend` cycle.

**Reframe vague requirements.** "Make it faster" is not a spec. "LCP < 2.5s on a 4G
connection" is. Every AC must be independently testable — if you cannot write a failing
test for it, it is not concrete enough.

**Fresh context per task.** Each task gets its own AI session. Accumulated context from
prior sessions introduces wrong assumptions.

**Commit after each task.** Not at the end of Phase 4. After each individual task.
Clean history enables precise rollback when drift is discovered.

**Commit specs with code.** Spec files belong in the same PR as the implementation they
drive. Treat them as first-class source artifacts, not throwaway documents.

**Human gates are non-negotiable.** spec.md, plan.md, and tasks.md each require human
approval before the next phase begins. AI cannot approve its own output.

## Version History

- v1.3.1 — Boundaries moved before ACs in spec.md template, Risks Critic added to Phase 2, Boundaries included in per-task context, /sdd:amend referenced in Spec Regeneration Pattern, research.md clarified as pre-existing input (not output of /sdd:plan), keywords expanded
- v1.3.0 — Assumptions Surface Prompt (pre-Phase 1), Boundaries section in spec.md template, Risks section in plan.md template, Key Practice + Living Document sections in SKILL.md, "Surface assumptions" hard rule in quick-reference
- v1.2.2 — `/sdd:amend` prompt (2-step cascade update), constitution.md in Drift Detection, Constitution Critic for Phase 2, contracts/ LOCKED label fixes, CLARIFY output artifact in diagram, Spec Reference in data-model template
- v1.2.1 — contracts/ LOCKED phase label fix, critic agent output format standardized in ai-agent-patterns.md, Gate 0 wording, Gate 1 summary, Clarify→Gate 1 references in workflow-phases.md, Gate 2 migrations check, `[WONT]` AC example
- v1.2.0 — Post-Clarify spec update prompt, Migrations section in data-model template, constitution `[PENDING]` blocking check for feature specs, standardized critic agent output format, Anti-Pattern 13 (Over-Specified Specs), Quick Start onboarding section
- v1.1.0 — Constitution phase, MoSCoW priorities, Clarify step, spec levels taxonomy, research subagents, spec recovery point, `/sdd:analyze` command, 12 anti-patterns
- v1.0.0 — Initial release: 5-phase workflow, 8 reference files, templates and prompts

## License

MIT
