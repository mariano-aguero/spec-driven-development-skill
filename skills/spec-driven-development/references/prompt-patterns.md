# Prompt Patterns

Prompts for each SDD phase. Report formats and line budgets live in
[output-formats.md](output-formats.md).

## Contents

- Phase 0, Constitution: generation, security constraints
- Phase 0.5, Research: codebase research, consolidation, verification
- Phase 1, Specify: assumptions, initial spec, delta spec, clarify, post-clarify, checklist, targeted clarification, completeness, cold read
- Phase 2, Plan: generation, review
- Phase 3, Tasks: breakdown, validation
- Phase 4, Implementation: single task, handover, resume, correction
- Reconcile, Amend, Analyze, Status
- Phase 5, Validate: drift, post-implementation validation, walkthrough, adversary
- Multi-agent review, constitution from existing codebase, cross-feature conflicts

---

## Phase 0: Constitution Prompts

### Initial Constitution Generation Prompt

```
Generate constitution.md for this project using the constitution.md template in
references/artifact-templates.md.

Name: [project]  Purpose: [1-2 sentences]  Stack: [languages, frameworks, DB, auth]
Team: [solo / small / large]  Domain: [e.g. fintech]  Constraints: [compliance, SLAs]

Fill every template section. Mark anything uncertain [PENDING] for human review.
```

### Constitution Security Constraints Prompt

```
Extend constitution.md Security Constraints for [domain] on [stack] with rules against the
relevant CWEs (e.g. CWE-89, CWE-306) and domain rules (PCI-DSS: never log card data).
Write each rule so an agent can check it in a diff.
Vague: "handle errors securely". Checkable: "never return stack traces in API responses".
```

---

## Phase 0.5: Research Prompts

Research maps the system as it is today. research.md never contains acceptance criteria,
user stories, or a proposed design. Gate R in [quality-gates.md](quality-gates.md) is the
checklist.

### Codebase Research Prompt (`/sdd-research`)

Format A, for an agent with file access and subagents:

```
Research how [feature area] works today. Report only what exists.
Upcoming change, for orientation: [1-2 sentences]

1. Dispatch parallel subagents, each returning at most 300 words:
   - files involved in [area] and each file's responsibility
   - the information flow: entry point, transformation, persistence, response
   - prior art: features here that solve a similar problem
   - constraints the code already enforces (base classes, middleware, validation)
2. Consolidate into specs/[feature]/research.md with the research.md template.

Rules:
- Every claim ends with a file:line citation. Delete any claim you cannot cite.
- What you could not verify goes under "Open Questions for the Spec", never a plausible
  guess. What you skipped goes under "Not Investigated".
- No ACs, no user stories, no proposed design or improvements.
- About 200 lines at most. Past that you are dumping, not compacting.
```

Format B, for a stateless interface: paste the code and the research.md template, and use
the same rules. Citations point at the pasted code (`path/file.ts:42`), and each open
question names the file the agent needs next.

### Research Consolidation Prompt

Run when subagents or sessions produced overlapping findings.

```
Consolidate these fragments into one specs/[feature]/research.md:
[paste each fragment]

- Merge findings about the same code path. Drop claims without file:line.
- When fragments disagree, keep both and mark [CONFLICT]. Never pick one silently: an
  agent misread the code and the human must see it.
- Keep every open question and "Not Investigated" item. No ACs, stories, or design.
  Under about 200 lines.
```

### Research Verification Prompt (Gate R)

Run in a non-author agent before the human reviews research.md.

```
You did not write specs/[feature]/research.md. Verify it against the code.

Open every cited location: does the line exist, support the claim, and cover every branch,
guard, and error path? Also report involved files missing from "Relevant Files", sentences
saying what the system SHOULD do, and uncited claims.

[ISSUE] [F-N or Section] Research [BadCitation|Unsupported|Incomplete|Missing|Prescriptive] [CONFIRMED|VERIFY] <description>

Do not rewrite or approve. Issues only.
```

---

## Phase 1: Specify Prompts

### Assumptions Surface Prompt

```
I want to build: [feature]

Before any spec, list every assumption you make about roles (who triggers this), data
ownership (who reads or changes it), error behavior, integration with other parts,
scope (what done means), and performance limits. Return only the list. No spec yet.
```

The human's corrections become the `Corrected assumptions:` block of the next prompt.

### Initial Specification Prompt

```
I want to build: [feature in plain language]
Users: [who]  Constraints: [hard limits]

Corrected assumptions:
- [one line per area: Roles, Data ownership, Errors, Integration, Scope, Performance]

Write specs/[feature]/spec.md with the spec.md template in references/artifact-templates.md.
It must pass Gate 1 in references/quality-gates.md: no implementation details, every AC
independently testable with a MoSCoW label, error ACs beside the happy path, explicit Out
of Scope. Mark anything ambiguous [NEEDS CLARIFICATION] instead of choosing for me.
```

### Delta Specification Prompt (brownfield changes)

Use instead of the Initial Specification Prompt when changing behavior that already ships.
It needs a baseline: a prior spec version or research.md findings.

```
Write a DELTA spec with the delta-mode spec.md template. Do not respecify existing behavior.
Change: [1-2 sentences]
Baseline: [specs/archive/[feature]/spec.md @ v2.1 | specs/[feature]/research.md]

1. Baseline Assertion: what must be true today for this change, one line each, citing a
   prior AC or a file:line finding. An uncitable line goes to Open Questions.
2. Write only the ACs that move, labeled [ADDED] / [MODIFIED] / [REMOVED] / [UNCHANGED]
   plus MoSCoW. Quote previous behavior verbatim for [MODIFIED] and [REMOVED]; add a
   Migration line to [MODIFIED] and deprecation timing to [REMOVED].
3. [UNCHANGED] holds behavior sharing code paths with the change: the regression suite.
4. Blast radius, from the baseline: each modified item, its dependents, the AC verifying them.

If more than half the ACs are [ADDED], stop and tell me this needs a full spec.
```

### Clarify Phase Prompt

Run after spec.md exists and before the plan. Then apply the approved answers with the
Post-Clarify Spec Update Prompt.

```
Review specs/[feature]/spec.md and return only a delta:
1. Each [NEEDS CLARIFICATION] with a proposed resolution. Resolve none yourself.
2. Edge cases missing per [MUST] AC: empty input, concurrency, dependency down, permissions.
3. Vague terms ("fast", "secure", "works correctly", "easy") with the measurable
   replacement each needs.
4. New ACs to add.
Do not write a new spec.md.
```

### Post-Clarify Spec Update Prompt

```
Apply these human-approved resolutions to specs/[feature]/spec.md:
[paste approved resolutions]

- Resolved items: change [NEEDS CLARIFICATION] to [RESOLVED], keep the question, append
  "Decision: [answer]".
- Approved new ACs: add with their MoSCoW label, numbered after the last existing AC.
- Replaced vague terms: write the approved threshold into the AC.
Touch nothing outside the approved list. Return the full updated spec.md.
```

### Checklist Generation Prompt (`/sdd-validate [domain]`)

A checklist tests the spec, never the software. Its rules and when to run it are in the
generated checklists section of [quality-gates.md](quality-gates.md).

```
Generate a [domain] checklist for specs/[feature]/spec.md and write it to
specs/[feature]/checklists/[domain].md, presented in the Checklist format of
references/output-formats.md.

- Every item must be answerable by reading the spec alone. No item may use displays,
  renders, loads, executes, clicks, navigates, works, correctly, properly.
- Cover Primary, Alternate, Exception, Recovery, and Non-functional scenarios.
- Cite the spec section per item; mark [Gap], [Ambiguity], [Conflict], or [Assumption].
- An exclusion passes only when Out of Scope states it. Otherwise it is a [Gap].
Do not rewrite the spec or propose ACs.
```

| Domain | Ask about |
|--------|-----------|
| `security` | authz per path, input validation, secrets, enumeration, rate limits |
| `ux` | empty, loading, error states; destructive confirmation |
| `accessibility` | keyboard reach, focus order, async announcements, contrast |
| `performance` | latency at a percentile, payload limits, N+1 risk |
| `data-integrity` | uniqueness, referential rules, concurrent writes, partial failure |
| `i18n` | locale formats, timezones, text expansion, right-to-left |
| `observability` | what to log, what never to log, what pages someone |
| `migration` | compatibility window, rollback, in-flight data |

### Spec Clarification Prompt (targeted)

```
In specs/[feature]/spec.md, find ambiguous or untestable ACs, missing edge cases for
AC-[N], implicit assumptions, and unclear scope. Requirements only, no implementation.
```

### Spec Completeness Check Prompt

```
As a product manager, check spec.md against Gate 1 in references/quality-gates.md and
confirm an AC covers every user story. Return only gaps.
```

### Cold Read Prompt (before Gate 1)

Run in a fresh agent: a subagent, or a new session per the
[No-Subagent Fallback](ai-agent-patterns.md#no-subagent-fallback). It gets only spec.md and
constitution.md, plus the `Baseline:` files of a delta spec.
With no fresh context available, the cold read is `inconclusive`.

```
You have never seen this project or any conversation about it.
Read only specs/[feature]/spec.md, constitution.md, and files the spec's Baseline: line
names. Open nothing else.

In your own words, without quoting the spec:
1. The goal, in one sentence.
2. Each Done-when check: what you would run or inspect, and what result means done.
3. For each [MUST] AC: what you would build and what you would not build.
4. Every AC phrase with more than one reading. Name each reading. Example: "records
   belonging to M" could mean created by M, assigned to M, or shared with M.

Do not suggest improvements. Do not pick a reading silently: every guess goes in item 4.
```

Each item 4 phrase is a Gate 1 finding, fixed in spec.md. A restatement that misses what
the human meant is a spec failure, never a reader failure.

---

## Phase 2: Plan Prompts

### Technical Plan Generation Prompt

```
Read specs/[feature]/spec.md, and specs/[feature]/research.md as input if it exists.
Write plan.md, then data-model.md, then contracts/[name].md (one per domain), using the
templates in references/artifact-templates.md.

- Stack: [stack]. Follow [file or convention]. New dependencies need a justification.
- Use framework features directly. No wrapper layers.
- Every AC maps to at least one component. Every High-impact risk has a mitigation.
- Answer questions that running something can settle (layout, timing, library behavior)
  with a throwaway prototype outside the feature branch, and cite the result in plan.md.
  Do not decide them by argument.
```

### Plan Review Prompt

```
Review specs/[feature]/plan.md, data-model.md, and contracts/ against spec.md using Gate 2
in references/quality-gates.md. Report: ACs without a component, entities plan.md never
references, components exposing an API without a contract, abstractions that direct
framework use could replace, High-impact risks without mitigation.
Gap analysis only. Do not regenerate files.
```

---

## Phase 3: Tasks Prompts

### Task Breakdown Prompt

```
Read specs/[feature]/plan.md and contracts/*.md. Write tasks.md with the tasks.md template.
- One task is one commit or PR, touching at most 3 files. Split [L] tasks unless justified.
- A test task before each implementation task, citing the ACs it covers.
- Implementation tasks cite their plan.md and contracts/ sections.
- Mark parallel tasks [P], give S/M/L sizes, list dependencies by task ID.
```

### Task Validation Prompt

```
Check specs/[feature]/tasks.md against Gate 3 in references/quality-gates.md: missing test
tasks, tasks touching more than 3 files, dependency cycles, implementation before its test.
Issues only.
```

---

## Phase 4: Implementation Prompts

### Single Task Implementation Prompt

Format A, for an agent that can read files:

```
Implement TASK-[N]: [title]

Follow:
- constitution.md (never violate)
- specs/[feature]/spec.md, ACs: [section] and Boundaries, if present
- specs/[feature]/plan.md: [section]
- specs/[feature]/contracts/[file].md
- specs/[feature]/data-model.md: [Entity]

No behavior outside the ACs, no contract changes, no abstractions plan.md does not name.
Patching around the plan is a stop signal: if the same workaround
repeats in unrelated places, types need casts or `any`, or this task deviates the way an
earlier one did, stop and propose /sdd-change at the plan level.

Before reporting done:
- [ ] Each new test failed before the change; its failure output is saved
- [ ] Every referenced AC has a test; signatures match contracts; no unjustified dependency
```

Format B, for a stateless interface: paste the constitution and only this task's ACs,
Boundaries, plan section, contract, and entities, with the same Do-not list.

### Context Handover Prompt (run before a context reset, not after)

Run while the session has room. At 95% context the agent writing it is degraded.

```
This session is being reset. Write specs/[feature]/progress.md with the progress.md
template so a fresh session can resume without repeating work.
Include the goal verbatim from tasks.md, done steps with the file:line or sha proving each,
the step in flight, the blocker as the literal failing command and output, and rejected
approaches with why. Exclude narration and anything spec, plan, or contracts already say.
Under 40 lines.
```

### Session Resume Prompt (after a context reset)

```
Resume TASK-[ID] for [feature]. Read constitution.md, then specs/[feature]/progress.md,
then the AC and contract sections it cites. Start at "Current Step". Do not rerun completed
steps or anything under "Do Not Repeat". If progress.md contradicts the code, stop and
report the contradiction instead of guessing which is right.
```

### Mid-Implementation Correction Prompt (when AI drifts)

```
Stop. You drifted from the spec.
Spec: [AC or contract text]  You built: [what was generated]
Roll back and reimplement to the contract, not your judgment.
```

---

## Reconcile Prompt (`/sdd-change`)

Run when code changed outside the workflow, such as a hotfix or a dependency upgrade.
It proposes a direction per difference and waits. It edits nothing.

```
Reconcile specs/[feature]/ against the current code.
Baseline commit: [sha of last validation or last spec.md change]
Changes since: git log --oneline [sha]..HEAD -- [feature paths]

Classify each difference on its own:
INTENTIONAL  a quoted commit, PR, ticket, or changelog entry. Update the spec.
EXTERNAL     a named outside cause (dependency, platform, upstream API). Update the spec.
DRIFT        no traceable evidence. Fix the code.
AMBIGUOUS    evidence that does not clearly cover it. The human decides.

Rules:
- No evidence means DRIFT. Code that exists and works is not evidence of intent.
- Quote evidence. "Commit a3f9c21: hotfix expired-token 500" is evidence; "looks
  intentional" is not. Evidence for one change does not cover adjacent ones.
- "Make the spec match what's deployed" is not a classification. Push back and classify
  each difference anyway.
- Edit no file. Produce no updated spec. Propose and wait for approval.
- Mostly DRIFT or AMBIGUOUS means the feature was rebuilt outside the process: say it
  needs respecifying.

Present it in the Reconcile Report format of references/output-formats.md.
```

After approval, each approved spec update cascades through the Amend Prompt chain (spec,
plan, contracts, data model, tasks), never spec.md alone. Approved code fixes become tasks.
Log each spec update's evidence in `decision_log.md`. Procedure: Reconcile in
[workflow-phases.md](workflow-phases.md).

---

## Amend Prompt (`/sdd-change`)

Run when requirements change mid-development. Never skip Step 1: without an approved
impact assessment the chain ends up inconsistent.

Step 1, Impact Assessment Prompt:

```
A requirement changed: [what and why]. Current phase: [Phase N, last task done]
List "[ARTIFACT]: what changes and why" for spec.md ACs, plan.md components, contracts/
signatures and errors, data-model.md fields and migrations, and the task ID tasks.md
regenerates from. Change nothing yet.
```

Step 2, Cascade Update Prompt, after approval:

```
Approved impact: [paste]
Update in this order:
1. Create specs/[feature]/.amend-in-progress (unlocks contracts/ for this run)
2. spec.md: update ACs, annotate <!-- AMENDED [date]: [reason] -->
3. plan.md: affected components
4. contracts/: affected endpoints and error codes
5. data-model.md: affected entities, plus a migration entry if the schema changed
6. tasks.md: regenerate from TASK-[first affected ID]
7. Remove .amend-in-progress, also when you stop or abort partway
Touch no artifact outside the approved impact. Return a per-file summary.
```

---

## Analyze Prompt (`/sdd-validate`)

Finds internal contradictions in spec.md. Best after Clarify and before Plan, safe any time.

```
Analyze specs/[feature]/spec.md for internal inconsistency: Conflict (two ACs that cannot
both hold), Overlap (an AC against Out of Scope), Vague (NFR without a number), Missing (a
[MUST] happy path without an error AC), Duplicate, Untestable.

[ISSUE] [AC-N or section] [Conflict|Overlap|Vague|Missing|Duplicate|Untestable] [CONFIRMED|VERIFY] <description>

No issues: "No inconsistencies detected." Do not rewrite the spec. Use the Analyze Report
format in references/output-formats.md.
```

---

## Status Prompt (`/sdd-status`)

Answers "where am I" from disk, so the user opens no file.

```
Report the [feature] workflow state from the filesystem, never from our conversation:
open [PENDING] in constitution.md; research.md findings, uncited claims, [CONFLICT];
spec.md Status, ACs per MoSCoW label, open [NEEDS CLARIFICATION]; plan, data model, and
contracts present and locked; task count, [x] vs [ ], last feature commit, progress.md;
validation.md or walkthrough.md. A missing artifact is "not started".
End with the single next action: the next task or the gate awaiting approval.
Use the Status Report format in references/output-formats.md.
```

---

## Phase 5: Validate Prompts

### Drift Detection Prompt

```
Find the handlers for specs/[feature]/contracts/ in src/ and compare them with spec.md,
contracts/, data-model.md, and constitution.md. Report ACs without tests, signatures off
contract, fields missing from data-model.md, behavior no AC covers, unhandled contract
error codes, and constitution violations.
Use the Drift Report format in references/output-formats.md: each line names both the code
location and the artifact it contradicts, with [CONFIRMED] or [VERIFY].
```

### Post-Implementation Validation Prompt

```
Check [feature] for spec compliance. Code: [files]. Specs: spec.md, plan.md, contracts/,
constitution.md.
For each AC: the covering test (file:line), the implementing code (file:line), and a status
of PASS / FAIL / NO TEST / NOT IMPLEMENTED / OUT OF SCOPE. Also list code that satisfies no
AC; unmapped code is scope drift.
Write the matrix to specs/[feature]/validation.md in the Traceability Matrix format of
references/output-formats.md. Reply with only the 3-line summary: verdict, MUST coverage,
blocking rows.
```

### Linear Walkthrough Prompt

Run before merge. Save to `specs/[feature]/walkthrough.md` or the PR description.

```
Walk an engineer who will maintain [feature] through it. Files: [list]. Spec: spec.md.
- Execution order from the entry point the user hits, not file order.
- Each step: what happens, where (file:line, function), and why, tied to the AC or plan
  section that forced any non-obvious decision.
- What this code does not handle, and where those cases live.
- Flag anything the spec cannot justify: unrequested behavior.
Narrate the path. Do not summarize the feature.
```

### Adversary Prompt (Phase 5, levels M and L)

Run by an agent that did not write the code, in its own worktree or scratch copy, never the
implementer's checkout. Prefer a different model family from the author's.
The coordinator reruns each finding before it reaches the human (see
[Critic Findings](output-formats.md#critic-findings)).

```
You did not write this code. Break it.
Read specs/[feature]/spec.md and constitution.md. Work only in [worktree or scratch path].

For each [MUST] and [UNCHANGED] AC, try to make the real code violate it: bad input,
boundary values, repeated or concurrent calls, expired or missing state, error paths.
A plausible bypass you found by reading is worth reproducing: run it.

One finding per AC, each with the command that confirms it and its output:
[ISSUE] [AC-N] Adversary [Broken] [CONFIRMED] <summary>
  run:      <exact command>
  got:      <its output>
  required: <output the AC requires>

A finding without a rerun command and its output goes under "Dropped" with the reason.
Naming and style findings are out of scope: drop them. No fixes.
For an AC you could not break, write "AC-N held" and the commands you tried.
```

---

## Multi-Agent Review Pattern

One critic agent per role on complex specs; merge findings before moving on. Per-phase
critics are in [ai-agent-patterns.md](ai-agent-patterns.md).

```
# Critic Agent Prompt
Review specs/[feature]/spec.md as [role]:
QA (untestable, ambiguous), Security (auth, validation, exposure), Database (schema,
indexes, N+1), or Frontend (loading, empty, error states).

[ISSUE] [AC-N or Section] [Role] [Untestable|Ambiguous|Missing|Risk|Schema|UX-Gap] [CONFIRMED|VERIFY] <description>

[CONFIRMED] needs the artifact location that proves it; otherwise [VERIFY]. Never a
percentage. Nothing found: "No issues found for [role]." Issues only.
```

---

## Constitution from Existing Codebase

Run once when adopting SDD on an existing project.

```
Derive constitution.md (template) from what this codebase actually does. Read: [package manifest], [2-3 route or handler files],
[schema or migrations], [lint and format config], [auth or security utilities].

Document stack with versions, repeated architecture patterns, naming from real files and
columns, security patterns present and absent, layout, conventions to keep, and patterns to
avoid (inconsistent, or marked TODO/FIXME/HACK).

Where the code is inconsistent: [INCONSISTENT] [what varies]: [options seen]. The human
picks the standard. Undecided items: [PENDING]. Invent no rule the code does not show.
```

Resolve every `[INCONSISTENT]` and `[PENDING]` item before any feature spec uses the
constitution.

---

## Cross-Feature Conflict Detector

Run after Clarify, before Phase 2, once the project has about 3 completed features.

```
Check specs/[new-feature]/spec.md against every spec.md in specs/ and specs/archive/ for:
Endpoint (same endpoint, other behavior or errors), Entity (incompatible writes to a shared
entity), Behavior (an AC contradicting another spec), Ownership (undeclared changes to
another feature's data), Naming (one concept, two names).

[CONFLICT] [new-spec section] vs [existing spec file + section] [Endpoint|Entity|Behavior|Ownership|Naming] <description>
None: "No conflicts detected against existing specs." Report only; the human resolves each.
```
