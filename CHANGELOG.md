# Changelog

All notable changes to the **Spec-Driven Development Skill** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
