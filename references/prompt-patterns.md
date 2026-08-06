# Prompt Patterns

Effective prompts for each phase of the SDD workflow. The quality of your specs directly
determines the quality of AI output — vague input = vague output.

## Contents

- Phase 0 — Constitution: initial generation, security constraints
- Phase 0.5 — Research: codebase research (Format A/B), consolidation, verification
- Phase 1 — Specify: assumptions surface, initial spec, clarify, post-clarify update, completeness check
- Phase 2 — Plan: technical plan generation, plan review
- Phase 3 — Tasks: task breakdown, task validation
- Phase 4 — Implementation: single task (Format A/B), context handover, session resume, mid-implementation correction
- Amend (`/sdd:amend`) · Analyze (`/sdd:analyze`) · Status (`/sdd:status`)
- Phase 5 — Validate: drift detection, post-implementation validation, linear walkthrough
- Multi-agent review pattern · Constitution from existing codebase · Cross-feature conflict detector

Every prompt in this file produces either a file or a user-facing report. For the format of
the user-facing ones, see `output-formats.md`.

---

## Phase 0 — Constitution Prompts

### Initial Constitution Generation Prompt

```
Generate a constitution.md for this project.

Project context:
- Name: [project name]
- Purpose: [1-2 sentences]
- Tech stack: [list languages, frameworks, databases, auth]
- Team size: [1 dev / small team / larger org]
- Domain: [e.g., fintech, e-commerce, internal tooling]
- Special constraints: [security requirements, compliance, performance SLAs]

The constitution should cover:
1. Architecture principles (how code is organized)
2. Technology stack (locked choices with rationale)
3. Security constraints (non-negotiable rules for ALL generated code)
4. Naming conventions
5. Banned patterns (things AI must never introduce)
6. File structure rules

Format as constitution.md using the template in references/artifact-templates.md.
Mark anything uncertain as [PENDING] for human review.
```

### Constitution Security Constraints Prompt

```
Enhance the security section of constitution.md for this domain: [domain]

Add specific constraints to prevent the top CWE vulnerabilities relevant to this stack:
- [e.g., "Node.js API": CWE-89 SQL injection, CWE-79 XSS, CWE-306 missing auth]
- [e.g., "payment processing": PCI-DSS constraints, no logging of card data]

For each constraint, write it as an explicit rule an AI agent can check:
❌ Vague: "handle errors securely"
✅ Specific: "never expose stack traces or internal error details in API responses"
```

---

## Phase 0.5 — Research Prompts

Run these before Phase 1 whenever the feature touches unfamiliar or large existing code.
The output is a map of the system as it is — not a design, not a requirement list.

### Codebase Research Prompt (`/sdd:research`)

*Format A — agent with filesystem access and subagent dispatch.*

```
Research how [feature area] currently works in this codebase. Do NOT propose a design,
write requirements, or suggest improvements. Report only what exists.

Task: [1-2 sentence description of what we are about to build or change]

Method:
1. Dispatch parallel subagents for the noisy work. Each returns at most 300 words:
   - Agent 1: locate every file involved in [area] and state each file's responsibility
   - Agent 2: trace the information flow end to end — entry point → transformation → persistence → response
   - Agent 3: find prior art — features in this repo that already solve a similar problem
   - Agent 4: find the constraints the code already enforces (base classes, middleware,
     conventions, validation layers) that any change here must respect
2. Consolidate their output into specs/[feature]/research.md using the research.md
   template in references/artifact-templates.md.

Hard rules:
- Every factual claim ends with a `file:line` citation. No citation = delete the claim.
- If you could not verify something, list it under "Open Questions for the Spec" —
  never fill the gap with a plausible guess.
- List what you did NOT investigate under "Not Investigated".
- Target 200 lines. If you exceed it, you are dumping rather than compacting.
- Do not write acceptance criteria, user stories, or solution proposals.
```

*Format B — stateless interface with no filesystem access.*

```
I will paste code from my repository. Build a research document describing how
[feature area] currently works.

For each claim you make, cite the file and line I gave you, in the form `path/file.ts:42`.
If the pasted code is insufficient to answer something, say so explicitly under
"Open Questions for the Spec" and tell me which file you need next.

Output format: [paste the research.md template from artifact-templates.md]

Do not propose changes, requirements, or designs. Describe only what the code does today.
```

### Research Consolidation Prompt

*Run when several subagents or several sessions produced overlapping findings.*

```
Consolidate the following research fragments into a single specs/[feature]/research.md.

Fragments:
[paste each subagent output]

Rules:
- Deduplicate findings that describe the same code path.
- Where two fragments disagree, keep both and mark the item [CONFLICT] — do not silently
  pick one. A conflict means at least one agent read the code wrong, and the human needs
  to see it.
- Drop any claim that arrived without a `file:line` citation.
- Preserve every "Open Question" from every fragment.
- Final document must be under 200 lines.
```

### Research Verification Prompt (Gate R)

*Run before the human reviews `research.md`. Catches the failure that matters most:
confident findings that are not actually true.*

```
You are verifying a research document against the real codebase. You did not write it.

Read: specs/[feature]/research.md

For every claim with a `file:line` citation, open that location and check:
- Does the cited line exist?
- Does the code there actually support the claim?
- Is the claim complete, or does it omit a branch, guard, or error path?

Also report:
- Files that are clearly involved in this area but missing from "Relevant Files"
- Any sentence that states what the system SHOULD do rather than what it DOES
- Any claim with no citation at all

Return findings in this format:
[ISSUE] [F-N or Section] Research [Type: BadCitation/Unsupported/Incomplete/Missing/Prescriptive] [CONFIRMED|VERIFY] [Description]

Do not rewrite the document. Do not approve or compliment. Issues only.
```

---

## Phase 1 — Specify Prompts

### Assumptions Surface Prompt

*Run this BEFORE the Initial Specification Prompt. Forces AI transparency about
implicit decisions before they get baked into acceptance criteria.*

```
I want to build: [feature description]

Before generating any spec, surface your assumptions. List every assumption
you are making about:

1. User roles and permissions — who can trigger this feature?
2. Data ownership — whose data is this, and who can read or modify it?
3. Error behavior — what happens when inputs are invalid or dependencies fail?
4. Integration — what other parts of the system does this feature touch?
5. Scope boundaries — what does "done" mean for this feature?
6. Performance — any implicit thresholds (latency, rate limits, data volume)?

Do NOT write any spec yet. Return only the assumption list.
Human will review and correct assumptions before the spec is written.
```

After reviewing the AI's assumption list, pass your corrections into the Initial
Specification Prompt below by adding a `Corrected assumptions:` block before the
`Requirements:` section. Match the 6 areas from the surface prompt:

```
Corrected assumptions:
- Roles: [your correction or "confirmed"]
- Data ownership: [your correction or "confirmed"]
- Error behavior: [your correction or "confirmed"]
- Integration: [your correction or "confirmed"]
- Scope: [your correction or "confirmed"]
- Performance: [your correction or "confirmed"]
```

---

### Initial Specification Prompt

```
I want to build: [feature description in plain language]

[If you ran the Assumptions Surface Prompt, insert your corrected assumptions here:]
Corrected assumptions:
- Roles: [confirmed / correction]
- Data ownership: [confirmed / correction]
- Error behavior: [confirmed / correction]
- Integration: [confirmed / correction]
- Scope: [confirmed / correction]
- Performance: [confirmed / correction]

Generate a spec.md for this feature following the SDD workflow. Use the template in
references/artifact-templates.md.

Requirements:
- No implementation details in the spec (no technology names, no function names)
- Each acceptance criterion must be independently testable
- Mark any ambiguous requirements with [NEEDS CLARIFICATION]
- Explicitly list what is OUT OF SCOPE
- Use MoSCoW priority on every AC: [MUST] / [SHOULD] / [COULD] / [WONT]
- Include error/edge case ACs — not just the happy path

Target users: [who uses this feature]
Constraints: [any hard limits — performance, security, platform]
```

### Clarify Phase Prompt

*Run after generating spec.md, before creating the plan. After the human reviews and approves
the output, run the Post-Clarify Spec Update Prompt below to apply the changes to spec.md.*

```
You are a spec reviewer. Read specs/[feature]/spec.md and perform a full clarification pass.

Step 1 — Resolve open questions:
List every [NEEDS CLARIFICATION] item and propose a resolution for human approval.
Do not resolve them unilaterally.

Step 2 — Find missing edge cases:
For each [MUST] AC, identify edge cases not yet covered:
- What happens with empty/null inputs?
- What happens with concurrent requests?
- What happens when dependent services are unavailable?
- What are the permission boundary cases?

Step 3 — Automated validation:
Flag any AC that contains vague terms:
- "fast", "slow", "quickly", "efficiently" → needs a numeric threshold
- "works correctly", "functions properly" → needs a specific testable outcome
- "secure", "safe" → needs a specific constraint
- "simple", "easy" → not a requirement

Return: a list of proposed resolutions + a list of new ACs to add.
Do NOT write a new spec.md. Return only the delta.
```

### Post-Clarify Spec Update Prompt

*Run after the human has reviewed and approved the clarification output. Takes human answers
and applies them to spec.md.*

```
You have received human-approved resolutions to the clarification questions for
specs/[feature]/spec.md.

Apply the approved resolutions:

1. For each resolved [NEEDS CLARIFICATION] item:
   - Change the marker from [NEEDS CLARIFICATION] to [RESOLVED]
   - Append: → Decision: [human's answer]
   - Keep the original question text — do not delete it

2. For each new AC approved during clarification:
   - Add it to the Acceptance Criteria section with the correct MoSCoW priority
   - Assign the next available AC number (continuing the existing sequence)

3. For each vague term replaced (e.g., "fast" → "< 200ms at p95"):
   - Update the AC text with the specific threshold approved by the human

Do NOT add, remove, or modify any AC that was not part of the clarification output.
Return the full updated spec.md.
```

---

### Spec Clarification Prompt (targeted)

```
Review specs/[feature]/spec.md and identify:
1. Acceptance criteria that are ambiguous or not independently testable
2. Missing edge cases for AC-[N]
3. Any implicit assumptions that should be made explicit
4. Scope boundaries that need clarification

Do NOT suggest implementation approaches. Focus on requirements only.
```

### Spec Completeness Check Prompt

```
Act as a product manager reviewing specs/[feature]/spec.md.

Check:
- Are all user stories covered by acceptance criteria?
- Are error scenarios and edge cases specified?
- Are performance requirements stated (if applicable)?
- Are security requirements stated (if applicable)?
- Is the "out of scope" section complete?

Return only gaps and missing items, not a full rewrite.
```

---

## Phase 2 — Plan Prompts

### Technical Plan Generation Prompt

```
Read specs/[feature]/spec.md and generate:
1. plan.md — technical architecture, component breakdown, risks
2. data-model.md — entities, fields, relationships, indexes
3. contracts/[name].md — API endpoints (one file per domain)

If specs/[feature]/research.md exists, read it first as additional context
(pre-generated alternatives analysis). Do not generate it — use it as input only.

Constraints:
- Use existing stack: [list your stack, e.g., TypeScript, Hono, Drizzle, PostgreSQL]
- Do not introduce new dependencies unless justified in plan.md
- Use framework features directly — avoid unnecessary wrapper layers
- Every AC in spec.md must map to at least one component in plan.md
- Follow existing patterns in: [reference file or convention]

For plan.md, include a Risks section: identify implementation risks (third-party
dependencies, data migrations, external APIs, concurrency issues) and a mitigation
for every High-impact risk. Use the template in references/artifact-templates.md.

Generate files sequentially: plan.md first, then data-model.md, then contracts/.
```

### Plan Review Prompt

```
Review the generated plan at specs/[feature]/plan.md against specs/[feature]/spec.md.

Check:
1. AC coverage: does every acceptance criterion have a corresponding component?
2. Completeness: are all data-model.md entities referenced in plan.md?
3. Contract completeness: does every component that exposes an API have a contract?
4. Over-engineering: are there abstractions that could be replaced with direct framework usage?
5. Risks completeness: does the Risks section exist? Is every High-impact risk mitigated?

Return a gap analysis only — do not regenerate the files.
```

---

## Phase 3 — Tasks Prompts

### Task Breakdown Prompt

```
Read specs/[feature]/plan.md and specs/[feature]/contracts/*.md.

Generate tasks.md with:
- Atomic tasks (one task = one PR or commit)
- Test task before each implementation task (test-first)
- [P] marker for tasks that can run in parallel
- S/M/L size estimates
- Explicit dependencies (by task ID)

Rules:
- No task should modify more than 3 files
- Large [L] tasks must be split unless justified
- Test tasks reference specific ACs from spec.md
- Implementation tasks reference specific sections from plan.md and contracts/
```

### Task Validation Prompt

```
Review specs/[feature]/tasks.md and identify:
1. Tasks missing their paired test task
2. Tasks that are too large (would touch > 3 files)
3. Dependency cycles
4. Implementation tasks before their test tasks

Return only issues found, not a full rewrite.
```

---

## Phase 4 — Implementation Prompts

### Single Task Implementation Prompt

Two formats depending on your agent's file system access:

**Format A — Agent with file access (Claude Code, Cursor, Windsurf)**

```
Implement TASK-[N]: [task title]

Read and follow:
- constitution.md (project-level rules — never violate)
- Acceptance criteria: specs/[feature]/spec.md → [section heading]
- Feature boundaries: specs/[feature]/spec.md → Boundaries (if present)
- Technical design: specs/[feature]/plan.md → [section heading]
- API contract: specs/[feature]/contracts/[file].md
- Data model: specs/[feature]/data-model.md → [EntityName]

Do NOT:
- Add functionality outside the acceptance criteria
- Deviate from the API signatures in contracts/
- Introduce abstractions not in plan.md
- Violate any rule in constitution.md
- Violate any rule in the spec's Boundaries section

After implementation, verify:
- [ ] All referenced ACs have test coverage
- [ ] API signatures match contracts exactly
- [ ] No new dependencies introduced without explicit justification
```

**Format B — Stateless agent or web interface (paste content)**

```
Implement TASK-[N]: [task title]

Project constitution (non-negotiable rules):
[paste full constitution.md]

Acceptance criteria (from spec.md):
[paste only the ACs this task must satisfy]

Feature boundaries (from spec.md → Boundaries, if present):
[paste Always do / Ask first / Never do rules, or omit if section absent]

Technical design (from plan.md):
[paste only the relevant component section]

API contract (from contracts/[file].md):
[paste the relevant endpoint definition]

Data model (from data-model.md):
[paste only the relevant entities]

Do NOT add functionality beyond what the ACs and contract define.
```

Use Format A when the agent can `Read` files directly.
Use Format B for web interfaces or agents without persistent file access.

### Context Handover Prompt (run before a context reset, not after)

*Use when a task will not finish inside the current context window. Run it while the session
still has room to think — a handover written at 95% utilization is written by a degraded agent.*

```
This session is being reset. Write specs/[feature]/progress.md so a fresh session with none
of this conversation can resume the task without repeating work.

Use the progress.md template from references/artifact-templates.md.

Include:
- The goal, copied verbatim from tasks.md — not your paraphrase of it
- Steps completed, each with the file:line or commit sha that proves it
- The exact step in flight and how far it got
- The current blocker, quoted as the literal failing command and its real output
- Approaches already tried and rejected, with the reason each failed

Exclude:
- Narration of what we discussed
- Anything already written in spec.md, plan.md, or contracts/ — the new session reads those directly

Keep it under 40 lines.
```

### Session Resume Prompt (after a context reset)

```
Resume TASK-[ID] for [feature].

Read, in this order:
1. constitution.md
2. specs/[feature]/progress.md  ← current state, start here
3. The AC and contract sections it references

Start from "Current Step". Do not re-run completed steps. Do not retry anything listed
under "Do Not Repeat". If progress.md contradicts what you find in the code, stop and
report the contradiction — do not guess which one is right.
```

### Mid-Implementation Correction Prompt (when AI drifts)

```
Stop. The implementation is drifting from the specification.

Spec says: [paste the relevant AC or contract section]
You implemented: [describe what was generated]

Roll back this change and re-implement following the spec exactly.
Do not use your judgment about what "makes sense" — follow the contract.
```

---

## Amend Prompt (/sdd:amend — run when requirements change)

Used when new information requires updating the spec chain mid-development. Amend propagates
the change through all affected artifacts in the correct order instead of patching files manually.

Two-step flow: assess impact first (human approves), then update.

**Step 1 — Impact Assessment Prompt:**

```
A requirement has changed: [describe what changed and why]

Current phase: [Phase N — TASK-NNN complete / not yet started]

Assess the impact across all spec artifacts:
- spec.md: which ACs need to be added, modified, or removed?
- plan.md: which components are affected?
- contracts/: which endpoint signatures or error codes change?
- data-model.md: which entities, fields, or migrations change?
- tasks.md: which tasks need to be regenerated (from which task ID forward)?

Do NOT make any changes yet. Return the impact assessment only.
Present as a list: [ARTIFACT] → [what changes and why]
```

Present the impact assessment to the human for approval before proceeding to Step 2.

**Step 2 — Cascade Update Prompt** *(run after human approves the impact assessment)*:

```
The following impact was approved: [paste approved impact assessment]

Update the affected artifacts in this order:
1. spec.md — update ACs; annotate changes with <!-- AMENDED [date]: [reason] -->
2. plan.md — update affected component descriptions
3. contracts/ — update affected endpoint definitions and error codes
4. data-model.md — update affected entities; add migration entry if schema changed
5. tasks.md — regenerate from TASK-[first affected ID] forward

Do NOT modify artifacts not listed in the approved impact assessment.
Return a summary of what changed in each file.
```

Do not skip Step 1. Amending without an impact assessment produces partial updates
that leave the spec chain inconsistent — the exact problem amend is designed to prevent.

---

## Analyze Prompt (/sdd:analyze — run any time)

Detects internal inconsistencies within the spec itself, before Plan generation.
Different from `/sdd:clarify` (resolves ambiguities with human input) and
`/sdd:validate` (checks implementation against spec). Most effective after Clarify
and before Plan, but safe to run at any phase.

```
Read specs/[feature]/spec.md and run an inconsistency analysis.

Check for:
1. AC conflicts — two ACs that cannot both be satisfied simultaneously
   Example: AC-1 says "returns 404 for unknown users", AC-3 says "auto-creates user on first access"
2. Scope overlap — an AC that contradicts the Out of Scope section
3. NFRs without measurable thresholds — "fast", "secure", "reliable" with no numeric target
4. [MUST] ACs with no error scenario — every MUST happy-path AC should have a paired error AC
5. Duplicate coverage — two ACs that describe the same behavior with different wording
6. Untestable criteria — ACs that cannot be expressed as an automated test

Return issues in this format:
[ISSUE] [AC-N or section] [Type: Conflict/Overlap/Vague/Missing/Duplicate/Untestable] [CONFIRMED|VERIFY] [Description]

If no issues are found, respond: "No inconsistencies detected."
Do NOT rewrite the spec. Return issues only.

Present the result using the Analyze Report format in references/output-formats.md:
20 lines maximum, fixed finding types, blocking vs non-blocking stated explicitly.
```

---

## Status Prompt (/sdd:status — run any time)

*Answers "where am I?" without the user opening a single file. Every line is derived from
what exists on disk — never from conversation memory.*

```
Report the current state of the [feature] spec workflow.

Determine each phase's state by inspecting the filesystem, not by recalling our conversation:
- Phase 0:   does constitution.md exist? any unresolved [PENDING] items?
- Phase 0.5: does specs/[feature]/research.md exist? how many findings? any uncited claims
             or [CONFLICT] markers left?
- Phase 1:   does spec.md exist? what is its Status header? count ACs by MoSCoW label.
             any [NEEDS CLARIFICATION] still open?
- Phase 2:   do plan.md, data-model.md, and contracts/ exist? are contracts locked?
- Phase 3:   does tasks.md exist? how many tasks total?
- Phase 4:   how many tasks are [x] vs [ ]? what is the last commit touching this feature?
             does progress.md exist (meaning a task is mid-flight)?
- Phase 5:   does validation.md or walkthrough.md exist?

Then state the single next action: the next unchecked task, or the gate awaiting approval.

Output using the Status Report format in references/output-formats.md — 12 lines maximum,
fixed glyphs, one "Next:" block. If an artifact is missing, report it as not started; never
infer progress from what we discussed.
```

---

## Phase 5 — Validate Prompts

### Drift Detection Prompt

**Format A — agent with file access (reads contracts to discover implementation files):**

```
Read all contracts in specs/[feature]/contracts/ to identify which source files to check.
For each contract endpoint, find the corresponding route/handler in src/.

Compare the implementation against:
- Acceptance criteria in specs/[feature]/spec.md
- API contracts in specs/[feature]/contracts/
- Data model in specs/[feature]/data-model.md

Report:
1. ACs with no test coverage
2. Implemented API signatures that differ from contracts/
3. Database fields not in data-model.md
4. Functionality in code not covered by spec.md
5. Missing error handling for error codes defined in contracts/
6. Constitution violations — banned patterns introduced or security constraints violated
   (read constitution.md to identify the rules to check against)

Present the result using the Drift Report format in references/output-formats.md:
verdict and count first, one line per item with BOTH locations (the code and the artifact
it contradicts), a [CONFIRMED] or [VERIFY] marker on each, 25 lines maximum.
```

### Post-Implementation Validation Prompt

```
Run a full spec compliance check on the [feature] implementation.

Files to check: [list implementation files]
Spec files: specs/[feature]/spec.md, specs/[feature]/plan.md, specs/[feature]/contracts/, constitution.md

For each AC in spec.md, identify:
- Which test covers it, cited file:line
- Which implementation file satisfies it, cited file:line
- Status from the fixed vocabulary: PASS / FAIL / NO TEST / NOT IMPLEMENTED / OUT OF SCOPE

Write the full matrix to specs/[feature]/validation.md using the Traceability Matrix format
in references/output-formats.md. In your response, show only the 3-line summary: verdict,
MUST coverage ratio, and each blocking row. Do not paste the matrix into the response.

Also report any implementation file that satisfies no AC — unmapped code is scope drift.
```

### Linear Walkthrough Prompt

*Run before merge, for the humans. Its purpose is comprehension, not validation — it is the
antidote to shipping code the team does not understand. Save the output as
`specs/[feature]/walkthrough.md` or paste it into the PR description.*

```
Write a linear walkthrough of the [feature] implementation for an engineer who has never
seen this code and will have to maintain it.

Files: [list implementation files]
Spec: specs/[feature]/spec.md

Rules:
- Follow execution order, not file order. Start at the entry point the user actually hits.
- At each step: what happens, in which file and function, and why it is done that way.
- Cite `file:line` for every step.
- Call out every non-obvious decision and tie it to the AC or plan section that forced it.
- Explicitly list what this code does NOT handle, and where those cases are handled instead.
- Flag anything you generated that you would not be able to justify from the spec — that
  is unrequested behavior and the reviewer needs to see it first.

Do not summarize the feature. Narrate the path through the code.
```

---

## Multi-Agent Review Pattern

When using subagents for critique (recommended for complex specs):

```
# Critic Agent Prompt
Review specs/[feature]/spec.md from the perspective of [role]:
- QA Engineer: find untestable or ambiguous criteria
- Security Engineer: find missing auth, validation, or data exposure risks
- Database Engineer: find schema issues, missing indexes, or N+1 risks
- Frontend Engineer: find missing states, loading states, or error UX

Return issues in this format:
[ISSUE] [AC-N or Section] [Role] [Type: Untestable/Ambiguous/Missing/Risk/Schema/UX-Gap] [Description]

Mark [CONFIRMED] only when you can cite the exact artifact location proving the issue.
Otherwise mark [VERIFY]. Never invent a confidence percentage.

Examples:
[ISSUE] AC-3 QA Untestable [CONFIRMED] "responds quickly" has no numeric threshold — specify ms target
[ISSUE] AC-1 Security Missing [CONFIRMED] No authentication requirement stated for this endpoint
[ISSUE] data-model.md DB Schema [VERIFY] Likely missing index on user_id + created_at — query pattern not stated in plan.md

If no issues found for your role, respond: "No issues found for [role]."
Do not approve, summarize, or compliment — issues only.
```

Use separate critic agents for each role. Aggregate their feedback before proceeding.

---

## Constitution from Existing Codebase

*Use when onboarding SDD onto a project that already exists. Derives constitution.md
from actual code patterns rather than aspirational decisions. Run once before
writing the first feature spec.*

```
Derive a constitution.md for this codebase from what actually exists, not what
we wish existed.

Read the following to understand the real patterns in use:
- Package manifest: [package.json / go.mod / Cargo.toml / requirements.txt]
- Representative route or handler files: [list 2-3 file paths]
- Database schema or migration files: [file paths]
- Lint and formatter config: [.eslintrc / .prettierrc / pyproject.toml / etc.]
- Auth middleware or security utilities: [file paths]

Extract and document:

1. Technology Stack — every language, framework, and library in active use (with versions)
2. Architecture Principles — patterns that repeat across files (layered architecture,
   repository pattern, how routing is organized, how errors propagate)
3. Naming Conventions — derive from actual file names, variable names, and DB column names
4. Security Constraints — auth patterns present, input validation approach,
   what is consistently enforced vs. absent
5. File Structure — actual directory layout, where different concerns live
6. Patterns to Preserve — conventions applied consistently that new code should follow
7. Patterns to Avoid — things done inconsistently, or marked with TODO/FIXME/HACK comments

For each section where the codebase is inconsistent, write:
[INCONSISTENT] [what varies] → [options observed] — human must decide which to standardize

For anything undecided or unclear, write [PENDING].

Do NOT invent rules not evidenced in the code. Describe what is, not what should be.
Output as constitution.md following the template in references/artifact-templates.md.
```

After generating, resolve every `[INCONSISTENT]` and `[PENDING]` item before using
the constitution in any feature spec. An inconsistent constitution produces inconsistent specs.

---

## Cross-Feature Conflict Detector

*Run after a new spec.md is ready (post-Clarify, pre-Phase 2). Checks the new spec
against all existing active and archived specs for behavioral, structural, and ownership
conflicts. Most valuable on projects with 3+ completed features.*

```
You are reviewing specs/[new-feature]/spec.md for conflicts with existing features.

Read:
- specs/[new-feature]/spec.md (new spec being validated)
- All spec.md files in specs/ (other active features, if any)
- All spec.md files in specs/archive/ (completed features)

Check for the following conflict types:

1. Endpoint conflicts — does the new spec imply an API endpoint that already exists
   in another spec with different behavior, response shape, or error codes?

2. Entity conflicts — does the new spec reference a shared entity (User, Order, etc.)
   that another spec also modifies? Are the write operations compatible?

3. Behavioral conflicts — does an AC in the new spec contradict behavior defined in
   an existing spec? Example: new spec says "unauthenticated users can view X",
   existing spec says "all /api/v1/* routes require authentication".

4. Ownership conflicts — does the new spec modify data or endpoints owned by another
   feature without explicitly calling it out as a cross-feature dependency?

5. Naming conflicts — same entity or concept named differently across specs,
   suggesting they may be the same thing or may diverge unnecessarily.

Return issues in this format:
[CONFLICT] [new-spec section] vs [existing-spec file + section] [Type: Endpoint/Entity/Behavior/Ownership/Naming] [Description]

If no conflicts are found, respond: "No conflicts detected against existing specs."
Do NOT suggest spec rewrites — report conflicts only. Human resolves each conflict.
```
