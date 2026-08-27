**Question:** Does the lsp suite prove pull (`textDocument/diagnostic`) and push (`textDocument/publishDiagnostics`) against real or protocol-faithful peers, and what does each proof drive?

**Evidence**

**Pull path**
- Fixture: in-process `LSPFixtureTransport` in `tests/src/core/LSPClient.test.ts:25`. Default capabilities are `{ textDocumentSync: 1 }` (`:54`); pull cases override with `diagnosticProvider: { interFileDependencies: false, workspaceDiagnostics: false }`. No spawn. `send` parses Content-Length bytes (`:93-104`); `receive` emits encoded chunks (`:116-118`).
- Advertise + exchange: initialize auto-reply uses those capabilities (`:159-167`). Pull cases write `textDocument/didOpen` then `textDocument/diagnostic` (`src/core/LSPClient.ts:290-319`).
- Assertions: empty full report (`tests/src/core/LSPClient.test.ts:620-648`); abort writes `$/cancelRequest` (`:652-683`); closeable after abort (`:686-711`); settle after constructor timeout (`:714-741`); unchanged without prior `resultId` → `protocol` (`:744-773`); omit `resultId` then later unchanged fails (`:776-822`); no `previousResultId` after exit (`:825-857`); out-of-order JSON-RPC ids map to the matching URI (`:937-1007`); isolated cancel (`:1074-1131`); client abort / transport exit (`:1134-1205`); JSON-RPC error on diagnostic (`:1232-1260`); send throw/false → `closed` (`:1283-1336`).
- Guard-only (not a client exchange): `isLSPDocumentDiagnosticReport` / `isLSPDiagnosticOptions` (`tests/src/core/validators.test.ts:98-120`); conformance names `textDocument/diagnostic` and `diagnosticProvider` (`tests/setupConformance.ts:701`, `:930-932`; `tests/conformance.test.ts:114`).

**Push path**
- Same in-process fixture, no `diagnosticProvider`. Open waits for `textDocument/publishDiagnostics` (`src/core/LSPClient.ts:347-361`, settle by URI `:510-534`).
- Assertions: numeric sync 1/2 (`tests/src/core/LSPClient.test.ts:348-373`); `openClose: true` (`:397-419`); empty publication (`:422-443`); already-aborted open does not write didOpen (`:446-482`); abort without destroy (`:485-525`); closeable after abort (`:528-547`); settle after constructor timeout (`:550-569`); abort isolation by URI (`:572-601`); call-signal bound (`:604-617`); unowned URI → `notification` (`:888-906`); close then reopen (`:1339-1370`); publish racing close (`:1373-1395`); drain across generation (`:1635-1665`). Fixture publications are `diagnostics: []` except the live receipt below.
- Live child: `tests/src/server/integration.test.ts:20-66` spawns `node` + `node_modules/oxlint/bin/oxlint --lsp` (`tests/setupServer.ts:44-45`, `:105-107`) via `createStdioClientTransport`. Pins `textDocumentSync` `{ openClose: true, change: 1, save: { includeText: false } }`, `utf-16`, one diagnostic `eslint(no-debugger)` severity 1 range `0:0-0:8`. Does not pin `diagnosticProvider` or which method carried the diagnostic.
- Spawned `tests/src/server/fixtures/peer.mjs` is stdio-faithful for transport proofs only; it has no initialize / diagnostic / publish handlers (`:33-64`). `tests/src/server/factories.test.ts:16` drives that peer, not diagnostics.
- Framing samples only: `tests/src/core/helpers.test.ts:21`, `:442`; `tests/src/core/parsers.test.ts:17`. Guard: `isLSPPublishDiagnosticsParams` (`tests/src/core/validators.test.ts:91-96`).

**Path choice at initialize**
- Client advertises pull and push: `LSP_CAPABILITIES.textDocument` (`src/core/constants.ts:27-33`); handshake pins `publishDiagnostics: {}` and `diagnostic: {}` (`tests/src/core/LSPClient.test.ts:177-196`).
- Server result stored (`src/core/LSPClient.ts:271`). `open` selects: `diagnosticProvider !== undefined` → `#openPull`, else `#openPush` (`:197-199`).
- No test asserts the branch in one case, or that a push peer never receives `textDocument/diagnostic`. Selection is shown by fixture capabilities on the cases above. `identifier` is forwarded in `#openPull` (`:314-316`) with no client test that sets it.

**Real child vs in-process**
- Pull and push client proofs: in-process `LSPFixtureTransport`, source `@src/core`, not `dist/`.
- Stdio child with `LSPClient.open`: oxlint receipt only (`tests/src/server/integration.test.ts:22-50`). Transport-only spawn: fixture peer (`tests/src/server/factories.test.ts:16-19`). Neither is lsp’s built entry.

**Gaps**
- Pull never crosses child-process stdio or a real language server.
- Oxlint receipt does not pin pull vs push.
- No client proof that `identifier` is sent, or that `kind: 'unchanged'` with a prior `resultId` returns the cached items.
- Push fixture proofs pin empty arrays, not coded items (coded items appear only on the oxlint receipt).
- Invalid publish drop is validator/guide (`guides/probe.md:787-789`), not a client exchange.
- `peer.mjs` does not speak diagnostics.

**Distillate**

Pull is a client-level exchange against an in-process protocol-faithful fixture that advertises `diagnosticProvider` and answers `textDocument/diagnostic`. It pins empty full reports, abort/`$/cancelRequest`, timeout independence, unchanged-without-prior refusal, `resultId` cache clear, generation drop of `previousResultId`, and out-of-order JSON-RPC id correlation.

Push is the same fixture with no `diagnosticProvider`, waiting on `textDocument/publishDiagnostics` correlated by URI. It pins empty publications, abort isolation, unowned-URI notifications, and generation drain.

A spawned Oxlint `--lsp` child is opened through `createLSPClient` and pins one real diagnostic. That receipt does not assert `diagnosticProvider` or the method.

The client advertises pull and push at initialize, then `#open` keys on `diagnosticProvider`. That choice is exercised by fixture capabilities, not by a dedicated assertion.

No pull proof drives a child or a built entry. `peer.mjs` is not a diagnostic peer. Identifier forwarding and successful unchanged reuse are implementation-only.

**Unknowns**

- Whether the oxlint child in this workspace advertises `diagnosticProvider` (receipt does not read it; `guides/probe.md:781-783` claims it does not as of 2026-08-26).
- Whether oxlint would still satisfy `integration.test.ts` if it switched to pull.
