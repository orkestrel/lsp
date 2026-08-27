**Question:** How does `@orkestrel/probe` implement its MCP server application and drive its toolchain stages, and where does it consume `@orkestrel/mcp` and `@orkestrel/lsp`?

## Evidence

### 1. Public surface

- `src/core/index.ts:1-6` re-exports `types`, `constants`, `errors`, `validators`, `helpers`, `shapers`.
- Core contracts: `Stage`, `Draft`, `Case`, `Control`, `Claim`, `Party`, `Issue`, `Check`, `Toolchain`, `Project`, `Verdict`, `ProbeEventMap`, `ProbeOptions`, `ProbeInterface`, `ProbeErrorCode`, `ProbeErrorContext`, `ProbeErrorOptions` (`src/core/types.ts`).
- Core values: `PROBE_STAGES` / `PROBE_PARTIES` / `PROBE_ERROR_CODES` / `RECEIPT_PREFIX` / `RECEIPT_SEPARATOR` (`src/core/constants.ts:14-81`); `ProbeError`, `isProbeError`, `createDestroyedError` (`src/core/errors.ts`); guards `isStage`…`isVerdict` (`src/core/validators.ts`); `formatIssue` / `formatCheck` / `formatVerdict` / `computeReceipt` / `formatSpecification` / `matchesSpecification` (`src/core/helpers.ts`); `DRAFT_SHAPE` / `CASE_SHAPE` / `CONTROL_SHAPE` / `CLAIM_SHAPE` (`src/core/shapers.ts`).
- `src/server/index.ts:1-8` re-exports server `types`, `helpers`, `Overlay`, `Probe`, `ProbeServer`, `LintStage`, `RuntimeStage`, `TypeStage`.
- `src/bin/main.ts:3-10` constructs `new ProbeServer().start()` with no CLI args and no env reads. A `ProbeError` is written to stderr as `[origin] code: message` and `process.exitCode = 1`. Other throws rethrow.
- Bin default workspace is `process.cwd()` via `Probe` (`src/server/Probe.ts:86`). Transport is newline-delimited JSON stdio (`createStdioServer` + owned `PassThrough`; `src/server/ProbeServer.ts:65-73,82-103`). Package bin: `"probe": "dist/bin/main.js"` (`package.json:21-23`).

### 2. `ProbeServer` and `prove`

- Construction creates `Probe`, publishes `prove`, wraps `createMCPServer` in `createMCPLegacy`, binds `createStdioServer({ input: owned PassThrough })` (`src/server/ProbeServer.ts:65-73,160-183`).
- Tool registration is `@orkestrel/tool` then MCP: `createToolManager().add(createTool({ name: 'prove', description, parameters, execute }))` then `createMCPServer({ identity: { name: 'probe', version }, tools, execution })` (`src/server/ProbeServer.ts:168-182`). No tool annotations; `ToolOptions` has `name` / `description` / `summary` / `parameters` / `execute` only (`node_modules/@orkestrel/tool/dist/src/core/index.d.ts:301-312`).
- Input schema: `schemaToParameters(compileSchema(CLAIM_SHAPE))` (`src/server/ProbeServer.ts:161`; shape at `src/core/shapers.ts:86-97`: `project`, `case`, `control`). Admission is `isClaim` (`src/server/ProbeServer.ts:186-199`). Schema is wider than the guard at `Draft.path`; escaping paths are named by `findRefusedPaths` (`src/server/helpers.ts:655-699`).
- Success wire result: `{ resultType: 'complete', content: [{ type: 'text', text: formatVerdict(verdict) }] }` (`src/server/ProbeServer.ts:202-215`). No `structuredContent`. Failed tool result is returned unchanged (`:204`). Invalid verdict throws instrument `malformed` (`:205-210`).
- Logging: MCP replies on stdout (stdio transport default). Construction failures on stderr (`src/bin/main.ts:8`). Vitest stdout is drained; stderr stays `process.stderr` (`src/server/stages/RuntimeStage.ts:310-336`).

### 3. `Probe` and `Overlay`

- `prove`: refuse identical control (`#admit`, `src/server/Probe.ts:657-672`) → await arming (`#ready`, `:190-203`) → resolve project (`#resolve` via `TypeStage`, `:550-567`) → digest (`computeDigest`, `:145-148`) → inspect case then control (`#inspect` enqueues type/lint/runtime in parallel, `:398-408`) → `computeReceipt` (`src/core/helpers.ts:146-172`) → emit `prove` (`src/server/Probe.ts:163`).
- Overlay: per-inspection candidate map with `revision`, optional case-folding keys, `set`/`text`/`covers`/`clear` (`src/server/Overlay.ts:32-109`). Type and lint read overlay text; runtime writes a generated sibling and overlays only `files` (`src/core/types.ts:23-26`; `src/server/stages/RuntimeStage.ts:164-171`).
- Caller evidence: in-process `Verdict` (`src/core/types.ts:332-354`). MCP client gets `formatVerdict` text (`src/core/helpers.ts:86-101`): identity, claim digest, toolchain, project, reason, per-stage case/control checks, closing `receipt <token>` or `no receipt`.

### 4. Stages

- **TypeStage** — in-process workspace `typescript` language services (`loadWorkspaceModule`, `createLanguageService`). No child process. Overlay host for reads/versions. Diagnostics via `getSyntacticDiagnostics` / `getSemanticDiagnostics` (`src/server/stages/TypeStage.ts:71-74,225-230,272-327,420-436`). `@orkestrel/process` unused. `@orkestrel/queue` / `@orkestrel/timeout` used by `Probe`, not the stage (`src/server/Probe.ts:104-118,471-492`).
- **LintStage** — spawns `[process.execPath, oxlintBin, '--lsp']` via `createStdioTransport` (`src/server/stages/LintStage.ts:145-161`; binary from `resolveWorkspaceBinary`, `src/server/helpers.ts:461-487`). Opens virtual docs, waits on caller `AbortSignal`, closes (`:186-226`). `@orkestrel/process` is a transitive dep of `@orkestrel/lsp`, not imported here.
- **RuntimeStage** — in-process `vitest/node` `createVitest` with `pool: 'threads'`, overlay Vite plugin, writes `*.probe-<pid>-<uuid>.*` sibling, runs, evicts, unlinks (`src/server/stages/RuntimeStage.ts:122-126,287-337,427-461`). Stdout drained; stderr kept (`:310-336`). No `@orkestrel/process` import.

### 5. LSP consumption

Imports in published source:

- Types: `LSPRange` (`src/core/types.ts:2`); `isLSPRange` (`src/core/validators.ts:24`).
- Runtime: `LSPClientInterface`, `LSPDiagnostic`, `LSPExit`; `createLSPClient`; `createStdioTransport` (`src/server/stages/LintStage.ts:3-6`).

Factories/classes: `createLSPClient` → `LSPClient`; `createStdioTransport` → `StdioTransport` (`node_modules/@orkestrel/lsp/dist/src/core/index.d.ts:24,336`; `.../server/index.d.ts:23,57`).

Binary: workspace `oxlint` + `--lsp` (`src/server/stages/LintStage.ts:146-152`).

Requests (client, not probe-authored): `initialize` + `initialized` on `start` (`node_modules/@orkestrel/lsp/dist/src/core/index.js:746-785`); `textDocument/didOpen` then either pull `textDocument/diagnostic` (if `diagnosticProvider`) or wait for `textDocument/publishDiagnostics` (`:713-715,803-871`); `textDocument/didClose` (`:723-727`); `shutdown` then `exit` on destroy (`:1090-1114`). Probe timeout for lifecycle is 2000 ms (`src/server/stages/LintStage.ts:60,156`). Probe does not choose pull vs push; the client does from initialize capabilities.

Lifecycle: warm in constructor (`:80-86`); `client.start()` (`:160`); `client.destroy()` on stage destroy (`:138-140`); `exit` event recorded (`:159,176-178`).

### 6. MCP consumption

Published source imports (`src/server/ProbeServer.ts:2,7-8`):

- Types: `MCPCallResult`, `MCPExecutionContext`.
- Factories: `createMCPLegacy`, `createMCPServer` from `@orkestrel/mcp`; `createStdioServer` from `@orkestrel/mcp/server`.

No `createMCPClient`, `createMCPSession`, HTTP, or WebSocket in `src/`. Stdio is one stdin/stdout pump (`createStdioServer` remarks at `node_modules/@orkestrel/mcp/dist/src/server/index.d.ts:382-400`). Dual-era: `createMCPLegacy(this.#publish())` (`src/server/ProbeServer.ts:73`). Tests also use `createMCPClient` / `createStdioClientTransport` / `createMCPLegacyClientTransport` (`tests/src/bin/main.test.ts:8-14`).

### 7. Tests

Areas (mirrors `src/` plus gates):

- Core: `tests/src/core/validators.test.ts`, `helpers.test.ts`, `errors.test.ts`.
- Server: `Overlay.test.ts`, `Probe.test.ts` (`describe.sequential('probe')` at `:153`), `ProbeServer.test.ts`, `helpers.test.ts`, `stages/{Type,Lint,Runtime}Stage.test.ts`.
- Bin: `tests/src/bin/main.test.ts`.
- Gates: `tests/{setup,setupServer,distribution,guides,policy,config}.test.ts`.

`src/` has no `TODO` / `.skip` / `.todo`.

Conditional skips (host cannot build the fixture; not deferred work):

- `tests/src/bin/main.test.ts:158,513` — `it.skipIf(!existsSync('/usr/bin/script'))` (stdout/stderr proofs).
- `tests/src/bin/main.test.ts:635` — skip when the host does not deliver the child's signal handler.
- `tests/src/server/stages/LintStage.test.ts:518,1393` — skip when the host cannot fill/break the child's stdin pipe.
- `tests/src/server/stages/RuntimeStage.test.ts:1203` and `tests/src/server/Probe.test.ts:1521` — skip when `mkfifo` cannot park progress/teardown.
- `tests/distribution.test.ts:682-684` — skip when `npm ping` did not answer.

Fixture strings containing `test.skip` / `test.todo` are candidate text under test (`RuntimeStage.test.ts:312`; `Probe.test.ts:170`), not skipped suite rows.

### 8. Guides

- `guides/README.md` — index; package spec is `probe.md`.
- `guides/probe.md` — this package: claim/verdict/receipt, MCP registration, stages.
- Vendored dependency mirrors (named as such in `guides/probe.md:1008-1013`, and matching installed packages): `mcp.md` (`@orkestrel/mcp`), `tool.md` (`@orkestrel/tool`), `contract.md` (`@orkestrel/contract`), plus `emitter.md`, `queue.md`, `timeout.md`, `guide.md`, `scaffold.md`, `test.md`. No `lsp.md`.

### 9. Registration

- Example: `.mcp.json:7-10` and `README.md:29-38` / `guides/probe.md:454-463`:

```json
{ "mcpServers": { "probe": { "command": "node", "args": ["node_modules/@orkestrel/probe/dist/bin/main.js"], "cwd": "/srv/checkout" } } }
```

- Invoke the resolved JS entry with the harness Node; not `npx`, not the `.bin` shim (`README.md:25-27`; `guides/probe.md:466-468`).
- Package bin name `probe` → `dist/bin/main.js` (`package.json:21-23`).

## Distillate

`@orkestrel/probe` is a stdio MCP server whose only tool is `prove`. `src/bin/main.ts` starts `ProbeServer` with no argv/env; workspace is `cwd`. `ProbeServer` builds a `Probe`, registers `prove` through `@orkestrel/tool` (`createTool` + `createToolManager`), wraps it in `@orkestrel/mcp` (`createMCPServer` + `createMCPLegacy` + `createStdioServer` on an owned stream forwarded from stdin). Identity is `{ name: 'probe', version }` from `package.json`. No MCP session object; one stdio connection, dual-era handshake.

`prove` input is `CLAIM_SHAPE` compiled to JSON Schema, admitted by `isClaim`. Output on the wire is one text block from `formatVerdict`, not the `Verdict` record. Throws are `ProbeError` (`origin` × `code`). Boot failures go to stderr.

`Probe` arms resident TypeScript, Oxlint-LSP, and Vitest stages, serializes each stage with `@orkestrel/queue` (`concurrency: 1`, `retries: 0`), and bounds each inspection with `@orkestrel/timeout` (default 30_000 ms). A prove run: admit → arm → resolve project → overlay-inspect case → overlay-inspect control → maybe mint `receipt`. `Overlay` is in-memory candidate text; only runtime writes a generated test sibling.

TypeStage: in-process `typescript` language service; no spawn. LintStage: only `@orkestrel/lsp` consumer; spawns `node <workspace oxlint> --lsp`; `createLSPClient` + `createStdioTransport`; diagnostics pull or push chosen by the LSP client's initialize result; shutdown/exit on destroy. RuntimeStage: in-process Vitest threads pool; stdout swallowed so MCP stdout stays clean.

`@orkestrel/process` is not imported by probe; child spawn for Oxlint is `@orkestrel/lsp/server`. Queue/timeout are coordinator-only.

Register as `node node_modules/@orkestrel/probe/dist/bin/main.js`.

## Unknowns

- Which diagnostic path Oxlint's `--lsp` actually advertises in this workspace (pull `textDocument/diagnostic` vs push `publishDiagnostics`) is decided at initialize time by `@orkestrel/lsp`; probe source does not pin it.
- Whether a given MCP client other than `@orkestrel/mcp`'s stdio client can drive this server is untested in-tree (`guides/probe.md:509-514`).
- `createMCPSession` exists on `@orkestrel/mcp/server` but is unused here; HTTP/WebSocket session behavior of probe is therefore not evidenced because those transports are not wired.
