# Unit W1 — the workflow progress surface takes the MCP shape

## Role and engine

`sol` implementer route: you are the GPT-5.6 Sol engine, reached through `codex exec`, sandbox
`workspace-write`, working directory `/home/user/workflow`. You perform this assignment directly
and spawn nothing beyond the shell commands your work needs.

## Objective

`TaskProgress` carries exactly the MCP progress notification shape — required `progress`,
optional `total`, optional `message` — with the `unit` member removed and every consumer,
validator, cloner, fixture, test row, and guide surface updated in the same change, from the
committed `6ad5b53` baseline.

## Context

- Read before editing: `/home/user/workflow/AGENTS.md`; `.claude/rules/names.md`,
  `typescript.md`, `architecture.md`, `patterns.md`, `tests.md`, `documentation.md`,
  `quality.md`; `guides/workflow.md`. Skill: none.
- The user's rulings this unit executes: progress follows the MCP notification shape — an object
  carrying `progress` (number), `total` (optional number), and `message` (optional string) — and
  the `unit` member is removed with no compatibility shim and no loose ends.
- The terrain evidence with `file:line` pointers is at
  `/home/user/scaffold/.orkestrel/campaign/w-terrain-distillate.md`. Its load-bearing pointers
  were re-verified against source on 2026-08-25: `TaskProgress` at `src/core/types.ts:191-195`
  with its TSDoc at `:185-189`; the allowed-key row and the `unit` reads at
  `src/core/validators.ts:246`, `:253`, `:258`; the clone at `src/core/cloners.ts:122`,
  `:129-134`; the fixture rows at `tests/setup.ts:19-24`.
- The shape is adopted structurally. The package carries no `@orkestrel/mcp` dependency and
  gains none: the wire shape is copied, not imported.
- Baseline: the tree sits at `6ad5b53`, clean: the regenerated lockfile for the adopted scaffold 0.0.53 ranges landed on `main` and the branch matches it. Do not commit; the Orchestrator commits.
- Dependencies installed; network denied; never install.
- Scoped commands (`tsc`, `oxlint`, `oxfmt`, `vitest`) work in this sandbox. Read
  `vite.config.ts` for the core project name before running.

## The change

Types first, in `src/core/types.ts`:

- `TaskProgress` becomes `{ readonly progress: number; readonly total?: number;
  readonly message?: string }`. The TSDoc states: `progress` and an optional `total` are finite
  non-negative numbers; when `total` is present it is at least `progress`; `message` is optional
  observer-facing text describing the reported state.

Then, exactly the sites the distillate maps and any the suite reveals beyond them:

- `src/core/validators.ts` — `isTaskActivityInput` admits keys `progress`, `total`, `message`;
  the numeric bounds transfer to `progress` unchanged; a present `message` must be a non-empty
  string, the same check `unit` carried.
- `src/core/cloners.ts` — `cloneTaskActivity` freeze-copies the renamed members.
- `tests/setup.ts` — the `INVALID_TASK_ACTIVITIES` rows rename `current` to `progress` and the
  empty-`unit` row becomes an empty-`message` row.
- The test rows at `tests/src/core/validators.test.ts:21-22` and `:34-35`,
  `tests/src/core/cloners.test.ts:15-23`, `:43`, `:52-54`, and
  `tests/src/core/tasks/Task.test.ts:178-180`, `:194-197`, `:212` construct and expect the
  renamed shape; the unknown-key rejection row keeps rejecting, and add one row proving `unit`
  itself is refused as an unknown key — the removal's pin.
- `guides/workflow.md` — the Surface row at `:341`, the fences at `:287-301` and `:965-982`
  with the `total < current` prose at `:982`, and the example at `:972` state the renamed shape;
  a swept `grep -n "unit" guides/workflow.md src/core/types.ts src/core/validators.ts
  src/core/cloners.ts` afterwards returns no progress-member hit (the `RunnerEventMap` `unit`
  lifecycle event at `src/core/types.ts:2044` is a different axis and stays).

## Required proofs

1. **Red first.** Before the source change, land the renamed expectations in the suite and
   record the scoped vitest command with its failing count; then implement and record the same
   command green. The `unit`-refused row must be red against a tree that still admits `unit`
   (the baseline provides that red naturally).
2. **Bounds carried.** The rows proving `progress` finite and non-negative, `total >= progress`,
   and non-empty `message` run red when their guard clause is disabled — record one mutation
   probe over the validator's transferred bounds: disable the `total >= progress` clause, run
   the named row red, restore, run green.
3. **Regression floor.** The whole scoped core suite passes; no row outside the mapped blast set
   is edited, and the report names any file the suite revealed beyond the distillate's map.

## Unknowns

- Whether any `src/` consumer outside the validators and cloners reads a renamed member — the
  distillate found none; re-derive with a sweep over `src/` for `\.current` and `\.unit` on
  progress values and record the sweep's pattern and paths.

## Scope

- Owned: `src/core/types.ts`, `src/core/validators.ts`, `src/core/cloners.ts`,
  `tests/setup.ts`, `tests/src/core/validators.test.ts`, `tests/src/core/cloners.test.ts`,
  `tests/src/core/tasks/Task.test.ts`, `guides/workflow.md`, and the report file below.
- Off-limits: `package.json`, `package-lock.json`, `node_modules/`, `.claude/`, `.agents/`,
  `configs/`, `vite.config.ts`, `tsconfig.json`, `src/core/tasks/Task.ts`,
  `src/core/tasks/TaskController.ts`, `src/core/index.ts` — the entity forwards whole
  activities and never reads progress members, and the barrel star-exports, so neither needs an
  edit; a change appearing to need one is a deviation report.
- No commits, no pushes, no installs, no `git checkout`/`restore`/`stash`/`reset`/`clean`.

## Execution

Perform the assignment directly in this CLI and spawn nothing. Work types-first: land the
`TaskProgress` rename in `types.ts`, typecheck the contract, then validators, cloners, fixtures,
suite, and guide.

## Output

Write the report to `/home/user/workflow/tmp/w1-progress-report.md` and return its path plus a
short summary as your final message. The report carries: the red command with its failing count
and the green command; the mutation probe's red evidence and reversal; the consumer sweep's
pattern, paths, and result; the scoped gate readings (`oxfmt --check` and
`oxlint --deny-warnings` over the owned files, the scoped `tsc` project, the scoped vitest run
with counts); and any claim of your own you could not fully prove. No process diary.

## Deviation contract

Stop and report — expected, found, exact evidence, done or not done, at most one hypothesis —
when the rename reaches a file the scope forbids, when the consumer sweep finds a reader the
distillate missed, or when a proof will not go red or green as named. An ancillary choice (row
placement, guide wording) is yours to decide and record. A whole-suite timing failure is an
observation with your reading; the Orchestrator takes the authoritative run after you exit.

## Acceptance criteria

1. Scoped format and lint checks over the owned files exit 0.
2. The scoped core typecheck exits 0.
3. The scoped core vitest run exits 0 with the renamed rows and the `unit`-refused row present.
4. The red command, its failing count, the green command, and the mutation probe are recorded.
5. `grep -n "unit" src/core/types.ts src/core/validators.ts src/core/cloners.ts` returns only
   the `RunnerEventMap` lifecycle event; `grep -rn "current" src/core/types.ts` returns no
   progress member.
6. The report exists at the named path with the per-proof evidence.

## Review evidence

The Orchestrator supplies the diff and status to the round's audit lanes. Your report is the
auditors' subject: write it so each claim is checkable against the diff.
