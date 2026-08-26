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

- **The guides parity project** (`eefa27a`): the fleet-standard executed-fence suite —
  `tests/guides.test.ts` powered by `@orkestrel/guide` and `@orkestrel/test`, the guides
  Vite project wired into the test chain, the manifest reshaped into the `## By concept`
  table the suite reads, and the guide surface tables proved by running their fences;
  `test:guides` read `23 passed` on 2026-08-26.
- **The vocabulary pass** (`759b899`): the `isInstalledDiagnostic` guard declares
  `value is Diagnostic` through the installed protocol package, and the
  request-settlement default hoists to `LSP_TIMEOUT` in the constants file with its
  guide row.

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

## Where the work sits, 2026-08-26, at the campaign's close

Every wave is closed and every touched checkout reads green under an independent
verifier (`.orkestrel/campaign/fleet-verifier-2026-08-26.md`). The following table names
each repository's final campaign state and the branch that carries it.

| Repository                    | Branch                         | State                                                                                                                                                                                                      |
| ----------------------------- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `orkestrel/lsp`               | `main`                         | `759b899` — the package with its guides parity project and vocabulary pass; the verifier read conformance `243 passed` on 2026-08-26.                                                                      |
| `orkestrel/mcp`               | `claude/lsp-spec-audit-est33d` | `aa20c37` — the tasks wave (M4), the M5 closure under the no-deprecation ruling, and the M6 naming cascade, each accepted behind its audit. The moved published surface obliges a version bump at release. |
| `orkestrel/markdown`          | `claude/lsp-spec-audit-est33d` | `a02494e` — the provenance round (H2) accepted behind its review and repairs.                                                                                                                              |
| `orkestrel/probe`             | `claude/lsp-spec-audit-est33d` | `1db0372` — the lsp adoption (P1) and the `Issue.range` move (P2) accepted; the package re-pins its `file:` tarball range to the registry release at publish.                                              |
| `orkestrel/html`              | `claude/lsp-spec-audit-est33d` | `a533947` — span provenance on the parse surface.                                                                                                                                                          |
| `orkestrel/workflow`          | `claude/lsp-spec-audit-est33d` | `c01e1a5` — progress reshaped to the mcp pattern with `unit` removed.                                                                                                                                      |
| `orkestrel/scaffold`          | `claude/lsp-spec-audit-est33d` | `c51d7ce` — the vendored lint exclusion and the bench write-root rule. The moved vendored surface obliges a scaffold release; every target re-pins and runs `repair` after it.                             |
| `orkestrel/process`           | `claude/lsp-spec-audit-est33d` | `2a47ed1` — the G1 guide ruling and the g2 fixture guard behind its red-first and mutation-bound records.                                                                                                  |
| `queue`, `tool`, `middleware` | `claude/lsp-spec-audit-est33d` | G1 commits — each guide records why the package stays untouched by the progress work.                                                                                                                      |

## The campaign's end

The exit criterion is met on landed evidence: every audit-report row reached
implemented, repaired, retained, or intentionally excluded, and every touched checkout's
gate chain reads green under an independent verifier. What remains runs on the owner's
word:

1. **The campaign folder prune.** The retention procedure's checks run first and the
   disposition goes to the owner; deletion happens only on the owner's explicit
   go-ahead, and the prune commit carries the promotion record. Git history is the
   archive.
2. **Release.** Publishing is the user's decision and credential, in layer order through
   the `orkestrel-publish` skill. The release carries the mcp bump for its moved
   published surface, the scaffold bump for its moved vendored surface with every target
   re-pinning and running `repair` after it, and the probe re-pin from the `file:`
   tarball to the registry release.

## Next

- **`LSPServer`.** The server half of the package, mirroring the client's contract
  style: typed handlers over the same codec and transport seam. Designed after the
  client surface settles and the first consumer's demands are known.
- **The client's internal seams.** `#cancelRequest` has one caller and
  `#releaseGeneration` forwards to a delegate; fold or justify each in the next client
  change.
- **TypeScript 7 conformance.** Approved by the user on 2026-08-26 as a
  conformance-only reading — `@typescript/native-preview` measured against the suite,
  never adopted at runtime — in a later session, after the package is enterprise-grade.

## Fleet findings carried forward

Each finding names its owning package and waits for its own change. The campaign records
them here because the campaign folder prunes and this file outlives the prune.

- **scaffold** — the session-assembly duplication: a Cloud session that attaches every
  fleet repository injects each checkout's byte-identical instruction files into the
  model context per window. A scaffold-owned slimming decision, or attaching only the
  repositories a session works, closes it; deleting the vendored files from targets is
  not a fix, because `repair` restores them and the policy gates read them.
- **scaffold** — the inert `.oxlintignore` under oxlint 1.80.0: the binary reads
  `.eslintignore`, and the rc `ignorePatterns` carries the exclusion instead. Wire
  `--ignore-path` or retire the file in a fleet alignment pass.
- **fleet** — the guides-execution gap: in the packages that predate the executed-fence
  shape, the parity drop-in resolves names but executes no fence. The drop-in's header
  also carries a count and the word "below"; repair it upstream in the markdown
  package's `tests/guides.test.ts` when the shape next moves.
- **mcp** — transport-ingress backpressure.
- **mcp** — the `below`/`above` file-wide sweep.
- **markdown** — the vocabulary sweep: pre-existing `via` at `guides/markdown.md:158`,
  `:194`, `:227`, `:453`, `src/core/helpers.ts:2669`, and `src/core/parsers.ts:193`,
  and the imperative TSDoc openers at `helpers.ts:434` and `:500`, per the h2.4 review.
- **markdown** — the CommonMark `U+0000` replacement question.
- **markdown and html** — the reused-identity engine divergence.
- **html** — the spans-to-markdown inbound projection, and barrel membership of
  `findOpenPosition` and `projectDepth`.
- **probe** — the RuntimeStage frame-basis dependence on Vitest's un-remapped stacks: a
  Vitest change routing the stage's frames through its source-map remap flips the
  column basis. The guard chain refuses it loudly, and the campaign's
  `p2-settle-instrument.sh` re-produces the detecting measurement from git history
  after the prune.

## Deliberately deferred

- **Legacy protocol negotiation.** The client pins the protocol it implements; a
  compatibility mode for older servers is excluded by ruling, not postponed.
