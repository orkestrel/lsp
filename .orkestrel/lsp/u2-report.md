# U2 report — client seam rulings and the two leaf extractions

Done. No deviation. Every ruling landed, both Unknowns settled before editing, and every new
assertion was driven red by a mutation probe before being accepted.

## Unknown 1 — `AbortSignal.timeout` event-loop residency

**Answer: it does not hold the loop.** `waitForDeadline` keeps the briefed shape
`waitForDeadline(ms: number): Promise<void>`. No cleared-timer handle, no caller-side clearing.

Instrument: `tmp/probe/deadline.test.ts` spawning `process.execPath` with two inline-file scripts,
killed at a 4000 ms bound, elapsed measured with `performance.now()`.

- Subject `tmp/probe/signal.mjs`: `AbortSignal.timeout(30_000)` armed inside a race the resolved
  promise wins, then the script ends.
- Control `tmp/probe/timer.mjs`: identical, with `setTimeout(fn, 30_000)` as the losing racer.

Command: `npm run test:probe`

```text
stdout | tmp/probe/deadline.test.ts > AbortSignal.timeout event-loop residency > subject: an armed AbortSignal.timeout that lost its race
signal.mjs exit: 55ms killed=false

 ✓ |probe| tmp/probe/deadline.test.ts > AbortSignal.timeout event-loop residency > subject: an armed AbortSignal.timeout that lost its race 58ms
stdout | tmp/probe/deadline.test.ts > AbortSignal.timeout event-loop residency > control: a plain setTimeout that lost its race
timer.mjs exit: 4042ms killed=true

 ✓ |probe| tmp/probe/deadline.test.ts > AbortSignal.timeout event-loop residency > control: a plain setTimeout that lost its race 4043ms

 Test Files  1 passed (1)
      Tests  2 passed (2)
```

The control lingered to the bound and was killed; the subject exited in 55 ms. The instrument
discriminates, so the subject reading is evidence. Both scripts and the probe test are deleted;
`tmp/probe/` is empty.

## Unknown 2 — does `tests/conformance.test.ts` read the advertised capability set?

**No.** Its `LSPClientCapabilities.general.positionEncodings` row
(`tests/conformance.test.ts:102`) is a projected *structure member* checked against the metaModel
and the installed namespace — a type-shape claim. `grep -n "utf-16" tests/conformance.test.ts`
returns nothing, and the only `utf-16` in the conformance set is
`tests/setupConformance.ts:791` `'LSP_ENCODINGS.utf-16'`, which is a row of the protocol's encoding
enumeration rather than this client's advertisement. Nothing there reads the value the client
sends, so the executed advertisement assertion is new in `tests/guides.test.ts` and duplicates no
existing mechanism.

## What changed, per ruling

- **Fold `#releaseGeneration`.** Deleted. `#begin`'s catch awaits `this.#closeTransport()`
  directly. `grep -rn "releaseGeneration" src/ tests/ guides/` returns nothing.
  `#cancelRequest` is byte-unchanged: `git diff -U0 src/core/LSPClient.ts | grep -c "cancelRequest"`
  is `0`.
- **Extract `waitForDeadline`** into `src/core/helpers.ts`. `#boundExit` and `#closeTransport` each
  keep their own race and outcome mapping; `#closeTransport` still discriminates settled (`false`),
  failed (the error), and deadline (`true`) through `waitForDeadline(this.#timeout).then(() => true)`,
  which preserves the original `true` sentinel exactly rather than introducing a new one.
- **Extract `LSP_CAPABILITIES`** into `src/core/constants.ts`, deep-frozen at every level
  (outer record, `general`, the encodings array, `textDocument`, and each of its three leaf records),
  annotated `satisfies LSPClientCapabilities`, with no `as const` on the encodings array.
  `#begin` sends it as `params.capabilities` and derives the refusal from it with
  `!LSP_CAPABILITIES.general.positionEncodings.includes(encoding)`. The only remaining `'utf-16'`
  literal in `src/` outside the constant is the `encoding` getter's protocol default
  (`src/core/LSPClient.ts:142`), left in place as briefed.
- **Guide parity.** `guides/lsp.md` gains `waitForDeadline` in the framing surface table (its intro
  now reads "The framing, timing, and error surface"), `LSP_CAPABILITIES` in the constant surface
  table (intro now "protocol names, advertisements, and limits"), and a Client-lifecycle paragraph
  stating the advertisement claim. `tests/guides.test.ts` gains the executed assertion plus a
  presence guard beside it.

Ancillary decisions recorded: `waitForDeadline` joined the existing framing/error table rather than
getting a one-row table of its own, because it is the other `helpers.ts` export and a one-row table
carries no comparison; the TSDoc `@example` satisfies the guide's "example for every Surface
function" check without adding a guide fence.

## Files touched

| File | Change |
| ---- | ------ |
| `src/core/constants.ts` | Adds the deeply-frozen `LSP_CAPABILITIES` and a type-only import of `LSPClientCapabilities`. |
| `src/core/helpers.ts` | Adds `waitForDeadline`. |
| `src/core/LSPClient.ts` | Folds `#releaseGeneration`, sends and derives from `LSP_CAPABILITIES`, races through `waitForDeadline`. |
| `guides/lsp.md` | Adds the advertisement paragraph and the two surface rows. |
| `tests/src/core/helpers.test.ts` | Adds two `waitForDeadline` cases. |
| `tests/guides.test.ts` | Adds the executed advertisement assertion and its presence guard. |

```text
 guides/lsp.md                  | 12 ++++++++++--
 src/core/LSPClient.ts          | 38 ++++++++++++--------------------------
 src/core/constants.ts          | 19 +++++++++++++++++++
 src/core/helpers.ts            | 25 +++++++++++++++++++++++++
 tests/guides.test.ts           | 16 ++++++++++++++++
 tests/src/core/helpers.test.ts | 23 ++++++++++++++++++++++-
 6 files changed, 104 insertions(+), 29 deletions(-)
```

`tests/src/core/LSPClient.test.ts` was owned but needed no edit: the existing advertisement
assertion (`:185-196`) and refusal case (`:295`) already pin both sides of the new single source,
and the destroy timeout-emission case (`:1463`) is unmodified and green.

## Failing-first evidence

Both new assertions ran red before being accepted. Each mutation was applied to a file this unit
owns and reverted by an exact inverse edit, never by a git working-tree command.

**Advertisement.** Mutation: `positionEncodings: Object.freeze(['utf-16', 'utf-8'])`.

```text
npm run test:guides
 FAIL  |guides| tests/guides.test.ts > advertised position encodings > advertises utf-16 alone
      Tests  1 failed | 24 passed (25)

npm run test:src:core
 FAIL  |src:core| tests/src/core/LSPClient.test.ts > LSPClient > performs initialize then initialized with nothing between
 FAIL  |src:core| tests/src/core/LSPClient.test.ts > LSPClient > refuses utf-8 after advertising only utf-16
 FAIL  |src:core| tests/src/core/LSPClient.test.ts > LSPClient > restarts the transport after a failed handshake
      Tests  3 failed | 89 passed (92)
```

One edit to the constant moved both the sent advertisement and the accepted set, which is the
single-source claim itself under test.

**`waitForDeadline`.** Mutation: `AbortSignal.timeout(0)`, so the helper ignores `ms`.

```text
npm run test:src:core
 FAIL  |src:core| tests/src/core/helpers.test.ts > waitForDeadline > resolves no earlier than its deadline
 FAIL  |src:core| tests/src/core/helpers.test.ts > waitForDeadline > settles a shorter deadline before a longer one
      Tests  2 failed | 90 passed (92)
```

A third drafted case, "loses a race against work that has already settled", survived every mutation
because `Promise.race` against an already-resolved promise returns that promise for any deadline
implementation. It was unfalsifiable, so it was deleted rather than shipped. That is why the final
`src:core` count is 91 rather than the 92 the mutation runs report.

## Scoped validation, after restoration

| Command | Result |
| ------- | ------ |
| `npm run lint:check` | exit 0, no diagnostics |
| `npm run check:src:core` | exit 0, no diagnostics |
| `npm run test:src:core` | 5 files, 91 passed (baseline 89, +2 new) |
| `npm run test:guides` | 1 file, 25 passed (baseline 23, +2 new) |

Read-only observations beyond the briefed set, taken because this unit changed `constants.ts` kind
purity and the documented surface: `npm run test:policy` 110 passed, `npm run test:conformance`
243 passed, `npm run format:check` "All matched files use the correct format." over 154 files.
No `format`, `lint --fix`, `build`, or full `npm test` was run.

## `git status --porcelain`

```text
 M guides/lsp.md
 M src/core/LSPClient.ts
 M src/core/constants.ts
 M src/core/helpers.ts
 M tests/guides.test.ts
 M tests/src/core/helpers.test.ts
?? .orkestrel/lsp/d2-objective-verdicts.md
?? .orkestrel/lsp/d2-parser-brief.md
?? .orkestrel/lsp/d2-reconciliation.md
?? .orkestrel/lsp/d2-subjective-verdicts.md
```

Every modified file is owned. The four untracked `.orkestrel/lsp/*.md` files are not this unit's
writes: `d2-reconciliation.md` was already untracked at the baseline check, and the other three
appeared under `.orkestrel/` while this unit ran. This unit wrote nothing outside its owned files
and `tmp/`.

## Deviation state

None. The fold changed no observable teardown behavior, the constant typechecks without an
assertion, `tests/guides.test.ts` accepted the executed assertion in its existing shape, and no
test outside the owned files failed.
