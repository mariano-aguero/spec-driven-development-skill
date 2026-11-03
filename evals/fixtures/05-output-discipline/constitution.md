# Project Constitution

Version: 1.0.0
Last updated: 2026-05-10

## Architecture Principles

- API-first: every feature exposes an HTTP endpoint with a locked contract before any UI.
- Boring tech: use the framework's built-in solution before adding a dependency.

## Technology Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Language | TypeScript 5.x | `strict: true`, no `any` |
| Runtime | Node.js 20+ | |
| Framework | Next.js 15 | App Router only |
| Database | PostgreSQL 16 + Drizzle | Migrations under `db/migrations/` |
| Auth | Better Auth | No custom auth flows outside `src/auth/` |
| Email | Resend | All mail goes through `src/lib/mailer.ts` |
| Validation | Zod | At the route boundary |
| Testing | Vitest + Playwright | |

## Security Constraints

- All endpoints require a valid session unless tagged `[PUBLIC]` in the contract.
- Every public endpoint declares a rate limit in its contract.
- Security tokens are stored hashed (SHA-256) and compared in constant time.
- Never log tokens, passwords, session IDs, or PII.

## Banned Patterns

- `any` in `src/`
- `console.log` (use the Pino logger)
- Storing plaintext secrets or tokens in the database

## Open Questions

- None pending.
