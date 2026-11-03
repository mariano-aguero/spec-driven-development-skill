# Output Formats

Formats and line budgets for everything the human reads.

## Contents

- Principles
- Gate verdict: every gate (0, R, 1 to 5, C) and the three verdicts
- Critic findings
- Checklist, traceability matrix, drift report, analyze report (`/sdd-validate`)
- Reconcile report (`/sdd-change`)
- Status report (`/sdd-status`)
- Linear walkthrough
- Phase completion summary
- What never to print

---

## Principles

### Write artifacts, show verdicts

Artifacts go to files. The response carries the verdict first, then the evidence for the
decision the human has to make, never the artifact itself.

| Just wrote | Show instead |
|-----------|--------------|
| `spec.md` | Path, AC count by MoSCoW, open question count, Gate 1 verdict |
| `research.md` | Path, findings count, uncited claims, `[CONFLICT]` items, Gate R verdict |
| `plan.md` and `contracts/` | Paths, uncovered `[MUST]` ACs, unmitigated High risks, Gate 2 verdict |
| `tasks.md` | Path, task count, total size, first task ready to run |

### Binary confidence, never percentages

| Marker | Meaning |
|--------|---------|
| `[CONFIRMED]` | Verified against code, a test run, or a cited artifact |
| `[VERIFY]` | Inferred, assumed, or read from a source that could be stale |

No third marker, no unmarked claim, no numeric confidence.

### Respect the line budget

When findings exceed a budget, show the most severe and give the remainder as a count with a
file path.

---

## Gate Verdict

**Budget: under ~25 lines, even when the artifact is longer.** Used for Gates 0, R, 1 to 5,
and C.

```text
Gate 1: spec.md    FAIL (9 checks, 2 failed)
7 ACs (4 MUST, 1 SHOULD, 1 COULD, 1 WONT) · 1 open question

✗ Testable ACs        AC-3 "responds quickly" has no threshold
✗ Open questions      [NEEDS CLARIFICATION] on session replacement is unresolved

✓ Proof lines · Error cases · Boundaries · Handoff · WONT recorded · Out of scope · NFRs

Next: resolve the open question in spec.md, then re-run Gate 1. Phase 2 is blocked.
```

Rules:

- Verdict on line one, with no preamble before it
- Countable facts on line two: AC counts by MoSCoW and open question count for a spec, the
  counts under Principles for other artifacts
- One line per failed check, with the specific reason. Never "see the plan"
- Passed checks collapse onto shared lines
- End with one explicit next action that names what is blocked
- A full pass collapses to one line: `Gate 2: PASS (8/8). Next: /sdd-tasks`
- A skipped check makes the gate `inconclusive` with the reason, never passed

**Verdicts.** Every evidence check, in a gate or in `validation.md`, ends in one of three
values, defined here once:

| Verdict | Meaning |
|---------|---------|
| `pass` | The check ran and met its criterion |
| `fail` | The check ran and did not meet its criterion |
| `inconclusive` | The check could not run (missing tool, no subagents, flaky environment). The reason is stated, and the next phase does not start |

---

## Critic Findings

**Budget: one line per finding, most severe first, 20 lines maximum.**

A spec or research critic that cannot cite the location it read marks the finding `[VERIFY]`.
A finding against code (adversary, Phase 5 critics) is `[CONFIRMED]` only with three lines
under it: the command, its output, and the output the spec requires. The coordinator
([Subagent Review Pattern](ai-agent-patterns.md#subagent-review-pattern)) reruns the command
before reporting. A finding that does not reproduce goes to a Dropped list with the reason and
never reaches the human as an issue:

```text
[ISSUE] [AC-4] Adversary [Broken] [CONFIRMED] expired token still signs in
  run:      curl -s -o /dev/null -w '%{http_code}' localhost:3000/auth/verify?token=$EXPIRED
  got:      200
  required: 410 (AC-4)

[ISSUE] [Boundaries] Product [Ambiguous] [VERIFY] "sensitive data" is never defined

2 issues (1 confirmed and rerun, 1 to verify). The human decides what blocks the gate.
Dropped (2): AC-2 double-submit: rerun returned 409 as required · AC-6 "race on TTL": no command given
```

Critics report issues only: no approvals, compliments, or summaries of what is good.

---

## Traceability Matrix

**Budget: one row per AC plus a 3-line summary.** Written to `specs/[feature]/validation.md`.

```markdown
# Validation: [Feature Name]

Date: [YYYY-MM-DD] · Commit: [sha]

| AC | Proof | Before (failure quoted) | Mutant | After | Verdict | Checked by |
|----|-------|-------------------------|--------|-------|---------|------------|
| AC-1 | test: `pnpm test tests/auth/magic-link.test.ts` | `expected 202, received 404` | skip enqueue, red | green | pass | checker-1 |
| AC-4 | test: `pnpm test tests/auth/expiry.test.ts` | `expected 410, received 200` | TTL x2, green | green | fail | checker-2 |
| AC-5 | artifact: sign-in page after expiry | n/a | n/a | n/a | inconclusive | checker-2 |

**MUST coverage: 1/2.** AC-4 survived a mutant, so its test does not prove it. Blocking.
**Unmapped code:** none.
```

Proof comes from the AC's `Proof:` line. Before quotes the failure content of the run before
the change, not only the assertion. Mutant is one behavior-breaking edit and the color it
produced (`n/a` at level S). Verdict is as under Gate Verdict. Checked by names an agent that
is not the author. Rows exist for `[MUST]` and `[SHOULD]` ACs. A `[MUST]` AC with any verdict
other than `pass` blocks Gate 5. Response summary:

```text
Validation: FAIL. MUST coverage 1/2.
✗ AC-4 survived mutant "TTL x2": tests/auth/expiry.test.ts proves nothing
Full matrix: specs/magic-link-login/validation.md
```

---

## Drift Report

**Budget: one line per drift item, grouped by type, 25 lines maximum.**

```text
Drift report: 2 items (1 must fix, 1 spec error)

SIGNATURE  POST /auth/magic-link returns { ok: true }; contract says { requestId }
           src/app/auth/magic-link/route.ts:44 vs contracts/auth-api.md:31   [CONFIRMED]
SPEC ERROR contracts/auth-api.md:52 specifies 403; 401 is correct per constitution.md:38
                                                                             [VERIFY]

Fix code: SIGNATURE. Update spec chain: SPEC ERROR (spec, plan, contract, code).
```

Every item cites the code and the artifact it contradicts, or it is `[VERIFY]`. Types are fixed: `SIGNATURE`, `SCHEMA`, `BEHAVIOR`, `SCOPE`,
`SPEC ERROR`. Only `SPEC ERROR` edits an artifact. Every other type means fixing the code.

---

## Checklist

**Budget: the file holds every item. The response shows findings only, 15 lines maximum.**
Written to `specs/[feature]/checklists/[domain].md`.

```markdown
# Security Checklist: Magic-Link Login

Spec: `specs/magic-link-login/spec.md` @ v1.2 · Generated: 2026-08-06

## Exception
- [x] Is the outcome specified for an expired link? (AC-4)
- [ ] **[Gap]** No requirement states whether an existing session is replaced when a
      second magic link is redeemed.

Intentionally excluded: MFA, social login (spec Out of Scope).

**1 finding: 1 Gap. 0 Ambiguities, 0 Assumptions, 0 Conflicts.**
```

Response summary:

```text
Security checklist: 8 items, 1 finding (1 gap)
[Gap] session replacement on second redemption is unspecified
Full checklist: specs/magic-link-login/checklists/security.md
Findings are Gate 1 input. The checklist does not block on its own.
```

Passing items are checked and cited, as evidence the domain was examined. Every finding names
what is missing. The counts line is mandatory.

---

## Reconcile Report

**Budget: one line per difference plus its evidence line, 30 lines maximum.** Output of
`/sdd-change`. This report proposes and never applies.

```text
Reconcile: magic-link-login vs HEAD (baseline a3f9c21, 14 commits since)
2 differences: 1 intentional, 0 external, 1 drift, 0 ambiguous

INTENTIONAL  Token TTL is 5min in code, spec AC-4 says 15min
             evidence L2: commit 7d21e0f "hotfix: shorten magic link TTL after INC-482"
             → update spec                                          [CONFIRMED]
DRIFT        Rate limit key is per-IP in code; AC-E3 specifies per-email
             evidence L4: ran 4 requests from 2 IPs, 4th was not limited
             → fix code                                             [CONFIRMED]

Nothing has been changed. Approve items individually.
Apply approved spec updates via /sdd-change; approved code fixes become tasks.
```

Rules:

- **Every `INTENTIONAL` and `EXTERNAL` row quotes its evidence.** A row without quoted
  evidence is `DRIFT`, whatever the code looks like. "Appears deliberate" is not evidence
- Every difference carries an evidence level L1 to L5, from the
  [ladder under the research.md template](artifact-templates.md#researchmd-template)
- An `AMBIGUOUS` row is `[VERIFY]` and the human decides. It defaults to `DRIFT`
- The two closing lines are mandatory. They stop a reader from treating the report as applied
- If `DRIFT` plus `AMBIGUOUS` exceed half the rows, add a line saying the feature was likely
  rebuilt outside the process and should be re-specified rather than patched

---

## Analyze Report

**Budget: 20 lines.** Output of `/sdd-validate`: cross-artifact and cross-feature consistency.

```text
Analyze: 3 findings across 3 features

CONFLICT   specs/billing/contracts/invoice-api.md:20 and specs/reporting/contracts/export-api.md:14
           define incompatible shapes for the same Invoice entity              [CONFIRMED]
ORPHAN     specs/billing/plan.md references contracts/tax-api.md, which does not exist
                                                                               [CONFIRMED]
STALE      specs/reporting/spec.md Status: Draft, last updated 94 days ago      [VERIFY]

Blocking: CONFLICT, ORPHAN. Non-blocking: STALE.
```

Finding types are fixed: `CONFLICT`, `DUPLICATE`, `ORPHAN`, `STALE`, `GAP`.

---

## Status Report

**Budget: 12 lines.** Output of `/sdd-status`.

```text
Feature: magic-link-login          Branch: feature/magic-link-login

Phase 0   constitution.md      ✓ Gate 0 passed
Phase 0.5 research.md          ✓ Gate R passed        8 findings, 0 uncited
Phase 1   spec.md              ✓ Gate 1 passed        7 ACs (4 MUST, 1 SHOULD, 1 COULD, 1 WONT)
Phase 2   plan.md + contracts  ✓ Gate 2 passed        contracts LOCKED
Phase 3   tasks.md             ✓ Gate 3 passed        11 tasks
Phase 4   implementation       ▶ 6/11 tasks           last commit a3f9c21
Phase 5   validation           ○ not started

Next: TASK-007 [M] Implement magic-link verification endpoint (AC-2, AC-4, AC-E2)
```

Glyphs are fixed: `✓` passed, `▶` in progress, `○` not started, `✗` failed, `⚠` passed with a
skipped check. Derive every line from files on disk, never from conversation memory. A missing
artifact shows `○ not started`.

---

## Linear Walkthrough

**Budget: 60 lines or 8 steps, whichever comes first.** Written to
`specs/[feature]/walkthrough.md` and attached to the PR.

```markdown
# Walkthrough: [Feature Name]

For an engineer who has never seen this code and will maintain it.
Follows execution order, not file order.

## 1. Request arrives
`POST /auth/magic-link` at `src/app/auth/magic-link/route.ts:12`
Validates the body with Zod at the route boundary, per constitution.md:41.

...

## Not handled here
- Session expiry: enforced in `src/auth/middleware.ts:40`

## Unrequested behavior
None. Every branch traces to an AC or a plan.md decision.
```

The Unrequested behavior section is mandatory. It lists every branch the agent cannot trace
to an AC or a plan decision, which is what Gate C exists to surface. "None" is a claim the
reviewer can check.

---

## Phase Completion Summary

**Budget: 6 lines.** Printed after each phase, before the gate verdict: artifact paths, then
the counts a reviewer would otherwise derive by reading. No restated content.

---

## What Never to Print

- The full text of an artifact just written to a file
- A preamble before the verdict
- A numeric confidence score
- "Successfully completed!" with no counts
- A gate marked passed when a check was skipped
- Findings truncated without a count ("…and others")
- The user's request restated
- An explanation of what an AC or a spec is
