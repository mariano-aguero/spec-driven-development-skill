# Workflow Phases — Detailed Reference

Step-by-step execution guide for each SDD phase, including decision points and common traps.

---

## Phase 0 — Constitution

### Goal
Produce a `constitution.md` at the project root that encodes immutable constraints for
all future feature work. Every AI prompt during implementation will include it. Every
gate check will verify compliance with it. It is written once and updated only when
a fundamental project decision changes.

### Step-by-Step

**Step 0.1 — Project intake**
Before generating the constitution, gather:
- Tech stack: languages, frameworks, databases, auth mechanism
- Team conventions: naming, file structure, testing approach
- Compliance or security requirements: OWASP, GDPR, PCI-DSS, etc.
- Known anti-patterns to avoid (from past projects or code reviews)
- Any existing CLAUDE.md, .cursorrules, or AGENTS.md files to incorporate

**Step 0.2 — Generate constitution.md**
Use the prompts in `references/prompt-patterns.md → Phase 0 → Initial Constitution Generation Prompt`.
Place output at the project root: `constitution.md`.

**Step 0.3 — Security section review**
Pay special attention to the security constraints section:
- Every rule must be specific and verifiable (not "handle errors securely")
- At minimum, cover: auth requirements, input validation, secret handling, logging rules, CORS
- For security-sensitive domains, run the Security Constraints Prompt to add CWE-targeted rules

**Step 0.4 — Resolve PENDING items**
All `[PENDING]` items must be resolved before writing the first feature spec.
A pending tech decision (e.g., "do we use Redis for sessions?") will cause the first
spec to have `[NEEDS CLARIFICATION]` items that could have been decided here.

**Step 0.5 — Human review (Gate 0)**
The constitution requires the same human approval gate as any other artifact.
Review using the Gate 0 checklist in `references/quality-gates.md`.
Common review feedback:
- "This banned pattern is too vague" → make it a specific code example
- "We haven't decided on X yet" → add as `[PENDING]` with a target date
- "Security rule Y is missing" → add it now, not in the first feature spec

**Step 0.6 — Commit**
```bash
git add constitution.md
git commit -m "chore: add project constitution"
```

### When to Update
- New major dependency added to the project
- Security policy change (new compliance requirement, audit finding)
- Architecture decision that invalidates an existing principle
- Always: bump the Version field and note what changed with a date

### Time Distribution
Constitution takes 30–60 minutes for a new project. Skipping it means paying the same
cost (resolving conflicting decisions) repeatedly across every feature spec.

---

## Phase 1 — Specify

### Goal
Produce a `spec.md` that a developer (or AI agent) with no prior context can read and
understand exactly what to build — without needing to ask clarifying questions.

### Step-by-Step

**Step 1.1 — Feature intake**
Ask the user (or gather from issue/PRD):
- What problem does this solve?
- Who uses it?
- What does success look like?
- What are hard constraints (performance, security, compatibility)?

**Step 1.2 — Constitution [PENDING] check**
Before generating spec.md, scan `constitution.md` for any `[PENDING]` items that
intersect with this feature's domain. A [PENDING] item is blocking when the spec
would need to make the same undecided choice.

Common blocking cases:
- Feature requires authentication → `[PENDING] auth: cookie vs. JWT` is blocking
- Feature writes to the database → `[PENDING] ORM: Drizzle vs. raw SQL` is blocking
- Feature exposes a public API → `[PENDING] rate limiting strategy` is blocking

**Action:** List every [PENDING] item in constitution.md that touches the feature's scope.
For each blocking item: resolve it in constitution.md first, then proceed.
For non-intersecting [PENDING] items: proceed — they don't affect this spec.

**Step 1.3 — Surface AI assumptions**
Run the Assumptions Surface Prompt from
`references/prompt-patterns.md → Phase 1 → Assumptions Surface Prompt`.

Use the full context from Step 1.1. The AI will list every implicit assumption it's
making about: user roles, permissions, error behavior, system integrations, and scope
boundaries. Review and correct these *before* the spec is generated.

Doing this after intake (not before) produces targeted corrections — the AI's assumptions
about a "B2B SaaS with SSO" are more specific than assumptions about "user auth".

**Step 1.4 — Generate spec.md**
Use the prompt in `references/prompt-patterns.md → Phase 1 → Initial Specification Prompt`.
Include corrected assumptions from Step 1.3 in the prompt.
Place output at `specs/[feature-branch-name]/spec.md`.

**Step 1.5 — Clarify**
Run the Clarify Phase Prompt from `references/prompt-patterns.md → Phase 1 → Clarify Phase Prompt`.
Present the output to the human for review. After the human approves answers, run the
Post-Clarify Spec Update Prompt (`references/prompt-patterns.md → Post-Clarify Spec Update Prompt`)
to apply the approved resolutions to spec.md.

All `[NEEDS CLARIFICATION]` items must be `[RESOLVED]` before proceeding. Do not assume. Do not defer.

**Step 1.6 — Human review (Gate 1)**
The human must read and approve the updated `spec.md`. Use the Gate 1 checklist in
`references/quality-gates.md`. This gate is non-negotiable.
Common review feedback:
- "AC is too vague" → rewrite as Given/When/Then
- "This is actually out of scope" → move to out-of-scope section
- "Missing error case" → add AC for the error case

**Step 1.7 — Branch and commit**
```bash
git checkout -b feature/[feature-name]
git add specs/[feature-name]/spec.md
git commit -m "spec: [feature name] requirements"
```

### Time Distribution
Expect to spend 30–60% of total feature time on Phases 1–2. This is correct.
Reduced execution time more than compensates.

---

## Phase 2 — Plan

### Goal
Translate `spec.md` into a concrete technical blueprint that AI can implement without
inventing solutions. Every design decision must be explicit.

### Step-by-Step

**Step 2.1 — Generate plan.md**
Use the Technical Plan Generation Prompt from `references/prompt-patterns.md`.
Include your stack constraints and existing conventions. If `specs/[feature]/research.md`
exists (pre-generated via parallel subagents before Phase 1), include it as additional
context — `/sdd:plan` reads it automatically if present. The plan must include a
Risks section — identify implementation risks and a mitigation for every High-impact
risk before Phase 3 begins (see template in `references/artifact-templates.md`).

**Step 2.2 — Generate data-model.md**
If the feature touches the database:
- List every entity the feature creates, reads, updates, or deletes
- Define all fields with types and constraints
- Define foreign keys and relationships
- Identify required indexes (think about query patterns)

**Step 2.3 — Generate contracts/**
For each API endpoint, event, or public interface:
- One file per domain (e.g., `contracts/user-api.md`, `contracts/events.md`)
- Define exact request/response shapes
- Define all error codes and when they're returned
- Reference which ACs each endpoint satisfies

**Step 2.4 — Trace to spec**
Every AC in `spec.md` must appear in at least one:
- Component in `plan.md`
- Contract in `contracts/`

If an AC has no technical implementation path, the plan is incomplete.

**Step 2.5 — Run critic agents (optional, recommended for complex features)**
Before the human review, run the Phase 2 critic agents from
`references/ai-agent-patterns.md → Phase 2 Critic Agents`:
Constitution Critic, Architecture Critic, Contract Critic, Data Model Critic, Risks Critic.
Aggregate their output and resolve issues before presenting to the human.

**Step 2.6 — Human review**
The human reviews `plan.md`, `data-model.md`, and `contracts/`. Particular focus:
- Are contracts complete enough to implement without questions?
- Does the data model handle all the spec's data requirements?
- Are there simpler approaches to any components?
- Does the Risks section cover all High-impact risks with concrete mitigations?

**Step 2.7 — Lock contracts**
Once approved, `contracts/` are **frozen** for the duration of Phase 4.
Changing a contract during implementation is spec drift — plan first, then execute.

**Step 2.8 — Commit**
```bash
git add specs/[feature-name]/plan.md specs/[feature-name]/data-model.md specs/[feature-name]/contracts/
git commit -m "plan: [feature name] technical design"
```

---

## Phase 3 — Tasks

### Goal
Break `plan.md` into granular, sequential tasks small enough for a single AI session
(~30–60 minutes of implementation work).

### Step-by-Step

**Step 3.1 — Generate tasks.md**
Use the Task Breakdown Prompt from `references/prompt-patterns.md`.

**Step 3.2 — Apply test-first ordering**
For every implementation task, there must be a test task immediately preceding it:
```
TASK-003: Write tests for UserRepository.create()   ← test first
TASK-004: Implement UserRepository.create()          ← implementation after
```

**Step 3.3 — Size tasks**
- `S` (< 1 hour): single function, small component, migration
- `M` (1–3 hours): a full repository method + tests, an API route + tests
- `L` (3–6 hours): consider splitting into two `M` tasks

**Step 3.4 — Identify parallelism**
Tasks with no shared dependencies can be marked `[P]` and run simultaneously
(in separate AI sessions or by separate developers).

**Step 3.5 — Human review**
Review `tasks.md` for:
- Tasks that seem too large (will need mid-task context reset)
- Test tasks that don't reference specific ACs
- Implementation tasks that reference "see plan.md" vaguely (add specific section)

**Step 3.6 — Commit**
```bash
git add specs/[feature-name]/tasks.md
git commit -m "tasks: [feature name] task breakdown"
```

---

## Phase 4 — Implement

### Goal
Execute tasks from `tasks.md` with AI constrained by spec artifacts, committing after
each task to maintain clean rollback points.

### Step-by-Step

**Step 4.1 — Session setup per task**
Start a fresh context window for each task. Include:
- `constitution.md` (always — project-level constraints, never violate)
- The task description from `tasks.md`
- Relevant ACs from `spec.md`
- `Boundaries` section from `spec.md` (if present — feature-level constraints)
- Relevant section from `plan.md`
- Relevant contract from `contracts/`
- Relevant entities from `data-model.md`

Do NOT paste the entire spec — include only what's relevant to the current task.
`constitution.md` is the one exception: always include it in full, it is compact by design.

**Step 4.2 — Use the single-task implementation prompt**
See `references/prompt-patterns.md → Phase 4 → Single Task Implementation Prompt`.

**Step 4.3 — Verify before committing**
After AI generates code, verify:
- Tests pass (run them, don't trust the AI)
- API signatures match contracts exactly
- No new files outside the task scope were created

**Step 4.4 — Commit after each task**
```bash
git add [files]
git commit -m "feat([scope]): [task title]"
```

Do not batch multiple tasks into one commit. Each task = one commit.
This enables precise rollback if a task introduced drift.

**Step 4.5 — Mark task complete in tasks.md**
```markdown
- [x] **TASK-003** [M] Write tests for UserRepository.create()
```

Commit the updated `tasks.md` with the implementation commit.

### Context Reset Between Tasks
Clear the AI context between tasks to prevent:
- Accumulated assumptions from prior sessions
- The AI "remembering" wrong implementations it wrote earlier
- Conflicting information about how the system works

This is especially important when tasks are implemented across multiple days.

---

## Phase 5 — Validate

### Goal
Verify the implementation satisfies every acceptance criterion and no spec drift occurred.

### Step-by-Step

**Step 5.1 — Generate traceability matrix**
Use the Post-Implementation Validation Prompt from `references/prompt-patterns.md`.
Produces: for each AC, which test covers it, which file implements it, pass/fail.

**Step 5.2 — Run drift detection**
Use the Drift Detection Prompt from `references/prompt-patterns.md`.
Checks API signatures, database schema, and behavior against specs.

**Step 5.3 — Fix drift immediately**
If drift is found:
- Do not "adjust the spec to match the code"
- Fix the implementation to match the spec
- If the spec is genuinely wrong, update spec.md, then plan.md, then implementation
  (never skip the update chain)

**Step 5.4 — Acceptance test run**
Manually walk through each user story from `spec.md` in the running application.
Check each AC as a user, not as a developer.

**Step 5.5 — Archive specs (optional)**
After validation passes, consider archiving completed specs to keep `specs/` clean:
```bash
mkdir -p specs/archive/[feature-name]
cp -r specs/[feature-name]/* specs/archive/[feature-name]/
# Verify copy succeeded before removing originals
rm -rf specs/[feature-name]
```
Keep `specs/archive/` in version control — specs are invaluable for regression analysis
when bugs appear in features implemented months earlier. Skip this step if your team
prefers to keep all specs in `specs/` indefinitely.
