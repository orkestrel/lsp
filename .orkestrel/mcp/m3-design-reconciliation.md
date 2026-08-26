# M3 design reconciliation — the client subscription surface (2026-08-26)

Lanes: `planner` (Opus 5, native, `m3-design-planner-ruling.md`) and `analyst` (GPT-5.6
Sol, bench session `01a03c21-1c98-73c2-88e2-2cada59cafef`, journal
`tmp/codex/m3-design-analyst.jsonl`, ruling `m3-design-analyst-ruling.md`). Both lanes ran
blind on `m3-subscription-design-brief.md`. The Orchestrator reconciles; the rulings below
are the plan.

## Where the lanes agree, adopted as ruled

- `listen` sits directly on `MCPClientInterface` — no `subscriptions` sub-entity; a
  single-method manager is grouping without behavior.
- The stream yields every owned subscription-bound `JSONRPCNotification`, the
  acknowledgement first, and returns the validated `MCPSubscriptionResult` on graceful
  closure; a JSON-RPC error or connection loss rejects iteration.
- Routing claims frames by the listen request id through `MCP_META_SUBSCRIPTION` at the
  `MCPClient.ts` server-initiated seam, the sibling of `#reportProgress`. Unstamped
  notifications keep the existing progress interception and `notification` event. A stamped
  frame naming no active subscription is late stream traffic and is discarded.
- No request timeout applies to a subscription; closure is abort, iterator return, peer
  completion, or connection failure.
- `disconnect()` and transport loss reject every active subscription; the client gains the
  transport-loss handling the constructor lacks (it subscribes only to `message`,
  `MCPClient.ts:225`).
- The graceful terminal validates through a dedicated `isMCPSubscriptionResult` guard.
- The current loopback fixture cannot carry the proof (`tests/setup.ts:919-924` discards
  held-open answers and refuses AsyncIterable answers).

## The ruled tensions

1. **Backpressure: bounded queue (planner) over awaited transport ingress (analyst).**
   The analyst is right that a client-side queue is not transport backpressure — its own
   risk note concedes the bounded queue "prevents unbounded memory". The awaited-ingress
   contract it prescribes rewrites `send` across every transport, makes both HTTP decoders
   incremental, and demands per-carrier saturation proofs — a transport-contract capability,
   not the client subscription surface this round designs. Ruling: the bounded queue on the
   pending entry with loud overflow failure ships; the transport ingress program is
   recorded as a named follow-up capability (see the register at the end), and the guide
   carries the honest limit. This is a re-baseline holding the exit criterion, not a
   deferral of a defect: no shipped behavior claims transport backpressure.
2. **`signal` is required (planner) over optional (analyst).** A subscription is long-lived
   and the abandoned-stream leak the analyst itself names — "a consumer that drops the
   stream without abort remains its owner", with no timer or finalizer permitted — closes
   only when every consumer holds a closure handle. Requiredness is the shape that makes
   the obligation visible at the call site.
3. **`MCPSubscriptionStream` stays a type alias (planner) over a wrapper interface with
   `[Symbol.asyncDispose]` (analyst).**
   `AsyncGenerator<JSONRPCNotification, MCPSubscriptionResult, unknown>` already carries
   `return`, and the repository's TypeScript lib surface gives generators disposal through
   the iterator protocol where enabled — a wrapper interface adds no materially narrower
   contract. `return()` and the signal raise the same internal closure, which satisfies the
   analyst's equivalence requirement without the wrapper.
4. **Filter defaulting (analyst adopted).** `notifications` is optional at the call site;
   absence and `{}` send the same wire member `params.notifications: {}`, because the
   server requires the member (`MCPServer.ts:1292`) while the guard accepts the empty
   object (`validators.ts:1250`). The planner's required-argument shape loses to the
   objective wire constraint.
5. **`capacity` stays (planner).** The bounded queue needs its bound;
   `MCPListenOptions.capacity?: number` with a package default constant.
6. **The proof fixture: a real in-process `MCPServer` (analyst) over a bespoke loopback
   extension (planner).** Real implementations are the repository law, the server already
   speaks the whole sequence, and the duplex pair the suite already uses for real-server
   rows carries held-open exchanges. The synchronous-delivery ordering risk the planner
   flagged is settled by run evidence: `#pending.set` precedes `#transport.send`
   (`MCPClient.ts:474`, `:484`), and the shipped progress-interception rows exercise
   exactly that synchronous seam green.
7. **HTTP carriers: document, not refuse (planner's residual-limit entry).** The analyst's
   explicit-rejection rule needs a lawful discrimination mechanism the client contract does
   not carry; adding one is the follow-up capability. The guide's gap entries at
   `guides/mcp.md:3812` and `:3824-3832` are REPLACED by the residual limit: the HTTP
   client transports buffer `text/event-stream` to completion
   (`HTTPClientTransport.ts:207-208`; `src/server/helpers.ts:267`,
   `src/browser/helpers.ts:72`), so incremental subscription delivery is duplex-only and a
   `listen` over HTTP yields its frames only when the stream closes.

## The reconciled shape

```ts
type MCPSubscriptionStream = AsyncGenerator<JSONRPCNotification, MCPSubscriptionResult, unknown>

interface MCPListenOptions {
	readonly signal: AbortSignal
	readonly capacity?: number
}

interface MCPClientInterface {
	listen(notifications: MCPSubscriptionFilter | undefined, options: MCPListenOptions): MCPSubscriptionStream
}
```

The `options` bag is required because the required `signal` lives in it — an optional bag
around a required member would contradict itself. The filter argument stays positional and
accepts `undefined`, which the client sends as `{}`. The U1 writer takes this exact shape.

Behavior, all ruled above: acknowledgement yielded first; bounded queue on the pending
entry with loud overflow; pre-aborted signal rejects the first read without sending; abort
rejects parked reads with the signal reason, releases the entry, and sends
`notifications/cancelled` on a duplex carrier per the existing cancellation rule
(`MCPClient.ts:876`); `return()` raises the same closure; terminal response validates
through `isMCPSubscriptionResult` and resolves the return value; a JSON-RPC error rejects
with `MCPError`; disconnect and transport loss reject; late stamped frames are dropped.

## Units and routing

| Unit | Role and engine | Subject |
|---|---|---|
| U1 | `sol` bridge — GPT-5.6 Sol, bench, workspace-write in /home/user/mcp | Types, validator, constant, `MCPClient.listen` with `#routeSubscription`, real-server tests, red-first |
| U2 | `implementer` — Claude Opus 5, native | `guides/mcp.md`: `listen` documentation, method table, executable example, the two gap entries replaced by the residual limit, the abandonment obligation |
| U3 | `verifier` — Sonnet, native | The authoritative gates after integration |

U1 precedes U2 (the guide documents the landed surface). The audit round runs `reviewer`
(Opus) on U1 as the lane whose engine did not write it, with `analyst` added per the loop's
triggers.

## Dropped findings, on the record

- The analyst's transport delivery contract, server and browser incremental HTTP units, and
  duplex-carrier saturation units are not dropped as wrong — they are the follow-up
  capability. Register entry: **transport ingress backpressure** — extend `send` with a
  per-request awaited `receive` handler and `signal`, make both HTTP decoders incremental,
  and take an executed saturation proof per carrier before any cross-carrier backpressure
  claim (the analyst's unverified fact stands: native WebSocket and `MessagePort` push
  paths have no demonstrated demand propagation).
- The planner's bespoke loopback fixture extension loses to the real-server fixture and is
  dropped.
