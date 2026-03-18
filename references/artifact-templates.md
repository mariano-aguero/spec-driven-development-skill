# Artifact Templates

Copy-paste templates for each SDD artifact. Remove placeholder comments before committing.

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

## spec.md Template

```markdown
# [Feature Name]

## Overview
<!-- 1-2 sentences describing the feature for a non-technical stakeholder -->

## User Stories

### Primary
As a [role], I want [goal] so that [benefit].

### Secondary (optional)
As a [role], I want [goal] so that [benefit].

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

## Out of Scope (Technical)
<!-- Technical boundaries that mirror spec.md out-of-scope -->
- No [X]
- No [Y]
```

---

## data-model.md Template

```markdown
# Data Model: [Feature Name]

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

*Optional artifact for documenting context and alternatives. Create when technology
choices or architecture decisions need rationale preserved for future reference.*

```markdown
# Research: [Feature Name or Decision Topic]

## Context
<!-- Why was this research needed? What decision does it inform? -->

## Options Considered

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

## References
- [Link or document title]
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
