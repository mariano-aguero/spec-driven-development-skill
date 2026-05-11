# Spec-Driven Development Skill

[![skills.sh](https://img.shields.io/badge/skills.sh-spec--driven--development-blue?logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0xMiAyQzYuNDggMiAyIDYuNDggMiAxMnM0LjQ4IDEwIDEwIDEwIDEwLTQuNDggMTAtMTBTMTcuNTIgMiAxMiAyem0tMiAxNWwtNS01IDEuNDEtMS40MUwxMCAxNC4xN2w3LjU5LTcuNTlMMTkgOGwtOSA5eiIvPjwvc3ZnPg==)](https://skills.sh)
[![npm](https://img.shields.io/badge/npx_skills_add-mariano--aguero%2Fspec--driven--development--skill-brightgreen)](https://github.com/mariano-aguero/spec-driven-development-skill)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Latest release](https://img.shields.io/github/v/release/mariano-aguero/spec-driven-development-skill?label=release&color=orange)](https://github.com/mariano-aguero/spec-driven-development-skill/releases/latest)
[![Last commit](https://img.shields.io/github/last-commit/mariano-aguero/spec-driven-development-skill?color=informational)](https://github.com/mariano-aguero/spec-driven-development-skill/commits/main)
[![GitHub stars](https://img.shields.io/github/stars/mariano-aguero/spec-driven-development-skill?style=social)](https://github.com/mariano-aguero/spec-driven-development-skill/stargazers)

[![Claude Code](https://img.shields.io/badge/Claude_Code-compatible-purple)](https://claude.ai/code)
[![Cursor](https://img.shields.io/badge/Cursor-compatible-purple)](https://cursor.sh)
[![GitHub Copilot](https://img.shields.io/badge/GitHub_Copilot-compatible-purple)](https://github.com/features/copilot)
[![JetBrains Junie](https://img.shields.io/badge/JetBrains_Junie-compatible-purple)](https://www.jetbrains.com/junie/)
[![Windsurf](https://img.shields.io/badge/Windsurf-compatible-purple)](https://codeium.com/windsurf)

> **Stop vibe-coding. Specify, then implement.**
> An **Agent Skill** that turns informal prompts into structured, traceable, drift-resistant
> specifications — so AI coding agents build what you actually asked for.

Compatible with Claude Code, Cursor, GitHub Copilot, JetBrains Junie, Windsurf, and similar tools.

---

## Why Spec-Driven Development?

Without a spec, AI agents make thousands of micro-decisions silently. Each one is a
potential divergence from intent — and they compound.

| Without SDD | With SDD |
|---|---|
| "Add user auth" → AI picks a stack, invents schema, guesses error behavior | Constitution + spec + contracts define every decision upfront |
| Same prompt, three sessions, three different implementations | Specs are the source of truth — regeneration is deterministic |
| Drift discovered in code review (or production) | Drift detected in Phase 5 against the locked contracts |
| Pivots = manual rewrites | Pivots = systematic re-specification |
| Implicit assumptions baked into acceptance criteria | Assumptions surfaced and corrected *before* the spec is written |

## What is Spec-Driven Development?

SDD makes **specifications the source of truth**. The workflow:

0. **Constitution** — project-level immutable constraints (one-time per project)
1. **Specify** — requirements, MoSCoW acceptance criteria, boundaries
2. **Plan** — architecture, data model, locked API contracts
3. **Tasks** — atomic, dependency-mapped, test-first
4. **Implement** — AI runs with fresh context per task, constrained by all artifacts above
5. **Validate** — drift detection + traceability matrix

```mermaid
flowchart LR
    P0["Phase 0<br/><b>/sdd:init</b><br/>constitution.md"]:::once --> P1
    P1["Phase 1<br/><b>/sdd:specify</b><br/>spec.md"] --> CL["Clarify<br/>resolve [NEEDS CLARIFICATION]"]
    CL --> G1{Gate 1}
    G1 -->|approved| P2["Phase 2<br/><b>/sdd:plan</b><br/>plan + data-model + contracts"]
    P2 --> G2{Gate 2}
    G2 -->|approved & contracts LOCKED| P3["Phase 3<br/><b>/sdd:tasks</b><br/>tasks.md"]
    P3 --> G3{Gate 3}
    G3 -->|approved| P4["Phase 4<br/>Implement<br/>fresh context per task"]
    P4 --> P5["Phase 5<br/><b>/sdd:validate</b><br/>drift detection"]

    classDef once fill:#f0e6ff,stroke:#7c3aed,stroke-width:2px
```

## Installation

```bash
npx skills add mariano-aguero/spec-driven-development-skill
```

The skill activates automatically when you reference spec-driven development, spec authoring,
SDD, requirements planning, or AI implementation guidance.

## Workflow at a Glance

```text
/sdd:init                                 # once per project
  → creates constitution.md

/sdd:specify "add user authentication"
  → creates specs/user-auth/spec.md       (MoSCoW ACs + Boundaries + open questions)

/sdd:clarify
  → resolves [NEEDS CLARIFICATION] before Plan

/sdd:plan
  → specs/user-auth/plan.md               (architecture, risks)
  → specs/user-auth/data-model.md         (entities + migrations)
  → specs/user-auth/contracts/auth-api.md (LOCKED after Gate 2 approval)

/sdd:tasks
  → specs/user-auth/tasks.md              (ordered, test-first, [P] for parallel)

# implement each task with fresh AI context; commit after each

/sdd:validate
  → traceability matrix + drift report
```

Other commands: `/sdd:analyze` (cross-feature conflict check), `/sdd:amend` (cascade spec updates).

## What's Included

| File | Contents |
|------|---------|
| `SKILL.md` | Entry point: 6-phase workflow, spec levels, reference index |
| `references/artifact-templates.md` | Templates for `constitution.md`, `spec.md`, `plan.md`, `data-model.md`, `contracts/`, `tasks.md`, `research.md`, `decision_log.md` |
| `references/prompt-patterns.md` | Prompts for every phase + Assumptions Surface, Clarify, Critics, `/sdd:analyze`, `/sdd:amend`, Constitution-from-Codebase |
| `references/workflow-phases.md` | Step-by-step instructions for Phases 0–5 |
| `references/quality-gates.md` | Gate 0–5 checklists + CI/CD integration (AC coverage, drift detection) |
| `references/ai-agent-patterns.md` | Multi-agent orchestration, context management, critic subagents, capability profiles |
| `references/anti-patterns.md` | 16 common failure modes with wrong/correct examples and fixes |
| `references/quick-reference.md` | One-page cheat sheet |
| `references/INDEX.md` | Topic navigation across all references |

## Complete Example

See [`examples/`](examples/) for a full end-to-end demonstration of every SDD artifact:
a magic-link login feature with `constitution.md`, `spec.md`, `plan.md`, `data-model.md`,
locked `contracts/`, and a dependency-mapped `tasks.md`. Use it as a reference or as a
starter you can clone into a new project.

## When to Use SDD

**Use it when:**

- AI generates code that ignores your constraints
- The same prompt produces different implementations across sessions
- Requirements are complex or have multiple stakeholders
- The feature touches auth, database schema, or public APIs
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

**Human gates are non-negotiable.** `spec.md`, `plan.md`, and `tasks.md` each require human
approval before the next phase begins. AI cannot approve its own output.

## AI Tool Compatibility

| Tool | Status | Notes |
|------|--------|-------|
| Claude Code | ✅ Native | Skill loaded via `skills.sh`; Format A prompts (filesystem access) |
| Cursor | ✅ Supported | Reference files loaded via `@` mentions |
| GitHub Copilot Chat | ✅ Supported | Format B prompts (stateless) for web/chat interfaces |
| JetBrains Junie | ✅ Supported | Reference files loaded as context |
| Windsurf | ✅ Supported | Skill activates on SDD keyword triggers |
| Any LLM (ChatGPT, Gemini, etc.) | ✅ Manual | Copy reference files into context; use Format B prompts |

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a full history of changes per version.

Latest: **v1.4.0** — AP-15, AP-16, Constitution from Existing Codebase, Cross-Feature Conflict Detector.
See the [latest release](https://github.com/mariano-aguero/spec-driven-development-skill/releases/latest) for full notes.

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](.github/CONTRIBUTING.md) for guidelines on
adding anti-patterns, prompts, templates, and workflow improvements.

Please follow our [Code of Conduct](.github/CODE_OF_CONDUCT.md).

## License

[MIT](LICENSE)
