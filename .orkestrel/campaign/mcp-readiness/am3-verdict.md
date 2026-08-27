## 1. CONFIRMED
Attack that failed: a `send` racing `'open'`, and a server socket that is present but `CONNECTING`.

Browser `send` has no `await` before the reject / write / queue decision (`src/browser/transports/WebSocketClientTransport.ts:123-143`). `#onOpen` → `#flush` splices and writes in the same turn (`192-198`, `187-189`). A later `send` cannot observe `CONNECTING`, then lose the race to `#flush`, then push onto an already-drained queue.

`CONNECTING` is not `CLOSING`/`CLOSED` and not `OPEN`, so it queues (`131-142`). No socket yet (`#socket` undefined) takes the same arm.

Server `send` rejects whenever `readyState !== WEBSOCKET_READY_OPEN` (`src/server/transports/WebSocketServerTransport.ts:97-99`), so `CONNECTING` rejects rather than writing or queueing. That is the matrix the claim names, not a miss.

## 2. CONFIRMED
Attack that failed: treating the browser guard as `readyState !== OPEN` (that would reject `CONNECTING` and destroy the queue).

Browser compares to the named WHATWG statics `WebSocket.CLOSING` and `WebSocket.CLOSED`, and writes only on `WebSocket.OPEN` (`WebSocketClientTransport.ts:132-141`). Server compares to the wrapper’s own `WEBSOCKET_READY_OPEN` import (`WebSocketServerTransport.ts:10, 97`). `guides/websocket.md:68-71` declares those states as `0` / `1` / `2` / `3`, matching WHATWG. `!== OPEN` on the server face is the correct reading of “not open”; the browser face must not use that comparison.

This worktree has no `node_modules/@orkestrel/websocket`; the substrate used is this package’s websocket guide plus the import from `'@orkestrel/websocket'`.

## 3. CONFIRMED
Attack that failed: a `sendStream` rejection escaping, stopping at the bridge, or skipping disposal.

`sendStream` has no `catch`; a rejecting `transport.send` runs `finally` disposal then rethrows (`src/core/helpers.ts:1334-1343`). `bindServer`’s `listen` `try`/`catch` is the handler that receives it (`1428-1447`). A non-aborted rejection is `server.emitter.emit('error', error)` (`1441-1443`).

Disconnect: `transport.closed` aborts every live controller (`1454-1457`); a string reply is not written when `request.signal.aborted` (`1434`). `sendStream` is not entered on that arm (`1435-1436`).

`bridgeMessageTransport.send` awaits `transport.send(decoded)` for a decoded message (`src/server/helpers.ts:489-492`); it does not swallow that rejection. (`decodeEvent` returning `undefined` still resolves — that is a non-message payload, not a closed-channel send.)

## 4. BROKEN
Failing input: `send` after `close()` that **pushes on `#queue` and then throws**.

`tests/src/browser/factories.test.ts:150-169` asserts `rejects.toThrow('WebSocket transport is not connected')` and `received === []` after `waitForDelay(50)`. It never `start()`s again. A queued ping would not appear in `received` on a closed socket. The comment at `151-153` claims a live server would surface a wrongly-queued message on reconnect; that reconnect is not in the test.

Reject and no silent resolve are pinned. No delivery of a reply within 50ms is pinned. **No queue is not.**

No other existing assertion in the diff changes product meaning: the only replaced expectation is this A3 row (`m3.diff` factories hunk); the other edited test files only add cases.

Smallest fix: after the rejection, `start()` again, wait until open, and assert id `99` never arrives.

## 5. BROKEN
Failing input: Node `WebSocketClientTransport.send` while `#socket` is still bound and the wrapper is `CLOSING` (peer close frame processed enough to leave `readyState` not open, close event not yet run).

The browser rejection paragraph says “The Node face rejects the same condition with the same words” (`guides/mcp.md:2899-2903`). Node `send` is only:

```123:127:src/server/transports/WebSocketClientTransport.ts
	async send(message: JSONRPCMessage): Promise<void> {
		const socket = this.#socket
		if (socket === undefined) throw new Error('WebSocket transport is not connected')
		socket.send(JSON.stringify(message))
```

`#socket` is cleared in `#onClose` (`250-255`), which is the wrapper `close` listener. Until that runs, Node `send` calls wrapper `send`, which is a no-op unless open (`guides/websocket.md:107`) and **resolves**. Browser rejects `CLOSING`/`CLOSED` without waiting for that event (`WebSocketClientTransport.ts:131-136`). Same words, not the same condition.

The server rejection paragraph’s “a peer that disconnects mid-request is answered by no write at all” (`guides/mcp.md:2607-2610`) is the same shape of universal: it is true when `close` fires before the write (`helpers.ts:1434, 1454-1457`); it is false for a departure that never moves `readyState` off open (the writer’s own dead-peer case).

Non-normative sentences (`2602-2604`, `2903-2904`) and clause 16’s `mcp.emitter` fault surface (`guides/mcp.md:4846-4847`; `src/server/factories.ts:183-184`, `264`; `helpers.ts:1441-1443`) hold.

Smallest fix: say the Node face rejects a send **with no bound socket** with those words; bound the no-write clause to a disconnect that fires this transport’s `close`.

## 6. CONFIRMED
Attack that failed: the landed `Error` is out of taxonomy, or the wording drifts from the Node client.

`MCPError` TSDoc keeps local disconnects as plain `Error`s (`src/core/errors.ts:6-8`). Guide clause 14 says the same (`guides/mcp.md:4764-4765`). Stdio closed-channel throws are `new Error('stdio transport is not connected')` (`StdioClientTransport.ts:174`, `StdioServerTransport.ts:117`). Node WebSocket client uses the exact string `WebSocket transport is not connected` (`WebSocketClientTransport.ts:125`). Both new faces throw that same `Error` (`browser .../WebSocketClientTransport.ts:136`, `server .../WebSocketServerTransport.ts:98`).

## 7. CONFIRMED
Attack that failed: a seventh path, or a banned `any` / `as` / `!` / mock in the commit hunks.

The commit touches `guides/mcp.md`, `src/browser/transports/WebSocketClientTransport.ts`, `src/server/transports/WebSocketServerTransport.ts`, `tests/src/browser/factories.test.ts`, `tests/src/browser/transports/WebSocketClientTransport.test.ts`, `tests/src/server/transports/WebSocketServerTransport.test.ts`. Those are the five owned files plus the A3 integration. No `any`, non-null assertion, type assertion, or mock appears in those hunks.

## 8. CONFIRMED
Attacked the two named sound-and-unchanged verdicts.

**Task 2, no wiring change.** Attack that failed: a rejecting `send` escaping `bindServer` or requiring `factories.ts` to catch. The only WebSocket ingress send path is `bindServer(mcp, bridgeMessageTransport(transport))` (`factories.ts:264`). The binder already wraps `send` / `sendStream` (`helpers.ts:1428-1436`). `sendStream` has no separate catch; the rejection is the binder’s. No second send site in `src/server/factories.ts`.

**Dead-peer observation.** Attack that failed: the wrapper already emits a close (or a passive liveness event) when the far end of a `duplexPair` is destroyed. Documented wrapper `close` is a close-frame handshake or local `destroy()` (`guides/websocket.md:109-110`). `send` is a no-op unless open and returns `void` (`107`) — unlike stdio’s `delivered === false` (`StdioClientTransport.ts:175-180`). `ping` / `pong` exist but are active (`108`, `185-187`); they do not fire because the peer vanished. Socket-fault `error` is documented to terminate (`guides/websocket.md:121`); a far-end destroy that leaves `readyState` at `1` is evidence that path did not run. Settling whether that destroy emits `error` without moving `readyState` would take a run with an `error` listener; it would not give `send` a close-state to read.

VERDICT: FAIL — 2 broken, 0 unresolved, 0 not-evidenced, 0 findings outside the claims
