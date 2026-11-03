# AI Agent Patterns

Context management and multi-agent patterns for SDD.

## Contents

- Context management: one context per task
- Context engineering: compaction, the 40 to 60% band, progressive disclosure, noise
  isolation, attention decay, failure signatures
- Subagent review pattern: critics for Gates R, 1 and 2, the adversary
- No-subagent fallback
- Tool: individual task retrieval
- Parallel task execution and rules
- AI tool selection per phase
- Handling AI resistance
- Spec regeneration pattern
- Research phase with parallel subagents
- Spec as recovery point

---

## Context Management

### The Single-Task Context Rule

Each task in `tasks.md` gets its own context window. Never carry context across tasks: by
TASK-008, a long session applies the approach from TASK-003 without checking the contract.

Load the task from `tasks.md`, the ACs it satisfies and the Boundaries section from
`spec.md`, its contract section, its `plan.md` section, its entities from `data-model.md`, and
the project conventions (`AGENTS.md` or equivalent). Leave out the rest of `spec.md`, output
from other tasks, and architecture the task does not touch. Close the session after the commit.

---

## Context Engineering

An agent's output is bounded by its input. Every phase, gate and artifact in SDD decides what
enters that input.

### Artifacts Are Compaction Checkpoints

| Phase | Raw work | Artifact | What survives |
|-------|----------|----------|---------------|
| 0.5 Research | 40 files read, dozens of greps | `research.md` (~200 lines) | File map, flow, cited findings, constraints |
| 2 Plan | Architectures weighed | `plan.md` (~200 lines) | Components, AC coverage, risks |
| 3 Tasks | Work sequenced and sized | `tasks.md` | Atomic units with dependencies |
| 4 Implement | Code written and debugged | Commits, `progress.md` | Working code, resume state |

The next phase starts from the artifact and never re-reads the raw material.

- **Artifact length is a quality signal.** A 900-line spec has stopped compacting.
- **A phase that re-reads the previous phase's raw material has broken the chain.** If
  planning needs to re-grep the codebase, fix `research.md` instead.

### Compact on Purpose, Not on Overflow

Target 40 to 60% context use. Automatic compaction at exhaustion lets a summarizer discard
details without knowing which contract line mattered.

| Use | State | Action |
|-----|-------|--------|
| Under 60% | Productive | Continue |
| 60 to 80% | Degrading: early instructions lose weight | Finish the step, hand over |
| 80%+ | Unreliable | Stop and write `progress.md` |

The numbers vary by model. The rule holds: reset at a boundary you picked, before quality drops.

### Progressive Disclosure

| Load always | Load per task | Load on demand only |
|-------------|---------------|---------------------|
| `constitution.md` | The task's ACs, contract and plan section | `research.md` (already distilled into `plan.md`) |
| The current task | Its entities from `data-model.md` | Other features' specs, `decision_log.md`, archived specs |

Reloading `research.md` during implementation brings back the noise Phase 2 removed. Pull one
section only when a task's design intent is unclear.

### Isolate the Noise in Subagents

Repository-wide greps, directory walks, full-file reads, log scans and dependency audits run in
a subagent. It returns a bounded summary. The main context gets the conclusion, never the
transcript.

### Attention Decay in Long Sessions

- **Re-inject the constraints that matter at each step.** The per-task prompt repeats
  `constitution.md` and the Boundaries section for this reason.
- **Keep the goal in the working set.** On long tasks, re-read the task's line in `tasks.md`
  at each step.

### Failure Signatures

| Symptom | Diagnosis | Fix |
|---------|-----------|-----|
| Contradicts a decision from earlier in the session | Attention decay | Re-inject the decision, or reset |
| Re-reads files an artifact already summarizes | Broken compaction chain | Trust the artifact or fix it |
| Asks a question the spec answers | Signal buried in noise | Trim context to the current task |
| Auto-compaction fires, or quality drops late | Past the productive band | `progress.md` and a fresh session |

---

## Subagent Review Pattern

Run a separate critic subagent at each phase gate. The author anchors to its own output.

The coordinator is the session that dispatches critics, checkers and the adversary, reruns
their findings, and collects the verdicts. It never writes the code it checks
([Parallel Task Rules](#parallel-task-rules)).

| Marker | Spec and research critics | Code critics and the adversary |
|--------|---------------------------|--------------------------------|
| `[CONFIRMED]` | Cites the artifact location that proves the issue | Gives the command, its output, and the output the spec requires. The coordinator reran it and got the same output |
| `[VERIFY]` | Inferred, or the critic could not check it. The human triages these first | Never reported. Goes to the Dropped list with the reason |

Presentation: [Critic Findings](output-formats.md#critic-findings).

**Phase 5 adversary (M, L).** An agent that did not write the code tries to break each `[MUST]`
and `[UNCHANGED]` AC against the real code, in its own worktree or scratch copy. Prefer a
different model family from the author's. Prompt: `prompt-patterns.md → Adversary Prompt`.

### Phase 0.5 Critic Agent

Runs before Gate R in a clean context. It opens each `file:line` citation and checks the line
exists and says what `research.md` claims. Plausible fabricated citations are this phase's
typical failure, and the author cannot see them (Anti-Pattern 15). Prompt:
[Research Verification Prompt](prompt-patterns.md#research-verification-prompt-gate-r).

### Phase 1 Critic Agents

Run after `spec.md`, before Gate 1, each with the shared prompt and its table row.

| Critic | Persona | Reads | Finds | Types |
|--------|---------|-------|-------|-------|
| QA | QA engineer | `spec.md` | ACs that cannot be an automated test | Untestable, Ambiguous |
| Security | Security engineer | `spec.md` | Missing authentication, authorization, input validation, data exposure | Missing, Risk |
| Product | Product manager | `spec.md` | User stories without full AC coverage, missing edge cases, implicit assumptions | Missing, Ambiguous, UX-Gap |

```text
# [Critic] Critic
You are a [persona] reviewing an artifact you did not write.
Read: specs/[feature]/[artifacts]
Find: [finds]

Return issues in this format:
[ISSUE] [AC-N, endpoint, entity or section] [Critic] [Type: types] [CONFIRMED|VERIFY] [Description]

Issues only. Do not suggest fixes, rewrite, approve, compliment or summarize.
```

### Phase 2 Critic Agents

Run after `plan.md` and `contracts/`, before Gate 2. A plan critic reports only what it can
check against the current tree: a file, a signature, a stack entry in `constitution.md`. A risk
it cannot check is an open question. If running something answers it (layout, timing, library
behavior), build a throwaway prototype off the feature branch and cite the result in the plan.

| Critic | Persona | Reads | Finds | Types |
|--------|---------|-------|-------|-------|
| Constitution | Standards reviewer | `plan.md`, `contracts/`, `constitution.md` | Banned patterns, off-stack choices, naming conflicts, unaddressed security constraints, prohibited data exposure | Banned, StackViolation, Naming, Security |
| Architecture | Engineer who prefers simple solutions | `plan.md` | Needless abstraction or indirection, premature generalization | Over-engineering, Missing, Risk |
| Contract | Frontend developer consuming the API | `contracts/` | Missing error codes, ambiguous shapes, missing edge cases | Missing, Ambiguous, Schema |
| DB | DBA | `data-model.md` | Missing indexes, implicit constraints, N+1 risks, inconsistent denormalization | Schema, Missing, Risk |
| Risks | Tech lead | `plan.md` | Risks without mitigation, high impact with no fallback, unhandled external failures, assumptions that could sink the plan | Unmitigated, Assumption, Dependency, Fallback |

---

## No-Subagent Fallback

Evidence gates, critics and the adversary need an agent that did not write the artifact. With
no subagents:

1. Start a fresh session with no conversation history.
2. Give it only the artifacts the check names (spec, plan, diff, task) and the gate
   checklist. Never a summary written by the author.
3. It runs the checks and writes the verdict with evidence to the file the gate names.

If no fresh session is possible, the verdict is `inconclusive` with the reason, and the next
phase does not start. Never report `pass` from the authoring session.

---

## Tool: Individual Task Retrieval

An agent shown all of `tasks.md` may implement several tasks or reach ahead. Give it one:

```bash
# Print one task block from tasks.md by ID
extract-task() {
  local task_id=$1
  local tasks_file=$2
  awk "/\*\*${task_id}\*\*/,/^- \[ \] \*\*TASK-/{if(/^- \[ \] \*\*TASK-/ && !/\*\*${task_id}\*\*/) exit; print}" "$tasks_file"
}
```

The next task is the first `- [ ]` whose `Depends on:` tasks are all `- [x]`.

---

## Parallel Task Execution

Tasks marked `[P]` run in parallel sessions, each with its own context, task and spec
sections. Each returns a commit hash.

### Parallel Task Rules

- Run tasks in waves computed from `Depends on:`. A wave holds every task whose dependencies
  are all done
- One worktree per parallel task, branched off the same base
  (`enforcement.md → Git Worktrees for Parallel Tasks`)
- One coordinator per wave assigns tasks, runs or dispatches the Gate 4 checks, and merges.
  It never writes code: a coordinator that fixes a task has become its author and can no
  longer check it
- Parallel tasks MUST NOT write to the same files or depend on each other's output
- A merge conflict between parallel tasks means the decomposition is wrong. Fix `tasks.md`

---

## AI Tool Selection Per Phase

Pick by capability, since model names change every release. Use your most capable model for
Phases 0 to 2, where the specs decide everything. Research (0.5) needs large context, file
access and subagent dispatch. Implement (4) needs file access and test execution more than raw
capability. Validate (5) needs multi-file comparison.

---

## Handling AI Resistance

An agent that says "a better approach would be..." during Phase 4 is starting spec drift. Reply:

```text
Stop. The contract is not negotiable during Phase 4.
Implement [task title] as specified.
If you believe the spec or contract is wrong, flag it and wait for human review.
```

If the suggestion has value, note it in `decision_log.md`, finish Phase 4 as specified, and
open a follow-up that goes through Phases 1 to 3.

---

## Spec Regeneration Pattern

When requirements change mid-development, stop Phase 4 at the current task and run
`/sdd-change`. It assesses impact first, then updates `spec.md`, `plan.md`, `contracts/`,
`data-model.md` and `tasks.md` in that order, from the first affected task forward. Prompt:
`prompt-patterns.md → Amend Prompt`. Resume Phase 4 from the first affected task.

Never keep implementing with the new requirement in mind while the spec is stale, and never
"adjust slightly" without updating the spec chain.

---

## Research Phase with Parallel Subagents

Procedure: `workflow-phases.md → Phase 0.5`. Prompts: `prompt-patterns.md → Phase 0.5`.

### The Leverage Model

A wrong `research.md` (~200 lines) aims the whole feature at the wrong subsystem. A wrong
`plan.md` (~200 lines) costs hundreds of lines. Generated code (~2000 lines) fails one line at
a time. Reviewing the first 400 lines catches more for less attention, which is why Gate R
runs before anything is built.

### Dispatch Shape

Four parallel subagents, one per axis: files involved, information flow, prior art in the
repo, and constraints the code already enforces. Each returns at most 300 words with a
`file:line` citation per claim, reports what it could not determine, and proposes nothing.
Consolidation drops uncited claims and marks disagreements `[CONFLICT]`. Add a fifth axis for
an unfamiliar external library: the API of the installed version, read from source. Prompt:
[Codebase Research Prompt](prompt-patterns.md#codebase-research-prompt-sdd-research).

---

## Spec as Recovery Point

When an implementation session fails (context overflow, cascading errors, wrong direction),
do not fix it in the same session. Note the commit SHA, start a fresh session with only the
spec artifacts, and re-implement from the failing task. With a complete spec, a failed session
loses one task.
