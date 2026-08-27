**Question:** What does `@orkestrel/mcp` implement today, where, and what does its test evidence cover, for a Model Context Protocol conformance audit?

**Evidence**

**1. Public surface** — barrels re-export whole modules (`src/core/index.ts:1`, `src/browser/index.ts:1`, `src/server/index.ts:1`).

Core classes: `MCPMethodManager` `src/core/MCPMethodManager.ts:26`; `MCPProgressReporter` `src/core/MCPProgressReporter.ts:34`; `MCPStreamController` `src/core/MCPStreamController.ts:46`; `MCPTextStreamController` `src/core/MCPTextStreamController.ts:43`; `MCPLegacy` `src/core/MCPLegacy.ts:47`; `MCPLegacyClientTransport` `src/core/MCPLegacyClientTransport.ts:52`; `MCPServer` `src/core/MCPServer.ts:146`; `MCPTaskClient` `src/core/MCPTaskClient.ts:47`; `MCPClient` `src/core/MCPClient.ts:129`; `MCPError` `src/core/errors.ts:24`.

Core factories: `createMCPServer` `src/core/factories.ts:59`; `createMCPLegacy` `:69`; `createMCPClient` `:109`; `createMCPLegacyClientTransport` `:128`; `createDuplexClientTransport` `:169`.

Core helpers (non-`is*`): `snapshotJSON` `src/core/cloners.ts:27`; `snapshotToolResult` `:67`; `parseJSONRPCMessage` `src/core/parsers.ts:80`; `parseRequestContext` `:110`; `parseMCPInputState` `:159`; `inferEra` `src/core/inferers.ts:18`; `inferVersion` `:30`; `inferRequestVersion` `:66`; `serializeJSON` `src/core/helpers.ts:142`; `digestJSON` `:364`; `buildProgressNotification` `:381`; `buildCancelledNotification` `:425`; `matchesResultType` `:460`; `extractContentText` `:484`; `buildCallOutcome` `:522`; `buildToolCall` `:570`; `buildJSONRPCResult` `:602`; `buildJSONRPCError` `:624`; `buildMethodOptions` `:665`; `buildToolDescriptors` `:688`; `buildModernResult` `:718`; `modernResultToLegacy` `:773`; `legacyResultToModern` `:813`; `legacyInvocationToModern` `:829`; `modernInvocationToLegacy` `:855`; `buildSubscriptionFilter` `:884`; `matchesSubscriptionNotification` `:918`; `stampSubscriptionNotification` `:951`; `buildSubscriptionAcknowledgement` `:976`; `buildSubscriptionResult` `:997`; `buildDiscoverResult` `:1022`; `buildInitializeResult` `:1076`; `decodeBoundedMessage` `:1113`; `readCancelledId` `:1141`; `bindServer` `:1260`; `bindClient` `:1372`; `isFormElicitationSupported` `:83`; `isTaskSupported` `:122`.

Core guards: `isMCPError` `src/core/errors.ts:55`; `isJSONObject` through `isModernRequest` in `src/core/validators.ts:87`–`:2099` (`isMCPMetaKey`, `isMCPMetaObject`, `isMCPResultMetaObject`, `isMCPNotificationMetaObject`, `isMCPLoggingLevel`, `isStandardBase64`, `isAbsoluteURI`, `isRFC3339Date`, `isRFC3339DateTime`, `isMCPProgress`, `isMCPAnnotations`, `isMCPIcon`, `isMCPIdentity`, `isMCPClientCapabilities`, `isMCPServerCapabilities`, `isMCPTextResource`, `isMCPBlobResource`, `isMCPResource`, `isMCPResourceTemplate`, `isMCPResourceContents`, `isMCPPaginationParams`, `isMCPResourcePage`, `isMCPResourceTemplatePage`, `isMCPStringArguments`, `isMCPPromptArgument`, `isMCPPrompt`, `isMCPPromptMessage`, `isMCPPromptPage`, `isMCPPromptGetResult`, `isMCPCompletionReference`, `isMCPCompletionParams`, `isMCPCompletion`, `isMCPCompletionResult`, `isMCPContent`, `isMCPResult`, `isMCPLegacyResult`, `isMCPCallResult`, `isMCPTaskResult`, `isMCPTaskStatus`, `isMCPTaskDetail`, `isMCPTaskDetailResult`, `isMCPTaskNotification`, `isBoundedString`, `isBoundedJSON`, `isJSONRPCId`, `isMCPVersion`, `isMCPModernVersion`, `isMCPLegacyVersion`, `isMCPSubscriptionFilter`, `isMCPSubscriptionResult`, `isMCPElicitFieldSchema`, `isMCPElicitSchema`, `isMCPElicitForm`, `isMCPElicitURL`, `isMCPElicitRequest`, `isMCPInputRequest`, `isMCPInputRequestMap`, `isMCPElicitResult`, `isElicitContent`, `isMCPInputResult`, `isJSONRPCRequest`, `isJSONRPCNotification`, `isJSONRPCInvocation`, `isJSONRPCResultResponse`, `isJSONRPCError`, `isJSONRPCErrorResponse`, `isJSONRPCResponse`, `isJSONRPCMessage`, `isInitializeRequest`, `isModernRequest`).

Core constants: `src/core/constants.ts:15`–`:194` (`MCP_HANDSHAKE_VERSION`, `MCP_FALLBACK_VERSION`, `MCP_MODERN_VERSION`, `SUPPORTED_MODERN_PROTOCOL_VERSIONS`, `SUPPORTED_LEGACY_PROTOCOL_VERSIONS`, `SUPPORTED_MCP_VERSIONS`, `MCP_META_*`, `MCP_EXTENSION_TASKS`, `MCP_HEADER_MISMATCH`, `MCP_MISSING_CAPABILITY`, `MCP_UNSUPPORTED_VERSION`, `DEFAULT_MCP_CACHE_TTL`, `DEFAULT_MCP_LIMITS`, `EMPTY_MCP_ARGUMENTS`, JSON-RPC codes, client defaults).

Core types: `src/core/types.ts:24`–`:2800` (JSON-RPC arms, `MCPModernVersion`/`MCPLegacyVersion`/`MCPVersion`, capabilities, content, elicitation/input, progress, tasks, tools/resources/prompts/completion, pagination, subscriptions, stream controllers, method/server/client interfaces, transport interfaces).

Server classes: `HTTPClientTransport` `src/server/transports/HTTPClientTransport.ts:77`; `HTTPDisconnect` `src/server/transports/HTTPDisconnect.ts:42`; `MCPSession` `src/server/MCPSession.ts:61`; `WebSocketServerTransport` `src/server/transports/WebSocketServerTransport.ts:43`; `WebSocketClientTransport` `src/server/transports/WebSocketClientTransport.ts:74`; `StdioClientTransport` `src/server/transports/StdioClientTransport.ts:69`; `StdioServerTransport` `src/server/transports/StdioServerTransport.ts:50`.

Server factories: `createMCPContinuation` `src/server/factories.ts:38`; `createMCPRoutes` `:104`; `createHTTPClientTransport` `:153`; `createWebSocketServer` `:213`; `createWebSocketClientTransport` `:306`; `createStdioClientTransport` `:349`; `createStdioServer` `:387`; `createMCPPostHandler` `src/server/handlers.ts:63`; `createMCPSession` `src/server/middlewares.ts:94`.

Server helpers/inferers: `inferHeaderIssue` `src/server/inferers.ts:43`; `inferLegacyVersion` `:143`; `inferStatus` `:161`; `buildResponseError` `src/server/helpers.ts:35`; `createReadableStream` `:57`; `sendEventStream` `:97`; `acceptsEventStream` `:148`; `allowsOrigin` `:168`; `readSessionHeader` `:203`; `readLastEventId` `:222`; `rejectUnknownSession` `:242`; `readEventStream` `:267`; `decodeEvent` `:303`; `upgradeRequestPath` `:326`; `extractLines` `:348`; `writeLine` `:380`; `dispatchLines` `:409`; `bridgeMessageTransport` `:476`.

Server constants: `src/server/constants.ts:16`–`:106` (`MCP_SESSION_HEADER`, `MCP_PROTOCOL_VERSION_HEADER`, `MCP_METHOD_HEADER`, `MCP_NAME_HEADER`, SSE headers, `DEFAULT_MCP_PATH`, keepalive, `MCP_WEBSOCKET_SUBPROTOCOL`, session capacity/TTL, `DEFAULT_MCP_DELIVERY`).

Server types: `src/server/types.ts:48`–`:492` (`MCPHeaderIssue`, origin/keepalive/HTTP/session/event-store, HTTP/WebSocket/stdio option and interface types, `LineExtraction`).

Browser classes: `HTTPClientTransport` `src/browser/transports/HTTPClientTransport.ts:78`; `MessagePortTransport` `src/browser/transports/MessagePortTransport.ts:67`; `WebSocketClientTransport` `src/browser/transports/WebSocketClientTransport.ts:52`.

Browser factories: `createWebSocketClientTransport` `src/browser/factories.ts:44`; `createHTTPClientTransport` `:89`; `createMessagePortTransport` `:122`; `createScopeTransport` `:153`.

Browser helpers: `decodeEvent` `src/browser/helpers.ts:46`; `readEventStream` `:72`; `createScopeMessageListener` `:136`; `serveMCPScope` `:181`; `serveMCP` `:217`.

Browser constants: `src/browser/constants.ts:15`–`:63`.

Browser types: `src/browser/types.ts:49`–`:146`.

**2. Client** (`MCPClient` `src/core/MCPClient.ts:129`, contract `src/core/types.ts:2652`).

- Lifecycle: `connect` `:270` opens transport then `#negotiate` `:799`; `disconnect` `:380`; `connected`/`version`/`transport`/`tasks` getters `:254`–`:267`.
- Handshake: modern path is `server/discover`, not `initialize` (`:75`, `:327`, `:799`). A `-32601` on discover is rewritten to require `createMCPLegacyClientTransport` (`:837`).
- Version: pin must be modern (`:221`); offer defaults to `MCP_MODERN_VERSION` (`:238`); unpinned `-32022` retries via `inferVersion` on `error.context.supported` (`:825`); pin must appear in `supportedVersions` (`:846`).
- Capabilities: constructor default `{}` (`:236`); stamped per request under `_meta` (`MCP_META_VERSION` / `MCP_META_CAPABILITIES` / `MCP_META_CLIENT`) (`:464`, `:541`).
- Correlation: monotonic `#nextId` and `#pending` map (`:155`, `:181`); `#receive` settles by `id`; id-less error rejects every pending (`:84`, remarks at `:596`).
- Cancellation: `call` `options.signal` (`src/core/types.ts:2784`); `notifications/cancelled` only when `transport.duplex` (`src/core/MCPClient.ts:1026`); HTTP `duplex` is `false` (`src/server/transports/HTTPClientTransport.ts:107`).
- Progress: inbound `notifications/progress` routed to the pending handler (`:168`, `:744`).
- Public methods: `discover` `:324`; `tools` `:390`; `listen` `:404`; `call` `:413`. No `ping`, `initialize`, `sampling/*`, or `roots/*` methods on this class.
- Sampling/roots: admitted as deprecated `MCPInputRequest` arms (`src/core/types.ts:559`, `src/core/validators.ts:1632`); this package produces only elicitation (`:559`).
- Elicitation: client surfaces `resultType` input arms via `call` (`src/core/types.ts:2774`); no `elicitation/create` client method.

**3. Server**

- `MCPServer` (`src/core/MCPServer.ts:146`): `dispatch`/`handle` (`:191`); always registers `server/discover`, `tools/list`, `tools/call`, `subscriptions/listen` (`:313`); `resources/*` if `resources` (`:320`); `prompts/*` if `prompts` (`:332`); `completion/complete` if `completion` (`:341`); `tasks/get|update|cancel` only if `task` (`:356`). Notifications including `ping` produce no response (`:225`).
- `MCPMethodManager` (`src/core/MCPMethodManager.ts:26`): `add` replaces (`:29`); `method` lookup (`:33`).
- Pagination: `cursor` forwarded to resource/prompt list (`src/core/MCPServer.ts:460`, `:569`, `:609`); types `src/core/types.ts:1065`.
- Elicitation: server-side `#form` / `elicitation/create` path (`src/core/MCPServer.ts:1000`, `:1277`); missing capability `-32021` (`:1018`).
- Logging: `MCPLoggingLevel` and `capabilities.logging` types (`src/core/types.ts:210`, `:239`); `parseRequestContext` admits `io.modelcontextprotocol/logLevel` (`src/core/parsers.ts:126`). No `logging/setLevel` registration in `#register`.
- `createMCPPostHandler` (`src/server/handlers.ts:63`): Origin `403` (`:70`); modern header match `-32020` (`:109`); headerless initialize accepted, other headerless legacy needs session (`:32`); legacy protocol header must be a legacy revision else `-32022` (`:115`); SSE via `openStream` when streamed (`:134`); JSON SSE one-shot when `Accept` includes event-stream (`:142`).
- `createMCPRoutes` is stateless POST-only (`src/server/factories.ts:56`).
- `createMCPSession` (`src/server/middlewares.ts:94`): modern POST passes through (`:116`); legacy POST mints on `initialize` (`:176`); stamps `mcp-session-id`; GET replays `Last-Event-ID` then attaches SSE (`:150`); DELETE `204` (`:134`); Origin `403` (`:106`); unknown session `404` (`:187`).
- `MCPSession` (`src/server/MCPSession.ts:61`): `push`/`replay`/`attach`/`detach`; unknown cursor replays nothing (`:96`).

**4. Transports**

- `StdioClientTransport` (`src/server/transports/StdioClientTransport.ts:69`): newline JSON-RPC; delegates spawn/framing to `@orkestrel/process/server` `Process` (`:19`); duplex; no session; no SSE/Last-Event-ID.
- `StdioServerTransport` (`src/server/transports/StdioServerTransport.ts:50`): newline JSON-RPC over injected streams; `session` undefined (`:73`); duplex (`:78`); `extractLines`/`dispatchLines`; no SSE.
- `HTTPClientTransport` (server) (`src/server/transports/HTTPClientTransport.ts:77`): POST `fetch`; Accept JSON+SSE; SSE decode via `@orkestrel/sse` (`:40`); echoes `mcp-session-id`; legacy `mcp-protocol-version` after initialize (`:46`); `duplex: false` (`:107`); `close` aborts in-flight fetch (`:57`); session persists across `close`, protocol cleared (`:55`); no `Last-Event-ID` send; no auto-reconnect loop.
- `HTTPDisconnect` (`src/server/transports/HTTPDisconnect.ts:42`): composes request abort + SSE body cancel + keepalive comments (`:10`); uses `@orkestrel/server` `StreamInterface`; not a client transport.
- `WebSocketClientTransport` (server) (`src/server/transports/WebSocketClientTransport.ts:74`): RFC 6455 upgrade via `@orkestrel/websocket` (`:37`); JSON text frames; subprotocol `mcp`; no SSE/session/Last-Event-ID; no auto-reconnect; `close` destroys in-flight upgrade (`:56`).
- `WebSocketServerTransport` (`src/server/transports/WebSocketServerTransport.ts:43`): wraps `@orkestrel/websocket` `NodeWebSocketInterface`; JSON text frames; `session` undefined (`:63`); duplex (`:68`); silent drop on closed send (`:32`).
- Browser `HTTPClientTransport` (`src/browser/transports/HTTPClientTransport.ts:78`): same session/protocol/SSE/`duplex: false` semantics as Node HTTP client (`:47`, `:108`); `@orkestrel/sse` via local `readEventStream` (`:43`).
- Browser `WebSocketClientTransport` (`src/browser/transports/WebSocketClientTransport.ts:52`): native `WebSocket`; queues sends until open (`:25`); drops send after close (`:40`); default subprotocol `mcp` (`:74`); no Last-Event-ID.
- Browser `MessagePortTransport` (`src/browser/transports/MessagePortTransport.ts:67`): string `postMessage`; `MCPTransportInterface` not client transport (`:11`); `port.start()` in constructor (`:79`); no SSE/session/headers.

**5. Legacy**

- `MCPLegacy` (`src/core/MCPLegacy.ts:47`): answers `initialize` and `ping` (`:129`); forwards `tools/list`/`tools/call` after `legacyInvocationToModern` (`:142`); other methods `-32601` (`:159`); handshake version `2025-11-25` (`src/core/constants.ts:15`); fallback `2025-06-18` (`:18`); `buildInitializeResult` echoes supported legacy or newest handshake (`src/core/helpers.ts:1076`).
- `MCPLegacyClientTransport` (`src/core/MCPLegacyClientTransport.ts:52`): `start` runs `initialize` + `notifications/initialized` (`:176`); answers `server/discover` locally (`:122`); strips modern metadata outbound (`:47`); pin must be legacy (`:72`).
- Consumed by `createMCPLegacy` / `createMCPLegacyClientTransport` (`src/core/factories.ts:69`, `:128`); HTTP/session/stdio/WS tests and `tests/integration.test.ts:26`; core integration `tests/src/core/integration.test.ts:65`.

**6. Streams and tasks**

- `MCPStreamController` (`src/core/MCPStreamController.ts:46`): cancellation engine for held-open JSON-RPC streams; `next`/`return`/`throw`/`stop`/`asyncDispose` (`src/core/types.ts:1586`).
- `MCPTextStreamController` (`src/core/MCPTextStreamController.ts:43`): serializes that stream; `return` calls `stop` (`:79`).
- `MCPTaskClient` (`src/core/MCPTaskClient.ts:47`): `task` → `tasks/get` (`:56`); `update` → `tasks/update` (`:75`); `abort` → `tasks/cancel` (`:82`); no list, no poll loop.
- `MCPProgressReporter` (`src/core/MCPProgressReporter.ts:34`): single-slot backpressured `report`/`take`/`stop`; request-scoped, not durable.

**7. Tests**

- Conformance project: `vite.config.ts:190` includes `tests/conformance.test.ts`; runner `@modelcontextprotocol/conformance@0.2.0-alpha.10` (`package.json:107`); invoked as `server --url <url> --spec-version 2026-07-28` (`tests/setupConformance.ts:51`, `:1251`).
- Recorded runner scenarios in `tests/conformance.test.ts:34`: `completion-complete`, `tools-list`, `tools-call-simple-text`, `tools-call-image`, `tools-call-audio`, `tools-call-embedded-resource`, `tools-call-mixed-content`, `tools-call-error`, `tools-call-with-progress`, `server-sse-multiple-streams`, `resources-list`, `resources-read-text`, `resources-read-binary`, `resources-templates-read`, `prompts-list`, `prompts-get-simple`, `prompts-get-with-args`, `prompts-get-embedded-resource`, `prompts-get-with-image`, `dns-rebinding-protection`. Asserted total `passed: 23, failed: 0` (`:174`). Plus Tasks schema digest/row describes (`:57`–`:136`).
- Integration project: `vite.config.ts:214` includes `tests/integration.test.ts` only. Covers HTTP list/call/failure (`:232`); one registry over HTTP, WebSocket, MessagePort (`:263`); remote tools via local `ToolManager` (`:304`); legacy stateful handshake and modern client on one endpoint (`:334`).
- `src/` TODO search: no matches.
- Skips: no `it.skip` / `describe.skip` / `.todo` in `src/` or `tests/src/`. Runtime `context.skip` in `tests/distribution.test.ts:786` (`npm ping`) and `:910` (no browser). `tests/setupPolicy.ts` inspects skill-document `TODO` literals as policy, not deferred product work.

**8. Guides** (`guides/*.md`)

- `README.md` — guide index.
- `mcp.md` — this package’s MCP client/server/transports.
- `test.md` — `@orkestrel/test` helpers (dependency mirror).
- `tool.md` — `@orkestrel/tool` (dependency mirror).
- `server.md` — `@orkestrel/server` (dependency mirror).
- `sse.md` — `@orkestrel/sse` (dependency mirror).
- `websocket.md` — `@orkestrel/websocket` (dependency mirror).
- `router.md` — `@orkestrel/router` (dependency mirror).
- `scaffold.md` — `@orkestrel/scaffold` (dependency mirror).
- `process.md` — `@orkestrel/process` (dependency mirror).
- `probe.md` — `@orkestrel/probe` (dependency mirror).
- `guide.md` — `@orkestrel/guide` (dependency mirror).
- `emitter.md` — `@orkestrel/emitter` (dependency mirror).
- `contract.md` — `@orkestrel/contract` (dependency mirror).

Spot-check of `guides/mcp.md` Surface tables (`:1923`–`:2847`) against the three barrels: no named export in those tables was missing from the barrels.

**9. Spec-version markers**

- Declared: `MCPModernVersion = '2026-07-28'` `src/core/types.ts:190`; `MCPLegacyVersion = '2025-11-25' | '2025-06-18'` `:193`; constants `src/core/constants.ts:15`–`:21`.
- Negotiated modern: per-request `_meta['io.modelcontextprotocol/protocolVersion']` (`:47`); client discover + `inferVersion` (`src/core/MCPClient.ts:799`, `src/core/inferers.ts:30`); server `isModernRequest` + `parseRequestContext` (`src/core/validators.ts:2099`, `src/core/parsers.ts:110`); HTTP header `mcp-protocol-version` (`src/server/constants.ts:27`, `src/server/inferers.ts:43`).
- Negotiated legacy: `initialize.params.protocolVersion` via `buildInitializeResult` / `inferLegacyVersion` (`src/core/helpers.ts:1076`, `src/server/inferers.ts:143`); adapter `#initialize` (`src/core/MCPLegacyClientTransport.ts:176`).
- Tasks schema date `2026-07-28` (`src/core/types.ts:733`, `tests/setupConformance.ts:101`).
- RFC3339 examples in `src/core/validators.ts:293` are calendar-date tests, not protocol revisions. `2024-11-05` appears only as an `MCPError` example (`src/core/errors.ts:18`).

**Distillate**

`@orkestrel/mcp` is a typed JSON-RPC MCP stack with a transport-agnostic core and HTTP/WebSocket/stdio/MessagePort faces.

Modern era is `2026-07-28`. A bare `MCPServer` has no `initialize`/`ping`. Clients `connect` via `server/discover` and stamp `_meta` protocol/capabilities/identity on every request. Built-in methods: `server/discover`, `tools/list`, `tools/call`, `subscriptions/listen`. Host ports optionally add `resources/*`, `prompts/*`, `completion/complete`. Tasks extension `tasks/get|update|cancel` registers only when `task` is configured.

Legacy `2025-11-25` / `2025-06-18` is an optional decorator: `MCPLegacy` answers `initialize`/`ping` and forwards tools; `MCPLegacyClientTransport` handshakes and synthesizes `server/discover`. HTTP session middleware is likewise legacy-only; modern POST is stateless through `createMCPRoutes`.

Client correlation is id-keyed. Cancellation writes `notifications/cancelled` only on duplex carriers (stdio/WS/MessagePort). Streamable HTTP is not duplex; abort closes the fetch body. Progress is `notifications/progress` to a per-request handler. Sampling and roots exist as deprecated input-request types; this package produces elicitation only. No `logging/setLevel` method. No HTTP client `Last-Event-ID`. Resumable GET-SSE + `Last-Event-ID` live on `createMCPSession` GET.

Conformance evidence is `@modelcontextprotocol/conformance` `server` suite at spec `2026-07-28` against live Streamable HTTP, plus a vendored Tasks schema pin. Integration evidence is this package’s own HTTP/WS/MessagePort composition, including a dual-era stack. No `src/` TODOs and no skipped tests in `src/` or `tests/src/`.

**Unknowns**

- Whether the installed runner implements scenarios beyond the recorded `EXPECTED` list (only those names are asserted).
- Whether a live `npm run test:conformance` still matches `23/0` in this checkout (the file asserts it; this scout did not run it).
- Whether HTTP clients ever send `Last-Event-ID` through a path not in these transport files.
- Whether `logging/setLevel` exists behind a consumer-registered method (it is not in `#register`).
- Runtime contents of `node_modules/@modelcontextprotocol/conformance` beyond the pinned version and the `server --spec-version 2026-07-28` invocation.
