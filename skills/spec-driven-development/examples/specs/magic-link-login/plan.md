# Technical Plan: Magic-Link Login

## Spec Reference

Implements: `specs/magic-link-login/spec.md` (v1.2)

## Architecture Overview

The flow is split into two endpoints connected by a single-use token. `POST /auth/magic-link`
generates a 32-byte token, stores its SHA-256 hash in the `magic_link_tokens` table, and
enqueues a transactional email. `GET /auth/magic-link/verify` re-hashes the incoming token,
performs a constant-time lookup, marks the row redeemed, and issues a session via the existing
`auth/` module. Rate limiting runs in middleware against the email's domain bucket before any
DB write.

## Component Breakdown

### MagicLinkRequestHandler

- **Responsibility:** Validate input, enforce rate limit, create token, enqueue email.
- **Location:** `src/app/auth/magic-link/route.ts`
- **Accepts:** `{ email: string }` (Zod validated)
- **Returns:** `202 Accepted` (always — no user enumeration)
- **AC Coverage:** AC-1, AC-E1, AC-E3

### MagicLinkVerifyHandler

- **Responsibility:** Hash incoming token, look up row, check expiry & redemption, create session, redirect.
- **Location:** `src/app/auth/magic-link/verify/route.ts`
- **Accepts:** Query string `?token=<base64url>`
- **Returns:** `302 Found` to `/dashboard` (success) or `/sign-in?error=...` (failure)
- **AC Coverage:** AC-2, AC-3, AC-4, AC-E2

### MagicLinkTokenRepository

- **Responsibility:** Type-safe DB access for `magic_link_tokens`. Encapsulates the hash-and-lookup pattern.
- **Location:** `src/db/repositories/magic-link-token-repository.ts`
- **Accepts:** Drizzle DB handle
- **Returns:** Repository methods (`create`, `findByTokenHash`, `markRedeemed`, `countRecentByEmail`)
- **AC Coverage:** AC-1, AC-2, AC-3, AC-4, AC-E2, AC-E3

### MagicLinkMailer

- **Responsibility:** Compose and enqueue the magic-link email via the existing job queue.
- **Location:** `src/lib/mailers/magic-link-mailer.ts`
- **Accepts:** `{ email: string, token: string, requestId: string }`
- **Returns:** `Promise<void>` (resolves when job enqueued, not when email delivered)
- **AC Coverage:** AC-1

## Technology Choices

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Token generation | `crypto.randomBytes(32)` + base64url | Standard library — no dep; 256-bit entropy is well above brute-force threshold |
| Token storage | SHA-256 hash in DB | Per `constitution.md` — security tokens must be hashed at rest |
| Rate limiter | `lib/rate-limit.ts` (existing) | Already in the stack; supports per-key sliding window |
| Email delivery | Resend via existing `lib/jobs/` queue | Per constitution; non-blocking for HTTP response |
| Session creation | Existing `auth/` module's `createSession()` | Per constitution — never duplicate auth logic |

## Integration Points

- **Rate limiter (`lib/rate-limit.ts`):** Called with key `magic-link:${email.toLowerCase()}`, window 15min, limit 3.
- **Email job queue (`lib/jobs/queue.ts`):** Enqueues `magic-link-email` job; worker is a separate, pre-existing process.
- **Session module (`src/auth/sessions.ts`):** `createSession(userId, response)` already attaches the cookie correctly.

## AC Coverage Map

| AC | Component(s) | Contract(s) |
|----|-------------|-------------|
| AC-1 | MagicLinkRequestHandler, MagicLinkTokenRepository, MagicLinkMailer | [contracts/auth-api.md](contracts/auth-api.md#post-authmagic-link) |
| AC-2 | MagicLinkVerifyHandler, MagicLinkTokenRepository | [contracts/auth-api.md](contracts/auth-api.md#get-authmagic-linkverify) |
| AC-3 | MagicLinkVerifyHandler | [contracts/auth-api.md](contracts/auth-api.md#get-authmagic-linkverify) |
| AC-4 | MagicLinkVerifyHandler, MagicLinkTokenRepository | [contracts/auth-api.md](contracts/auth-api.md#get-authmagic-linkverify) |
| AC-E1 | MagicLinkRequestHandler | [contracts/auth-api.md](contracts/auth-api.md#post-authmagic-link) |
| AC-E2 | MagicLinkVerifyHandler, MagicLinkTokenRepository | [contracts/auth-api.md](contracts/auth-api.md#get-authmagic-linkverify) |
| AC-E3 | MagicLinkRequestHandler (rate-limit middleware) | [contracts/auth-api.md](contracts/auth-api.md#post-authmagic-link) |

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Email delivery delay > expiry window (legitimate user misses the link) | Medium | Medium | 15min expiry chosen to absorb p99 delivery; AC-5 lets user resend without re-entering email |
| Token collision (extremely unlikely with 256-bit entropy, but constant-time lookup matters) | Very Low | High | Lookup keyed on SHA-256 hash with unique index; constant-time string compare |
| Rate-limit bypass via case variations in email (`User@example.com` vs `user@example.com`) | Medium | High | Normalize email to lowercase before rate-limit key construction and DB lookup |
| Replay attack (attacker captures a still-valid token from email or logs) | Medium | High | Per-token redemption flag enforces single-use; token never written to logs (constitution); transport over HTTPS only |

## Out of Scope (Technical)

- No new dependencies — uses existing libraries only.
- No background reaper job for expired tokens — expiry is checked at verification time. (Cleanup deferred to a future migration if table size becomes an issue.)
- No multi-region replication of the `magic_link_tokens` table; single-region writes acceptable for a 15-minute TTL row.
