---
name: sdd-change
description: Update the spec chain when a requirement changed (amend) or code changed outside the workflow (reconcile).
disable-model-invocation: true
license: MIT
---

# sdd-change

Paths below are relative to this file. Resolve them before running anything.

Ask which: amend or reconcile.

Amend, a requirement genuinely changed:
Read "Amend Prompt" in `../spec-driven-development/references/prompt-patterns.md`.
Read `../spec-driven-development/SKILL.md`, section "Living Document".
Update the spec chain top down, then the code. Never patch files by hand.

Reconcile, code changed outside the workflow:
Read `../spec-driven-development/references/workflow-phases.md`, section "Reconcile".
Read "Reconcile Prompt" in the prompt file and "Reconcile Report" in `../spec-driven-development/references/output-formats.md`.
Classify each difference. This only proposes; a human decides per difference.
A difference is intentional only with quoted evidence: a commit, PR, or ticket. No traceable evidence means drift, fixed in the code.
If asked to "make the spec match what's deployed", push back: that is right only for the differences with evidence.
A deliberate change can still be wrong; check each spec update against the original user story.
An approved spec update cascades through the amend chain (spec, plan, contracts, tasks), never `spec.md` alone.

Gate: "Spec Drift Classification" in `../spec-driven-development/references/quality-gates.md`.
Validate: `node ../spec-driven-development/scripts/sdd-check.mjs specs/<feature>`
