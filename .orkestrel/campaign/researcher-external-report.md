# Report: researcher-external — TypeScript 7 LSP server and MCP 2026-07-28 anchor

Returned 2026-08-25 by the `researcher` role (Sonnet, native; recorded ladder substitution — Grok bench web-denied, Codex exec network-denied). Brief: tmp/units/researcher-external-brief.md. A follow-up on the MCP progress/cancellation/tasks/lifecycle pages was dispatched to the same unit; this file records the first return.

## TS7 LSP matrix

Native TypeScript toolchain (`@typescript/native-preview`, repository microsoft/typescript-go). Ships an LSP-based language server; the previous JSON-based tsserver protocol is being replaced by standard LSP so the server works in editors beyond VS Code (microsoft/typescript-go README fetched 2026-08-25; Visual Studio Magazine 2025-10-02).

| LSP capability area | Ruling | Citation |
|---|---|---|
| Lifecycle (initialize/shutdown) | implemented | typescript-go README, fetched 2026-08-25 |
| Text document sync | unknown | no source states sync mode |
| Diagnostics push | unknown | not described for LSP mode |
| Diagnostics pull | unknown | not addressed |
| Completion | implemented | zenn.dev article 2025-05-25 (textDocument/completion) |
| Hover | implemented | ProvideHover in internal/ls/hover.go; zenn.dev 2025-05-25 |
| Definition | implemented | definition.go; zenn.dev 2025-05-25 |
| References | unknown | not confirmed |
| Rename | implemented (implied) | typescript-go PR #1702 title (JSDoc rename support); title only |
| documentSymbol | unknown | not addressed |
| semanticTokens | unknown | not confirmed by a typescript-go source |
| foldingRange | unknown | not addressed |
| inlayHint | unknown | not addressed |
| codeAction | unknown | not addressed for typescript-go |
| Formatting | unknown | not addressed |
| Workspace features | unknown | not addressed |
| Progress (WorkDoneProgress) | unknown | not addressed |

Release state: ships as `@typescript/native-preview` npm package plus a preview VS Code extension (Visual Studio Magazine 2025-10-02). The typescript-go staging repository states it will be archived in September 2026 once TypeScript 7.0 development merges back into the main TypeScript repository (README fetched 2026-08-25). A TypeScript 7.0 Release Candidate date of 2026-06-18 appeared only in a search synthesis pointing at digitalapplied.com and is unconfirmed. The devblogs native-port post gives no LSP protocol version, feature list, or migration guidance (fetched 2026-08-25).

## MCP 2026-07-28 anchor (changelog page, fetched 2026-08-25)

Revision string quoted on the page: "2026-07-28", previous revision "2025-11-25". Source: modelcontextprotocol.io/specification/2026-07-28/changelog.

Major changes (each citing its SEP on the page):
- Protocol-level sessions and the `Mcp-Session-Id` header removed from Streamable HTTP; list endpoints no longer vary per connection; cross-call state moves to server-minted handles passed as tool arguments (SEP-2567).
- The `initialize`/`notifications/initialized` handshake removed; every request carries protocol version and client capabilities in `_meta` (`io.modelcontextprotocol/protocolVersion`, `io.modelcontextprotocol/clientCapabilities`); mismatches return `UnsupportedProtocolVersionError` (SEP-2575).
- `server/discover` added: a required RPC advertising supported protocol versions, capabilities, identity (SEP-2575).
- HTTP GET endpoint and `resources/subscribe`/`unsubscribe` replaced with `subscriptions/listen`, a long-lived POST-response stream (SEP-2575). Request-scoped notifications including `notifications/progress` continue on the response stream of the request they relate to, not on the subscription stream.
- `ping`, `logging/setLevel`, `notifications/roots/list_changed` removed; log level moves to per-request `_meta` (SEP-2575).
- Experimental tasks move out of core into the `io.modelcontextprotocol/tasks` extension; blocking `tasks/result` replaced by polling `tasks/get`; `tasks/update` added (SEP-2663).
- Multi Round-Trip Requests (MRTR): server-initiated requests (`roots/list`, `sampling/createMessage`, `elicitation/create`) replaced by `InputRequiredResult` (`resultType: "input_required"`) answered by retrying the original request with `inputResponses` (SEP-2322).
- SSE stream resumability (`Last-Event-ID`, SSE event ids) removed from Streamable HTTP (SEP-2575).

Deprecations: Roots, Sampling, Logging (SEP-2577); HTTP+SSE transport (deprecated since 2025-03-26) (SEP-2596); `includeContext` values `"thisServer"`/`"allServers"` (SEP-2596); OAuth 2.0 Dynamic Client Registration in favor of Client ID Metadata Documents (PR #2858).

Capability negotiation: per-request `_meta` carriage replaces one-shot initialize negotiation; `server/discover` provides up-front or STDIO backward-compatibility discovery; `ClientCapabilities`/`ServerCapabilities` gain an `extensions` field (SEP-2575).

Evolution machinery: specification feature lifecycle with Active, Deprecated, Removed states, a minimum twelve-month deprecation window, a registry of deprecated features (SEP-2596); formalized SEP workflow — markdown files under `seps/`, PR-derived numbering, sponsors, label-managed status (SEP-1850).

## Unknowns (first return)

- TS7 LSP protocol version targeted (3.17 vs 3.18): no source states it.
- TS7 rulings for diagnostics push/pull, documentSymbol, semanticTokens, foldingRange, inlayHint, codeAction, formatting, workspace features, progress, references: unknown.
- TS7 migration guidance for tsserver/tsc-API consumers: none published; closest is typescript-go issue #2824 (2026-02-18) proposing an IPC API with read-only Program/TypeChecker access — a proposal, not guidance.
- TS7 RC date 2026-06-18: unconfirmed (search synthesis only).
- LSP-server launch command/flag for tsgo: unconfirmed against raw README.
- npmjs.com unreachable (HTTP 403 through the proxy).
- MCP 2026-07-28 progress notification payload/token/percentage semantics: not on the changelog page — closed by the follow-up return.
- MCP 2026-07-28 cancellation semantics: not on the changelog page — closed by the follow-up return.

# Follow-up return: MCP 2026-07-28 utility pages (fetched 2026-08-25)

## Progress (modelcontextprotocol.io/specification/2026-07-28/basic/utilities/progress)

- Notification `notifications/progress`; optional, server MAY send.
- Token: client puts `progressToken` inside the request's `_meta`; string or integer; unique across active requests.
- Payload: `progressToken`, `progress` (monotonic increase required even with unknown total), optional `total`, optional human-readable `message`; `progress` and `total` MAY be floating point.
- Lifetime: tokens must reference active requests with in-progress operations; notifications MUST stop after completion; both parties SHOULD track active tokens and SHOULD rate-limit.

## Cancellation (…/basic/utilities/cancellation)

- `notifications/cancelled` with `requestId` and optional `reason`; client-sent for its own in-progress requests.
- Server-sent use restricted to tearing down a `subscriptions/listen` stream; MUST NOT be used otherwise.
- Transport: Streamable HTTP — closing the SSE response stream IS the cancellation signal (client disconnect = cancel, no notification expected); stdio — the notification is required.
- Races: notifications may arrive after completion; both parties MUST handle gracefully; client SHOULD ignore late responses; invalid cancellations ignored (fire-and-forget).
- Timeouts: SHOULD time out all requests; MAY reset the clock on progress notifications but SHOULD enforce a maximum regardless.

## Tasks extension (modelcontextprotocol.io/docs/extensions/tasks; full spec lives in modelcontextprotocol/ext-tasks, not fetched)

- States: `working`, `input_required`, `completed`, `failed`, `cancelled`; the last three terminal.
- Creation: `CreateTaskResult` (`resultType: "task"`) with `taskId`, status, `ttlMs`, `pollIntervalMs`; durably created before the response.
- `tasks/get` polls status and terminal result/error; `input_required` exposes `inputRequests`, answered through `tasks/update` with `inputResponses`.
- `notifications/tasks` pushes full task state through `subscriptions/listen` for opted-in clients; polling is the default. `tasks/cancel` is cooperative.
- Negotiated as extension id `io.modelcontextprotocol/tasks` in the `extensions` field of capabilities.
- No numeric progress field on the task object; status metadata plus optional status messages. Whether task progress reuses `notifications/progress` is unsettled by the fetched page.

## Lifecycle / versioning (…/2026-07-28/basic/lifecycle, served as "Versioning and Compatibility")

- No negotiation handshake; every request carries its protocol version in `_meta` (and the `MCP-Protocol-Version` header on HTTP); each request validated independently.
- Terminology the page defines: **Modern** = per-request metadata revisions (2026-07-28 and later); **Legacy** = `initialize`-handshake revisions (2025-11-25 and earlier); **Dual-era** = an implementation supporting both.
- Mismatch: `UnsupportedProtocolVersionError`, code -32022, with `data.supported` and `data.requested`; client SHOULD retry with a mutually supported version.
- `server/discover` is REQUIRED of servers; clients MAY call it up front.
- Extensions: `extensions` map on capabilities, ids follow `_meta` key naming with mandatory prefix.
- Compatibility matrix: Modern/Modern works; Modern client vs Legacy server fails; Dual-era interoperates both ways; Legacy client vs Modern server fails with no fall-forward. Era detection is per server, transport-specific (stdio probes `server/discover`; HTTP inspects a 400 body), cached for the server process or origin.

## Follow-up Unknowns

- Whether "Versioning and Compatibility" is the canonical lifecycle page or a redirect artifact.
- `io.modelcontextprotocol/clientInfo` / `serverInfo` / `logLevel` field names appear only on the changelog page, not restated on the fetched base pages.
- The `ext-tasks` repository's exact JSON-RPC signatures (`tasks/get`, `tasks/update`, `tasks/cancel`, TTL/poll types) — repository not fetched.
- Whether task-level numeric progress reuses `notifications/progress`.
