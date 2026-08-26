# Deviation

## Expected

The `m4-mirror.1` successor must append the fetched-bytes mirror exclusion, correct the `TaskStatusNotificationParams metadata` row against the vendored schema, and complete the acceptance sequence with every command exiting 0.

## Found

The formatter exclusion and row correction pass formatting, lint, typecheck, and digest verification. The conformance command exits 1 because this sandbox denies the live fixture server's listener with `EPERM` before the `MCP server conformance` cases run. The failure is outside the owned files, and the brief forbids changes to the server fixture and configuration.

## What changed

- `.prettierignore`: As the successor to `m4-mirror`, this unit appended the prescribed fetched-bytes mirror exclusion. The green tree-wide format check confirms that `tests/mirrors/` is outside the formatter population.
- `tests/setupConformance.ts`: The `TaskStatusNotificationParams metadata` expected fragment now includes the subscription identifier property's schema-declared `description` member.
- `tests/conformance.test.ts`: This successor made no source change.
- `tests/mirrors/ext-tasks-2026-07-28-schema.json`: This successor made no source change. Its SHA-256 remains pinned.

## The formatter exclusion

The exact `.prettierignore` diff is:

~~~diff
diff --git a/.prettierignore b/.prettierignore
index 490f105..f0b5373 100644
--- a/.prettierignore
+++ b/.prettierignore
@@ -9,3 +9,6 @@ demo/showcase.html
 
 # Campaign records under the orchestration folder are verbatim evidence, not formatted source.
 .orkestrel/
+
+# Fetched-bytes mirrors keep their upstream bytes and stay out of the formatter.
+tests/mirrors/
~~~

The `npm run format:check` output recorded later confirms that the byte-identical mirror is excluded from formatting.

## The metadata row correction

Before this successor, the row expected this fragment:

~~~json
{"params":{"$ref":"#/$defs/NotificationMetaObject"},"metadata":{"type":"object","properties":{"io.modelcontextprotocol/subscriptionId":{"$ref":"#/$defs/RequestId"}}}}
~~~

At `$defs.NotificationParams.properties._meta`, the schema declares `{"$ref":"#/$defs/NotificationMetaObject"}`. At `$defs.NotificationMetaObject.type` and `$defs.NotificationMetaObject.properties["io.modelcontextprotocol/subscriptionId"]`, it declares an object whose subscription identifier property contains `$ref` and `description`:

~~~json
{"params":{"$ref":"#/$defs/NotificationMetaObject"},"metadata":{"type":"object","properties":{"io.modelcontextprotocol/subscriptionId":{"$ref":"#/$defs/RequestId","description":"Identifies the subscription stream a notification was delivered on. The\nserver MUST include this key on every notification delivered via a\n{@link SubscriptionsListenRequestsubscriptions/listen} stream, so the\nclient can correlate the notification with the originating subscription.\nThe key is absent on notifications not delivered via a subscription\nstream (e.g. progress notifications for an in-flight request), which is\nwhy it is optional here.\n\nThe value is the JSON-RPC ID of the `subscriptions/listen` request that\nopened the stream."}}}}
~~~

The corrected row expects that schema fragment verbatim. Row 3 (`TaskStatusNotificationParams metadata`) was corrected by adding the missing `description` member. The schema authority did not drift.

## Row membership

The `m4-mirror` row membership remains unchanged:

- `Task` requiredness: `taskId`, `status`, `statusMessage`, `createdAt`, `lastUpdatedAt`, `ttlMs`, and `pollIntervalMs`; `ttlMs` nullability; and the integer schemas for `ttlMs` and `pollIntervalMs`.
- `TaskStatus` members: `working`, `input_required`, `completed`, `failed`, and `cancelled`.
- `DetailedTask` variants and owed payloads: `working`, `input_required` with `inputRequests`, `completed` with `result`, `failed` with `error`, and `cancelled`.
- `CreateTaskResult`: flat `Result` composition, task properties and requiredness, no nested `task` member, and `resultType: 'task'`.
- Completed results: distinct `GetTaskResult` detail composition, `UpdateTaskResult`, and `CancelTaskResult`, each with `resultType: 'complete'`.
- `TaskStatusNotificationParams`: flat task shape and notification metadata. Row 3 (`TaskStatusNotificationParams metadata`) carries the correction in this successor.
- Subscription fragments: request-side `TaskSubscriptionNotifications.taskIds` and acknowledged-side `TaskSubscriptionAcknowledgedNotifications.taskIds`.
- `TasksExtensionCapability`: the exactly-empty object schema.
- Method literals: `tasks/cancel`, `tasks/get`, `notifications/tasks`, `tasks/update`, `sampling/createMessage`, `elicitation/create`, and `roots/list`.
- Schema identity: `https://modelcontextprotocol.io/ext-tasks/2026-07-28/schema.json`.

## Acceptance evidence

The acceptance commands ran in the required order.

### `npx --no-install oxfmt --config .oxfmtrc.json --check tests/setupConformance.ts tests/conformance.test.ts`

Exit code: 0

~~~text
Checking formatting...

All matched files use the correct format.
Finished in 5ms on 2 files using 4 threads.
~~~

### `npm run format:check`

Exit code: 0

~~~text

> @orkestrel/mcp@0.0.24 format:check
> oxfmt --config .oxfmtrc.json --check .

Checking formatting...

All matched files use the correct format.
Finished in 7247ms on 217 files using 4 threads.
~~~

### `npx --no-install oxlint --deny-warnings tests/setupConformance.ts tests/conformance.test.ts`

Exit code: 0. The command produced no output.

### `npm run check`

Exit code: 0

~~~text

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

~~~

### `sha256sum tests/mirrors/ext-tasks-2026-07-28-schema.json`

Exit code: 0

~~~text
bf30afb7ac251e3e22c037b7a685f60ef6603031b5484c0d08b1fa0bbe86d460  tests/mirrors/ext-tasks-2026-07-28-schema.json
~~~

### `npx vitest run --project conformance`

Exit code: 1

~~~text

 RUN  v4.1.11 /home/user/mcp

 ❯ |conformance| tests/conformance.test.ts (42 tests | 4 skipped) 35ms

⎯⎯⎯⎯⎯⎯ Failed Suites 1 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  |conformance| tests/conformance.test.ts > MCP server conformance
Error: listen EPERM: operation not permitted 0.0.0.0
 ❯ Server.#listen node_modules/@orkestrel/server/src/server/Server.ts:399:37
 ❯ Server.start node_modules/@orkestrel/server/src/server/Server.ts:214:22
 ❯ startServer tests/setupServer.ts:450:28
    448|  server: ServerInterface<TState>,
    449| ): Promise<StartedServerInterface<TState>> {
    450|  const port = await server.start()
       |                            ^
    451|  return {
    452|   server,
 ❯ startConformance tests/setupConformance.ts:1136:15
 ❯ tests/conformance.test.ts:146:16

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯


 Test Files  1 failed (1)
      Tests  38 passed | 4 skipped (42)
   Start at  11:40:20
   Duration  1.49s (transform 945ms, setup 817ms, import 394ms, tests 35ms, environment 0ms)

~~~

## Review evidence

The actual owned-file diff is:

~~~diff
diff --git a/.prettierignore b/.prettierignore
index 490f105..f0b5373 100644
--- a/.prettierignore
+++ b/.prettierignore
@@ -9,3 +9,6 @@ demo/showcase.html
 
 # Campaign records under the orchestration folder are verbatim evidence, not formatted source.
 .orkestrel/
+
+# Fetched-bytes mirrors keep their upstream bytes and stay out of the formatter.
+tests/mirrors/
diff --git a/tests/setupConformance.ts b/tests/setupConformance.ts
index 2ec7631..3172f3e 100644
--- a/tests/setupConformance.ts
+++ b/tests/setupConformance.ts
@@ -558,6 +558,8 @@ export const TASK_SCHEMA_NOTIFICATION_ROWS: readonly TaskSchemaRow[] = [
 				properties: {
 					'io.modelcontextprotocol/subscriptionId': {
 						$ref: '#/$defs/RequestId',
+						description:
+							'Identifies the subscription stream a notification was delivered on. The\nserver MUST include this key on every notification delivered via a\n{@link SubscriptionsListenRequestsubscriptions/listen} stream, so the\nclient can correlate the notification with the originating subscription.\nThe key is absent on notifications not delivered via a subscription\nstream (e.g. progress notifications for an in-flight request), which is\nwhy it is optional here.\n\nThe value is the JSON-RPC ID of the `subscriptions/listen` request that\nopened the stream.',
 					},
 				},
 			},
~~~

The `tests/conformance.test.ts` file has no diff.

The actual `git status --short` output is:

~~~text
 M .prettierignore
 M tests/setupConformance.ts
~~~

## Done

- The prescribed `.prettierignore` block is present with no other change to that file.
- The metadata row matches the structural schema declaration at `$defs.NotificationParams.properties._meta` and `$defs.NotificationMetaObject`.
- The formatter, lint, typecheck, and mirror digest criteria exit 0.
- The immutable mirror retains `bf30afb7ac251e3e22c037b7a685f60ef6603031b5484c0d08b1fa0bbe86d460`.

## Not done and flagged claims

The full conformance suite is not verified green. The sandbox listener denial prevents the required `42 passed (42)` result, so this unit cannot claim the final acceptance criterion passed. No workaround was attempted because the deviation contract forbids edits outside the owned files.
