# Quick Reference — Spec-Driven Development

One-page cheat sheet. For details, see referenced files.

## Contents

Workflow diagram · Directory layout · Phase commands · Hard rules · MoSCoW labels ·
AC format · Task sizes · Drift types · Gate checklist · Context budget · Output budgets ·
When not to use SDD

---

## Phase 0 + 5-Phase Workflow

```
[CONSTITUTION] ── (once per project)
       ↓
[RESEARCH] ── (conditional: unfamiliar or existing code)
 research.md
       ↓
[SPECIFY] → [CLARIFY] → [PLAN] → [TASKS] → [IMPLEMENT] → [VALIDATE]
 spec.md      resolve     plan.md   tasks.md   per task     traceability
              ambiguities data-model commit     commit       drift report
              edge cases  contracts  after each after each   walkthrough
              → spec.md
```

Each arrow is a **compaction boundary**: the next phase reads the artifact, never the raw
material behind it.

---

## Directory Layout

```
constitution.md      # Project-level: immutable principles (NEVER skip)

specs/[feature]/
├── research.md      # How the system works TODAY (Phase 0.5, cited file:line)
├── spec.md          # WHAT + WHY (no tech details, MoSCoW priorities)
├── plan.md          # HOW (architecture, components)
├── data-model.md    # Entities, fields, constraints, indexes
├── contracts/       # API shapes, error codes (LOCKED after Phase 2 approval)
├── tasks.md         # Ordered, sized, dependency-mapped tasks
├── validation.md    # Traceability matrix (Phase 5)
├── progress.md      # Optional: resume state across context resets (Phase 4)
├── walkthrough.md   # Optional: execution-ordered narration for reviewers (Phase 5)
└── decision_log.md  # Optional: key decisions and rationale
```

---

## Phase Commands

| Command | Phase | Reads | Creates |
|---------|-------|-------|---------|
| `/sdd:init` | 0 | project context | `constitution.md` |
| `/sdd:research [description]` | 0.5 | codebase | `research.md` |
| `/sdd:specify [description]` | 1 | user input + `research.md` (if present) | `spec.md` |
| `/sdd:clarify` | 1 (sub-step) | `spec.md` | delta (new ACs, resolved questions) |
| `/sdd:plan` | 2 | `spec.md` + `constitution.md` + `research.md` (if present) | `plan.md`, `data-model.md`, `contracts/` |
| `/sdd:tasks` | 3 | `plan.md`, `contracts/` | `tasks.md` |
| `/sdd:next-task` | 4 | `tasks.md` | — (extracts single task) |
| `/sdd:analyze` | any | `spec.md` | inconsistency report |
| `/sdd:status` | any | all artifacts on disk | phase state + next action (12 lines) |
| `/sdd:amend [what changed]` | any | all spec files | updated spec chain |
| `/sdd:validate` | 5 | all spec files + code | `validation.md`, drift report, `walkthrough.md` |

---

## Hard Rules

| Rule | Why |
|------|-----|
| Constitution before any spec | Without it, every feature reinvents the wheel |
| Research before specifying unfamiliar code | A spec built on a wrong model of the system drifts by construction |
| Every research claim cites `file:line` | An uncited finding is a guess wearing a fact's clothes |
| Compact at 60–80%, never at 100% | Auto-compaction discards details you chose to keep |
| Surface assumptions before specifying | Implicit AI assumptions become wrong ACs |
| No implementation details in spec.md | Spec describes behavior, not mechanism |
| Clarify before Plan | Ambiguous spec = wrong architecture |
| Lock contracts/ before Phase 4 | Changing contracts mid-implementation = drift |
| Fresh context per task | Accumulated assumptions corrupt later tasks |
| Commit after each task | Clean rollback if task produced drift |
| Code must match spec (never reverse) | Updating spec to match code destroys its value |
| Human approves each phase gate | AI cannot approve its own output |
| Commit specs with code | Spec files belong in the same PR as implementation |

---

## MoSCoW Priority Labels

| Label | Meaning | Use |
|-------|---------|-----|
| `[MUST]` | Required for launch | No AC = no shipping |
| `[SHOULD]` | Important but not blocking | Ship if time allows |
| `[COULD]` | Nice to have | Backlog if needed |
| `[WONT]` | Explicitly out of scope | Documents decision |

---

## Acceptance Criteria Format

```
Given [initial state or context]
When [user or system action]
Then [observable outcome]
```

✅ Given a logged-in user, when they submit the form, then a success message appears within 1s.
❌ "The form submits correctly" — not testable.
❌ "The API calls POST /users" — implementation detail.

---

## Task Size Guidelines

| Size | Duration | Max Files | When to Split |
|------|----------|-----------|---------------|
| S | < 1 hour | 1–2 | Never |
| M | 1–3 hours | 2–3 | When touching unrelated concerns |
| L | 3–6 hours | 3 | Always — split into 2× M |

---

## Drift Types (All Require Fixing)

| Drift | Example | Fix |
|-------|---------|-----|
| Signature | Returns `{ user }` instead of `{ data: user }` | Fix code |
| Schema | Column `userId` instead of `user_id` | Fix code |
| Behavior | Returns 404 instead of specified 403 | Fix code |
| Scope creep | Extra endpoint not in spec | Remove or update spec first |
| Spec error | Wrong error code in spec | Update spec → plan → contract → code |

---

## Gate Checklist (Summary)

**Gate 0 (constitution.md):** Stack locked? 5+ security rules? No vague banned patterns? Structure documented?
**Gate R (research.md):** Every claim cited? Citations spot-checked? Files complete? Purely descriptive? Gaps declared?
**Gate 1 (spec.md):** Testable ACs? No tech details? No open questions? Scope defined? No blocking constitution `[PENDING]`?
**Gate 2 (plan.md + contracts):** AC traceability? All errors defined? Schema complete? Risks with mitigations?
**Gate 3 (tasks.md):** Tests before implementation? Task size OK? No dependency cycles?
**Gate 4 (per task):** Tests pass? Signatures match? Scope adhered to?
**Gate 5 (final):** Traceability matrix complete? Zero drift? User story walkthrough done?
**Gate C (comprehension):** Linear walkthrough written and read? Debuggable by someone else? Every abstraction justified?

---

## Context Budget

| Utilization | State | Action |
|-------------|-------|--------|
| 0–40% | Loading | Continue |
| 40–60% | Productive | Continue — live here |
| 60–80% | Degrading | Finish step → write `progress.md` → fresh session |
| 80%+ | Unreliable | Stop now |

Review leverage: `research.md` (~200 lines) prevents thousands of wrong lines ·
`plan.md` (~200 lines) prevents hundreds · generated code prevents one at a time.

---

## Output Budgets

What the user reads, and how long it may be. Full formats in `output-formats.md`.

| Output | Budget |
|--------|--------|
| Gate verdict | 15 lines + 1 per failing check |
| Critic findings | 1 line per finding, 20 max |
| Traceability matrix | full file; **3-line** summary in the response |
| Drift report | 1 line per item, 25 max |
| Analyze report | 20 lines |
| Status report | 12 lines |
| Linear walkthrough | 60 lines / 8 steps |
| Phase completion summary | 6 lines |

Three rules: **write artifacts, show verdicts** · **verdict first, evidence second** ·
confidence is binary — `[CONFIRMED]` or `[VERIFY]`, never a percentage.

---

## When NOT to Use SDD

- Bug fix under 30 minutes
- Refactor with no behavior change
- Throwaway prototype
- Changing a single configuration value
