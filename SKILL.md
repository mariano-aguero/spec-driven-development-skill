---
name: spec-driven-development
description: >
  Use when starting features, projects, or refactors with AI coding agents and requirements feel
  informal, incomplete, or drift-prone. Triggers: AI generates code that ignores constraints,
  same prompt produces different implementations across sessions, team lacks shared technical
  understanding, complex features need traceable design decisions, or vibe-coding produces
  unreliable output. Keywords: spec-driven, SDD, specification-first, requirements.md, plan.md,
  tasks.md, constitution.md, design doc, PRD, acceptance criteria, MoSCoW, drift detection,
  AI planning, feature spec, context drift, hallucination, constrained generation,
  boundaries, risks-identification, assumption-surface, living-document.
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

## Quick Start

New to SDD? Four steps to your first spec-driven feature:

1. **Create your constitution** (once per project):
   `/sdd:init` — run this first, before any feature specs

2. **Surface AI assumptions** (before specifying):
   Ask the AI to list its implicit assumptions about roles, permissions, error behavior,
   and scope — then correct them before any AC is written

3. **Specify your first feature:**
   `/sdd:specify [brief description]` — generates `spec.md` with MoSCoW-prioritized ACs

4. **Follow the gates:**
   Clarify → Plan → Tasks → Implement → Validate
   Human approval required at each gate before the next phase

For detailed step-by-step instructions, see `references/workflow-phases.md`.

---

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

## Key Practice: Reframe Vague Requirements

Before writing any AC, convert vague requirements into measurable targets:

| Vague | Concrete |
|-------|---------|
| "make it faster" | "LCP < 2.5s on a 4G connection" |
| "it should be secure" | "requires authenticated session; all inputs validated before processing" |
| "handle errors properly" | "returns 4xx with structured error code, never exposes stack traces" |
| "should scale" | "handles 1000 concurrent users at < 500ms p95" |
| "works correctly" | "Given X, When Y, Then Z — independently verifiable" |

If you cannot write a passing test for an AC, the AC is not concrete enough.

---

## Directory Structure

```
constitution.md              # Project-level: immutable principles (one per project)

specs/
  [feature-branch-name]/
    spec.md              # Requirements — WHAT and WHY (MoSCoW prioritized)
    plan.md              # Implementation strategy — HOW
    data-model.md        # Data entities, relationships, schemas
    contracts/           # API endpoints, events, interface definitions (LOCKED after Phase 2 approval)
    tasks.md             # Atomic executable task list
    research.md          # Optional: context and alternatives considered
    decision_log.md      # Optional: rationale for key decisions
  archive/               # Completed feature specs (move here after feature ships)
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

**Surface assumptions first** — before generating spec.md, run the Assumptions Surface
Prompt (see `references/prompt-patterns.md`). This forces the AI to make its implicit
assumptions about roles, permissions, error behavior, and scope explicit for human review
*before* they get baked into acceptance criteria.

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
- `plan.md` — Technical architecture, component breakdown, technology choices, tradeoffs, risks
- `data-model.md` — Entities, fields, relationships, constraints, indexes
- `contracts/` — API endpoint definitions, request/response schemas, error codes, events

*If a `research.md` exists (pre-generated via parallel subagents before Phase 1), `/sdd:plan`
reads it as additional context. It is not generated by this command.*

**Human gate — review before Phase 3:**
- [ ] Plan is traceable: every `[MUST]` AC maps to at least one component
- [ ] Plan respects all constraints in `constitution.md`
- [ ] Data model covers all entities mentioned in spec
- [ ] API contracts are complete (inputs, outputs, all error codes)
- [ ] Migrations defined for any database schema changes (in `data-model.md`)
- [ ] Risks identified with mitigations for each High-impact item
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

**AI prompt pattern for each task** *(abbreviated — see `references/prompt-patterns.md` for Format A
with file access and Format B for stateless/web interfaces)*:

```
Implement: [task title from tasks.md]

Constrained by:
- constitution.md (project-level rules — never violate)
- Acceptance criteria: specs/[feature]/spec.md → [section]
- Feature boundaries: specs/[feature]/spec.md → Boundaries (if present)
- Technical design: specs/[feature]/plan.md → [section]
- API contract: specs/[feature]/contracts/[file].md
- Data model: specs/[feature]/data-model.md

Do NOT:
- Add functionality outside the scope of spec.md
- Deviate from the API signatures in contracts/
- Introduce abstractions not in plan.md
- Violate any rule in constitution.md or the Boundaries section
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
- Boundaries rule violated (Always do / Never do from spec.md)

See `references/quality-gates.md` for CI/CD integration patterns.

---

## Spec Drift: Why It Happens and How to Prevent It

Drift occurs when AI makes "reasonable assumptions" that weren't specified. Without a spec,
AI makes thousands of micro-decisions silently — each one a potential divergence from intent.

Prevention:
1. **Constitution first** — project-level constraints prevent drift at the root
2. **Surface assumptions before specifying** — wrong assumptions become wrong ACs become wrong code
3. **Clarify before planning** — unresolved ambiguities in spec.md become wrong architecture
4. **Specificity beats verbosity** — "returns 404 when resource not found" beats 3 paragraphs
5. **Lock contracts before implementation** — never modify `contracts/` during Phase 4
6. **One context per task** — a fresh AI session per task eliminates accumulated assumptions
7. **Commit gates** — only proceed to next task after current task passes tests

See `references/anti-patterns.md` for detailed failure modes.

---

## Living Document

Specs are not write-once artifacts. Keep them current:

- **When decisions change:** run `/sdd:amend` — never patch files manually
- **Commit specs with code:** include spec files in the same PR as the implementation they drive
- **Reference in PRs:** link to `specs/[feature]/spec.md` in your pull request description
- **Version your specs:** each spec.md carries a `Status` and `Version` header for auditability
- **Archive when done:** move completed specs to `specs/archive/` after the feature ships

Treating the spec as disposable after implementation defeats its purpose — it becomes
the source of truth for future changes, onboarding, and drift detection.

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
