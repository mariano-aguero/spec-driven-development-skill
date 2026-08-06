# Enforcement and Interop

How the rules in this workflow stop being requests and start binding — mechanically, through
hooks and locks, and across tools, through `AGENTS.md`.

## Contents

- The enforcement ladder — prompt, check, block
- What can be mechanized, and what must not be
- Locking `contracts/` for real
- Hooks per phase — feedback loops that run without being asked
- Git worktrees for parallel tasks
- The `AGENTS.md` bridge — one source of truth, two audiences
- Enforcement theater — when mechanization makes things worse

---

## The Enforcement Ladder

Every rule in this skill sits at one of three levels. Moving a rule up a rung costs setup
effort once and removes a class of failure permanently.

| Rung | Mechanism | Fails when |
|------|-----------|-----------|
| **1 — Asked** | The prompt states the rule | The agent's attention decays, or the rule is 30k tokens back |
| **2 — Checked** | CI or a script detects the violation after the fact | The violation already landed; someone has to care about a red build |
| **3 — Blocked** | A hook prevents the action from completing | Rarely — but a bad rule now blocks legitimate work |

Most of this skill lives at rung 1 by necessity: "the spec must be testable" is a judgment,
not a predicate. But a surprising number of our rules are mechanical, and every one left at
rung 1 is a rule that quietly stops holding around task twelve.

**Promote a rule when it is objectively decidable and violated more than once.** Not before —
a hook written for a hypothetical failure is configuration nobody understands six months later.

---

## What Can Be Mechanized, and What Must Not

| Rule | Rung available | Mechanism |
|------|---------------|-----------|
| `contracts/` frozen after Gate 2 | **3 — Block** | PreToolUse hook rejecting writes to `contracts/` when the spec is Approved |
| No `[NEEDS CLARIFICATION]` past Gate 1 | **2 — Check** | CI grep (already in `quality-gates.md`) |
| Every AC has test coverage | **2 — Check** | CI AC-ID grep (already in `quality-gates.md`) |
| Research citations resolve | **2 — Check** | CI citation check (already in `quality-gates.md`) |
| Tests pass before commit | **3 — Block** | PostToolUse hook running the suite; failures re-injected into context |
| Banned patterns from `constitution.md` | **3 — Block** | Linter rule + PostToolUse hook |
| Task touches ≤3 files | **2 — Check** | Pre-commit diff stat |
| Commit per task | **2 — Check** | Commit-message convention check |
| **AC is independently testable** | 1 — Ask | Judgment. Gate 1, human |
| **Plan has no unnecessary abstraction** | 1 — Ask | Judgment. Gate 2, human or critic |
| **Research findings are true** | 1 — Ask | Citations resolve mechanically; whether the code *means* what the finding says does not |
| **The team understands the code** | 1 — Ask | Gate C. Unmechanizable by definition |

The bottom four are the reason human gates exist. A workflow that mechanizes everything
mechanizable and then treats the remainder as optional has kept the cheap half of the
verification and discarded the expensive half — which is the half that catches the errors
that matter.

---

## Locking `contracts/` for Real

The single highest-value promotion available. `contracts/` are declared frozen after Gate 2,
but a declaration in a markdown file does not stop an agent mid-task from "fixing" a response
shape — and Anti-Pattern 2 exists because that is exactly what happens.

**Rule:** once `spec.md` reads `Status: Approved`, writes to `specs/*/contracts/**` are
rejected unless the change is part of an explicit `/sdd:amend` run.

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

if grep -qE '^Status:[[:space:]]*Approved' "$spec"; then
  echo "BLOCKED: $path is a locked contract (spec Status: Approved)." >&2
  echo "Changing a contract during implementation is spec drift." >&2
  echo "To change it deliberately: run /sdd:amend, which updates spec -> plan -> contract" >&2
  echo "-> data model together and records the decision." >&2
  exit 2   # non-zero blocks the tool call and returns stderr to the agent
fi
```

The error message matters as much as the block. It states the cause, the rule's rationale,
and the sanctioned path forward — an agent that is only told "no" will try a different way
to do the same wrong thing.

Other tools: Cursor and Windsurf expose comparable pre-write hooks; where none exists, fall
back to rung 2 with a CI check that fails the PR when `contracts/` changed without a
corresponding `spec.md` version bump.

---

## Hooks Per Phase

Feedback loops that run without being asked. The pattern throughout: **run the check, inject
the failure back into context, let the agent fix it before continuing.**

| Event | Phase | Hook | Effect |
|-------|-------|------|--------|
| PreToolUse (Edit/Write) | 4 | Contract lock | Frozen contracts stay frozen |
| PreToolUse (Edit/Write) | 4 | Scope guard | Warn when editing a file outside the current task's declared scope |
| PostToolUse (Edit/Write) | 4 | Lint + typecheck | Violations return to the agent immediately, not at review |
| PostToolUse (Edit/Write) | 4 | Banned-pattern scan | `constitution.md` prohibitions enforced at write time |
| Stop | 4 | Uncommitted-work check | Catches "task finished" with nothing committed |
| Stop | any | Artifact staleness | Warn when code changed but `spec.md` did not, in the same session |

Two rules for writing them:

- **Fail loudly with a fix.** `"BLOCKED: no console.log in production code (constitution.md
  § Banned Patterns). Use the logger from src/lib/logger.ts."` beats `"lint failed"` by more
  than it looks — the second costs a round trip to rediscover.
- **Keep them fast.** A hook on every write is on the critical path of every edit. Typecheck
  the changed file, not the project.

Hooks are project configuration, not part of this skill. Nothing here ships them; adapt the
patterns to your toolchain.

---

## Git Worktrees for Parallel Tasks

Tasks marked `[P]` in `tasks.md` are declared not to share files. A worktree makes that
declaration structural rather than hopeful:

```bash
git worktree add ../feature-auth-task-003 -b task/003-user-repository
git worktree add ../feature-auth-task-004 -b task/004-email-service
# one agent session per worktree; merge each on completion
```

When to bother: three or more genuinely independent `[P]` tasks, or any parallel work that
runs tests — concurrent test runs in one checkout interfere through fixtures, ports, and
build caches.

When not to: two tasks, or tasks that finish in minutes. Worktree setup and merge overhead
exceeds the parallelism gain, and every extra checkout is another place for state to drift.

**The caveat that bites:** worktrees isolate the *filesystem*, not the *environment*. Agents
in separate worktrees still share the local database, Redis, Docker containers, and any
port-bound dev server. Parallel tasks that touch shared services need separate instances or
must not run concurrently — and a merge conflict between two `[P]` tasks is a defect in
`tasks.md`, not a merge problem. Fix the decomposition.

---

## The `AGENTS.md` Bridge

`AGENTS.md` is the closest thing to a universal agent instruction format — a single file at
the repository root, read natively by most major coding agents, and stewarded as an open
standard. `constitution.md` is this workflow's artifact and no tool reads it automatically.

They are not competitors. They are the same rules with different jobs:

| | `constitution.md` | `AGENTS.md` |
|---|---|---|
| Audience | Humans deciding, agents in SDD prompts | Any agent, on any task, automatically |
| Contains | Rules **and their rationale**, `[PENDING]` decisions, version history | The rules only, in imperative form |
| Length | As long as the reasoning needs | 60–150 lines |
| Lifecycle | Edited deliberately, versioned | **Derived** from the constitution |

### Derive, never fork

Generate `AGENTS.md` from `constitution.md`, in that direction only. The moment someone edits
`AGENTS.md` directly, you have two sources of truth for the same rules, and they will
disagree about something load-bearing within a month.

Mark the derivation in the file itself:

```markdown
<!-- Derived from constitution.md v1.4.0. Do not edit directly — edit the constitution
     and regenerate. -->
```

### What crosses over

| Constitution section | Into `AGENTS.md`? |
|---------------------|-------------------|
| Technology stack | Yes — versions and the "do not add dependencies" rule |
| Banned patterns | Yes — this is the highest-value content in the file |
| Naming conventions | Yes, compressed to the rules an agent applies while typing |
| Security constraints | Yes — the rules; not the CWE rationale |
| Build and test commands | Yes — and this is what `AGENTS.md` readers expect first |
| Architecture principles | Only the ones that constrain code placement |
| Rationale for any rule | **No** — it lives in the constitution |
| `[PENDING]` decisions | **No** — an undecided question is not an instruction |

### Write it yourself, or curate what was generated

There is a measured asymmetry worth knowing: human-authored agent instruction files improve
task success and materially reduce bugs, while LLM-generated ones have been found to *reduce*
success in a majority of tested settings and add steps per task.

The mechanism is not mysterious. Generated instruction files restate what a competent agent
already infers from the code, and that padding dilutes the few rules that actually deviate
from convention. **The value of the file is concentrated entirely in the surprising rules** —
the ones an agent would get wrong by defaulting to normal practice.

So: generate a draft from the constitution, then cut every line an agent would have followed
anyway. If a rule is what any competent developer would do by default, it is costing you
attention on the rules that aren't.

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

This catches the common failure — the constitution is amended and the derived file is
forgotten — without pretending to verify semantic equivalence.

---

## Enforcement Theater

Mechanization has its own failure mode, and it is worse than no mechanization because it
looks like rigor.

| Symptom | What is actually happening |
|---------|---------------------------|
| Hooks that warn but never block | Warnings scroll past; the rule is at rung 1 wearing rung 3's costume |
| A gate reduced to a CI job | The mechanical half passes, the judgment half stopped happening |
| Blocking hooks routinely bypassed | The rule is wrong, or too broad. Fix the rule — a bypassed hook trains everyone to bypass hooks |
| Hooks nobody can explain | Written for a hypothetical failure. Delete them |
| Green CI, unread specs | Rung 2 became the whole review |

The distinction to hold onto: **mechanical checks verify that rules were followed; they
never verify that the rules were right.** Gate R asks whether the research is true, Gate 2
whether the design is sound, Gate C whether anyone understands the result. No hook reaches
any of those, and a workflow that quietly redefines "passed the gates" as "CI is green" has
kept the ceremony and lost the point.
