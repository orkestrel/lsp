# P1b report — the `Session` byte face

## Outcome

Done. Every acceptance criterion is met. `Process` did not change: `src/server/Process.ts` and
`tests/src/server/Process.test.ts` appear in no diff, and the Process rows stand at their baseline
`147 passed | 6 skipped` inside the project total.

Two findings the unit settled rather than assumed sit under **What measurement changed**: the
objective lane's pooled-buffer premise is false on this host, and the ended-channel quiet rule had a
hole on the write-callback path that this unit found, reddened, and closed.

## The contract as landed

`src/core/types.ts` gains the three ruled types, placed after `ProcessInterface`, with the tier list
at the head of the file extended to name the new face.

- **`SessionEventMap`** — `stdout: readonly [chunk: Uint8Array]`, `stderr: readonly [chunk: string]`,
  `error: readonly [error: unknown]`, `exit: readonly [exit: ProcessExit]`.
- **`SessionOptions`** — `on`, `error`, `command`, `workspace`, `grace`, `drain`, `evidence`,
  `delivery`, `signal`. No `backlog`, no `writable`, no `input`.
- **`SessionInterface`** — `pid`, `code`, `signal`, `emitter`, `evidence`, `settled`, `stopping`,
  `ending: Promise<void>`, `exit: Promise<ProcessExit>`, `write(bytes: Uint8Array): Promise<boolean>`,
  `end(): Promise<void>`, `stop(): Promise<boolean>`, `destroy(): Promise<void>`.

Complete TSDoc on every exported symbol. The two-endings distinction is stated on `SessionInterface`
under its own heading and again on `ending`, which also tells a caller to race a cooperative window
against `ending` rather than `exit`. The not-a-termination semantics are stated on `end` and again in
the interface remarks.

`src/server/Session.ts` composes one `Supervisor`, constructs it with `writable: true`, attaches one
`data` listener to the seam's stdout, and emits one owned `Uint8Array` copy per host chunk. `write`
delegates to `deliver`, `end` to the engine's new `end`, `stop` and `destroy` to their peers. The
seam callbacks map onto the face's own emitter through one private method per event, per the P1a
note that a bound generic `emit` collapses its payload.

`createSession(options: SessionOptions): SessionInterface` sits in `src/server/factories.ts` with a
runnable `@example`; `export * from './Session.js'` sits in `src/server/index.ts`. `Supervisor` stays
out of the barrel and keeps its `INTERNAL` parity row.

### Option validation order

`Session` reads every option once in its constructor prefix, builds a plain literal from those
values, and constructs the engine from that literal. So the caller's getters all run before anything
is spawned, and the engine's own validation — which is the only validation these options need, since
`Session` owns no option `Process` does not — still runs before its spawn. `Session` declares no
face-only option, so there is nothing for it to validate that the engine does not already refuse; the
ordering rather than a duplicated validator is what closes the P1a seam note. The suite pins the
read-once half (`reads each option once, so a getter runs while nothing has started`) and the refusal
half (`refuses a timer option and an empty workspace before anything is spawned`).

## The engine's stdin-end shape

`Supervisor` gains `end(): Promise<void>` — a stable barrier over `#closure`, delegating to
`#endInput`.

```ts
#endInput(): Promise<void> {
	const stdin = this.#child.stdin
	if (this.#stopping || this.#settled || stdin.writableEnded || stdin.destroyed) {
		return Promise.resolve()
	}
	const ended = Promise.withResolvers<void>()
	stdin.end(() => ended.resolve())
	return ended.promise
}
```

It sends no signal, sets no `stopping`, calls no `stopChild`, arms no drain window, and reaches no
terminal moment. Node's own `end` flushes the writes the host already accepted, and its callback
fires on either outcome, which is why the barrier never rejects. The guard makes it a no-op after
`stop`, after `destroy`, after the terminal moment, and on a second call whose first already ended
the stream — calling `end` on a destroyed stream would otherwise raise a host error nobody asked for.
A `deliver` after `end` resolves `false` with no new flag, because the host stops reporting an ended
channel writable.

Three further engine edits, each recorded as an ancillary choice:

- **`relieve` became optional** on the face callback bundle, and `#kill` calls `this.#relieve?.()`.
  `Session` pauses nothing, so it holds no backpressure to release; the alternative was an empty
  method on the face declaring that it has nothing to do. `Process` still passes `relieve` and is
  unchanged.
- **The private `#end` became `#conclude`**, so the public `end` and the composite `destroy`
  performs do not read as one word with two meanings.
- **The ended-channel rule moved into one guard.** `#failInputStream` now checks only `#input > 0`
  (the constructor's own input phase) and delegates everything else to `#failInputCallback`, which
  owns the `writableEnded` check. Behaviour through the stream path is identical; see the next
  section for what this closed.

## What measurement changed

**The pooled-buffer premise is false on this host.** The D3 objective lane required the copy because
the host's read buffer is pooled. The control in the ownership test refuted that: on Node v24.19.0 on
Windows, measured 2026-08-27, every chunk a child's stdout `data` event yields is an exact-size
allocation with `byteOffset === 0` and `buffer.byteLength === byteLength`, and no two chunks share an
`ArrayBuffer`. The first draft of that test asserted the host's chunks fail an ownership predicate;
it failed, so the assertion could not have caught a missing copy on this host.

The copy is still right, and the test now pins what actually discriminates on every host: the emitted
payload is a plain `Uint8Array` and never the `Buffer` object the stream handed out, with the raw
spawn of the same child as the control proving the host's chunks are `Buffer`s. The ownership
predicate stays beside it as the invariant the copy guarantees regardless of how a given host
allocated a read, and the mutation half reads the whole backing buffer back after filling the chunk.
`SessionEventMap`'s remarks were reworded to state the plain-array property the test pins.

**The ended channel was not quiet on the write-callback path.** The guide's standing rule is that a
channel the package or a consumer ended stays quiet for its remaining life. `#failInputStream` read
`writableEnded`; `#failInputCallback`, which a write's own host callback reaches, did not. So a write
still pending when `end` closed the channel raised a `protocol` error event on the child's exit. The
failing-first proof and the fix are recorded under **Mutation and red-then-green evidence**.

## New fixture mode

One, in `tests/src/server/fixtures/child.mjs`: **`raw-echo`**. It echoes every stdin byte back to
stdout adding no terminator and decoding nothing, exits when the channel closes, and handles
`SIGTERM`. It carries both the byte-fidelity echo and the `end`-then-self-exit ending, and it is the
control for the `end`-leaves-the-child-live row. Every other case reuses an existing mode (`sleep`,
`orphan`, `chatty`, `evidence`, `exit`) or a `-e` child, which is the pattern the `Process` framing
rows already use for payloads the test declares.

## Mutation and red-then-green evidence

Each seeded defect was applied to an owned source file, measured with the same command, and reverted;
both seeded files were confirmed byte-restored by digest (`src/server/Session.ts`
`87cb7a765104c620`, `src/server/Supervisor.ts` `53c0c0869664a847`), and `guides/process.md` by digest
`7573b79bf8eca8b8`. Command:
`npx vitest run --config vite.config.ts --no-cache --reporter=dot --project src:server tests/src/server/Session.test.ts`,
and `npm run test:guides` for the last two rows.

| Family | Seeded defect | Reddened row | Count |
| ------ | ------------- | ------------ | ----- |
| Fidelity | `#publish` emits the host chunk instead of `new Uint8Array(chunk)` | `emits each stdout chunk as a plain owned array rather than the host buffer it read` | `1 failed \| 21 passed (22)` |
| Write | `write` appends `\n` before delivering, mimicking `send` | `echoes exactly the bytes written, appending no terminator` | `1 failed \| 21 passed (22)` |
| End | `#endInput` latches `#stopping`, making `end` a termination | `leaves the child running when the input channel closes`, `settles ending and exit when the child exits on its own after end, with no stop` | `2 failed \| 20 passed (22)` |
| Endings | `Session.ending` returns `engine.exit.then(...)`, collapsing the two endings | `settles ending at the native exit while exit waits on a descendant holding the pipe` | `1 failed \| 21 passed (22)` |
| Endings, guide claim | the same defect, against the guide's prose | `flagship fences > settles the ending a shutdown window should race before the exit that waits out drain` | `1 failed \| 105 passed \| 2 skipped (108)` |
| Documentation | the `Session` Entities row removed from `guides/process.md` | `Process > documents every barrel export` | `1 failed \| 105 passed \| 2 skipped (108)` |

**The genuine red-then-green repair.** The row `keeps an ended channel quiet when a pending write
later faults` was written before the guard existed and ran red:

- before: `1 failed | 21 skipped (22)` — `AssertionError: expected 1 to be +0`, the `protocol` error
  the ended channel should not have emitted;
- fix: the `writableEnded` guard added to `#failInputCallback`, with the now-redundant copy removed
  from `#failInputStream` so the rule has one home;
- after: `22 passed (22)`.

Its discriminating control is the sibling row `refuses the write and emits one protocol error when
the host reports a stdin fault` — the same child, the same unread payload, the same host fault,
differing only in whether `end` closed the channel first, and it records one error where the new row
records none.

## Commands, with real counts

Run in `C:\Users\mikes\WebstormProjects\process`, baseline `5fabc07`, clean at start.

| Command | Before | After |
| ------- | ------ | ----- |
| `npm run format:check` | not taken | `All matched files use the correct format.` (151 files) |
| `npm run lint:check` | not taken | exit 0 |
| `npm run check` | not taken | exit 0 |
| `npm run test:src:server` | 7 files; 147 passed \| 6 skipped (153) | 8 files; 169 passed \| 6 skipped (175) |
| `npm run test:src:server` (`Process.test.ts` alone) | 55 passed \| 2 skipped (57) | 55 passed \| 2 skipped (57) |
| `npm run test:src:server` (`Session.test.ts` alone) | — | 22 passed (22) |
| `npm run test:policy` | not taken | 93 passed (93) |
| `npm run test:guides` | 99 passed \| 2 skipped (101) | 106 passed \| 2 skipped (108) |
| `npm run test:setup` | not taken | 10 passed (10) |
| `npm run test:src:core` | not taken | 3 passed (3) |

The server project's total is the baseline `147` plus the new file's `22`, with the skip count
unchanged at `6`, so no `Process` row moved. The guides project gains the two rows this unit wrote
plus the five the parity loop generates for the new `SessionInterface` method group. `test:setup` and
`test:src:core` were run as observations because the fixture is shared, not because the brief listed
them; neither is mutating.

`npm run build` and the full `npm test` were not run, per the brief's scope.

## Working tree

`git status --porcelain`:

```text
 M guides/process.md
 M src/core/types.ts
 A src/server/Session.ts
 M src/server/Supervisor.ts
 M src/server/factories.ts
 M src/server/index.ts
 M tests/guides.test.ts
 A tests/src/server/Session.test.ts
 M tests/src/server/fixtures/child.mjs
```

`Session.ts` and `Session.test.ts` read `A` rather than `??` because `git add -N` was used to produce
the diffstat, exactly as P1a did. Both files are untouched on disk and nothing else is staged.
`src/server/Process.ts` and `tests/src/server/Process.test.ts` appear in neither list.

`git diff --stat`:

```text
 guides/process.md                   | 249 +++++++++++--
 src/core/types.ts                   | 236 +++++++++++++
 src/server/Session.ts               | 225 ++++++++++++
 src/server/Supervisor.ts            |  70 +++-
 src/server/factories.ts             |  24 ++
 src/server/index.ts                 |   1 +
 tests/guides.test.ts                |  86 ++++-
 tests/src/server/Session.test.ts    | 676 ++++++++++++++++++++++++++++++++++++
 tests/src/server/fixtures/child.mjs |   7 +
 9 files changed, 1530 insertions(+), 44 deletions(-)
```

## Guide parity

`guides/process.md` gains: the `Session` sentence in the header blockquote and the tier paragraph;
`createSession` in Factories; `Session` in Entities; `SessionEventMap`, `SessionOptions`, and
`SessionInterface` in Types; the Surface-notes sentence naming the session's readonly data properties
and why `ending` and `exit` are among them; a `#### SessionInterface` method table over `write`,
`end`, `stop`, `destroy`; a `### Byte sessions` subsection carrying the entity, its option table, the
two endings, the not-a-termination ruling, and one executable fence; the `end` and `ending` sentences
in `### The terminal moment`; the `write` and `end` passage in `### Standard input` beside `send`,
including why `ProcessInterface` carries no `end`; the cooperative-shutdown sentence in
`### Termination`; the `SessionEventMap` row and prose in `## Observing`; a
`### Close a byte session cooperatively` pattern; two Practices bullets; and the Tests entry.

`## Vocabulary` gains every row the naming ruling owed: `Session`, `Supervisor`, `ending` beside
`exit`, `end`, `write` beside `send`, `stdout` beside `stderr`, and the absent `backlog` and
`writable`.

`tests/guides.test.ts` gains the `Session` and `createSession` rows in the core face's refusal list,
the `SessionEventMap`, `SessionInterface`, and `SessionOptions` rows in the server face's, one
transcription of the byte-session fence, and one executed assertion behind the prose claim that a
shutdown window races `ending` rather than `exit` — the substring check sits beside it as the
presence guard, per the documentation rule that a prose claim about behaviour needs an assertion that
breaks when the claim goes false.

## Ancillary choices, recorded

- Engine `relieve` made optional rather than giving `Session` an empty method.
- Private `#end` renamed `#conclude`.
- The ended-channel `writableEnded` rule consolidated into `#failInputCallback`.
- `#endInput`'s completion callback is an inline arrow passed directly as an argument, which the
  nested-function law permits, rather than a bound private method that would exist only to resolve.
- `write` hands the caller's array to the host without copying it, and the TSDoc and the guide state
  the ownership window instead: the host can queue the payload, so the array is the channel's until
  the returned promise settles. A per-write copy would double the cost of the throughput case this
  face exists for, and the contract is stateable.
- Fixture mode named `raw-echo`; the multi-chunk, binary, and stdin-fault children are `-e` scripts
  the test derives from its own expectation, matching the `Process` framing rows.
- `### Byte sessions` placed before `### The terminal moment`, so both entities are introduced before
  the mechanics they share.

## Deviation state

No deviation. No `Process` behaviour had to change, the seam carried every ruled member with no
public leak, and no ruled name collided. The `Supervisor` edits were authorised by the brief's
ownership of that file per P1a's flag.

## For the orchestrator

- The `#failInputCallback` guard is a behaviour change inside the shared engine. It is unreachable
  from `Process` — a `Process` write callback exists only for `deliver`, and a `Process` channel sets
  `writableEnded` only when `writable !== true`, where `deliver` already refuses at `!stdin.writable`
  — and the unmodified `Process` suite is green at its baseline. An auditor may want that reachability
  argument checked independently.
- The measured host reading in the ownership test (Node v24.19.0, Windows, 2026-08-27) is recorded in
  this report and in the test's own comment. It is not written into the guide, because the guide's
  claim is the contract the copy provides rather than the host allocation behind it.
