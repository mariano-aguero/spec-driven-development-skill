# Example: Magic-Link Login Feature

Every SDD artifact for one realistic feature, passwordless sign-in by magic link, plus a
follow-up change written as a delta spec and the current-state spec after that change merged.

Use it as a reference when filling in your own templates, as a starter to copy into a new
project, or to onboard teammates.

## Layout

The example mirrors the structure SDD expects at the root of a real project:

```text
examples/
├── README.md              ← you are here
├── constitution.md        ← Phase 0: project-level immutable constraints
└── specs/
    ├── magic-link-login/  ← one feature branch
    │   ├── research.md     (Phase 0.5: how the codebase works today, file:line cited)
    │   ├── spec.md         (Phase 1: requirements, MoSCoW ACs, boundaries)
    │   ├── plan.md         (Phase 2: architecture, invariants, risks, AC coverage map)
    │   ├── data-model.md   (Phase 2: entities, indexes, migrations)
    │   ├── contracts/
    │   │   └── auth-api.md (Phase 2: locked API contract)
    │   └── tasks.md        (Phase 3: atomic, test-first, dependency-mapped)
    ├── magic-link-shorten-ttl/
    │   └── spec.md         (Phase 1: DELTA spec against the feature above)
    └── _current/
        └── magic-link-login.md  (archive: the login capability after both merged)
```

## How this example was built

It follows the workflow as the skill describes it:

1. **Phase 0: Constitution.** A minimal `constitution.md` for a TypeScript/Postgres stack.
2. **Phase 0.5: Research.** The existing auth, rate-limiting, and job-queue code mapped into
   `research.md`: 5 cited findings, the constraints they impose, and three questions the
   codebase could not answer, which became the spec's open questions.
3. **Phase 1: Specify.** `spec.md` with 4 user stories, 6 acceptance criteria (MUST, SHOULD,
   COULD, WONT), a Boundaries block, and 3 error-case ACs.
4. **Clarify.** Every `[NEEDS CLARIFICATION]` resolved; none remain.
5. **Phase 2: Plan.** 4 components, an AC coverage map covering every MUST AC, three
   invariants stated so property-based tests can check them, and a risk table.
   `contracts/auth-api.md` locked after this phase.
6. **Phase 3: Tasks.** 11 atomic tasks, tests before implementation, dependency-mapped, `[P]`
   for parallelizable.
7. **A follow-up change in delta mode.** `specs/magic-link-shorten-ttl/spec.md` shortens the
   token TTL from 15 to 5 minutes. It declares the first spec as its baseline, asserts the
   five things it depends on, and carries three `[MODIFIED]` and three `[UNCHANGED]` ACs.
   It is about as long as the full spec here (110 lines vs 135) because a delta's length
   tracks the size of the change. Against an 800-line auth spec the same change would be
   just as long.
8. **Archive.** `specs/_current/magic-link-login.md` is the login capability after the delta
   merged in: AC-4, AC-5 and AC-E3 carry the new wording, each AC names its source, and a
   later delta spec can use the file as its `Baseline:`.
9. **Phase 4: Implement.** Out of scope for this docs-only repository. Each task in
   `tasks.md` is ready to feed into a fresh session with the prompts in
   `references/prompt-patterns.md`.

## What to read first

| If you want to… | Read |
|---|---|
| See how to constrain agent behavior at the project level | `constitution.md` |
| See cited, descriptive research before a spec exists | `specs/magic-link-login/research.md` |
| See how MoSCoW, Boundaries and error ACs combine | `specs/magic-link-login/spec.md` |
| See a plan trace every MUST AC to a component, and state invariants | `specs/magic-link-login/plan.md` |
| See how API contracts get locked | `specs/magic-link-login/contracts/auth-api.md` |
| See an atomic, test-first task breakdown | `specs/magic-link-login/tasks.md` |
| See a brownfield change that respecifies nothing | `specs/magic-link-shorten-ttl/spec.md` |
| See the current state after a delta merges | `specs/_current/magic-link-login.md` |

## Caveats

This is an example, not production code:

- File paths are placeholders. The `file:line` citations in `research.md` are illustrative;
  in a real project each one resolves to actual code, and Gate R checks that.
- The optional `decision_log.md` and `progress.md` are omitted (see
  `references/artifact-templates.md`).
- Phase 4 and Phase 5 are skipped, since this repository has no application code.
