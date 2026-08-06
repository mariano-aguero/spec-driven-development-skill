# Workflow Phases — Detailed Reference

Step-by-step execution guide for each SDD phase, including decision points and common traps.

## Contents

- Phase 0 — Constitution: intake, generation, security review, `[PENDING]` resolution, Gate 0
- Phase 0.5 — Research: run/skip decision, subagent dispatch, consolidation, citation verification, Gate R
- Phase 1 — Specify: intake, `[PENDING]` check, assumptions, generation, clarify, Gate 1
- Delta specs — brownfield mode: baseline, change labels, blast radius, folding deltas back
- Phase 2 — Plan: plan, data model, contracts, AC tracing, critics, contract lock, Gate 2
- Phase 3 — Tasks: breakdown, test-first ordering, sizing, parallelism, Gate 3
- Phase 4 — Implement: per-task session setup, verification, commits, context budget, handover
- Phase 5 — Validate: traceability, drift detection, acceptance run, linear walkthrough, archive
- Reconcile — when code changed outside the workflow: classification rules, evidence, cascade

---

## Phase 0 — Constitution

### Goal

Produce a `constitution.md` at the project root that encodes immutable constraints for
all future feature work. Every AI prompt during implementation will include it. Every
gate check will verify compliance with it. It is written once and updated only when
a fundamental project decision changes.

### Step-by-Step

**Step 0.1 — Project intake**
Before generating the constitution, gather:

- Tech stack: languages, frameworks, databases, auth mechanism
- Team conventions: naming, file structure, testing approach
- Compliance or security requirements: OWASP, GDPR, PCI-DSS, etc.
- Known anti-patterns to avoid (from past projects or code reviews)
- Any existing CLAUDE.md, .cursorrules, or AGENTS.md files to incorporate

**Step 0.2 — Generate constitution.md**
Use the prompts in `references/prompt-patterns.md → Phase 0 → Initial Constitution Generation Prompt`.
Place output at the project root: `constitution.md`.

**Step 0.3 — Security section review**
Pay special attention to the security constraints section:

- Every rule must be specific and verifiable (not "handle errors securely")
- At minimum, cover: auth requirements, input validation, secret handling, logging rules, CORS
- For security-sensitive domains, run the Security Constraints Prompt to add CWE-targeted rules

**Step 0.4 — Resolve PENDING items**
All `[PENDING]` items must be resolved before writing the first feature spec.
A pending tech decision (e.g., "do we use Redis for sessions?") will cause the first
spec to have `[NEEDS CLARIFICATION]` items that could have been decided here.

**Step 0.5 — Human review (Gate 0)**
The constitution requires the same human approval gate as any other artifact.
Review using the Gate 0 checklist in `references/quality-gates.md`.
Common review feedback:

- "This banned pattern is too vague" → make it a specific code example
- "We haven't decided on X yet" → add as `[PENDING]` with a target date
- "Security rule Y is missing" → add it now, not in the first feature spec

**Step 0.6 — Commit**

```bash
git add constitution.md
git commit -m "chore: add project constitution"
```

### When to Update

- New major dependency added to the project
- Security policy change (new compliance requirement, audit finding)
- Architecture decision that invalidates an existing principle
- Always: bump the Version field and note what changed with a date

### Time Distribution

Constitution takes 30–60 minutes for a new project. Skipping it means paying the same
cost (resolving conflicting decisions) repeatedly across every feature spec.

---

## Phase 0.5 — Research

### Goal

Produce `specs/[feature]/research.md`: an accurate, cited, ~200-line map of how the part of
the system this feature touches works **today**. It exists so that Phase 1 writes
requirements against the real system instead of an imagined one.

### Decide whether to run it

| Signal | Run research? |
|--------|--------------|
| You cannot name every file the feature will touch | Yes |
| The code was written by someone else, or by you more than a month ago | Yes |
| Two or more architectures look equally reasonable | Yes |
| Refactor, migration, or first use of an unfamiliar library | Yes |
| Greenfield module with no existing code to integrate with | No |
| You can name the touchpoints and the data flow from memory | No |

When in doubt, run it. The cost is one short session; the cost of skipping it is a spec
built on a wrong model, discovered in Phase 4.

### Step-by-Step

**Step 0.5.1 — Frame the question**
Write one or two sentences describing what you are about to build or change. This is the
only input the research phase gets. Do not include your proposed solution — it biases the
agent into confirming your plan instead of mapping the system.

**Step 0.5.2 — Dispatch parallel subagents**
Use the Codebase Research Prompt from
`references/prompt-patterns.md → Phase 0.5 → Codebase Research Prompt`.

Four axes cover most features:

| Subagent | Question it answers |
|----------|--------------------|
| Files | Which files are involved and what is each responsible for? |
| Flow | How does data move end to end — entry → transform → persist → respond? |
| Prior art | What already solves a similar problem in this repo? |
| Constraints | What conventions, base classes, or middleware must any change here respect? |

Subagents exist to keep the noise out. Glob results, grep output, and full file bodies stay
in their contexts; only the ≤300-word summaries come back.

**Step 0.5.3 — Consolidate into research.md**
Use the Research Consolidation Prompt. Apply the `research.md` template from
`references/artifact-templates.md`.

Two rules do most of the work:

- **No `file:line` citation → the claim is deleted.** Not softened, deleted.
- **Disagreement between subagents → mark `[CONFLICT]`, never silently resolve.**
  A conflict means one of them misread the code, and that is exactly what the human
  needs to look at.

**Step 0.5.4 — Verify the citations**
Run the Research Verification Prompt in a *separate* context. The agent that wrote the
research cannot audit it — it anchors to its own output (see
`references/anti-patterns.md → Anti-Pattern 15`).

The verifier opens each cited location and checks that the line exists, that the code there
supports the claim, and that no branch or error path was omitted.

**Step 0.5.5 — Human review (Gate R)**
Use the Gate R checklist in `references/quality-gates.md`.

Spot-check citations yourself — open three or four at random. This is the highest-leverage
reading you will do on the whole feature: an error here propagates into the spec, the plan,
and every task. Common review feedback:

- "This finding has no citation" → delete it or verify it
- "You missed the [X] middleware" → add to Relevant Files, re-run flow analysis
- "This says the system *should* validate here" → prescriptive language, cut it
- "Nothing under Not Investigated" → the research is claiming completeness it does not have

**Step 0.5.6 — Commit**

```bash
git add specs/[feature-name]/research.md
git commit -m "research: [feature name] codebase analysis"
```

### Handoff to Phase 1

`research.md` becomes the primary context for `/sdd:specify`. Two sections carry directly:

- **Existing Constraints Discovered** → non-functional requirements and `Boundaries` in spec.md
- **Open Questions for the Spec** → seed the `[NEEDS CLARIFICATION]` list

### Time Distribution

30–90 minutes for a mid-sized feature in an unfamiliar codebase. It is not additive to the
total — a good research doc makes Phases 1 and 2 markedly faster, because both stop guessing.

---

## Phase 1 — Specify

### Goal

Produce a `spec.md` that a developer (or AI agent) with no prior context can read and
understand exactly what to build — without needing to ask clarifying questions.

### Step-by-Step

**Step 1.1 — Feature intake**
Ask the user (or gather from issue/PRD):

- What problem does this solve?
- Who uses it?
- What does success look like?
- What are hard constraints (performance, security, compatibility)?

If `specs/[feature]/research.md` exists, load it first and treat it as ground truth about
the current system. Its "Existing Constraints Discovered" section is an input to the hard
constraints question above, and its "Open Questions for the Spec" section pre-seeds the
`[NEEDS CLARIFICATION]` list. A spec that contradicts verified research is wrong until the
research is disproven.

**Step 1.2 — Constitution [PENDING] check**
Before generating spec.md, scan `constitution.md` for any `[PENDING]` items that
intersect with this feature's domain. A [PENDING] item is blocking when the spec
would need to make the same undecided choice.

Common blocking cases:

- Feature requires authentication → `[PENDING] auth: cookie vs. JWT` is blocking
- Feature writes to the database → `[PENDING] ORM: Drizzle vs. raw SQL` is blocking
- Feature exposes a public API → `[PENDING] rate limiting strategy` is blocking

**Action:** List every [PENDING] item in constitution.md that touches the feature's scope.
For each blocking item: resolve it in constitution.md first, then proceed.
For non-intersecting [PENDING] items: proceed — they don't affect this spec.

**Step 1.3 — Surface AI assumptions**
Run the Assumptions Surface Prompt from
`references/prompt-patterns.md → Phase 1 → Assumptions Surface Prompt`.

Use the full context from Step 1.1. The AI will list every implicit assumption it's
making about: user roles, permissions, error behavior, system integrations, and scope
boundaries. Review and correct these *before* the spec is generated.

Doing this after intake (not before) produces targeted corrections — the AI's assumptions
about a "B2B SaaS with SSO" are more specific than assumptions about "user auth".

**Step 1.4 — Generate spec.md**
Use the prompt in `references/prompt-patterns.md → Phase 1 → Initial Specification Prompt`.
Include corrected assumptions from Step 1.3 in the prompt.
Place output at `specs/[feature-branch-name]/spec.md`.

**Step 1.5 — Clarify**
Run the Clarify Phase Prompt from `references/prompt-patterns.md → Phase 1 → Clarify Phase Prompt`.
Present the output to the human for review. After the human approves answers, run the
Post-Clarify Spec Update Prompt (`references/prompt-patterns.md → Post-Clarify Spec Update Prompt`)
to apply the approved resolutions to spec.md.

All `[NEEDS CLARIFICATION]` items must be `[RESOLVED]` before proceeding. Do not assume. Do not defer.

**Step 1.6 — Human review (Gate 1)**
The human must read and approve the updated `spec.md`. Use the Gate 1 checklist in
`references/quality-gates.md`. This gate is non-negotiable.
Common review feedback:

- "AC is too vague" → rewrite as Given/When/Then
- "This is actually out of scope" → move to out-of-scope section
- "Missing error case" → add AC for the error case

**Step 1.7 — Branch and commit**

```bash
git checkout -b feature/[feature-name]
git add specs/[feature-name]/spec.md
git commit -m "spec: [feature name] requirements"
```

### Time Distribution

Expect to spend 30–60% of total feature time on Phases 1–2. This is correct.
Reduced execution time more than compensates.

---

## Delta Specs

Most real work is brownfield: you are not building auth, you are changing how auth expires.
Respecifying the whole subsystem to change one rule produces a long document whose reviewers
skim — and skimmed specs are the mechanism by which SDD becomes ceremony.

A delta spec declares a **baseline** and lists only what moves.

### Choosing the mode

| Signal | Mode |
|--------|------|
| No existing behavior to preserve — new surface entirely | Full |
| Changing, extending, or removing behavior that already ships | Delta |
| Rewriting a subsystem end to end | Full — the old spec becomes the baseline for comparison, not for reuse |
| More than roughly half the ACs would be `[ADDED]` | Full — this is a new feature wearing a change's clothes |

Mode is recorded in the `Mode:` header of `spec.md`. Everything downstream — plan, tasks,
validation — works identically; only the spec's shape differs.

### Step-by-Step

**Step D.1 — Establish the baseline**

A delta spec is meaningless without a resolvable baseline. Two legitimate sources:

| Source | Use when | Cite as |
|--------|----------|---------|
| A prior spec | The feature was previously specified | `specs/archive/[feature]/spec.md @ v2.1` |
| `research.md` | The behavior predates SDD adoption | `research.md F-2 (src/auth/middleware.ts:40)` |

There is no third option. "The current behavior" as an unstated premise is how a delta spec
silently encodes a misunderstanding — and unlike a full spec, there is nothing else in the
document to contradict it.

If neither source exists, run Phase 0.5 first. This is the most common reason a brownfield
change needs research: not to design, but to have something to write `Baseline:` against.

**Step D.2 — Write the Baseline Assertion**

List what the change depends on being true today, each line citing the baseline. Keep it
short — only what this change actually leans on.

This section has a property worth understanding: **if a line here is false, the spec is
invalid rather than incomplete.** That is a stronger failure than a missing AC, and it is
why Gate 1 verifies these lines against the code rather than accepting them.

**Step D.3 — Label every AC**

Each AC carries a change label and a MoSCoW label:

| Label | Means | Also requires |
|-------|-------|---------------|
| `[ADDED]` | New behavior | — |
| `[MODIFIED]` | Existing behavior changes | `Was:` quoted verbatim, and a `Migration:` line |
| `[REMOVED]` | Existing behavior goes away | `Was:`, what callers see now, deprecation timing |
| `[UNCHANGED]` | Must not break | Nothing — but this is the regression suite |

`[UNCHANGED]` is the section people skip and the one that earns the mode. A delta spec is
only safe to be short if it is explicit about what it is *not* allowed to disturb.

**Step D.4 — Map the blast radius**

For each thing you are modifying, list what depends on it and which AC verifies it still
works. Derive this from `research.md`, never from memory — the whole risk of brownfield work
is the caller you forgot.

**Step D.5 — Gate 1 (delta variant)**

Standard Gate 1 checks apply, plus the delta-specific ones in
`quality-gates.md → Gate 1 — spec.md Approval`.

### After the change ships

Fold the delta into the baseline: update the prior spec to its new version, or promote the
delta to a full spec if the baseline was `research.md`. A chain of five delta specs against
one baseline is unreadable by the sixth change — reviewers end up reconstructing current
behavior by replaying history.

Rule of thumb: **at most two unfolded deltas against a baseline.** The third is a signal to
consolidate.

---

## Phase 2 — Plan

### Goal

Translate `spec.md` into a concrete technical blueprint that AI can implement without
inventing solutions. Every design decision must be explicit.

### Step-by-Step

**Step 2.1 — Generate plan.md**
Use the Technical Plan Generation Prompt from `references/prompt-patterns.md`.
Include your stack constraints and existing conventions. If `specs/[feature]/research.md`
exists (pre-generated via parallel subagents before Phase 1), include it as additional
context — `/sdd:plan` reads it automatically if present. The plan must include a
Risks section — identify implementation risks and a mitigation for every High-impact
risk before Phase 3 begins (see template in `references/artifact-templates.md`).

**Step 2.2 — Generate data-model.md**
If the feature touches the database:

- List every entity the feature creates, reads, updates, or deletes
- Define all fields with types and constraints
- Define foreign keys and relationships
- Identify required indexes (think about query patterns)

**Step 2.3 — Generate contracts/**
For each API endpoint, event, or public interface:

- One file per domain (e.g., `contracts/user-api.md`, `contracts/events.md`)
- Define exact request/response shapes
- Define all error codes and when they're returned
- Reference which ACs each endpoint satisfies

**Step 2.4 — Trace to spec**
Every AC in `spec.md` must appear in at least one:

- Component in `plan.md`
- Contract in `contracts/`

If an AC has no technical implementation path, the plan is incomplete.

**Step 2.5 — Run critic agents (optional, recommended for complex features)**
Before the human review, run the Phase 2 critic agents from
`references/ai-agent-patterns.md → Phase 2 Critic Agents`:
Constitution Critic, Architecture Critic, Contract Critic, Data Model Critic, Risks Critic.
Aggregate their output and resolve issues before presenting to the human.

**Step 2.6 — Human review**
The human reviews `plan.md`, `data-model.md`, and `contracts/`. Particular focus:

- Are contracts complete enough to implement without questions?
- Does the data model handle all the spec's data requirements?
- Are there simpler approaches to any components?
- Does the Risks section cover all High-impact risks with concrete mitigations?

**Step 2.7 — Lock contracts**
Once approved, `contracts/` are **frozen** for the duration of Phase 4.
Changing a contract during implementation is spec drift — plan first, then execute.

**Step 2.8 — Commit**

```bash
git add specs/[feature-name]/plan.md specs/[feature-name]/data-model.md specs/[feature-name]/contracts/
git commit -m "plan: [feature name] technical design"
```

---

## Phase 3 — Tasks

### Goal

Break `plan.md` into granular, sequential tasks small enough for a single AI session
(~30–60 minutes of implementation work).

### Step-by-Step

**Step 3.1 — Generate tasks.md**
Use the Task Breakdown Prompt from `references/prompt-patterns.md`.

**Step 3.2 — Apply test-first ordering**
For every implementation task, there must be a test task immediately preceding it:

```
TASK-003: Write tests for UserRepository.create()   ← test first
TASK-004: Implement UserRepository.create()          ← implementation after
```

**Step 3.3 — Size tasks**

- `S` (< 1 hour): single function, small component, migration
- `M` (1–3 hours): a full repository method + tests, an API route + tests
- `L` (3–6 hours): consider splitting into two `M` tasks

**Step 3.4 — Identify parallelism**
Tasks with no shared dependencies can be marked `[P]` and run simultaneously
(in separate AI sessions or by separate developers).

**Step 3.5 — Human review**
Review `tasks.md` for:

- Tasks that seem too large (will need mid-task context reset)
- Test tasks that don't reference specific ACs
- Implementation tasks that reference "see plan.md" vaguely (add specific section)

**Step 3.6 — Commit**

```bash
git add specs/[feature-name]/tasks.md
git commit -m "tasks: [feature name] task breakdown"
```

---

## Phase 4 — Implement

### Goal

Execute tasks from `tasks.md` with AI constrained by spec artifacts, committing after
each task to maintain clean rollback points.

### Step-by-Step

**Step 4.1 — Session setup per task**
Start a fresh context window for each task. Include:

- `constitution.md` (always — project-level constraints, never violate)
- The task description from `tasks.md`
- Relevant ACs from `spec.md`
- `Boundaries` section from `spec.md` (if present — feature-level constraints)
- Relevant section from `plan.md`
- Relevant contract from `contracts/`
- Relevant entities from `data-model.md`

Do NOT paste the entire spec — include only what's relevant to the current task.
`constitution.md` is the one exception: always include it in full, it is compact by design.

**Step 4.2 — Use the single-task implementation prompt**
See `references/prompt-patterns.md → Phase 4 → Single Task Implementation Prompt`.

**Step 4.3 — Verify before committing**
After AI generates code, verify:

- Tests pass (run them, don't trust the AI)
- API signatures match contracts exactly
- No new files outside the task scope were created

**Step 4.4 — Commit after each task**

```bash
git add [files]
git commit -m "feat([scope]): [task title]"
```

Do not batch multiple tasks into one commit. Each task = one commit.
This enables precise rollback if a task introduced drift.

**Step 4.5 — Mark task complete in tasks.md**

```markdown
- [x] **TASK-003** [M] Write tests for UserRepository.create()
```

Commit the updated `tasks.md` with the implementation commit.

### Context Reset Between Tasks

Clear the AI context between tasks to prevent:

- Accumulated assumptions from prior sessions
- The AI "remembering" wrong implementations it wrote earlier
- Conflicting information about how the system works

This is especially important when tasks are implemented across multiple days.

### Context Budget Within a Task

Task boundaries are the planned resets. Within a task, watch utilization and act early:

| Utilization | State | Action |
|-------------|-------|--------|
| 0–40% | Loading context | Continue |
| 40–60% | Productive band | Continue — this is where you want to live |
| 60–80% | Degrading | Finish the current step, then hand over |
| 80%+ | Unreliable | Stop. Write `progress.md` now, before quality drops further |

If a task repeatedly runs past its window, the task is too large — fix `tasks.md`, do not
compensate with longer sessions.

**Mid-task handover:**

1. Run the Context Handover Prompt (`references/prompt-patterns.md → Phase 4`) — while the
   session still has room to think, not after it has degraded
2. Commit `progress.md` alongside any working code
3. Start a fresh session with the Session Resume Prompt

See `references/ai-agent-patterns.md → Context Engineering` for the underlying model.

---

## Phase 5 — Validate

### Goal

Verify the implementation satisfies every acceptance criterion and no spec drift occurred.

### Step-by-Step

**Step 5.1 — Generate traceability matrix**
Use the Post-Implementation Validation Prompt from `references/prompt-patterns.md`.
Produces: for each AC, which test covers it, which file implements it, pass/fail.

**Step 5.2 — Run drift detection**
Use the Drift Detection Prompt from `references/prompt-patterns.md`.
Checks API signatures, database schema, and behavior against specs.

**Step 5.3 — Fix drift immediately**
If drift is found:

- Do not "adjust the spec to match the code"
- Fix the implementation to match the spec
- If the spec is genuinely wrong, update spec.md, then plan.md, then implementation
  (never skip the update chain)

**Step 5.4 — Acceptance test run**
Manually walk through each user story from `spec.md` in the running application.
Check each AC as a user, not as a developer.

**Step 5.5 — Linear walkthrough (comprehension check)**
Run the Linear Walkthrough Prompt from `references/prompt-patterns.md → Phase 5`.
It produces an execution-ordered narration of the implementation with `file:line` citations.

This step exists for the humans, not the spec. Validation proves the code is *correct*; the
walkthrough proves the team can *maintain* it. Skipping it is how a codebase accumulates
working features nobody can change.

Read it and confirm you could debug this feature at 3am without the agent. If you cannot,
that is a finding — usually unnecessary indirection introduced during Phase 4, or a
component the plan never justified. Fix it now, while the context is fresh.

Attach the walkthrough to the PR description, or save it as `specs/[feature]/walkthrough.md`.
Pay particular attention to anything the agent flags as behavior it cannot trace back to an
AC — that is unrequested scope, and it is easiest to remove before merge.

**Step 5.6 — Archive specs (optional)**
After validation passes, consider archiving completed specs to keep `specs/` clean:

```bash
mkdir -p specs/archive/[feature-name]
cp -r specs/[feature-name]/* specs/archive/[feature-name]/
# Verify copy succeeded before removing originals
rm -rf specs/[feature-name]
```

Keep `specs/archive/` in version control — specs are invaluable for regression analysis
when bugs appear in features implemented months earlier. Skip this step if your team
prefers to keep all specs in `specs/` indefinitely.

---

## Reconcile — When Code Changed Outside the Workflow

**Invoke:** `/sdd:reconcile [feature]`

Real codebases move outside the process. A 3am hotfix ships, a dependency upgrade changes
behavior, another team refactors a shared module, someone merges a PR that never saw a spec.
The spec is now stale documentation, and every future `/sdd:validate` run reports the same
noise until someone resolves it.

Reconcile is the only sanctioned path from "the code is right and the spec is behind" back to
a trustworthy spec. It is also the single most dangerous command in this skill, because it is
one careless step from Anti-Pattern 6 — adjusting the spec to match the code.

### The safeguard

**Reconcile never edits anything.** It classifies each difference, states the evidence, and
proposes a direction. A human approves each item individually. There is no "accept all".

The classification rule is what keeps it honest:

| Classification | Requires | Direction |
|----------------|----------|-----------|
| `INTENTIONAL` | **Evidence** — a commit, PR, incident ticket, or changelog entry showing the change was deliberate | Update the spec |
| `EXTERNAL` | The cause is outside your code — dependency upgrade, platform change, upstream API | Update the spec, record the cause |
| `DRIFT` | No such evidence exists | Fix the **code** |
| `AMBIGUOUS` | Evidence exists but does not clearly cover this difference | Human decides; **defaults to `DRIFT`** |

**Absence of evidence is evidence of drift.** A difference nobody can trace to a deliberate
decision is drift, and drift gets fixed in the code. Without this rule, reconcile degrades
into a machine for retroactively legitimizing whatever the code happens to do — which is
exactly the failure specs exist to prevent.

### Step-by-Step

**Step R.1 — Establish what to compare**

```bash
# The commit the spec was last validated against
git log --oneline -1 -- specs/[feature]/validation.md
# Everything that touched the feature's code since
git log --oneline [that-sha]..HEAD -- src/[feature paths]
```

If `validation.md` does not exist, the baseline is the commit that last modified
`specs/[feature]/spec.md`.

**Step R.2 — Run the reconcile prompt**

`references/prompt-patterns.md → Reconcile Prompt`. It produces one row per difference with
a classification and the evidence behind it.

**Step R.3 — Human decides, item by item**

Review each row. The two questions per item:

- Does the cited evidence actually authorize this change? A commit message saying "fix login"
  does not authorize a changed error code.
- If the spec is updated, does the new behavior still satisfy the original user story? A
  hotfix can be both deliberate *and* wrong.

An item can be reclassified in either direction during review. That is the point of the step.

**Step R.4 — Apply approved changes through the normal chain**

Reconcile does not get to shortcut the workflow it is repairing:

- Items resolved as **fix the code** become tasks in `tasks.md` and run through Phase 4
- Items resolved as **update the spec** cascade through `/sdd:amend`: spec → plan → contracts
  → data model. Never edit `spec.md` alone and call it reconciled.

**Step R.5 — Record why**

Every approved spec update gets a `decision_log.md` entry naming the evidence. Six months
later, "why does the spec say 401 here when the user story implies 403?" must have an answer
that is not "someone reconciled it once".

**Step R.6 — Re-validate and commit**

```bash
git add specs/[feature]/ && git commit -m "reconcile: [feature] spec to shipped behavior"
```

Then run `/sdd:validate` — a clean run is what proves the reconciliation is complete.

### When not to reconcile

- **The requirement changed** → `/sdd:amend`. Reconcile is for code that moved, not intent.
- **You are mid-Phase 4** → that is drift; fix it now rather than legitimizing it later.
- **You cannot find evidence for most differences** → the feature was rebuilt outside the
  process. Re-specify it rather than patching a spec that no longer describes anything.
