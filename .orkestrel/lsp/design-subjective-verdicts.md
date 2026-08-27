# Subjective design lane verdicts — planner / Opus 5, 2026-08-26

Returned by the native `planner` agent against `design-brief.md`. Retained verbatim from the
agent's report.

## 1. Decomposition — the class stays whole; extract two leaves, not a manager

**Ruling: no manager, no sub-entity, no controller extracts from `LSPClient`.** Extract exactly
one pure leaf and one constant.

- The extraction rules gate on member families, not on line count. `LSPClient`'s public surface is
  `start`/`open`/`close`/`destroy` plus `emitter`/`capabilities`/`encoding`
  (`src/core/types.ts:298-330`) — every member is already one word, so there is no compound family
  creating extraction pressure.
- Correlation and generation lifecycle are the client's defining engine
  (`.claude/rules/architecture.md`: "Defining engine internals remain methods when extraction
  would hollow the class into a thin delegate"). A `CorrelationManager` would leave `#request` and
  `#receiveResponse` as forwards, which the wrapper test refuses.
- The regions are not separable: `#drain` writes `#pending` and `#publications` in one call
  (`LSPClient.ts:617-620`); `#receiveExit` drives lifecycle, session clear, drain, and emit
  together (`:622-632`); `#teardown` drives drain, request, exit write, transport close, listener
  removal, and emitter destroy (`:644-664`).
- mcp's precedent confirms it: `MCPClient` is larger (1091 lines) and keeps correlation and
  lifecycle private, extracting only `tasks` — a family consumers address by name. lsp has none.

What does extract:

- **`waitForDeadline(ms: number): Promise<void>` into `src/core/helpers.ts`.** The
  `AbortSignal.timeout` + listener + race construction appears twice (`LSPClient.ts:666-673`,
  `:678-687`); the centralize-twice law forces it; it reaches no `#` state, so the leaf test makes
  it an exported helper. Callers keep their own outcome mapping.
- **`LSP_CAPABILITIES` into `src/core/constants.ts`.** The advertised capability record is data in
  a method body (`LSPClient.ts:243-250`), and the guide and ROADMAP make a behavioral claim about
  it ("advertises utf-16 alone") that no executed assertion proves. It also removes a drift path:
  `#begin` advertises `['utf-16']` at `:246` and independently refuses at `:263` — two literals
  that can disagree. Derive the check from the constant.

What explicitly does NOT extract: the `#send` phase/method permission table
(`LSPClient.ts:423-431`) — pure, one call site, fold-in-place rule.

## 2. Seam rulings

**`#releaseGeneration`: fold.** `await this.#closeTransport()` and nothing else (`:696-698`), one
caller at `:277` — the exact one-line-delegate shape the wrapper test deletes.

**`#cancelRequest`: keep, and close the ROADMAP row with the ruling.** It composes the
`$/cancelRequest` shape, the send, and the failure-to-emitter policy (`:580-586`).
`#respondUnsupported` (`:539-559`) has the identical shape and also one caller; folding one and
keeping the other gives the class two vocabularies for one concept. Caller count is a wrapper
test, not a rule against named steps of an orchestration.

## 3. Transport seam — keep the byte seam

- LSP fixes one framing for every stream transport (stdio, socket, pipe all carry Content-Length),
  so framing is a package-wide constant; moving it into transports replicates `parseLSPMessages`
  and its retained state per transport, over the package's most fault-sensitive code.
- The seam's foreign-implementer obligation set (generation scoping, at-most-one `exit`,
  reject-don't-throw, `send` false after close) is at its honest limit; a message seam adds decode
  state, malformed-frame semantics, and limits to that list.
- mcp's two seams are correct FOR mcp: its transports genuinely disagree about framing. LSP has
  one wire framing to centralize; rules over resemblance.
- A future WebSocket transport re-frames at the edge (prepend header bytes on `message`, strip on
  `send`) — one small class, one seam, one codec. `encodeLSPMessage` is already public for edge
  work.

## 4. New transports — none now

| Transport | Ruling | Trigger or reason |
| --- | --- | --- |
| socket (TCP) + pipe | Defer, one unit | A consumer that must reach a server it does not spawn. One `node:net` class; `server` group carries `{ host, port }` or `{ path }`. |
| node-ipc | Exclude by ruling | Message-shaped (no Content-Length) so it needs the refused message seam, and it only reaches a self-spawned peer, which stdio serves. |
| WebSocket | Defer | A browser consumer that must reach a server it cannot spawn. Platform `WebSocket`; `@orkestrel/websocket` is Node-only text-frame and earns nothing. |

No transport work is a performance improvement: probe's warm prove 437-495 ms is linter work over
one warm child; there is no measured transport bottleneck. Record that reading.

## 5. Contract adoption — element, literal, and union combinators; refuse `objectOf` at the root

Adopt (inline, keeping every `export function is*` guard):

| Site | Adopt |
| --- | --- |
| severity (`validators.ts:163-169`) | `optionalOf(literalOf(1, 2, 3, 4))(value.severity)` |
| tags (`:174-180`) | `optionalOf(arrayOf(literalOf(1, 2)))(value.tags)` |
| relatedInformation (`:181-186`) | `optionalOf(arrayOf(isLSPDiagnosticRelated))(value.relatedInformation)` |
| diagnostics (`:204-208`) | `arrayOf(isLSPDiagnostic)(value.diagnostics)` |
| items (`:226-230`) | `arrayOf(isLSPDiagnostic)(value.items)` |
| change (`:258-262`) | `optionalOf(literalOf(0, 1, 2))(value.change)` |
| textDocumentSync (`:292-296`) | `optionalOf(unionOf(literalOf(0, 1, 2), isLSPTextDocumentSyncOptions))(value.textDocumentSync)` |

Stay hand-written: the `jsonrpc === '2.0'` literals; the `isRecord` root and `holds` boundary in
every guard; the JSON-RPC message guards as wholes.

**Refuse `objectOf` at the guard root** (contradicts the objective lane): `objectOf` accepts
member-carrying functions and class instances and reads members through `Reflect.get`, so
inherited data and prototype accessors satisfy the shape; `isRecord` refuses every non-plain
object. These guards narrow JSON off the wire; swapping the root widens every exported guard with
no consumer asking, and `isLSPRange` ships on probe's public `Issue` contract. The
foreign-contracts law bans exact-record guards over foreign data; `isRecord` is a brand check.

`enumOf` finds no site.

## 6. abort and timeout — add neither

- `linkSignal` wraps `AbortSignal.any`; the wrapper test deletes it. The package has no signal to
  link — the client/open signal separation is the design the first consumer paid for.
- `Timeout` is a lifecycle timer entity; the need is a one-shot deadline, closed by
  `waitForDeadline`. Trigger that would earn the package: a managed, cancellable, observable timer
  FAMILY (reconnect backoff, inspectable per-request budgets).
- Every other package ruled: websocket no, sse no, tool no, pool no (probe-side note).
  **Net: `package.json` is untouched by this campaign — make that an acceptance criterion.**
- `StdioTransport`'s hand-rolled spawn stands: `ProcessInterface` exposes a line stream only; the
  byte-chunk gap is a `@orkestrel/process` finding carried in ROADMAP.

## 7. `LSPServer` — stays in Next

Replace the evaluative close condition with: **deferred until a fleet package must answer LSP
requests rather than send them; that consumer's first requirement set is the design brief.**

## 8. ROADMAP reshape

- Opening paragraphs stay, edited: the `.orkestrel/` sentence becomes git-history navigation; the
  `LSPServer` sentence takes the trigger.
- `## Delivered` absorbs `## Delivered to its first consumer` verbatim.
- The branch table and `## The campaign's end` go in full.
- `## Fleet findings carried forward` stays, verified row by row (U0) — strike shipped rows with
  the commit named; keep unverifiable rows with the reason named.
- `## Deliberately deferred` gains node-ipc.
- `## Next` becomes the sequenced plan of record: campaign chunks with close conditions, then
  triggered items (socket+pipe, WebSocket, `LSPServer`, TypeScript 7). The internal-seams row is
  struck (question 2 closes it).
- Added rulings recorded once each: byte seam retained, no dependency added, transport
  performance reading.

## 9. Units (as proposed; routing amended by the Orchestrator in plan.md)

U0 fleet-findings verification (read-only) → U1 validators adoption → U2 client seams and
extractions → U3 ROADMAP → U4 verifier gates. Acceptance criteria as restated in the unit briefs.

## Open questions

1. Does `AbortSignal.timeout` keep the event loop alive after its race settles? Settle with a
   `tmp/probe/` runtime probe plus a `setTimeout` negative control; if it holds, `waitForDeadline`
   owns a `clearTimeout` — still no dependency.
2. Do any fleet-finding rows already ship? U0 settles it.
3. Does the conformance suite read the advertised capability set? U2 greps before writing the
   guide assertion.

## Conflicts with the evidence pack

- `formatConformanceValue` does NOT overlap `roundTripJSON`: opposite totality (the formatter
  never throws; `roundTripJSON` throws on non-JSON-safe values). No unit.
- `objectOf` "matches the foreign-contracts law": accurate about `objectOf`, wrong as a selection
  here (question 5).

## Tensions ruled on judgment

1. Exporting `waitForDeadline` publicly (barrel law) — acceptable; the seam contract already
   names the settlement bound, so transport authors need the mechanism.
2. `LSP_CAPABILITIES` as a public constant — the unfalsifiable prose claim weighed higher than
   surface-expansion caution.
3. Keeping `#cancelRequest` against the fold-or-justify row — justified on symmetry with
   `#respondUnsupported`.
4. Excluding node-ipc rather than deferring — the reason is structural, not circumstantial.

## Risks

- The byte seam must be reopened only on real evidence: a browser LSP bridge driven end to end
  through the adapter shape, measured against a message seam.
- A combinator could silently change an accepted set — pinned by explicit refusal cases in U1.
- The ROADMAP `.orkestrel/` sentence must be rewritten in the same campaign that prunes.
- `package.json` untouched is the load-bearing outcome of question 6 — an explicit criterion on
  every writing unit.
