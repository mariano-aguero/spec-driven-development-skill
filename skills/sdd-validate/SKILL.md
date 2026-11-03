---
name: sdd-validate
description: Check code against the spec chain, generate checklists, or analyze a spec for contradictions.
disable-model-invocation: true
license: MIT
---

# sdd-validate

Ask which: validate the implementation, generate a checklist, or analyze the spec.

Validate:
Read `../spec-driven-development/references/workflow-phases.md`, section "Phase 5".
Use "Drift Detection Prompt", "Post-Implementation Validation Prompt" and "Linear Walkthrough Prompt" in `../spec-driven-development/references/prompt-patterns.md`.
Gate: "Gate 5" and "Gate C" in `../spec-driven-development/references/quality-gates.md`.
Produce: `validation.md`, a drift report, `walkthrough.md`, formats in `../spec-driven-development/references/output-formats.md`.

Checklist: read "Generated Checklists" in `../spec-driven-development/references/quality-gates.md` and "Checklist Generation Prompt" in the prompt file.
Analyze: read "Analyze Prompt" in the prompt file and "Analyze Report" in `../spec-driven-development/references/output-formats.md`.

Run `node ../spec-driven-development/scripts/sdd-check.mjs specs/<feature>` first. Fix its findings before judging anything it cannot check.
