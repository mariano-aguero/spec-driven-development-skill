---
name: spec-driven-development
description: >
  Use when starting features, projects, or refactors with AI coding agents and requirements feel
  informal, incomplete, or drift-prone. Triggers: AI generates code that ignores constraints,
  same prompt produces different implementations across sessions, team lacks shared technical
  understanding, complex features need traceable design decisions, or vibe-coding produces
  unreliable output. Keywords: spec-driven, SDD, specification-first, requirements.md, plan.md,
  tasks.md, constitution.md, design doc, PRD, acceptance criteria, MoSCoW, drift detection,
  AI planning, feature spec, context drift, hallucination, constrained generation.
---

# Spec-Driven Development

## Overview

SDD makes **specifications the source of truth** — code serves specs, not the other way around.
Instead of prompting an AI with vague descriptions and hoping for the right output, you define
precise specifications first, then let AI generate code strictly constrained by those specs.

Core principle: *"When specifications drive implementation, pivots become systematic
regenerations rather than manual rewrites."*

Why it works: without a spec, AI makes thousands of micro-decisions silently. With a spec,
those decisions are made by you — explicitly, before any code is written.

### Spec Levels

| Level | What it means | Best for |
|-------|--------------|---------|
| **Spec-first** | Write spec upfront, implement immediately | Most features |
| **Spec-anchored** | Maintain spec alongside code as it evolves | Long-lived features |
| **Spec-as-source** | Spec is primary; code is generated, never hand-edited | Experimental, high-compliance |

Start with spec-first. Move to spec-anchored when the feature stabilizes.

## When to Use

Symptoms that signal SDD is needed:
- AI ignores constraints or generates code that doesn't match requirements
- Same prompt produces different implementations across sessions
- Requirements are complex with multiple stakeholders or cross-cutting concerns
- Team needs shared technical understanding before writing code
- Previous "just build it" attempts produced wrong architecture
- Feature touches auth, data model, API contracts, or database schema

**Skip SDD for:**
- One-line fixes, typos, trivial bugs
- Disposable prototypes where requirements will immediately change
- Solo exploration spikes lasting less than a day

## Directory Structure

```
constitution.md              # Project-level: immutable principles (one per project)

specs/
  [feature-branch-name]/
    spec.md              # Requirements — WHAT and WHY (MoSCoW prioritized)
    plan.md              # Implementation strategy — HOW
    data-model.md        # Data entities, relationships, schemas
    contracts/           # API endpoints, events, interface definitions (LOCKED in Phase 5)
    tasks.md             # Atomic executable task list
    research.md          # Optional: context and alternatives considered
    decision_log.md      # Optional: rationale for key decisions
```

## Phase 0 — Constitution *(one-time per project)*

**Invoke:** `/sdd:init`

Creates `constitution.md` at the project root — a versioned document of immutable constraints
that applies to every feature. AI agents are strictly forbidden from violating it.

Contains:
- Coding standards and architecture principles
- Technology stack decisions (languages, frameworks, libraries)
- Security constraints (authentication model, input validation rules, CWE baseline)
- Naming conventions, file structure rules
- Explicit anti-patterns banned from this codebase

**When to update:** Only when a fundamental project decision changes. Not per-feature.

See `references/artifact-templates.md` for the `constitution.md` template.

---

## 5-Phase Workflow *(per feature)*

### Phase 1 — Specify

**Invoke:** `/sdd:specify [feature description]`

Creates `specs/[feature]/spec.md` containing:
- Feature overview (1–2 sentences, non-technical)
- User stories: `As a [role] I want [goal] so that [benefit]`
- Acceptance criteria (Given/When/Then) with MoSCoW priority: `[MUST]` / `[SHOULD]` / `[COULD]` / `[WONT]`
- Explicit out-of-scope boundaries
- Open questions marked `[NEEDS CLARIFICATION]`

**Clarify step** — before Gate 1, run the clarify prompts (see `references/prompt-patterns.md`):
- Resolve every `[NEEDS CLARIFICATION]` item
- Add ACs for all identified edge cases and error scenarios
- Run automated spec validation (vague terms, missing error coverage, untestable ACs)

**Human gate — review before Phase 2:**
- [ ] Every `[MUST]` AC is independently testable
- [ ] No implementation details in the spec (no "use PostgreSQL", no function names)
- [ ] No `[NEEDS CLARIFICATION]` items remain open
- [ ] Scope boundaries explicitly listed
- [ ] Error and edge case ACs exist (not just happy path)
- [ ] Spec passes automated validation (no vague terms like "fast", "secure", "works correctly")

See `references/artifact-templates.md` for the `spec.md` template.

---

### Phase 2 — Plan

**Invoke:** `/sdd:plan` (reads `spec.md` + `constitution.md`)

Creates in `specs/[feature]/`:
- `plan.md` — Technical architecture, component breakdown, technology choices, tradeoffs
- `data-model.md` — Entities, fields, relationships, constraints, indexes
- `contracts/` — API endpoint definitions, request/response schemas, error codes, events
- `research.md` — Optional: alternatives considered, rationale for technology choices

**Human gate — review before Phase 3:**
- [ ] Plan is traceable: every `[MUST]` AC maps to at least one component
- [ ] Plan respects all constraints in `constitution.md`
- [ ] Data model covers all entities mentioned in spec
- [ ] API contracts are complete (inputs, outputs, all error codes)
- [ ] No unnecessary abstractions (use framework features directly)
- [ ] Technology choices use existing stack unless justified

See `references/artifact-templates.md` for templates.

---

### Phase 3 — Tasks

**Invoke:** `/sdd:tasks` (reads `plan.md` + `contracts/`)

Creates `specs/[feature]/tasks.md`:
- Atomic tasks — each corresponds to a single PR or commit
- Explicit dependencies between tasks
- Parallelizable tasks marked `[P]`
- Each implementation task paired with a test task (test-first)
- Complexity estimate per task: `S` / `M` / `L`

**Human gate — review before Phase 4:**
- [ ] Tasks are small enough for a single AI session (~30–60 min of work)
- [ ] Test tasks appear before their implementation counterparts
- [ ] No task modifies more than 3 files (split if so)
- [ ] Dependencies form a valid DAG (no cycles)

See `references/artifact-templates.md` for the `tasks.md` template.

---

### Phase 4 — Implement

Execute tasks from `tasks.md` sequentially (or in parallel where marked `[P]`).

**AI prompt pattern for each task:**

```
Implement: [task title from tasks.md]

Constrained by:
- constitution.md (project-level rules — never violate)
- Acceptance criteria: specs/[feature]/spec.md → [section]
- Technical design: specs/[feature]/plan.md → [section]
- API contract: specs/[feature]/contracts/[file].md
- Data model: specs/[feature]/data-model.md

Do NOT:
- Add functionality outside the scope of spec.md
- Deviate from the API signatures in contracts/
- Introduce abstractions not in plan.md
- Violate any rule in constitution.md
```

**Session hygiene:**
- Clear context between tasks to prevent conflicting information accumulation
- Commit after completing each task before starting the next
- If the AI deviates from the contract, correct immediately — do not accumulate drift

See `references/prompt-patterns.md` for full prompt examples.

---

### Phase 5 — Validate

**Invoke:** `/sdd:validate` (compares implementation to `spec.md` + `contracts/`)

Checks for spec drift:
- Do all `[MUST]` acceptance criteria have test coverage?
- Do implemented API signatures match `contracts/`?
- Does the database schema match `data-model.md`?
- Are there any fields, endpoints, or behaviors outside the defined scope?
- Does the implementation respect all constraints in `constitution.md`?

**Drift indicators (immediate action required):**
- Function signatures that differ from `contracts/`
- Database columns not in `data-model.md`
- Acceptance criteria with no corresponding test
- Functionality that appears in code but not in `spec.md`
- Constitution constraint violated

See `references/quality-gates.md` for CI/CD integration patterns.

---

## Spec Drift: Why It Happens and How to Prevent It

Drift occurs when AI makes "reasonable assumptions" that weren't specified. Without a spec,
AI makes thousands of micro-decisions silently — each one a potential divergence from intent.

Prevention:
1. **Constitution first** — project-level constraints prevent drift at the root
2. **Clarify before planning** — unresolved ambiguities in spec.md become wrong architecture
3. **Specificity beats verbosity** — "returns 404 when resource not found" beats 3 paragraphs
4. **Lock contracts before implementation** — never modify `contracts/` during Phase 4
5. **One context per task** — a fresh AI session per task eliminates accumulated assumptions
6. **Commit gates** — only proceed to next task after current task passes tests

See `references/anti-patterns.md` for detailed failure modes.

---

## Reference Index

| Need | File |
|------|------|
| Templates for all artifacts (incl. constitution.md) | `references/artifact-templates.md` |
| Prompts for each phase interaction | `references/prompt-patterns.md` |
| Detailed phase-by-phase instructions | `references/workflow-phases.md` |
| Review checklists and CI/CD integration | `references/quality-gates.md` |
| Multi-agent orchestration patterns | `references/ai-agent-patterns.md` |
| Common failure modes and fixes | `references/anti-patterns.md` |
| One-page cheat sheet | `references/quick-reference.md` |
| Topic navigation | `references/INDEX.md` |
