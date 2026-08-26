## Subject 1 — MCP

### Ruling proposed

Reject the completeness claim. Keep `createMCPLegacy(server)` as the optional legacy decorator, make the bare server strictly implement revision `2026-07-28`, and close the public client gaps for `subscriptions/listen` and input-required continuation. Treat Tasks as draft and unproven until task notifications and authoritative extension signatures are verified. Retain legal deprecated capability fields with `@deprecated` documentation, while removing methods excluded from the modern revision.

### Rationale

- `server/discover` is wired through server registration, dispatch, result construction, and the public client method. `/home/user/mcp/src/core/MCPServer.ts:316`, `/home/user/mcp/src/core/MCPServer.ts:432`, `/home/user/mcp/src/core/helpers.ts:872`, `/home/user/mcp/src/core/MCPClient.ts:308`, `/home/user/mcp/src/core/types.ts:2550`
- The modern boundary is wrong. `SUPPORTED_PROTOCOL_VERSIONS` mixes `2026-07-28` with legacy revisions, bare-server validation accepts any revision recognized by `inferEra`, and discovery advertises the mixed set. A modern request can therefore negotiate legacy semantics without entering the legacy decorator. `/home/user/mcp/src/core/constants.ts:15`, `/home/user/mcp/src/core/constants.ts:18`, `/home/user/mcp/src/core/constants.ts:21`, `/home/user/mcp/src/core/constants.ts:32`, `/home/user/mcp/src/core/MCPServer.ts:371`, `/home/user/mcp/src/core/MCPServer.ts:398`, `/home/user/mcp/src/core/helpers.ts:872`
- Rename `MCP_PROTOCOL_VERSION` to `MCP_LEGACY_VERSION`. Rename the older existing anchor to `MCP_LEGACY_FALLBACK_VERSION`. Separate modern discovery revisions from legacy initialization revisions. The existing name describes a legacy default as though it represented the package protocol. `/home/user/mcp/src/core/constants.ts:7-21`
- `-32022` and its `{ supported, requested }` data exist, and the client retries discovery after that response. The defect is era scope: the bare server reports legacy revisions as supported, so the error and retry can select an invalid modern path. `/home/user/mcp/src/core/constants.ts:82`, `/home/user/mcp/src/core/MCPServer.ts:398-404`, `/home/user/mcp/src/core/MCPClient.ts:680-700`
- The legacy seam already has the right shape. `createMCPLegacy(server)` creates an optional decorator; modern requests pass through, while legacy requests are translated and projected without a separate execution engine. `/home/user/mcp/src/core/factories.ts:61-69`, `/home/user/mcp/src/core/MCPLegacy.ts:32-41`, `/home/user/mcp/src/core/MCPLegacy.ts:70-80`, `/home/user/mcp/src/core/MCPLegacy.ts:145-199`
- `subscriptions/listen` is registered and implemented as a held-open stream, and the HTTP transport decodes streamed responses. The public `MCPClientInterface` exposes discovery, tools, calls, and tasks but no subscription operation. Searches for `listen`, `MCPSubscription`, and `notifications/tasks` covered `MCPClient.ts`, core public types, and browser/server client surfaces; no public subscription client or task-notification family was found. `/home/user/mcp/src/core/MCPServer.ts:319-320`, `/home/user/mcp/src/core/MCPServer.ts:1289-1376`, `/home/user/mcp/src/server/helpers.ts:37-85`, `/home/user/mcp/src/server/transports/HTTPClientTransport.ts:194-213`, `/home/user/mcp/src/core/types.ts:2502-2638`
- Multi-round-trip input is implemented on the server, including continuation verification, expiry, principal binding, and response validation. The client can receive `input_required`, but `call` cannot place `requestState` and `inputResponses` at the request-parameter level required for a retry. `/home/user/mcp/src/core/MCPServer.ts:969-1027`, `/home/user/mcp/src/core/MCPServer.ts:1038-1157`, `/home/user/mcp/src/core/types.ts:1036-1049`, `/home/user/mcp/src/core/types.ts:2282-2307`, `/home/user/mcp/src/core/types.ts:2634-2638`
- Tasks have durable states, server methods, client operations, capability checks, and discovery advertising. Task delivery through `notifications/tasks` is absent, while the campaign’s local research identifies that subscription family as part of the extension. Exact draft signatures remain an admitted research gap. `/home/user/mcp/src/core/MCPServer.ts:349-368`, `/home/user/mcp/src/core/MCPServer.ts:816-899`, `/home/user/mcp/src/core/MCPTaskClient.ts:11-81`, `.orkestrel/campaign/researcher-external-report.md:79-86`, `.orkestrel/campaign/researcher-external-report.md:97-102`
- The dated changelog removes modern `ping`, logging control, and roots-list notifications, while deprecating legacy capability declarations. The bare server still registers `ping`; roots, sampling, and logging declarations lack TypeScript deprecation markers. `/home/user/mcp/src/core/MCPServer.ts:312-315`, `/home/user/mcp/src/core/types.ts:216-243`, `.orkestrel/campaign/researcher-external-report.md:35-45`

### Units

- **Revision boundary** — Own `src/core/constants.ts`, `helpers.ts`, `MCPServer.ts`, `MCPClient.ts`, `MCPLegacy.ts`, public types, mirrored tests, and the MCP guide. Accept when bare discovery advertises `2026-07-28`, bare dispatch rejects every other stamped revision with `-32022` and era-scoped data, legacy initialization exists only through the decorator, legacy `ping` is answered by that decorator, and client negotiation cannot send legacy revisions through modern metadata.
- **Subscription client** — Own public subscription types, `MCPClient.ts`, transport integration tests, and guide examples. Add an entity-scoped `listen` operation returning a backpressured async stream with abort-driven closure. Accept when notifications remain ordered, the terminal subscription result settles the stream, caller abort reaches the peer, disconnect releases pending consumption, and the implementation works through the real HTTP stream decoder.
- **Input continuation** — Own `MCPCallOptions`, `MCPClient.ts`, continuation tests, and guide examples. Carry `state` and `responses` as grouped call options and emit them beside the tool name and arguments. Accept when an `input_required` outcome can be answered through the public client, altered state or arguments fail, expired state fails, and accepted responses resume the original execution.
- **Tasks proof** — Own Tasks types, subscription filters, server production, client consumption, tests, and guide parity. Stage the authoritative draft schema locally before changing signatures. Accept when declared methods and result shapes match that schema and task transitions can arrive through its specified notification family without polling.
- **Deprecated surface** — Own public capability declarations, parsers, tests, and TSDoc. Mark retained legal wire fields with `@deprecated`, remove modern producers and removed registrations, and preserve parsing only where the dated schema still permits receipt.

Dependency order: Revision boundary → Deprecated surface; Revision boundary → Input continuation; Revision boundary → Subscription client → Tasks proof.

### Risks

The revision split can strand legacy clients, break remote servers that advertised mixed revisions, or make the decorator forward `ping` into a method removed from the bare server. The cheapest probe is an in-memory matrix covering bare discovery, bare legacy rejection, decorated initialization, decorated `ping`, unsupported-version data, and client retry termination. Subscription work risks hanging streams or leaked abort listeners; run the same filter through the protocol-faithful HTTP fixture and assert notification order, terminal settlement, abort, and disconnect. Tasks risk is specification drift; compare public declarations against the staged extension schema before accepting runtime tests.

### Alternatives

- **Keep mixed-era support inside `MCPServer`** — Rejected. It preserves the demonstrated path where legacy revisions ride modern metadata and makes `createMCPLegacy` an optional name over behavior the bare server already accepts.

## Subject 2 — HTML and Markdown positions

### Ruling proposed

Add source provenance as a side structure owned by parsed-source entities, not as fields on AST nodes. Store half-open offsets into the original input using UTF-16 code units, expose node-to-span lookup, and derive line and character positions from the retained source. ASTs created by hand or produced through `map`, sanitizing, distilling, rendering, or cross-format conversion remain positionless. Do not add outline, folding, selection, or semantic-token structures until a local consumer exists. Replace Probe’s line-only issue location with an exact zero-based UTF-16 range.

### Rationale

- HTML AST nodes contain semantic data but no source positions. Tag scanners already expose exact UTF-16 end offsets, so the parser has the raw information before node construction discards it. `/home/user/html/src/core/types.ts:27-65`, `/home/user/html/src/core/types.ts:79-151`
- HTML normalizes CRLF and bare carriage returns before parsing. Offsets taken from the normalized buffer cease to identify original input after a shortened newline. `/home/user/html/src/core/parsers.ts:24-35`
- HTML transformations return rewritten document objects. Embedding spans in nodes would let copied or projected nodes claim provenance from source they no longer represent. `/home/user/html/src/core/types.ts:318-344`, `/home/user/html/src/core/HTML.ts:67-77`
- Markdown block parsing operates on split lines, trims paragraph content, joins reconstructed text, and builds nodes without retaining source offsets. Accurate spans require an offset-aware line representation through block and inline parsing. `/home/user/markdown/src/core/parsers.ts:31-40`, `/home/user/markdown/src/core/parsers.ts:97-113`, `/home/user/markdown/src/core/parsers.ts:125-126`, `/home/user/markdown/src/core/types.ts:217-228`
- Existing `walk` and `fold` APIs already expose stable node identities for an unmodified parsed document. A side lookup integrates with those APIs without burdening handcrafted nodes or serializable AST shapes. `/home/user/html/src/core/types.ts:297-332`, `/home/user/markdown/src/core/types.ts:353-379`
- No concrete local consumer was found for an outline, folding range, selection range, or semantic-token structure. Searches covered scaffold, Markdown source, and HTML source. The visible scaffold Markdown consumer extracts tables, not heading hierarchy. `/home/user/scaffold/src/bin/CLI.ts:44`, `/home/user/scaffold/src/bin/CLI.ts:1481`
- Probe loses diagnostic precision. Its public issue stores an optional line, and the lint adapter discards the diagnostic end and start character. `/home/user/probe/src/core/types.ts:183-191`, `/home/user/probe/src/server/stages/LintStage.ts:411-443`
- The LSP source model uses negotiated position encodings and half-open ranges; UTF-16 is the default when negotiation does not select another encoding. `.orkestrel/campaign/lsp-spec-distillate.md:65-89`

### Units

- **HTML provenance** — Own HTML public types, parser state, source helpers, `HTML.ts`, tests, and guide parity. Add a parsed-source entity retaining raw text, document, and node-span lookup. Accept when CRLF, bare carriage returns, astral characters, decoded entities, malformed tags, implied closes, raw text, and merged text nodes map back to exact original slices.
- **Markdown provenance** — Own Markdown public types, offset-aware block and inline parsing, source helpers, `Markdown.ts`, tests, and guide parity. Accept when headings, paragraphs, nested quotations, lists, fenced blocks, tables, links, escapes, hard breaks, CRLF, and astral characters resolve to exact original spans.
- **Probe locations** — Own `Issue` types, formatters, stage adapters, tests, and Probe guides. Replace `line` with `range`; normalize TypeScript and LSP diagnostics to zero-based UTF-16 positions and derive display numbering at formatting time. Accept when lint retains the complete published range and type diagnostics produce the same coordinate convention.
- **Structure gate** — Own no production files. Record outline, folding, selection, and semantic-token structures as deferred capabilities. Open an implementation unit only when a named guide, editor, indexer, or LSP server consumes the proposed domain structure.

Dependency order: HTML provenance → Markdown provenance; HTML provenance and Markdown provenance → Probe locations. Structure gate remains independent and deferred.

### Risks

Side lookup depends on node identity and cannot survive serialization or arbitrary reconstruction. That failure mode is honest: lookup returns `undefined` rather than inventing provenance. The cheapest probe parses input containing CRLF and astral text, walks the tree, slices the original source with every stored span, and verifies UTF-16 line and character derivation. A negative control using normalized-buffer offsets must fail. Probe migration risks changing report formatting; run identical lint and type diagnostics before and after migration and compare messages while asserting richer ranges.

### Alternatives

- **Add optional `span` fields to AST nodes** — Rejected. Those fields would become stale across copy-on-write transforms, sanitizing, distilling, and cross-format conversion, while forcing source concerns into valid handcrafted nodes.

## Subject 3 — Probe LSP and TypeScript 7

### Ruling proposed

Build a shared server-environment LSP client engine for Probe and make `LintStage` its concrete adopter. Implement complete client-role behavior for Probe’s declared capabilities: framing, request correlation, lifecycle, cancellation, position negotiation, document synchronization, server-request rejection, and a selected diagnostic path. Do not implement every optional LSP feature. Add a TypeScript 7 adapter only after the workspace toolchain proves the executable, launch contract, synchronization mode, and diagnostic capabilities; do not encode guessed flags or replace the stable TypeScript language-service stage without that proof.

### Rationale

- `LintStage` embeds a resident Oxlint process and implements LSP framing, identifiers, requests, notifications, initialization, document opening, shutdown, and diagnostic parsing inside the stage. `/home/user/probe/src/server/stages/LintStage.ts:19-37`, `/home/user/probe/src/server/stages/LintStage.ts:198-266`, `/home/user/probe/src/server/stages/LintStage.ts:314-405`
- Initialization advertises empty client capabilities and discards the server’s `InitializeResult`. The stage therefore cannot honor negotiated position encoding, text synchronization, diagnostic capability, or server requirements. `/home/user/probe/src/server/stages/LintStage.ts:214-225`
- The stage accepts only numeric response identifiers and `textDocument/publishDiagnostics`; other server requests and notifications receive no protocol response. `/home/user/probe/src/server/stages/LintStage.ts:381-405`
- LSP requires initialize/initialized ordering, shutdown/exit handling, declared synchronization behavior, and position-encoding agreement. Full and incremental document changes are protocol alternatives selected from server capability data. `.orkestrel/campaign/lsp-spec-distillate.md:29-43`, `.orkestrel/campaign/lsp-spec-distillate.md:65-79`, `.orkestrel/campaign/lsp-spec-distillate.md:156-166`
- Push and pull diagnostics are valid protocol paths, but the local distillate cannot prove a standard merge policy. Select a path from negotiated capability data and never merge push and pull streams for the same inspection. `.orkestrel/campaign/lsp-spec-distillate.md:97-101`, `.orkestrel/campaign/lsp-spec-distillate.md:170-179`
- `TypeStage` uses resident in-process TypeScript language services and real workspace configuration. Replacing it without a verified native LSP launch path risks losing project selection, overlay behavior, and deterministic diagnostics. `/home/user/probe/src/server/stages/TypeStage.ts:28-43`, `/home/user/probe/src/server/stages/TypeStage.ts:269-326`
- Local TypeScript 7 research confirms the native-LSP direction but leaves synchronization, diagnostics, symbols, semantic tokens, folding, launch, and migration details unresolved. `.orkestrel/campaign/researcher-external-report.md:5-29`, `.orkestrel/campaign/researcher-external-report.md:51-58`

### Units

- **LSP contracts** — Own Probe server types, validators, parsers, and errors. Model the protocol subset Probe declares, including initialize results, position encoding, synchronization capability, diagnostics, cancellation, shutdown, and method-not-found responses. Accept when malformed or unsupported frames fail through typed Probe errors without assertions or suppressed checks.
- **LSP engine** — Own a server-environment client class, centralized helpers, server barrel exports, and protocol-faithful fixture tests. Expose entity-scoped lifecycle and document operations. Accept when fragmented frames, coalesced frames, request cancellation, server errors, unsupported server requests, shutdown, exit, process death, and abort release their resources deterministically.
- **Lint adoption** — Own `LintStage.ts`, stage tests, and Probe guide parity. Replace private framing and lifecycle code with the shared engine. Advertise UTF-16, read `InitializeResult`, follow full or incremental synchronization as selected by the server, and select pull diagnostics only when the server advertises them. Accept against the real workspace Oxlint binary and the fixture server.
- **TypeScript adapter gate** — Own a local capability receipt before production code. Run the TypeScript 7 executable from a native toolchain environment, capture initialization and diagnostic exchanges, and record launch arguments plus capabilities. Open the adapter unit only if that receipt proves parity with project selection, overlays, cancellation, and diagnostic ranges. Until then, retain `TypeStage`.

Dependency order: Probe locations from Subject 2 → LSP contracts → LSP engine → Lint adoption → TypeScript adapter gate.

### Risks

A broad engine can become a speculative protocol framework. Limit its public contract to behavior used by Probe stages and the requests required to operate that behavior correctly. Incorrect capability advertising can trigger messages the engine cannot process; the cheapest probe varies `positionEncoding`, `textDocumentSync`, and `diagnosticProvider` in a protocol-faithful fixture and verifies emitted frames and refusal responses. The TypeScript migration risks weaker project fidelity; compare native-LSP diagnostics against the resident language service on generated-consumer projects before replacing the stage.

### Alternatives

- **Keep stage-local LSP clients** — Rejected. Oxlint and TypeScript would duplicate framing, lifecycle, cancellation, synchronization, and diagnostic policy, preserving the defects already visible in `LintStage`.

## Subject 4 — Progress contracts

### Ruling proposed

Do not extract a fleet-wide progress contract. MCP progress is request-scoped, token-correlated, strictly increasing, and tied to request settlement. Workflow progress is a replaceable aggregate activity snapshot with `current`, optional `total`, optional `unit`, and a separate note. Those meanings are not interchangeable. Keep domain contracts local and add an explicit adapter only when a concrete integration needs translation.

### Rationale

- MCP defines `{ progress, total?, message? }`, requires strictly increasing finite reports, and binds the receiver to request lifetime. `/home/user/mcp/src/core/types.ts:679-707`, `.orkestrel/campaign/researcher-external-report.md:64-69`
- Workflow defines `{ current, total?, unit? }`; omission clears stored aggregate progress, while `note` carries observer text separately. Its lifecycle events are separate from activity reporting. `/home/user/workflow/src/core/types.ts:184-232`, `/home/user/workflow/src/core/types.ts:696-717`, `/home/user/workflow/src/core/types.ts:890-917`
- Mapping Workflow to MCP loses `unit`, changes replacement semantics into temporal monotonic semantics, and treats `note` as a protocol message. A shared structural type would hide those differences rather than centralize equivalent behavior.
- Process exposes stdout lines and terminal state. Carriage-return redraws become lines, so output resemblance to a progress bar does not establish numeric completion. `/home/user/process/src/core/types.ts:203-273`
- Queue exposes lifecycle events, retry attempts, stable execution identity, and abort signals but no handler progress channel. `/home/user/queue/src/core/types.ts:78-115`, `/home/user/queue/src/core/types.ts:206-229`
- Tool execution exposes arguments and caller context but no cancellation or progress context. `/home/user/tool/src/core/types.ts:83-93`, `/home/user/tool/src/core/types.ts:169-183`
- Middleware owns error reporting and settled request telemetry. Neither callback represents in-flight work. `/home/user/middleware/src/core/types.ts:20-33`, `/home/user/middleware/src/core/types.ts:35-65`
- Probe has no public progress contract. Its visible result surface reports stage evidence, while the lint stage’s internal `#progress` value coordinates document publications rather than consumer progress. `/home/user/probe/src/core/types.ts:425-450`, `/home/user/probe/src/server/stages/LintStage.ts:229-266`

### Ideas ranked

- **Recommended — domain-owned progress with boundary adapters.** Solve protocol translation without erasing lifecycle or ownership. The adapter maps Workflow `current` to MCP `progress`, `total` directly, and `note` to `message`; it must reject regressions and define how `unit` is handled. MCP and Workflow remain the real adopters. Process, Queue, Tool, Probe, and Middleware resist adoption because their public contracts lack equivalent semantics.
- **Reserve — shared value shape in `@orkestrel/contract`.** Minimal shape: `{ progress, total?, message? }`. Reconsider only after a non-MCP request-scoped consumer proves the same monotonic and lifetime rules. Structural resemblance is insufficient.
- **Reject — lifecycle progress envelope.** A begin/report/end model solves long-operation presentation but duplicates Workflow lifecycle, conflicts with MCP request settlement, and adds policy to packages that expose only terminal or observational events.

### Risks

Deferring extraction can permit vocabulary drift. Premature extraction is worse: it can spread false monotonicity, erase units, or couple request tokens to unrelated packages. The cheapest probe is a temporary integration test that adapts Workflow reports into MCP notifications and exercises progress regression, omitted totals, notes, units, abort, and request settlement. Promote a shared contract only if the adapter becomes lossless without protocol or product policy.

### Alternatives

- **Extract the MCP payload into `@orkestrel/contract`** — Rejected for this campaign. The type cannot express token ownership, request lifetime, backpressure, or Workflow replacement semantics.
- **Adopt an LSP-style begin/report/end envelope** — Rejected. No local consumer requires that lifecycle, and adding it would expand Queue, Tool, Process, Probe, and Middleware without demonstrated use.

## Exit criterion

The audit report must contain the changed API diff, defect proofs captured red before repair and green after repair, package gate receipts, generated-consumer and package-content evidence, guide parity, authoritative local protocol sources, and unresolved claims kept out of accepted status. Subject 1 reaches **ACCEPTED** only when bare-modern and decorated-legacy matrices pass and the client can discover, listen, continue input, and consume verified Tasks behavior. Subject 2 reaches **ACCEPTED** when original-source spans and Probe ranges survive CRLF and astral-text probes; syntax structures remain **DEFERRED** until a named consumer exists. Subject 3 reaches **FOUNDATION ACCEPTED** when the shared engine and Oxlint adoption pass fixture and live-binary tests; the TypeScript 7 adapter remains **DEFERRED** until its native capability receipt proves parity. Subject 4 reaches **RULED** with no fleet extraction; reconsideration requires a lossless adapter backed by a concrete non-MCP request-scoped consumer.