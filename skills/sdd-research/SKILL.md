---
name: sdd-research
description: Map how the existing code works before specifying a change to it.
disable-model-invocation: true
license: MIT
---

# sdd-research

Paths below are relative to this file. Resolve them before running anything.

Read `../spec-driven-development/SKILL.md`, section "Phase 0.5".
Read `../spec-driven-development/references/workflow-phases.md`, section "Phase 0.5".
Use "Codebase Research Prompt" and "Research Consolidation Prompt" in `../spec-driven-development/references/prompt-patterns.md`.
Use the template under "research.md Template" in `../spec-driven-development/references/artifact-templates.md`.

Produce: `specs/<feature>/research.md`, every finding cited `file:line`.
Gate: "Gate R" in `../spec-driven-development/references/quality-gates.md`, with "Research Verification Prompt" from the prompt file.
Validate: `node ../spec-driven-development/scripts/sdd-check.mjs specs/<feature>`
Next: `/sdd-specify`.
