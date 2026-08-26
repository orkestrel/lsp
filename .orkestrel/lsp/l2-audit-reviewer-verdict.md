# Verdict — @orkestrel/lsp L2 core contract and codec, lane: reviewer (Opus 5)

Immutable blind return of the `reviewer` lane, retained verbatim. The lane held the subjective
design-fit charter with correctness covered wherever reading could reach; every behavioural
ruling is a source derivation, with the settling command named where one is needed.

## 1. Contract fidelity — CONFIRMED

**Attack tried and failed:** walked every declaration in the brief's contract sketch against `/home/user/lsp/src/core/types.ts` member by member, looking for a dropped member, a lost `readonly`, a widened optional, or an unbriefed export.

Every sketched declaration exists with the specified shape. The discriminants hold: `JSONRPCNotification.id?: never` (`types.ts:406`), `JSONRPCResultResponse.error?: never` (`types.ts:422`), `JSONRPCErrorResponse.result?: never` (`types.ts:430`), and `JSONRPCErrorResponse.id: JSONRPCId | null` (`types.ts:428`). The open/closed split matches the reconciliation's metaModel probe: `LSPPositionEncoding = string` (`types.ts:532`) open; `LSPDiagnosticSeverity = 1|2|3|4` (`:479`), `LSPDiagnosticTag = 1|2` (`:482`), `LSPTextDocumentSyncKind = 0|1|2` (`:535`) closed. Every interface property carries `readonly`; every array is `readonly T[]`.

Exports beyond the sketch are `LSPInitializeParams` (`types.ts:570`, explicitly granted), `LSPErrorContext` (`:652`), and `LSPErrorOptions` (`:658`). The last two are the declared shape of the codec section's "context object that preserves the numeric wire code", and `.claude/rules/typescript.md` § Types requires them to live in `types.ts`. They fall inside the grant, not outside it.

`isLSPError` sits in `errors.ts:100` rather than the `validators.ts` the brief's codec section named. `.claude/rules/architecture.md` § Centralized-file pattern assigns "Error classes/guards" to `*/errors.ts`, and `AGENTS.md` § Authority makes the rule outrank the brief. The unit recorded the resolution (`l2-core-report.md:94`). Correctly resolved; not a departure.

## 2. Wire verbatim and model truth — CONFIRMED

**Attack tried and failed:** refused the report's member table as evidence and read the model directly, hunting for a mandatory member the type omits and for any renamed wire property.

`InitializeParams` (`lsp-3.18-metaModel.json:4551`) has empty `properties` and extends `_InitializeParams` (`:8105`) and `WorkspaceFoldersInitializeParams` (`:8217`). Resolving those: the only members carrying no `"optional": true` are `processId` (`:8108`), `rootUri` (`:8164`), and `capabilities` (`:8182`). All three are present and required in `LSPInitializeParams` (`types.ts:570-575`). The mixin member `workDoneToken` and the extension member `workspaceFolders` (`:8237`) are both optional. The report's table is accurate row for row.

Wire names check clean against the model: `Diagnostic` (`:8984`) yields `range`, `severity`, `code`, `codeDescription`, `source`, `message`, `tags`, `relatedInformation`, `data` — all spelled identically at `types.ts:496-506`. `PublishDiagnosticsParams` (`:4948`) yields `uri`, `version`, `diagnostics`, matching `types.ts:509-513`. `kind` is kept verbatim on `LSPDocumentDiagnosticReport` (`types.ts:525`, `:529`) as the brief required.

Two narrowings attacked and accepted: `Diagnostic.message` is `string | MarkupContent` in the model (`:9042`) and `string` here — authorized by reconciliation ruling 3, capability-gated. `LSPDocumentDiagnosticReport` omits the optional `relatedDocuments` arm; `isLSPDocumentDiagnosticReport` checks only named members (`validators.ts:886-900`), so a server sending it still validates and the client ignores it. Neither is a rename or a mandatory omission.

## 3. Byte accuracy — BROKEN

**Byte measurement and framing reassembly hold.** `encodeLSPMessage` measures `body.byteLength` from `TextEncoder` output (`helpers.ts:159-160`), never string length. The prefix/suffix index arithmetic in `parseLSPMessages` is correct for every split position traced: header spanning both buffers (`parsers.ts:65-70`), body spanning both, body wholly in either, and `frameEnd` landing exactly on the prefix end. A chunk boundary inside a multi-byte sequence is safe by construction — bytes are copied by index and `TextDecoder` runs only after `total >= frameEnd`. The brief's Unknown — a boundary inside one frame's body and the next frame's header simultaneously — resolves correct: the retention path at `:58-63` re-scans and the advance at the loop tail leaves the partial next header as `pending`.

**The claim breaks on message loss.** `messages` is a local array (`parsers.ts:30`) filled by `messages.push(parsed)` (`:184`) inside the `while` loop, and surfaced only through the `return` statements at `:62`, `:156`, and `:199`. Every throw between `:74` and `:186` discards it. So any fault in a **later** frame of a coalesced chunk destroys every message the parser already decoded from the **earlier** frames of that same chunk.

Failing input, constructible with the package's own exports:

```ts
const good = encodeLSPMessage({ jsonrpc: '2.0', method: 'textDocument/publishDiagnostics', params: { uri: 'file:///a.ts', diagnostics: [] } })
const body = new TextEncoder().encode('{')
const bad = new TextEncoder().encode(`Content-Length: ${body.byteLength}\r\n\r\n{`)
const chunk = new Uint8Array(good.byteLength + bad.byteLength)
chunk.set(good); chunk.set(bad, good.byteLength)
parseLSPMessages(chunk) // throws at parsers.ts:179; the publishDiagnostics notification is gone
```

Why it matters: L3's entire read path goes through this function, and a language server coalescing a diagnostics notification with a following frame is ordinary traffic, not a hostile case. The over-limit throw at `:103` and the unsupported-field throw at `:141` lose earlier messages the same way, and those fire while scanning the *second* frame's header — before its body has even been read.

Smallest correct fix: stop discarding decoded work. Either carry the decoded messages out with the fault — add `readonly messages?: readonly JSONRPCMessage[]` to `LSPErrorContext` and populate it at every throw site inside the loop — or move the fault into the returned tuple so the caller drains completed messages before handling it. The first is smaller and does not move the function's signature.

## 4. Total guards — CONFIRMED

**Attack tried and failed:** hunted for a property read outside the never-throw boundary, and for a shape the contract refuses that a guard accepts.

Every guard in `validators.ts` calls `isRecord(value)` first and then places **all** property access inside `holds(...)` — verified at `:696`, `:707`, `:726`, `:745`, `:765`, `:782`, `:793`, `:804`, `:815`, `:826`, `:865`, `:886`, `:908`, `:921`, `:939`, `:955`, `:975`. `@orkestrel/contract`'s installed declaration describes `holds` as the sanctioned never-throw boundary (`node_modules/@orkestrel/contract/dist/src/core/index.d.ts:1828`), so a throwing getter, a hostile prototype, and a cycle all land as `false`. `isLSPError` follows the same shape (`errors.ts:101-117`). The revoked-proxy row at `validators.test.ts:1303-1314` asserts `not.toThrow()` for the guards, recorded green.

Overlapping-arm refusal holds: `isJSONRPCResponse` rejects a payload carrying both `result` and `error` (`validators.ts:750-751`), pinned at `validators.test.ts:1216-1223`.

One property attacked without a break: `isNumber` admits `NaN` per its declaration (`index.d.ts:3187`), so a `NaN` id validates — but `JSONRPCId = string | number` genuinely admits it and JSON cannot carry it onto the wire. Held.

## 5. Naming and placement law — CONFIRMED

**Attack tried and failed:** grepped the whole of `src/core/` for every banned construct and read each file against the centralized-kind table.

The banned-construct sweep over `/home/user/lsp/src/core` returns hits only for `as const` on a literal deriving a tuple (`constants.ts:15`, exempt by `.claude/rules/typescript.md`) and prose words inside TSDoc. No `any`, no type assertion, no non-null assertion, no suppression.

Placement holds: `parseLSPMessages` is the sole export of `parsers.ts`; `encodeLSPMessage` is a `{verb}{Noun}` helper in `helpers.ts`; guards are `is*` in `validators.ts`; the error class and its guard share `errors.ts`; constants are UPPER_SNAKE_CASE with `Object.freeze` initializers; `index.ts` contains only `export * from` rows. No nested function declarations; every in-body function expression is an anonymous callback passed directly as an argument.

Package-owned surfaces are single words throughout; the compound wire names are verbatim protocol properties the contract fixes as exempt.

Residual that could not be run in this lane: `npm run test:policy`. Settling command named; expectation green.

## 6. TSDoc and test shape — CONFIRMED

**Attack tried and failed:** looked for an export with no TSDoc, a test file the mirror rule forbids or omits, and an assertion that would survive a mutation of the line it exists to pin.

Every export carries TSDoc; `encodeLSPMessage` and `parseLSPMessages` add `@throws` and `@example` (`helpers.ts:6-14`, `parsers.ts:12-25`), `isLSPError` adds `@example` (`errors.ts:89-99`).

The mirror set is complete under `.claude/rules/tests.md:43` (no test files solely for `constants.ts`, barrels, error definitions, or `types.ts`), so the absent mirrors are mandated rather than missing and deleting the placeholder was correct.

The circularity attack fails: `helpers.test.ts:1000-1008` pins the encoder's header and body against an independent `TextEncoder` reading, and the charset, limit, and malformed-JSON rows build frames by hand, closing the loop with the parser rows that feed on encoder output. `expect(thrown.context?.value).toBe(LSP_CONTENT_LIMIT + 1)` (`parsers.test.ts:1152`) would fail under a mutation dropping the context.

## 7. Core is host-independent — CONFIRMED

**Attack tried and failed:** read every import statement in the source files for a `node:` specifier, an undeclared package, or a host global.

Imports are `@orkestrel/emitter` (types only), `@orkestrel/contract`, and relative modules. `@orkestrel/process` appears nowhere. Every global used is WHATWG or ECMAScript interop the `src:core` scope admits. `npm run check:src:core` green is established evidence.

## 8. The suite is sufficient for what L3 builds on — BROKEN

| Behavior | Ruling | Evidence |
| --- | --- | --- |
| `null`-id error responses | Pinned | `validators.ts:753-755`; `validators.test.ts:1209-1214` |
| CRLF framing | Pinned | every frame row |
| Coalesced frames in one chunk | Pinned | `parsers.test.ts:1083-1101` |
| Header split across chunks | Pinned | `parsers.test.ts:1072-1081`, split at byte 11 |
| id `0` | Unpinned, safe | derivation, not a run |
| Empty-string id | Unpinned, safe | derivation |
| Incremental decode across a chunk boundary mid-body | **Unpinned and required** | Finding A |
| A header with unknown extra fields | **Unpinned and required** | Finding B |

**Finding A — no row pins a chunk boundary inside a frame body.** The only split row cuts inside `Content-Length`'s field name, so the `total < frameEnd` retention branch at `parsers.ts:151-157` and the two-buffer body assembly beneath it are executed by no test. Required rows: split a frame at a byte inside its body; split inside a multi-byte sequence of astral content; deliver frame N's body tail and frame N+1's partial header in one chunk and assert both the message and the retained `pending`.

**Finding B — the parser refuses any header field it does not know, and no row pins the decision.** `parsers.ts:141` throws `framing` for every field name that is neither `content-length` nor `content-type`. Nothing authorizes the refusal: the distillate records the supported fields over an HTTP-style header part, where unknown fields are conventionally ignored. As shipped, one unrecognized header field kills the connection with a framing error, and nothing states the choice. Required: rule the behavior, then pin it.

## Findings outside the claims

**C. `parseLSPMessages` retains an unbounded buffer when no header terminator arrives, which falsifies a stated design ruling.** When no `\r\n\r\n` is found, `parsers.ts:58-63` copies everything received into a fresh buffer with no bound applied; `LSP_CONTENT_LIMIT` guards only a declared `Content-Length`. The design record's sentence "a hostile header cannot reserve unbounded memory" (`lsp-design-reconciliation.md:98-99`) is false of the shipped code, and the constant's TSDoc reads as covering more than it does. Fix: bound the accumulated header the same way and correct the ruling's sentence in the durable artifact that carries it forward.

**D. The parser re-scans and re-copies the entire accumulated buffer on every chunk, making a large message quadratic.** Each call restarts the boundary scan at index 0 and, on the incomplete-frame paths, allocates and copies the whole accumulation. A body arriving in chunks costs quadratic bytes copied before the first message emerges. Fix: carry the resolved header boundary and body length across calls so a continuation appends rather than re-scanning.

**E. `LSP_METHODS` values widen to `string`, so L3 cannot narrow on them, and the sibling constant is treated differently.** `Object.freeze({ … })` at `constants.ts:2-12` types each member as `string`; `LSP_ENCODINGS` keeps its literals with `as const`. L3 routes inbound traffic on these members; with `string` values no comparison narrows. Fix: `as const`.

**F. The public core surface has no guide, and this repository has no gate that would report it.** `tests/guides.test.ts` does not exist, so the parity law binds with no instrument behind it. The L2 brief put `guides/` off-limits, so this is not the unit's defect; the reconciliation assigns the carrier to L6, four units downstream of a surface growing at every step. Carrier confirmation belongs to the Orchestrator.

## Referrals

- Claim 5's mechanical half: `npm run test:policy` in `/home/user/lsp`, not yet run.
- Finding A's derivations: the settling instrument is the test set Finding A names.
- Finding D's magnitude: the quadratic shape is readable; the wall-clock cost is a measurement this lane cannot take.

VERDICT: FAIL — 2 broken, 0 unresolved, 0 not-evidenced, 4 findings outside the claims
