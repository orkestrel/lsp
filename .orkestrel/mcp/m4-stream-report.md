# m4-stream implementation report

## Implementation

1. Added guarded task-notification matching in `matchesSubscriptionNotification`. The branch admits `notifications/tasks` only when `isMCPTaskNotification` validates the producer frame and the acknowledged `taskIds` includes `params.taskId`.
2. Added the defaulted `tasks = false` parameter to `buildSubscriptionFilter`. When enabled, it carries a non-empty requested `taskIds` array into the candidate filter without resolving or normalizing it. Existing callers retain their prior behavior.
3. Derived task-stream support in `MCPServer.#subscription` from the existing `task` and `subscription` options. No support flag or other duplicate state was added.
4. Resolved each candidate task identifier through `task.tasks.task(taskId, options)` before acknowledgement. The resolved subset preserves request order and duplicates, omits unresolved identifiers without another signal, and replaces the candidate filter before the same object is acknowledged, passed to the producer, and used by the delivery matcher.

The authorization loop remains inline in `#subscription` because it is one-use, instance-bound stream orchestration. This keeps the acknowledged filter and delivery filter in the same local binding without adding a wrapper or public surface.

The existing malformed-filter path remains unchanged: `#subscribe` gates `request.params.notifications` with `isMCPSubscriptionFilter` and answers `JSONRPC_INVALID_PARAMS` when it fails. The existing validator checks `taskIds` as a string array, so malformed `taskIds` still receives `-32602` without duplicate validation in either owned file.

## Acceptance evidence

### Baseline regression read

Command:

```text
npx vitest run --config vite.config.ts --project src:core tests/src/core/helpers.test.ts tests/src/core/MCPServer.test.ts
```

Result: exit `0`; passed files `2`; passed tests `310`; failed `0`; skipped `0`.

```text
 RUN  v4.1.11 /home/user/mcp


 Test Files  2 passed (2)
      Tests  310 passed (310)
   Start at  12:05:37
   Duration  2.74s (transform 2.26s, setup 1.73s, import 793ms, tests 2.16s, environment 0ms)
```

### Implementation edit

The edit changed only `src/core/helpers.ts` and `src/core/MCPServer.ts`. The actual diff is recorded under `Diff`.

### Scoped format

Initial check command:

```text
npx --no-install oxfmt --config .oxfmtrc.json --check src/core/helpers.ts src/core/MCPServer.ts
```

Initial result: exit `1`.

```text
Checking formatting...

src/core/MCPServer.ts (4ms)

Format issues found in above 1 files. Run without `--check` to fix.
Finished in 6ms on 2 files using 4 threads.
```

Formatting convergence command:

```text
npx --no-install oxfmt --config .oxfmtrc.json src/core/helpers.ts src/core/MCPServer.ts
```

Result: exit `0`.

```text
Finished in 7ms on 2 files using 4 threads.
```

Required check repeated:

```text
npx --no-install oxfmt --config .oxfmtrc.json --check src/core/helpers.ts src/core/MCPServer.ts
```

Final result: exit `0`.

```text
Checking formatting...

All matched files use the correct format.
Finished in 6ms on 2 files using 4 threads.
```

### Scoped lint

Command:

```text
npx --no-install oxlint --config .oxlintrc.json --deny-warnings src/core/helpers.ts src/core/MCPServer.ts
```

Result: exit `0`; no output.

### Typecheck

Command:

```text
npm run check
```

Result: exit `0`.

```text
> @orkestrel/mcp@0.0.24 check
> tsc --noEmit --project tsconfig.json && npm run check:src


> @orkestrel/mcp@0.0.24 check:src
> npm run check:src:core && npm run check:src:browser && npm run check:src:server


> @orkestrel/mcp@0.0.24 check:src:core
> tsc --noEmit -p configs/src/tsconfig.core.json


> @orkestrel/mcp@0.0.24 check:src:browser
> tsc --noEmit -p configs/src/tsconfig.browser.json


> @orkestrel/mcp@0.0.24 check:src:server
> tsc --noEmit -p configs/src/tsconfig.server.json
```

### Regression re-read

Command:

```text
npx vitest run --config vite.config.ts --project src:core tests/src/core/helpers.test.ts tests/src/core/MCPServer.test.ts
```

Result: exit `0`; passed files `2`; passed tests `310`; failed `0`; skipped `0`. The result matches the baseline.

```text
 RUN  v4.1.11 /home/user/mcp


 Test Files  2 passed (2)
      Tests  310 passed (310)
   Start at  12:07:03
   Duration  2.57s (transform 1.98s, setup 1.66s, import 552ms, tests 2.05s, environment 0ms)
```

### Status

Command:

```text
git status --short
```

Result: exit `0`.

```text
 M src/core/MCPServer.ts
 M src/core/helpers.ts
```

### Diff

Command:

```text
git diff -- src/core/helpers.ts src/core/MCPServer.ts
```

Result: exit `0`.

```diff
diff --git a/src/core/MCPServer.ts b/src/core/MCPServer.ts
index 71dc1e9..77fc265 100644
--- a/src/core/MCPServer.ts
+++ b/src/core/MCPServer.ts
@@ -1329,8 +1329,21 @@ export class MCPServer implements MCPServerInterface {
 		if (options.signal.aborted) slot.abort()
 		else options.signal.addEventListener('abort', () => slot.abort(), { once: true })
 		try {
+			const task = this.#options.task
 			const configured = this.#options.subscription
-			const notifications = buildSubscriptionFilter(requested, configured?.notifications ?? {})
+			const tasks = task !== undefined && configured !== undefined
+			let notifications = buildSubscriptionFilter(requested, configured?.notifications ?? {}, tasks)
+			const requestedTaskIds = notifications.taskIds
+			if (requestedTaskIds !== undefined) {
+				const resolved: string[] = []
+				if (task !== undefined) {
+					for (const taskId of requestedTaskIds) {
+						if ((await task.tasks.task(taskId, options)) !== undefined) resolved.push(taskId)
+					}
+				}
+				const { taskIds: _dropped, ...rest } = notifications
+				notifications = resolved.length > 0 ? { ...rest, taskIds: resolved } : rest
+			}
 			yield buildSubscriptionAcknowledgement(notifications, id)
 			if (configured !== undefined) {
 				const source = await configured.listen(notifications, options)
diff --git a/src/core/helpers.ts b/src/core/helpers.ts
index 95217f1..d5fd913 100644
--- a/src/core/helpers.ts
+++ b/src/core/helpers.ts
@@ -59,6 +59,7 @@ import {
 	isMCPInputResult,
 	isMCPLegacyVersion,
 	isMCPMetaObject,
+	isMCPTaskNotification,
 	isMCPTaskResult,
 } from './validators.js'
 
@@ -876,11 +877,13 @@ export function modernInvocationToLegacy(invocation: JSONRPCInvocation): JSONRPC
  *
  * @param requested - The notification families requested by the client
  * @param supported - The notification families the server can actually produce
+ * @param tasks - If `true`, includes requested task identifiers; if `false`, omits them
  * @returns The exact subset the server will honour
  */
 export function buildSubscriptionFilter(
 	requested: MCPSubscriptionFilter,
 	supported: MCPSubscriptionFilter,
+	tasks = false,
 ): MCPSubscriptionFilter {
 	const toolsListChanged =
 		requested.toolsListChanged === true && supported.toolsListChanged === true
@@ -892,6 +895,7 @@ export function buildSubscriptionFilter(
 	const resourceSubscriptions = requested.resourceSubscriptions?.filter((uri) =>
 		supportedResources.has(uri),
 	)
+	const taskIds = tasks ? requested.taskIds : undefined
 	return {
 		...(toolsListChanged ? { toolsListChanged: true } : {}),
 		...(promptsListChanged ? { promptsListChanged: true } : {}),
@@ -899,6 +903,7 @@ export function buildSubscriptionFilter(
 		...(resourceSubscriptions !== undefined && resourceSubscriptions.length > 0
 			? { resourceSubscriptions }
 			: {}),
+		...(taskIds !== undefined && taskIds.length > 0 ? { taskIds } : {}),
 	}
 }
 
@@ -922,9 +927,17 @@ export function matchesSubscriptionNotification(
 	if (notification.method === 'notifications/resources/list_changed') {
 		return filter.resourcesListChanged === true
 	}
-	if (notification.method !== 'notifications/resources/updated') return false
-	const uri = notification.params?.['uri']
-	return typeof uri === 'string' && filter.resourceSubscriptions?.includes(uri) === true
+	if (notification.method === 'notifications/resources/updated') {
+		const uri = notification.params?.['uri']
+		return typeof uri === 'string' && filter.resourceSubscriptions?.includes(uri) === true
+	}
+	if (notification.method === 'notifications/tasks') {
+		return (
+			isMCPTaskNotification(notification) &&
+			filter.taskIds?.includes(notification.params.taskId) === true
+		)
+	}
+	return false
 }
 
 /**
```

## Deviations, observations, and unverified claims

- Deviations: none.
- Sandbox observations recorded instead of criteria: none. Every required command ran.
- Formatting observation: the initial non-mutating format check reported layout drift in `src/core/MCPServer.ts`. The scoped formatter corrected it, and the repeated required check passed.
- Unverified claim: this unit has no direct behavioral test for the new task-notification path because `m4-proof` owns those test files. The task-specific matching, admission authorization, omission, order, duplicate, and no-delivery-read behaviors therefore await that unit's direct proof. This unit establishes typing, scoped format and lint, and unchanged existing helper/server regression results.
