# Audit verdict — L4 `StdioTransport` (lsp `d354cab`), subjective lane

Lane held: **subjective** — design acceptance, API and vocabulary, architecture fit, simplification, guide voice, suite design. Evidence: the supplied diff, the empty status, the tree at `/home/user/lsp`, the installed `@orkestrel/process` declarations. I ran nothing.

## 1. `LSPTransportInterface` to the letter — BROKEN

Reject-not-throw, `send` resolving `false` after `close`, `duplicate` over a live child, and a fresh child per `start` all hold. The reconnect stance fails at the seam the claim names: **stream listeners survive a generation change, and the transport publishes a generation's `exit` after that generation's `close()` has already resolved.**

- `/home/user/lsp/src/server/transports/StdioTransport.ts:129` — `close()` awaits `waitForExit(child, grace)`, which resolves on the child's native `exit`.
- `/home/user/lsp/src/server/transports/StdioTransport.ts:165` — the transport emits its own `exit` from `child.on('close', …)`. Node emits `'close'` only after the process ended **and** its stdio streams closed; with `stdio: ['pipe','pipe','pipe']` (`:143`) that is strictly later than `'exit'`. The process package draws the same distinction itself by publishing both `waitForExit` and `waitForClose` (`node_modules/@orkestrel/process/dist/src/server/index.d.ts:937,951`).
- Nothing detaches a generation's listeners. There is no `off` or `removeListener` anywhere under `src/server`; `#observe` (`:160`) attaches and the class never releases.

Interleaving, deterministic rather than probabilistic:

1. `await transport.close()` resolves inside the microtask drain that follows child A's `'exit'`. A's `'close'` cannot have fired yet.
2. The continuation calls `start()`. `#launch` runs `spawn()` synchronously and `start()` assigns `this.#child = B` at `:77`, before its first `await`.
3. A's `'close'` fires. A's still-attached listener runs `this.#emitter.emit('exit', …)` on the shared emitter while B is live.
4. `LSPClient.#receiveExit` (`src/core/LSPClient.ts:567-577`) sets `{ phase: 'closed' }`, calls `#clearSession()`, and drains pending work — killing the live generation B.

Reachable through the package's own shipped code, not a foreign transport: `#begin`'s failure path calls `#releaseGeneration()` → `#closeTransport()` → `transport.close()` (`src/core/LSPClient.ts:253,641-642,621-622`) and leaves the client's transport listeners attached; `guides/lsp.md:10-11` then tells the consumer to call `start()` again. The stale `exit` lands on the retry.

The suite never reaches it: both close-then-restart rows wait for the `exit` event *after* `close()` resolves before proceeding (`tests/src/server/transports/StdioTransport.test.ts:175-176,216-249`; `tests/src/server/factories.test.ts:34-35`), which is itself the shape of an author who found the event pending at that point.

**Smallest fix:** give `#observe` the child it was armed for and drop every emit whose child is no longer `this.#child`, and release that generation's listeners in `close()`. Equivalently, have `close()` await `waitForClose` after `waitForExit` so the generation's terminal event is published before `close()` resolves. Do not widen this into a restart policy; the exclusion table keeps that out.

Bounded — what is *not* broken here: `send` and `close` reject on every path (both are `async`, `:106`, `:123`); `send` returns `false` before the first `start`, after `close`, and after an unprompted exit (`:107`); a `start` over a live child is refused `duplicate` (`:69-72`); the spawn-failure path clears `#child` and orphans nothing (`:92-95`).

Host-dependent assumption I could not run: that `'close'` never precedes the `'exit'`-driven resolution on this host. Scriptable scenario for reconciliation, in `tmp/probe/`: start a `StdioTransport` over the fixture peer, record `exit` events, `await transport.close()`, then **synchronously** `await transport.start()` and assert `exits.count === 0` at the instant the second `start()` resolves; the claim predicts the recorder shows one stale exit for the previous child.

## 2. Bytes, never frames — CONFIRMED

No `Content-Length`, split, or buffering logic exists under `src/server`; the transport hands the host's own buffer to the `chunk` event unaltered (`src/server/transports/StdioTransport.ts:161`) and drains stderr with `resume()` (`:162`), which never joins stdout. Ordering is the stream's. The split and coalesced rows prove it against a real spawned peer rather than a fake (`tests/src/server/transports/StdioTransport.test.ts:64-100`). Bound: the emitted chunk is the transport's own `Buffer` rather than a copy, which is correct here because the core parser owns copies of what it retains (`guides/lsp.md:91-93`).

## 3. Termination exactly as ruled — CONFIRMED

`close()` is stdin end → `waitForExit(grace)` → `stopChild(grace, grace)` (`src/server/transports/StdioTransport.ts:127-131`), and `resolveExecutable` sits on the spawn side (`:144`). The only process-package import is `resolveExecutable, stopChild, waitForExit` (`:7`); `ChildProcess` is Node's type, not the package's line-oriented `Process`, and `lines`/`send` appear nowhere. No orphan on the spawn-failure door: a pre-`spawn` `'error'` means the host produced no process.

Observation, bounded and not a break: `close()` discards `stopChild`'s boolean, which is the only report that the native exit was never observed (`node_modules/@orkestrel/process/dist/src/server/index.d.ts:777`). On a host where the kill route fails, `close()` resolves having already dropped its reference at `:124`, leaving a live child nobody holds. Unreachable on a POSIX host with a normal child, so it is a design gap rather than a defect: the `error` event on the map is the natural home for that answer.

## 4. `StdioTransportOptions` and the barrel — CONFIRMED

The type is exactly `{ server: { command, directory?, environment? }, grace? }` with every leaf readonly (`src/server/types.ts:22-29`), matching ruling 10 verbatim. Both start-failure doors code `spawn` (`:74-75`, `:83-84`); `duplicate` is reserved for the live child, as ruling 11 requires. Environment inheritance is pinned by an executed row asserting the child's `PATH` equals this process's (`tests/src/server/transports/StdioTransport.test.ts:131-150`). The barrel's value surface is exactly `StdioTransport` and `createStdioTransport`, pinned by `tests/src/server/index.test.ts`. `@orkestrel/lsp/server` resolves (`package.json:32-41`), so the guide's fence specifier is honest.

## 5. The suite proves what it names — CONFIRMED

Each row's subject matches the production line the mutation table names; the peer speaks real Content-Length frames over real stdio with no mock (`tests/src/server/fixtures/peer.mjs`); the receipt reaches Oxlint only through `createLSPClient` and `createStdioTransport` (`tests/src/server/integration.test.ts:1-20`); and the no-orphan reading is a measured host-table difference with an assertion that fails loudly on the undefined branch, not an assumption.

Two weaknesses, both bounded, neither concealed: M9 (`#live()` always true) reddens nearly every row, so the reconnect row — the unit's own delegated decision — has no isolating control, and a one-row mutation was available (refuse `start` whenever `#child !== undefined`); and `readChildProcesses` (`tests/setupServer.ts:162`) carries the receipt's load-bearing two-snapshot intersection with no proof of its own, because no `tests/setup*.test.ts` exists and registering the `setup` project needs `vite.config.ts`, which the brief put off-limits. The report discloses the first and omits the second from "What the unit did not close".

## 6. Inside the law and the owned scope — BROKEN

The code-law half holds: no `any`, `as`, `!`, suppression comment, or default export; every entity member is one word; placement is centralized correctly, with the class in the `transports/` extension-category folder the architecture rule prescribes and the contract left in core; the supplied status is empty.

The guide half does not. `guides/lsp.md:119-127` ships a `### StdioTransport` methods table keyed by a **class**. `.claude/rules/documentation.md` fixes "one method table per interface, keyed by its backticked name"; the class's obligation there is to expose exactly its interface methods, not to acquire a second table for the same three members. The guide now describes `start`, `send`, and `close` twice, at `:113-117` and `:123-127`, in two Behavior columns that can drift apart. The report flags it and hands the repair to L6 conditionally ("If L6's parity test keys tables to interface names…"), but this unit owns those guide rows, and there is no `tests/guides.test.ts` in the tree to catch the drift in the meantime — so a known rule violation ships as a deferred row, which the completion law refuses.

**Smallest fix:** delete the `### StdioTransport` table and move its three behavior sentences into the `## Stdio transport` prose, which already carries the same material at `:75-87`.

Second item under this claim, consequential rather than independent: `guides/lsp.md:82-84` promises that a `start()` after `close()` resolves spawns a fresh child cleanly. Claim 1 shows that sentence is the one that walks a consumer into the stale-exit window, so the row is not honest for what shipped until claim 1 is repaired.

## Findings outside the claims

### F1. A published `@orkestrel/process` composite is reimplemented by hand

`#launch` (`src/server/transports/StdioTransport.ts:139-153`) composes `resolveExecutable(file, { workspace, environment }) ?? file`, a raw argument array, and its own spawn options. The package publishes exactly that composition: `buildSpawn(command: ProcessCommand, options?: ExecutableOptions): SpawnInput` (`node_modules/@orkestrel/process/dist/src/server/index.d.ts:118`), returning `{ file, arguments, verbatim }` (`dist/src/core/index.d.ts:713-718`) — "the resolved spawn form of one command for the current host", including the Windows batch-script guard its own `@throws` names. The hand-rolled version drops `verbatim`, so `windowsVerbatimArguments` is never set and Windows quoting is left to chance.

The same declaration carries the fleet's vocabulary for this concept: `ProcessCommand { file, arguments, environment?, isolated? }` (`dist/src/core/index.d.ts:292-299`). `StdioTransportOptions.command` invents a positional `readonly string[]` for the identical idea and then destructures it back into file-plus-arguments at `:73`. Ruling 10 fixed the key name, not the type, so this was the unit's call.

`AGENTS.md` makes reuse non-negotiable — "inspect the exact declared and installed `@orkestrel/*` capabilities before implementing overlapping logic. Reuse a primitive when its semantics match" — and `.claude/rules/patterns.md` § Declared ecosystem capabilities repeats the overlap-map obligation. Ruling 5 named `resolveExecutable` and the unit obeyed it; `buildSpawn` sits one level up from that helper and was not considered. **Fix:** call `buildSpawn` and spawn its result, and consider typing `server.command` as `ProcessCommand` so the option passes straight through. **Bound against over-correction:** keep the termination path exactly as ruling 5 fixes it, and do not adopt `createProcess` or any line-oriented surface — ruling 5 forbids them and claim 3 holds today.

### F2. The retained report states a count, and the count is wrong

`/home/user/scaffold/.orkestrel/campaign/l4-stdio-transport-report.md:88` records "Eleven transport rows". The file carries twelve `it(` rows (`tests/src/server/transports/StdioTransport.test.ts`: empty command, unlaunchable executable, second start, split frame, coalesced frames, directory and environment, inherited environment, send before start and after close, cooperative close, grace escalation, unprompted exit, reconnect), and twelve plus the factories, integration, and barrel rows is the fifteen the suite reports. `AGENTS.md` § Writing bans the count outright — "Delete a count you find. Do not correct it." The report is a durable campaign artifact the next lane rules on, so a false tally in it is a defect of the record. The same ban reaches "the fourteen rows that existed at the time" at `:255`. **Fix:** name the rows or recast the sentences without a number.

## Attacked and not broken

Reject-not-throw on every `send` and `close` path; `send` resolving `false` after close and after an unprompted exit; `duplicate` over a live child; a fresh child per `start`; passthrough of split and coalesced chunks and the absence of any framing in the server environment; the ruled termination sequence and the absence of the line-oriented process surfaces; the option shape, its readonly leaves, both `spawn` doors, and the barrel's value surface; the fixture peer's faithfulness for the exchanges it serves; the Oxlint receipt driving the real server through the public API alone; the pid reading as a measurement; and the code-law half of claim 6.

## Referrals to the objective lane

- `LSPClient.#receiveExit` (`src/core/LSPClient.ts:567-577`) acts on any transport `exit` with no generation guard, and `#releaseGeneration` (`:641-642`) closes the transport without detaching the client's listeners. That is the second station on the same stream as the claim-1 defect, and `src/core/**` is outside this unit's owned scope.
- `close()` discarding `stopChild`'s boolean (claim 3's bound) — whether an unobserved native exit is reachable on any supported host is a correctness question I cannot settle.
- Whether concurrent `close()` calls, where the second returns immediately on the cleared `#child` (`:124`), can mislead a caller about the child's liveness.

VERDICT: FAIL — 2 broken, 0 unresolved, 0 not-evidenced, 2 findings outside the claims
