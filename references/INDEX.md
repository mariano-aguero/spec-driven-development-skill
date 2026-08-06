# Reference Index

Navigation map for all SDD reference files. Every file listed here is one level deep from
`SKILL.md` — load only what the current phase needs.

## Contents

By topic (getting started · templates · prompts · phase details · quality and review ·
output formats · AI and agent patterns · troubleshooting) · By phase · File list

---

## By Topic

### Getting started

- Overview and when to use → `SKILL.md`
- Quick Start (4-step onboarding) → `SKILL.md#quick-start`
- Key Practice: Reframe Vague Requirements → `SKILL.md#key-practice-reframe-vague-requirements`
- Choosing the ceremony level (S / M / L) → `SKILL.md#choosing-the-ceremony-level`
- Three ways a spec and its code disagree → `SKILL.md#three-ways-a-spec-and-its-code-disagree`
- Context is the real constraint (compaction model) → `SKILL.md#context-is-the-real-constraint`
- Comprehension debt (code nobody understands) → `SKILL.md#comprehension-debt`
- Living Document (spec versioning, commit, archive) → `SKILL.md#living-document`
- One-page cheat sheet → `quick-reference.md`

### Templates (copy-paste ready)

- constitution.md template → `artifact-templates.md#constitutionmd-template`
- research.md template (Phase 0.5, cited findings) → `artifact-templates.md#researchmd-template`
- progress.md template (context handover) → `artifact-templates.md#progressmd-template`
- Writing concrete acceptance criteria → `artifact-templates.md#writing-concrete-acceptance-criteria`
- spec.md template (incl. Boundaries section) → `artifact-templates.md#specmd-template`
- spec.md delta mode (brownfield changes) → `artifact-templates.md#specmd-template--delta-mode`
- plan.md template (incl. Risks section) → `artifact-templates.md#planmd-template`
- data-model.md template → `artifact-templates.md#data-modelmd-template`
- contracts/[endpoint].md template → `artifact-templates.md#contractsendpointmd-template`
- tasks.md template → `artifact-templates.md#tasksmd-template`

### Prompts (copy-paste ready)

- Phase 0 — Constitution prompts → `prompt-patterns.md#phase-0--constitution-prompts`
- Phase 0.5 — Codebase research → `prompt-patterns.md#codebase-research-prompt-sddresearch`
- Phase 0.5 — Research consolidation → `prompt-patterns.md#research-consolidation-prompt`
- Phase 0.5 — Research verification (Gate R) → `prompt-patterns.md#research-verification-prompt-gate-r`
- Phase 1 — Surface assumptions (pre-spec) → `prompt-patterns.md#assumptions-surface-prompt`
- Phase 1 — Specify prompts → `prompt-patterns.md#phase-1--specify-prompts`
- Phase 1 — Post-Clarify spec update → `prompt-patterns.md#post-clarify-spec-update-prompt`
- Phase 2 — Plan prompts → `prompt-patterns.md#phase-2--plan-prompts`
- Phase 3 — Tasks prompts → `prompt-patterns.md#phase-3--tasks-prompts`
- Phase 4 — Implement prompts → `prompt-patterns.md#phase-4--implementation-prompts`
- Phase 4 — Context handover / session resume → `prompt-patterns.md#context-handover-prompt-run-before-a-context-reset-not-after`
- Phase 5 — Validate prompts → `prompt-patterns.md#phase-5--validate-prompts`
- Phase 5 — Linear walkthrough (comprehension) → `prompt-patterns.md#linear-walkthrough-prompt`
- Status (`/sdd:status`) → `prompt-patterns.md#status-prompt-sddstatus--run-any-time`
- Multi-agent review (standardized output) → `prompt-patterns.md#multi-agent-review-pattern`
- Delta specification (brownfield) → `prompt-patterns.md#delta-specification-prompt-brownfield-changes`
- Amend (requirements change cascade) → `prompt-patterns.md#amend-prompt-sddamend--run-when-requirements-change`
- Reconcile (code changed outside the workflow) → `prompt-patterns.md#reconcile-prompt-sddreconcile--run-when-code-changed-outside-the-workflow`
- Constitution from existing codebase → `prompt-patterns.md#constitution-from-existing-codebase`
- Cross-feature conflict detector → `prompt-patterns.md#cross-feature-conflict-detector`

### Phase details (step-by-step)

- Phase 0 — Constitution → `workflow-phases.md#phase-0--constitution`
- Phase 0.5 — Research → `workflow-phases.md#phase-05--research`
- Phase 1 — Specify → `workflow-phases.md#phase-1--specify`
- Delta specs (brownfield) → `workflow-phases.md#delta-specs`
- Reconcile (code changed outside the workflow) → `workflow-phases.md#reconcile--when-code-changed-outside-the-workflow`
- Phase 2 — Plan → `workflow-phases.md#phase-2--plan`
- Phase 3 — Tasks → `workflow-phases.md#phase-3--tasks`
- Phase 4 — Implement → `workflow-phases.md#phase-4--implement`
- Phase 5 — Validate → `workflow-phases.md#phase-5--validate`

### Output formats (what the user reads)

- Principles: write artifacts, show verdicts → `output-formats.md#principles`
- Gate verdict → `output-formats.md#gate-verdict`
- Critic findings (binary confidence) → `output-formats.md#critic-findings`
- Traceability matrix → `output-formats.md#traceability-matrix`
- Drift report → `output-formats.md#drift-report`
- Reconcile report (`/sdd:reconcile`) → `output-formats.md#reconcile-report`
- Analyze report → `output-formats.md#analyze-report`
- Status report (`/sdd:status`) → `output-formats.md#status-report`
- Linear walkthrough → `output-formats.md#linear-walkthrough`
- What never to print → `output-formats.md#what-never-to-print`

### Quality and review

- Which gates apply at which ceremony level → `quality-gates.md#which-gates-apply-at-which-ceremony-level`
- Per-phase checklists (incl. delta-mode Gate 1) → `quality-gates.md#per-phase-checklists`
- Confidence-based review thresholds → `quality-gates.md#confidence-based-review-thresholds`
- CI/CD integration → `quality-gates.md#cicd-integration`
- Drift classification → `quality-gates.md#spec-drift-classification`

### AI and agent patterns

- Context management (single-task rule) → `ai-agent-patterns.md#context-management`
- Context engineering (compaction, budget, progressive disclosure) → `ai-agent-patterns.md#context-engineering`
- Subagent review pattern → `ai-agent-patterns.md#subagent-review-pattern`
- Phase 0.5 Research Verifier critic → `ai-agent-patterns.md#phase-05-critic-agent`
- Phase 2 Risks Critic → `ai-agent-patterns.md#phase-2-critic-agents`
- Parallel task execution → `ai-agent-patterns.md#parallel-task-execution`
- AI tool selection per phase → `ai-agent-patterns.md#ai-tool-selection-per-phase`
- Handling AI resistance → `ai-agent-patterns.md#handling-ai-resistance`
- Spec regeneration (when requirements change) → `ai-agent-patterns.md#spec-regeneration-pattern`
- Research phase with parallel subagents → `ai-agent-patterns.md#research-phase-with-parallel-subagents`
- Spec as recovery point → `ai-agent-patterns.md#spec-as-recovery-point`

### Troubleshooting

- Common failure modes → `anti-patterns.md`
- Spec drift causes → `anti-patterns.md#anti-pattern-2-contracts-modified-during-implementation`
- Context contamination → `anti-patterns.md#anti-pattern-3-one-context-for-all-tasks`
- Oversized tasks → `anti-patterns.md#anti-pattern-5-oversized-tasks`
- Over-specified specs (HOW in spec, not WHAT) → `anti-patterns.md#anti-pattern-13-over-specified-specs`
- Implicit assumptions baked into ACs → `anti-patterns.md#anti-pattern-14-implicit-assumptions-never-challenged`
- Critics run in the generating context → `anti-patterns.md#anti-pattern-15-running-critics-in-the-generating-context`
- Tasks without AC references → `anti-patterns.md#anti-pattern-16-tasks-without-acceptance-criteria-references`
- Specifying against an imagined system → `anti-patterns.md#anti-pattern-17-specifying-against-an-imagined-system`
- Letting the context window fill up → `anti-patterns.md#anti-pattern-18-letting-the-context-window-fill-up`
- Shipping code nobody understands → `anti-patterns.md#anti-pattern-19-shipping-code-nobody-understands`
- Delta spec without a baseline → `anti-patterns.md#anti-pattern-20-delta-spec-without-a-baseline`
- Reconciling drift instead of fixing it → `anti-patterns.md#anti-pattern-21-reconciling-drift-instead-of-fixing-it`
- Running one ceremony level for everything → `anti-patterns.md#anti-pattern-22-running-one-ceremony-level-for-everything`

---

## By Phase

| Phase | Templates | Prompts | Details | Quality |
|-------|-----------|---------|---------|---------|
| 0 — Constitution | constitution.md | constitution-prompts | workflow-phases#phase-0 | Gate 0 |
| 0.5 — Research | research.md | research-prompts | workflow-phases#phase-05 | Gate R |
| 1 — Specify | spec.md | specify-prompts | workflow-phases#phase-1 | Gate 1 |
| 2 — Plan | plan.md, data-model.md, contracts | plan-prompts | workflow-phases#phase-2 | Gate 2 |
| 3 — Tasks | tasks.md | tasks-prompts | workflow-phases#phase-3 | Gate 3 |
| 4 — Implement | progress.md | implement-prompts | workflow-phases#phase-4 | Gate 4 |
| 5 — Validate | — | validate-prompts, linear-walkthrough | workflow-phases#phase-5 | Gate 5, Gate C |

---

## File List

| File | Purpose | Size |
|------|---------|------|
| `SKILL.md` | Entry point, workflow overview | Medium |
| `references/artifact-templates.md` | Copy-paste templates for all artifacts | Long |
| `references/prompt-patterns.md` | Prompts for every phase and scenario | Long |
| `references/workflow-phases.md` | Step-by-step phase instructions | Long |
| `references/quality-gates.md` | Checklists and CI/CD integration | Medium |
| `references/output-formats.md` | Formats and budgets for everything the user reads | Medium |
| `references/ai-agent-patterns.md` | Multi-agent patterns and context management | Medium |
| `references/anti-patterns.md` | Failure modes and fixes | Medium |
| `references/quick-reference.md` | One-page cheat sheet | Short |
| `references/INDEX.md` | This file | Short |
