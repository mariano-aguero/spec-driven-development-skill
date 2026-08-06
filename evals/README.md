# Evaluations

Behavioral tests for this skill. Markdownlint and the link checker verify that the files are
well-formed; these verify that the skill actually changes what an agent does.

Anthropic's skill-authoring checklist calls for at least three evaluations before a skill is
shared. Each file here is one scenario, in the standard shape:

The two hardest to pass are `06` and `07`: both present a request that sounds reasonable and
is wrong, and both reward pushing back over compliance.

```json
{
  "skills": ["spec-driven-development"],
  "query": "what the user says",
  "files": ["optional fixture paths"],
  "expected_behavior": ["observable things the agent should do"]
}
```

## Running them

There is no bundled runner — evaluation harnesses vary by team and by platform. Run each
scenario manually or wire it into your own harness:

1. Start a **fresh** session with only this skill installed
2. Paste the `query` verbatim, with any `files` present in the working directory
3. Score each `expected_behavior` item as pass or fail — no partial credit
4. Record the score; a scenario passes only when every item passes

Re-run the full set after any change to `SKILL.md` or to the frontmatter `description`.
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

## Adding a scenario

Add one whenever you observe a real failure. The scenario should reproduce the failure with
the skill as it was, and pass with the fix. Scenarios written from imagined failures tend to
test the documentation rather than the behavior.
