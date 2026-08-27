# R1 report — MCP protocol and SDK research (returned 2026-08-27, `researcher`/Sonnet)

Orchestrator verification: the headline revision claim was checked against the primary source
(`/specification/2026-07-28/changelog.md` fetched directly) and confirmed. SDK naming was settled
by registry query. Verification notes are inline, marked **[verified]**.

## Revisions

Revisions listed by the sitemap: `2024-11-05`, `2025-03-26`, `2025-06-18`, `2025-11-25`,
`2026-07-28` (current), `draft`. **[verified]** against the fetched changelog, which compares
`2026-07-28` to `2025-11-25`.

Major changes in `2026-07-28` **[verified verbatim from the changelog]**:

- Protocol-level sessions and the `Mcp-Session-Id` header removed from Streamable HTTP; list
  endpoints no longer vary per connection; cross-call state uses server-minted handles passed as
  ordinary tool arguments (SEP-2567).
- Stateless protocol: the `initialize`/`notifications/initialized` handshake removed. Every
  request carries `io.modelcontextprotocol/protocolVersion` and
  `io.modelcontextprotocol/clientCapabilities` in `_meta`; clients SHOULD send `clientInfo`,
  servers SHOULD return `serverInfo` in `_meta` (SEP-2575).
- `server/discover` added — servers MUST implement it; clients MAY call it up front, and it is the
  stdio backward-compatibility probe (SEP-2575).
- HTTP GET stream and `resources/subscribe`/`resources/unsubscribe` replaced by
  `subscriptions/listen`, one long-lived POST-response stream with per-type opt-in and
  `io.modelcontextprotocol/subscriptionId` tagging. Request-scoped notifications
  (`notifications/progress`, `notifications/message`) stay on the originating request's stream.
- `ping`, `logging/setLevel`, and `notifications/roots/list_changed` removed; log level is
  per-request via `io.modelcontextprotocol/logLevel` in `_meta`.
- Experimental tasks moved to the `io.modelcontextprotocol/tasks` extension: polling `tasks/get`,
  new `tasks/update`, `tasks/list` removed, unsolicited task handles allowed (SEP-2663).
- MRTR: server-initiated requests (`roots/list`, `sampling/createMessage`, `elicitation/create`)
  become `InputRequiredResult` (`resultType: "input_required"`) with `inputRequests`; the client
  retries the original request with `inputResponses` (SEP-2322).
- Required `resultType` on every result: `"complete"` or `"input_required"`; absent (legacy
  server) MUST be treated as `"complete"`.
- SSE resumability and redelivery (`Last-Event-ID`, SSE event ids) removed; a broken stream loses
  the request and the client MUST re-issue with a new id.

Minor changes **[verified]**: `extensions` on capabilities; OpenTelemetry `_meta` conventions;
deterministic `tools/list` order SHOULD; required `Mcp-Method`/`Mcp-Name` headers plus
`x-mcp-header` custom headers (SEP-2243); required `ttlMs` and `cacheScope` via `CacheableResult`
on `tools/list`, `prompts/list`, `resources/list`, `resources/read`, `resources/templates/list`
(SEP-2549); resource-not-found `-32002` → `-32602`; OAuth `iss` validation (RFC 9207); DCR
`application_type`; credential binding per issuer; `inputSchema`/`outputSchema` loosened to full
JSON Schema 2020-12 with `$ref` resolution rules (SEP-2106); `notifications/elicitation/complete`
and URL-mode `elicitationId` removed; error-code allocation policy — `-32000`..`-32019`
implementation-defined, `-32020`..`-32099` spec-reserved; `HeaderMismatch` `-32020`,
`MissingRequiredClientCapability` `-32021`, `UnsupportedProtocolVersion` `-32022`.

Deprecated **[verified]**: Roots, Sampling, Logging (SEP-2577, twelve-month window, migrations:
tool parameters or configuration instead of roots; provider APIs instead of sampling; stderr or
OpenTelemetry instead of logging); HTTP+SSE transport (Deprecated formally, since `2025-03-26`);
`includeContext` `"thisServer"`/`"allServers"`; OAuth DCR in favor of Client ID Metadata
Documents.

## Requirement checklist (audit backbone)

Levels quoted or paraphrased from the cited `2026-07-28` pages. Rows R1 delivered; the
Orchestrator verified the changelog-derived rows and spot-checked none of the per-page rows —
audit lanes verify the row they attack before ruling on it.

### Base protocol (`/basic`)

| # | Requirement | Level |
| - | ----------- | ----- |
| 1 | JSON-RPC 2.0; request `id` string or integer, never null, never reused in-flight | MUST |
| 2 | Every result carries `resultType` (`complete` or `input_required`); unrecognized → invalid; absent (legacy) → treat as `complete` | MUST |
| 3 | No handshake: every request carries `_meta` `io.modelcontextprotocol/protocolVersion` and `clientCapabilities`; missing either → `-32602` (HTTP `400`) | MUST |
| 4 | Server never relies on prior requests on the same connection for context | MUST |
| 6 | `-32020`..`-32099` spec-reserved; never emit undefined codes there; never emit legacy `-32002`/`-32042`; accept `-32002` from legacy servers | MUST/SHOULD |
| 7 | Missing required client capability → `MissingRequiredClientCapabilityError` `-32021`, HTTP `400` | MUST |
| 8 | `serverInfo` in every result `_meta`; `clientInfo` on every request; never security-load-bearing | SHOULD |
| 9 | JSON Schema 2020-12 minimum; never auto-dereference network `$ref` | MUST |

### stdio transport (`/basic/transports/stdio`)

| # | Requirement | Level |
| - | ----------- | ----- |
| 10 | Newline-delimited; no embedded newlines | MUST |
| 11 | stderr MAY carry UTF-8 logs; client never assumes stderr means error | MAY/SHOULD NOT |
| 12 | stdout carries only valid MCP messages; server never writes JSON-RPC requests to stdout (MRTR replaces them) | MUST |
| 13 | Cancellation via `notifications/cancelled` referencing the request id | MUST |
| 14 | Shutdown: client closes stdin, waits, then terminates; server exits promptly on EOF | SHOULD |
| 15 | Modern+legacy client probes with `server/discover` first; legacy fallback never keyed to one error code | SHOULD/MUST NOT |

### Streamable HTTP (`/basic/transports/streamable-http`)

| # | Requirement | Level |
| - | ----------- | ----- |
| 16 | Validate `Origin`; invalid → `403` | MUST |
| 17 | Local servers bind `127.0.0.1` | SHOULD |
| 18 | Authentication for all connections | SHOULD |
| 19 | `2026-07-28`-only server: ignore `Mcp-Session-Id`, never mint one; ignore `Last-Event-ID`; `405` for GET/DELETE | MUST |
| 20 | `MCP-Protocol-Version` header on every POST, matching `_meta`; mismatch → `400` + `-32020` | MUST |
| 21 | Unsupported version → `400` + `UnsupportedProtocolVersionError` listing supported; unimplemented method → `404` + `-32601` | MUST |
| 22 | `Mcp-Method` header on all requests; `Mcp-Name` on `tools/call`, `resources/read`, `prompts/get`; validated against body; mismatch → `400` + `-32020` | MUST |
| 23 | Client sends `Accept: application/json, text/event-stream`; server answers one; client supports both | MUST |
| 24 | Client closing the SSE response stream = cancellation of that request (no `notifications/cancelled` on this transport) | MUST |
| 25 | HTTP+SSE transport deprecated; new implementations do not adopt | SHOULD NOT |
| 26 | Only stdio and Streamable HTTP are spec transports; WebSocket is non-normative custom | — |

### Tools (`/server/tools`)

| # | Requirement | Level |
| - | ----------- | ----- |
| 27 | `tools` capability declared; `tools/list` never varies per connection (MAY per authorization) | MUST |
| 28 | Deterministic `tools/list` order | SHOULD |
| 29 | `inputSchema` a valid non-null JSON Schema object | MUST |
| 30 | With `outputSchema`: structured results conform; clients validate | MUST/SHOULD |
| 31 | `structuredContent` accompanied by serialized-JSON `TextContent` | SHOULD |
| 32 | Clients treat `annotations` as untrusted | MUST |
| 33 | `x-mcp-header` property constraints; violating tool excluded from `tools/list` by HTTP clients | MUST |
| 34 | Server validates inputs, access-controls, rate-limits, sanitizes outputs; client confirms sensitive ops, timeouts, logs | MUST/SHOULD |
| 35 | Protocol errors = JSON-RPC errors; execution errors = `isError: true` results fed back to the model | SHOULD |

### Resources, prompts, utilities

| # | Requirement | Level |
| - | ----------- | ----- |
| 36 | `resources` capability; `subscribe` = `subscriptions/listen` `resourceSubscriptions` filter | MUST |
| 37 | Nonexistent resource → `-32602`; never an empty `contents`; accept legacy `-32002` | MUST/SHOULD |
| 38 | URI validation; path-traversal sanitization on `file://`; binary properly encoded | MUST |
| 40 | `prompts` capability; `prompts/list` never varies per connection | MUST |
| 41 | Prompt image/audio base64 with valid MIME | MUST |
| 43 | `completions` capability; max 100 items; relevance-sorted, rate-limited | MUST/SHOULD |
| 44 | Logging deprecated; `notifications/message` only for requests carrying `io.modelcontextprotocol/logLevel`, never on the `subscriptions/listen` stream | MUST |
| 46 | Cursors opaque; no fixed page size assumption; invalid cursor → `-32602` | MUST/SHOULD |
| 47 | `server/discover` implemented | MUST |
| 56 | Client cancels via `notifications/cancelled`; server sends it only to tear down `subscriptions/listen` | MUST/SHOULD |
| 57 | Progress token string or integer, unique among active; `progress` strictly increases; stops after completion | MUST |
| 58 | `ping` removed in `2026-07-28` | — |

### Authorization headline

OAuth 2.1 (draft-13) MUST for authorization servers; RFC 9728 Protected Resource Metadata MUST;
RFC 8707 `resource` parameter MUST on every authorization and token request; Bearer header only,
never query string; audience validation, no token passthrough; stdio SHOULD NOT use this spec —
environment credentials instead; DCR deprecated for Client ID Metadata Documents.

## SDK naming — settled by registry **[verified]**

- `@modelcontextprotocol/sdk` `1.30.0` (latest) — the v1 line: `McpServer`,
  `StdioServerTransport`, `registerTool`, subpath `server/mcp.js` etc. Targets handshake-era
  revisions.
- `@modelcontextprotocol/server` `2.0.0` (latest) — the v2 split for `2026-07-28`:
  `McpServer` from `@modelcontextprotocol/server`, `StdioServerTransport` from
  `@modelcontextprotocol/server/stdio`, `.registerTool()`, `.connect(transport)`; sibling
  `@modelcontextprotocol/client` and framework middleware packages (`node`, `express`,
  `fastify`, `hono` — names unconfirmed individually).

## Conformance package **[verified values from R1's registry read]**

`@modelcontextprotocol/conformance` dist-tags: `latest 0.1.16`, `alpha 0.2.0-alpha.11`. The
subject package tests against `0.2.0-alpha.10` — one prerelease behind the alpha tag. Coverage
per suite is unread (no README in registry metadata); settle from the installed package if the
audit needs it.

## Unknowns carried to the audit

- Batching status for `2026-07-28` (believed removed at `2025-06-18`; unverified against a
  primary source).
- `subscriptions/listen` full mechanics and the MRTR page (`/basic/patterns/mrtr`) — read
  directly before auditing those surfaces.
- What protocol revision Claude Code (the operative real-world client) sends today. Empirical
  fact available in-session: probe `0.0.9` + mcp `0.0.25` currently serves this harness's
  `prove` tool, so the published stack interoperates with Claude Code as-is.
- Which suites conformance `0.2.0-alpha.10` runs versus `-alpha.11`.
