# m4-proof implementation report

Every question-2 invariant is pinned by a named row, each row is bound to the landed code by a
mutation that ran red and a byte-identical restoration that ran green, and `git diff -- src/` is
empty. The gates named in the brief exit `0`.

## Invariants and the rows that pin them

| Invariant | Row | File |
| --- | --- | --- |
| Omission is indistinguishable | `omits an identifier the store refuses, with nothing that says which refusal it was` | `tests/src/core/MCPServer.test.ts` |
| A frame outside the agreed set is not delivered | `delivers a task frame only for an agreed identifier that holds as a snapshot`, and the `task-gamma` half of `carries a task transition to a subscribed client, filtered and stamped` | `tests/src/core/helpers.test.ts`, `tests/src/core/MCPClient.test.ts` |
| An agreed frame delivers with no manager read at delivery | `delivers an agreed identifier with no store read at delivery time` | `tests/src/core/MCPServer.test.ts` |
| The acknowledgement omits `taskIds` when the server cannot push tasks | `omits the member entirely when the server cannot push tasks`, with the helper half in `carries requested task identifiers only when the server can push tasks` | `tests/src/core/MCPServer.test.ts`, `tests/src/core/helpers.test.ts` |
| Request order preserved, duplicates unnormalized | `acknowledges the resolved identifiers in request order with duplicates intact`, with the helper half in `carries requested task identifiers only when the server can push tasks` | `tests/src/core/MCPServer.test.ts`, `tests/src/core/helpers.test.ts` |
| End to end through the built-in stream, filtered and stamped | `carries a task transition to a subscribed client, filtered and stamped` | `tests/src/core/MCPClient.test.ts` |

Each row is named for the behaviour it proves rather than for the mutation or control that
specified it.

### The invariant-1 evidence

Three managers over one store shape produce the acknowledgement: a manager holding nothing (never
existed), a manager whose seeded task was removed by `purge()` (purged), and an `owner-1` manager
dispatched with `caller: 'owner-2'` (unauthorized). The row compares `JSON.stringify` of each
acknowledgement array and asserts one distinct value, asserts `isJSONRPCErrorResponse` is `false`
for every terminal, asserts one distinct terminal, and asserts each refusing manager recorded the
read that produced the omission. The manager is the real `TestTaskManager`, a real
`MCPTaskManagerInterface` implementation over an in-memory store; nothing is replaced.

### The invariant-3 instrument and its control

`TestTaskManager.reads` is a `createRecorder` from `@orkestrel/test`, incremented inside the real
`task` method. The row reads `tasks.reads.count` immediately after the acknowledgement — the
POSITIVE CONTROL, asserted to be `1` — then drives two delivered frames and asserts the count is
unchanged. A recorder that could not observe a read at all fails the control before the silence is
read as meaning anything. Mutation 2 breaks that control, which is recorded in the mutation table.

## Fixture and recorder design

- **Reused and extended, not siblinged.** `TestTaskManager` in `tests/setup.ts` gained `seed(id)`
  and the `reads` recorder. `seed` writes one `working` task under an identifier the scenario
  chooses, carrying the manager's own `ttlMs` and poll hint so a seeded task purges and reads
  exactly as a started one does. It exists because `start` mints a cryptographic identifier, which
  is what the port asks a manager for and what makes it unusable to a scenario that must NAME a
  task before any call exists.
- **`createSubscriptionServer` gained an optional `tasks` parameter**, so one server fixture carries
  both a producer and a manager. Existing two-argument callers are unaffected.
- **`createSubscriptionRequest` gained an optional `notifications` parameter** defaulting to its
  previous literal, so the tasks rows name only the filter they ask for.
- **`MCPServer.test.ts` uses its own `taskServer(task, extra)` helper**, which already accepts a
  `Partial<MCPServerOptions>` and therefore already composed a manager with a producer. No new
  fixture was declared there.

## The unknowns, answered

- **A task-manager fixture already exists.** `tests/setup.ts` exports `TestTaskManager`, and the
  landed tasks-family rows in `MCPServer.test.ts`, `MCPTaskClient.test.ts`, and `setup.test.ts` use
  it. This unit extended it rather than declaring a sibling.
- **`MCPClient.test.ts` needs one row, and it is the end-to-end proof.** The client-side `listen`
  path passes the filter through unchanged and routes a stamped frame through `#routeSubscription`,
  and both facts are already pinned by the landed rows for the other notification families. The
  only client-side behaviour the tasks family adds is that a `taskIds` filter reaches the wire and a
  stamped `notifications/tasks` frame reaches the stream, which is exactly what the end-to-end row
  drives. No further row was added.
- **`validators.test.ts` already pins both guards, so this unit changed nothing in it.**
  `isMCPTaskNotification` admission and refusal are pinned at `tests/src/core/validators.test.ts:1838`
  (flat params, wrapper refused, wrong method refused, request refused, `_meta` shape-when-present,
  hostile corpus). `isMCPSubscriptionFilter` `taskIds` admission and refusal are pinned at `:678`
  and `:697` (array, empty array, order and duplicates, and the string, non-string-member,
  null-member, and object refusals). The one question-2 shape unpinned anywhere was the SERVER's
  `-32602` on a malformed `taskIds`, which is a server-boundary behaviour rather than a guard
  behaviour, so the row for it landed in `MCPServer.test.ts` instead.

## Mutation table

Each mutation was applied to the exact landed line, run under the acceptance command, and restored
by hand. `cmp` against a pre-mutation copy proved each restoration byte-identical.

Command for every row:

```text
npx vitest run --config vite.config.ts --project src:core tests/src/core/helpers.test.ts tests/src/core/validators.test.ts tests/src/core/MCPServer.test.ts tests/src/core/MCPClient.test.ts
```

| Mutation | Site | Red count | Rows reddened | Restored |
| --- | --- | --- | --- | --- |
| Admission branch returns `isMCPTaskNotification(notification)` alone, dropping the agreed-set clause | `src/core/helpers.ts` `matchesSubscriptionNotification` | `2 failed, 594 passed (596)` | `delivers a task frame only for an agreed identifier that holds as a snapshot`; `carries a task transition to a subscribed client, filtered and stamped` | `596 passed (596)`, `cmp` clean |
| Resolution loop deleted, so `buildSubscriptionFilter`'s candidate set is acknowledged unresolved | `src/core/MCPServer.ts` `#subscription` | `3 failed, 593 passed (596)` | `omits an identifier the store refuses, with nothing that says which refusal it was`; `acknowledges the resolved identifiers in request order with duplicates intact`; `delivers an agreed identifier with no store read at delivery time` | `596 passed (596)`, `cmp` clean |

Neither mutation reddened a row beyond the ones named. The third row under mutation 2 is the
delivery-read counter's POSITIVE CONTROL: with no resolution, the count after acknowledgement is
`0` and `expect(resolved).toBe(1)` fails, which is the instrument-can-fail evidence the brief asks
for in place of a separate mutation for that claim. Its no-read-at-delivery assertion is bound by
that control rather than by a mutation, as the brief permits.

Mutation 1 red output:

```text
     × delivers a task frame only for an agreed identifier that holds as a snapshot 18ms
     × carries a task transition to a subscribed client, filtered and stamped 25ms
 FAIL  |src:core| tests/src/core/MCPClient.test.ts > MCPClient — subscriptions/listen > carries a task transition to a subscribed client, filtered and stamped
 FAIL  |src:core| tests/src/core/helpers.test.ts > subscription helpers > delivers a task frame only for an agreed identifier that holds as a snapshot
 Test Files  2 failed | 2 passed (4)
      Tests  2 failed | 594 passed (596)
```

Mutation 2 red output:

```text
     × omits an identifier the store refuses, with nothing that says which refusal it was 34ms
     × acknowledges the resolved identifiers in request order with duplicates intact 3ms
     × delivers an agreed identifier with no store read at delivery time 2ms
 FAIL  |src:core| tests/src/core/MCPServer.test.ts > ... > omits an identifier the store refuses, with nothing that says which refusal it was
 FAIL  |src:core| tests/src/core/MCPServer.test.ts > ... > acknowledges the resolved identifiers in request order with duplicates intact
 FAIL  |src:core| tests/src/core/MCPServer.test.ts > ... > delivers an agreed identifier with no store read at delivery time
 Test Files  1 failed | 3 passed (4)
      Tests  3 failed | 593 passed (596)
```

Restoration proof:

```text
$ cmp src/core/helpers.ts <pre-mutation copy>
helpers.ts byte-identical to baseline
$ cmp src/core/MCPServer.ts <pre-mutation copy>
MCPServer.ts byte-identical to baseline
$ git diff -- src/
(no output, exit 0)
```

## Gate readings

Baselines re-derived on this host before editing, at commit `bef9f40` with a clean tree:

```text
$ npx vitest run --config vite.config.ts --project src:core tests/src/core/helpers.test.ts tests/src/core/validators.test.ts tests/src/core/MCPServer.test.ts tests/src/core/MCPClient.test.ts
 Test Files  4 passed (4)
      Tests  588 passed (588)
$ npx vitest run --config vite.config.ts --project setup
 Test Files  5 passed (5)
      Tests  75 passed (75)
```

Criterion 1 — scoped format check, exit `0`:

```text
$ npx --no-install oxfmt --config .oxfmtrc.json --check tests/setup.ts tests/src/core/helpers.test.ts tests/src/core/validators.test.ts tests/src/core/MCPServer.test.ts tests/src/core/MCPClient.test.ts
Checking formatting...

All matched files use the correct format.
Finished in 42ms on 5 files using 4 threads.
```

Criterion 2 — scoped lint, exit `0`, no output:

```text
$ npx --no-install oxlint --config .oxlintrc.json --deny-warnings tests/setup.ts tests/src/core/helpers.test.ts tests/src/core/validators.test.ts tests/src/core/MCPServer.test.ts tests/src/core/MCPClient.test.ts
exit=0
```

Criterion 3 — typecheck, exit `0`:

```text
$ npm run check
> tsc --noEmit --project tsconfig.json && npm run check:src
> npm run check:src:core && npm run check:src:browser && npm run check:src:server
> tsc --noEmit -p configs/src/tsconfig.core.json
> tsc --noEmit -p configs/src/tsconfig.browser.json
> tsc --noEmit -p configs/src/tsconfig.server.json
exit=0
```

Criterion 4 — the mutation table, recorded earlier, with `git diff -- src/` empty.

Criterion 5 — the scoped suite, exit `0`:

```text
$ npx vitest run --config vite.config.ts --project src:core tests/src/core/helpers.test.ts tests/src/core/validators.test.ts tests/src/core/MCPServer.test.ts tests/src/core/MCPClient.test.ts
 Test Files  4 passed (4)
      Tests  596 passed (596)
```

Every new row was collected and named in that run's verbose output:

```text
 ✓ tests/src/core/helpers.test.ts > subscription helpers > carries requested task identifiers only when the server can push tasks
 ✓ tests/src/core/helpers.test.ts > subscription helpers > delivers a task frame only for an agreed identifier that holds as a snapshot
 ✓ tests/src/core/MCPServer.test.ts > MCPServer — W03-B: the tasks family on a subscriptions/listen stream > omits an identifier the store refuses, with nothing that says which refusal it was
 ✓ tests/src/core/MCPServer.test.ts > MCPServer — W03-B: the tasks family on a subscriptions/listen stream > acknowledges the resolved identifiers in request order with duplicates intact
 ✓ tests/src/core/MCPServer.test.ts > MCPServer — W03-B: the tasks family on a subscriptions/listen stream > omits the member entirely when the server cannot push tasks
 ✓ tests/src/core/MCPServer.test.ts > MCPServer — W03-B: the tasks family on a subscriptions/listen stream > delivers an agreed identifier with no store read at delivery time
 ✓ tests/src/core/MCPServer.test.ts > MCPServer — W03-B: the tasks family on a subscriptions/listen stream > refuses a malformed taskIds member as invalid params before reading the store
 ✓ tests/src/core/MCPClient.test.ts > MCPClient — subscriptions/listen > carries a task transition to a subscribed client, filtered and stamped
```

## Observations beyond the criteria

`tests/setup.ts` is loaded by every project, so two further read-only runs were taken to show the
fixture extension moved nothing else. Neither is an acceptance criterion; the authoritative
whole-tree reading belongs to the independent `verifier`.

```text
$ npx vitest run --config vite.config.ts --project setup
 Test Files  5 passed (5)
      Tests  75 passed (75)
$ npx vitest run --config vite.config.ts --project src:core
 Test Files  16 passed (16)
      Tests  780 passed (780)
$ npx vitest run --config vite.config.ts --project src:server
 Test Files  12 passed (12)
      Tests  315 passed | 1 skipped (316)
```

The `guides` project was not run, per the brief's standing condition.

## Claims flagged for the analyst

1. **`tests/setup.ts` gained two exported behaviours that no sibling `tests/setup.test.ts` row
   proves.** `tests/setup.test.ts` is outside this unit's owned set, and it carries a
   `TestTaskManager` describe block that now covers less than the class exposes. `seed` and `reads`
   are proven only through the consuming rows: an unseeded identifier is the omission case, and a
   recorder that never counted fails the positive control in the delivery row. If the round wants
   the setup project to state those behaviours directly, that is a successor unit owning
   `tests/setup.test.ts`.
2. **The `-32602` malformed-`taskIds` row is an addition beyond the brief's six numbered
   invariants.** It is a question-2 ruling from the reconciliation, it was unpinned at the server
   boundary, and unknown 3 authorizes extending where a question-2 shape is unpinned. It reddens
   under neither mutation, because it exercises the pre-existing `isMCPSubscriptionFilter` gate in
   `#subscribe` rather than either mutated site.
3. **The end-to-end row asserts the client request id is `2`.** That is the landed convention of
   every sibling row in the same describe block (`server/discover` is `1`), not a fact this unit
   established.
4. **The invariant-1 byte-identity comparison is over `JSON.stringify` of the yielded
   acknowledgement array**, which compares serialized bytes rather than wire bytes. The three cases
   run against three separately constructed servers carrying the same identity, so a difference in
   the server's own identity would not be caught; nothing in the scenario varies it.

## Deviation state

No deviation. No pinned invariant failed against the landed code without a mutation, so nothing was
routed back to the round. No file outside the owned set was written; `src/` was touched only inside
the two mutation windows and is byte-identical to `bef9f40`.

## Review evidence

### `git status --short`

```text
 M tests/setup.ts
 M tests/src/core/MCPClient.test.ts
 M tests/src/core/MCPServer.test.ts
 M tests/src/core/helpers.test.ts
```

### `git diff -- src/`

Empty, exit `0`.

### `git diff`

```diff
diff --git a/tests/setup.ts b/tests/setup.ts
index e694b62..250814b 100644
--- a/tests/setup.ts
+++ b/tests/setup.ts
@@ -3,6 +3,7 @@
 // `tests/setupServer.ts`.
 
 import type { SSEEvent } from '@orkestrel/sse'
+import type { RecorderInterface } from '@orkestrel/test'
 import type { ToolManagerInterface } from '@orkestrel/tool'
 import type {
 	MCPClientTransportEventMap,
@@ -46,7 +47,7 @@ import {
 import { createTool, createToolManager } from '@orkestrel/tool'
 import { createEmitter } from '@orkestrel/emitter'
 import { createSSEParser } from '@orkestrel/sse'
-import { waitForDelay } from '@orkestrel/test'
+import { createRecorder, waitForDelay } from '@orkestrel/test'
 
 /**
  * Narrow an untyped value to an {@link MCPMethodHandler} the way a DYNAMIC registration must.
@@ -727,13 +728,17 @@ export function createHostilePeer(server: MCPServerInterface): HostilePeerInterf
  * scenario opens its exchange with.
  *
  * @param id - The request id the exchange is correlated by
+ * @param notifications - The filter the request asks for. Default: `{ toolsListChanged: true }`
  * @returns The modern subscription request
  */
-export function createSubscriptionRequest(id: JSONRPCId): JSONRPCRequest {
+export function createSubscriptionRequest(
+	id: JSONRPCId,
+	notifications: MCPSubscriptionFilter = { toolsListChanged: true },
+): JSONRPCRequest {
 	return createJSONRPCRequest({
 		method: 'subscriptions/listen',
 		id,
-		params: { notifications: { toolsListChanged: true }, _meta: MODERN_METADATA },
+		params: { notifications, _meta: MODERN_METADATA },
 	})
 }
 
@@ -920,8 +925,17 @@ export interface MCPTestLoopbackInterface extends MCPClientTransportInterface {
 /**
  * Creates a real MCP server whose subscription source is supplied by the test scenario.
  *
+ * @remarks
+ * `tasks` is what turns the task family of the filter on, and supplying it is the ONLY door:
+ * the server derives task-stream support from a configured manager beside a configured
+ * producer, so a scenario that omits the manager is the negative half of that derivation
+ * rather than a differently configured server. The manager also authorizes each requested
+ * identifier before the acknowledgement agrees to it, so the store a scenario seeds is what
+ * decides the acknowledged set.
+ *
  * @param listen - The real server subscription producer
  * @param notifications - The notification families the server advertises
+ * @param tasks - The durable store the server resolves requested task identifiers through
  * @returns A real in-process MCP server with the built-in subscription method registered
  */
 export function createSubscriptionServer(
@@ -932,11 +946,13 @@ export function createSubscriptionServer(
 		resourcesListChanged: true,
 		resourceSubscriptions: ['resource://one', 'resource://two'],
 	},
+	tasks?: MCPTaskManagerInterface,
 ): MCPServerInterface {
 	return createMCPServer({
 		identity: { name: 'subscription-server', version: '1.0.0' },
 		tools: createToolManager(),
 		subscription: { notifications, listen },
+		...(tasks === undefined ? {} : { task: { tasks, defer: () => undefined } }),
 	})
 }
 
@@ -1211,6 +1227,7 @@ export class TestTaskManager implements MCPTaskManagerInterface {
 	readonly #guarded: boolean
 	readonly #ttl: number | null
 	readonly #poll: number | undefined
+	readonly #reads = createRecorder<readonly [string]>()
 	#instant = 0
 
 	constructor(options: TestTaskOptions = {}) {
@@ -1233,6 +1250,20 @@ export class TestTaskManager implements MCPTaskManagerInterface {
 		return [...this.#details.values()]
 	}
 
+	/**
+	 * Every identifier {@link task} was asked to resolve, in call order.
+	 *
+	 * @remarks
+	 * The store is the ONLY place a task resolution can be observed from, so this recorder is
+	 * what a claim about WHEN the package reads the store is measured against. Read the count
+	 * at two moments and compare them: a count that rose proves the recorder sees a read at
+	 * all, and a count that then held proves the reads a scenario is asserting the absence of
+	 * did not happen.
+	 */
+	get reads(): RecorderInterface<readonly [string]> {
+		return this.#reads
+	}
+
 	/** Await every started worker — the deterministic stand-in for polling `tasks/get`. */
 	async settle(): Promise<void> {
 		await Promise.all([...this.#running])
@@ -1252,6 +1283,35 @@ export class TestTaskManager implements MCPTaskManagerInterface {
 		}
 	}
 
+	/**
+	 * Write one `working` task into the store under an identifier the scenario chooses.
+	 *
+	 * @remarks
+	 * The identifiers {@link start} mints are cryptographic and unpredictable, which is what the
+	 * port asks a manager for and what makes them useless to a scenario that must NAME a task
+	 * before any call exists — a subscription filter carries identifiers a client already holds.
+	 * A store writing a task out of band is what a durable store does, so this is the ordinary
+	 * case rather than a shortcut: the task carries this manager's own `ttlMs` and poll hint,
+	 * so a seeded task purges and reads exactly as a started one does. It runs no worker, so it
+	 * stays `working` until {@link abort} moves it and {@link settle} is unaffected.
+	 *
+	 * @param id - The `taskId` the store files the task under
+	 * @returns The stored snapshot
+	 */
+	seed(id: string): MCPTaskDetail {
+		const stamp = this.#stamp()
+		const detail: MCPTaskDetail = {
+			taskId: id,
+			status: 'working',
+			createdAt: stamp,
+			lastUpdatedAt: stamp,
+			ttlMs: this.#ttl,
+			...(this.#poll === undefined ? {} : { pollIntervalMs: this.#poll }),
+		}
+		this.#details.set(id, detail)
+		return detail
+	}
+
 	async start(key: string, context: MCPTaskContext, options: MCPMethodOptions): Promise<MCPTask> {
 		this.#starts.push([key, context, options])
 		const existing = this.#identifiers.get(key)
@@ -1302,6 +1362,7 @@ export class TestTaskManager implements MCPTaskManagerInterface {
 	// Distinguishing them HERE — by throwing for the unauthorized case, say — is what would
 	// turn the store into an enumeration oracle, so it does not.
 	async task(id: string, options?: MCPMethodOptions): Promise<MCPTaskDetail | undefined> {
+		this.#reads.handler(id)
 		if (this.#guarded && options?.caller !== this.#owner) return undefined
 		return this.#details.get(id)
 	}
diff --git a/tests/src/core/MCPClient.test.ts b/tests/src/core/MCPClient.test.ts
index 3bbd81a..da25540 100644
--- a/tests/src/core/MCPClient.test.ts
+++ b/tests/src/core/MCPClient.test.ts
@@ -37,6 +37,7 @@ import {
 	createInputServer,
 	createLoopbackTransport,
 	createSubscriptionServer,
+	TestTaskManager,
 } from '../../setup.js'
 
 const NATIVE_ABORT_TIMEOUT = AbortSignal.timeout
@@ -3455,6 +3456,87 @@ describe('MCPClient — subscriptions/listen', () => {
 		})
 	})
 
+	// END TO END, with nothing replaced: a consumer's durable store, a consumer's producer, the
+	// server's built-in stream, a real in-process transport, and a real client. The identifier a
+	// producer names is what decides delivery, and the agreed set was fixed by a store read that
+	// happened once, before the first frame existed.
+	it('carries a task transition to a subscribed client, filtered and stamped', async () => {
+		const tasks = new TestTaskManager()
+		tasks.seed('task-alpha')
+		tasks.seed('task-beta')
+		const source = new TransformStream<JSONRPCNotification, JSONRPCNotification>()
+		const server = createSubscriptionServer(() => source.readable, {}, tasks)
+		const transport = createLoopbackTransport(server)
+		const client = createMCPClient({ transport })
+		await client.connect()
+		const stream = client.listen(
+			{ taskIds: ['task-alpha', 'task-beta'] },
+			{ signal: new AbortController().signal },
+		)
+		const writer = source.writable.getWriter()
+
+		const acknowledgement = await stream.next()
+		// Read after the acknowledgement resolved the set and before any frame is produced —
+		// the reading every delivery below is compared against. The positive control proving
+		// this counter can move at all is in tests/src/core/MCPServer.test.ts.
+		const resolved = tasks.reads.count
+		for (const taskId of ['task-alpha', 'task-gamma', 'task-beta']) {
+			await writer.write({
+				jsonrpc: '2.0',
+				method: 'notifications/tasks',
+				params: {
+					taskId,
+					status: 'working',
+					createdAt: '1970-01-01T00:00:01.000Z',
+					lastUpdatedAt: '1970-01-01T00:00:02.000Z',
+					ttlMs: null,
+				},
+			})
+		}
+		await writer.close()
+
+		expect(acknowledgement.value).toEqual({
+			jsonrpc: '2.0',
+			method: 'notifications/subscriptions/acknowledged',
+			params: {
+				notifications: { taskIds: ['task-alpha', 'task-beta'] },
+				_meta: { [MCP_META_SUBSCRIPTION]: 2 },
+			},
+		})
+		expect((await stream.next()).value).toEqual({
+			jsonrpc: '2.0',
+			method: 'notifications/tasks',
+			params: {
+				taskId: 'task-alpha',
+				status: 'working',
+				createdAt: '1970-01-01T00:00:01.000Z',
+				lastUpdatedAt: '1970-01-01T00:00:02.000Z',
+				ttlMs: null,
+				_meta: { [MCP_META_SUBSCRIPTION]: 2 },
+			},
+		})
+		// `task-gamma` was produced between the two, and the client never sees it: the next read
+		// is `task-beta`, so the frame naming an identifier outside the agreed set was dropped.
+		expect((await stream.next()).value).toMatchObject({
+			method: 'notifications/tasks',
+			params: { taskId: 'task-beta', _meta: { [MCP_META_SUBSCRIPTION]: 2 } },
+		})
+		expect(await stream.next()).toEqual({
+			done: true,
+			value: {
+				resultType: 'complete',
+				_meta: {
+					[MCP_META_SUBSCRIPTION]: 2,
+					'io.modelcontextprotocol/serverInfo': {
+						name: 'subscription-server',
+						version: '1.0.0',
+					},
+				},
+			},
+		})
+		expect(tasks.reads.count).toBe(resolved)
+	})
+
 	it('keeps concurrent subscriptions isolated by their stamped request ids', async () => {
 		const tools = new TransformStream<JSONRPCNotification, JSONRPCNotification>()
 		const resources = new TransformStream<JSONRPCNotification, JSONRPCNotification>()
diff --git a/tests/src/core/MCPServer.test.ts b/tests/src/core/MCPServer.test.ts
index d3fec90..4cce96a 100644
--- a/tests/src/core/MCPServer.test.ts
+++ b/tests/src/core/MCPServer.test.ts
@@ -75,6 +75,7 @@ import {
 	createJSONRPCNotification,
 	createJSONRPCRequest,
 	createHostilePeer,
+	createSubscriptionRequest,
 	isMCPMethodHandler,
 	MODERN_METADATA,
 	MemoryResourceManager,
@@ -6223,6 +6224,195 @@ describe('MCPServer — W03-B: the contract obligations MCP cannot enforce', ()
 	})
 })
 
+// The junction of the two families: a `subscriptions/listen` request naming task identifiers.
+// The AGREED SET is decided once, at acknowledgement, by reading the consumer's durable store —
+// and it is the same set the delivery matcher is handed, so an acknowledgement that names an
+// identifier is a promise the stream keeps and an omission is a promise never made.
+describe('MCPServer — W03-B: the tasks family on a subscriptions/listen stream', () => {
+	// The oracle risk INVERTED: the invariant is not that a caller learns nothing, it is that an
+	// omission never says WHICH refusal produced it. The port collapses never-existed, purged,
+	// and not-yours into one `undefined`, so the acknowledgement must collapse them too.
+	it('omits an identifier the store refuses, with nothing that says which refusal it was', async () => {
+		const purged = new TestTaskManager({ ttl: 60_000 })
+		purged.seed('task-ghost')
+		purged.purge()
+		const guarded = new TestTaskManager({ owner: 'owner-1' })
+		guarded.seed('task-ghost')
+		const request = createSubscriptionRequest('listen-omit', { taskIds: ['task-ghost'] })
+		const acknowledgements: string[] = []
+		const terminals: string[] = []
+		const errors: boolean[] = []
+
+		for (const tasks of [new TestTaskManager(), purged, guarded]) {
+			const closed = new TransformStream<JSONRPCNotification, JSONRPCNotification>()
+			await closed.writable.close()
+			const mcp = taskServer(
+				{ tasks, defer: () => undefined },
+				{ subscription: { notifications: {}, listen: () => closed.readable } },
+			)
+			const [messages, response] = await drainStream(
+				streamOf(await mcp.dispatch(request, { caller: 'owner-2' })),
+			)
+			acknowledgements.push(JSON.stringify(messages))
+			terminals.push(JSON.stringify(response))
+			errors.push(isJSONRPCErrorResponse(response))
+		}
+
+		// The never-existed, the purged, and the unauthorized read produce the SAME bytes, so a
+		// caller holding all three acknowledgements can separate none of them.
+		expect(new Set(acknowledgements).size).toBe(1)
+		expect(JSON.parse(acknowledgements[0] ?? 'null')).toEqual([
+			{
+				jsonrpc: '2.0',
+				method: 'notifications/subscriptions/acknowledged',
+				params: { notifications: {}, _meta: { [MCP_META_SUBSCRIPTION]: 'listen-omit' } },
+			},
+		])
+		// And nothing else distinguishes them: no error arm, and one identical terminal.
+		expect(errors).toEqual([false, false, false])
+		expect(new Set(terminals).size).toBe(1)
+		// The omission came from a REFUSED READ rather than from a member nobody looked at.
+		expect(purged.reads.calls).toEqual([['task-ghost']])
+		expect(guarded.reads.calls).toEqual([['task-ghost']])
+	})
+
+	it('acknowledges the resolved identifiers in request order with duplicates intact', async () => {
+		const tasks = new TestTaskManager()
+		tasks.seed('task-b')
+		tasks.seed('task-a')
+		const closed = new TransformStream<JSONRPCNotification, JSONRPCNotification>()
+		await closed.writable.close()
+		const mcp = taskServer(
+			{ tasks, defer: () => undefined },
+			{ subscription: { notifications: {}, listen: () => closed.readable } },
+		)
+
+		const [messages] = await drainStream(
+			streamOf(
+				await mcp.dispatch(
+					createSubscriptionRequest('listen-order', {
+						taskIds: ['task-b', 'task-gone', 'task-a', 'task-b'],
+					}),
+				),
+			),
+		)
+
+		// Request order survives, the duplicate survives as a duplicate, and only the identifier
+		// the store refused is gone.
+		expect(messages[0]?.params?.['notifications']).toEqual({
+			taskIds: ['task-b', 'task-a', 'task-b'],
+		})
+		// One read per requested entry, in request order: the resolution deduplicates nothing
+		// either, so a normalization added anywhere in the path reddens here.
+		expect(tasks.reads.calls).toEqual([['task-b'], ['task-gone'], ['task-a'], ['task-b']])
+	})
+
+	// The DERIVED support fact, from both sides. Neither half alone can honour the member, and
+	// no third flag records the conclusion — so each half's absence is proven separately.
+	it('omits the member entirely when the server cannot push tasks', async () => {
+		const tasks = new TestTaskManager()
+		tasks.seed('task-a')
+		const closed = new TransformStream<JSONRPCNotification, JSONRPCNotification>()
+		await closed.writable.close()
+		// A producer with no manager: nothing can authorize an identifier.
+		const unmanaged = server(undefined, { notifications: {}, listen: () => closed.readable })
+		// A manager with no producer: nothing can carry a transition.
+		const unproduced = taskServer({ tasks, defer: () => undefined })
+		const request = createSubscriptionRequest('listen-off', { taskIds: ['task-a'] })
+
+		const [fromUnmanaged] = await drainStream(streamOf(await unmanaged.dispatch(request)))
+		const [fromUnproduced] = await drainStream(streamOf(await unproduced.dispatch(request)))
+
+		expect(fromUnmanaged[0]?.params?.['notifications']).toEqual({})
+		expect(fromUnproduced[0]?.params?.['notifications']).toEqual({})
+		// A server that cannot push tasks reads no store at all, so the omission is not a
+		// resolution that happened to refuse everything.
+		expect(tasks.reads.count).toBe(0)
+	})
+
+	// The tripwire for the fixed-agreed-set lifetime. A future edit that re-resolves identifiers
+	// at delivery puts the durable store on the hot path of every frame, and this is what sees it.
+	it('delivers an agreed identifier with no store read at delivery time', async () => {
+		const tasks = new TestTaskManager()
+		tasks.seed('task-live')
+		const source = new TransformStream<JSONRPCNotification, JSONRPCNotification>()
+		const writer = source.writable.getWriter()
+		const mcp = taskServer(
+			{ tasks, defer: () => undefined },
+			{ subscription: { notifications: {}, listen: () => source.readable } },
+		)
+		const stream = streamOf(
+			await mcp.dispatch(createSubscriptionRequest('listen-live', { taskIds: ['task-live'] })),
+		)
+
+		const acknowledgement = await stream.next()
+		if (acknowledgement.done) throw new Error('expected a subscription acknowledgement')
+		// THE POSITIVE CONTROL. Acknowledgement resolves the identifier, so a counter that could
+		// not see a store read would read zero here and the silence below would mean nothing.
+		const resolved = tasks.reads.count
+		const drained = drainStream(stream)
+		for (const at of ['1970-01-01T00:00:02.000Z', '1970-01-01T00:00:03.000Z']) {
+			await writer.write({
+				jsonrpc: '2.0',
+				method: 'notifications/tasks',
+				params: {
+					taskId: 'task-live',
+					status: 'working',
+					createdAt: '1970-01-01T00:00:01.000Z',
+					lastUpdatedAt: at,
+					ttlMs: null,
+				},
+			})
+		}
+		await writer.close()
+		const [messages] = await drained
+
+		expect(resolved).toBe(1)
+		expect(acknowledgement.value.params?.['notifications']).toEqual({ taskIds: ['task-live'] })
+		expect(
+			messages.map((frame) => [frame.params?.['lastUpdatedAt'], frame.params?.['_meta']]),
+		).toEqual([
+			['1970-01-01T00:00:02.000Z', { [MCP_META_SUBSCRIPTION]: 'listen-live' }],
+			['1970-01-01T00:00:03.000Z', { [MCP_META_SUBSCRIPTION]: 'listen-live' }],
+		])
+		// Delivering two frames read the store exactly as often as delivering none did.
+		expect(tasks.reads.count).toBe(resolved)
+	})
+
+	it('refuses a malformed taskIds member as invalid params before reading the store', async () => {
+		const tasks = new TestTaskManager()
+		const closed = new TransformStream<JSONRPCNotification, JSONRPCNotification>()
+		await closed.writable.close()
+		const mcp = taskServer(
+			{ tasks, defer: () => undefined },
+			{ subscription: { notifications: {}, listen: () => closed.readable } },
+		)
+
+		const refusals = await Promise.all(
+			[{ taskIds: 'task-a' }, { taskIds: ['task-a', 7] }, { taskIds: {} }].map(
+				async (notifications) =>
+					responseOf(
+						await mcp.dispatch(
+							createJSONRPCRequest({
+								method: 'subscriptions/listen',
+								id: 'listen-bad',
+								params: { notifications, _meta: MODERN_METADATA },
+							}),
+						),
+					)?.error?.code,
+			),
+		)
+
+		expect(refusals).toEqual([
+			JSONRPC_INVALID_PARAMS,
+			JSONRPC_INVALID_PARAMS,
+			JSONRPC_INVALID_PARAMS,
+		])
+		// A refused request never reaches the resolution, so a malformed array is not a probe.
+		expect(tasks.reads.count).toBe(0)
+	})
+})
+
 describe('the held-open stream contract', () => {
 	it('yields notifications, returns a response, and accepts nothing', () => {
 		expectTypeOf<MCPStream>().toEqualTypeOf<
diff --git a/tests/src/core/helpers.test.ts b/tests/src/core/helpers.test.ts
index 3558aea..54326a3 100644
--- a/tests/src/core/helpers.test.ts
+++ b/tests/src/core/helpers.test.ts
@@ -583,6 +583,65 @@ describe('subscription helpers', () => {
 		).toBe(false)
 	})
 
+	// The tasks family is the one filter member the server cannot honour from its own
+	// configuration alone, so the candidate set is gated by a boolean the caller derives rather
+	// than by an intersection against a supported list. The supported filter's own `taskIds`
+	// is therefore never consulted — asserted here so an intersection added later reddens.
+	it('carries requested task identifiers only when the server can push tasks', () => {
+		const requested = { toolsListChanged: true, taskIds: ['task-b', 'task-a', 'task-b'] }
+		const supported = { toolsListChanged: true, taskIds: ['task-z'] }
+
+		expect(buildSubscriptionFilter(requested, supported)).toEqual({ toolsListChanged: true })
+		expect(buildSubscriptionFilter(requested, supported, true)).toEqual({
+			toolsListChanged: true,
+			// Request order and duplicates are the caller's, and the candidate set normalizes
+			// neither — the acknowledged set is compared against this order downstream.
+			taskIds: ['task-b', 'task-a', 'task-b'],
+		})
+		// An empty request asks for no task at all rather than for every task, so the member is
+		// omitted entirely instead of acknowledged as an empty array.
+		expect(Object.hasOwn(buildSubscriptionFilter({ taskIds: [] }, {}, true), 'taskIds')).toBe(false)
+	})
+
+	// The ADMISSION half of the tasks family, and both of its halves are load-bearing: the guard
+	// decides the producer frame holds together as a snapshot, and the AGREED SET decides whether
+	// this subscription asked for that snapshot at all.
+	it('delivers a task frame only for an agreed identifier that holds as a snapshot', () => {
+		const detail = {
+			taskId: 'task-agreed',
+			status: 'working',
+			createdAt: '1970-01-01T00:00:01.000Z',
+			lastUpdatedAt: '1970-01-01T00:00:01.000Z',
+			ttlMs: null,
+		}
+		const frame: JSONRPCNotification = {
+			jsonrpc: '2.0',
+			method: 'notifications/tasks',
+			params: detail,
+		}
+		const filter: MCPSubscriptionFilter = { taskIds: ['task-agreed'] }
+
+		expect(matchesSubscriptionNotification(frame, filter)).toBe(true)
+		// Outside the agreed set: the same well-formed snapshot under a different identifier.
+		expect(
+			matchesSubscriptionNotification(
+				{ ...frame, params: { ...detail, taskId: 'task-other' } },
+				filter,
+			),
+		).toBe(false)
+		// A filter that agreed to no task admits none, and neither spelling of "none" is a
+		// spelling of "every".
+		expect(matchesSubscriptionNotification(frame, {})).toBe(false)
+		expect(matchesSubscriptionNotification(frame, { taskIds: [] })).toBe(false)
+		// The guard's half: an agreed identifier whose params are not a snapshot is still refused.
+		expect(
+			matchesSubscriptionNotification({ ...frame, params: { taskId: 'task-agreed' } }, filter),
+		).toBe(false)
+		expect(matchesSubscriptionNotification({ ...frame, params: { task: detail } }, filter)).toBe(
+			false,
+		)
+	})
+
 	it('stamps notifications while preserving metadata and overriding an offered stream id', () => {
 		expect(
 			stampSubscriptionNotification(
```
