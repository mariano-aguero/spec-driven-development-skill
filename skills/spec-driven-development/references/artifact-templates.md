# Artifact Templates

Copy-paste templates for each SDD artifact. Remove placeholder comments before committing.

## Contents

- Status Lifecycle: the `Status:` header of `spec.md`
- `constitution.md` (Phase 0)
- `research.md`, with the evidence ladder (Phase 0.5)
- Writing concrete acceptance criteria, Proof lines, optional EARS
- `spec.md`, with Handoff rules (Phase 1)
- `spec.md` delta mode for brownfield changes
- `plan.md`, `data-model.md`, `contracts/[endpoint].md` (Phase 2)
- `tasks.md`, with graph rules (Phase 3)
- `progress.md` and `decision_log.md` (optional)
- `specs/_current/<capability>.md` (Phase 5.6)

`validation.md` and everything the user reads are in `output-formats.md`.

---

## Status Lifecycle

This table is the only definition of the `Status:` header in `spec.md`, delta specs included.
Each gate sets the next status when it passes.

| Status | Set when | What it allows |
|--------|----------|----------------|
| `Draft` | `spec.md` is created | Editing spec and `contracts/` freely |
| `Approved` | Gate 1 passes | Planning starts. `contracts/` still editable while Phase 2 writes them |
| `Planned` | Gate 2 passes | Tasks start. `contracts/` locked, changes go through `/sdd-change` |
| `In Progress` | The first task starts | Implementation. Lock stays on |
| `Validated` | Gate 5 passes and the human has audited it and read the walkthrough | Merge. Lock stays on |
| `Archived` | The spec moves to `specs/archive/` | Read-only history |

`research.md` keeps its own `Draft` / `Approved` (Gate R) outside this lifecycle.

---

## constitution.md Template

Created once per project at the root. Applies to every feature.

```markdown
# Project Constitution

Version: 1.0.0
Last updated: [date]

## Architecture Principles
- [e.g., "Server Components by default"]

## Technology Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Language | TypeScript 5.x | Strict mode, no `any` |
| Database | PostgreSQL + Drizzle | No direct SQL in route handlers |
| Testing | Vitest + Playwright | |

## Security Constraints
<!-- Apply to all generated code. -->
- Authentication: every endpoint requires a valid session unless marked `[PUBLIC]`
- Input validation: external inputs validated with Zod at the route boundary
- SQL: parameterized queries only, never concatenated user input
- Secrets: never log tokens, passwords, or PII; never hardcode secrets
- CORS: allow-list only, no wildcard origins in production
- Rate limiting: every public endpoint declares a limit in its contract

## Naming Conventions
- Files: kebab-case · Variables and functions: camelCase · Types: PascalCase
- DB columns: snake_case · Env vars: SCREAMING_SNAKE_CASE

## Banned Patterns
- No `any` type
- No `console.log` in production code (use the logger)
- No [project-specific banned pattern]

## File Structure Rules
- [e.g., "business logic in `src/lib/`, schema and migrations in `src/db/`"]

## Open Questions / Deferred Decisions
- [PENDING] [Decision]: [context and options]
```

---

## research.md Template

Phase 0.5 artifact, written before `spec.md` when the feature touches unfamiliar, large or
ambiguous code. It describes how the system works today. It holds no acceptance criteria, no
user stories, and no proposed design: those belong to Phases 1 and 2. Target ~200 lines. Every
claim carries a `file:line` citation and an evidence level.

Evidence ladder (defined here once, also used by the reconcile report):

| Level | Meaning |
|-------|---------|
| L1 | Stated: someone said it, nothing checked |
| L2 | Cited: the line was read |
| L3 | Showed the bad case cannot happen (grep, type, or code path) |
| L4 | Ran it and observed the result |
| L5 | Reproduced in the running app |

The finding a change's safety depends on must reach L4, or say `unproven`.

```markdown
# Research: [Feature Name]

Status: Draft
Date: [YYYY-MM-DD]

## Problem Summary
<!-- 2 to 4 sentences: what we are about to change and why the existing code matters to it.
     No solution, no requirements. -->

## Relevant Files
<!-- A missed file becomes a wrong plan. Completeness over depth. -->
| File | Role in this feature | Key entry point |
|------|---------------------|-----------------|
| `src/[path].ts` | [responsibility] | `functionName()` at `src/[path].ts:42` |

## Information Flow
1. [Entry point] receives [input] (`src/[path].ts:12`)
2. [Component] validates and transforms it into [shape] (`src/[path].ts:45`)
3. [Component] persists to [table/service] (`src/[path].ts:88`)

**Where this feature intervenes:** [step numbers above]

## Key Findings

### F-1: [Short factual title]
[What is true about the codebase, stated as fact.] (`src/[path].ts:60-74`)
**Evidence:** L2, or L4 [what was run], or `unproven`
**Consequence for this feature:** [what this constrains or enables]

## Existing Constraints Discovered
<!-- Rules the code already enforces. They become spec inputs. -->
- [e.g., "All repository methods take a transaction handle first" (`src/db/base.ts:18`)]

## Prior Art in This Codebase
- [Feature X solves a near-identical problem] (`src/features/x/`)

## Open Questions for the Spec
<!-- What the code could not answer. Each goes to Phase 1 as [NEEDS CLARIFICATION]. -->
- [e.g., "Should expired invites be reusable?"]

## Not Investigated
<!-- Explicit limits of this research, so nobody assumes it is complete. -->
- [Area left unexplored, and why]
```

---

## Writing Concrete Acceptance Criteria

Every AC must pass one test: could someone write a failing automated test from this sentence
alone? Convert before you write, not during review.

| Vague | Concrete |
|-------|----------|
| "make it faster" | "LCP < 2.5s on a 4G connection" |
| "handle errors properly" | "returns 4xx with a structured error code, never a stack trace" |
| "should scale" | "handles 1000 concurrent users at < 500ms p95" |
| "reliable" | "retries 3 times with exponential backoff, then fails with RETRY_EXHAUSTED" |

"Properly" and "appropriate" almost always mark an unfinished AC. Both leave the decision to
the implementer, which here is an agent that will decide silently.

### Proof line on every `[MUST]` AC

Every `[MUST]` AC ends with one `**Proof:**` line naming how it is checked:

- `**Proof:** test: <command>`
- `**Proof:** command: <command and expected output>`
- `**Proof:** artifact: <what to inspect>`
- `**Proof:** manual: <why it cannot be automated>`

Without one, only the AC's author can pass it. Gate 1 checks it, and `validation.md` uses it.

### Optional: EARS for the requirement statement

Given/When/Then says how to verify a requirement. EARS (Easy Approach to Requirements Syntax)
constrains the requirement sentence itself:

| Pattern | Shape |
|---------|-------|
| Ubiquitous | The `<system>` shall `<response>` |
| Event-driven | When `<trigger>`, the `<system>` shall `<response>` |
| State-driven | While `<state>`, the `<system>` shall `<response>` |
| Unwanted behavior | If `<trigger>`, then the `<system>` shall `<response>` |
| Optional feature | Where `<feature>`, the `<system>` shall `<response>` |

Example: "If the provider is unreachable, then the system shall return 503 with `Retry-After`."

Put the EARS sentence on a `**Requirement:**` line above the Given/When/Then. Use it in
regulated domains or when ACs stay ambiguous after Clarify. A concrete Given/When/Then already
passes Gate 1. Adopt EARS per project in `constitution.md`, never per feature.

---

## spec.md Template

```markdown
# [Feature Name]

Status: Draft  <!-- see Status Lifecycle -->
Version: 1.0
Last updated: [YYYY-MM-DD]

## Overview
<!-- 1 to 2 sentences for a non-technical stakeholder -->

## Handoff
Goal: [one sentence]
Done when:
- [ ] `[command]` exits 0 (AC-1, AC-2)
- [ ] [observable artifact or state] (AC-3)
Isolation: branch `[name]` off `[base]`, one worktree per parallel task
Permissions: Boundaries section below
Stop if: [condition]. Then stop and write why in decision_log.md

## User Stories
As a [role], I want [goal] so that [benefit].

## Boundaries
<!-- Optional. Feature-level rules on top of constitution.md. -->
**Always do:**
- [e.g., "check permissions before returning data"]

**Ask first (do not proceed unilaterally):**
- [e.g., "adding a table, field or dependency not in this spec"]

**Never do:**
- [e.g., "modify data or contracts owned by other features"]

## Acceptance Criteria
<!-- [MUST] required for launch, [SHOULD] important, not blocking,
     [COULD] nice to have, [WONT] explicitly excluded this iteration -->

### AC-1: [Short Title] [MUST]
Given [initial context]
When [action is taken]
Then [expected outcome]
**Proof:** test: [command]

### AC-2: [Short Title] [SHOULD]
Given [initial context]
When [action is taken]
Then [expected outcome]

### AC-3: [Excluded Capability] [WONT]
This feature will NOT include [capability]. Reason: [why].

<!-- Error and edge-case ACs are required, not only the happy path. -->
### AC-E1: [Error Case Title] [MUST]
Given [invalid or edge condition]
When [action is taken]
Then [expected error response or behavior]
**Proof:** test: [command]

## Out of Scope
- [Item]

## Open Questions
<!-- Every [NEEDS CLARIFICATION] is resolved before Phase 2. -->
- [NEEDS CLARIFICATION] [Question]
- [RESOLVED] [Question] → Decision: [answer]

## Non-Functional Requirements
<!-- Numbers, not adjectives: "< 200ms at p95", never "fast". -->
- Performance: [e.g., "search results in < 200ms at p95"]
- Security: [e.g., "requires authenticated session, see constitution.md"]
- Accessibility: [e.g., "WCAG 2.1 AA for all interactive elements"]
```

**Handoff rules** (spec.md and delta mode; used by Gate 1):

- Every Done-when item can pass or fail: a command that exits 0, or an observable artifact or
  state. Each cites the ACs it covers.
- A duration ("for 4 hours") is not a finish condition (AC-E1).
- At level S there is no spec file: the same block goes in the issue or PR body.

---

## spec.md Template: Delta Mode

Use it to change behavior that already ships. A delta spec declares a baseline and lists only
what moves, so its length tracks the size of the change, not of the subsystem.

```markdown
# [Change Name]

Status: Draft  <!-- see Status Lifecycle -->
Version: 1.0
Mode: Delta
Baseline: [specs/archive/user-auth/spec.md @ v2.1]  <!-- or: specs/[feature]/research.md F-1..F-8 -->
Last updated: [YYYY-MM-DD]

## Change Summary
<!-- 1 to 2 sentences: what behavior changes and for whom. -->

## Handoff
<!-- Same block and rules as the full spec.md template -->
Goal: [one sentence]
Done when:
- [ ] `[command]` exits 0 (AC-1, AC-3)
Isolation: branch `[name]` off `[base]`, one worktree per parallel task
Permissions: Boundaries section, or constitution.md if the delta has none
Stop if: [condition]. Then stop and write why in decision_log.md

## Baseline Assertion
<!-- Cited facts this change depends on. One false line invalidates the spec. -->
- [Sessions expire after 12h] (baseline AC-4, `research.md` F-2, `src/auth/middleware.ts:40`)

## Acceptance Criteria
<!-- Every AC carries a change label and a MoSCoW label. -->

### AC-1: [Short Title] [ADDED] [MUST]
Given [context]
When [action]
Then [outcome]
**Proof:** test: [command]

### AC-2: [Short Title] [MODIFIED] [MUST]
**Was:** [previous behavior, quoted from the baseline]
**Now:** Given [context] When [action] Then [outcome]
**Migration:** [what happens to data, sessions, or clients created under the old behavior]
**Proof:** test: [command]

### AC-3: [Short Title] [REMOVED]
**Was:** [behavior being removed, quoted from the baseline]
**Callers now see:** [the new observable result: an error, a default, nothing]
**Deprecation:** [immediate / behind flag until DATE / announced on DATE]

### AC-4: [Short Title] [UNCHANGED]
<!-- Every behavior sharing code paths with the change. -->
[Behavior, quoted from the baseline], must still hold after this change.
**Proof:** test: [command]

## Blast Radius
<!-- Everything that touches what you modify, derived from research.md. -->
| Changing | What depends on it | Verified by |
|----------|--------------------|-------------|
| `createSession()` | 4 call sites in `src/app/auth/*.ts` | AC-4 regression tests |

## Out of Scope
- [Adjacent thing you are deliberately not touching]

## Open Questions
- [NEEDS CLARIFICATION] [question]
```

**Rules for delta specs:**

- `Baseline:` resolves to a file a reviewer can open, such as `research.md` findings with
  `file:line` citations. "The current code" is not a baseline.
- `[MODIFIED]` and `[REMOVED]` ACs quote the old behavior verbatim. A paraphrase hides
  whether the author read it.
- `[UNCHANGED]` ACs are the regression suite. They make a short delta spec safe.
- If more than about half the ACs are `[ADDED]`, write a full spec instead.

---

## plan.md Template

```markdown
# Technical Plan: [Feature Name]

## Spec Reference
Implements: `specs/[branch]/spec.md`

## Architecture Overview
<!-- 3 to 5 sentences. -->

## Caller Usage
<!-- The new or changed interface as a caller uses it. contracts/ derive from it.
     Omit if no interface changes. -->

    [The call a real caller would write, with its result]

## Component Breakdown

### [Component Name]
- **Responsibility:** [what it does]
- **Location:** `[file path]`
- **Accepts:** [inputs]
- **Returns:** [outputs]
- **AC Coverage:** AC-1, AC-2

## Technology Choices
| Decision | Choice | Rationale |
|----------|--------|-----------|
| [e.g., DB query] | [e.g., Drizzle ORM] | [e.g., already in stack, type-safe] |

## Integration Points
- [System]: [usage]

## Invariants
<!-- Optional, level L stateful features only (states, retries, locks, offline). Rules a
     model checker or property-based tests verify; replay each counterexample on real code. -->
- [e.g., "a token is redeemed at most once, under any interleaving of two verify calls"]

## AC Coverage Map
<!-- Every [MUST] AC from spec.md appears here. Required for Gate 2. -->
| AC | Component(s) | Contract(s) |
|----|-------------|-------------|
| AC-1 | [ComponentName] | [contracts/file.md] |

## Risks
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| [e.g., Third-party API unavailable] | Low | High | Circuit breaker + fallback |

## Out of Scope (Technical)
- No [X]
```

---

## data-model.md Template

```markdown
# Data Model: [Feature Name]

## Spec Reference
Implements: `specs/[branch]/spec.md`

## Entities

### [EntityName]
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | uuid | PK, NOT NULL | Primary key |
| [field] | [type] | [constraints] | [description] |
| created_at | timestamp | NOT NULL, DEFAULT now() | |

### Relationships
- `[EntityA]` has many `[EntityB]` (via `entity_b.entity_a_id`)

## Indexes
| Table | Columns | Type | Rationale |
|-------|---------|------|-----------|
| [table] | [col1, col2] | btree | [e.g., lookup by user + date] |

## Constraints
- [e.g., `CHECK (status IN ('active', 'inactive'))` on `users`]

## Migrations
<!-- Append-only: one block per schema change, never edit a past entry. -->

### [Migration 001] Initial schema
- Create `[table_name]` with the fields above, and the indexes
- **Rollback:** drop `[table_name]`
```

---

## contracts/[endpoint].md Template

````markdown
# API Contract: [Endpoint Name]

## [HTTP METHOD] [/path/:param]

### Description
[One sentence]

### Authentication
[e.g., "Bearer token required" / "Public" / "Admin role required"]

### Request

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| [param] | path / query | string | yes | [description] |

**Request Body:**

```json
{
  "field": "type: description",
  "optionalField?": "type: description"
}
```

### Response

**Success (200 OK):**

```json
{ "id": "uuid", "field": "value" }
```

**Error Codes:**

| Status | Code | When |
|--------|------|------|
| 400 | VALIDATION_ERROR | [condition] |
| 401 | UNAUTHORIZED | [condition] |
| 404 | NOT_FOUND | [condition] |

### AC Coverage
- AC-1: [how this endpoint satisfies it]
````

---

## tasks.md Template

```markdown
# Task List: [Feature Name]

## Plan Reference
Implements: `specs/[branch]/plan.md`

## Tasks

### Setup

- [ ] **TASK-001** [S] Set up [module] skeleton
  - Creates: `[file path]`
  - Depends on: none

### [Component Group]

- [ ] **TASK-002** [M] [P] Write tests for [component]
  - Tests: AC-1, AC-2 from `specs/[branch]/spec.md`
  - Creates: `[test file path]`
  - Depends on: TASK-001

- [ ] **TASK-003** [M] Implement [component]
  - Contract: `specs/[branch]/contracts/[file].md`
  - Creates: `[file path]`
  - Modifies: `[existing file path]`
  - Depends on: TASK-002

### Integration

- [ ] **TASK-004** [L] Integration test: full [feature] flow
  - Tests: AC-1, AC-2, AC-E1
  - Depends on: TASK-003

## Legend
- `[S]` under 1 hour · `[M]` 1 to 3 hours · `[L]` 3 to 6 hours (consider splitting)
- `[P]` can run concurrently with other `[P]` tasks in the same wave
```

**Graph rules** (used by Gate 3):

- Waves are computed from `Depends on:`: a task runs when every task it depends on is done.
- The files a task writes are its `Creates:` and `Modifies:` lines. Parallel `[P]` tasks in
  the same wave must not share any file.

---

## progress.md Template

Optional Phase 4 artifact, created only when a task outlives one context window. A fresh
session resumes from it without the original chat. Under 40 lines: a checkpoint, not a log.

```markdown
# Progress: [Feature Name]

Updated: [YYYY-MM-DD HH:MM]

## Status
[One line: phase, task in flight, how far it got]

## Last good commit
`[sha]`  <!-- last commit where the Done-when tests passed -->

## Next step
[The one action a fresh session takes first]

## Blockers
<!-- Omit if none. The failing command and its actual output. -->
[e.g., "`pnpm test auth.test.ts` fails on AC-3: expected 403, received 401"]

## Read first
`spec.md` (Handoff block), `tasks.md`, `decision_log.md`
```

---

## decision_log.md Template

Optional, for autonomous runs and any decision that should outlive the session.
Append-only: add rows, never edit or delete one. A reversal is a new row.

```markdown
# Decision Log: [Feature Name]

| ts | task | decision | why | evidence | result |
|----|------|----------|-----|----------|--------|
| [YYYY-MM-DD HH:MM] | [TASK-003] | [what was decided] | [reason] | [commit, test run, or file:line] | [pass / fail / open] |
```

---

## specs/_current/[capability].md Template

Written at archive (Phase 5.6): the merged current state of one capability. A later delta
spec may name it as its `Baseline:`. The merge rule is in `workflow-phases.md` Step 5.6.

```markdown
# [Capability] (current state)

Updated: [YYYY-MM-DD]
Merged from: [specs/archive/feature-a/ @ sha], [specs/archive/feature-b/ @ sha]

### AC-1: [Short Title] [MUST]
Given [context]
When [action]
Then [outcome]
**Proof:** test: [command]
**Source:** feature-a AC-1
```
