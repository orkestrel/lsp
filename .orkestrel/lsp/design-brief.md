# Design round — lsp reconciliation and improvement campaign

One brief, two blind lanes. The subjective lane argues shape, naming, ergonomics, and design fit.
The objective lane argues correctness, constraints, and what the code and contracts actually
permit. Each lane returns proposals and rulings with evidence; neither accepts anything. The
Orchestrator reconciles.

## Execution

You perform this assignment directly and spawn nothing. Read before acting: `AGENTS.md`, the
applicable `.claude/rules/*.md` files (`names.md`, `typescript.md`, `architecture.md`,
`patterns.md`, `tests.md`, `workspace.md`, `documentation.md`, `quality.md`), and
`guides/lsp.md`. You are read-only: no edits, no probes that write.

## Goal

The user asked for these outcomes on `@orkestrel/lsp` (all repositories are on `main`, clean, and
released; lsp is `0.0.3`):

1. Reconcile `ROADMAP.md` with the landed state (branches merged, releases published, campaign
   folder pruned).
2. Make the package more like `@orkestrel/mcp` in structure where that improves it, respecting
   this repository's rules over resemblance.
3. Use the declared `@orkestrel/*` dependencies to the fullest; remove local re-encodings of
   declared primitives.
4. Decide which additional `@orkestrel/*` packages are worth adding as dependencies or
   devDependencies (the user authorized additions from the Orkestrel line where they earn it).
5. Rule on additional transport forms — what the LSP ecosystem offers (socket, pipe, node-ipc,
   WebSocket), what probe (the first consumer) needs, and what would be more performant.

## Evidence pack (verified by the Orchestrator unless marked as a lane's claim)

### lsp today

- `src/core`: `LSPClient.ts` (713 lines: correlation `#pending`, publications, decode/dispatch,
  generation lifecycle), `types.ts` (380), `validators.ts` (314), `parsers.ts` (286: incremental
  Content-Length codec), `helpers.ts` (`encodeLSPMessage`), `constants.ts`, `errors.ts`,
  `factories.ts`.
- `src/server`: `transports/StdioTransport.ts` (238: raw-byte child supervisor with generation
  ownership), `types.ts`, `factories.ts`.
- Transport seam: `LSPTransportInterface` = `emitter` (`chunk`/`exit`/`error`) + `start` + `send`
  + `close` — a byte transport; the client owns Content-Length framing.
- ROADMAP `Next` names: `LSPServer` half; fold-or-justify `#cancelRequest` (one caller at
  `LSPClient.ts:577`) and `#releaseGeneration` (forwards 1:1 to `#closeTransport` at
  `LSPClient.ts:696-698`); TypeScript 7 conformance reading (user-approved, later session).

### mcp shape (Grok distillate, spot-checked)

- Core owns protocol entities plus TWO seams: `MCPClientTransportInterface` (parsed
  `JSONRPCMessage` carrier: `emitter` `message`/`close`/`error`, `session`, `duplex`, `start`,
  `send(message)`, `close`) and `MCPTransportInterface` (string port: `send(string)`, `listen`,
  `closed`, `close`; replace semantics) with binders `bindServer`/`bindClient` and
  `createDuplexClientTransport` in core.
- Host environments own only framing classes and option types. Server: HTTP client, WS client,
  WS server (per-connection), stdio client (via `@orkestrel/process` `Process`, newline-framed),
  stdio server (caller-owned streams). Browser: HTTP, WS, MessagePort.
- `MCPClient` (1091 lines) holds correlation/lifecycle as private glue and ONE sub-entity
  (`#tasks` exposed as `tasks`). Managers/controllers live on the server or per-request.
- mcp runtime deps: contract, emitter, process, sse, tool, websocket. Peer deps: router, server
  (HTTP ingress only).

### Ecosystem capabilities (Grok distillate over installed declarations, spot-checked)

- `@orkestrel/contract` unused-but-overlapping: `arrayOf`, `literalOf`, `unionOf`, `objectOf`
  (open object + optional-key list — matches the foreign-contracts law), `optionalOf`, `enumOf`.
  lsp `validators.ts` re-encodes those shapes with element loops and `===` chains (sites:
  `validators.ts:43,62,80` jsonrpc literal; `:163-167` severity; `:175-185` tags/related loops;
  `:204-207`, `:226-229` diagnostics loops; `:292-296` sync union). Fleet-canonical style (mcp
  `validators.ts`): keep `export function is*` guards, call combinators inline where they pay.
  `attempt`/`Result` unused — lsp throws `LSPError` consistently, which the error rules permit.
- `@orkestrel/abort` (`Abort`, `linkSignal` = `AbortSignal.any` wrapper) and `@orkestrel/timeout`
  (`Timeout` lifecycle timer): lsp hand-rolls one-shot deadlines with native
  `AbortSignal.timeout` + `Promise.race` (`LSPClient.ts:380,667-673,678-687`) and paired
  add/remove abort listeners. mcp does NOT depend on abort/timeout.
- `@orkestrel/process`: `ProcessInterface` exposes a LINE stream only (`lines`,
  `AsyncIterable<string>`); no raw byte stream. LSP needs unaltered `Uint8Array` chunks, so
  `StdioTransport`'s hand-rolled spawn over `buildSpawn`/`stopChild`/`waitForExit`/`waitForClose`
  is a proven semantic difference, not duplication. (Carried finding for the process package: a
  supervised byte-chunk stream would let stdio transports drop `node:child_process`.)
- `@orkestrel/websocket`: Node-only duplex wrapper, TEXT frames only on `send`/`message`. An LSP
  WebSocket transport would carry one JSON-RPC message per text frame (no Content-Length), which
  does not fit the current byte seam — it would need a message-framed seam variant like mcp's.
- `@orkestrel/sse`: string-chunk SSE parser; no LSP relevance today.
- `@orkestrel/tool`: JSON-Schema tool registry; no LSP client relevance; potentially relevant to
  a future `LSPServer` handler registry — argue, do not assume.
- `@orkestrel/pool` (uninstalled, registry-read): typed resource pool — a PROBE-side finding for
  warm language-server reuse, not an lsp dependency.
- `@orkestrel/test`: lsp test setup already reuses `resolveRoot`, `waitForCondition`,
  `isRunning`, recorder/scratch families; `formatConformanceValue`
  (`tests/setupConformance.ts:208-214`) overlaps `roundTripJSON` — minor.

### Probe consumer (Grok distillate, `file:line` verified against probe sources)

- Probe consumes lsp as the whole conversation layer: `createLSPClient({ transport, workspace,
  timeout: 2_000 })`, `createStdioTransport({ server: { command, directory }, grace: 1_000 })`,
  methods `start`/`open(doc, { signal })`/`close(uri)`/`destroy`, the `exit` event, and the types
  `LSPRange`/`isLSPRange` on its public `Issue` contract (`probe/src/server/stages/LintStage.ts:3-6,
  145-161, 207-225`; `probe/src/core/types.ts:2,201`).
- Spawn model is already warm-resident: ONE Oxlint child per `LintStage` lifetime, spawned at
  `Probe` construction (`#warm`, `LintStage.ts:80-82,145-161`), reused across every prove, recycled
  only after a deadline expiry (`Probe.ts:487-530`). No spawn per file, no spawn per prove, no
  pool.
- The diagnostics wait is bounded by the coordinator's 30 s `AbortSignal`, deliberately separate
  from the client's 2 s lifecycle `timeout` — the inspection-bound split the previous campaign
  landed.
- Oxlint 1.80.0 measured 2026-08-26: `textDocumentSync.openClose` with no `diagnosticProvider`,
  so probe exercises the PUSH (publish) diagnostics path.
- Command: `[process.execPath, <workspace oxlint entry>, '--lsp']` — stdio only. No probe TODO,
  comment, or roadmap row asks for another transport. Measured cost: warm prove 437-495 ms,
  boot 4.1-4.4 s (not lint-isolated).
- Consumer constraints on lsp: keep initialize/shutdown off the claim budget; keep the
  diagnostics-wait signal separable from the lifecycle timeout; never force a spawn per open.

## Questions each lane must answer, numbered

1. **Decomposition.** Given `LSPClient`'s internal regions (correlation, publications,
   decode/dispatch, generation lifecycle) and the architecture rules ("defining engine internals
   remain methods when extraction would hollow the class into a thin delegate"; managers are for
   compound member families), what — if anything — extracts from `LSPClient`, and what stays?
   mcp's client keeps correlation/lifecycle private and extracts only `tasks`. Name each proposed
   extraction with its interface, or rule that the class stays whole, with reasons.
2. **Seam rulings.** `#cancelRequest` (one caller) and `#releaseGeneration` (1:1 forward): fold or
   justify each, per the ROADMAP row.
3. **Transport seam shape.** Keep the byte seam (`chunk` events, client-owned framing) or adopt
   mcp's message-carrier seam (transport-owned framing)? LSP's Content-Length framing is
   transport-uniform for stdio/socket/pipe, which argues for the byte seam; WebSocket framing is
   per-message, which argues a second seam would be needed IF WebSocket lands. Rule with the
   consumer evidence.
4. **New transports.** Which of socket (`node:net` TCP), pipe (named pipe / unix domain socket via
   `node:net`), node-ipc, and WebSocket earn implementation NOW under the minimal-API law (first
   real consumer) given probe's evidence, and which are recorded as deferred with their trigger?
   Note `node:net` socket and pipe are one transport class differing only in connect options.
5. **Contract adoption depth.** Which validator sites adopt `arrayOf`/`literalOf`/`unionOf`/
   `objectOf`/`optionalOf`, and which stay hand-walked? Respect the foreign-contracts law (open
   objects, no exact-record guards over foreign data) and the fleet style (function guards, inline
   combinator calls).
6. **abort/timeout adoption.** Add the packages, or keep native `AbortSignal` composition? mcp
   keeps native. Rule with the superfluous-wrapper law.
7. **`LSPServer`.** Does the evidence (consumer demands, mcp precedent) justify designing the
   server half NOW, or does it stay in `Next`? If now, sketch its contract only.
8. **ROADMAP reshape.** What does the reconciled ROADMAP contain: which sections stay (Delivered
   history, Next, fleet findings), which go (stale branch table, campaign-end section), what gets
   added (this campaign's plan of record)?
9. **Unit decomposition.** Propose the implementation units (owned files, dependencies, serial
   order, acceptance criteria per unit) for whatever you rule in.

## Output

Numbered verdicts matching the question numbers, each with: the ruling, the reasons, the evidence
cited (`file:line`), and — where you propose units — owned files and independently checkable
acceptance criteria. Flag anything you could not settle as an open question with what would settle
it. No process diary.

## Deviation contract

This is a read-only design lane. A conflict with this brief's evidence pack (a fact you can
falsify by reading) is reported inline in your verdicts, with the pointer; do not stop for it.
