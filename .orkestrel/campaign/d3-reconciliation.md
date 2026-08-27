# D3 reconciliation — the process byte capability, 2026-08-27

Lanes: subjective (`planner`, Opus 5, native) ruled everything onto `Process` (a `stdout` event
always live, `write` and `end` on `ProcessInterface`, one class); objective (Grok, bench) ruled a
sibling byte-mode class over one interned shared engine with `Process` untouched. The
Orchestrator rules for the OBJECTIVE architecture — the reverse of the D2 round, and for the same
reason applied symmetrically: verified evidence decides, not the lane.

## Why the objective lane wins

- The Orchestrator's host probe (`coexist-probe.cjs`, results retained beside it) falsified the
  subjective primary route: a `data` listener beside readline receives every chunk BUT forces
  flowing mode, so readline's pause no longer gates the stream — an always-attached stdout
  listener on `Process` silently breaks the documented lossless line backpressure
  (`Process.ts:348-360`; `guides/process.md:415-416`). The subjective lane's own fallback (a
  framer rewrite inside `Process`) survives the probe but rewrites the fleet's proven framing
  engine under mcp; the sibling leaves `Process` byte-identical in behavior, which is strictly
  less risk for the same capability.
- The objective lane caught a correctness trap the subjective adoption mapping stepped into:
  `Process.exit` settles at the TERMINAL moment — native exit plus up to `drain` when a
  descendant holds the pipe (`Process.ts:384-420`) — so a transport racing `exit` against its
  cooperative window falsely escalates on a child that already self-exited. The sibling carries
  a native-exit waiter distinct from the terminal-moment observation.
- The sibling dissolves the subjective lane's own strongest objection to modes — members made
  false — without the cost it feared: `lines`, `truncated`, and `backlog` are OMITTED from the
  byte contract rather than falsified on it, external `ProcessInterface` implementers stay
  unbroken, and `ProcessManager` stays untouched.

## What survives from the subjective lane

- `write(bytes: Uint8Array): Promise<boolean>` as a separate method (both lanes; the
  terminator-footgun argument is the reason of record), with `delivery` bounding it and the
  `send`-style refusal gates inherited.
- `end(): Promise<void>` — the minimal-API void ruling, confirmed or amended by the subjective
  lane's naming follow-up.
- The proof-obligation catalogue (binary fidelity, no-added-terminator echo, refusal rows,
  idempotent `end`, `end`-does-not-terminate, drain/grandchild rows) — merged from both lanes.
- Naming is the subjective lane's domain: the sibling entity name, the engine name, and the two
  exit-observation member names come from its follow-up ruling.
- The buffer-copy question: the objective lane requires emitting a COPY per chunk (host pool
  reuse); adopted — the copy also makes the ownership contract match `joinLSPSegments`-style
  owned-buffer discipline.

## Architecture of record

- process `src/core/types.ts` gains the sibling interface, options, and event map; `src/server/`
  gains the interned engine class (not barrelled, named in the guide's INTERNAL list) and the
  sibling class; `factories.ts` gains the `create*` factory; the barrel gains the class row.
- `Process` re-composes over the engine with NO behavior change; `Process.test.ts` unmodified
  and green is the hard gate on the extract.
- The sibling: `pid`, `code`, `signal`, `emitter`, `evidence`, `settled`, `stopping`, `stop`,
  `destroy`, `write`, `end`, a native-exit waiter, and the terminal-moment observation; events
  `stdout` (owned `Uint8Array` copy per host chunk), `stderr` (string), `error`, `exit` (terminal
  moment, once); options `command`, `workspace`, `grace`, `drain`, `evidence`, `delivery`,
  `signal`, `on`, `error` — no `backlog`, no `writable` (stdin stays open until `end`).
- lsp adoption: one sibling per `start()` generation; `close` = `end()` → race the NATIVE-exit
  waiter against the transport's own cooperative `grace` (never `ProcessOptions.grace`, never
  the terminal-moment promise) → `stop()` on expiry → `destroy()`; transport `send` maps to
  sibling `write`; grandchild-held-pipe bound is sibling `drain`.

## Names, ruled by the subjective lane's follow-up

- The sibling is **`Session`** — one duplex byte connection to a supervised child; `Child`
  collides with the published `ProcessChild` contract, `Channel` with the package's stdin word,
  `Stream`/`Duplex` borrow Node class names against the package's own precedent. Derived:
  `SessionInterface`, `SessionOptions`, `SessionEventMap`, `createSession`.
- The interned engine is **`Supervisor`** — the package's established word for the role
  ("Supervises one child"), absent from the barrel and named in the guide's INTERNAL list.
- **`ending: Promise<void>`** is the native-exit waiter (the guide's existing term for the
  child's own ending); **`exit: Promise<ProcessExit>`** stays on the terminal moment so `exit`,
  `settled`, and the `exit` event name one moment on both classes. `ending` resolves no value —
  the monotonic `code`/`signal` pair carries the facts, per the derive-state law.
- **`end(): Promise<void>`** confirmed — the consistency class of `destroy`, an idempotent
  lifecycle member; a `write` after `end` reports `false` from the writability guard, derived
  rather than declared.
- The guide owes Vocabulary rows for: `Session` (why not a mode, `Child`, or `Channel`),
  `Supervisor` (why interned), `ending` beside `exit`, `end` (why not `close`; why void),
  `write` beside `send`, `stdout` beside `stderr` (why one payload is decoded and one raw), and
  the absent `backlog` and `writable`.

## Routing amendments

Both lanes proposed Sol for the implementation units; Sol is user-excluded, so the process units
and the lsp adoption run on the Opus `implementer`. The process work splits into P1a (engine
extract + `Process` rewire, gated by the unmodified suite) and P1b (sibling + factory + tests +
guide parity), serial, so the fleet-risk half lands and proves alone before the new surface
lands.

## Version obligations (registry updated)

Additive process surface: `0.0.6 → 0.0.7` at publish; lsp re-pins, bumps (surface already moved
by the rename), republishes; probe re-pins lsp and adopts `createStdioClientTransport`. mcp is
unobliged (additive change; its `lines` route untouched).
