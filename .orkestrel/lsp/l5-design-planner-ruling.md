# L5 design — planner ruling (subjective lane, Claude Opus 5, verbatim)

## Design

I hold the **subjective** lane: shape, naming, ergonomics, and design fit. I read the authority chain and spot-checked every pointer I lean on; unverified facts are named at the end.

### Axis 1 — What conformance means here

**The claim the suite makes:** every protocol name, numeral, and structural member `@orkestrel/lsp` declares is the one LSP 3.18 declares, and the package claims no surface beyond the subset it speaks.

**Recommended shape: four comparisons, one data table each, each row pairing a package symbol with one authority coordinate.**

- **Methods.** Each `LSP_METHODS` value (`src/core/constants.ts:2-12`) is checked against the metaModel's `requests` or `notifications` array, on both the method string and the entry's `messageDirection`. The metaModel schema makes `method` and `messageDirection` required fields of every entry (`node_modules/vscode-languageserver-protocol/metaModel.schema.json:377-381,432`), so direction is flat data, and a member that moves table is the drift this catches. The table's key set is asserted equal to `Object.keys(LSP_METHODS)` — that single assertion is the subset claim, and it reddens when a method row is added without an authority coordinate.
- **Numerals.** The nine error constants (`src/core/constants.ts:18-42`) are checked against the installed package's runtime namespaces, not the metaModel. `LSPErrorCodes.RequestCancelled` through `RequestFailed` carry `-32800` … `-32803` at `node_modules/vscode-languageserver-protocol/lib/common/api.js:36-69`, and the JSON-RPC base numerals `-32700` … `-32603` reach the same specifier through the star re-export at `node_modules/vscode-languageserver-protocol/lib/common/api.d.ts:2`, declared at `node_modules/vscode-jsonrpc/lib/common/messages.js:48-52`. This is the comparison the installed package proves and the metaModel cannot: these are the values the wire carries and the values a consumer's `catch` compares against.
- **Value enumerations the package restates.** `LSP_ENCODINGS` (`src/core/constants.ts:15`) against `PositionEncodingKind.UTF8/UTF16/UTF32` (`node_modules/vscode-languageserver-protocol/lib/common/protocol.js:272-287`), and the `0 | 1 | 2` literal union in `LSPTextDocumentSyncKind` (`src/core/types.ts:142`) with its guard branch (`src/core/validators.ts:259-261`) against `TextDocumentSyncKind.None/Full/Incremental` (`.../protocol.js:484-495`). These are the two places the package hard-codes an external enumeration's values, so they are exactly what a conformance suite exists for.
- **Structural members the package dereferences.** For each guard, every member it treats as **required** is declared required in the named metaModel structure, and every member it treats as **optional** is declared there at all. `isLSPDiagnosticOptions` requires `interFileDependencies` and `workspaceDiagnostics` and admits optional `identifier` (`src/core/validators.ts:271-279`); `isLSPTextDocumentSyncOptions` reads `openClose` and `change` (`:253-263`); `isLSPServerCapabilities` reads `positionEncoding`, `textDocumentSync`, `diagnosticProvider` (`:287-299`); `isLSPIdentity` reads `name` and `version` (`:240-245`). The defect this catches is the one that bites a consumer: a guard requiring a member the authority makes optional refuses a legal server.

**Deliberately out, and why each stays out:**

- Every request the package does not speak, and every structure it does not dereference. `.claude/rules/patterns.md` § Foreign contracts fixes this package's own law — validate only what the package dereferences, own a wide foreign record it merely carries. `LSPServerCapabilities` declares an index signature for exactly that reason (`src/core/types.ts:189`). A comparison in the reverse direction would contradict the design it claims to check.
- Type-shape conformance beyond required and optional. The metaModel's type union is a grammar; a reader for it inside the test suite is a second source-language analyzer over the authority, which `AGENTS.md` § Project model refuses. Names and optionality are flat data and stop there.
- Wire behaviour against a live server. That proof already exists in a better place: `tests/src/server/integration.test.ts` drives Oxlint's real language server through the helpers at `tests/setupServer.ts:22-35`. Conformance compares declarations; the foreign-client proof stays where it is.
- Framing limits `LSP_CONTENT_LIMIT` and `LSP_HEADER_LIMIT` (`src/core/constants.ts:51,60`). They are this package's own policy, not LSP's, and the metaModel describes messages rather than framing.

### Axis 2 — Failure naming

**Recommended shape: `it.each` over each exported table, with the case title carrying the package symbol and its authority coordinate, and a body of one `expect(packageValue).toBe(authorityValue)`.**

A drifted member then fails with the symbol in the test name and the authority's value in the diff, before a reader opens anything. A structure case title reads `isLSPDiagnosticOptions requires interFileDependencies, declared by DiagnosticOptions`.

Two shapes are refused. An aggregate — `expect(drifted).toStrictEqual([])` — names the symbol only inside a dumped array and names no authority value. A tally — `expect(rows).toHaveLength(9)` — reprices itself on every legitimate edit and names nothing; `.claude/rules/quality.md` § Rounds and verdicts refuses a tally as a subject.

The table must be available at collection time, so the setup module parses the fixture at import rather than in a `beforeAll`. An async load defers the table past collection and forces the aggregate shape back.

An empty population must fail rather than pass (`.claude/rules/tests.md` § Discovery and adequacy audit). The key-set assertion from Axis 1 is that guard for the method table, and it names members rather than counting them; each other table carries the equivalent assertion against the symbol set it covers.

### Axis 3 — Where the metaModel lives

**Recommended shape: `tests/fixtures/metaModel.json`, upstream's own filename, no version in the name, refreshed by a committed script, no digest.**

- **Path.** The suite is a root cross-cutting proof, so its data sits beside the root proofs rather than under `tests/src/**`, which the mirror rule owns. The repository already places fixture data in a `fixtures/` folder beside its reader: `tests/src/server/fixtures/peer.mjs` (`tests/setupServer.ts:13-15`). `tests/fixtures/` is that convention at the root. It cannot live under `tmp/`, which git ignores, and it never reaches a consumer: `package.json:13-16` ships `dist/src` and `README.md` alone.
- **Filename.** Keep the upstream name and keep the version out of it. The version lives in the bytes as `metaData.version`, and the Derive-state law forbids a second copy that can drift. A version in the filename forces an import edit on every refresh and reads stale the first time someone refreshes in place.
- **Refresh record: a script, not a document.** `scripts/metamodel.sh` names the source URL and the destination path, and re-running it reproduces the file. A note beside the fixture is a document recording live state, which `.agents/orchestration.md` § Where campaign artifacts live rules against; the mechanism that recomputes the fact wins. One sentence in `guides/lsp.md` names LSP 3.18 as the tracked version and points at the script.
- **No digest.** A digest constant fails identically for a legitimate refresh and for a hand edit, so it cannot discriminate the case it exists for, and the manual edit it forces on every refresh is exactly where a careless refresher pastes whatever the file now hashes to. What a digest is meant to buy is bought better by the `metaData.version` pin plus the reproducible script: a hand edit that changed a method name reddens the case that names the method.

### Axis 4 — Project wiring

**Recommended shape: a `conformance` factory in `vite.config.ts` between `config` and `distribution`, setup files exactly `['./tests/setup.ts']`, and `tests/setupConformance.ts` imported as a module rather than registered as a setup file.**

The constraint that departs from the mcp precedent, and that will redden the tree if a unit copies mcp: `tests/config.test.ts:115-128` registers the `conformance` project the moment `tests/conformance.test.ts` exists, with `include: 'tests/conformance.test.ts'` and `setup: ['./tests/setup.ts']`, and `:281` compares with `toStrictEqual` after de-duplication at `:275`. **A `tests/setupConformance.ts` entry in that project's `setupFiles` fails `tests/config.test.ts`.**

The two laws are compatible: `.claude/rules/tests.md` § Shared test infrastructure requires the tables and helpers to live in a setup file, and `setupFiles` registration is a different thing from module import. `tests/setupConformance.ts` therefore exists, holds the loader and the tables, and `tests/conformance.test.ts` imports it. That module then owes a sibling proof, `tests/setupConformance.test.ts`, which the already-registered `setup` project collects through its `tests/setup*.test.ts` glob (`tests/config.test.ts:133-137`) with no configuration change. Its subject is the exported infrastructure — the loader returns the parsed model, a lookup miss returns `undefined` — never production behaviour (`.claude/rules/tests.md:62-64,183`).

The rest of the wiring is fixed by the same proof: `tests/config.test.ts:299-317` requires every project entry to be a named factory rather than an inline object, `:196-199` derives the factory name from the label, so the export is named `conformance`; and `:519,553-560` requires `scripts["test:conformance"]` to be exactly `vitest run --config vite.config.ts --no-cache --reporter=dot --project conformance` with `npm run test:conformance` inside `test`. The factory takes `environment: 'node'` and `browser: { enabled: false }`, matching the `config` factory at `vite.config.ts:121-130`, and no timeout: the proof is a parse and a set of comparisons, and `.claude/rules/tests.md` § Runner configuration refuses a setting without a measured need. It joins the `projects` array at `vite.config.ts:168` in the order `.claude/rules/workspace.md:126-135` lists.

**The version-pin analogue.** The authority here has two bodies, so pin each where it lives: the vendored instance's `metaData.version` reads `3.18.0`, and the installed `vscode-languageserver-protocol` version sits in the `3.18` line. Read the installed version from that package's own manifest, because that copy is what the numeral and enumeration comparisons import; asserting the workspace manifest's declared `^3.18.2` range (`package.json:93`) would pin a string nobody executes. The read belongs in `tests/setupConformance.ts`, not in a test body.

**Naming.** Tables: `CONFORMANCE_METHODS`, `CONFORMANCE_NUMERALS`, `CONFORMANCE_VALUES`, `CONFORMANCE_STRUCTURES`. Lookups: `readMetaModelMethod` and `readMetaModelStructure`, each returning `undefined` on a miss — `read*` already carries exactly that meaning in this repository (`tests/setupServer.ts:113-121`), and one concept keeps one term. Suite blocks are named for the authority each reads — the metaModel, the installed package — because the first thing a failure's reader needs is which authority disagreed, and that decides whether the fix is in `src/` or in the mirror.

### Axis 5 — The missing protocol-version constant

**Ruling: add no public protocol-version constant. Pin the metaModel's `metaData.version` inside the conformance suite alone.**

The candidate consumer does not exist. LSP's initialize carries no protocol-version member: `_InitializeParams` declares `processId`, `clientInfo`, `locale`, `rootPath`, `rootUri`, `capabilities`, `initializationOptions`, and `trace` (`node_modules/vscode-languageserver-protocol/lib/common/protocol.d.ts:1169-1204`), and the client's payload matches — `LSPClient.ts:227-231` sends `processId`, `rootUri`, and `capabilities`, and `LSPInitializeParams` declares exactly those (`src/core/types.ts:177-182`). LSP negotiates capabilities, not a version number. "The client forces the latest protocol" is expressed by the capability payload at `LSPClient.ts:219-226`, not by a version field.

That leaves the conformance suite as the only possible consumer, and a constant whose only consumer is the test that reads it is the shape the Minimal-public-API law refuses. For a published package it is worse than inert: `LSP_PROTOCOL_VERSION` tells a consumer the package does something with that number, and it does nothing.

The version claim the package actually publishes is already in prose — `src/core/constants.ts:14` documents `LSP_ENCODINGS` as the encodings "named by Language Server Protocol 3.18". The conformance suite is what makes that sentence true, which is the correct relationship between the two. One sentence in `guides/lsp.md` naming 3.18 as the tracked version and the conformance proof as its gate gives the claim a durable home without a second copy of the value.

## Alternatives

**A vendored metaModel under `tmp/` with a fetch in the suite's setup.** Cost: `tmp/` is git-ignored, so the gate depends on a file no clone has, and a network fetch inside a suite breaks the hermetic default in `.claude/rules/tests.md:26`. The committed fixture wins because the authority must be the same bytes on every host and in every future round.

**A generated conformance report compared against a committed golden file.** Cost: the failure names the golden file and a diff hunk, not the drifted symbol, which is precisely what Axis 2 forbids; and the repair path is "regenerate the golden", which launders drift into an accepted edit. The per-row `it.each` wins because its failure names the symbol and its fix is a source edit.

## Units

Two units, serial. `L5-B` merges the infrastructure and the wiring because they share one red-first proof and one green gate; split it at the `tests/setupConformance.ts` boundary only if the merged unit runs long.

**L5-A — vendor the mirror and its refresh mechanism.**
Role and engine: `builder`, Sonnet, native. The work is fully specified and taste-free, and the fetch is network work, which `.agents/orchestration.md` § Launching keeps out of a bench exec.
Owned: `tests/fixtures/metaModel.json`, `scripts/metamodel.sh`, `guides/lsp.md`.
Off-limits: `src/**`, `tests/**` outside `tests/fixtures/`, `vite.config.ts`, `package.json`.
Dependencies: none.
Red-first: none. The unit adds data; its proof lands in L5-B.
Acceptance criteria, cheap-first:
1. `tests/fixtures/metaModel.json` parses as JSON and its `metaData.version` reads `3.18.0`.
2. Its byte length matches the artifact the brief records (434,788 bytes).
3. `scripts/metamodel.sh` names the source URL and that destination path, and a re-run leaves the file byte-identical.
4. `guides/lsp.md` names LSP 3.18 as the tracked protocol version and names the refresh script.
5. `npm run format:check` and `npm run lint:check` pass.

**L5-B — the conformance infrastructure, suite, and wiring.**
Role and engine: Sol `implementer`. The work is constraint-heavy and mechanically precise: reading a foreign schema instance, building tables against declared members, and satisfying an existing configuration proof exactly.
Owned: `tests/setupConformance.ts`, `tests/setupConformance.test.ts`, `tests/conformance.test.ts`, `vite.config.ts`, `package.json`.
Report-only: `tests/config.test.ts`. If it reddens, the unit stops and reports rather than editing it.
Off-limits: `src/**`, `guides/lsp.md`, `tests/fixtures/metaModel.json`.
Dependencies: L5-A.
Red-first: plant the drift, not the absence. Point one authority coordinate at the wrong namespace member — `LSP_CONTENT_MODIFIED` against `LSPErrorCodes.RequestCancelled` — inside the file the unit owns, record `npm run test:conformance` and its failing count with the failing case title, restore the coordinate, and record the same command green.
Acceptance criteria, cheap-first:
1. `tests/setupConformance.ts` contains no `describe`, `it`, or `expect`, and every declaration in it is exported.
2. `vite.config.ts` exports a factory named `conformance` returning `include: ['tests/conformance.test.ts']`, `setupFiles: ['./tests/setup.ts']`, `environment: 'node'`, and `browser: { enabled: false }`, listed in `projects` between `config` and `distribution`.
3. `package.json` carries `"test:conformance": "vitest run --config vite.config.ts --no-cache --reporter=dot --project conformance"`, and `test` includes `npm run test:conformance`.
4. `npm run test:config` green. This criterion is what proves the wiring, and it is the one that reddens if `setupFiles` gains a second entry.
5. `npm run test:setup` green, with `tests/setupConformance.test.ts` proving the loader and each lookup helper including a miss.
6. `npm run test:conformance` green, with the recorded red-then-green counts from the planted coordinate.
7. Every `LSP_METHODS` key has a row in `CONFORMANCE_METHODS`, and the key-set assertion is present.
8. Both version pins present: `metaData.version` reads `3.18.0`, and the installed `vscode-languageserver-protocol` version is in the `3.18` line.
9. `npm run lint:check` and `npm run check` green.
Observation, not a criterion: the full `npm test` result and the `conformance` project's reported duration. The Orchestrator takes that reading after the unit exits.

## Tensions

These are my lane's judgment calls, named for the objective lane to challenge.

- **Structure conformance stops at required and optional.** I refused a reader for the metaModel's type grammar on the "no second parser" law. The objective lane may hold that a member declared `boolean` in the authority and checked as `boolean` by the guard is cheap enough to assert flatly for the primitive cases, and that the ban reaches only the union grammar.
- **No digest over the mirror.** I ruled the digest cannot discriminate the case it exists for. The objective lane may hold that a digest plus a script-produced value is a supply-chain pin rather than an edit detector, and that it belongs regardless.
- **The installed package, not the metaModel, is the authority for error numerals.** I preferred the runtime namespace because it is what the wire and a consumer's `catch` compare against. If the vendored instance carries those enumerations, the objective lane may prefer one authority for every comparison over the more direct one per comparison.
- **`tests/setupConformance.ts` is imported rather than registered.** Forced by `tests/config.test.ts:281`. The alternative reading is that the configuration proof is the thing that should change; I hold that a vendored fleet proof is not this package's to edit, and the import shape satisfies every law without touching it.
- **Two units rather than one.** I split the network-and-data work from the code work on engine grounds. The objective lane may hold that L5-A is small enough to fold into L5-B's brief as a prerequisite step the Orchestrator performs.

## Risks

- **`$/cancelRequest` may be absent from the metaModel's notifications.** `LSP_METHODS.cancel` (`src/core/constants.ts:7`) carries it, and the distillate reports it lives on `vscode-jsonrpc` rather than the protocol package. If the instance omits it, that row's authority coordinate is the installed package's cancellation namespace, not an exclusion. Evidence that settles it: read the instance's `notifications` array before briefing L5-B.
- **Optionality may not be flat in the instance.** The required-and-optional assertion measures less than it claims if a structure expresses optionality inside its type rather than in an `optional` field. Evidence that settles it: read `DiagnosticOptions` and `TextDocumentSyncOptions` in the instance before the tables are written.
- **The `setupFiles` constraint will be copied wrong.** The mcp precedent puts a conformance setup module in `setupFiles`, and `tests/config.test.ts:281` refuses that here. Evidence that settles it: the constraint carried in L5-B's brief with the line reference, and criterion 4 ordered ahead of the suite's own run.
- **No `guides` project exists in lsp.** A glob over `tests/**/*.ts` returns no `tests/guides.test.ts`, so nothing gates the guide's constant table (`guides/lsp.md:237-253`) against `src/core/constants.ts`. Any later public export drifts invisibly. This strengthens the Axis 5 ruling and is a candidate for its own unit outside this scope.
- **Fixture and installed package can drift apart.** The two version pins reduce this to a red test that names the file to change rather than to silence: bumping the dependency past 3.18 reddens the installed-version pin, and refreshing the mirror to a later line reddens the `metaData.version` pin.
- **Collection-time parse cost.** A 434,788-byte parse runs at collection in a project that sits in `test`. Evidence that settles it: the `conformance` project's reported duration on the first green run, taken by the Orchestrator after L5-B exits.

## Facts I could not verify

- The vendored metaModel instance is not on disk anywhere under `/home/user/lsp`. Every instance-level claim — whether `$/cancelRequest` is listed, how per-member optionality is expressed, whether the error enumerations appear — rests on `node_modules/vscode-languageserver-protocol/metaModel.schema.json` and the distillate, not on the bytes. The byte length 434,788 and `metaData.version` `3.18.0` are the Orchestrator's readings carried from the brief.
- Whether a `scripts/` directory exists in `/home/user/lsp`. If it does not, the refresh command's home is the guide's conformance section and L5-A owns that prose instead.
- Whether `vscode-languageserver-protocol/package.json` is reachable through the package's exports map. The distillate reports a `./package.json` row; I did not open that manifest's exports block. The fallback is a `node:fs` read anchored to `WORKSPACE_ROOT` (`tests/setupServer.ts:10`).
- Every mcp `file:line` pointer in the distillate. I read nothing in the mcp tree; my Axis 4 ruling rests on lsp's own `tests/config.test.ts` and `vite.config.ts`, which I read directly.
