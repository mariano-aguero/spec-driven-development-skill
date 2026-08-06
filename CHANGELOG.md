# Changelog

All notable changes to the **Spec-Driven Development Skill** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.7.0] — 2026-08-06

Enforcement and interop release. Rules that were requests become mechanical where they can
be; the constitution reaches tools that never heard of this workflow; and the spec itself
gets tested. With a matching anti-pattern, because automating gates is how teams lose them.

### Added

- **`references/enforcement.md`** — a new reference on making rules bind.
  - The **enforcement ladder**: asked (prompt) → checked (CI) → blocked (hook), with a table
    mapping every rule in this skill to the highest rung available to it. Promote a rule only
    when it is objectively decidable *and* has been violated more than once.
  - **A working contract lock.** `contracts/` were declared frozen after Gate 2 but enforced
    only by convention. A PreToolUse hook now rejects writes to `specs/*/contracts/**` while
    `spec.md` reads `Status: Approved`, with an error that names the rule, the rationale, and
    `/sdd:amend` as the sanctioned path.
  - Hooks per phase — lint, typecheck, banned-pattern scans, uncommitted-work checks — with
    the rule that a hook must fail loudly *and carry the fix*.
  - Git worktrees for `[P]` tasks, including the caveat that they isolate the filesystem and
    not the database, Redis, or ports.
  - **The `AGENTS.md` bridge.** `constitution.md` holds the rules and their rationale;
    `AGENTS.md` is *derived* from it — never edited directly, never forked — so the rules
    reach the agents that read it natively. A section maps what crosses over and what stays,
    plus a CI check for staleness. Includes the measured asymmetry that human-authored agent
    instruction files help while generated ones frequently hurt, and why: the value is
    concentrated in the *surprising* rules, and padding dilutes them.
  - **Enforcement theater** — the failure modes mechanization introduces.
- **`/sdd:checklist [domain]`** — generated per-feature, per-domain checklists that test the
  **spec**, not the software. Gates are universal and generic; a checklist covers the risk
  surface this feature has and the last one didn't.
  - The rule that makes them work: every item must be answerable by reading the spec alone.
    Banned verbs (*displays*, *renders*, *clicks*, *works*) mark items that drifted into
    testing behavior, which the ACs already do.
  - Findings marked `[Gap]` / `[Ambiguity]` / `[Conflict]` / `[Assumption]`, generated across
    all five scenario classes so the checklist does not reproduce the spec's blind spot.
  - Eight domain starting points; checklist output format with a 15-line response budget.
- **Optional EARS syntax** for acceptance criteria — the five patterns (ubiquitous,
  event-driven, state-driven, unwanted behavior, optional feature), positioned as a complement
  rather than a replacement: EARS states the requirement, Given/When/Then makes it verifiable.
  Adopt per project in `constitution.md`, not per feature.
- **AP-23 — Mechanizing the Gates Away**, the failure this release makes possible: mechanical
  checks verify that rules were followed, never that the rules were right. A CI job must never
  inherit a gate's name.
- Eval `08-mechanization-limits` — a request to automate every gate, which should be partly
  fulfilled and partly refused.

### Changed

- `SKILL.md` gains checklists, hooks, and the `AGENTS.md` bridge in eight lines and stays
  under budget at 313 lines / ~3,993 tokens.
- `quick-reference.md` gains the enforcement ladder and the `/sdd:checklist` command.

## [1.6.0] — 2026-08-06

Brownfield release. Three additions that answer the standing criticism of spec-driven
development — that it is greenfield-shaped, that specs go stale, and that it applies the same
ceremony to a copy fix and a payment migration.

### Added

- **Ceremony levels S / M / L.** Process intensity is now chosen per change, with an objective
  decision rule (start at M; drop to S only if *all* of one-session / ≤3 files / no contract or
  schema change / trivially revertible hold; move to L if *any* of auth-or-payments /
  irreversible migration / regulated domain / unread code holds). The tiebreaker is
  reversibility, not size.
  - A gate matrix in `quality-gates.md` maps each level to the gates it requires. Gates are not
    optional at the level you chose — choosing S is a decision to accept less verification,
    while skipping a gate at M is not.
- **Delta specs for brownfield changes.** `spec.md` gains a `Mode:` header. In delta mode the
  spec declares a `Baseline:` and lists only what moves, with every AC labelled `[ADDED]`,
  `[MODIFIED]`, `[REMOVED]`, or `[UNCHANGED]` alongside its MoSCoW label.
  - `[MODIFIED]` and `[REMOVED]` quote the previous behavior verbatim and state migration and
    deprecation; `[UNCHANGED]` is the regression suite that makes a short spec safe to be short.
  - A **Blast Radius** table maps each modified item to its dependents and the AC verifying them.
  - A baseline must resolve to a prior spec version or cited `research.md` findings — never
    "the current code". Nine delta-specific checks added to Gate 1.
  - Folding rule: at most two unfolded deltas per baseline before consolidating.
- **`/sdd:reconcile`** — the missing half of the drift loop, for code that changed outside the
  workflow via hotfix, dependency upgrade, or another team's refactor.
  - Classifies each difference as `INTENTIONAL`, `EXTERNAL`, `DRIFT`, or `AMBIGUOUS`. The
    governing rule: **absence of evidence is drift.** `INTENTIONAL` requires a quoted commit,
    PR, or ticket; without one the difference gets fixed in the code, not written into the spec.
  - **Proposes only.** It edits nothing, there is no "accept all", and approved spec updates
    cascade through `/sdd:amend` rather than editing `spec.md` alone.
  - Reconcile report format with a 30-line budget in `output-formats.md`.
- Three anti-patterns: **AP-20** Delta Spec Without a Baseline, **AP-21** Reconciling Drift
  Instead of Fixing It, **AP-22** Running One Ceremony Level for Everything.
- Two evals: `06-ceremony-level` (two changes, different levels) and `07-reconcile-evidence`
  (a reasonable-sounding request to launder drift).
- `examples/specs/magic-link-shorten-ttl/spec.md` — a worked delta spec against the existing
  magic-link example, with baseline assertions, migration notes, and a blast radius table.
- "Writing Concrete Acceptance Criteria" in `artifact-templates.md`, with vague-to-measurable
  conversions and the two words that signal an unfinished AC: *properly* and *appropriate*.

### Changed

- `SKILL.md` gains the ceremony dial, delta mode, and the spec-vs-code disagreement table while
  **staying under budget at 309 lines / ~3,935 tokens** — achieved by merging two overlapping
  per-phase tables into one, compressing the drift-prevention list that duplicated the phase
  rules, and moving the vague-requirements table to `artifact-templates.md` where ACs are written.
- Spec levels (spec-first / spec-anchored / spec-as-source) moved from `SKILL.md` to the README.
  It is a positioning taxonomy, and having two three-level scales in the entry point invited
  confusion with the ceremony dial.

## [1.5.0] — 2026-08-05

Research becomes a first-class phase, context management becomes an explicit discipline, and
comprehension gets its own gate. Alongside that, the skill's own mechanics were measured
against Anthropic's authoring spec and brought back inside budget, and every output the user
reads now has a defined format.

No existing phase changed its artifacts, commands, or naming — the methodology additions are
additive, and the mechanical changes are reductions.

### Added — methodology

- **Phase 0.5 — Research** (`/sdd:research`), a conditional per-feature phase producing
  `specs/[feature]/research.md`: a ~200-line map of how the system works **today**, with a
  `file:line` citation required for every claim.
  - `research.md` template rewritten around Problem Summary, Relevant Files, Information
    Flow, Key Findings, Existing Constraints Discovered, Prior Art, Open Questions for the
    Spec, and Not Investigated.
  - Codebase Research prompt (Format A and Format B), Research Consolidation prompt, and
    Research Verification prompt.
  - Research Verifier critic agent — audits citations against real code in a clean context.
  - **Gate R** with citation spot-checks, completeness, and descriptive-only enforcement.
  - Ready-to-use CI check that fails the build when a `file:line` citation points to a
    missing file or an out-of-range line, or when a research doc has no citations at all.
  - Leverage model documented: ~200 lines of research prevent thousands of wrong lines of
    code; generated code prevents one wrong line at a time.
- **Context Engineering** section in `ai-agent-patterns.md`: artifacts as compaction
  checkpoints, the 40–60% utilization band, progressive disclosure, subagent noise
  isolation, attention decay, and a failure-signature table.
  - `progress.md` template for handover across context resets.
  - Context Handover and Session Resume prompts.
  - Context budget table in Phase 4 and in the quick reference.
- **Gate C — Comprehension Check** in `quality-gates.md`, plus the Linear Walkthrough prompt
  and a new Step 5.5 in Phase 5. Green tests prove correctness; the walkthrough proves the
  team can maintain what shipped.
- Three anti-patterns: **AP-17** Specifying Against an Imagined System, **AP-18** Letting the
  Context Window Fill Up, **AP-19** Shipping Code Nobody Understands.
- `examples/specs/magic-link-login/research.md` — a worked Phase 0.5 artifact showing cited
  findings, discovered constraints, and questions deferred to the spec.

### Added — skill mechanics and output

- **`references/output-formats.md`** — a new reference defining every output the *user* reads,
  each with a line budget: gate verdict, critic findings, traceability matrix, drift report,
  analyze report, status report, linear walkthrough, phase completion summary, and an explicit
  "what never to print" list. Three governing rules: write artifacts and show verdicts, lead
  with the verdict, and express confidence as `[CONFIRMED]` / `[VERIFY]` — never a percentage.
- **`/sdd:status`** — reports phase state and the single next action in 12 lines, derived from
  files on disk rather than conversation memory.
- **`evals/`** — five behavioral scenarios (triggering, right-sizing, research-first, gate
  enforcement, output discipline) covering the authoring checklist's ≥3 requirement.
- `## Contents` table of contents in all nine reference files, so partial reads still reveal
  the full scope of a file.
- Binary confidence markers on all eleven critic output formats.
- Budgets section in `CLAUDE.md` with the measurement commands to verify them per release.
- "What It Costs" section in the README: ~120 tokens of metadata per conversation, ~3,700
  when the skill activates, ~23,000 for a full feature.

### Changed

- `SKILL.md`: new "Context Is the Real Constraint", "Comprehension Debt", and "Talking to the
  User" sections; Quick Start is now five steps; drift-prevention list leads with research.
- **`SKILL.md` reduced to 309 lines / ~3,700 tokens** — the per-phase gate checklists were
  duplicating `quality-gates.md` and the inline task prompt was duplicating
  `prompt-patterns.md`; Phases 1–5 now lead with a summary table and delegate the detail.
- **Frontmatter `description` rewritten** to the `<what it does>. Use when <triggers>.`
  pattern and cut from ~202 to ~124 tokens. It previously stated only when to use the skill,
  never what the skill does, and carried a 28-item keyword list.
- `validation.md` added as the Phase 5 traceability artifact; `walkthrough.md` is now a
  declared artifact rather than an undocumented side effect.
- Phase 1 and Phase 2 read `research.md` when present; a spec that contradicts verified
  research is wrong until the research is disproven.
- README workflow diagram includes Phase 0.5 and Gate R; Key Principles gain research-first,
  front-loaded review, intentional compaction, and comprehension.
- `examples/README.md` documents the research step in the build narrative.

## [1.4.1] — 2026-05-10

Repository infrastructure and documentation pass. No changes to the SDD methodology, prompts, templates, or workflow.

### Added

- `CHANGELOG.md` extracted from the README in Keep-a-Changelog format.
- Dynamic GitHub release and last-commit badges in the README.
- `examples/` directory with a complete reference feature: magic-link login covering `constitution.md`, `spec.md`, `plan.md`, `data-model.md`, `contracts/`, and `tasks.md`.
- `.github/ISSUE_TEMPLATE/` with bug report, feature request, and anti-pattern submission forms.
- `.github/PULL_REQUEST_TEMPLATE.md` with self-checklist and version-impact tags.
- CI workflow (`.github/workflows/lint.yml`) running markdownlint-cli2 and lychee link check on every push and PR.
- `.markdownlint.json` and `lychee.toml` workflow configs.
- README "Why SDD?" comparison table, mermaid workflow diagram, AI tool compatibility table.

### Changed

- README hook and structure rewritten to surface Phase 0 (Constitution) in the workflow overview.
- README version history collapsed in favor of a link to `CHANGELOG.md`.

### Fixed

- Markdownlint compliance across all existing markdown files (MD022, MD031, MD032, MD058 auto-fixes).

## [1.4.0] — 2026-05-09

### Added

- **AP-15**: Critics in generating context (anti-pattern when the generating AI also critiques without isolation).
- **AP-16**: Tasks without AC references (every implementation task must trace back to an acceptance criterion).
- **Constitution from Existing Codebase** prompt — bootstrap `constitution.md` for in-flight projects.
- **Cross-Feature Conflict Detector** prompt — surface conflicts between features before they ship.

### Changed

- **Gate 3** updated with implementation task AC traceability check.
- **INDEX.md** updated with new anti-pattern and prompt references.

## [1.3.3] — 2026-04-XX

### Changed

- `INDEX.md`: Phase 0 added to the *By Phase* table.
- `prompt-patterns.md`: `research.md` documented as optional input in the Plan Generation Prompt.
- `workflow-phases.md` Phase 2: critic agents step added before human review.
- `anti-patterns.md` AP-3: fix list updated to the 7-item canonical context.

## [1.3.2] — 2026-04-XX

### Changed

- `INDEX.md`: AP-14 indexed; 4 missing `ai-agent-patterns` links added.
- `SKILL.md` Phase 1: Boundaries listed in `spec.md` contents.
- `quick-reference.md` and `workflow-phases.md`: `research.md` documented as optional Phase 2 input.

## [1.3.1] — 2026-04-XX

### Changed

- **Boundaries** moved before ACs in the `spec.md` template (constraint-first thinking).
- **Risks Critic** added to the Phase 2 critic agent set.
- **Boundaries** included in per-task context (Phase 4).
- `/sdd:amend` referenced in the Spec Regeneration Pattern.
- `research.md` clarified as a pre-existing input (not an output of `/sdd:plan`).
- Skill activation keywords expanded.

## [1.3.0] — 2026-04-XX

### Added

- **Assumptions Surface Prompt** (pre-Phase 1) — force the AI to list implicit assumptions before any AC is written.
- **Boundaries** section in the `spec.md` template (Always do / Ask first / Never do).
- **Risks** section in the `plan.md` template with mitigations for High-impact items.
- **Living Document** section in `SKILL.md`.
- **Anti-Pattern 14**: Implicit Assumptions Never Challenged.
- *"Surface assumptions"* hard rule in `quick-reference.md`.

## [1.2.3] — 2026-03-18

### Fixed

- Fifth round of review fixes from external code review.

## [1.2.2] — 2026-03-18

### Added

- `/sdd:amend` prompt (2-step cascade update).
- `constitution.md` in Drift Detection checklist.
- Constitution Critic for Phase 2.
- CLARIFY output artifact in the workflow diagram.
- Spec Reference in the `data-model.md` template.

### Fixed

- `contracts/` LOCKED label phase fixes.

## [1.2.1] — 2026-03-18

### Changed

- Critic agent output format standardized in `ai-agent-patterns.md`.
- Gate 0 and Gate 1 summary wording.
- Clarify → Gate 1 references added in `workflow-phases.md`.
- Gate 2 migrations check added.
- `[WONT]` AC example added.

### Fixed

- `contracts/` LOCKED phase label fix.

## [1.2.0] — 2026-03-18

### Added

- **Post-Clarify spec update prompt**.
- **Migrations** section in the `data-model.md` template.
- Constitution `[PENDING]` blocking check for feature specs.
- Standardized critic agent output format.
- **Anti-Pattern 13**: Over-Specified Specs.
- **Quick Start** onboarding section in `SKILL.md`.

## [1.1.0] — 2026-03-XX

### Added

- **Constitution phase** (`/sdd:init`) — project-level immutable constraints.
- **MoSCoW priorities** for every AC: `[MUST]` / `[SHOULD]` / `[COULD]` / `[WONT]`.
- **Clarify step** — resolve `[NEEDS CLARIFICATION]` items before Plan.
- **Spec levels taxonomy** — spec-first, spec-anchored, spec-as-source.
- **Research subagents** — parallel research before Phase 1.
- **Spec recovery point** — recover from accumulated drift.
- **`/sdd:analyze`** command — cross-feature conflict detection.
- 12 anti-patterns documented.

## [1.0.0] — 2026-03-18

### Added

- Initial public release.
- 5-phase workflow: Specify → Plan → Tasks → Implement → Validate.
- 8 reference files: templates, prompts, workflow phases, quality gates, AI-agent patterns, anti-patterns, quick reference, navigation index.
- Copy-paste artifact templates for `spec.md`, `plan.md`, `data-model.md`, `contracts/`, `tasks.md`.
- Prompt patterns for every phase and scenario.
- Quality gate checklists with CI/CD integration examples.

[Unreleased]: https://github.com/mariano-aguero/spec-driven-development-skill/compare/v1.4.1...HEAD
[1.4.1]: https://github.com/mariano-aguero/spec-driven-development-skill/compare/v1.4.0...v1.4.1
[1.4.0]: https://github.com/mariano-aguero/spec-driven-development-skill/compare/v1.3.3...v1.4.0
[1.3.3]: https://github.com/mariano-aguero/spec-driven-development-skill/compare/v1.3.2...v1.3.3
[1.3.2]: https://github.com/mariano-aguero/spec-driven-development-skill/compare/v1.3.1...v1.3.2
[1.3.1]: https://github.com/mariano-aguero/spec-driven-development-skill/compare/v1.3.0...v1.3.1
[1.3.0]: https://github.com/mariano-aguero/spec-driven-development-skill/compare/v1.2.3...v1.3.0
[1.2.3]: https://github.com/mariano-aguero/spec-driven-development-skill/compare/v1.2.2...v1.2.3
[1.2.2]: https://github.com/mariano-aguero/spec-driven-development-skill/compare/v1.2.1...v1.2.2
[1.2.1]: https://github.com/mariano-aguero/spec-driven-development-skill/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/mariano-aguero/spec-driven-development-skill/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/mariano-aguero/spec-driven-development-skill/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/mariano-aguero/spec-driven-development-skill/releases/tag/v1.0.0
