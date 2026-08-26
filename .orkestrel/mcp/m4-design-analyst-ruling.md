# Objective-lane ruling

## 1. The transition path

Select a required manager-emitted event surface.

Add `MCPTaskManagerEventMap` and `readonly emitter: EmitterInterface<MCPTaskManagerEventMap>` to `MCPTaskManagerInterface`. Each event must carry a complete `MCPTaskDetail` narrowed to the corresponding status arm. The event map must use separate transition events; a generic `status` or `transition` event conflicts with the event-map law. Exact event names remain for reconciliation with the subjective lane.

Rule the candidates as follows:

- **Manager emitter — select.** The manager owns task lifecycle state, and the repository requires stateful entities with observable transitions to expose an emitter ([patterns.md](/home/user/mcp/.claude/rules/patterns.md:68), lines 68–80). Status-specific events are mandatory ([patterns.md](/home/user/mcp/.claude/rules/patterns.md:101), lines 101–107).
- **Server-supplied callback — reject.** A callback passed to `start` belongs to the creation request, while task work outlives that request ([types.ts](/home/user/mcp/src/core/types.ts:831), lines 831–839). It also misses deduplicated tasks, restored tasks, and transitions produced after process recovery.
- **Subscription handler polling the store — reject.** The architecture forbids polling and requires event or abort wakeups ([architecture.md](/home/user/mcp/.claude/rules/architecture.md:273), lines 273–286).
- **A manager `listen` method — reject as the primary observer.** It creates another observation primitive beside the mandated emitter. A private adapter may convert emitter events into an async source for `MCPServer`; that adapter is implementation, not a second manager contract.

The server must own and validate each emitted snapshot before placing it on the wire. It must arm the manager listeners before yielding `notifications/subscriptions/acknowledged`, queue transitions behind that acknowledgement, merge them with the configured subscription producer, preserve event order, and release listeners on abort, return, source completion, and failure. The bridge needs a bounded queue because `Emitter.emit` is synchronous and cannot apply stream backpressure.

Evidence:

- The manager exposes only `start`, `task`, `update`, and `abort` ([types.ts](/home/user/mcp/src/core/types.ts:871), lines 871–951).
- The subscription producer is explicitly event-driven and receives the request lifetime ([types.ts](/home/user/mcp/src/core/types.ts:1415), lines 1415–1437).
- The server yields the acknowledgement before opening its configured source ([MCPServer.ts](/home/user/mcp/src/core/MCPServer.ts:1331), lines 1331–1364). Task listeners must not inherit that lost-transition window.
- The authority requires complete detailed snapshots in notifications ([extension schema](/home/user/lsp/.orkestrel/mcp/ext-tasks-2026-07-28-schema.ts:293), lines 293–311).

## 2. The filter and acknowledgement

Add this member without changing the existing members:

```ts
readonly taskIds?: readonly string[]
```

It belongs directly on `MCPSubscriptionFilter`. The request wire shape is `params.notifications.taskIds`. The existing acknowledgement builder already places the honoured filter under `params.notifications`, so the agreed `taskIds` travel through the same shape without a parallel acknowledgement type.

The server must authorize each requested identifier through `MCPTaskManagerInterface.task(id, options)` before acknowledgement. Preserve request order. An unknown, purged, malformed-manager, or unauthorized task must not appear in the acknowledged `taskIds`. Do not identify why an entry was omitted. A malformed `taskIds` array or non-string entry remains an invalid filter and rejects the listen request with `-32602`.

Omission is preferable to rejecting the whole request because subscription negotiation already intersects requested and supported members ([helpers.ts](/home/user/mcp/src/core/helpers.ts:869), lines 869–897). Unknown and unauthorized identifiers receive the same omission, preserving the manager’s anti-enumeration invariant. A manager throw remains a provider fault and terminates through the existing contained `-32603` path.

After acknowledgement, each emitted transition must be filtered against the agreed identifiers. If authorization can change during a long-lived subscription, re-run the existing `task(id, options)` authorization read when an event arrives. That read is event-triggered, not polling, and an `undefined` result silently drops the transition.

Evidence:

- The authority declares `taskIds?: string[]` for the request and acknowledgement fragments ([extension schema](/home/user/lsp/.orkestrel/mcp/ext-tasks-2026-07-28-schema.ts:313), lines 313–340).
- The local filter members sit at [types.ts](/home/user/mcp/src/core/types.ts:1314), lines 1314–1334.
- The acknowledgement copies the honoured filter verbatim ([helpers.ts](/home/user/mcp/src/core/helpers.ts:950), lines 950–969).
- Unknown, purged, and unauthorized tasks deliberately collapse to one manager answer ([types.ts](/home/user/mcp/src/core/types.ts:861), lines 861–869).

## 3. The notification shape

Add a distinct `MCPTaskNotificationParams` type. Do not redefine `MCPTaskDetail` as notification data.

Its shape is:

```ts
type MCPTaskNotificationParams = MCPTaskDetail & {
	readonly _meta?: MCPNotificationMetaObject
	readonly [key: string]: unknown
}
```

Add `MCPNotificationMetaObject` beside `MCPResultMetaObject`, with the optional reserved subscription-id field. Place `MCPTaskNotificationParams` immediately after `MCPTaskDetail` in the task family. A full method-specific envelope type is unnecessary unless an implementation signature consumes it; `JSONRPCNotification` already owns the envelope.

The wire builder must produce:

```ts
{
	jsonrpc: '2.0',
	method: 'notifications/tasks',
	params: {
		...detail,
		_meta: { 'io.modelcontextprotocol/subscriptionId': id },
	},
}
```

There must be no `params.task` wrapper.

The authority also exposes contract drift that M4 must repair:

- `ttlMs` and `pollIntervalMs` are integer-valued in the generated schema, but the local guards accept any finite number ([validators.ts](/home/user/mcp/src/core/validators.ts:1047), lines 1047–1050; [validators.ts](/home/user/mcp/src/core/validators.ts:1118), lines 1118–1120).
- A completed task’s `result` is an open record in the authority ([extension schema](/home/user/lsp/.orkestrel/mcp/ext-tasks-2026-07-28-schema.ts:127), lines 127–136), while the local type and guard require `MCPResult` ([types.ts](/home/user/mcp/src/core/types.ts:805), lines 805–810; [validators.ts](/home/user/mcp/src/core/validators.ts:1124), lines 1124–1127).
- The extension capability is exactly an empty object ([extension schema](/home/user/lsp/.orkestrel/mcp/ext-tasks-2026-07-28-schema.ts:342), lines 342–350), while `isTaskSupported` accepts non-empty records ([helpers.ts](/home/user/mcp/src/core/helpers.ts:98), lines 98–124).
- `tasks/get` is `Result & DetailedTask & { resultType: 'complete' }` ([extension schema](/home/user/lsp/.orkestrel/mcp/ext-tasks-2026-07-28-schema.ts:212), lines 212–225). Do not collapse the manager’s unstamped `MCPTaskDetail` and the client’s stamped get result into one exact wire signature. Add a distinct get-result type or explicitly project the wire result before returning it.

## 4. The verification form

Vendor the generated immutable JSON Schema as `tests/mirrors/ext-tasks-2026-07-28-schema.json`. Pin its raw SHA-256 `bf30afb7ac251e3e22c037b7a685f60ef6603031b5484c0d08b1fa0bbe86d460` and its `$id`:

```text
https://modelcontextprotocol.io/ext-tasks/2026-07-28/schema.json
```

Use comparison rows in `tests/conformance.test.ts`, supported by `tests/setupConformance.ts`. This follows the sibling LSP precedent: immutable authority bytes, digest and version pins, projected structure rows, and direct drift messages ([LSP setup](/home/user/lsp/tests/setupConformance.ts:132), lines 132–182; [LSP conformance](/home/user/lsp/tests/conformance.test.ts:92), lines 92–185).

The rows must cover:

- task requiredness, optionality, nullability, and integer formats;
- detailed status variants and their required payloads;
- flat creation and get results;
- complete update and cancel results;
- `notifications/tasks`, flat params, and metadata;
- request and acknowledged `taskIds`;
- the empty extension capability;
- `tasks/get`, `tasks/update`, and `tasks/cancel` method literals.

Capture real frames from the package’s fixture round-trip and compare those frames against the same authority coordinates. This wire evidence can falsify builder, stamping, nesting, acknowledgement, and serialization defects that declaration rows cannot.

Do not add a general JSON Schema validator under the present authority. No validator is directly declared in `package.json`; transitive `ajv` installations do not authorize imports. A bespoke evaluator would duplicate substantial schema machinery. Targeted authority-coordinate rows plus real wire captures provide the required proof without an unsolicited dependency. If the user explicitly authorizes a validator later, full schema validation can replace the targeted wire projection.

The installed conformance runner does not exercise tasks. The command

```text
node node_modules/@modelcontextprotocol/conformance/dist/index.js list --server --spec-version 2026-07-28
```

listed no task or task-notification scenario. The package’s pinned scenario baseline likewise contains no task scenario ([conformance.test.ts](/home/user/mcp/tests/conformance.test.ts:20), lines 20–41). Do not cite that runner as task-extension evidence.

## 5. The stale era comment

Replace every claim that the Tasks extension is draft or unstable with this fact:

> The package implements the stable, immutable MCP Tasks extension snapshot dated `2026-07-28`, extension id `io.modelcontextprotocol/tasks`, generated schema id `https://modelcontextprotocol.io/ext-tasks/2026-07-28/schema.json`.

The released source identifies itself as immutable and directs future edits to `schema/draft/` ([extension schema](/home/user/lsp/.orkestrel/mcp/ext-tasks-2026-07-28-schema.ts:1), lines 1–11). The draft directory is a development location, not this release’s specification path.

The implementation brief must sweep these stale claims:

- [types.ts](/home/user/mcp/src/core/types.ts:728), lines 728–745;
- [types.ts](/home/user/mcp/src/core/types.ts:984), lines 984–996;
- [types.ts](/home/user/mcp/src/core/types.ts:1787), lines 1787–1793;
- [types.ts](/home/user/mcp/src/core/types.ts:1832), lines 1832–1839;
- [types.ts](/home/user/mcp/src/core/types.ts:2409), lines 2409–2430;
- [types.ts](/home/user/mcp/src/core/types.ts:2569), lines 2569–2577;
- [MCPTaskClient.ts](/home/user/mcp/src/core/MCPTaskClient.ts:11), lines 11–26;
- [MCPServer.ts](/home/user/mcp/src/core/MCPServer.ts:124), lines 124–130;
- [MCPServer.ts](/home/user/mcp/src/core/MCPServer.ts:346), lines 346–350;
- [guides/mcp.md](/home/user/mcp/guides/mcp.md:1321), lines 1321–1327;
- the draft labels in the guide surface and method tables around [guides/mcp.md](/home/user/mcp/guides/mcp.md:1852), [guides/mcp.md](/home/user/mcp/guides/mcp.md:2086), and [guides/mcp.md](/home/user/mcp/guides/mcp.md:2962).

Delete the recorded “task notifications are not implemented” gap at [guides/mcp.md](/home/user/mcp/guides/mcp.md:1523) and replace the obsolete exclusion at [guides/mcp.md](/home/user/mcp/guides/mcp.md:4057), lines 4057–4074.

Correct the client prose as well. A stamped subscribed notification is claimed by `#routeSubscription` before the general `notification` event ([MCPClient.ts](/home/user/mcp/src/core/MCPClient.ts:712), lines 712–716; [MCPClient.ts](/home/user/mcp/src/core/MCPClient.ts:719), lines 719–741). The claims at [types.ts](/home/user/mcp/src/core/types.ts:2423), lines 2423–2430, and [guides/mcp.md](/home/user/mcp/guides/mcp.md:3110), lines 3110–3118, must direct subscribed consumers to the `listen` stream.

## 6. The unit cut

Use this serial routing.

| Unit | Owned files | Route | Independently checkable acceptance |
|---|---|---|---|
| **M4-event-wire** | `src/core/types.ts`, `src/core/helpers.ts`, `src/core/validators.ts`, `src/core/MCPServer.ts`, `src/core/MCPTaskClient.ts`, new internal `src/core/MCPTaskSubscription.ts`; `tests/setup.ts`, `tests/src/core/helpers.test.ts`, `tests/src/core/validators.test.ts`, `tests/src/core/MCPServer.test.ts`, `tests/src/core/MCPClient.test.ts`, `tests/src/core/MCPTaskClient.test.ts`, new mirrored task-subscription test | `implementer`, GPT-5.6 Sol | The manager exposes a required emitter; `taskIds` validates and negotiates; unavailable identifiers are omitted indistinguishably; task transitions produce flat stamped notifications; listeners arm before acknowledgement and release on every closure; idle subscriptions perform no periodic reads; queue overflow is bounded and visible; configured notifications still compose; integer, open-result, empty-capability, and get-result drift is repaired. |
| **M4-authority-proof** | `tests/mirrors/ext-tasks-2026-07-28-schema.json`, `tests/setupConformance.ts`, `tests/conformance.test.ts` | `builder`, Terra, after the reconciliation fixes every comparison coordinate | Mirror bytes and `$id` are pinned; authority rows cover the task extension slice; real fixture frames match the same coordinates; a negative mutation breaks each load-bearing row; the installed foreign runner is recorded as not covering tasks. |
| **M4-guide-parity** | `guides/mcp.md`, `tests/guides.test.ts` | `opus`, Claude Opus 5 | The guide states stable `2026-07-28` provenance and schema id; documents manager events, `taskIds`, acknowledgement, flat notifications, authorization, queue failure, and client consumption; removes the polling fallback and unimplemented-gap claims; executable fences and API parity pass. |
| **M4-audit** | Read-only diff and status evidence | `reviewer`, Claude Opus 5, for the Sol-written core; `analyst`, GPT-5.6 Sol, for the Opus-written guide; `checker`, Luna, for mirror and parity membership | Every falsifiable implementation, authority, and prose claim receives evidence. No writer accepts its own unit. |
| **M4-verification** | No owned source files | `verifier`, Terra | Run `format:check`, `lint:check`, `check`, `build`, and `test` in the required order and report exit-code truth. |

M4 ends when the stable authority rows pass, manager transitions reach subscribed clients without polling, unauthorized task identifiers remain indistinguishable from unavailable identifiers, the guide and public types describe the shipped family, the adversarial audit has no unresolved in-scope finding, and the required gates are green.

## Risks the implementing briefs must carry

- A transition can be lost if manager listeners arm after authorization or acknowledgement.
- Synchronous emitter fan-out requires bounded buffering, deterministic ordering, and explicit overflow behavior.
- A task can change authorization during a long-lived stream; the brief must decide and test event-time reauthorization.
- Duplicate `taskIds` and request order must not acquire undocumented normalization.
- A manager emitter can supply malformed, oversized, or mutable task snapshots; ownership and validation must precede matching and stamping.
- Task events and the configured producer can race; merging must not starve either source or reorder the mandatory acknowledgement.
- Abort, iterator return, producer failure, server stop, and normal completion must remove every manager listener.
- The generic client stream must not emit a subscribed task frame again through `MCPClientEventMap.notification`.
- The foreign conformance runner can remain green while every task-extension signature is wrong.

## Unknowns for the Orchestrator

- The authority does not define the manager observation contract, replay semantics, queue capacity, overflow result, or authorization-revocation policy. These are package decisions bounded by the repository laws.
- The extension source declares the `taskIds` fragments but does not structurally compose them into the core subscription types; its comment also says `tasksStatus` while the declaration says `taskIds` ([extension schema](/home/user/lsp/.orkestrel/mcp/ext-tasks-2026-07-28-schema.ts:315), lines 315–326). The shared brief rules the local wire placement as `params.notifications.taskIds`; document that reading.
- The authority calls task notifications optional and does not promise replay of transitions emitted before a subscription exists. M4 must define its guarantee from listener registration onward without claiming upstream replay.
