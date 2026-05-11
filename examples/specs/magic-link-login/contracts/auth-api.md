# API Contract: Magic-Link Authentication

**Status: LOCKED** (Gate 2 approved 2026-05-10 — modifications require `/sdd:amend`).

---

## POST /auth/magic-link

### Description

Request a magic-link login email. Always returns `202 Accepted` regardless of whether the
email is registered — prevents user enumeration.

### Authentication

`[PUBLIC]` — no session required.

### Rate limit

3 requests per email address (lowercased) per 15 minutes. Exceeding returns `429`.

### Request

**Request Body:**

```json
{
  "email": "string — RFC 5322 email; max 254 chars; lowercased server-side before any side effect"
}
```

### Response

**Success (202 Accepted):**

```json
{
  "status": "accepted",
  "requestId": "string — opaque correlation ID for support/logs"
}
```

**Error Codes:**

| Status | Code | When |
|--------|------|------|
| 400 | VALIDATION_ERROR | Body fails Zod validation (missing/invalid `email`) |
| 429 | RATE_LIMITED | Email exceeded 3 requests in last 15 min. Includes `Retry-After` header |

**Error response shape:**

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "string — human-readable; never echoes the input value",
    "requestId": "string"
  }
}
```

### AC Coverage

- AC-1: Issues the magic link record + enqueues email.
- AC-E1: Returns 400 on invalid email format.
- AC-E3: Returns 429 when rate limit exceeded.

---

## GET /auth/magic-link/verify

### Description

Verify a magic-link token. On success, creates a session and redirects to `/dashboard`.
On failure, redirects to `/sign-in` with a query-string error code.

### Authentication

`[PUBLIC]` — no session required (this endpoint *creates* the session).

### Rate limit

Not applied. The token itself is the rate limiter (single-use, time-bound).

### Request

**Query Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| token | string | yes | Base64url-encoded raw token (43 chars for 32 bytes) |

### Response

**Success (302 Found):**

- `Location: /dashboard`
- `Set-Cookie: <session cookie per auth/sessions.ts>`

**Failure (302 Found):**

- `Location: /sign-in?error=<code>`
- No `Set-Cookie` header.

**Error codes (in `?error=` query string):**

| `error=` value | When |
|---------------|------|
| `invalid` | Token does not match any row in `magic_link_tokens` |
| `expired` | Token row exists but `expires_at` has passed (AC-4) |
| `used` | Token row exists but `redeemed_at` is non-null (AC-E2) |
| `malformed` | Token query param missing or wrong length/encoding |

### AC Coverage

- AC-2: Creates session and redirects to `/dashboard` on valid token.
- AC-3: Creates a new `users` row when the email isn't yet registered.
- AC-4: Redirects with `?error=expired` for tokens past TTL.
- AC-E2: Redirects with `?error=used` for already-redeemed tokens.
