# Anti-Patterns

The most common SDD failure modes, their symptoms, and how to fix them.

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
- The relevant contract section
- The relevant plan section

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
