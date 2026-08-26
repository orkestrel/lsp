# Objective ruling

## Entity and member names

**Position.** Put `listen` directly on `MCPClientInterface`. Do not add a `subscriptions` sub-entity.

```ts
interface MCPListenOptions {
	readonly signal?: AbortSignal
}

interface MCPSubscriptionInterface
	extends AsyncGenerator<JSONRPCNotification, MCPSubscriptionResult, unknown> {
	[Symbol.asyncDispose](): Promise<void>
}

interface MCPClientInterface {
	listen(
		notifications?: MCPSubscriptionFilter,
		options?: MCPListenOptions,
	): MCPSubscriptionInterface
}
```

`listen` matches the public server term and the wire suffix. `subscribe` would introduce a synonym for the existing `subscription.listen` vocabulary. The `tasks` precedent does not justify a manager here: `tasks` groups `task`, `update`, and `abort` ([src/core/types.ts:2421](/home/user/mcp/src/core/types.ts:2421)); subscription adds only `listen`. A single-method manager would be grouping without behavior.

**Risk.** Adding `client.subscriptions.listen` now creates a permanent wrapper whose only current work is forwarding to the client’s correlation engine.

## Stream contract

**Position.** Yield every owned, subscription-bound `JSONRPCNotification`, including the initial `notifications/subscriptions/acknowledged` frame. Return the validated `MCPSubscriptionResult` from the generator on graceful closure. A JSON-RPC error or connection loss rejects iteration.

The server already defines this sequence: acknowledgement, matching stamped notifications, then the complete result ([src/core/MCPServer.ts:1331](/home/user/mcp/src/core/MCPServer.ts:1331), [src/core/MCPServer.ts:1364](/home/user/mcp/src/core/MCPServer.ts:1364)). Every delivered notification and the terminator carry the request id through `MCP_META_SUBSCRIPTION` ([src/core/helpers.ts:932](/home/user/mcp/src/core/helpers.ts:932), [src/core/helpers.ts:978](/home/user/mcp/src/core/helpers.ts:978)). `parseJSONRPCMessage` already returns an owned frozen snapshot ([src/core/parsers.ts:80](/home/user/mcp/src/core/parsers.ts:80)).

Use a capacity-`1` handoff. Delivery of the retained frame returns a promise that settles only when `next()` consumes it. At capacity, the transport awaits that promise and reads no later frame. A reentrant delivery by a non-conforming transport fails the subscription; it never adds another queue entry.

The current path cannot provide this guarantee:

- Transport message listeners return `void`, and emission is synchronous ([node_modules/@orkestrel/emitter/dist/src/core/index.d.ts:92](/home/user/mcp/node_modules/@orkestrel/emitter/dist/src/core/index.d.ts:92), [node_modules/@orkestrel/emitter/dist/src/core/index.d.ts:112](/home/user/mcp/node_modules/@orkestrel/emitter/dist/src/core/index.d.ts:112)).
- `MCPClient.#receive` is synchronous ([src/core/MCPClient.ts:501](/home/user/mcp/src/core/MCPClient.ts:501)).
- The HTTP decoders accumulate every SSE message before returning ([src/server/helpers.ts:267](/home/user/mcp/src/server/helpers.ts:267), [src/browser/helpers.ts:72](/home/user/mcp/src/browser/helpers.ts:72)).
- `send` accepts no request signal or awaited delivery handler ([src/core/types.ts:2163](/home/user/mcp/src/core/types.ts:2163)).

Extend `send` with a per-request options bag containing `signal` and an awaited `receive` handler. When `receive` is supplied, the transport must route that exchange through it and must not also emit the same frame. The HTTP decoder must invoke and await it incrementally.

Do not expose `MCPStream` as the client type. Its terminal is the whole `JSONRPCResponse`, while the client owes callers the decoded `MCPSubscriptionResult` ([src/core/types.ts:1425](/home/user/mcp/src/core/types.ts:1425)). Generalize the cancellation mechanics of `MCPStreamController`; its implementation is otherwise independent of JSON-RPC semantics ([src/core/MCPStreamController.ts:84](/home/user/mcp/src/core/MCPStreamController.ts:84), [src/core/MCPStreamController.ts:143](/home/user/mcp/src/core/MCPStreamController.ts:143)). Keep `MCPStream` itself server-side.

**Risk.** A bounded queue that aborts on overflow prevents unbounded memory but is not the ruled backpressure contract. The awaited transport ingress is load-bearing.

## Closure

**Position.** Put `signal` on `MCPListenOptions`. Do not apply `MCPClientOptions.timeout`; a subscription is long-lived and closes through abort, disposal, peer completion, or connection failure.

An already-aborted signal returns a stream whose first read rejects without sending. A later abort:

- rejects any parked read with the signal reason;
- releases the retained frame and active-id registration;
- sends `notifications/cancelled` on a duplex carrier, preserving the existing cancellation rule ([src/core/MCPClient.ts:876](/home/user/mcp/src/core/MCPClient.ts:876));
- passes the request signal into HTTP `fetch`, which cancels the response body and reaches the server’s request signal ([src/server/transports/HTTPClientTransport.ts:120](/home/user/mcp/src/server/transports/HTTPClientTransport.ts:120), [src/server/handlers.ts:128](/home/user/mcp/src/server/handlers.ts:128));
- emits no graceful terminal because the server already distinguishes abort from completion ([src/core/MCPServer.ts:1365](/home/user/mcp/src/core/MCPServer.ts:1365)).

`return()`, `throw()`, and `[Symbol.asyncDispose]()` must raise the same internal abort. Disposal must release before it may reject, matching the existing controller obligation ([src/core/types.ts:1523](/home/user/mcp/src/core/types.ts:1523)).

A consumer that drops the stream without abort, iterator return, or disposal remains its owner. The capacity-`1` handoff parks delivery and retains no further frames, but the request and server slot remain live. Do not add a timer, finalizer, or polling cleanup.

**Risk.** Reusing the ordinary request deadline would silently terminate healthy subscriptions at `DEFAULT_MCP_REQUEST_TIMEOUT`.

## Filter surface

**Position.** Reuse `MCPSubscriptionFilter` unchanged. Accept it as the optional `notifications` argument. Absence and `{}` mean the same request: send `params.notifications: {}`.

The server requires the `notifications` member ([src/core/MCPServer.ts:1292](/home/user/mcp/src/core/MCPServer.ts:1292)), while the filter guard explicitly accepts an empty object and leaves every recognized field optional ([src/core/validators.ts:1250](/home/user/mcp/src/core/validators.ts:1250)). The client must therefore default the argument, not omit the wire member.

Do not add a client-specific filter alias or reject an empty filter. The peer acknowledges the honoured subset.

**Risk.** Omitting `params.notifications` turns valid client absence into server error `-32602`.

## Interception boundary

**Position.** Keep active subscriptions keyed by the listen request id. Make `#receive` able to return an awaited settlement for subscription traffic.

Routing order:

- A stamped notification naming an active subscription goes only to that subscription’s handoff.
- The acknowledgement is handled identically; its method does not need a special branch.
- A terminal response whose response id and result metadata match the active id completes that stream after validation.
- A JSON-RPC error for the active id rejects the stream with `MCPError`.
- An unstamped notification retains the existing progress interception and `notification` event behavior ([src/core/MCPClient.ts:593](/home/user/mcp/src/core/MCPClient.ts:593)).
- A stamped frame naming no active subscription is late correlated stream traffic and is discarded, like a late response. Do not publish it as an unrelated global notification.
- `disconnect()` and an unexpected transport `close` reject every active subscription. The constructor currently subscribes only to `message`, so transport-loss handling must be added ([src/core/MCPClient.ts:225](/home/user/mcp/src/core/MCPClient.ts:225)).

When the consumer abandons the stream without closing it, the active registration remains and the retained delivery stays parked. No later subscription frame enters an application queue.

**Risk.** Routing by method instead of the reserved id mixes concurrent subscriptions. Routing claimed frames to the global emitter duplicates delivery and breaks filter isolation.

## Unit decomposition

| Unit | Owned files | Red-first obligation | Acceptance criteria |
|---|---|---|---|
| Subscription contract and controller reuse | `src/core/types.ts`, `src/core/MCPStreamController.ts`, `tests/src/core/MCPStreamController.test.ts` | Add type pins for `listen`, `MCPListenOptions`, the yielded notification, graceful return, and async disposal; record `npm run test:src:core -- tests/src/core/MCPStreamController.test.ts` red before implementation. | Existing server controller behavior remains unchanged under default type parameters. The subscription instantiation returns `MCPSubscriptionResult`, abort settles a parked read promptly, and disposal releases before rejection. |
| Client subscription engine | `src/core/MCPClient.ts`, a new internal `src/core/MCPSubscription.ts` if the handoff needs its own class, `tests/setup.ts`, `tests/src/core/MCPClient.test.ts` | Drive `client.listen` against a real in-process `MCPServer`; the present loopback is an invalid fixture because it discards held-open answers ([tests/setup.ts:919](/home/user/mcp/tests/setup.ts:919)). Record the client test command red. | The request uses `subscriptions/listen`; absent filter sends `{}`; acknowledgement and events remain ordered and owned; graceful closure returns the exact validated result; peer error, malformed terminal, disconnect, and connection loss reject; active subscriptions remain isolated; non-subscription notifications still reach `client.emitter`; late stamped frames are dropped. |
| Core transport delivery contract | `src/core/types.ts`, `src/core/factories.ts`, `src/core/MCPLegacyClientTransport.ts`, matching core tests | Add a proof that a supplied `receive` handler blocks the next delivery and that `signal` ends only its request. | `send(message, options?)` awaits `receive`; the same frame is not emitted again; unsupported carriers reject explicitly instead of falling back to an unbounded emitter queue. |
| Server HTTP incremental path | `src/server/helpers.ts`, `src/server/transports/HTTPClientTransport.ts`, `tests/src/server/helpers.test.ts`, `tests/src/server/transports/HTTPClientTransport.test.ts` | Feed an SSE response whose later event is observable only after the earlier delivery promise settles; record the scoped server test command red. | The decoder no longer accumulates the response; it awaits delivery per event. Aborting the listen signal cancels that fetch, leaves sibling requests alive, and reaches the real server request signal. Mid-stream body failure rejects the subscription. |
| Browser HTTP parity | `src/browser/helpers.ts`, `src/browser/transports/HTTPClientTransport.ts`, matching browser tests | Mirror the incremental and abort proof in Chromium; record the scoped browser command red. | Browser and server HTTP faces apply the same delivery, cancellation, ownership, and malformed-event rules. |
| Duplex carrier boundary | WebSocket, stdio, `MessagePort`, and binder implementations that claim subscription delivery | Add a saturation proof before enabling `listen` on each carrier. | A carrier either awaits subscription delivery without an unbounded package queue or rejects the operation explicitly. No carrier silently claims backpressure through the synchronous emitter. |
| Guide and parity | `guides/mcp.md`, `tests/guides.test.ts` | Update the executable client example and method table, then record `npm run test:guides` red before parity repair. | Document `listen`, filter defaulting, acknowledgement delivery, terminal access, abort, disposal, and the abandonment obligation. Delete the held-open Streamable HTTP gap at [guides/mcp.md:3812](/home/user/mcp/guides/mcp.md:3812). Delete the per-request HTTP abort gap at [guides/mcp.md:3824](/home/user/mcp/guides/mcp.md:3824) only after the signal-to-fetch-to-server proof passes. |

## Unverified fact

I did not verify that native browser WebSocket or `MessagePort` APIs can propagate consumer demand without host-side buffering. The current package implementations are synchronous push paths ([src/browser/transports/WebSocketClientTransport.ts:198](/home/user/mcp/src/browser/transports/WebSocketClientTransport.ts:198), [src/browser/transports/MessagePortTransport.ts:111](/home/user/mcp/src/browser/transports/MessagePortTransport.ts:111)). Do not claim cross-carrier backpressure until each carrier has an executed saturation proof.