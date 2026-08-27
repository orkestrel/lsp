# L1 report — `Session` adopted in lsp's `StdioClientTransport`

## Outcome

Done. Every acceptance criterion is met. No behavioral test row changed, and no internals row changed
either: the suite is byte-identical to the baseline and green at the same count, so the whole
adoption is proved by rows written against the direct-spawn implementation.

Three findings the unit settled rather than assumed sit under **What measurement changed**:
`SessionOptions.workspace` is required where the map assumed it optional, one mapping the map calls a
correctness trap cannot fire in this implementation, and two guards the diff carries are unreachable
from the current fixtures.

## Confirmations taken before editing

- `node_modules/@orkestrel/process/dist/src/server/index.d.ts:174` declares
  `createSession(options: SessionOptions): SessionInterface`, and `index.d.ts:792` declares the
  `Session` class. The installed `package.json` reads `"version": "0.0.6"`; the tarball-swap record
  names that build as the packed `b07ba7f` tree, which is what carries `createSession`.
- Baseline `8307f2c`, `git status --porcelain` empty at start.

## The mapping as landed

| Documented obligation | The code that now carries it |
| --------------------- | ---------------------------- |
| Child command is the `server.command` vector, first element the executable | `#open` destructures in `start`, passes `command: { file, arguments: parameters }` |
| `server.directory` is the working directory; the current one applies when absent | `workspace: directory ?? process.cwd()` in `#open` |
| `server.environment` is the child's COMPLETE environment | `...(environment === undefined ? {} : { environment, isolated: true })` in `#open` |
| The frozen option copy reaches the spawn, not a later caller mutation | constructor unchanged: `Object.freeze({ ...options.server.environment })` |
| `close` ends input cooperatively, terminating nothing | `await Promise.race([session.end(), cooperative])` in `#settle` |
| `close` waits `grace` for the child's own ending | `await Promise.race([session.ending, cooperative])`, one shared `waitForDeadline(this.#grace)` |
| A child alive past `grace` is signalled and killed | `await session.stop()`, with `grace: this.#grace` passed at construction |
| An unconfirmed stop rejects `timeout` and leaves the generation unretired | `if (!stopped) throw new LSPError(..., { code: 'timeout' })`, plus the `#closing` guard in `#conclude` |
| The wait for the child's stdio close is bounded by `grace` | `drain: this.#grace` at construction, then `await session.exit` |
| A second `close` settles on the same termination | `#closing` barrier, unchanged |
| `exit` fires once per generation, carrying `{ code, signal }` | `#conclude` → `#retire`, and `#settle` → `#retire`; `ProcessExit.drained` is dropped at the boundary |
| `send` resolves `false` before the first `start`, after `close`, and after the child exits | `send` reads `session.code`/`session.signal`, then `await session.write(bytes)` |
| `chunk` carries every stdout chunk with the host's own boundaries | `on.stdout: this.#deliver.bind(this, generation)` |
| `error` carries a child fault | `on.error: this.#report.bind(this, generation)` |
| Standard error cannot fill its pipe and stall | the session reads stderr from the spawn and retains a bounded tail; the transport's `resume()` drain is deleted |
| Retired generations reach no listener | `#owns(generation)` gates `#deliver`, `#report`, and `#conclude`; `#retire` keeps its own counter guard |
| `pid` is the current generation's child, else `undefined` | `this.#owner === this.#generation ? this.#session?.pid : undefined` |
| `start` rejects `spawn` for an empty command | unchanged pre-spawn refusal |
| `start` rejects `spawn` when the host refuses the spawn | `createSession` throw wrapped by `#open`; an absent `session.pid` routed to `#refuse` |
| `start` rejects `duplicate` inside the unsettled window | unchanged owner-versus-generation refusal |
| No `node:child_process`, `buildSpawn`, `stopChild`, `waitForExit`, `waitForClose` | deleted; the transport imports `createSession` alone from `@orkestrel/process/server` |

Deleted with them: `#launch` and `#observe`. Added: `#open`, `#refuse`, `#owns`, `#conclude`.

## Test rows changed

None. `tests/src/server/transports/StdioClientTransport.test.ts`, `tests/src/server/integration.test.ts`,
and `tests/setupServer.ts` appear in no diff. No import had to follow, because the transport's public
surface did not move.

The rows that stood unmodified and green, all of them:

- `rejects an empty command as a spawn failure`
- `rejects an executable the host cannot launch as a spawn failure`
- `refuses a second start while its child is live`
- `refuses a start issued while a close is still in flight`
- `settles a concurrent close on the same termination the first close awaits`
- `delivers a frame split across host reads without joining the chunks`
- `delivers coalesced frames as the single chunk the host read`
- `carries the configured directory and environment into the child`
- `gives the child this process environment when the options configure none`
- `reports the host identifier of the child owning the current generation`
- `resolves send as false before the first start and after close resolves`
- `ends a cooperative child and surfaces its real exit`
- `kills a child that outlives its grace window and leaves no process behind`
- `emits the exit a child reports when it ends unprompted`
- `starts a fresh child after close resolves and after an unprompted exit`
- `keeps a retired generation off the emitter while a grandchild holds its output`
- `refuses a replacement while a natively exited child still owns its generation`
- `reads a real Oxlint diagnostic through the client and leaves no child behind` (integration)

## What measurement changed

**`SessionOptions.workspace` is required, not optional.** The adoption map reads "`workspace:
server.directory` when present", but `node_modules/@orkestrel/process/dist/src/core/index.d.ts:925`
declares `readonly workspace: string`, and the engine's own `validateText(workspace, 'workspace',
true)` refuses an empty one. Passing `undefined` needs an assertion, which is banned. The transport
passes `process.cwd()` when `server.directory` is absent. That is behaviourally identical to the
deleted code: `buildSpawn` already resolved an absent workspace as `options?.workspace ??
process.cwd()` (built bundle line 280), and a `spawn` with no `cwd` inherits this process's
directory. The package's own guide fences pass `workspace: process.cwd()` for the same case. The
`gives the child this process environment when the options configure none` row spawns with no
directory and stays green.

**Racing `exit` instead of `ending` cannot fire the trap the D3 ruling names, in this
implementation.** The ruling's reason for `ending` is that a transport racing `exit` "falsely
escalates on a child that already self-exited". `#settle` decides escalation from the terminal facts
(`session.code === null && session.signal === null`), not from which promise won, so a child that
already exited is never escalated whichever promise is raced. The mutation probe below confirms it:
substituting `session.exit` left the suite at `20 passed (20)`. `ending` is kept because it is the
ruled mapping and it is strictly the tighter latency, but no transport-level claim discriminates the
two, so the suite cannot guard the choice and no row was invented to pretend otherwise.

**Two guards in the diff are unreachable from the current fixtures.** Both are preserved behaviour
rather than new behaviour, and both are recorded here so an auditor does not read them as proven:

- `send`'s `session.code !== null || session.signal !== null` reading. Removing it left the suite
  green, because both fixtures' children close their stdin read end when they exit, so
  `session.write` already refuses. It is kept because it is exactly the check the deleted `send`
  made, and a real server whose helper inherited stdin would keep the channel writable past the
  child's exit and falsify the documented "`send` … resolves `false` … after the child exits".
- the `generation === this.#generation` half of `#owns`. Removing it left the suite green, because
  every fixture path that retires a generation calls `start` before the retired child can speak
  again, which moves `#owner` too. It is the guard the deleted code used, and it is what covers the
  window between a retirement and the next `start`.

## Mutation and red-then-green evidence

There is no failing-first row, because this unit repairs no defect: it is an adoption whose
acceptance is that the existing rows keep passing. The instrument is proved by seeding defects into
the owned source instead. Command for every row:
`npm run test:src:server`. Each seeded defect was applied, measured, and reverted; the file was
confirmed byte-restored by digest `dfb327641ab64ff06746549eb98805d603cb7567f063e807de22dc76fb904af4`
after every revert.

| Seeded defect | Reddened row | Count |
| ------------- | ------------ | ----- |
| `#settle` drops `#retire`, leaving the terminal moment to the event | the reporter named `kills a child that outlives its grace window and leaves no process behind`, `starts a fresh child after close resolves and after an unprompted exit`, and `keeps a retired generation off the emitter while a grandchild holds its output` in its last three failures; the earlier failures scrolled | `7 failed \| 13 passed (20)` |
| `#open` passes `environment` without `isolated: true` | `carries the configured directory and environment into the child` | `1 failed \| 19 passed (20)` |
| `send` delegates to `session.write` with no terminal-facts reading | none | `20 passed (20)` |
| `#settle` races `session.exit` instead of `session.ending` | none | `20 passed (20)` |
| `#owns` drops its current-generation half | none | `20 passed (20)` |

The lint gate carries its own control: `oxlint` prints nothing on a clean tree, so a scratchpad file
carrying a `const` reassignment was linted with the same config and reported
`error eslint(no-unused-vars)` and `error eslint(no-const-assign)`, exit `1`. The clean run's exit `0`
is therefore a reading rather than a silent pass.

## Commands, with real counts

Run in `C:\Users\mikes\WebstormProjects\lsp`, baseline `8307f2c`, clean at start. Windows 11,
Node v24.19.0, 2026-08-27.

| Command | Before | After |
| ------- | ------ | ----- |
| `npm run format:check` | not taken | `All matched files use the correct format.` (154 files), exit 0 |
| `npm run lint:check` | not taken | exit 0 |
| `npm run check:src:server` | not taken | exit 0 |
| `npm run test:src:server` | 4 files; `20 passed (20)` | 4 files; `20 passed (20)` |
| `npm run test:guides` | not taken | 1 file; `27 passed (27)` |
| `npm run test:conformance` | not taken | 1 file; `243 passed (243)` |

`npm run build`, the full `npm test`, `format`, and `lint --fix` were not run, per the brief's scope.

Acceptance criterion 2, read bare:
`grep -rn "child_process\|buildSpawn\|stopChild\|waitForExit\|waitForClose" src/server` prints
nothing.

## Ancillary choices, recorded

- **One shared `grace` deadline bounds the whole cooperative phase.** The map reads
  `await session.end()` then race `ending`. `end` resolves after the host flushes writes it already
  accepted, so a child that stops reading its input could hold that await open with no bound, and the
  documented "waits `grace`" would stop being true. `#settle` arms one `waitForDeadline(this.#grace)`
  and races it against `end()` and then against `ending`. The deleted code paid nothing for
  `stdin.end()` because it never awaited it, so this is the strictly bounded form of the same window.
- **A close in flight owns its generation's retirement.** `session.stop()` reaches the terminal
  moment and emits `exit` even when the termination went unconfirmed, so an unguarded `exit` listener
  would retire the generation and release the refusal window that a `timeout`-coded close is
  documented to keep open. `#conclude` returns while `#closing` is set, and `#settle` retires
  explicitly after `await session.exit`.
- **The session's listeners are installed through `SessionOptions.on` rather than after
  construction.** The spawn is eager and the engine attaches its own stdout consumer in the
  constructor, so hooks installed with the spawn are the form with no window at all. They are bound
  private methods (`this.#deliver.bind(this, generation)`), not in-body function expressions.
- **A refused spawn stays off the emitter.** `#owns` requires ownership, and `start` takes ownership
  only after reading `session.pid`, so the host's refusal reaches no `error` listener — matching the
  deleted code, where `#observe` never ran on that path. `#refuse` collects the cause through its own
  one-shot listener instead, bounded by `session.ending` rather than by a second timer, because the
  engine registers the child's `error` handler before its `close` handler.
- **The transport's TSDoc process-group sentence was inverted rather than deleted.** The engine
  spawns with `detached: process.platform !== 'win32'` (built bundle line 801) and signals `-pid`
  (line 528), so the child now leads its own group on POSIX and the group receives the signals;
  Windows keeps the `taskkill` tree kill. The guide and `src/server/types.ts` carry the same
  correction.
- **The stderr sentence was reworded to retention**, in the class TSDoc and in the guide: the session
  reads stderr from the spawn and retains a bounded tail, which is what keeps a chatty server from
  filling its pipe now that the transport's `resume()` drain is gone.
- **`ProcessExit.drained` is dropped at the transport boundary.** `#retire` receives an explicit
  `LSPExit` literal, so the `exit` event payload stays exactly `{ code, signal }`.

## Working tree

`git status --porcelain`:

```text
 M guides/lsp.md
 M src/server/transports/StdioClientTransport.ts
 M src/server/types.ts
```

`git diff --stat`:

```text
 guides/lsp.md                                 |  26 ++--
 src/server/transports/StdioClientTransport.ts | 183 ++++++++++++++------------
 src/server/types.ts                           |  10 +-
 3 files changed, 120 insertions(+), 99 deletions(-)
```

`package.json` and `package-lock.json` are untouched. No test file and no `src/core` file appears.

## Deviation state

No deviation. No documented behavioural claim had to change, no behavioural test row had to change,
and the session contract carried every member the map required. The one place the map and the
installed declaration disagreed — the optionality of `workspace` — is recorded under **What
measurement changed** and resolved without altering any documented behaviour.

## For the orchestrator

- The `send` liveness reading and the `#owns` current-generation half are preserved-but-unproven
  guards. Both were proven load-bearing in the deleted implementation only by inspection, and neither
  is discriminated by the current fixtures. Closing them needs a fixture whose child hands stdin to a
  grandchild, which is a successor unit rather than this one.
- `session.stop()` now passes the package's fixed `PROCESS_CONFIRMATION` (5000 ms) as its
  confirmation window, where the deleted call passed `this.#grace`. Nothing documents that window,
  and the `kills a child that outlives its grace window` row asserts a lower bound, so no claim moved.
  It does mean a `grace` below 5000 ms no longer shortens the unconfirmed-kill wait.
- Every reading here is from this Windows host on 2026-08-27. The POSIX half of the process-group
  sentence is read from the installed bundle's source, not from a POSIX run.
