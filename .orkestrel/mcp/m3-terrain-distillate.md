# M3 terrain — Grok distillate over mcp `fa11c89` (2026-08-26)

Bench round trip confirmed: the journal grew past its header (125 lines) at
`/home/user/mcp/tmp/cursor/subscription.log`, brief at
`/home/user/mcp/tmp/cursor/subscription-brief.md`; the CLI printed no session id, so the
journal file is the durable record. The mcp tree stayed clean. Grok's `file:line` pointers
are unverified — spot-check each before it enters a brief, especially guide line ranges.

## 1. Subscription wire methods

- `resources/subscribe` / `resources/unsubscribe` are not registered on the modern server
  (`src/core/MCPServer.ts:312-329`) and fail closed on the legacy decorator with `-32601`
  (`src/core/MCPLegacy.ts:128-164`; tests `tests/src/core/MCPLegacy.test.ts:299-325,427-439`).
  Capability flags for them still exist in types/validators/helpers
  (`src/core/types.ts:242-247`, `src/core/validators.ts:502-509`,
  `src/core/helpers.ts:1009-1018,1049-1067`).
- The live replacement is `subscriptions/listen`, typed at `src/core/types.ts:1325-1422`,
  registered at `src/core/MCPServer.ts:316-318`, handled by `#subscribe`/`#subscription`
  (`src/core/MCPServer.ts:1286-1364`), capacity default `128`
  (`src/core/constants.ts:121`), metadata key `MCP_META_SUBSCRIPTION`
  (`src/core/constants.ts:59-60`). Helpers at `src/core/helpers.ts:877-985`.
- `MCPClient` never issues `subscriptions/listen` — its `#request` reaches
  `server/discover`, `tools/list`, `tools/call` (`src/core/MCPClient.ts:307,371,389-395`)
  plus task methods through `MCPTaskClient` (`src/core/MCPTaskClient.ts:57,73,80`); the
  guide documents this absence (`guides/mcp.md:3807-3817`).
- The notification/filter-key matcher table at `src/core/helpers.ts:911-922` covers
  `tools/list_changed`, `prompts/list_changed`, `resources/list_changed`,
  `resources/updated`.

## 2. MCPClient's notification surface

- Public API (`src/core/types.ts:2546-2682`): `emitter`, `connected`, `version`,
  `transport`, `tasks`, `connect`, `discover`, `disconnect`, `tools`, `call` — no
  subscribe/listen/request/stream member.
- Event shape: `MCPClientEventMap.notification: readonly [message: JSONRPCMessage]`
  (`src/core/types.ts:2235-2244`).
- Delivery path in `#receive` (`src/core/MCPClient.ts:501-597`): everything with a `method`
  that is not a claimed in-flight `notifications/progress` goes to
  `this.#emitter.emit('notification', owned)` (`:595-596`). The per-call `progress` handler
  is the only interception point (`src/core/types.ts:2316-2317,712`).

## 3. Stream-shaped surfaces in src/core

- No `ReadableStream`/`TransformStream` under `src/core` itself (tests use
  `TransformStream.readable` as an `AsyncIterable`).
- `MCPSubscriptionHandler` returns `AsyncIterable<JSONRPCNotification> | Promise<...>`
  (`src/core/types.ts:1412-1415`).
- `MCPStream` = `AsyncGenerator<JSONRPCNotification, JSONRPCResponse, unknown>`
  (`src/core/types.ts:1441`); `MCPStreamControllerInterface` wraps it with
  `next`/`return`/`throw`/`stop`/`[Symbol.asyncDispose]` (`src/core/types.ts:1483-1536`;
  `src/core/MCPStreamController.ts:46-70`). Text variant at `src/core/types.ts:1444,1567`
  and `src/core/MCPTextStreamController.ts`.
- `MCPProgressReporter.take(): Promise<JSONRPCNotification>` is a single backpressured
  slot, not an iterable (`src/core/MCPProgressReporter.ts:93`).

## 4. Test coverage and fixtures

- Client-side: `tests/src/core/MCPClient.test.ts:1431,2903,2968,3028,3294`.
- Server-side subscription delivery: `tests/src/core/MCPServer.test.ts:2568,3588,3636,6494`
  plus capacity/close/abort rows at
  `591,668,3524,3556,3674,3710,3744,3774,2674,3804`; type pins at `6226,6233`.
- Helpers/validators: `tests/src/core/helpers.test.ts:531,549,586,603,1617`;
  `tests/src/core/validators.test.ts:672-700`.
- HTTP pump: `tests/src/server/handlers.test.ts:405` (producer `subscriptionEvents` at
  `:44-46`).
- Controllers: `tests/src/core/MCPStreamController.test.ts:128`;
  `tests/src/core/MCPTextStreamController.test.ts:74`; `tests/src/core/helpers.test.ts:891`.
- No named reusable fixture server emits `resources/updated` — emission is inline per-test
  `TransformStream` writers. `tests/setup.ts` `probeOwnership` (`:715-724`) builds a listen
  server whose producer never yields. `tests/setupConformance.ts` has no subscribe/updated
  producer.

## 5. Guide and parity

- Client `notification` event at `guides/mcp.md:72-74`; removed `resources/subscribe` note
  and live `subscriptions/listen` path at `:521-528`; `### Configure modern subscriptions`
  at `:808-874`; live-subscription bound near `:1446-1450`; surface tables at
  `:1789,1861,1907-1911,2021-2028,2045`; `MCPClientInterface` notification example under
  `## Methods` at `:2941-2984`; declared non-goal at `:3695-3699`; declared conformance gaps
  (unrun `resources-subscribe`/`resources-unsubscribe` runner, no client-side
  `subscriptions/listen` initiator or stream API) at `:3788-3790,3807-3817`.
- `tests/guides.test.ts` has no row named for subscription/listen/list_changed/notification
  specifically; coverage runs only through the generic barrel/Methods-table parity loop
  (`tests/guides.test.ts:569-623` against `guides/README.md:9`).
