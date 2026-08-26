# LSP v1 design report

## Core type surface

### Ruling

Keep protocol structures in `src/core/types.ts`. Use official structure names unless repository acronym rules require correction: `DocumentURI`, `Position`, `Range`, `TextDocumentIdentifier`, `TextDocumentItem`, `Diagnostic`, `PublishDiagnosticsParams`, `DocumentDiagnosticParams`, `DocumentDiagnosticReport`, `InitializeParams`, `InitializeResult`, `ServerCapabilities`, and `TextDocumentSyncOptions`.

Keep package-owned names distinct: `LSPMessage`, `LSPHeader`, `LSPError`, `LSPClientOptions`, and `LSPClientInterface`.

Preserve serialized fields such as `kind`, `type`, `jsonrpc`, `textDocument`, and `relatedDocuments`. They are foreign protocol vocabulary, not package API design. The staged meta model uses `kind` as the diagnostic-report discriminator, so renaming it would break the wire contract. `/home/user/scaffold/tmp/cursor/sources/lsp-3.18-metaModel.json:10248-10303`

Expose the declared wire subset:

- JSON-RPC request, notification, success response, error response, error object, identifier, and parameters.
- `DocumentURI`, `Position`, `Range`, `TextDocumentIdentifier`, and `TextDocumentItem`.
- `MarkupContent`, `Location`, `CodeDescription`, `DiagnosticRelatedInformation`, and `Diagnostic`.
- `PublishDiagnosticsParams`, `DocumentDiagnosticParams`, and full or unchanged diagnostic reports.
- The subset of initialization and server capabilities that selects encoding, text synchronization, and diagnostics.
- `LSPHeader` containing the validated content length.

Defer versioned identifiers and content-change structures until `didChange` enters scope.

Represent extensible protocol enumerations with their wire primitive and publish known constants separately. `PositionEncodingKind` is `string`; diagnostic severity and tags are `number`. The meta model explicitly permits custom position encodings. `/home/user/scaffold/tmp/cursor/sources/lsp-3.18-metaModel.json:15330-15355` Unknown enumeration values must not make the using side fail. `/home/user/scaffold/tmp/cursor/lsp-spec-distillate.md:140-154`

Use closed unions only where the meta model declares a closed value space, such as `TextDocumentSyncKind = 0 | 1 | 2`. `/home/user/scaffold/tmp/cursor/sources/lsp-3.18-metaModel.json:14672-14695`

### Rationale

Core remains host-independent, so it can own wire shapes, guards, validation, framing, and errors without importing Node APIs. `/home/user/lsp/AGENTS.md:21-36` Public and reusable declarations belong in `types.ts`, constants in `constants.ts`, and reusable functions in registered centralized files. `/home/user/lsp/tests/setupPolicy.ts:125-192` Public collections and properties must be readonly. `/home/user/lsp/AGENTS.md:38-53`

The protocol defines zero-based positions and ranges, document identifiers, diagnostic fields, and document items as reusable structures. `/home/user/scaffold/tmp/cursor/sources/lsp-3.18-metaModel.json:6776-6795` `/home/user/scaffold/tmp/cursor/sources/lsp-3.18-metaModel.json:6884-6895` `/home/user/scaffold/tmp/cursor/sources/lsp-3.18-metaModel.json:7838-7873` `/home/user/scaffold/tmp/cursor/sources/lsp-3.18-metaModel.json:8984-9094`

Use `DocumentURI`, not the meta-model spelling `DocumentUri`, because TypeScript identifiers follow the repository’s canonical acronym rules. `/home/user/lsp/.claude/rules/names.md:107-136` Wire property names remain unchanged.

### Ruled alternative

Do not generate or expose the complete LSP meta model. The brief limits v1 to the capability probe, document ownership, initialization, synchronization selection, and diagnostic paths. A generated full protocol surface would violate the minimal-public-API gate. `/home/user/lsp/AGENTS.md:66-72` `/home/user/scaffold/.orkestrel/campaign/lsp-design-brief.md:43-48`

## `LSPClient` API

### Ruling

Expose only:

```ts
// src/core/types.ts

import type { JSONValue } from '@orkestrel/contract'

export type LSPIdentifier = string | number
export type DocumentURI = string
export type PositionEncodingKind = string
export type TextDocumentSyncKind = 0 | 1 | 2
export type DiagnosticSeverity = number
export type DiagnosticTag = number

export type LSPParameters =
  | Readonly<Record<string, JSONValue>>
  | readonly JSONValue[]

export interface LSPRequest {
  readonly jsonrpc: '2.0'
  readonly id: LSPIdentifier
  readonly method: string
  readonly params?: LSPParameters
}

export interface LSPNotification {
  readonly jsonrpc: '2.0'
  readonly method: string
  readonly params?: LSPParameters
  readonly id?: never
}

export interface LSPResponseError {
  readonly code: number
  readonly message: string
  readonly data?: JSONValue
}

export interface LSPSuccessResponse {
  readonly jsonrpc: '2.0'
  readonly id: LSPIdentifier
  readonly result: JSONValue | null
  readonly error?: never
}

export interface LSPErrorResponse {
  readonly jsonrpc: '2.0'
  readonly id: LSPIdentifier | null
  readonly error: LSPResponseError
  readonly result?: never
}

export type LSPMessage =
  | LSPRequest
  | LSPNotification
  | LSPSuccessResponse
  | LSPErrorResponse

export interface LSPHeader {
  readonly length: number
}

export interface Position {
  readonly line: number
  readonly character: number
}

export interface Range {
  readonly start: Position
  readonly end: Position
}

export interface TextDocumentIdentifier {
  readonly uri: DocumentURI
}

export interface TextDocumentItem extends TextDocumentIdentifier {
  readonly languageId: string
  readonly version: number
  readonly text: string
}

export interface MarkupContent {
  readonly kind: 'plaintext' | 'markdown'
  readonly value: string
}

export interface Location {
  readonly uri: DocumentURI
  readonly range: Range
}

export interface CodeDescription {
  readonly href: string
}

export interface DiagnosticRelatedInformation {
  readonly location: Location
  readonly message: string
}

export interface Diagnostic {
  readonly range: Range
  readonly severity?: DiagnosticSeverity
  readonly code?: number | string
  readonly codeDescription?: CodeDescription
  readonly source?: string
  readonly message: string | MarkupContent
  readonly tags?: readonly DiagnosticTag[]
  readonly relatedInformation?: readonly DiagnosticRelatedInformation[]
  readonly data?: JSONValue
}

export interface PublishDiagnosticsParams {
  readonly uri: DocumentURI
  readonly version?: number
  readonly diagnostics: readonly Diagnostic[]
}

export interface DocumentDiagnosticParams {
  readonly textDocument: TextDocumentIdentifier
  readonly identifier?: string
  readonly previousResultId?: string
}

export interface FullDocumentDiagnosticReport {
  readonly kind: 'full'
  readonly resultId?: string
  readonly items: readonly Diagnostic[]
}

export interface UnchangedDocumentDiagnosticReport {
  readonly kind: 'unchanged'
  readonly resultId: string
}

export type DocumentDiagnosticReport =
  | FullDocumentDiagnosticReport
  | UnchangedDocumentDiagnosticReport

export interface TextDocumentSyncOptions {
  readonly openClose?: boolean
  readonly change?: TextDocumentSyncKind
}

export interface DiagnosticOptions {
  readonly identifier?: string
  readonly interFileDependencies: boolean
  readonly workspaceDiagnostics: boolean
}

export interface ServerCapabilities {
  readonly positionEncoding?: PositionEncodingKind
  readonly textDocumentSync?: TextDocumentSyncKind | TextDocumentSyncOptions
  readonly diagnosticProvider?: DiagnosticOptions
  readonly [capability: string]: unknown
}

export interface InitializeResult {
  readonly capabilities: ServerCapabilities
  readonly serverInfo?: Readonly<{
    readonly name: string
    readonly version?: string
  }>
}
```

```ts
// src/server/types.ts

import type {
  DocumentURI,
  InitializeResult,
  PositionEncodingKind,
  PublishDiagnosticsParams,
  ServerCapabilities,
  TextDocumentItem,
} from '../core/index.js'

import type {
  EmitterErrorHandler,
  EmitterHooks,
  EmitterInterface,
} from '@orkestrel/emitter'

export interface LSPExit {
  readonly code: number | null
  readonly signal: string | null
}

export interface LSPClientEventMap {
  readonly diagnostics: readonly [report: PublishDiagnosticsParams]
  readonly fault: readonly [error: LSPError]
  readonly exit: readonly [exit: LSPExit]
}

export interface LSPServerOptions {
  readonly command: readonly [file: string, ...arguments: readonly string[]]
}

export interface LSPClientOptions {
  readonly workspace: string
  readonly server: LSPServerOptions
  readonly signal?: AbortSignal
  readonly on?: EmitterHooks<LSPClientEventMap>
  readonly error?: EmitterErrorHandler
}

export interface LSPClientInterface {
  readonly capabilities: ServerCapabilities | undefined
  readonly encoding: PositionEncodingKind | undefined
  readonly emitter: EmitterInterface<LSPClientEventMap>

  start(): Promise<void>
  open(document: TextDocumentItem): Promise<readonly Diagnostic[]>
  close(uri: DocumentURI): Promise<void>
  destroy(): Promise<void>
}
```

`LSPError` belongs in `src/core/errors.ts`. Its stable package categories are `frame`, `message`, `state`, `server`, `process`, and `aborted`. Preserve the JSON-RPC or LSP numeric code as data when one exists.

`start()` launches the configured process, sends `initialize`, stores `InitializeResult.capabilities`, derives `encoding`, then sends `initialized`. The client advertises UTF-16 only. An omitted server encoding selects UTF-16; any different selection is a protocol error because the server selected an encoding the client did not offer. The initialization sequence and encoding negotiation are mandatory protocol behavior. `/home/user/scaffold/tmp/cursor/lsp-spec-distillate.md:27-45` `/home/user/scaffold/tmp/cursor/lsp-spec-distillate.md:65-79`

`start()` can launch again after an unexpected exit. It does not implement automatic restart policy.

`open()` owns a URI until `close()` succeeds. It rejects a duplicate open. It sends `textDocument/didOpen` with the complete text.

Synchronization selection is:

- Missing synchronization or `0`: reject `open()`.
- Numeric `1` or `2`: send the full `didOpen` item.
- Object form: require `openClose: true` and `change` equal to `1` or `2`.
- Do not send `didChange` in v1.

If `diagnosticProvider` exists, `open()` requests `textDocument/diagnostic` and returns the full report items. An unchanged report without a stored prior result is a protocol error. Otherwise, `open()` waits for `textDocument/publishDiagnostics` for that URI. An empty publication resolves successfully and clears diagnostics. The protocol defines push replacement semantics and full or unchanged pull reports. `/home/user/scaffold/tmp/cursor/lsp-spec-distillate.md:97-103` `/home/user/scaffold/tmp/cursor/sources/lsp-3.18-metaModel.json:1007-1033`

The client never merges push and pull diagnostics. This selection is fixed by the prior audit. `/home/user/scaffold/.orkestrel/campaign/lsp/audit.md:84-106`

When an abort signal fires during a request, send `$/cancelRequest`, reject the operation with `LSPError`, and begin bounded destruction. `/home/user/scaffold/tmp/cursor/lsp-spec-distillate.md:13-25`

For an incoming request the client did not advertise, return JSON-RPC `MethodNotFound` with the same identifier. Do not terminate the process for that request. Malformed framing, invalid JSON, invalid response correlation, or an invalid selected capability fails pending work and destroys the child.

`destroy()` sends `shutdown`, waits for its response, sends `exit`, and waits for process termination. A bounded fallback terminates the child. The probe implementation already demonstrates the required order. `/home/user/probe/src/server/stages/LintStage.ts:114-177` The exact deadline value is product policy outside the objective lane.

### Dependency ruling

Keep `@orkestrel/contract` for JSON values, record guards, string guards, integer guards, and boundary validation. Its installed package supplies those primitives. `/home/user/lsp/node_modules/@orkestrel/contract/dist/src/core/index.d.ts:551-582` `/home/user/lsp/node_modules/@orkestrel/contract/dist/src/core/index.d.ts:2953-2953` `/home/user/lsp/node_modules/@orkestrel/contract/dist/src/core/index.d.ts:3266-3311`

Keep `@orkestrel/emitter` for the fixed `emitter` surface and lifecycle events. Its installed interface already provides hooks, typed event maps, error handling, and the emitter factory. `/home/user/lsp/node_modules/@orkestrel/emitter/dist/src/core/index.d.ts:26-48` `/home/user/lsp/node_modules/@orkestrel/emitter/dist/src/core/index.d.ts:89-130`

Remove `@orkestrel/process` from the v1 seed. Its server implementation reads line-delimited output and appends `\n` on send. LSP requires arbitrary byte chunks, CRLF-separated headers, and `Content-Length` measured in bytes. `/home/user/process/src/server/Process.ts:43-47` `/home/user/process/src/server/Process.ts:153-155` `/home/user/process/src/server/Process.ts:243-252` `/home/user/scaffold/tmp/cursor/lsp-spec-distillate.md:13-25`

No missing npm dependency is justified. Native child-process streams, `TextEncoder`, `Buffer`, `AbortSignal`, and platform path and URL APIs cover the remaining host boundary.

### Ruled alternative

Do not expose generic `request()` or `notify()` methods. Add a named operation only when a concrete consumer requires it. The fixed surface excludes generic transport access. `/home/user/scaffold/.orkestrel/campaign/lsp-design-brief.md:43-48`

## Conformance suite

### Ruling

Vendor the exact staged meta model as `tests/fixtures/lsp-3.18-metaModel.json`. Record `3.18` as the protocol line and `3.18.0` as the model artifact version. Assert the fixture’s `metaData.version` before any conformance check. `/home/user/scaffold/tmp/cursor/sources/lsp-3.18-metaModel.json:1-5`

Build `tests/setupConformance.ts` around a typed projection manifest for the declared subset:

```ts
export const CONFORMANCE_SPEC = '3.18'
export const CONFORMANCE_MODEL = '3.18.0'

export interface ConformanceViolation {
  readonly subject: 'model' | 'structure' | 'method' | 'value' | 'runtime'
  readonly name: string
  readonly path: string
  readonly expected: string
  readonly actual: string
}
```

The manifest names the meta-model structure, its local exported type, required and optional properties, referenced structures, literal values, and array shapes. A dev-only reader resolves the named structure plus its `extends` and `mixins` entries from the JSON fixture. It compares that resolved form with the projection manifest.

Map the projection manifest to readonly TypeScript types and use exact bidirectional compile witnesses against the public exports. This makes a field addition, removal, optionality change, literal drift, or reference change fail compilation. Runtime checks make the same drift appear as a named `ConformanceViolation`, rather than an opaque total.

Apply this mechanism to:

- `Position`, `Range`, `TextDocumentIdentifier`, and `TextDocumentItem`.
- Diagnostic support types and `Diagnostic`.
- `PublishDiagnosticsParams`, `DocumentDiagnosticParams`, and document diagnostic reports.
- `TextDocumentSyncOptions`, the selected `ServerCapabilities` properties, and `InitializeResult`.
- The supported method and notification literals.
- Known values for synchronization, encoding, diagnostic severity, diagnostic tags, JSON-RPC errors, and LSP errors.

The meta model does not describe JSON-RPC envelopes or byte framing. Test those from the staged base-protocol material and runtime fixture exchanges, not by pretending they came from the meta model. The distillate requires byte-length framing, required `Content-Length`, optional `Content-Type`, UTF-8 handling, JSON-RPC response correlation, cancellation, and ordered lifecycle messages. `/home/user/scaffold/tmp/cursor/lsp-spec-distillate.md:13-45`

Include a protocol-faithful child fixture that reads and writes real stdio frames. Its scenarios must cover:

- Split headers, split bodies, and coalesced messages.
- UTF-8 byte length with non-BMP text.
- Accepted UTF-8 content-type spellings and rejected charsets.
- String and numeric identifiers.
- Out-of-order responses.
- JSON-RPC errors and unknown response identifiers.
- Unsupported server requests receiving `MethodNotFound`.
- Push and pull diagnostic selection.
- Empty push publications.
- Full and invalid unchanged pull reports.
- Synchronization capability forms.
- Default, accepted, and rejected encodings.
- Cancellation.
- Ordered shutdown and exit.
- Hung shutdown fallback.
- Unexpected child exit.
- Duplicate open and unmatched close.

Each scenario reports the operation name, frame or structure path, expected value, and observed value. Do not use aggregate-only assertions.

Add a live Oxlint host test. It must initialize Oxlint through real stdio, open a text document that produces a known diagnostic, close the URI, destroy the client, and prove that no child remains. Fixture agreement alone does not establish real-server compatibility. The quality rule requires a real representative integration for an external compatibility claim. `/home/user/lsp/.claude/rules/quality.md:99-114`

Add negative controls that mutate a local projection or method literal and prove that the conformance checker reports the intended violation. The repository’s policy suite follows the same control principle: each policy rule must detect its controlled violation before the real workspace is accepted. `/home/user/lsp/tests/policy.test.ts:330-336` `/home/user/lsp/tests/policy.test.ts:416-419`

### Transferred precedent

The MCP checkout supplies WIP precedent only. Its conformance suite uses a pinned foreign package, a typed fixture that exposes API drift, named scenarios, real transport, and teardown. `/home/user/mcp/tests/setupConformance.ts:1-12` `/home/user/mcp/tests/setupConformance.ts:40-61` `/home/user/mcp/tests/conformance.test.ts:1-41` `/home/user/mcp/tests/conformance.test.ts:43-80`

Transfer the pinned artifact, typed fixture, named-scenario, real-transport, and teardown pattern. Do not transfer the claim that a descriptive meta model is an independent client. The LSP suite needs the live Oxlint receipt for that claim.

The expected Ollama precedent could not be verified. No `/home/user/ollama` checkout or alternative source path was supplied. The campaign direction names an Ollama conformance pattern but does not contain its implementation. `/home/user/scaffold/.orkestrel/direction-2026-08-25.md:110-119` This missing path limits the Ollama comparison; it does not block the LSP ruling.

### Ruled alternative

Do not compare only declared totals from the meta model. Totals can stay unchanged while a field, method, literal, or optionality rule drifts.

## Unit decomposition

### Ruling

Land core contracts and their model-driven proof before the server client. Land the client with its runtime fixture before the live Oxlint adoption receipt.

The campaign already assigns pure core contracts, validators, parsers, framing, and errors to L2, then assigns stdio transport, correlation, client lifecycle, fixture coverage, and live Oxlint proof to L3. `/home/user/scaffold/.orkestrel/campaign/lsp/plan.md:40-45`

### Ruled alternative

Do not combine L2 and L3 into a single implementation unit. That would let transport behavior obscure whether the core wire contract and framing primitives are independently correct.

## Exclusions and activation triggers

### Ruling

| Excluded capability | Activation trigger |
|---|---|
| `didChange` and versioned edit streams | A consumer must re-inspect an already open URI without close and reopen. |
| Save notifications | A consumer depends on server behavior gated by `textDocument/didSave`. |
| Work-done progress | A consumer must expose or cancel a server operation that uses work-done tokens. |
| Dynamic registration | A required server capability is available only through `client/registerCapability`. |
| Workspace configuration | A required server requests `workspace/configuration`. |
| Workspace-folder changes | A consumer supplies mutable multi-root workspace state. |
| Workspace diagnostics | A consumer needs diagnostics outside the URI passed to `open()`. |
| Document symbols, formatting, completion, hover, references, and semantic tokens | A consumer requires the named operation. Add the operation directly. |
| Generic request and notification escape hatches | No activation trigger. Keep them out; add named operations with real consumers. |
| `LSPServer` | A package or application must serve LSP requests. Mirror the proven client contract without importing Node behavior into core. |
| Browser support | A browser consumer and a non-Node transport exist. Introduce a transport contract before adding a browser environment. |
| Automatic restart policy | An application owns a restart budget and backoff policy. Keep explicit `start()` as the package mechanism. |

This preserves the fixed v1 scope and keeps framework code at the mechanism boundary. `/home/user/scaffold/.orkestrel/campaign/lsp-design-brief.md:43-53` `/home/user/lsp/AGENTS.md:66-74`

### Ruled alternative

Do not advertise unimplemented capabilities to make a server appear compatible. Capability negotiation must gate every optional behavior. `/home/user/scaffold/tmp/cursor/lsp-spec-distillate.md:140-154`

## Refined implementation units

| Unit | Owned files | Acceptance evidence |
|---|---|---|
| L2 core contract | `src/core/types.ts`, `constants.ts`, `errors.ts`, `validators.ts`, `parsers.ts`, `helpers.ts`, `index.ts`; mirrored core tests; `package.json` and lockfile dependency correction | Public subset exists in `types.ts`; known literals are frozen constants; frame parsing uses byte lengths; guards reject malformed envelopes and positions; `@orkestrel/contract` and `@orkestrel/emitter` remain; `@orkestrel/process` is absent. |
| L2 model conformance | Vendored meta model, `tests/setupConformance.ts`, `tests/conformance.test.ts`, conformance project registration in `vite.config.ts`, package scripts | Exact model version passes; declared structures, methods, and values pass named parity checks; negative controls fail with the expected path; base-protocol claims remain separate from meta-model claims. |
| L3 client runtime | `src/server/types.ts`, `LSPClient.ts`, `index.ts`; protocol fixture child; mirrored server tests | Real stdio proves framing, correlation, lifecycle, encoding, synchronization selection, push or pull diagnostics, cancellation, errors, document ownership, and bounded destruction. |
| L3 live adoption and guide parity | Live Oxlint integration test, `guides/lsp.md`, guide parity coverage, root guide index | Oxlint produces the expected diagnostic through the public API; close and destroy complete; no child remains; the guide matches every public export and behavioral method. |

The current Vite project list does not register conformance or guide projects. `/home/user/lsp/vite.config.ts:154-158` The configuration policy requires registered scripts and inclusion in `npm test`. `/home/user/lsp/tests/config.test.ts:478-572` Public surface work also requires a matching guide. `/home/user/lsp/guides/README.md:5-23`

## Risks and cheapest probes

| Risk | Cheapest decisive probe |
|---|---|
| The meta model is mistaken for a complete protocol source. | Look up `RequestMessage` and framing definitions in the fixture, assert their absence, then keep their proof in runtime tests. |
| The `3.18.0` artifact contains declarations marked for a later patch. | Scan selected declarations for `since` values beyond the pinned artifact. Exclude `DocumentDiagnosticReportPartialResult`, which is marked `3.18.1`. `/home/user/scaffold/tmp/cursor/sources/lsp-3.18-metaModel.json:15825-15840` |
| Line-oriented process handling corrupts LSP frames. | Send an LSP frame containing embedded newlines through `@orkestrel/process` and compare the emitted bytes. Its implementation already shows newline insertion and line splitting. `/home/user/process/src/server/Process.ts:153-155` `/home/user/process/src/server/Process.ts:243-252` |
| Push and pull paths accidentally run together. | Run the same document against fixture capabilities with and without `diagnosticProvider`; assert the observed method sequence. |
| Synchronization shorthand is interpreted incorrectly. | Exercise omitted, `0`, `1`, `2`, and object forms and assert whether `open()` sends `didOpen` or rejects. |
| The server selects an encoding the client never offered. | Return UTF-8 after advertising UTF-16 only and require a typed protocol failure before document traffic. |
| Response correlation leaks pending work. | Return responses in reverse order, then return an unknown identifier and inspect the pending map after failure. |
| Shutdown leaves an orphan child. | Record the child PID, exercise normal and hung shutdown paths, then test process existence after `destroy()`. |
| Fixture and client share the same defect. | Run the live Oxlint scenario after fixture coverage passes. |
| Policy accepts misplaced declarations or unmirrored tests. | Run policy and configuration negative controls before the real-workspace assertions. Centralized placement and mirroring are enforced by the policy source. `/home/user/lsp/tests/setupPolicy.ts:529-720` `/home/user/lsp/tests/setupPolicy.ts:758-825` |
| Framing can retain an unbounded declared body. | Feed a valid large `Content-Length` without a body and observe retained memory. A finite content limit is required for production safety; its numeric value is product policy outside the objective lane. |
| Abort and destroy deadlines are inconsistent. | Abort during initialize, pull diagnostics, and shutdown; assert one terminal error and no remaining child. |
| Ollama-specific conformance lessons are missing. | Supply the Ollama checkout or exact source path and inspect its pinned artifact, runner, negative controls, and failure reporting before transferring any additional pattern. |

## Wave L exit criterion

Wave L exits when the declared core surface conforms to the exact vendored `3.18.0` artifact with working negative controls; byte framing and JSON-RPC behavior pass the protocol-faithful child suite; `LSPClient` proves initialization, capability selection, URI ownership, push or pull diagnostics, cancellation, correlation, and ordered teardown; a live Oxlint run produces the expected diagnostic and leaves no child process; `@orkestrel/contract` and `@orkestrel/emitter` have demonstrated consumers while `@orkestrel/process` is removed; the public guide is in parity; and the repository passes `format:check`, `lint:check`, `check`, `build`, and `test` in the required order. `/home/user/lsp/AGENTS.md:76-114`