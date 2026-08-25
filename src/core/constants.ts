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
})

/** Lists the position encodings named by Language Server Protocol 3.18. */
export const LSP_ENCODINGS = Object.freeze(['utf-8', 'utf-16', 'utf-32'] as const)

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
