# Enforcement and Interop

## Contents

- The enforcement ladder: ask, check, block
- What can be mechanized, and what must not
- The validator: `sdd-check.mjs`
- Locking `contracts/` for real
- Hooks per phase
- Git worktrees for parallel tasks
- The `AGENTS.md` bridge
- Enforcement theater

---

## The Enforcement Ladder

Every rule sits on one of three rungs. Moving a rule up costs setup once.

| Rung | Mechanism | Fails when |
|------|-----------|-----------|
| **1: Asked** | The prompt states the rule | Attention decays, or the rule is 30k tokens back |
| **2: Checked** | CI or a script detects the violation afterwards | The violation already landed |
| **3: Blocked** | A hook stops the action | A bad rule blocks legitimate work |

Judgments such as "the spec must be testable" stay at rung 1. A mechanical rule left at rung 1
stops holding a dozen tasks in.

**Promote a rule when it is objectively decidable and was violated more than once.**

The mutation-tool commands per ecosystem live in `quality-gates.md` under Gate 5.

---

## What Can Be Mechanized, and What Must Not

| Rule | Rung available | Mechanism |
|------|---------------|-----------|
| `contracts/` frozen after Gate 2 | **3: Block** | PreToolUse hook rejecting writes to `contracts/` when the spec is `Planned` or later |
| Spec and task structure: open questions, status, AC ids, `Proof:` lines, handoff, delta baseline, task refs and graph, `[P]` overlap | **2: Check** | [The Validator](#the-validator) |
| Every AC has test coverage | **2: Check** | CI AC-ID grep in `quality-gates.md` |
| Research citations resolve | **2: Check** | CI citation check in `quality-gates.md` |
| Tests pass before commit | **3: Block** | PostToolUse hook running the suite; failures re-injected into context |
| Banned patterns from `constitution.md` | **3: Block** | Linter rule + PostToolUse hook |
| Task touches ≤3 files | **2: Check** | Pre-commit diff stat |
| Commit per task | **2: Check** | Commit-message convention check |
| **AC is independently testable** | 1: Ask | Judgment. Gate 1, human |
| **Plan has no unnecessary abstraction** | 1: Ask | Judgment. Gate 2, human or critic |
| **Research findings are true** | 1: Ask | Citations resolve mechanically; their meaning does not |
| **The team understands the code** | 1: Ask | Gate C. Unmechanizable |

The bottom four are why human gates exist. They are never optional.

---

## The Validator

`scripts/sdd-check.mjs` ships with the skill (Node 20+, no dependencies). It parses each
feature under `specs/`, prints `file:line: rule-id: message` per finding, and exits 1 on
any error, 0 otherwise.

| Rule | Fails when |
|------|-----------|
| `status-valid` | `Status:` is missing or not a lifecycle value |
| `ac-unique` | An AC id appears twice in one spec |
| `ac-has-proof` | A `[MUST]` AC has no `**Proof:**` line (`[REMOVED]` ACs are skipped) |
| `no-open-questions` | `[NEEDS CLARIFICATION]` remains once Status is `Approved` or later |
| `handoff-complete` | `spec.md` lacks Goal, at least one Done-when item, Isolation or Stop if |
| `done-when-checkable` | A Done-when item is only a duration, such as "work on this for 4 hours" |
| `delta-baseline` | `Mode: Delta` has no `Baseline:` that resolves to an existing file |
| `task-refs-ac` | A task cites an AC missing from `spec.md`, or none (own or through its dependencies) |
| `task-graph` | `Depends on:` names a missing task or forms a cycle |
| `parallel-no-shared-files` | Two `[P]` tasks with no dependency path between them write the same file |
| `no-sentinel` | `.amend-in-progress` exists. Warning only, the exit code is unaffected |

Setup and Cleanup groups in `tasks.md` are exempt from `task-refs-ac`. What the validator
cannot decide stays at rung 1.

```bash
node skills/spec-driven-development/scripts/sdd-check.mjs            # every feature in ./specs
node skills/spec-driven-development/scripts/sdd-check.mjs specs/login # one feature
node skills/spec-driven-development/scripts/sdd-check.mjs --json      # findings as JSON for agents
```

**Pre-commit.** Add the same command to `.git/hooks/pre-commit` or your hook manager.

**CI.**

```yaml
- uses: actions/checkout@v4
- uses: actions/setup-node@v4
  with:
    node-version: 20
- run: node skills/spec-driven-development/scripts/sdd-check.mjs
```

**No Node available.** The agent runs the mechanical checks by hand from `quality-gates.md`
and reports each as `inconclusive`, never `pass`. The next phase waits until a person or a
Node environment runs the script.

---

## Locking `contracts/` for Real

A markdown declaration does not stop an agent from "fixing" a response shape mid-task
(Anti-Pattern 2). A hook does.

**Rule:** once `spec.md` reads `Status: Planned` or later (Status Lifecycle in
`artifact-templates.md`), writes to `specs/*/contracts/**` are rejected unless an explicit
`/sdd-change` run is in progress. At `Draft` and `Approved` the lock is off, because Phase 2
writes the contracts.

Claude Code implementation, in `.claude/settings.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "bash .claude/hooks/contract-lock.sh"
          }
        ]
      }
    ]
  }
}
```

```bash
#!/usr/bin/env bash
# .claude/hooks/contract-lock.sh
# Blocks edits to locked contracts. Reads the tool call from stdin as JSON.
set -euo pipefail

path=$(jq -r '.tool_input.file_path // empty')
[[ "$path" == *"/contracts/"* ]] || exit 0

feature_dir=$(dirname "$(dirname "$path")")
spec="$feature_dir/spec.md"
[[ -f "$spec" ]] || exit 0

# An amend run unlocks the contract deliberately.
[[ -f "$feature_dir/.amend-in-progress" ]] && exit 0

status=$(grep -m1 -E '^Status:' "$spec" || true)
if grep -qE '^Status:[[:space:]]*(Planned|In Progress|Validated|Archived)' "$spec"; then
  echo "BLOCKED: $path is a locked contract (spec ${status})." >&2
  echo "Changing a contract during implementation is spec drift." >&2
  echo "To change it deliberately: run /sdd-change, which updates spec -> plan -> contract" >&2
  echo "-> data model together and records the decision." >&2
  exit 2   # non-zero blocks the tool call and returns stderr to the agent
fi
```

The amend run creates `specs/<feature>/.amend-in-progress` and removes it when it ends or
aborts. Add `.amend-in-progress` to `.gitignore`.

The message names the sanctioned path, because an agent told only "no" tries another route.

Without a pre-write hook, fall back to rung 2: CI fails the PR when `contracts/` changed
without a `spec.md` version bump.

---

## Hooks Per Phase

Each hook injects its failure back into context so the agent fixes it before continuing.

| Event | Phase | Hook | Effect |
|-------|-------|------|--------|
| PreToolUse (Edit/Write) | 4 | Contract lock | Frozen contracts stay frozen |
| PreToolUse (Edit/Write) | 4 | Scope guard | Flags an edit outside the current task's declared scope |
| PostToolUse (Edit/Write) | 4 | Lint + typecheck | Violations return to the agent immediately |
| PostToolUse (Edit/Write) | 4 | Banned-pattern scan | `constitution.md` prohibitions enforced at write time |
| Stop | 4 | Uncommitted-work check | Catches "task finished" with nothing committed |
| Stop | any | Artifact staleness | Flags code changed while `spec.md` did not, in the same session |

Two rules for writing them:

- **Fail loudly with a fix.** `"BLOCKED: no console.log in production code (constitution.md
  § Banned Patterns). Use the logger from src/lib/logger.ts."` saves the round trip that
  `"lint failed"` costs.
- **Keep them fast.** Typecheck the changed file, not the project.

Hooks are project configuration. This skill does not ship them.

---

## Git Worktrees for Parallel Tasks

`[P]` tasks are declared not to share files. A worktree per task makes that structural:

```bash
git worktree add ../feature-auth-task-003 -b task/003-user-repository
git worktree add ../feature-auth-task-004 -b task/004-email-service
# one agent session per worktree; merge each on completion
```

Use them for three or more independent `[P]` tasks, or parallel work that runs tests. Skip
them for two tasks or tasks that finish in minutes.

Worktrees isolate the filesystem only. Tasks touching the local database, Docker, or a
port-bound server need separate instances or must run one at a time. A merge conflict between two `[P]` tasks is a
defect in `tasks.md`. Fix the decomposition.

---

## The `AGENTS.md` Bridge

Most coding agents read a root `AGENTS.md` natively. No tool reads `constitution.md`. They
hold the same rules for different jobs:

| | `constitution.md` | `AGENTS.md` |
|---|---|---|
| Audience | Humans deciding, agents in SDD prompts | Any agent, on any task, automatically |
| Contains | Rules **and their rationale**, `[PENDING]` decisions, version history | The rules only, in imperative form |
| Length | As long as the reasoning needs | 60 to 150 lines |
| Lifecycle | Edited deliberately, versioned | **Derived** from the constitution |

### Derive, never fork

Generate `AGENTS.md` from `constitution.md`, in that direction only. Mark the derivation:

```markdown
<!-- Derived from constitution.md v1.4.0. Do not edit directly. Edit the constitution
     and regenerate. -->
```

### What crosses over

| Constitution section | Into `AGENTS.md`? |
|---------------------|-------------------|
| Technology stack | Yes: versions and the "do not add dependencies" rule |
| Banned patterns | Yes, the highest-value content in the file |
| Naming conventions | Yes, compressed |
| Security constraints | Yes, the rules without the CWE rationale |
| Build and test commands | Yes, the first thing `AGENTS.md` readers look for |
| Architecture principles | Only those constraining code placement |
| Rationale for any rule | **No**, it lives in the constitution |
| `[PENDING]` decisions | **No**, an undecided question is not an instruction |

### Write it yourself, or curate what was generated

Generated instruction files have lowered agent success in most tested settings: they restate
what the code already shows and dilute the surprising rules, which are the file's value.
Generate a draft, then cut every line a competent developer would follow by default.

### Keeping them in sync

Add to CI:

```yaml
- name: AGENTS.md derived from current constitution
  run: |
    v=$(grep -oP '(?<=^Version: ).*' constitution.md | head -1)
    grep -q "Derived from constitution.md v$v" AGENTS.md || {
      echo "AGENTS.md is stale: constitution.md is at v$v"
      echo "Regenerate it and commit the result."
      exit 1
    }
```

It catches a stale `AGENTS.md`, not semantic drift.

---

## Enforcement Theater

Mechanization can fail in a way that looks like rigor.

| Symptom | What is actually happening |
|---------|---------------------------|
| Hooks that warn and never block | Theater. Warnings scroll past and the rule is back at rung 1. Make it block or delete it |
| A CI job named after a gate | Never do this. The mechanical half passes and the judgment half stops happening |
| Blocking hooks routinely bypassed | The rule is wrong or too broad. Fix it |
| Hooks nobody can explain | Delete them |
| Green CI, unread specs | Rung 2 became the whole review |

Mechanical checks verify that rules were followed, never that the rules were right. No hook
answers Gate R, Gate 2, or Gate C. "CI is green" never means "passed the gates".
