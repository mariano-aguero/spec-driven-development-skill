# Artifact Templates

Copy-paste templates for each SDD artifact. Remove placeholder comments before committing.

## Contents

- `constitution.md` — project-level immutable constraints (Phase 0)
- `research.md` — how the system works today, cited `file:line` (Phase 0.5)
- Writing concrete acceptance criteria — vague-to-measurable conversions
- `spec.md` — requirements, MoSCoW ACs, Boundaries (Phase 1)
- `spec.md` delta mode — brownfield changes: baseline, ADDED/MODIFIED/REMOVED/UNCHANGED, blast radius
- `plan.md` — architecture, AC coverage map, risks (Phase 2)
- `data-model.md` — entities, indexes, migrations (Phase 2)
- `contracts/[endpoint].md` — request/response shapes, error codes (Phase 2)
- `tasks.md` — atomic, test-first, dependency-mapped tasks (Phase 3)
- `progress.md` — handover state across context resets (Phase 4, optional)
- `decision_log.md` — rationale for key decisions (any phase, optional)

For the formats of everything the *user* reads — gate verdicts, traceability matrix, drift
report, walkthrough — see `output-formats.md`.

---

## constitution.md Template

*Created once per project at the root. Applied to every feature.*

```markdown
# Project Constitution

Version: 1.0.0
Last updated: [date]

## Architecture Principles

- [e.g., "API-first: all features expose a REST endpoint before any UI is built"]
- [e.g., "Server Components by default; use client components only when required"]
- [e.g., "No ORM other than Drizzle; raw SQL only for complex analytics queries"]

## Technology Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Language | TypeScript 5.x | Strict mode, no `any` |
| Runtime | Node.js 20+ | |
| Framework | [e.g., Next.js 15+] | App Router only |
| Database | PostgreSQL + Drizzle | No direct SQL in route handlers |
| Auth | [e.g., Better Auth] | No custom auth logic outside the auth module |
| Testing | Vitest + Playwright | |

## Security Constraints

<!-- These constraints apply to ALL generated code. AI must never violate them. -->

- Authentication: all endpoints require a valid session unless explicitly marked `[PUBLIC]`
- Input validation: all external inputs validated with Zod at the route boundary
- SQL injection: parameterized queries only — never string-concatenate user input into queries
- Secrets: never log tokens, passwords, or PII; never hardcode secrets
- CORS: allow-list only — no wildcard origins in production
- Rate limiting: all public endpoints must declare a rate limit in their contract

## Naming Conventions

- Files: kebab-case (`user-repository.ts`)
- Variables/functions: camelCase
- Types/interfaces: PascalCase
- DB columns: snake_case
- Env vars: SCREAMING_SNAKE_CASE

## Banned Patterns

<!-- AI is strictly forbidden from introducing these patterns -->

- No `any` type in TypeScript
- No `console.log` in production code (use logger)
- No synchronous file I/O in request handlers
- No direct DOM manipulation (use React)
- No [project-specific banned pattern]

## File Structure Rules

```

src/
  app/          # Next.js routes and pages
  components/   # Shared UI components
  lib/          # Business logic and utilities
  db/           # Schema, migrations, repositories
  types/        # Shared TypeScript types

```

## Open Questions / Deferred Decisions

- [PENDING] [Decision 1]: [context and options]
```

---

## Writing Concrete Acceptance Criteria

Every AC must survive one test: could someone write a failing automated test from this
sentence alone? Convert before you write, not during review.

| Vague | Concrete |
|-------|---------|
| "make it faster" | "LCP < 2.5s on a 4G connection" |
| "it should be secure" | "requires an authenticated session; all inputs validated before processing" |
| "handle errors properly" | "returns 4xx with a structured error code, never exposes stack traces" |
| "should scale" | "handles 1000 concurrent users at < 500ms p95" |
| "works correctly" | "Given X, When Y, Then Z — independently verifiable" |
| "good UX" | "every interactive element reachable by keyboard; focus visible at 3:1 contrast" |
| "reliable" | "retries 3× with exponential backoff, then fails with RETRY_EXHAUSTED" |

Two words that almost always signal an unfinished AC: **"properly"** and **"appropriate"**.
Both mean the writer deferred the decision to whoever implements it — which, in this
workflow, is an agent that will decide silently.

---

## spec.md Template

```markdown
# [Feature Name]

Status: Draft
Version: 1.0
Last updated: [YYYY-MM-DD]

## Overview
<!-- 1-2 sentences describing the feature for a non-technical stakeholder -->

## User Stories

### Primary
As a [role], I want [goal] so that [benefit].

### Secondary (optional)
As a [role], I want [goal] so that [benefit].

## Boundaries
<!-- Optional. Use when AI behavior constraints at the feature level need to be
     explicit — separate from project-level rules in constitution.md. -->

**Always do:**
- [e.g., "validate all inputs before processing"]
- [e.g., "check permissions before returning data"]

**Ask first (do not proceed unilaterally):**
- [e.g., "adding a new database table or field not in this spec"]
- [e.g., "introducing a new dependency"]
- [e.g., "extending scope beyond these ACs"]

**Never do:**
- [e.g., "skip authentication for this endpoint"]
- [e.g., "log sensitive user data"]
- [e.g., "modify data or contracts owned by other features"]

## Acceptance Criteria

<!-- MoSCoW priority: [MUST] = required for launch, [SHOULD] = important but not blocking,
     [COULD] = nice to have, [WONT] = explicitly excluded from this iteration -->

### AC-1: [Short Title] [MUST]
Given [initial context]
When [action is taken]
Then [expected outcome]

### AC-2: [Short Title] [MUST]
Given [initial context]
When [action is taken]
Then [expected outcome]

### AC-3: [Short Title] [SHOULD]
Given [initial context]
When [action is taken]
Then [expected outcome]

### AC-4: [Explicitly Excluded Feature] [WONT]
<!-- Use [WONT] to document what was considered and explicitly ruled out for this iteration.
     This prevents the same discussion from recurring and signals deliberate scope decisions. -->
This feature will NOT include [capability]. Reason: [why it's excluded from this iteration].

<!-- Error and edge case ACs are required. Don't only spec the happy path. -->

### AC-E1: [Error Case Title] [MUST]
Given [invalid or edge condition]
When [action is taken]
Then [expected error response or behavior]

## Out of Scope
<!-- Explicitly list what this feature does NOT include -->
- [Item 1]
- [Item 2]

## Open Questions
<!-- Use [NEEDS CLARIFICATION] for unresolved items. ALL must be resolved before Phase 2. -->
- [NEEDS CLARIFICATION] [Question 1]
- [RESOLVED] [Question 2] → Decision: [answer]

## Non-Functional Requirements
<!-- Performance, security, accessibility, internationalization, etc.
     Be specific — "fast" is not a requirement, "< 200ms at p95" is. -->
- Performance: [e.g., "search results in < 200ms at p95"]
- Security: [e.g., "requires authenticated session — see constitution.md"]
- Accessibility: [e.g., "WCAG 2.1 AA for all interactive elements"]
```

---

## spec.md Template — Delta Mode

*Use when changing behavior that already ships. A delta spec respecifies nothing: it declares
a baseline and lists only what moves.*

*Its length tracks the size of the **change**, not the size of the subsystem. Against a
150-line baseline the saving is modest; against a mature auth spec it is the difference
between a document reviewers read and one they skim. That is the point — not brevity for its
own sake.*

```markdown
# [Change Name]

Status: Draft
Version: 1.0
Mode: Delta
Baseline: [specs/archive/user-auth/spec.md @ v2.1]  ← or: [specs/[feature]/research.md F-1..F-8]
Last updated: [YYYY-MM-DD]

## Change Summary
<!-- 1-2 sentences: what behavior changes and for whom. Not why the feature exists. -->

## Baseline Assertion
<!-- What the system does TODAY that this change depends on. Every line cites the baseline —
     a prior spec's AC, or a research.md finding with its file:line. If a line here turns out
     to be false, this spec is invalid, not merely incomplete. -->

- [Sessions expire after 12h] — baseline AC-4 / `research.md` F-2 (`src/auth/middleware.ts:40`)
- [Rate limiting is per-IP] — `research.md` F-3 (`lib/rate-limit.ts:22`)

## Acceptance Criteria

<!-- Every AC carries a change label AND a MoSCoW label. -->

### AC-1: [Short Title] [ADDED] [MUST]
Given [context]
When [action]
Then [outcome]

### AC-2: [Short Title] [MODIFIED] [MUST]
**Was:** [previous behavior, quoted from the baseline — not paraphrased]
**Now:** Given [context] When [action] Then [outcome]
**Migration:** [what happens to data, sessions, or clients created under the old behavior]

### AC-3: [Short Title] [REMOVED]
**Was:** [behavior being removed, quoted from the baseline]
**Callers now see:** [the new observable result — an error, a default, nothing]
**Deprecation:** [immediate / behind flag until DATE / announced on DATE]

### AC-4: [Short Title] [UNCHANGED]
<!-- Behavior this change must NOT break. These are the regression tests. Include every
     behavior that shares code paths with what you are changing — this section is the
     cheapest insurance in a brownfield change. -->
[Behavior, quoted from the baseline] — must still hold after this change.

## Blast Radius
<!-- Everything that touches what you are modifying. Derived from research.md, not guessed. -->

| Changing | What depends on it | Verified by |
|----------|--------------------|-------------|
| `createSession()` | 4 call sites — `src/app/auth/*.ts` | AC-4 regression tests |
| `sessions.expires_at` | reporting export job | AC-5, manual check before merge |

## Out of Scope
- [Adjacent thing you are deliberately not touching]

## Open Questions
- [NEEDS CLARIFICATION] [question]
```

**Rules for delta specs:**

- The `Baseline:` header must resolve to something a reviewer can open. "The current code" is
  not a baseline; `research.md` findings with `file:line` citations are.
- `[MODIFIED]` and `[REMOVED]` ACs quote the old behavior verbatim from the baseline. A
  paraphrase hides whether the author actually read it.
- `[UNCHANGED]` is not filler. It is the regression suite, and it is what makes a delta spec
  safe enough to be short.
- If more than roughly half the ACs are `[ADDED]`, you are writing a new feature — switch to
  a full spec.

---

## plan.md Template

```markdown
# Technical Plan: [Feature Name]

## Spec Reference
Implements: `specs/[branch]/spec.md`

## Architecture Overview
<!-- High-level description of the approach. 3-5 sentences max. -->

## Component Breakdown

### [Component 1 Name]
- **Responsibility:** [What it does]
- **Location:** `[file path]`
- **Accepts:** [inputs]
- **Returns:** [outputs]
- **AC Coverage:** AC-1, AC-2

### [Component 2 Name]
- **Responsibility:** [What it does]
- **Location:** `[file path]`
- **Accepts:** [inputs]
- **Returns:** [outputs]
- **AC Coverage:** AC-3

## Technology Choices

| Decision | Choice | Rationale |
|----------|--------|-----------|
| [e.g., DB query] | [e.g., Drizzle ORM] | [e.g., already in stack, type-safe] |

## Integration Points
<!-- External services, APIs, or other features this touches -->
- [System]: [How it's used]

## AC Coverage Map
<!-- Every [MUST] AC from spec.md must appear here. Required for Gate 2. -->
| AC | Component(s) | Contract(s) |
|----|-------------|-------------|
| AC-1 | [ComponentName] | [contracts/file.md] |
| AC-E1 | [ComponentName] | [contracts/file.md] |

## Risks
<!-- Identify implementation risks before Phase 3. One row per risk. -->
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| [e.g., Third-party API unavailable] | Low | High | Circuit breaker + fallback |
| [e.g., Data migration fails mid-flight] | Medium | High | Idempotent migration, rollback script |

## Out of Scope (Technical)
<!-- Technical boundaries that mirror spec.md out-of-scope -->
- No [X]
- No [Y]
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
| updated_at | timestamp | NOT NULL | |

### Relationships
- `[EntityA]` has many `[EntityB]` (via `entity_b.entity_a_id`)
- `[EntityA]` belongs to `[EntityC]`

## Indexes
| Table | Columns | Type | Rationale |
|-------|---------|------|-----------|
| [table] | [col1, col2] | btree | [e.g., lookup by user + date] |

## Constraints
- [e.g., `CHECK (status IN ('active', 'inactive', 'pending'))` on `users`]

## Migrations

<!-- Add one block per schema change. Migrations are append-only — never edit past entries. -->

### [Migration 001] Initial schema
- Create `[table_name]` table with all fields above
- Add indexes from the Indexes section above
- **Rollback:** drop `[table_name]` table

### [Migration 002] [Short description] *(add when schema changes)*
- [What this migration does]
- **Rollback:** [how to undo]
```

---

## contracts/[endpoint].md Template

```markdown
# API Contract: [Endpoint Name]

## [HTTP METHOD] [/path/:param]

### Description
[One sentence describing what this endpoint does]

### Authentication
[e.g., "Bearer token required" / "Public" / "Admin role required"]

### Request

**Path Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| [param] | string | yes | [description] |

**Query Parameters:**
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| [param] | string | no | [default] | [description] |

**Request Body:**
```json
{
  "field": "type — description",
  "optionalField?": "type — description"
}
```

### Response

**Success (200 OK):**

```json
{
  "id": "uuid",
  "field": "value"
}
```

**Error Codes:**

| Status | Code | When |
|--------|------|------|
| 400 | VALIDATION_ERROR | [condition] |
| 401 | UNAUTHORIZED | [condition] |
| 404 | NOT_FOUND | [condition] |
| 409 | CONFLICT | [condition] |

### AC Coverage

- AC-1: [How this endpoint satisfies it]

```

---

## tasks.md Template

```markdown
# Task List: [Feature Name]

## Plan Reference
Implements: `specs/[branch]/plan.md`

## Tasks

### Setup

- [ ] **TASK-001** [S] Set up [component/module] skeleton
  - Creates: `[file path]`
  - Depends on: none

### [Component Group]

- [ ] **TASK-002** [M] [P] Write tests for [component]
  - Tests: AC-1, AC-2 from `specs/[branch]/spec.md`
  - Depends on: TASK-001

- [ ] **TASK-003** [M] Implement [component]
  - Contract: `specs/[branch]/contracts/[file].md`
  - Depends on: TASK-002

- [ ] **TASK-004** [S] [P] Write tests for [other component]
  - Tests: AC-3 from `specs/[branch]/spec.md`
  - Depends on: TASK-001

- [ ] **TASK-005** [M] Implement [other component]
  - Contract: `specs/[branch]/contracts/[file].md`
  - Depends on: TASK-004

### Integration

- [ ] **TASK-006** [L] Integration test: full [feature] flow
  - Tests: AC-1 through AC-4
  - Depends on: TASK-003, TASK-005

### Cleanup

- [ ] **TASK-007** [S] Update API documentation
  - Depends on: TASK-006

## Legend
- `[S]` Small — under 1 hour
- `[M]` Medium — 1–3 hours
- `[L]` Large — 3–6 hours (consider splitting)
- `[P]` Parallelizable — can run concurrently with other `[P]` tasks at same level
```

---

## research.md Template

*Phase 0.5 artifact. Produced before `spec.md` whenever the feature touches code that is
unfamiliar, large, or ambiguous. Describes how the system works **today** — never how it
should work. Target length: ~200 lines. Every claim carries a `file:line` citation.*

```markdown
# Research: [Feature Name]

Status: Draft
Date: [YYYY-MM-DD]

## Problem Summary
<!-- 2-4 sentences. What are we about to change, and why does the existing system matter
     to that change? No solution, no requirements. -->

## Relevant Files

| File | Role in this feature | Key entry point |
|------|---------------------|-----------------|
| `src/[path].ts` | [what this file is responsible for] | `functionName()` — `src/[path].ts:42` |
| `src/[path].ts` | [what this file is responsible for] | `ClassName.method()` — `src/[path].ts:118` |

<!-- Completeness matters more than depth here. A missed file becomes a wrong plan. -->

## Information Flow
<!-- How data actually moves through the code today, in order. Cite as you go. -->

1. [Entry point] receives [input] — `src/[path].ts:12`
2. [Component] validates and transforms it into [shape] — `src/[path].ts:45`
3. [Component] persists to [table/service] — `src/[path].ts:88`
4. [Response/side effect] returns to the caller — `src/[path].ts:103`

**Where this feature intervenes:** [step number(s) above]

## Key Findings

### F-1: [Short factual title]
[What is true about the codebase, stated as fact.] — `src/[path].ts:60-74`
**Consequence for this feature:** [what this constrains or enables]

### F-2: [Short factual title]
[Fact.] — `src/[path].ts:210`
**Consequence for this feature:** [...]

## Existing Constraints Discovered
<!-- Things the code already enforces that the spec must respect. These become spec inputs. -->

- [e.g., "All repository methods take a transaction handle as first arg" — `src/db/base.ts:18`]
- [e.g., "Session cookies are set only in the auth module" — `src/auth/session.ts:55`]

## Prior Art in This Codebase
<!-- Similar features already implemented that should be imitated rather than reinvented. -->

- [Feature X solves a near-identical problem] — `src/features/x/`

## Options Considered
<!-- Only when multiple viable approaches exist. Omit this section otherwise. -->

### Option A: [Name]
**Description:** [1-2 sentences]
**Pros:**
- [Advantage 1]
- [Advantage 2]
**Cons:**
- [Disadvantage 1]
**Estimated effort:** [S / M / L]

### Option B: [Name]
**Description:** [1-2 sentences]
**Pros:**
- [Advantage 1]
**Cons:**
- [Disadvantage 1]
**Estimated effort:** [S / M / L]

## Decision
**Chosen:** Option [A/B]
**Rationale:** [Why this option was selected over the others]
**Date:** [YYYY-MM-DD]
**Decided by:** [human / team / constraint]

## Open Questions for the Spec
<!-- Things research could NOT answer from the code. These go to Phase 1 as
     [NEEDS CLARIFICATION] items — they are product decisions, not code facts. -->

- [Question the codebase cannot answer, e.g., "should expired invites be reusable?"]

## Not Investigated
<!-- Explicit boundaries of this research. Prevents false confidence in completeness. -->

- [Area deliberately left unexplored and why]

## References
- [Link or document title]
```

---

## progress.md Template

*Optional Phase 4 artifact. Create only when a task outlives a single context window.
It is the handover note a fresh session reads to resume without re-deriving state.
Keep it under 40 lines — it is a checkpoint, not a log.*

```markdown
# Progress: [TASK-ID] [Task Title]

Updated: [YYYY-MM-DD HH:MM]

## Goal
<!-- One sentence: what "done" means for this task, copied from tasks.md -->

## Completed
- [x] [Step already finished] → `src/[path].ts:[line]`
- [x] [Step already finished] → commit `[sha]`

## Current Step
→ [The one thing in flight right now, and how far it got]

## Remaining
- [ ] [Next step]
- [ ] [Step after that]

## Current Blocker
<!-- Omit if none. Be specific: the failing command and its actual output. -->
[e.g., "`pnpm test auth.test.ts` fails on AC-3: expected 403, received 401"]

## Do Not Repeat
<!-- Approaches already tried and rejected in this task. Prevents a fresh session
     from rediscovering the same dead end. -->
- [Approach tried] — failed because [reason]
```

---

## decision_log.md Template

*Optional artifact for recording key decisions made during any phase. Especially useful
when AI suggests an alternative approach or when requirements change mid-implementation.*

```markdown
# Decision Log: [Feature Name]

---

## [YYYY-MM-DD] [Short Decision Title]

**Context:** [What situation triggered this decision]
**Options:**
- Option A: [brief description]
- Option B: [brief description]
**Decision:** [What was decided]
**Rationale:** [Why]
**Impact:** [Which files or specs are affected]
**Decided by:** [human / team]

---

## [YYYY-MM-DD] [Short Decision Title]

**Context:** [...]
**Decision:** [...]
**Rationale:** [...]
**Impact:** [...]
```
