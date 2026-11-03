---
name: spec-driven-development
license: MIT
description: >
  Structures feature work for AI coding agents into gated phases (research, spec, plan,
  tasks, implement, validate), each producing a short reviewable artifact that constrains
  the next. Use when requirements are informal or drift-prone, when the same prompt produces
  different implementations across sessions, or when a feature touches auth, database schema,
  or API contracts. Keywords: spec-driven development, SDD, spec.md, plan.md, tasks.md,
  constitution.md, acceptance criteria, drift detection.
---

# Spec-Driven Development

## Overview

In SDD the specification is the source of truth and code serves it. Without a spec, the
agent makes thousands of micro-decisions silently. With one, you make them explicitly before
any code exists.

## Quick Start

1. `/sdd-init` creates `constitution.md`, once per project, before any feature spec.
2. `/sdd-research [description]` maps how the existing code works, cited `file:line`. Skip on greenfield.
3. Surface and correct the agent's implicit assumptions before any AC is written.
4. `/sdd-specify [description]` writes `spec.md` with MoSCoW-prioritized ACs.
5. Follow the gates: Clarify, Plan, Tasks, Implement, Validate. A human approves intent gates; a separate checker passes evidence gates.

Step-by-step detail: `references/workflow-phases.md`.

## When to Use

- The agent ignores constraints, or one prompt yields different implementations across sessions
- Requirements have several stakeholders or cross-cutting concerns
- The feature touches auth, billing, the data model, API contracts, or database schema

**Skip entirely for:** one-line fixes, typos, disposable prototypes, and solo spikes under a day.

**Auth, permissions, or billing in the request** means the spec must carry explicit ACs for
who may do what (each role, each denied action) and for every error case. Say so in the
first reply, before proposing anything else.

## Choosing the Ceremony Level

| | **S: Light** | **M: Standard** | **L: Full** |
|---|---|---|---|
| Use when | Fits one session, ≤3 files, no schema/contract/auth change | New endpoint, table, or user-visible behavior; spans sessions | Auth, payments, migrations, regulated domains, unfamiliar code |
| Artifacts | ACs and `Done when` in the issue or PR body | `spec.md`, `plan.md`, `contracts/`, `tasks.md` | + `research.md`, `decision_log.md`, `walkthrough.md` |
| Checker | a fresh session reruns the tests: red before, green after | per evidence gate, plus mutants and an adversary | + two designs, mutation tool |
| Critics | none | optional | required |

Which gates run at each level: `references/quality-gates.md → Which Gates Apply at Which Ceremony Level`.

**Decision rule:** start at M. Drop to S only if *all* of these hold: one session, ≤3 files,
no contract or schema change, trivially revertible. Move to L if *any* of these hold: auth
or payments, irreversible data migration, regulated domain, or code nobody on the call has
read.

L ceremony on an S change is where "drowning in markdown" comes from, and S ceremony on an
L change is the reason this skill exists. The tiebreaker is **reversibility**, not size.
When you assign a level, name reversibility as the reason, and recommend a level before
asking the user to choose one.

Levels are per change. Moving up mid-flight is normal, for example promoting S to M once a
schema change appears. Moving down discards a gate you already decided you needed.

## Key Practice: Reframe Vague Requirements

Convert vague requirements into measurable targets before writing any AC: "make it faster"
becomes "LCP < 2.5s on a 4G connection". **If you cannot write a failing test for an AC, the
AC is not concrete enough.** Worked conversions:
`references/artifact-templates.md → Writing Concrete Acceptance Criteria`.

---

## Directory Structure

```text
constitution.md            # Immutable project principles (one per project)

specs/
  [feature-branch-name]/
    research.md        # How the system works TODAY, cited file:line   (0.5)
    spec.md            # Requirements: WHAT and WHY, MoSCoW            (1)
    plan.md            # Implementation strategy: HOW                  (2)
    data-model.md      # Entities, relationships, schemas              (2)
    contracts/         # Interfaces, LOCKED after Gate 2               (2)
    tasks.md           # Atomic executable task list                   (3)
    progress.md        # Optional: state across context resets         (4)
    validation.md      # Traceability matrix                           (5)
    walkthrough.md     # Optional: narration for reviewers             (5)
    decision_log.md    # Optional: rationale for key decisions
  _current/            # Current-state spec per capability, merged on archive
  archive/             # Completed specs, kept after the feature ships
```

---

## Phase 0: Constitution *(one-time per project)*

**Invoke:** `/sdd-init` → `constitution.md` at the project root.

Versioned constraints for every feature: architecture principles, stack, security, naming,
and banned patterns. Every implementation prompt includes it in full. Change it only when a
fundamental project decision changes.

---

## Phase 0.5: Research *(conditional, per feature)*

**Invoke:** `/sdd-research [feature description]` → `specs/[feature]/research.md`

A compacted map of how the relevant part of the system works **today**, written before any
requirement. **Run it when** the feature touches code you did not write or do not remember,
several valid architectures exist, or the work is a refactor or migration. **Skip it** on
greenfield code, or when you can name every touchpoint from memory.

**Rules:**

- **Cite `file:line` for every claim.** A finding without a citation is a guess.
- **Dispatch the noisy work to subagents.** Glob, grep, and full-file reads run in isolated
  contexts; only the compacted summary returns.
- **Describe what exists, never what should exist.** No ACs, user stories, or proposed
  design in `research.md`. Those belong to Phase 1.
- **Name what you could not determine** under an explicit `Open questions / not investigated`
  section instead of filling gaps with plausible guesses.
- **Cap it at ~200 lines.** Past that it is a raw dump.

Reviewing ~200 lines of research prevents thousands of wrong lines of code, so Gate R is the
gate where reading the actual code yourself is worth the time. Present Gate R's verdict and
wait before Phase 1. Details: `references/workflow-phases.md → Phase 0.5`.

---

## 5-Phase Workflow *(per feature)*

| Phase | Invoke | Reads | Produces | Gate |
|-------|--------|-------|----------|------|
| **1: Specify** | `/sdd-specify [description]` | `research.md`, user intent | `spec.md` | Gate 1 |
| **1b: Clarify** | `/sdd-specify` | `spec.md` | resolved `[NEEDS CLARIFICATION]`, new edge-case ACs | (part of Gate 1) |
| **2: Plan** | `/sdd-plan` | `spec.md`, `constitution.md`, `research.md` | `plan.md`, `data-model.md`, `contracts/` | Gate 2 |
| **3: Tasks** | `/sdd-tasks` | `plan.md`, `contracts/` | `tasks.md` | Gate 3 |
| **4: Implement** | `/sdd-tasks` per task | one task + its ACs and contract | code, tests, commits | Gate 4 (per task) |
| **5: Validate** | `/sdd-validate` | all artifacts + code | traceability matrix, drift report, walkthrough | Gate 5 + Gate C |

**Intent gates and evidence gates.** Gates R, 1, C and merge decide what to build and
whether anyone understands it, and a human approves them. Gates 3, 4, 5 and the
contract-completeness half of Gate 2 check facts: an agent that did not produce the artifact
runs the checks and attaches the evidence, and the human audits the verdict. **The author
never passes its own gate.** An `inconclusive` verdict blocks the next phase. Checklists for
every gate, and `/sdd-validate [domain]` checklists that test the spec itself, live in
`references/quality-gates.md`.

**Open items block the gate.** While `[NEEDS CLARIFICATION]` items remain, name each one and
how its answer would change the architecture, and offer the clarify step. If the user
insists after hearing that, proceed: replace each marker with an explicit `Assumption:` line
in the spec, and report it. Never resolve an item silently, and
never refuse indefinitely.

Run the mechanical checks with `node scripts/sdd-check.mjs [specs-dir]`. Without Node, report them as `inconclusive`: `references/enforcement.md → The Validator`.

Objectively decidable rules can become hooks, such as a pre-write hook that makes the
`contracts/` freeze real. Spec testability, design soundness, whether research is true, and
comprehension stay human. A
hook that warns and never blocks is theater, and a CI job named after a gate gets read as
the gate passing. A green pipeline proves the rules were followed, never that they were
right. See `references/enforcement.md`.

### One rule and one prohibition per phase

| Phase | The rule | Never |
|-------|----------|-------|
| 1: Specify | Every `[MUST]` AC is independently testable | Implementation details: no technology, function, or table names |
| 2: Plan | Every `[MUST]` AC maps to at least one component | Abstractions no AC justifies; technology outside `constitution.md` |
| 3: Tasks | Every task declares the ACs it satisfies, tests first | Tasks over ~3 files or without AC references |
| 4: Implement | One fresh context per task: `constitution.md` in full, plus only that task's ACs, contract, plan section, and entities | Touching `contracts/`, adding behavior outside `spec.md`, carrying context between tasks |
| 5: Validate | Fix the code to match the spec, then produce a walkthrough | Editing the spec to match the code |

### Phase 1: Specify

Run the Assumptions Surface Prompt before generating `spec.md`, so assumptions about roles,
permissions, error behavior, and scope get corrected before they harden into ACs. If
`research.md` exists, the spec must not contradict it.

`spec.md` carries: overview, user stories, Boundaries (Always do / Ask first / Never do),
acceptance criteria in Given/When/Then with `[MUST]` `[SHOULD]` `[COULD]` `[WONT]`,
out-of-scope items, and open questions. Error and edge-case ACs are required; the happy path
alone never passes Gate 1.

At M and L, Gate 1 includes a cold read: a fresh agent given only `spec.md` and `constitution.md`
restates the goal and the Done-when checks. Any AC phrase with more than one reading ("records
belonging to M": created by M, or assigned to M) is a failing check to fix in the spec. Never
pick a reading silently.

**Full spec or delta spec.** Changing behavior that already ships does not require
respecifying it:

| Mode | Use when | Header |
|------|----------|--------|
| **Full** | New capability with no existing behavior to preserve | `Mode: Full` |
| **Delta** | Changing, extending, or removing behavior that already ships | `Mode: Delta` + `Baseline:` |

A delta spec's ACs are labelled `[ADDED]`, `[MODIFIED]`, `[REMOVED]`, or `[UNCHANGED]`, the
last for behavior the change must not break. Its baseline is a prior spec, a
`specs/_current/` file, or the cited findings in `research.md`. **A delta spec without a
resolvable baseline is not reviewable.** See `references/workflow-phases.md → Delta Specs`.

`contracts/` freeze the moment Gate 2 passes. Prompts: `references/prompt-patterns.md`.

### Phase 4 and 5: Proof and the adversary

A test that cannot fail is no proof: one that asserts on data it built itself, or never
calls the code, is replaced or deleted, and its AC is recorded as unproven. "Green" is not
evidence; the checker needs the failing-before run quoted.

At Phase 5 (M and L) an adversary that did not write the code works in its own worktree or
scratch copy, preferably on a different model family, and tries to break each `[MUST]` and
`[UNCHANGED]` AC against the real code. A plausible bypass found by reading is worth
reproducing. A finding is `[CONFIRMED]` only with a command, its output, and the output the
spec requires. Unreproduced findings go to a **Dropped** list with a reason each, and naming
or style findings are dropped as out of scope.

---

## Spec Drift

Drift is the agent making "reasonable assumptions" nobody specified. Each rule above removes
one class of them. Commit after every task so drift is one revert away. Failure modes:
`references/anti-patterns.md`.

---

## Context Is the Real Constraint

Output quality is bounded by input quality. Every phase artifact is a compaction, so a
900-line spec has stopped compacting. Compact on purpose, in the 40 to 60% utilization band,
before auto-compaction picks what to lose. Full model:
`references/ai-agent-patterns.md → Context Engineering`.

---

## Comprehension Debt

Specs also defend against code that works and nobody understands. Review the spec and plan
(~400 dense lines) instead of skimming a ~2000-line diff, keep specs in the same PR, request a
linear walkthrough after Phase 4, and archive specs. Gate C enforces this before merge.

---

## Talking to the User

Most of this markdown is for the next phase. Every reply after a phase or gate follows these
rules:

- **Write artifacts to files and report the path.** Never paste an artifact you just wrote.
- **No preamble.** Do not restate the request or explain what a spec is. Start with the result.
- **Verdict first:** `Gate 1: fail` (or `pass`, `inconclusive`), then one line per failing
  check naming the check and the item. No paragraph of prose instead of a verdict.
- **Countable facts:** ACs by label (`ACs: 6 MUST, 2 SHOULD, 1 COULD`), open questions
  (`Open questions: 2`), files written.
- **One next action,** stated as a single instruction or command. Never a menu of options.
- **Under ~25 lines,** however long the artifact is.
- **Mark uncertainty as binary.** `[CONFIRMED]` when verified (a cited artifact for
  documents, a rerun command for code), `[VERIFY]` when inferred. Never invent a percentage.

Formats and line budgets for every output: `references/output-formats.md`.

---

## Living Document

- **When decisions change:** run `/sdd-change`; never patch files by hand
- **When code changed outside the workflow:** run `/sdd-change`
- **Where things stand:** `/sdd-status` prints the phase and the next action; `/sdd-validate` finds contradictions inside `spec.md` before planning
- **Version your specs:** `Status` (Status Lifecycle in `references/artifact-templates.md`) and `Version` headers
- **Archive when done:** move the spec to `specs/archive/` and merge its ACs into `specs/_current/<capability>.md`

### Three ways a spec and its code disagree

| Situation | Cause | Command | What changes |
|-----------|-------|---------|--------------|
| **Drift** | Implementation diverged from an approved spec by mistake | `/sdd-validate` | The **code** |
| **Amendment** | A requirement genuinely changed | `/sdd-change` | The **spec chain**, then the code |
| **Reconciliation** | Code changed deliberately outside the workflow (hotfix, upstream refactor, another team) | `/sdd-change` | Decided **per difference**, by a human |

`/sdd-change` never edits anything on its own: it classifies each difference and proposes
a direction, and a human approves each one. A difference counts as intentional only with
quoted evidence (a commit, PR, or ticket); without it, the difference is drift and the code
gets fixed. So "make the spec match what's deployed" is right only for the differences with
evidence, and you say so. An approved spec update cascades through the chain (spec, plan,
contracts, tasks), never `spec.md` alone, and a deliberate change can still be wrong, so
check it against the original user story. Auto-accepting proposals launders drift:
`references/anti-patterns.md → Anti-Pattern 21`.

---

## Reference Index

All reference files are one level deep from here. Load only what the current phase needs.

| Need | File |
|------|------|
| Templates for every artifact | `references/artifact-templates.md` |
| Prompts for each phase interaction | `references/prompt-patterns.md` |
| Detailed phase-by-phase instructions | `references/workflow-phases.md` |
| Review checklists, generated per-domain checklists, CI/CD | `references/quality-gates.md` |
| Hooks, contract locks, worktrees, `AGENTS.md` bridge | `references/enforcement.md` |
| Formats for everything the user reads | `references/output-formats.md` |
| Context engineering and multi-agent patterns | `references/ai-agent-patterns.md` |
| Common failure modes and fixes | `references/anti-patterns.md` |
| One-page cheat sheet | `references/quick-reference.md` |
| Topic navigation | `references/INDEX.md` |
