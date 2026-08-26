# Verdict — @orkestrel/lsp core chain (L2 + L2.1 + L3), lane: reviewer (Opus 5), subjective

Immutable blind return of the `reviewer` lane, retained verbatim.

Lane note: this lane holds the subjective charter with correctness covered wherever reading reaches. It carries no shell, so every behavioural ruling below is a source derivation against the tree at `cd414f1`, not an executed run. Where a ruling needs a run, the settling script is named.

## 1. The L2.1 rulings hold as implemented — CONFIRMED

**Attack tried and failed:** enumerated every `throw` inside the decode loop myself rather than reading the report's word, and checked each for the `messages` carry.

Every fault site inside `parseLSPMessages` between `src/core/parsers.ts:90` and `:271` populates `context.messages` with `Object.freeze([...messages])`: the boundary-free header limit (`:90`), the resolved header limit (`:97`), non-ASCII header bytes (`:120`), the invalid field (`:135`), repeated `Content-Length` (`:143`), empty `Content-Length` (`:148`), non-digit `Content-Length` (`:155`), unsafe integer (`:162`), over-limit `Content-Length` (`:167`), repeated `Content-Type` (`:176`), unsupported media type (`:184`), repeated charset (`:197`), unsupported charset (`:207`), missing `Content-Length` (`:218`), the incomplete-state guard (`:232`), invalid UTF-8 (`:254`), invalid JSON (`:262`), and the non-JSON-RPC payload (`:269`). No site drops decoded work.

The accumulation bound has no gap I could open. `:89` refuses when no terminator is found and the retained total passes `LSP_HEADER_LIMIT`; `:96` refuses when a terminator is found beyond it, before `:101` allocates the flattened buffer. I tried to slip past both by splitting the garbage across chunks (each under the limit, the sum over it) — `pending.size` is cumulative across the chain, so the sum is what `:89` reads.

`LSP_CONTENT_LIMIT` refuses at `:167`, inside header parsing, before `bodyStart`/`frameEnd` are computed at `:236` and before any body byte is retained. Unknown-field tolerance is real: the field loop at `:129` acts only on `content-length` and `content-type` and falls through for any other name, while a malformed known field still refuses at `:155`.

Residual carried to claim 7: the `as const` method-literal pin landed with its control recorded as never failing (`l2.1-codec-repair-report.md:22`).

## 2. `LSPDecodeState` is correct, not merely linear — CONFIRMED

**Attacks tried and failed:** hand-traced the adversarial schedules the brief names against `src/core/parsers.ts:36-101` and `:236-278`, hunting for a lost, duplicated, or corrupted frame.

- **Byte-at-a-time through the header.** Each call appends one node and scans at most `overlap + 1` bytes (`:64-73`). The offset arithmetic at `:83` (`previousSize - overlap + index`) was the line I attacked hardest, with `previousSize` at 1, 2, 3, and above, and with the chain holding several one-byte nodes. In every case the absolute index of the leading `CR` came out right, because the overlap walk at `:67-72` fills `scan` from the tail of the chain backwards and `previousSize` is the invariant total. A boundary lying wholly inside `previous` is unreachable: a four-byte pattern puts at most three bytes behind the seam, and an earlier call would have found anything further back.
- **Byte-at-a-time through the body.** `boundary` and `length` ride forward on the resolved node (`:43-49`), so `:57` is skipped and no header is re-derived. The flatten at `:238-245` writes each node at `cursor.size - cursor.bytes.byteLength`, which is exact under the same invariant.
- **Chunk ending exactly at the boundary.** The header resolves, `pending` is replaced by the flattened node at `:220-225`, `pending.size < frameEnd` returns at `:237`, and the next call appends the body. Traced byte for byte on a five-byte body.
- **Chunk ending exactly at `frameEnd`.** `:274` drops the state to `undefined`.
- **One byte past `frameEnd`.** `:276` re-roots a fresh unresolved node whose `boundary` and `length` are gone, so the next frame's header cannot inherit the previous generation's framing. The genuine hazard here is the `joined` binding: had it been hoisted out of the `while` body it would carry the first frame's buffer into the second frame's slice. It is declared per iteration at `:55`, so the attack fails.

Residual: no row executes a `CRLFCRLF` straddling a chunk seam, so `:83` is derived rather than run. Carried to claim 7 with its script.

## 3. The client's protocol ordering is the specification's — BROKEN

`close()` carries no lifecycle guard at all, and two other doors emit pre-handshake traffic.

**3a. `src/core/LSPClient.ts:193-210` — `close(uri)` sends `textDocument/didClose` at any point in the client's life.** `start()` guards destruction (`:131`) and `open()` gates on `capabilities.textDocumentSync` (`:177-186`), so neither can precede the handshake. `close()` gates on nothing: it awaits `#write` immediately. Scriptable interleaving:

```ts
const transport = new LSPFixtureTransport()
const client = new LSPClient({ transport, workspace: 'file:///workspace' })
await client.close('file:///workspace/main.ts')
expect(() => transport.assertHandshake()).toThrow() // the first wire message is didClose
```

Why it matters: the base protocol admits only `exit` before the initialize result, and L4 drives a real server that will treat the frame as a violation. The same hole sends `didClose` after `destroy()` has torn the transport down, and it sends `didClose` for a URI the client never opened, contradicting the ownership sentence in the class TSDoc at `:34-40`. Right looks like: refuse when `#destroyed` or `#destroying` is set and when `#capabilities` is undefined, and refuse a URI absent from `#documents`, with the codes `open` already uses (`closed` and `protocol`).

**3b. `src/core/LSPClient.ts:130-168` — concurrent `start()` calls both reach the handshake.** `#capabilities` is assigned last, at `:168`, and the early return at `:133` reads it. Two calls started before the first resolves both pass `:133`, both call `this.#transport.start()` at `:135`, and both send an `initialize` request at `:144`. `initialize` may be sent only once, and under L4's stdio transport the double `start()` also spawns twice or throws. `destroy()` already solves exactly this problem one screen down, at `:212-218`, by memoizing its in-flight promise; `start()` was not re-asked at its own door. Right looks like: hold a `#starting: Promise<void> | undefined` field, return it while it is set, and clear it when the handshake settles.

**3c. `src/core/LSPClient.ts:455-470` — a deadline on the initialize request itself sends `$/cancelRequest` before the server has answered `initialize`.** Reachable with a slow peer and the default deadline. Lower severity than 3a and 3b, because a conformant server drops a pre-initialize notification, but it falsifies the claim as stated. Right looks like: skip the cancel notification when `#capabilities` is undefined.

## 4. The diagnostics contract matches the reconciliation — BROKEN

The push arm has no deadline, and the pull cache outlives the session that produced it.

**4a. `src/core/LSPClient.ts:270-285` — the push path can never settle.** `#openPush` creates a publication, writes `didOpen`, and returns `publication.promise`. Nothing bounds it. The pull arm settles through `#request`, which arms `AbortSignal.timeout(this.#timeout)` at `:297`; the push arm is not in `#pending` and no deadline reaches it. A server that accepts `didOpen` and publishes nothing — legal, and ordinary for a file with no diagnostics on a server that publishes only on change — leaves `open()` pending until the transport exits or the consumer calls `destroy()`. Reconciliation ruling 8 fixes what an empty publication resolves to but never authorizes an unbounded wait, and claim 4's falsifier names a hang. Why it matters: L4 drives Oxlint over real stdio, and the receipt the exit criterion names is exactly an `open()` awaiting a publication. Right looks like: arm the same `#timeout` deadline on the publication, reject with `timeout`, and delete the URI from `#publications` and `#documents` on that path.

**4b. `src/core/LSPClient.ts:83-88`, `:239`, `:490-497`, `:520-531` — `#diagnostics` survives a server exit and a teardown.** `#receiveExit` clears `#state`, `#capabilities`, and `#documents`; `#teardown` clears the same three. Neither clears `#diagnostics`. The test at `tests/src/core/LSPClient.test.ts:737` establishes that `start()` after an exit is a supported flow, so a document opened before the exit and reopened after it sends `previousResultId` from the dead session (`:245-251`). A server that answers `unchanged` returns the prior session's cached diagnostics through `:262` as current. Right looks like: clear `#diagnostics` wherever `#capabilities` is cleared; a result id is session-scoped state and belongs to the same lifetime as the capabilities that produced it.

The rest of the claim holds. Path selection is derived per open from `#capabilities?.diagnosticProvider` at `:189` with no stored flag; the `unchanged`-without-prior refusal is at `:252-257`; an empty publication resolves empty through `:426`; an unowned URI reaches only `notification` at `:421-424`. I attacked double-settle and could not open it: `#receiveNotification` deletes before resolving (`:425-426`), `close()` deletes before rejecting (`:200-209`), and `#drain` (`:482-486`) rejects into already-settled resolvers, which is inert.

## 5. Failure semantics are total and correctly coded — CONFIRMED

**Attack tried and failed:** walked every path that can leave `#pending` and looked for one that leaves an entry, mis-codes a category, or answers with the wrong id.

`#settle` (`:472-480`) is the single exit, it deletes before settling, it detaches the deadline listener, and it reports whether it acted — which `#timeoutRequest` (`:460`) uses to suppress a cancel notification for a request that already settled. Abort drains with `aborted` (`:504`), transport exit with `closed` (`:492`), the deadline rejects only its own id (`:455-465`), and a server error reply preserves the wire payload under `server` with the numeric code beside it (`:393-399`), matching reconciliation ruling 11. An uncorrelated response emits `protocol` and returns without touching the map (`:380-388`). `#respondUnsupported` (`:429`) echoes `request.id` verbatim with `JSONRPC_METHOD_NOT_FOUND`. The framing fault drains its decoded messages before emitting (`:346-361`).

Two evidenced notes, neither a break. The `id === null` guards at `:390` and `:401` are unreachable: `:378` already resolves `pending` to `undefined` for a null id, so `:379-388` returns first. And a JSON-RPC error response carrying `id: null` — the standard server-side parse-error report — surfaces as a generic `protocol` error rather than as `server` with its wire code, losing the category the response actually carried.

Cross-reference: push publications are outside `#pending`, so nothing in this claim reaches them. Carried by claim 4a.

## 6. `destroy` is bounded and idempotent under hostile peers — CONFIRMED

**Attacks tried and failed:** a shutdown that never answers, a `close()` that never resolves, an exit mid-destroy, and a second `destroy()` racing the first.

`destroy()` (`:212-219`) memoizes the in-flight promise, so a racing call returns the same one and a post-destruction call returns a resolved promise. `#teardown` (`:508-535`) drains first, wraps the shutdown request in `try {} catch {}`, wraps the exit notification the same way, and races `transport.close()` against `AbortSignal.timeout(this.#timeout)` at `:519-525`, so a hanging `close()` cannot stall it. An exit arriving mid-destroy rejects the pending shutdown into the swallowing catch and then proceeds. Total worst case is two deadline periods, which is bounded.

I attacked emit-after-destroy hardest: `#teardown` destroys the emitter at `:534` while the `closing.catch` handler at `:520` and the handlers at `:451` and `:469` can still fire afterwards. The installed declaration settles it — `node_modules/@orkestrel/emitter/dist/src/core/index.d.ts:47-48` states that after `destroy()`, `emit` does nothing. So no throw escapes and no unhandled rejection follows. The consequence is silent rather than fatal, and it is recorded as a finding.

## 7. The suite proves what its rows name — BROKEN

Two rows cannot fail for what they name, one pin never ran red, and the schedules L4 will exercise are unpinned.

**7a. `tests/src/core/LSPClient.test.ts:413-459` — the correlation row cannot detect mis-correlation.** Both scripted responses carry `{ kind: 'full', items: [] }` (`:425`, `:430`), so both `open()` calls resolve to `[]` whichever request each result is matched to. Mutate `#settle` to pop the oldest pending entry instead of the addressed one and the row stays green; the only surviving assertion, `requests[0]?.id).not.toBe(requests[1]?.id)`, is a property of `#nextId`, not of correlation. This is the same shape as the L2 round's circular byte oracle. Right looks like: give each response a distinguishable payload — a `resultId` or one diagnostic carrying the URI — and assert each `open()` resolves to its own.

**7b. `tests/src/core/LSPClient.test.ts:551-585` — the abort row proves nothing about "begins destruction".** After the abort, the row awaits both rejections, then calls `await client.destroy()` explicitly, then asserts `transport.closes === 1`. Delete the `this.destroy()` call from `#abortClient` (`:505`) and the row still passes: `#drain` alone rejects both opens, and the explicit `destroy()` produces the single close. Right looks like: drop the explicit `destroy()` from the row and await the client's own teardown — for example, assert `transport.closes` reaches 1 without the caller ever calling `destroy()`.

**7c. `tests/src/core/parsers.test.ts:14` and `:282` — the method-literal pin has never failed.** `l2.1-codec-repair-report.md:22` records that the pre-fix control did not reproduce under TypeScript 6.0.3. `AGENTS.md` § TTTDD is explicit that a test which never ran red does not bind to the defect it claims, and `.claude/rules/quality.md` § Instruments says an instrument is not evidence until it has failed. The artifact left behind is a module-scope binding plus a dangling `void INITIALIZE_METHOD` statement outside every `describe`. Right looks like: delete both lines, or replace them with a control the compiler actually rejects and record its diagnostic.

**7d. Missing rows, each cheap and each covering a path L4 reaches.**

- The straddling boundary: deliver a frame whose `\r\n\r\n` is split across the seam, at each of the four split offsets, and assert the message decodes. This is the only executor of `parsers.ts:83`.
- The header-limit boundary value: a boundary-free chunk of exactly `LSP_HEADER_LIMIT` bytes returns pending state rather than throwing. `tests/src/core/parsers.test.ts:253` proves refusal above the limit and nothing proves acceptance at it. The same row shape settles `LSP_CONTENT_LIMIT` cheaply, because a header declaring exactly the limit with no body returns pending state without allocating anything.
- Push `open()` against a peer that never publishes (claim 4a's carrier).
- `close(uri)` racing a pending publication — the interleaving claim 4 names and no row scripts.
- Concurrent `start()` (claim 3b's carrier), asserting `transport.starts` and the handshake oracle.

**7e. Coverage sufficiency for L4.** Behaviors the stdio transport will exercise that no row pins, each ruled:

- `transport.send` returning `false` mid-session — **required**. `#request` (`:302-322`) and `#write` (`:326-340`) both convert it to `closed`, and a real pipe returning `false` on backpressure or after `end()` is ordinary, not hostile. No fixture ever returns `false`.
- `start()` retried after a failed handshake — **required**. `#capabilities` stays undefined, so the retry calls `transport.start()` again; with a spawning transport that is a second process. Pin the intended behavior before L4 chooses one.
- `transport.close()` rejecting — **required**, and it pairs with the finding below.
- A server request arriving before `initialized` — safe; the client answers with a response, which the base protocol permits in that window.
- A chunk delivered after `destroy()` — safe; `#teardown` removes the listeners at `:526-528`.

## 8. The chain stays inside the law on files it touched — BROKEN

**`src/core/LSPClient.ts:144-155` and `:245-251` — the client sends wire payloads that the declared payload types do not constrain.** `LSPInitializeParams` (`src/core/types.ts:182`), `LSPClientCapabilities` (`:172`), `LSPDocumentDiagnosticParams` (`:128`), and `LSPHeader` (`:52`) are exported through the barrel and referenced by no implementation, no validator, and no test — a grep over `src/**/*.ts` and `tests/**/*.ts` returns only their own declarations and the members that quote them. The client builds its initialize params as a bare literal checked against `#request`'s `Readonly<Record<string, unknown>>` (`:287`), so a dropped `rootUri` or a renamed `capabilities` member compiles.

Why it matters: `AGENTS.md` § Design laws puts types first and makes `*/types.ts` authoritative for implementation to conform to, and reconciliation ruling 10 keeps these declarations on the stated ground that "the client sends them". That sentence described the design two revisions ago; the shipped client sends them without them. L5 then certifies these types against the vendored model while nothing ties them to the bytes the client emits, which is precisely a conformance proof over an unused declaration.

Right looks like: annotate each send site against its declared type — `const params = { … } satisfies LSPInitializeParams` keeps the literal assignable to `#request`'s parameter while binding the contract, and the same form fits the diagnostic request. Then rule `LSPHeader` explicitly: either give it the consumer ruling 13 assumed, or strike it and correct the ruling in the durable record.

The rest of the claim holds. The barrel (`src/core/index.ts`) is star-exports only; placement is intact, with the client class alone in its file, the factory as the sole `create*` in `factories.ts`, and no module-scope declaration in either; the banned-construct sweep over the L2.1 and L3 hunks returns only the `as const` at `constants.ts:12`, which `.claude/rules/typescript.md` § Types exempts; `#` fields carry no accessibility modifier and no parameter property appears; every new export carries TSDoc with `@example` on the client, the factory, the encoder, and the parser; imports are `@orkestrel/emitter`, `@orkestrel/contract`, and relative `.js` specifiers, so host independence is unchanged.

## Findings outside the claims

**A. `src/core/parsers.ts:276` pins a whole frame buffer behind a one-byte remainder.** The remainder node is built with `joined.subarray(frameEnd)`, and a `subarray` shares its source's `ArrayBuffer`. After a frame at `LSP_CONTENT_LIMIT`, a peer that sends one trailing byte and then goes quiet leaves `LSPClient.#state` holding a node whose `size` reads `1` while 64 MiB stays reachable. The header bound at `:89` reads `pending.size`, so it never sees the retained buffer, and `LSP_HEADER_LIMIT`'s TSDoc claim about refusing accumulation "before it can grow without bound" reads as covering more than it does. Fix: copy the remainder — `joined.slice(frameEnd)` — which costs one allocation bounded by the leftover length and releases the frame buffer at the same moment the frame is delivered.

**B. `src/core/types.ts:246-249` publishes `LSPTransportInterface` with no stated obligation, and a foreign transport can leave `#teardown` unfinished.** `close(): Promise<void>` is declared; a transport whose `close()` throws synchronously rather than returning a rejected promise takes `LSPClient.ts:519` out through the destruction promise, so the listeners at `:526-528` are never removed, `#destroyed` stays `false`, and the emitter is never destroyed. `.claude/rules/quality.md` § Rounds and verdicts routes a defect reachable only through a foreign implementation to a documented obligation on the interface that owns it. There is no such documentation: the interface carries one line of TSDoc and names no obligation about rejection, synchronous throwing, or post-`close` `send` behavior. L4 writes the first implementation of this seam, so the obligation belongs on the interface before that unit opens.

**C. A transport `close()` that rejects after the destroy deadline reports to nobody.** `LSPClient.ts:520` routes the rejection to `this.#emitter.emit('error', …)`, and by then `:534` has destroyed the emitter, whose declared contract makes `emit` a no-op after `destroy()`. The failure is swallowed rather than surfaced. Fix: emit before destroying the emitter, or state on `destroy()` that a close failure arriving after the deadline is dropped, and pin the stated behavior.

## Referrals

- **To the Orchestrator:** claims 2, 4a, 6, and finding A rest on derivation, not execution. The settling instruments are named in 7d and 4a; each is a Vitest row in the existing `src:core` project and runs in under a second.
- **Ruling needed before L4 opens:** whether `start()` after a failed handshake re-invokes `transport.start()`, and whether the stdio transport or the client owns that decision. The client's current behavior is a silent retry, and no record rules on it.

VERDICT: FAIL — 4 broken, 0 unresolved, 0 not-evidenced, 3 findings outside the claims
