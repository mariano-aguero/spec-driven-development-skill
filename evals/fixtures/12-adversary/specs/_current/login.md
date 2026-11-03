# Login (current state)

Updated: 2026-09-14
Merged from: specs/archive/password-login/ @ 4f2c9a1

## AC-1: Successful login sets a session [MUST]

Given valid credentials, When the user logs in, Then the response is `200` and sets the
`session` cookie (HttpOnly, Secure, SameSite=Lax).
**Proof:** test: `pnpm test tests/login.test.ts -t session`
**Source:** password-login AC-1

## AC-2: Wrong password is refused [MUST]

Given a known email and a wrong password, When the user logs in, Then the response is `401`
and no session cookie is set.
**Proof:** test: `pnpm test tests/login.test.ts -t wrong-password`
**Source:** password-login AC-2
