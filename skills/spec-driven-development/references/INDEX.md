# Reference Index

Topic map for the reference files. Every file is one level deep from `SKILL.md`; load only
what the current phase needs. `SKILL.md` covers the overview, ceremony levels, the three ways
a spec and its code disagree, and the reply rules. [quick-reference.md](quick-reference.md)
is the one-page cheat sheet.

## Contents

- [By topic](#by-topic): templates, prompts, phase details, output formats, enforcement,
  quality, agent patterns, troubleshooting
- [By phase](#by-phase)

## By Topic

### Templates

- [Status lifecycle](artifact-templates.md#status-lifecycle), from `Draft` to `Archived`, and which gate sets each
- [constitution.md](artifact-templates.md#constitutionmd-template), [research.md](artifact-templates.md#researchmd-template) with the evidence ladder, [spec.md](artifact-templates.md#specmd-template) with Boundaries and the Handoff rules, [delta mode](artifact-templates.md#specmd-template-delta-mode)
- [plan.md](artifact-templates.md#planmd-template) with Caller Usage, Risks and optional Invariants, [data-model.md](artifact-templates.md#data-modelmd-template), [contracts/](artifact-templates.md#contractsendpointmd-template), [tasks.md](artifact-templates.md#tasksmd-template) with Creates/Modifies and waves
- [progress.md](artifact-templates.md#progressmd-template), [decision_log.md](artifact-templates.md#decision_logmd-template), [specs/_current/](artifact-templates.md#specs_currentcapabilitymd-template)
- [Writing concrete ACs](artifact-templates.md#writing-concrete-acceptance-criteria), the [Proof line](artifact-templates.md#proof-line-on-every-must-ac), and [optional EARS](artifact-templates.md#optional-ears-for-the-requirement-statement)

### Prompts

- Phase 0: [constitution prompts](prompt-patterns.md#phase-0-constitution-prompts), [constitution from an existing codebase](prompt-patterns.md#constitution-from-existing-codebase)
- Phase 0.5: [codebase research](prompt-patterns.md#codebase-research-prompt-sdd-research), [consolidation](prompt-patterns.md#research-consolidation-prompt), [verification for Gate R](prompt-patterns.md#research-verification-prompt-gate-r)
- Phase 1: [assumptions surface](prompt-patterns.md#assumptions-surface-prompt), [specify prompts](prompt-patterns.md#phase-1-specify-prompts), [delta specification](prompt-patterns.md#delta-specification-prompt-brownfield-changes), [post-clarify update](prompt-patterns.md#post-clarify-spec-update-prompt), [checklist generation](prompt-patterns.md#checklist-generation-prompt-sdd-validate-domain), [cold read](prompt-patterns.md#cold-read-prompt-before-gate-1)
- Phase 2 to 4: [plan](prompt-patterns.md#phase-2-plan-prompts), [tasks](prompt-patterns.md#phase-3-tasks-prompts), [implementation](prompt-patterns.md#phase-4-implementation-prompts), [context handover](prompt-patterns.md#context-handover-prompt-run-before-a-context-reset-not-after)
- Phase 5: [validate prompts](prompt-patterns.md#phase-5-validate-prompts), [linear walkthrough](prompt-patterns.md#linear-walkthrough-prompt), [adversary](prompt-patterns.md#adversary-prompt-phase-5-levels-m-and-l)
- Any time: [reconcile](prompt-patterns.md#reconcile-prompt-sdd-change), [amend](prompt-patterns.md#amend-prompt-sdd-change), [analyze](prompt-patterns.md#analyze-prompt-sdd-validate), [status](prompt-patterns.md#status-prompt-sdd-status), [multi-agent review](prompt-patterns.md#multi-agent-review-pattern), [cross-feature conflicts](prompt-patterns.md#cross-feature-conflict-detector)

### Phase Details

- [Phase 0](workflow-phases.md#phase-0-constitution), [Phase 0.5](workflow-phases.md#phase-05-research), [Phase 1](workflow-phases.md#phase-1-specify), [delta specs](workflow-phases.md#delta-specs), [Phase 2](workflow-phases.md#phase-2-plan), [Phase 3](workflow-phases.md#phase-3-tasks), [Phase 4](workflow-phases.md#phase-4-implement), [Phase 5](workflow-phases.md#phase-5-validate) with the current-state merge at archive
- [When to stop and amend the plan](workflow-phases.md#when-to-stop-and-amend-the-plan), [reconcile](workflow-phases.md#reconcile-when-code-changed-outside-the-workflow)

### Output Formats

- [Principles](output-formats.md#principles), [gate verdict](output-formats.md#gate-verdict) with `pass | fail | inconclusive`, [critic findings](output-formats.md#critic-findings), [checklist](output-formats.md#checklist)
- [Traceability matrix](output-formats.md#traceability-matrix), [drift report](output-formats.md#drift-report), [reconcile report](output-formats.md#reconcile-report), [analyze report](output-formats.md#analyze-report), [status report](output-formats.md#status-report), [linear walkthrough](output-formats.md#linear-walkthrough), [what never to print](output-formats.md#what-never-to-print)

### Enforcement

- [The ladder](enforcement.md#the-enforcement-ladder), [what can be mechanized](enforcement.md#what-can-be-mechanized-and-what-must-not), [the validator](enforcement.md#the-validator), [contract lock hook](enforcement.md#locking-contracts-for-real), [hooks per phase](enforcement.md#hooks-per-phase)
- [Worktrees for parallel tasks](enforcement.md#git-worktrees-for-parallel-tasks), [the AGENTS.md bridge](enforcement.md#the-agentsmd-bridge), [enforcement theater](enforcement.md#enforcement-theater)

### Quality and Review

- [Which gates apply at which level](quality-gates.md#which-gates-apply-at-which-ceremony-level), intent gates and evidence gates included
- [Per-phase checklists](quality-gates.md#per-phase-checklists), [generated checklists](quality-gates.md#generated-checklists-unit-tests-for-the-spec), [confidence thresholds](quality-gates.md#confidence-based-review-thresholds), [CI/CD](quality-gates.md#cicd-integration), [drift classification](quality-gates.md#spec-drift-classification)

### Agent Patterns

- [Context management](ai-agent-patterns.md#context-management), [context engineering](ai-agent-patterns.md#context-engineering), [spec as recovery point](ai-agent-patterns.md#spec-as-recovery-point), [spec regeneration](ai-agent-patterns.md#spec-regeneration-pattern)
- [Subagent review](ai-agent-patterns.md#subagent-review-pattern), [Phase 0.5 critic](ai-agent-patterns.md#phase-05-critic-agent), [Phase 2 critics](ai-agent-patterns.md#phase-2-critic-agents), [no-subagent fallback](ai-agent-patterns.md#no-subagent-fallback)
- [Parallel tasks](ai-agent-patterns.md#parallel-task-execution) and the [coordinator rule](ai-agent-patterns.md#parallel-task-rules), [research with parallel subagents](ai-agent-patterns.md#research-phase-with-parallel-subagents)
- [Tool selection per phase](ai-agent-patterns.md#ai-tool-selection-per-phase), [handling resistance](ai-agent-patterns.md#handling-ai-resistance)

### Troubleshooting

All 28 failure modes, each with a `Check:` line, are in [anti-patterns.md](anti-patterns.md). The most common:
[contracts modified](anti-patterns.md#anti-pattern-2-contracts-modified-during-implementation),
[one context for all tasks](anti-patterns.md#anti-pattern-3-one-context-for-all-tasks),
[imagined system](anti-patterns.md#anti-pattern-17-specifying-against-an-imagined-system),
[reconciling drift](anti-patterns.md#anti-pattern-21-reconciling-drift-instead-of-fixing-it),
[one level for everything](anti-patterns.md#anti-pattern-22-running-one-ceremony-level-for-everything),
[mechanizing the gates](anti-patterns.md#anti-pattern-23-mechanizing-the-gates-away),
[tests that cannot fail](anti-patterns.md#anti-pattern-24-tests-that-cannot-fail),
[unreproduced findings](anti-patterns.md#anti-pattern-25-unreproduced-review-findings),
[author passes own gate](anti-patterns.md#anti-pattern-27-the-author-passes-its-own-gate).

## By Phase

| Phase | Template | Gate |
|-------|----------|------|
| [0: Constitution](workflow-phases.md#phase-0-constitution) | constitution.md | Gate 0 |
| [0.5: Research](workflow-phases.md#phase-05-research) | research.md | Gate R |
| [1: Specify](workflow-phases.md#phase-1-specify) | spec.md | Gate 1 |
| [2: Plan](workflow-phases.md#phase-2-plan) | plan.md, data-model.md, contracts/ | Gate 2 |
| [3: Tasks](workflow-phases.md#phase-3-tasks) | tasks.md | Gate 3 |
| [4: Implement](workflow-phases.md#phase-4-implement) | progress.md | Gate 4 |
| [5: Validate](workflow-phases.md#phase-5-validate) | validation.md, walkthrough.md | Gate 5, Gate C |
