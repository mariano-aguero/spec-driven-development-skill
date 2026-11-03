---
name: sdd-validate
description: Check code against the spec chain, generate checklists, or analyze a spec for contradictions.
disable-model-invocation: true
license: MIT
---

# sdd-validate

Paths below are relative to this file. Resolve them before running anything.

Ask which: validate the implementation, generate a checklist, or analyze the spec.

Validate:
Read `../spec-driven-development/references/workflow-phases.md`, section "Phase 5".
Use "Drift Detection Prompt", "Post-Implementation Validation Prompt" and "Linear Walkthrough Prompt" in `../spec-driven-development/references/prompt-patterns.md`.
Gate: "Gate 5" and "Gate C" in `../spec-driven-development/references/quality-gates.md`.
Produce: `validation.md`, a drift report, `walkthrough.md`, formats in `../spec-driven-development/references/output-formats.md`.
Adversary (levels M and L): use "Adversary Prompt". Run it in an agent that did not write the code, in its own worktree or scratch copy, on a different model family when available. It tries to break each `[MUST]` and `[UNCHANGED]` AC against the real code. Findings from the authoring session do not count as this check.
A plausible bypass found by reading is worth reproducing: state the command and the output that would confirm it. A finding is confirmed only with a command, its output, and the output the spec requires. Everything else goes to a `Dropped` list with a reason each; naming and style findings are dropped as out of scope.
Gate 5 stays `fail` or `inconclusive` until every finding is rerun or dropped.

Checklist: read "Generated Checklists" in `../spec-driven-development/references/quality-gates.md` and "Checklist Generation Prompt" in the prompt file.
Analyze: read "Analyze Prompt" in the prompt file and "Analyze Report" in `../spec-driven-development/references/output-formats.md`.

Run `node ../spec-driven-development/scripts/sdd-check.mjs specs/<feature>` first. Fix its findings before judging anything it cannot check.
