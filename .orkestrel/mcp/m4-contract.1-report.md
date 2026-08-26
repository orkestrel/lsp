# Unit m4-contract.1 — report

## Patches landed

1. `tests/src/core/helpers.test.ts:1618` — the `MCPSubscriptionFilter` key-union assertion now
   includes `'taskIds'` alongside the four existing keys.
2. `tests/src/core/MCPServer.test.ts:5563` — the malformed-snapshot `MCPTaskDetail` map entry
   (`tests/src/core/MCPServer.test.ts` around the `bounded` snapshot read) replaced its `_meta`
   off-contract vector with `ttlMs: 1_000.5` and `result: { resultType: 'complete' }`, and the
   comment now names the fractional `ttlMs` defect class.
3. `tests/src/core/MCPServer.test.ts:5908` — the `watchedTaskManager` update-and-cancellation case
   replaced the same `_meta` vector with `ttlMs: 1_000.5` in its resolved task detail, comment
   updated to match.

Each old-text block matched the file byte for byte before editing; no adaptation was needed.

## Gate readings

1. `npm run format:check` — exit 0 (217 files, all correctly formatted).
2. `npm run lint:check` — exit 0 (no warnings).
3. `npm run check` — exit 0 (root `tsc` plus `check:src:core`, `check:src:browser`,
   `check:src:server` all clean).
4. `npm run test:src:core` — exit 0. **772 passed (772)**, 16 test files, up from the brief's
   stated baseline of 770 passed | 2 failed.

## `git status --short`

```
 M src/core/MCPClient.ts
 M src/core/MCPServer.ts
 M src/core/MCPTaskClient.ts
 M src/core/constants.ts
 M src/core/helpers.ts
 M src/core/types.ts
 M src/core/validators.ts
 M tests/setup.ts
 M tests/src/core/MCPServer.test.ts
 M tests/src/core/MCPTaskClient.test.ts
 M tests/src/core/helpers.test.ts
 M tests/src/core/validators.test.ts
```

The `m4-era` and `m4-contract` held sweeps stay exactly as this unit found them; the only files
this unit touched are `tests/src/core/helpers.test.ts` and `tests/src/core/MCPServer.test.ts`, both
already listed as modified by the held work before this unit started.

## Flags

None. No claim in this report rests on an unverified belief; every gate reading above is the exact
command's own exit code and output, read directly.
