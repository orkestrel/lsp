# Unit L2 — @orkestrel/lsp core contract and codec

## Role and engine

You are the GPT-5.6 Sol engine, reached through `codex exec`, running the `implementer` route.
Sandbox: `workspace-write`. Working directory: `/home/user/lsp`. Perform this assignment directly
yourself and spawn nothing beyond the build and test commands named here.

## Objective

The `@orkestrel/lsp` core environment exists and is proved: the v1 wire contract in
`src/core/types.ts`, the constants, the error type, the guards, and the base-protocol codec —
byte-accurate `Content-Length` framing both directions — with a mirrored core test suite green
under the scoped commands.

## Context

Read, in order, before editing: `/home/user/lsp/AGENTS.md`; the applicable
`/home/user/lsp/.claude/rules/` files (`names.md`, `typescript.md`, `architecture.md`,
`patterns.md`, `tests.md` at minimum); then the reconciled design record at
`/home/user/scaffold/.orkestrel/campaign/lsp-design-reconciliation.md` — its rulings are the
authority this unit implements; where this brief and that file disagree, this brief wins and you
record the disagreement. Supporting evidence, read as needed: the LSP 3.18 distillate at
`/home/user/scaffold/.orkestrel/campaign/lsp-spec-distillate.md`; the staged meta model at
`/home/user/scaffold/tmp/cursor/sources/lsp-3.18-metaModel.json`; the sibling precedent at
`/home/user/mcp/src/core/types.ts` (envelope naming, wire-verbatim rule, TSDoc density). Skill:
none.

Standing conditions of this environment:

- The tree sits at commit `3d4e57e`, clean. `src/core/` holds only a placeholder `index.ts`;
  `tests/src/core/` holds only a placeholder `index.test.ts`. Both are yours to replace.
- Dependencies are installed (`node_modules/` present). The network is denied — never run
  `npm install` or any fetch.
- The sandbox denies loopback listeners and a child's child. The scoped commands named here run:
  `tsc`, `oxlint`, `oxfmt`, and `vitest --project src:core` all work in this sandbox. Do not run
  the whole `npm test` chain — the Orchestrator runs the authoritative chain on the host after
  this unit returns.
- `tests/setupPolicy.ts`, `tests/policy.test.ts`, and every other vendored scaffold file are
  off-limits — an edit there is reverted by `repair` and reports as drift.
- Declared runtime dependencies are `@orkestrel/contract`, `@orkestrel/emitter`, and
  `@orkestrel/process`. Core imports from `@orkestrel/contract` and `@orkestrel/emitter` only;
  `@orkestrel/process` is reserved for the later server unit — do not import it in core, and do
  not remove it from `package.json`.

## The contract

Implement exactly this surface in `src/core/types.ts`. Wire-modelling members carry protocol
property names verbatim, including `kind`; everywhere the package speaks for itself the repository
naming laws bind fully. Add TSDoc to every exported declaration per `.claude/rules/typescript.md`.
The sketch omits TSDoc for brevity, never as licence to omit it.

```ts
// JSON-RPC 2.0 envelope (the mcp names; the envelope is JSON-RPC's, not LSP's)
export type JSONRPCId = string | number
export interface JSONRPCRequest {
	readonly jsonrpc: '2.0'
	readonly id: JSONRPCId
	readonly method: string
	readonly params?: Readonly<Record<string, unknown>>
}
export interface JSONRPCNotification {
	readonly jsonrpc: '2.0'
	readonly method: string
	readonly id?: never
	readonly params?: Readonly<Record<string, unknown>>
}
export interface JSONRPCError {
	readonly code: number
	readonly message: string
	readonly data?: unknown
}
export interface JSONRPCResultResponse {
	readonly jsonrpc: '2.0'
	readonly id: JSONRPCId
	readonly result: unknown
	readonly error?: never
}
export interface JSONRPCErrorResponse {
	readonly jsonrpc: '2.0'
	readonly id: JSONRPCId | null
	readonly error: JSONRPCError
	readonly result?: never
}
export type JSONRPCResponse = JSONRPCResultResponse | JSONRPCErrorResponse
export type JSONRPCMessage = JSONRPCRequest | JSONRPCNotification | JSONRPCResponse

// LSP base-protocol framing (validated header; charset is validated then discarded)
export interface LSPHeader {
	readonly length: number
}

// LSP wire structures (property names verbatim)
export type LSPDocumentURI = string
export interface LSPPosition { readonly line: number; readonly character: number }
export interface LSPRange { readonly start: LSPPosition; readonly end: LSPPosition }
export interface LSPLocation { readonly uri: LSPDocumentURI; readonly range: LSPRange }
export interface LSPTextDocumentIdentifier { readonly uri: LSPDocumentURI }
export interface LSPTextDocumentItem {
	readonly uri: LSPDocumentURI
	readonly languageId: string
	readonly version: number
	readonly text: string
}
export type LSPDiagnosticSeverity = 1 | 2 | 3 | 4
export type LSPDiagnosticTag = 1 | 2
export interface LSPCodeDescription { readonly href: string }
export interface LSPDiagnosticRelated { readonly location: LSPLocation; readonly message: string }
export interface LSPDiagnostic {
	readonly range: LSPRange
	readonly severity?: LSPDiagnosticSeverity
	readonly code?: number | string
	readonly codeDescription?: LSPCodeDescription
	readonly source?: string
	readonly message: string
	readonly tags?: readonly LSPDiagnosticTag[]
	readonly relatedInformation?: readonly LSPDiagnosticRelated[]
	readonly data?: unknown
}
export interface LSPPublishDiagnosticsParams {
	readonly uri: LSPDocumentURI
	readonly version?: number
	readonly diagnostics: readonly LSPDiagnostic[]
}
export interface LSPDocumentDiagnosticParams {
	readonly textDocument: LSPTextDocumentIdentifier
	readonly identifier?: string
	readonly previousResultId?: string
}
export type LSPDocumentDiagnosticReport =
	| { readonly kind: 'full'; readonly resultId?: string; readonly items: readonly LSPDiagnostic[] }
	| { readonly kind: 'unchanged'; readonly resultId: string }
export type LSPPositionEncoding = string
export type LSPTextDocumentSyncKind = 0 | 1 | 2
export interface LSPTextDocumentSyncOptions {
	readonly openClose?: boolean
	readonly change?: LSPTextDocumentSyncKind
}
export type LSPTextDocumentSync = LSPTextDocumentSyncKind | LSPTextDocumentSyncOptions
export interface LSPDiagnosticOptions {
	readonly identifier?: string
	readonly interFileDependencies: boolean
	readonly workspaceDiagnostics: boolean
}
export interface LSPIdentity { readonly name: string; readonly version?: string }
export interface LSPClientCapabilities {
	readonly general?: { readonly positionEncodings?: readonly LSPPositionEncoding[] }
	readonly textDocument?: {
		readonly synchronization?: Readonly<Record<string, unknown>>
		readonly publishDiagnostics?: Readonly<Record<string, unknown>>
		readonly diagnostic?: Readonly<Record<string, unknown>>
	}
}
export interface LSPServerCapabilities {
	readonly positionEncoding?: LSPPositionEncoding
	readonly textDocumentSync?: LSPTextDocumentSync
	readonly diagnosticProvider?: LSPDiagnosticOptions
	readonly [capability: string]: unknown
}
export interface LSPInitializeResult {
	readonly capabilities: LSPServerCapabilities
	readonly serverInfo?: LSPIdentity
}

// The package's own contracts
export interface LSPExit { readonly code: number | null; readonly signal: string | null }
export type LSPTransportEventMap = {
	readonly chunk: readonly [chunk: Uint8Array]
	readonly exit: readonly [exit: LSPExit]
	readonly error: readonly [error: unknown]
}
export interface LSPTransportInterface {
	readonly emitter: EmitterInterface<LSPTransportEventMap>
	start(): Promise<void>
	send(bytes: Uint8Array): Promise<boolean>
	close(): Promise<void>
}
export type LSPClientEventMap = {
	readonly notification: readonly [message: JSONRPCNotification]
	readonly exit: readonly [exit: LSPExit]
	readonly error: readonly [error: unknown]
}
export interface LSPClientOptions {
	readonly on?: EmitterHooks<LSPClientEventMap>
	readonly error?: EmitterErrorHandler
	readonly transport: LSPTransportInterface
	readonly workspace: LSPDocumentURI
	readonly timeout?: number
	readonly signal?: AbortSignal
}
export interface LSPClientInterface {
	readonly emitter: EmitterInterface<LSPClientEventMap>
	readonly capabilities: LSPServerCapabilities | undefined
	readonly encoding: LSPPositionEncoding | undefined
	start(): Promise<void>
	open(document: LSPTextDocumentItem): Promise<readonly LSPDiagnostic[]>
	close(uri: LSPDocumentURI): Promise<void>
	destroy(): Promise<void>
}
export type LSPErrorCode =
	| 'spawn'
	| 'framing'
	| 'protocol'
	| 'duplicate'
	| 'server'
	| 'timeout'
	| 'aborted'
	| 'closed'
```

`LSPInitializeParams` is also yours to declare: derive its member set from the meta model's
`InitializeParams` structure (with its `extends` and `mixins` entries resolved), restricted to
what this client sends — its mandatory members must all be present, `clientInfo` is `LSPIdentity`,
`capabilities` is `LSPClientCapabilities`, and members the client never populates (trace,
workspace folders, initialization options) are omitted from v1. Record in your report which model
members you included and which you omitted, with the model's `optional` flag per member.

The event map shapes and the `on`/`error` option keys must match the installed
`@orkestrel/emitter` declarations — read them in `node_modules/@orkestrel/emitter/dist/src/core/`
and conform to the real exported names (`EmitterInterface`, `EmitterHooks`, `EmitterErrorHandler`
or their actual spellings), never to this sketch's guesses. A mismatch between the sketch and the
installed declaration is resolved toward the installed declaration and recorded.

## The codec and its siblings

- `src/core/constants.ts`: the method literals the client sends and consumes, as a frozen
  `LSP_METHODS` declaration whose members are the individual literals (`initialize`,
  `initialized`, `shutdown`, `exit`, `$/cancelRequest`, `textDocument/didOpen`,
  `textDocument/didClose`, `textDocument/diagnostic`, `textDocument/publishDiagnostics`); the
  known encodings (`utf-8`, `utf-16`, `utf-32`) as `LSP_ENCODINGS`; the named JSON-RPC and LSP
  error codes the package refuses or emits (`-32700`, `-32600`, `-32601`, `-32602`, `-32603`,
  `-32800`, `-32801`, `-32802`, `-32803`) under names following `.claude/rules/names.md`; and a
  content limit constant bounding the accepted `Content-Length` (pick a generous power of two,
  document the value and why in TSDoc).
- `src/core/errors.ts`: the `LSPError` class carrying `code: LSPErrorCode` and a context object
  that preserves the numeric wire code when one exists, shaped per `.claude/rules/patterns.md` and
  the fleet's error precedents (read `@orkestrel/process` installed error declarations for the
  shape).
- `src/core/validators.ts`: guards for the envelope shapes (`isJSONRPCRequest`,
  `isJSONRPCNotification`, `isJSONRPCResponse` or the names the rules prescribe), the wire
  structures the client reads (`LSPDiagnostic`, `LSPPublishDiagnosticsParams`,
  `LSPDocumentDiagnosticReport`, `LSPInitializeResult`), and `isLSPError`. Every guard returns
  `false` on hostile input and never throws.
- `src/core/parsers.ts`: incremental frame decoding — a parser that accepts byte chunks and yields
  complete messages: header parsing (`Content-Length` required; `Content-Type` optional with the
  `utf-8` default, the legacy `utf8` spelling folded, any other charset refused as `framing`), a
  header split across chunks reassembled, coalesced frames separated, a `Content-Length` above the
  content limit refused as `framing` before buffering the body.
- `src/core/helpers.ts`: frame encoding — a message to bytes with `Content-Length` measured in
  encoded bytes, never string length.
- `src/core/factories.ts`: create it only when an L2-owned declaration belongs there under
  `.claude/rules/architecture.md`; the client factory arrives with the later client unit. Record
  the decision either way.
- `src/core/index.ts`: the sole core barrel, exporting the public surface.
- `tests/src/core/`: mirrored tests for every file, replacing the placeholder `index.test.ts` with
  the real mirror set. Byte-length expectations come from `new TextEncoder().encode(content).length`
  as the independent oracle, never from the encoder under test. Cover an astral code point in
  content; a header split mid-`Content-Length`; several frames in one chunk; the folded `utf8`
  charset; a refused charset; the content-limit refusal; hostile guard inputs (null, primitives,
  wrong-typed members) returning `false`.

## Unknowns

- Whether the installed emitter surface names differ from the sketch. Resolve against
  `node_modules` and record the resolution.
- Whether the meta model's `InitializeParams` carries mandatory members beyond `processId`,
  `rootUri`, and `capabilities`. Resolve against the model file and record the member table.

## Scope

Owned: `src/core/*` (as named), `tests/src/core/*`. Off-limits: everything else — `src/server/`,
`vite.config.ts`, `configs/`, `package.json`, the lockfile, `guides/`, every vendored file,
`tests/` outside `tests/src/core/`. No commits, no pushes, no installs, no renames of scaffolded
scripts. The Orchestrator commits.

## Deviation contract

A conflict with the contract in this brief — a member that cannot typecheck as specified, an
emitter shape that forces a different event-map form, a rule file contradicting a sketched name —
stops the unit: report expected, found, evidence, done or not done, one short hypothesis.
Ancillary choices (constant names within the naming rules, test file organization within the
mirror rule, the factories decision) are yours to decide and record.

## Acceptance criteria

Cheap first; run each and read it.

1. `npx oxfmt --config .oxfmtrc.json --check <owned files>` exits 0.
2. `npx oxlint --config .oxlintrc.json --deny-warnings <owned files>` exits 0.
3. `npm run check:src:core` exits 0 (host-independent core: no `node:` import, no host global).
4. `npm run check` exits 0 (the root project reads the tests).
5. `npx vitest run --config vite.config.ts --no-cache --reporter=verbose --project src:core`
   exits 0 with the mirror suite's named cases green, including every proof row the test section
   names.
6. `git status --porcelain` shows only owned files.

Observation, not a criterion: report your reading of `npm run test:policy` if you run it; the
Orchestrator takes the authoritative tree-wide chain on the host afterwards.

## Output

Return, and nothing else: what exists per owned file and the load-bearing decisions
(the `InitializeParams` member table, the emitter-surface resolution, the factories decision, the
content-limit value); the exact commands run for every acceptance criterion with their final
summary lines verbatim; deviations or none; and the actual `git diff --stat` and
`git status --porcelain` output.
