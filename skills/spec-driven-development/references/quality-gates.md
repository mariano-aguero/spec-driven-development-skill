# Quality Gates

Review checklists, confidence thresholds, and CI/CD integration patterns for SDD.

## Contents

- Which gates apply at which ceremony level, and who passes each (intent vs. evidence gates)
- Gate 0 — `constitution.md` approval
- Per-phase checklists: Gate R (research), Gates 1–5 (incl. delta-mode checks), Gate C
- Generated checklists (`/sdd:checklist [domain]`) — unit tests for the spec
- Confidence-based review thresholds
- CI/CD integration: research citation check, AC coverage, drift detection, spec completeness
- Spec drift classification

Gate results are reported to the user in a fixed format — see
`output-formats.md → Gate Verdict`.

---

## Which Gates Apply at Which Ceremony Level

Gates are not optional at the level you chose — they are what the level *means*. Choosing S
is a decision to accept less verification; skipping a gate at M is not.

| Gate | Kind | S (Light) | M (Standard) | L (Full) |
|------|------|-----------|--------------|----------|
| Gate 0 (constitution) | intent | inherited | inherited | required |
| Gate R (research) | intent | none | if research was run | required |
| Gate 1 (spec) | intent | ACs reviewed in the PR body | required, with cold read | required, with cold read |
| Gate 2 (plan + contracts) | evidence + intent | none | required | required, with two designs |
| Gate 3 (tasks) | evidence | none | required | required |
| Gate 4 (per task) | evidence | failing before, passing after, rerun by a checker | required | required |
| Gate 5 (validation) | evidence | checker reruns the suite, human reviews the diff | required, with adversary | required, with adversary and mutation tool |
| Gate C (comprehension) | intent | none | if the diff exceeds one sitting | required |
| Merge | intent | required | required | required |
| Critic agents | evidence | none | optional | required |

"Inherited" means the constitution already exists and applies — you do not re-approve it per
change.

**Intent gates** decide what to build and whether the team understands what was built. A
human approves them, and no agent may.

**Evidence gates** check facts. An agent that did not produce the artifact runs every check,
attaches the evidence (the command, its output, the artifact inspected), and returns
`pass | fail | inconclusive` per `output-formats.md → Gate Verdict`. The human audits that
verdict and its evidence instead of redoing the check. Gate 2 is both: a checker verifies
traceability and contract, error-code and data-model completeness; the human approves the
design.

**The rule that holds at every level:** the author never passes its own gate. Its own test
run is input to the checker, never the verdict. `inconclusive` blocks the next phase exactly
like `fail`. S has fewer gates, not self-approving ones. With no subagents available, see
`ai-agent-patterns.md → No-Subagent Fallback`.

If you find yourself skipping gates at M, you picked the wrong level. Drop to S deliberately
and record why, rather than running M with holes in it — the second is indistinguishable from
having no process, except that it produces paperwork.

---

## Gate 0 — constitution.md Approval

Run once per project before any feature work begins.

| Check | Pass Criteria |
|-------|--------------|
| Stack coverage | All languages, frameworks, and databases listed with locked versions |
| Security constraints | At least 5 explicit security rules covering input validation, auth, secrets, logging, CORS |
| No banned patterns | Banned patterns list is specific and enforceable (not vague principles) |
| File structure | Directory structure documented and matches actual project layout |
| No blocking `[PENDING]` items | All blocking `[PENDING]` items resolved; remaining items have explicit acceptance + target date |

**Fail action:** Complete the constitution before creating any spec.

---

## Per-Phase Checklists

### Gate R — research.md Approval

Run before Phase 1, when Phase 0.5 was executed. Skip entirely if no research was needed.

| Check | Pass Criteria |
|-------|--------------|
| Citation coverage | Every factual claim ends in a `file:line` reference |
| Citation validity | Spot-check at least 3 citations by opening them — the line exists and says what the document claims |
| File completeness | No file the feature will obviously touch is missing from "Relevant Files" |
| Flow accuracy | The information flow matches how the system actually behaves, in order |
| Descriptive only | No requirements, ACs, or solution design — the document says what *is*, never what *should be* |
| Constraints extracted | Conventions the code already enforces are listed explicitly |
| Conflicts surfaced | Subagent disagreements are marked `[CONFLICT]`, not silently resolved |
| Gaps declared | "Not Investigated" and "Open Questions for the Spec" are populated, not empty |
| Length | Under ~200 lines — beyond that it is a dump, not a compaction |

**Fail action:** Re-run the failing axis. Do not write the spec on unverified research —
every error here is inherited by every downstream artifact.

**Why this gate is worth your attention:** an error in ~200 lines of research misdirects
thousands of lines of generated code, and it is invisible by the time you see the code.
Errors caught here cost minutes; the same errors caught in Phase 4 cost the feature.

### Gate 1 — spec.md Approval

Run before Phase 2. All items must pass. On pass: `Status: Approved`.

| Check | Pass Criteria |
|-------|--------------|
| Testability | Every `[MUST]` AC can have an automated test written for it |
| Implementation-free | No technology names, function names, or database terms |
| NEEDS CLARIFICATION | All `[NEEDS CLARIFICATION]` items resolved |
| Constitution PENDING | No `[PENDING]` item in constitution.md directly affects this feature's domain |
| Error coverage | Error/edge case ACs exist (not just happy path) |
| Scope boundary | "Out of Scope" section is explicit and complete |
| MoSCoW prioritization | Every AC has a `[MUST]` / `[SHOULD]` / `[COULD]` / `[WONT]` label |
| No vague terms | No "fast", "secure", "works correctly" without measurable thresholds |
| Non-functional requirements | Performance and security requirements stated with specific values |
| Boundaries (optional) | If feature has complex AI behavior constraints, Boundaries section is populated |
| Stakeholder alignment | Relevant stakeholders have reviewed and agreed |
| Done when checkable | Every Handoff Done-when line is a command or an observable artifact that can pass or fail; a time box ("work on this for 4 hours") is rejected |
| Cold read (M, L) | A fresh agent given only `spec.md` and `constitution.md` restated the goal and Done-when checks, and the human confirms it matches intent (`prompt-patterns.md → Cold Read Prompt`) |

**Additional checks when `Mode: Delta`:**

| Check | Pass Criteria |
|-------|--------------|
| Baseline resolves | The `Baseline:` header points at a prior spec version or specific `research.md` findings — a reviewer can open it |
| Baseline Assertion verified | Every assertion line is checked against the cited source; a false line invalidates the spec, not just that line |
| Change labels complete | Every AC carries `[ADDED]` / `[MODIFIED]` / `[REMOVED]` / `[UNCHANGED]` in addition to its MoSCoW label |
| Previous behavior quoted | `[MODIFIED]` and `[REMOVED]` ACs quote the baseline verbatim, not paraphrased |
| Migration stated | Every `[MODIFIED]` AC says what happens to data, sessions, or clients created under the old behavior |
| Deprecation stated | Every `[REMOVED]` AC states what callers see now and the deprecation timing |
| Regression coverage | `[UNCHANGED]` covers the behavior sharing code paths with the change — not left empty |
| Blast radius mapped | Each modified item lists its dependents and the AC that verifies them |
| Mode is right | Fewer than roughly half the ACs are `[ADDED]` — otherwise this is a full spec |

**Fail action:** Return to Phase 1 + Clarify step. Do not proceed to Phase 2.

---

### Gate 2 — plan.md + contracts/ Approval

Run before Phase 3. All items must pass. On pass: `Status: Planned`.

A checker that did not write the plan runs the first six rows (traceability, constitution,
contract, error code, data model, migrations) and attaches evidence. The human approves the
rest: those are design calls.

| Check | Pass Criteria |
|-------|--------------|
| AC traceability | Every `[MUST]` AC maps to at least one component in plan.md |
| Constitution compliance | Plan uses only stack items in constitution.md; no banned patterns |
| Contract completeness | Every component that exposes an API has a corresponding contract file |
| Error code completeness | Contracts define all error responses (not just 200) |
| Data model completeness | All entities mentioned in spec.md appear in data-model.md |
| Migrations defined | If the feature modifies the database schema, at least one migration block is defined in data-model.md |
| Index justification | Indexes in data-model.md are justified by specific query patterns |
| Risks identified | Risks table present; every High-impact risk has a mitigation |
| No over-engineering | No abstractions that could be replaced with direct framework usage |
| Technology fit | Technology choices use existing stack unless new dependency is justified |
| Two designs (L) | At least two structurally distinct designs were sketched and compared on interface size (public types, functions, endpoints callers must learn); the rejected one and the reason are a row in `decision_log.md` |

**Fail action:** Return to Phase 2 for the failing check. Do not proceed to Phase 3.

---

### Gate 3 — tasks.md Approval

Run before Phase 4 by a checker that did not write `tasks.md`; the human audits the verdict.
All items must pass. Status stays `Planned` until the first task starts, then `In Progress`.

| Check | Pass Criteria |
|-------|--------------|
| Test-first order | Every implementation task has a preceding test task |
| Task size | No task touches more than 3 files or estimated at L without justification |
| AC references | Test tasks cite specific ACs from spec.md (including error ACs) |
| Contract references | Implementation tasks cite specific contracts/ files |
| Satisfies declaration | Implementation tasks declare which ACs they satisfy |
| Dependency validity | Task dependencies form a valid DAG (no cycles) |
| Parallelism accuracy | [P] tasks have no shared write dependencies |

**Fail action:** Fix tasks.md. Do not begin implementation.

---

### Gate 4 — Implementation Validation

Run per task, before marking it complete and committing, by a checker that did not write the
code. The implementer's own green run is input, never the verdict.

| Check | Pass Criteria |
|-------|--------------|
| Tests pass | All new tests pass when the checker reruns them; no existing tests regressed |
| Failing before | Each new test was run before the change, and the evidence quotes the failure content (the diff or error showing the predicted disagreement), not only the assertion line. A test never seen red proves nothing |
| Mutant killed | For each `[MUST]` AC with an automated proof, the checker applies at least one behavior-breaking edit to the code under test (wrong value, skipped effect, doubled effect), shows the proof go red, and reverts the edit. A proof that survives every mutant fails the gate |
| No tautologies | No test computes its expected value with the code under test, asserts on data the test built itself, restates a constant without running the code that reads it, or asserts less than the AC promises |
| Signature match | Implemented API signatures match contracts/ exactly |
| Schema match | Database schema matches data-model.md |
| Scope adherence | No files modified outside the task's stated scope |
| No silent failures | Error cases are handled, not swallowed |
| Constitution check | No banned patterns introduced; security constraints respected |
| Boundaries check | If spec.md has a Boundaries section, Always do / Never do rules were followed |

**Prefer no new test over a bad test.** A bad test passes when the behavior breaks (a
tautology, a survived mutant, never seen red) or fails when only the internals change (it
asserts on private helpers, internal call order, or which collaborator did the work). A bad
test reads as coverage and proves nothing, so delete it and record the AC as unproven rather
than keep it.

**Fail action:** Fix before committing. Do not mark task complete.

---

### Gate 5 — Final Validation

Run after Phase 4 completes, before merging, by a checker that did not write the code. On
pass: `Status: Validated`. Merge itself stays an intent gate: a human approves it.

| Check | Pass Criteria |
|-------|--------------|
| Traceability matrix | Every `[MUST]` AC has an identified test and implementation file |
| Full test suite | Complete test suite passes |
| Drift report | Zero drift items found (spec.md vs. implementation) |
| User story walkthrough | Each user story exercised in the running application, with the artifact attached (log, screenshot, recording) for the human to audit |
| Contract audit | All contract error codes have corresponding implementation and tests |
| Constitution audit | No constitution violations detected in new code |
| Comprehension | Linear walkthrough produced and read by a human — see Gate C below |
| Adversary (M, L) | A non-author agent tried to break each `[MUST]` and `[UNCHANGED]` AC in its own worktree; every reproduced finding is fixed, and the Dropped list is attached |
| Mutation run (L) | A mutation tool ran scoped to the changed files; every surviving mutant is listed in `validation.md` with the AC whose proof should have killed it |

**Mutation tool at level L.** Scope the run to the files the branch changed, or it takes
hours and reports noise from code nobody touched. One command per ecosystem, or the stack's
equivalent:

```bash
# JS/TS: Stryker
npx stryker run --mutate "$(git diff --name-only origin/main -- '*.ts' '*.js' | paste -sd, -)"
# Python: mutmut 2 (on mutmut 3, set paths_to_mutate under [tool.mutmut] instead)
mutmut run --paths-to-mutate "$(git diff --name-only origin/main -- '*.py' | paste -sd, -)"
# Rust: cargo-mutants
git diff origin/main > /tmp/branch.diff && cargo mutants --in-diff /tmp/branch.diff
```

A survivor on a `[MUST]` AC fails Gate 5 unless it is equivalent (no observable change), and
the equivalence is stated with its reason.

**Fail action:** Fix drift before merge. No exceptions.

---

### Gate C — Comprehension Check

Run alongside Gate 5, before merge. This gate does not ask whether the code is *correct* —
Gate 5 already did. It asks whether the team can *maintain* it.

| Check | Pass Criteria |
|-------|--------------|
| Walkthrough exists | A linear, execution-ordered narration of the implementation with `file:line` citations |
| Human read it | A person who did not drive the implementation has read it end to end |
| Debuggable | That person can name where they would set the first breakpoint for a bug report in this feature |
| Justified structure | Every abstraction, layer, and indirection traces to a plan.md decision |
| No unexplained behavior | Nothing in the code lacks a corresponding AC, contract clause, or logged decision |
| Reviewable size | If the diff is too large to read, the tasks were too large — note it for the next `tasks.md` |

**Fail action:** Do not merge on the strength of green tests alone. Unjustified structure
gets removed; unexplained behavior gets removed or specced. Both are cheapest now.

**Why this gate exists:** agents generate code far faster than humans read it. Teams that
adopt them without a comprehension gate merge substantially more pull requests while
understanding substantially less of what they ship — a debt that stays invisible until the
first incident, onboarding, or refactor. SDD only pays this back if the artifacts are
actually read.

---

## Generated Checklists — Unit Tests for the Spec

Gates are universal: the same checks run for every feature, which is what makes them
reliable and also what makes them generic. A gate cannot know that *this* feature touches
timezone arithmetic, or handles money, or is the first thing a new user sees.

A **checklist** is generated per feature and per domain to cover exactly that: the risk
surface this feature has and the last one didn't.

**Invoke:** `/sdd:checklist [domain]` → `specs/[feature]/checklists/[domain].md`

| | Gates | Checklists |
|---|-------|-----------|
| Scope | Every feature, fixed | This feature, generated |
| Source | This skill | The spec's own content and domain |
| Changes | Only when the workflow changes | Every feature |
| Blocking | Yes | No — they inform the human at the gate |

Useful domains: security, UX, accessibility, performance, data integrity,
internationalization, observability, migration safety, compliance.

### The one rule that makes them work

**A checklist validates the requirements, never the behavior.** This is the distinction
people get wrong, and getting it wrong turns a checklist into a duplicate test plan.

| ✅ Tests the requirement | ❌ Tests the behavior |
|--------------------------|----------------------|
| "Is the timeout for expired sessions specified with a numeric value?" | "Does the session expire after 30 minutes?" |
| "Are requirements stated for what happens when the payment provider is unreachable?" | "Does it show an error when payment fails?" |
| "Is 'sensitive data' defined in the spec or constitution?" | "Does it redact sensitive data correctly?" |

Banned verbs in checklist items: *displays*, *renders*, *loads*, *executes*, *clicks*,
*navigates*, *works*. Any item containing one has drifted into testing the implementation —
which is what the ACs and the test suite already do.

The check to apply while writing: **could this item be answered by reading only the spec?**
If answering it requires running the code, it belongs in `tasks.md`, not a checklist.

### Item markers

Each finding carries one:

| Marker | Means |
|--------|-------|
| `[Gap]` | A requirement that should exist for this domain and does not |
| `[Ambiguity]` | A requirement exists but admits more than one reading |
| `[Conflict]` | Two requirements cannot both hold |
| `[Assumption]` | The spec depends on something unstated |

### Scenario coverage

Generate items across all five scenario classes, not just the happy one. A domain checklist
that only covers the primary path reproduces the spec's blind spot instead of exposing it:

| Class | Question the checklist asks |
|-------|----------------------------|
| Primary | Are the requirements for the main path complete and measurable? |
| Alternate | Are the valid-but-secondary paths specified, or silently assumed? |
| Exception | Is every failure mode in this domain given a specified outcome? |
| Recovery | After a failure, is the required system and user state stated? |
| Non-functional | Are this domain's quality attributes given numeric thresholds? |

An item may legitimately resolve as **intentionally excluded** — that is a passing answer,
provided the exclusion is written in the spec's Out of Scope section rather than living in
someone's head.

### When to run them

At level L, before Gate 1, for every domain the feature touches. At level M, for one domain
— the one carrying the feature's real risk. At level S, not at all.

Checklists do not block a gate. They surface what the human should look at while running one,
and an unresolved `[Gap]` from a security checklist is a Gate 1 finding by way of the
"error coverage" check, not by way of the checklist itself.

---

## Confidence-Based Review Thresholds

Use these thresholds to determine review intensity:

| Confidence Level | Conditions | Review Type |
|-----------------|------------|-------------|
| High (>90%) | Simple CRUD, no auth changes, no schema changes | Automated tests + quick PR scan |
| Medium (70–90%) | Cross-service integration, new API endpoint, UI component | Full PR review + senior approval |
| Low (<70%) | Auth logic, schema migration, external API integration, security-sensitive | Pair review + security check |
| Critical | Payment flows, authentication core, data encryption | Mandatory security review before merge |

---

## CI/CD Integration

### Automated Drift Detection

Three checks — one is ready to use, two require project-specific implementation.

```yaml
# .github/workflows/spec-drift.yml
name: Spec Drift Check
on:
  pull_request:
    paths:
      - 'src/**'
      - 'specs/**'

jobs:
  drift-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      # ✅ READY TO USE: verifies every AC-ID from spec.md appears in a test file
      - name: Verify AC test coverage
        run: |
          FEATURE_DIR="specs/$(git diff --name-only origin/main | grep specs/ | head -1 | cut -d/ -f2)"
          if [ -d "$FEATURE_DIR" ]; then
            while IFS= read -r ac_id; do
              if ! grep -r "$ac_id" tests/ src/ --include="*.test.*" --include="*.spec.*" -q; then
                echo "FAIL: $ac_id has no test coverage"
                exit 1
              fi
            done < <(grep -oP 'AC-[A-Z0-9]+' "$FEATURE_DIR/spec.md" | sort -u)
          fi

      # ⚠️ PROJECT-SPECIFIC: requires implementation for your stack
      # Must: extract route definitions from src/, compare signatures against contracts/*.md
      # Example for Express/Hono: parse route files for method+path, compare against contract headers
      - name: Check API contract signatures
        run: echo "[PROJECT-SPECIFIC] Implement scripts/check-contract-drift.sh for your routing framework"

      # ⚠️ PROJECT-SPECIFIC: requires implementation for your ORM/migration tool
      # Must: compare entities in data-model.md against your migration files or schema dump
      # Example for Drizzle: diff drizzle/schema.ts against data-model.md entities
      - name: Check database schema
        run: echo "[PROJECT-SPECIFIC] Implement scripts/check-schema-drift.sh for your ORM"
```

### Research Citation Check

Fabricated citations are the characteristic failure of Phase 0.5, and they are cheap to
catch mechanically. This verifies that every `path/file.ext:NN` citation in `research.md`
points at a file that exists and a line that is in range. It cannot verify that the code
*says* what the document claims — that is what the Research Verifier agent and Gate R are for.

```yaml
# Add to the drift-check job, or run standalone on specs/**/research.md changes
- name: Verify research citations resolve
  run: |
    fail=0
    for doc in specs/*/research.md; do
      [ -f "$doc" ] || continue
      # Match `path/to/file.ext:123` and `path/to/file.ext:123-145` inside backticks
      grep -oE '`[A-Za-z0-9_./-]+\.[A-Za-z0-9]+:[0-9]+(-[0-9]+)?`' "$doc" \
        | tr -d '`' | sort -u | while IFS= read -r cite; do
          file="${cite%%:*}"
          line="${cite##*:}"
          line="${line%%-*}"
          if [ ! -f "$file" ]; then
            echo "FAIL: $doc cites missing file: $file"
            exit 1
          fi
          total=$(wc -l < "$file" | tr -d ' ')
          if [ "$line" -gt "$total" ]; then
            echo "FAIL: $doc cites $file:$line but the file has $total lines"
            exit 1
          fi
        done || fail=1
      # A research doc with no citations at all has not done its job
      if ! grep -qE '`[A-Za-z0-9_./-]+\.[A-Za-z0-9]+:[0-9]+' "$doc"; then
        echo "FAIL: $doc contains no file:line citations"
        fail=1
      fi
    done
    exit $fail
```

### Spec Completeness Check

```yaml
# Run on spec.md changes only
- name: Validate spec completeness
  if: contains(github.event.pull_request.changed_files, 'specs/')
  run: |
    # Fail if any [NEEDS CLARIFICATION] items are unresolved
    if grep -r "\[NEEDS CLARIFICATION\]" specs/; then
      echo "ERROR: Unresolved clarification items in spec"
      exit 1
    fi
    # Fail if any AC is missing a MoSCoW label
    if grep -P "^### AC-" specs/*/spec.md | grep -v "\[MUST\]\|\[SHOULD\]\|\[COULD\]\|\[WONT\]"; then
      echo "ERROR: ACs missing MoSCoW priority labels"
      exit 1
    fi
```

### Task Progress Tracking

```yaml
# Optional: report task completion status
- name: Task completion report
  run: |
    total=$(grep -c "\- \[" specs/*/tasks.md)
    done=$(grep -c "\- \[x\]" specs/*/tasks.md)
    echo "Tasks: $done/$total complete"
```

---

## Spec Drift Classification

When drift is found, classify before deciding action:

| Drift Type | Example | Action |
|------------|---------|--------|
| Signature drift | Function returns `{ user }` instead of `{ data: user }` | Fix implementation |
| Schema drift | Column named `user_id` instead of `userId` | Fix implementation |
| Behavior drift | 404 returned but contract says 403 | Fix implementation |
| Scope drift | Extra endpoint added not in spec.md | Remove or add to spec first |
| Spec error | Spec has wrong error code | Update spec → plan → contract → implementation |

The only legitimate reason to update a spec is **new information**. Not convenience.
