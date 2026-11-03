# User Auth

Status: Validated
Version: 1.1
Last updated: 2026-08-14

## Overview

Users sign in with email and password. Sessions are cookie based.

## User Stories

### Primary

As a returning user, I want to sign in with my email and password so that I can reach my account.

### Secondary

As a user, I want my account locked after repeated failures so that nobody can guess my password.

## Acceptance Criteria

### AC-1: Sign in [MUST]

Given valid credentials
When the user submits the sign-in form
Then the system creates a session and returns `200`.

### AC-2: Session lifetime [MUST]

Given a signed-in user
When 24 hours pass without activity
Then the session expires.

### AC-3: Lockout [MUST]

Given 5 failed sign-in attempts for one email in 15 minutes
When a 6th attempt arrives
Then the system responds `429` and does not check the password.

### AC-4: Password length [MUST]

Given a registration or password change
When the password is shorter than 8 characters
Then the system responds `400` with `WEAK_PASSWORD`.

### AC-5: Session cookie flags [MUST]

Given a session is created
When the cookie is set
Then it is `HttpOnly`, `Secure` and `SameSite=Lax`.

## Out of Scope

- Social login.
- Multi-factor authentication.

## Open Questions

- None.
