# L1 reconciliation — the @orkestrel/lsp v1 contract

Date: 2026-08-25. Reconciled by the Orchestrator from two blind lanes on the shared brief
`.orkestrel/campaign/lsp-design-brief.md`:

- Subjective lane: `planner`, Opus 5, native subagent. Report:
  `.orkestrel/campaign/lsp-design-planner-report.md`.
- Objective lane: `analyst`, GPT-5.6 Sol, `codex exec` read-only. Journal
  `tmp/codex/lsp-design-analyst.jsonl`, session `01a03a89-27f9-7992-a154-5e043e73cb7a`. Report:
  `.orkestrel/campaign/lsp-design-analyst-report.md`.

Neither lane saw the other's answer before both returned. Probes the Orchestrator ran to settle
contested facts, with their readings:

- **Enumeration openness**, read from the staged
  `tmp/cursor/sources/lsp-3.18-metaModel.json` with a Python scan over `enumerations`:
  `TextDocumentSyncKind` closed `[0,1,2]`; `DiagnosticSeverity` closed `[1,2,3,4]`;
  `DiagnosticTag` closed `[1,2]`; `PositionEncodingKind` open (`supportsCustomValues: true`,
  known `['utf-8','utf-16','utf-32']`); `ErrorCodes` and `LSPErrorCodes` open.
  `metaData.version` is `3.18.0`.
- **mcp envelope precedent**, read from `/home/user/mcp/src/core/types.ts`: `JSONRPCId` at `:39`,
  `params?: Readonly<Record<string, unknown>>` at `:41` and `:59`, `JSONValue` imported from
  `@orkestrel/contract` and used for asserted-JSON fields only.
- **Probe's server**, read from `/home/user/probe/src/server/stages/LintStage.ts:200` and
  `/home/user/probe/package.json:109`: `spawn(process.execPath, [binary, '--lsp'])` drives the
  Oxlint language server; `oxlint` is a development dependency (`^1.80.0`), and `/home/user/lsp`
  carries the same tool.

## Convergences carried unchanged

Wire property names verbatim including `kind`; the v1 surface bounded by the capabilities the
client actually advertises; the client surface `capabilities` + `encoding` + `emitter` + `start` +
`open(document) → Promise<readonly LSPDiagnostic[]>` + `close(uri)` + `destroy()`; duplicate open
refused; push and pull diagnostics selected from `diagnosticProvider` per open and never merged;
sync-support gating of `open`; an unsupported inbound server request answered `-32601`; client-wide
`signal`, no per-call signal; `shutdown` → `exit` → bounded termination in `destroy`; no generic
`request`/`notify` escape hatch; the conformance suite pinned to the vendored model with
`metaData.version` asserted, named per-scenario failures, negative controls, byte-accurate framing
proofs with non-BMP content, split headers, out-of-order correlation; UTF-16 as the advertised and
default encoding.

## Rulings on the conflicts

Each ruling names the lane it follows and why; findings the ruling drops are in the dropped list.

1. **Names.** The JSON-RPC envelope uses `JSONRPCId`, `JSONRPCRequest`, `JSONRPCNotification`,
   `JSONRPCError`, `JSONRPCResultResponse`, `JSONRPCErrorResponse`, `JSONRPCResponse`,
   `JSONRPCMessage` — the mcp names, because the envelope is JSON-RPC's, not LSP's. Every LSP wire
   structure carries the `LSP` prefix (`LSPPosition`, `LSPRange`, `LSPDiagnostic`, and siblings),
   matching the `MCP*` precedent and keeping generic names such as `Position` out of the barrel.
   The conformance manifest maps each model structure name to its local exported name explicitly,
   so the prefix cannot impair parity. (Planner's naming; analyst's traceability concern carried
   by the manifest.)
2. **Enumerations follow the model's own openness.** `LSPDiagnosticSeverity = 1 | 2 | 3 | 4` and
   `LSPDiagnosticTag = 1 | 2` (closed in the model); `LSPTextDocumentSyncKind = 0 | 1 | 2`
   (closed); `LSPPositionEncoding = string` with the known values published as constants (open);
   `JSONRPCError.code` stays `number` with named constants (open). Settled by the probe, not by
   either lane whole.
3. **`LSPDiagnostic.message` is `string`.** The client never declares `markupMessageSupport`, and
   the capability is `@proposed`; the v1 test both lanes endorsed — only shapes the declared
   capabilities can elicit — excludes the `MarkupContent` arm and the `MarkupContent` type.
4. **The transport seam stands.** `LSPTransportInterface` (bytes, never frames) and `LSPClient`
   live in `src/core`; `StdioTransport` lives in `src/server`. Mirrors mcp, keeps the client's
   suite bench-provable with an in-process fixture peer, and gives the later `LSPServer` the same
   contract to reuse. The analyst's demand for real-stdio proof is carried by the server unit's
   host suite and the live Oxlint receipt.
5. **`@orkestrel/process` stays.** Its `Process` class, `lines`, and `send` are line-oriented and
   would corrupt frames — both lanes proved that, and the server unit is forbidden from touching
   them. Its `stopChild`, `killTree`, `waitForExit`, and `resolveExecutable` exports are the
   fleet's termination primitives, separately importable, and reimplementing them fails the reuse
   law. The stdio transport spawns with `node:child_process` raw streams and terminates through
   those helpers.
6. **Event map: `notification`, `exit`, `error`.** One generic door for unclaimed inbound traffic
   (the analyst's dedicated `diagnostics` event would overlap it); no `start` event (no consumer);
   `error` per the emitter convention (the analyst's `fault` renamed).
7. **`close(uri)` returns `Promise<void>`.** The `didClose` write can fail, and a `void` return
   would swallow that.
8. **`open` semantics, refined by the analyst:** an empty push publication resolves as an empty
   diagnostics array; an `unchanged` pull report with no stored prior `resultId` is a `protocol`
   error; the diagnostics path is derived per open and never stored.
9. **Encoding negotiation, refined by the analyst:** the client advertises `utf-16` only; a server
   selecting an encoding the client did not offer fails `start` with a `protocol` error before any
   document traffic; `encoding` is `LSPPositionEncoding | undefined`, `undefined` until `start`
   resolves, then the server's selection or the `utf-16` default.
10. **Options:** `LSPClientOptions` is `{ on?, error?, transport, workspace, timeout?, signal? }`.
    No `capabilities` override — no consumer needs one, and the package controlling its own
    advertisement is what makes the v1 boundary checkable. `LSPClientCapabilities` and
    `LSPInitializeParams` stay declared and conformance-checked because the client sends them.
    `StdioTransportOptions` is `{ server: { command, directory?, environment? }, grace? }`.
11. **`LSPError` codes:** `'spawn' | 'framing' | 'protocol' | 'duplicate' | 'server' | 'timeout'
    | 'aborted' | 'closed'`, the union of both lanes' distinct conditions; the numeric wire code
    rides in the error's context when one exists; `isLSPError` narrows.
12. **Envelope payloads:** `params?: Readonly<Record<string, unknown>>` (every LSP message the
    client sends or receives uses named parameters; mcp precedent), `result: unknown` narrowed by
    validators, `data?: unknown` on the wire error.
13. **`LSPHeader { readonly length: number }`.** The charset is validated (`utf-8` default,
    legacy `utf8` folded, anything else refused as `framing`) and then discarded — a constant
    after validation is derived state, not a stored field. The parser refuses a `Content-Length`
    above a published content-limit constant, so a hostile header cannot reserve unbounded memory.
14. **Conformance instruments, combined:** the analyst's typed projection manifest with named
    `ConformanceViolation` rows and negative controls is the primary instrument;
    `CONFORMANCE_SPEC = '3.18'` and `CONFORMANCE_MODEL = '3.18.0'` split protocol line from
    artifact; a `since`-scan excludes later-patch declarations
    (`DocumentDiagnosticReportPartialResult` is `3.18.1`); base-protocol and framing claims are
    proven by runtime fixtures, never attributed to the model. The planner's
    `vscode-languageserver-protocol` development-dependency assignability block is added as an
    independently authored oracle — it catches a transcription error our own manifest would share —
    gated by a `prove` receipt on mutual assignability before the conformance unit opens. The
    Ollama precedent is unverifiable here (no checkout in this environment); recorded, non-blocking,
    the mcp pattern carries the intent.
15. **The live real-server receipt is Oxlint's `--lsp` mode**, already a development dependency of
    the lsp workspace — the integration test initializes it over real stdio, opens a document with
    a known diagnostic, reads it through the public API, and proves no child survives `destroy`.

## Dropped findings, on the record

- Analyst: bare official structure names — dropped for the fleet's prefix precedent (ruling 1).
- Analyst: `MarkupContent` in the v1 message union — dropped by the capability-gated v1 test
  (ruling 3).
- Analyst: `DiagnosticSeverity`/`DiagnosticTag` as open `number` — falsified by the metaModel
  probe (ruling 2).
- Analyst: remove `@orkestrel/process` — dropped for the reuse law over its termination helpers
  (ruling 5).
- Analyst: client implemented in `src/server` with no transport seam — dropped (ruling 4).
- Analyst: `LSPIdentifier` — renamed `JSONRPCId` per mcp precedent (ruling 1).
- Analyst: `fault` event — renamed `error` (ruling 6).
- Planner: closed `LSPPositionEncoding` union — falsified by the metaModel probe (ruling 2).
- Planner: `start` event — dropped by the creation gate (ruling 6).
- Planner: `LSPFrame` with a stored `charset` — dropped for derived state (ruling 13).
- Planner: `capabilities?` client option — dropped by the creation gate (ruling 10).
- Planner: `close(): void` — dropped for honest write reporting (ruling 7).
- Planner: single `CONFORMANCE_SPEC = '3.18.0'` — replaced by the spec/model split (ruling 14).

## Wave L units, re-baselined

L1 (this design round) is closed. Writers in `/home/user/lsp` are strictly serial; the routing
ledger names role and engine per unit.

| Unit | Role · engine | Owns | Acceptance summary |
| --- | --- | --- | --- |
| L2 core contract and codec | `sol` · GPT-5.6 Sol (bench, `workspace-write`) | `src/core/types.ts`, `constants.ts`, `errors.ts`, `validators.ts`, `parsers.ts`, `helpers.ts`, `factories.ts`, `index.ts`; mirrored `tests/src/core/` | Scoped check, lint, format, and `src:core` tests green in-sandbox; byte lengths proved against `TextEncoder`; split and coalesced frames; charset and content-limit refusal; guards never throw |
| L3 client | `sol` · GPT-5.6 Sol (bench) | `src/core/LSPClient.ts`, the client row in `factories.ts`, its mirrored tests | In-process fixture peer proves correlation, ordering, encoding refusal, sync gating, push/pull selection, duplicate open, cancellation, bounded destroy |
| L4 stdio transport and host receipts | `implementer` · Opus 5 (native, host) | `src/server/*`, mirrored `tests/src/server/`, the live Oxlint integration test | `test:src:server` green on the host; termination through the process helpers; no orphan by recorded pid; the live Oxlint receipt |
| L5 conformance | `sol` · GPT-5.6 Sol (bench; the Orchestrator installs the development dependency on the host first) | vendored model fixture, `tests/setupConformance.ts`, `tests/conformance.test.ts`, config and script registration rows | Model version asserted; projection-manifest parity with negative controls; method and direction parity; the assignability block after its `prove` receipt |
| L6 guide | `implementer` · Opus 5 (native) | `guides/README.md`, `guides/lsp.md`, `guides/client.md`, `tests/guides.test.ts` | Guide parity; the exclusion table with an observable trigger per row |
| L7 | — | struck as a Wave L unit | probe adoption already lives in Wave P as P1; one carrier per finding |

An independent `verifier` runs the full gate chain over `/home/user/lsp` after L6. Suite-heavy
executions in different checkouts do not overlap: the L2 bench launch waits for the M1.1 full-suite
run in `/home/user/mcp` to finish, because concurrent suites on this container turn timing reds
into questions.

## Exclusions, merged (recorded in `guides/client.md` by L6)

| Excluded | Trigger that admits it |
| --- | --- |
| `didChange`, `willSave`, `didSave`, sync mode, versioned edit streams | A consumer re-inspecting an open URI without close and reopen |
| `documents` manager, `LSPDocumentInterface` | The same trigger; both land together |
| Work-done and partial-result progress | A consumer rendering or cancelling server progress; the client declares no progress capability, so a conformant server sends none |
| Dynamic registration | A required server capability reachable only through `client/registerCapability` |
| Workspace features (configuration, folders, `applyEdit`, file operations, workspace diagnostics) | A required server requesting one, or a consumer needing diagnostics beyond the opened URI |
| Every language feature | A consumer asking for the named operation; it arrives with its capability row, method literal, and result types together |
| Generic `request`/`notify` escape hatches | None — named operations with real consumers only |
| `identity` on the client surface | A consumer reporting which server produced a diagnostic |
| Browser environment | A browser consumer and a non-Node transport |
| `LSPServer` | A consumer serving LSP; mirrors the client contract over the same codec and transport seam |
| Automatic restart policy | An application owning a restart budget; `start` after exit stays the mechanism |

## Wave L exit criterion

Wave L exits when the declared core surface conforms to the vendored `3.18.0` artifact with
working negative controls; byte framing and JSON-RPC behavior pass the codec and fixture suites;
`LSPClient` proves initialization, capability selection, URI ownership, push or pull diagnostics,
cancellation, correlation, and ordered bounded teardown; the live Oxlint run produces the expected
diagnostic through the public API and leaves no child; `@orkestrel/contract` and
`@orkestrel/emitter` have demonstrated consumers and the process package's termination helpers are
consumed by the server while its line-oriented class stays unused; the guide is in parity with the
exclusion table recorded; and an independent `verifier` reports `format:check`, `lint:check`,
`check`, `build`, and `test` green in that order.
