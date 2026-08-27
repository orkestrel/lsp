# D3 — the process byte-stream capability design round

One brief, two blind lanes (subjective: shape, naming, ergonomics, fit; objective: correctness,
constraints, what the code permits). Read-only; neither lane edits or accepts.

## Execution

You perform this assignment directly and spawn nothing. Read first: the lsp repository's
`AGENTS.md` and `.claude/rules/{names,patterns,architecture,typescript,portability}.md` (the
process repository vendors the same law); then the process repository at
`C:/Users/mikes/WebstormProjects/process` — `src/core/types.ts`, `src/server/Process.ts`,
`src/core/constants.ts`, `guides/process.md` at the supervised-child sections, and
`tests/src/server/Process.test.ts` at whatever depth your rulings need.

DO NOT read the lsp repository beyond its rule files: a writer holds its tree mid-rename. The
consumer-requirements section here is Orchestrator-verified evidence from first-hand reading.

## The goal

`@orkestrel/process` gains what a byte-framing stdio transport needs so such transports can drop
`node:child_process`. The first real consumer is lsp's `StdioClientTransport` (the stdio client
half of an LSP byte transport), which today spawns directly and uses only the `buildSpawn`,
`stopChild`, `waitForExit`, and `waitForClose` helpers.

## Process facts (Grok distillate, spot-checked)

- One eager spawn per `Process` instance; the constructor pipes all three stdio and attaches
  `node:readline` to stdout immediately (`Process.ts:153-155`). No respawn; a second child is a
  new instance. Options: required `command` and `workspace`; optional `on`, `error`, `grace`,
  `drain`, `evidence`, `backlog`, `delivery`, `writable`, `signal`.
- `lines` is a single-consumer `AsyncIterable<string>` with backlog retention, pause/resume
  backpressure, and truncation accounting — all line-specific machinery. `ProcessEventMap` is
  `stderr` (decoded string), `error`, `exit`. No stdout byte surface exists; raw bytes exist
  only on the one-shot `execute` capture path.
- `send(text)` writes `` `${text}\n` `` — line-framed stdin — bounded by `delivery`; `false`
  when settled, stopping, failed, or not writable. `writable !== true` ends stdin at
  construction. No member closes stdin cooperatively afterward.
- `stop()` goes to `stopChild(child, grace, PROCESS_CONFIRMATION)` through one shared
  termination, then settles; `destroy()` stops then destroys the emitter. `exit` is a
  never-rejecting promise; `settled`/`stopping` are monotonic facts; stderr is retained as
  bounded `evidence` and emitted live as decoded text.
- Whether a `data` listener can coexist with readline on the same stdout Readable is UNSHOWN in
  this codebase (G6 unknown 2).

## Consumer requirements (Orchestrator-verified against lsp's stdio client transport)

1. **Raw stdout chunks, unaltered.** The transport forwards every stdout chunk exactly as the
   host delivered it (`Uint8Array`), because the LSP client owns Content-Length framing. Line
   framing anywhere on this path is corruption. Delivery is push-shaped in the consumer (an
   emitter `chunk` event per host chunk).
2. **Raw stdin writes, exact bytes, no added terminator.** A frame is header bytes plus body
   bytes; the transport resolves a boolean per write from the stream callback.
3. **Cooperative stdin close.** The LSP termination protocol ends the child's stdin first (a
   conformant server exits on it), waits a grace window for self-exit, and only then escalates.
   The transport needs to end stdin without terminating, observe the exit, and escalate through
   the package's stop path when the window expires.
4. **Exit observation** with `{ code, signal }`, at most once per child; **pid** while live;
   **stderr drained** (retention as `evidence` is strictly better than the transport's current
   `resume()`).
5. **Refusal semantics**: writes report `false` after exit or close, never throw.
6. One child per instance FITS the consumer: the transport opens a generation per `start()` and
   can construct one instance per generation, keeping generation scoping, duplicate refusal,
   and exit-once dedup in the transport.

## Questions

1. **Where do stdout bytes live?** A `chunk` event on `ProcessEventMap`; a `chunks`
   `AsyncIterable<Uint8Array>` member beside `lines`; or a constructor mode that selects the
   stdout consumer (readline or raw) per instance? Constraints: readline owns stdout today; the
   backlog/pause machinery is line-specific and means nothing for a push byte path; the
   coexistence of a `data` listener with readline is unshown (name what a probe would settle,
   and whether the design should depend on it at all). Respect the boolean-behavior and
   real-domain-states laws when a mode is proposed.
2. **Where do raw stdin writes live?** An overload of `send`; a separate one-word method; or a
   property of the same mode? `send(text)` adds a terminator and `send(bytes)` must not — rule
   whether that is one operation with two data forms or two behaviors the split law separates.
   Does `delivery` bound both?
3. **Cooperative stdin close.** Name the member and its semantics (idempotence, interaction
   with `writable`, with pending `delivery`-bounded writes, and with `stop`). Mind the fixed
   lifecycle vocabulary; `close` is not in the fixed table and the package currently has no
   `close`.
4. **One class or two?** Everything on `Process` (one engine, options select behavior), or a
   sibling supervised-child class for byte mode? Apply the wrapper and single-engine laws; a
   second class that duplicates spawn/teardown is the shape the rules delete, and a mode that
   makes half of `ProcessInterface` meaningless (`lines`, `truncated`, `backlog`) on a byte
   child is the shape the derive-state and real-domain-states laws question. Rule it.
5. **The lsp adoption plan.** With your ruled shape, what does `StdioClientTransport` keep
   (generation scoping, duplicate refusal, exit-once, its `grace` split between cooperative
   window and escalation) and what does it delete (direct `spawn`, stream observation, its own
   `stopChild`/`waitForExit`/`waitForClose` sequencing)? Name any semantic mismatch that would
   change the transport's documented behavior — the transport's TSDoc obligations (exit-once,
   chunk fidelity, `send` false after close, `duplicate` refusal window, grandchild-held-pipe
   handling) must survive verbatim. In particular: the current transport's `close` waits
   `grace` for self-exit after ending stdin and only then escalates; map that onto the package's
   members exactly.
6. **Proof obligations.** The process-side tests the capability owes (mirroring the Process
   suite's real-children patterns) and the lsp-side proofs that must stay green unmodified.
7. **Blast radius.** What the change does to `ProcessInterface` consumers (mcp's stdio client
   uses `lines`; the addition must not move existing behavior), and the version obligations.

## Output

Numbered verdicts with reasons and `file:line` evidence; the unit definitions for the process
implementation and the lsp adoption (owned files, acceptance criteria, serial order); open
questions with what settles each. No process diary.
