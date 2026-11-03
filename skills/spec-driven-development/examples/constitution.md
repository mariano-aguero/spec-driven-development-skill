# Project Constitution

Version: 1.0.0
Last updated: 2026-05-10

> Example constitution for a TypeScript + PostgreSQL web application. Project-level rules
> that apply to **every** feature spec in this repository. AI agents must never violate
> these constraints.

## Architecture Principles

- **API-first.** Every feature exposes an HTTP endpoint with a locked contract before any UI is built.
- **Server-first.** Use React Server Components by default; mark `"use client"` only when interactivity requires it.
- **Single source of truth.** Database schema lives in `db/schema.ts` via Drizzle; the application reads it through generated types — never via raw `pg` queries.
- **Boring tech.** Prefer the framework's built-in solution before adding a dependency.

## Technology Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Language | TypeScript 5.x | `strict: true`; no `any`; no `as` casts except at framework boundaries |
| Runtime | Node.js 20+ | |
| Framework | Next.js 15+ | App Router only |
| Database | PostgreSQL 16 + Drizzle ORM | Migrations under `db/migrations/` |
| Auth | Better Auth (self-hosted) | No custom auth flows outside the `auth/` module |
| Email | Resend | All transactional emails routed through `lib/mailer.ts` |
| Validation | Zod | All external input validated at the route boundary |
| Testing | Vitest + Playwright | Unit & integration with Vitest; E2E with Playwright |
| Logger | Pino | Structured JSON; never `console.*` in production code |

## Security Constraints

- **Auth by default.** All endpoints require a valid session unless explicitly tagged `[PUBLIC]` in the contract.
- **Input validation.** Every request body, query param, and path param is validated with Zod at the route handler entry point.
- **SQL safety.** Parameterized queries only. Never interpolate user input into SQL strings; never use template literals to build queries.
- **Secrets.** Never log tokens, passwords, session IDs, or PII. Never hardcode secrets — read from `process.env` only.
- **CORS.** Allow-list only. No wildcard origins in any non-local environment.
- **Rate limiting.** Every public endpoint declares a rate limit in its contract (`contracts/<name>.md`).
- **Token handling.** All security tokens are stored hashed (SHA-256) at rest. Tokens are compared with constant-time equality.

## Naming Conventions

- Files: `kebab-case` (`magic-link-token.ts`)
- Variables / functions: `camelCase`
- Types / interfaces / Zod schemas: `PascalCase`
- DB columns: `snake_case`
- Env vars: `SCREAMING_SNAKE_CASE`
- Route handler files: always named `route.ts` per Next.js convention

## Banned Patterns

AI is strictly forbidden from introducing any of these:

- `any` type anywhere in `src/`
- `console.log` / `console.error` (use the Pino logger)
- Synchronous file I/O in request handlers
- Direct DOM manipulation (use React)
- Raw `fetch` in server code (use the typed API client in `lib/api-client.ts`)
- Storing plaintext secrets, tokens, or passwords in the database
- `setTimeout`-based polling for async work (use the job queue)

## File Structure

```text
src/
  app/                # Next.js App Router routes and pages
  components/         # Shared UI components (Server Components by default)
  lib/                # Business logic, utilities, framework adapters
  auth/               # Authentication module — all auth flows live here
  db/
    schema.ts         # Drizzle schema (single source of truth)
    migrations/       # Generated migrations
    repositories/     # Typed query helpers
  types/              # Shared TypeScript types
tests/
  unit/               # Vitest unit tests
  integration/        # Vitest integration tests with test database
  e2e/                # Playwright E2E tests
```

## Open Questions / Deferred Decisions

- *(none currently pending)*
