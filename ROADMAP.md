# ROADMAP

`@orkestrel/lsp` gives the Orkestrel fleet one Language Server Protocol implementation:
an `LSPClient` that drives a real language server over a transport, a stdio transport
that owns the server child process, and a conformance suite that measures the package
against the protocol's own metaModel. The package exists so no fleet consumer carries
private framing, correlation, or lifecycle code for a language server again — the probe
package's lint stage is the first such consumer. An `LSPServer` half waits for a fleet
package that must answer LSP requests rather than send them.

The package targets LSP 3.18 and carries no compatibility mode for older servers: the
client advertises exactly what it implements — `utf-16` position encoding alone — and
fails `start` with a `protocol` error when a server selects outside that offer. Foreign
protocol tooling stays on the development side — `vscode-languageserver-protocol` is a
development dependency that the conformance suite reads, never a runtime import. The
transport seam carries bytes and stays that way for stream transports: LSP fixes one
`Content-Length` framing over stdio, socket, and pipe, so the codec is a package-wide
constant that the client owns. A message-framed transport re-frames at its own edge
rather than adding a second seam.

The plan of record is sequenced. Each chunk reaches green — the full gate chain plus an
independent audit round — before the next begins, and each `## Delivered` row names the
commits that carry it. A campaign's briefs, reports, audit verdicts, and acceptance
records land under `.orkestrel/lsp/` in those same commits. Read them after the campaign
folder prunes by naming that path in a `git show` against the commit.

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
- **The combinator adoption** (`869b506`): `arrayOf`, `literalOf`, `optionalOf`, and
  `unionOf` replace the hand-walked loops and literal chains in the diagnostic,
  container, sync, and capability guards. Every guard keeps its function form, its
  `isRecord` root, and its `holds` boundary, and the JSON-RPC message guards stay
  hand-written whole for their forbidden-key logic. Added cases pin the accepted set:
  sparse element arrays refused, literal member sets bounded, a prototype-carrying
  instance refused at the root, unknown extra members still admitted.
- **The seam fold and the single-sourced advertisement** (`05005da`):
  `#releaseGeneration` folded into its one caller. `#cancelRequest` stays by ruling —
  it composes the cancel notification, the send, and the failure-to-emitter policy,
  symmetric with `#respondUnsupported`, and folding one of that pair would give the
  class a second vocabulary for one concept. `LSP_CAPABILITIES` moves the advertised
  capability record into constants, deeply frozen, so the initialize advertisement and
  the position-encoding refusal derive from one source rather than each carrying its own
  `utf-16` literal to drift from. `waitForDeadline` centralizes the repeated deadline
  race; a runtime probe with a `setTimeout` negative control read the armed
  `AbortSignal.timeout` holding nothing open, so the helper keeps its plain promise
  shape.
- **The codec decomposition** (`e5dfac7`): `parseLSPMessages` keeps the framing spine —
  state chaining, the overlap window, the accumulation refusals, boundary bookkeeping,
  and the remainder re-seed — and hands the rest to exported leaves in `helpers.ts`:
  `joinLSPSegments` and `takeLSPTail` over the segment chain, `scanLSPBoundary` over a
  flat buffer, and `readLSPHeader` and `readLSPBody` owning the header and payload
  grammars with every refusal code, message string, and context preserved. The
  duplicated segment-join walk became one implementation. Cyclomatic readings under the
  retained probe on 2026-08-26: `parseLSPMessages` 19, down from 60, and `readLSPHeader`
  27 alone, accepted by design and recorded. `parseLSPMessages` keeps its name and file
  although it throws and returns a tuple, outside the `parse*` coercion form — renaming
  the package's flagship codec entry is a public break, recorded rather than repaired.
- **The audit round's accepted findings** (`823f2d6`): the framing guide states the
  boundary precondition — `subarray(0, boundary)` is the header block and the body
  starts at `boundary + 4` — and its fence composes `encodeLSPMessage`,
  `scanLSPBoundary`, `readLSPHeader`, and `readLSPBody` over one framed buffer, with the
  fence's values executed in the guides suite. The `messages` parameter on the readers
  gains a documented empty-list default, `waitForDeadline`'s parameter is named
  `timeout`, the diagnostic `code` member adopts
  `optionalOf(unionOf(isNumber, isString))` with a binding refusal case, and the
  `encoding` getter's protocol-default literal carries the comment separating it from
  the advertisement.

## Next

Each row names what triggers it, and nothing here is scheduled. As of 2026-08-26 the
package's only consumer, the probe package's lint stage, runs warm-resident over stdio
with no measured transport bottleneck: its warm run measured 437-495 ms, and that time
is linter work rather than framing.

- **`SocketClientTransport`.** One `node:net` class whose `server` option group carries
  `{ host, port }` or `{ path }`. A consumer that must attach to a language server it
  does not spawn triggers it.
- **`WebSocketClientTransport`.** Client halves mirroring the mcp package's pair: a Node
  half that can build on `@orkestrel/websocket` the way mcp's server-side client transport
  does, and a browser half over the platform `WebSocket` — each prepending the header bytes
  on `message` and stripping them on `send`, so the client keeps the byte seam unchanged.
  A consumer that must reach a language server over WebSocket triggers it.
- **`LSPServer`.** The server half, mirroring the client's contract style: typed
  handlers over the same codec and transport seam. A fleet package that must answer LSP
  requests rather than send them triggers it, and that consumer's first requirement set
  is the design brief.
- **TypeScript 7 conformance.** Approved by the user on 2026-08-26 as a
  conformance-only reading — `@typescript/native-preview` measured against the suite,
  never adopted at runtime — in a later session.

## Deliberately deferred

- **Legacy protocol negotiation.** The client pins the protocol it implements; a
  compatibility mode for older servers is excluded by ruling, not postponed.
- **An IPC-channel transport.** Node's IPC channel is message-shaped and carries no
  `Content-Length` header, and it reaches only a peer this package spawned — which the
  stdio transport already serves. Excluded by ruling, not postponed.
- **Further ecosystem dependencies.** `package.json` is byte-identical to `2c0eba8`
  across this campaign, and each candidate carries its reason. `@orkestrel/abort` wraps
  `AbortSignal.any`, which the client composes natively. `@orkestrel/timeout` is a
  lifecycle timer entity where the need is a one-shot deadline that `waitForDeadline`
  closes. `@orkestrel/websocket` is Node-only and text-frame, so the deferred browser
  transport reaches for the platform `WebSocket` instead. `@orkestrel/sse` and
  `@orkestrel/tool` have no surface here. `@orkestrel/pool` is a probe-side note.

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
- **scaffold** — the oxlint `complexity` rule as a vendored `.oxlintrc.json` decision:
  the installed oxlint 1.80.0 supports the rule and no default category enables it. The
  probe retained at `.orkestrel/lsp/complexity-probe-results.txt` read lsp clean at the
  default maximum of 20 on 2026-08-26 after this campaign's decomposition, and mcp
  carrying readings of 21 to 30. `lint:check` runs `--deny-warnings`, so enabling the
  rule gates immediately and a fleet sweep comes first.
- **process** — a supervised child exposes a line stream only: `ProcessInterface.lines`
  yields decoded strings framed on line terminators, so a transport that frames its own
  bytes cannot read a child through it and reaches for `node:child_process` directly, as
  this package's stdio transport does. A raw byte-chunk stream on the same interface
  would let those transports drop the direct spawn.
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
- **html** — the spans-to-markdown inbound projection.
- **probe** — the RuntimeStage frame-basis dependence on Vitest's un-remapped stacks: a
  Vitest change routing the stage's frames through its source-map remap flips the
  column basis. The guard chain refuses it loudly, and the campaign's
  `p2-settle-instrument.sh` re-produces the detecting measurement from git history
  after the prune.
