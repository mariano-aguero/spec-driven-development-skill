# Quick Reference — Spec-Driven Development

One-page cheat sheet. For details, see referenced files.

---

## Phase 0 + 5-Phase Workflow

```
[CONSTITUTION] ── (once per project)
       ↓
[SPECIFY] → [CLARIFY] → [PLAN] → [TASKS] → [IMPLEMENT] → [VALIDATE]
 spec.md      resolve     plan.md   tasks.md   per task     traceability
              ambiguities data-model commit     commit       drift report
              edge cases  contracts  after each after each
              → spec.md
```

---

## Directory Layout

```
constitution.md      # Project-level: immutable principles (NEVER skip)

specs/[feature]/
├── spec.md          # WHAT + WHY (no tech details, MoSCoW priorities)
├── plan.md          # HOW (architecture, components)
├── data-model.md    # Entities, fields, constraints, indexes
├── contracts/       # API shapes, error codes (LOCKED after Phase 2 approval)
├── tasks.md         # Ordered, sized, dependency-mapped tasks
├── research.md      # Optional: alternatives considered
└── decision_log.md  # Optional: key decisions and rationale
```

---

## Phase Commands

| Command | Phase | Reads | Creates |
|---------|-------|-------|---------|
| `/sdd:init` | 0 | project context | `constitution.md` |
| `/sdd:specify [description]` | 1 | user input | `spec.md` |
| `/sdd:clarify` | 1 (sub-step) | `spec.md` | delta (new ACs, resolved questions) |
| `/sdd:plan` | 2 | `spec.md` + `constitution.md` + `research.md` (if present) | `plan.md`, `data-model.md`, `contracts/` |
| `/sdd:tasks` | 3 | `plan.md`, `contracts/` | `tasks.md` |
| `/sdd:next-task` | 4 | `tasks.md` | — (extracts single task) |
| `/sdd:analyze` | any | `spec.md` | inconsistency report |
| `/sdd:amend [what changed]` | any | all spec files | updated spec chain |
| `/sdd:validate` | 5 | all spec files + code | drift report |

---

## Hard Rules

| Rule | Why |
|------|-----|
| Constitution before any spec | Without it, every feature reinvents the wheel |
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
**Gate 1 (spec.md):** Testable ACs? No tech details? No open questions? Scope defined? No blocking constitution `[PENDING]`?
**Gate 2 (plan.md + contracts):** AC traceability? All errors defined? Schema complete? Risks with mitigations?
**Gate 3 (tasks.md):** Tests before implementation? Task size OK? No dependency cycles?
**Gate 4 (per task):** Tests pass? Signatures match? Scope adhered to?
**Gate 5 (final):** Traceability matrix complete? Zero drift? User story walkthrough done?

---

## When NOT to Use SDD

- Bug fix under 30 minutes
- Refactor with no behavior change
- Throwaway prototype
- Changing a single configuration value
