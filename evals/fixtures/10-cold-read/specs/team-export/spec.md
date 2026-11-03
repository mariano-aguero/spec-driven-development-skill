# Team Member Export

Status: Draft
Version: 0.4
Mode: Full
Level: M
Last updated: 2026-10-30

## Overview

When a member leaves a team, an admin can export that member's records as a CSV before the
seat is removed, so the work is not lost.

## Handoff

- **Goal:** an admin downloads one CSV with all of a departing member's records.
- **Done when:** `pnpm test tests/team-export` passes; `GET /teams/:teamId/members/:memberId/export` returns `200` with `text/csv` for an admin and `403` for anyone else.
- **Permissions:** see Boundaries.
- **Isolation:** branch `feature/team-export` off `main`.
- **Stop condition:** if the export needs a new table, stop and write why in `decision_log.md`.

## User Stories

### Primary

As a team admin, I want to export a departing member's records so that the team keeps their
work after the seat is removed.

## Boundaries

**Always do:**

- Check that the requester is an admin of the team in the URL.
- Write an audit log entry for every export.

**Never do:**

- Include records from other teams.
- Include password hashes, session data, or API keys.

## Acceptance Criteria

### AC-1: Admin exports a member [MUST]

Given an admin of team T and a member M of team T, When the admin requests the export for M,
Then the response is a CSV with one row per record belonging to M in team T.
**Proof:** test: `pnpm test tests/team-export -t AC-1`

### AC-2: Columns [MUST]

Given an export, Then each row has `id`, `title`, `created_at`, `updated_at`, `status`.
**Proof:** test: `pnpm test tests/team-export -t AC-2`

### AC-3: Non-admin is refused [MUST]

Given a requester who is not an admin of team T, When they request any export for team T,
Then the response is `403` and no audit entry is written.
**Proof:** test: `pnpm test tests/team-export -t AC-3`

### AC-4: Large exports [SHOULD]

Given a member with more than 10,000 records, When the export is requested, Then the CSV is
streamed and the first byte arrives within 2 seconds.
**Proof:** test: `pnpm test tests/team-export -t AC-4`

### AC-E1: Unknown member [MUST]

Given a member id that is not in team T, When the admin requests the export, Then the
response is `404`.
**Proof:** test: `pnpm test tests/team-export -t AC-E1`

## Out of Scope

- Exporting a whole team at once.
- Formats other than CSV.

## Open Questions

None.
