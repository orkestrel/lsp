# Audit round — lsp stdio transport (L4, lsp `d354cab`), shared claim set

The subject is lsp commit `d354cab` (unit L4, the `StdioTransport` server environment, written
by the Claude Opus 5 native implementer). Both audit lanes rule on this same claim set; the
dispatch wrapper names each lane's perspective. The unit's report is a claim set to break.

Evidence: the committed diff at `/home/user/scaffold/tmp/units/l4-diff.txt` (the full
`git show` of lsp commit `d354cab`), the empty status at
`/home/user/scaffold/tmp/units/l4-status.txt`, and the tree at `/home/user/lsp`, clean at
`d354cab`. The Orchestrator's idle-host reads, 2026-08-26: `format:check`, `lint:check`, and
`check` exit 0; `src:server` 15 passed; `src:core` 77 passed.

## Claims to falsify

1. `StdioTransport` implements `LSPTransportInterface` to the letter of its remarks
   (`src/core/types.ts:211-218`): `send` and `close` reject rather than throw on every path;
   after `close` resolves, `send` resolves `false`; the declared reconnect stance holds — a
   fresh child per `start` after `close` resolves or the child exits, `duplicate` refused over
   a live child — with no interleaving that leaves two live children or a stale stream wired to
   the emitter. Attack the seams: an exit racing `close`, a `start` racing an unprompted exit,
   and stream listeners surviving a generation change.
2. The transport carries bytes and never frames: no Content-Length parsing, splitting, or
   buffering logic exists in the server environment, stdout chunks reach the `chunk` event
   untouched and unre-ordered, and stderr is drained without joining the byte stream.
3. Termination is exactly the ruled path: stdin end, `waitForExit` under `grace`, then
   `stopChild`, all from `@orkestrel/process`, with `resolveExecutable` on the spawn side; the
   line-oriented `Process`, `lines`, and `send` surfaces appear nowhere; no code path can
   orphan a child — including a spawn that fails after the process exists and a `close` racing
   an exit.
4. `StdioTransportOptions` is exactly `{ server: { command, directory?, environment? },
   grace? }` per ruling 10, with readonly members, `spawn`-coded start failures per ruling 11,
   and the environment-inheritance default the added row pins; no public surface beyond the
   design's contract entered the barrel.
5. The suite proves what it names: each row's subject is the production line the report's
   mutation table claims, the fixture child at `tests/src/server/fixtures/peer.mjs` is
   protocol-faithful for the exchanges it serves, the integration receipt drives the real
   Oxlint binary through the public API alone, and the recorded pid teardown reading proves
   no-orphan rather than assuming it.
6. The diff stays inside the law and the owned scope: no banned construct, single-word entity
   APIs, centralized placement per the architecture rules, the guide rows honest for what
   shipped (including the class-keyed methods table the report flags for L6), and the status
   empty.

Number any finding fitting no claim under its own heading, per the skill.

