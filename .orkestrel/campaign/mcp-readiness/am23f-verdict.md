**Claim 4 is BROKEN.** The other claims held under the attacks below. Writer suite tallies are testimony; `tmp/audit/runs.txt` is the executed record (`test:src:server` 375 passed, `test:src:browser` 65 passed, `test:guides` 149 passed).

---

**1. CONFIRMED** — Node guard complete, does not over-reject.

Attack: bound-but-not-open send still resolving; OPEN send newly rejected; unbound arm changed.

`send` rejects when `#socket` is missing **or** `readyState !== WEBSOCKET_READY_OPEN`, then writes (`src/server/transports/WebSocketClientTransport.ts:135-139`). The unbound arm is still the `socket === undefined` half of that same test: before `start()`, after `close()` (`#socket = undefined` at `:151`), and after a subscribed peer close (`#onClose` at `:263-268`).

The added arm is the handshake-`head` close: `createNodeWebSocket` runs before `#bind` (`:198-200`), so the wrapper can already be past OPEN while `#closed` is still false. `startClosingPeer` plants that state (`tests/src/server/transports/WebSocketClientTransport.test.ts:385-391`, `:476-491`) and asserts `closed === 0` before the reject, so a late `close` event cannot fake the pin.

Open-socket control still resolves: `rejects a send issued after close()` sends `ping` on the live socket first (`:463`). `tmp/audit/runs.txt` records the server project green after this landed, so that control was not rejected. Node never assigns `#socket` in CONNECTING (only post-`101`), so the `!== OPEN` check does not over-reject a legitimate bound send the old unbound arm would have delivered.

---

**2. CONFIRMED** — A3 no-queue half would redden the named push-before-throw.

Attack: a `send` that queues then throws, which this row would miss.

Browser `send` throws on `#closed` / `CLOSING` / `CLOSED` **before** stringify or `#queue.push` (`src/browser/transports/WebSocketClientTransport.ts:131-142`). `#flush` splices the whole queue onto the next open socket (`:188-197`). `close()` does not clear `#queue` (`:145-156`).

The named failing input is push-then-throw. After `close()`, `#socket` is undefined and `#closed` is true, so that input would enqueue id 99, throw, then on reconnect `#onOpen` → `#flush` would write 99 **before** the id-98 control. `expect(received.map((message) => message.id)).toEqual([98])` (`tests/src/browser/factories.test.ts:181`) fails on `[99, 98]` (or any list containing 99). An absent 99 cannot be blamed on a dead channel: id 98 must come back on that same socket (`:177-178`). The missing red on the guarded line does not matter; this assertion is the instrument for that input.

---

**3. CONFIRMED** — M3F WebSocket guide sentences match what ships.

Attack: dead-peer bound, face divergence, clauses 16 and 17, pre-open sentence claiming code that is not there.

Server closed-channel paragraph (`guides/mcp.md:2690-2702`): `WebSocketServerTransport.send` rejects only when `#closed` or `readyState !== WEBSOCKET_READY_OPEN` (`src/server/transports/WebSocketServerTransport.ts:97-100`). A peer that leaves the wrapper `OPEN` is written and the promise resolves. `bindServer` aborts live work on `closed` (`src/core/helpers.ts:1708-1711`); `bridgeMessageTransport` forwards the transport `close` event (`src/server/helpers.ts:439`). Clause 16 (`guides/mcp.md:4985-5000`) is the same bound.

Browser paragraph (`guides/mcp.md:2989-2998`): Node rejects the closed condition with the same error string (`WebSocketClientTransport.ts:136-137`) and also rejects pre-open because `#socket` is still undefined (`tests/.../WebSocketClientTransport.test.ts:497-505`). Clause 17 (`guides/mcp.md:5027-5036`) states both arms and the handshake-`head` case the transport flag cannot see. No touched sentence claimed ping/pong liveness or a Node pre-open queue.

---

**4. BROKEN** — Fresh-listing clear is sequential-correct and concurrent-wrong on both faces.

Attack that failed (sequential): malformed / error listing, continuation, auditor’s cursorless→empty→`tools/call`.

`#select` returns before `clear` unless the sent method is modern `tools/list`, the reply is a result (not `error`), and `tools` is an array (`src/server/transports/HTTPClientTransport.ts:272-277`; browser twin `:269-274`). `JSONRPCErrorResponse.error` is required (`src/core/types.ts:112-116`), so a refused listing does not clear. `sent.params?.['cursor'] === undefined` is the fresh/continuation split: a continuation with `cursor: 'page-2'` does not clear (Node pin `tests/src/server/transports/HTTPClientTransport.test.ts:680-726`). A cursorless well-formed page, including `tools: []`, does clear (auditor interleaving `:641-678` and browser `:355-394`).

Attack that holds: overlapping `send`s. Both faces keep concurrent fetches in `#pending` and `await` `#exchange` with no generation token (`HTTPClientTransport.ts:129-137` Node, `:130-138` browser). `#select` mutates one shared `#parameters`. Interleaving:

1. In-flight **continuation** `tools/list` with a cursor, page `{ paged_two }`.
2. In-flight **fresh** cursorless `tools/list`, page `{ keep }` (or `[]`).
3. Fresh completes first: `clear()`, cache that page, emit it.
4. Continuation completes last: no `clear()`, `#parameters.set('paged_two', …)`.

The table is then the union of two listings, which is neither page. A later `tools/call` can project a header the last delivered listing did not advertise, or keep a header a fresh listing had already superseded. The sequential auditor interleaving no longer projects; this concurrent one still can. `#select` has no “latest send wins” check that would stop it.

---

**5. CONFIRMED** — Bounded `nextCursor` walk closes the paged-replacement escape; built-in unpaged path is unchanged.

Attack: cycle / repeated cursor / non-string cursor / later-page stream still smuggling an annotated tool inside the bound; built-in behaviour moved; id `0` leaking past `request`.

Walk: `for (page = 0; page < MCP_LOOKUP_PAGES; page += 1)` (`src/server/handlers.ts:150-178`), `MCP_LOOKUP_PAGES = 8` (`src/core/constants.ts:124`). `extractToolSchema` matches `name` on that page’s `result.tools` (`src/core/helpers.ts:1505-1517`). String `nextCursor` continues; non-string breaks (`handlers.ts:175-177`) — that is MCP’s cursor contract, not a followable numeric cursor. A cycle or repeated cursor is stopped by the bound; a cap hit leaves `parameters = []`. `inferParameterRefusal` over an empty list returns `undefined` (`src/server/inferers.ts:207-231`), so headers are forwarded — the residual the cap-hit test pins (`tests/src/server/handlers.test.ts:517-528`). A stream on any page `stop()`s and breaks (`handlers.ts:163-166`). None of those shapes validates an annotated tool the walk never saw; the original escape (page-two `route` with a one-page lookup) is the depth-1 replacement test (`:484-501`).

Built-in `#list` builds the full descriptor list and writes no `nextCursor` (`src/core/MCPServer.ts:442-449`). First dispatch finds or misses, then `next` is not a string, loop ends. Same as a single lookup.

Id `0` is `mcp.dispatch(...)` in-process (`handlers.ts:151-162`). That runs `#dispatch`, which emits `request` then `#modern` (`MCPServer.ts:227-254`) — the listing handler is supposed to run. It does not enter `bindServer`’s `live` map (`src/core/helpers.ts:1667-1681`); that map is transport-inbound. `MCPLegacyClientTransport`’s handshake id `0` (`src/core/MCPLegacyClientTransport.ts:182,325`) is a different object.

---

**6. CONFIRMED** — Observation documentation matches the dispatcher.

Attack: a documented claim `dispatch` does not honour; walk multiplicity omitted.

`MCPServerEventMap.request` TSDoc names the synthetic `tools/list`, reserved id `0`, one event per page up to `MCP_LOOKUP_PAGES`, and convention-not-enforcement (`src/core/types.ts:1926-1933`). `#dispatch` emits `(method, id, 'modern')` for every dispatch, including these (`MCPServer.ts:227`); there is no id-`0` filter, so a peer `tools/list` under `0` is not told apart. Guide HTTP block (`guides/mcp.md:2531-2546`) and the POST-handler API clause (`:4803-4805`) state the same walk, bound, per-page `request`, and convention. Multiplicity is not omitted: “one fires per page” / “each page dispatched”. The “subtracts a `('tools/list', 0, 'modern')`” wording names the tuple to subtract, not a promise that only one such event exists.

---

**7. CONFIRMED** — M2F cache and consumer-obligation guide rows match the transports and handler.

Attack: a touched `guides/mcp.md` sentence the code contradicts.

Cost sentence (`:2538-2540`) is per page walked, per `tools/call`, matching the loop. Residual / built-in / held-open sentences match claim 5. Replace-versus-accumulate is in the client-projection entry (`:4382-4387`), Node HTTP API clause (`:4966-4967`), and browser HTTP clause (`:5238-5240`), and is `#select` on both faces. Consumer obligation (`:4362-4365`): `MCPClient.tools()` sends `tools/list` with `params` that are `_meta` only — no `cursor` (`src/core/MCPClient.ts:390-391`, `:553-559`) — so a well-formed result hits the cursorless `clear()` path. Sequential re-list then retry therefore drops an omitted tool and recaches one still advertised. (Concurrent `send` is claim 4; these sentences describe `tools()` and the sent-cursor rule, not overlapping fetches.)

---

**8. CONFIRMED** — Scope honesty and banned constructs.

Attack: unlisted file in a diff; `any` / `!` / `as` / ts-ignore / eslint-disable in implementation; `unknown` locals actually assertions.

M3F diff (`tmp/audit/m3f.diff`) touches `guides/mcp.md`, `src/server/transports/WebSocketClientTransport.ts`, `tests/src/server/transports/WebSocketClientTransport.test.ts`, `tests/src/browser/factories.test.ts` — the M3F report table.

M2F diff (`tmp/audit/m2f.diff`) touches `guides/mcp.md`, both `HTTPClientTransport.ts` faces, `src/server/handlers.ts`, `src/core/constants.ts`, `src/core/types.ts`, both HTTP client tests, `tests/src/server/handlers.test.ts` — the M2F report table.

No unlisted path. Implementation hunks add no `any`, non-null `!`, `as` assertion, `@ts-ignore` / `@ts-expect-error` / `@ts-nocheck`, or `eslint-disable`. `const listing: unknown` and `const next: unknown` (`handlers.ts:175-176`) are annotations; the comment at `:172-174` is why they exist. `AbortSignal.any` is a method. Import aliases such as `request as httpRequest` are not type assertions.

---

**Outside the claims.** Browser `close()` still leaves `#queue` standing, so a **pre-open** queued send is flushed on the next `start()` (`WebSocketClientTransport.ts:145-156`, `:187-197`). M3F already recorded that as out of unit scope. It is not the A3 post-close path (that path throws before push).

VERDICT: FAIL — 1 broken, 0 unresolved, 0 not-evidenced
