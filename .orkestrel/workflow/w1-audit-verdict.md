# W1 audit round — verdict and reconciliation

Subject: the W1 progress reshape, workflow `b00af86`. Lane run: the subjective lane (native
Opus `reviewer`, the engine that did not write the unit). The objective lane did not run:
the verdict's substance is settled by executed evidence — the reviewer re-ran the report's
sweeps itself and extended them, the mutation halves it could not run were taken by the
Orchestrator on the host (the F1 receipt below), and the unit's claims do not span a
rendered or externally driven surface. The `checker` did not run — the mechanical criteria
were covered inside the lane's claims 3 and 5.

## Reviewer verdict (subjective lane, verbatim)

Lane note: this lane holds no exec tool. Nothing here is attributed to a run it took. Where
a ruling rests on the Orchestrator's host acceptance (`GATE_CHAIN_GREEN`, 2026-08-26) or on
the unit's own recorded counts, it says so; where it rests on reading source, it says that
instead and names the command that would close it.

### 1. Type shape — CONFIRMED

`/home/user/workflow/src/core/types.ts:192-196` declares exactly
`readonly progress: number`, `readonly total?: number`, `readonly message?: string`. The
reference member set at `/home/user/mcp/src/core/types.ts:684-688` (`MCPProgress`) is
identical in members, optionality, and readonly-ness, and the workflow package imports
nothing from it — `rg MCP src` over `/home/user/workflow/src` returns no match, and
`package.json` is absent from the diff's file list.

Attacks that failed to break it:

- **Residual member.** `rg -n '\.(current|unit)\b' src` returns no match;
  `rg -n '\b(current|unit)\s*[:?]' src` returns only `src/core/types.ts:2045`
  (`readonly unit: readonly [id: string]`), `src/core/Runner.ts:347` (a comment), and
  `src/core/Runner.ts:352` (a `RunnerUnit` parameter). `src/core/types.ts:2041-2056` shows
  `unit` as a `RunnerEventMap` run-lifecycle event carrying a unit id — a different axis,
  pre-existing, lawfully left.
- **Second progress-like shape.** `src/core/validators.ts:360-365` shows `isTaskActivity`
  delegating progress validation to `isTaskActivityInput` rather than re-declaring bounds,
  and `src/core/cloners.ts:171-173` re-checks the assembled frame through the same guard.
  `rg -n progress src` shows `TaskProgress` referenced from `types.ts:220` and `:230` only.
  No parallel shape, no alias, no shim.
- **Naming.** `TaskProgress.progress` repeats its entity's name and yields
  `activity.progress.progress` at the call site, which `.claude/rules/names.md`
  § Entity-scoped names would otherwise question. The user's ruling recorded at
  `/home/user/scaffold/tmp/codex/w1-progress-brief.md:21-23` fixes the member set
  structurally, and `AGENTS.md` § Authority puts that instruction above the rule. Ruled,
  not drift.
- **Local vocabulary.** `src/core/validators.ts:251` and `src/core/cloners.ts:127` bind
  `reported` rather than `progress` because the outer binding already holds that name. A
  distinct local is forced by shadowing, and neither name reaches the public surface.

### 2. Validator bounds — CONFIRMED

The refusal mechanism is `src/core/validators.ts:254-261`, one boolean expression over the
captured members, reached only after the key allowlist at `:245-250`. Ruling on each row
the claim names:

| row | asserting site | binds |
| --- | --- | --- |
| non-finite `progress` | `tests/setup.ts:21`, asserted at `tests/src/core/validators.test.ts:34-36` and `tests/src/core/cloners.test.ts:52-55` | `!isFiniteNumber(reported)` at `:255`. Deleting `reported < 0` leaves this row green, so it pins its own clause and not the other. |
| negative `progress` | `tests/setup.ts:22` | `reported < 0` at `:256`. Deleting `!isFiniteNumber(reported)` leaves `-1` refused, so this row pins the comparison alone. |
| `total` below `progress` | `tests/setup.ts:23` | `total < reported` at `:257`, and the unit's own recorded mutation (`w1-progress-report.md:44-63`) reddened `rejects invalid input 3` with that comparison disabled and restored it green. The row index maps correctly: `tests/setup.ts:20` is `[{ note: '' }]`, so `%#` index 3 is the `{ progress: 2, total: 1 }` row. |
| empty `message` | `tests/setup.ts:24` | `!isNonEmptyString(message)` at `:258`. Deleting it admits `message: ''`, reddening the row. |
| removed `unit` as unknown key | `tests/src/core/validators.test.ts:38-40` | the allowlist at `:246`. Re-adding `|| key === 'unit'` there admits `{ progress: 1, unit: 'files' }` and reddens the row, so it is a live forward guard on the shipped state. |

Assertions a wrong implementation would still pass: none among the rows named. The gap is
the reverse — **the non-finite `total` half of the claim's third row is asserted by
nothing.** `validators.ts:257` refuses it (`isFiniteNumber` rejects `NaN`, `±Infinity`,
and non-numbers per the installed declaration at
`node_modules/@orkestrel/contract/dist/src/core/index.d.ts:2842-2847`), but deleting
`!isFiniteNumber(total) ||` leaves every fixture row and the whole suite green. That
refusal is derived from source and the installed declaration; the lane ran nothing. What
closes it: add `[{ progress: { progress: 1, total: Number.NaN } }]` to
`INVALID_TASK_ACTIVITIES`, then delete `!isFiniteNumber(total) ||` at `validators.ts:257`
and run
`./node_modules/.bin/vitest run --config vite.config.ts --project src:core tests/src/core/validators.test.ts`
— the new row must go red and green on restore. The gap predates this unit (the old
`total` clause carried the same unasserted half), so it is coverage owed by the next
change against this row, not a regression this diff introduced.

The covered rows are settled by executed evidence the lane was given rather than by its own
run: they are asserted at the shipped commit and the Orchestrator's host chain exits 0.

### 3. Consumer sweep — CONFIRMED

Both of the report's patterns, re-run by the lane against the committed tree at `b00af86`,
with every hit ruled:

- `\.(current|unit)\b` over `/home/user/workflow/src` — no match.
- `\b(current|unit)\s*[:?]` over `/home/user/workflow/src` — `src/core/types.ts:2045`
  (runner lifecycle event, ruled in claim 1), `src/core/Runner.ts:347` (prose),
  `src/core/Runner.ts:352` (`RunnerUnit` parameter). No progress consumer.

The lane extended the sweep past the report's population, because a dotted-read pattern
reports on dotted reads alone and would miss a destructured or computed access:

- `progress` over `src` — every site is `types.ts:185-230`, `validators.ts:230-258` and
  `:339-362`, or `cloners.ts:54-166`. No destructuring of a progress object anywhere, so
  the dotted-read pattern's blind spot is empty here.
- `\bcurrent\b` over `src` — every remaining hit is English prose in TSDoc or a comment
  (`types.ts:291`, `:714`, `:836`, `:895`, `:914`, `:1337`, `:1576`, `:1831`, `:1881`;
  `WorkflowManager.ts:34`; `constants.ts:66`; `helpers.ts:226`, `:778`, `:813`;
  `Scheduler.ts:18`; `WorkflowRunner.ts:272`; `tasks/Task.ts:453`;
  `server/NodeScheduler.ts:9`, `:11`). None names a member.
- `progress: {` and `\.current\b` and `\bcurrent:` and `\bunit:` over
  `/home/user/workflow/tests` — every hit carries the reshaped literal
  (`tests/setup.ts:21-24`, `tests/src/core/cloners.test.ts:23` and `:43`,
  `tests/src/core/tasks/Task.test.ts:180`, `:194`, `:212`,
  `tests/src/core/validators.test.ts:22` and `:39`).
- No `app/` tree exists (`app/**/*.ts` matches nothing), so the environment axis adds no
  consumer.

The cloner carries the shape at `src/core/cloners.ts:122-134`, and the fixtures at
`tests/setup.ts:21-24`. `tests/setup.test.ts:80-89` asserts the fixture table's
frozen-ness, arity, and distinctness only, so it is shape-agnostic and correctly left
outside the owned set — the reshaped rows remain distinct under `JSON.stringify`.

### 4. Guide truth — CONFIRMED

- The shape is documented at `guides/workflow.md:341` (Surface row), `:295` (guard fence),
  and `:972` (report fence).
- No sentence survives from the old shape. `guides/workflow.md:982` reads
  `total < progress`, and a case-insensitive `current|unit` sweep over the guide returns
  only runner prose and English `current` — nothing progress-shaped.
- The fence's behavioural claim is true by construction, not by luck:
  `guides/workflow.md:298` asserts `isTaskActivity(activity) // true`, and
  `src/core/cloners.ts:171-173` refuses to return any frame for which `isTaskActivity` is
  false. No input the cloner accepts can reach line 298 with a false result.
- The parity suite lawfully accepted the edit with no `tests/guides.test.ts` change: that
  file (`tests/guides.test.ts:59-175`) proves name resolution, surface membership,
  fence-import resolution (`:147-157`), and link resolution, and transcribes no fence.
  "Change a fence, change the transcription beside it" fires only where a transcription
  exists, and none does. The honest limit — that this package's parity gate cannot see a
  wrong fence value at all — predates the unit and is a gap in `tests/guides.test.ts`, not
  in this diff.

### 5. Law and owned scope — CONFIRMED

- The diff's file list is `guides/workflow.md`, `src/core/cloners.ts`,
  `src/core/types.ts`, `src/core/validators.ts`, `tests/setup.ts`,
  `tests/src/core/cloners.test.ts`, `tests/src/core/tasks/Task.test.ts`,
  `tests/src/core/validators.test.ts` — the owned set exactly. `package.json` does not
  appear, so the structural adoption stayed structural.
- No banned construct enters: no `any`, no `as`, no `!`, no suppression directive, no
  default export; the interface members at `types.ts:193-195` are readonly;
  `cloners.ts:127-134` and `validators.ts:251-258` narrow through guards rather than
  asserting.
- `/home/user/scaffold/tmp/units/w1-status.txt` is empty.
- The red-first counts cohere with the diff. Against the baseline allowlist
  (`current | total | unit`, the removed line at `w1-diff.txt:116`), exactly the renamed
  *positive* expectations break: `tests/src/core/validators.test.ts:20-32` ("accepts valid
  input and persisted frames"), `tests/src/core/cloners.test.ts:12-34` ("clones and
  freezes a complete frame…"), and `tests/src/core/tasks/Task.test.ts:169-200` ("seeds
  activity on start…", whose `task.report({ progress: { progress: 5 } })` at `:194`
  expects success). That is the recorded `3 failed | 787 passed (790)` in
  `w1-progress-report.md:24-26`, and `790` in both runs is consistent with the added row
  being collected in each.

### F1. The removal's regression pin never ran red, and the deviation went unreported

`tests/src/core/validators.test.ts:38-40` is the pin the brief demanded for the `unit`
removal, and `/home/user/scaffold/tmp/codex/w1-progress-brief.md:67-70` required it red at
the baseline: "The `unit`-refused row must be red against a tree that still admits `unit`
(the baseline provides that red naturally)." The baseline does not provide it. Its input
`{ progress: { progress: 1, unit: 'files' } }` carries the key `progress`, which the
baseline allowlist at `w1-diff.txt:116` does not admit, so the baseline guard returns
`false` for the wrong reason and the row passes green. The unit's own recorded baseline
count is the executed evidence: `3 failed` accounts exactly for the three positive
expectations enumerated in claim 5, and a red pin would have made it four.

Why it matters: `AGENTS.md` § TTTDD fixes that "a test that never ran red does not bind to
the defect it claims", and `/home/user/scaffold/tmp/codex/w1-progress-brief.md:113-117`
obliged a stop-and-report "when a proof will not go red or green as named".
`w1-progress-report.md:37` records the row as "collected" — true, and it sidesteps the
question — while the report's "Deviation and unproved claims" section (`:133-144`) reports
a different deviation and not this one. The audit trail therefore reads as though the
removal carries a red-first pin when it does not.

What right looks like: no red-first proof of this removal was available at the baseline,
because nothing at that commit could distinguish "refused because `unit` is unknown" from
"refused because `progress` is unknown" — so the correct action was the deviation report,
not silence. The row is still a valid *forward* guard, and the instrument that proves it is
the same form the unit used for the `total` clause: add `|| key === 'unit'` to
`src/core/validators.ts:246`, run the row red, restore the clause, read it green, and
record that mutation as the removal's evidence. The Orchestrator can settle it on the host
with that command pair, and can confirm the baseline reading with
`git show 6ad5b53:src/core/validators.ts | sed -n '240,262p'`.

Not broken by this: the removal itself is complete (claim 1), and the row does discriminate
against the forward mutation, so nothing needs deleting or rewriting in the shipped code.

### F2. The guide labels a core type by a protocol the same guide rules out of core

`guides/workflow.md:341` now reads: "`{ progress, total?, message? }` — MCP-shaped
progress with an optional total and observer-facing state text." `guides/workflow.md:647`
states: "Provider, Tool, MCP, Terminal, persistent-driver selection, and resource-pool
policy are deliberately outside Workflow core." A consumer reading the Surface row
concludes the package speaks MCP; the ruling paragraph says it does not; and `src/`
mentions MCP nowhere, which is the correct state given the shape was copied rather than
imported.

The row also loses meaning the deleted text carried. The old row said `total`'s presence is
what makes the reading determinate; the row that replaced it names the shape's provenance
instead, and no other sentence in the guide or in `src/core/types.ts:184-196` tells a
consumer what an absent `total` means. Every neighbouring row in that table states what its
members mean rather than where they came from — `TaskOperation` at `:342` is "one flat
nested operation claimed active when the complete frame was accepted".

What right looks like: state the members' meaning in the row and leave provenance to the
commit message, which already carries it. For example: "`{ progress, total?, message? }` —
the reported count, a `total` when the work's size is known, and observer-facing text for
the reported state." Change only `guides/workflow.md:341`.

Not broken by this: the shape is right, the fences are right, and the TSDoc at
`src/core/types.ts:187-190` correctly carries the bounds without the label — so this is
one row, not a documentation sweep.

### F3. `note` and `progress.message` ship with no stated axis between them

The frame now carries two optional observer-facing text members.
`src/core/types.ts:188-190` documents `message` as "optional observer-facing text
describing the reported state"; `src/core/types.ts:218-223` gives `note` no documentation
at all, and the `TaskActivityInput` remarks at `:214-216` describe only clearing and
defaults. The guide's flagship example at `guides/workflow.md:970-975` then shows
`note: 'Indexing'` beside `message: 'Indexing files'`, which reads as one field written
twice.

The reshape created this. The member it replaced, `unit`, was a label for the count's unit
— structurally unmistakable beside a note — whereas `message` is free prose of the same
kind as `note`. `AGENTS.md` § Design laws fixes one term per concept, and a consumer
meeting the example cannot predict which member their text belongs in.

What right looks like: name the axis once, on the interface that owns both, and stop. Add
to the `TaskActivityInput` remarks at `src/core/types.ts:214-216` that `note` describes the
frame while `progress.message` describes the progress value, and change the guide's example
so the two are not near-synonyms (for example `note: 'Indexing'` with
`message: '240 of 1,000 sources'`).

Not broken by this: `message` must exist — the user's ruling fixes the member set — so the
fix is prose and one example value, never a shape change.

### Claims attacked and not broken

Every numbered claim held. Attacks that failed: a residual or renamed progress member
anywhere in `src`, `tests`, or `guides`; an optionality or readonly drift against
`MCPProgress`; a surviving compatibility path for `unit`; a second progress-like shape in
`isTaskActivity` or `cloneTaskActivity`; a bounds row that a wrong implementation would
still pass; a destructured or computed progress read the report's dotted pattern would
miss; a stale sibling fixture proof in `tests/setup.test.ts`; a false `// true` in the
reshaped guide fence; and an unowned file or banned construct in the diff. The next round
should not re-run these.

VERDICT: FAIL — 0 broken, 0 unresolved, 0 not-evidenced, 3 findings outside the claims

## Orchestrator receipts

- F1 baseline reading confirmed, 2026-08-26:
  `git show 6ad5b53:src/core/validators.ts | sed -n '240,262p'` shows the baseline
  allowlist admitting `current | total | unit`, so the pin's input was refused for its
  `progress` key at the baseline — green for the wrong reason, as found.
- F1 forward-mutation receipt taken on the host (`w1-f1-receipt.sh`, instrument retained
  beside this file): with `|| key === 'unit'` re-admitted at the shipped
  `validators.ts:246`, the named row went red
  (`Tests 1 failed | 39 skipped (40)`, `expected true to be false`); `cmp` read 1 under the
  mutation and 0 after restore; the row ran green restored. The removal's pin now carries
  executed discriminating evidence.

## Reconciliation

Every retained finding names one carrier. F1's evidentiary half is closed by the
Orchestrator receipts above; its process half — the unreported deviation — is recorded here
against the unit's report and needs no code. F2, F3, and the claim-2 unasserted non-finite
`total` half are carried by the W1.1 brief (`w1.1-progress-prose-brief.md`). Dropped on the
record: nothing. The round stays open until W1.1 lands and closes under the
verbatim-adoption rule on its mutation account and the Orchestrator's re-read.
