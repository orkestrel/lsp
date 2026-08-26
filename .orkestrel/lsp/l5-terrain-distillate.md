# L5 terrain — Grok distillate over mcp `fa11c89` and lsp (2026-08-26)

Journal: `/home/user/mcp/tmp/cursor/lsp-conformance.log` (Cursor Grok,
`cursor-grok-4.6-high`, journal populated past its header). Repositories clean at the
bridge's run. Grok's `file:line` pointers are unverified — spot-check each before it enters
a brief.

## 1. mcp's conformance machinery — a live foreign-client run, not a schema diff

- `package.json:107` pins `@modelcontextprotocol/conformance@0.2.0-alpha.10` as a
  development dependency.
- `vite.config.ts:190-198` defines the `conformance` Vitest project.
- `tests/setupConformance.ts` hosts the fixture server and the runner harness; the upstream
  runner is resolved with `createRequire(...).resolve(CONFORMANCE_ENTRY)` (`:537-539`) and
  spawned with no shell (`:558-561`); failures name scenario ids parsed by the regex at
  `:57-58`, not TypeScript symbols.
- `tests/conformance.test.ts` asserts the version pin (`:63-65`) and scenario tallies
  against hardcoded `EXPECTED` rows (`:20-41`, asserted `:67-68`, totals at `:78-79`).
- `tests/config.test.ts:115-127,548-560` auto-registers the project and enforces the
  script and gate wiring.

## 2. lsp's protocol surface

- `LSP_METHODS` single table at `src/core/constants.ts:1-12`; JSON-RPC and LSP error
  numerals at `:17-42`.
- Capability types at `src/core/types.ts:142-196`; message guards at
  `src/core/validators.ts:28-307`; parser and encoder at `src/core/parsers.ts:33-36` and
  `src/core/helpers.ts:17`.
- No protocol-version constant exists in `src/`.
- Pinned by `tests/src/core/LSPClient.test.ts:18` (imports `LSP_METHODS`);
  `validators.test.ts`, `parsers.test.ts`, and `helpers.test.ts` use string literals
  rather than the constant.

## 3. The metaModel

- No vendored metaModel instance existed anywhere searched —
  `/home/user/mcp/tmp/cursor/sources/` does not exist, `/home/user/lsp/tmp/` was empty,
  and a workspace-wide glob found nothing.
- The installed package ships the schema (not an instance) at
  `node_modules/vscode-languageserver-protocol/metaModel.schema.json:1-864`: `MetaModel`
  top-level members (`:307-358`) are `metaData, requests, notifications, structures,
  enumerations, typeAliases`; request entry required fields at `:522-609`; notification
  entry `:361-434`; structure entry `:629-686`; enumeration entry `:93-145`.
- The Orchestrator fetched the 3.18 instance on 2026-08-26:
  `lsp-metamodel-3.18.json`, 434,788 bytes, `metaData.version` `3.18.0`, with 69 requests,
  26 notifications, 387 structures, and 40 enumerations (counts are the instance's own
  array lengths, read from the fetched file).

## 4. The installed vscode-languageserver-protocol

- Version `3.18.2` (`package.json:4`), no `main`, exports map at `:15-28` (`.`, `./node`,
  `./browser`).
- Namespaces matching lsp's `LSP_METHODS`: `InitializeRequest`, `InitializedNotification`,
  `ShutdownRequest`, `ExitNotification`, `DidOpenTextDocumentNotification`,
  `DidCloseTextDocumentNotification`, `PublishDiagnosticsNotification`,
  `DocumentDiagnosticRequest`.
- `$/cancelRequest` lives on `vscode-jsonrpc`, not this package.
- `PositionEncodingKind` and `TextDocumentSyncKind` constants exist as namespaces.

## 5. lsp's Vitest layout

- `vite.config.ts:165-169` declares projects `srcCore, srcServer, policy, setup, config,
  distribution, probe` — no `conformance` project.
- `tests/setup.ts` exists and is empty.
- `tests/config.test.ts:115-127` already treats `tests/conformance.test.ts` as the trigger
  filename for auto-registering a `conformance` label, so the convention point is: add
  `tests/conformance.test.ts` (with `tests/setupConformance.ts` and its proof mirroring
  mcp), and a `conformance` factory in `vite.config.ts` slotted after `config` and before
  `distribution`.

## Re-baseline this distillate forces

The plan's L5 rested on "adopt the mcp conformance suite" and "the vendored metaModel from
the staged sources". The probe overturns the mechanism: mcp's suite drives a live foreign
conformance client, and no such runner exists for LSP; the staged metaModel did not
survive on disk and is re-fetched. L5 therefore transforms — same intent (the package's
protocol surface proven against the upstream authority, kept on the development-dependency
side), new mechanism to be ruled by the design round in
`l5-conformance-design-brief.md`. The exit criterion is unchanged.
