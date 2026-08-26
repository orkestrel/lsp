# p2-insurance — Grok evidence sweep, distillate verbatim

Lane: insurance evidence sweep per the user's 2026-08-26 ruling (Grok evidence beside the
Opus audit lane, lower prior at reconciliation). Engine: Cursor Grok through the `grok`
driver. Question: where the installed Vitest populates an error's `stacks` array, with
the raw-versus-remapped basis and the programmatic path's reachability. Journal:
`probe/tmp/cursor/vitest-stacks.log` (ephemeral, swept at acceptance); driver session
recorded in the routing ledger. Returned 2026-08-26.

---

Evidence (Vitest 4.1.11, from `/home/user/probe/node_modules`):

- **Population site**: `vitest/dist/chunks/cli-api.CnMVyzaz.js:12692` in
  `TestRun.syncUpdateStacks`, invoked from `TestRun.updated` (`cli-api.CnMVyzaz.js:12657-12658`).
  Node pool sets `error.stacks = parseErrorStacktrace(...)` at `cli-api.CnMVyzaz.js:12700`;
  browser pool at `:12699`. The computing function is `parseErrorStacktrace`
  (`@vitest/utils/dist/source-map.js:428`), which calls `parseStacktrace`
  (`source-map.js:438`) and writes `e.stacks = stackFrames` at `source-map.js:451`.
- **With/without `getSourceMap`**: the Node-pool call at `cli-api.CnMVyzaz.js:12700-12705`
  passes a `getSourceMap` callback; the browser-pool call at `:12699` passes only
  `frameFilter`, no `getSourceMap`. Inside `parseStacktrace`, the raw-frame branch
  (`source-map.js:391-394`) fires when `getSourceMap` is absent or returns a
  non-versioned value; the remap branch (`source-map.js:395-414`) fires when a versioned
  source map comes back, which in turn depends on `extractSourcemapFromFile`
  (`@vitest/utils/dist/source-map/node.js:7`) finding a convert-source-map object on disk
  and Vite's `moduleGraph` lacking a `transformResult` for that file.
- **Line/column basis**: raw V8 frames come from `parseSingleV8Stack`
  (`source-map.js:363-368`), `Number.parseInt` of tokens from `extractLocation`
  (`source-map.js:241-270`), no adjustment. Remapped frames go through
  `getOriginalPosition` (`source-map.js:480-481`) → `originalPositionFor`
  (`source-map.js:176`), which decrements the input line to 0-based (`:177-178`) and
  leaves column as-is (`:178, :188`), then returns `segment[SOURCE_LINE] + 1` and
  `segment[SOURCE_COLUMN]` with no `+1` (`:197-198`).
- **Programmatic path reaches it**: yes. `vitest/dist/node.js:5` re-exports `startVitest`
  from `cli-api.CnMVyzaz.js:14596` → `ctx.start` (`:14621`) → `Vitest.start` (`:13498`) →
  `runFiles` (`:13546, :13637`) → `this.pool.runTests` (`:13657`); the child runner RPCs
  `onTaskUpdate` (`vitest/dist/chunks/index.DXx9Dtk7.js:116-117`) →
  `createMethodsRPC.onTaskUpdate` (`cli-api.CnMVyzaz.js:2801-2803`) →
  `syncUpdateStacks` (`:12657-12658`), the same site as item 1.

---

Reconciliation note (Orchestrator): the distillate corroborates the settling receipts —
both branches exist and the Node pool wires the remap hook, while the host measurement
(`p2-settle-receipts.md`) shows the frames this pipeline receives are un-remapped and
one-based in both halves. No reading contradicts the objective verdict or the
measurement; the registered frame-basis risk in `p2-audit-2-verdict.md` carries the
mechanism pointers above.
