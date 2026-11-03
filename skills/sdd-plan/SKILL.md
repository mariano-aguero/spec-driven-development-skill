---
name: sdd-plan
description: Turn an approved spec into plan.md, data-model.md, and contracts.
disable-model-invocation: true
license: MIT
---

# sdd-plan

Paths below are relative to this file. Resolve them before running anything.

Read `../spec-driven-development/SKILL.md`, section "5-Phase Workflow".
Read `../spec-driven-development/references/workflow-phases.md`, section "Phase 2".
Use "Technical Plan Generation Prompt" and "Plan Review Prompt" in `../spec-driven-development/references/prompt-patterns.md`.
Use the templates under "plan.md Template", "data-model.md Template" and "contracts/[endpoint].md Template" in `../spec-driven-development/references/artifact-templates.md`.

Needs: `spec.md` with Status Approved, and `constitution.md`.
Open `[NEEDS CLARIFICATION]` items in `spec.md` block this phase: name each and why it changes the architecture, and offer `/sdd-specify` to clarify. If the user insists, proceed: replace each marker in `spec.md` with an explicit `Assumption:` line, then report the Gate 1 verdict with the failing checks named.
Produce: `plan.md`, `data-model.md`, `contracts/`.
Gate: "Gate 2" in `../spec-driven-development/references/quality-gates.md`.
Validate: `node ../spec-driven-development/scripts/sdd-check.mjs specs/<feature>`
Next: `/sdd-tasks`.
