# Magic-Link Login (current state)

Updated: 2026-08-20
Merged from: specs/archive/magic-link-login/ @ v1.2, specs/archive/magic-link-shorten-ttl/ @ v1.0

<!-- The login capability after magic-link-shorten-ttl was archived. Its [MODIFIED] ACs
     replaced the baseline wording, its [UNCHANGED] ACs added nothing, and every AC keeps the
     id it had in the feature that introduced it. A later delta spec names this file as its
     Baseline. -->

## Acceptance Criteria

### AC-1: Request a magic link [MUST]

Given an unauthenticated visitor on `/sign-in`
When they submit a valid email address
Then the system creates a magic-link record, sends an email with a one-time URL,
   and returns `202 Accepted` with no information about whether the email is registered.
**Proof:** test: `pnpm vitest run tests/integration/magic-link-request.test.ts`
**Source:** magic-link-login AC-1

### AC-2: Successful verification creates a session [MUST]

Given a user clicks a valid, unexpired, unredeemed magic link
When the verification endpoint validates the token
Then the system marks the token redeemed, creates a session cookie, and redirects to `/dashboard`.
**Proof:** test: `pnpm vitest run tests/integration/magic-link-verify.test.ts -t "AC-2"`
**Source:** magic-link-login AC-2

### AC-3: First-time login creates a user [MUST]

Given the email in a redeemed magic link is not associated with any existing user
When verification succeeds
Then the system creates a new `users` row with that email and creates the session.
**Proof:** test: `pnpm vitest run tests/integration/magic-link-verify.test.ts -t "AC-3"`
**Source:** magic-link-login AC-3

### AC-4: Tokens expire after 5 minutes [MUST]

Given a magic link was issued more than 5 minutes ago
When the user clicks it
Then verification fails with `410 Gone` and the user is redirected to `/sign-in?error=expired`.
Expiry is computed from each token's stored `expires_at`.
**Proof:** test: `pnpm vitest run tests/integration/magic-link-verify.test.ts -t "AC-4"`
**Source:** magic-link-login AC-4, modified by magic-link-shorten-ttl AC-1 (was 15 minutes)

### AC-5: Pre-fill email on resend [SHOULD]

Given a user lands on `/sign-in?error=expired` with their email previously entered
When the sign-in form renders
Then the email field is pre-filled, a "Resend link" button is the primary action, and the
   page states that links are valid for 5 minutes.
**Source:** magic-link-login AC-5, modified by magic-link-shorten-ttl AC-2

### AC-E1: Invalid email format [MUST]

Given the request body's `email` field fails Zod validation
When the request reaches the route handler
Then the response is `400 Bad Request` with error code `VALIDATION_ERROR` and the system
   does not write to the database or send an email.
**Proof:** test: `pnpm vitest run tests/integration/magic-link-request.test.ts -t "AC-E1"`
**Source:** magic-link-login AC-E1

### AC-E2: Token already redeemed [MUST]

Given a magic link that was already successfully verified once
When the same link is clicked again
Then verification fails with `410 Gone` and the user is redirected to `/sign-in?error=used`.
**Proof:** test: `pnpm vitest run tests/integration/magic-link-verify.test.ts -t "AC-E2"`
**Source:** magic-link-login AC-E2

### AC-E3: Rate limit exceeded, 15-minute window [MUST]

Given an email address has been used to request 3 magic links in the last 15 minutes
When a 4th request arrives for that email
Then the system responds with `429 Too Many Requests`, sets `Retry-After`, and does not
   send another email or write a new magic-link record.
The rate-limit window stays at 15 minutes and does not follow the token TTL.
**Proof:** test: `pnpm vitest run tests/integration/magic-link-request.test.ts -t "AC-E3"`
**Source:** magic-link-login AC-E3, modified by magic-link-shorten-ttl AC-3

## Non-Functional Requirements

- Tokens are 32 bytes of cryptographic randomness, stored only as SHA-256 hashes, compared
  in constant time. Source: magic-link-login NFR, held by magic-link-shorten-ttl AC-5.

## Not current

- AC-6 Remember-this-device `[COULD]` and AC-7 Social login `[WONT]` were never built. They
  stay in the archived spec and are not part of the current state.
