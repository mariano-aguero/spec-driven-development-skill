# Data Model: Magic-Link Login

## Spec Reference

Implements: `specs/magic-link-login/spec.md` (v1.2)

## Entities

### users *(extends existing table — new feature does not redefine it)*

Reference only. The existing `users` table has `id`, `email`, `created_at`, `updated_at`.
No schema changes required for this feature beyond ensuring `email` has a unique index
(which already exists per constitution).

### magic_link_tokens

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | uuid | PK, NOT NULL, DEFAULT gen_random_uuid() | Primary key |
| email | text | NOT NULL | Lowercased email the link was issued to |
| token_hash | bytea | NOT NULL, UNIQUE | SHA-256 hash of the raw token (32 bytes) |
| expires_at | timestamptz | NOT NULL | Issued-at + 15 minutes |
| redeemed_at | timestamptz | NULL | Set when the token is successfully verified |
| request_id | text | NOT NULL | Opaque ID for log correlation |
| created_at | timestamptz | NOT NULL, DEFAULT now() | |

### Relationships

- `magic_link_tokens.email` is a denormalized copy of `users.email` at issue time. There is
  **no** foreign key — a magic link is issued before a user row may exist (AC-3 first-time login).

## Indexes

| Table | Columns | Type | Rationale |
|-------|---------|------|-----------|
| magic_link_tokens | token_hash | btree, UNIQUE | Primary lookup path on verification (AC-2, AC-E2) |
| magic_link_tokens | email, created_at DESC | btree | Rate-limit window query: count rows for email in last 15min (AC-E3) |
| magic_link_tokens | expires_at | btree | Future reaper job for expired rows (not used in v1, but cheap to add) |

## Constraints

- `CHECK (length(token_hash) = 32)` — SHA-256 output is exactly 32 bytes.
- `CHECK (expires_at > created_at)` — guards against clock or code bugs producing an already-expired row.
- `CHECK (redeemed_at IS NULL OR redeemed_at >= created_at)` — temporal sanity.

## Migrations

### Migration 001 — Create magic_link_tokens table

```sql
CREATE TABLE magic_link_tokens (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email         text NOT NULL,
    token_hash    bytea NOT NULL UNIQUE,
    expires_at    timestamptz NOT NULL,
    redeemed_at   timestamptz NULL,
    request_id    text NOT NULL,
    created_at    timestamptz NOT NULL DEFAULT now(),
    CHECK (length(token_hash) = 32),
    CHECK (expires_at > created_at),
    CHECK (redeemed_at IS NULL OR redeemed_at >= created_at)
);

CREATE INDEX magic_link_tokens_email_created_at_idx
    ON magic_link_tokens (email, created_at DESC);

CREATE INDEX magic_link_tokens_expires_at_idx
    ON magic_link_tokens (expires_at);
```

**Rollback:** `DROP TABLE magic_link_tokens;`
