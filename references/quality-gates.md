# Quality Gates

Review checklists, confidence thresholds, and CI/CD integration patterns for SDD.

---

## Gate 0 — constitution.md Approval

Run once per project before any feature work begins.

| Check | Pass Criteria |
|-------|--------------|
| Stack coverage | All languages, frameworks, and databases listed with locked versions |
| Security constraints | At least 5 explicit security rules covering input validation, auth, secrets, logging, CORS |
| No banned patterns | Banned patterns list is specific and enforceable (not vague principles) |
| File structure | Directory structure documented and matches actual project layout |
| No `[PENDING]` items | All deferred decisions resolved or explicitly accepted as deferred |

**Fail action:** Complete the constitution before creating any spec.

---

## Per-Phase Checklists

### Gate 1 — spec.md Approval

Run before Phase 2. All items must pass.

| Check | Pass Criteria |
|-------|--------------|
| Testability | Every `[MUST]` AC can have an automated test written for it |
| Implementation-free | No technology names, function names, or database terms |
| NEEDS CLARIFICATION | All `[NEEDS CLARIFICATION]` items resolved |
| Error coverage | Error/edge case ACs exist (not just happy path) |
| Scope boundary | "Out of Scope" section is explicit and complete |
| MoSCoW prioritization | Every AC has a `[MUST]` / `[SHOULD]` / `[COULD]` / `[WONT]` label |
| No vague terms | No "fast", "secure", "works correctly" without measurable thresholds |
| Non-functional requirements | Performance and security requirements stated with specific values |
| Stakeholder alignment | Relevant stakeholders have reviewed and agreed |

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
| Index justification | Indexes in data-model.md are justified by specific query patterns |
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
| AC references | Test tasks cite specific ACs from spec.md |
| Contract references | Implementation tasks cite specific contracts/ files |
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

**Fail action:** Fix drift before merge. No exceptions.

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

Add to your CI pipeline to catch spec drift on every PR:

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

      - name: Check API contract signatures
        run: |
          # Extract function signatures from contracts/
          # Compare against implemented routes
          # Fail if signatures differ
          node scripts/check-contract-drift.js

      - name: Check database schema
        run: |
          # Compare data-model.md entities against migration files
          node scripts/check-schema-drift.js

      - name: Verify AC test coverage
        run: |
          # Check that each AC-ID from spec.md appears in test files
          node scripts/check-ac-coverage.js
```

### Spec Completeness Check

```yaml
# Run on spec.md changes only
- name: Validate spec completeness
  if: contains(github.event.pull_request.changed_files, 'specs/')
  run: |
    # Check spec.md has no [NEEDS CLARIFICATION] items
    if grep -r "\[NEEDS CLARIFICATION\]" specs/; then
      echo "ERROR: Unresolved clarification items in spec"
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
