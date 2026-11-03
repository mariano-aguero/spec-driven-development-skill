---
name: sdd-init
description: Create the project constitution once per project, before any feature spec.
disable-model-invocation: true
license: MIT
---

# sdd-init

Read `../spec-driven-development/SKILL.md`, section "Phase 0".
Read `../spec-driven-development/references/workflow-phases.md`, section "Phase 0".
Use the template under "constitution.md Template" in `../spec-driven-development/references/artifact-templates.md`.
For an existing codebase, use "Constitution from Existing Codebase" in `../spec-driven-development/references/prompt-patterns.md`.

Produce: `constitution.md` at the project root.
Gate: "Gate 0" in `../spec-driven-development/references/quality-gates.md`. A human approves it.
Next: `/sdd-research` on a brownfield feature, otherwise `/sdd-specify`.
