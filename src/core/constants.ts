import type { LSPClientCapabilities } from './types.js'

/** Names the Language Server Protocol methods this client sends or consumes. */
export const LSP_METHODS = Object.freeze({
	initialize: 'initialize',
	initialized: 'initialized',
	shutdown: 'shutdown',
	exit: 'exit',
	cancel: '$/cancelRequest',
	open: 'textDocument/didOpen',
	close: 'textDocument/didClose',
	diagnostic: 'textDocument/diagnostic',
	publish: 'textDocument/publishDiagnostics',
} as const)

/** Lists the position encodings named by Language Server Protocol 3.18. */
export const LSP_ENCODINGS = Object.freeze(['utf-8', 'utf-16', 'utf-32'] as const)

/**
 * Lists the machine-readable failure categories an {@link LSPError} carries, in declaration order.
 *
 * @remarks
 * One list feeds the {@link LSPErrorCode} union and the `isLSPError` guard, so a category cannot be
 * constructed by one and refused by the other. Adding a category here reaches both at once.
 *
 * @example
 * ```ts
 * LSP_ERROR_CODES // ['spawn', 'framing', 'protocol', 'duplicate', 'server', 'timeout', 'aborted', 'closed']
 * ```
 */
export const LSP_ERROR_CODES = Object.freeze([
	'spawn',
	'framing',
	'protocol',
	'duplicate',
	'server',
	'timeout',
	'aborted',
	'closed',
] as const)

/** Lists the diagnostic severities named by the Language Server Protocol, from error to hint. */
export const LSP_DIAGNOSTIC_SEVERITIES = Object.freeze([1, 2, 3, 4] as const)

/** Lists the diagnostic tags named by the Language Server Protocol. */
export const LSP_DIAGNOSTIC_TAGS = Object.freeze([1, 2] as const)

/** Lists the text synchronization modes named by the Language Server Protocol. */
export const LSP_SYNC_KINDS = Object.freeze([0, 1, 2] as const)

/**
 * Describes the capabilities this client advertises in its initialize request.
 *
 * @remarks
 * `general.positionEncodings` is both the advertisement and the acceptance set. The client sends
 * this record as `capabilities` and refuses an initialize result whose `positionEncoding` this
 * record does not list, so the advertised encodings and the accepted ones cannot drift apart.
 */
export const LSP_CAPABILITIES = Object.freeze({
	general: Object.freeze({ positionEncodings: Object.freeze(['utf-16']) }),
	textDocument: Object.freeze({
		synchronization: Object.freeze({}),
		publishDiagnostics: Object.freeze({}),
		diagnostic: Object.freeze({}),
	}),
} satisfies LSPClientCapabilities)

/** Names the default request-settlement timeout in milliseconds. */
export const LSP_TIMEOUT = 30_000

/** Identifies a malformed JSON payload. */
export const JSONRPC_PARSE_ERROR = -32700

/** Identifies a structurally invalid JSON-RPC request. */
export const JSONRPC_INVALID_REQUEST = -32600

/** Identifies a JSON-RPC method that the receiver does not provide. */
export const JSONRPC_METHOD_NOT_FOUND = -32601

/** Identifies invalid parameters supplied to a JSON-RPC method. */
export const JSONRPC_INVALID_PARAMS = -32602

/** Identifies an internal JSON-RPC receiver failure. */
export const JSONRPC_INTERNAL_ERROR = -32603

/** Identifies a Language Server Protocol request cancelled by the client. */
export const LSP_REQUEST_CANCELLED = -32800

/** Identifies a request invalidated by modified document content. */
export const LSP_CONTENT_MODIFIED = -32801

/** Identifies a Language Server Protocol request cancelled by the server. */
export const LSP_SERVER_CANCELLED = -32802

/** Identifies a valid Language Server Protocol request that could not complete. */
export const LSP_REQUEST_FAILED = -32803

/**
 * Bounds an accepted base-protocol content body to 64 MiB.
 *
 * @remarks
 * The limit admits large diagnostics payloads while refusing a hostile declared length before the
 * parser retains its body bytes.
 */
export const LSP_CONTENT_LIMIT = 67_108_864

/**
 * Bounds an accepted base-protocol header to 64 KiB.
 *
 * @remarks
 * The limit admits extension fields while refusing boundary-free accumulation before it can grow
 * without bound.
 */
export const LSP_HEADER_LIMIT = 65_536
