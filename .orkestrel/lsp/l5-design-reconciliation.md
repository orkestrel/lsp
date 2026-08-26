# L5 design round — reconciliation (2026-08-26)

Lanes run: `planner` (Claude Opus 5, native, ruling at `l5-design-planner-ruling.md`) and
`analyst` (GPT-5.6 Sol, bench, journal `tmp/codex/l5-design-analyst-r2.jsonl`, session
`01a03c12-6c77-73c0-a9c5-b0c6d29581b7`, ruling at `l5-design-analyst-verdict.md`), blind to
each other on the shared brief `l5-conformance-design-brief.md` behind per-reader lane
covers. The first analyst launch read the shared preamble as an instruction to run and
reconcile both lanes itself; it was killed seconds in by process id, and the relaunch behind
`l5-design-analyst-cover.md` held its single lane. The Orchestrator's instance probes at
`l5-design-probes.md` settle every evidence contingency both lanes named.

## Unanimous rulings, adopted

- **Wiring.** A `conformance` factory in `vite.config.ts` between `config` and
  `distribution`; `include: ['tests/conformance.test.ts']`; `environment: 'node'` with the
  browser disabled; `setupFiles` exactly `['./tests/setup.ts']` — the vendored proof at
  `tests/config.test.ts:115-128,281` refuses a second setup entry, so
  `tests/setupConformance.ts` is imported as a module, never registered, with its sibling
  proof `tests/setupConformance.test.ts` collected by the existing `setup` project.
  `scripts["test:conformance"]` is exactly
  `vitest run --config vite.config.ts --no-cache --reporter=dot --project conformance`,
  reachable from `test`. `tests/config.test.ts` is never edited.
- **No public protocol-version constant.** LSP negotiates capabilities; `_InitializeParams`
  carries no version member (probe-confirmed on the instance), the client's payload
  matches, and a constant whose only consumer is the suite is the shape the
  Minimal-public-API law refuses. The pins live in the conformance suite.
- **Failure naming.** Per-row parameterized cases: the local symbol in the case title, one
  direct comparison per row, the authoritative value carried in the assertion message
  (`${symbol} drifted; ${authority}=${value}`). Aggregates and tallies refused. Tables,
  row construction, and drift formatting in `tests/setupConformance.ts` (no `describe`,
  `it`, or `expect` there); registration and assertion in test files; the fixture parses at
  import so rows exist at collection. Each table carries a membership assertion over the
  exact local symbol set so an empty or grown population reddens by name.
- **Scope exclusions.** Methods the package does not speak, structures it does not
  dereference, the metaModel's type-union grammar, wire behavior against a live server
  (owned by the existing integration proof), framing limits, and the package's own
  `LSPError` codes.

## Reconciled disagreements

- **Fixture path and name: the planner's.** `tests/fixtures/metaModel.json` — upstream's
  own filename, no version copy in the name (Derive-state; the version lives in the bytes
  and in the suite's pin). The analyst's versioned filename and provenance sidecar are
  refused: the sidecar is a document recording live state, and its two underivable facts
  find better homes — the source URL in `scripts/metamodel.sh`, the refresh date in git
  history.
- **Digest: the analyst's.** A repository-owned SHA-256 pin over the raw bytes, asserted
  before parsing, catches same-version byte drift that the `metaData.version` pin alone
  admits. The planner's discrimination objection is answered by the refresh procedure: the
  script prints the digest it fetched, and a refresh updates the constant in the same
  commit, so an out-of-ritual hand edit reddens. The pin is
  `caae8df639a4248520a3f589fd72945365e9d8ebca5baf564161a515430d9d41` over 434,788 bytes —
  the Orchestrator verified the staged copy
  (`tmp/cursor/sources/lsp-3.18-metaModel.json`) and the independently fetched scratchpad
  copy hash identically. The constant lives in `tests/setupConformance.ts`.
- **Numeral authority: the analyst's dual coordinates.** The instance carries `ErrorCodes`
  and `LSPErrorCodes` (probe-confirmed), so each numeral row asserts against the metaModel
  value and the installed runtime namespace; a divergence between the mirrors reddens by
  name. The planner's directness argument survives inside the row: the installed value is
  the one the assertion message leads with.
- **Structure depth: the planner's floor with the analyst's breadth, at flat data only.**
  Rows cover the wire structures the client produces or consumes (the analyst's list —
  initialize params and capabilities, results and server capabilities, document open and
  close, diagnostic request and reports, publish params, positions, ranges, locations,
  code descriptions, related information, diagnostics, text-document identifiers and
  items), asserting per projected member: exists upstream, requiredness matches
  (`optional` is flat in the instance — probe-confirmed), and the base-type name matches
  where the property's descriptor is a base kind. The union grammar stays unread — the
  planner's no-second-analyzer line holds; a non-base descriptor row asserts existence and
  requiredness only.
- **Guard parity: the analyst's.** Rows feed authority-derived values through the local
  guards, and the installed executable guards (`Position.is`, `Range.is`, `Location.is`,
  `CodeDescription.is`, `DiagnosticRelatedInformation.is`, `Diagnostic.is3_17` — the
  string-only diagnostic guard matching this client's empty advertised diagnostic
  capability) corroborate. `cancel` compares against the metaModel alone: the installed
  package's public exports do not expose the cancellation namespace, and no private
  subpath import is taken.
- **Dependency boundary: the analyst's.** A row proves the upstream protocol family is
  absent from `dependencies`, `peerDependencies`, `optionalDependencies`, and from every
  `src/**` import, with imports read through TypeScript's own compiler API (the real
  parser, not a second one). The installed-release pin reads the manifest resolved from
  the package's public entry, corroborated against the lockfile's recorded release and the
  declared range.
- **Units: the planner's two, serial.** L5-A (`builder`, Sonnet, native — the vendoring is
  taste-free and the fetch is host network work) then L5-B (Sol `implementer` — the
  constraint-heavy tables, suite, and wiring). The analyst's single-unit shape is refused
  on engine grounds; its red-first sequence and permanent can-fail controls are folded
  into L5-B.
- **Red-first, folded from both.** L5-B: the wiring red (`npm run test:config` red between
  registering the project and adding its script, green after); the planted wrong authority
  coordinate inside an owned file (red naming the symbol, restored); the temporary
  `LSP_METHODS.initialize` source mutation (`src/core/constants.ts` report-only with a
  `cmp`-restored temporary-mutation allowance; the conformance run red naming
  `LSP_METHODS.initialize` with authority value `initialize`, restored green); and
  permanent controls in `tests/setupConformance.test.ts` proving each shared instrument
  can fail on synthesized drift.

## Findings and carriers

Every retained finding names one carrier: the L5-A brief (`l5a-metamodel-brief.md`) carries
the fixture, the refresh script, and the guide prose; the L5-B brief (drafted at L5-A's
acceptance) carries everything else, including the two lane risks that survive — the
collection-time parse cost (an observation the Orchestrator reads from the first green
run) and the absent `guides` parity project in lsp, which is recorded against the lsp
documentation-parity capability as a candidate unit outside L5's fixed scope, not added to
it. Dropped on the record: the analyst's provenance sidecar and versioned filename (
superseded by the script and the digest constant), the planner's no-digest ruling
(superseded by the reconciled pin), and the planner's `$/cancelRequest` contingency and
optionality risk (settled by the probes).
