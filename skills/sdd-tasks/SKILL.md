---
name: sdd-tasks
description: Break an approved plan into tasks.md, or extract the next task to implement.
disable-model-invocation: true
license: MIT
---

# sdd-tasks

Read `../spec-driven-development/SKILL.md`, section "5-Phase Workflow".
Read `../spec-driven-development/references/workflow-phases.md`, sections "Phase 3" and "Phase 4".
Use "Task Breakdown Prompt" and "Task Validation Prompt" in `../spec-driven-development/references/prompt-patterns.md`.
Use the template under "tasks.md Template" in `../spec-driven-development/references/artifact-templates.md`.

Ask which: break down the plan, or take the next task.
Breakdown produces `tasks.md`. Gate: "Gate 3" in `../spec-driven-development/references/quality-gates.md`.
Next task: read "Single Task Implementation Prompt" in the prompt file, extract one open task with its ACs and contract, implement it, then run "Gate 4".
Validate: `node ../spec-driven-development/scripts/sdd-check.mjs specs/<feature>`
Next: `/sdd-validate` when all tasks are done.
