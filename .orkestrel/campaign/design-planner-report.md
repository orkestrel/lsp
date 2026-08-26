# Report: design round, subjective lane (planner, Opus 5)

Returned 2026-08-25. Brief: design-brief.md. The lane held shape, naming, ergonomics, and
design fit; completeness claims about mcp were conditioned on the objective lane's own
verification.

---

# Subject 1 — mcp: completeness and the legacy seam

## 1. Ruling proposed

Keep the seam's shape and fix its names. `createMCPLegacy(server)` at `/home/user/mcp/src/core/factories.ts:67-68` already **is** the optional legacy wrapper function the user asked for — one call, one argument, composable at every transport, costing nothing when unused — so do not reshape it into an option, a mode, or a second server. Rename the entity so the call site reads itself: `MCPLegacy` becomes `MCPDualEra` and the factory becomes `createMCPDualEra`, because wrapping *widens* a modern server to serve both eras and the present name says it narrows one to legacy. Rename the version constants so each name states the era it selects: `MCP_PROTOCOL_VERSION` becomes `MCP_HANDSHAKE_VERSION`, `MCP_LEGACY_VERSION` becomes `MCP_FALLBACK_VERSION`, `MCP_MODERN_VERSION` and `SUPPORTED_PROTOCOL_VERSIONS` stay. Treat completeness as a matrix the objective lane fills rather than as a build list: my own reading finds `server/discover` registered at `/home/user/mcp/src/core/MCPServer.ts:316`, `subscriptions/listen` at `:319`, the tasks methods at `:362-366`, the input-required retry path at `:1000,1049-1097,1277`, and `-32022` declared as `MCP_UNSUPPORTED_VERSION` at `/home/user/mcp/src/core/constants.ts:83` — so the design work here is naming, not construction, unless a row comes back absent.

## 2. Rationale

**The seam is already right, and the tree proves it by repetition.** Every transport composes the wrapper positionally: `bindServer(createMCPLegacy(mcp), …)` (`/home/user/mcp/src/browser/factories.ts:119`), `createMCPRoutes(createMCPLegacy(mcp))` (`/home/user/mcp/src/server/factories.ts:101`), `createWebSocketServer(createMCPLegacy(mcp), …)` (`:210`), `createStdioServer(createMCPLegacy(mcp))` (`:384`), `createMCPPostHandler(createMCPLegacy(mcp), …)` (`/home/user/mcp/src/server/handlers.ts:54`), `router.add(createMCPRoutes(createMCPLegacy(mcp)))` (`/home/user/mcp/src/server/middlewares.ts:91`). One position, every transport. It pays nothing unused: the modern server registers no `initialize` handler, so an unwrapped composition never enters legacy code, and a wrapped one forwards modern invocations untouched after a single guard (`/home/user/mcp/src/core/MCPLegacy.ts:74-79`).

**The repeated comment is the design asking for a name.** The same clause — `// answers initialize too; pass mcp alone for modern-only` — sits beside the factory at every one of those example sites. A clause a package must repeat at every call site is carrying meaning the identifier refuses to carry. `MCPLegacy` names what the decorator adds; it does not name what the composed server becomes. A reader meeting `createMCPLegacy(mcp)` reasonably concludes the server was downgraded. It was widened. The lifecycle page's own word for an implementation serving both eras is **dual-era** (`researcher-external-report.md` § Lifecycle / versioning), so `createMCPDualEra(mcp)` states at the call site exactly what the comment states beside it, and the comment goes.

**`MCPLegacyResult` keeps its name.** It names a result in the legacy era, which is what it is (`/home/user/mcp/src/core/types.ts:184`, projected at `MCPLegacy.ts:168-200`). Renaming the class does not make the era's name wrong.

**The constants break "one concept, one term" and "describe what a thing is."** `MCP_PROTOCOL_VERSION = '2025-11-25'` and `MCP_LEGACY_VERSION = '2025-06-18'` (`/home/user/mcp/src/core/constants.ts:15,18`) both name legacy revisions, and only one says so. Worse, `MCP_PROTOCOL_VERSION` reads as the package's protocol version, and in a modern-core package no such value exists — the revision rides per request in `_meta` (`constants.ts:38-39`; `researcher-external-report.md` § Lifecycle). The TSDoc at `constants.ts:7-13` exists to correct its own identifier, which is the defect stated out loud. The renames select by role: `MCP_HANDSHAKE_VERSION` is the revision the legacy `initialize` handshake offers and defaults to; `MCP_FALLBACK_VERSION` is the anchor `buildInitializeResult` falls back to when the requested revision cannot be echoed (`/home/user/mcp/src/core/helpers.ts:947-948`). Consumers to update are named in `fleet-sweep-evidence.md` § 1: `src/server/inferers.ts:9,65,136`, `src/core/MCPLegacy.ts:27,218`, `src/core/MCPClient.ts:44,676,709`, `src/core/helpers.ts:43,947-948`, plus the test imports it lists.

## 3. Units

**U1.1 `mcp-constants` — Opus `implementer`.** Owns `/home/user/mcp/src/core/constants.ts`, every source consumer the sweep names, the tests importing those names, and the `guides/mcp.md` prose that quotes them. Acceptance: neither old identifier resolves anywhere under `src/`, `tests/`, or `guides/`; each declaration's TSDoc states the era it selects without correcting its own name; `npm run check` and `npm run test:guides` green.

**U1.2 `mcp-dual-era` — Opus `implementer`, after U1.1.** Owns `src/core/MCPLegacy.ts` renamed to `src/core/MCPDualEra.ts`, `src/core/factories.ts`, `src/core/index.ts`, the `MCPLegacyOptions` declaration at `src/core/types.ts:1826`, every example fence naming the factory, and the tests. Acceptance: one exported factory `createMCPDualEra`; the repeated `// answers initialize too` clause is deleted from every example because the identifier carries it; `MCPLegacyResult` is unchanged; guide parity green.

**U1.3 `mcp-coverage` — `analyst`, Sol.** Produces the capability/defect matrix over `server/discover` end to end through a transport, `subscriptions/listen`, the input-required retry pattern, the tasks extension, the Roots/Sampling/Logging deprecations, and `-32022` semantics. Each row ends implemented, repaired, retained, or intentionally excluded with `file:line`. Runs parallel to U1.1; any row ending "repair" becomes a successor unit that lands **before** the rename cascade so mcp bumps once.

## 4. Risks

Renaming a class, a factory, and two constants moves the published surface, so mcp bumps and probe re-pins `mcp ^0.0.24`. If U1.3 finds a mechanism unreachable end to end, the repair unit and the rename unit collide in `factories.ts` and `handlers.ts` and must serialize. The cheapest probe that settles reachability: start a real stdio server with `createStdioServer(mcp)` on the host, write `server/discover` and `subscriptions/listen` frames to its pipe, and read the answers — a child-process proof, so it runs on the host and never inside a bench sandbox.

## 5. Alternative, ruled

**Make the era an option: `createMCPServer({ …, legacy: true })`.** Ruled out. It puts an era switch inside the modern core, which is the posture the user's direction removes; it makes every modern-only consumer carry the branch; and it moves a composition decision — which eras this deployment serves — into the server, which is product policy in framework code. The wrapper keeps the modern core literally free of `initialize`, and that is the property worth protecting.

---

# Subject 2 — html and markdown: the position and structure gap

## 1. Ruling proposed

Put one optional source span on every AST node in both packages, as UTF-16 code-unit offsets, named `span`, and add nothing else. No side structure, because the packages publish `map`, `filter`, `fold`, `reduce`, and `stream` and a side index loses its entries on the first transform, silently and without a type error. No second coordinate, because line and character are derivable from an offset and the source text, and the derive-state law forbids storing a derivable fact twice. Ship no `Position`, no `Range`, no outline, no folding ranges, no selection ranges, and no semantic tokens: the span has a real first consumer, and none of those does. Record each excluded structure in its package guide with the trigger that admits it, so the next campaign inherits a ruling rather than a silence.

## 2. Rationale

**`span` is the right word and the right shape.** One word, so it satisfies the entity-member rule. Not `range`, because LSP's `Range` is a line/character pair (`lsp-spec-distillate.md` § Position / Range / Location) and reusing the word for offsets mis-cues every LSP-literate reader. Not separate `start` and `end` fields, because two independent optionals admit a half-present state the type must refuse. Declared per package as `HTMLSpan` and `MarkdownSpan`, each `{ readonly start: number; readonly end: number }` with an exclusive `end`, both in their own `types.ts`. Structural typing lets a value cross the packages freely, so a shared declaration buys nothing and would cost a re-export ban violation or a cascade through `@orkestrel/contract`, which is not one of this campaign's checkouts.

**UTF-16 is already the unit, so keeping it costs nothing and converting later stays possible.** The scanner's offsets are UTF-16 code units and the package states it: `/home/user/html/src/core/types.ts:39,52-53`, `parseStartTag` at `/home/user/html/src/core/helpers.ts:171`, and the test named for the unit at `/home/user/html/tests/src/core/helpers.test.ts:441`. JavaScript indexes strings in that same unit, so `text.slice(span.start, span.end)` returns exactly the node's source with no conversion — which is both the field's cheapest proof and its most useful property. UTF-16 is also LSP's default and its mandatory encoding, with `utf-8` and `utf-32` negotiated per session (`lsp-spec-distillate.md` § Position encoding), so storing line/character on a node would fix an encoding the consumer may not have negotiated and would then have to undo.

**Absence is `undefined`, never a sentinel.** A node built by `markdownToHTML` (`/home/user/markdown/src/core/helpers.ts:811`), by `htmlToMarkdown` (`:2125`), by `map`, or by a consumer factory has no source, so it carries no `span`. A sentinel span such as `{ start: -1, end: -1 }` would slice silently and is banned twice over.

**Round trips stay positionless, and the guide says so rather than engineering around it.** `markdownToHTML` and `htmlToMarkdown` transform positionless inputs by construction (`fleet-sweep-evidence.md` § 3). A consumer wanting markdown spans parses the markdown; it does not round-trip for them.

**The first consumer for spans is real; the first consumer for the structures is not.** scaffold reads the catalog table through the declared parser and reports drift on rows it finds (`/home/user/scaffold/src/bin/CLI.ts:1477-1490`); with a span it names the row's location instead of its text. No fleet consumer walks an html or markdown tree for hierarchy, folding, selection, or token classification. Building those against no consumer is exactly what the creation gate refuses.

**What probe gains, stated honestly: nothing on the lint path.** probe's `Issue` is `{ origin, path, message, line? }` (`/home/user/probe/src/core/types.ts:183-192`) and its lint stage drops `start.character`, `range.end`, and the encoding (`/home/user/probe/src/server/stages/LintStage.ts:418-440`) — but those diagnostics come from oxlint over LSP, not from an html or markdown AST. probe's coordinate gap and these packages' coordinate gap are independent, and subject 3 owns probe's. The conditional gain is worth naming: a probe stage that reports issues about guide markdown takes its locations from `MarkdownSpan`, and the shared vocabulary is what makes that stage cheap when someone asks for it.

## 3. Units

**U2.1 `html-span` — Opus `implementer`.** Owns `/home/user/html/src/core/types.ts` (declare `HTMLSpan`; add `readonly span?: HTMLSpan` to `ElementNode`, `TextNode`, `CommentNode`, `DoctypeNode`, `HTMLDocument` at `:79-151`), `src/core/parsers.ts`, `src/core/helpers.ts` (attach the offsets the scan already tracks), and `guides/html.md`. The unit decides explicitly whether `sanitize` and `distill` preserve or drop `span` on the nodes they construct, and records that decision at the type. Acceptance: for a parsed document, slicing the source by every node's `span` returns that node's own source text; a transform-built node carries none; `npm run check`, `test:src:core`, and `test:guides` green.

**U2.2 `markdown-span` — Opus `implementer`, after U2.1 so the vocabulary lands once.** Owns `/home/user/markdown/src/core/types.ts:44-221`, `src/core/parsers.ts:31,125,136`, `src/core/helpers.ts`, and `guides/markdown.md`. Acceptance: the same slice property over a parsed document; `markdownToHTML` and `htmlToMarkdown` document that their output carries no span.

**U2.3 `span-exclusions` — `builder`, Sonnet.** Owns the guide sections in both packages that record the outline, folding ranges, selection ranges, semantic tokens, and the line/character helper as intentionally excluded, each with its admitting trigger. Acceptance: each excluded capability is named with a trigger a later reader can test; no source file changes.

## 4. Risks

A field on every node grows every parsed tree and every serialized AST, and both packages compare node shapes in tests, so a golden expectation over a parsed node breaks. Cheapest probe: parse a representative guide with the current parser, then with the field, and read the serialized size delta on the host. The sharper risk is a span that points at the wrong text — worse than no span — which arises where `sanitize` and `distill` rebuild nodes; the slice-equality acceptance criterion is written precisely to catch it, and it must run over the distilled and sanitized trees, not only the parsed one.

## 5. Alternative, ruled

**Store line and character on nodes so consumers reach LSP shapes with no conversion.** Ruled out. It makes every parse maintain a line index whether or not the caller wants positions; it bakes one encoding into stored data while LSP negotiates the encoding per session; it cannot recover a node's source text without a second walk; and a consumer wanting offsets must convert back, which needs the line index anyway. One stored offset plus one conversion at the boundary serves every consumer and every negotiated encoding.

---

# Subject 3 — probe: the path toward full LSP

## 1. Ruling proposed

Extract one language client from `LintStage`, widen `Issue` to carry the range, and stage the work so the TypeScript 7 move is a transport swap rather than a rewrite — but reject "full LSP client conformance" as the goal. probe is a diagnostics consumer, not an editor; the conformance that pays is the part that changes what probe reports or how reliably it reports it, and everything else is speculation the minimal-API law refuses. Centralize the client: one `LanguageClient` driven by the lint stage today and by the type stage when the native toolchain arrives. Its public surface is `capabilities`, `encoding`, `open`, `close`, `start`, `destroy`, and `emitter` — and deliberately **not** a generic `request`/`notify` pair, because publishing an escape hatch turns the client into a JSON-RPC library and invites every stage to invent its own protocol conversation.

## 2. Rationale

**The client already exists; it is wearing a stage's name.** `LintStage` owns framing (`/home/user/probe/src/server/stages/LintStage.ts:348-350,353-378`), correlation by numeric id (`:381-394`), document lifecycle (`:234-267,311`), the shutdown/exit/kill sequence (`:114-177`), and diagnostic mapping (`:396-443`). Extraction passes the wrapper test on three independent grounds: it adds a boundary (framing and correlation), a lifecycle (`initialize` through `exit`), and an invariant (one open document per URI, enforced at `:236-243`). It is not a rename-wrap.

**Reading the handshake is the highest-value edit in the subject and the cheapest.** `#warm` awaits the `initialize` response and discards the value (`LintStage.ts:214`), so `capabilities`, `serverInfo`, and `positionEncoding` all arrive and are thrown away. Storing them removes the silent assumption behind `:396` — that the server publishes diagnostics at all — and it is what makes every later decision honest. `encoding` is derived from the server's `positionEncoding` against what the client offered, defaulting to `utf-16` (`lsp-spec-distillate.md` § Position encoding), not stored twice.

**The boundary between client and stage is the LSP `Diagnostic` value, not `Issue`.** `open(document)` returns the diagnostics promise; the stage maps them to `Issue`. A language client that knows probe's domain type is a client that cannot serve a second stage. probe owns its copy of the diagnostic shape in `src/server/types.ts` and validates what it dereferences, per the foreign-contract rule.

**`Issue` loses `line` and gains `range`.** Keeping both stores a derivable fact twice, and `range.start.line` is that fact. The shape: `readonly range?: IssueRange` where `IssueRange` is a start and end `IssuePoint`, each `{ readonly line: number; readonly character: number }`, published one-based at both members because `Issue` is what a person reads and every compiler and editor reports one-based; the zero-based-to-one-based conversion happens once, at the mapping boundary, and is stated at the type. Absence keeps its present meaning — a whole-file diagnostic with no location (`/home/user/probe/src/core/types.ts:169-171`).

**Options group by entity and carry no abbreviation.** `{ workspace, server: { command: readonly string[] }, on?, error? }`, where `command` is the argv vector. Pointing the client at `tsgo --lsp` instead of `oxlint --lsp` then becomes data, which is the whole content of "transport swap".

**Which unknowns decide which choice.** `researcher-external-report.md` § TS7 LSP matrix records diagnostics push and diagnostics pull as unknown; those two rows alone decide whether the client needs a pull method — if the native server publishes, the type stage reuses the lint stage's push path unchanged; if it answers `textDocument/diagnostic` instead, the client grows one request method selected by the server's advertised `diagnosticProvider`. Text-document sync decides whether `didChange` is ever required. Progress decides whether a long type check needs visibility. The `documentSymbol`, `semanticTokens`, and `foldingRange` rows decide nothing for probe, because probe reports diagnostics.

**Excluded, with triggers.** `didChange` waits for a stage that re-inspects a path it already opened; today each inspection opens and closes (`LintStage.ts:252`), which is correct for a one-shot probe. `$/cancelRequest` waits for a request long enough to cancel; today the deadline path kills the child (`:160,175`). Work-done progress waits for a consumer that renders it.

**Host constraint, designed for.** Every proof of this client drives a child over pipes, which a bench sandbox measures as a false green. These units route to the Opus native `implementer` and their acceptance evidence is a host run.

## 3. Units

**U3.1 `probe-handshake` — Opus `implementer`.** Owns `LintStage.ts` and `src/server/types.ts`. Declares the client capabilities probe consumes, stores the `InitializeResult`, derives the encoding. Acceptance: a host run against the workspace's own `oxlint --lsp` records the advertised capabilities and the resolved encoding in the stage's state; the lint suite stays green on the host.

**U3.2 `probe-range` — Opus `implementer`, after U3.1 (shared file).** Owns `/home/user/probe/src/core/types.ts`, the mappings in `LintStage.ts:411-443`, `TypeStage.ts`, and `RuntimeStage.ts`, every report renderer, and the guides. Acceptance: `Issue` declares `range?` and declares no `line`; a diagnostic carrying a column reports that column; the consumer set is derived by running the suite rather than by search; `npm run check` and guide parity green.

**U3.3 `probe-client` — Opus `implementer`, after U3.2.** Extracts `LanguageClient` to `src/server/clients/LanguageClient.ts`; framing helpers stay in `src/server/helpers.ts`, where `parseContentLength` already lives (`:606-611`). Acceptance: `LintStage` contains no `Content-Length` literal and no id map; the client's public surface is exactly the named members; after `destroy()`, no orphan child survives, read by recorded process id on the host.

**U3.4 `probe-ts7-seam` — `builder`, Sonnet.** Owns probe's guide section recording each named unknown, the decision it settles, the observable that closes it, and each excluded LSP capability with its trigger. Acceptance: a reader can name what evidence would move each row.

## 4. Risks

Teardown timing is load-bearing and easy to break in an extraction: the present order is the `shutdown` request, then the `exit` notification, then a wait, then `SIGKILL` (`LintStage.ts:172-175,160`), and a resident language server that outlives a run is a defect that reports as flakiness elsewhere. The process-id check in U3.3's acceptance is the probe that settles it. Dropping `line` from `Issue` breaks every consumer that reads it, including the receipt path; deriving that set from a suite run rather than a text search is the difference between a clean cascade and a missed call site.

## 5. Alternative, ruled

**Leave the client inside `LintStage` and give `TypeStage` its own when TS7 lands.** Ruled out. It guarantees a second framing implementation and a second correlation table — the duplication the centralize and one-shared-engine laws name directly — and it schedules that second client's design for the moment the toolchain moves under the package, which is the worst available moment to design a protocol client.

---

# Subject 4 — workflow, process, tool, queue, middleware: ideas ranked

A constraint that shapes the ranking: `@orkestrel/contract` is not one of this campaign's checkouts, and every fleet package depends on it. Any shared-type answer is therefore a change in a repository this campaign cannot reach, plus a re-pin cascade through packages that gain nothing.

## Idea A — recommended: adopt MCP's progress vocabulary per package, share no type

**Shape.** Where a package reports incremental progress, it reports `{ progress, total?, message? }` with `progress` monotonically increasing, matching the MCP payload (`researcher-external-report.md` § Progress). Each package declares its own type under its own entity name. No shared package, no cross-package import.

**workflow adopts it.** `TaskProgress { current, total?, unit? }` (`/home/user/workflow/src/core/types.ts:191-195`) becomes `{ progress, total?, message? }`. `current` becomes `progress` because that is the fleet's chosen word once the fleet chooses MCP's. `unit` becomes `message`: `unit` is a formatting hint and `message` is human-readable text, and MCP carries the latter. The cost is honest — a renderer that pluralized by `unit` loses a machine-readable hint, and a reporter that wants "17 of 40 files" writes it into `message`. The behavioral half is the part that earns a test: `TaskInterface.report` replaces the whole activity frame (`types.ts:217-222,905-908`), which permits `progress` to fall, and MCP's monotonic requirement means the reporter refuses a non-increasing value against the previous frame.

**queue adopts nothing.** Its `retry [id, attempt]` is a retry counter and `count`/`active` are occupancy (`/home/user/queue/src/core/types.ts:84,208-209`). A queue entry is opaque work; the thing that knows its progress is the job, and the job reports through its own package.

**process adopts nothing.** It streams lines and exits (`/home/user/process/src/core/types.ts:112-119,231`), and the progress-bar note at `:217` is about line framing, not a reported ratio. Giving process a progress surface means parsing a child's stdout for progress, which is product policy inside framework code.

**tool stays inert, and the fleet already proves that layering works.** tool has no emitter, no signal, and no incremental callback (`/home/user/tool/src/core/types.ts:93,176-183`; `guides/tool.md:26`). Progress for a tool call already exists one layer up, where the request lives: `MCPExecutionContext.progress` (`/home/user/mcp/src/core/types.ts:715`) and the server's reporter (`/home/user/mcp/src/core/MCPServer.ts:803-810,904-937`). The entity that owns the request owns the token; the tool stays a definition plus a handler. Record the ruling in tool's guide so it is not reopened.

**middleware stays untouched, with one named trigger.** Observation is callbacks (`/home/user/middleware/src/core/types.ts:30-32,63-65`) and `UploadStatus` is a file-placement fact, not a lifecycle (`/home/user/middleware/src/server/types.ts:138`). Multipart is the one place MCP-shaped progress would fit — the parser holds a signal (`/home/user/middleware/src/server/MultipartParser.ts:19,36`) and knows the size — and the trigger is a consumer asking for upload progress, answered with a reporter callback in the multipart options rather than a new emitter.

**Why it ranks first.** It delivers the whole benefit the user's lean asks for — the fleet's progress reads like MCP's — for one package's rename, and it commits nothing a later shared contract would have to undo.

## Idea B — live: one shared `Progress` in `@orkestrel/contract`

**Shape.** `{ readonly progress: number; readonly total?: number; readonly message?: string }` in contract; workflow imports it; mcp's `MCPProgress` (`/home/user/mcp/src/core/types.ts:678-683`) collapses onto it.

**Cost.** The change lands in a repository outside this campaign and cascades a re-pin through every fleet package. And `MCPProgress` is a wire type — what `buildProgressNotification` puts on the wire (`/home/user/mcp/src/core/helpers.ts:371-384`) and what `isMCPProgress` validates (`/home/user/mcp/src/core/validators.ts:324-338`) — so collapsing it onto a shared domain type couples mcp's protocol surface to a package whose values it must still own and validate at arrival.

**Ruling.** Live but second. It becomes first when a package beyond workflow reports progress and the duplication is measured rather than anticipated.

## Idea C — ruled out: adopt the tasks extension's status model fleet-wide

**Shape.** Align `LifecycleStatus` (`/home/user/workflow/src/core/types.ts:330`) with `working | input_required | completed | failed | cancelled`.

**Why it loses.** The unions answer different questions. workflow's names a scheduled unit's state and includes `skipped`, which the extension has no word for and which the fixed lifecycle table's `skip` verb owns. The extension's `input_required` names a protocol round trip no fleet package has, so adopting it adds a state nothing produces — the real-domain-states law refuses both moves. The extension is also draft and carries no stability guarantee, which mcp already records at `/home/user/mcp/src/core/constants.ts:56-61`. The status stays a wire vocabulary inside mcp, where `MCPTaskStatus` declares it and its TSDoc already records that the `input_required` spelling belongs to neither package (`/home/user/mcp/src/core/types.ts:752-758`).

## Risks

Renaming `TaskProgress` members moves workflow's published surface, so every consumer of `TaskActivity` re-pins. Landing the monotonic invariant in the same change is the sharper risk: a reporter that legitimately restarts a unit's counting is refused, and the campaign will read that refusal as a defect in the invariant rather than as the reporter owing a new frame. Cheapest probe: replay workflow's own test reporters against the monotonic check on the host and read which ones it refuses, before the invariant is written into the type.

---

# Tensions for the other lane

- **Renaming `MCPLegacy` to `MCPDualEra`** costs a published-surface move and a consumer re-pin to buy a call site that reads itself. I judged the misreading it prevents — "wrapping downgrades the server" — worth the bump in a greenfield fleet that updates every consumer atomically. The objective lane may price the cascade higher.
- **`open` and `close` on `LanguageClient`** sit beside the fixed lifecycle verbs without being in the table. I judged them correct because they name document ownership in LSP's own vocabulary; the alternative is a `documents` sub-entity, which I judged heavier than one-open-document-at-a-time earns.
- **Deleting `line` from `Issue`** obeys the derive-state law and costs every reader one extra property access. I chose the law.
- **Declaring `HTMLSpan` and `MarkdownSpan` separately** duplicates a two-number record rather than reaching for `@orkestrel/contract`. I judged structural typing sufficient and the cascade unjustified for a pair of numbers.
- **Excluding the outline, folding ranges, selection ranges, and semantic tokens** reads as under-delivering against the user's "fill the gap" prior. I read the prior as naming positions, and the brief as explicitly permitting "nothing yet" for the structures.

---

# Exit criterion

This campaign ends when the audit report carries, per subject, a capability/defect matrix whose every row closes as implemented, repaired, retained, or intentionally excluded with `file:line` evidence, and the named units have landed behind it. The mcp rows name each 2026-07-28 mechanism the objective lane verified present or absent, plus the adopted constant and seam names. The html and markdown rows name the span field, its unit, its absence rule, its slice-equality proof, and each LSP-shaped structure excluded with the trigger that admits it. The probe rows name the staged order, the client's exact public surface, the `Issue` shape, and each TypeScript 7 unknown beside the decision it settles and the observable that closes it. The progress rows name the recommended shape, workflow as its adopting package, and queue, process, tool, and middleware as ruled untouched with the reason recorded in each package's guide. Closure requires one independent `verifier` reporting the gate chain green in each touched checkout, and every proof that drives a child process taken on the host rather than inside a bench sandbox.
