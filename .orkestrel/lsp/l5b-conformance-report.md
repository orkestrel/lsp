1. What changed

- [tests/setupConformance.ts](/home/user/lsp/tests/setupConformance.ts) loads and hashes the mirror before parsing; resolves the installed manifest from the public entry; exports all tables, lookup helpers, drift formatting, guard fixtures, dependency checks, and version pins. It contains no `describe`, `it`, or `expect`, and every top-level declaration is exported.
- [tests/setupConformance.test.ts](/home/user/lsp/tests/setupConformance.test.ts) proves mirror loading, lookup hits and misses, drift formatting, byte perturbation rejection, and TypeScript-AST import detection.
- [tests/conformance.test.ts](/home/user/lsp/tests/conformance.test.ts) registers per-symbol method, numeral, value, structure, guard, dependency, and pin comparisons.
- [vite.config.ts](/home/user/lsp/vite.config.ts) exports `conformance`, places it between `config` and `distribution`, and uses the required include, Node environment, disabled browser, and sole setup file without a timeout.
- [package.json](/home/user/lsp/package.json) adds the exact `test:conformance` command and reaches it from the `test` chain.

2. The table populations

- `CONFORMANCE_METHODS`, derived from `LSP_METHODS`, the metaModel request/notification entries, and installed public namespaces: `LSP_METHODS.initialize`, `initialized`, `shutdown`, `exit`, `cancel`, `open`, `close`, `diagnostic`, and `publish`. Cancellation uses only the metaModel.
- `CONFORMANCE_NUMERALS`, derived from `src/core/constants.ts`: `JSONRPC_PARSE_ERROR`, `JSONRPC_INVALID_REQUEST`, `JSONRPC_METHOD_NOT_FOUND`, `JSONRPC_INVALID_PARAMS`, `JSONRPC_INTERNAL_ERROR`, `LSP_REQUEST_CANCELLED`, `LSP_CONTENT_MODIFIED`, `LSP_SERVER_CANCELLED`, and `LSP_REQUEST_FAILED`.
- `CONFORMANCE_VALUES`, derived from `LSP_ENCODINGS`, `LSPTextDocumentSyncKind`, `LSPDiagnosticSeverity`, and `LSPDiagnosticTag`: `utf-8`, `utf-16`, `utf-32`; `None`, `Full`, `Incremental`; `Error`, `Warning`, `Information`, `Hint`; `Unnecessary`, `Deprecated`. The encoding rows claim no closure over custom strings.
- `CONFORMANCE_STRUCTURES`, derived from `src/core/types.ts`, `src/core/validators.ts`, and the inline payloads in `LSPClient.ts`:
  - Initialization: `LSPInitializeParams.processId`, `clientInfo`, `rootUri`, `capabilities`; `LSPClientCapabilities.general`, `textDocument`, `general.positionEncodings`, `textDocument.synchronization`, `publishDiagnostics`, `diagnostic`; `LSPInitializeResult.capabilities`, `serverInfo`.
  - Identity and capabilities: `LSPIdentity.name` and `version` against `ClientInfo` and `ServerInfo`; `LSPServerCapabilities.positionEncoding`, `textDocumentSync`, `diagnosticProvider`; `LSPTextDocumentSyncOptions.openClose`, `change`; every `LSPDiagnosticOptions` member.
  - Document operations and reports: open/close `params.textDocument`; every `LSPDocumentDiagnosticParams` member; full-report `kind`, `resultId`, `items`; unchanged-report `kind`, `resultId`; every `LSPPublishDiagnosticsParams` member.
  - Diagnostic data: every member of `LSPPosition`, `LSPRange`, `LSPLocation`, `LSPCodeDescription`, `LSPDiagnosticRelated`, `LSPDiagnostic`, `LSPTextDocumentIdentifier`, and `LSPTextDocumentItem`.
- Guard rows cover `isLSPPosition`, `isLSPRange`, `isLSPLocation`, `isLSPCodeDescription`, `isLSPDiagnosticRelated`, `isLSPDiagnostic`, `isLSPPublishDiagnosticsParams`, `isLSPDocumentDiagnosticReport`, `isLSPIdentity`, `isLSPTextDocumentSyncOptions`, `isLSPDiagnosticOptions`, `isLSPServerCapabilities`, and `isLSPInitializeResult`. Installed corroboration uses the public guards named in the brief.

3. The red-first sequence

- Before the script existed, `npm run test:config` exited `1`. The wiring row reported expected `vitest run --config vite.config.ts --no-cache --reporter=dot --project conformance`, received `undefined`.
- That run also hit the unrelated existing row `policy plugin > loads every configured policy rule through the real binary`, which failed with `spawnSync /opt/node22/bin/node EPERM`.
- After adding the script and chain entry, the wiring row passed. The command still exited `1` only because the same nested-process denial remained. `tests/config.test.ts` was not edited.

4. The mutation accounts

- Planted coordinate: changed `ErrorCodes.ParseError` to `ErrorCodes.InvalidRequest`.
  - Red case: `'JSONRPC_PARSE_ERROR' matches the installed namespace`.
  - Drift: `JSONRPC_PARSE_ERROR drifted; installed=-32600`.
  - `npm run test:conformance`: exit `1`.
  - The brief exempts this owned-file plant from the backup and `cmp` ritual.
  - After restoring `ErrorCodes.ParseError`, the command exited `0`.
- Source control: changed `initialize: 'initialize'` to `initialize: 'initialize/control'`.
  - Backup: `tmp/l5b.tZQzWO/constants.ts.final`.
  - Mutated `cmp`: exit `1`.
  - Red case: `'LSP_METHODS.initialize' matches the metaModel method`.
  - Drift: `LSP_METHODS.initialize drifted; metaModel=initialize`.
  - `npm run test:conformance`: exit `1`.
  - Restored `cmp`: exit `0`.
  - Restored conformance run: exit `0`.

5. The Unknowns readings

- `LSPDiagnosticSeverity` declares `1 | 2 | 3 | 4`; `LSPDiagnosticTag` declares `1 | 2`. The value table covers their installed and metaModel names.
- The final conformance reading reported `Duration 1.40s`, with `import 1.11s` and `tests 37ms`.
- Installed manifest version: `3.18.2`. Lockfile version: `3.18.2`. Declared range: `^3.18.2`.

6. Scoped gate readings

- `npm run check`: exit `0`.
- `npm run test:config`: exit `1`; only the existing nested policy-binary spawn failed with `EPERM`.
- `npm run test:setup`: exit `1`; the existing `readProcessTable` and `readChildProcesses` cases failed because nested `ps` spawns returned `EPERM`.
- Filtered `setupConformance.test.ts` through the `setup` project: exit `0`.
- `npm run test:conformance`: exit `0`.
- Scoped `oxfmt --check` over all owned files: exit `0`.
- Scoped `oxlint --deny-warnings` over all owned files: exit `0`.
- `git diff --check`: exit `0`.
- The mirror hash remains `caae8df639a4248520a3f589fd72945365e9d8ebca5baf564161a515430d9d41`.
- `git diff` reports no changes to `src/core/constants.ts`, `tests/config.test.ts`, or `tests/mirrors/metaModel.json`.

7. Observations outside scope

- Configuration-policy execution owns the nested Oxlint spawn failure.
- Setup process-table infrastructure owns the nested `ps` spawn failures.
- Documentation parity owns the absent `guides` project noted by the design record.
- Final status contains only the owned `package.json`, `vite.config.ts`, and conformance files.

8. Claims needing host verification

- A host outside the nested bench sandbox must run `npm run test:config` and confirm exit `0`.
- A host outside the nested bench sandbox must run `npm run test:setup` and confirm exit `0`.