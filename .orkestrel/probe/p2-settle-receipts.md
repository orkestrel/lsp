# P2 settling receipts — the RuntimeStage column basis, 2026-08-26

The `p2-audit-2` objective lane (Opus 5, substituted for the dark Sol model) returned
`FAIL -- 0 broken, 1 unresolved` with claim 1 `UNRESOLVED`: the installed
`@vitest/utils/dist/source-map.js` carries a remap branch (`parseStacktrace` replacing a
frame's coordinates through `originalPositionFor`) whose remapped column is zero-based,
under which `stack.column - 1` would under-report by one and a mapped column `0` would
store `character: -1` — refused by `isLSPPosition`, cascading to a discarded verdict in
`ProbeServer`. The lane named the settling condition: the raw `error.stacks[0].column`
read beside the stored `range.start.character` under the installed Vitest, plus a case
whose failing position sits at the column floor of its line.

## The instrument

`p2-settle-instrument.sh` beside this file, run 2026-08-26 on the held tree. It inserts a
`RAW_FRAME` write into `RuntimeStage.#issue` at the single conversion line
(`TARGET_OCCURRENCES:1`), drives the real stage through the `probe` vitest project with a
fixture pair, and restores the source byte-identical (`RESTORE_CMP_EXIT:0`; the closing
`git status --short` lists exactly the twelve held files). Vitest 4.1.11, Node 22.22.2.

## The readings

The pinned-column fixture (the `toBe` token at one-based line 6, column 16):

```text
RAW_FRAME {"file":".../p2settle-pinned.test.probe-....ts","line":6,"column":16}
STORED_PINNED count=1 range={"start":{"line":5,"character":15},"end":{"line":5,"character":15}} message="expected 4 to be 5 // Object.is equality"
```

The column-floor fixture (`new Error('boom')` opening at one-based column 1 of its own
line):

```text
RAW_FRAME {"file":".../p2settle-floor.test.probe-....ts","line":4,"column":1}
STORED_FLOOR count=1 range={"start":{"line":3,"character":0},"end":{"line":3,"character":0}} message="boom"
```

## The ruling the readings support

- The frames the stage receives are one-based in line AND column on this host, through
  the real pipeline, at an interior column and at the column floor alike. The raw column
  is measured beside the stored value, so the basis is no longer inferred from token
  position.
- The `- 1` conversion is therefore correct for this pipeline, and no `character: -1` is
  reachable in it: the floor stores `0`, a valid `LSPPosition`.
- The remap branch the lane read in `@vitest/utils` exists and is zero-based in column,
  and this pipeline does not take it. Its reachability under a future Vitest is an
  environment-conditional risk, registered as a carried capability in the campaign state
  rather than repaired inside P2: a repair would either mask a basis flip silently
  (clamping) or guess at a branch no measurement reaches today. The instrument beside
  this file re-produces the detecting measurement.
