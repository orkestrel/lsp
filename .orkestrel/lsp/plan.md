# Plan of record — lsp reconciliation and improvement campaign, 2026-08-26

Reconciled by the Orchestrator from the adversarial design round: the subjective lane (`planner`,
Opus 5, native) and the objective lane (Grok on the Cursor bench, substituting for Sol by the
user's instruction). Verdict sources: the planner agent transcript and `g5-objective.log`, both
answering `design-brief.md`.

## Rulings

1. **Decomposition.** `LSPClient` stays whole. Both lanes: the correlation, publication,
   decode/dispatch, and generation regions are the class's defining engine; extraction hollows it
   into delegates, and the public surface has no compound member family that would earn a manager.
   mcp's own client keeps the same regions private. Two leaf extractions land instead:
   `waitForDeadline(ms)` into `src/core/helpers.ts` (the deadline race is repeated at
   `LSPClient.ts:666-673` and `:678-687`; the centralize-twice law forces it) and a frozen
   `LSP_CAPABILITIES` into `src/core/constants.ts` (removes the two-literal `'utf-16'` drift
   between the advertisement at `:246` and the refusal at `:263`, and makes the guide's
   "advertises utf-16 alone" claim executable).
2. **Seams.** `#releaseGeneration` folds (1:1 forward, one caller). `#cancelRequest` stays: it
   composes the notification shape, the send, and the failure-to-emitter policy, exactly like its
   sibling `#respondUnsupported`; folding one of the pair gives the class two vocabularies for one
   concept. The ROADMAP row closes with this ruling.
3. **Transport seam.** The byte seam stays, permanently for stream transports: LSP fixes one
   Content-Length framing for stdio, socket, and pipe, so the codec is a package-wide constant and
   the client owns it. A future WebSocket transport re-frames at the edge (header bytes prepended
   on `message`, stripped on `send`) rather than adding a message seam.
4. **New transports.** None now — probe, the only consumer, is warm-resident over stdio with no
   measured transport bottleneck (warm prove 437-495 ms is linter work, not framing). Deferred
   with triggers: `SocketTransport` (one `node:net` class; `server` group carries `{ host, port }`
   or `{ path }`) when a consumer must attach to a server it does not spawn; WebSocket when a
   browser consumer must reach a server it cannot spawn (platform `WebSocket`, not
   `@orkestrel/websocket`, which is Node-only and text-frame). node-ipc is EXCLUDED by ruling:
   message-shaped (no Content-Length), and it only reaches a self-spawned peer, which stdio
   already serves.
5. **Contract adoption.** Keep every `export function is*` guard, the `isRecord` root, and the
   `holds` boundary. Adopt combinators inline at the sites where local code re-encodes them:
   severity `optionalOf(literalOf(1, 2, 3, 4))`, tags `optionalOf(arrayOf(literalOf(1, 2)))`,
   relatedInformation `optionalOf(arrayOf(isLSPDiagnosticRelated))`, diagnostics and items
   `arrayOf(isLSPDiagnostic)`, sync change `optionalOf(literalOf(0, 1, 2))`, textDocumentSync
   `optionalOf(unionOf(literalOf(0, 1, 2), isLSPTextDocumentSyncOptions))`. The JSON-RPC message
   guards stay hand-written whole (forbidden-key XOR logic). REFUSED: `objectOf` at guard roots —
   it admits member-carrying callables and prototype-chain reads, widening every exported guard
   where `isRecord` refuses non-plain objects, and `isLSPRange` ships on probe's public `Issue`
   contract; `recordOf` (exact-record over foreign data); `enumOf` (no runtime enum);
   `attempt`/`Result` (the package throws `LSPError` consistently, which the error rules permit).
   The objective lane proposed `objectOf` adoption; overruled on the subjective lane's verified
   mechanism, per the user's weighting.
6. **abort/timeout.** Neither package is added. `linkSignal` wraps `AbortSignal.any`; `Timeout`
   is a lifecycle timer entity where the need is a one-shot deadline. Native composition plus the
   `waitForDeadline` leaf closes it. `package.json` untouched is a load-bearing acceptance
   criterion on every unit.
7. **`LSPServer`.** Stays in Next with the trigger: deferred until a fleet package must answer
   LSP requests rather than send them; that consumer's first requirement set is the design brief.
8. **ROADMAP.** The stale branch table and campaign-end section go; `## Delivered` absorbs
   `## Delivered to its first consumer`; the `.orkestrel/` navigation sentence is rewritten to
   git history; fleet findings are verified row by row before they are kept (U0); node-ipc joins
   `## Deliberately deferred`; `## Next` becomes the sequenced plan with a close condition or
   trigger per row; the campaign's rulings (byte seam, no new dependencies, transport performance
   reading) are recorded once each.
9. **Other refusals.** `formatConformanceValue` stays (opposite totality from `roundTripJSON` —
   the formatter must never throw); `@orkestrel/pool` is a probe-side note only; `@orkestrel/sse`
   and `@orkestrel/tool` have no lsp surface today.

## Exit criterion

The campaign closes when: `ROADMAP.md` carries no stale live-state claim and records rulings 2-7;
`#releaseGeneration` is folded; the ruling-5 combinator sites are adopted with the accepted sets
provably unmoved; `waitForDeadline` and `LSP_CAPABILITIES` are extracted with guide parity and an
executed advertisement assertion; `package.json` is byte-identical to `2c0eba8`; and the full gate
chain reads green under an independent verifier.

## Units and routing

| Unit | Subject | Role / engine | Owns | After |
| ---- | ------- | ------------- | ---- | ----- |
| U0 | Verify carried fleet findings against each repo's `main` | Grok (bench, read-only) | nothing | — (parallel) |
| U1 | Combinator adoption per ruling 5 | `implementer` / Opus 5 | `src/core/validators.ts`, `tests/src/core/validators.test.ts` | checkpoint commit |
| U2 | Seam fold + `waitForDeadline` + `LSP_CAPABILITIES` + guide parity | `implementer` / Opus 5 | `src/core/LSPClient.ts`, `src/core/helpers.ts`, `src/core/constants.ts`, `guides/lsp.md`, `tests/src/core/LSPClient.test.ts`, `tests/src/core/helpers.test.ts`, `tests/guides.test.ts` | U1 |
| A1 | Objective falsification audit of U1+U2 | Grok (bench, read-only; the engine that did not write) | nothing | U2 |
| U3 | ROADMAP reconciliation per ruling 8 | `implementer` / Opus 5 | `ROADMAP.md` | U0, U2, A1 |
| U4 | Authoritative gates | `verifier` / Sonnet | nothing | U3 |

Routing note: the design assigned U1 to the Sol `implementer`; Sol is user-excluded this session,
and Grok is read-only, so the writing falls to the Opus `implementer` per the engine-unavailable
table. Recorded here and in `routing-ledger.md`. The A1 auditor is Grok so that no Opus-written
unit is audited only by its own engine.

## Open questions routed into units

- Whether `AbortSignal.timeout` holds the event loop after its race settles: U2 runs a
  `tmp/probe/` runtime probe with a `setTimeout` negative control before shaping
  `waitForDeadline`.
- Whether the conformance suite reads the advertised capability set: U2 greps
  `tests/conformance.test.ts` before writing the guide assertion.
- Which fleet-finding rows already shipped: U0's table.
