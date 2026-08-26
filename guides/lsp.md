# Language Server Protocol client

The core package provides host-independent Language Server Protocol framing, validation, and a
document-oriented client over an injected byte transport.

## Client lifecycle

Create an `LSPClient` with an `LSPTransportInterface`, call `start()` before document operations,
and call `destroy()` when the session ends. Concurrent `start()` calls share the handshake. A
failed handshake or peer exit closes that transport generation, and a later `start()` call begins
a fresh generation.

The client accepts `open()` and `close()` only during a ready generation. A dead generation refuses
wire writes with an `LSPError` whose `code` property is `closed`. During teardown, the client sends
`shutdown`, then permits only `exit` on an initialized generation that has not exited.

Use the published client factory with any transport that implements the byte seam:

```ts
import type { LSPTransportInterface } from '@orkestrel/lsp'
import { createLSPClient } from '@orkestrel/lsp'

declare const transport: LSPTransportInterface

const client = createLSPClient({ transport, workspace: 'file:///workspace' })
await client.start()
const diagnostics = await client.open({
	uri: 'file:///workspace/main.ts',
	languageId: 'typescript',
	version: 1,
	text: 'const value = 1',
})
await client.destroy()
```

## Transport seam

An `LSPTransportInterface` implementation emits byte chunks, exits, and transport errors through
its emitter. The `send()` and `close()` methods reject instead of throwing. After `close()` resolves,
`send()` resolves `false`. The client can call `start()` again only after `close()` resolves or the
transport emits `exit`. A transport that cannot reconnect rejects that later `start()` call.

Each accepted `start()` call opens a generation, and an implementation emits `chunk`, `exit`, and
`error` only for the current one, emitting `exit` at most once for it. The client trusts every
`exit` it receives, so an implementation whose peer can outlive its own `close()` owns that
obligation.

The client also defends against a foreign transport that throws synchronously. It converts a send
fault into a coded `LSPError`, bounds exit and close settlement, and removes transport listeners
during teardown. A close failure that settles before the deadline is emitted before the client
destroys its emitter. At the deadline, the client emits an `LSPError` coded `timeout` and absorbs
the later close outcome.

## Stdio transport

The server environment publishes `StdioTransport`, the byte transport over a language server run as
a child process. It carries bytes and never frames: every standard-output chunk reaches the `chunk`
event exactly as the host delivered it, so a frame split across reads and two frames coalesced into
one read both arrive unaltered and the client's parser owns the framing. Standard error is drained
so a chatty server can't fill its pipe and stall.

`server.command` is the child's argument vector: its first element names the executable and the rest
are its arguments, so a launcher and its target stay one value and no shell splits them.
`server.directory` is the child's working directory, and `server.environment` is its complete
environment; the current directory and this process's environment apply when either is absent.

```ts
import { createLSPClient } from '@orkestrel/lsp'
import { createStdioTransport } from '@orkestrel/lsp/server'

const transport = createStdioTransport({
	server: { command: ['my-language-server', '--stdio'], directory: '/workspace' },
	grace: 5_000,
})
const client = createLSPClient({ transport, workspace: 'file:///workspace' })
await client.start()
await client.destroy()
```

`grace` bounds the cooperative termination window in milliseconds, and `5000` applies when it is
absent. `close()` ends the child's input stream, waits `grace` for the child's own exit, and hands a
child that outlives that window to the process package's `stopChild` helper, which signals it, waits
`grace` again, and escalates to an unconditional kill. The child stays in the parent's process group
rather than leading its own, so that helper reaches it through a direct signal after the host reports
that no group owns its identifier. `close()` then waits up to `grace` more for the child's streams to
close, and emits `exit` carrying the code and signal the host reported, so a grandchild holding the
child's standard output open past its exit delays neither the call nor the event. A second `close()`
called while the first is in flight settles on that same termination rather than resolving early.
When the helper cannot confirm the child stopped, `close()` rejects with an `LSPError` whose `code`
property is `timeout`, and the transport keeps the still-live child.

Each accepted `start()` call opens a generation that owns its child, and only the current generation
reaches the emitter. `start()` spawns the configured child and resolves after the host reports it
spawned. The transport reconnects: after `close()` resolves, or after the child exits on its own and
the transport emits `exit`, a further `start()` call spawns a fresh child, and the retired generation
delivers neither a later `exit` nor a later chunk. A `start()` call made while the previous child
still owns the current generation is refused with an `LSPError` whose `code` property is `duplicate`,
which covers a live child, a child that ended on its own while a grandchild holding its standard
output defers the host's `close`, and a `close()` still in flight. Leave that window through
`close()`, whose wait for the child's stdio is bounded by `grace`, or by waiting for the `exit`
event. An empty command, a host that refuses the spawn, and a child that reports a spawn fault
each reject `start()` with one coded `spawn`. `send()` writes bytes to the child's standard input and
reports whether it accepted them, resolving `false` before the first `start()`, after `close()`
resolves, and after the child exits.

## Framing state

Use `parseLSPMessages()` with the preceding `LSPDecodeState` value to decode split or coalesced
frames. Retained byte segments are owned copies, so caller mutation after parsing cannot alter a
later continuation. The parser accepts unknown header fields and refuses malformed parameters in a
known `Content-Type` field. Use `encodeLSPMessage()` to produce a byte-accurate frame.

## Conformance

This package tracks Language Server Protocol 3.18. The mirror at `tests/mirrors/metaModel.json`
holds the protocol's metaModel instance as fetched bytes, refreshed by running
`scripts/metamodel.sh`. The conformance proof covers the subset of the protocol this package
speaks, and the diagnostic surface is the string-message form matching the client's advertised
capability.

## Methods

### `LSPClientInterface`

The client interface exposes these behavioral methods:

| Method    | Signature                                                                | Behavior                                                                                 |
| --------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| `start`   | `start(): Promise<void>`                                                 | Starts or restarts a transport generation and completes its initialize handshake.        |
| `open`    | `open(document: LSPTextDocumentItem): Promise<readonly LSPDiagnostic[]>` | Opens a document and resolves its pull or push diagnostics.                              |
| `close`   | `close(uri: LSPDocumentURI): Promise<void>`                              | Notifies the peer that an owned document closed.                                         |
| `destroy` | `destroy(): Promise<void>`                                               | Drains work, performs bounded protocol and transport teardown, and destroys the emitter. |

### `LSPTransportInterface`

The transport interface exposes these behavioral methods:

| Method  | Signature                                   | Behavior                                                     |
| ------- | ------------------------------------------- | ------------------------------------------------------------ |
| `start` | `start(): Promise<void>`                    | Starts or restarts the byte transport.                       |
| `send`  | `send(bytes: Uint8Array): Promise<boolean>` | Sends bytes and reports whether the transport accepted them. |
| `close` | `close(): Promise<void>`                    | Closes the active transport generation.                      |

## Surface

The server surface provides these exports:

| Export                  | Purpose                                                                   |
| ----------------------- | ------------------------------------------------------------------------- |
| `StdioTransport`        | Implements the byte transport over a language server child process.       |
| `createStdioTransport`  | Creates an `LSPTransportInterface` from `StdioTransportOptions`.          |
| `StdioTransportOptions` | Configures the child's command, directory, environment, and grace window. |

The client surface provides these entities and configuration contracts:

| Export                  | Purpose                                                                                           |
| ----------------------- | ------------------------------------------------------------------------------------------------- |
| `LSPClient`             | Implements the document-oriented client.                                                          |
| `createLSPClient`       | Creates an `LSPClientInterface` from `LSPClientOptions`.                                          |
| `LSPClientInterface`    | Defines the readonly `emitter`, `capabilities`, and `encoding` properties and the client methods. |
| `LSPClientOptions`      | Configures transport, workspace, deadline, abort signal, and event hooks.                         |
| `LSPClientEventMap`     | Maps client notifications, exits, and errors to listener arguments.                               |
| `LSPClientLifecycle`    | Describes lifecycle ownership and transport generations.                                          |
| `LSPClientCapabilities` | Describes the capabilities advertised during initialization.                                      |
| `LSPTransportInterface` | Defines the readonly `emitter` property and the byte transport methods.                           |
| `LSPTransportEventMap`  | Maps byte chunks, exits, and errors to transport listeners.                                       |

The framing and error surface provides these exports:

| Export             | Purpose                                                       |
| ------------------ | ------------------------------------------------------------- |
| `encodeLSPMessage` | Encodes a JSON-RPC message into an LSP frame.                 |
| `parseLSPMessages` | Decodes complete messages and returns retained framing state. |
| `LSPDecodeState`   | Describes retained incremental framing bytes.                 |
| `LSPError`         | Reports a package failure with a stable code.                 |
| `isLSPError`       | Checks for a branded package error.                           |
| `LSPErrorCode`     | Lists stable package error codes.                             |
| `LSPErrorContext`  | Describes structured error details.                           |
| `LSPErrorOptions`  | Configures a package error.                                   |

The JSON-RPC and initialization surface provides these payload types:

| Export                  | Purpose                                       |
| ----------------------- | --------------------------------------------- |
| `JSONRPCId`             | Identifies a request and response pair.       |
| `JSONRPCRequest`        | Describes a request message.                  |
| `JSONRPCNotification`   | Describes a notification message.             |
| `JSONRPCError`          | Describes an error payload.                   |
| `JSONRPCResultResponse` | Describes a successful response.              |
| `JSONRPCErrorResponse`  | Describes a failed response.                  |
| `JSONRPCResponse`       | Describes either response outcome.            |
| `JSONRPCMessage`        | Describes any supported wire message.         |
| `LSPIdentity`           | Describes a protocol peer.                    |
| `LSPInitializeParams`   | Describes the client initialize payload.      |
| `LSPInitializeResult`   | Describes a successful initialize result.     |
| `LSPServerCapabilities` | Describes server capabilities and extensions. |
| `LSPExit`               | Describes how a transport process ended.      |

The document and diagnostic surface provides these payload types:

| Export                        | Purpose                                          |
| ----------------------------- | ------------------------------------------------ |
| `LSPDocumentURI`              | Identifies a document.                           |
| `LSPPosition`                 | Describes a zero-based document position.        |
| `LSPRange`                    | Describes a half-open document span.             |
| `LSPLocation`                 | Pairs a document URI with a range.               |
| `LSPTextDocumentIdentifier`   | Identifies a text document payload.              |
| `LSPTextDocumentItem`         | Describes an opened document and its text.       |
| `LSPDiagnosticSeverity`       | Identifies a diagnostic severity.                |
| `LSPDiagnosticTag`            | Identifies a diagnostic tag.                     |
| `LSPCodeDescription`          | Links a diagnostic code to its description.      |
| `LSPDiagnosticRelated`        | Describes related diagnostic information.        |
| `LSPDiagnostic`               | Describes a diagnostic.                          |
| `LSPPublishDiagnosticsParams` | Describes pushed diagnostics.                    |
| `LSPDocumentDiagnosticParams` | Describes a pull-diagnostic request.             |
| `LSPDocumentDiagnosticReport` | Describes a full or unchanged diagnostic report. |
| `LSPPositionEncoding`         | Identifies a negotiated position encoding.       |
| `LSPTextDocumentSyncKind`     | Identifies a text synchronization mode.          |
| `LSPTextDocumentSyncOptions`  | Describes expanded synchronization options.      |
| `LSPTextDocumentSync`         | Describes compact or expanded synchronization.   |
| `LSPDiagnosticOptions`        | Describes a server diagnostic provider.          |

The validation surface provides these guards:

| Export                          | Purpose                                  |
| ------------------------------- | ---------------------------------------- |
| `isJSONRPCError`                | Checks an error payload.                 |
| `isJSONRPCRequest`              | Checks a request message.                |
| `isJSONRPCNotification`         | Checks a notification message.           |
| `isJSONRPCResponse`             | Checks a response message.               |
| `isLSPPosition`                 | Checks a document position.              |
| `isLSPRange`                    | Checks a document range.                 |
| `isLSPLocation`                 | Checks a location.                       |
| `isLSPCodeDescription`          | Checks a diagnostic code description.    |
| `isLSPDiagnosticRelated`        | Checks related diagnostic information.   |
| `isLSPDiagnostic`               | Checks a diagnostic.                     |
| `isLSPPublishDiagnosticsParams` | Checks pushed diagnostic parameters.     |
| `isLSPDocumentDiagnosticReport` | Checks a diagnostic report.              |
| `isLSPIdentity`                 | Checks a peer identity.                  |
| `isLSPTextDocumentSyncOptions`  | Checks expanded synchronization options. |
| `isLSPDiagnosticOptions`        | Checks diagnostic provider options.      |
| `isLSPServerCapabilities`       | Checks server capabilities.              |
| `isLSPInitializeResult`         | Checks an initialize result.             |

The constant surface provides these protocol names and limits:

| Export                     | Purpose                                                       |
| -------------------------- | ------------------------------------------------------------- |
| `LSP_METHODS`              | Names the protocol methods that the client sends or consumes. |
| `LSP_ENCODINGS`            | Lists protocol position encodings.                            |
| `JSONRPC_PARSE_ERROR`      | Identifies a malformed JSON payload.                          |
| `JSONRPC_INVALID_REQUEST`  | Identifies a structurally invalid request.                    |
| `JSONRPC_METHOD_NOT_FOUND` | Identifies an unsupported method.                             |
| `JSONRPC_INVALID_PARAMS`   | Identifies invalid method parameters.                         |
| `JSONRPC_INTERNAL_ERROR`   | Identifies a receiver failure.                                |
| `LSP_REQUEST_CANCELLED`    | Identifies a client-cancelled request.                        |
| `LSP_CONTENT_MODIFIED`     | Identifies a request invalidated by content changes.          |
| `LSP_SERVER_CANCELLED`     | Identifies a server-cancelled request.                        |
| `LSP_REQUEST_FAILED`       | Identifies a request that could not complete.                 |
| `LSP_CONTENT_LIMIT`        | Bounds an accepted content body.                              |
| `LSP_HEADER_LIMIT`         | Bounds an accepted framing header.                            |
