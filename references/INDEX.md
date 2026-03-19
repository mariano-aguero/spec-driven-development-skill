# Reference Index

Navigation map for all SDD reference files.

---

## By Topic

### Getting started
- Overview and when to use → `SKILL.md`
- Quick Start (4-step onboarding) → `SKILL.md#quick-start`
- Key Practice: Reframe Vague Requirements → `SKILL.md#key-practice-reframe-vague-requirements`
- Living Document (spec versioning, commit, archive) → `SKILL.md#living-document`
- One-page cheat sheet → `quick-reference.md`

### Templates (copy-paste ready)
- constitution.md template → `artifact-templates.md#constitutionmd-template`
- spec.md template (incl. Boundaries section) → `artifact-templates.md#specmd-template`
- plan.md template (incl. Risks section) → `artifact-templates.md#planmd-template`
- data-model.md template → `artifact-templates.md#data-modelmd-template`
- contracts/[endpoint].md template → `artifact-templates.md#contractsendpointmd-template`
- tasks.md template → `artifact-templates.md#tasksmd-template`

### Prompts (copy-paste ready)
- Phase 0 — Constitution prompts → `prompt-patterns.md#phase-0--constitution-prompts`
- Phase 1 — Surface assumptions (pre-spec) → `prompt-patterns.md#assumptions-surface-prompt`
- Phase 1 — Specify prompts → `prompt-patterns.md#phase-1--specify-prompts`
- Phase 1 — Post-Clarify spec update → `prompt-patterns.md#post-clarify-spec-update-prompt`
- Phase 2 — Plan prompts → `prompt-patterns.md#phase-2--plan-prompts`
- Phase 3 — Tasks prompts → `prompt-patterns.md#phase-3--tasks-prompts`
- Phase 4 — Implement prompts → `prompt-patterns.md#phase-4--implementation-prompts`
- Phase 5 — Validate prompts → `prompt-patterns.md#phase-5--validate-prompts`
- Multi-agent review (standardized output) → `prompt-patterns.md#multi-agent-review-pattern`
- Amend (requirements change cascade) → `prompt-patterns.md#amend-prompt-sddamend--run-when-requirements-change`

### Phase details (step-by-step)
- Phase 0 — Constitution → `workflow-phases.md#phase-0--constitution`
- Phase 1 — Specify → `workflow-phases.md#phase-1--specify`
- Phase 2 — Plan → `workflow-phases.md#phase-2--plan`
- Phase 3 — Tasks → `workflow-phases.md#phase-3--tasks`
- Phase 4 — Implement → `workflow-phases.md#phase-4--implement`
- Phase 5 — Validate → `workflow-phases.md#phase-5--validate`

### Quality and review
- Per-phase checklists → `quality-gates.md#per-phase-checklists`
- Confidence-based review thresholds → `quality-gates.md#confidence-based-review-thresholds`
- CI/CD integration → `quality-gates.md#cicd-integration`
- Drift classification → `quality-gates.md#spec-drift-classification`

### AI and agent patterns
- Context management → `ai-agent-patterns.md#context-management`
- Subagent review pattern → `ai-agent-patterns.md#subagent-review-pattern`
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

---

## By Phase

| Phase | Templates | Prompts | Details | Quality |
|-------|-----------|---------|---------|---------|
| 0 — Constitution | constitution.md | constitution-prompts | workflow-phases#phase-0 | Gate 0 |
| 1 — Specify | spec.md | specify-prompts | workflow-phases#phase-1 | Gate 1 |
| 2 — Plan | plan.md, data-model.md, contracts | plan-prompts | workflow-phases#phase-2 | Gate 2 |
| 3 — Tasks | tasks.md | tasks-prompts | workflow-phases#phase-3 | Gate 3 |
| 4 — Implement | — | implement-prompts | workflow-phases#phase-4 | Gate 4 |
| 5 — Validate | — | validate-prompts | workflow-phases#phase-5 | Gate 5 |

---

## File List

| File | Purpose | Size |
|------|---------|------|
| `SKILL.md` | Entry point, workflow overview | Medium |
| `references/artifact-templates.md` | Copy-paste templates for all artifacts | Long |
| `references/prompt-patterns.md` | Prompts for every phase and scenario | Long |
| `references/workflow-phases.md` | Step-by-step phase instructions | Long |
| `references/quality-gates.md` | Checklists and CI/CD integration | Medium |
| `references/ai-agent-patterns.md` | Multi-agent patterns and context management | Medium |
| `references/anti-patterns.md` | Failure modes and fixes | Medium |
| `references/quick-reference.md` | One-page cheat sheet | Short |
| `references/INDEX.md` | This file | Short |
