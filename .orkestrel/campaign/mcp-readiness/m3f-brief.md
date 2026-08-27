# M3F — fix round for the A-M3 broken claims

- **Role and engine**: `implementer`, Opus 5, native. Writing unit, sole writer in the mcp
  checkout. Fix round: adopt the prescriptions below; the one widening is a ruling.
- **Objective**: the Node WebSocket client face rejects the same closed-channel condition the
  other faces reject; the A3 pin proves its no-queue half; the two guide universals are bounded
  to what the code does.

## Context

- Repository: `C:\Users\mikes\WebstormProjects\mcp`, clean `main` at the commit the dispatch
  names (after M2). Commit nothing. Never touch `tmp/worktrees/`.
- The A-M3 verdict:
  `C:\Users\mikes\WebstormProjects\lsp\.orkestrel\campaign\mcp-readiness\am3-verdict.md`
  (claims 4 and 5). Read it first.

## Fixes

1. **The Node client face joins the guard (ruling — widened from the auditor's wording fix).**
   `src/server/transports/WebSocketClientTransport.ts` `send` rejects not only when `#socket`
   is undefined but also when the bound wrapper's `readyState` is not
   `WEBSOCKET_READY_OPEN` — the same second-source reading the server carrier landed in M3,
   the same wording. The CLOSING window (peer close frame processed, close event not yet run)
   is the failing state the audit named: today the wrapper `send` no-ops and resolves there.
   Failing-first: pin that state red before the guard (the M3 unit's server-side test shapes
   show how to hold a wrapper in that window), then green.
2. **The A3 pin gains its no-queue half** (`tests/src/browser/factories.test.ts`): after the
   rejection, `start()` the transport again, wait until open, and assert id `99` never arrives
   — the auditor's prescription verbatim.
3. **Guide bounding** (`guides/mcp.md`, the WebSocket rows M3 added): the browser paragraph's
   "the Node face rejects the same condition with the same words" becomes TRUE by fix 1 —
   re-read it against the landed guard and keep it only if now exact; the server paragraph's
   "a peer that disconnects mid-request is answered by no write at all" is bounded to a
   disconnect that fires this transport's `close`, with the dead-peer limit sentence beside it
   (the carried RFC 6455 liveness finding already recorded in the M3 commit message — one
   guide sentence naming it).

## Scope

- Owned: `src/server/transports/WebSocketClientTransport.ts`,
  `tests/src/server/transports/WebSocketClientTransport.test.ts`,
  `tests/src/browser/factories.test.ts`, `guides/mcp.md` (the named WebSocket rows only).
- Off-limits: everything else.

## Execution

Perform the assignment directly and spawn nothing. Failing-first for fix 1 and the strengthened
A3 half. Validate scoped: `npm run check`, scoped oxlint and oxfmt `--check`,
`npm run test:src:server`, `npm run test:src:browser`, `npm run test:integration`,
`npm run test:guides`. No tree-wide commands.

## Output

Report to `tmp/units/m3f-report.md` and as your final message: failing-first records, the guide
sentences as bounded, run counts.

## Deviation contract

Stop and report when the Node-face guard reddens any client flow outside the closed-channel
condition, or a test outside the owned files reddens. Ancillary choices are yours to decide and
record.

## Acceptance criteria

1. The Node face rejects the CLOSING-window send, recorded red-then-green; the unbound-socket
   arm unchanged.
2. The A3 row proves reject, no delivery, and no queue.
3. The guide's WebSocket universals are exact against the shipped code; scoped runs green.
