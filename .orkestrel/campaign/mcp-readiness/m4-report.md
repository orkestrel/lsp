# M4 report — the stdio ingress contract is named

`createStdioServer` now returns the declared `StdioServerInterface`. No anonymous object type
remains in its signature. Scoped gates are green. No deviation.

## Touched files

| File                     | Change                                                                                   |
| ------------------------ | ---------------------------------------------------------------------------------------- |
| `src/server/types.ts`    | Declares `StdioServerInterface` beside `StdioServerOptions`, with the file's `@remarks` voice. |
| `src/server/factories.ts` | Imports the type, returns it, and rewrites the `@returns` tag to name it.                |
| `guides/mcp.md`          | Adds the Types row and the `## Methods` entry; the Factories row names the returned contract. |

```text
 guides/mcp.md           | 37 +++++++++++++++++++++++++++++++++----
 src/server/factories.ts |  6 ++++--
 src/server/types.ts     | 24 ++++++++++++++++++++++++
 3 files changed, 61 insertions(+), 6 deletions(-)
```

## The declaration as landed

```ts
/**
 * The stdio INGRESS handle {@link import('./factories.js').createStdioServer} returns — arms
 * and tears down the newline-delimited JSON-RPC pump over the {@link StdioServerOptions}
 * stream pair.
 *
 * @remarks
 * - `start()` — arm the pump: subscribe to `input`, and dispatch every complete line through
 *   the bound {@link import('@src/core').MCPDispatcherInterface}, writing each defined
 *   response back to `output`. The subscriptions are attached by the time the call returns.
 *   The pump arms ONCE, so a repeated `start()` attaches nothing further and an inbound
 *   request still draws exactly one reply.
 * - `stop()` — unbind the pump and close the transport: the listeners `start()` put on
 *   `input` / `output` are removed, every pending `send` rejects, and `input` is released so
 *   the process can exit. The release is complete by the time the call returns, and a
 *   repeated `stop()` does nothing.
 * - **One lifetime per handle.** `stop()` ends it permanently: a `start()` issued afterwards
 *   arms nothing, and serving again takes a fresh
 *   {@link import('./factories.js').createStdioServer} over a live stream pair.
 */
export interface StdioServerInterface {
	start(): void
	stop(): void
}
```

The factory's signature is now `): StdioServerInterface {` and its `@returns` reads
`A {@link StdioServerInterface} handle to arm / tear down the pump; `stop()` ends that
handle's lifetime permanently`.

### How the documented behavior was established

Every claim in that TSDoc was run before it was written, through the `probe` workbench
(`tmp/probe/stdioHandle.test.ts`, `npm run test:probe`, 3 passed, 2026-08-27):

- `arms once however many times start is called` — a repeated `start()` still yields exactly one
  reply line for one inbound request.
- `does not re-arm after stop` — a request written after `stop(); start()` draws no line.
- `takes effect synchronously on start and stop` — `input`'s `data` listener count reads
  `[0, 1, 0]` across construction, `start()`, and `stop()`.

The repeated-`stop()` case was already pinned by the shipped test
`stop() returns synchronously and releases only the factory-owned input listeners`
(`tests/src/server/factories.test.ts:881`).

## The guide rows

`### stdio transport → #### Factories`, the `createStdioServer` row now reads:

```text
| `createStdioServer` | function | Pipes an `MCPDispatcherInterface` (through `bindServer`) over newline-delimited JSON-RPC on `stdin`/`stdout` (or injected streams), returning a `StdioServerInterface`; `stop()` unbinds the pump, drops every listener the transport put on `input`, and releases `input` so the process can exit. |
```

`### stdio transport → #### Types`, inserted between `StdioClientTransportOptions` and
`StdioServerOptions`:

```text
| `StdioServerInterface` | interface | `{ start(): void; stop(): void }` — the ingress handle `createStdioServer` returns. `start()` arms the pump ONCE, so a repeat attaches nothing further; `stop()` unbinds it and closes the transport, and ends that handle's lifetime permanently — a `start()` after it arms nothing, and serving again takes a fresh `createStdioServer`. Its methods are under [Methods](#methods). |
```

`## Methods`, a new `#### `StdioServerInterface`` at the section's end, in the shape every
other entry there uses — a paragraph, one method table keyed by the backticked interface
name, and a worked `ts` fence:

```text
| `start` | `void`  | Arm the pump: subscribe to `input` and dispatch every complete line through the bound `MCPDispatcherInterface`, writing each defined response back to `output`. The pump arms ONCE, so a repeat attaches nothing further. |
| `stop`  | `void`  | Unbind the pump and close the transport: drop the listeners `start()` put on `input` / `output`, reject every pending `send`, and release `input` so the process can exit. A repeat does nothing, and neither does a later `start`. |
```

## Was the Methods table required?

Yes, by `.claude/rules/documentation.md` § Parity ("For behavioral interfaces/classes:
document public methods under `## Methods`"), and by the guide's own convention — every
behavioral interface in `guides/mcp.md` already carries an H4 method table.

The parity gate alone does not force it: `tests/guides.test.ts:613` iterates `guide.methods()`,
so it validates the tables that exist and demands none. The gate does force the Types row, and
that coupling was proven red first (see the following section).

## Runs

All commands run in `C:\Users\mikes\WebstormProjects\mcp` on 2026-08-27.

| Command                                                                       | Result                              |
| ----------------------------------------------------------------------------- | ----------------------------------- |
| `npm run check`                                                                | Exit 0, no diagnostics              |
| `oxlint --config .oxlintrc.json --deny-warnings src/server/types.ts src/server/factories.ts` | Exit 0, no findings    |
| `oxfmt --config .oxfmtrc.json --check src/server/types.ts src/server/factories.ts guides/mcp.md` | "All matched files use the correct format" |
| `npm run test:src:server`                                                      | 12 files passed, 316 tests passed   |
| `npm run test:guides`                                                          | 1 file passed, 149 tests passed     |
| `npm run test:probe`                                                           | 1 file passed, 3 tests passed       |

### Failing first

The parity coupling for the new export was proven red before it was closed. With the Types row
deleted and everything else in place, `npm run test:guides` reported 1 failed | 148 passed:

```text
FAIL  |guides| tests/guides.test.ts > MCP > documents every barrel export
AssertionError: expected [ 'interface StdioServerInterface' ] to deeply equal []
```

Restoring the row returned the suite to 149 passed. The row was removed and restored by a
script over `guides/mcp.md`, a file this unit owns; `oxfmt --check` and the suite both confirm
the restored file.

### Instrument checked

`oxlint` printed nothing for the owned files, so its ability to report was checked against a
throwaway `tmp/probe/lintfail.ts` carrying `const x: any = 1`. It reported
`typescript(no-explicit-any)` and exited 1. That file was deleted; it sits outside this unit's
subject.

## Ancillary choices recorded

- **TSDoc voice.** The interface takes the file's established shape — a lead sentence naming
  what the symbol is and who returns it, then `@remarks` bullets, one per member. Members carry
  no TSDoc of their own, matching `MCPSessionInterface` in the same file.
- **Table placement.** The Types row sits before `StdioServerOptions`, mirroring the
  interface-then-options order the client pair already uses.
- **Methods H4 placement.** Appended after `MCPSessionInterface`, keeping the server-face
  entries together at the section's end.
- **The Methods paragraph names that no class implements the interface.** The section's
  preamble pairs each interface with its implementing class, and a reader would look for one.
  The preamble itself is unchanged.
- **`start()` and `stop()` already appeared as words in other `ts` fences**, so the parity gate's
  per-method example check would have passed without a new fence. The fence was added anyway
  because every other H4 in `## Methods` carries one, and it demonstrates the arms-once and
  one-lifetime behavior the table claims.

## Deviation state

None. No test outside the owned files reddened, and the parity gate demanded no change outside
them. `git status --porcelain` reports exactly `guides/mcp.md`, `src/server/factories.ts`, and
`src/server/types.ts` modified. Nothing was committed. `tmp/worktrees/` was not touched.

## Retained instrument

`tmp/probe/stdioHandle.test.ts` is the acceptance evidence for the TSDoc's lifetime claims. It
is a workbench file under `tmp/` (git-ignored, collected only by `npm run test:probe`), so no
gate selects it. Should the Orchestrator want those claims under a standing gate, that is a
successor unit owning `tests/src/server/factories.test.ts`; this unit's brief scoped that file
to what the parity gate forces, and the parity gate forced nothing there.
