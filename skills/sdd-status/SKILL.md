---
name: sdd-status
description: Report which phase a feature is in and the next action.
disable-model-invocation: true
license: MIT
---

# sdd-status

Paths below are relative to this file. Resolve them before running anything.

Read "Status Prompt" in `../spec-driven-development/references/prompt-patterns.md`.
Read "Status Report" in `../spec-driven-development/references/output-formats.md` for the format. Budget: 12 lines.

Read the artifacts on disk under `specs/` and run `node ../spec-driven-development/scripts/sdd-check.mjs specs` for gate and status findings.
Produce: the status report in chat. Write no file.
