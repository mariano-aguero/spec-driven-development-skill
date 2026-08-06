# Quality Gates

Review checklists, confidence thresholds, and CI/CD integration patterns for SDD.

## Contents

- Which gates apply at which ceremony level
- Gate 0 — `constitution.md` approval
- Per-phase checklists: Gate R (research), Gates 1–5 (incl. delta-mode checks), Gate C
- Confidence-based review thresholds
- CI/CD integration: research citation check, AC coverage, drift detection, spec completeness
- Spec drift classification

Gate results are reported to the user in a fixed format — see
`output-formats.md → Gate Verdict`.

---

## Which Gates Apply at Which Ceremony Level

Gates are not optional at the level you chose — they are what the level *means*. Choosing S
is a decision to accept less verification; skipping a gate at M is not.

| Gate | S — Light | M — Standard | L — Full |
|------|-----------|--------------|----------|
| Gate 0 — constitution | inherited | inherited | required |
| Gate R — research | — | if research was run | required |
| Gate 1 — spec | ACs reviewed in the PR body | required | required |
| Gate 2 — plan + contracts | — | required | required |
| Gate 3 — tasks | — | required | required |
| Gate 4 — per task | tests pass | required | required |
| Gate 5 — validation | tests pass, diff reviewed | required | required |
| Gate C — comprehension | — | if the diff exceeds one sitting | required |
| Critic agents | — | optional | required |

"Inherited" means the constitution already exists and applies — you do not re-approve it per
change.

**The one rule that holds at every level:** a human approves before the next phase begins.
S has fewer gates, not self-approving ones.

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

Run before Phase 2. All items must pass.

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

Run before Phase 3. All items must pass.

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

**Fail action:** Return to Phase 2 for the failing check. Do not proceed to Phase 3.

---

### Gate 3 — tasks.md Approval

Run before Phase 4. All items must pass.

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

Run per-task, before marking task complete and committing.

| Check | Pass Criteria |
|-------|--------------|
| Tests pass | All new tests pass; no existing tests regressed |
| Signature match | Implemented API signatures match contracts/ exactly |
| Schema match | Database schema matches data-model.md |
| Scope adherence | No files modified outside the task's stated scope |
| No silent failures | Error cases are handled, not swallowed |
| Constitution check | No banned patterns introduced; security constraints respected |
| Boundaries check | If spec.md has a Boundaries section, Always do / Never do rules were followed |

**Fail action:** Fix before committing. Do not mark task complete.

---

### Gate 5 — Final Validation

Run after Phase 4 completes, before merging.

| Check | Pass Criteria |
|-------|--------------|
| Traceability matrix | Every `[MUST]` AC has an identified test and implementation file |
| Full test suite | Complete test suite passes |
| Drift report | Zero drift items found (spec.md vs. implementation) |
| User story walkthrough | Human walked through each user story in running application |
| Contract audit | All contract error codes have corresponding implementation and tests |
| Constitution audit | No constitution violations detected in new code |
| Comprehension | Linear walkthrough produced and read by a human — see Gate C below |

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
