**1. Decomposition**

**Ruling:** `LSPClient` stays whole. Extract no manager, no correlation class, no publication class, no generation class.

**Reasons:** The public surface is `start` / `open` / `close` / `destroy` plus `emitter`, `capabilities`, and `encoding` (`src/core/types.ts:298-329`). Those methods are the engine: they share `#pending`, `#publications`, `#documents`, `#diagnostics`, `#state`, `#generation`, and `#lifecycle` (`src/core/LSPClient.ts:83-111`). Architecture keeps defining internals as methods when extraction would leave a thin delegate, and a manager exists for a compound public family with a readonly getter (`architecture.md` Functions and orchestration; Managers). mcp extracts only because `tasks` is a public sub-entity (`node_modules/@orkestrel/mcp/dist/src/core/index.d.ts:2101`, `get tasks(): MCPTaskClientInterface`). lsp has no such family. Probe calls `createLSPClient` then `start` / `open` / `close` / `destroy` (`node_modules/@orkestrel/probe/dist/src/server/index.js:929-947,973-986`). Framing is already extracted (`parseLSPMessages`, `encodeLSPMessage`). Correlation, publication waits, decode/dispatch, and generation teardown are one lifecycle.

**Evidence conflict:** the pack’s `LSPClient.ts` length is 713; the file ends at line 714.

**2. Seam rulings**

**`#releaseGeneration` — fold.** It is a 1:1 forward to `#closeTransport` (`src/core/LSPClient.ts:696-698`). The only caller is the failed-handshake path in `#begin` (`:277`). The wrapper test deletes one-line delegates. Inline `await this.#closeTransport()` at that caller and delete the method.

**`#cancelRequest` — keep.** It is not a forward. After `#settle` succeeds and the generation is `ready`, it writes `$/cancelRequest` (`:569-586`, `src/core/constants.ts:7`). Publication abort (`:588-595`) and `#drain` (`:617-619`) settle without that write, because they have no request id. One caller is the expected shape for a protocol obligation, not a hollow wrapper.

**3. Transport seam shape**

**Ruling:** Keep the byte seam. Do not adopt mcp’s message-carrier seam now. Do not add a second seam now.

**Reasons:** `LSPTransportInterface` is `chunk: Uint8Array` plus `send(bytes: Uint8Array)` (`src/core/types.ts:205-239`). The client owns Content-Length (`src/core/helpers.ts:17-40`, `src/core/parsers.ts:33-36`; `#send` / `#receiveChunk` at `LSPClient.ts:421-458`). `StdioTransport` is required not to frame (`src/server/transports/StdioTransport.ts:14-15`; `guides/lsp.md:99-104`). Stdio, TCP, and named-pipe/unix-socket all carry that same byte stream, so one client-owned codec is the shared engine. mcp’s client seam is `send(message: JSONRPCMessage)` with `emitter.message` (`node_modules/@orkestrel/mcp/dist/src/core/index.d.ts:2437-2500`) because its hosts already own newline/HTTP/WS framing. Moving lsp framing into the transport would change the published stdio contract the first consumer already drives (`node_modules/@orkestrel/probe/dist/src/server/index.js:929-947`). `@orkestrel/websocket` is text-only (`send(data: string)`, `message: string` at `node_modules/@orkestrel/websocket/dist/src/server/index.d.ts:217-247`). A WebSocket transport would need a message-framed seam, and that unit does not start until a consumer exists (verdict 4).

**4. New transports**

**Ruling:** Implement none now. Record each as deferred with a trigger.

| Form | Now | Trigger |
| --- | --- | --- |
| Socket (`node:net` TCP) and pipe (named pipe / unix domain socket) | Deferred. One class, connect options grouped (`port` vs `path`). Fits the existing byte seam. | A consumer that must attach to a language server already listening on a socket or pipe. |
| node-ipc / Node IPC | Deferred. | A consumer that must attach to a server launched on Node’s IPC channel. Does not by itself authorize a non-Orkestrel npm package. |
| WebSocket | Deferred. | A consumer that must speak LSP over WebSocket. That unit also adds a message-framed seam; `@orkestrel/websocket` cannot carry Content-Length bytes. |

**Reasons:** Probe’s spawn is `[process.execPath, oxlint-entry, '--lsp']` over stdio only (`node_modules/@orkestrel/probe/dist/src/server/index.js:929-936`). Installed probe has no other transport. Warm vs boot cost is process lifetime, not framing: one Oxlint child per `LintStage`, recycled only after the coordinator deadline (`index.js:886-888,2349-2366`). Socket/pipe would not make that path faster than local stdio. Minimal-API law: no first consumer, no new transport.

**5. Contract adoption depth**

**Ruling:** Keep every `export function is*` guard. Call installed combinators inline where they match. Do not add a dependency. Do not switch the I/O path to `attempt` / `Result`.

**Adopt (declared `@orkestrel/contract` 0.0.13, `node_modules/@orkestrel/contract/dist/src/core/index.d.ts` overloads; open-object semantics in `guides/contract.md:126`):**

- `literalOf('2.0')` for `jsonrpc` inside `isJSONRPCRequest` / `isJSONRPCNotification` / `isJSONRPCResponse` (`validators.ts:43,62,80`).
- `optionalOf(isRecord)` for `params` in the request and notification guards (`:46,65`).
- `unionOf(isString, isNumber)` for a request/success-response `id`.
- `objectOf` plus an optional-key list for open wire objects with no forbidden-key rule: `isJSONRPCError`, `isLSPRange`, `isLSPLocation`, `isLSPCodeDescription`, `isLSPDiagnosticRelated`, `isLSPDiagnostic`, `isLSPPublishDiagnosticsParams`, `isLSPIdentity`, `isLSPTextDocumentSyncOptions`, `isLSPDiagnosticOptions`, `isLSPServerCapabilities`, `isLSPInitializeResult`. Omit `data` and the capabilities index signature from the shape so unknown members stay uninspected.
- `literalOf(1, 2, 3, 4)` for severity (`:163-167`); `arrayOf(literalOf(1, 2))` for tags (`:174-180`); `arrayOf(isLSPDiagnosticRelated)` for related information (`:181-186`); `arrayOf(isLSPDiagnostic)` for `diagnostics` and `items` (`:204-207,226-229`).
- `unionOf(literalOf(0, 1, 2), isLSPTextDocumentSyncOptions)` for `textDocumentSync` (`:292-296`).
- `unionOf` of two `objectOf` shapes (or `literalOf('full')` / `literalOf('unchanged')` inside the existing discriminant) for `isLSPDocumentDiagnosticReport`.
- `whereOf(isInteger, (n) => n >= 0)` for `line` / `character` in `isLSPPosition`. `boundsOf` is finite-number, not integer (`index.d.ts:232-253`); do not use it alone here.

**Stay hand-walked:** `isJSONRPCRequest`, `isJSONRPCNotification`, `isJSONRPCResponse` as wholes. They refuse keys `objectOf` would admit (`!('result' in value)`, `!('error' in value)`, `'id' in value` absence, result/error XOR, `id === null` only on errors) (`validators.ts:39-88`). Error-response `id` may be `null`; that is not `optionalOf`.

**Do not adopt:** `recordOf` (exact records; foreign-contracts law). `enumOf` (no runtime enum; `literalOf` matches). `attempt` / `Result` (this package throws `LSPError` consistently; `typescript.md` Errors permits that).

**Already used, keep:** `holds`, `isBoolean`, `isInteger`, `isNumber`, `isRecord`, `isString` (`validators.ts:20`); `parseJSON` (`parsers.ts:10`).

**6. abort/timeout adoption**

**Ruling:** Do not add `@orkestrel/abort` or `@orkestrel/timeout`. Keep native `AbortSignal` composition.

**Reasons:** Core already has `AbortSignal` (`workspace.md` core globals). `#request` arms `AbortSignal.timeout(this.#timeout)` (`LSPClient.ts:380`). `#boundExit` and `#closeTransport` race `AbortSignal.timeout` (`:667-687`). Open vs lifecycle bounds are separate signals (`types.ts:268-294`; probe `open(..., { signal })` at probe dist `index.js:973-978` vs client `timeout: 2e3` at `:942`). `Abort` is a traceable `AbortController` wrapper (`abort` d.ts:45-56). `linkSignal` is `AbortSignal.any` (`abort` d.ts:155). `Timeout` adds `start` / `clear` / `id` (`timeout` d.ts:120-141`). lsp never re-arms, never needs a trace id, and never wraps a parent into a child controller. Superfluous-wrapper law. mcp does not depend on those packages (`node_modules/@orkestrel/mcp/package.json:97-103`). Probe already uses `createTimeout` for *its* coordinator; that is probe’s dependency, not lsp’s.

**7. `LSPServer`**

**Ruling:** Stay in `Next`. Do not design the contract now.

**Reasons:** Minimal-API law: first real consumer. Probe is an LSP *client* of Oxlint (`probe` dist `index.js:929-947`). No fleet consumer implements a language server. mcp’s server half exists because MCP servers are that package’s product (`mcp` `package.json` description; `bindServer` in mcp core d.ts:111). `@orkestrel/tool` is a JSON-Schema tool registry; LSP method handlers are not that contract. Sketching `LSPServer` without a consumer is speculation.

**8. ROADMAP reshape**

**Stay**

- Opening purpose, restated as the released client+stdio+conformance package (`package.json` version `0.0.3`), not as an in-flight campaign.
- **Delivered** history (`ROADMAP.md:24-56`).
- **Delivered to its first consumer** (`:58-74`).
- **Fleet findings carried forward** (`:123-153`).
- **Deliberately deferred** (`:155-158`).
- **Next:** `LSPServer` (after a consumer); TypeScript 7 conformance reading (later session, user-approved).

**Go**

- **Where the work sits** branch table (`:76-92`) — live fleet state, stale once repos are on `main`.
- **The campaign’s end** prune/release checklist (`:94-109`) — this repo is already `0.0.3`; `.orkestrel/campaign` is already absent here.

**Add**

- This campaign’s plan of record: fold `#releaseGeneration`; adopt contract combinators as ruled in 5; keep the byte seam; add no transport, no `abort`/`timeout`/`websocket`/`sse`/`tool`/`pool`; leave `LSPServer` in Next.
- Drop **The client’s internal seams** after the fold unit lands; the `#cancelRequest` justification is the ruling in 2, not a leftover row.

**Conflict:** `ROADMAP.md:19-22` still points at `.orkestrel/campaign/` and `state.md`. That directory does not exist in this checkout. `.orkestrel/lsp/` holds this round’s briefs and must not be pruned until this campaign closes.

**9. Unit decomposition**

Serial order: ROADMAP reshape → fold `#releaseGeneration` → contract combinators.

**ROADMAP reshape**

- Owned: `ROADMAP.md`
- Acceptance: the branch table and campaign-end section are gone; Delivered history, fleet findings, and Deliberately deferred remain; Next names only `LSPServer`, TypeScript 7, and any not-yet-landed unit from this plan; the plan of record matches rulings 2–7; no source change.

**Fold `#releaseGeneration`**

- Owned: `src/core/LSPClient.ts`
- Acceptance: the identifier `#releaseGeneration` is gone; the `#begin` failure path awaits `#closeTransport` directly; `#cancelRequest` remains and still writes `$/cancelRequest` after a ready-generation abort; public types unchanged; existing handshake/generation tests pass.

**Contract combinator adoption**

- Owned: `src/core/validators.ts`, `tests/src/core/validators.test.ts`
- Dependencies: declared `@orkestrel/contract` only (no new package).
- Acceptance: sites named in ruling 5 call `arrayOf` / `literalOf` / `unionOf` / `objectOf` / `optionalOf` / `whereOf` as specified; `isJSONRPCRequest` / `isJSONRPCNotification` / `isJSONRPCResponse` still refuse forbidden keys and the result/error XOR; `isLSPServerCapabilities` still accepts unknown members; `isLSPPosition` still refuses a non-integer and a negative; no `recordOf` / `enumOf` / `attempt` on this path; `export function is*` names unchanged; guide surface tables unchanged.

No unit for transports, `LSPServer`, `abort`/`timeout`, extra `@orkestrel/*` packages, or replacing `formatConformanceValue`. That helper is a non-throwing diagnostic formatter (`tests/setupConformance.ts:205-215`); `roundTripJSON` throws on non-JSON-safe values (`node_modules/@orkestrel/test/dist/src/core/index.d.ts:347-357`). Semantics do not match.

---

**Open questions**

- Probe `file:line` citations (`LintStage.ts`, `Probe.ts`, `probe/src/core/types.ts`) were checked against installed `@orkestrel/probe@0.0.9` dist, not a probe source checkout. Behavior matches; those source line numbers are unverified here. Does not change rulings 3–4 or 7.
- Sibling-repo `main`/release state is Orchestrator-supplied. This checkout can confirm only `@orkestrel/lsp@0.0.3`. Does not change the ROADMAP table’s removal as live state.
