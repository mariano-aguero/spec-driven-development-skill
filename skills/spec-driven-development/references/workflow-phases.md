# Workflow Phases

Step-by-step procedure per phase. Gate checklists live in [quality-gates.md](quality-gates.md),
prompts in [prompt-patterns.md](prompt-patterns.md), templates in
[artifact-templates.md](artifact-templates.md).

## Contents

- [Phase 0: Constitution](#phase-0-constitution)
- [Phase 0.5: Research](#phase-05-research)
- [Phase 1: Specify](#phase-1-specify)
- [Delta Specs](#delta-specs)
- [Phase 2: Plan](#phase-2-plan)
- [Phase 3: Tasks](#phase-3-tasks)
- [Phase 4: Implement](#phase-4-implement), including when to amend the plan
- [Phase 5: Validate](#phase-5-validate)
- [Reconcile](#reconcile-when-code-changed-outside-the-workflow), for code changed outside the workflow

---

## Phase 0: Constitution

Goal: a `constitution.md` at the project root with the constraints every feature must respect.
Every implementation prompt includes it and every gate checks against it.

**Step 0.1: Intake.** Gather the stack, team conventions, compliance requirements, known
anti-patterns, and any existing `CLAUDE.md`, `.cursorrules` or `AGENTS.md`.

**Step 0.2: Generate.** Run the Initial Constitution Generation Prompt
([prompt-patterns.md](prompt-patterns.md), Phase 0). On an existing codebase, use Constitution
from Existing Codebase instead. Write the result to `constitution.md`.

**Step 0.3: Review security.** Every security rule must be specific and verifiable. Cover at
least auth, input validation, secret handling, logging and CORS. For security-sensitive
domains, add CWE-targeted rules with the Constitution Security Constraints Prompt.

**Step 0.4: Resolve `[PENDING]` items.** Decide them before the first spec. An undecided
choice here ("Redis for sessions?") turns into a `[NEEDS CLARIFICATION]` item in every spec
that touches it. Anything still undecided gets a target date.

**Step 0.5: Gate 0.** A human approves with the Gate 0 checklist.

**Step 0.6: Commit.**

```bash
git add constitution.md
git commit -m "chore: add project constitution"
```

Update it when a major dependency, security policy or architecture decision changes. Bump its
Version field and date the change.

---

## Phase 0.5: Research

Goal: `specs/[feature]/research.md`, a cited map of about 200 lines of how the touched part of
the system works today. Phase 1 then writes requirements against the real system.

research.md is descriptive only. It never holds acceptance criteria, user stories or a proposed
design. Anything the research could not answer goes in its explicit Open Questions and Not
Investigated sections, so nobody reads it as complete.

Run it when you cannot name every file the feature touches, the code is someone else's or over
a month old, two architectures look equally reasonable, or for a refactor, migration or
unfamiliar library. Skip it when you can name the touchpoints and data flow from memory. When
unsure, run it.

**Step 0.5.1: Frame the question.** One or two sentences on what will change. Leave out your
proposed solution, or the agent confirms it instead of mapping the system.

**Step 0.5.2: Dispatch subagents.** Run the Codebase Research Prompt
([prompt-patterns.md](prompt-patterns.md), Phase 0.5) on four axes in parallel:

| Subagent | Question |
|----------|----------|
| Files | Which files are involved and what does each own? |
| Flow | How does data move from entry to transform, persistence and response? |
| Prior art | What in this repo already solves a similar problem? |
| Constraints | Which conventions, base classes or middleware must a change respect? |

Only summaries of at most 300 words come back to the main context.

**Step 0.5.3: Consolidate.** Run the Research Consolidation Prompt into the `research.md`
template ([artifact-templates.md](artifact-templates.md)). A claim with no `file:line`
citation is deleted. When subagents disagree, mark `[CONFLICT]` and leave it for the human.

**Step 0.5.4: Verify citations.** Run the Research Verification Prompt in a separate context.
The author anchors to its own output (Anti-Pattern 15 in [anti-patterns.md](anti-patterns.md)).
The verifier checks that each cited line exists and supports the claim.

**Step 0.5.5: Gate R.** A human reviews with the Gate R checklist and opens three or four
citations at random.

**Step 0.5.6: Commit.**

```bash
git add specs/[feature-name]/research.md
git commit -m "research: [feature name] codebase analysis"
```

In Phase 1, Existing Constraints Discovered feeds the non-functional requirements and
`Boundaries`, and Open Questions for the Spec seeds the `[NEEDS CLARIFICATION]` list.

---

## Phase 1: Specify

Goal: a `spec.md` a reader with no context can build from without questions.

**Step 1.1: Intake.** Ask the problem, the users, what success looks like, and the hard
constraints. If `research.md` exists,
load it first and treat it as ground truth. A spec that contradicts verified research is wrong
until the research is disproven.

**Step 1.2: Check constitution `[PENDING]` items.** An item blocks when the spec would have
to make the same undecided choice, like `[PENDING] auth: cookie vs. JWT` for a feature that
needs auth. Resolve blocking items in `constitution.md` first. Ignore the rest.

**Step 1.3: Surface assumptions.** Run the Assumptions Surface Prompt with the intake context.
Correct its assumptions about roles, permissions, error behavior, integrations and scope
before generating the spec.

**Step 1.4: Generate.** Run the Initial Specification Prompt (or the Delta Specification
Prompt, see [Delta Specs](#delta-specs)) with the corrected assumptions. Write to
`specs/[feature-branch-name]/spec.md`.

**Step 1.5: Clarify.** Run the Clarify Phase Prompt and show the output to the human. After
they approve the answers, apply them with the Post-Clarify Spec Update Prompt. Every
`[NEEDS CLARIFICATION]` item must be `[RESOLVED]` before Phase 2. Do not assume and do not defer.

**Step 1.6: Gate 1.** At M and L, first run the Cold Read Prompt in a fresh agent that sees
only `spec.md`, `constitution.md` and files named in `Baseline:`. Its restatement of the goal
and Done-when checks must match your intent, and every reading it had to choose is a spec fix.
Then a human approves `spec.md` with the Gate 1 checklist. On pass, set `Status: Approved`.

**Step 1.7: Branch and commit.**

```bash
git checkout -b feature/[feature-name]
git add specs/[feature-name]/spec.md
git commit -m "spec: [feature name] requirements"
```

---

## Delta Specs

A delta spec declares a baseline and lists only what moves. Use it for behavior that already
ships, so reviewers read the change instead of a whole subsystem.

| Signal | Mode |
|--------|------|
| New surface, no existing behavior to preserve | Full |
| Changing, extending or removing shipped behavior | Delta |
| Rewriting a subsystem end to end | Full, with the old spec as a comparison |
| More than about half the ACs would be `[ADDED]` | Full |

Record the mode in the `Mode:` header. Later phases work the same in both modes.

**Step D.1: Establish the baseline.** Cite a prior spec (`specs/archive/[feature]/spec.md @
v2.1`) or `research.md` findings (`research.md F-2 (src/auth/middleware.ts:40)`). There is no
third source. With neither, run Phase 0.5 first.

**Step D.2: Write the Baseline Assertion.** List what the change depends on being true today,
each line citing the baseline. If a line is false the spec is invalid, so Gate 1 checks these
lines against the code.

**Step D.3: Label every AC.** Each AC carries a change label and a MoSCoW label:

| Label | Means | Also requires |
|-------|-------|---------------|
| `[ADDED]` | New behavior | — |
| `[MODIFIED]` | Existing behavior changes | `Was:` quoted verbatim, and a `Migration:` line |
| `[REMOVED]` | Existing behavior goes away | `Was:`, what callers see now, deprecation timing |
| `[UNCHANGED]` | Must not break | Nothing; this is the regression suite |

A delta spec is safe to keep short only when its `[UNCHANGED]` list is explicit.

**Step D.4: Map the blast radius.** For each modified thing, list its dependents and the AC
that verifies each still works. Derive it from `research.md`, never from memory.

**Step D.5: Gate 1.** The standard checks apply plus the delta checks under Gate 1 in
[quality-gates.md](quality-gates.md).

After the change ships, fold the delta into the baseline: version up the prior spec, or promote
the delta to a full spec if the baseline was `research.md`. Allow at most two unfolded deltas
per baseline. The third means consolidate.

---

## Phase 2: Plan

Goal: a blueprint that leaves the implementer no design to invent.

**Step 2.1: Generate `plan.md`.** Run the Technical Plan Generation Prompt with the stack and
conventions. `/sdd-plan` also reads `research.md` when present. The plan needs a Risks section
with a mitigation for every High-impact risk. At level L, sketch at least two structurally
distinct designs (different module boundaries or data flow), compare them on what callers must
learn, and record the rejected one and why in `decision_log.md`.

**Step 2.2: Generate `data-model.md`** if the feature touches the database: entities, typed
fields with constraints, relationships and indexes.

**Step 2.3: Generate `contracts/`.** One file per domain with exact request and response
shapes, every error code, and the ACs each endpoint satisfies.

**Step 2.4: Trace to spec.** Every AC must map to a component in `plan.md` or a contract.

**Step 2.5: Run critics.** Optional at M, required at L. Run the Phase 2 critic agents from
[ai-agent-patterns.md](ai-agent-patterns.md) and resolve their findings before the human
review. Critics report only what they can check against the current tree. An open question
that running something could answer gets a throwaway prototype outside the feature branch, and
the plan cites its result.

**Step 2.6: Gate 2.** A checker that did not write the plan runs the completeness rows and
attaches evidence. Then the human reviews the design calls in the Gate 2 checklist.

**Step 2.7: Lock contracts.** On approval, set `Status: Planned`. `contracts/` is frozen for
Phase 4. Changing a contract mid-implementation is drift ([enforcement.md](enforcement.md)
covers the lock).

**Step 2.8: Commit.**

```bash
git add specs/[feature-name]/plan.md specs/[feature-name]/data-model.md specs/[feature-name]/contracts/
git commit -m "plan: [feature name] technical design"
```

---

## Phase 3: Tasks

Goal: tasks small enough for one AI session each, about 30 to 60 minutes of work.

**Step 3.1: Generate `tasks.md`** with the Task Breakdown Prompt.

**Step 3.2: Order tests first.** Every implementation task has a test task right before it:

```text
TASK-003: Write tests for UserRepository.create()   ← test first
TASK-004: Implement UserRepository.create()          ← implementation after
```

**Step 3.3: Size tasks.** `S` is under an hour, `M` 1 to 3 hours, `L` 3 to 6 hours. Split an `L`
into two `M` tasks.

**Step 3.4: Mark parallel tasks.** Tasks with no shared dependencies get `[P]`.

**Step 3.5: Gate 3.** A checker that did not write `tasks.md` returns a verdict with the Gate 3
checklist, and the human audits it.

**Step 3.6: Commit.**

```bash
git add specs/[feature-name]/tasks.md
git commit -m "tasks: [feature name] task breakdown"
```

---

## Phase 4: Implement

Goal: run each task constrained by the spec artifacts, one commit per task.

**Step 4.1: Set up each session.** When the first task starts, set `Status: In Progress`. Each
task gets a fresh context with `constitution.md` in full, the task, its ACs and `Boundaries`
from `spec.md`, and only the relevant parts of `plan.md`, `contracts/` and `data-model.md`.

**Step 4.2: Implement** with the Single Task Implementation Prompt.

**Step 4.3: Gate 4 before committing.** The implementer hands its test run to a checker that
did not write the code. The checker reruns it and works the Gate 4 checklist. At S that is the
quoted failing run before the change and the passing run after, and a fresh session counts as
the checker. M and L add the mutant and tautology rows. The task is not done on the
implementer's own green run, and not on `inconclusive`.

**Step 4.4: Commit.** One task, one commit, so a drifting task rolls back alone. Mark the task
`[x]` in `tasks.md` in the same commit.

```bash
git add [files]
git commit -m "feat([scope]): [task title]"
```

### When to Stop and Amend the Plan

Stop patching and propose `/sdd-change` at the plan level when the same workaround appears in
unrelated places, types need casts or `any` to compile, or two task deviations share a shape.
Each means the design is wrong, and fixing it task by task spreads the error. Write the trigger
and the evidence (files, commits) to `decision_log.md`, then stop.

### Context Budget

Clear context between tasks so earlier assumptions do not carry over. Within
a task, finish the current step and hand over at 60 to 80% utilization, and stop at once past
80%. Hand over with the Context Handover Prompt while the session still has room, commit
`progress.md` with any working code, and resume in a fresh session with the Session Resume
Prompt. A task that keeps outgrowing its window is too large: fix `tasks.md`. The full model
is in [ai-agent-patterns.md](ai-agent-patterns.md).

---

## Phase 5: Validate

Goal: prove every AC holds and nothing drifted. Gate 5 is an evidence gate. Steps 5.1, 5.2 and
5.4 run in a checker that did not write the code, and fixes in 5.3 go back to the implementer.

**Step 5.1: Traceability.** The Post-Implementation Validation Prompt writes each AC's test,
file and verdict to `validation.md`.

**Step 5.2: Drift.** Run the Drift Detection Prompt against API signatures, schema and
behavior. At M and L, also run the Adversary Prompt in its own worktree. The coordinator
(Subagent Review Pattern in [ai-agent-patterns.md](ai-agent-patterns.md)) reruns each finding,
and only reproduced findings count as drift.

**Step 5.3: Fix drift.** The checker hands the drift report to the implementer and stops. A
checker that edits code has become its author. The implementer fixes the code to match the
spec, never the reverse. If the spec is wrong, update `spec.md`, then `plan.md`, then the code,
without skipping a link. A fresh checker then reruns 5.1 and 5.2 on the new commit.

**Step 5.4: Acceptance run.** The checker exercises each user story in the running application
as a user would and attaches an artifact per story (log, screenshot, recording) to
`validation.md`. A story with no artifact is `inconclusive`.

**Step 5.5: Linear walkthrough.** Run the Linear Walkthrough Prompt for an execution-ordered
narration with `file:line` citations. If you could not debug the feature without the agent,
that is a finding to fix now. Behavior the agent cannot trace to an AC is unrequested scope.
Attach it to the PR or save `specs/[feature]/walkthrough.md`.

The human audits the Gate 5 verdict, its evidence and the walkthrough, sets
`Status: Validated`, and approves the merge.

**Step 5.6: Archive (optional).** Set `Status: Archived` and move the folder:

```bash
mkdir -p specs/archive/[feature-name]
cp -r specs/[feature-name]/* specs/archive/[feature-name]/
# Verify copy succeeded before removing originals
rm -rf specs/[feature-name]
```

Archiving also updates `specs/_current/[capability].md`. A full spec creates it from its ACs. A delta
merges by label: `[ADDED]` appends with the next free id, `[MODIFIED]` replaces the baseline AC
with its Now text, `[REMOVED]` deletes, `[UNCHANGED]` stays. Each merged AC records its
`Source:`, and the file's `Merged from:` line gains the archived spec and commit. A later delta
may use the file as its `Baseline:`. Keep `specs/archive/` in version control for regression
analysis.

---

## Reconcile: When Code Changed Outside the Workflow

Invoke with `/sdd-change [feature]` when a hotfix, a dependency upgrade or an unspecified PR
left the spec behind the code. One careless step turns it into Anti-Pattern 6, adjusting the
spec to match the code.

Reconcile edits nothing on its own. It classifies each difference individually, quotes the
evidence and proposes a direction. A human approves each item. There is no "accept all".

| Classification | Requires | Direction |
|----------------|----------|-----------|
| `INTENTIONAL` | Quoted evidence (commit, PR, incident ticket, changelog entry) that the change was deliberate | Update the spec |
| `EXTERNAL` | A cause outside your code: dependency upgrade, platform change, upstream API | Update the spec, record the cause |
| `DRIFT` | No such evidence | Fix the code |
| `AMBIGUOUS` | Evidence that does not clearly cover this difference | Human decides, defaulting to `DRIFT` |

No evidence means drift, fixed in the code. Push back on "make the spec match what's
deployed": deployed behavior is not evidence.

**Step R.1: Find the range.**

```bash
# The commit the spec was last validated against
git log --oneline -1 -- specs/[feature]/validation.md
# Everything that touched the feature's code since
git log --oneline [that-sha]..HEAD -- src/[feature paths]
```

Without `validation.md`, start from the commit that last changed `specs/[feature]/spec.md`.

**Step R.2: Classify.** Run the Reconcile Prompt ([prompt-patterns.md](prompt-patterns.md)).
It returns one row per difference with its classification and evidence.

**Step R.3: Human decides each item.** Check that the evidence authorizes this exact change
("fix login" does not authorize a new error code). A deliberate change can still be wrong, so
check any spec update against the original user story. Items can move in either direction.

**Step R.4: Apply through the chain.** Code fixes become tasks in `tasks.md` and run through
Phase 4. Spec updates cascade through `/sdd-change` to spec, plan, contracts and data model.
Editing `spec.md` alone is not a reconcile.

**Step R.5: Record why.** Log each approved spec update and its evidence in `decision_log.md`.

**Step R.6: Re-validate and commit.**

```bash
git add specs/[feature]/ && git commit -m "reconcile: [feature] spec to shipped behavior"
```

Then run `/sdd-validate`. A clean run proves the reconcile is complete.

Do not reconcile when the requirement changed (use `/sdd-change` to amend), when you are in
Phase 4 (that is drift, fix it now), or when most differences have no evidence (the feature was
rebuilt outside the process, so re-specify it).
