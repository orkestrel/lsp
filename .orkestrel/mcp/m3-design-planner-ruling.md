I hold the **subjective** lane: shape, naming, ergonomics, and design fit for the client subscription surface of `@orkestrel/mcp`.

# Ruling

## Axis 1 — The entity and its member names

**Recommended shape: a direct method on `MCPClient`.**

```ts
listen(notifications: MCPSubscriptionFilter, options: MCPListenOptions): MCPSubscriptionStream
```

It sits beside `connect`, `discover`, `disconnect`, `tools`, and `call` in `MCPClientInterface` (`/home/user/mcp/src/core/types.ts:2546-2683`).

Why `listen` and not `subscribe`: the live wire method is `subscriptions/listen`, registered at `/home/user/mcp/src/core/MCPServer.ts:316-318`, and the server-side option that opens a producer is `subscription.listen` (`/home/user/mcp/src/core/types.ts:1418-1423`). `resources/subscribe` is unregistered — `#register` at `/home/user/mcp/src/core/MCPServer.ts:312-333` never adds it. One concept, one term picks the verb both live sites already use; `subscribe` re-imports vocabulary the package deleted.

Why not a `client.subscriptions` sub-entity, on the `tasks` model: a manager owes the singular/plural accessor pair that `.claude/rules/patterns.md` § Managers fixes, which means a registry of live subscriptions keyed by id. This codebase has already ruled against exactly that. `bindClient` states it at `/home/user/mcp/src/core/helpers.ts:1331-1338` — "Adding a registry here would be a second correlation table for ids the client is already correlating, and two tables for one fact drift." The `tasks` precedent does not carry over either: `MCPTaskClient` exists because `tasks/*` is a family of wire methods over one door (`/home/user/mcp/src/core/MCPTaskClient.ts:47-82`), and `subscriptions/listen` is one method. A sub-entity holding one method is the superfluous wrapper `.claude/rules/architecture.md` § Wrapper test deletes.

Supporting type names, and the collision that forces them:

- `MCPSubscriptionStream` — the returned generator type, sibling to `MCPStream` (`types.ts:1441`) and `MCPTextStream` (`types.ts:1444`).
- `MCPListenOptions` — the per-listen options. `MCPSubscriptionOptions` is taken by the server's built-in configuration at `types.ts:1418`, so the client cannot have it. `MCPListenOptions` : `listen` :: `MCPCallOptions` : `call` (`types.ts:2313`), which is the precedent that already exists.
- `DEFAULT_MCP_SUBSCRIPTION_CAPACITY` in `constants.ts`. Do not reuse `DEFAULT_MCP_LIMITS.subscriptions` (`/home/user/mcp/src/core/constants.ts:115-123`) — that bounds live server slots, a different fact, and sharing the numeral would make a coincidence read as a contract.

## Axis 2 — The stream's contract

**Recommended shape: an async generator yielding owned notification frames and returning the graceful terminator.**

```ts
export type MCPSubscriptionStream = AsyncGenerator<JSONRPCNotification, MCPSubscriptionResult, unknown>
```

**Reuse the idiom, not the type.** `MCPStream` returns `JSONRPCResponse` — a wire envelope. The client unwraps envelopes at `#receive` and hands callers payloads: `discover` returns `MCPDiscoverResult` (`MCPClient.ts:304-358`), `call` returns `MCPCallOutcome` (`:384-406`). Returning a `JSONRPCResponse` would be the only place `MCPClient` leaks an envelope to a consumer. So `MCPStream` reused verbatim is **wrongly coupled**; the yield-notifications/return-terminal shape reused with the client's own terminal type is right.

**Do not wrap `MCPStreamController`.** Its `stop()` means "there will be no answer, from an owner that is not the consumer" and it exists to release a server-side slot (`types.ts:1459-1481`; `MCPStreamController.ts:29-35`). The client holds no slot and has no non-consumer owner. Wrapping it would force the client to synthesize the `JSONRPCResponse` it just finished unwrapping.

**Backpressure binds to a bounded queue, and the bound is loud.** The transport contract offers no read or pause primitive — `MCPClientTransportInterface` is `start` / `send` / `close` plus an emitter (`types.ts:2100-2160`), and `#receive` runs as a synchronous emitter callback registered at `MCPClient.ts:227`. Nothing the client does can slow the wire. So:

- The client holds one bounded queue per live subscription, defaulting to `DEFAULT_MCP_SUBSCRIPTION_CAPACITY`, overridable through `MCPListenOptions.capacity`.
- A parked `next()` takes from the queue; a full queue **fails the stream** — the next read rejects with an `MCPError` naming the overflow, and the subscription closes.

Dropping frames silently is the alternative and it must lose: a consumer cannot tell a dropped frame from a quiet server, and the package's whole posture is to state a limit rather than let it be met on the wire (`guides/mcp.md:3806-3810`). `MCPProgressReporter` is the in-package precedent for a bounded handoff that refuses rather than queues (`/home/user/mcp/src/core/MCPProgressReporter.ts:69-85,146-159`).

**The graceful terminator arrives through the existing pending path.** `buildSubscriptionResult` correlates the terminal to the original request id (`/home/user/mcp/src/core/helpers.ts:978-985`), and `#receive` already routes a correlated response to `#settle` (`MCPClient.ts:550-591`). `matchesResultType('subscriptions/listen', 'complete')` returns `true` (`helpers.ts:454-458`), so the terminal passes the existing arm check unchanged. The generator's `return` value is that payload. A consumer using `for await` ends normally; one that wants the terminal drives the iterator and reads `{ done: true, value }` — the same idiom `MCPStream` already fixes.

Prove the terminal before returning it. `validators.ts` carries only `isMCPSubscriptionFilter` (`/home/user/mcp/src/core/validators.ts:1262`), so add `isMCPSubscriptionResult` and apply it the way `MCPTaskClient` proves a peer's snapshot before a caller narrows on it (`MCPTaskClient.ts:58-66`).

**Mid-stream connection loss ends iteration through the drain that already exists.** `#closeConnection` settles every pending entry with `new Error('MCP client disconnected')` (`MCPClient.ts:784-786`). If the listen request is an ordinary pending entry, that drain is the closure, and the parked `next()` rejects with it. No transport `close` subscription is added; no second mechanism appears.

**Carry `_meta` verbatim on each yielded frame.** The subscription id stamp (`helpers.ts:932-948`) rides out to the consumer. Rebuilding the frame to strip it would drop unrecognized members, which this package refuses elsewhere on the same grounds (`types.ts:2432-2435`).

## Axis 3 — Closure

**Recommended shape: a required per-listen `signal`, with the pending entry as the single release door.**

```ts
export interface MCPListenOptions {
	readonly signal: AbortSignal
	readonly capacity?: number
}
```

`signal` is **required**, and `options` is a required parameter. `MCPCallOptions.signal` is optional because a `call` carries `this.#timeout` (`MCPClient.ts:389-404`). A subscription must be issued with `deadline: undefined` — `#request` already accepts it (`MCPClient.ts:420-426`) — or the default deadline kills the stream. A held-open request with no deadline and no signal has no owner at all, and this package's stated position is that no owner of last resort exists and none will be invented (`types.ts:1479-1481`; `MCPStreamController.ts:29-35`). `MCPMethodOptions.signal` is required on the server side for the mirror reason (`types.ts:1393-1398`). Requiring it here is the same ruling on the same axis.

**On abort the client does what `#abortRequest` already does.** It settles the pending entry, and writes `notifications/cancelled` naming the listen id only where `transport.duplex` is true (`MCPClient.ts:876-885`). That matches the revision reading the guide already fixed: the subscriptions page attributes the cancellation notification to the client alone (`guides/mcp.md:3932-3947`).

**The server observes it as its request signal aborting**, which fires the slot's abort listener and returns capacity (`MCPServer.ts:1327-1330,1371-1373`).

**Put the queue and the waiter on the pending entry, not in a second map.** `MCPClient.ts:137-144` states the rule the client already lives by: every per-request registration lives on the entry so the single `#settle` door releases it on every exit, including the exits nobody enumerates. A subscription's queue, its parked reader, and its routing claim are per-request registrations. This is the central architectural fit — the subscription is a pending entry with a queue, not a new subsystem.

**Add no client-side controller class and no `[Symbol.asyncDispose]` on the type.** `for await` calls `return()` on `break`, `throw`, and normal completion; the required `signal` covers abandonment. A declared `asyncDispose` would need a verified runtime floor I do not have.

## Axis 4 — Filter surface

**Recommended shape: republish `MCPSubscriptionFilter` as-is, as a required positional parameter.**

The type is already exported, already the wire spelling with the compound-key exemption written into its own remarks (`types.ts:1314-1334`), and already validated by `isMCPSubscriptionFilter`. A client-side twin would be the rename-wrap `.claude/rules/architecture.md` § Wrapper test deletes.

**An absent filter is not a case — make the parameter required.** `#subscribe` refuses a `params.notifications` that fails the guard with `-32602` (`MCPServer.ts:1293-1300`), and `undefined` fails it. Defaulting to `{}` client-side would silently subscribe to nothing while reporting success.

**An empty filter is legal and delivers the acknowledgement only.** `buildSubscriptionFilter({}, supported)` returns `{}` (`helpers.ts:876-898`), the acknowledgement carries `{}`, and `matchesSubscriptionNotification` admits nothing (`helpers.ts:907-923`). Do not refuse it locally — that is product policy, and framework code stops before it. Document it.

**Yield the acknowledgement as the first frame.** `buildSubscriptionAcknowledgement` carries `params.notifications` holding the exact honoured subset (`helpers.ts:957-969`), which is how a consumer learns its request was narrowed. Swallowing it as a handshake would hide the narrowing and force a second surface to re-expose it.

## Axis 5 — Interception boundary

**Recommended shape: a sibling of `#reportProgress`, claiming at the same seam.**

`#receive` reaches `this.#emitter.emit('notification', owned)` at `MCPClient.ts:596`, immediately after the progress claim at `:595`. Add `#routeSubscription(owned): boolean` beside `#reportProgress` (`MCPClient.ts:604-616`): read `params._meta['io.modelcontextprotocol/subscriptionId']` (`constants.ts:59-60`), look the id up in `#pending`, and enqueue when that entry is a subscription. Claimed returns `true` and emits nothing; unclaimed falls through untouched.

That preserves the `notification` contract exactly the way the progress claim does. Non-subscription traffic is unaffected, and the event shape at `types.ts:2241` does not change.

**A frame arriving after the consumer abandoned the stream without aborting surfaces on `notification`.** Its id names nothing pending, so it is what it is — a server-initiated message nothing claimed. This needs no new mechanism and it is honest. Its cost is real and belongs in prose: that consumer also keeps the server's slot until `disconnect`. The required `signal` is what makes this a mistake reachable only on purpose.

The `notification` remark at `types.ts:2225-2229` gains one sentence, mirroring the progress-claim sentence already there.

## Alternatives ruled out

- **`client.subscriptions` manager.** Cost: a second correlation table this codebase has already argued against at `helpers.ts:1331-1338`, plus accessor members with no wire method behind them. Refused.
- **`listen` returning `Promise<MCPSubscriptionStream>`.** Cost: two shapes at the call site (`await` then `for await`) for one exchange. Refused — every failure the promise would carry is a first-`next()` failure. I flag the eager already-aborted refusal at `MCPClient.ts:457-461` as the one thing this hides, in Tensions.

## Units

**U1 — `m3-client-listen` · role `implementer` (Codex `implementer`) · engine GPT-5.6 Sol.**
Constraint-heavy: settle ordering, queue bounds, cancellation interleaving. Route objective.

Owns: `src/core/types.ts`, `src/core/constants.ts`, `src/core/validators.ts`, `src/core/MCPClient.ts`, `tests/setup.ts`, `tests/setup.test.ts`, `tests/src/core/MCPClient.test.ts`.
Shared, report-only: `guides/mcp.md`, `tests/guides.test.ts`.
Depends on: nothing.

Internal order, which is also its red-first proof: declare the types, add the fixture and the tests, record the failing command and count, implement, record the same command green.

Acceptance criteria, cheap-first:

1. `npm run lint:check` and `npm run format:check` pass over the owned files.
2. `npm run check` passes; `MCPClientInterface` declares `listen` and `MCPClient` implements it.
3. `tests/setup.ts` exports a fixture that pumps a held-open `dispatch` answer frame-by-frame onto the transport's `message` event and disposes the controller on close. The existing `createLoopbackTransport` refuses one — `if (answer === undefined || Symbol.asyncIterator in answer) return` at `tests/setup.ts:924` — and `dispatch` returns an `MCPStreamControllerInterface` (`MCPServer.ts:253`), so this fixture does not exist yet.
4. `tests/setup.test.ts` covers that fixture's exported behavior.
5. `npm run test:src:core` passes, and `tests/src/core/MCPClient.test.ts` carries a case for each of: the acknowledgement as the first yielded frame; a matched frame delivered while a non-subscription notification still reaches the `notification` event in the same run; the graceful terminator as the generator's `return` value; abort settling the stream and writing `notifications/cancelled` over the duplex loopback; `disconnect` mid-stream ending iteration with the drain error; a full queue rejecting the next read; a subscription frame arriving after closure surfacing on `notification`.
6. The report records the exact command and its failing count before the implementation, and the same command green after.

**U2 — `m3-subscription-guide` · role `opus` (Codex `opus`) · engine Opus 5.**
Documentation-voice and parity work. Route subjective.

Owns: `guides/mcp.md`, `tests/guides.test.ts`.
Shared, report-only: everything U1 owns.
Depends on: U1 integrated.

Acceptance criteria, cheap-first:

1. `npm run format:check` passes over the owned files.
2. A `### Consume modern subscriptions` section exists with an executable fence importing from `@orkestrel/mcp`.
3. Every added name appears in the surface tables, and `listen` appears in the `MCPClientInterface` Methods table with a row matching the interface's call-signature members.
4. The client-side gap entry at `guides/mcp.md:3812-3822` is **replaced, not deleted** — replaced by the honest residual limit, that the shipped HTTP client transports buffer a `text/event-stream` reply to completion (`src/server/transports/HTTPClientTransport.ts:207-208`), so incremental delivery is live over duplex carriers only.
5. The neighbouring per-request-abort entry at `guides/mcp.md:3824-3832` is rewritten. Its first sentence reads "unreachable for the same reason" and its body says "downstream of the entry above" — deleting the entry it points at orphans it. This carrier is named here and nowhere else.
6. `tests/guides.test.ts` transcribes the new fence and asserts the values its comments claim, per `.claude/rules/documentation.md` § Parity. `npm run test:guides` passes.

**U3 — gate evidence · role `verifier` · engine Sonnet.**
Runs `npm run format:check → lint:check → check → build → test` and reports exit codes. No fixes.

## Tensions

Named for the objective lane to challenge, or for the Orchestrator to rule.

1. **"Backpressured" cannot mean wire-level slowing here.** No transport primitive exists to stop reading. I read the ruling as bounded-and-loud: a full queue fails the stream rather than dropping. If the Orchestrator meant literal slowing, this design cannot deliver it and the plan owes that sentence.
2. **`signal` required, `options` required.** This narrows the API against `MCPCallOptions`, whose `signal` is optional. My case is the missing deadline plus the package's refusal of a last-resort owner. The other lane may argue that a required argument for a mechanism is product policy.
3. **`listen` returns the stream, not a promise.** This hides the eager already-aborted refusal `#request` performs before writing (`MCPClient.ts:457-461`) behind the first `next()`. I take that trade for the call-site shape.
4. **The word `listen` is already used twice for other concepts** — `MCPClientTransportInterface`'s port member (`types.ts:2043`) and `MCPSubscriptionOptions.listen` (`types.ts:1422`). Different entities, and the wire method picks the verb, so I keep it. Someone may read it as term reuse.
5. **The acknowledgement is yielded rather than consumed.** A consumer using plain `for await` receives a frame that is protocol bookkeeping. I prefer that to hiding the honoured-filter narrowing.
6. **Queue capacity defaults to the same numeral as the server slot cap.** I insist on a separate constant. Someone may argue the numeral itself needs its own evidence.

## Risks

- **The HTTP face does not deliver incrementally, and this capability does not fix it.** `readEventStream(response)` returns an array (`src/server/transports/HTTPClientTransport.ts:207-208`). Settling evidence: drive `listen` against the real HTTP fixture server and read arrival ordering against the server's yield ordering. If the campaign's exit criterion reads as "the client-side gap closes", this is where it does not close, and U2 criterion 4 is the carrier.
- **Deleting one gap entry orphans its neighbour.** Verified in the prose at `guides/mcp.md:3824-3832`. Carried by U2 criterion 5.
- **Every subscription test needs a fixture that does not exist.** Verified at `tests/setup.ts:924`. Carried by U1 criterion 3. If that fixture proves harder than budgeted, U1's size assumption is wrong and the Orchestrator hears it as a deviation.
- **Ordering between the write resolving and the acknowledgement arriving is untested terrain.** The loopback dispatches synchronously inside `send` (`tests/setup.ts:919-926`), so a frame can reach `#receive` before `listen`'s registration completes. Settling evidence: U1 criterion 5's first case. If the registration must precede the write, that constrains the implementation and belongs in the brief before dispatch.
- **A required `signal` shifts the closure burden onto consumers who supply an `AbortController` they never abort.** The residual is a live pending entry and a held server slot. Evidence that settles it: the capacity test in U1 criterion 5, plus the prose in U2.

## Facts I could not verify

- The supported Node floor, so whether an `AsyncGenerator` carries a native `Symbol.asyncDispose` on this package's targets. I did not read `package.json` `engines`. My recommendation not to declare it on the type is taken from that uncertainty rather than despite it.
- The row shape `tests/guides.test.ts` uses for a transcribed fence. I took its existence and location from the distillate and from `.claude/rules/tests.md`, and did not open the file.
- Whether the guide line numbers I cite match the distillate's, which warned they shifted at `c130277`. Every guide citation here comes from my own read of the file as it stands, not from the distillate.
- The exact `MCPSubscriptionResult` range. The brief gave `1336-1349`; I read `MCPSubscriptionResultMetaObject` at `types.ts:1337-1340` and `MCPSubscriptionResult` at `types.ts:1343-1346`.
