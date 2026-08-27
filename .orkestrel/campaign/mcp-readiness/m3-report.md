# M3 report — a `send` on a closed WebSocket rejects

**Status: complete, with one deviation.** Both faces reject, the queue is preserved and proven,
and the pump's disconnect tolerance is pinned. One test outside the owned files reddens by
design — the deviation contract's second trigger. Its exact patch is in this report; I did not
edit it.

## Deviation

### One off-limits test reddens (contract trigger: "a test outside the owned files reddens")

`tests/src/browser/factories.test.ts:150` pins the behaviour this unit reverses.

- **Expected**: the owned files carry the whole change.
- **Found**: `A3: send() after close() silently drops the message — no throw, no delivery`
  asserts `.resolves.toBeUndefined()` on exactly the call that must now reject.
- **Evidence**: `npm run test:src:browser` → `Tests 1 failed | 60 passed (61)`, failing with
  `AssertionError: promise rejected "Error: WebSocket transport is not connect…" instead of
  resolving`.
- **Done / not done**: every owned task is done. This file is untouched.

Exact replacement for that test:

```ts
	it('A3: send() after close() rejects the message — no delivery, and no silent resolve', async () => {
		// Pin the post-close semantics: a message sent after close() rejects, and is neither
		// queued nor delivered. This test uses a live server so any wrongly-queued message
		// would surface on reconnect.
		const transport = createWebSocketClientTransport({
			url: `${serverURL}/mcp`,
		})
		const received: unknown[] = []
		transport.emitter.on('message', (message) => received.push(message))

		await transport.start()
		await transport.close()

		// Send after close — the caller learns the write failed rather than being told it landed.
		await expect(
			transport.send(createJSONRPCRequest({ method: 'ping', id: 99 })),
		).rejects.toThrow('WebSocket transport is not connected')
		await waitForDelay(50)

		expect(received).toEqual([])
	})
```

### The brief named `MCPError`; I used a plain `Error`, matching the package taxonomy

Recorded as an ancillary decision rather than a stop, because the objective is the rejection and
the class is the means. Three sources agree against `MCPError`, and each is off-limits to me:

- `src/core/errors.ts:6-8` (the `MCPError` TSDoc): "Local lifecycle and transport conditions such
  as disconnects and request timeouts remain plain `Error`s."
- `guides/mcp.md:4742`: "local disconnect and timeout failures remain plain `Error`s."
- Every sibling transport rejects this exact condition with a plain `Error`:
  `StdioClientTransport.ts:174`, `StdioServerTransport.ts:117`, and the Node
  `WebSocketClientTransport.ts:125` — the last of which the brief itself names as the model to
  match in outcome.

`MCPError` also requires a numeric JSON-RPC code as a constructor argument, so adopting it would
mint a wire code for a purely local condition, and `isMCPError` would then answer `true` for a
disconnect the guide says it answers `false` for.

I used the sibling's exact words, `WebSocket transport is not connected`, on both faces. That is
also the wording the guide's own contract clause already fixes for this condition on the Node
face (`guides/mcp.md:4861`). Flip it in one line if you rule the other way.

## Task 1 — both faces reject a closed-channel send

`src/browser/transports/WebSocketClientTransport.ts` — `send` rejects when the transport is
closed, or when the socket it holds reports `CLOSING` / `CLOSED`. No socket yet, or `CONNECTING`,
still queues, and `#flush` still writes the queue in order.

`src/server/transports/WebSocketServerTransport.ts` — `send` rejects when the transport is
closed, or when the wrapper's `readyState` is not `WEBSOCKET_READY_OPEN` (imported from
`@orkestrel/websocket`).

No type change was needed: `MCPClientTransportInterface.send` already declares
`Promise<void>` and `src/core/types.ts:2339` already requires a failing `send` to reject. Both
methods are `async`, so the throw is a rejection by construction, which is what that clause names
as the satisfying shape.

The socket's own state is a second source rather than a copy of the transport's flag, and both
arms are measured, not assumed:

- **Browser, real Chromium**: after `socket.close()`, `readyState === 2` with the `close` event
  not yet fired. A server-initiated close therefore leaves the transport's flag clear while the
  socket already knows.
- **Server, real `NodeWebSocket` over a `duplexPair`**: a socket destroyed before `start()` armed
  the close subscription reports `readyState 3` with the transport's flag clear, and its `send`
  resolved under the old code. That case is now test `rejects a send on a socket that ended
  before start armed the subscriptions`.

## Task 2 — what the pump does with a rejected write

**No source change was needed, so I touched no wiring file.** `src/server/factories.ts` is
unmodified.

What I read:

- `bindServer` (`src/core/helpers.ts:1428-1447`) wraps `await transport.send(answer)` in
  `try`/`catch` and routes the caught value to `server.emitter.emit('error', error)`, itself
  guarded against a throwing listener. `src/core/helpers.ts:1350` states the property directly:
  "Both are TOTAL: a `send` throw or rejection is caught and never escapes as an unhandled
  rejection." `sendStream` (`:1330-1344`) propagates a rejection to that same catch after
  disposing the controller.
- The finding worth recording: **in the WebSocket wiring the rejection is not the path a
  disconnect takes.** The transport's `close` → `bridgeMessageTransport`'s close listener →
  `bindServer`'s `closed` handler aborts every live request, and the binder checks
  `request.signal.aborted` before writing. So a peer that disconnects mid-request is answered by
  no write at all, and the binder reports nothing because a cancellation is not a fault. The
  rejection tolerance is the second line of defence behind that, not the first.

Pinned in `tests/src/server/transports/WebSocketServerTransport.test.ts`:

- `writes no response, reports no fault, and raises no unhandled rejection` — a real
  `createCalculatorServer` over `bindServer(mcp, bridgeMessageTransport(transport))` over a real
  `NodeWebSocket`. The peer's request and close frame ride in one `client.write`, so the wrapper
  decodes both in a single `data` event and the disconnect lands while the dispatch is suspended.
  Asserts no frame written, no `mcp.emitter` `error`, and — through a real
  `process.on('unhandledRejection')` recorder installed for the test's duration — nothing escaped.
- `answers the same request when the peer stays, so the empty reading is the disconnect` — the
  control. Identical wiring and request, minus the close frame, answering one frame. Without it an
  empty frame log would prove the harness rather than the disconnect.
- `carries the rejection across the core message-transport port` — `bridgeMessageTransport`'s
  `send` rejects too, so a rejection cannot stop at the bridge and leave the pump believing every
  write landed.

Both pump tests pass before and after the change. They are characterization tests of behaviour
task 2 asked me to read and pin, not regression proofs of a defect — stated plainly because a
test that never ran red does not bind to a defect.

## Task 3 — failing-first records

Command, then count before the fix, then the same command after.

`npx vitest run --config vite.config.ts --no-cache --reporter=verbose --project src:server tests/src/server/transports/WebSocketServerTransport.test.ts`

- Before: `Tests 4 failed | 13 passed (17)`, each failing `promise resolved "undefined" instead of rejecting`.
- After: `Tests 18 passed (18)`.
- Failing-first names: `rejects a send issued after close rather than reporting a write nobody made`;
  `rejects a send issued after the peer closed the socket, and writes no frame`;
  `rejects a send on a socket that ended before start armed the subscriptions`;
  `carries the rejection across the core message-transport port`.

`npx vitest run --config vite.config.ts --no-cache --reporter=verbose --project src:browser tests/src/browser/transports/WebSocketClientTransport.test.ts`

- Before: `Tests 3 failed | 5 passed (8)`.
- After: `Tests 7 passed (7)`.
- Failing-first names: `rejects a send issued after close rather than reporting a write nobody made`;
  `rejects a send issued after the server closed the socket`;
  `settles the caller pending call on the closed channel instead of leaving it to time out`.

**The caller-visible symptom, asserted.** The last of those drives a real `createMCPClient` over
the transport with `timeout: 200`. Before the fix it failed with
`MCP request 'tools/call' timed out after 200ms` — the pending-call symptom exactly: the client
registered the request, the transport reported a write it never made, and the caller waited out
its deadline. After the fix the same call rejects with `WebSocket transport is not connected`,
and the test's own duration fell from 213 ms to 12 ms. The transport-level equivalent is asserted
beside it on both faces: the rejection together with an empty received log or an unchanged frame
count, so the resolve is shown to have been a lie rather than merely a different return value.

`still queues a send issued before open and flushes it in order once the socket opens` proves the
queue survives, in the owned file, independent of the off-limits copy.

## Task 4 — guide

Rows changed in `guides/mcp.md`, all within the WebSocket sections:

- `### WebSocket transport` — added **A closed channel rejects, and the pump survives the
  rejection**, stating the server carrier's rejection and both halves of what `bindServer` does
  with it.
- Browser face prose — added **The browser face queues a pre-open `send` and rejects a closed
  one**, which separates the two states the face answers differently.
- Browser `#### Entities` row for `WebSocketClientTransport` — now says a closed-channel send
  rejects.
- Contract clause 16 (`WebSocketServerTransport`) — added the rejection and the mid-request abort.
- Contract clause 21 (browser transport) — added the rejection beside the queue behaviour.

**Non-normative sentence: it was absent from both sections, and I added it.** No form of it
existed anywhere in the guide (searched for `non-normative`, `spec defines`, `outside the spec`,
and related wordings; the only nearby text was the conformance narrative at `:4152` bounding what
the foreign runner measured). Both WebSocket sections now say the specification defines stdio and
Streamable HTTP and that WebSocket is the custom transport this package adds.

**One drift corrected while reading for task 2.** Contract clause 16 said a `dispatch` / `send`
fault "surfaces on the transport's `error` event". It surfaces on `mcp.emitter`'s `error` event —
`src/server/factories.ts:183` and `src/core/helpers.ts:1443` both say so. Corrected in place; it
sits in a named WebSocket row.

## Touched files

| File | Change |
| --- | --- |
| `src/browser/transports/WebSocketClientTransport.ts` | `send` rejects a closed channel; queue arm unchanged; class TSDoc states both |
| `src/server/transports/WebSocketServerTransport.ts` | `send` rejects a closed channel from its own flag and the socket's `readyState`; class TSDoc states it and the pump's tolerance |
| `tests/src/browser/transports/WebSocketClientTransport.test.ts` | New `a send the channel cannot carry rejects` block: rejection after close, rejection after a server close, queue-until-open, and the caller pending-call symptom |
| `tests/src/server/transports/WebSocketServerTransport.test.ts` | New rejection block plus the bound-pump disconnect block and its control |
| `guides/mcp.md` | WebSocket rows: closed-send rejection on both faces, the non-normative sentence, the pump's disconnect behaviour, and the corrected fault-event owner |

```text
 guides/mcp.md                                      |  43 +++++-
 src/browser/transports/WebSocketClientTransport.ts |  27 +++-
 src/server/transports/WebSocketServerTransport.ts  |  20 ++-
 .../transports/WebSocketClientTransport.test.ts    |  67 ++++++++-
 .../transports/WebSocketServerTransport.test.ts    | 150 ++++++++++++++++++++-
 5 files changed, 290 insertions(+), 17 deletions(-)
```

`git status --porcelain` lists those five files and nothing else. Nothing committed.

## Scoped validation

| Command | Result |
| --- | --- |
| `npm run check` | Pass (root, core, browser, server projects) |
| `npx oxlint --config .oxlintrc.json --deny-warnings <4 owned code files>` | Exit 0 |
| `npx oxfmt --config .oxfmtrc.json --check <4 owned code files> guides/mcp.md` | All matched files use the correct format |
| `npm run test:src:server` | `Test Files 12 passed (12)`, `Tests 341 passed (341)` |
| `npm run test:src:browser` | `Tests 1 failed \| 60 passed (61)` — the one off-limits test above |
| `npm run test:integration` | `Tests 4 passed (4)` |
| `npm run test:guides` | `Tests 149 passed (149)` |
| `npm run test:policy` | `Tests 93 passed (93)` |

I ran no tree-wide mutating command. `oxfmt --write` was scoped to the three owned files it
reported, and `guides/mcp.md` was formatter-clean at `HEAD` before my edit, so the reformatting is
mine alone; the guide diff is confined to the WebSocket rows.

## Instruments

Three probes under `tmp/probe/` settled the reachability questions before I wrote either guard
(the `NodeWebSocket` readyState transitions, the kill semantics of `destroy` / peer `destroy` /
peer `end`, and the unstarted-socket case). Each carried a control assertion. All three are
deleted; the pre-existing `tmp/probe/stdioHandle.test.ts` is untouched. The browser-side
`readyState` measurement ran as a temporary case inside the owned test file and was removed once
read.

## Observation, outside this unit's scope

Neither face can reject when the peer's socket dies in a way the host does not report. Measured:
destroying the far end of the `duplexPair` leaves `NodeWebSocket.readyState` at `1` and fires no
`close`, so `send` resolves on a frame that reaches nobody. That is the irreducible limit of
answering from the transport's own state, and closing it needs a liveness signal (an RFC 6455
ping / pong deadline) rather than a `send` guard. Recorded against the WebSocket transport
capability for a later change; I did not widen this unit to it.
