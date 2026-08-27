# M5 — closing mcp writer: queue-on-close fix, lifetime-row promotion, guide honesty, peer alignment

- **Role and engine**: `implementer`, Opus 5, native. Writing unit, sole writer in the mcp
  checkout, the last mcp writer of the campaign.
- **Objective**: the browser WebSocket transport discards its pre-open queue at close; the
  `StdioServerInterface` lifetime claims sit under a standing gate; the guide states every
  declared departure and consequence this campaign accumulated; the peer floor matches what the
  gates prove.

## Context

- Repository: `C:\Users\mikes\WebstormProjects\mcp`, clean `main` at the commit the dispatch
  names (after M2F). Commit nothing. Never touch `tmp/worktrees/`.
- Campaign sources to read first, in this order: this brief; the M4 report's probe-row section
  (`C:\Users\mikes\WebstormProjects\lsp\.orkestrel\campaign\mcp-readiness\m4-report.md`, the
  "How the documented behavior was established" and "Retained instrument" sections); the M3F
  report's closing observation
  (`C:\Users\mikes\WebstormProjects\lsp\.orkestrel\campaign\mcp-readiness\m3f-report.md`); the
  A-P reconciliation's routed-onward paragraph
  (`C:\Users\mikes\WebstormProjects\lsp\.orkestrel\campaign\mcp-readiness\ap-reconciliation.md`,
  the "Routed onward, not this unit" bullet); the P1 report's `MCPLimitOptions.keys` finding
  (`C:\Users\mikes\WebstormProjects\lsp\.orkestrel\campaign\mcp-readiness\p1-report.md`, the
  bullet at line 192); the campaign plan's M5 row
  (`C:\Users\mikes\WebstormProjects\lsp\.orkestrel\campaign\mcp-readiness\plan.md`, line 59 and
  the "Rejections of record" section).
- Standing conditions: the mcp repo's `tmp/worktrees/` holds audit worktrees at older commits —
  off-limits. `npm run test:conformance` needs `npm run build:src` first (authorized ancillary).
  The `tmp/probe/` workbench directory from M4 no longer exists on disk; the M4 report is the
  authoritative record of what its rows proved.

## Fixes and rulings

1. **The browser pre-open queue is discarded at close (fix, failing-first).** Evidence, read
   2026-08-27 from `src/browser/transports/WebSocketClientTransport.ts`: `#queue: string[]`
   holds encoded frames with no held resolvers; neither `close()` (lines 145–156) nor
   `#onClose` (lines 238–244) clears it; `#onOpen` → `#flush` splices whatever it holds onto
   the next socket. The M3F fix-2 probe measured the consequence: a `send` queued before open,
   then `close()`, then a fresh `start()`, is delivered on the reconnected socket. The class
   TSDoc claims "a closed transport delivers nothing until a `start()` opens a new connection".
   Ruling: make the sentence true — clear `#queue` in `close()` and in `#onClose`, so a message
   handed to a connection the caller abandoned never rides a later one. Pin failing-first in
   `tests/src/browser/transports/WebSocketClientTransport.test.ts`: queue a pre-open `send`,
   `close()`, `start()` against the fixture peer, assert the queued frame is never delivered,
   with a control proving a fresh post-reconnect `send` does arrive (the delivery channel is
   alive, so the absence is a fact about the queue). Predicted red: the queued frame arrives —
   the state M3F measured. Update the class TSDoc's queue remark and the guide's browser
   WebSocket clauses to state the discard; re-read the clauses M3F landed and correct any
   sentence this change makes stale.
2. **The `StdioServerInterface` lifetime rows join the standing suite (promotion).** The M4
   workbench file is gone; recreate its rows in `tests/src/server/factories.test.ts` from the
   M4 report's record, named for what each proves: a repeated `start()` still yields exactly
   one reply line for one inbound request; a request written after `stop(); start()` draws no
   line; `input`'s `data` listener count reads 0 at construction, 1 after `start()`, and 0
   after `stop()`. The repeated-`stop()` case is already pinned by the shipped row at
   `tests/src/server/factories.test.ts:881` — do not duplicate it.
3. **Guide honesty rows (documentation; each names its source).** Land every row, and where a
   row already stands, verify it against shipped code and record it as already true:
   - The gap-entry sweep: re-read the guide's declared-gap entries against the landed M1, M2,
     M3, M3F, and M2F state, remove or reword every entry the campaign closed, and keep — with
     current wording — every entry still true (the re-list-and-retry gap and the `-32020`
     refresh scope were confirmed still true by A-M2 against `a7d245c`).
   - The `MCPLegacy` legacy-method-set consequence: the legacy era serves its fixed method
     set, so the modern-only surfaces (`server/discover`, `subscriptions/listen`, the MRTR
     round) do not exist for a legacy client; state the consequence in the `MCPLegacy` section.
   - The M8 fail-closed departure: a modern re-request the server cannot verify is refused
     `-32602` rather than re-run; state it as the deliberate departure from the
     specification's SHOULD, with its cost.
   - The stdio shutdown posture: signal-first; the cooperative stdin-close improvement is
     carried to `@orkestrel/process`, and the guide states what the shipped posture is.
   - `createMCPContinuation` as the `requestState` protector: the guide states that the
     continuation factory is what seals and verifies the opaque `requestState` echo.
   - The auth exclusion: the package implements no OAuth client, so the conformance client
     suite's `auth/*` scenarios are out of scope; verify the declaration MC carried and land
     it where it is missing.
   - `MCPLimitOptions.keys` (ruling: document, do not change enforcement): the declaration
     reads "Maximum total enumerable keys accepted across one `_meta` value" while
     `MCPServer.#execute` and `#normalize` apply the same leaf as the content bound. Correct
     the TSDoc in `src/core/types.ts` and the guide row to state both uses.
   - The `buildModernResult` bypass (ruling: document as a SHOULD departure, do not change
     behavior): a custom-execution result reaches the wire without the `_meta` server
     identity `buildModernResult` stamps; state the departure and its consequence in the
     guide's execution-seam section, with a TSDoc sentence on the execution member in
     `src/core/types.ts` if that member's TSDoc currently implies the stamp.
4. **Peer alignment (the planned M6, folded here as a re-baseline).** `package.json`
   `peerDependencies` names `@orkestrel/server: ^0.0.14` while `devDependencies` installs and
   the gates prove `^0.0.15` (read 2026-08-27, lines 112 and 126). Every `@orkestrel` caret
   pins one exact release, so the advertised floor names a release the gates never exercise.
   Move the peer range to `^0.0.15`.

## Unknowns

- Whether MC landed the auth-exclusion declaration in the guide: verify, and report which case
  you found.
- Whether any policy, distribution, or config test pins the peer range or the guide rows you
  touch: the scoped runs below answer it; report a moved row rather than suppressing it.

## Scope

- Owned: `src/browser/transports/WebSocketClientTransport.ts`,
  `tests/src/browser/transports/WebSocketClientTransport.test.ts`,
  `tests/src/server/factories.test.ts`, `guides/mcp.md`, `package.json`, `src/core/types.ts`
  (TSDoc sentences on the named members only).
- Off-limits: everything else, including `tmp/worktrees/` and every other source file. A
  finding that wants another file is a report line, not an edit.

## Execution

Perform the assignment directly and spawn nothing. Failing-first for fix 1. Validate scoped:
`npm run check`, scoped oxlint and oxfmt `--check` on the owned files, `npm run test:src:browser`,
`npm run test:src:server`, `npm run test:guides`, `npm run test:policy`, and the root
`tests/distribution.test.ts` and `tests/config.test.ts` projects if the runner exposes them
scoped; `npm run build:src` then `npm run test:conformance` (no baseline movement is expected —
report if one moves). No tree-wide mutating commands.

## Output

Report to `tmp/units/m5-report.md` and as your final message: the fix-1 failing-first record
(command, red count, green count), the promoted rows' names and their run counts, every guide
row as landed (quoted), the gap-entry sweep's per-entry disposition, the auth-declaration case
found, the peer bump diff, and the scoped run table.

## Deviation contract

Stop and report when a conformance row moves, a test outside the owned files reddens, or a
guide claim you are asked to land contradicts shipped code in a way the ruling above did not
anticipate. Ancillary choices — wording, row placement, section order — are yours to decide
and record.

## Acceptance criteria

1. Fix 1 pinned red-then-green with the recorded commands; the A3 row and the shipped browser
   rows stay green.
2. The lifetime rows run green in `tests/src/server/factories.test.ts`, named for what they
   prove, with no duplicate of the shipped repeated-`stop()` row.
3. Every honesty row from the list above is landed or recorded as already true, each disposition
   named in the report; the gap sweep rules on every declared-gap entry.
4. The peer range reads `^0.0.15`; every scoped run is green; conformance unchanged at
   `110 passed, 0 failed` and the green client rows.
