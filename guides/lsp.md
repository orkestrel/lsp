# Language Server Protocol client

The core package provides host-independent Language Server Protocol framing, validation, and a
document-oriented client over an injected byte transport.

## Client lifecycle

Create an `LSPClient` with an `LSPTransportInterface`, call `start()` before document operations,
and call `destroy()` when the session ends. Concurrent `start()` calls share one handshake. A
failed handshake or peer exit closes that transport generation, and a later `start()` call begins
a fresh generation.

The client accepts `open()` and `close()` only during a ready generation. A dead generation refuses
wire writes with an `LSPError` whose `code` property is `closed`. During teardown, the client sends
`shutdown`, then permits only `exit` on that generation.

## Transport seam

An `LSPTransportInterface` implementation emits byte chunks, exits, and transport errors through
its emitter. Its methods have these obligations:

- `send()` and `close()` reject instead of throwing.
- After `close()` resolves, `send()` resolves `false`.
- The client can call `start()` again only after `close()` resolves or the transport emits `exit`.
- A transport that cannot reconnect rejects that later `start()` call.

The client also defends against a foreign transport that throws synchronously. It converts a send
fault into a coded `LSPError`, bounds exit and close settlement, and removes transport listeners
during teardown.

## Framing state

Use `parseLSPMessages()` with the preceding `LSPDecodeState` value to decode split or coalesced
frames. Retained byte segments are owned copies, so caller mutation after parsing cannot alter a
later continuation. The parser accepts unknown header fields and refuses malformed parameters in a
known `Content-Type` field.
