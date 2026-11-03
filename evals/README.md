# Evaluations

Behavioral tests for this skill. Markdownlint and the link checker verify that the files are
well-formed; these verify that the skill actually changes what an agent does.

Anthropic's skill-authoring checklist calls for at least three evaluations before a skill is
shared. Each file here is one scenario, in the standard shape:

The hardest to pass are `06`, `07`, and `08`: each presents a request that sounds reasonable
and is partly wrong, and each rewards delivering the sound part while naming the unsound part
— not blanket compliance, and not refusal.

```json
{
  "skills": ["spec-driven-development"],
  "query": "what the user says",
  "files": ["paths the scenario mentions, for humans"],
  "fixture": "fixtures/<scenario-id>",
  "expected_behavior": ["observable things the agent should do"]
}
```

`fixture` is the project the agent starts in. Scenarios without one start in an empty
directory. A `dot-claude/` folder inside a fixture is copied as `.claude/`, so tool config
can live in the repo without being ignored.

## Running them

```bash
node .github/scripts/run-evals.mjs --scenario 01-triggering --trials 1   # one scenario
node .github/scripts/run-evals.mjs                                       # everything, 3 trials
```

Requires Node 20+ and the `claude` CLI, logged in. No other dependencies.

For each scenario, condition and trial the runner copies the fixture into a fresh temp
directory. `with-skill` also gets `skills/spec-driven-development` under `.claude/skills/`.
It runs the agent on the `query`, then a separate judge grades every `expected_behavior`
item as pass or fail from the transcript and the list of files the run changed.

| Flag | Meaning |
|------|---------|
| `--scenario <id>` | One scenario, for example `07-reconcile-evidence` |
| `--trials <n>` | Trials per scenario and condition. Default 3 |
| `--condition <name>` | `with-skill` or `without-skill`. Default both |
| `--parallel <n>` | Trials running at once. Default 1 |
| `--out <file>` | Markdown report path. Default `evals/results/<date>.md`, JSON beside it |
| `--judge-only <file>` | Grade a saved transcript against `--scenario`, no agent run |

The agent and judge commands come from `EVAL_AGENT_CMD` and `EVAL_JUDGE_CMD`. Both read
their input on stdin. The agent command runs inside the temp project and prints its
transcript. The judge command prints `{"items":[{"pass":true,"reason":"..."}]}`. The
defaults call `claude -p` on sonnet. The agent gets only file tools plus `Skill`, and edits
are accepted only inside the temp directory. `--setting-sources project` keeps your own
skills and `CLAUDE.md` out of both conditions, so the skill is the only difference.

**Cost.** Each trial is a real agent session plus a judge call. The full suite is 12
scenarios, 2 conditions and 3 trials, so 72 sessions and 72 judge calls. Run one scenario
first, and use `--parallel` only if your rate limits allow it.

## Reading the results

The report has one row per scenario and condition: the overall pass rate (share of
checklist items passed, averaged over trials), the min to max spread across trials, how many
trials passed every item, and the pass rate of each item. The delta table subtracts the
without-skill rate from the with-skill rate.

- A positive delta means the skill helped on that scenario. A delta near zero means the
  scenario does not separate the skill from the baseline, or the skill did not fire.
- A delta is only meaningful when the spreads do not overlap. With overlapping spreads the
  difference may be noise, and one trial per cell proves nothing either way. Treat results
  as meaningful across trials only.
- A trial that errors (agent crash, invalid judge output) is excluded from the rates and
  shows in the JSON as an error.
- Transcripts are saved next to the report in `<report>-transcripts/` and are not committed.
  Read a few before trusting a number: the judge is a model too.

Re-run the full set after any change to `skills/spec-driven-development/SKILL.md` or to the frontmatter `description`.
Those two files are what determine discovery and first-turn behavior, so they carry the
highest regression risk.

## What each scenario targets

| File | Targets | Fails when |
|------|---------|-----------|
| `01-triggering.json` | Discovery — does the description activate the skill? | The agent starts coding without proposing the workflow |
| `02-right-sizing.json` | Negative triggering — does it stay out of the way? | The agent ceremonially specs a one-line fix |
| `03-research-first.json` | Phase 0.5 — brownfield work maps the code before specifying | The spec is written against an imagined system, or findings lack `file:line` |
| `04-gate-enforcement.json` | Gates are blocking, not decorative | The agent proceeds past an unresolved `[NEEDS CLARIFICATION]` |
| `05-output-discipline.json` | Output formats — verdict over wall-of-markdown | The agent pastes a freshly written artifact into the response |
| `06-ceremony-level.json` | The S/M/L dial — different changes get different process | Both changes get the same treatment, or level is chosen by size rather than reversibility |
| `07-reconcile-evidence.json` | Reconcile requires evidence and per-item approval | The spec is updated to match the code without evidence, laundering drift |
| `08-mechanization-limits.json` | Knows which gates a hook can and cannot replace | Every gate is wired to CI, or the automation request is refused outright |

## Adding a scenario

Add one whenever you observe a real failure. The scenario should reproduce the failure with
the skill as it was, and pass with the fix. Scenarios written from imagined failures tend to
test the documentation rather than the behavior.
