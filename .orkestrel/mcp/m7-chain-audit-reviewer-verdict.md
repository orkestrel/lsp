# Verdict — the client era boundary (M7 + M7.1 + M7.2.1)

Lane held: **subjective** — design fit, API shape, naming, vocabulary, architecture fit, simplification, guide voice. Every ruling below is from that lane. Correctness items I could not settle in it are routed as referrals, not verdicts.

## 1. The bare client is modern-only as ruled — **BROKEN**

Three of the four legs hold and I could not break them. `src/core/MCPClient.ts` contains no `initialize`, no legacy pin, and no fallback: the handshake method is gone and `#era` with it (attack tried: searched the whole file for a second classification site — the only remaining era decision is the single `catch` at `src/core/MCPClient.ts:689-697`). `MCPClientOptions.version` is `MCPModernVersion` (`src/core/types.ts:2272-2275`), `MCPClientInterface.version` is `MCPModernVersion | undefined`, and `#pin` narrowed with them (`src/core/MCPClient.ts:125`); no production type widened.

The leg that breaks is **"a legacy peer met directly draws a refusal that names `createMCPLegacyClientTransport`."** It is a universal, and it is false.

- Falsifying input: a legacy peer that answers `server/discover` with JSON-RPC `-32602`. `src/core/MCPClient.ts:691` rethrows unchanged unless the code is exactly `JSONRPC_METHOD_NOT_FOUND`, so `connect` rejects with a bare `MCPError` code `-32602` carrying the peer's own message and naming no adapter.
- That input is not hypothetical, and the campaign's own record supplies it: the guide text this change deleted (combined diff lines 336-345) stated, with a dated primary source, that the Python SDK v1.29.0 server answers an unknown method `-32602` while the TypeScript SDK server answers `-32601`. So the reference legacy-peer population is split across the classifier's boundary, and half of it gets no guidance.
- Smallest correct fix: **do not widen the classifier** — the M7.2.1 narrowing is right, because `-32602` is not proof of a missing method. Restate the claim as "a legacy peer that answers `-32601`", and close the consumer-facing half in the guide (see claim 6).

## 2. The adapter translates faithfully in both directions — **CONFIRMED**

Attacks tried that failed. Downward: I looked for a reserved key that survives to the peer — `modernInvocationToLegacy` (`src/core/helpers.ts:1154-1172`) removes `MCP_META_VERSION`, `MCP_META_CAPABILITIES`, and `MCP_META_CLIENT`, drops `_meta` entirely when nothing else remains, and preserves `progressToken`; the fixture detector at `tests/src/core/MCPLegacyClientTransport.test.ts:2133-2141` watches all three keys and carries its own negative control at `:466-479` proving it can fire. Upward: `legacyResultToModern` (`src/core/helpers.ts:1112-1120`) restores `resultType`, the handshake-learned identity, and — for `tools/list` alone — the cache fields, and the restored `'complete'` satisfies `matchesResultType` for every method (`src/core/helpers.ts:454-458`). Handshake: the peer's `serverInfo` and `capabilities` are validated before either is retained (`src/core/MCPLegacyClientTransport.ts:197-203`), so no unvalidated foreign record reaches a restored result. Passthrough: notifications and uncorrelated responses go out and come back untranslated (`:110-121`, `:270-278`). I found no message either direction that survives translation malformed for its era.

## 3. The shared era projections are one implementation with two callers — **CONFIRMED**

Attack tried: I compared the extracted helper bodies against the code they replaced, looking for a behavioural drift hidden by the move. `legacyInvocationToModern` (`src/core/helpers.ts:1128-1142`) and `modernResultToLegacy` (`src/core/helpers.ts:1072-1098`) are line-for-line the blocks removed from `MCPLegacy.#forward`, and the caller maps the helper's `undefined` onto the same `#unsupported(id, answer.result.resultType ?? 'unstamped')` the old guard produced (`src/core/MCPLegacy.ts:185-188`). `MCPLegacy`'s observable behaviour is unchanged. The adapter imports both of its projections from `helpers.ts` and declares none of its own (`src/core/MCPLegacyClientTransport.ts:28`), so no translation logic is duplicated between the decorator and the adapter.

Read literally, "two callers" is false of each helper — each of the four has exactly one caller in `src`. I ruled on the plainly intended reading, which the claim's own second clause fixes: the projection *set* has two callers.

A separate duplication does exist, against `buildModernResult` rather than between the two decorators. It is outside this claim's wording and is reported as finding F1.

## 4. Every migrated row proves what it names on its new subject — **BROKEN**

Most of the migration is sound and I want that on the record: the five moved handshake-rejection rows exercise the real adapter handshake and assert the wire, not the types (`tests/src/core/MCPLegacyClientTransport.test.ts:2214-2293`); the two superseded-attempt reworks prove the client now serializes on the adapter's `start` rather than racing it, which is the honest successor to the zombie race the old rows contained (`:2411-2451`); the granted-file rows each kept their original subject under the wrap, and the M7.1 report's per-row evidence column matches what the diff actually did to each.

Two rows break the claim.

**(a) The migrated control lost its control force.** `tests/src/core/MCPLegacyClientTransport.test.ts:456-464`:

```ts
it('CONTROL — accepts the unstamped legacy handshake result through the adapter', async () => {
	const peer = createLegacyPeer()
	const client = createMCPClient({ transport: createMCPLegacyClientTransport(peer) })
	await client.connect()
	expect(client.connected).toBe(true)
	expect(client.version).toBe('2026-07-28')
})
```

The rule it controlled is the discovery `resultType` refusal in `describe('MCPClient — discovery requires resultType')` (`tests/src/core/MCPClient.test.ts:2395`), and its original comment stated its membership rule: drawn from outside that rule's population, because the legacy revision has no discriminator. Under the adapter that population is unreachable — `server/discover` never leaves the adapter (`src/core/MCPLegacyClientTransport.ts:115-118`) and the synthesized answer always carries `resultType: 'complete'` (`:248`). No regression in the discovery rule can turn this row red, so it cannot produce its failing verdict. It is now byte-equivalent to the happy path already asserted at `:2295-2314` and `:2496-2511`, wearing a CONTROL label; the move also dropped the comment that stated its membership rule. What is asserted, `isMCPLegacyResult` at `src/core/MCPLegacyClientTransport.ts:169`, has no negative row at all.
Right looks like: keep a control for the discovery rule in the suite that owns the rule, drawn from a shape the rule can still meet; and give the adapter's own `isMCPLegacyResult` handshake gate a row that refuses a *stamped* handshake result, which is the population that gate excludes.

**(b) The refusal replacement is misnamed and misplaced.** `tests/src/core/MCPClient.test.ts:1259-1275`, `refuses a legacy result on the bare transport and names the adapter`, sits in `describe('MCPClient — result-type safety')` and proves nothing about result types. No legacy result reaches the transport in the run, and the row's own last line proves it: `expect(peer.sent).toEqual(['server/discover'])` at `:1274`. The fixture's `initializeResponse` branch at `:1266` is dead. What the row actually proves — the `-32601` refusal names the adapter — is already proved, with a code assertion this row omits, at `names the legacy adapter only for discovery method-not-found`.
Right looks like: delete the row and let the adapter-naming row carry the boundary, or rename it for what it asserts and move it beside that row, dropping the unreachable fixture branch.

## 5. The recorded proofs bind — **UNRESOLVED**

The decisive leg holds under attack: I walked every row that pins an executable defect and each carries a recorded red. The M7.2.1 classification rows record the exact command, exit `1`, and the received-versus-expected shape for each (`.orkestrel/campaign/m7.2.1-era-classification-report.md:41-76`), and the bearer probe carries a control that reported failure before the assertion was corrected (`:88-98`). The `npm run check` exit `2` at `06d7f4a` is corroborated independently: M7.1's 20-diagnostic table (`m7.1-client-era-continuation-report.md:13-24`) names exactly the five granted files the combined diff then edits. The migrated adapter rows need no red — they pin behaviour the unit built, and M7 recorded that build red-to-green (`m7-client-era-report.md:5`).

What I cannot decide: M7's refusal reading, `-t "names the legacy adapter"` red `Tests 6 failed | 129 skipped (135)` → green `6 passed` (`m7-client-era-report.md:3`). The final tree contains only two rows whose names that filter matches, and neither existed under those names at `06d7f4a`. The intermediate tree is not in the supplied evidence, so the count is uncheckable from what I hold.
Settles it: `git -C /home/user/mcp show 06d7f4a:tests/src/core/MCPClient.test.ts` and count the `it(` titles the filter `names the legacy adapter` matches — the claim needs 6.

## 6. The guide tells the truth — **BROKEN**

Every enumerated property holds when read against the sections it names, and I tried to break each: the client section states the modern-only boundary (`guides/mcp.md:1622-1624`); the adapter has its own section beside `MCPLegacy`, in the decorator pattern's voice and at the same heading level (`:1653-1704`); the negotiation sentence at `:1701-1703` is exact and matches `src/core/MCPClient.ts:689-697` code-for-code; a case-insensitive sweep of `fall(s|ing)? back|fallback` and of `era cache|pinned legacy|legacy pin|client pins|negotiates the era|legacy fallback` across the whole file returns no surviving client-side fallback prose; the fence at `:1669-1681` is honest — I traced the round trip and it does return `{}`, and it asserts no inverse it does not have.

The guide breaks anyway, because it contradicts itself. `guides/mcp.md:4321-4322`:

> A legacy peer that refuses the method produces the adapter-naming error immediately.

That is a false universal, and it is the exact failure mode the falsification law names. A legacy peer refusing with `-32602` or `-32600` produces no adapter-naming error (`src/core/MCPClient.ts:691`); only `-32601` does. The sentence at `:1701-1703` says this correctly one thousand lines earlier, so the guide asserts both readings and a consumer meets whichever they read first. The same edit deleted the sourced statement that made the distinction actionable — that the TypeScript SDK server answers `-32601` and the Python SDK server `-32602`, each read from released 1.x server source on 2026-08-20 (combined diff lines 336-345) — and nothing in the file replaced it: `python|32602` finds no surviving reference to reference-server behaviour.

Right looks like: at `:4321`, replace "A legacy peer that refuses the method" with "A peer that answers `server/discover` with `-32601`". At `:1701-1704`, add the honest limit beside the refusal sentence — a legacy peer that refuses the method with any other code surfaces that code, and restore the sourced reference-server statement, because `.claude/rules/quality.md` § Rounds and verdicts makes documenting the obligation the prescribed remedy for a defect reachable only through a foreign implementation. Do not widen the classifier.

## 7. Every unit stays inside the law on the files it touched — **BROKEN**

Scope honesty holds and I checked it row by row: the M7 deviation stop, the M7.1 continuation over exactly the granted files, the M7.2 stop with no edits, and the M7.2.1 classification each match their retained report's `git status --porcelain`, and the combined diff touches no file outside the union of those lists. The commit shape matches. Four law violations landed on files the units owned.

**(a) An empty conditional with a live condition.** `src/core/MCPClient.ts:546-552`:

```ts
if (
	pending.method === 'server/discover' &&
	(owned.error === undefined ||
		(owned.error.code !== JSONRPC_METHOD_NOT_FOUND &&
			owned.error.code !== JSONRPC_INVALID_REQUEST))
) {
}
```

This is the residue of the removed `this.#era = 'modern'`. It reads to the next agent as an intentional discovery predicate, it is the sole remaining consumer of `JSONRPC_INVALID_REQUEST` at `src/core/MCPClient.ts:37`, and it survived both `oxlint --deny-warnings` and `npm run check` (`m7.2.1-era-classification-report.md:198-220`) — so no gate can find it. `AGENTS.md` forbids leaving an unimplemented symbol standing and forbids empty stubs. Right looks like: delete lines 546-552 and the `JSONRPC_INVALID_REQUEST` import.

**(b) The published factory still documents the removed handshake.** `src/core/factories.ts:76` says `createMCPClient` "runs the `initialize` handshake", and `:81-82` says "`connect()` handshakes, validates and exposes the negotiated protocol". The class TSDoc in `MCPClient.ts:60-67` was rewritten; the factory's was not, and the factory is what a consumer's IDE surfaces. The unit owned this file — it added `createMCPLegacyClientTransport` to it at `:127`. Right looks like: mirror the corrected class TSDoc — `connect()` negotiates the modern revision through `server/discover`, and a legacy peer requires `createMCPLegacyClientTransport`.

**(c) A stale suite name.** `tests/src/core/MCPClient.test.ts:649` remains `describe('MCPClient — modern discovery and fallback')` while every row inside it now proves the absence of fallback. Its sibling at `:589` was renamed correctly. Right looks like: `MCPClient — modern discovery`.

**(d) Four newly exported, guide-documented helpers with no test.** `modernResultToLegacy`, `legacyResultToModern`, `legacyInvocationToModern`, and `modernInvocationToLegacy` are exported through `src/core/index.ts:7`, documented in the guide's Helpers table, and offered publicly at `guides/mcp.md:1667-1681`. Searching the entire `tests/` tree for `modernResultToLegacy|legacyResultToModern|legacyInvocationToModern|modernInvocationToLegacy` returns no match — the pattern covers direct and namespaced call sites alike, so the coverage claim is the whole tree. `AGENTS.md` § Design laws requires an extracted reusable helper to be exported **and tested**, and `.claude/rules/architecture.md` names "untested extracted functions" in the cleanup sweep. Their boundary behaviour is untested at the edges the guide advertises: `modernInvocationToLegacy` on a params-less invocation, `modernResultToLegacy` on an unstamped input, `legacyResultToModern` for a method other than `tools/list`. Right looks like: rows in `tests/src/core/helpers.test.ts` for each, including the `_meta`-emptied and non-`tools/list` boundaries.

## 8. The era classification is exact — **CONFIRMED within this lane**

Attacks tried that failed. The rewrite site is single: sweeping `src/core` for adapter-guidance text returns only `src/core/MCPClient.ts:693` plus the factory and its example, and that catch fires only on `isMCPError(error) && error.code === JSONRPC_METHOD_NOT_FOUND` (`:691`), scoped to the discovery block, so a public `discover()` call is untouched. The four contrasting rows pin category, code, message, and cause distinctly, and two of them use instruments a weaker assertion would have let slip: `rejects.toBe(failure)` with a `failure.cause` identity check for the transport rejection, and `expect(caught.context).toBeUndefined()` for the `-32000` server-state answer (`tests/src/core/MCPClient.test.ts:1532-1613`). The `MCP_UNSUPPORTED_VERSION` retry block is untouched by the diff. On the Orchestrator-written pin, my lane reaches the naming and the subject: the pinned string is what `src/core/MCPClient.ts:533` composes — the client's own prefix plus the peer's message — and it does not weaken the row's isolation subject, which lives entirely in the untouched `/idless` and `/correlated` legs at `tests/src/core/MCPClient.test.ts:1388-1429`.

Reserved for the objective lane, per the dispatch: whether that exact string is what the `/connect` fixture's id-less `-32000` yields on the host. I did not rule on it.

Cross-reference: the dead classification predicate at `:546-552` sits inside this claim's file but is charged once, under claim 7.

## 9. The transport seam ruling — **UNRESOLVED**

The brief assigns this ruling to the objective lane and it turns on what the transport contract owes, which my lane does not decide. My lane's contribution, for that ruling:

The row's name and comment say exactly what the pin does. `rejects (no connect) when the bearer is missing against a guarded server` (`tests/src/server/transports/HTTPClientTransport.test.ts:176`) claims only rejection and `connected === false`; the comment at `:183-184` was correctly updated from "the client's `initialize` never resolves" to "the client's discovery request rejects on its deadline", and the pinned message is the deadline's own, claiming nothing about auth. That is honest.

The guide is not. Nothing in `guides/mcp.md` mentions `401`, `Authorization`, or a bearer on the HTTP client transport — a search for `401|bearer|Authorization` returns only task-handle and task-authorization prose. `.claude/rules/documentation.md` requires an integration surface's guide to document "the authentication and approval model that client needs, and the honest limit wherever a client cannot reach part of the surface". The closest text, `guides/mcp.md:4322-4323`, covers the observed shape only as "a peer that accepts the probe and answers nothing", which does not name the guarded-server case a consumer will actually hit.
Settles the rest: the analyst's reading of whether `MCPClientTransportInterface` or `HTTPClientTransportOptions` owes the consumer an auth-shaped failure, against those members' TSDoc.

# Findings outside the claims

## F1 — The adapter hand-rolls the stamping `buildModernResult` owns

`src/core/MCPLegacyClientTransport.ts:242-253` builds a modern result literal — `resultType`, `ttlMs`, `cacheScope`, and `_meta[MCP_META_SERVER]` — that `buildModernResult` already produces, and produces identically: `buildModernResult({ supportedVersions: [MCP_MODERN_VERSION], capabilities }, identity, 0)` returns the same object (`src/core/helpers.ts:740-755`). Every other producer of a modern result in this package goes through that one engine, `buildDiscoverResult` included (`:1003-1006`). Why it matters: the package's single stamping rule now has a second, silent implementation, and the next change to what a modern result carries will move one and not the other. Right looks like: call `buildModernResult` at `:242-253` and delete the literal; `MCP_META_SERVER` and `MCP_MODERN_VERSION` stay imported, the rest of the constant list narrows.

## F2 — The adapter reserves wire id `0` and tells nobody

`src/core/MCPLegacyClientTransport.ts:136` sends the handshake as `id: 0`, and `:266` claims *any* id-`0` response as that handshake's answer while the window is open. Its correctness rests on `MCPClient` never minting `0` — true only because `#nextId = 0` is pre-incremented (`src/core/MCPClient.ts:165`, `:419`). Neither class states the coupling, `MCPLegacyClientTransportOptions` does not (`src/core/types.ts:1227-1236`), and the guide's adapter section does not. `createMCPLegacyClientTransport` returns a published `MCPClientTransportInterface`, so a consumer may drive it directly or wrap a carrier they also write to. Why it matters: the reservation is unreachable through this package's own composition, which per `.claude/rules/quality.md` § Rounds and verdicts is precisely the case that is documented rather than defended — and it is not documented. Right looks like: state the reserved id on `MCPLegacyClientTransportOptions` TSDoc and in the guide's adapter section, and pin it with a row that delivers a foreign id-`0` message during the handshake window.

## F3 — `SUPPORTED_CLIENT_PROTOCOL_VERSIONS` still says CLIENT

The constant survives with one consumer: `isMCPVersion` at `src/core/validators.ts:1227`. The guide's row was honestly relabelled to "Frozen version-guard set spanning the modern and legacy eras" (`guides/mcp.md:1755`), which is the right disclosure — but the published token still reads `SUPPORTED_CLIENT_PROTOCOL_VERSIONS` while no client surface admits its contents, and `createMCPClient` now throws `MCP_UNSUPPORTED_VERSION` on two of the revisions it lists (`src/core/MCPClient.ts:135-141`). Why it matters: a consumer reaching for the constant named for the client, to learn what to pass the client, gets a set that is half refused; the guide had to rewrite the row's meaning because the name could not carry it. Right looks like: rename it for what it now guards — `SUPPORTED_MCP_VERSIONS` beside `isMCPVersion` — and update the guide row, the validators import, and `tests/src/core/validators.test.ts:107`. This moves the published surface and earns a bump, which `.claude/rules/architecture.md` names as the correct cost for a right-file-wrong-name repair.

# Referrals to the objective lane

Each is specifically evidenced and outside my lane; I rule on none.

- **`#methods` grows without bound.** `src/core/MCPLegacyClientTransport.ts:119` records every correlated request's method and `:279` deletes it only when a correlated response arrives. A request the client settles by its own deadline or an abort leaves its entry until `close()` clears the map (`:126`). Does a long-lived adapter connection under repeated timeouts retain unbounded entries?
- **A malformed legacy result costs a deadline rather than an error.** `:285-291` emits a transport `error` event and delivers no message, so the client's pending request stays pending until its per-request deadline. The caller learns the timeout, not the malformation. Is the drop the intended contract, or does the pending request owe a correlated error response?
- **Discovery before the handshake.** `:238-241` emits an `error` and never answers when `server/discover` arrives with no completed handshake. Reachable only by driving the adapter outside `MCPClient`; the same question as the preceding item, at a different door.

VERDICT: FAIL — 4 broken, 2 unresolved, 0 not-evidenced, 3 findings outside the claims
