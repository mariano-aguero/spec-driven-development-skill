# Research: v2 Agent-Native Spec-Driven Development

Status: Draft
Date: 2026-11-02

## Problem Summary

The skill (v1.7.0) describes a sound workflow but assumes a human at every gate, a single
agent working in one interactive session, and checks that live as prose. How teams build with
agents in late 2026 has moved past that: work is handed to background and cloud agents, runs in
parallel worktrees, continues overnight, and is trusted only when it arrives with evidence. This
document records what the skill does today and what the market and the strongest practitioner
material do, so the spec can be written as a delta against a cited baseline.

## Relevant Files

| File | Role | Key entry point |
|------|------|-----------------|
| `SKILL.md` | Entry point, phase table, ceremony levels | gate matrix `SKILL.md:56`, human approval rule `SKILL.md:157` |
| `references/quality-gates.md` | Gate checklists per level | level matrix `references/quality-gates.md:25-41` |
| `references/enforcement.md` | Ladder, contract lock hook, worktrees, `AGENTS.md` | lock condition `references/enforcement.md:107` |
| `references/ai-agent-patterns.md` | Context engineering, critic agents | critics `references/ai-agent-patterns.md:155-300` |
| `references/artifact-templates.md` | Templates for every artifact | spec `:160`, delta `:250`, research `:553` |
| `evals/*.json` | 8 behavioral scenarios | `evals/01-triggering.json` |
| `CLAUDE.md` | Architecture, budgets, design decisions | no-runtime decision `CLAUDE.md:118` |

## Key Findings: the skill today

### F-1: The contract lock blocks its own phase
The hook blocks writes to `contracts/` when `spec.md` has `Status: Approved`
(`references/enforcement.md:107`). Specs are marked Approved at Gate 1
(`examples/specs/magic-link-login/spec.md:3`), so the hook blocks Phase 2, the phase that writes
contracts. The rule it implements says contracts freeze after Gate 2 (`SKILL.md:201`). The
`.amend-in-progress` sentinel it honors (`references/enforcement.md:105`) is never created by the
amend prompt. No template defines a `Status` lifecycle beyond `Draft`
(`references/artifact-templates.md:165,263,562`).
**Consequence:** the only mechanical check the skill ships is wrong.

### F-2: The gate matrix contradicts itself
`SKILL.md:56` says level S is "Self-check before merge" and M runs gates "1, 2, 3, 5".
`references/quality-gates.md:25-41` says M includes Gate 4 and S has "fewer gates, not
self-approving ones".
**Consequence:** an agent reading only the entry point applies different rules than one that
reads the gates file.

### F-3: Every gate requires a human
"Every gate is a human approval point. AI cannot approve its own output" (`SKILL.md:157`).
**Consequence:** the workflow cannot run in a background agent, overnight, or across a queue of
parallel tasks without a person waking up for Gates 3, 4 and 5, which check facts a machine can
check better.

### F-4: Commands do not exist
`/sdd:*` commands are named throughout, but the repo has no `commands/` directory and no plugin
manifest. Typing `/sdd:specify` in an agent that installed the skill returns an unknown command.
**Consequence:** the skill's main entry points are aspirational.

### F-5: No runtime by design
"Why no runtime components? This skill is documentation only" (`CLAUDE.md:118`). CI scripts in
`quality-gates.md` are templates to adapt, not shipped tooling.
**Consequence:** every check is at rung 1 of the skill's own enforcement ladder
(`references/enforcement.md:18`): requested, not checked.

### F-6: Verification stops at "tests pass"
No template, gate or prompt asks for proof that a test can fail, for the failure content, or for
a non-tautological expected value. Gate 4 at level S is "tests pass"
(`references/quality-gates.md:33`). There is no critic for code; critics exist only for research,
spec and plan (`references/ai-agent-patterns.md:169-300`).

### F-7: Critics are personas on one model, reviewing prose
Critic findings are tagged `[CONFIRMED]` when the critic can cite a location
(`references/ai-agent-patterns.md:162`). Nothing requires a finding to be reproduced.

### F-8: Evals cannot run
8 scenarios exist (`evals/`), but there is no runner, no baseline run without the skill, and the
fixtures they reference (`src/`, `specs/data-export/`, `.claude/settings.json`) are not in the
repo.

### F-9: Stale and inconsistent surface
`README.md:271` says latest is v1.4.0; `README.md:185` says five eval scenarios (there are 8).
`/sdd:analyze` and `/sdd:status` are missing from `SKILL.md`. About 600 em dashes across prose.
References total about 32k words; `prompt-patterns.md` and `anti-patterns.md` are the largest.

### F-10: Archive does not produce a current-state spec
Completed specs move to `specs/archive/` (`SKILL.md:279`). Delta specs need a baseline, but no
artifact holds the merged current behavior of a capability, so the baseline is either an old
spec plus every later delta, or fresh research.

## Key Findings: the market (2026-11)

| Tool | Signal | What it does better | Where it is weak |
|------|--------|---------------------|------------------|
| GitHub Spec Kit | 145k stars, v1.2.6 | Real commands in ~45 agents, `[P]` tasks, YAML workflow engine, checklist gating in `implement` | No reconcile in core (docs say so), no delta specs, heaviest ceremony |
| OpenSpec | 74k stars, v1.16 | Delta specs merged into `openspec/specs/` on archive; `openspec validate --strict` for CI and pre-commit | No cross-artifact review, no parallelism, telemetry on by default |
| BMAD Method | 55k stars, v6.12 | Ceremony chosen after investigating the change; scripted readiness gate; installs via `npx skills add` | Token cost, planning without code, renames every release |
| Kiro (AWS) | Paid IDE | EARS, property-based tests derived from requirements, hooks, task waves from a dependency graph | Manual sync, lock-in to one IDE, ceremony on small fixes |
| Agent OS v3 | 5.6k stars | Standards discovered from code and injected per task | No durable spec, no verification |
| Tessl | Pivoted | Now a skills registry with evals; spec-as-source still closed beta | Not comparable |

Sources: `github.com/github/spec-kit`, `github.com/Fission-AI/OpenSpec`,
`github.com/bmad-code-org/BMAD-METHOD`, `kiro.dev/docs/specs`, `github.com/buildermethods/agent-os`,
`docs.tessl.io`.

**Gap no tool fills:** proof that the tests behind an acceptance criterion can fail, review
findings that must be reproduced, and a spec shaped as a handoff a cold background agent can
finish without a conversation.

## Key Findings: practitioner material (pstack, `github.com/cursor/plugins/tree/main/pstack`)

### P-1: A check you have never seen fail proves nothing
Each property is shown failing on a broken variant of the code it guards
(`skills/create-formal-verification-skill/SKILL.md`). Tests are judged by two imagined edits:
break the behavior (the test must go red) and change only the internals (it must stay green),
with four named sources of tautology (`skills/principle-test-behavior-not-implementation/SKILL.md`).

### P-2: Only findings proven by a run survive
Adversaries try to break the change; each finding carries the command, its output and the output
the intent requires; the coordinator reruns it; everything else is dropped and listed with a
reason (`skills/interrogate/SKILL.md`). The agent that judges a change is never the one that
wrote it (`docs/guide/06-verify-and-ship.md`).

### P-3: Do not polish an abstract plan
pstack has no planning skill on purpose. Open questions are answered with throwaway prototypes;
adversarial review of a plan with no code "invents risks that will never happen"
(`docs/guide/04-design.md`, `docs/guide/10-recipes-and-pitfalls.md`).

### P-4: The overnight contract
A safe handoff has a goal, a finish condition that can pass or fail, permissions, an isolated
worktree, an escape hatch, and a decision log audited afterwards. "A duration is not a finish
condition" (`docs/guide/07-overnight.md`).

### P-5: Evidence ladder for facts
Said so; pointed at the line; showed the bad case cannot happen; ran it; reproduced it in the
app. State where each load-bearing fact stopped (`skills/blast-radius/SKILL.md`).

### P-6: Caller usage first, design twice, know when to scrap
Usage is written before types; at least two structurally distinct candidates; scrap the design
when the same workaround repeats, types need casts, or deviations share a shape
(`skills/architect/SKILL.md`).

### P-7: Rules as invariants
Reader-facing rules become model invariants; the diagram is generated from the checked model so
they cannot drift; each bug path is replayed against real code (`skills/statechart/SKILL.md`).

### P-8: Fix the repo, not the chat
A repeated correction becomes a type, lint, test or hook, and the prose instruction is deleted
(`skills/principle-encode-lessons-in-structure/SKILL.md`).

## Existing Constraints Discovered

- Budgets: description at most 1024 chars, `SKILL.md` under 500 lines and about 4000 tokens,
  TOC in every reference over 100 lines, every file one hop from `SKILL.md`, at least 3 evals
  (`CLAUDE.md`, Budgets).
- Install path is `npx skills add mariano-aguero/spec-driven-development-skill` and must keep
  working with no extra step.
- The skill must stay agent-agnostic: nothing may require one vendor's harness.
- Version policy: workflow or artifact format changes are a major bump (`CLAUDE.md`, Version
  Policy).
