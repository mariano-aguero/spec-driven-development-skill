---
name: sdd-specify
description: Write or refine spec.md, covering assumptions, acceptance criteria, clarify, and the cold read.
disable-model-invocation: true
license: MIT
---

# sdd-specify

Paths below are relative to this file. Resolve them before running anything.

Read `../spec-driven-development/SKILL.md`, section "Phase 1".
Read `../spec-driven-development/references/workflow-phases.md`, section "Phase 1" and, for a change to existing behavior, "Delta Specs".
Use "Assumptions Surface Prompt" and "Initial Specification Prompt" in `../spec-driven-development/references/prompt-patterns.md`.
If `spec.md` has open questions, run "Clarify Phase Prompt" and "Post-Clarify Spec Update Prompt" from the same file.
Use the template under "spec.md Template" in `../spec-driven-development/references/artifact-templates.md`.

Produce: `specs/<feature>/spec.md`, MoSCoW-prioritized ACs, each `[MUST]` with a proof line.
Gate: "Gate 1" in `../spec-driven-development/references/quality-gates.md`, including the cold read by a reader with no context.
Validate: `node ../spec-driven-development/scripts/sdd-check.mjs specs/<feature>`
Next: `/sdd-plan` once a human approves.
