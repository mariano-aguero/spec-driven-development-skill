# Shorten Magic-Link TTL

Status: Approved (Gate 1 passed)
Version: 1.0
Mode: Delta
Baseline: `examples/specs/magic-link-login/spec.md` @ v1.2
Last updated: 2026-08-06

## Change Summary

A security review flagged the 15-minute magic-link window as too wide for admin accounts.
Shorten the window to 5 minutes and make the expiry message actionable, without changing how
links are issued, hashed, or redeemed.

## Baseline Assertion

<!-- What this change depends on being true today. If a line here is false, this spec is
     invalid — not merely incomplete. -->

- Magic-link tokens expire 15 minutes after issue — baseline AC-4
- Expired links redirect to `/sign-in?error=expired` — baseline AC-4
- Tokens are single-use; redemption is enforced by a `redeemed_at` marker — baseline AC-E2
- Rate limiting is 3 requests per email per 15 minutes — baseline AC-E3
- Expiry is evaluated at verification time, not by a background sweep — baseline `plan.md`
  § Verification Endpoint

## Acceptance Criteria

### AC-1: Shorten the expiry window [MODIFIED] [MUST]

**Was:** "Given a magic link was issued more than 15 minutes ago, when the user clicks it,
then verification fails with `410 Gone` and the user is redirected to
`/sign-in?error=expired`." — baseline AC-4

**Now:**
Given a magic link was issued more than 5 minutes ago
When the user clicks it
Then verification fails with `410 Gone` and the user is redirected to `/sign-in?error=expired`.

**Migration:** Links issued before deploy keep their original 15-minute window — expiry is
computed from a stored `expires_at`, not from a constant applied at read time. No backfill,
no invalidation of links already in inboxes.

### AC-2: Expiry message states the new window [MODIFIED] [SHOULD]

**Was:** "the email field is pre-filled and a 'Resend link' button is the primary action."
— baseline AC-5

**Now:**
Given a user lands on `/sign-in?error=expired`
When the sign-in form renders
Then the email field is pre-filled, a "Resend link" button is the primary action, and the
   page states that links are valid for 5 minutes.

**Migration:** Copy-only change; no stored data is affected.

### AC-3: Rate limit window decouples from expiry [MODIFIED] [MUST]

**Was:** "Given an email address has been used to request 3 magic links in the last 15
minutes, when a 4th request arrives for that email, then the system responds with
`429 Too Many Requests`." — baseline AC-E3

**Now:**
Given an email address has been used to request 3 magic links in the last 15 minutes
When a 4th request arrives for that email
Then the system responds with `429 Too Many Requests` and sets `Retry-After`.

The rate-limit window stays at 15 minutes. This AC exists because the two windows were
previously the same number and are now different — leaving it implicit invites a future
change to "align" them.

**Migration:** None. Behavior is unchanged; only its independence from the TTL is now explicit.

### AC-4: Single-use enforcement [UNCHANGED] [MUST]

Redeemed tokens remain unusable — a second click returns `410 Gone` and redirects to
`/sign-in?error=used`. — baseline AC-E2. Must still hold.

### AC-5: Token hashing and comparison [UNCHANGED] [MUST]

Tokens remain 32 bytes of cryptographic randomness, stored only as SHA-256 hashes and
compared in constant time. — baseline Non-Functional Requirements. Must still hold.

### AC-6: First-time login still creates a user [UNCHANGED] [MUST]

Verification of a link for an unregistered email still creates the user and the session.
— baseline AC-3. Must still hold.

## Blast Radius

| Changing | What depends on it | Verified by |
|----------|--------------------|-------------|
| Token TTL constant | Issue path, verification path, email copy | AC-1, AC-2 |
| `magic_link_tokens.expires_at` | Verification query; expired-row sweep cron | AC-1, AC-4 |
| Sign-in error page copy | End-to-end sign-in test fixtures | AC-2 |
| *(not changing)* rate-limit key and window | Abuse protection | AC-3 |

## Out of Scope

- Per-role TTLs. The review raised admin accounts specifically; a single shorter window
  covers the risk without adding a branch. Revisit if support load increases.
- Changing the rate limit itself.
- Any change to hashing, session creation, or the job queue.

## Open Questions

- [RESOLVED] Should links already in inboxes be invalidated on deploy? → No. `expires_at` is
  stored per token, so in-flight links keep their original window. Invalidating them would
  sign out users mid-flow for no security gain — those links were issued under a policy that
  was acceptable an hour earlier.
