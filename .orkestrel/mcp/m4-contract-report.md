# Unit m4-contract — report

**State: DEVIATION. The surface and every drift repair landed; three rows the repairs falsify sit
in files this brief made off-limits, so `npm run check` and `npm run test:src:core` stay red on
exactly those rows and on nothing else. Exact patches for all three are in § Off-limits patches.**

## What changed, per file

`src/core/types.ts` — added `taskIds?: readonly string[]` to `MCPSubscriptionFilter` with the wire
placement stated as this package's reading and the derived both-configured support fact; added
`MCPNotificationMetaObject` beside `MCPResultMetaObject` with the reserved subscription key
OPTIONAL; added `MCPTaskDetailResult` and `MCPTaskNotificationParams` beside `MCPTaskDetail`;
widened a completed task's `result` from `MCPResult` to `Readonly<Record<string, unknown>>` and
rewrote the remark that justified the old shape.

`src/core/validators.ts` — added `isMCPNotificationMetaObject`, `isMCPTaskDetailResult`, and
`isMCPTaskNotification`; extended `isMCPSubscriptionFilter` with one `taskIds` clause in the exact
shape of the `resourceSubscriptions` clause; tightened `ttlMs` and `pollIntervalMs` from
`isFiniteNumber` to `isInteger` in `isMCPTaskResult` and `isMCPTaskDetail`; changed the completed
arm from `isMCPResult(detail['result'])` to `isRecord(detail['result'])`. Each TSDoc states the
repaired rule.

`src/core/helpers.ts` — `isTaskSupported` now requires the declaration to be an EXACTLY EMPTY
record. Scoped to that function; nothing else in the file moved.

`src/core/MCPTaskClient.ts` — the `tasks/get` read path narrows with `isMCPTaskDetailResult`
instead of `isMCPTaskDetail`, and the import changed with it. Scoped to that path.

`src/core/index.ts` — UNCHANGED. It is a star-export barrel
(`export * from './types.js'`, `export * from './validators.js'`), so every symbol added to those
modules is already published. Criterion 5 is met without an edit; the symbols are named in
§ New public symbols.

`tests/src/core/validators.test.ts` — the red-first drift-repair rows, the two re-ruled standing
rows, the new-guard rows for `isMCPTaskDetailResult`, `isMCPTaskNotification`, and
`isMCPNotificationMetaObject`, `taskIds` rows on the filter suite, and the three new guards
registered in `PUBLISHED_GUARDS` and its import block.

`tests/src/core/MCPTaskClient.test.ts` — two direct-request fixtures re-ruled to send the stamp a
peer sends, a red-first row refusing an unstamped and a `resultType: 'task'` answer, and a row
pinning that the peer's stamp and `_meta` reach the caller unstripped.

## Red-first table

Every repair ran red against the standing guard before the fix and green after. Commands are exact.

| Repair | Command | Before | After |
| --- | --- | --- | --- |
| Exactly-empty capability | `npx vitest run --config vite.config.ts --no-cache --reporter=dot --project src:core tests/src/core/validators.test.ts -t 'reads the extension declaration as presence under the extensions record'` | 1 failed, 134 skipped — `expected true to be false` at `validators.test.ts:1648` | passing, inside the green `test:src:core` run |
| Integer `ttlMs` / `pollIntervalMs`, creation result | `npx vitest run --config vite.config.ts --no-cache --reporter=dot --project src:core tests/src/core/validators.test.ts -t 'validates a task-creation result and rejects every member defect'` | exit 1, 1 failed, 134 skipped | passing |
| Integer durations plus open completed `result`, snapshot | `npx vitest run --config vite.config.ts --no-cache --reporter=dot --project src:core tests/src/core/validators.test.ts -t 'validates a task snapshot and enforces the payload its status owes'` | exit 1, 1 failed, 134 skipped — `expected true to be false` | passing |
| Distinct `tasks/get` wire result | `npx vitest run --config vite.config.ts --no-cache --reporter=dot --project src:core tests/src/core/MCPTaskClient.test.ts -t 'refuses a peer answer that carries no completed-result stamp'` | exit 1, 1 failed, 13 skipped — `expected false to be -32602` | passing |

One further red arrived unbidden and is the suite's own mechanism working: the published-guard
census at `validators.test.ts` reported
`expected [ 'isMCPNotificationMetaObject', 'isMCPTaskDetailResult', 'isMCPTaskNotification' ] to
deeply equal []`. Registering the three guards in `PUBLISHED_GUARDS` closed it.

## Re-ruled rows, with reasons

| Row | Was | Is | Reason |
| --- | --- | --- | --- |
| `validators.test.ts` — `isTaskSupported({ extensions: { tasks: { later: {} } } })` (was `:1646`) | `true` | `false` | The authority types the capability `Record<string, never>` (`ext-tasks-2026-07-28-schema.ts:342-350`). A member under the key is a peer declaring an option the extension does not define, not forward compatibility this package owes. A second row with `{ enabled: true }` was added beside it. |
| `validators.test.ts` — completed detail whose `result` carries a malformed `_meta` (was `:1740-1746`) | `false` | `true` | The authority declares `result: { [key: string]: unknown }` (`ext-tasks-2026-07-28-schema.ts:127-136`). Nothing inside that record is the guard's to enforce, `_meta` included. Rows for `result: {}`, an arbitrary payload, and the non-object refusals (`'done'`, `null`, `[]`) were added beside it. |
| `MCPTaskClient.test.ts` — the direct-request fixture in `issues the wire methods through the request door it was handed` | returned a bare detail | returns the detail plus `resultType: 'complete'` | The wire `tasks/get` answer is `Result & DetailedTask & { resultType: 'complete' }` (`ext-tasks-2026-07-28-schema.ts:212-225`), so a fixture standing in for a peer owes the stamp a peer sends. |
| `MCPTaskClient.test.ts` — the malformed-completed fixture in `refuses a peer answer that is not a well-formed task` | returned a bare malformed detail | returns the same payload plus the stamp | Same reason. The row's claim is the missing `result`, so the stamp is added to keep the refusal attributable to that defect rather than to the missing stamp. |

## Decisions this brief delegated

**`arrayOf(isString)` narrows to `readonly string[]` with no new combinator.** The installed
declaration is
`export declare function arrayOf<T>(elementGuard: Guard<T>): Guard<readonly T[]>`
(`node_modules/@orkestrel/contract/dist/src/core/index.d.ts:107`), so the sibling
`resourceSubscriptions` clause was already narrowing to the readonly array, and the `taskIds`
clause is its exact copy. Nothing was added.

**The get-result repair is a distinct type AND a projection, not one or the other.**
`MCPTaskDetailResult` is declared in the tasks family beside `MCPTaskDetail`, `isMCPTaskDetailResult`
guards it, and `MCPTaskClient.task` validates the reply at the wire type while its declared return
stays `MCPTaskDetail`. The projection is at the TYPE, and the value travels whole:
`.claude/rules/patterns.md` § Foreign contracts says "Narrow nothing in an ownership transform", so
stripping the peer's `resultType` and `_meta` on the way through would be the rule's own defect. A
row in `MCPTaskClient.test.ts` pins that both members reach the caller.

**The name is `MCPTaskDetailResult`, not `MCPTaskGetResult`.** `MCPTaskResult` already names the
creation answer, so the read answer needs its own entity. `{Entity}Result` over the entity the
result carries is the form the type table fixes, and the family already reads
`MCPTask` → `MCPTaskDetail` → the wire shapes carrying them.

**`isMCPTaskNotification` predicates on an intersection of already-public names**, not on bare
`JSONRPCNotification`: `value is JSONRPCNotification & { readonly method: 'notifications/tasks';
readonly params: MCPTaskNotificationParams }`. `isModernRequest` is the file's precedent for the
narrower alternative, and it was refused here because the whole consumer of this guard is the
`m4-stream` matcher branch that then reads `params.taskId`; a `JSONRPCNotification` predicate hands
that branch `unknown` and makes it narrow the params a second time. No new exported symbol was
created — both halves of the intersection are names this unit already publishes.

**`'notifications/tasks'` is written as a literal** rather than as a constant, because
`src/core/constants.ts` is off-limits and `isInitializeRequest` (`validators.ts`) is the file's
precedent for an inline method literal.

**`isMCPNotificationMetaObject` was added** because `MCPTaskNotificationParams` declares
`_meta?: MCPNotificationMetaObject` and `isMCPTaskNotification` needs the shape-when-present check.
Writing that check inline would duplicate `isMCPResultMetaObject`'s shape in a second place.

## New public symbols

Each reaches the barrel through the existing `export * from './types.js'` and
`export * from './validators.js'` rows in `src/core/index.ts`:

- Types: `MCPNotificationMetaObject`, `MCPTaskDetailResult`, `MCPTaskNotificationParams`.
- Guards: `isMCPNotificationMetaObject`, `isMCPTaskDetailResult`, `isMCPTaskNotification`.
- Member: `MCPSubscriptionFilter.taskIds`.

## Gate readings

Run in the acceptance order, each read bare.

| Gate | Exit | Reading |
| --- | --- | --- |
| `npm run format:check` | 0 | `All matched files use the correct format.` — 217 files |
| `npm run lint:check` | 0 | no diagnostics |
| `npm run check` | 2 | ONE diagnostic, in an off-limits file: `tests/src/core/helpers.test.ts(1619,4): error TS2344` — the filter key-set pin does not admit `taskIds` |
| `npm run test:src:core` | 1 | `Test Files 1 failed \| 15 passed (16)`, `Tests 2 failed \| 770 passed (772)`. Both failures are in the off-limits `tests/src/core/MCPServer.test.ts`. Baseline before the unit: 767 passed, 16 files, exit 0. |

Every row inside this unit's owned files is green. The three red rows are the deviation.

## Deviation

**Expected.** The brief scoped the unit to `src/core/types.ts`, `validators.ts`, `index.ts`,
`helpers.ts` at `isTaskSupported`, `MCPTaskClient.ts` at the `tasks/get` path, and the two named
test files, with "every other file" off-limits, and named the falsified set as an unknown to derive
by running the suite.

**Found.** Three rows outside those files are falsified by repairs the brief mandates. None can be
closed without editing an off-limits file, and each is a one-place edit.

**Exact evidence.**

1. `tests/src/core/helpers.test.ts:1617-1619` pins `keyof MCPSubscriptionFilter` to a closed union.
   Adding the mandated `taskIds` member falsifies it at compile time:
   `tests/src/core/helpers.test.ts(1619,4): error TS2344: Type '"toolsListChanged" | "promptsListChanged" | "resourcesListChanged" | "resourceSubscriptions"' does not satisfy the constraint '"Expected: literal string: toolsListChanged, Actual: literal string: taskIds" | …'`.
2. `tests/src/core/MCPServer.test.ts:5563-5594`, `refuses a snapshot the manager returned malformed
   or outside the content bound`: `AssertionError: expected undefined to be -32603` at `:5593`. Its
   off-contract vector is a completed task whose `result` carries a `_meta` key outside the metadata
   grammar — which the widened `result` legitimately admits.
3. `tests/src/core/MCPServer.test.ts:5902-5936`, `refuses an update and a cancellation it could not
   prove, invoking neither`: `AssertionError: expected [ 'update:x', 'abort:x' ] to deeply equal []`
   at `:5931`. Same vector, same cause: the snapshot is now valid, so the writes proceed.

**Done.** The whole surface (`taskIds`, `MCPNotificationMetaObject`, `MCPTaskNotificationParams`,
`isMCPTaskNotification`, the extended `isMCPSubscriptionFilter`, the barrel), all four drift
repairs, each with its red-first proof, and every owned test row.

**Not done.** The three rows named earlier. Patches follow; this unit did not apply them.

**Hypothesis.** The brief's scope was drawn from the files that declare the surface rather than from
the files the repairs make false, so the two proof files that assert the old behaviour were not
granted.

## Off-limits patches

Apply these serially at integration, or route them to a writer that owns the files. Each is an exact
old-text / new-text replacement, tabs preserved.

### Patch 1 — `tests/src/core/helpers.test.ts`, the filter key pin

Old:

```ts
		expectTypeOf<keyof MCPSubscriptionFilter>().toEqualTypeOf<
			'toolsListChanged' | 'promptsListChanged' | 'resourcesListChanged' | 'resourceSubscriptions'
		>()
```

New:

```ts
		expectTypeOf<keyof MCPSubscriptionFilter>().toEqualTypeOf<
			| 'toolsListChanged'
			| 'promptsListChanged'
			| 'resourcesListChanged'
			| 'resourceSubscriptions'
			| 'taskIds'
		>()
```

### Patch 2 — `tests/src/core/MCPServer.test.ts`, the malformed-snapshot read

Old:

```ts
		// Off-contract in a way TypeScript accepts and the wire cannot: a `_meta` key outside the
		// dated metadata grammar, which is exactly the class of defect a declared type cannot catch.
		const malformed = new Map<string, MCPTaskDetail>([
			[
				'lying',
				{
					taskId: 'lying',
					status: 'completed',
					createdAt: 'a',
					lastUpdatedAt: 'b',
					ttlMs: null,
					result: { resultType: 'complete', _meta: { 'not a legal key': 1 } },
				},
			],
		])
```

New:

```ts
		// Off-contract in a way TypeScript accepts and the wire cannot: a FRACTIONAL `ttlMs`, where
		// the declared type says `number | null` and the schema formats the field `int`. That is
		// exactly the class of defect a declared type cannot catch.
		const malformed = new Map<string, MCPTaskDetail>([
			[
				'lying',
				{
					taskId: 'lying',
					status: 'completed',
					createdAt: 'a',
					lastUpdatedAt: 'b',
					ttlMs: 1_000.5,
					result: { resultType: 'complete' },
				},
			],
		])
```

### Patch 3 — `tests/src/core/MCPServer.test.ts`, the unproven update and cancellation

Old:

```ts
		const lying = watchedTaskManager(
			() =>
				Promise.resolve({
					taskId: 'lying',
					status: 'completed',
					createdAt: 'a',
					lastUpdatedAt: 'b',
					ttlMs: null,
					// Off-contract in a way TypeScript accepts and the published union does not:
					// a `_meta` key outside the dated metadata grammar.
					result: { resultType: 'complete', _meta: { 'not a legal key': 1 } },
				}),
			invoked,
		)
```

New:

```ts
		const lying = watchedTaskManager(
			() =>
				Promise.resolve({
					taskId: 'lying',
					status: 'completed',
					createdAt: 'a',
					lastUpdatedAt: 'b',
					// Off-contract in a way TypeScript accepts and the published union does not:
					// a fractional `ttlMs`, where the schema formats the field `int`.
					ttlMs: 1_000.5,
					result: { resultType: 'complete' },
				}),
			invoked,
		)
```

### Evidence behind the replacement vector

The vector was not reasoned about; it was run. A throwaway probe under `tmp/probe/` drove the real
`createTaskServer` with a manager returning each detail and read the dispatched answer:

```text
npx vitest run --config vite.config.ts --no-cache --reporter=verbose --project probe
✓ |probe| tmp/probe/taskvector.test.ts > the replacement vector for the off-limits server rows >
  refuses a fractional ttlMs and accepts the integer control
```

The probe carried its own control: `ttlMs: 1_000.5` answered `{ error: { code: -32603 } }` and the
otherwise-identical `ttlMs: 1_000` answered `{ result: { resultType: 'complete' } }`, so the
instrument discriminates rather than reporting failure for everything. Patch 3's path refuses
through the same guard — `MCPServer.ts:1500` reads
`if (!isMCPTaskDetail(await tasks.task(named, options)))` and answers
`'Invalid params: no task is available for that \`taskId\`'`, which is the message that row asserts.
The probe was deleted before this report; `tmp/probe/` is empty.

**Flagged claim.** The probe proves the vector against the server's read path and the update path's
guard call site. It did not execute the two rows themselves, because doing so requires editing the
off-limits file. Treat "these patches turn both rows green" as proven for the mechanism and
unexecuted for the rows.

## `git status --short`

```text
 M src/core/MCPClient.ts
 M src/core/MCPServer.ts
 M src/core/MCPTaskClient.ts
 M src/core/constants.ts
 M src/core/helpers.ts
 M src/core/types.ts
 M src/core/validators.ts
 M tests/setup.ts
 M tests/src/core/MCPServer.test.ts
 M tests/src/core/MCPTaskClient.test.ts
 M tests/src/core/validators.test.ts
```

`MCPClient.ts`, `MCPServer.ts`, `constants.ts`, `tests/setup.ts`, and `tests/src/core/MCPServer.test.ts`
carry the held `m4-era` sweep alone; this unit added nothing to them. `git diff --stat` for
`tests/src/core/MCPServer.test.ts` reports `2 insertions(+), 2 deletions(-)`, and both are the
era sweep's `draft` → `stable` heading and suite title.

Diffstat for the tree, era sweep included:

```text
 src/core/MCPClient.ts                |   2 +-
 src/core/MCPServer.ts                |  12 +--
 src/core/MCPTaskClient.ts            |  22 +++--
 src/core/constants.ts                |   9 +-
 src/core/helpers.ts                  |  21 +++--
 src/core/types.ts                    | 123 ++++++++++++++++++++++----
 src/core/validators.ts               | 146 ++++++++++++++++++++++++++++---
 tests/setup.ts                       |   4 +-
 tests/src/core/MCPServer.test.ts     |   4 +-
 tests/src/core/MCPTaskClient.test.ts |  58 ++++++++++++-
 tests/src/core/validators.test.ts    | 161 +++++++++++++++++++++++++++++++++--
 11 files changed, 494 insertions(+), 68 deletions(-)
```
