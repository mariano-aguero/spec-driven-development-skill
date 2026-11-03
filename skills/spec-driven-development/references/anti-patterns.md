# Anti-Patterns

The common SDD failure modes. Each entry gives the symptom, the fix, and a **Check:** line
naming what catches it: a validator rule from [`sdd-check.mjs`](enforcement.md#the-validator),
a hook, a gate row in [quality-gates.md](quality-gates.md), or `judgment only`.

## Contents

| # | Anti-pattern | Phase it bites |
|---|-------------|----------------|
| 1 | Spec with implementation details | 1 |
| 2 | Contracts modified during implementation | 4 |
| 3 | One context for all tasks | 4 |
| 4 | Skipping the human review gates | any |
| 5 | Oversized tasks | 3 |
| 6 | Adjusting the spec to match the code | 5 |
| 7 | Vague acceptance criteria | 1 |
| 8 | Missing error cases in contracts | 2 |
| 9 | SDD for trivial changes | 0 |
| 10 | No constitution | 0 |
| 11 | Treating AI like a mind reader | 1 |
| 12 | Skipping the clarify step | 1 |
| 13 | Over-specified specs | 1 |
| 14 | Implicit assumptions never challenged | 1 |
| 15 | Running critics in the generating context | any gate |
| 16 | Tasks without acceptance criteria references | 3 |
| 17 | Specifying against an imagined system | 0.5 / 1 |
| 18 | Letting the context window fill up | 4 |
| 19 | Shipping code nobody understands | 5 |
| 20 | Delta spec without a baseline | 1 |
| 21 | Reconciling drift instead of fixing it | reconcile |
| 22 | Running one ceremony level for everything | 0 |
| 23 | Mechanizing the gates away | any gate |
| 24 | Tests that cannot fail | 4 |
| 25 | Unreproduced review findings | 5 |
| 26 | Polishing an abstract plan | 2 |
| 27 | The author passes its own gate | any gate |
| 28 | Time box as a finish condition | 1 |

---

## Anti-Pattern 1: Spec with Implementation Details

**Symptoms:** spec.md names tables, functions, libraries, or frameworks. Changing the database
engine means rewriting the spec.

```markdown
## AC-1 (wrong)
The `/api/users` endpoint queries `users` JOIN `user_profiles` and returns JSON.

## AC-1 (right)
Given a valid session, when the user requests their profile,
then their full profile is returned within 200ms.
```

**Fix:** Move every technology reference to plan.md. The spec says what and why; the plan
says how.

**Check:** Gate 1 row Implementation-free.

---

## Anti-Pattern 2: Contracts Modified During Implementation

**Symptoms:** a contract was "improved" after Phase 4 started. Frontend and backend assume
different shapes. Tests match the old contract, the code matches the new one.

**Fix:** A contract change goes back up the chain. Stop Phase 4, update spec.md if an AC
changes, then plan.md, then `contracts/`, review the affected tasks, and resume from the
first affected task. Run it as an explicit `/sdd-change`.

**Check:** the contract-lock pre-write hook ([Locking `contracts/` for
Real](enforcement.md#locking-contracts-for-real)) blocks writes once the spec is `Planned` or
later. Gate 4 row Signature match catches a drifted implementation.

---

## Anti-Pattern 3: One Context for All Tasks

**Symptoms:** the agent applies an architecture from TASK-002 to TASK-008. Wrong guesses from
early tasks leak into later ones.

**Fix:** Start a fresh context per task. Load only the task, its ACs, the spec's Boundaries,
the relevant contract, plan, and data-model sections, `constitution.md`, and the project
rules file. Focused context beats more context.

**Check:** judgment only.

---

## Anti-Pattern 4: Skipping the Human Review Gates

**Symptoms:** the agent that wrote the spec approved it. Tasks were cut from an unapproved
plan. "I'll fix it in the code."

**Fix:** No artifact passes on its author's word. A human approves intent gates, a separate
checker passes evidence gates. A wrong assumption costs minutes in a spec and hours in code.

**Check:** judgment only, against the matrix in [Which Gates
Apply](quality-gates.md#which-gates-apply-at-which-ceremony-level).

---

## Anti-Pattern 5: Oversized Tasks

**Symptoms:** one task touches 8 files and takes 4 hours. The agent loses the endpoint
signature mid-task. One commit mixes unrelated changes.

**Fix:** Split any task that touches more than 3 files, covers more than one AC, or would
produce a diff over 200 lines. "One logical unit" is usually several adjacent units. A task
that fits in one sentence is the right size.

**Check:** Gate 3 row Task size, and the pre-commit diff stat listed in
[enforcement.md](enforcement.md).

---

## Anti-Pattern 6: Adjusting the Spec to Match the Code

**Symptoms:** "The agent built it differently, so I updated spec.md." The spec now records
what was built, and future features plan against past drift.

**Fix:** Code conforms to the spec. Fix the implementation. If the spec is genuinely wrong,
change it explicitly: log why in `decision_log.md`, regenerate the affected plan sections,
contracts, and tasks, then re-implement.

**Check:** Gate 5 row Drift report. Whether the spec deserves the change is judgment
(Anti-Pattern 21).

---

## Anti-Pattern 7: Vague Acceptance Criteria

**Symptoms:** "the feature works correctly", "the API is fast", "users can manage their
settings". Nobody can write a pass/fail test for them.

**Fix:** Two developers must be able to write the same automated test from the AC alone.
Performance and security criteria carry a number.

**Check:** validator rule `ac-has-proof` flags a `[MUST]` AC with no `**Proof:**` line. Gate 1
rows Testability and No vague terms cover the rest.

---

## Anti-Pattern 8: Missing Error Cases in Contracts

**Symptoms:** the frontend shows a generic 500 because the contract never defined 409. A
duplicate submit creates two records because idempotency was never stated.

**Fix:** Every contract defines its success codes, every client error (400, 401, 403, 404,
409, 422), idempotency, and rate limiting where it applies.

**Check:** Gate 2 row Error codes, Gate 5 row Contract audit.

---

## Anti-Pattern 9: SDD for Trivial Changes

**Symptoms:** a spec.md for a typo fix. The team resents the workflow.

**Fix:** Skip SDD for bug fixes under 30 minutes and for refactors with no behavior change
(state the intent in the commit message). Always use it for auth, schema, and public API
changes. Anything between gets a level from [Choosing the Ceremony
Level](../SKILL.md#choosing-the-ceremony-level).

**Check:** judgment only.

---

## Anti-Pattern 10: No Constitution

**Symptoms:** every spec restates the stack. The agent picks a new ORM, adds an
unauthenticated endpoint, or mixes camelCase and snake_case columns.

**Fix:** Write `constitution.md` once, before the first feature. Every Phase 4 prompt
includes `Constrained by: constitution.md (never violate)`.

**Check:** Gate 0, plus Gate 2 row Constitution compliance and Gate 4 row Constitution check.

---

## Anti-Pattern 11: Treating AI Like a Mind Reader

**Symptoms:** "add user authentication" yields OAuth when you wanted sessions. "Make it
faster" rewrites working code.

**Fix:** Never prompt for feature work without a spec. Without one the agent makes every
micro-decision silently, and some guesses are wrong.

**Check:** judgment only.

---

## Anti-Pattern 12: Skipping the Clarify Step

**Symptoms:** in Phase 4 the agent asks what happens when the user is not found, finds no AC,
and picks an answer. The wrong answer is now in the code.

**Fix:** Run Clarify before Plan. Run the vague-terms pass and add an AC for every error and
edge case it surfaces.

**Check:** validator rule `no-open-questions` fails any `[NEEDS CLARIFICATION]` left once
Status is past `Draft`. Gate 1 row Error coverage.

---

## Anti-Pattern 13: Over-Specified Specs

**Symptoms:** an AC can only be met one way. The plan has no decisions left.

```markdown
## AC-1 (wrong)
Use a B-tree index and connection pooling; sort results with merge sort.

## AC-1 (right)
Given a search query, when the user submits it,
then results appear within 50ms at p95 under 100 concurrent users.
```

**Fix:** State the threshold, capacity, or outcome. Never the mechanism. If a spec line
reads "use X to achieve Y", move "use X" to plan.md, where the tradeoff gets weighed.

**Check:** Gate 1 row Implementation-free.

---

## Anti-Pattern 14: Implicit Assumptions Never Challenged

**Symptoms:** "authenticated user" means cookies but the system uses API keys. Password reset
goes by email when the product requires SMS. The spec looked plausible, so it was approved.

**Fix:** Run the [Assumptions Surface Prompt](prompt-patterns.md#assumptions-surface-prompt)
after intake and before spec.md. It lists the agent's assumptions about roles, errors,
integrations, scope, and performance. Correct the wrong ones before they become ACs.

**Check:** judgment only. Gate 1 row Cold read (M, L) surfaces a goal the human did not
intend.

---

## Anti-Pattern 15: Running Critics in the Generating Context

**Symptoms:** a critic finds only nits in a spec it just wrote. The critique reads like a
summary.

**Fix:** Run every critic in a fresh context that receives only the artifact and the critic
prompt. A critic that knows why each decision was made defends it.

```text
wrong: spec written in session A, QA critic run in session A
       -> "Looks comprehensive. AC-3 could be more specific."
right: critic run in session B with spec.md only
       -> "ISSUE AC-3 QA Untestable: no error case for an expired token"
```

**Check:** judgment only.

---

## Anti-Pattern 16: Tasks Without Acceptance Criteria References

**Symptoms:** "Implement UserRepository" with no AC. In Phase 4 the fresh context has no
definition of done, and nobody knows which spec sections to load.

```markdown
- [ ] **TASK-004** [M] Implement UserRepository.create()
  - Contract: `specs/[feature]/contracts/user-api.md → POST /users`
  - Satisfies: AC-1, AC-E1, AC-E2
  - Depends on: TASK-003
```

**Fix:** Test tasks cite the ACs they test, error ACs included. Implementation tasks cite
their contract and the ACs they satisfy.

**Check:** validator rule `task-refs-ac` fails a task with no AC, directly or through its
dependencies, and any AC not in spec.md. Gate 3 rows Contract references and Satisfies
declaration.

---

## Anti-Pattern 17: Specifying Against an Imagined System

**Symptoms:** the spec assumes a service or hook that does not exist, or exists differently.
The plan reinvents a utility the codebase has. The feature bypasses middleware every other
feature uses.

```markdown
### AC-3: Session expiry [MUST]  (wrong, no research)
Given a session older than 24h, when the user makes a request, then it returns 401.
```

The codebase already expires sessions in `src/auth/middleware.ts:40` with a 12h TTL. This AC
specifies a second, conflicting mechanism. The spec is internally consistent, so every gate
that reads only the spec passes it.

**Fix:** Run Phase 0.5 whenever the feature touches code you cannot describe from memory.
Feed its constraints into the non-functional requirements and Boundaries. When an AC
contradicts verified research, the AC is wrong until the research is disproven.

**Check:** judgment only for whether to research. Once `research.md` exists, Gate R and the
CI research citation check in [quality-gates.md](quality-gates.md).

---

## Anti-Pattern 18: Letting the Context Window Fill Up

**Symptoms:** auto-compaction fires mid-task and the contract is summarized away. The agent
contradicts its own earlier decision or redoes finished work.

**Fix:** Work in the 40 to 60% band and hand over between 60 and 80%. Write `progress.md` with
the Context Handover Prompt before quality degrades, commit, and resume in a fresh session.
Never let auto-compaction end a task. Tasks that outgrow their window are too large. See
[Context Engineering](ai-agent-patterns.md#context-engineering).

**Check:** judgment only.

---

## Anti-Pattern 19: Shipping Code Nobody Understands

**Symptoms:** the PR merged because tests pass and the diff was too big to read. Nobody can
explain why a layer exists. Every bug routes back to whoever prompted it.

**Fix:** Run the [Linear Walkthrough Prompt](prompt-patterns.md#linear-walkthrough-prompt)
and have someone who did not drive the work read it. Spend review on the spec and plan
(about 400 dense lines), where attention pays most. Delete structure that traces to no
decision in plan.md. Keep specs in the code PR and archive them. A spec nobody reads is
documentation theater.

**Check:** Gate C rows Human read it, Debuggable, and Justified structure.

---

## Anti-Pattern 20: Delta Spec Without a Baseline

**Symptoms:** "currently the system does X" with nothing to check X against. Reviewers cannot
tell what a `[MODIFIED]` AC changes. `[UNCHANGED]` is empty.

```markdown
### AC-1: Shorten token expiry [MODIFIED] [MUST]
**Was:** "...more than 15 minutes ago... fails with 410 Gone." (baseline AC-4)
**Now:** Given a magic link issued more than 5 minutes ago, when the user clicks it,
then verification fails with 410 Gone.
**Migration:** links already issued keep their 15-minute window.
```

**Fix:** Quote the previous behavior verbatim; a paraphrase hides whether the author read the
baseline. Fill `[UNCHANGED]` with the behavior that shares code paths with the change; it is
the regression suite. If no prior spec exists, run Phase 0.5 and cite its findings. Fold
deltas back into the baseline: at most two unfolded deltas.

**Check:** validator rule `delta-baseline` fails a `Mode: Delta` spec whose `Baseline:` is
missing or does not resolve. Gate 1 delta rows Baseline Assertion verified, Previous behavior
quoted, and Regression coverage. The two-delta limit is judgment only.

---

## Anti-Pattern 21: Reconciling Drift Instead of Fixing It

**Symptoms:** `/sdd-change` output is approved wholesale. `INTENTIONAL` items cite no commit,
PR, or ticket. The spec drifts toward whatever the code does. Reconcile is the one command
that edits the spec to match the code, so this is Anti-Pattern 6 with a command name.

> Right: "6 differences. Two INTENTIONAL (7d21e0f, PR #218), one EXTERNAL (framework 4.2
> changed SameSite). Two DRIFT with no evidence: the rate-limit key is per-IP but AC-E3 says
> per-email, filed as TASK-014. One AMBIGUOUS, defaulted to DRIFT. Approved the three spec
> updates and logged the evidence in `decision_log.md`."

**Fix:**

- No traceable evidence means drift. Without a commit, PR, incident, or changelog entry, the
  difference is fixed in the code and never specified as intended.
- Approve item by item. Nine differences take nine decisions.
- Scope evidence to its difference. A commit for one change does not cover its neighbors.
- Ask whether the deliberate change still satisfies the original user story.
- An approved spec update cascades through the chain: plan.md, `contracts/`, and tasks.md
  are updated to match, the same way a [contract change](#anti-pattern-2-contracts-modified-during-implementation)
  is.
- If most items are `DRIFT` or `AMBIGUOUS`, stop. The feature needs re-specifying.

**Check:** judgment only, using [Spec Drift
Classification](quality-gates.md#spec-drift-classification).

---

## Anti-Pattern 22: Running One Ceremony Level for Everything

**Symptoms:** a copy change produces a spec, plan, contracts, and tasks. Or a payment flow
ships with ACs in a PR comment. Gates at M are skipped instead of the level being lowered.
Always-heavy gets the practice abandoned; always-light fails on the first change that touches
money, auth, or a migration.

> Right: "Copy fix, S: ACs and Done when in the PR body, a fresh session saw the test fail
> before and pass after. Export endpoint, M. Payment migration, L: research, all critics,
> walkthrough."

**Fix:** Choose the level per change, at the start, with the rule in [Choosing the Ceremony
Level](../SKILL.md#choosing-the-ceremony-level). The tiebreaker is reversibility, not size: a
one-line permission change outranks a large report-layout change. Promote mid-flight when
the ground shifts; never demote, since that discards a gate you already chose. If you skip
gates at M, drop to S deliberately and record why.

**Check:** judgment only, against [Which Gates
Apply](quality-gates.md#which-gates-apply-at-which-ceremony-level).

---

## Anti-Pattern 23: Mechanizing the Gates Away

**Symptoms:** "Gate 2 passed" means a CI job went green. Nobody has read a plan in weeks.
Hooks warn and block nothing. A blocking hook is bypassed with a flag everyone knows. Specs
are well formed and describe the wrong system.

| Mechanical checks verify | Only a human verifies |
|--------------------------|----------------------|
| The rules were followed | The rules were right |
| Every AC has a test | The ACs describe what we want |
| Citations resolve | The findings are true |
| The diff is small | Anyone understands it |

**Fix:**

- Promote rules to hooks freely ([enforcement.md](enforcement.md)), but never name a CI job
  after a gate. A green job gets read as a passed gate, and "CI passed" is a different claim
  from "Gate 2 passed".
- Hooks that warn but never block are theater. Make the hook block or delete it.
- A blocking hook that is routinely bypassed has the wrong rule. Fix the rule.
- Keep the judgment gates staffed. If you cannot, lower the level deliberately.

Automation stops you shipping what you already knew was wrong. It says nothing about what
nobody thought of.

**Check:** judgment only. By definition no hook can catch it.

---

## Anti-Pattern 24: Tests That Cannot Fail

**Symptoms:** a new test passed before its code existed. The expected value comes from the
function under test. `validation.md` has an empty Before or Mutant column.

```ts
const fixture = { ttlMinutes: 15 }
expect(fixture.ttlMinutes).toBe(15) // wrong: never runs the token code
```

**Fix:** Delete a test that cannot fail and record the AC as unproven.

**Check:** Gate 4 rows Failing before, Mutant killed (M, L), and No tautologies (M, L).

---

## Anti-Pattern 25: Unreproduced Review Findings

**Symptoms:** a review lists ten `[CONFIRMED]` findings and none has a command. Threads argue
about whether a bug exists.

**Fix:** For code, `[CONFIRMED]` needs the command, its output, and the output the spec
requires, and the coordinator reruns it ([Critic Findings](output-formats.md#critic-findings)).
A claim without a command goes to the Dropped list with that reason.

**Check:** Gate 5 row Adversary (M, L).

---

## Anti-Pattern 26: Polishing an Abstract Plan

**Symptoms:** three rounds of plan critics, each finding new risks about a library nobody has
called. The plan grows and no line is checked against the tree.

> Right: "Does the queue reorder under load? A 40-line prototype outside the branch sent 10k
> messages, zero reordered. Cited in plan.md, sequencing layer dropped."

**Fix:** Answer anything that running something could answer with a throwaway prototype
outside the feature branch. Plan critics report only what they can check against the
current tree.

**Check:** judgment only.

---

## Anti-Pattern 27: The Author Passes Its Own Gate

**Symptoms:** the implementer reports "Gate 4 passed" from its own run. `validation.md` has no
Checked by column, or it names the implementer. A gate passed with a tool missing.

**Fix:** Evidence gates go to an agent that did not produce the artifact, intent gates to a
human. With no subagents, use a fresh session from the artifacts alone or report
`inconclusive` ([No-Subagent Fallback](ai-agent-patterns.md#no-subagent-fallback)).

**Check:** judgment only, against the rule in [Which Gates
Apply](quality-gates.md#which-gates-apply-at-which-ceremony-level).

---

## Anti-Pattern 28: Time Box as a Finish Condition

**Symptoms:** Done when reads "work on this for 4 hours". An overnight run ends on the clock
with a long summary and no passing check.

**Fix:** A duration is a budget for the run. Each Done-when line is a command or an
observable artifact, such as `pnpm test tests/export` passing.

**Check:** validator rule `done-when-checkable`, and Gate 1 row Done when checkable.
