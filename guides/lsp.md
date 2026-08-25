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

The client also defends against a foreign transport that throws synchronously. It converts a send
fault into a coded `LSPError`, bounds exit and close settlement, and removes transport listeners
during teardown. A close failure that settles before the deadline is emitted before the client
destroys its emitter. At the deadline, the client emits an `LSPError` coded `timeout` and absorbs
the later close outcome.

## Framing state

Use `parseLSPMessages()` with the preceding `LSPDecodeState` value to decode split or coalesced
frames. Retained byte segments are owned copies, so caller mutation after parsing cannot alter a
later continuation. The parser accepts unknown header fields and refuses malformed parameters in a
known `Content-Type` field. Use `encodeLSPMessage()` to produce a byte-accurate frame.

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
