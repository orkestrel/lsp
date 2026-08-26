# L1 design — subjective lane report (planner, Opus 5)

Lane: subjective (shape, taste, naming, ergonomics, design fit). Evidence read: the shared design
brief, the LSP 3.18 distillate, the vendored metaModel, `@orkestrel/mcp` source and its conformance
harness, `/home/user/probe/src/server/stages/LintStage.ts`, the scaffolded `/home/user/lsp`
workspace and its policy sweep, and the installed `@orkestrel/process`, `@orkestrel/contract`
declarations.

# Design

## Q1 — Core type surface: where package vocabulary ends and wire shapes begin

**Ruling.** The boundary is the JSON boundary, and `@orkestrel/mcp` already drew it in a form that
transfers unchanged. A type whose instances are serialized into or deserialized out of a JSON-RPC
message carries the specification's property names, casing, and literal values **verbatim** —
including `kind`, `type`, `textDocument`, `languageId`, `rangeLength`, `positionEncoding`,
`contentChanges`. Every other declaration — options, methods, events, errors, derived state — obeys
the fleet's naming laws with no exemption. `/home/user/mcp/src/core/types.ts:5-7` states that rule
as a header comment on the file and holds it where it hurts: `MCPContent` carries `type: 'image'`
and `MCPResult` carries `resultType` because the wire says so, while the library's own surface reads
`identity`, `version`, `discover()`, `era`.

The fleet's ban on `kind`/`type` discriminants is a ban on **inventing** one, not on transcribing
one. LSP puts `kind` on the wire in `DocumentDiagnosticReport` (`'full' | 'unchanged'`) and in the
work-done progress payloads (distillate §Diagnostics, §Progress model). Renaming it to `category`
would mean translating every payload at the boundary, which makes the type stop being the thing on
the wire — deleting the only reason the type exists.

Three refinements the mcp precedent does not settle, ruled here:

**The envelope is not LSP's, so it does not carry the `LSP` prefix.** `JSONRPCId`,
`JSONRPCRequest`, `JSONRPCNotification`, `JSONRPCResponse`, `JSONRPCError`, `JSONRPCMessage` — the
same names mcp uses (`/home/user/mcp/src/core/types.ts:24-138`), each package owning its own copy
with no shared package and no re-export. What **is** LSP's is the framing, so `LSPFrame` names the
`Content-Length` header plus content unit and `JSONRPCMessage` names what rides inside it. Naming
the whole thing `LSPMessage` would tell a reader the envelope is LSP's when only the framing is.

**`JSONRPCError.code` is `number`, never a union.** The specification directs the using side to
ignore unknown enumeration values and preserve them on round-trips (distillate §Enumerations), and
the code space is open (JSON-RPC reserved, LSP reserved, server-defined). The named codes live in
`constants.ts` as `JSONRPC_METHOD_NOT_FOUND`, `LSP_REQUEST_CANCELLED`, and their siblings. mcp
reached the same shape at `types.ts:81`.

**What is v1 has one test, and it is checkable.** v1 declares only the payload shapes its declared
client capabilities can elicit. A structure in `types.ts` with no capability behind it, and no
message the client sends or receives, is drift. That single principle answers "which are v1, which
wait" for the whole surface without a taste argument per structure.

The v1 set that test admits: the envelope; `LSPFrame`; `LSPDocumentURI`, `LSPPosition`, `LSPRange`,
`LSPLocation`; `LSPTextDocumentItem`, `LSPTextDocumentIdentifier`; `LSPDiagnostic`,
`LSPDiagnosticSeverity`, `LSPDiagnosticTag`, `LSPDiagnosticRelated`,
`LSPPublishDiagnosticsParams`, `LSPDocumentDiagnosticReport`; `LSPInitializeParams`,
`LSPInitializeResult`, `LSPClientCapabilities`, `LSPServerCapabilities`, `LSPIdentity`,
`LSPTextDocumentSync`, `LSPTextDocumentSyncKind`, `LSPPositionEncoding`, `LSPDiagnosticOptions`.
`LSPIdentity` names the `{ name, version? }` shape both `clientInfo` and `serverInfo` hold,
matching mcp's `MCPIdentity` — one concept, one term, across two packages.

What waits: every language feature (completion, hover, definition, references, rename, code
actions, formatting, semantic tokens, inlay hints, folding ranges, symbols, hierarchies, monikers,
inline values, inline completion), the change and save notifications, the progress payloads,
dynamic registration, and every workspace feature. `Diagnostic.message` stays `string` and drops
the 3.18 `MarkupContent` arm, because the client does not declare `markupMessageSupport` and that
capability is `@proposed` (distillate §Diagnostics).

**Alternative ruled out: type the package against `vscode-languageserver-protocol` instead of
declaring the shapes.** It fails on two laws at once — the barrel may not re-export another
package's symbols (`.claude/rules/architecture.md` § Barrel exports), and a published surface typed
by a foreign package forces every consumer to install it as a runtime dependency, which the user's
fixed ruling excludes. It survives as a **development-only comparison** and does real work there;
see Q3.

## Q2 — The `LSPClient` API

**Ruling.** The entity is transport-agnostic and lives in `src/core/LSPClient.ts`; the one concrete
transport lives in `src/server/transports/StdioTransport.ts`. That mirrors mcp exactly
(`src/core/MCPClient.ts` beside `src/server/transports/StdioClientTransport.ts`) and it is what
makes the scaffolded core/server split earn its keep.

The surface, holding the prior round's convergent ruling and naming what it left open:

| Member | Shape | Why |
| --- | --- | --- |
| `emitter` | `EmitterInterface<LSPClientEventMap>` | The composition pattern in `.claude/rules/patterns.md` § Stateful emitters |
| `capabilities` | `LSPServerCapabilities \| undefined` | The whole advertised block; `undefined` before `start` resolves |
| `encoding` | `LSPPositionEncoding` | Derived from `capabilities.positionEncoding ?? 'utf-16'`; never stored |
| `start` | `() => Promise<void>` | `initialize`, then `initialized`; resolves when `capabilities` is readable |
| `open` | `(document: LSPTextDocumentItem) => Promise<readonly LSPDiagnostic[]>` | `didOpen`, then the first diagnostics report for that URI |
| `close` | `(uri: LSPDocumentURI) => void` | `didClose`; releases the ownership slot |
| `destroy` | `() => Promise<void>` | `shutdown`, `exit`, transport close, emitter destroy |

**`start` and `destroy`, and no `stop`.** `.claude/rules/names.md` § Fixed lifecycle vocabulary
gives `stop` the meaning "end permanently" and `destroy` the meaning "tear down and release
resources". An LSP ending is a protocol conversation followed by a released child and a released
emitter, which is `destroy` exactly. Publishing both would create two endings whose relationship
nothing defines.

**`encoding` earns its place beside `capabilities`.** A consumer reading
`capabilities.positionEncoding` gets `undefined` from most servers and must then know the UTF-16
default (distillate §Position encoding). Owning that default is a materially narrower contract,
which is the wrapper test's own admission criterion.

**Document ownership: one open per URI, one door for diagnostics.** The specification caps open
documents at one per URI (distillate §`didOpen`), so a second `open` of a live URI throws
`LSPError` coded `duplicate` — the same code `@orkestrel/process` uses for the same meaning
(`PROCESS_ERROR_CODES`, `dist/src/core/index.d.ts:243`). Diagnostics for an open URI reach the
caller through `open`'s promise **and nowhere else**. A publish notification for a URI nobody
opened — servers do emit these for related files — reaches the `notification` event instead. That
is mcp's own rule for progress frames claimed by an in-flight request
(`/home/user/mcp/src/core/types.ts:2197-2201`), applied to the same problem.

**Event map:** `start`, `exit`, `notification`, `error`. `start` names the same transition the
method does. `exit` carries the child's terminal state, because a stdio LSP session has no
reconnect and `disconnect` would name a state the design lacks. `notification` carries
`JSONRPCNotification` so a consumer narrows on `method` — it is the one seam that keeps unclaimed
inbound traffic observable without a member per feature, and silently dropping server traffic is
the failure a protocol client is most often blamed for. `error` is `unknown`, per the event-map
rule.

**Options group by entity, and the host-bound leaves are the transport's:**

```ts
// core
interface LSPClientOptions {
	readonly on?: EmitterHooks<LSPClientEventMap>
	readonly error?: EmitterErrorHandler
	readonly transport: LSPTransportInterface
	readonly workspace: LSPDocumentURI      // the root this client declares
	readonly capabilities?: LSPClientCapabilities
	readonly timeout?: number
	readonly signal?: AbortSignal           // aborts the client, not one request
}
// server
interface StdioTransportOptions {
	readonly server: {
		readonly command: readonly string[]  // the argv vector
		readonly directory?: string          // the child's working directory
		readonly environment?: Readonly<Record<string, string | undefined>>
	}
	readonly grace?: number
}
```

Pointing the client at `tsgo --lsp` instead of `oxlint --lsp` is then data, which is the whole
content of "swap the server". `workspace` and `directory` are deliberately different words for
genuinely different facts — the protocol root and the spawn directory — because reusing one word
for both is the drift the one-concept-one-term law bans.

**No per-call signal on `open`.** Abandoning a `didOpen` without its `didClose` leaves the server
holding a document forever. Cancellation is a client-wide fact here, so `signal` sits at the top
level. mcp's per-call `signal` does not transfer, and this is why.

**Selection from the `InitializeResult`.** Diagnostics path is derived per `open`: pull
(`textDocument/diagnostic`) when `diagnosticProvider` is advertised, push
(`textDocument/publishDiagnostics`) otherwise — never stored, so it cannot drift from
`capabilities`. Sync **support** gates `open`: a `textDocumentSync` that resolves to `None`, or an
options form with `openClose` absent, makes `open` throw `LSPError` coded `protocol` rather than
sending a notification the server discards. Sync **mode** (`Full` vs `Incremental`) has no v1
consumer, because it governs `didChange` alone; it arrives with that trigger, and v1 publishes no
`sync` member.

**Refusals.** An inbound server-to-client request the client does not implement is answered
`-32601`, which the base protocol requires for every processed request and mandates for `$/`
requests specifically (distillate §Base protocol). It is not emitted, because v1 has no
registration seam through which a consumer could answer it. A malformed frame, a non-`utf-8`
`Content-Type` charset, an unparsable body, and a response correlating to nothing become `LSPError`
values coded `framing`, `protocol`, `transport`, `duplicate`, `timeout`, and `closed`, each with
`context` carrying the wire error when one exists, and `isLSPError` narrows a `catch`.

**Alternative ruled out: a `documents` manager sub-entity** (`client.documents.open(...)` returning
an `LSPDocumentInterface`). It is the right shape for an editor and the wrong shape for v1: it
exists to answer "which documents are open", which the first consumer never asks — `LintStage`
opens one document, waits, and closes it (`LintStage.ts:234-267`). The creation gate refuses it.
Its trigger is a consumer that keeps a document open across edits, which is the same trigger that
admits `didChange` — so the exclusion is coherent rather than arbitrary, and both land together.

## Q3 — The conformance suite

**Ruling.** Parity runs on three instruments, none of which adds a parser and none of which reaches
runtime.

**Token parity, against the vendored model, at runtime.** `constants.ts` declares `LSP_METHODS` —
the method literals the client sends and receives — and `tests/setupConformance.ts` indexes the
vendored `metaModel.json` by `requests[].method` and `notifications[].method`. The suite asserts
every literal exists in the model **and** that its `messageDirection` matches the direction the
client uses it in. That catches the drift that actually happens: a typo'd method, a client sending
a `serverToClient` method. It asserts membership, never a total, per `.claude/rules/tests.md`.
Error-code constants check the same way against `enumerations`.

**Structural parity, at compile time, against a development-only comparison.**
`vscode-languageserver-protocol` is pinned as a development dependency, and
`tests/conformance.test.ts` carries type-level assignability declarations in both directions for
each declared wire structure. `npm run check` reads `tests/` through the root project, so this
needs no new machinery and no `tsc` spawn: a renamed member, a wrong optionality, or a widened
literal fails the existing typecheck gate. The package's runtime never imports it and
`package.json` `files` ships only `dist/src`, so the "never runtime" requirement closes
mechanically rather than by promise.

**Behavioural parity, against a protocol-faithful fixture server built from the model.**
`tests/setupConformance.ts` exports a fixture peer implementing `LSPTransportInterface` in process,
whose payloads are constructed from the metaModel's own required-property sets. It proves framing
(header parsing, byte-length counting over multi-byte content, a header split across chunks, a
non-`utf-8` charset refused), id correlation (out-of-order responses, a response correlating to
nothing, an error response with no id), ordering (`initialize` before anything else; nothing before
`initialized`; only `exit` after `shutdown`), error codes (an unsupported server request answered
`-32601`), encoding negotiation (a server advertising `utf-8` and a server advertising nothing),
and the diagnostics path selection from `diagnosticProvider`. A parser that rejects a model-shaped
payload reddens.

**What the suite pins.** `CONFORMANCE_SPEC = '3.18.0'`, and the suite asserts the vendored file's
`metaData.version` reports exactly that. A refreshed fixture that moved version fails loudly
instead of silently re-baselining. This differs from mcp deliberately: mcp pins a dated revision
because its runner takes `--spec-version` (`/home/user/mcp/tests/setupConformance.ts:49,614`);
LSP's authority is the model file's own version field.

**A conformance failure reads as** the package's name for the thing, the model's name for the
thing, and the file and line where they disagree — a method missing from the model, a direction
mismatch, an assignability diagnostic from `check`, or a fixture payload the package's guard
refused.

**What transfers from mcp and ollama, and what does not.** The pattern transfers: a pinned spec
constant, a typed setup module owning every fixture, a suite whose failures name the fixture rather
than the library, and the manifest as the single authority for the pinned version
(`setupConformance.ts:507-524`). The **runner does not transfer.** `@modelcontextprotocol/conformance`
drives mcp's *server* over a real socket; this package ships a *client*, and no official artifact
drives one. Substituting a server-side runner would measure a surface this package does not have —
so the fixture server built from the model is the faithful analogue, and the suite states that
limit rather than implying coverage it lacks. The recorded per-scenario baseline
(`tests/conformance.test.ts:20-41`) transfers as a habit: assert the named rows, never a bare
total.

**Alternative ruled out: generate `types.ts` from the metaModel at build time.** It makes
`*/types.ts` non-authoritative, contradicting `AGENTS.md` § Authority and loading; it publishes
hundreds of types no consumer uses, against the minimal-API law; and it converts every protocol
question into a generator question. The model stays a fixture, never a source.

## Q4 — Unit decomposition

Refined in the Units section. The reshaping decision worth stating here: **the transport seam moves
the client's proof out of the sandbox-hostile zone.** With `LSPTransportInterface` injected, the
client's own suite drives an in-process fixture peer with no child, no pipes, and no listener, so
it is provable on a bench. Only the stdio transport unit spawns a child, and only that unit's
evidence must be a host run. `.claude/rules/tests.md` § Untestable usually means missing seam names
a hard-coded spawn as a missing injection point; here the seam pays for itself in routing before it
pays for itself in extensibility.

## Q5 — Exclusions with triggers

Recorded in `guides/client.md` beside the surface each row would join — not in `ROADMAP.md`, which
this repository does not keep, and not in a campaign artifact, which is evidence rather than a
rule's home.

| Excluded | Trigger that admits it |
| --- | --- |
| `didChange`, `willSave`, `didSave`, sync **mode** | A consumer keeping a document open across an edit |
| `documents` manager, `LSPDocumentInterface` | The same trigger; both land together |
| Work-done and partial-result progress | A consumer rendering progress; the client declares neither `window.workDoneProgress` nor a `workDoneToken`, so a conformant server sends none |
| Dynamic registration | A server this package must support that registers unconditionally despite no `dynamicRegistration` — a real hazard, carried as R3 |
| Workspace features (`configuration`, folders, `applyEdit`, file operations) | A server whose useful behaviour depends on answering one; each is answered `-32601` until then |
| Every language feature | A consumer asking for it; each arrives with its client-capability row, its method literal, and its result types together |
| `identity` on the client surface | A consumer that reports which server produced a diagnostic |
| Browser environment | A language server reachable from a browser; `src/browser` is not created and the manifest declares no such export |
| `LSPServer` | A consumer implementing a server; it arrives as a sibling entity in `src/core`, reusing the codec and the transport contract unchanged, which is the trajectory this decomposition preserves |

**Alternative ruled out: publish the exclusions as `it.todo()` rows.** `.claude/rules/tests.md`
permits `it.todo()` only for explicitly out-of-scope roadmap work, and a todo carries no trigger a
reader can check. Prose beside the surface, with the trigger stated as an observable condition, is
what a later unit can act on.

# The `types.ts` sketch

A sketch of the load-bearing declarations, not an implementation. Wire members are verbatim;
everything else obeys the naming laws.

```ts
// src/core/types.ts
//
// Wire-modelling types carry protocol property names verbatim, including `kind`.
// Everywhere the package speaks for itself — options, methods, events, errors —
// the repository naming laws bind fully.

// ── JSON-RPC 2.0 envelope (not LSP's; the framing below is) ──────────────────

export type JSONRPCId = string | number

export interface JSONRPCRequest {
	readonly jsonrpc: '2.0'
	readonly method: string
	readonly id: JSONRPCId
	readonly params?: Readonly<Record<string, unknown>>
}

export interface JSONRPCNotification {
	readonly jsonrpc: '2.0'
	readonly method: string
	/** Forbidden — an id is what makes a call a request instead. */
	readonly id?: never
	readonly params?: Readonly<Record<string, unknown>>
}

export interface JSONRPCError {
	/** Open by specification: unknown codes are preserved, never refused. */
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
	/** `null` when the request's id could not be read — the base protocol's own shape. */
	readonly id: JSONRPCId | null
	readonly error: JSONRPCError
	readonly result?: never
}

export type JSONRPCResponse = JSONRPCResultResponse | JSONRPCErrorResponse
export type JSONRPCMessage = JSONRPCRequest | JSONRPCNotification | JSONRPCResponse

// ── LSP base-protocol framing ────────────────────────────────────────────────

export interface LSPFrame {
	/** The `Content-Length` value, in bytes of the encoded content. */
	readonly length: number
	/** The `Content-Type` charset, defaulted to `utf-8`; legacy `utf8` folds to it. */
	readonly charset: string
	readonly content: string
}

// ── Wire structures ──────────────────────────────────────────────────────────

/** A string that parses as a URI (RFC 3986). Drive-letter casing and escaping are not normalized. */
export type LSPDocumentURI = string

export interface LSPPosition {
	readonly line: number
	readonly character: number
}

export interface LSPRange {
	readonly start: LSPPosition
	/** Exclusive. */
	readonly end: LSPPosition
}

export interface LSPLocation {
	readonly uri: LSPDocumentURI
	readonly range: LSPRange
}

export interface LSPTextDocumentItem {
	readonly uri: LSPDocumentURI
	readonly languageId: string
	readonly version: number
	readonly text: string
}

export interface LSPTextDocumentIdentifier {
	readonly uri: LSPDocumentURI
}

export type LSPDiagnosticSeverity = 1 | 2 | 3 | 4
export type LSPDiagnosticTag = 1 | 2

export interface LSPDiagnosticRelated {
	readonly location: LSPLocation
	readonly message: string
}

export interface LSPDiagnostic {
	readonly range: LSPRange
	readonly severity?: LSPDiagnosticSeverity
	readonly code?: number | string
	readonly codeDescription?: { readonly href: string }
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

/** The pull report. `kind` is the wire's own discriminant, transcribed. */
export type LSPDocumentDiagnosticReport =
	| {
			readonly kind: 'full'
			readonly resultId?: string
			readonly items: readonly LSPDiagnostic[]
	  }
	| {
			readonly kind: 'unchanged'
			readonly resultId: string
	  }

export type LSPPositionEncoding = 'utf-8' | 'utf-16' | 'utf-32'
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

/** `clientInfo` and `serverInfo` both hold this shape. */
export interface LSPIdentity {
	readonly name: string
	readonly version?: string
}

export interface LSPClientCapabilities {
	readonly general?: { readonly positionEncodings?: readonly LSPPositionEncoding[] }
	readonly textDocument?: {
		readonly synchronization?: Readonly<Record<string, unknown>>
		readonly publishDiagnostics?: Readonly<Record<string, unknown>>
		readonly diagnostic?: Readonly<Record<string, unknown>>
	}
}

/** Wide and unnarrowed: a client ignores server capabilities it does not understand. */
export interface LSPServerCapabilities {
	readonly positionEncoding?: LSPPositionEncoding
	readonly textDocumentSync?: LSPTextDocumentSync
	readonly diagnosticProvider?: LSPDiagnosticOptions
	readonly [key: string]: unknown
}

export interface LSPInitializeResult {
	readonly capabilities: LSPServerCapabilities
	readonly serverInfo?: LSPIdentity
}

// ── The package's own contracts ──────────────────────────────────────────────

export type LSPTransportEventMap = {
	readonly chunk: readonly [chunk: Uint8Array]
	readonly exit: readonly [exit: LSPExit]
	readonly error: readonly [error: unknown]
}

/** Carries bytes, never frames, so one framer serves every transport. */
export interface LSPTransportInterface {
	readonly emitter: EmitterInterface<LSPTransportEventMap>
	start(): Promise<void>
	send(bytes: Uint8Array): Promise<boolean>
	close(): Promise<void>
}

export interface LSPExit {
	readonly code: number | null
	readonly signal: string | null
}

export type LSPClientEventMap = {
	readonly start: readonly []
	readonly exit: readonly [exit: LSPExit]
	readonly notification: readonly [message: JSONRPCNotification]
	readonly error: readonly [error: unknown]
}

export interface LSPClientOptions {
	readonly on?: EmitterHooks<LSPClientEventMap>
	readonly error?: EmitterErrorHandler
	readonly transport: LSPTransportInterface
	readonly workspace: LSPDocumentURI
	readonly capabilities?: LSPClientCapabilities
	readonly timeout?: number
	readonly signal?: AbortSignal
}

export interface LSPClientInterface {
	readonly emitter: EmitterInterface<LSPClientEventMap>
	/** The server's advertisement; `undefined` until `start` resolves. */
	readonly capabilities: LSPServerCapabilities | undefined
	/** Derived from the advertisement; `utf-16` when the server declares none. */
	readonly encoding: LSPPositionEncoding
	start(): Promise<void>
	open(document: LSPTextDocumentItem): Promise<readonly LSPDiagnostic[]>
	close(uri: LSPDocumentURI): void
	destroy(): Promise<void>
}

export type LSPErrorCode =
	| 'spawn'
	| 'framing'
	| 'protocol'
	| 'duplicate'
	| 'timeout'
	| 'closed'
```

# Units

Every unit names its role and engine. Order is serial except where noted; each writing unit takes a
disjoint owned set.

| Unit | Role · engine | Owns | Depends on | Acceptance |
| --- | --- | --- | --- | --- |
| **L1 `lsp-contract`** | `implementer` · Opus 5 (native) | `src/core/types.ts`, `src/core/constants.ts`, `src/core/errors.ts`, `src/core/index.ts` | — | `npm run check` green; `npm run test:policy` green; every declaration carries TSDoc; every wire structure traces to a declared client capability or to a message the client sends; `LSP_METHODS` and the code constants exist; `isLSPError` narrows |
| **L2 `lsp-codec`** | `sol` · GPT-5.6 Sol | `src/core/helpers.ts`, `src/core/parsers.ts`, `src/core/factories.ts`, `src/core/validators.ts`, mirrored tests | L1 | `test:src:core` green; a frame whose content carries an astral code point counts bytes, proved against `TextEncoder` as an independent oracle rather than the parser's own arithmetic; a header split across chunks reassembles; a non-`utf-8` charset is refused; each guard returns `false` for hostile input rather than throwing. Bench-safe: pure functions, no child |
| **L3 `lsp-client`** | `sol` · GPT-5.6 Sol | `src/core/LSPClient.ts`, the `createLSPClient` row in `src/core/factories.ts`, mirrored tests | L2 | `test:src:core` green driven by an in-test fixture peer; correlation survives out-of-order responses; an unsupported inbound request is answered `-32601`; a second `open` of a live URI throws `duplicate`; `destroy` sends `shutdown` then `exit` and settles when the transport does; a deadline sends `$/cancelRequest` and rejects only that request. Bench-safe: no child, no listener |
| **L4 `lsp-stdio`** | `implementer` · Opus 5 (native), host-proved | `src/server/types.ts`, `src/server/transports/StdioTransport.ts`, `src/server/factories.ts`, `src/server/index.ts`, mirrored tests, `tests/server.js` fixture peer | L3 | `test:src:server` green **on the host**; `stopChild`/`killTree` from `@orkestrel/process` bound termination; after `destroy()` no orphan survives, read by recorded process id, never by a command-line pattern |
| **L5 `lsp-conformance`** | `sol` · GPT-5.6 Sol | `tests/lsp-3.18-metaModel.json` (copied from the staged source), `tests/setupConformance.ts`, `tests/conformance.test.ts`, `tests/setup.test.ts`, and the `conformance`, `guides`, and `setup` project rows in `vite.config.ts` plus their `package.json` scripts and `test` chain | L4 | `test:conformance` green; `metaData.version` asserted equal to `CONFORMANCE_SPEC`; every `LSP_METHODS` literal present with matching `messageDirection`; the type-level assignability block passes `check`; the model-index helper carries a negative control — a planted literal absent from the model reddens — and `test:setup` proves it |
| **L6 `lsp-guide`** | `implementer` · Opus 5 (native) | `guides/README.md`, `guides/client.md`, `guides/lsp.md`, `tests/guides.test.ts` | L5 | `test:guides` green; every backticked API resolves; every public export documented; the flagship fence transcribed and its claimed values asserted; the exclusion table's every row names an observable trigger |
| **L7 `probe-adopt`** | `implementer` · Opus 5 (native), host-proved, `/home/user/probe` | `src/server/stages/LintStage.ts`, `src/server/helpers.ts`, `src/server/types.ts`, `package.json` | L6, plus a packed `@orkestrel/lsp` tarball installed per the dependency rule | `LintStage` carries no `Content-Length` literal and no correlation map; probe's lint suite green on the host; the replaced range recorded in the same step |

Routing rationale: L1 and L6 are naming and documentation-voice work, which is Opus's class. L2,
L3, and L5 are constraint-heavy mechanical-precision work with no process tree, which is Sol's
class and is bench-provable. L4 and L7 drive a child over pipes, which a bench sandbox measures as
a false green, so both run native with host evidence.

# Tensions

Choices this lane took on judgment, named for the other lane to challenge.

- **`open` resolves with diagnostics rather than `void`.** The first consumer's ergonomics over the
  editor-shaped API, paid for by publishing exactly one diagnostics door in v1. The objective lane
  may hold that a promise resolving on a *notification* is a race the protocol does not underwrite
  — a push server may publish before the client has finished reading its own `didOpen` write, or
  may publish an empty array first and the real report second, and nothing in the specification
  bounds that.
- **`LSPServerCapabilities` carries an index signature.** Widened deliberately so a client ignores
  what it does not understand (distillate §Lifecycle). That admits `unknown` values into a public
  type and weakens what `capabilities` promises a reader.
- **`workspace` on the client and `directory` on the transport.** Two words for two facts, at the
  cost of a reader wondering which one is the root.
- **The transport carries bytes, not frames.** It puts every framing decision in core, where
  `TextEncoder` is permitted, and it makes the transport contract trivial. It also means a future
  socket transport re-derives nothing and a future in-process transport must encode to bytes only
  to be decoded again.
- **`vscode-languageserver-protocol` as a development dependency.** A foreign package the brief
  pre-authorizes at dev level, and the only instrument that proves structural parity without a
  second parser. Whether mutual assignability actually holds is R2.
- **`start` and `exit` as event names rather than `connect` and `disconnect`.** A departure from
  mcp's map on the ground that stdio LSP has no reconnect.

# Risks

| Risk | Cheapest settling probe |
| --- | --- |
| **R1 — `@orkestrel/process` cannot carry LSP stdio.** `ProcessInterface.lines` is `AsyncIterable<string>` split on `\n`, `\r\n`, and bare `\r` (`dist/src/core/index.d.ts:436-452`), and `send(text)` writes "one line … without its trailing newline" (`:496-512`). `Content-Length` framing needs raw bytes both ways, and a line splitter concatenates a frame's content with the next frame's header. The seed dependency is **not** unused: `stopChild`, `killTree`, `waitForExit`, and `resolveExecutable` drive a self-spawned child by contract (`dist/src/server/index.d.ts:477-479`). | Already settled by reading the installed declaration. The residue — that a `ChildProcessWithoutNullStreams` satisfies `ProcessChild` structurally — is a `prove` call: a case assigning the spawned child to `ProcessChild`, a control omitting `off` that must fail at typecheck |
| **R2 — the comparison types may not be mutually assignable.** `readonly LSPDiagnostic[]` is not assignable to a mutable `Diagnostic[]`, so the parity block can fail for a reason that is not drift. | A `prove` call before L5 opens: a case asserting `LSPDiagnostic` ⇄ the foreign `Diagnostic` in both directions, a control renaming one member that must fail at typecheck. If the array direction fails, the block asserts element assignability rather than collection assignability, and the suite records that narrowing |
| **R3 — a real server registers capabilities dynamically despite no `dynamicRegistration`, and the client answers `-32601`.** Some servers register unconditionally; a `-32601` can be fatal to them. | A host run of the first consumer's own server: `oxlint --lsp` under a recording client, reading whether `client/registerCapability` arrives at all. Cheap, and it is the exact server L7 must satisfy |
| **R4 — position encoding silently corrupts every reported column.** A server that advertises no `positionEncoding` but emits UTF-8 offsets is read as UTF-16 by the default rule, and nothing reports the mismatch. | A host run against `oxlint --lsp` with a fixture whose line carries an astral code point before the diagnostic, comparing the reported `character` against both encodings. This is the single probe whose absence costs the most downstream |
| **R5 — byte counting under multi-byte content.** A framer that counts code units passes every ASCII test. | A unit test in L2 whose expected length comes from `TextEncoder().encode(content).length`, never from the framer |
| **R6 — the token-parity suite passes vacuously.** An empty `LSP_METHODS`, or a model file that failed to load, reports green. | The negative control L5's acceptance already names: a planted literal absent from the model must redden, and the suite asserts membership rather than a total |
| **R7 — a refreshed model fixture re-baselines silently.** | `metaData.version` asserted equal to `CONFORMANCE_SPEC = '3.18.0'` |
| **R8 — `LSPClient` in core drifts host-dependent.** A `node:` import or a Node global reaches core through an inattentive edit. | `npm run check:src:core` under `types: []` already refuses it; L1's acceptance names that scope explicitly rather than relying on the root check |

# Exit criterion for Wave L

Wave L ends when `@orkestrel/lsp` publishes a client a foreign language server actually answers,
and every capability the wave owns has closed as implemented, repaired, retained, or intentionally
excluded on evidence. The enumerated capabilities are: the wire type surface bounded by the
client's declared capabilities (L1, implemented); the base-protocol codec — framing, byte-accurate
`Content-Length`, charset refusal, JSON-RPC guards (L2, implemented); the `LSPClient` entity with
`capabilities`, `encoding`, `open`, `close`, `start`, `destroy`, and `emitter`, carrying handshake
consumption, derived position encoding, sync-support gating, diagnostics-path selection from
`diagnosticProvider`, deadline-driven cancellation, and `-32601` refusal of unsupported server
requests (L3, implemented); the stdio transport with bounded termination and no surviving orphan
(L4, implemented, host-proved); the conformance suite pinning `3.18.0` and proving token parity
against the vendored model, structural parity against the development-only comparison types, and
behavioural parity against a model-built fixture peer (L5, implemented); the guide carrying parity
plus the exclusion table where every row names an observable trigger (L6, implemented); and probe's
`LintStage` rewritten onto the published client with no framing literal and no correlation map of
its own (L7, implemented, host-proved). Excluded on evidence, each with its trigger recorded in
`guides/client.md`: `didChange` and the save notifications, the document manager, work-done and
partial-result progress, dynamic registration, every workspace feature, every language feature, the
client `identity` getter, the browser environment, and `LSPServer`. The wave does not close on an
engine's remaining appetite for further LSP surface; it closes when those rows close and the gate
chain — `format:check`, `lint:check`, `check`, `build`, `test` — reports green from an independent
`verifier`.

Paths referenced: `/home/user/scaffold/.orkestrel/campaign/lsp-design-brief.md`,
`/home/user/scaffold/.orkestrel/campaign/lsp-spec-distillate.md`,
`/home/user/scaffold/tmp/cursor/sources/lsp-3.18-metaModel.json`,
`/home/user/mcp/src/core/types.ts`, `/home/user/mcp/src/core/MCPClient.ts`,
`/home/user/mcp/src/server/transports/StdioClientTransport.ts`,
`/home/user/mcp/tests/setupConformance.ts`, `/home/user/mcp/tests/conformance.test.ts`,
`/home/user/probe/src/server/stages/LintStage.ts`, `/home/user/lsp/package.json`,
`/home/user/lsp/tests/setupPolicy.ts`,
`/home/user/lsp/node_modules/@orkestrel/process/dist/src/core/index.d.ts`,
`/home/user/lsp/node_modules/@orkestrel/process/dist/src/server/index.d.ts`.
