# Spec pattern pages, read first-hand 2026-08-27 (Orchestrator capture)

Source: `/specification/2026-07-28/basic/patterns/subscriptions.md` and
`/basic/patterns/mrtr.md`, fetched directly. These rows extend the R1 checklist for the audit.

## `subscriptions/listen`

| # | Requirement | Level |
| - | ----------- | ----- |
| S1 | Server never sends a notification type the client did not request in the `notifications` filter (`toolsListChanged`, `promptsListChanged`, `resourcesListChanged` booleans; `resourceSubscriptions` URI array) | MUST NOT |
| S2 | `notifications/subscriptions/acknowledged` is the first message on the subscription, carrying `io.modelcontextprotocol/subscriptionId` in `_meta`; no notification precedes it per subscription id (stdio interleaving across subscriptions allowed) | MUST |
| S3 | The acknowledgment's `notifications` field echoes only the subset the server honors | — |
| S4 | Every notification on the stream carries `io.modelcontextprotocol/subscriptionId` = the JSON-RPC id of the `subscriptions/listen` request; stdio clients correlate by it | MUST |
| S5 | Concurrent subscriptions allowed, demultiplexed by subscription id | MAY |
| S6 | Client ends: close the SSE stream (HTTP) or `notifications/cancelled` referencing the request id (stdio) | — |
| S7 | Server-initiated graceful closure: respond to the original request id with `resultType: "complete"` and the subscriptionId in `_meta`, then close; an unresponded transport drop signals an abrupt end the client MAY treat as a reconnect trigger | SHOULD |
| S8 | After a stdio reconnect the client re-sends `subscriptions/listen`; the server holds no subscription state across reconnections | MUST |

## MRTR

| # | Requirement | Level |
| - | ----------- | ----- |
| M1 | Server-to-client requests ride only as `InputRequiredResult` on `tools/call`, `resources/read`, `prompts/get`; never on any other request | MUST / MUST NOT |
| M2 | `inputRequests` keys unique within the request; values only `ElicitRequest`, `CreateMessageRequest`, `ListRootsRequest` | MUST |
| M3 | Every `InputRequiredResult` carries at least one of `inputRequests`, `requestState` | MUST |
| M4 | Server never sends an input request kind the client's declared capabilities exclude | MUST NOT |
| M5 | `requestState` is opaque to the client: echoed byte-exact on retry when present, never included when absent, never inspected | MUST / MUST NOT |
| M6 | Retry uses a new JSON-RPC id; initial and retry are independent requests | MUST |
| M7 | Server treats inbound `requestState` as attacker-controlled; integrity-protect (HMAC/AEAD) when it influences authorization or logic, with principal, TTL, and originating-request binding inside the protected payload; single-use enforced server-side where required | MUST / SHOULD |
| M8 | Missing requested information on retry → a new `InputRequiredResult` re-requesting it, rather than an error; unrecognized extra fields in `InputResponses` ignored | SHOULD |
| M9 | Server never assumes the client will fulfill or retry | MUST NOT |
