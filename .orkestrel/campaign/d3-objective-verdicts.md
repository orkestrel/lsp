## 1. Where stdout bytes live

**Push event on a new event map, exclusive stdout owner, no readline.** Reject a `chunks` `AsyncIterable`. Reject a constructor mode on `Process`.

Stdout already has one owner: `createInterface({ input: this.#child.stdout })` at `Process.ts:153-155`. That owner is line framing. `lines`, `truncated`, and `backlog` are that pipeline (`types.ts:172-180`, `types.ts:243-244`, `Process.ts:325-360`). A byte consumer that needs unaltered `Uint8Array` host chunks cannot share it.

Do not depend on a `data` listener coexisting with readline. A probe would settle whether a second `data` listener still receives `Buffer` values, whether every host chunk reaches both listeners, and whether `#reader.pause()` (`Process.ts:348-352`) stalls the byte path. Those answers do not matter: pause/resume is line-backlog policy, unused line framing of LSP bodies would retain then drop at `backlog` (`Process.ts:335-341`), and `truncated` would then report a lines omission that is not a byte-path fact. Exclusive attach at construction.

`chunks` as `AsyncIterable<Uint8Array>` copies the single-consumer backlog/pause machine (`types.ts:172-176`) onto a push path. The consumer is an emitter event per host chunk. The package already uses that shape for stderr (`types.ts:112-114`, `Process.ts:160`, `Process.ts:372-376`).

A constructor discriminant that selects readline versus `data` is a magic mode (`names.md` split-behavioral-variants). A `'lines' | 'bytes'` union also fails real-domain-states. A boolean such as `framed` still selects two algorithms and leaves `lines` / `truncated` / `backlog` inoperative on a byte child, which derive-state and “`Process` implements `ProcessInterface` exactly” (`guides/process.md:212`) refuse.

**Shape:** each host `data` emission on stdout becomes one `stdout` event with a **copy** of the bytes as `Uint8Array` (Node reuses `Buffer` backing). Name the event `stdout`, parallel to `stderr`. The transport maps that event onto its own `chunk` event. Do not add `chunk` to `ProcessEventMap` (`types.ts:112-119`): that map would then advertise an event line children never emit, and `chunk` would not say which stream. Leave `ProcessEventMap` unchanged.

The one-shot `execute` path already consumes stdout as raw `data` buffers (`src/server/execution/execute.ts:166-167`). Supervised byte observation must follow that attach, not readline.

## 2. Where raw stdin writes live

**A separate one-word method `write(bytes: Uint8Array): Promise<boolean>` on the byte interface. Not an overload of `send`. Not a mode. `delivery` bounds it.**

`send` is defined as writing one line and appending a terminator (`types.ts:275-291`, `Process.ts:243-251`: `` stdin.write(`${text}\n`, …) ``). Exact-byte frames must not gain a terminator. That is two algorithms, not two data forms of one operation (`names.md` split law). An overload `send(string)` / `send(Uint8Array)` would hide the terminator behind the argument type.

`ProcessCommand.input` already writes exact stdin bytes with no added newline (`Process.ts:161-163`). `send` is the line-framing write; `write` is the exact-byte write. Do not add `write` to `ProcessInterface` in this change: no line consumer asked for unterminated writes.

`delivery` is the bound on an unconfirmed pipe write (`types.ts:160-161`, `Process.ts:256-259`). It is not a line concern. It must bound `write` the same way: `0` or omitted disables the bound; teardown settles pending writes `false` (`Process.ts:451-453`, `Process.ts:494`). Refusal matches `send`: never reject; `false` when settled, stopping, failed, or `!stdin.writable` (`Process.ts:245-247`).

## 3. Cooperative stdin close

**Public method `end(): Promise<boolean>` on the byte interface. Ends stdin only. Does not terminate the child.**

`close` is forbidden as the name. The package already uses close for host stream close (`waitForClose` at `helpers.ts:699-710`, `#child.once('close', …)` at `Process.ts:158`, `#close` at `Process.ts:379-382`). `closed` was already refused as a `ProcessInterface` member for borrowing that Node event name (`guides/process.md:1225`). `close` is not a fixed lifecycle verb (`names.md` table). `stop` means end the child permanently (`names.md`; `types.ts:293-308`; `Process.ts:486-498` calls `stopChild` then `stdin.destroy()`).

**Semantics:**

- Calls `stdin.end()` and does not set `stopping`, does not call `stopChild`, does not arm `drain`, does not settle `exit`.
- Never rejects. `true` when the host accepts the end; `false` when already ended, stopping, settled, or the channel is not writable (same refusal gates as `send`).
- Idempotent: a second `end` resolves `false`.
- Pending `delivery`-bounded writes are not force-settled `false`. `stop` is the path that destroys the pipe and settles writes (`Process.ts:494-495`). `end` lets the kernel finish accepted writes, then closes, matching Node `Writable.end`.
- After `end`, later `write` resolves `false` because `stdin.writable` is false. Host faults after `writableEnded` stay quiet (`Process.ts:455-461`).
- `stop` after `end` remains the escalation path and still destroys stdin (`Process.ts:495`).
- Host-independent. This is stdin EOF, not POSIX `SIGTERM`. `ProcessOptions.grace` is unused on Windows (`types.ts:125-126`; portability: cooperative signal shutdown is POSIX-only). The transport’s cooperative window must not be mapped onto `grace`.

`Process` already ends stdin at construction when `writable !== true` (`Process.ts:165-168`). There is no later cooperative end on `ProcessInterface`. Add `end` only on the byte interface (first consumer). Do not add it to `ProcessInterface` now.

## 4. One class or two

**Two public classes, one interned shared engine. `Process` / `ProcessInterface` stay the framed-lines contract. A sibling class implements a new interface. No mode on `ProcessOptions`.**

`ProcessInterface` is specified as framed stdout lines (`types.ts:10-12`, `types.ts:169-180`). Putting byte observation on that type makes `lines`, `truncated`, and `backlog` meaningless on a byte child. A second class that copies spawn/teardown/`#settle`/`#kill`/`#retain` is the wrapper the rules delete (`architecture.md` wrapper test; centralize repeated patterns). One class with a discriminator is the mode the split law deletes.

**Shared engine (interned class, not barrelled):** eager `spawn` with `stdio: ['pipe','pipe','pipe']` (`Process.ts:145-152`), stderr retain + `stderr` event (`Process.ts:372-376`), native `exit` → drain wait → terminal moment (`Process.ts:384-420`), stdin fault/`delivery`/`#writes` (`Process.ts:243-261`, `Process.ts:431-474`), `stop`/`destroy` (`Process.ts:275-293`, `Process.ts:486-504`). Constructor requires the spawned child, so intern it (`architecture.md` barrel intern rule). Stay flat under `src/server/` (`architecture.md`: co-equal primitives stay flat; this is two contracts, not two backends of one interface). Do not move `Process.ts` into a family folder.

**Byte interface includes:** `pid`, `code`, `signal`, `emitter`, `evidence`, `settled`, `stopping`, `exit`, `stop`, `destroy`, `write`, `end`, and a never-rejecting waiter that settles at **native** host exit (see Q5). **Omits** `lines`, `truncated`, `backlog`. Stdin stays open after spawn (no `writable` option; `end` closes it). New `EventMap`: `stdout` (`Uint8Array`), `stderr` (`string`), `error`, `exit`. New options: `command`, `workspace`, `grace`, `drain`, `evidence`, `delivery`, `signal`, `on`, `error`. No `backlog`.

**`ProcessManager.launch` stays `ProcessOptions` → `ProcessInterface` (`types.ts:534`).** Do not teach the manager the sibling until a registry consumer exists.

The sibling’s one-word entity name is not a correctness constraint; the subjective lane names it. Compounds such as `ByteProcess` are illegal (`names.md`).

## 5. lsp adoption plan

**Keep in `StdioClientTransport`:** generation scoping per `start()`, duplicate refusal, exit-once on the **transport** emitter, and the grace **split** (cooperative stdin-EOF window versus escalation). Those are transport policy, not process mechanism.

**Delete:** direct `spawn`, stdout/stderr stream observation, and the transport’s own `stopChild` / `waitForExit` / `waitForClose` sequencing. Spawn, evidence, drain cutoff, and tree kill move into the sibling.

**Map `close` onto package members:**

1. `end()` — stdin EOF, child left running, `stopping` still false.
2. Race the **native-exit waiter** against the transport’s cooperative grace timer. Do not race `child.exit`.
3. If that waiter has not settled, `stop()` — package `grace` (POSIX `SIGTERM`→`SIGKILL`) / Windows `taskkill`, then package `drain`.
4. `destroy()` — shared barrier, emitter teardown after the terminal moment (`types.ts:310-323`).

**`child.exit` / `ProcessEventMap.exit` are the terminal moment** (streams closed or `drain` elapsed), not native self-exit (`types.ts:186-201`, `types.ts:265-273`, `Process.ts:35-41`, `guides/process.md:313-330`). `code` / `signal` update at native exit (`Process.ts:181-188`, `Process.ts:157`). `waitForExit` is published but takes `ProcessChild` (`helpers.ts:673-685`; `types.ts` server `ProcessChild` at `src/server/types.ts:27-61`). `Process` does not implement `ProcessChild` (`code` vs `exitCode`) and does not expose the host child. Without a native-exit waiter on the sibling, the transport would have to poll `code`/`signal` (forbidden) or leak `ChildProcess`.

**Mismatch if `close` races `child.exit` against grace:** a descendant holding inherited stdio delays `child.exit` by up to `drain` after native exit (`Process.ts:384-400`). Grace can expire, `stop()` runs, and `stopping` latches true on a child that already self-exited. `stopChild` no-ops when already exited (`helpers.ts:743`) so descendants are not extra-killed, but that is not “wait for self-exit, escalate only if still live.” The native-exit waiter is what preserves the documented cooperative window.

**Other mappings:**

- Transport `send` → sibling `write`. Never `Process.send` (that appends `\n`).
- Transport `chunk` → listen to sibling `stdout`, re-emit `chunk`. Concatenation of payloads must equal host stdout bytes.
- Writes after `end` or after settle → `write` returns `false`, never throws (`Process.ts:245-247` pattern).
- Grandchild-held-pipe → sibling `drain` (default `PROCESS_DRAIN` at `constants.ts:22`). Set `drain` from the transport’s existing close bound when that bound must remain the documented cutoff.
- `ProcessOptions.grace` is the POSIX kill window, not the stdin-EOF wait. Do not reuse it for step 2. On Windows, `grace` is unused (`types.ts:125-126`); stdin `end` still works.

**TSDoc that must survive:** exit-once (package `exit` event is already once at `Process.ts:416`; transport may still dedupe its own emitter), chunk fidelity, `send` false after close, duplicate refusal window, grandchild-held-pipe bounded by `drain` rather than an unbounded `close` wait.

## 6. Proof obligations

**Process suite, real children, `src:server`, same style as `tests/src/server/Process.test.ts`:**

- Stdout: binary, `NUL`, incomplete UTF-8, and a payload that contains `\n` arrive as `Uint8Array` events; concatenation equals host bytes; `\n` does not split events; later host-buffer mutation does not change already-emitted copies.
- `write` echoes exact bytes (no extra terminator). Contrast: existing `send('ping')` still expects the line contract (`Process.test.ts:218-233`).
- `write` returns `false` after `end`, after `stop` begins, after settle, and when the channel is not writable. Never throws.
- `delivery` settles an unconfirmed `write` `false` while the child is live (mirror `Process.test.ts:291-310`).
- Teardown settles a pending `write` `false` with no `error` event (mirror `Process.test.ts:370-393`).
- Host stdin fault: affected `write` false, one `protocol` error, later `write` false (mirror `Process.test.ts:334-364`).
- `end` leaves the child live: `stopping` false, `code`/`signal` still null, native-exit waiter unsettled until the child actually exits.
- `end` is idempotent (`false` on the second call).
- `end` then self-exit: native waiter settles, `exit` settles, `stop` not required.
- `end`, grace expiry, `stop`: escalation confirmed; Windows uses tree kill, POSIX uses `grace`.
- `exit` event and `exit` promise agree once; `pid` from construction; `evidence` / live `stderr` unchanged.
- Drain/grandchild: undrained terminal moment while a descendant holds the pipe (mirror `Process.test.ts:547+`, `1148+`).
- `Process.test.ts` stays green with no edits after the engine extract.

**lsp proofs that stay green unmodified:** every test that asserts the transport TSDoc (exit-once, chunk fidelity, `send` false after close, duplicate refusal, grandchild-held-pipe bound). Tests that asserted direct `child_process` usage belong to the adoption unit and must be rewritten there. Exact lsp file paths are out of scope here (writer holds that tree).

## 7. Blast radius and version

**`ProcessInterface`, `ProcessEventMap`, `ProcessOptions`, `send`, readline, `lines` / `backlog` / `truncated` do not move.** mcp’s stdio client that uses `lines` keeps the same types and the same runtime. `ProcessManager` still launches framed `Process` only.

**Additive surface:** sibling types in `src/core/types.ts`, interned engine, sibling class, `create*` factory, server barrel star-export, guide Surface/method rows, sibling tests. `src/core/index.ts` already star-exports `types.js`.

**Version:** published `@orkestrel/process` is `0.0.6` (`package.json:3`). This is an additive public API, so bump to `0.0.7` at publish. Fleet `0.0.x` caret pins one exact release (`.agents/orchestration.md` “What a bump obliges”). lsp re-pins the runtime dependency after process publishes, then lsp bumps and republishes. Do not change `send` behavior (that would be a breaking runtime change for every `writable: true` caller).

An extract that rewires `Process` onto the interned engine is behavior-preserving only if `Process.test.ts` stays unmodified and green. That extract is in-scope for the process unit, not a later cleanup.

---

## Unit definitions

**Process capability** (serial writer; process repo only)

Owned files: `src/core/types.ts`; interned engine class under `src/server/` (not barrelled; name it in the guides `INTERNAL` list); `src/server/Process.ts` (compose the engine, no behavior change); new sibling class under `src/server/`; `src/server/factories.ts`; `src/server/index.ts`; `tests/src/server/<Sibling>.test.ts`; `guides/process.md`; `tests/guides.test.ts` only if `INTERNAL` gains the engine.

Acceptance:

- `ProcessInterface` unchanged; `Process.test.ts` unmodified and green.
- Sibling attaches stdout `data`, never readline; one `stdout` event per host chunk; payload is a `Uint8Array` copy.
- `write` does not append a terminator; `delivery` and refusal match `send`.
- `end` closes stdin only; `stop` is the only terminator.
- Native-exit waiter settles on host `exit`, before or without waiting for stream close/`drain`.
- `exit` / `settled` / `evidence` still align at the terminal moment.
- Guide Surface and method tables include the new types, class, factory, and methods.

Serial: types in `src/core/types.ts` → interned engine + `Process` wiring → sibling + factory + tests → guide parity.

**lsp adoption** (after the process unit is in the lsp dependency graph)

Owned files: `StdioClientTransport` implementation, its mirrored test, and the guide/parity rows that document it. Paths are not taken from the lsp tree (mid-rename).

Acceptance:

- No `node:child_process` spawn in that transport; no local `stopChild` / `waitForExit` / `waitForClose` sequencing.
- One sibling instance per `start()` generation; duplicate refusal and exit-once remain transport-owned.
- `close` = `end` → race native-exit waiter against transport grace → `stop` if still live → `destroy`.
- Transport `send` = sibling `write`; `false` after `end`/settle; chunks are host bytes.
- Documented grandchild bound is sibling `drain`.
- TSDoc listed in Q5 still holds; tests that encode it stay green.

Serial: process unit lands and is reachable → replace spawn/stdio in the transport → keep generation/duplicate/exit-once/grace split → prove the TSDoc tests.

---

## Open questions

- **Sibling (and interned engine) one-word names.** Correctness does not pick them. Subjective lane does. Constraints: not a compound; not `close`/`closed`; not a second `Process`; engine interned.
- **Native-exit waiter identifier.** Required member; cannot be `exit`, `close`, or `closed`. Subjective lane names it. Shape is fixed: never-rejecting `Promise` that settles when the host records native exit; read `code`/`signal` there; `drained` is not knowable yet.
- **lsp owned paths.** Not read. Orchestrator fills them after the rename settles.
- **Whether any lsp test spies on `child_process` internals.** Unshown without reading lsp. Those tests are adoption-unit rewrites; TSDoc-behavior tests stay unmodified.
- **Readline + `data` coexistence.** Unshown in this codebase (brief G6). Probe only if a design proposes sharing stdout. This ruling does not.
