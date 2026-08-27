# G1 — @orkestrel/mcp absorption

You are a read-only scout inside the mcp package working tree. Perform this assignment directly
and spawn nothing. Do not edit any file. Return evidence with `file:line` pointers, never raw file
dumps, and make no decisions or design proposals.

**Question**: What does `@orkestrel/mcp` implement today, where, and what does its test evidence
cover, for a Model Context Protocol conformance audit?

## Scope

This repository only. Read `src/`, `tests/`, `guides/`, and configuration. Read
`node_modules/@orkestrel/*/package.json` or installed declarations only where an import target
must be identified. Never read `.env*`, `.npmrc`, auth files, or credentials.

## Evidence sought

1. Public surface inventory: every export from `src/core/index.ts`, `src/browser/index.ts`, and
   `src/server/index.ts`, grouped by kind (class, factory, helper, guard, type) — names and the
   defining `file:line` only.
2. Client: `MCPClient` lifecycle — the initialize handshake, protocol version negotiation,
   capability handling, request/response correlation, cancellation, progress, ping, and any
   sampling, roots, or elicitation support.
3. Server: `MCPServer`, `MCPSession`, `handlers.ts`, `middlewares.ts` — method registration
   (`MCPMethodManager`), tools, resources, prompts, completion, logging, pagination, session
   management (`Mcp-Session-Id`), `MCP-Protocol-Version` header checks, `Origin` validation, and
   stateless versus stateful modes.
4. Transports, one bullet each for `src/server/transports/StdioClientTransport.ts`,
   `StdioServerTransport.ts`, `HTTPClientTransport.ts`, `HTTPDisconnect.ts`,
   `WebSocketClientTransport.ts`, `WebSocketServerTransport.ts`, and
   `src/browser/transports/HTTPClientTransport.ts`, `WebSocketClientTransport.ts`,
   `MessagePortTransport.ts`: framing, SSE usage, resumability (`Last-Event-ID`), reconnection,
   session header handling, and which `@orkestrel` dependency it delegates to.
5. Legacy: what `MCPLegacy` and `MCPLegacyClientTransport` cover — which spec revision or
   transport — and where they are consumed.
6. Streams and tasks: `MCPStreamController`, `MCPTextStreamController`, `MCPTaskClient`,
   `MCPProgressReporter` — public shape and purpose, one bullet each.
7. Tests: what the conformance project runs (which `@modelcontextprotocol/conformance` suites and
   config), what the integration project covers, and every skipped test or TODO in `src/` and
   `tests/` (search for `TODO`, `.skip`, `.todo`).
8. Guides: list `guides/*.md` with each guide's subject in a few words. Spot-check whether any
   guide names an export that does not exist; report only findings.
9. Spec-version markers: search for protocol revision strings (`2025-`, `2024-`, `2026-`) in
   `src/` and report where the protocol version is declared and negotiated.

## Return shape

- `Question`: one line.
- `Evidence`: concise `file:line` bullets per numbered area.
- `Distillate`: the smallest summary the next engine needs, at most sixty lines.
- `Unknowns`: unresolved facts, not recommendations.
