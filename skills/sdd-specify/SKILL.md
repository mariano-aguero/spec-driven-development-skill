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
If the request touches auth, permissions or billing, write explicit ACs for each role's allowed and denied actions and for every error case.
Open `[NEEDS CLARIFICATION]` items block Gate 1: name each one and how its answer changes the design, and offer to clarify. If the user insists, proceed: replace each marker with an explicit `Assumption:` line in the spec and report it. Never choose silently, never refuse indefinitely.
Cold read (levels M and L): run "Cold Read Prompt" in a fresh agent or session given only `spec.md` and `constitution.md`, then compare its restatement with the user's intent. List every AC phrase with more than one reading (for example "records belonging to M": created by M, or assigned to M); each is a failing Gate 1 check fixed in the spec. No fresh context available means the cold read is `inconclusive`. Do not mark the spec Approved; the human does.
Gate: "Gate 1" in `../spec-driven-development/references/quality-gates.md`, including the cold read by a reader with no context.
Validate: `node ../spec-driven-development/scripts/sdd-check.mjs specs/<feature>`
Next: `/sdd-plan` once a human approves.
Reply: `Gate 1: pass|fail|inconclusive`, one line per failing check, `ACs: N MUST, N SHOULD, N COULD`, `Open questions: N`, the spec path, and one next action. No preamble, under ~25 lines, never the spec pasted.
