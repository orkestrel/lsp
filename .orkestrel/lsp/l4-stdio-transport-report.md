# L4 report — stdio transport and host receipts

Date: 2026-08-26. Unit: L4, `implementer`, Opus 5, native, on the host, in `/home/user/lsp` from
the committed `88c01f1` baseline. Brief: `/home/user/scaffold/tmp/units/l4-stdio-transport-brief.md`.

The server environment carries `StdioTransport` over `LSPTransportInterface`, proven on the host
against a spawned protocol-faithful peer and against the workspace's own Oxlint `--lsp` mode. Every
required gate exits 0. No deviation trigger fired.

## The declared contract

`src/server/types.ts` declares `StdioTransportOptions` exactly as ruling 10 fixes it:

```ts
export interface StdioTransportOptions {
	readonly server: {
		readonly command: readonly string[]
		readonly directory?: string
		readonly environment?: Readonly<Record<string, string | undefined>>
	}
	readonly grace?: number
}
```

Decisions the brief left to this unit, each recorded in the type's own TSDoc and in `guides/lsp.md`:

- `command` is the argument vector, not a bare string. Its first element names the executable and
  the rest are its arguments. The Oxlint receipt is the case that settles it: the child is
  `node <oxlint entry> --lsp`, which a single string could carry only through shell splitting.
- `directory` is the child's working directory, and the current one applies when it is absent.
- `environment` is the child's complete environment, and this process's environment applies when it
  is absent. The transport copies and freezes the record it receives.
- `grace` defaults to `5000` milliseconds, following the `timeout` precedent in
  `src/core/LSPClient.ts:107`.
- The options carry no `on` or `error` hooks. Ruling 10 fixes the shape, the event map is
  `LSPTransportEventMap` in core rather than an entity map this class owns, and no event can fire
  before `start` is called, so the emitter getter is reachable in time for every subscription. The
  only real consumer, `LSPClient`, subscribes through `transport.emitter.on` in its constructor
  (`src/core/LSPClient.ts:112-114`). The stateful-emitter pattern's hook rows are therefore
  unreachable capability here, and the creation gate refuses them.

## The reconnect stance

**The transport reconnects.** Each `start` spawns a fresh child. After `close` resolves, or after
the child exits on its own and the transport emits `exit`, a further `start` call spawns a new one.
A `start` call made while a child is still live is refused with an `LSPError` coded `duplicate`.

This is the stance `LSPTransportInterface`'s remark admits ("the client may call `start` again only
after `close` resolves or the transport emits `exit`") rather than the non-reconnecting alternative
it also admits. The design record's exclusion table names the reason: the automatic restart policy
is excluded because "`start` after exit stays the mechanism", which requires the transport to honour
a later `start`. `duplicate` is the code because a live child is a duplicate live thing, and ruling
11 reserves `spawn` for spawn failures.

## Termination path

`close` ends the child's input stream, awaits `waitForExit(child, grace)`, and hands a child still
live after that window to `stopChild(child, grace, grace)`. `resolveExecutable` resolves the command
file before the spawn. Those are the only `@orkestrel/process` imports in the diff:

```
src/server/transports/StdioTransport.ts:7:import { resolveExecutable, stopChild, waitForExit } from '@orkestrel/process/server'
```

`killTree` is reached through `stopChild`, which owns the Windows tree kill; calling it beside
`stopChild` would duplicate that escalation. The line-oriented `Process`, `lines`, and `send`
surfaces appear nowhere:

```
$ grep -rnE "\b(Process|lines)\b" src/server tests/src/server tests/setupServer.ts
none
```

The child is not detached, so it stays in this process's group and `stopChild` reaches it through a
direct signal after the host reports that no group owns its identifier. That is recorded in the
class TSDoc and in the guide.

## Touched files

| File | Change |
| --- | --- |
| `src/server/types.ts` | New. `StdioTransportOptions` as ruled, with the reconnect stance, the `grace` deadline, and the termination path in its TSDoc. |
| `src/server/transports/StdioTransport.ts` | New. The transport class, in the `transports/` extension-category folder. |
| `src/server/factories.ts` | New. `createStdioTransport`. |
| `src/server/index.ts` | The server barrel now star-exports types, factories, and the class. |
| `tests/setupServer.ts` | New content. Fixture paths, option builders, the Oxlint workspace data, the peer message readers, the host process-table readings, and the reap wait. |
| `tests/src/server/fixtures/peer.mjs` | New. The spawned protocol-faithful peer. |
| `tests/src/server/transports/StdioTransport.test.ts` | New. Eleven transport rows. |
| `tests/src/server/factories.test.ts` | New. The factory round trip. |
| `tests/src/server/integration.test.ts` | New. The live Oxlint receipt. |
| `tests/src/server/index.test.ts` | Pins the real barrel instead of an empty one. |
| `guides/lsp.md` | The `## Stdio transport` section, the `### StdioTransport` methods table, and the server surface table. |
| `guides/README.md` | The `src/server` directory row points at `lsp.md#stdio-transport`, a section that exists. |

Placement decisions inside the owned set:

- `transports/StdioTransport.ts` follows the extension-category rule in
  `.claude/rules/architecture.md`: a designed growth seam gets its category folder even with one
  concrete class.
- The Oxlint receipt sits at `tests/src/server/integration.test.ts`. `integration.test.ts` is a
  reserved filename at any level, scoped to its directory, and the `src:server` glob
  (`vite.config.ts:88-89`) collects it exactly once. A root `tests/integration.test.ts` would sit in
  no registered project and would therefore never execute.
- The fixture peer is a `.mjs` file, because it is spawned by the host as a real child and no
  TypeScript loader is in that path. It lives under `tests/src/server/fixtures/`, which the project
  glob does not collect as a test and the placement sweep's `{app,src}/**` population does not reach.

## Diffstat and status

```
$ git diff --stat
 guides/README.md               |   2 +-
 guides/lsp.md                  |  58 ++++++++++++++
 src/server/index.ts            |   3 +
 tests/setupServer.ts           | 177 +++++++++++++++++++++++++++++++++++++++++
 tests/src/server/index.test.ts |   4 +-
 5 files changed, 241 insertions(+), 3 deletions(-)

$ git status --porcelain
 M guides/README.md
 M guides/lsp.md
 M src/server/index.ts
 M tests/setupServer.ts
 M tests/src/server/index.test.ts
?? src/server/factories.ts
?? src/server/transports/
?? src/server/types.ts
?? tests/src/server/factories.test.ts
?? tests/src/server/fixtures/
?? tests/src/server/integration.test.ts
?? tests/src/server/transports/
```

The untracked paths carry the new source and tests. Their sizes:

```
$ wc -l src/server/types.ts src/server/factories.ts src/server/transports/StdioTransport.ts \
    tests/src/server/factories.test.ts tests/src/server/integration.test.ts \
    tests/src/server/transports/StdioTransport.test.ts tests/src/server/fixtures/peer.mjs
   29 src/server/types.ts
   20 src/server/factories.ts
  169 src/server/transports/StdioTransport.ts
   39 tests/src/server/factories.test.ts
   60 tests/src/server/integration.test.ts
  248 tests/src/server/transports/StdioTransport.test.ts
  100 tests/src/server/fixtures/peer.mjs
  665 total
```

## Gate readings

```
$ npm run format:check   → exit 0
$ npm run lint:check     → exit 0
$ npm run check          → exit 0
$ npm run test:src:server
 Test Files  4 passed (4)
      Tests  15 passed (15)
$ npm run test:src:core
 Test Files  5 passed (5)
      Tests  77 passed (77)
```

`npm run test:src:core` was green at the same counts on the `88c01f1` baseline before any edit, and
the core suite is untouched by this diff.

Observation, not a criterion: `npm run build` exits 0. The emitted server entry externalizes core
correctly — `dist/src/server/index.js` line 2 is
`import { LSPError } from "../core/index.js";`, and `dist/src/server/index.d.ts` imports
`LSPTransportInterface` from `@orkestrel/lsp`. The authoritative tree-wide sweep belongs to
`verifier`.

## The live Oxlint receipt

`tests/src/server/integration.test.ts` drives `oxlint --lsp` version 1.80.0 through `LSPClient` over
`StdioTransport` in a scratch workspace seeded with `.oxlintrc.json` pinning `no-debugger: error`
and `main.js` containing `debugger\n`. The row asserts what the real server returned:

```
✓ |src:server| tests/src/server/integration.test.ts > src server oxlint receipt >
  reads a real Oxlint diagnostic through the client and leaves no child behind 127ms
```

The values it pins, each read through the public API:

| Reading | Value |
| --- | --- |
| `client.capabilities?.textDocumentSync` | `{ openClose: true, change: 1, save: { includeText: false } }` |
| `client.encoding` | `'utf-16'` |
| new children of the test process after `start` | exactly one |
| `diagnostics.length` | `1` |
| `diagnostics[0].code` | `'eslint(no-debugger)'` |
| `diagnostics[0].severity` | `1` |
| `diagnostics[0].range` | `{ start: { line: 0, character: 0 }, end: { line: 0, character: 8 } }` |
| the recorded child pid after `destroy` | `isRunning(pid)` is `false` |

Oxlint publishes no `diagnosticProvider`, so the client takes the push path and reads the diagnostic
from `textDocument/publishDiagnostics`. The raw server payload behind those assertions, captured
from a host probe against the same workspace shape before the row was written:

```json
{"jsonrpc":"2.0","method":"textDocument/publishDiagnostics","params":{"uri":"file:///tmp/oxprobe-SNPqm2/main.js","diagnostics":[{"range":{"start":{"line":0,"character":0},"end":{"line":0,"character":8}},"severity":1,"code":"eslint(no-debugger)","codeDescription":{"href":"https://oxc.rs/docs/guide/usage/linter/rules/eslint/no-debugger.html"},"source":"oxc","message":"`debugger` statement is not allowed\nhelp: Remove the debugger statement","relatedInformation":[{"location":{"uri":"file:///tmp/oxprobe-SNPqm2/main.js","range":{"start":{"line":0,"character":0},"end":{"line":0,"character":8}}},"message":""}]}],"version":1}}
```

The same probe recorded that Oxlint answers `shutdown` with `{"result":null}` in 4 ms and exits `0`
on both the protocol `exit` notification and a plain stdin close, which is why the client's teardown
completes inside the receipt's budget and why the cooperative half of the termination path is the
one Oxlint takes.

### How the child identifier is recorded

Oxlint reports no process identifier over the protocol and the transport publishes none, so the
receipt reads the host process table: `readChildProcesses(process.pid)` in `tests/setupServer.ts`
runs `ps -A -o pid=,ppid=` twice and intersects the readings, because reading the table costs a child
of its own that appears in its own output. The receipt takes a baseline before `start`, takes the
difference after `start`, and asserts that difference has exactly one member.

The alternative was a `pid` getter on `StdioTransport`. It was refused: the published surface stays
exactly what ruling 10 and ruling 4 fix, and a getter whose only consumer is a test is speculation
the creation gate forbids.

The limit this carries, recorded rather than hidden: the reading depends on a host `ps`. On a host
without one the receipt fails loudly with the host's own error naming the missing mechanism, rather
than skipping. The fixture rows do not share this limit — the peer reports its own identifier over
the protocol.

## Row proofs

Each behavioural row pins built behaviour, so each carries mutation evidence: the load-bearing
production text is disabled, the scoped project is run, the pristine bytes are rewritten, and `cmp`
proves the restoration. The runner is `tmp/scratch/mutate.py` and its record is
`tmp/scratch/mutations.json`. The command under every row is:

```
npm run test:src:server
```

Green baseline for every row: `Tests 15 passed (15)`, exit 0.

| Mutation | Disabled production text | Red reading | Row that reddened | Restored |
| --- | --- | --- | --- | --- |
| M1a | the empty-command throw's `code: 'spawn'` → `'closed'` | `1 failed \| 13 passed (14)` | rejects an empty command as a spawn failure | `cmp` identical |
| M1b | the spawn-race rejection's `code: 'spawn'` → `'closed'` | `1 failed \| 13 passed (14)` | rejects an executable the host cannot launch as a spawn failure | `cmp` identical |
| M2 | `#live()` returns false | `1 failed \| 13 passed (14)` | refuses a second start while its child is live | `cmp` identical |
| M9 | `#live()` returns true | `13 failed \| 1 passed (14)` | starts a fresh child after close resolves and after an unprompted exit | `cmp` identical |
| M3a | the stdout listener accumulates and re-emits the join | `2 failed \| 12 passed (14)` | delivers a frame split across host reads without joining the chunks | `cmp` identical |
| M3b | the stdout listener emits one byte per event | `3 failed \| 11 passed (14)` | delivers coalesced frames as the single chunk the host read | `cmp` identical |
| M4 | `stdin.end()` removed from `close` | `7 failed \| 7 passed (14)` | ends a cooperative child and surfaces its real exit | `cmp` identical |
| M5 | the `stopChild` escalation removed from `close` | `1 failed \| 13 passed (14)` | kills a child that outlives its grace window and leaves no process behind | `cmp` identical |
| M6 | the `close`-event emit removed from `#observe` | `5 failed \| 9 passed (14)` | emits the exit a child reports when it ends unprompted | `cmp` identical |
| M7 | the child guard removed from `send` | `2 failed \| 12 passed (14)` | resolves send as false before the first start and after close resolves | `cmp` identical |
| M8 | the `cwd` spread removed from the spawn options | `1 failed \| 13 passed (14)` | carries the configured directory and environment into the child | `cmp` identical |
| M10 | `stdin.write` replaced with `resolve(true)` | `9 failed \| 5 passed (14)` | reads a real Oxlint diagnostic through the client and leaves no child behind | `cmp` identical |

The mutation pass ran against the fourteen rows that existed at the time; a fifteenth row was added
afterwards from a control finding, and its own control is recorded in the next section. M9 reddens
every row rather than one, because a `#live()` that always answers true refuses every `start`; it
is coarse evidence, and the row it names is the one the claim belongs to.

Rows whose evidence is the mutation table:

- start rejects an empty command coded `spawn` (M1a).
- start rejects a host spawn fault coded `spawn` (M1b).
- start refuses a second call while the child is live, coded `duplicate` (M2).
- a frame split across host reads arrives unjoined (M3a). The row asserts the stronger form: the
  first chunk after the ready frame decodes to no messages on its own, and the concatenation decodes
  to exactly the one report.
- coalesced frames arrive as the single chunk the host read (M3b). The row asserts that one recorded
  chunk decodes to both reports.
- `close` ends a cooperative child and the transport surfaces `{ code: 0, signal: null }` (M4).
- `close` kills a child that outlives its grace window, emitting `{ code: null, signal: 'SIGKILL' }`
  after at least the configured window, and leaves the recorded pid free (M5).
- the transport emits the exit a child reports when it ends unprompted, `{ code: 7, signal: null }`
  (M6).
- `send` resolves `false` before the first `start` and after `close` resolves (M7).
- the configured `directory` and `environment` reach the child (M8).
- `start` after `close` and `start` after an unprompted exit each spawn a child with a different
  identifier (M9).
- the Oxlint receipt round-trips real bytes through the real child (M10).

## Instrument controls

Two instruments carry the unit's claims: the scoped typecheck and the scoped suite. Each was shown
able to fail. The runner is `tmp/scratch/controls.py`.

The first control attempt is recorded because it failed to fail. Replacing
`...(directory === undefined ? {} : { cwd: directory })` with `cwd: directory` left
`npm run check:src:server` at exit 0, because Node declares `SpawnOptions.cwd` as
`string | URL | undefined` and `exactOptionalPropertyTypes` admits an explicit `undefined` there.
The instrument had measured nothing, so a second control was drawn against a declaration where the
setting binds — `ExecutableOptions.workspace?: string` in `@orkestrel/process`:

```
== C1-workspace-explicit-undefined exit 2
src/server/transports/StdioTransport.ts(144,29): error TS2379: Argument of type
'{ environment?: Readonly<Record<string, string | undefined>>; workspace: string | undefined; }'
is not assignable to parameter of type 'ExecutableOptions' with 'exactOptionalPropertyTypes: true'.
restored: identical
```

The second control replaced `...(environment === undefined ? {} : { env: { ...environment } })` with
an unconditional `env: { ...environment }`, which hands every unconfigured child an empty
environment. The first run of that control found nothing to redden, which named a real coverage gap:
no row pinned the documented default that an absent `environment` inherits this process's
environment. The row `gives the child this process environment when the options configure none` was
added, and the control then reddened exactly it:

```
== C2-unconditional-environment exit 1
      Tests  1 failed | 14 passed (15)
failing rows: ['gives the child this process environment when the options configure none']
restored: identical
```

Coverage this states and does not overstate: the mutation table covers the transport's own control
flow, one production edit at a time, measured by the `src:server` project alone. It says nothing
about the core suite, about a Windows host, or about a language server that neither the fixture peer
nor Oxlint resembles.

## Claims reserved for the Orchestrator's `prove` instrument

None. Every TypeScript claim this unit rests on names its project and was settled by running that
project's own scoped check with a negative control that failed at the check stage (C1). Every
behavioural claim was settled by an executed test with a mutation control. No claim remains that
carries a stated belief the `prove` tool's stages model and this unit could not run.

## What the unit did not close

- `guides/lsp.md` carries the minimal honest server rows the brief scoped: the `## Stdio transport`
  section, the `### StdioTransport` methods table, and the server surface table. The full guide
  extension and the exclusions table stay with the L6 guide unit, and there is no
  `tests/guides.test.ts` in the tree yet, so guide parity has no gate. L6 owns that.
- The `### StdioTransport` methods table is keyed by a class name rather than an interface name.
  `.claude/rules/documentation.md` fixes one method table per interface; the class exposes exactly
  the `LSPTransportInterface` call signatures, and the table exists because this implementation's
  behaviour column differs materially from the generic one. If L6's parity test keys tables to
  interface names, that unit should fold this table into prose.
- Windows is untested for the receipt's process-table reading, stated in full earlier.

## Scratch artifacts

Under `/home/user/lsp/tmp/scratch/`, for retention by the Orchestrator:

- `mutate.py`, `mutations.json` — the mutation runner and its record.
- `controls.py`, `typecheck-control.py` — the instrument controls, including the one that failed to
  fail.
- `oxprobe.mjs`, `oxexit.mjs`, `oxshutdown.mjs` — the host probes that established Oxlint's
  capabilities, its diagnostic payload, and its termination behaviour before the receipt was written.
- `pristine/` — the byte copies each restoration was proven against with `cmp`.
