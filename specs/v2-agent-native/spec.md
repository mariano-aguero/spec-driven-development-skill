# v2: Agent-Native Spec-Driven Development

Status: In Progress
Version: 0.3
Mode: Delta
Baseline: specs/v2-agent-native/research.md F-1..F-10, P-1..P-8 (v1.7.0, `939b1e7`)
Level: L (changes gate semantics and artifact formats; major version)
Last updated: 2026-11-02

## Change Summary

The skill moves from "a workflow a human walks an agent through" to "a spec a cold agent can
pick up and finish, with evidence a human can audit". Humans keep the gates that decide intent;
gates that check facts are passed by an agent other than the author and carry proof. Every
acceptance criterion names how it is proven, every test shows it can fail, every review finding
is reproduced, and the checks that can be mechanical ship as commands and a validator instead of
prose.

## Handoff

Goal: Ship 2.0.0, where a cold agent can take a spec to merge and leave evidence a human audits.
Done when:

- [ ] `node .github/scripts/check-repo.mjs` exits 0 (AC-3, AC-4, AC-27)
- [ ] `node --test .github/scripts/` exits 0 (AC-1, AC-24)
- [ ] `node skills/spec-driven-development/scripts/sdd-check.mjs specs skills/spec-driven-development/examples/specs` exits 0 (AC-7, AC-10, AC-22, AC-E1)
- [ ] `node .github/scripts/run-evals.mjs --trials 3` shows the skill ahead of the baseline on every scenario, or the gap is explained (AC-28)
- [ ] `npx skills add` into a scratch project installs the skill and the `sdd-*` commands (AC-25)

Isolation: one branch per PR, stacked on `feat/v1.8.0`, one worktree per delegate
Permissions: Boundaries section below
Stop if: a change needs a runtime dependency or alters the S/M/L rule. Then stop and write why in decision_log.md

## Baseline Assertion

- Every gate is a human approval point; AI cannot approve its own output. `SKILL.md:157` (F-3)
- The contract lock keys on `spec.md` `Status: Approved`. `references/enforcement.md:107` (F-1)
- Gate 4 at level S is "tests pass". `references/quality-gates.md:33` (F-6)
- A critic finding is `[CONFIRMED]` when the critic can cite a location.
  `references/ai-agent-patterns.md:162` (F-7)
- The skill ships no runtime; CI scripts are templates. `CLAUDE.md:118` (F-5)
- `/sdd:*` commands are documented but not installed. (F-4)
- Completed specs move to `specs/archive/` with no merged current-state spec. `SKILL.md:279` (F-10)

If any line above is false at implementation time, this spec is invalid, not incomplete.

## Boundaries

**Always do:**

- Keep the skill usable with nothing but `npx skills add` and a text-reading agent.
- Keep every new rule reachable in one hop from `SKILL.md` and inside the budgets in `CLAUDE.md`.
- Give every new gate rule a mechanical check or mark it judgment-only.

**Ask first:**

- Any runtime dependency beyond Node's standard library.
- Any change to the S/M/L decision rule.
- Removing a reference file or an anti-pattern number (external links point at them).

**Never do:**

- Require one vendor's harness, model or cloud for a `[MUST]` behavior.
- Add telemetry or network calls to anything shipped.
- Let an agent approve an intent gate (R, 1, C, merge).

## Acceptance Criteria

### A. Fix what is broken

#### AC-1: Status lifecycle drives the contract lock [MODIFIED] [MUST]

**Was:** "if grep -qE '^Status:[[:space:]]*Approved' "$spec"" (`references/enforcement.md:107`)
**Now:** `spec.md` carries the feature's single lifecycle, advanced by the gates:
`Draft → Approved (Gate 1) → Planned (Gate 2) → In Progress (first task) → Validated (Gate 5)
→ Archived`, defined once in `artifact-templates.md`. Given `Status: Draft` or `Approved`, When
an agent writes `contracts/x.md`, Then the write is allowed. Given `Planned` or any later status,
When an agent writes `contracts/x.md` without an amend in progress, Then the write is blocked
with a message naming `/sdd-change`.
**Proof:** `test/contract-lock.test.mjs` extracts the hook from `enforcement.md` (so the
documented script is the tested one) and runs it against Draft, Approved, Planned, and Planned
with the sentinel: allow, allow, block, allow.

#### AC-2: Amend opens and closes the lock [MODIFIED] [MUST]

**Was:** the sentinel `.amend-in-progress` is read (`references/enforcement.md:105`) and never
written.
**Now:** Given an amend run, When it starts, Then it creates `.amend-in-progress` in the feature
directory, and When it ends (success or abort), Then the file is gone.
**Proof:** the amend prompt names both steps, and `enforcement.md` tells projects to add
`.amend-in-progress` to `.gitignore`. The validator (AC-24) adds a check in 2.0.0.

#### AC-3: One gate matrix [MODIFIED] [MUST]

**Was:** `SKILL.md:56` "Self-check before merge" / "1, 2, 3, 5" vs
`references/quality-gates.md:25-41`.
**Now:** Given any file that states which gates run at which level, When it is compared with
`quality-gates.md`, Then it matches or links instead of restating.
**Proof:** repo CI (AC-27) diffs the matrix rows across `SKILL.md`, `quick-reference.md` and
`quality-gates.md`.

#### AC-4: No stale surface [MODIFIED] [MUST]

Given a release, When CI runs, Then every command named anywhere appears in `SKILL.md` and
`quick-reference.md`, README has no version string other than the current one, and the eval
count in README matches `evals/`.
**Proof:** repo CI (AC-27).

### B. Gates for agents

#### AC-5: Intent gates and evidence gates [MODIFIED] [MUST]

**Was:** "Every gate is a human approval point. AI cannot approve its own output." (`SKILL.md:157`)
**Now:** Gates R, 1, C and merge are **intent gates**: a human approves. Gates 3, 4, 5 and the
contract-completeness half of Gate 2 are **evidence gates**: an agent that did not produce the
artifact checks it, attaches the evidence, and the human audits the verdict instead of redoing
the check. The author never passes its own evidence gate.
**Proof:** eval `09-evidence-gate.json`: given a finished task, the agent spawns or requests a
separate checker and does not mark Gate 4 passed from its own run.

#### AC-6: Three verdicts [ADDED] [MUST]

Given an evidence gate, When a check could not run (missing tool, no subagents, flaky
environment), Then the verdict is `inconclusive` with the reason, and the next phase does not
start on `inconclusive`.
**Proof:** `output-formats.md` defines `pass | fail | inconclusive`; eval 09 covers the
missing-tool case.

### C. The spec as a handoff

#### AC-7: Handoff block [ADDED] [MUST]

Given a spec at level M or L, or an issue at level S, When it is handed to an agent, Then it
carries a `## Handoff` block with: goal (one sentence), **Done when** (checks that pass or fail,
each a command or an observable artifact), permissions (the Boundaries section), isolation
(branch or worktree off a named base), and a stop condition ("if blocked by X, stop and write
why in `decision_log.md`").
**Proof:** template in `artifact-templates.md`; validator rule `handoff-complete`.

#### AC-8: Cold-read check before Gate 1 [ADDED] [MUST]

Given a spec ready for Gate 1, When a fresh agent with no conversation history reads only the
spec and `constitution.md`, Then it restates the goal and the Done-when checks in its own words,
and the human approves Gate 1 only if the restatement matches intent.
**Proof:** prompt in `prompt-patterns.md`; eval `10-cold-read.json` uses a spec with a hidden
ambiguity and expects the restatement to expose it.

#### AC-9: Decision log and resume note [MODIFIED] [SHOULD]

**Was:** `decision_log.md` optional, free-form (`SKILL.md:97`); `progress.md` optional.
**Now:** For autonomous or overnight runs, `decision_log.md` is an append-only table (time, task,
decision, reason, evidence pointer, result) and `progress.md` is a resume note a fresh session
can continue from without the original chat.
**Proof:** templates; eval 10 resumes a half-done fixture from `progress.md` alone.

### D. Verification that can fail

#### AC-10: Every MUST AC names its proof [ADDED] [MUST]

Given a `[MUST]` AC, When Gate 1 runs, Then it has a `Proof:` line naming the kind (test,
command, artifact check, manual) and, unless manual, the command. A manual proof states why
automation is not possible.
**Proof:** validator rule `ac-has-proof`.

#### AC-11: Failing before, quoted [ADDED] [MUST]

Given a task with a test for an AC, When Gate 4 runs, Then the evidence includes the test run
before the change, quoting the failure content (the diff or error that shows the predicted
disagreement), not only the assertion line.
**Proof:** `validation.md` template column; eval `11-proof-can-fail.json`.

#### AC-12: The test kills a mutant [ADDED] [MUST]

Given a `[MUST]` AC with an automated proof, When Gate 4 runs, Then the checker applies at least
one behavior-breaking edit (wrong value, skipped effect, doubled effect) to the code under test,
shows the proof goes red, and reverts. A proof that survives every mutant fails the gate.
Gate 4 also rejects the four tautologies: expected value computed by the code under test,
assertion on data the test built, restated constant that never runs the code, assertion looser
than the AC.
**Proof:** checklist in `quality-gates.md`; eval 11 uses a fixture whose test asserts on its own
fixture and expects rejection.

#### AC-13: Mutation tooling at level L [ADDED] [SHOULD]

Given level L, When Gate 5 runs, Then a mutation tool (Stryker, mutmut, cargo-mutants or the
stack's equivalent) runs scoped to the changed files and the report lists surviving mutants
mapped to ACs.
**Proof:** `enforcement.md` section with one command per ecosystem.

#### AC-14: Invariants for stateful features [ADDED] [COULD]

Given a level L feature with states, retries, locks or offline behavior, When Phase 2 runs, Then
the plan may state those rules as invariants checked by a model checker or property-based tests,
with any diagram generated from the checked model, and each counterexample replayed against real
code.
**Proof:** optional section in `plan.md` template; one worked example.

### E. Review that reproduces

#### AC-15: Findings need a run [MODIFIED] [MUST]

**Was:** "`[CONFIRMED]` The critic can cite the exact artifact location or code line"
(`references/ai-agent-patterns.md:162`)
**Now:** For code, a finding is `[CONFIRMED]` only with the command, its output, and the output
the spec requires; the coordinator reruns it. Unreproduced findings go to a **Dropped** list with
the reason. Spec and research critics keep citation-based confirmation.
**Proof:** `output-formats.md → Critic Findings`; eval `12-adversary.json`.

#### AC-16: Adversary at Phase 5 [ADDED] [MUST]

Given level M or L, When Phase 5 runs, Then an adversary that did not write the code tries to
break each `[MUST]` and `[UNCHANGED]` AC against the real code, in its own worktree or scratch
copy. A different model family is preferred when the harness offers one.
**Proof:** prompt in `prompt-patterns.md`; eval 12.

#### AC-17: Prototype, do not debate [MODIFIED] [SHOULD]

**Was:** Phase 2 critics review `plan.md` as prose (`references/ai-agent-patterns.md:232-300`).
**Now:** Given an open question in the plan that running something could answer (layout, timing,
library behavior), When Phase 2 runs, Then the agent answers it with a throwaway prototype outside
the feature branch and cites the result; plan critics report only what they can check against
the current tree.
**Proof:** Phase 2 prompt; anti-pattern "Polishing an abstract plan".

### F. Design

#### AC-18: Caller usage first [ADDED] [SHOULD]

Given a plan that adds or changes an interface, When `plan.md` is written, Then a `Caller Usage`
section showing how callers use it comes before `contracts/`, and the contracts derive from it.
**Proof:** template; validator warns when `contracts/` exist without the section.

#### AC-19: Two designs at level L [ADDED] [SHOULD]

Given level L, When Phase 2 runs, Then at least two structurally distinct designs are sketched,
compared on interface size, and the rejected one is recorded in `decision_log.md`.
**Proof:** Gate 2 checklist item.

#### AC-20: When to scrap the plan [ADDED] [SHOULD]

Given Phase 4, When the same workaround appears in unrelated places, types need casts or `any`
to compile, or two task deviations share a shape, Then the agent stops and proposes
`/sdd-change` at the plan level instead of patching.
**Proof:** anti-pattern entry with the triggers; eval covers one trigger.

#### AC-21: Evidence levels [MODIFIED] [SHOULD]

**Was:** research findings carry a `file:line` citation (`SKILL.md:132`).
**Now:** Each research finding and each reconcile difference carries an evidence level: 1 said,
2 cited line, 3 showed the bad case cannot happen, 4 ran it, 5 reproduced in the app. The fact
a change's safety depends on must reach level 4 or be marked unproven.
**Proof:** research and reconcile templates; validator counts findings without a level.

### G. Parallel and long-running work

#### AC-22: Tasks as a graph [MODIFIED] [MUST]

**Was:** `[P]` marks tasks declared not to share files (`references/enforcement.md:155`).
**Now:** Each task in `tasks.md` lists `depends_on` and the files it owns. Tasks run in waves
computed from the graph, one worktree per parallel task, and a coordinator that assigns and
checks work does not write code itself.
**Proof:** validator rules `task-graph-acyclic` and `parallel-no-shared-files`.

### H. Living specs

#### AC-23: Current-state specs [ADDED] [SHOULD]

Given a validated delta spec, When it is archived, Then its ADDED, MODIFIED and REMOVED ACs are
merged into `specs/_current/<capability>.md`, and later delta specs may use that file as their
baseline.
**Proof:** archive prompt; example showing `magic-link-shorten-ttl` merged into the login
capability.

### I. Executable surface

#### AC-24: Validator [ADDED] [MUST]

Given a repo with `specs/`, When `node <skill>/scripts/sdd-check.mjs [feature]` runs, Then it
checks status lifecycle, unique AC ids, `Proof:` on every `[MUST]`, task-to-AC references, task
graph, parallel file ownership, resolvable delta baseline, no `[NEEDS CLARIFICATION]` past Gate 1,
and handoff completeness; it exits non-zero on any failure and prints `file:line` per finding.
It has zero dependencies and runs on Node 20+.
**Proof:** `test/sdd-check/` with one passing and one failing fixture per rule; runs in repo CI.

#### AC-25: Commands that exist [ADDED] [MUST]

Given the skill installed with `npx skills add`, When a user types an `/sdd-<command>` in Claude
Code, Codex or Cursor, Then the matching phase prompt loads. Harnesses without command support
get the same prompts by name from `SKILL.md`.
**Proof:** manual install in a scratch repo per harness, recorded in the release notes.

#### AC-26: Lessons become checks [ADDED] [SHOULD]

Given an anti-pattern, When it is objectively detectable, Then its entry names the validator rule
or hook that catches it; otherwise it is marked judgment-only. A rule that gains a check loses its
duplicated prose.
**Proof:** every entry in `anti-patterns.md` has a `Check:` line.

### J. Quality of the skill itself

#### AC-27: Repo CI enforces the budgets [ADDED] [MUST]

Given a pull request, When CI runs, Then it fails on: description over 1024 chars, `SKILL.md`
over 500 lines, a reference over 100 lines without `## Contents`, a broken anchor, any check in
AC-3 and AC-4. The em and en dash check lands with AC-29, since that rewrite touches the
same prose and doing it twice is waste.
**Proof:** workflow file plus a deliberately broken branch that fails each check once.

#### AC-28: Evals that run against a baseline [MODIFIED] [MUST]

**Was:** 8 scenarios, no runner, missing fixtures (F-8).
**Now:** Each eval has its fixtures in `evals/fixtures/`. A runner executes every scenario with
and without the skill, at least 3 trials each, and reports pass rate and spread per scenario.
New scenarios cover evidence gates, cold read, proof that can fail, and the adversary.
**Proof:** runner output committed with the release; the skill beats the no-skill baseline on
every scenario or the gap is explained.

#### AC-29: Smaller references [MODIFIED] [SHOULD]

**Was:** about 32k words across `references/` (F-9).
**Now:** at most 24k words, with eval pass rates not lower than before the cut.
**Proof:** `wc -w references/*.md`; eval runner diff.

### K. Must not break

#### AC-30: Ceremony levels [UNCHANGED]

"start at M. Drop to S only if all of these hold ... The tiebreaker is reversibility, not size."
(`SKILL.md:59-66`) must still hold. Level S stays readable in under five minutes.

#### AC-31: Reconcile never edits on its own [UNCHANGED]

"`/sdd-change` never edits anything on its own" (`SKILL.md:292`) must still hold.

#### AC-32: Research before spec, cited [UNCHANGED]

Phase 0.5 rules, including the ~200 line cap (`SKILL.md:130-136`), must still hold.

#### AC-33: Output budgets [UNCHANGED]

Every user-facing output keeps a line budget in `output-formats.md`.

#### AC-34: Docs-only install still works [UNCHANGED]

An agent that never runs the validator or commands still gets the full workflow from the
markdown.

### Errors and edges

#### AC-E1: A duration is not a finish condition [MUST]

Given a handoff whose Done-when is a time box ("work on this for 4 hours"), When the validator or
Gate 1 runs, Then it is rejected with a request for a check that can pass or fail.
**Proof:** validator rule; fixture.

#### AC-E2: No Node available [MUST]

Given an environment without Node, When a phase would run the validator, Then the agent runs the
same checks from the checklist, reports `inconclusive` for the mechanical ones, and never reports
`pass`.
**Proof:** eval variant with Node removed from the fixture path.

#### AC-E3: No subagents [MUST]

Given a harness without subagents, When an evidence gate or adversary is required, Then the check
runs in a fresh session from the artifacts alone; if that is impossible, the verdict is
`inconclusive`.
**Proof:** `ai-agent-patterns.md` fallback section; eval 09 variant.

### Explicitly excluded

#### AC-W1: Own agent runtime [WONT]

No orchestrator, loop runner or daemon. Harnesses already ship them; the skill specifies what
they must check.

#### AC-W2: Importers for other formats [WONT]

No Spec Kit or OpenSpec import in this iteration. Revisit after v2 ships.

#### AC-W3: Hosted service or telemetry [WONT]

Delta balance: 17 ADDED, 12 MODIFIED, 5 UNCHANGED, 3 errors, 3 WONT. ADDED sits at half, the edge of
the delta rule; delta mode stays because every ADDED AC attaches to an existing phase or artifact.

## Blast Radius

| Changing | What depends on it | Verified by |
|----------|--------------------|-------------|
| Gate semantics (`SKILL.md:157`) | every reference that says "human approval", evals 04 and 06 | AC-3 CI check, eval rerun |
| `Status` values | all templates, the lock hook, both examples | AC-1 hook test, validator on `examples/` |
| Critic tags | `output-formats.md`, `quality-gates.md`, eval 07 | AC-15 eval |
| `tasks.md` format | Phase 3 prompt, `next-task`, example tasks | validator on `examples/` |
| `CLAUDE.md` "no runtime" decision | file structure, design decisions, README install section | Open Question 1 |
| Anti-pattern numbering | external links to `anti-patterns.md#...` | numbers kept, only `Check:` lines added |

## Out of Scope

- Rewriting the magic-link example beyond what new templates require.
- Translating the skill.
- Supporting harnesses that cannot read files.

## Open Questions

- [RESOLVED] Reverse the "documentation only, no runtime" decision (`CLAUDE.md:118`)?
  Decision: yes, zero-dependency Node 20+ scripts and tests (`node:test`). Docs-only use keeps
  working (AC-34).
- [RESOLVED] Commands as sub-skills or per-harness plugins? Decision: the installable skill moves
  to `skills/spec-driven-development/` (the `skills` CLI discovers `skills/<name>/SKILL.md`, and
  a root `SKILL.md` would shadow it). Each command is a sub-skill named `sdd-<command>`, invoked as
  `/sdd-<command>` in every harness that supports skills, with `disable-model-invocation: true` to
  keep their descriptions out of the fixed context. A `.claude-plugin/marketplace.json` lists the
  same folders, so plugin installs and `npx skills add` read one source. The `/sdd:` colon form is
  a plugin namespace only one harness offers, so the docs move to `/sdd-<command>`.
- [RESOLVED] One release or two? Decision: 1.8.0 ships group A plus AC-27; everything else is
  2.0.0, in ordered PRs with the validator (AC-24) first.
- [RESOLVED] Should `specs/` ship to users? Decision: no. It stays out of the 1.8.0 release and
  lands in 2.0.0 once the skill lives under `skills/`, where installs no longer copy the repo
  root.
- [RESOLVED] Credit pstack? Decision: yes, a short "Prior art" section in the README for pstack,
  OpenSpec, Kiro and Spec Kit, in our own words.

## Non-Functional Requirements

- Budgets: `SKILL.md` stays under 500 lines and about 4000 tokens after the change; description
  at most 1024 chars.
- Portability: validator and hooks run on macOS and Linux; Windows through WSL is enough.
- Cost: an S change gains at most one required section (`Done when`) over v1.7.0.
