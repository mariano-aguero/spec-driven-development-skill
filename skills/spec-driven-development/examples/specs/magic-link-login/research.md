# Research: Magic-Link Login

Status: Approved (Gate R passed)
Date: 2026-05-08

## Problem Summary

We want to let users sign in with a one-time emailed link instead of a password. The app
already has sessions, a users table, a rate limiter, and an async job queue — all built for
the existing password flow. This document records how those pieces work today so the spec
targets the real system rather than a plausible one.

## Relevant Files

| File | Role in this feature | Key entry point |
|------|---------------------|-----------------|
| `src/auth/sessions.ts` | Creates, reads, and revokes session cookies | `createSession(userId, response)` — `src/auth/sessions.ts:34` |
| `src/auth/middleware.ts` | Attaches the session to every request; enforces expiry | `withSession()` — `src/auth/middleware.ts:18` |
| `src/db/schema/users.ts` | `users` table definition | `users` — `src/db/schema/users.ts:7` |
| `src/db/repositories/base.ts` | Repository base class; transaction convention | `BaseRepository` — `src/db/repositories/base.ts:11` |
| `lib/rate-limit.ts` | Sliding-window limiter backed by Redis | `checkLimit(key, window, max)` — `lib/rate-limit.ts:22` |
| `lib/jobs/queue.ts` | Async job enqueue; worker runs as a separate process | `enqueue(jobName, payload)` — `lib/jobs/queue.ts:15` |
| `src/lib/mailers/index.ts` | Transactional email templates and the Resend client | `sendTemplate()` — `src/lib/mailers/index.ts:41` |
| `src/app/auth/password/route.ts` | The existing password login route — closest prior art | `POST` handler — `src/app/auth/password/route.ts:12` |

## Information Flow

How the existing password login works end to end:

1. `POST /auth/password` receives `{ email, password }` — `src/app/auth/password/route.ts:12`
2. Handler validates the body with a Zod schema at the route boundary — `src/app/auth/password/route.ts:19`
3. `checkLimit()` is called with key `login:${ip}` before any database read — `src/app/auth/password/route.ts:24`
4. `UserRepository.findByEmail()` loads the user inside a transaction handle — `src/db/repositories/user-repository.ts:28`
5. On success, `createSession(userId, response)` writes the signed cookie — `src/auth/sessions.ts:34`
6. Handler returns `200` with the cookie attached; no body — `src/app/auth/password/route.ts:51`

**Where this feature intervenes:** steps 1–4 are replaced by a two-endpoint flow (request,
then verify). Step 5 is reused unchanged.

## Key Findings

### F-1: Session creation is centralized and must not be duplicated

`createSession()` is the only place in the codebase that sets the session cookie. It signs
the payload, sets `HttpOnly`, `Secure`, and `SameSite=Lax`, and applies the 24-hour TTL from
config. — `src/auth/sessions.ts:34-58`

**Consequence for this feature:** verification must call `createSession()` rather than
constructing a cookie. A second cookie path would silently bypass the expiry enforced in
`withSession()`.

### F-2: Session expiry is enforced in middleware, not per-route

Every request passes through `withSession()`, which rejects sessions older than the
configured TTL. No route implements its own expiry check. — `src/auth/middleware.ts:40`

**Consequence for this feature:** magic-link *token* expiry is a separate concern from
*session* expiry. Specifying session lifetime inside this feature would create a second,
conflicting mechanism.

### F-3: The rate limiter is per-key, not per-IP by design

`checkLimit(key, window, max)` accepts an arbitrary key. The password route happens to use
IP, but the limiter itself is agnostic. — `lib/rate-limit.ts:22-37`

**Consequence for this feature:** a per-email limit is available without new
infrastructure — only a key convention is needed.

### F-4: Email sending is already asynchronous

`sendTemplate()` is never called directly from a request handler. Every caller enqueues a
job and returns immediately; a separate worker process performs delivery.
— `lib/jobs/queue.ts:15`, `src/lib/mailers/index.ts:41`

**Consequence for this feature:** the request endpoint can respond in well under 300ms, and
email failures cannot block or fail the HTTP response.

### F-5: There is no token table of any kind today

The schema contains `users` and `sessions` only. No password-reset, invite, or verification
token table exists to extend. — `src/db/schema/`

**Consequence for this feature:** a new table is required. It is genuinely new surface, not
a reuse opportunity.

## Existing Constraints Discovered

- All repository methods take a transaction handle as their first argument — `src/db/repositories/base.ts:11`
- Input validation happens with Zod at the route boundary, never deeper — `src/app/auth/password/route.ts:19`
- DB columns are `snake_case`; TypeScript fields are `camelCase`, mapped in the schema files — `src/db/schema/users.ts:7`
- Logging middleware already redacts anything matching an email regex — `lib/logger.ts:29`
- Cookies are set exclusively inside `src/auth/` — no route sets one directly

## Prior Art in This Codebase

- `src/app/auth/password/route.ts` — the closest analogue: same validation, rate limiting,
  and session-creation sequence. The new endpoints should mirror its structure.
- `src/lib/mailers/welcome-mailer.ts` — the template + enqueue pattern to copy for the
  magic-link email.

## Options Considered

### Option A: Store token hashes in a new `magic_link_tokens` table

**Description:** New table with a SHA-256 hash of the token, expiry, and a redeemed marker.

**Pros:**

- Single-use enforcement is a simple database update
- Auditable; expired rows can be swept by an existing cron

**Cons:**

- Requires a migration and a new repository

**Estimated effort:** M

### Option B: Stateless signed tokens (JWT-style), no table

**Description:** Encode expiry in a signed token; verify signature only.

**Pros:**

- No migration, no storage

**Cons:**

- Cannot enforce single use — a leaked link stays valid until expiry, which AC-E2 requires
- Revocation is impossible without a denylist, which reintroduces the table

**Estimated effort:** S

## Decision

**Chosen:** Option A
**Rationale:** Single-use redemption is a hard requirement, and Option B cannot provide it
without reintroducing the storage it was meant to avoid.
**Date:** 2026-05-08
**Decided by:** team

## Open Questions for the Spec

<!-- The codebase cannot answer these — they are product decisions for Phase 1. -->

- Should the response reveal whether the email is registered? (user-enumeration tradeoff)
- What token expiry window is acceptable to users?
- Should the rate limit be per-email or per-IP, and at what threshold?

## Not Investigated

- The email worker's retry and dead-letter behavior — relevant to delivery reliability,
  not to the authentication flow itself.
- Frontend sign-in form implementation — this research covers server-side only.
- Load characteristics of the Redis instance backing the rate limiter.
