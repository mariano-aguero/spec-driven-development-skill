# Magic-Link Login

Status: Approved (Gate 1 passed)
Version: 1.2
Last updated: 2026-05-10

## Overview

Allow users to sign in by entering their email address and clicking a one-time link sent
to their inbox — no password required.

## User Stories

### Primary

As a returning user, I want to sign in with just my email address so that I don't have
to remember a password.

### Secondary

As a new user, I want to sign up the same way I sign in so that the first-run experience
is one step instead of two.

As a security-conscious user, I want the link to expire quickly and be single-use so that
a leaked email doesn't grant unbounded access.

As an operator, I want abusive request volume to be rate-limited so that a botnet cannot
generate millions of magic-link emails on my domain's reputation.

## Boundaries

**Always do:**
- Validate the email format with Zod before any side effect.
- Hash magic-link tokens (SHA-256) before storing them; compare with constant-time equality.
- Log only the email's domain and an opaque request ID — never the full address or the token.

**Ask first (do not proceed unilaterally):**
- Adding a new database table or column not in `data-model.md`.
- Adding a new transactional email template.
- Extending the magic-link payload to carry anything beyond the user identifier.

**Never do:**
- Skip authentication on `/auth/magic-link/verify`'s side effects (it must create a session).
- Log the full email address, the raw token, or the hashed token.
- Allow a magic link to be redeemed more than once.
- Allow the same user to receive more than 3 magic-link emails in a 15-minute window.

## Acceptance Criteria

### AC-1: Request a magic link [MUST]

Given an unauthenticated visitor on `/sign-in`
When they submit a valid email address
Then the system creates a magic-link record, sends an email with a one-time URL,
   and returns `202 Accepted` with no information about whether the email is registered.

### AC-2: Successful verification creates a session [MUST]

Given a user clicks a valid, unexpired, unredeemed magic link
When the verification endpoint validates the token
Then the system marks the token redeemed, creates a session cookie, and redirects to `/dashboard`.

### AC-3: First-time login creates a user [MUST]

Given the email in a redeemed magic link is not associated with any existing user
When verification succeeds
Then the system creates a new `users` row with that email and creates the session.

### AC-4: Tokens expire [MUST]

Given a magic link was issued more than 15 minutes ago
When the user clicks it
Then verification fails with `410 Gone` and the user is redirected to `/sign-in?error=expired`.

### AC-5: Pre-fill email on resend [SHOULD]

Given a user lands on `/sign-in?error=expired` with their email previously entered
When the sign-in form renders
Then the email field is pre-filled and a "Resend link" button is the primary action.

### AC-6: Remember-this-device [COULD]

If implemented, a checkbox extends session lifetime from 24 hours to 30 days.
Out of scope for the first iteration — kept here as an `[COULD]` for traceability.

### AC-7: Social login [WONT]

This feature will NOT include OAuth / social login (Google, GitHub, etc.).
Reason: scope kept tight for the first iteration; social login will be a separate spec.

### Error and edge case ACs

### AC-E1: Invalid email format [MUST]

Given the request body's `email` field fails Zod validation
When the request reaches the route handler
Then the response is `400 Bad Request` with error code `VALIDATION_ERROR` and the system
   does not write to the database or send an email.

### AC-E2: Token already redeemed [MUST]

Given a magic link that was already successfully verified once
When the same link is clicked again
Then verification fails with `410 Gone` and the user is redirected to `/sign-in?error=used`.

### AC-E3: Rate limit exceeded [MUST]

Given an email address has been used to request 3 magic links in the last 15 minutes
When a 4th request arrives for that email
Then the system responds with `429 Too Many Requests`, sets `Retry-After`, and does NOT
   send another email or write a new magic-link record.

## Out of Scope

- Password-based login (intentionally excluded — magic link is the only auth method in v1).
- OAuth / social login providers.
- Multi-factor authentication.
- Account recovery flows beyond requesting a new magic link.
- Admin-impersonation login.

## Open Questions

- [RESOLVED] Should the email reveal whether the address is registered? → Decision: No. Always return `202 Accepted` regardless of whether the email exists, to avoid user enumeration.
- [RESOLVED] What expiry window? → Decision: 15 minutes (balance between user-experience patience and exposure window).
- [RESOLVED] What's the rate limit? → Decision: 3 requests per email per 15 minutes (per-email, not per-IP, since legitimate users may share a NAT).

## Non-Functional Requirements

- **Performance:** Request endpoint responds in < 300ms at p95 (excluding email delivery, which is async).
- **Security:** Magic-link tokens are 32 bytes (256 bits) of cryptographic randomness, base64url-encoded. Stored only as SHA-256 hashes. Constant-time comparison on verification.
- **Reliability:** Email send failures must not block the HTTP response — emails are enqueued via the existing job queue (`lib/jobs/`).
- **Privacy:** Logs include only domain (`example.com`) and request ID, never the full email or token.
