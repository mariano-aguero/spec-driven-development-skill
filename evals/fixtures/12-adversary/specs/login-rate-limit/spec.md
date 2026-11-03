# Login Rate Limit

Status: In Progress
Version: 1.0
Mode: Delta
Baseline: specs/_current/login.md
Level: M
Last updated: 2026-10-31

## Change Summary

Failed password logins are limited per account to stop credential stuffing.

## Acceptance Criteria

### AC-1: Lock after five failures [ADDED] [MUST]

Given five failed logins for the same account within 15 minutes, When a sixth login is
attempted for that account, Then the response is `429` with `Retry-After`, whatever the
password. The account is identified by its email, compared case-insensitively.
**Proof:** test: `pnpm test tests/rate-limit.test.ts -t AC-1`

### AC-2: Window resets [ADDED] [MUST]

Given an account locked by AC-1, When 15 minutes pass with no attempt, Then a login with the
right password succeeds.
**Proof:** test: `pnpm test tests/rate-limit.test.ts -t AC-2`

### AC-3: Successful login sets a session [UNCHANGED]

"Given valid credentials, When the user logs in, Then the response is `200` and sets the
`session` cookie (HttpOnly, Secure, SameSite=Lax)." (`specs/_current/login.md`, AC-1)
**Proof:** test: `pnpm test tests/login.test.ts -t session`

## Out of Scope

- Per-IP limits.
