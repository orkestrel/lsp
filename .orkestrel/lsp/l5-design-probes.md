# L5 design — Orchestrator probe readings over the fetched metaModel instance (2026-08-26)

Instrument: a `node -e` read over the scratchpad copy of `lsp-metamodel-3.18.json`
(434,788 bytes, `metaData.version` `3.18.0`), taken while the design lanes ran, blind to
both.

- `$/cancelRequest` IS in the instance's `notifications`, `messageDirection` `both` — the
  method row's authority coordinate is the metaModel itself; the planner's contingency
  (routing that row to the installed cancellation namespace) is unnecessary.
- Optionality is flat: each structure property carries `optional: true` or omits the
  member. `DiagnosticOptions` reads `identifier` optional, `interFileDependencies` and
  `workspaceDiagnostics` required — matching the `isLSPDiagnosticOptions` guard.
  `TextDocumentSyncOptions` reads `openClose`, `change`, `willSave`,
  `willSaveWaitUntil`, and `save`, every one optional — matching the guard's optional
  reads.
- The instance carries both error enumerations: `ErrorCodes` with `ParseError` `-32700`,
  `InvalidRequest` `-32600`, `MethodNotFound` `-32601`, `InvalidParams` `-32602`,
  `InternalError` `-32603`, `ServerNotInitialized` `-32002`, and `UnknownErrorCode`
  `-32001`; `LSPErrorCodes` with `RequestFailed` `-32803`, `ServerCancelled` `-32802`,
  `ContentModified` `-32801`, and `RequestCancelled` `-32800`. The planner's numeral
  tension (installed namespaces as the sole numeral authority) therefore has a live
  alternative the reconciliation rules on.
- `PositionEncodingKind` values: `utf-8`, `utf-16`, `utf-32`. `TextDocumentSyncKind`:
  `None` 0, `Full` 1, `Incremental` 2.
- `_InitializeParams` members: `processId`, `clientInfo`, `locale`, `rootPath`, `rootUri`,
  `capabilities`, `initializationOptions`, `trace` — no protocol-version member, which
  supports the planner's axis-5 ruling against a public version constant.
- `/home/user/lsp/scripts/` exists (`codex.sh`, `cursor.sh`, `deps.sh`, `ollama.sh`), so
  `scripts/metamodel.sh` has the home the planner's axis-3 shape names.
