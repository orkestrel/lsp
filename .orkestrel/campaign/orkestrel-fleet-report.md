# Report: orkestrel-fleet — package map for the LSP audit campaign

Returned 2026-08-25 by the `orkestrel` role (Sonnet, native). Brief: tmp/units/orkestrel-fleet-brief.md.

## Package table

| Checkout | Name | Version | Runtime dependencies | Purpose |
|---|---|---|---|---|
| workflow | @orkestrel/workflow | 0.0.14 | abort ^0.0.8, budget ^0.0.8, contract ^0.0.13, database ^0.0.12, emitter ^0.0.8, queue ^0.0.10, timeout ^0.0.8 | Typed workflow engine — serializable Workflow → Phase → Task tree on a cooperative scheduler. |
| process | @orkestrel/process | 0.0.6 | contract ^0.0.13, emitter ^0.0.8 | Typed child-process toolkit: supervised streaming, bounded capture/termination, detached spawns, keyed registries. |
| tool | @orkestrel/tool | 0.0.12 | contract ^0.0.13 | Tool runtime — JSON-Schema tool definitions, calls, results, registry with per-call error isolation. |
| queue | @orkestrel/queue | 0.0.10 | abort ^0.0.8, contract ^0.0.13, database ^0.0.12, emitter ^0.0.8, timeout ^0.0.8 | Typed persistent-capable FIFO job queue — bounded concurrency, retries, per-attempt timeout/abort, durable store. |
| mcp | @orkestrel/mcp | 0.0.24 | contract ^0.0.13, emitter ^0.0.8, process ^0.0.6, sse ^0.0.5, tool ^0.0.12, websocket ^0.0.10 | Typed MCP client/server with pluggable HTTP, WebSocket, stdio transports. |
| middleware | @orkestrel/middleware | 0.0.17 | abort ^0.0.8, budget ^0.0.8, contract ^0.0.13, timeout ^0.0.8 | Server middleware batteries: boundary, telemetry, compression, security, CORS, rate limiting, sessions, CSRF, static, multipart. |
| markdown | @orkestrel/markdown | 0.0.11 | contract ^0.0.13, html ^0.0.6 | Types-first markdown layer over @orkestrel/html — typed AST, both conversion directions, sanitized HTML. |
| html | @orkestrel/html | 0.0.6 | contract ^0.0.13 | Typed HTML AST: total parsing, canonical rendering, sanitizing, LM distillation. |
| probe | @orkestrel/probe | 0.0.6 | contract ^0.0.13, emitter ^0.0.8, mcp ^0.0.24, queue ^0.0.10, timeout ^0.0.8, tool ^0.0.12 | Prove a claim with type, lint, and runtime evidence from the workspace's own toolchain. |
| scaffold | @orkestrel/scaffold | 0.0.53 | console ^0.0.10, contract ^0.0.13, emitter ^0.0.8, markdown ^0.0.11, process ^0.0.6, template ^0.0.5 | Scaffold workspaces: new, audit, repair, catalog, overwrite. |

Purpose lines are `package.json` `description` fields. Scaffold manifest reads 0.0.53 against the role catalog's 0.0.52 — catalog drift, manifest wins.

## Audit pointers

- workflow: src/core/types.ts:60 PhaseDefinition (sequential phases, concurrent tasks). No progress/cancel surface matched in types.ts; search covered `*/types.ts` only.
- process: src/core/types.ts:12 ProcessEventMap lifecycle emitter; :210 lifecycle observation surface; :217 progress-bar chunk-join streaming note; :227 unframed trailing partial; :427 sync host has no cooperative termination window or in-flight cancellation.
- tool: no progress/status/phase/lifecycle/cancel/partial matches in src/**/types.ts. Absence stated.
- queue: src/core/types.ts:52 push observation surface (job lifecycle); :194 typed emitter of lifecycle moments; :224 "Cancel active work, reject pending work, and await cleanup."
- middleware: src/core/types.ts:42,50 response `status`; :159 deadline status option; src/server/types.ts:132,138,158 UploadStatus lifecycle ('staged' | 'moved').
- mcp: src/core/constants.ts:15 `MCP_PROTOCOL_VERSION: MCPVersion = '2025-11-25'`; :18 `MCP_LEGACY_VERSION = '2025-06-18'`; :32 frozen `SUPPORTED_PROTOCOL_VERSIONS`. src/core/types.ts:191 `MCPVersion = '2026-07-28' | '2025-11-25' | '2025-06-18'` — the type admits 2026-07-28; the constants array does not advertise it. Doc examples reference it at MCPServer.ts:142 and factories.ts:53. Progress/cancellation surfaces not searched this pass.
- markdown: src/core/types.ts:44 TextNode; :118 HeadingNode; :146 ListNode; :162 TableNode; :183 CodeBlockNode; :204 BlockNode union; :220 MarkdownDocument.children; :228 MarkdownNode exhaustive union. No offset/range/position fields on markdown nodes. No symbol/outline structure.
- html: src/core/types.ts:39,52,64 UTF-16 source offsets on nodes; :79 ElementNode; :94 TextNode; :110 CommentNode; :126 DoctypeNode; :142 HTMLDocument.children; :151 HTMLNode exhaustive union. No symbol/outline structure.
- probe: src/server/helpers.ts:535 LSP language identifier selection; src/server/stages/LintStage.ts:20 resident Oxlint language server; :200 `spawn(process.execPath, [binary, '--lsp'])` stdio transport; :214 `initialize` request; :225 `initialized` notify; :254 `textDocument/didOpen`; :311 `textDocument/didClose`; :396 handles `textDocument/publishDiagnostics`; :167 shutdown on teardown. Capability negotiation shape not located this pass.
- scaffold: no match for LSP | language server | tsgo | TypeScript 7 under src/. Absence stated.

## Unknowns

- Progress/status surfaces under other names in workflow, tool, middleware — search covered `src/**/types.ts` only, not implementation event names.
- mcp progress and cancellation surfaces — not searched this pass (gap against brief).
- Whether the `MCPVersion` 2026-07-28 literal absent from SUPPORTED_PROTOCOL_VERSIONS is intent or drift.
- probe clientCapabilities sent and server capabilities read.
- Guide/README purpose confirmation (descriptions taken from manifests).
- All ten checkouts present and readable.
