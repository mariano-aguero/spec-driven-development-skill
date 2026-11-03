# Quality Gates

## Contents

- Which gates apply at which ceremony level, intent vs. evidence gates
- Gate 0, Gate R, Gates 1 to 5 with delta checks, Gate C
- Generated checklists (`/sdd-validate [domain]`)
- Confidence-based review thresholds
- CI/CD integration
- Spec drift classification

Report gate results in the format in `output-formats.md → Gate Verdict`.

---

## Which Gates Apply at Which Ceremony Level

| Gate | Kind | S (Light) | M (Standard) | L (Full) |
|------|------|-----------|--------------|----------|
| Gate 0 (constitution) | intent | inherited | inherited | required |
| Gate R (research) | intent | none | if research ran | required |
| Gate 1 (spec) | intent | ACs and Done when reviewed in the PR body | with cold read | with cold read |
| Gate 2 (plan + contracts) | evidence + intent | none | required | with two designs |
| Gate 3 (tasks) | evidence | none | required | required |
| Gate 4 (per task) | evidence | checker reruns: fails before (quoted), passes after | with mutant and tautology rows | same as M |
| Gate 5 (validation) | evidence | checker reruns the suite, human reviews the diff | with adversary | with adversary and mutation tool |
| Gate C (comprehension) | intent | none | if the diff exceeds one sitting | required |
| Merge | intent | required | required | required |
| Critic agents | evidence | none | optional | required |

"Inherited": the existing constitution applies, with no re-approval per change.

**Intent gates** decide what to build and whether the team understands it. Only a human
approves them.

**Evidence gates** check facts. A non-author agent runs every check,
attaches evidence (command, output, artifact), and returns `pass | fail | inconclusive`.
The human audits the verdict.

**At every level the author never passes its own gate.** Its own test run is input to the
checker. `inconclusive` blocks the next phase like `fail`. With no subagents, see
`ai-agent-patterns.md → No-Subagent Fallback`.

The gates of a level are what the level means. If you skip gates at M, drop to S on purpose
and record why.

---

## Gate 0: constitution.md Approval

Run once per project before any feature work.

| Check | Pass Criteria |
|-------|--------------|
| Stack coverage | Every language, framework, and database with a locked version |
| Security constraints | At least 5 rules: input validation, auth, secrets, logging, CORS |
| Banned patterns | The list is specific and enforceable |
| File structure | Documented and matches the actual layout |
| No blocking `[PENDING]` | Blocking items resolved; the rest have acceptance and a target date |

**Fail action:** Complete the constitution before any spec.

---

## Per-Phase Checklists

### Gate R: research.md Approval

Run before Phase 1 when Phase 0.5 ran.

| Check | Pass Criteria |
|-------|--------------|
| Citation coverage | Every factual claim ends in a `file:line` reference |
| Citation validity | Open at least 3 citations: the line exists and says what the document claims |
| File completeness | "Relevant Files" lists every file the feature will obviously touch |
| Flow accuracy | The flow matches real behavior, in order |
| Descriptive only | No requirements, ACs, or design |
| Constraints extracted | Conventions the code already enforces are listed |
| Conflicts surfaced | Disagreements are marked `[CONFLICT]` |
| Gaps declared | "Not Investigated" and "Open Questions for the Spec" are filled |
| Length | Under ~200 lines |

**Fail action:** Re-run the failing axis.

### Gate 1: spec.md Approval

Run before Phase 2. On pass: `Status: Approved`.

| Check | Pass Criteria |
|-------|--------------|
| Testability | Every `[MUST]` AC can have an automated test |
| Implementation-free | No technology, function, or database names |
| NEEDS CLARIFICATION | All `[NEEDS CLARIFICATION]` items resolved |
| Constitution PENDING | No `[PENDING]` constitution item affects this feature's domain |
| Error coverage | Error and edge case ACs exist |
| Scope boundary | "Out of Scope" is explicit and complete |
| MoSCoW | Every AC has `[MUST]` / `[SHOULD]` / `[COULD]` / `[WONT]` |
| No vague terms | No "fast", "secure", "works correctly" without a measurable threshold |
| Non-functional | Performance and security requirements have specific values |
| Boundaries (optional) | Populated when AI behavior is constrained |
| Stakeholder alignment | Stakeholders reviewed and agreed |
| Done when checkable | Every Done-when line is a command or artifact that can pass or fail, never a time box |
| Cold read (M, L) | A fresh agent given only `spec.md`, `constitution.md` and any `Baseline:` file restated the goal and Done-when checks; the human confirms it matches intent (`prompt-patterns.md → Cold Read Prompt`) |
| Single reading (M, L) | An AC phrase with more than one reading fails this check. Fix it in the spec |

**Additional checks when `Mode: Delta`:**

| Check | Pass Criteria |
|-------|--------------|
| Baseline resolves | `Baseline:` opens to a prior spec version or `research.md` findings |
| Baseline Assertion verified | Each line checked against its source; one false line invalidates the spec |
| Change labels | Every AC also carries `[ADDED]` / `[MODIFIED]` / `[REMOVED]` / `[UNCHANGED]` |
| Previous behavior quoted | `[MODIFIED]` and `[REMOVED]` ACs quote the baseline verbatim |
| Migration stated | Every `[MODIFIED]` AC says what happens to data and clients from the old behavior |
| Deprecation stated | Each `[REMOVED]` AC states what callers see and when |
| Regression coverage | `[UNCHANGED]` covers behavior sharing code paths with the change |
| Blast radius | Each modified item lists its dependents and the AC that verifies them |
| Mode is right | Under roughly half the ACs are `[ADDED]`; otherwise write a full spec |

**Fail action:** Return to Phase 1 and Clarify.

---

### Gate 2: plan.md + contracts/ Approval

Run before Phase 3. On pass: `Status: Planned`. A checker that did not write the plan runs the
first six rows with evidence. The human approves the rest, which are design calls.

| Check | Pass Criteria |
|-------|--------------|
| AC traceability | Every `[MUST]` AC maps to a component in plan.md |
| Constitution compliance | Only constitution stack items; no banned patterns |
| Contract completeness | Every API-exposing component has a contract file |
| Error codes | Contracts define every error response, not just 200 |
| Data model | Every entity in spec.md appears in data-model.md |
| Migrations | A schema change has at least one migration block in data-model.md |
| Index justification | Each index has a query pattern |
| Risks | Risks table present; every High-impact risk has a mitigation |
| No over-engineering | No abstraction direct framework use could replace |
| Technology fit | Existing stack unless a new dependency is justified |
| Two designs (L) | Two structurally distinct designs compared on interface size; the rejected one and why is a row in `decision_log.md` |

**Fail action:** Return to Phase 2 for the failing check.

---

### Gate 3: tasks.md Approval

Run before Phase 4 by a checker that did not write `tasks.md`. Status stays `Planned` until
the first task starts, then `In Progress`.

| Check | Pass Criteria |
|-------|--------------|
| Test-first order | Every implementation task has a preceding test task |
| Task size | No task touches more than 3 files or is sized L without justification |
| AC references | Test tasks cite specific ACs, error ACs included |
| Contract references | Implementation tasks cite specific contracts/ files |
| Satisfies declaration | Implementation tasks declare the ACs they satisfy |
| Dependency validity | Dependencies form a DAG |
| Parallelism | `[P]` tasks share no written file |

**Fail action:** Fix tasks.md before implementing.

---

### Gate 4: Implementation Validation

Run per task before committing, by a checker that did not write the code. At S only the
first two rows apply.

| Check | Pass Criteria |
|-------|--------------|
| Tests pass | The checker reruns them; nothing regressed |
| Failing before | Each new test ran before the change; the evidence quotes the diff or error showing the predicted disagreement, beyond the assertion line |
| Mutant killed (M, L) | For each `[MUST]` AC with an automated proof, the checker applies a behavior-breaking edit (wrong value, skipped or doubled effect), shows the proof go red, and reverts |
| No tautologies (M, L) | No test computes its expected value with the code under test, asserts on data it built, never calls the code, restates a constant, or asserts less than the AC |
| Bad tests removed | A test failing a row above, or breaking when only internals change, is replaced or deleted and its AC recorded unproven, never kept as coverage |
| Signature match | API signatures match contracts/ exactly |
| Schema match | Database schema matches data-model.md |
| Scope adherence | No file outside the task's scope changed |
| No silent failures | Error cases are handled |
| Constitution check | No banned patterns; security constraints respected |
| Boundaries check | Always do / Never do rules followed, when spec.md has them |

**Fail action:** Fix before committing.

---

### Gate 5: Final Validation

Run before merge by a checker that did not write the code. Drift goes back to the implementer
and a fresh checker reruns the gate. Set `Status: Validated` after the human audits the verdict
and reads the walkthrough.

| Check | Pass Criteria |
|-------|--------------|
| Traceability | Every `[MUST]` AC has a test and an implementation file |
| Full suite | The complete suite passes |
| Drift report | Zero drift between spec.md and the code |
| User story walkthrough | Each story exercised in the running app, artifact attached |
| Contract audit | Every contract error code is implemented and tested |
| Constitution audit | No violations in new code |
| Comprehension | Gate C passed |
| Adversary (M, L) | A non-author agent tried to break each `[MUST]` and `[UNCHANGED]` AC in its own worktree. Findings with a rerun command and output get fixed; the rest go to the attached Dropped list with a reason |
| Mutation run (L) | A mutation tool ran on the changed files; `validation.md` lists each survivor with the AC that should have killed it |

**Mutation tool at level L.** Scope the run to the branch's changed files:

```bash
# JS/TS: Stryker
npx stryker run --mutate "$(git diff --name-only origin/main -- '*.ts' '*.js' | paste -sd, -)"
# Python: mutmut 2 (on mutmut 3, set paths_to_mutate under [tool.mutmut] instead)
mutmut run --paths-to-mutate "$(git diff --name-only origin/main -- '*.py' | paste -sd, -)"
# Rust: cargo-mutants
git diff origin/main > /tmp/branch.diff && cargo mutants --in-diff /tmp/branch.diff
```

A survivor on a `[MUST]` AC fails the gate unless it is equivalent (no observable change) and
the reason is stated.

**Fail action:** Fix drift before merge. No exceptions.

---

### Gate C: Comprehension Check

Run with Gate 5. It checks that the team can maintain the code.

| Check | Pass Criteria |
|-------|--------------|
| Walkthrough exists | Execution-ordered narration with `file:line` citations |
| Human read it | Someone who did not drive the implementation read it end to end |
| Debuggable | That person can name the first breakpoint for a bug report here |
| Justified structure | Every abstraction and indirection traces to a plan.md decision |
| No unexplained behavior | All code maps to an AC, contract clause, or logged decision |
| Reviewable size | A diff too large to read means oversized tasks; note it for the next `tasks.md` |

**Fail action:** Remove unjustified structure. Remove or spec unexplained behavior.

---

## Generated Checklists: Unit Tests for the Spec

A checklist is generated per feature and domain for this feature's own risk, such as
timezone math or money. It does not block a gate; it informs the human running one.

**Invoke:** `/sdd-validate [domain]` → `specs/[feature]/checklists/[domain].md`

Domains: security, UX, accessibility, performance, data integrity, i18n, observability,
migration safety, compliance.

### The one rule that makes them work

**A checklist validates the requirements, never the behavior.** Each item must be answerable
from the spec alone. An item that needs running code belongs in `tasks.md`.

| Tests the requirement (correct) | Tests the behavior (wrong) |
|---------------------------------|----------------------------|
| "Is the expired-session timeout given a numeric value?" | "Does the session expire after 30 minutes?" |
| "Is 'sensitive data' defined in the spec or constitution?" | "Does it redact sensitive data correctly?" |

Banned verbs in items: *displays*, *renders*, *loads*, *executes*, *clicks*, *navigates*,
*works*.

### Item markers

| Marker | Means |
|--------|-------|
| `[Gap]` | A requirement this domain needs is missing |
| `[Ambiguity]` | A requirement admits more than one reading |
| `[Conflict]` | Two requirements cannot both hold |
| `[Assumption]` | The spec depends on something unstated |

### Scenario coverage

Cover primary, alternate, exception, recovery, and non-functional (numeric thresholds). An
item may resolve as excluded when the spec's Out of Scope says so.

### When to run them

At L, before Gate 1, for every domain touched. At M, for the riskiest domain. At S, never. An unresolved security `[Gap]` becomes a Gate 1 "error coverage"
finding.

---

## Confidence-Based Review Thresholds

| Confidence | Conditions | Review Type |
|------------|------------|-------------|
| High (>90%) | Simple CRUD, no auth or schema changes | Automated tests + quick PR scan |
| Medium (70 to 90%) | Cross-service work, new endpoint, UI component | Full PR review + senior approval |
| Low (<70%) | Auth, schema migration, external API, security-sensitive | Pair review + security check |
| Critical | Payments, authentication core, encryption | Mandatory security review before merge |

---

## CI/CD Integration

### Automated Drift Detection

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

      # Compare route signatures in src/ against contracts/*.md
      - name: Check API contract signatures
        run: echo "[PROJECT-SPECIFIC] Implement scripts/check-contract-drift.sh"

      # Compare data-model.md entities against migrations or a schema dump
      - name: Check database schema
        run: echo "[PROJECT-SPECIFIC] Implement scripts/check-schema-drift.sh"
```

### Research Citation Check

Every `path/file.ext:NN` citation in `research.md` must name an existing file and line.

```yaml
- name: Verify research citations resolve
  run: |
    fail=0
    for doc in specs/*/research.md; do
      [ -f "$doc" ] || continue
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
      if ! grep -qE '`[A-Za-z0-9_./-]+\.[A-Za-z0-9]+:[0-9]+' "$doc"; then
        echo "FAIL: $doc contains no file:line citations"
        fail=1
      fi
    done
    exit $fail
```

### Spec Completeness Check

```yaml
- name: Validate spec completeness
  if: contains(github.event.pull_request.changed_files, 'specs/')
  run: |
    if grep -r "\[NEEDS CLARIFICATION\]" specs/; then
      echo "ERROR: Unresolved clarification items in spec"
      exit 1
    fi
    if grep -P "^### AC-" specs/*/spec.md | grep -v "\[MUST\]\|\[SHOULD\]\|\[COULD\]\|\[WONT\]"; then
      echo "ERROR: ACs missing MoSCoW priority labels"
      exit 1
    fi
```

### Task Progress Tracking

```yaml
- name: Task completion report
  run: |
    total=$(grep -c "\- \[" specs/*/tasks.md)
    done=$(grep -c "\- \[x\]" specs/*/tasks.md)
    echo "Tasks: $done/$total complete"
```

---

## Spec Drift Classification

| Drift Type | Example | Action |
|------------|---------|--------|
| Signature | Returns `{ user }` instead of `{ data: user }` | Fix implementation |
| Schema | Column `user_id` instead of `userId` | Fix implementation |
| Behavior | 404 returned, contract says 403 | Fix implementation |
| Scope | Endpoint not in spec.md | Remove or spec it first |
| Spec error | Wrong error code in spec | Update spec → plan → contract → code |

Update a spec only on new information.
