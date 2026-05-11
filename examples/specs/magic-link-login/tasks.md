# Task List: Magic-Link Login

## Plan Reference

Implements: `specs/magic-link-login/plan.md`

## Tasks

### Setup

- [ ] **TASK-001** [S] Create migration `001_create_magic_link_tokens`
  - Creates: `db/migrations/0042_create_magic_link_tokens.sql` (per `data-model.md` Migration 001)
  - Tests: schema migration applied successfully against test database
  - Depends on: none

- [ ] **TASK-002** [S] Add Drizzle schema for `magic_link_tokens`
  - Creates: entry in `src/db/schema.ts`
  - Depends on: TASK-001

### Repository layer

- [ ] **TASK-003** [M] [P] Write tests for `MagicLinkTokenRepository`
  - Tests: every method (`create`, `findByTokenHash`, `markRedeemed`, `countRecentByEmail`) against the test database
  - Tests: AC-1, AC-2, AC-4, AC-E2, AC-E3 (repository contracts)
  - Depends on: TASK-002

- [ ] **TASK-004** [M] Implement `MagicLinkTokenRepository`
  - Creates: `src/db/repositories/magic-link-token-repository.ts`
  - Contract: `specs/magic-link-login/plan.md` → MagicLinkTokenRepository
  - Depends on: TASK-003

### Mailer

- [ ] **TASK-005** [S] [P] Write test for `MagicLinkMailer.enqueue()`
  - Tests: AC-1 (job is enqueued; email/token never appear in log fields)
  - Depends on: TASK-002

- [ ] **TASK-006** [S] Implement `MagicLinkMailer.enqueue()`
  - Creates: `src/lib/mailers/magic-link-mailer.ts`
  - Contract: `specs/magic-link-login/plan.md` → MagicLinkMailer
  - Depends on: TASK-005

### Request endpoint

- [ ] **TASK-007** [M] [P] Write integration tests for `POST /auth/magic-link`
  - Tests: AC-1 (happy path), AC-E1 (validation), AC-E3 (rate limit)
  - Contract: `specs/magic-link-login/contracts/auth-api.md` → `POST /auth/magic-link`
  - Depends on: TASK-004, TASK-006

- [ ] **TASK-008** [M] Implement `POST /auth/magic-link` route handler
  - Creates: `src/app/auth/magic-link/route.ts`
  - Contract: `specs/magic-link-login/contracts/auth-api.md` → `POST /auth/magic-link`
  - Depends on: TASK-007

### Verify endpoint

- [ ] **TASK-009** [M] [P] Write integration tests for `GET /auth/magic-link/verify`
  - Tests: AC-2 (success + session), AC-3 (first-time user creation), AC-4 (expired), AC-E2 (already used)
  - Contract: `specs/magic-link-login/contracts/auth-api.md` → `GET /auth/magic-link/verify`
  - Depends on: TASK-004

- [ ] **TASK-010** [M] Implement `GET /auth/magic-link/verify` route handler
  - Creates: `src/app/auth/magic-link/verify/route.ts`
  - Contract: `specs/magic-link-login/contracts/auth-api.md` → `GET /auth/magic-link/verify`
  - Depends on: TASK-009

### End-to-end

- [ ] **TASK-011** [L] Playwright E2E: request → click email link → land on dashboard
  - Tests: AC-1 + AC-2 + AC-3 stitched together against a real email-capture testing inbox
  - Depends on: TASK-008, TASK-010

## Legend

- `[S]` Small — under 1 hour
- `[M]` Medium — 1–3 hours
- `[L]` Large — 3–6 hours (consider splitting)
- `[P]` Parallelizable — can run concurrently with other `[P]` tasks at the same dependency level
