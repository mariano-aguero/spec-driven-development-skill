# Anti-Patterns

The most common SDD failure modes, their symptoms, and how to fix them.

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

---

## Anti-Pattern 1: Spec with Implementation Details

**Symptoms:**

- spec.md mentions specific tables, functions, libraries, or frameworks
- Developers disagree about whether to use PostgreSQL or Redis based on spec
- Changing the database engine requires rewriting the spec

**Example (wrong):**

```markdown
## AC-1
The `/api/users` endpoint should query the `users` table using a JOIN
with the `user_profiles` table and return the result as JSON.
```

**Example (correct):**

```markdown
## AC-1
Given a valid session, when the user requests their profile,
then their full profile information is returned within 200ms.
```

**Fix:** Remove all technology references from spec.md. Move them to plan.md.
The spec describes WHAT and WHY. Plan.md describes HOW.

---

## Anti-Pattern 2: Contracts Modified During Implementation

**Symptoms:**

- `contracts/user-api.md` was "improved" after Phase 4 started
- Frontend and backend have different assumptions about the API shape
- Tests written against the old contract, implementation matches the new one

**The trap:** AI suggests "a better" response format while generating code, and you accept it.
Now the contract is stale and other tasks that depend on it are broken.

**Fix:** Lock `contracts/` after Phase 2 approval. If a contract needs to change:

1. Stop Phase 4
2. Update spec.md (if it affects acceptance criteria)
3. Update plan.md
4. Update contracts/
5. Review affected tasks.md entries
6. Resume Phase 4 from the affected task

Never treat contracts as drafts during implementation.

---

## Anti-Pattern 3: One Context for All Tasks

**Symptoms:**

- AI "remembers" it used a different architecture in TASK-002 and applies it to TASK-008
- Accumulated hallucinations from earlier tasks contaminate later ones
- "You already created this function in the previous message" — but it was wrong

**Fix:** Start a fresh AI context for each task. Include only what's relevant:

- The specific task from tasks.md
- The specific ACs it covers from spec.md
- The Boundaries section from spec.md (feature-level do/ask/never rules)
- The relevant contract section from contracts/
- The relevant plan section from plan.md
- The relevant entities from data-model.md
- Project conventions from constitution.md (always) and CLAUDE.md or equivalent

More context ≠ better output. Focused context produces better output.

---

## Anti-Pattern 4: Skipping the Human Review Gates

**Symptoms:**

- Spec approved by the AI that generated it
- Plan not reviewed before tasks were created
- Tasks created from an unapproved plan
- "I'll fix it in the code" — drift accumulates

**The trap:** When you're in flow, the gates feel like friction. They're not — they're the
moment where wrong assumptions cost minutes (in specs) vs. hours (in code).

**Fix:** Human approval of each artifact is mandatory. There are three hard gates:

- Gate 1: spec.md approved before plan generation
- Gate 2: plan.md + contracts/ approved before task generation
- Gate 3: tasks.md reviewed before implementation

Unapproved artifacts propagate errors forward into every subsequent phase.

---

## Anti-Pattern 5: Oversized Tasks

**Symptoms:**

- TASK-007 touches 8 files and takes 4 hours
- AI loses context mid-task and asks what the endpoint signature should be
- Multiple unrelated changes in one commit make rollback difficult

**The trap:** "This is all one logical unit" is almost never true — it's usually several
units that happen to be adjacent in the code.

**Fix:** Split any task that:

- Touches more than 3 files
- Has more than one acceptance criterion
- Would produce a commit diff over 200 lines

A task that can be described in one sentence is the right size.

---

## Anti-Pattern 6: Adjusting the Spec to Match the Code

**Symptoms:**

- "The AI implemented it differently, so I updated spec.md to reflect that"
- Spec.md now describes what was built, not what was wanted
- Future features are planned against a spec that documents past drift

**The trap:** It feels like keeping docs in sync. It's actually destroying the spec's value
as a source of truth.

**Fix:** Code must conform to spec. Never the reverse. When drift is found:

1. Fix the implementation to match the spec
2. If the spec is genuinely wrong (new information emerged), update it explicitly:
   - Write a comment in `decision_log.md` explaining why the spec changed
   - Regenerate the affected plan sections
   - Regenerate affected contracts
   - Update affected tasks
   - Re-implement

This feels slow. It's faster than discovering the problem after 6 more features
were built on top of the drift.

---

## Anti-Pattern 7: Vague Acceptance Criteria

**Symptoms:**

- "The feature works correctly" — no test can be written for this
- "The API is fast" — 10ms or 10s?
- "Users can manage their settings" — create, read, update, delete, or just read?

**Fix:** Every AC must pass the testability test:

- Can you write an automated test that returns pass or fail? If no → rewrite.
- Can two developers independently write the same test? If no → rewrite.
- Does it include a measurable threshold for performance/security criteria? If no → add one.

---

## Anti-Pattern 8: Missing Error Cases in Contracts

**Symptoms:**

- Frontend shows a generic 500 error because the contract didn't define 409 CONFLICT
- Auth errors not handled because the contract said "returns 200"
- Duplicate submission creates two records because the idempotency behavior wasn't specified

**Fix:** For every contract, explicitly define:

- All success responses (200, 201, 204)
- All client error responses (400, 401, 403, 404, 409, 422)
- Idempotency behavior (is this endpoint safe to call twice?)
- Rate limiting behavior if applicable

---

## Anti-Pattern 9: SDD for Trivial Changes

**Symptoms:**

- spec.md created for "fix typo in error message"
- Full 5-phase workflow for a 2-line bug fix
- Team resents SDD because overhead exceeds benefit

**Fix:** SDD has a setup cost. Apply it where the payoff exceeds the cost:

- Features that touch ≥ 3 files: use SDD
- Features that touch auth, DB schema, or public API: always use SDD
- Bug fixes under 30 minutes: skip SDD, fix directly
- Refactors with no behavior change: document intent in a commit message, skip SDD

---

## Anti-Pattern 10: No Constitution

**Symptoms:**

- Each feature spec re-establishes the same technology choices
- AI introduces a new ORM, a different validation library, or a conflicting auth pattern
- Security constraints need to be repeated in every prompt
- One feature uses camelCase columns, another uses snake_case

**Example (what happens without constitution.md):**

```
Feature A spec: "Use PostgreSQL for storage"
Feature B spec: (forgot to mention) → AI uses SQLite
Feature C spec: (forgot to mention auth rules) → AI adds unauthenticated endpoints
```

**Fix:** Create `constitution.md` once before the first feature spec. It becomes the
shared context for every subsequent AI interaction, ensuring consistency without repetition.

Every AI prompt for Phase 4 includes: `Constrained by: constitution.md (never violate)`.

---

## Anti-Pattern 11: Treating AI Like a Mind Reader

**Symptoms:**

- Prompt: "Add user authentication" → AI builds OAuth when you wanted sessions
- Prompt: "Make it faster" → AI rewrites working code, introduces bugs
- Prompt: "Add the missing validation" → AI adds it in the wrong layer

**The root cause:** Without a spec, AI makes thousands of micro-decisions silently.
It's not wrong — it's guessing. And some guesses will be wrong.

**Fix:** Never prompt an AI coding agent for feature work without a spec. The spec is
not overhead — it's the instruction set. A developer who can't be given detailed
instructions is not a developer you can rely on.

> "You wouldn't hire a junior dev without giving them specs. Why let an AI code without one?"

---

## Anti-Pattern 12: Skipping the Clarify Step

**Symptoms:**

- spec.md has `[NEEDS CLARIFICATION]` items that were never resolved
- Plan was written with assumed answers that turned out to be wrong
- "The spec says X but we actually meant Y" — discovered during implementation

**The trap:** Spec looks complete enough. You move to Plan. Then in Phase 4 the AI asks
"what should happen when the user is not found?" and you realize there's no AC for it.
The AI picks an answer. It's wrong. Now you have drift baked into the implementation.

**Fix:** The Clarify step is mandatory. Before Plan generation:

1. Resolve every `[NEEDS CLARIFICATION]` item — no assumptions
2. Run the spec validation pass (vague terms check)
3. Add ACs for every error and edge case surfaced during clarification

30 minutes on Clarify saves 3 hours of wrong implementation.

---

## Anti-Pattern 13: Over-Specified Specs

**Symptoms:**

- spec.md references specific technologies, algorithms, or data structures
- Acceptance criteria can only be satisfied by one implementation approach
- The plan has no decisions left to make — spec already made them
- Changing the database engine requires rewriting acceptance criteria

**Example (wrong):**

```markdown
## AC-1
The system shall use a B-tree index and connection pooling to return search results
in under 50ms. Results shall be sorted using a merge sort algorithm.
```

**Example (correct):**

```markdown
## AC-1
Given a search query, when the user submits the form,
then results appear within 50ms at p95 under 100 concurrent users.
```

**The trap:** Specs feel thorough when they include implementation details. But
over-specification locks in decisions that belong in Phase 2 (Plan) — where tradeoffs
can be evaluated with full technical context.

**Fix:** Specs answer WHAT and WHY. Plans answer HOW.

- Performance requirements: specify the threshold, not the mechanism
- Storage requirements: specify capacity or behavior, not the technology
- Algorithm requirements: specify the outcome (correctness, speed), not the approach

If you find yourself writing "use X to achieve Y" in a spec, stop.
Move "use X" to plan.md and keep only "achieve Y" in spec.md.

---

## Anti-Pattern 14: Implicit Assumptions Never Challenged

**Symptoms:**

- AI generates a spec where "authenticated user" means session cookies — but your system uses API keys
- "Success response" in every AC means 200, but you needed 201 for resource creation
- The spec looks reasonable and the human approves it — mismatches surface in Phase 4
- AI builds email-based password reset when the system requires SMS OTP

**The trap:** The spec was written with the AI's assumptions baked in as facts. The human
reviewer saw a plausible-looking spec and approved it. Nobody challenged the assumptions
because they were never made visible.

**Example (hidden assumptions):**

```
Prompt: "specify a password reset feature"

AI assumes (silently):
- Email-based reset link (but your system uses SMS)
- 24-hour token expiry (but compliance requires 15 minutes)
- Self-service (but your enterprise product requires admin approval)
- Single active token per user (but you need session-scoped tokens)

All four become wrong ACs in the spec.
```

**Fix:** Run the Assumptions Surface Prompt (see `references/prompt-patterns.md → Phase 1`)
**after** feature intake but **before** generating spec.md. The AI will explicitly list
every assumption it's making about roles, permissions, error behavior, integrations,
scope, and performance. Correct the wrong ones before they become ACs.

The cost of surfacing assumptions: ~2 minutes.
The cost of discovering wrong assumptions in Phase 4: hours of rework plus spec amendment.

---

## Anti-Pattern 15: Running Critics in the Generating Context

**Symptoms:**

- Critic agent finds only minor issues in a spec it just wrote
- "No issues found" after a 30-second review of a complex spec
- The critique reads like a summary of the spec, not a challenge to it
- Issues surface in Phase 4 that a genuine critic would have caught

**The trap:** Running Phase 1 or Phase 2 critic agents in the same conversation that
generated the spec or plan. The generating agent has anchored to its own decisions.
When asked to critique, it rationalizes its choices as deliberate rather than questioning
them. It finds surface-level issues while missing structural ones.

**Example (wrong):**

```
[User generates spec.md in conversation A]
[User runs QA Critic prompt in the same conversation A]
→ "The spec looks comprehensive. Minor suggestion: AC-3 could be more specific."
→ Ships to Phase 2. Phase 4 reveals AC-3 has no error path coverage.
```

**Example (correct):**

```
[User generates spec.md in conversation A → closes conversation]
[User opens new conversation B, pastes QA Critic prompt + spec.md content]
→ "ISSUE AC-3 QA Untestable: no error case for invalid token — what happens when it expires?"
→ Fixed before Plan generation.
```

**Fix:** Run every critic agent in a fresh context with no memory of the generating session.
The critic receives only: the artifact being reviewed + the critic prompt.
No context about why decisions were made — that's what makes it find real issues.

A critic that knows the reasoning behind each decision cannot genuinely challenge those
decisions. This is precisely why the Subagent Review Pattern uses separate agents.
"I'll review my own spec" is not a review — it's a summary with extra steps.

---

## Anti-Pattern 16: Tasks Without Acceptance Criteria References

**Symptoms:**

- tasks.md has entries like "Implement UserRepository" with no AC citation
- During Phase 4, AI asks "what should happen when the user isn't found?"
- Gate 4 cannot be verified — unknown which ACs each task was supposed to cover
- Test tasks pass but the wrong behavior is tested
- Two tasks implement overlapping behavior; one AC is never covered

**The trap:** Task breakdown felt faster without AC references. The tasks look clear.
But in Phase 4, each task runs in a fresh context — the AI has no spec unless you
provide it explicitly. Without AC citations, you don't know which spec sections to
include in the task context, and the AI has no definition of "done."

**Example (wrong):**

```markdown
- [ ] **TASK-003** [M] Write tests for UserRepository.create()
  - Depends on: TASK-001

- [ ] **TASK-004** [M] Implement UserRepository.create()
  - Depends on: TASK-003
```

**Example (correct):**

```markdown
- [ ] **TASK-003** [M] Write tests for UserRepository.create()
  - Tests: AC-1 (success path), AC-E1 (duplicate email), AC-E2 (invalid input)
  - Depends on: TASK-001

- [ ] **TASK-004** [M] Implement UserRepository.create()
  - Contract: `specs/[feature]/contracts/user-api.md → POST /users`
  - Satisfies: AC-1, AC-E1, AC-E2
  - Depends on: TASK-003
```

**Fix:** Every task must declare:

- **Test tasks:** the specific ACs being tested, including error ACs
- **Implementation tasks:** the contract it implements + the ACs it satisfies

This makes Gate 4 mechanical: run the tests, check the AC list, verify the contract.
It also makes Phase 4 context loading automatic — you know exactly which spec sections
to include in each task's context window without guessing.

---

## Anti-Pattern 17: Specifying Against an Imagined System

**Symptoms:**

- The spec assumes a service, table, or hook that does not exist — or exists differently
- Phase 4 stalls on "there's already a `SessionManager` that does this differently"
- The plan reinvents a utility the codebase already has
- An AC turns out to be impossible given a constraint nobody knew about
- The feature "works" but bypasses the middleware every other feature goes through

**The trap:** The feature description sounded self-contained, so the spec was written
directly from it. Nobody lied — the agent simply filled the gaps in its model of the
codebase with the most statistically ordinary architecture, and that model was wrong. The
spec is internally consistent, which is exactly why the error survives every gate that only
reads the spec.

**Example (wrong):**

```markdown
### AC-3: Session expiry [MUST]
Given a session older than 24h, when the user makes a request,
then the session is invalidated and a 401 is returned.
```

Written without research. The codebase already invalidates sessions in middleware at
`src/auth/middleware.ts:40`, using a 12h TTL from config — this AC quietly specifies a
second, conflicting expiry mechanism.

**Example (correct):**

```markdown
### AC-3: Session expiry [MUST]
Given a session past the configured TTL (currently 12h — `src/config/auth.ts:9`),
when the user makes a request, then existing middleware invalidates it and returns 401.

<!-- research.md F-4: expiry is enforced centrally at src/auth/middleware.ts:40.
     This feature must not add a second expiry path. -->
```

**Fix:** Run Phase 0.5 before writing the spec whenever the feature touches code you cannot
fully describe from memory. Feed "Existing Constraints Discovered" into the spec's
non-functional requirements and `Boundaries`. When an AC contradicts verified research, the
AC is wrong until the research is disproven — not the other way around.

**Cost asymmetry:** research is 30–90 minutes. A spec built on a wrong model is discovered
in Phase 4, after the plan, the tasks, and part of the implementation are already built on it.

---

## Anti-Pattern 18: Letting the Context Window Fill Up

**Symptoms:**

- Auto-compaction fires mid-task and the agent "forgets" the contract
- The agent contradicts a decision it made 20 minutes earlier in the same session
- Quality visibly degrades late in long sessions
- The agent asks a question that spec.md answered explicitly
- After a compaction, the agent re-implements something already done

**The trap:** Compaction feels like a tooling detail — the agent handles it, so why manage
it. But automatic compaction happens under pressure, at the worst possible moment, and the
summarizer does not know that one line of the contract was load-bearing. You lose exactly
the details you cannot afford to lose, and you find out later.

**Example (wrong):**

```
[Session at 92% context]
Human: continue with TASK-007
Agent: [auto-compaction fires] ... implements TASK-007 with the response shape
       it inferred, because the contract paste was summarized away
```

**Example (correct):**

```
[Session at ~70% context, current step finished]
Human: [Context Handover Prompt] → writes specs/[feature]/progress.md
       git commit
[Fresh session]
Human: [Session Resume Prompt] → reads constitution.md + progress.md + the contract
```

**Fix:** Treat context as a managed budget, not an ambient resource.

- Work in the 40–60% utilization band; hand over between 60–80%
- Write `progress.md` *before* degradation, not after — a handover authored by a degraded
  agent inherits its confusion
- Never let auto-compaction be the mechanism that ends a task
- If tasks routinely outgrow their window, the tasks are too large — fix `tasks.md`

See `ai-agent-patterns.md → Context Engineering`.

---

## Anti-Pattern 19: Shipping Code Nobody Understands

**Symptoms:**

- The PR is approved because tests pass and the diff is too large to read
- Nobody on the team can explain why a layer or abstraction exists
- Bug reports in this feature always route back to whoever prompted it
- The next change to this code is quoted as a rewrite
- Onboarding takes longer despite more documentation existing

**The trap:** Every artifact was produced, every gate passed, and the tests are green — so
the feature looks finished. But correctness and comprehension are different properties.
Agents generate code several times faster than humans read it, and review pressure resolves
in favor of the green checkmark. The debt is invisible and interest-free until the first
incident.

**Example (wrong):**

> "Gate 5 passed — traceability matrix complete, zero drift, all tests green. Merging."

Nobody has read the implementation end to end. Six weeks later a p0 lands in this feature
and the only available debugging strategy is to ask an agent to re-read its own output.

**Example (correct):**

> "Gate 5 passed. Walkthrough attached to the PR — it flagged a caching layer in
> `src/features/x/cache.ts:20` that traces to no plan decision. Removed it; the query is
> 8ms. Two of us have read the flow and can debug it."

**Fix:** Add the comprehension step to your definition of done.

- Run the Linear Walkthrough Prompt and have someone who did not drive the implementation
  read it (Gate C in `quality-gates.md`)
- Review the spec and plan carefully — ~400 dense lines — rather than skimming a
  2000-line diff, which is where human attention is worth the least
- Delete any structure that traces to no decision in `plan.md`
- Keep specs in the same PR as the code, and archive rather than delete them

**The distinction that matters:** a spec nobody reads is documentation theater. SDD converts
review effort into comprehension only if the artifacts are actually read — by humans, before
merge.

---

## Anti-Pattern 20: Delta Spec Without a Baseline

**Symptoms:**

- The spec says "currently the system does X" with nothing to check X against
- Reviewers cannot tell whether a `[MODIFIED]` AC actually changes anything
- The `[UNCHANGED]` section is empty, or absent
- Two people read the same delta spec and disagree about what ships
- A later change writes a delta against a delta, against a delta

**The trap:** Delta mode is chosen for the right reason — the change is small, respecifying
the subsystem would be ceremony — but the baseline is left implicit. The document reads fine
because assertions about current behavior are stated with the same confidence as the changes.
Nothing in the spec can contradict them, which is exactly what a full spec's redundancy would
have caught.

**Example (wrong):**

```markdown
Mode: Delta

## Acceptance Criteria

### AC-1: Shorten token expiry [MODIFIED] [MUST]
Tokens now expire after 5 minutes instead of the current expiry.
```

"The current expiry" is unverifiable. If the author believed it was 15 minutes and it is
actually 12, the migration note, the tests, and the reviewer's mental model are all wrong —
and nothing in the document reveals it.

**Example (correct):**

```markdown
Mode: Delta
Baseline: specs/archive/magic-link-login/spec.md @ v1.2

## Baseline Assertion
- Magic-link tokens expire after 15 minutes — baseline AC-4
  (`research.md` F-2, `src/lib/tokens.ts:22`)

## Acceptance Criteria

### AC-1: Shorten token expiry [MODIFIED] [MUST]
**Was:** "Given a magic link issued more than 15 minutes ago, when the user clicks it,
then verification fails with 410 Gone." — baseline AC-4
**Now:** Given a magic link issued more than 5 minutes ago, when the user clicks it,
then verification fails with 410 Gone.
**Migration:** Links already issued keep their original 15-minute window; the change
applies to tokens created after deploy.

### AC-4: Single-use enforcement [UNCHANGED] [MUST]
Redeemed tokens remain unusable — baseline AC-E2. Must still hold.
```

**Fix:**

- Every delta spec resolves its `Baseline:` header to a prior spec version or specific
  `research.md` findings. If neither exists, run Phase 0.5 — that is the most common
  legitimate reason a brownfield change needs research.
- Quote previous behavior verbatim. A paraphrase hides whether the author read the baseline.
- Fill `[UNCHANGED]` with the behavior sharing code paths with the change. It is the
  regression suite, and it is what makes a short spec safe to be short.
- Fold deltas back into the baseline. **At most two unfolded deltas** — by the third,
  reviewers are reconstructing current behavior by replaying history.

---

## Anti-Pattern 21: Reconciling Drift Instead of Fixing It

**Symptoms:**

- `/sdd:reconcile` output is approved wholesale rather than item by item
- Spec updates classified `INTENTIONAL` cite no commit, PR, or ticket
- `/sdd:validate` is always clean, yet nobody remembers approving the current behavior
- The spec drifts steadily toward whatever the code does
- "We reconciled it" is the answer to why the spec says something surprising

**The trap:** This one is dangerous precisely because it feels like diligence. You ran the
tool, the report was clean, the spec now matches reality — that all reads as good hygiene.
But reconcile is the one command that can edit the spec to match the code, which is
Anti-Pattern 6 with a command name. The difference between maintenance and laundering is
entirely in whether each item had **evidence** and a **human decision**.

**Example (wrong):**

> "Ran `/sdd:reconcile` on the auth feature — 9 differences, all look intentional from the
> commit history. Applied them. Spec is current again, validate is clean."

Nine differences, one glance, no per-item evidence. Any genuine drift in that batch is now
permanently specified as intended behavior, and the audit trail says it was approved.

**Example (correct):**

> "Ran `/sdd:reconcile` — 6 differences. Two INTENTIONAL with commits cited (7d21e0f,
> PR #218), one EXTERNAL (framework 4.2 changed the SameSite default). Two DRIFT with no
> evidence in 14 commits — the rate-limit key is per-IP but AC-E3 says per-email; that's a
> real bug, filed as TASK-014. One AMBIGUOUS: 'copy tweaks' doesn't authorize dropping the
> expiry notice, so defaulting to DRIFT. Approved the three spec updates through
> `/sdd:amend`, logged the evidence in `decision_log.md`."

**Fix:**

- **Absence of evidence is drift.** No commit, PR, incident, or changelog entry means the
  difference gets fixed in the code — never specified as intended.
- Approve item by item. There is no "accept all", and a report of nine differences takes
  nine decisions.
- Scope evidence to the difference. A commit authorizing one change does not authorize
  adjacent ones that shipped alongside it.
- Ask the second question: even a deliberate change can be wrong. Does the new behavior still
  satisfy the original user story?
- Log the evidence in `decision_log.md`, so six months later "why does the spec say this?"
  has an answer better than "someone reconciled it once".
- If most differences are `DRIFT` or `AMBIGUOUS`, stop reconciling — the feature was rebuilt
  outside the process and needs re-specifying, not patching.

---

## Anti-Pattern 22: Running One Ceremony Level for Everything

**Symptoms:**

- A copy change produces `spec.md`, `plan.md`, `contracts/`, and `tasks.md`
- Or: a payment flow ships with acceptance criteria written in a PR comment
- The team quietly stops using the workflow after a few oversized rituals
- "SDD is too heavy" — or, from the same team, "SDD didn't catch this"
- Gates at M are habitually skipped rather than the level being lowered

**The trap:** Picking one intensity and applying it uniformly is easier than deciding per
change, and both uniform choices fail. Always-heavy produces the "drowning in a sea of
markdown" reaction that gets the practice abandoned — usually right before it would have paid
off. Always-light works until the first change that touches money, auth, or a migration,
where it fails in the exact way the process existed to prevent.

**Example (wrong):**

> "We do spec-driven development here, so every change gets a spec."

Six weeks later the team has 40 spec files, most of them for changes that took twenty minutes,
and reviewers have learned to approve spec PRs without reading them. The gates still exist on
paper and verify nothing.

**Example (correct):**

> "Copy fix — level S: ACs in the PR body, tests pass, merged.
> New export endpoint — level M: spec, plan, contract, tasks.
> Payment provider migration — level L: research first, all critics, walkthrough before merge."

**Fix:**

- Choose the level per change, at the start, using the decision rule in `SKILL.md`: start at
  M, drop to S only if *all* of one-session / ≤3 files / no contract or schema change /
  trivially revertible hold, move to L if *any* of auth-or-payments / irreversible migration /
  regulated domain / unread code holds.
- Use **reversibility** as the tiebreaker, not size. A one-line change to a permission check
  outranks a large change to a report layout.
- Promote mid-flight when the ground shifts — S to M once research reveals a schema change is
  normal and healthy. Demoting mid-flight is not: it discards a gate you already decided you
  needed.
- If you are skipping gates at M, you picked the wrong level. Drop to S deliberately and
  record why. Running M with holes in it is indistinguishable from having no process, except
  that it also generates paperwork.

---

## Anti-Pattern 23: Mechanizing the Gates Away

**Symptoms:**

- "Gate 2 passed" means the CI job went green
- Nobody has read a `plan.md` in weeks, but every PR has a checkmark
- Hooks warn constantly and block nothing; the warnings scroll past
- A blocking hook is routinely bypassed with a flag everyone knows
- Specs are well-formed, consistently structured, and describe the wrong system

**The trap:** This is the failure that arrives *after* a team gets good at the workflow.
Automating checks is genuinely correct — a hook that locks `contracts/` removes a whole class
of drift permanently, and CI that verifies AC coverage never gets tired. The trap is that
mechanization feels like the gate got stronger, so the human half quietly stops happening.

It doesn't announce itself. The dashboard is greener than it has ever been.

**The distinction that matters:**

| Mechanical checks verify | Only a human verifies |
|--------------------------|----------------------|
| The rules were followed | The rules were **right** |
| Every AC has a test | The ACs describe what we actually want |
| Citations resolve to real lines | The findings are true |
| The plan mentions every AC | The design is sound |
| The diff is small | Anyone understands it |

Every row on the right is a gate this workflow defines. None can be reached by a hook, and
each one catches errors that the left column will happily pass.

**Example (wrong):**

> "We've got the whole thing wired up — contract lock hook, AC coverage in CI, citation
> checker, lint on every write. If it's green, it ships."

Six weeks later a feature ships that satisfies every acceptance criterion and solves the
wrong problem. Nothing was broken; the ACs were wrong, and no mechanical check has an opinion
about that.

**Example (correct):**

> "CI covers AC coverage, citations, and the contract lock — that's the mechanical half, and
> it's green. Gate 2 still needs a person: I read the plan, the caching layer isn't justified
> by any AC, and the retry strategy contradicts the constitution's timeout rule. Not
> approving until those are resolved."

**Fix:**

- Promote rules to hooks freely — that is what `enforcement.md` is for. But **never let a
  mechanical check inherit a gate's name.** "CI passed" and "Gate 2 passed" are different
  statements, and conflating them is the whole failure.
- If a hook warns and never blocks, it is at rung 1 wearing rung 3's costume. Make it block
  or delete it.
- If a blocking hook is routinely bypassed, the rule is wrong or too broad. Fix the rule —
  a bypassed hook trains the team to bypass hooks.
- Keep the judgment gates staffed at whatever ceremony level you chose, and if you cannot
  staff them, drop the level deliberately rather than letting green CI stand in for review.

**The one-sentence version:** automation raises the floor and never the ceiling — it stops
you shipping what you already knew was wrong, and has nothing to say about what you haven't
thought of yet.
