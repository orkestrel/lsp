# m4-audit-checker — report, persisted by the Orchestrator

The checker role carries no Write tool, so the Orchestrator persisted its returned
message verbatim, 2026-08-26. The Orchestrator's reconciliation of the two check-4
mismatches is in the round verdict file: both dissolve against successor briefs the
checker was not supplied (`.prettierignore` is owned by `m4-mirror.1-brief.md` § 1;
`tests/src/core/helpers.test.ts` is `m4-contract.1-brief.md` Patch 1).

---

## Check 1 — Mirror membership: REPORTED (population mismatch, no ruling)

Schema `$defs` members (66): the tasks-family members (CancelTaskRequest, CancelTaskResult, CancelledTask, CompletedTask, CreateTaskResult, DetailedTask, FailedTask, GetTaskRequest, GetTaskResult, InputRequiredTask, Task, TaskStatusNotificationParams, TaskStatusNotification, TaskStatus, TaskSubscriptionAcknowledgedNotifications, TaskSubscriptionNotifications, TasksExtensionCapability, UpdateTaskRequest, UpdateTaskResult, WorkingTask) plus the generic MCP-wide shapes the vendored schema embeds (Annotations, AudioContent, BlobResourceContents, BooleanSchema, ContentBlock, CreateMessageRequest, CreateMessageRequestParams, CreateMessageResult, ElicitRequest, ElicitRequestFormParams, ElicitRequestParams, ElicitRequestURLParams, ElicitResult, EmbeddedResource, Error, Icon, ImageContent, Implementation, InputRequest, InputRequests, InputResponse, InputResponses, JSONObject, JSONRPCNotification, JSONRPCRequest, JSONValue, LegacyTitledEnumSchema, ListRootsRequest, ListRootsResult, MetaObject, ModelHint, ModelPreferences, NotificationMetaObject, NotificationParams, NumberSchema, PrimitiveSchemaDefinition, RequestId, ResourceLink, Result, ResultMetaObject, Role, Root, SamplingMessage, SamplingMessageContentBlock, StringSchema, TextContent, TextResourceContents, TitledMultiSelectEnumSchema, TitledSingleSelectEnumSchema, Tool, ToolAnnotations, ToolChoice, ToolResultContent, ToolUseContent, UntitledMultiSelectEnumSchema, UntitledSingleSelectEnumSchema).

Row subjects in `tests/setupConformance.ts` (20): Task, DetailedTask, CreateTaskResult, TaskStatusNotificationParams, TasksExtensionCapability, TaskStatus, CancelTaskRequest, GetTaskRequest, TaskStatusNotification, UpdateTaskRequest, CreateMessageRequest, ElicitRequest, ListRootsRequest, NotificationParams, NotificationMetaObject, GetTaskResult, UpdateTaskResult, CancelTaskResult, TaskSubscriptionNotifications, TaskSubscriptionAcknowledgedNotifications.

`$defs` members with no row: the five status narrowings (CancelledTask, CompletedTask, FailedTask, InputRequiredTask, WorkingTask) and the generic embedded shapes listed above. Rows with no `$defs` member: none.

No ruling on whether the gap is acceptable; that judgment belongs to the other lanes.

## Check 2 — The six symbols: MATCH

- `MCPNotificationMetaObject` — guides/mcp.md:2117 (type table)
- `MCPTaskDetailResult` — :2186 (type table)
- `MCPTaskNotificationParams` — :2187 (type table)
- `isMCPNotificationMetaObject` — :1992 (function table)
- `isMCPTaskDetailResult` — :2053 (function table)
- `isMCPTaskNotification` — :2054 (function table)

## Check 3 — Era residue: REPORTED (no ruling)

- `src/`: no hit for `draft|stability guarantee|specification/`.
- `guides/mcp.md`: no hit.
- `tests/` excluding `tests/mirrors/`: one hit — `tests/src/core/validators.test.ts:941`, the JSON Schema `$schema` URL literal `https://json-schema.org/draft/2020-12/schema` inside a fixture object. Every other `draft` hit sits inside the vendored mirror, which the brief excludes.

## Check 4 — Scope honesty, mechanical: MISMATCH (as reported; see the header note)

- f1632ad touches `src/core/MCPClient.ts`, `src/core/MCPServer.ts`, `src/core/MCPTaskClient.ts`, `src/core/constants.ts`, `src/core/helpers.ts`, `src/core/types.ts`, `src/core/validators.ts`, `tests/setup.ts`, `tests/src/core/MCPServer.test.ts`, `tests/src/core/MCPTaskClient.test.ts`, `tests/src/core/helpers.test.ts`, `tests/src/core/validators.test.ts` — `helpers.test.ts` outside the `m4-era` and `m4-contract` owned lists (the filter key-union pin near :1617).
- 2b823f9 touches `tests/conformance.test.ts`, `tests/setupConformance.ts` — owned.
- bc54b38 touches `.prettierignore`, `tests/setupConformance.ts` — `.prettierignore` outside the lists supplied to the checker.
- bef9f40 touches `src/core/MCPServer.ts`, `src/core/helpers.ts` — exactly the `m4-stream` owned list.
- 0fe1879 touches `tests/setup.ts`, `tests/src/core/MCPClient.test.ts`, `tests/src/core/MCPServer.test.ts`, `tests/src/core/helpers.test.ts` — within the `m4-proof` owned list.
- c2a35d4 touches `guides/mcp.md` — exactly the `m4-guide` owned list.

## Check 5 — The carried finding: REPORTED

`guides/mcp.md:325`: `added later is not a special case. It is simply the next registration,` — the banned `simply` sits at the recorded location.

## Status list

1. Mirror membership — REPORTED
2. The six symbols — MATCH
3. Era residue — REPORTED
4. Scope honesty, mechanical — MISMATCH (dissolved at reconciliation; header note)
5. The carried finding — REPORTED
