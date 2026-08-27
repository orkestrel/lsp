# D1 — design brief: MCP readiness campaign (shared by both adversarial lanes)

Perform this assignment directly and spawn nothing. You are one lane of an adversarial design
pass; argue your perspective and return proposals, never a final plan. The Orchestrator
reconciles.

## Goal (the user's instruction)

Refine `@orkestrel/mcp` so it behaves exactly as it should as an MCP server and client. Audit mcp
and probe (and the lsp integration probe depends on) for enterprise-grade production readiness
with an MCP-focused concentration. Then make LSP truly work with real-world situations within
probe.

## Evidence set (read before proposing)

In `C:\Users\mikes\WebstormProjects\lsp\.orkestrel\campaign\mcp-readiness\`:

- `g1-report.md` — mcp package absorption (surface, client, server, transports, legacy, tests).
- `g2-report.md` — probe package absorption (ProbeServer, stages, lsp and mcp consumption).
- `o1-report.md` — ecosystem reconciliation (dependency graph, drift, release sequencing).
- `r1-report.md` — the `2026-07-28` specification checklist with the revision changelog.
- `spec-patterns.md` — first-hand `subscriptions/listen` (S1–S8) and MRTR (M1–M9) requirement rows.

Subject sources for verification: `C:\Users\mikes\WebstormProjects\mcp` and
`C:\Users\mikes\WebstormProjects\probe`, read-only.

## Fixed constraints

- `AGENTS.md` non-negotiables and design laws bind every proposal.
- No new npm package without the user's explicit authorization. A version re-pin of an existing
  dependency is a proposal for the user, named as such.
- Publishing is the user's decision. The pending release wave is `process` → `lsp` and `mcp`
  (independent, same round) → `probe` (o1-report sequencing).
- The WebSocket and MessagePort transports are non-normative extensions (the spec defines stdio
  and Streamable HTTP only); they stay, and their documentation must say what they are.
- The legacy layer must keep working: this harness's live registration
  (`.mcp.json` → `node node_modules/@orkestrel/probe/dist/bin/main.js`) is the operative
  real-world client path today.
- probe's `LintStage.ts:6` `createStdioTransport` import breaks at probe's lsp re-pin; that edit
  belongs to probe's re-pin commit (o1-report).

## Candidate findings to rule on

Rule on every row: propose a unit, reject with a reason, or mark needs-verification. Add rows the
evidence supports and argue any removal.

1. Client HTTP transports (Node and browser): do they stamp `MCP-Protocol-Version`, `Mcp-Method`,
   and `Mcp-Name` headers on modern POST requests (checklist rows 20, 22)? G1 evidence is silent
   on client-side `Mcp-Method`/`Mcp-Name`.
2. `x-mcp-header` custom headers from tool parameters (SEP-2243, row 33): any support in the
   package? Client-side exclusion of tools violating the constraints?
3. Modern stateless route: GET and DELETE on the MCP endpoint answer `405` (row 19)?
4. Server treats a closed SSE response stream as cancellation of that request (row 24): is
   `HTTPDisconnect` wired into the modern handler so in-flight work aborts?
5. `CacheableResult` — required `ttlMs` and `cacheScope` on `tools/list`, `prompts/list`,
   `resources/list`, `resources/read`, `resources/templates/list` (minor change 5): present on
   all five?
6. Error code values: `MCP_HEADER_MISMATCH` = `-32020`, `MCP_MISSING_CAPABILITY` = `-32021`,
   `MCP_UNSUPPORTED_VERSION` = `-32022` (minor change 12)?
7. Subscription mechanics versus S1–S8: acknowledgment-first ordering per subscription id,
   honored-subset echo, `subscriptionId` stamping, graceful-closure result shape, stdio
   re-subscribe statelessness.
8. MRTR versus M1–M9: `requestState` byte-exact echo and absent-means-absent, capability-gated
   `inputRequests`, fresh retry id, at-least-one-field rule, missing-info re-request behavior.
9. `StdioClientTransport` (mcp): stdio shutdown ladder (row 14 — close stdin, wait, terminate)
   and its process-face choice (`Process` line face today; the `Session` byte face exists in
   process `0.0.7`). Is the line face right for newline-delimited MCP, and is shutdown conformant?
10. Progress: strictly increasing values, notifications stop after completion (row 57).
    Deterministic `tools/list` ordering (row 28).
11. probe: the `prove` tool carries no annotations (`@orkestrel/tool` `ToolOptions` has no
    annotation field) and no `outputSchema`/`structuredContent`; the wire result is one text
    block. Rows 30–31 and the mcp-builder skill recommend structured output plus text. What is
    the right shape, and where does the capability live (tool package, mcp bridge, probe)?
12. probe guides: no `lsp.md` vendored mirror despite the lsp dependency (g2-report area 8).
13. mcp peer `@orkestrel/server` `^0.0.14` versus devDependency `^0.0.15` (o1-report).
14. `@modelcontextprotocol/conformance` pinned at `0.2.0-alpha.10`; `alpha` dist-tag is
    `0.2.0-alpha.11`. Also: only the `server` suite runs — is there client-side conformance
    worth adopting?
15. `MCPLegacy` forwards only `tools/list`/`tools/call`; legacy `resources/*`/`prompts/*` return
    `-32601`. Deliberate minimal mechanism or a gap for a library claiming legacy support?
16. LSP-in-probe real-world proof: probe's only lsp use is `oxlint --lsp` in `LintStage`. What
    does "LSP truly works with real-world situations in probe" require beyond the rename
    adoption at re-pin — for example proof against both diagnostic paths (pull
    `textDocument/diagnostic` and push `publishDiagnostics`), a real workspace fixture, the
    2000 ms lifecycle timeout's adequacy, `LSPExit` handling when oxlint dies mid-inspection?
17. Browser `WebSocketClientTransport` queues sends until open and silently drops after close;
    `WebSocketServerTransport` silently drops on closed send. Right semantics or a lost-message
    defect?
18. Legacy HTTP client: `createMCPSession` GET replay exists server-side; does the legacy client
    transport resume with `Last-Event-ID` after a dropped SSE stream, and does any consumer need
    it?
19. The mcp-builder skill's evaluation phase: does a tool-evaluation artifact (question/answer
    pairs against a real workspace) belong in this campaign as a deliverable, and where would it
    live?

## What each lane argues

- **Subjective lane** (`planner`, Opus): shape, naming, ergonomics, documentation posture, scope
  boundary. Rule on: transport naming symmetry across the fleet (lsp's client-transport rename
  family versus mcp's names); probe's verdict wire shape; guide voice and the missing mirror;
  which candidate rows are enterprise-grade substance versus gold-plating; the campaign's
  correct stopping point.
- **Objective lane** (Grok, bench): correctness and constraints. Verify each candidate row in the
  mcp source with `file:line` evidence before ruling — the reports are testimony, not ground
  truth. Rank confirmed gaps by spec-conformance severity (MUST violations first). For probe
  rows you cannot reach, rule from the reports and mark the confidence.

## Output shape

- Numbered rulings on every candidate row: unit / reject / needs-verification, with argument and
  `file:line` evidence where you verified.
- A proposed unit list: each unit with objective, owned files, acceptance criteria, and
  dependency order.
- Explicit rejections with reasons.
- Risks and unknowns.
