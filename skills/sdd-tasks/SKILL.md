---
name: sdd-tasks
description: Break an approved plan into tasks.md, or extract the next task to implement.
disable-model-invocation: true
license: MIT
---

# sdd-tasks

Paths below are relative to this file. Resolve them before running anything.

Read `../spec-driven-development/SKILL.md`, section "5-Phase Workflow".
Read `../spec-driven-development/references/workflow-phases.md`, sections "Phase 3" and "Phase 4".
Use "Task Breakdown Prompt" and "Task Validation Prompt" in `../spec-driven-development/references/prompt-patterns.md`.
Use the template under "tasks.md Template" in `../spec-driven-development/references/artifact-templates.md`.

Ask which: break down the plan, or take the next task.
Breakdown produces `tasks.md`. Gate: "Gate 3" in `../spec-driven-development/references/quality-gates.md`.
Next task: read "Single Task Implementation Prompt" in the prompt file, extract one open task with its ACs and contract, implement it, then run "Gate 4".
Gate 4 checker: "green" is not evidence. Require the failing-before run with its failure quoted. A test that asserts on data it built itself or never calls the code under test cannot fail: replace or delete it and record its AC as unproven, never keep it as coverage. Show what a valid proof calls and asserts. The verdict is `fail` or `inconclusive` for those ACs, never `pass`.
Validate: `node ../spec-driven-development/scripts/sdd-check.mjs specs/<feature>`
Next: `/sdd-validate` when all tasks are done.
