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

## In flight, 2026-08-26

- **The inspection bound split.** The first real consumer falsified one conflation:
  `LSPClientOptions.timeout` bounds the client's lifecycle requests and the
  diagnostics wait alike, so a consumer whose inspection budget belongs to its own
  caller cannot bound teardown tightly without preempting that caller. The design round
  ruled on 2026-08-26 (see `.orkestrel/lsp/l6-design-reconciliation.md`): `open` takes
  a required options bag whose `AbortSignal` is required, the signal reaches the pushed
  publication wait and the pulled diagnostic request alike, the client's `timeout`
  keeps only the lifecycle and settlement bounds, and an aborted open leaves the URI
  owned so `close` still notifies the server. The chunk lands next, and the probe
  package's lint stage rewires to it in the same chunk.
- **The probe adoption.** The probe package's `LintStage` delegates spawn, framing,
  correlation, and lifecycle to this package (installed as a packed tarball until the
  registry serves a release). Its remaining red rows close when the inspection bound
  split lands.

## Where the work sits, 2026-08-26

This repository lives on `main` and carries the campaign record under `.orkestrel/`. The
following table names the fleet repositories the campaign touches and the branch to pick each
one up on.

| Repository           | Branch                        | State                                                                                                                                                                                                     |
| -------------------- | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `orkestrel/mcp`      | `claude/lsp-spec-audit-est33d` | Committed and pushed through `f0ad416`. A staged fix unit snapshots the `listen` caller signal and claims progress before the subscription discard; its brief is `.orkestrel/mcp/m3.2-routing-brief.md`. |
| `orkestrel/markdown` | `claude/lsp-spec-audit-est33d` | The provenance round is held uncommitted in the working tree and commits as one behind a green gate chain. The rewrite unit's brief is `.orkestrel/markdown/h2-u4-rewrite-brief.md`.                     |
| `orkestrel/probe`    | `claude/lsp-spec-audit-est33d` | The adoption diff is held uncommitted, with this package installed as a packed tarball recorded in `.orkestrel/probe/p1-tarball-swap.sh`. Its remaining red rows close when the inspection bound split lands. |
| `orkestrel/html`     | `claude/lsp-spec-audit-est33d` | Accepted and pushed — span provenance on the parse surface.                                                                                                                                               |
| `orkestrel/workflow` | `claude/lsp-spec-audit-est33d` | Accepted and pushed — progress reshaped to the mcp pattern with `unit` removed.                                                                                                                           |

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
