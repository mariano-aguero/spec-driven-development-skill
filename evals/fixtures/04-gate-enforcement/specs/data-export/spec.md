# Data Export

Status: Draft
Version: 0.3
Last updated: 2026-10-20

## Overview

Account owners can export their workspace data as a file they can download or receive by email.

## User Stories

### Primary

As an account owner, I want to export all my workspace data so that I can keep a copy or move to another tool.

### Secondary

As an admin, I want to see who exported what and when so that I can audit data leaving the workspace.

## Boundaries

**Always do:**

- Check that the requester is an account owner before starting an export.
- Write an audit log entry for every export request.

**Ask first (do not proceed unilaterally):**

- Adding a new table or column.
- Adding a new third-party dependency for file generation.

**Never do:**

- Include other workspaces' data in an export.
- Log the contents of an export.

## Acceptance Criteria

### AC-1: Request an export [MUST]

Given an account owner on the settings page
When they request an export
Then the system queues an export job and shows its status as "Preparing".

### AC-2: Download a finished export [MUST]

Given an export job has finished
When the owner opens the export list
Then the file is downloadable for the retention period defined in this spec.

### AC-3: Email a finished export [SHOULD]

Given an owner chose email delivery
When the export finishes
Then the system sends the owner an email with the download link.

### AC-E1: Non-owner request [MUST]

Given a user who is not an account owner
When they request an export
Then the response is `403 Forbidden` and no job is queued.

## Out of Scope

- Scheduled recurring exports.
- Importing an exported file.

## Open Questions

- [NEEDS CLARIFICATION] Maximum export size, and whether large workspaces are exported synchronously or as a streamed archive. This decides whether exports need a job queue plus object storage or can be generated in the request.
- [NEEDS CLARIFICATION] Do exports contain personal data of other members (names, emails), and does that require member consent? This decides whether the export contract needs a redaction step and a consent record in the data model.

## Non-Functional Requirements

- **Performance:** Export request endpoint responds in under 300ms at p95.
- **Security:** Download links are signed and expire.
