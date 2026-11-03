# AI Agent Patterns

Multi-agent orchestration, context management, and AI interaction patterns for SDD.

## Contents

- Context management — the single-task context rule
- Context engineering — artifacts as compaction checkpoints, the 40–60% band, progressive
  disclosure, subagent noise isolation, attention decay, failure signatures
- Subagent review pattern — critic agents for Gate R and Gates 1–2
- Tool: individual task retrieval
- Parallel task execution
- AI tool selection per phase (capability profiles)
- Handling AI resistance
- Spec regeneration pattern (`/sdd:amend`)
- Research phase with parallel subagents — the leverage model and dispatch shape
- Spec as recovery point

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
3. The Boundaries section (from spec.md) — sets explicit do/ask/never rules for this task
4. The relevant contract section (from contracts/)
5. The relevant plan section (from plan.md)
6. The relevant entities (from data-model.md)
7. Project conventions (from CLAUDE.md or equivalent)

**What NOT to include:**

- The entire spec.md (too much noise, dilutes focus)
- Output from other tasks ("in the last task you created...")
- Architectural summaries not related to this task

---

## Context Engineering

The single-task rule above is one instance of a general principle. An agent is a stateless
function — output quality is bounded entirely by input quality. Every phase, gate, and
artifact in SDD is, mechanically, a decision about what enters that input.

### Artifacts Are Compaction Checkpoints

This is the part that is easy to miss: the SDD artifacts are not primarily documentation.
They are *compressed context*, and documentation is a side effect.

| Phase | Raw work performed | Compacted artifact | What survives |
|-------|-------------------|--------------------|----------------|
| 0.5 Research | Read 40 files, dozens of greps | `research.md` (~200 lines) | File map, information flow, cited findings, constraints |
| 2 Plan | Evaluate architectures and tradeoffs | `plan.md` (~200 lines) | Chosen components, AC coverage, risks |
| 3 Tasks | Sequence and size the work | `tasks.md` | Ordered atomic units with dependencies |
| 4 Implement | Write and debug code | Commits + `progress.md` | Working code, state needed to resume |

Each step is roughly a 95% reduction that preserves every decision-critical fact. The next
phase starts from the artifact and **never** re-reads the raw material.

Two consequences worth internalizing:

- **Artifact length is a quality signal.** A 900-line spec has stopped compacting and
  started hoarding. If an artifact keeps growing, the phase boundary is not doing its job.
- **A phase that reads the previous phase's raw material has broken the chain.** Planning
  while re-grepping the codebase means the research doc was not trusted — fix the research,
  do not work around it.

### Compact on Purpose, Not on Overflow

Target **40–60% context utilization** during active work.

Automatic compaction triggered by exhaustion is the worst case: the summarizer decides for
you, under pressure, which details to discard — and it does not know which line of the
contract mattered. Intentional compaction happens at a boundary you chose, with an artifact
you reviewed.

| Utilization | State | Action |
|-------------|-------|--------|
| 0–40% | Loading | Continue |
| 40–60% | Productive | Continue |
| 60–80% | Degrading — instructions from early in the session lose weight | Finish current step, hand over |
| 80%+ | Unreliable | Stop and write `progress.md` |

Exact percentages vary by model and window size. The rule that transfers: **reset at a
boundary you picked, before quality degrades — not when the tool forces you to.**

### Progressive Disclosure

Do not load what the current step does not need. Reference by path, load on demand.

| Load always | Load per task | Load on demand only |
|-------------|--------------|---------------------|
| `constitution.md` (compact by design) | The task's ACs, its contract, its plan section | `research.md` (already distilled into plan.md) |
| The current task from `tasks.md` | Relevant entities from `data-model.md` | Other features' specs |
| | | `decision_log.md`, archived specs |

`research.md` is deliberately in the third column. Once Phase 2 has consumed it, the plan
carries what mattered. Re-loading research during implementation reintroduces exactly the
noise the phase existed to remove — pull specific sections only when a task's design intent
is genuinely unclear.

### Isolate the Noise in Subagents

Any operation whose *output volume* far exceeds its *information value* belongs in a
subagent: repository-wide greps, directory walks, full-file reads, log scans, dependency
audits.

The subagent burns its own context on the mess and returns a bounded summary. The main
context receives the conclusion, never the transcript. This is why Phase 0.5 dispatches four
subagents rather than searching directly — and it is the same mechanism that makes critic
agents effective (see below).

### Attention Decay in Long Sessions

Instructions given early in a session lose influence as the window fills. Two mitigations:

- **Re-inject the constraints that matter** at each step, rather than stating them once at
  the top. The per-task prompt in `prompt-patterns.md` repeats `constitution.md` and the
  Boundaries section for exactly this reason — it is not redundancy, it is refreshing
  attention.
- **Keep the goal in the working set.** For long tasks, re-read the task's own line from
  `tasks.md` at each step. "Forgot the actual task" is the most common failure of long
  agent sessions, and it is cheap to prevent.

### Failure Signatures

| Symptom | Diagnosis | Fix |
|---------|-----------|-----|
| Agent contradicts a decision made earlier in the same session | Attention decay | Re-inject the decision; consider a reset |
| Agent re-reads files already summarized in an artifact | Broken compaction chain | Trust the artifact or fix it — do not allow both |
| Agent asks a question already answered in the spec | Context dilution — signal buried in noise | Trim the loaded context to the current task |
| Auto-compaction fires mid-task | Reactive compaction | Hand over at 60–80% next time |
| Quality drops sharply late in a session | Utilization past the productive band | `progress.md` + fresh session |

---

## Subagent Review Pattern

Use separate critic subagents at each phase gate. Critic agents find problems the
generating agent can't see (it anchors to its own output).

**Every finding carries a confidence marker**, and there are only two:

| Marker | Use when |
|--------|----------|
| `[CONFIRMED]` | The critic can cite the exact artifact location or code line proving the issue |
| `[VERIFY]` | The issue is inferred, or depends on information the critic could not check |

No third value, no percentages. A finding the critic cannot locate is `[VERIFY]`, and the
human triages those first. See `output-formats.md → Critic Findings` for how they are
presented.

### Phase 0.5 Critic Agent

Run after generating research.md, before Gate R. Unlike later critics, this one must open
files — it is verifying claims against reality, not reasoning about a document.

```
# Research Verifier — finds unsupported or fabricated findings
You are auditing a research document you did not write.
Read: specs/[feature]/research.md

For every `file:line` citation, open that location and verify the line exists and the code
there supports the claim. Also find: involved files missing from the document, sentences
describing what the system SHOULD do rather than what it DOES, and claims with no citation.

Return issues in this format:
[ISSUE] [F-N or Section] Research [Type: BadCitation/Unsupported/Incomplete/Missing/Prescriptive] [CONFIRMED|VERIFY] [Description]

Do not rewrite the document. Do not approve or compliment.
```

### Phase 1 Critic Agents

Run these after generating spec.md, before Gate 1:

Return issues in this format:
`[ISSUE] [AC-N or Section] [Role] [Type: Untestable/Ambiguous/Missing/Risk/Schema/UX-Gap] [Description]`

```
# QA Critic — finds untestable criteria
You are a QA engineer reviewing a spec for testability.
Read: specs/[feature]/spec.md
Find: acceptance criteria that cannot be expressed as an automated test.

Return issues in this format:
[ISSUE] [AC-N] QA [Type: Untestable/Ambiguous] [CONFIRMED|VERIFY] [Description]

Do not suggest fixes. Do not approve or compliment.
```

```
# Security Critic — finds missing security requirements
You are a security engineer reviewing a spec.
Read: specs/[feature]/spec.md
Find: missing authentication, authorization, input validation, or data exposure risks.

Return issues in this format:
[ISSUE] [AC-N or Section] Security [Type: Missing/Risk] [CONFIRMED|VERIFY] [Description]

Do not approve or compliment — issues only.
```

```
# Product Critic — finds scope gaps
You are a product manager reviewing a spec.
Read: specs/[feature]/spec.md
Find: user stories without full AC coverage, missing edge cases, implicit assumptions.

Return issues in this format:
[ISSUE] [AC-N or Section] Product [Type: Missing/Ambiguous/UX-Gap] [CONFIRMED|VERIFY] [Description]

Do not rewrite the spec — issues only.
```

### Phase 2 Critic Agents

Run these after generating plan.md + contracts/, before Gate 2:

```
# Constitution Critic — finds plan violations
You are a code reviewer enforcing project standards.
Read: specs/[feature]/plan.md, specs/[feature]/contracts/, and constitution.md

Find: components that use banned patterns, technology choices that violate the locked
stack, naming conventions that conflict with constitution rules, security constraints
the plan or contracts fail to address, endpoints that expose data prohibited by constitution.

Return issues in this format:
[ISSUE] [Section] Constitution [Type: Banned/StackViolation/Naming/Security] [CONFIRMED|VERIFY] [Description]

Do not approve — violations only.
```

```
# Architecture Critic — finds over-engineering
You are a senior engineer who prefers simple solutions.
Read: specs/[feature]/plan.md
Find: abstractions that could be replaced with direct framework usage,
unnecessary indirection, premature generalization.

Return issues in this format:
[ISSUE] [Section] Architecture [Type: Over-engineering/Missing/Risk] [CONFIRMED|VERIFY] [Description]

Be specific — issues only.
```

```
# Contract Critic — finds incomplete contracts
You are a frontend developer who will consume these APIs.
Read: specs/[feature]/contracts/
Find: missing error codes, ambiguous response shapes, missing edge cases.

Return issues in this format:
[ISSUE] [endpoint or Section] Contract [Type: Missing/Ambiguous/Schema] [CONFIRMED|VERIFY] [Description]

Do not approve — incomplete or ambiguous items only.
```

```
# Data Model Critic — finds schema issues
You are a DBA reviewing a schema for correctness.
Read: specs/[feature]/data-model.md
Find: missing indexes, implicit constraints that should be explicit,
N+1 query risks, denormalization that will cause consistency issues.

Return issues in this format:
[ISSUE] [EntityName or Section] DB [Type: Schema/Missing/Risk] [CONFIRMED|VERIFY] [Description]

Specific schema problems only.
```

```
# Risks Critic — finds unmitigated risks
You are a tech lead reviewing a plan for operational and delivery risks.
Read: specs/[feature]/plan.md

Find: risks listed without concrete mitigations, high-impact items with no fallback,
external dependencies with no failure handling, assumptions that could invalidate the plan.

Return issues in this format:
[ISSUE] [Section] Risks [Type: Unmitigated/Assumption/Dependency/Fallback] [CONFIRMED|VERIFY] [Description]

Risks without mitigations only — do not approve or summarize.
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
| Research (Phase 0.5) | Large context, file access, subagent dispatch, code comprehension | **Yes** |
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

When requirements change mid-development (common in fast-moving projects), use `/sdd:amend`:

```
CHANGE REQUEST: [description of what changed]

Current phase: Phase 4, TASK-006 complete

Action required:
1. Stop Phase 4 at current task
2. Run /sdd:amend to update spec.md: [specific ACs that change]
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

Phase 0.5 is the canonical application of every pattern in this file: parallel subagents
absorb the noise, a compacted artifact crosses the boundary, and a separate verifier audits
the result.

Full instructions live in `workflow-phases.md → Phase 0.5`; prompts in
`prompt-patterns.md → Phase 0.5`. What matters here is *why* the orchestration is shaped
this way.

### The Leverage Model

Review effort is not evenly rewarded across phases:

| What you review | Length | Errors it prevents downstream |
|-----------------|--------|-------------------------------|
| `research.md` | ~200 lines | Thousands of wrong lines — the whole feature aimed at the wrong subsystem |
| `plan.md` | ~200 lines | Hundreds of wrong lines — wrong components, wrong sequencing |
| Generated code | ~2000 lines | One wrong line at a time |

Reviewing ~400 lines of research and plan dominates reviewing 2000 lines of code, both in
errors caught and in attention spent. This is the strongest available argument for spending
human time at the front of the workflow rather than the end — and the reason Gate R exists
even though nothing is built yet.

### Dispatch Shape

Four axes cover most features. Each subagent returns ≤300 words; their raw searches never
enter the main context.

```
Dispatch four parallel subagents to research [feature area]. Each returns at most 300 words.

Agent 1 (Files):       every file involved and what each is responsible for
Agent 2 (Flow):        information flow end to end — entry → transform → persist → respond
Agent 3 (Prior art):   features in this repo that already solve a similar problem
Agent 4 (Constraints): conventions, base classes, and middleware any change here must respect

Rules for all agents:
- Cite `file:line` for every claim. Uncited claims are dropped at consolidation.
- Report what exists. Do not propose designs, requirements, or improvements.
- Report what you could not determine rather than inferring it.

Consolidate into specs/[feature]/research.md using the research.md template.
Mark any disagreement between agents as [CONFLICT] instead of resolving it silently.
```

Add a fifth axis when the feature depends on an unfamiliar external library — its actual
version's API surface, not the agent's recollection of it.

### Why a Separate Verifier

The agent that wrote the research cannot audit it; it anchors to its own output. A verifier
in a clean context opens each citation and checks that the line exists and says what the
document claims. Fabricated-but-plausible citations are the characteristic failure of this
phase, and they are invisible to the author. See the Research Verification Prompt in
`prompt-patterns.md` and Anti-Pattern 15.

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
