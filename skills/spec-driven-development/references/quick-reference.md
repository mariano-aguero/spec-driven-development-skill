# Quick Reference

One-page summary. Each section links to the file that holds the detail.

## Contents

- [Workflow](#workflow)
- [Directory Layout](#directory-layout)
- [Phase Commands](#phase-commands)
- [Ceremony Levels](#ceremony-levels)
- [Spec Modes](#spec-modes)
- [Spec vs. Code Disagreements](#spec-vs-code-disagreements)
- [Enforcement](#enforcement)
- [Hard Rules](#hard-rules)
- [Labels and AC Format](#labels-and-ac-format)
- [Gates](#gates)
- [Context and Output Budgets](#context-and-output-budgets)
- [When Not to Use SDD](#when-not-to-use-sdd)

## Workflow

```text
[CONSTITUTION]  once per project
      ↓
[RESEARCH]  when the code is unfamiliar or already exists
      ↓
[SPECIFY] → [CLARIFY] → [PLAN] → [TASKS] → [IMPLEMENT] → [VALIDATE]
 spec.md     resolve     plan.md   tasks.md   one commit    traceability
             ambiguity   contracts            per task      drift, walkthrough
```

Each arrow is a compaction boundary: the next phase reads the artifact, never the raw material
behind it. Steps per phase: [workflow-phases.md](workflow-phases.md).

## Directory Layout

```text
constitution.md      # project constraints, never skipped
specs/[feature]/
├── research.md      # how the system works today, cited file:line (Phase 0.5)
├── spec.md          # handoff, what and why, MoSCoW ACs, no tech details
├── plan.md          # how: architecture, components
├── data-model.md    # entities, fields, constraints, indexes
├── contracts/       # API shapes, error codes, locked after Phase 2
├── tasks.md         # sized tasks with Depends on, Creates, Modifies
├── validation.md    # per-AC proof and verdict (Phase 5)
├── progress.md      # optional resume note
├── walkthrough.md   # optional execution-ordered narration
└── decision_log.md  # optional append-only decisions
specs/_current/[capability].md   # merged current state, written at archive
```

Templates: [artifact-templates.md](artifact-templates.md).

## Phase Commands

| Command | Phase | Creates |
|---------|-------|---------|
| `/sdd-init` | 0 | `constitution.md` |
| `/sdd-research [description]` | 0.5 | `research.md` |
| `/sdd-specify [description]` | 1 | `spec.md`, then clarifies it |
| `/sdd-plan` | 2 | `plan.md`, `data-model.md`, `contracts/` |
| `/sdd-tasks` | 3, 4 | `tasks.md`, then one task at a time |
| `/sdd-validate [domain]` | 1 | `checklists/[domain].md`, which tests the spec |
| `/sdd-validate` | 5 or any | `validation.md`, drift report, walkthrough, or an inconsistency report |
| `/sdd-status` | any | phase state and next action |
| `/sdd-change [what changed]` | any | amended spec chain |
| `/sdd-change [feature]` | any | reconcile proposals, edits nothing |

## Ceremony Levels

| | S: Light | M: Standard | L: Full |
|---|---|---|---|
| Use when | 1 session, 3 files or fewer, no schema, contract or auth change, revertible | New endpoint, table or user-visible behavior | Auth, payments, migrations, regulated or unfamiliar code |
| Artifacts | ACs in the PR body | spec, plan, contracts, tasks | adds research, decision log, walkthrough |

Start at M. Drop to S only if all S conditions hold, and move to L if any L condition holds.
The tiebreaker is reversibility, not size. Promote mid-flight, never demote. Gates per level:
[quality-gates.md](quality-gates.md).

## Spec Modes

Full for a new capability, Delta (`Mode: Delta` plus `Baseline:`) for shipped behavior. Delta
ACs carry `[ADDED]`, `[MODIFIED]`, `[REMOVED]` or `[UNCHANGED]`, and `[UNCHANGED]` is the
regression suite. The baseline is a prior spec or cited `research.md` findings, never "the
current code". At most two unfolded deltas per baseline. See
[workflow-phases.md](workflow-phases.md), Delta Specs.

## Spec vs. Code Disagreements

| Situation | Command | What changes |
|-----------|---------|--------------|
| Drift: code diverged by mistake | `/sdd-validate` | the code |
| Amendment: a requirement changed | `/sdd-change` | the spec chain, then code |
| Reconcile: code changed outside the workflow | `/sdd-change` | per difference, a human decides |

Reconcile marks `INTENTIONAL` or `EXTERNAL` only with quoted evidence (update the spec), `DRIFT`
without it (fix the code), and `AMBIGUOUS` defaults to `DRIFT`.

## Enforcement

Rules are asked (the prompt states them), checked (CI or `scripts/sdd-check.mjs` after the
fact), or blocked (a hook stops the action). Promote a rule only when it is objectively
decidable and was violated more than once. Validator: `node scripts/sdd-check.mjs [specs-dir]
[--json]`, exit 1 on any error; with no Node, report mechanical checks `inconclusive`.
`AGENTS.md` is derived from `constitution.md` and never edited directly. Detail:
[enforcement.md](enforcement.md).

## Hard Rules

- Constitution before any spec. Pick the ceremony level per change.
- Research before specifying unfamiliar code. Every research claim cites `file:line` and
  carries an evidence level from L1 to L5.
- Surface assumptions, then clarify, before planning. No implementation details in `spec.md`.
- Every `[MUST]` AC has a `Proof:` line. Verdicts are `pass`, `fail` or `inconclusive`.
- Lock `contracts/` before Phase 4. Fresh context and one commit per task.
- Code matches the spec, never the reverse. No evidence means drift.
- Humans approve intent gates (R, 1, C, merge). A non-author checker passes evidence gates
  (2 completeness, 3, 4, 5). The author never passes its own gate.
- Commit specs in the same PR as the code.

Failure modes and fixes: [anti-patterns.md](anti-patterns.md).

## Labels and AC Format

MoSCoW: `[MUST]` blocks shipping, `[SHOULD]` ships if time allows, `[COULD]` goes to backlog,
`[WONT]` records an exclusion.

```text
Given [initial state]
When [action]
Then [observable outcome]
**Proof:** test: [command]    (every [MUST] AC; kinds: test | command | artifact | manual)
```

"Then a success message appears within 1s" is testable. "The form submits correctly" is not,
and "The API calls POST /users" is an implementation detail.

## Gates

Gate 0 (constitution), R (research), 1 (spec), 2 (plan and contracts), 3 (tasks), 4 (per task),
5 (final) and C (comprehension). Checklists, the level matrix and drift classification:
[quality-gates.md](quality-gates.md). Prompts for every step: [prompt-patterns.md](prompt-patterns.md).

## Context and Output Budgets

Work in the 40 to 60% context band. At 60 to 80%, finish the step, write `progress.md` and
start fresh. Past 80%, stop now. Detail: [ai-agent-patterns.md](ai-agent-patterns.md).

Write artifacts and show verdicts, verdict first. Confidence is `[CONFIRMED]` or `[VERIFY]`,
never a percentage. Line budgets for every output the user reads:
[output-formats.md](output-formats.md).

## When Not to Use SDD

A bug fix under 30 minutes, a refactor with no behavior change, a throwaway prototype, or a
single configuration value.
