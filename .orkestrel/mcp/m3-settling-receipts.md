# M3 settling receipts — the reviewer verdict's execution claims

Orchestrator-owned probe unit, run 2026-08-26 in a disposable worktree of
`/home/user/mcp` at commit `ce155db`, with `node_modules` symlinked from the main
checkout and every mutation restored by byte copy (`RESTORED-BYTE-EXACT` read from
`cmp`). Instruments retained beside this file: `m3-settling-probes.sh`,
`m3-probe-revert.cjs`, `m3-probe-mutate.cjs`. The raw logs lived in the Orchestrator's
scratchpad and are recomputable from the instruments.

## Commit scope (verdict claim 5)

`git show --stat ce155db` lists exactly the units' owned files: `guides/mcp.md`,
`src/core/MCPClient.ts`, `src/core/constants.ts`, `src/core/types.ts`,
`src/core/validators.ts`, `tests/guides.test.ts`, `tests/setup.ts`,
`tests/src/core/MCPClient.test.ts`, `tests/src/core/validators.test.ts` — 909
insertions, 34 deletions. Claim 5 closes CONFIRMED.

## Fence typing (verdict claim 4b)

A scratch `tests/src/core/fenceProbe.probe.ts` declaring
`IteratorResult<JSONRPCNotification, MCPSubscriptionResult>` and reading
`opened.value.method` sent `npm run check` to exit 2 with
`error TS2339: Property 'method' does not exist on type
'JSONRPCNotification | MCPSubscriptionResult'`; removing the scratch file restored the
gate. The reviewer's claim 4b defect is real; the M3.1 unit carries the fix.

## The burst guard was born red (verdict claim 3, element a)

The guard row `delivers every frame that arrived before the first read`, run through
`npx vitest run --config vite.config.ts --no-cache --reporter=dot --project guides -t`:
shipped order exit 0; with the terminal check moved above the drain (the pre-U1.2
order, applied by `m3-probe-revert.cjs`) exit 1 failing exactly that row; restored by
byte copy, exit 0. The row binds to the drain defect. Element a closes CONFIRMED.

## The routing mutation discriminates (verdict claim 3, element b)

The unfiltered client file
(`npx vitest run --config vite.config.ts --no-cache --reporter=dot --project src:core
tests/src/core/MCPClient.test.ts`): shipped, exit 0 with 136 passed; with `return false`
planted as the first statement of `#routeSubscription` (applied by
`m3-probe-mutate.cjs`), exit 1 with 11 failed and 125 passed; restored byte-exact,
confirmed by `cmp`. The unfiltered reading is the stronger record the reviewer asked
for. Element b closes CONFIRMED, and claim 3 closes CONFIRMED whole.

## Standing after these receipts

The reviewer verdict's FAIL reduces to claims 2 and 4 (plus the F1 line), carried by the
M3.1 unit's brief; F2 is referred to the `analyst` lane with the round.
