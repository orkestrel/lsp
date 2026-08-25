import type { EmitterErrorHandler, EmitterHooks, EmitterInterface } from '@orkestrel/emitter'

/** Identifies a JSON-RPC request and its matching response. */
export type JSONRPCId = string | number

/** Describes a JSON-RPC 2.0 method call that requires a response. */
export interface JSONRPCRequest {
	readonly jsonrpc: '2.0'
	readonly id: JSONRPCId
	readonly method: string
	readonly params?: Readonly<Record<string, unknown>>
}

/** Describes a JSON-RPC 2.0 method call that permits no response. */
export interface JSONRPCNotification {
	readonly jsonrpc: '2.0'
	readonly method: string
	readonly id?: never
	readonly params?: Readonly<Record<string, unknown>>
}

/** Describes the error payload carried by a JSON-RPC error response. */
export interface JSONRPCError {
	readonly code: number
	readonly message: string
	readonly data?: unknown
}

/** Describes a successful JSON-RPC 2.0 response. */
export interface JSONRPCResultResponse {
	readonly jsonrpc: '2.0'
	readonly id: JSONRPCId
	readonly result: unknown
	readonly error?: never
}

/** Describes a failed JSON-RPC 2.0 response. */
export interface JSONRPCErrorResponse {
	readonly jsonrpc: '2.0'
	readonly id: JSONRPCId | null
	readonly error: JSONRPCError
	readonly result?: never
}

/** Describes either outcome of a JSON-RPC 2.0 request. */
export type JSONRPCResponse = JSONRPCResultResponse | JSONRPCErrorResponse

/** Describes one complete JSON-RPC 2.0 wire message. */
export type JSONRPCMessage = JSONRPCRequest | JSONRPCNotification | JSONRPCResponse

/** Identifies a document by its Language Server Protocol URI. */
export type LSPDocumentURI = string

/** Describes a zero-based position inside a text document. */
export interface LSPPosition {
	readonly line: number
	readonly character: number
}

/** Describes a half-open span inside a text document. */
export interface LSPRange {
	readonly start: LSPPosition
	readonly end: LSPPosition
}

/** Describes a document URI and range pair. */
export interface LSPLocation {
	readonly uri: LSPDocumentURI
	readonly range: LSPRange
}

/** Identifies a text document in a Language Server Protocol message. */
export interface LSPTextDocumentIdentifier {
	readonly uri: LSPDocumentURI
}

/** Describes the complete text and identity of a document being opened. */
export interface LSPTextDocumentItem {
	readonly uri: LSPDocumentURI
	readonly languageId: string
	readonly version: number
	readonly text: string
}

/** Identifies the standard severity assigned to a diagnostic. */
export type LSPDiagnosticSeverity = 1 | 2 | 3 | 4

/** Identifies a standard tag assigned to a diagnostic. */
export type LSPDiagnosticTag = 1 | 2

/** Describes the external resource that explains a diagnostic code. */
export interface LSPCodeDescription {
	readonly href: string
}

/** Describes related diagnostic text at another source location. */
export interface LSPDiagnosticRelated {
	readonly location: LSPLocation
	readonly message: string
}

/** Describes one Language Server Protocol diagnostic. */
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

/** Describes diagnostics published for one document. */
export interface LSPPublishDiagnosticsParams {
	readonly uri: LSPDocumentURI
	readonly version?: number
	readonly diagnostics: readonly LSPDiagnostic[]
}

/** Describes a request for diagnostics from one document. */
export interface LSPDocumentDiagnosticParams {
	readonly textDocument: LSPTextDocumentIdentifier
	readonly identifier?: string
	readonly previousResultId?: string
}

/** Describes a complete or unchanged document diagnostic report. */
export type LSPDocumentDiagnosticReport =
	| {
			readonly kind: 'full'
			readonly resultId?: string
			readonly items: readonly LSPDiagnostic[]
	  }
	| { readonly kind: 'unchanged'; readonly resultId: string }

/** Identifies a position encoding selected by a language server. */
export type LSPPositionEncoding = string

/** Identifies the text synchronization mode selected by a language server. */
export type LSPTextDocumentSyncKind = 0 | 1 | 2

/** Describes the text synchronization features selected by a language server. */
export interface LSPTextDocumentSyncOptions {
	readonly openClose?: boolean
	readonly change?: LSPTextDocumentSyncKind
}

/** Describes either compact or expanded text synchronization capabilities. */
export type LSPTextDocumentSync = LSPTextDocumentSyncKind | LSPTextDocumentSyncOptions

/** Describes the diagnostic provider features selected by a language server. */
export interface LSPDiagnosticOptions {
	readonly identifier?: string
	readonly interFileDependencies: boolean
	readonly workspaceDiagnostics: boolean
}

/** Describes the name and optional version of an LSP peer. */
export interface LSPIdentity {
	readonly name: string
	readonly version?: string
}

/** Describes the Language Server Protocol features this client advertises. */
export interface LSPClientCapabilities {
	readonly general?: { readonly positionEncodings?: readonly LSPPositionEncoding[] }
	readonly textDocument?: {
		readonly synchronization?: Readonly<Record<string, unknown>>
		readonly publishDiagnostics?: Readonly<Record<string, unknown>>
		readonly diagnostic?: Readonly<Record<string, unknown>>
	}
}

/** Describes the initialization members sent by this client. */
export interface LSPInitializeParams {
	readonly processId: number | null
	readonly clientInfo?: LSPIdentity
	readonly rootUri: LSPDocumentURI | null
	readonly capabilities: LSPClientCapabilities
}

/** Describes the known and extension capabilities returned by a language server. */
export interface LSPServerCapabilities {
	readonly positionEncoding?: LSPPositionEncoding
	readonly textDocumentSync?: LSPTextDocumentSync
	readonly diagnosticProvider?: LSPDiagnosticOptions
	readonly [capability: string]: unknown
}

/** Describes the successful result of an initialize request. */
export interface LSPInitializeResult {
	readonly capabilities: LSPServerCapabilities
	readonly serverInfo?: LSPIdentity
}

/** Describes how a transport process ended. */
export interface LSPExit {
	readonly code: number | null
	readonly signal: string | null
}

/** Maps transport event names to their listener arguments. */
export type LSPTransportEventMap = {
	readonly chunk: readonly [chunk: Uint8Array]
	readonly exit: readonly [exit: LSPExit]
	readonly error: readonly [error: unknown]
}

/**
 * Defines the byte transport required by an LSP client.
 *
 * @remarks
 * The `send` and `close` methods must reject rather than throw. After `close` resolves, `send`
 * must resolve `false`. The client may call `start` again only after `close` resolves or the
 * transport emits `exit`; an implementation that cannot reconnect must reject that call.
 */
export interface LSPTransportInterface {
	readonly emitter: EmitterInterface<LSPTransportEventMap>
	start(): Promise<void>
	send(bytes: Uint8Array): Promise<boolean>
	close(): Promise<void>
}

/**
 * Describes the lifecycle state that gates client operations and transport generations.
 *
 * @remarks
 * A `starting` or `ready` state owns the transport generation it identifies. A `destroying` state
 * carries a generation only when that initialized generation still requires an `exit` write.
 */
export type LSPClientLifecycle =
	| { readonly phase: 'idle' }
	| { readonly phase: 'starting'; readonly promise: Promise<void>; readonly generation: number }
	| { readonly phase: 'ready'; readonly generation: number }
	| { readonly phase: 'closed' }
	| { readonly phase: 'destroying'; readonly promise: Promise<void>; readonly generation?: number }
	| { readonly phase: 'destroyed' }

/** Maps client event names to their listener arguments. */
export type LSPClientEventMap = {
	readonly notification: readonly [message: JSONRPCNotification]
	readonly exit: readonly [exit: LSPExit]
	readonly error: readonly [error: unknown]
}

/** Configures an LSP client and its transport. */
export interface LSPClientOptions {
	readonly on?: EmitterHooks<LSPClientEventMap>
	readonly error?: EmitterErrorHandler
	readonly transport: LSPTransportInterface
	readonly workspace: LSPDocumentURI
	readonly timeout?: number
	readonly signal?: AbortSignal
}

/** Defines the document-oriented behavior exposed by an LSP client. */
export interface LSPClientInterface {
	readonly emitter: EmitterInterface<LSPClientEventMap>
	readonly capabilities: LSPServerCapabilities | undefined
	readonly encoding: LSPPositionEncoding | undefined
	start(): Promise<void>
	open(document: LSPTextDocumentItem): Promise<readonly LSPDiagnostic[]>
	close(uri: LSPDocumentURI): Promise<void>
	/**
	 * Tears down the client within the configured deadline.
	 *
	 * @returns A promise that resolves after transport settlement and listener removal.
	 * @remarks A close failure that settles before the deadline is emitted before the emitter is
	 * destroyed. At the deadline, the client emits a coded `timeout` error and absorbs the later
	 * close outcome.
	 */
	destroy(): Promise<void>
}

/** Identifies a stable package failure category. */
export type LSPErrorCode =
	| 'spawn'
	| 'framing'
	| 'protocol'
	| 'duplicate'
	| 'server'
	| 'timeout'
	| 'aborted'
	| 'closed'

/** Describes structured details attached to an {@link LSPError}. */
export interface LSPErrorContext {
	readonly code?: number
	readonly messages?: readonly JSONRPCMessage[]
	readonly value?: unknown
}

/**
 * Retains incremental base-protocol bytes and resolved framing metadata between decode calls.
 *
 * @remarks
 * Each state node owns the newest retained byte segment and links to earlier segments through
 * `previous`. The cumulative `size` lets a continuation append in constant work. `boundary` and
 * `length` appear together after the header has been resolved, so body continuations do not scan
 * or parse it again.
 */
export type LSPDecodeState =
	| {
			readonly bytes: Uint8Array
			readonly previous?: LSPDecodeState
			readonly size: number
			readonly boundary?: never
			readonly length?: never
	  }
	| {
			readonly bytes: Uint8Array
			readonly previous?: LSPDecodeState
			readonly size: number
			readonly boundary: number
			readonly length: number
	  }

/** Configures an {@link LSPError} instance. */
export interface LSPErrorOptions {
	readonly code: LSPErrorCode
	readonly context?: LSPErrorContext
	readonly cause?: unknown
}
