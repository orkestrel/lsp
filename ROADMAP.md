# ROADMAP

`@orkestrel/lsp` gives the Orkestrel fleet one Language Server Protocol implementation:
an `LSPClient` that drives a real language server over a transport, a stdio transport
that owns the server child process, and a conformance suite that measures the package
against the protocol's own metaModel. The package exists so no fleet consumer carries
private framing, correlation, or lifecycle code for a language server again — the probe
package's lint stage is the first such consumer. An `LSPServer` half follows after the
client surface settles.

The package targets LSP 3.18 and carries no compatibility mode for older servers: the
client advertises exactly what it implements — `utf-16` position encoding alone — and
fails `start` with a `protocol` error when a server selects outside that offer. Foreign
protocol tooling stays on the development side — `vscode-languageserver-protocol` is a
development dependency that the conformance suite reads, never a runtime import.

The plan of record is sequenced. Each chunk reaches green — the full gate chain plus an
independent audit round — before the next begins. The campaign's briefs, reports, audit
verdicts, and acceptance records live in this repository under `.orkestrel/`, one
folder per fleet package with the cross-package record under `.orkestrel/campaign/`,
and name each chunk here by its commits. The `state.md` file there is the
session-boundary snapshot of what is in flight.

## Delivered

- **The workspace** (`3d4e57e`): the fleet-standard scaffold — core environment,
  configs, gates, policy suite.
- **The core contract and codec** (`073d7d2`, repaired in `451a2f8`): the
  `src/core/types.ts` protocol surface and the base-protocol framing codec —
  `Content-Length` encode and decode with incremental, fault-injected proofs.
- **The client** (`cd414f1`, repaired through `9c343cf`, `1451e19`, `2ed606b`,
  `41f6416`, `88c01f1`): the `LSPClient` entity over the transport seam — initialize
  handshake with capability declaration, position-encoding derivation, diagnostics-path
  selection from the server's `diagnosticProvider`, document open and close, coded
  errors, and a generation-owned lifecycle in which every emission and write is scoped
  to the transport generation that produced it.
- **The stdio transport** (`d354cab`, repaired in `bc1b355`, `f0ed550`): the server
  child process owned per generation, with a cooperative teardown window (`grace`) and
  refusal to start while a generation stays unretired. Host receipts prove real child
  teardown by process id.
- **The conformance suite** (`6690bc7`, `586758d`, `27725c0`, repaired in `2b171bf`,
  `c1f5cea`): the vendored LSP 3.18.0 metaModel mirror with its refresh script, and the
  suite that proves the protocol surface against that mirror and against the installed
  `vscode-languageserver-protocol` release — structure rows read from the metaModel's
  own properties, typed coordinates, membership derived from the core barrel, and a
  total drift formatter that reports any value without throwing.

## Delivered to its first consumer

- **The inspection bound split** (`231eb37`): the first real consumer falsified one
  conflation — `LSPClientOptions.timeout` bounded the client's lifecycle requests and
  the diagnostics wait alike, so a consumer whose inspection budget belongs to its own
  caller could not bound teardown tightly without preempting that caller. The design
  round ruled on 2026-08-26 (see `.orkestrel/lsp/l6-design-reconciliation.md`): `open`
  takes a required options bag whose `AbortSignal` is required, the signal reaches the
  pushed publication wait and the pulled diagnostic request alike, the client's
  `timeout` keeps only the lifecycle and settlement bounds, and an aborted open leaves
  the URI owned so `close` still notifies the server. The chunk landed behind a
  two-lane audit, the L6.1 fix, a PASS re-check, and a green gate chain.
- **The first consumer** (`orkestrel/probe` at `42e0b1e`): the probe package's
  `LintStage` delegates spawn, framing, correlation, and lifecycle to this package,
  installed as a packed tarball until the registry serves a release. Its round carries
  the adoption, the inspection-bound rewire, and the progress-gauge restore, accepted
  after an objective re-check returned PASS on every claim.

## Where the work sits, 2026-08-26

This repository lives on `main` and carries the whole campaign record under
`.orkestrel/`. Start a resumed session at `.orkestrel/campaign/state.md` — it is the
pickup record, and it names every held tree, every queued unit, and every ruling a unit
needs. The following table names the fleet repositories the campaign touches and the
branch to pick each one up on.

| Repository           | Branch                         | State                                                                                                                                                                                                                                                                  |
| -------------------- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `orkestrel/mcp`      | `claude/lsp-spec-audit-est33d` | The tasks wave is mid-implementation. The design round is reconciled in `.orkestrel/mcp/m4-design-reconciliation.md`; the era sweep and the contract surface have landed with their falsified-row patches, and the mirror, stream, proof, and guide units are queued.  |
| `orkestrel/markdown` | `claude/lsp-spec-audit-est33d` | The provenance round is written and its audit FAILED. `.orkestrel/markdown/h2-audit-reconciliation.md` rules the findings and cuts a four-unit fix round: the derivation-chain and boundary repairs, the contract prose, the executed fences, and the mechanical pass. |
| `orkestrel/probe`    | `claude/lsp-spec-audit-est33d` | Accepted and pushed — the lsp adoption, the inspection-bound rewire, and the gauge restore, with this package installed as a packed tarball recorded in `.orkestrel/probe/p1-tarball-swap.sh`. `P2` (the `Issue` range) is the next unit.                              |
| `orkestrel/html`     | `claude/lsp-spec-audit-est33d` | Accepted and pushed — span provenance on the parse surface.                                                                                                                                                                                                            |
| `orkestrel/workflow` | `claude/lsp-spec-audit-est33d` | Accepted and pushed — progress reshaped to the mcp pattern with `unit` removed.                                                                                                                                                                                        |
| `orkestrel/scaffold` | `claude/lsp-spec-audit-est33d` | Accepted and pushed — the vendored lint exclusion for the campaign archive. A release bump is registered for its moved vendored surface.                                                                                                                               |

## The campaign's end, and how a resumed session reaches it

The LSP audit that opened this campaign covered ten repositories. What remains before
it closes, in the order a resumed session takes it:

1. **Finish the mcp tasks wave (M4).** The mirror, stream, proof, guide, and gate units
   in `.orkestrel/mcp/m4-design-reconciliation.md`, then the round's two-lane audit and
   one commit.
2. **Finish the markdown provenance round (H2).** The four fix units in
   `.orkestrel/markdown/h2-audit-reconciliation.md`, each audited by an engine that did
   not write it, then one commit.
3. **Close the remaining mcp waves.** M5 (the deprecated surface) and M6 (the naming
   cascade), where M6 needs the user's blessing before any rename lands.
4. **Close the probe wave.** P2 replaces `Issue.line` with a zero-based `range`; P3
   (the `@typescript/native-preview` conformance reading) stays deferred pending the
   user's install approval.
5. **Close this package's own remaining work**, listed under Next.
6. **Release.** Publishing is the user's decision and credential, run in layer order
   through the `orkestrel-publish` skill.

## Next

- **Guides parity project.** The workspace runs no `guides` test project, so the
  guide's refresh procedure and surface rows are unguarded prose. Add the project and
  its parity suite in the fleet-standard shape.
- **Vocabulary pass.** Registered observations: the `value is unknown` annotation on
  `isInstalledDiagnostic` narrows nothing at runtime, and the client's `30_000` default
  sits inline rather than in the constants file.
- **`LSPServer`.** The server half of the package, mirroring the client's contract
  style: typed handlers over the same codec and transport seam. Designed after the
  client surface settles and the first consumer's demands are known.
- **Release.** Publishing is sequenced with the fleet's layer order and is the
  operator's decision and credential; the probe package re-pins from the tarball to the
  registry release when it exists.

## Deliberately deferred

- **`@typescript/native-preview` conformance.** Measuring the suite against the native
  TypeScript language server awaits the operator's approval to install the package.
- **Legacy protocol negotiation.** The client pins the protocol it implements; a
  compatibility mode for older servers is excluded by ruling, not postponed.
