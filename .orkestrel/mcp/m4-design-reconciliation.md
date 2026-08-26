# M4 design reconciliation — the tasks notification family

Reconciled 2026-08-26 by the Orchestrator from the subjective lane
(`m4-design-planner-ruling.md`, Claude Opus 5, native, read-only) and the objective lane
(`m4-design-analyst-ruling.md`, GPT-5.6 Sol, bench, journal
`tmp/codex/m4-design-analyst.jsonl`, session `01a03d0f-39eb`). The lanes ran blind on the
shared brief `m4-tasks-design-brief.md` with a lane-assignment cover prepended to the bench
copy; the staged authority is `ext-tasks-2026-07-28-schema.ts` and
`ext-tasks-2026-07-28-schema.json` beside this file, and the composing-envelope probe is
`m4-envelope-probe.md`. The subject repository is `/home/user/mcp`, clean at `b50520a`.

The lanes genuinely fork on the transition path and on the acknowledgement entitlement.
Everything else converges with complementary detail. Each ruling below names its carrier
unit from the cut in question 6.

## 1. The transition path — the planner's shape, with adopted analyst obligations

**Ruling: no change to `MCPTaskManagerInterface`. M4 lands admission, not production.** The
consumer's `subscription.listen` producer is the transition source; the server's whole
transition work is the matcher branch keyed on `params.taskId` beside the
`notifications/resources/updated` branch at `/home/user/mcp/src/core/helpers.ts:920-922`,
plus the `taskIds` filter member.

The analyst selected a required `MCPTaskManagerEventMap` emitter on the manager port, with
a bounded queue bridging synchronous fan-out into the stream. Rejected, on the
foreign-contract asymmetry: `MCPTaskManagerInterface` is a consumer-implemented port over a
durable store, and the port's own remark states that the store outlives this process
(`/home/user/mcp/src/core/types.ts:741-745`). A required in-process emitter demands that
transitions happen where the package runs, which is the claim the port denies — a store
backed by a queue in another process cannot honour it. The stateful-emitter rule in
`.claude/rules/patterns.md` composes an emitter into an entity this package owns and
implements; it does not reach a port the consumer implements. The consumer who owns the
store already owns the push door: `subscription.listen` is an event-driven producer of
`JSONRPCNotification` frames that parks on its own source while idle
(`/home/user/mcp/src/core/types.ts:1416-1438`). The emitter's queue, ordering, overflow,
and listener-release obligations all fall away with it — they were costs of the rejected
shape, not of the family.

Adopted from the analyst into the planner's shape:

- **The delivery guarantee is documented, and it starts at the producer.** The authority
  calls task notifications optional and promises no replay of transitions emitted before a
  subscription exists. The package states its guarantee from producer delivery onward and
  claims no replay. Carrier: `m4-guide`, with the TSDoc half in `m4-contract`.
- **The server owns and validates each frame before matching and stamping.** The admission
  path treats a producer frame as foreign input: `isMCPTaskNotification` gates the branch
  before `matchesSubscriptionNotification` consults `filter.taskIds`, so a malformed or
  mutated snapshot never reaches the wire. Carrier: `m4-stream`, with the guard itself in
  `m4-contract`.

The planner's derived-support consequence stands: the server honours `taskIds` only when
`#options.task` and `#options.subscription` are both configured, derives that fact from the
existing state at `/home/user/mcp/src/core/MCPServer.ts:356-359` and `:1332`, and stores no
third flag. Carrier: `m4-stream`.

## 2. The filter and acknowledgement — the analyst's entitlement, on the planner's surface

**Ruling: `taskIds?: readonly string[]` joins `MCPSubscriptionFilter` as a peer of
`resourceSubscriptions`, no new acknowledgement type exists, and the server authorizes each
requested identifier through `MCPTaskManagerInterface.task(id, options)` before
acknowledging. An identifier the read does not resolve is omitted from the acknowledged
`taskIds` with no distinguishing signal. A malformed `taskIds` array rejects the listen
request with `-32602`. Delivered transitions are filtered against the agreed set.**

The surface is the planner's and both lanes spell it identically: the member at its
verbatim wire spelling under the foreign-key exemption
(`/home/user/mcp/src/core/types.ts:1314-1334`), the acknowledgement travelling through the
existing echo at `/home/user/mcp/src/core/helpers.ts:957-969`, `isMCPSubscriptionFilter`
gaining one clause in the shape of its sibling
(`/home/user/mcp/src/core/validators.ts:1264-1276`), and `client.listen` gaining the
capability with no new method.

The entitlement forks, and the analyst's shape wins. The planner echoed the request
verbatim and pushed entitlement into the consumer's producer, on the argument that an
acknowledgement echoing the resolved subset is a batch enumeration oracle. The argument
fails against the port's own contract: `task(id, options)` collapses the never-existed, the
purged, and the unauthorized into one `undefined` answer
(`/home/user/mcp/src/core/types.ts:861-869`), and `tasks/get` already exposes exactly that
collapse to the same caller, one identifier per request, at `-32602`
(`/home/user/mcp/guides/mcp.md:1449-1454`). An acknowledgement that omits what the same
read refuses reveals nothing the caller cannot already obtain through the public surface it
holds; it batches an existing answer, it does not create a new oracle. The planner's shape
has the real defect: an acknowledgement naming identifiers the caller can never receive is
a filter the server claims to honour and does not, and it makes every consumer producer
re-implement entitlement or leak transitions — the admission filter at
`matchesSubscriptionNotification` would pass any frame whose `taskId` sits in the echoed
set. Entitlement lands at admission, where the acknowledged set and the filter set are the
same set.

Two boundary decisions the reconciliation fixes rather than leaving to a brief:

- **The agreed set is fixed at acknowledgement for the subscription's lifetime.** The
  package performs no per-frame store read at delivery: a per-event `task(id)` read puts
  the durable store on the hot path of every frame and re-creates, at delivery time, the
  resolution the acknowledgement already performed. Mid-stream revocation belongs to the
  consumer's producer, which holds the caller context and the store and can stop emitting.
  The analyst's conditional event-time reauthorization is decided against, and the decision
  is pinned: `m4-proof` asserts that a frame naming an agreed identifier delivers without
  any manager read occurring at delivery time.
- **Request order is preserved and duplicates acquire no normalization**, per the analyst's
  risk row. Carrier: `m4-stream`, pinned in `m4-proof`.

The planner's `tasks: boolean` third parameter on `buildSubscriptionFilter` stands — the
supported side has no honest spelling for "any task id", and a boolean matches the
boolean-behaviour law. Carrier: `m4-stream`.

## 3. The notification shape — converged, plus the analyst's drift repairs

**Ruling: `MCPTaskNotificationParams` is `MCPTaskDetail` intersected with an optional
`_meta: MCPNotificationMetaObject` and the open index signature, placed in the tasks family
beside `MCPTaskDetail`; `MCPNotificationMetaObject` sits in the metadata family beside
`MCPResultMetaObject`; the wire builder spreads the detail flat, writes the stamp under
`io.modelcontextprotocol/subscriptionId`, and adds no `params.task` wrapper.** Both lanes
returned this shape independently; the authority fixes it
(`ext-tasks-2026-07-28-schema.ts:298-299`, `ext-tasks-2026-07-28-schema.json:2424-2442`).

The planner's `isMCPTaskNotification` guard is adopted, and its `_meta` decision is made
here rather than left implicit: the guard checks the method literal and
`isMCPTaskDetail(params)`, and checks nothing about `_meta` beyond shape-when-present,
under the foreign-contract openness rule — the stamp is the server's to write, not the
guard's to demand. Carrier: `m4-contract`.

The analyst's authority-drift findings are adopted verbatim as repairs, folded into
`m4-contract` at these coordinates:

- `ttlMs` and `pollIntervalMs` are integer-valued in the authority; the local guards accept
  any finite number (`/home/user/mcp/src/core/validators.ts:1047-1050`, `:1118-1120`).
- A completed task's `result` is an open record in the authority
  (`ext-tasks-2026-07-28-schema.ts:127-136`); the local type and guard require `MCPResult`
  (`/home/user/mcp/src/core/types.ts:805-810`,
  `/home/user/mcp/src/core/validators.ts:1124-1127`).
- The extension capability is exactly an empty object
  (`ext-tasks-2026-07-28-schema.ts:342-350`); `isTaskSupported` accepts non-empty records
  (`/home/user/mcp/src/core/helpers.ts:98-124`).
- `tasks/get` returns `Result & DetailedTask & { resultType: 'complete' }`
  (`ext-tasks-2026-07-28-schema.ts:212-225`); the manager's unstamped `MCPTaskDetail` and
  the wire get result stay distinct, with an explicit projection rather than one collapsed
  signature.

## 4. The verification form — converged

**Ruling: vendor the generated JSON as `tests/mirrors/ext-tasks-2026-07-28-schema.json`,
byte-identical to the staged authority, with its raw SHA-256
`bf30afb7ac251e3e22c037b7a685f60ef6603031b5484c0d08b1fa0bbe86d460` and its `$id`
`https://modelcontextprotocol.io/ext-tasks/2026-07-28/schema.json` pinned in
`tests/setupConformance.ts`; comparison rows in `tests/conformance.test.ts` follow the lsp
precedent; real frames captured from the package's fixture round-trip are compared against
the same authority coordinates; no JSON-Schema validator dependency enters the tree.** The
file name follows the staged authority byte-for-byte, so the analyst's spelling wins over
the planner's shorter one.

The row membership is the union of the lanes' lists: `Task` requiredness with `ttlMs`
nullability and the integer formats, each `TaskStatus` member, each `DetailedTask` variant
with its owed payload, flat `CreateTaskResult` with `resultType: 'task'`, the
`resultType: 'complete'` get, update, and cancel results with the get-result distinctness,
`TaskStatusNotificationParams` flatness and metadata, the request and acknowledged
`taskIds` fragments, the exactly-empty extension capability, the method literals, and the
schema `$id`. A negative control drawn from outside the membership rule reports failure
under the same conditions.

The installed conformance runner is proven task-free from two independent readings — the
analyst's `list --server --spec-version 2026-07-28` run returned no task scenario, and the
planner's search of the installed tree returned zero occurrences — and the record states
that the runner is not task-extension evidence. Carriers: `m4-mirror` for the rows and
pins, `m4-proof` for the wire captures.

## 5. The era sweep — the union of both site lists

**Ruling: every claim that the Tasks extension is draft, lives under
`specification/draft/`, or carries no stability guarantee is replaced with the fact: the
package implements the stable, immutable MCP Tasks extension snapshot dated `2026-07-28`,
extension id `io.modelcontextprotocol/tasks`, generated schema id
`https://modelcontextprotocol.io/ext-tasks/2026-07-28/schema.json`.**

The sweep set is the union of the lanes' lists. Source and test sites — carrier `m4-era`:

- `src/core/types.ts:728-745` (the era comment), `:984-996`, `:1787-1793`, `:1832-1839`,
  `:2409-2430`, `:2569-2577`.
- `src/core/types.ts:2423-2430` also carries the client-prose routing correction: a stamped
  subscribed notification is claimed by `#routeSubscription` before the generic
  `notification` event (`/home/user/mcp/src/core/MCPClient.ts:712-741`), so the prose
  directs subscribed consumers to the `listen` stream. Prose-only; no behavior moves.
- `src/core/validators.ts:1089-1091` — the openness remark's stated reason is rewritten:
  openness stands under the foreign-contract rule, not because the extension is draft.
- `src/core/MCPTaskClient.ts:11-26`, `src/core/MCPServer.ts:124-130`, `:346-350`, `:813`,
  `src/core/MCPClient.ts:136`, `src/core/helpers.ts:96-114`.
- `src/core/constants.ts:63`, `:82-86` — the extension-id TSDoc, keeping the `-32003`
  remark: the staged snapshot does not falsify it, and it becomes a checkable claim.
- `tests/setup.ts:1143`, `:1165`; `tests/src/core/MCPTaskClient.test.ts:20`;
  `tests/src/core/MCPServer.test.ts:4805`, `:4876`;
  `tests/src/core/validators.test.ts:1641`.

Guide sites — carrier `m4-guide`:

- `guides/mcp.md:1321-1327` — the block-quoted DRAFT notice and its closing product
  recommendation, deleted.
- `guides/mcp.md:1523` — the recorded "task notifications are not implemented" gap,
  deleted after `m4-stream` makes it false.
- `guides/mcp.md:324`, `:1447`, `:1852`, `:1870`, `:1955`, `:1958`, `:2086`, `:2962-2964`,
  `:3031`, `:3074` — table cells, surface rows, and section prose.
- `guides/mcp.md:3110-3118` — the guide half of the client-prose routing correction.
- `guides/mcp.md:4057-4074` — the declared non-goal, rewritten rather than deleted: the
  `taskIds` member is named and shipped; the composing envelope stays a named conformance
  gap; the settled flatness sentence stays.

Nothing in the tree names the schema id, so the mirror row set carries it.

## 6. The unit cut — the planner's serial cut, amended

Serial throughout, one writer at a time in the main checkout, each dispatched from a clean
committed baseline, with the whole round held and committed as one behind its audit round
and gate chain.

| Unit | Role and engine | Owns | Depends on |
| --- | --- | --- | --- |
| `m4-era` | `implementer` — Claude Opus 5 (native) | Prose-only corrections: comments and TSDoc in `src/core/types.ts`, `validators.ts`, `constants.ts`, `helpers.ts`, `MCPServer.ts`, `MCPClient.ts`, `MCPTaskClient.ts`; comments and suite titles in `tests/setup.ts`, `tests/src/core/MCPServer.test.ts`, `MCPTaskClient.test.ts`, `validators.test.ts` | — |
| `m4-contract` | `implementer` — Claude Opus 5 (native) | `src/core/types.ts`, `src/core/validators.ts`, `src/core/index.ts`, `src/core/helpers.ts` scoped to `isTaskSupported`, `src/core/MCPTaskClient.ts` scoped to the get-result path, and `tests/src/core/validators.test.ts` with `tests/src/core/MCPTaskClient.test.ts` scoped to the drift-repair and new-guard rows — the filter member, `MCPNotificationMetaObject`, `MCPTaskNotificationParams`, `isMCPTaskNotification`, the extended `isMCPSubscriptionFilter`, and the drift repairs in question 3. Ownership amended 2026-08-26 before dispatch: the exactly-empty capability repair lives in the `isTaskSupported` function, the get-result projection lives in the task client, and the repairs falsify standing validator rows (`tests/src/core/validators.test.ts:1646`, `:1740-1746`), so the unit owns the files its result makes false. | `m4-era` |
| `m4-mirror` | `sol` — GPT-5.6 Sol (bridge) | `tests/mirrors/ext-tasks-2026-07-28-schema.json`, `tests/setupConformance.ts`, `tests/conformance.test.ts` | `m4-contract` |
| `m4-stream` | `sol` — GPT-5.6 Sol (bridge) | `src/core/helpers.ts`, `src/core/MCPServer.ts` — the matcher branch, the guarded admission, the `tasks: boolean` parameter, the derived support fact, the authorize-and-omit acknowledgement | `m4-mirror` |
| `m4-proof` | `implementer` — Claude Opus 5 (native) | `tests/setup.ts`, `tests/src/core/helpers.test.ts`, `validators.test.ts`, `MCPServer.test.ts`, `MCPClient.test.ts` | `m4-stream` |
| `m4-guide` | `implementer` — Claude Opus 5 (native) | `guides/mcp.md`, `tests/guides.test.ts` | `m4-proof` |
| `m4-gates` | `verifier` — Sonnet (native) | nothing | `m4-guide` |

`m4-mirror` precedes `m4-stream` so declaration drift surfaces before wiring builds on it.
The audit round runs `reviewer` (Claude Opus 5) over the Sol-written `m4-mirror` and
`m4-stream`, `analyst` (GPT-5.6 Sol) over the Opus-written `m4-era`, `m4-contract`,
`m4-proof`, and `m4-guide`, and `checker` over the mirror membership and the era-sweep
completeness — so every unit has a lane whose engine did not write it.

The per-unit acceptance criteria are the planner's, with these amendments:

- `m4-contract` additionally closes each drift repair in question 3 at the analyst's
  coordinates, with the failing-then-green proof for each guard change.
- `m4-mirror` uses the analyst's file name and additionally rows the integer formats and
  the get-result distinctness.
- `m4-stream` implements the authorize-and-omit acknowledgement of question 2 in place of
  the planner's verbatim echo: resolution through `task(id, options)` before
  acknowledgement, omission with no distinguishing signal, `-32602` on a malformed array,
  request order preserved, duplicates unnormalized, and no store read at delivery time.
- `m4-proof` pins the question 2 invariants: an identifier the read does not resolve is
  omitted indistinguishably; a frame naming an identifier outside the agreed set is not
  delivered; a frame naming an agreed identifier delivers with no manager read at delivery
  time; the acknowledgement omits the member entirely when the server cannot push tasks.
- `m4-guide` additionally documents the delivery guarantee (from producer delivery onward,
  no replay claim), the entitlement ruling, the fixed-agreed-set lifetime, and the
  composing-envelope conformance gap, and lands the guide half of the client-prose routing
  correction.

**Exit criterion.** M4 ends when each capability has closed on evidence:

1. The extension's era, spec path, and schema id are stated correctly wherever the package
   states them — repaired.
2. Every task-family signature is compared row by row against the staged authority by a
   digest-pinned mirror whose instrument has failed under a control — implemented.
3. `notifications/tasks` reaches a subscribed client through the built-in
   `subscriptions/listen` stream, filtered and stamped, proven end to end with real
   implementations — implemented.
4. `taskIds` enters the filter, the acknowledgement, and the client's `listen` path at its
   verbatim wire spelling — implemented.
5. `MCPTaskManagerInterface` is unchanged, with the reason documented on the interface —
   retained.
6. Acknowledgement entitlement resolves through `task(id, options)` at admission, omission
   is indistinguishable, and the package performs no task resolution at delivery time —
   implemented.
7. The authority drift in question 3 — integer formats, the open completed `result`, the
   exactly-empty capability, the distinct get result — is repaired.
8. The gates run green under an independent `verifier`.

## Risks the implementing briefs carry

- **The composing envelope is undefined in every available source** (`m4-envelope-probe.md`
  settles the search bound). Each brief touching the filter states the package's reading —
  `taskIds` sits directly under `params.notifications`, beside `resourceSubscriptions` — as
  a reading, and the guide names it as a conformance gap rather than settled wire.
- **The omission invariant inverts the oracle risk rather than removing it**: the invariant
  is that omission never distinguishes why. `m4-proof` pins that an unknown, a purged, and
  an unauthorized identifier produce byte-identical acknowledgements, and that no error
  distinguishes them.
- **A future edit that resolves identifiers at delivery time** re-introduces the store on
  the hot path and contradicts the documented fixed-agreed-set lifetime; the `m4-proof`
  assertion that no manager read occurs at delivery is the tripwire.
- **`m4-era` and `m4-contract` both write `src/core/types.ts`** — serialization plus a
  clean baseline before each is the whole mitigation.
- **The fragment's own JSDoc says `tasksStatus` while its declaration says `taskIds`**; the
  ruling follows the declaration and the generated schema, and the guide records the
  authority's internal contradiction beside the conformance gap.
- **A task-frame test drives no child process and opens no listener**, so it is measurable
  inside a bench sandbox; the `m4-proof` brief states that.
- **The derived tasks-support fact has two inputs and no single home**; the
  `MCPSubscriptionFilter` TSDoc and the guide's subscriptions section carry the
  explanation.
