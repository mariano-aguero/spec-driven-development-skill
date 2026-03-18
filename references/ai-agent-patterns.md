# AI Agent Patterns

Multi-agent orchestration, context management, and AI interaction patterns for SDD.

---

## Context Management

### The Single-Task Context Rule

Each task in tasks.md gets its own AI context window. Never carry context across tasks.

**Why:** AI sessions accumulate assumptions. By TASK-008, the agent "remembers" the
(possibly wrong) approach from TASK-003 and applies it without checking the contract.

**How:**
```
New conversation → paste task description → paste relevant spec sections →
paste relevant contract → implement → verify → commit → close conversation
```

**What to include per task:**
1. The task description from tasks.md
2. The specific ACs it satisfies (from spec.md)
3. The relevant contract section (from contracts/)
4. The relevant plan section (from plan.md)
5. The relevant entities (from data-model.md)
6. Project conventions (from CLAUDE.md or equivalent)

**What NOT to include:**
- The entire spec.md (too much noise, dilutes focus)
- Output from other tasks ("in the last task you created...")
- Architectural summaries not related to this task

---

## Subagent Review Pattern

Use separate critic subagents at each phase gate. Critic agents find problems the
generating agent can't see (it anchors to its own output).

### Phase 1 Critic Agents

Run these after generating spec.md, before Gate 1:

```
# QA Critic — finds untestable criteria
You are a QA engineer reviewing a spec for testability.
Read: specs/[feature]/spec.md
Find: acceptance criteria that cannot be expressed as an automated test.
Return only the problematic ACs and why they're untestable.
Do not suggest fixes. List problems only.
```

```
# Security Critic — finds missing security requirements
You are a security engineer reviewing a spec.
Read: specs/[feature]/spec.md
Find: missing authentication, authorization, input validation, or data exposure risks.
Return only gaps. Do not approve. Do not compliment.
```

```
# Product Critic — finds scope gaps
You are a product manager reviewing a spec.
Read: specs/[feature]/spec.md
Find: user stories without full AC coverage, missing edge cases, implicit assumptions.
Return only gaps. Do not rewrite the spec.
```

### Phase 2 Critic Agents

Run these after generating plan.md + contracts/, before Gate 2:

```
# Architecture Critic — finds over-engineering
You are a senior engineer who prefers simple solutions.
Read: specs/[feature]/plan.md
Find: abstractions that could be replaced with direct framework usage,
unnecessary indirection, premature generalization.
Return only architectural concerns. Be specific.
```

```
# Contract Critic — finds incomplete contracts
You are a frontend developer who will consume these APIs.
Read: specs/[feature]/contracts/
Find: missing error codes, ambiguous response shapes, missing edge cases.
Return only incomplete or ambiguous contract items.
```

```
# Data Model Critic — finds schema issues
You are a DBA reviewing a schema for correctness.
Read: specs/[feature]/data-model.md
Find: missing indexes, implicit constraints that should be explicit,
N+1 query risks, denormalization that will cause consistency issues.
Return only specific schema problems.
```

---

## Tool: Individual Task Retrieval

Problem: If you show the AI agent the full tasks.md, it may try to implement multiple
tasks at once, or reference future tasks that haven't been defined in context.

Solution: Retrieve one task at a time:

```bash
# Extract a single task by ID from tasks.md
extract-task() {
  local task_id=$1
  local tasks_file=$2
  awk "/\*\*${task_id}\*\*/,/^- \[ \] \*\*TASK-/{if(/^- \[ \] \*\*TASK-/ && !/\*\*${task_id}\*\*/) exit; print}" "$tasks_file"
}
```

Or via Claude Code custom command:
```
/sdd:next-task specs/[feature]/tasks.md
```
Returns the next uncompleted task (by checking `- [ ]` vs `- [x]`).

---

## Parallel Task Execution

Tasks marked `[P]` in tasks.md can run in parallel AI sessions:

### Option A: Multiple Terminal Sessions
```
Terminal 1: Implement TASK-003 [P] — UserRepository.create()
Terminal 2: Implement TASK-004 [P] — EmailService.send()
```

Each session has its own context. They commit independently.

### Option B: Agent Dispatch
If using an orchestrator that supports multi-agent dispatch:
```
Dispatch TASK-003 to Agent A:
  Context: [task + relevant spec sections]
  Output: commit hash

Dispatch TASK-004 to Agent B:
  Context: [task + relevant spec sections]
  Output: commit hash

Wait for both. Verify no conflicts.
```

### Parallel Task Rules
- Parallelizable tasks MUST not write to the same files
- Parallelizable tasks MUST not depend on each other's output
- Merge conflicts from parallel tasks = a problem with the task decomposition (fix tasks.md)

---

## AI Tool Selection Per Phase

Use the capability profile that matches each phase. Specific model names change with every
release — the profiles below remain stable:

| Phase | Capability Profile Needed | IDE Integration? |
|-------|--------------------------|-----------------|
| Constitution (Phase 0) | Strong instruction-following, broad domain knowledge | No |
| Specify (Phase 1) | Strong intent-understanding, good at ambiguity detection | No |
| Plan (Phase 2) | Large context, technical architecture reasoning | No |
| Tasks (Phase 3) | Structured output, dependency reasoning | No |
| Implement (Phase 4) | File access, code completion, test execution, inline edits | **Yes** (Claude Code, Cursor, Copilot, Windsurf) |
| Validate (Phase 5) | Multi-file comparison, compliance checking | Optional |

**Rule of thumb:** Use your most capable model for Phases 0–2 (specs determine everything).
Use IDE-native tools for Phase 4 (file access and test running matter more than raw intelligence).

---

## Handling AI Resistance

Sometimes AI agents resist following the spec:
- "I think a better approach would be..."
- "The contract could be improved by..."
- "Actually, this pattern is more maintainable..."

This is spec drift initiating from the AI side.

**Response pattern:**
```
Stop. The specification is not a suggestion. The contract is not negotiable during Phase 4.
Your role in this task is to implement [task title] as specified.
If you believe the spec or contract is incorrect, flag it and wait for human review.
Do not unilaterally change the approach.
```

If the AI suggestion is genuinely valuable:
1. Note it in `decision_log.md`
2. Finish Phase 4 as specified
3. Create a follow-up issue for the improvement
4. Process it through Phase 1–3 before implementing

---

## Spec Regeneration Pattern

When requirements change mid-development (common in fast-moving projects):

```
CHANGE REQUEST: [description of what changed]

Current phase: Phase 4, TASK-006 complete

Action required:
1. Stop Phase 4 at current task
2. Update spec.md: [specific ACs that change]
3. Assess plan.md impact: [which components are affected]
4. Update contracts/ if signatures change
5. Regenerate tasks.md from the affected task forward
6. Resume Phase 4 from the first affected task
```

Do not: Continue implementing with the new requirement in mind while the spec is stale.
Do not: "Adjust slightly" without updating the spec chain.

This systematic approach to changes is what makes SDD resilient to pivot requests.

---

## Research Phase with Parallel Subagents

For complex features where the right approach is unclear, run a research phase *before*
Phase 1 to gather information via parallel subagents. This produces a richer spec.

**When to use:**
- Large refactors or migrations with external dependencies
- Features requiring knowledge of unfamiliar libraries or patterns
- Unclear architecture (multiple valid approaches worth evaluating)

**Prompt:**
```
Spawn parallel subagents to research the following aspects of [feature]:

Agent 1: Research [aspect A — e.g., "existing authentication patterns in this codebase"]
Agent 2: Research [aspect B — e.g., "CRDT patterns for real-time sync"]
Agent 3: Research [aspect C — e.g., "storage layer options and tradeoffs"]
Agent 4: Research [aspect D — e.g., "existing similar features to reuse"]

Each agent: read relevant code, search for patterns, summarize findings in 300 words.
After all agents complete, consolidate into a research.md file at specs/[feature]/research.md.
```

**Then use the research as input to Phase 1:**
```
Using specs/[feature]/research.md as context, generate a spec.md for [feature].
The spec should reflect the architectural findings and avoid approaches ruled out by research.
```

This pattern produced 14 tasks completed in ~45 minutes in real-world usage, with parallel
research uncovering patterns not discoverable through sequential exploration.

---

## Spec as Recovery Point

When an implementation session fails (context overflow, cascading errors, wrong direction):

1. **Do not try to fix in the same session** — accumulated context is the problem
2. Pin the current spec files: `git stash` or note the commit SHA
3. Start a fresh session with only the spec artifacts as context
4. Re-implement from the failing task using a clean context window

The spec is not just a planning artifact — it is the recovery checkpoint. A session that
goes wrong with a complete spec loses at most one task. A session that goes wrong without
a spec loses everything and must restart from scratch.

This is the most practical argument for writing specs even for experienced developers who
feel they don't need them: you are buying recovery insurance, not just documentation.
