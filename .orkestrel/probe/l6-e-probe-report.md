# Unit L6-E report — the probe hands its deadline signal to the lint inspection

Date: 2026-08-26. Role and engine: `implementer`, Claude Opus 5, native, sole writer in
`/home/user/probe`. The unit is done: the coordinator's deadline now arms before the lint inspection
starts, its signal reaches `client.open`, the coordinator refusal survives the abort, and the two red
coordinator rows are green.

## 1. What changed

### `src/server/types.ts` — the seam

Two exports were added. Nothing existing was edited.

- **`InspectionOptions`** carries the bound a caller holds over one stage inspection: a required
  `readonly signal: AbortSignal`, and no other member.
- **`LintStageInterface extends StageInterface`** overrides `inspect(subject: Case, options?:
  InspectionOptions): Promise<Check>`.

**The honored-inspections sentence**, in the `InspectionOptions` TSDoc `@remarks`:
`LintStageInterface.inspect` is the only inspection in this package that reads the signal; its wait
is a foreign language server's silence, and abandoning that wait would leave the client holding a
pending diagnostics request. The type and runtime stages accept no options and honor no
cancellation — a coordinator abandons an overrunning one and replaces it, which is what `Probe` does
when its own deadline expires.

**Why the seam is a lint-specific interface and not `StageInterface.inspect`.** The reconciliation's
unit table names the seam `StageInterface.inspect`. That placement is unreachable under this unit's
scope, and it would also contradict the analyst's own prescription, so the seam landed where the
prescription points. Both facts were measured rather than argued, with `tsc --noEmit --strict`
outside the repository:

- Widening the base to `inspect(subject, options?: InspectionOptions)` breaks
  `TypeStageInterface`, which keeps `inspect(subject, project?: string)`:
  `error TS2430: Interface 'DerivedString' incorrectly extends interface 'Base'. … Type 'Options |
  undefined' is not assignable to type 'string | undefined'.` Repairing that needs an edit to
  `TypeStage.ts`, which this unit's Scope makes off-limits.
- A derived interface cannot make the bag required either:
  `error TS2430: … Target signature provides too few arguments. Expected 2 or more, but got 1.`
  So `options` is optional in the type and required in fact, and the stage refuses an inspection that
  omits it.

Putting the signal on `StageInterface` would additionally have declared a cancellation the type and
runtime stages do not honor, which the ruling forbids. The lint-specific interface follows the
precedent the file already sets for `TypeStageInterface`.

### `src/server/Probe.ts` — the operation handler and the refusal

- `#bound` takes `operation: (signal: AbortSignal) => Promise<T>` instead of an already-started
  promise. It arms the timeout, then invokes the handler with `timeout.signal`. Every stage
  inspection, the project resolution, and every stage teardown now begin **after** the deadline is
  armed rather than before.
- `#inspectStage` forwards the handler; its `operation` parameter changed type identically.
- `#inspectLint` passes `(signal) => stage.inspect(inspection.subject, { signal })`. `#inspectType`,
  `#inspectRuntime`, `#resolve`, and `#destroyStage` pass handlers that ignore the signal, so their
  behavior is unchanged.
- `#inspectLint` and `#inspectRuntime` capture the stage in a local before building the handler, so
  the handler and the recycle target are the same instance.

**Where the abort-to-refusal translation lives: `Probe.#bound`.** `#bound` holds the expiry promise
and observes it as `refusal` beside racing it. When `timeout.expired` is true it recycles the stage
and throws `await refusal` — the `ProbeError` `#expiry` minted — rather than whatever won the race.
That is deterministic: `#expiry` registers its `abort` listener before the handler ever sees the
signal, so the coordinator refusal exists by the time any promise reaction runs. `The lint stage
exceeded 6000 ms` therefore reaches the caller whether the client's `aborted` `LSPError` settles the
race first or not, and the losing rejection is observed by `Promise.race` rather than ending the
host.

### `src/server/stages/LintStage.ts` — the client call and the caller's bound

- `implements LintStageInterface`. `inspect(subject, options?)` forwards `options` to `#inspect`.
- `#inspect` refuses when `options` is absent: `ProbeError('The lint stage inspects only under a
  bound its caller supplies')` with `origin: 'claimant'`, `code: 'refused'`, `context: { stage:
  'lint' }`. The refusal precedes warming, so no server is spawned for it.
- `#document(client, draft, signal)` calls `client.open(document, { signal })`. The stage creates no
  `AbortSignal.timeout` of its own for the wait.
- The constructor client keeps `timeout: this.#deadline` (2000 ms) and the transport keeps
  `grace: this.#deadline / 2`, so `initialize`, `shutdown`, the exit write, and transport-close
  settlement stay bounded as before.
- **A second translation, in `LintStage.#document`, which the brief did not name.** When `client.open`
  rejects while the supplied signal is aborted, the stage throws `#abandoned(path)`:
  `ProbeError('The lint stage inspection stopped at the bound its caller supplied')` with
  `origin: 'claimant'`, `code: 'deadline'`, `context: { stage: 'lint', path }`. Without it the
  client's cancellation reaches `guardStage`, which reports `instrument`/`malformed` `The lint stage
  could not serve (…)` — telling a coordinator the instrument broke when the instrument was told to
  stop. That path is reachable through a documented extension seam (the guide invites a coordinator
  of your own to drive a stage), so `.claude/rules/quality.md` § Rounds and verdicts obliges the
  repair now. It never displaces the coordinator refusal: on the `Probe` path this rejection loses
  the race and `#bound` throws `refusal` regardless.

### `tests/src/server/stages/LintStage.test.ts`

- Added `const UNBOUNDED: AbortSignal = new AbortController().signal` and passed
  `{ signal: UNBOUNDED }` at every existing `inspect` call site. **Reason:** the stage now refuses an
  inspection with no bound, so every existing call asserted a result the stage no longer returns. The
  spawned host script in `HOST` carries its own never-aborting signal for the same reason.
- Added a `PROBE_SLOW` marker to the fixture server: a document carrying it is published after 3 s
  instead of at once. **Reason:** no existing fixture could hold a document past the client's 2 s
  `timeout` and still answer, so no existing row could distinguish the two bounds.
- Three rows added, each named for what it proves:
  - `refuses an inspection its caller supplies no bound for` — the seam's rule, with the same case
    under a bound as its control.
  - `waits for diagnostics past the bound its client holds over the server's lifecycle` — the
    3 s publication returns, and the measured interval exceeds 2000 ms. This row is red under the
    old wiring and green under the new one; a prompt document is its control.
  - `stops the diagnostics wait at the bound its caller supplied` — `AbortSignal.timeout(500)`
    against a silent document ends the wait, with the interval asserted above 300 ms and below the
    client's 2000 ms.

### `tests/src/server/Probe.test.ts`

**Unchanged.** The seam makes no assertion in this file false: the refusal message, code, stage, and
deadline are all preserved. The standing fixture capability patch at the `initialize` answers is
intact and untouched — `git diff` over the file shows exactly those two lines and nothing else.

### `guides/probe.md`

Sentences the rewire made false, corrected:

- **§ Lifecycle, stage teardown.** The client's 2 s bound is restated as covering the `initialize`
  and `shutdown` exchanges alone. The clause "the diagnostics an inspection waits for" is removed and
  replaced with the caller's signal.
- **§ How the lint stage speaks the protocol, the client entry.** States that `timeout` bounds the
  lifecycle exchanges and the destroy-time settlement and does not reach the diagnostics wait.
- **§ How the lint stage speaks the protocol, the `open` entry.** States that the stage supplies the
  caller's signal, that the signal bounds the wait, that the stage mints no second bound, and that
  `Probe` passes the deadline it already armed.
- **§ How the lint stage speaks the protocol, the refused-diagnostic entry.** "waits out its
  deadline" became "waits out the caller's bound".
- **§ Failure axes, the error table.** The `claimant`/`refused` row names the missing-bound refusal
  and the `claimant`/`deadline` row names the lint stage's own caller-bound stop.

Parity rows the two new exports oblige, added under the ancillary half of the deviation contract
rather than stopping the unit: an `InspectionOptions` row and a `LintStageInterface` row in the
Server contracts table, a `#### LintStageInterface` method table under `## Methods`, and the
`LintStage` engine row's `Implements` column moved to `LintStageInterface`. The `guides` project
proves this: without them the parity gate reds on an undocumented public export.

## 2. The acceptance run, before and after

Command, both times:
`npx vitest run --project src:server tests/src/server/Probe.test.ts tests/src/server/stages/LintStage.test.ts`

| Reading | Result | Exit code |
| --- | --- | --- |
| Before the rewire | `Test Files 2 failed (2)` · `Tests 41 failed \| 9 passed (50)` | 1 |
| After the rewire | `Test Files 2 passed (2)` · `Tests 53 passed (53)` | 0 |

The before run's failures all traced to one cause, printed in its own output:
`TypeError: Cannot read properties of undefined (reading 'signal')` at
`LSPClient.open node_modules/@orkestrel/lsp/dist/src/core/index.js:689:26` from
`LintStage.#document src/server/stages/LintStage.ts:184:37`.

Rows restored, named from the after run under `--reporter=verbose` (same command, exit 0):

- `replaces a lint stage its deadline destroyed` — 7981 ms. This row carries the coordinator refusal
  `The lint stage exceeded 6000 ms` and the later claim served through the replacement stage.
- `names arming in a boot expiry and arms again for the next claim` — 19589 ms.

New rows, from the same verbose run:

- `refuses an inspection its caller supplies no bound for` — 70 ms.
- `waits for diagnostics past the bound its client holds over the server's lifecycle` — 3079 ms.
- `stops the diagnostics wait at the bound its caller supplied` — 509 ms.

## 3. Scoped gate readings

| Gate | Reading | Exit code |
| --- | --- | --- |
| `npm run check` (tree-wide) | root `tsc`, then `check:src:core`, `check:src:server`, `check:src:bin`, all silent | 0 |
| `npx oxfmt --check` over `src/server/types.ts`, `src/server/Probe.ts`, `src/server/stages/LintStage.ts`, `tests/src/server/stages/LintStage.test.ts`, `tests/src/server/Probe.test.ts`, `guides/probe.md` | `All matched files use the correct format.` | 0 |
| `npx oxlint --config .oxlintrc.json --deny-warnings` over the same five TypeScript files | no diagnostics | 0 |
| `npx vitest run --project src:server` (unfiltered) | `Test Files 7 passed (7)` · `Tests 166 passed (166)` | 0 |

Two further read-only projects were run because this unit's edits reach what they prove, and both are
green: `--project guides` (`Tests 13 passed (13)`, exit 0), which is the parity gate over the new
public exports and the guide rows, and `--project policy` (`Tests 93 passed (93)`, exit 0), which is
the placement sweep over the new declarations.

**The lint instrument was proved able to fail before its clean result was trusted.** A control drawn
from outside the owned population — a scratch file containing `debugger`, outside `src/` and `tests/`
— was linted with the same command and reported
`error eslint(no-debugger): 'debugger' statement is not allowed`, exit 1. The scratch file lives in
this session's scratchpad, never in the subject tree.

**Timing caveat, reported as an observation rather than as a criterion.** The new
`stops the diagnostics wait at the bound its caller supplied` row asserts an interval below 2000 ms,
and several pre-existing teardown rows assert intervals below 5000 ms. All were taken inside this
unit's own exec. The authoritative reading belongs to the Orchestrator on an idle host.

## 4. The diff and the status

`git status --short`, unchanged from the standing round beyond the owned files:

```text
 M guides/probe.md
 M package-lock.json
 M package.json
 M src/server/Probe.ts
 M src/server/helpers.ts
 M src/server/stages/LintStage.ts
 M src/server/types.ts
 M tests/src/server/Probe.test.ts
 M tests/src/server/helpers.test.ts
 M tests/src/server/stages/LintStage.test.ts
```

`package.json`, `package-lock.json`, `src/server/helpers.ts`, `tests/src/server/helpers.test.ts`, and
the `Probe.test.ts` fixture lines are the standing entries this unit did not touch. `git diff --stat`
over the whole tree, which mixes this unit with the standing P1 adoption and the tarball swap:

```text
 guides/probe.md                           |  87 ++++-
 package-lock.json                         |  15 +
 package.json                              |   1 +
 src/server/Probe.ts                       |  39 +-
 src/server/helpers.ts                     |  20 -
 src/server/stages/LintStage.ts            | 475 +++++++-----------------
 src/server/types.ts                       |  55 +++
 tests/src/server/Probe.test.ts            |   4 +-
 tests/src/server/helpers.test.ts          |  13 +-
 tests/src/server/stages/LintStage.test.ts | 586 ++++++++++++++++++++++--------
 10 files changed, 747 insertions(+), 548 deletions(-)
```

`src/server/Probe.ts` and `src/server/types.ts` carry this unit's changes alone. In
`src/server/stages/LintStage.ts` and `guides/probe.md` this unit's changes sit on top of the standing
P1 adoption diff, and in `tests/src/server/stages/LintStage.test.ts` they sit on top of it as well.
The Orchestrator captures the full textual diff after this unit exits.

## 5. Observations outside this unit's scope

- **`LintStage.#translate` still reports a client failure as `instrument`/`malformed` through
  `guardStage`.** That is correct for a server fault and now bypassed for a caller abort, but the
  general shape — every non-`ProbeError` becoming a stage fault — remains. It belongs to the lint
  stage's failure-attribution capability, not to this seam.
- **`Probe.#recycle` races `stage.destroy()` against its own expiry without passing a signal.** A
  stage that could cut its teardown short is still abandoned rather than told to stop. `destroy()`
  takes no signal in `StageInterface`, so closing this needs a contract change against the stage
  teardown capability, which this unit does not own.
- **`Probe.#recycle`'s expiry promise stays pending and unobserved when `stage.destroy()` wins the
  race.** It is never rejected, because `timeout.clear()` cancels without aborting, so it is inert.
  Pre-existing, and it belongs to the recycle capability.
- **The guide's § Cost measurements were taken on 2026-08-20 against Oxlint 1.79.0.** The lint
  stage's protocol section already carries a 2026-08-26 reading against 1.80.0 from the P1 adoption,
  so the two dates sit in one guide. That belongs to the guide-measurement capability, and no
  sentence this unit touched states either figure.

## 6. Deviation state

**No deviation.** No named stop condition fired: the refusal message is preserved without touching a
report-only file, the seam makes no cancellation promise on a stage that ignores it, and no row
outside the coordinator-deadline pair reddened.

Two decisions taken under the ancillary half of the deviation contract, recorded rather than stopped
on:

1. The seam is `LintStageInterface` rather than `StageInterface.inspect`, on the compiler evidence in
   § 1 and on the analyst's own "without pretending unsupported stages honor cancellation".
2. The guide received the parity rows the two new exports oblige, beyond the sentences the rewire
   made false, because the `guides` project reds without them and `AGENTS.md` forbids suppressing a
   parity failure.
