**Question:** What is `@orkestrel/mcp`’s per-environment class/kind decomposition and the transport seam a sibling package would implement?

**Evidence**

**1. Per-environment classes and centralized kinds**

Core (`src/core`) — protocol engine, no host I/O:

| Class | Responsibility | Lines |
|---|---|---|
| `MCPServer` (`MCPServer.ts:146`) | Transport-agnostic JSON-RPC dispatcher over a live tool registry | 1622 |
| `MCPClient` (`MCPClient.ts:129`) | Transport-agnostic client: injects a carrier, correlates requests, wraps remote tools | 1091 |
| `MCPLegacy` (`MCPLegacy.ts:47`) | Decorates a modern dispatcher with legacy `initialize`/`ping` translation | 211 |
| `MCPLegacyClientTransport` (`MCPLegacyClientTransport.ts:52`) | Adapts a legacy peer to the modern client-transport boundary | 364 |
| `MCPMethodManager` (`MCPMethodManager.ts:26`) | Name-keyed modern method registry the server dispatches through | 36 |
| `MCPProgressReporter` (`MCPProgressReporter.ts:34`) | Request-scoped one-slot progress handoff with backpressure | 160 |
| `MCPStreamController` (`MCPStreamController.ts:46`) | Cancellation engine for one held-open modern result | 217 |
| `MCPTextStreamController` (`MCPTextStreamController.ts:43`) | String-boundary mirror of a controlled stream | 126 |
| `MCPTaskClient` (`MCPTaskClient.ts:47`) | Client half of `tasks/*` over one correlated-request door | 88 |
| `MCPError` (`errors.ts:24`) | Protocol error with numeric code and optional context | 63 |

Core centralized kinds: `types.ts`, `constants.ts`, `errors.ts`, `validators.ts`, `parsers.ts`, `inferers.ts`, `helpers.ts`, `cloners.ts`, `factories.ts`.

Server (`src/server`) — Node host face:

| Class | Responsibility | Lines |
|---|---|---|
| `HTTPClientTransport` (`transports/HTTPClientTransport.ts:77`) | Client half of Streamable HTTP over `fetch` | 234 |
| `WebSocketClientTransport` (`transports/WebSocketClientTransport.ts:74`) | Client half of WebSocket over `node:http(s)` upgrade | 270 |
| `WebSocketServerTransport` (`transports/WebSocketServerTransport.ts:43`) | Per-connection JSON-RPC bridge over an already-upgraded `NodeWebSocketInterface` | 140 |
| `StdioClientTransport` (`transports/StdioClientTransport.ts:69`) | Client half: spawn a child and speak newline JSON-RPC on stdin/stdout | 261 |
| `StdioServerTransport` (`transports/StdioServerTransport.ts:50`) | Server half: wrap caller-owned stdin/stdout as the same carrier | 170 |
| `MCPSession` (`MCPSession.ts:61`) | Per-session replay log and SSE fan-out for resumable GET | 139 |
| `HTTPDisconnect` (`transports/HTTPDisconnect.ts:42`) | One HTTP request lifetime composed with one SSE response (keepalive, abort) | 171 |

Server centralized kinds: `types.ts`, `constants.ts`, `helpers.ts`, `inferers.ts`, `handlers.ts`, `factories.ts`, `middlewares.ts`. No `validators.ts` / `parsers.ts` / `errors.ts` / `cloners.ts`.

Browser (`src/browser`) — page/worker face:

| Class | Responsibility | Lines |
|---|---|---|
| `HTTPClientTransport` (`transports/HTTPClientTransport.ts:78`) | Browser sibling of the Node HTTP client over native `fetch` | 231 |
| `WebSocketClientTransport` (`transports/WebSocketClientTransport.ts:52`) | Browser sibling over native `WebSocket` | 228 |
| `MessagePortTransport` (`transports/MessagePortTransport.ts:67`) | Symmetric string port over a native `MessagePort` | 115 |

Browser centralized kinds: `types.ts`, `constants.ts`, `helpers.ts`, `factories.ts`. No `validators` / `parsers` / `errors` / `cloners` / `inferers` / `handlers` / `middlewares`.

HTTP **server** ingress is not a class: `createMCPRoutes` (`server/factories.ts:104`) returns a POST `RouteInput`; `createMCPSession` (`server/middlewares.ts:94`) is plug-in session middleware.

---

**2. Transport seam contracts**

Two interfaces, not one.

**`MCPClientTransportInterface`** (`core/types.ts:2203`) — what `MCPClient` drives. Parsed `JSONRPCMessage` objects.

- Members: `emitter`, `session`, `duplex`, `start()`, `send(message)`, `close()` (`core/types.ts:2204-2287`)
- Events (`MCPClientTransportEventMap`, `core/types.ts:2179`): `message` (`JSONRPCMessage`), `close`, `error`
- Lifecycle: `start` opens/arms; `send` writes and must **reject, never throw synchronously** (`core/types.ts:2247-2255`); `close` settles (resolve = ended, reject = did not), is idempotent for one closed lifetime, and is not called concurrently — a timed-out waiter **joins** the in-flight close (`core/types.ts:2267-2287`)
- `duplex`: `true` if client-initiated notifications can be written (WebSocket, stdio, MessagePort); `false` for Streamable HTTP (`core/types.ts:2207-2224`)
- `session`: server-assigned id or `undefined` (`core/types.ts:2205-2206`)
- Injected via `MCPClientOptions.transport` (`core/types.ts:2375-2379`)
- Stdio client widens this with `evidence` (`StdioClientTransportInterface`, `server/types.ts:414`)

**`MCPTransportInterface`** (`core/types.ts:2142`) — string-framed duplex port for `bindServer` / `bindClient`.

- Members: `send(message: string)`, `listen(handler)`, `closed(handler)`, `close()` (`core/types.ts:2143-2150`)
- `listen` / `closed` are **replace** semantics, not additive (`core/types.ts:2128-2131`)
- Framing is the transport’s; JSON-RPC parse stays in core (`core/types.ts:2124-2127`)

Adapter: `createDuplexClientTransport` (`core/factories.ts:169`) wraps a string port as `MCPClientTransportInterface` (`start` no-op, `session` undefined, `duplex` true, `send` stringifies). Inbound `message`/`close` is `bindClient`’s job (`core/helpers.ts:1372`), not the adapter’s (`core/factories.ts:155-157`).

Option shapes live in the **environment** `types.ts`, not on the core interface:

- Server HTTP client: `{ url, headers?, fetch?, timeout? }` (`server/types.ts:296`)
- Server WS client: `{ url, headers? }` (`server/types.ts:353`)
- Server WS ingress: `{ emitter, path?, subprotocol? }` (`server/types.ts:326`)
- Stdio client: `{ command, args?, env?, delivery? }` (`server/types.ts:373`)
- Stdio server: `{ input?, output? }` (`server/types.ts:478`)
- Browser WS client: `{ url, protocols? }` — no `headers` (`browser/types.ts:49`)
- Browser HTTP client: same shape as server HTTP (`browser/types.ts:73`)
- MessagePort: `{ port }` (`browser/types.ts:90`)

Generation is **not** on the transport contract. `MCPClient` owns `#generation` / `#owner` / `#closing` (`MCPClient.ts:183-208`) so a superseded `connect` cannot close a later connection.

---

**3. How `MCPClient` composes sub-entities**

`MCPClient` does **not** hold `MCPMethodManager`, `MCPProgressReporter`, or `MCPStreamController`. Those are server-side.

`MCPClient` private fields (`MCPClient.ts:130-215`):

- `#transport` — constructor-injected from `options.transport` (`MCPClient.ts:231`)
- `#emitter` — constructed internally from `options.on` / `options.error` (`MCPClient.ts:227`)
- `#tasks` — constructed internally: `new MCPTaskClient({ request: this.#request.bind(this), timeout })` (`MCPClient.ts:240-243`)
- `#identity`, `#capabilities`, `#pin`, `#timeout` — from options, not sub-entities
- `#pending`, `#generation`, `#owner`, `#closing`, `#connecting`, `#disconnecting`, `#supersession` — private correlation/lifecycle glue

Readonly getters (`MCPClient.ts:250-268`, contract `MCPClientInterface` `core/types.ts:2652-2669`): `emitter`, `connected`, `version`, `transport`, `tasks`.

Where the named types actually live:

- `MCPMethodManager` is `MCPServer.#methods`, constructed in the server constructor, exposed as `methods` (`MCPServer.ts:149`, `171-172`, `183-185`)
- `MCPStreamController` is created **per dispatch** when the answer is iterable (`MCPServer.ts:253`)
- `MCPTextStreamController` is created **per `handle`** when the answer is iterable (`MCPServer.ts:288`)
- `MCPProgressReporter` is created **per `#progress` call** (`MCPServer.ts:908`), not stored on the client or server

---

**4. Declared `@orkestrel/*` runtime dependencies and `src/` use**

`package.json` `dependencies` (`package.json:97-104`): `@orkestrel/contract`, `@orkestrel/emitter`, `@orkestrel/process`, `@orkestrel/sse`, `@orkestrel/tool`, `@orkestrel/websocket`.

`peerDependencies` (`package.json:124-127`): `@orkestrel/router`, `@orkestrel/server`.

| Package | Used for | Sites |
|---|---|---|
| `contract` | Guards, `JSONValue`, `attempt`, `cloneJSON*`, `sanitizeBudget` — wire narrowing, no `as` | `core/validators.ts`, `parsers.ts`, `inferers.ts`, `helpers.ts`, `cloners.ts`, `MCPServer.ts`, `MCPClient.ts`, `MCPLegacy.ts`, `MCPLegacyClientTransport.ts`; server transports/helpers/factories; browser transports/helpers |
| `emitter` | Owned `Emitter` / `EmitterInterface` on client, server, and every `MCPClientTransportInterface` | `core/types.ts:1`, `MCPClient.ts:26`, `MCPServer.ts:44`, `factories.ts:13`; every client-transport class |
| `tool` | `ToolManagerInterface` on the server; `Tool` wraps remote descriptors on the client | `core/types.ts:3`, `MCPClient.ts:27`, `MCPServer.ts:2`, `helpers.ts:1`, `cloners.ts:2`; `browser/types.ts:2` |
| `sse` | `createSSEParser` / `SSEParserInterface` to decode Streamable-HTTP SSE replies | `server/helpers.ts:9,13`; `browser/helpers.ts:2,6` |
| `websocket` | `NodeWebSocketInterface`, `createNodeWebSocket`, `computeWebSocketAccept`, `WEBSOCKET_VERSION` | `server/transports/WebSocketClientTransport.ts:7,17-21`; `WebSocketServerTransport.ts:7`; `server/factories.ts:22` |
| `process` | `Process` supervisor + `PROCESS_GRACE` + `ProcessExit` for stdio client spawn | `StdioClientTransport.ts:3-6` only |
| `router` (peer) | `RouteContext`, `RouteInput` for HTTP POST mount | `server/types.ts:35`, `handlers.ts:2`, `factories.ts:6` |
| `server` (peer) | `openStream`, `StreamInterface`, `UpgradeHandler`, `signToken`/`verifyToken`, `MiddlewareHandler` | `server/types.ts:36`, `handlers.ts:17`, `middlewares.ts:2,11`, `factories.ts:7,21`, `MCPSession.ts:2`, `HTTPDisconnect.ts:1`, `helpers.ts:10` |

---

**5. Transports per environment (client vs server, what each owns)**

| Carrier | Client half | Server half | Owns |
|---|---|---|---|
| HTTP | Server + browser `HTTPClientTransport` (`duplex: false`). `start()` is a no-op; `send` POSTs; `close` aborts in-flight fetches | No transport class. `createMCPRoutes` POST handler + optional `createMCPSession` middleware. `HTTPDisconnect` owns one SSE response lifetime | Client: `fetch` loop, `#pending` AbortControllers, captured `mcp-session-id`. Server: route + session map + SSE streams |
| WebSocket | Server: `node:http(s)` upgrade + `createNodeWebSocket` (masked). Browser: native `WebSocket` (queued pre-open sends) | Per-connection `WebSocketServerTransport` wrapping an already-claimed socket; factory `createWebSocketServer` is an `UpgradeHandler` that `bindServer`s each connection | Client: handshake request / native socket. Server: upgraded `NodeWebSocketInterface` (does not own the TCP accept) |
| stdio | `StdioClientTransport`: `start()` constructs `@orkestrel/process` `Process` (`writable: true`); pumps `child.lines`; `close()` `child.destroy()` | `StdioServerTransport`: caller-owned `input`/`output` (default `process.stdin`/`stdout`); never destroys them | Client: child process. Server: subscriptions on injected streams |
| MessagePort | Not a `MCPClientTransportInterface`. Same class is either role via `bindServer` or `createDuplexClientTransport` + `bindClient` | Same | Native `MessagePort`; `port.start()` in constructor (`MessagePortTransport.ts:79`) |

Legacy: `MCPLegacyClientTransport` wraps any client transport and performs `initialize` on `start` (`MCPLegacyClientTransport.ts:52`).

---

**6. `guides/README.md` `## By concept` table**

Columns: **Concept | Spec | Source | Tests** (`guides/README.md:7`).

Representative row: Concept `MCP`, Spec [`mcp.md`](mcp.md), Source `src/core`, `src/server`, `src/browser`, Tests `tests/src/core`, `tests/src/server`, `tests/src/browser` (`guides/README.md:9`).

A second table **By directory** maps each of those three source dirs to the same `mcp.md` (`guides/README.md:13-17`).

---

**Distillate**

Mirror this stack:

- **Core** owns protocol entities (`MCPServer` / `MCPClient`) and two seams: object carrier `MCPClientTransportInterface` (`start`/`send`/`close` + emitter `message`/`close`/`error` + `duplex`/`session`) and string port `MCPTransportInterface` (`send`/`listen`/`closed`/`close`, replaceable handlers). Binders (`bindServer`/`bindClient`) and `createDuplexClientTransport` sit in core helpers/factories.
- **Host environments** own only framing classes and option types. Client halves implement `MCPClientTransportInterface`. Server halves for WS/stdio implement that same interface and are pumped with `bindServer`. HTTP server is routes + middleware, not a carrier class. MessagePort is the string port only.
- **Composition:** inject the carrier into `MCPClient`; construct `MCPTaskClient` internally and expose `tasks`. Put `MCPMethodManager` on the **server**. Construct stream/progress controllers per request, not as client fields.
- **Reuse** the same `@orkestrel/*` primitives: `emitter` on every entity, `contract` at the wire, `tool` for the registry, `sse` for HTTP SSE decode, `websocket`/`process`/`server`/`router` only in the Node face.

**Unknowns**

- Line counts are last-line numbers from the files as read; trailing-newline-only blank lines would not change those numbers.
- `HTTPDisconnect` is a class in `transports/` but is a response-lifetime helper, not a carrier.
- Non-class modules (`helpers.ts`, `validators.ts`, `handlers.ts`, `middlewares.ts`) were inventoried and grepped; they were not absorbed line-by-line.

**Deviation**

None that blocked the six evidence items. Scope said `src/**` (read all); class files, all three `types.ts`, barrels, factories, bind helpers, `package.json`, and `guides/README.md` were read. Large centralized non-class files were not fully absorbed.
