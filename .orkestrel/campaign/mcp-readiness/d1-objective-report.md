**Deviation.** Campaign reports under `C:\Users\mikes\WebstormProjects\lsp\.orkestrel\campaign\mcp-readiness\` were readable. Probe source under `C:\Users\mikes\WebstormProjects\probe` was readable. The mcp-builder `evaluation.md` at the path named in `r1-brief.md` was readable. Unpublished process `0.0.7` source (Session face) is not in this workspace; installed `@orkestrel/process` here is `0.0.6`. Live registry tags were not re-queried. Spec pages were not re-fetched; checklist rows were treated as testimony and checked against source. Confidence is high for mcp and probe trees, medium for the unpublished Session face and the live `alpha.11` tag.

---

## Numbered rulings

**1. Client HTTP headers (`MCP-Protocol-Version`, `Mcp-Method`, `Mcp-Name`) — unit (partial).**  
G1’s silence is false. Node and browser `HTTPClientTransport.#buildHeaders` stamp protocol and method on every modern POST, and stamp `Mcp-Name` only when `method === 'tools/call'` (`src/server/transports/HTTPClientTransport.ts:183-191`, `src/browser/transports/HTTPClientTransport.ts:184-191`). Server `inferHeaderIssue` matches that scope (`src/server/inferers.ts:91-124`). Checklist row 22 is a MUST: `Mcp-Name` also on `resources/read` and `prompts/get`. That is a confirmed MUST gap. Protocol and method headers are already present.

**2. `x-mcp-header` / `Mcp-Param-*` (SEP-2243, row 33) — unit.**  
No `src/` implementation. `MCPClient.tools()` projects every named descriptor with no schema filter (`src/core/MCPClient.ts:390-401`). `buildToolDescriptors` copies `name` / `description` / `parameters` only (`src/core/helpers.ts:688-700`). Installed `ToolOptions` has no annotation field (`node_modules/@orkestrel/tool/dist/src/core/index.d.ts:301-312`). The guide already records the MUST as unsatisfied (`guides/mcp.md:4057-4070`). Confirmed MUST: an HTTP client must project annotated arguments and must exclude violating tools from `tools/list`.

**3. Stateless GET/DELETE `405` (row 19) — reject (already true).**  
`createMCPRoutes` registers only POST (`src/server/factories.ts:104-116`). Tests pin GET and DELETE to HTTP `405` with `Allow` containing POST (`tests/src/server/factories.test.ts:412-418`, `:476-481`). `createMCPSession` is the legacy GET/DELETE door, not the modern default.

**4. Closed SSE stream as cancellation (row 24) / `HTTPDisconnect` — reject (streamed path is wired).**  
`createMCPPostHandler` constructs `HTTPDisconnect`, passes `disconnect.signal` into `dispatch`, and bridges streamed replies (`src/server/handlers.ts:128-138`). `HTTPDisconnect.bridge` aborts on consumer cancellation of the body (`src/server/transports/HTTPDisconnect.ts:142-145`). A live HTTP disconnect test exists (`tests/src/server/handlers.test.ts:530-575`). Unary JSON-as-SSE one-shot does not go through `bridge` (`src/server/handlers.ts:142-147`); that is the documented structural limit that in-flight unary work cannot observe a dropped client (`guides/mcp.md:4086-4095`). Do not invent a unary-cancellation unit.

**5. `CacheableResult` `ttlMs` / `cacheScope` on the five list/read methods — reject (already true).**  
`tools/list`, `resources/list`, `resources/read`, `resources/templates/list`, and `prompts/list` all call `buildModernResult` with a TTL (`src/core/MCPServer.ts:440-445`, `:479-487`, `:551-556`, `:588-596`, `:628-636`). Types require both fields (`src/core/types.ts:1107-1137`, `:1315-1320`). `prompts/get` correctly omits them (`src/core/types.ts:1140-1144`).

**6. Error codes `-32020` / `-32021` / `-32022` — reject (already true).**  
`MCP_HEADER_MISMATCH = -32020`, `MCP_MISSING_CAPABILITY = -32021`, `MCP_UNSUPPORTED_VERSION = -32022` (`src/core/constants.ts:75-93`). Tests pin the numerals (`tests/src/core/validators.test.ts:2095-2120`).

**7. Subscriptions S1–S8 — reject (implemented; no durable store).**  
Acknowledgement is the first yield (`src/core/MCPServer.ts:1347`). The honoured subset is `buildSubscriptionFilter` (`src/core/helpers.ts:884-908`). Every stream frame is stamped with the listen id (`:951-966`, `:976-987`). Graceful close is `buildSubscriptionResult` (`:997-1003`, `MCPServer.ts:1377`). Unrequested types are dropped (`matchesSubscriptionNotification`, `:918-941`). Slot count is process-local (`MCPServer.ts:1309-1316`); there is no persisted subscription identity, which is what S8 requires after a stdio reconnect that is a new process.

**8. MRTR M1–M9 — unit only for the SHOULD miss (M8); the rest is true.**  
Server-built `input_required` from the elicitation policy is `tools/call` only (`tests/src/core/MCPServer.test.ts:4657-4669`); resource and prompt managers may still return `input_required` (`MCPServer.ts:531-539`, `:683-691`). `isMCPInputResult` enforces at-least-one of `inputRequests` / `requestState` (`src/core/validators.ts:1858-1870`). Client retry mints a new id (`MCPClient.ts:531-532`) and omits continuation fields when `options.input` is absent (`:424-429`). Elicitation is capability-gated (`MCPServer.ts:1014-1020`). Extra `inputResponses` keys are ignored (`MCPServer.test.ts:4482-4508`). **M8 is a SHOULD gap:** omitting the issued key returns `-32602`, not a new `InputRequiredResult` (`:4499-4509`). Fail-closed is safer than the SHOULD; do not promote it to a MUST unit.

**9. `StdioClientTransport` shutdown and Process vs Session — reject as an mcp unit.**  
The transport is newline JSON-RPC over `Process.lines` (`src/server/transports/StdioClientTransport.ts:23-27`, `:141-151`, `:224-228`). That line face is the right face for this protocol. `close()` calls `Process.destroy()` (`:211`). Installed process `0.0.6` `stop()` runs `stopChild` (SIGTERM then SIGKILL) and then `stdin.destroy()` (`node_modules/@orkestrel/process/dist/src/server/index.js:1108-1111`). Spec row 14 is SHOULD: close stdin, wait, then terminate. The ladder here is signal-first. Changing that belongs in `@orkestrel/process`, which this campaign does not own. Switching to an unpublished Session byte face would be the wrong framing for NDJSON.

**10. Progress strictly increasing; notifications stop after completion; `tools/list` order — reject (already true).**  
`MCPProgressReporter.report` refuses a non-increasing value (`src/core/MCPProgressReporter.ts:77-79`). `#progress` always `stop()`s in `finally` (`MCPServer.ts:930-933`). `tools/list` is registry order and a second list equals the first (`helpers.ts:688`, `MCPServer.test.ts:2755-2764`). Row 28 is SHOULD.

**11. Probe `prove` annotations / `outputSchema` / `structuredContent` — unit (structuredContent only).**  
`ProbeServer.#publish` registers `prove` with `name` / `description` / `parameters` / `execute` (`probe/src/server/ProbeServer.ts:169-176`). `#execute` returns `{ resultType: 'complete', content: [{ type: 'text', text: formatVerdict(...) }] }` and omits `structuredContent` (`:212-215`). That return is already an `MCPCallResult`, so it bypasses `MCPServer.#normalize`, which would have stamped `structuredContent` from a `ToolResult.value` (`mcp/src/core/MCPServer.ts:1600-1603`). Row 31 is SHOULD. Row 30’s MUST applies only when `outputSchema` is present; `MCPToolDescriptor` has no `outputSchema` (`mcp/src/core/types.ts:1059-1063`). Do not add annotations or `outputSchema` to `@orkestrel/tool` for this. The right shape is text plus `structuredContent` carrying the `Verdict` record, produced in probe by returning a `ToolResult` (or an `MCPCallResult` that already includes `structuredContent`). The stamp capability already lives in mcp.

**12. Probe vendored `lsp.md` — unit (documentation, after lsp re-pin).**  
`probe/guides/README.md` lists no `lsp.md`. G2 is confirmed. The live path imports `@orkestrel/lsp` (`probe/src/server/stages/LintStage.ts:3-6`). A missing mirror is documentation drift, not a protocol defect.

**13. mcp peer `@orkestrel/server` `^0.0.14` vs devDependency `^0.0.15` — unit (user re-pin proposal).**  
Confirmed: `package.json:112` and `:126`. Tests run against `0.0.15` while the published peer advertises `0.0.14`. This is a version re-pin of an existing dependency, named for the user.

**14. Conformance `0.2.0-alpha.10` and client suite — needs-verification, then a user re-pin.**  
Installed package is `0.2.0-alpha.10` (`package.json:107`, `node_modules/@modelcontextprotocol/conformance/package.json:3`). The runner is invoked as `server --url … --spec-version` (`tests/setupConformance.ts:1251-1252`). The same package documents a `client` mode (`node_modules/@modelcontextprotocol/conformance/README.md:9-16`). Several listed client scenarios still describe an `initialize` handshake (`README.md:228-233`), which 2026-07-28 removed. Do not adopt the client suite until a listing at `--spec-version 2026-07-28` is read. The `alpha.11` tag is r1 testimony, not re-queried here.

**15. `MCPLegacy` tools-only forwarding — reject for this campaign.**  
`#legacy` answers `initialize` and `ping`, forwards `tools/list` and `tools/call`, and returns `-32601` for everything else (`src/core/MCPLegacy.ts:128-164`). Probe’s live registration is stdio plus this decorator (`.mcp.json:7-10`, `ProbeServer.ts:73`). The operative client path only needs tools. Expanding legacy `resources/*` / `prompts/*` is library completeness, not a MUST for the live harness and not a 2026-07-28 requirement.

**16. LSP-in-probe real-world proof — reject extra diagnostic-path invention; keep the re-pin rename.**  
`LintStage` spawns `node <workspace oxlint> --lsp` via `createStdioTransport` (`probe/src/server/stages/LintStage.ts:145-157`). Lifecycle timeout is `2_000` ms (`:60`). `exit` is recorded (`:159`, `:176-178`). Probe guide states Oxlint 1.80.0 advertises no `diagnosticProvider`, so diagnostics arrive on the publish path (`probe/guides/probe.md:776-783`). Tests already drive a real language-server ending (`probe/tests/src/server/stages/LintStage.test.ts:1349-1356`) and death during inspection (`:1445-1476`). Pull `textDocument/diagnostic` is the lsp client’s choice, not probe’s, and Oxlint does not advertise it. Inventing a second diagnostic path against Oxlint does not match the real peer. The `createStdioTransport` → `createStdioClientTransport` rename belongs to probe’s re-pin commit (fixed constraint), not a new mcp unit.

**17. Browser / server WebSocket silent drop — unit (closed-send must fail).**  
Browser `send` queues until open and returns after close (`src/browser/transports/WebSocketClientTransport.ts:118-125`). Server `send` no-ops a closed socket (`src/server/transports/WebSocketServerTransport.ts:85-88`). Node client `send` throws when not connected (`src/server/transports/WebSocketClientTransport.ts:123-126`). WebSocket is non-normative (fixed constraint: keep it, document it). Silent success after close is still a lost-message defect: the caller cannot tell the frame was discarded. Align closed-send with the Node client’s throw. Keep queue-until-open.

**18. Legacy HTTP client `Last-Event-ID` resume — reject.**  
Neither HTTP client transport sends `Last-Event-ID` (no matches under `src/**/HTTPClientTransport.ts`). Server GET replay exists only on `createMCPSession` (`src/server/middlewares.ts:150-164`). 2026-07-28 removed SSE resumability (r1 row 19 / changelog testimony). Probe does not use HTTP. No in-tree consumer needs client resume.

**19. mcp-builder evaluation artifact — reject.**  
The skill requires independent, read-only, non-destructive questions that need many tool calls (`evaluation.md` “Quick Reference” and “Core Requirements”). Probe publishes one tool, `prove`, whose overlay and generated-sibling writes are not read-only (`ProbeServer.ts:169-176`, g2 Overlay/RuntimeStage). That evaluation format does not fit this product.

---

## Proposed unit list

Dependency order: mcp MUST headers before probe structuredContent; user re-pins before probe re-pin; lsp mirror after lsp publish.

**U-name-headers**  
Objective: stamp and validate `Mcp-Name` on modern `resources/read` and `prompts/get` the same way `tools/call` already does.  
Owned: `src/server/inferers.ts`, `src/server/transports/HTTPClientTransport.ts`, `src/browser/transports/HTTPClientTransport.ts`, matching tests, `guides/mcp.md` (the header-scope sentences).  
Acceptance: a modern POST for `resources/read` / `prompts/get` with matching name header succeeds; missing or mismatched name is HTTP `400` + `-32020`; Node and browser clients stamp the header from `params.uri` or `params.name` as the spec body field requires (confirm the field name from the Streamable HTTP page at implementation time).  
Depends on: none.

**U-mcp-param**  
Objective: HTTP clients project `x-mcp-header` arguments to `Mcp-Param-*` and omit violating tools from `tools()` results.  
Owned: HTTP client transports, `MCPClient.tools` / descriptor projection, tests, `guides/mcp.md` (replace the “not satisfied” closer with the implemented seam).  
Acceptance: an annotated `tools/call` POST carries `Mcp-Param-*`; a tool whose `x-mcp-header` constraints are violated does not appear in `MCPClient.tools()`; stdio/WebSocket/MessagePort `send` contracts stay message-only (do not widen `MCPClientTransportInterface.send` into an HTTP-shaped bag). If the only typed way to carry per-request headers is a new optional on the HTTP transport classes, put it there, not on the shared transport interface.  
Depends on: U-name-headers (same HTTP header seam).  
Constraint: no new npm package. This is a MUST; sequence it last among mcp code units so nothing else takes the widened HTTP seam.

**U-ws-closed-send**  
Objective: browser and server WebSocket `send` after close reject, matching the Node client.  
Owned: `src/browser/transports/WebSocketClientTransport.ts`, `src/server/transports/WebSocketServerTransport.ts`, tests, `guides/mcp.md` (non-normative transport section must still say WebSocket is not a spec transport).  
Acceptance: `send` after `close()` throws; pre-open queue still flushes in order.  
Depends on: none. Can run parallel with header units.

**U-prove-structured**  
Objective: `prove` wire result carries `structuredContent` (the `Verdict` record) plus the existing text block, using mcp’s existing stamp.  
Owned: `probe/src/server/ProbeServer.ts` and its tests/guide. Off-limits: `@orkestrel/tool` `ToolOptions`, mcp `MCPToolDescriptor`.  
Acceptance: a successful `tools/call` `prove` result has `content[0].type === 'text'` and `structuredContent` equal to the verdict object; failed tool results unchanged.  
Depends on: none in mcp. Can land in probe before or after mcp header units.

**U-server-peer** (user authorization)  
Objective: align mcp `peerDependencies["@orkestrel/server"]` with the `^0.0.15` already in `devDependencies`.  
Owned: `package.json`.  
Acceptance: peer range and dev range name the same published server release; gates still green.  
Depends on: user approval. Not a protocol MUST.

**U-conformance-pin** (user authorization, after a listing)  
Objective: if `--spec-version 2026-07-28` client scenarios exist and match this client’s public methods (`discover` / `tools` / `call` / `listen`), adopt those; re-pin `@modelcontextprotocol/conformance` only with user approval.  
Owned: `package.json`, `tests/setupConformance.ts`, `tests/conformance.test.ts`.  
Acceptance: recorded scenario names and the runner command; no handshake-era `initialize` client scenario run against the modern client.  
Depends on: a `conformance list` / help read at the pinned package. Needs-verification until that listing is captured.

**U-probe-lsp-mirror**  
Objective: vendor `lsp.md` beside the other dependency mirrors.  
Owned: `probe/guides/`.  
Depends on: lsp publish / probe re-pin so the mirror matches the names probe actually imports.

**U-probe-lsp-rename**  
Objective: `LintStage.ts` imports `createStdioClientTransport` after lsp’s unpublished rename lands.  
Owned: `probe/src/server/stages/LintStage.ts` (and tests/guide that name the old factory).  
Depends on: process → lsp publish, then probe re-pin (o1 sequencing). Already assigned; do not duplicate it as an mcp unit.

---

## Explicit rejections

- GET/DELETE `405`, cache stamps on the five methods, error-code numerals, streamed SSE cancellation, subscription S1–S8 mechanics, progress monotonicity and stop-on-completion, registry-order `tools/list`, protocol/method header stamping: already true in source.  
- Unary HTTP cancellation: documented structural limit; not closable without changing HTTP.  
- M8 missing-info re-request: SHOULD, current behaviour is `-32602`; fail-closed. Not a MUST unit.  
- Stdio stdin-close-then-wait ladder and Session byte-face switch: wrong owner or wrong framing. Keep `Process` line face.  
- Legacy `resources/*` / `prompts/*` on `MCPLegacy`: live path is tools; expanding is out of this campaign’s MCP-readiness MUST set.  
- Probe `outputSchema` / tool annotations: no field on `ToolOptions` or `MCPToolDescriptor`; row 30’s MUST is not triggered.  
- Dual diagnostic-path proof against Oxlint: Oxlint is push-only; pull belongs to `@orkestrel/lsp`, not probe.  
- HTTP client `Last-Event-ID` resume: removed in 2026-07-28; no consumer.  
- mcp-builder evaluation XML: conflicts with `prove`’s overlay writes and single-tool surface.

---

## Risks and unknowns

- `Mcp-Name` body field for `resources/read` (URI vs name) must be read from the Streamable HTTP page at implementation; do not copy `tools/call`’s `params.name` blindly.  
- U-mcp-param can force an HTTP-only send option. If that option leaks onto `MCPClientTransportInterface`, stdio and WebSocket inherit a lie.  
- Unpublished process `0.0.7` Session face was not opened here; ruling against switching is from NDJSON framing plus o1’s statement that `Process` is preserved.  
- Conformance `alpha.11` and 2026-07-28 client-scenario applicability are unverified against the live registry.  
- Probe `LintStage` still imports `createStdioTransport`; that breaks at lsp re-pin (fixed constraint). Until that commit, “LSP truly works” in probe is the existing Oxlint push path, not a second protocol.  
- `@orkestrel/server` `0.0.14` → `0.0.15` behaviour compatibility remains open (o1). The re-pin unit must prove gates, not assume compatibility.
