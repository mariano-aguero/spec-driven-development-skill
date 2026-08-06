---
name: spec-driven-development
description: >
  Structures feature work for AI coding agents into gated phases — research, spec, plan,
  tasks, implement, validate — each producing a short reviewable artifact that constrains
  the next. Use when requirements are informal or drift-prone, when the same prompt produces
  different implementations across sessions, or when a feature touches auth, database schema,
  or API contracts. Keywords: spec-driven development, SDD, spec.md, plan.md, tasks.md,
  constitution.md, acceptance criteria, drift detection.
---

# Spec-Driven Development

## Overview

SDD makes **specifications the source of truth** — code serves specs, not the other way
around. Instead of prompting an AI with vague descriptions and hoping for the right output,
you define precise specifications first, then let AI generate code strictly constrained by
them.

Without a spec, AI makes thousands of micro-decisions silently. With a spec, those decisions
are made by you — explicitly, before any code is written, which is what turns a pivot into a
systematic regeneration rather than a manual rewrite.

## Quick Start

1. `/sdd:init` — create `constitution.md` (once per project, before any feature spec)
2. `/sdd:research [description]` — map how the existing code works, cited `file:line` (skip on greenfield)
3. Surface the AI's implicit assumptions about roles, permissions, error behavior, and scope — correct them *before* any AC is written
4. `/sdd:specify [description]` — generate `spec.md` with MoSCoW-prioritized ACs
5. Follow the gates: Clarify → Plan → Tasks → Implement → Validate, with human approval at each

Step-by-step detail: `references/workflow-phases.md`.

## When to Use

Symptoms that signal SDD is needed:

- AI ignores constraints or generates code that doesn't match requirements
- Same prompt produces different implementations across sessions
- Requirements are complex with multiple stakeholders or cross-cutting concerns
- Team needs shared technical understanding before writing code
- Feature touches auth, data model, API contracts, or database schema

**Skip entirely for:** one-line fixes, typos, disposable prototypes, and solo exploration
spikes lasting less than a day.

## Choosing the Ceremony Level

Not every change deserves the same process. Pick the lightest level that covers the risk.

| | **S — Light** | **M — Standard** | **L — Full** |
|---|---|---|---|
| Use when | Fits one session, ≤3 files, no schema/contract/auth change | New endpoint, table, or user-visible behavior; spans sessions | Auth, payments, migrations, regulated domains, unfamiliar code |
| Artifacts | ACs in the issue or PR body | `spec.md`, `plan.md`, `contracts/`, `tasks.md` | + `research.md`, `decision_log.md`, `walkthrough.md` |
| Gates | Self-check before merge | 1, 2, 3, 5 | 0, R, 1–5, C |
| Critics | none | optional | required |

**Decision rule:** start at M. Drop to S only if *all* of these hold — one session, ≤3 files,
no contract or schema change, trivially revertible. Move to L if *any* of these hold — auth
or payments, irreversible data migration, regulated domain, or code nobody on the call has
read.

Two failure modes, equally costly: L ceremony on an S change is where "drowning in markdown"
comes from, and S ceremony on an L change is the reason this skill exists. When genuinely
unsure, the tiebreaker is **reversibility**, not size — a small change to an auth check
outranks a large change to a report layout.

Levels are per change, not per project. Moving up mid-flight is normal — promoting S to M
once a schema change appears. Moving down is not: it discards a gate you already decided
you needed.

## Key Practice: Reframe Vague Requirements

Before writing any AC, convert vague requirements into measurable targets — "make it faster"
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
    spec.md            # Requirements — WHAT and WHY, MoSCoW           (1)
    plan.md            # Implementation strategy — HOW                 (2)
    data-model.md      # Entities, relationships, schemas              (2)
    contracts/         # Interfaces — LOCKED after Gate 2              (2)
    tasks.md           # Atomic executable task list                   (3)
    progress.md        # Optional: state across context resets         (4)
    validation.md      # Traceability matrix                           (5)
    walkthrough.md     # Optional: narration for reviewers             (5)
    decision_log.md    # Optional: rationale for key decisions
  archive/             # Completed specs, kept after the feature ships
```

Every artifact is also a **compaction checkpoint** — a phase's messy exploration distilled
into the only text the next phase needs to see.

---

## Phase 0 — Constitution *(one-time per project)*

**Invoke:** `/sdd:init` → `constitution.md` at the project root.

A versioned document of immutable constraints applying to every feature: architecture
principles, technology stack, security constraints, naming conventions, and explicitly
banned patterns. AI agents are forbidden from violating it, and it is included in full in
every implementation prompt.

Update only when a fundamental project decision changes — never per-feature.

---

## Phase 0.5 — Research *(conditional, per feature)*

**Invoke:** `/sdd:research [feature description]` → `specs/[feature]/research.md`

A compacted map of how the relevant part of the system works **today**, written before any
requirement is drafted.

**Run it when** the feature touches code you did not write or do not remember, multiple
valid architectures exist, the work is a refactor or migration, or the codebase is too large
to read in one session. **Skip it** on greenfield code, or when you can name every touchpoint
from memory with confidence.

**Four rules:**

- **Cite `file:line` for every claim.** A finding without a citation is a guess.
- **Dispatch the noisy work to subagents.** Glob, grep, and full-file reads run in isolated
  contexts; only the compacted summary returns.
- **Describe what exists, never what should exist.** Requirements belong to Phase 1.
- **Cap it at ~200 lines.** Past that it is a raw dump, not a compaction.

**Why this phase has the highest leverage:** reviewing ~200 lines of research prevents
thousands of wrong lines of code; reviewing the code prevents one wrong line at a time. Gate R
is the one gate where reading the actual code yourself is worth the time.

Details: `references/workflow-phases.md → Phase 0.5`.

---

## 5-Phase Workflow *(per feature)*

| Phase | Invoke | Reads | Produces | Gate |
|-------|--------|-------|----------|------|
| **1 — Specify** | `/sdd:specify [description]` | `research.md`, user intent | `spec.md` | Gate 1 |
| **1b — Clarify** | `/sdd:clarify` | `spec.md` | resolved `[NEEDS CLARIFICATION]`, new edge-case ACs | (part of Gate 1) |
| **2 — Plan** | `/sdd:plan` | `spec.md`, `constitution.md`, `research.md` | `plan.md`, `data-model.md`, `contracts/` | Gate 2 |
| **3 — Tasks** | `/sdd:tasks` | `plan.md`, `contracts/` | `tasks.md` | Gate 3 |
| **4 — Implement** | `/sdd:next-task` per task | one task + its ACs and contract | code, tests, commits | Gate 4 (per task) |
| **5 — Validate** | `/sdd:validate` | all artifacts + code | traceability matrix, drift report, walkthrough | Gate 5 + Gate C |

**Every gate is a human approval point.** AI cannot approve its own output. Full checklists
for Gates 0, R, 1–5 and C live in `references/quality-gates.md`.

### One rule and one prohibition per phase

| Phase | The rule | Never |
|-------|----------|-------|
| 1 — Specify | Every `[MUST]` AC is independently testable | Implementation details — no technology, function, or table names |
| 2 — Plan | Every `[MUST]` AC maps to at least one component | Abstractions no AC justifies; technology outside `constitution.md` |
| 3 — Tasks | Every task declares the ACs it satisfies, tests first | Tasks over ~3 files or without AC references |
| 4 — Implement | One fresh context per task — `constitution.md` in full, plus only that task's ACs, contract, plan section, and entities | Touching `contracts/`, adding behavior outside `spec.md`, carrying context between tasks |
| 5 — Validate | Fix the code to match the spec, then produce a walkthrough | Editing the spec to match the code |

### Phase 1 — Specify

Run the Assumptions Surface Prompt *before* generating `spec.md`, so implicit assumptions
about roles, permissions, error behavior, and scope get corrected before they harden into
acceptance criteria. If `research.md` exists, the spec must not contradict it.

`spec.md` carries: overview, user stories, Boundaries (Always do / Ask first / Never do),
acceptance criteria in Given/When/Then with `[MUST]` `[SHOULD]` `[COULD]` `[WONT]`,
explicit out-of-scope items, and open questions. Error and edge-case ACs are required —
the happy path alone never passes Gate 1.

**Full spec or delta spec.** Modifying behavior that already exists does not require
respecifying it. A delta spec declares a baseline and then lists only what changes:

| Mode | Use when | Header |
|------|----------|--------|
| **Full** | New capability with no existing behavior to preserve | `Mode: Full` |
| **Delta** | Changing, extending, or removing behavior that already ships | `Mode: Delta` + `Baseline:` |

A delta spec's ACs are labelled `[ADDED]`, `[MODIFIED]`, `[REMOVED]`, or `[UNCHANGED]` —
the last one for behavior the change must not break. Its baseline is either a prior spec or,
when none exists, the cited findings in `research.md`. **A delta spec without a resolvable
baseline is not reviewable** — see `references/workflow-phases.md → Delta Specs`.

`contracts/` freeze the moment Gate 2 passes. Step-by-step detail lives in
`references/workflow-phases.md`; prompt formats (A for agents with file access, B for
stateless interfaces) in `references/prompt-patterns.md`; formats for the traceability
matrix, drift report, and walkthrough in `references/output-formats.md`.

---

## Spec Drift

Drift occurs when AI makes "reasonable assumptions" that were never specified. Every rule
above exists to remove one class of assumption: the constitution removes project-level ones,
research removes assumptions about the existing system, clarify removes ambiguity before it
becomes architecture, frozen contracts remove interface guesses, and one-context-per-task
removes assumptions inherited from earlier work.

Two habits carry the rest: **specificity beats verbosity** — "returns 404 when the resource
is not found" beats three paragraphs — and **commit after every task**, so drift is always
one revert away.

Failure modes in detail: `references/anti-patterns.md`.

---

## Context Is the Real Constraint

An AI agent is a stateless function: output quality is bounded by input quality. Every phase,
gate, and artifact here is mechanically a decision about what enters that input.

- **Every phase artifact is a compaction.** `research.md` is what survives from reading forty
  files; `plan.md` is what survives from the research. Each is roughly a 95% reduction that
  keeps every decision-critical fact. Artifact length is therefore a quality signal — a
  900-line spec has stopped compacting and started hoarding.
- **Compact on purpose, not on overflow.** Stay in the 40–60% utilization band. Auto-compaction
  triggered by exhaustion decides for you, under pressure, which details to lose.

Full model: `references/ai-agent-patterns.md → Context Engineering`.

---

## Comprehension Debt

Specs defend against a failure mode unrelated to correctness: **code that works and nobody
understands**. Agents generate code several times faster than humans read it, so teams merge
sharply more pull requests while understanding measurably less of what they ship. The debt
costs nothing until the first incident, onboarding, or refactor.

SDD only pays this back if the artifacts are actually read. Review the spec and plan rather
than skimming the diff — that moves attention to ~400 high-density lines instead of ~2000
low-density ones. Keep specs in the same PR so the reviewer reads intent before mechanism,
request a linear walkthrough after Phase 4, and archive specs instead of deleting them so
the next person inherits the reasoning.

Gate C enforces this before merge.

---

## Talking to the User

This workflow generates a lot of markdown, most of it for the *next phase* rather than the
human. Confusing the two is how SDD earns its reputation for ceremony.

- **Write artifacts to files. Show the human a verdict.** Never paste a full artifact into
  the response when it was just written to disk.
- **Verdict first, evidence second.** Gate results, drift reports, and validation output all
  lead with pass/fail and the count, then the detail.
- **Mark uncertainty as binary.** `[CONFIRMED]` when verified against code or a cited
  artifact, `[VERIFY]` when inferred. Never invent a confidence percentage.
- **Respect the line budgets.** Every user-facing output in `references/output-formats.md`
  has one.

Formats for every output the human reads: `references/output-formats.md`.

---

## Living Document

- **When decisions change:** run `/sdd:amend` — never patch files manually
- **When code changed outside the workflow:** run `/sdd:reconcile`
- **Commit specs with code:** spec files belong in the same PR as the implementation
- **Version your specs:** each `spec.md` carries a `Status` and `Version` header
- **Archive when done:** move completed specs to `specs/archive/` after the feature ships

### Three ways a spec and its code disagree

Confusing these is how specs quietly become fiction. The command differs, and so does which
side gets edited:

| Situation | Cause | Command | What changes |
|-----------|-------|---------|--------------|
| **Drift** | Implementation diverged from an approved spec by mistake | `/sdd:validate` | The **code** |
| **Amendment** | A requirement genuinely changed | `/sdd:amend` | The **spec chain**, then the code |
| **Reconciliation** | Code changed deliberately outside the workflow — hotfix, upstream refactor, another team | `/sdd:reconcile` | Decided **per difference**, by a human |

`/sdd:reconcile` never edits anything on its own: it classifies each difference and proposes
a direction, and a human approves each one. Auto-accepting its proposals turns it into a
laundering machine for drift — see `references/anti-patterns.md → Anti-Pattern 21`.

---

## Reference Index

All reference files are one level deep from here. Load only what the current phase needs.

| Need | File |
|------|------|
| Templates for every artifact | `references/artifact-templates.md` |
| Prompts for each phase interaction | `references/prompt-patterns.md` |
| Detailed phase-by-phase instructions | `references/workflow-phases.md` |
| Review checklists and CI/CD integration | `references/quality-gates.md` |
| Formats for everything the user reads | `references/output-formats.md` |
| Context engineering and multi-agent patterns | `references/ai-agent-patterns.md` |
| Common failure modes and fixes | `references/anti-patterns.md` |
| One-page cheat sheet | `references/quick-reference.md` |
| Topic navigation | `references/INDEX.md` |
