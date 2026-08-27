# D1 subjective lane report (returned 2026-08-27, `planner`/Opus 5, clean context, blind)

Reframing finding first: `mcp/guides/mcp.md` already carries a working capability/defect matrix —
`## Declared non-goals` (`:3851`), `## Declared conformance gaps` (`:3915`), `## Declared
packaging limits` (`:4209`). Several candidate rows are already ruled there with a cost and a
closer; reopening a closed criterion is the user's instruction, so those rows are rejections.

## Rulings on the candidate rows

1. **Client HTTP headers — needs-verification, routed objective.** The guide asserts all three
   headers derive from the message on both faces (`mcp/guides/mcp.md:4043`, `:4047`). A miss is a
   false prose claim as well as a conformance gap.
2. **`x-mcp-header` — reject.** Client projection is a declared gap with a named closer and "not
   scheduled" (`:4057`); server-side filtering is a declared non-goal (`:3868`). Open half: row
   33's client-side exclusion of a foreign server's violating tools — a documentation carrier
   (U6), because the client cannot validate an annotation it does not project.
3. **GET/DELETE `405` — needs-verification, then U4.** `createMCPRoutes` returns one `POST` route
   (`mcp/src/server/factories.ts:104-116`); the answer depends on `@orkestrel/router`
   method-mismatch behavior. Either way the outcome is a route-table row or a guide sentence.
4. **SSE close as cancellation — reject as unit.** `HTTPDisconnect` composes abort + body cancel +
   keepalive (`HTTPDisconnect.ts:42`); the unary-response limit is declared (`:4086`). Verify the
   streamed-path wiring only.
5. **`CacheableResult` — reject as unit, verify remainder.** Confirmed on `tools/list`
   (`MCPServer.ts:440-444`), `resources/list` (`:479-487`), `resources/read` (`:551-555`);
   templates/prompts lists need their argument lists read. The overload pair on
   `buildModernResult` (`helpers.ts:718-746`) makes cacheable a type-level fact.
6. **Error code values — mechanical; route to `checker`.**
7. **S1–S8 — needs-verification, objective; S7 closed.** The guide records the dated revision's
   internal disagreement between the cancellation and subscriptions pages and instructs
   implementing the subscriptions page (`:4138-4153`).
8. **M1–M9 — needs-verification, objective.** Note: `createMCPContinuation(secret)`
   (`factories.ts:38`) is exactly the M7 integrity shape; verify whether it is the `requestState`
   protector and whether the interface says so.
9. **stdio face and shutdown — split.** Reject the `Session` byte-face change: newline-delimited
   JSON-RPC is a line protocol; the byte face would reimplement framing the dependency owns.
   Shutdown ladder (row 14) is objective — verify against `PROCESS_GRACE` handling.
10. **Progress monotonicity, deterministic order — verify in U1.** `buildToolDescriptors` maps in
    registry order (`helpers.ts:688-700`).
11. **probe wire shape — unit, narrowed.** mcp's default `tools/call` path already produces
    `structuredContent` (`types.ts:425-435`); probe opts out by supplying `execution` and
    hand-building a text-only result (`ProbeServer.ts:212-215`). Fix is one field in probe (U7).
    Reject `outputSchema` (declared non-goal `:3866`; pulls `@orkestrel/tool` into the wave).
    Reject annotations (`ToolOptions` has no field; row 32 binds clients, not servers). Keep
    `formatVerdict` as the sole text block — the receipt's closing line must be quotable verbatim
    (`.claude/rules/quality.md` § Instruments); declare the row-31 departure.
12. **Missing `lsp.md` mirror — unit (U9, inside probe's re-pin commit).** lsp is the only
    runtime dependency with no mirror.
13. **Peer range — unit (U5), mechanical.** Raise to `^0.0.15`; on `0.0.x` a caret pins one exact
    release, so `^0.0.14` advertises a combination nothing proved.
14. **Conformance — split.** `alpha.11` re-pin is the user's proposal. Substantive half: adopt the
    client suite if the installed runner exposes one (U11) — the guide itself declares the client
    evidence hole (`:3982`).
15. **`MCPLegacy` minimal forwarding — reject code change; document the consequence (U6).** The
    fixed forwarded set is what keeps the decorator removable as a whole file (`:1748-1810`).
16. **LSP in probe — unit, split.** Substance: the unconfigurable `#deadline = 2_000`
    (`LintStage.ts:60`, spent at `:153-156`) with no options dial anywhere up the stack — a real
    options-shape defect for cold large workspaces (U8); `LSPExit` mid-inspection surfacing as
    `claimant` versus `instrument` decides receipt refusal (folded into U8); both diagnostic
    paths belong to lsp's suite with protocol-faithful fixtures (U10). Gold-plating rejected: a
    second language server (the receipt binds the oxlint version).
17. **WebSocket silent drop — unit (U2), strongest finding.** Queue-until-open is right. The
    silent drop breaks the package's own published contract: `MCPClientTransportInterface.send`
    must reject, never resolve silently (`types.ts:2247-2258`); the caller's `call` hangs to its
    deadline. `browser/transports/WebSocketClientTransport.ts:40`,
    `server/transports/WebSocketServerTransport.ts:32`.
18. **Legacy `Last-Event-ID` resume — reject.** Revision removed resumability; the surviving
    legacy channel has no consumer (`:3873`); creation gate refuses. Era-scoped limit row (U6).
19. **Evaluation artifact — reject.** Measures the model, not the tool; no durable home; the
    real-client obligation is met by the live `.mcp.json` registration and
    `probe/tests/src/bin/main.test.ts`.
20. **Added: `createStdioServer` returns an unnamed public type** (`factories.ts:387-390`) —
    violates types-first; `StdioServerOptions` sits unpaired at `types.ts:478`. Unit U3
    (`StdioServerInterface`).
21. **Added: transport naming symmetry — retain, no unit.** `create*ClientTransport` mints a
    carrier a client drives; `create*Server` binds a dispatcher to a door. lsp and mcp agree.
    Recorded so no later round reopens it.
22. **Added: `MCPClientTransportInterface` name is wrong** (server bridges implement it,
    `types.ts:2196` admits it) — but the guide rules the rename deferred (`:4200-4202`). Raised
    as tension, not proposed.
23. **Added: probe's default bounds are magic literals** (`Probe.ts:87` `30_000`,
    `LintStage.ts:60` `2_000`) — defaults are data; `constants.ts` is their home. Folds into U8.

## Proposed units (subjective lane's cut)

- **U1** verify mcp rows in source (objective, read-only) — rows 1,3,4,5,6,7,8,9,10, row-33
  client half, row-14 suite list.
- **U2** WebSocket send-after-close rejects (both transports + tests + guide rows).
- **U3** `StdioServerInterface` named in `src/server/types.ts`; factory returns it; guide row.
- **U4** modern route answers `405` with `Allow: POST` (conditional on U1's router reading).
- **U5** peer `@orkestrel/server` `^0.0.15` (conditional on compat evidence).
- **U6** mcp guide honesty rows (legacy method set, era-scoped limits, non-normative transports,
  row-33 outcome, U1 gap landings). Last mcp writer.
- **U7** probe `structuredContent` = the `Verdict` record beside the `formatVerdict` text block;
  prove on the legacy projection (`modernResultToLegacy`) since the live path is legacy.
- **U8** probe lint bound configurable end to end (constants → types → `LintStage` options →
  `ProbeOptions.lint` → `ProbeServer` → bin env read), plus `LSPExit` mid-inspection surfacing
  as an `instrument` issue refusing the receipt.
- **U9** probe re-pin commit: lsp range, `createStdioClientTransport` import, vendored `lsp.md`
  mirror, See-also row. After lsp publishes.
- **U10** lsp proves both diagnostic paths with protocol-faithful fixture servers over real
  child stdio. Native, never bench (child-pipe false-green law).
- **U11** adopt the conformance client suite (conditional on the runner exposing one).

Order: U1, U2, U3, U7, U10 start together (disjoint files). U4, U5, U11 follow U1. U8 follows
U7. U6 last mcp writer. U9 follows lsp's publish and U8.

## Rejections (adopted wholesale unless the objective lane breaks one)

`outputSchema` on `prove`; tool annotations on `prove`; `x-mcp-header` both halves; `MCPLegacy`
widening; legacy `Last-Event-ID` resume; `MCPClientTransportInterface` rename (deferred by the
guide); `Session` byte face for mcp stdio; a second language server in probe; the evaluation
artifact; a re-audit of declared non-goals.

## Risks

- U7's field must be proven through `modernResultToLegacy` — the live harness path is legacy.
- U4 may be a router finding; one request settles it.
- U8's premise needs the timing probe: time oxlint `initialize` on a cold large workspace; if
  2000 ms clears comfortably, U8 narrows to constants + the `LSPExit` half.
- U11 may have no subject; read the installed runner's suite list.
- The `alpha.10 → alpha.11` re-pin can move scenario names; user's call with that cost named.
- U6 written last, re-read against what shipped.
- Open: whether legacy `resources/*` `-32601` is minted at `MCPLegacy`'s door or the modern seam
  (`MCPLegacy.ts:159` answers; changes U6's sentence).

## Tensions for the Orchestrator

- Kept `formatVerdict` text despite row 31's serialized-JSON SHOULD (receipt line must be
  quotable; JSON has no closing line).
- Kept the `MCPClientTransportInterface` rename deferred on the guide's recorded ruling.
- Treated declared non-goals as closed criteria even where the objective lane will rank them as
  MUST violations — declared, priced, declined in writing.
- Scoped U8 to probe; a case exists for `createLSPClient` owing the sane default.
