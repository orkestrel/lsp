# LSP 3.18 audit of the Orkestrel fleet

Date: 2026-08-25. Reconciled by the Orchestrator from the adversarial design pass:
`design-planner-report.md` (subjective lane, Opus 5) and `design-analyst-report.md`
(objective lane, GPT-5.6 Sol), both blind, on `design-brief.md`. Evidence base:
`lsp-spec-distillate.md`, `researcher-external-report.md`, `fleet-sweep-evidence.md`,
`orkestrel-fleet-report.md`. User priors: `direction-2026-08-25.md`.

## How each conflict was ruled

Objective findings about what the code permits went to the objective lane; naming and API
shape went to the subjective lane; where the lanes collided on a design fork, the ruling and
its reason are recorded per subject. No finding was dropped without a record.

## Subject 1 — mcp

**Finding.** The modern 2026-07-28 core, the progress and cancellation surfaces, the
`server/discover` wiring, the `subscriptions/listen` server stream, the input-required
server path, and the tasks methods all exist on disk. The objective lane rejected the
completeness claim on evidence:

- **Revision-boundary defect.** Bare-server validation accepts any revision `inferEra`
  recognizes, `SUPPORTED_PROTOCOL_VERSIONS` mixes eras, and discovery advertises the mixed
  set — a modern request can negotiate legacy semantics without entering the legacy
  decorator (`mcp/src/core/MCPServer.ts:371,398`, `constants.ts:15-36`, `helpers.ts:872`).
- **Client gaps.** `MCPClientInterface` exposes no subscription operation for
  `subscriptions/listen`, and `call` cannot place `requestState` and `inputResponses` for
  the input-required retry the server fully implements (`MCPServer.ts:969-1157`,
  `types.ts:2282-2307,2502-2638`).
- **Deprecated surface.** The bare server still registers `ping`, removed at 2026-07-28,
  and the roots, sampling, and logging capability declarations carry no `@deprecated`
  markers (`MCPServer.ts:312-315`, `types.ts:216-243`).
- **Tasks unproven.** States, methods, and capability checks exist; delivery through
  `notifications/tasks` is absent, and the extension's authoritative draft schema
  (`modelcontextprotocol/ext-tasks`) is unverified locally.

**Ruling.** Repair before rename. The seam's shape stays — the lanes agree
`createMCPLegacy(server)` is the optional wrapper the direction asks for. After the
repairs land, the naming cascade adopts the subjective lane's names: `MCPLegacy` becomes
`MCPDualEra` with `createMCPDualEra` (the spec's own word for a both-eras implementation),
`MCP_PROTOCOL_VERSION` becomes `MCP_HANDSHAKE_VERSION`, `MCP_LEGACY_VERSION` becomes
`MCP_FALLBACK_VERSION`. The objective lane's alternative names (`MCP_LEGACY_VERSION` /
`MCP_LEGACY_FALLBACK_VERSION`) are dropped on the record: reusing an identifier that
exists today with a different value invites a silent misread during the migration, and
naming is the subjective lane's charge.

**Units, in order.** M1 revision boundary (bare server strictly modern; era-scoped
`-32022` data; legacy `initialize` and `ping` served only through the decorator). M2 input
continuation (grouped call options carrying state and responses). M3 subscription client
(entity-scoped `listen` returning a backpressured async stream with abort-driven closure).
M4 tasks proof (stage the `ext-tasks` schema locally first; verify signatures; add the
notification family). M5 deprecated surface (`@deprecated` markers; remove modern
producers). M6 naming cascade. One version bump at the end.

## Subject 2 — html and markdown

**Finding.** Both AST unions carry no source coordinates; html's UTF-16 offsets exist only
on scanner results and are discarded at node construction; the html parser normalizes CRLF
before parsing, so normalized-buffer offsets do not identify original input
(`html/src/core/parsers.ts:24-35`); markdown parsing splits, trims, and rejoins lines, so
spans require offset-aware parsing regardless of storage; neither package derives outline,
folding, selection, or token structures, and no fleet consumer needs them today.

**Ruling.** Provenance lands as a side lookup owned by the parse entity, not as fields on
nodes — the objective lane's ruling, adopted on two correctness grounds: the CRLF
normalization means a stored span must be mapped back to the original input, which the
retaining source entity does naturally; and copy-on-write transforms would make embedded
spans silently false, while a side lookup fails honestly to `undefined`. The subjective
lane's vocabulary is adopted inside that ruling: `HTMLSpan` and `MarkdownSpan`, each
`{ readonly start: number; readonly end: number }`, half-open, UTF-16 code units, declared
per package; the lookup is a single-word `span(node)` member on the existing `HTML` and
`Markdown` entities. The subjective lane's node-field ruling is dropped on the record with
that reason. Both lanes' agreement stands: no outline, folding ranges, selection ranges, or
semantic tokens — each recorded in its guide as intentionally excluded with the trigger
that admits it (the creation gate has no first consumer for any of them; scaffold's catalog
drift reporting is the first consumer for spans themselves).

**Units, in order.** H1 html provenance (source-retaining parse entity, span lookup,
CRLF and astral-character proofs, an explicit ruling on `sanitize` and `distill`
provenance). H2 markdown provenance (offset-aware block and inline parsing, same proofs).
H3 exclusions recorded in both guides. Probe's location widening depends on the
vocabulary, not the code, and lives in subject 3.

## Subject 3 — probe

**Finding.** The LSP client exists inside `LintStage` — framing, correlation, lifecycle,
teardown — sending empty capabilities and discarding the entire `InitializeResult`; other
server requests receive no protocol response at all, which violates the base protocol;
the type stage drives the in-process TypeScript LanguageService, and TypeScript 7's native
server is confirmed LSP with its capability rows largely unknown.

**Ruling.** The lanes converged: extract one shared `LanguageClient`, reject "full
conformance" as a goal in favor of the client-role behavior probe's work needs (handshake
consumption, position encoding, sync mode selected from server capability, a diagnostics
path selected from `diagnosticProvider`, cancellation, method-not-found responses to
unsupported server requests), and gate the TypeScript 7 adapter on a real capability
receipt taken by running the native toolchain — `TypeStage` stays until that receipt
proves parity. The subjective lane's public surface stands: `capabilities`, `encoding`,
`open`, `close`, `start`, `destroy`, `emitter`, and no generic request/notify escape
hatch. On the one collision — coordinate convention in `Issue` — the objective lane's
ruling is adopted: `range` stores zero-based UTF-16 positions, the producers' own
convention, and display numbering is derived at formatting time; the subjective lane's
stored-one-based shape is dropped on the record because it bakes a display convention
into data, contradicting the same store-the-producer's-unit principle that lane argued in
subject 2. Every proof that drives a language-server child runs on the host, never in a
bench sandbox.

**Units, in order.** P1 handshake (declare capabilities, keep the `InitializeResult`,
derive encoding). P2 `Issue` range (replace `line` with zero-based `range`; render
one-based; consumer set derived by running the suite). P3 client extraction (contracts,
engine, lint adoption against the real oxlint binary and a protocol-faithful fixture).
P4 TypeScript 7 receipt gate (capture the native server's launch contract and capability
exchange; open the adapter unit only on parity evidence). P2 depends on the subject 2
vocabulary; P1 is independent and first.

## Subject 4 — workflow, process, tool, queue, middleware

**Finding.** workflow reports a replaceable activity snapshot `TaskProgress
{ current, total?, unit? }` with separate lifecycle events; MCP progress is request-scoped,
token-correlated, and strictly increasing. queue exposes lifecycle and retry counts;
process streams lines; tool is deliberately inert with progress already provided one layer
up by mcp's execution context; middleware observes through callbacks.

**Ruling.** Exploratory, as the user directed — no contract lands in this campaign. The
lanes split exactly on whether workflow renames onto MCP's vocabulary now (subjective) or
keeps domain semantics and adds a boundary adapter (objective). Both lanes independently
proposed the same deciding probe, and that probe is the unit this campaign runs: an
adapter test that maps workflow activity onto MCP `notifications/progress` and replays
workflow's own reporters through MCP's monotonic rule, reading which reporters it refuses.
Its reading decides between the two live shapes — per-package adoption of
`{ progress, total?, message? }` versus domain-owned progress with an adapter — and the
decision returns to the user with that evidence. Ruled out by both lanes and closed here:
adopting the tasks extension's status union fleet-wide (the unions answer different
questions, and `input_required` names a round trip no fleet package has). queue, process,
tool, and middleware are ruled untouched, each reason recorded in its guide; middleware's
one admitting trigger is a consumer asking for multipart upload progress, answered with a
reporter callback in the multipart options.

**Unit.** W1 progress adapter probe (temporary integration test, workflow activity to MCP
notifications, replay of existing reporters; the reading is a campaign artifact and a user
decision input). G1 guide rulings for the untouched packages.

## Per-repository status

| Checkout | Status |
|---|---|
| mcp | Conforms to the 2026-07-28 modern posture in core; repaired for the revision boundary, client gaps, deprecation markers, and tasks proof; renamed after repair. |
| probe | Foundation present; staged toward the shared client, range-carrying `Issue`, and a receipt-gated TypeScript 7 adapter. |
| html | Gap confirmed; provenance lands as a source-retaining parse entity with `span` lookup. |
| markdown | Gap confirmed; provenance follows html's, requiring offset-aware parsing. |
| workflow | Candidate progress adopter; decision deferred to the adapter probe's reading. |
| queue | Retained untouched; a queue entry is opaque work and the job owns its progress. |
| process | Retained untouched; it streams lines and exits, and parsing stdout for progress is product policy. |
| tool | Retained inert; progress lives one layer up in mcp's execution context. |
| middleware | Retained untouched; multipart upload progress is the recorded admitting trigger. |
| scaffold | No LSP surface; named first consumer of markdown spans through catalog drift reporting. |

## Routing ledger

| Unit | Role | Engine |
|---|---|---|
| M1 revision boundary, M2 input continuation, M3 subscription client, M4 tasks proof | `sol` | GPT-5.6 Sol (bench; listener proofs taken on the host) |
| M5 deprecated surface | `builder` | Sonnet |
| M6 naming cascade | `implementer` | Opus 5 |
| H1 html provenance, H2 markdown provenance | `sol` | GPT-5.6 Sol (offset mapping is constraint-heavy) |
| H3 exclusions, G1 guide rulings, probe TS7 seam prose | `builder` | Sonnet |
| P1 handshake, P2 range, P3 client extraction, P4 TS7 receipt | `implementer` | Opus 5 (native — language-server children are unmeasurable in bench sandboxes) |
| W1 progress adapter probe | `sol` | GPT-5.6 Sol |
| Gate evidence per touched checkout | `verifier` | Sonnet |
| Audit of each nontrivial unit | `reviewer` or `analyst`, engine that did not write it | Opus 5 / GPT-5.6 Sol |

Serialization: one writer at a time per checkout from a committed baseline; M-units before
M6; H1 before H2 before P2; P-units serial within probe; W1 independent.

## Exit criterion

This audit campaign closes with this report accepted: every repository row ruled, every
ruling evidence-cited, the two deliberately open decisions named — the subject 4 shape,
deferred to the adapter probe's reading, and the TypeScript 7 adapter, deferred to its
capability receipt — and the unit roadmap recorded with routing. The implementation
campaign that lands the units is a successor with its own briefs, audits, and verifier
gates; its exit is every row above reaching implemented, repaired, retained, or
intentionally excluded on landed evidence, red-before-green proofs for each repair, and
the gate chain green in each touched checkout.
