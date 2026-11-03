# Output Formats

Formats for everything the **human** reads. The rest of this skill defines what to write to
files; this file defines what to show the person running the workflow.

## Contents

- Principles — write vs. show, verdict first, line budgets, binary confidence
- Gate verdict — the format for every gate (0, R, 1–5, C)
- Critic findings — issue lines with confidence markers
- Checklist — `/sdd:checklist [domain]`
- Traceability matrix — `/sdd:validate`
- Drift report — `/sdd:validate`
- Reconcile report — `/sdd:reconcile`
- Analyze report — `/sdd:analyze`
- Status report — `/sdd:status`
- Linear walkthrough — `walkthrough.md`
- Phase completion summary
- What never to print

---

## Principles

### Write artifacts, show verdicts

Artifacts go to files. The response gets the decision the human has to make, plus the
evidence needed to make it. Pasting a freshly written artifact into the response doubles the
reading burden and doubles the tokens.

| Just wrote | Show instead |
|-----------|--------------|
| `spec.md` (200 lines) | Path, AC count by MoSCoW, unresolved questions, Gate 1 verdict |
| `research.md` (200 lines) | Path, findings count, uncited claims, `[CONFLICT]` items, Gate R verdict |
| `plan.md` + `contracts/` | Paths, uncovered `[MUST]` ACs, unmitigated High risks, Gate 2 verdict |
| `tasks.md` | Path, task count, total size, first task ready to run |

### Verdict first, evidence second

Lead with pass/fail and the count. A reviewer who agrees with the verdict should be able to
stop reading after line one; a reviewer who doesn't should find the evidence immediately
below. Never build up to the conclusion.

### Binary confidence, never percentages

Two markers only:

| Marker | Meaning |
|--------|---------|
| `[CONFIRMED]` | Verified against code, a test run, or a cited artifact |
| `[VERIFY]` | Inferred, assumed, or read from a source that could be stale |

Numeric confidence ("82% sure") is noise: it is not calibrated, and readers decide slower
with a number than with a binary. Anything not `[CONFIRMED]` is `[VERIFY]` — there is no
middle marker and no unmarked claim.

### Respect the line budget

Every format below carries a budget. Exceeding it means the output stopped being a summary.
When findings exceed the budget, show the most severe and state the remainder as a count
with a file path — never truncate silently.

---

## Gate Verdict

**Budget: 15 lines + one line per failing check.** Used for Gates 0, R, 1–5, and C.

```text
Gate 2 — plan.md + contracts/    FAIL (8 checks, 2 failed)

✗ AC traceability      AC-4, AC-E2 map to no component in plan.md
✗ Risks identified     "Third-party API unavailable" is High impact with no mitigation

✓ Constitution compliance · Contract completeness · Error codes · Data model ·
  Migrations · Index justification · No over-engineering · Technology fit

Next: fix plan.md → re-run Gate 2. Do not proceed to Phase 3.
```

Rules:

- One line per **failed** check with the specific reason — never "see the plan"
- Passed checks collapse onto shared lines; they are context, not content
- End with the single next action, and say explicitly what is blocked
- On a full pass, the body collapses to one line: `Gate 2 — PASS (8/8). Next: /sdd:tasks`
- Never report a gate as passed when a check was skipped — report it as `SKIPPED` with the
  reason, which is a fail for the purposes of proceeding

---

## Critic Findings

**Budget: one line per finding, most severe first, 20 lines maximum.**

```text
[ISSUE] [AC-3] QA [Untestable] [CONFIRMED] "responds quickly" has no threshold
[ISSUE] [AC-7] Security [Missing] [CONFIRMED] no authorization check specified for admin path
[ISSUE] [Boundaries] Product [Ambiguous] [VERIFY] "sensitive data" is never defined in spec or constitution

3 issues (2 confirmed, 1 to verify) · 0 blocking Gate 1 automatically — human decides
```

The `[CONFIRMED]` / `[VERIFY]` marker sits between the type and the description. A critic
that cannot cite the artifact location it read marks the finding `[VERIFY]`.

Critics report issues only — no approvals, no compliments, no summaries of what is good.

---

## Traceability Matrix

**Budget: one row per AC, plus a 3-line summary.** Written to `specs/[feature]/validation.md`
and summarized in the response.

```markdown
# Validation: [Feature Name]

Date: [YYYY-MM-DD] · Commit: [sha]

| AC | Priority | Test | Implementation | Status |
|----|----------|------|----------------|--------|
| AC-1 | MUST | `tests/auth/magic-link.test.ts:24` | `src/app/auth/magic-link/route.ts:12` | ✓ PASS |
| AC-2 | MUST | `tests/auth/verify.test.ts:11` | `src/app/auth/magic-link/verify/route.ts:20` | ✓ PASS |
| AC-4 | MUST | — | `src/lib/tokens.ts:30` | ✗ NO TEST |
| AC-5 | SHOULD | `tests/ui/sign-in.test.tsx:8` | `src/app/sign-in/page.tsx:15` | ✓ PASS |
| AC-6 | COULD | — | — | ○ NOT IMPLEMENTED |
| AC-7 | WONT | — | — | ○ OUT OF SCOPE |

**MUST coverage: 3/4.** AC-4 implemented without a test — blocking.
**Unmapped code:** none.
```

Response summary (3 lines):

```text
Validation — FAIL. MUST coverage 3/4.
✗ AC-4 implemented at src/lib/tokens.ts:30 with no test
Full matrix: specs/magic-link-login/validation.md
```

Status vocabulary is fixed: `✓ PASS`, `✗ FAIL`, `✗ NO TEST`, `○ NOT IMPLEMENTED`,
`○ OUT OF SCOPE`. A `[MUST]` AC in any state other than `✓ PASS` blocks Gate 5.

---

## Drift Report

**Budget: one line per drift item, grouped by type, 25 lines maximum.**

```text
Drift report — 3 items (2 must fix, 1 spec error)

SIGNATURE  POST /auth/magic-link returns { ok: true }; contract says { requestId }
           src/app/auth/magic-link/route.ts:44 vs contracts/auth-api.md:31   [CONFIRMED]
SCOPE      Endpoint DELETE /auth/sessions exists in code, absent from spec.md
           src/app/auth/sessions/route.ts:9                                  [CONFIRMED]
SPEC ERROR contracts/auth-api.md:52 specifies 403; 401 is correct per constitution.md:38
                                                                             [VERIFY]

Fix code: SIGNATURE, SCOPE. Update spec chain: SPEC ERROR (spec → plan → contract → code).
```

Every drift item carries both locations — the code and the artifact it contradicts. A drift
item without both is not actionable and must be marked `[VERIFY]`.

Drift types are fixed: `SIGNATURE`, `SCHEMA`, `BEHAVIOR`, `SCOPE`, `SPEC ERROR`. Only
`SPEC ERROR` results in editing an artifact; everything else means fixing the code.

---

## Checklist

**Budget: the file holds every item; the response shows only findings, 15 lines maximum.**
Written to `specs/[feature]/checklists/[domain].md`.

```markdown
# Security Checklist: Magic-Link Login

Spec: `specs/magic-link-login/spec.md` @ v1.2 · Generated: 2026-08-06

## Primary
- [x] Is the authentication outcome of a successful verification specified? — AC-2
- [x] Is the token's entropy stated numerically? — Non-Functional Requirements
- [ ] **[Gap]** No requirement states whether an existing session is replaced or
      preserved when a second magic link is redeemed.

## Exception
- [x] Is the outcome specified for an expired link? — AC-4
- [x] Is the outcome specified for a reused link? — AC-E2
- [ ] **[Ambiguity]** AC-E3 specifies rate limiting per email; the spec does not state
      whether the limit applies before or after email-existence is checked, which
      determines whether the endpoint leaks registration status under load.

## Non-functional
- [x] Is the request latency target numeric and given a percentile? — NFR Performance
- [ ] **[Assumption]** "the existing job queue" is assumed available; no requirement
      states the behavior when enqueueing fails.

Intentionally excluded: MFA, social login — spec § Out of Scope.

**3 findings: 1 Gap, 1 Ambiguity, 1 Assumption. 0 Conflicts.**
```

Response summary:

```text
Security checklist — 8 items, 3 findings (1 gap, 1 ambiguity, 1 assumption)
[Gap]        session replacement on second redemption is unspecified
[Ambiguity]  AC-E3 rate-limit ordering determines whether registration status leaks
[Assumption] no requirement covers job-queue enqueue failure
Full checklist: specs/magic-link-login/checklists/security.md
Findings are Gate 1 input — the checklist does not block on its own.
```

Rules:

- Passing items are checked and cited; they are evidence the domain was examined, not filler
- Every finding names what is missing, never merely that something is missing
- The counts line is mandatory — a checklist without counts reads as "looks fine"
- The response carries findings only. Passing items stay in the file

---

## Reconcile Report

**Budget: one line per difference plus its evidence line, 30 lines maximum.** Output of
`/sdd:reconcile`. This report proposes; it never applies.

```text
Reconcile — magic-link-login vs HEAD (baseline a3f9c21, 14 commits since)
6 differences: 2 intentional, 1 external, 2 drift, 1 ambiguous

INTENTIONAL  Token TTL is 5min in code, spec AC-4 says 15min
             evidence: commit 7d21e0f "hotfix: shorten magic link TTL after INC-482"
             → update spec                                          [CONFIRMED]
INTENTIONAL  Verify endpoint returns 410 on reuse; contract says 409
             evidence: PR #218 "align reuse response with expiry semantics"
             → update contract                                      [CONFIRMED]
EXTERNAL     Session cookie now SameSite=Strict, spec says Lax
             cause: framework 4.2 changed the default — CHANGELOG.md:88
             → update spec, record cause                            [CONFIRMED]
DRIFT        Rate limit key is per-IP in code; AC-E3 specifies per-email
             evidence: none found in 14 commits
             → fix code                                             [CONFIRMED]
DRIFT        Endpoint DELETE /auth/sessions exists, absent from spec
             evidence: none found
             → fix code or specify                                  [CONFIRMED]
AMBIGUOUS    Email template omits the expiry notice from AC-5
             evidence: commit 1b904cc "copy tweaks" — does not mention expiry
             → human decides (defaults to DRIFT)                    [VERIFY]

Nothing has been changed. Approve items individually.
Apply approved spec updates via /sdd:amend; approved code fixes become tasks.
```

Rules:

- **Every `INTENTIONAL` and `EXTERNAL` row carries a quoted evidence line.** A row without
  quoted evidence is `DRIFT` — never `INTENTIONAL` on the strength of the code existing.
- Evidence is quoted, not summarized. `commit 7d21e0f "hotfix: shorten TTL after INC-482"`
  is evidence; "appears deliberate" is not.
- The closing two lines are mandatory. They are what stop a reader from treating the report
  as an applied change.
- If `DRIFT` plus `AMBIGUOUS` exceeds half the rows, add a line stating that the feature was
  likely rebuilt outside the process and should be re-specified rather than patched.

---

## Analyze Report

**Budget: 20 lines.** Output of `/sdd:analyze` — cross-artifact and cross-feature consistency.

```text
Analyze — 4 findings across 3 features

CONFLICT   specs/billing/contracts/invoice-api.md:20 and specs/reporting/contracts/export-api.md:14
           define incompatible shapes for the same Invoice entity              [CONFIRMED]
DUPLICATE  specs/auth/spec.md AC-9 and specs/sessions/spec.md AC-2 specify the
           same expiry behavior with different values (24h vs 12h)             [CONFIRMED]
ORPHAN     specs/billing/plan.md references contracts/tax-api.md — file does not exist
                                                                               [CONFIRMED]
STALE      specs/reporting/spec.md Status: Draft, last updated 94 days ago      [VERIFY]

Blocking: CONFLICT, ORPHAN. Non-blocking: DUPLICATE, STALE.
```

Finding types are fixed: `CONFLICT`, `DUPLICATE`, `ORPHAN`, `STALE`, `GAP`.

---

## Status Report

**Budget: 12 lines.** Output of `/sdd:status`. Answers "where am I?" without opening a file.

```text
Feature: magic-link-login          Branch: feature/magic-link-login

Phase 0   constitution.md      ✓ Gate 0 passed
Phase 0.5 research.md          ✓ Gate R passed        8 findings, 0 uncited
Phase 1   spec.md              ✓ Gate 1 passed        7 ACs (4 MUST, 1 SHOULD, 1 COULD, 1 WONT)
Phase 2   plan.md + contracts  ✓ Gate 2 passed        contracts LOCKED
Phase 3   tasks.md             ✓ Gate 3 passed        11 tasks
Phase 4   implementation       ▶ 6/11 tasks           last commit a3f9c21
Phase 5   validation           ○ not started

Next: TASK-007 [M] Implement magic-link verification endpoint
      Tests AC-2, AC-4, AC-E2 · contracts/auth-api.md → GET /auth/magic-link/verify
```

Status glyphs are fixed: `✓` passed, `▶` in progress, `○` not started, `✗` failed,
`⚠` passed with a skipped check.

Derive every line from the files on disk — never from conversation memory. If an artifact is
missing, show `○ not started` rather than inferring it from what was discussed.

---

## Linear Walkthrough

**Budget: 60 lines, or 8 steps, whichever comes first.** Written to
`specs/[feature]/walkthrough.md` and attached to the PR.

```markdown
# Walkthrough: [Feature Name]

For an engineer who has never seen this code and will have to maintain it.
Follows execution order, not file order.

## 1. Request arrives
`POST /auth/magic-link` — `src/app/auth/magic-link/route.ts:12`
Validates the body with Zod at the route boundary, per constitution.md:41.

## 2. Rate limit is checked before any write
`checkLimit()` — `src/app/auth/magic-link/route.ts:24`
Key is per-email, not per-IP (AC-E3): legitimate users share NATs.

## 3. Token is generated and hashed
`createToken()` — `src/lib/tokens.ts:18`
Only the SHA-256 hash is stored — the raw token exists solely in the email.

...

## Not handled here
- Session expiry — enforced centrally in `src/auth/middleware.ts:40`
- Email delivery retries — owned by the job worker, out of this feature's scope

## Unrequested behavior
None. Every branch traces to an AC or a plan.md decision.
```

The **Unrequested behavior** section is mandatory and must never be omitted. If the agent
cannot trace a branch to an AC or a plan decision, it lists it here — that is the finding
Gate C exists to surface, and an empty section is a claim the reviewer can check.

---

## Phase Completion Summary

**Budget: 6 lines.** Printed after each phase, before the gate verdict.

```text
Phase 2 complete — plan.md, data-model.md, contracts/auth-api.md
4 components · 2 entities · 1 contract (6 endpoints, 11 error codes)
AC coverage: 4/4 MUST mapped · Risks: 3 identified, 3 mitigated
~2,400 tokens written
```

Report the artifact paths and the counts a reviewer would otherwise have to derive by
reading. Do not restate the content.

---

## What Never to Print

| Never | Why |
|-------|-----|
| The full text of an artifact just written to a file | Doubles the reading burden and the token cost |
| A preamble before the verdict | The decision is the payload; everything else is support |
| A numeric confidence score | Uncalibrated and slower to act on than a binary marker |
| "Successfully completed!" with no counts | Unverifiable; a summary without numbers is a claim without evidence |
| A gate marked passed when a check was skipped | Silently converts a quality gate into a formality |
| Findings truncated without a count | "…and others" hides the size of the problem |
| Restating the user's request back to them | They wrote it; they know |
| An explanation of what an AC or a spec is | The user installed a spec-driven skill on purpose |
