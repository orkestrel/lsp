# Audit verdict — L6 round in the lsp tree (L6-A, L6-B, L6-D), subjective lane

Lane: `reviewer`, Claude Opus 5, native read-only, returned 2026-08-26. Subject: the held
uncommitted lsp tree per `l6-round-diff.txt` and `l6-round-status.txt`. The verdict text
follows verbatim as the lane returned it.

---

Lane held: **subjective** — design acceptance, API and vocabulary shape, TSDoc and guide voice, placement, simplification. Subject: the held uncommitted tree at `/home/user/lsp` (`git status` matches `.orkestrel/lsp/l6-round-status.txt`). No probe tree read.

## 1. `LSPOpenOptions` states the ruled scope split exactly — CONFIRMED TRUE

`/home/user/lsp/src/core/types.ts:285-295` declares `LSPOpenOptions` with the single required `readonly signal: AbortSignal`, and its member TSDoc carries the ruled refusal and rejection sentences. `/home/user/lsp/src/core/types.ts:269-277` scopes `timeout` to "the initialize and shutdown requests and the destroy-time exit-write and transport-close settlement", and states it does not bound diagnostics.

Each claimed bound is enforced: initialize at `/home/user/lsp/src/core/LSPClient.ts:249` and shutdown at `:646` reach `#request` with no signal, so `:375` binds `AbortSignal.timeout(this.#timeout)`; the exit write is bounded at `:663-671` and the transport close at `:673-691`. The diagnostics wait takes only the caller signal: `#openPush` registers it at `:343-347`, and `#openPull` passes it to `#request` at `:314`. I found no sentence claiming a bound the code does not enforce; the one asymmetry runs the other way and is recorded as finding F4.

## 2. The API shape obeys the naming laws — CONFIRMED TRUE

`open(document, options)` at `src/core/types.ts:319` keeps one-word members, and the second argument is a grouped bag rather than a compounded `openSignal` key on `LSPClientOptions` — the shape `.claude/rules/patterns.md` § Options and `.claude/rules/names.md` § Split instead of compounding prescribe. `LSPOpenOptions` follows the `{Entity}Options` form. The `aborted` and `closed` codes are existing members of `LSPErrorCode` at `src/core/types.ts:333-341`, which the round leaves untouched (the round's only `types.ts` hunk is `@@ -266,20 +266,60 @@`, per `.orkestrel/lsp/l6-round-diff.txt:351`), so the round names real domain states rather than minting labels. No sentinel appears: the signal is required, so absence never has to be encoded.

The private vocabulary moved with the contract: the pending and publication records renamed `deadline`/`timeout` to `signal`/`abort` (`l6-round-diff.txt:138-158`), which keeps one term per concept inside the class.

## 3. The factory TSDoc's timeout wording matches the types contract and the guide — CONFIRMED TRUE

`src/core/factories.ts:7-8` reads "The transport, workspace, lifecycle timeout, abort signal, and initial event hooks." The guide's surface row at `guides/lsp.md:182` reads "Configures transport, workspace, lifecycle timeout, client abort, and event hooks." The scope clause itself is shared verbatim between `src/core/types.ts:270-271` and `guides/lsp.md:17-19`: "the initialize and shutdown requests and the destroy-time exit-write and transport-close settlement".

No synonym drift survives for the duration. A sweep for `deadline` over `/home/user/lsp/src` returns `types.ts:325-326`, `LSPClient.ts:557`, `:664`, `:675`, `:688`, and over `guides/lsp.md` returns `:69-70` — every one of them naming the instant the duration fixes or an internal error message, never the option. The vocabulary split is the one the L6-A report recorded and the guide mirrors. The `abort signal` versus `client abort` asymmetry is recorded as finding F3, outside this claim's timeout scope.

## 4. The `LSPClient` class TSDoc and example — CONFIRMED TRUE

`src/core/LSPClient.ts:47-64` shows the required bag (`{ signal }`) and `await client.close(uri)` before `destroy()`, and the remark at `:44-45` reads "signal-bound pending entries" where it read "deadline-bound" (`l6-round-diff.txt:110-111`). A banned-term sweep over `/home/user/lsp/src/core` for the `.claude/rules/writing.md` substitution set — `should`, `ensure`, `guarantee`, `simply`, `easy`, `just`, `currently`, `now`, `latest`, `utilize`, `leverage`, `via`, `in order to`, `e.g.`, `i.e.`, `etc.`, `performant`, `robust`, `allows you to`, `and/or`, `since`, `please` — returned nothing, and the only em dash in that tree is spaced, at `types.ts:231`, in prose the round did not touch. The example states no count and claims nothing a reader cannot check.

## 5. The L6-B test rows serve the reader — CONFIRMED FALSE

Three sub-clauses hold. Every added row's title states its behavior: `tests/src/core/LSPClient.test.ts:446`, `:485`, `:528`, `:550`, `:572`, `:652`, `:686`, `:714`, and `:1074`. The delayed-success rows are load-bearing rather than timing accidents — `:550` and `:714` both construct the client with `timeout: 10` and wait `waitForDelay(30)` before the peer answers, so each row reddens if the constructor timeout still governed the wait. No row I read asserts an implementation detail: `:678` and `:1126` assert the `$/cancelRequest` frame on the wire, and `:480` asserts the recorded operation list, both observable protocol behavior.

The conversion sub-clause fails. `.orkestrel/lsp/l6-round-diff.txt:521`, `:941`, and `:1151` show three rows renamed off the retired concept:

- `bounds a push diagnostic publication deadline` → `bounds a push diagnostic publication with its call signal`
- `times out one request and sends its cancel notification` → `aborts one request and sends its cancel notification`
- `detaches a drained publication deadline before the next generation` → `detaches a drained publication signal before the next generation`

The whole record of those conversions is one clause in `.orkestrel/lsp/l6-b-client-report.md` § What changed: "converted the former diagnostics-timeout rows to caller-signal behavior". It names no converted row, states no reason, and names no coverage the conversion retired. The red-first table in § 2 of that report covers the pinned rows only, so none of the three appears there either.

That gap is load-bearing rather than clerical. The conversion of `times out one request and sends its cancel notification` retired the only proof of the `#timeoutRequest` cancellation branch at `src/core/LSPClient.ts:562-563`, and the two retained lifecycle rows pin that branch's absence rather than its behavior (`tests/src/core/LSPClient.test.ts:255` and `:1419` both assert `not.toContain(LSP_METHODS.cancel)`). Finding F1 states what became of the branch.

**What right looks like:** amend the L6-B record — a successor report file beside `.orkestrel/lsp/l6-b-client-report.md` under the same unit name — with a row per conversion naming the old title, the new title, the ruling clause that made the old assertion false, and the coverage the conversion retired, explicitly including the `#timeoutRequest` cancellation branch. No test or source edit is required by this claim; the artifact that is wrong is the record.

## 6. The guide matches the landed source — CONFIRMED TRUE

The scope-split paragraph at `guides/lsp.md:17-26` tracks the code sentence by sentence: the default at `src/core/LSPClient.ts:113`, the client abort at `:635-638`, the already-aborted refusal before the write at `:159-164` (ahead of the `#documents.add` at `:183`), the post-notification rejection at `:585-592` and `:566-575`, and the retained ownership, which the abort paths never disturb. The fence at `:39-52` imports through `@orkestrel/lsp`, passes `{ signal }`, and closes the admitted URI. The methods row at `:151` carries the signature string byte-for-byte as `src/core/types.ts:319` declares it, and `:150`, `:152`, and `:153` match `types.ts:302`, `:320`, and `:329`. The transport methods table at `:161-163` matches `types.ts:236-238`. The surface rows at `:182-183` name the ruled scopes.

Every backticked name in the revised passages resolves to a source export or a declared member, and the prose claims no bound beyond what claim 1 confirmed. A substitution-table sweep over the whole guide returned one hit, `once` at `:63`, in the frequency sense the table permits, in prose this round did not touch.

## 7. No undocumented public surface added, none documented removed — CONFIRMED TRUE

`src/core/index.ts:1-8` and `src/server/index.ts:1-3` are star-exports only, so every module-scope export is barrelled. Enumerating module-scope exports across `/home/user/lsp/src` by declaration kind yields the same total as a bare `^export` count over the same tree (83 in both readings), so the enumeration admits every top-level export form present. Each name in that set appears in a `guides/lsp.md` surface table, and each surface-table name appears in the set. `LSPOpenOptions` is the round's only addition and it carries the row at `guides/lsp.md:183`. Nothing was removed.

Instrument coverage: this reading is a pattern over declarations at column zero plus the barrels' star-export rows. It proves the name sets agree; it does not compile the barrel, so a name that fails to resolve for a reason other than absence sits outside it.

## Findings outside the claims

**F1 — the `#timeoutRequest` cancellation branch has no reachable caller. Moderate. Unit L6-B.**
`src/core/LSPClient.ts:563` calls `#cancelRequest(id)` behind the guard at `:562` (`if (this.#lifecycle.phase !== 'ready') return`). `#request` has exactly three call sites: initialize at `:249` with no signal during `starting`, shutdown at `:646` with no signal during `destroying`, and the diagnostic at `:314` with the caller signal during `ready`. Only a signal-less request binds `#timeoutRequest` (`:376-379`), and no signal-less request can be pending while the phase is `ready`, so the branch cannot fire. Before this round the diagnostic request was signal-less and reached it, which is what the retired row `times out one request and sends its cancel notification` proved. This matters because the round leaves machinery the design no longer earns, and the guard now reads as protecting a path rather than as dead weight. What right looks like: either delete `:562-563` and let `#timeoutRequest` settle only, or state on `#request` why a future signal-less ready-phase request is expected and keep the branch with a row that reaches it.

**F2 — the `open` `@param options` line describes the member rather than the bag. Low. Unit L6-A.**
`src/core/types.ts:308` reads "@param options - The cancellation signal that bounds the diagnostics wait." The parameter is the options object, not the signal; the adopted contract prose says "`options` supplies the required cancellation signal for the diagnostics wait" (`.orkestrel/lsp/l6-design-analyst-ruling.md:50`). What right looks like: "The options carrying the cancellation signal that bounds the diagnostics wait."

**F3 — the factory `@param` line names an unqualified "abort signal" now that two signals exist. Low. Unit L6-A.**
`src/core/factories.ts:7` reads "abort signal" where `guides/lsp.md:182` reads "client abort" for the same option, and a reader of `createLSPClient` meets no cue distinguishing it from the per-open signal the same round made required. What right looks like: "The transport, workspace, lifecycle timeout, client abort, and initial event hooks.", matching the guide row.

**F4 — the `timeout` prose understates transport-close settlement. Informational. Units L6-A and L6-D.**
`src/core/types.ts:271` and `guides/lsp.md:18-19` scope transport-close settlement to destroy time, and `#closeTransport` at `src/core/LSPClient.ts:673` also runs from `#releaseGeneration` at `:693-695` when a handshake fails. The prose claims less than the code enforces, so no claim is falsified; the wording is the analyst's adopted text (`l6-design-analyst-ruling.md:60`) and changing it is a decision for the Orchestrator rather than a defect.

## Referral to the objective lane

F1 rests on an enumeration of `#request` call sites and the lifecycle phase at each. That reachability question belongs to the objective lane: rule whether any interleaving — a superseded generation, a restart issued from the exit handler, or a settle that loses a race — can leave a signal-less request pending while `#lifecycle.phase` is `ready`. I state the enumeration and no verdict on it.

VERDICT: FAIL
