# Unit L4 — stdio transport and host receipts

## Role and engine

`implementer`, Claude Opus 5, native, on the host. A bounded nontrivial implementation unit in
`/home/user/lsp`. You perform this assignment directly and spawn nothing beyond the child
processes your tests drive.

## Objective

The `@orkestrel/lsp` server environment carries the stdio child transport the design round
ruled, proven on the host against a protocol-faithful fixture child and the live Oxlint
`--lsp` receipt — from the committed `88c01f1` baseline.

## Context

Read before editing, in order: `/home/user/lsp/AGENTS.md`; the rule files
`.claude/rules/names.md`, `.claude/rules/typescript.md`, `.claude/rules/architecture.md`,
`.claude/rules/patterns.md`, `.claude/rules/tests.md`, `.claude/rules/workspace.md`, and
`.claude/rules/documentation.md`; `guides/README.md` and `guides/lsp.md`; `src/core/types.ts`.
No skill applies. The binding design record is
`/home/user/scaffold/.orkestrel/campaign/lsp-design-reconciliation.md` — its rulings are the
contract, these above all:

- Ruling 4: `StdioTransport` lives in `src/server` and implements `LSPTransportInterface`
  (`src/core/types.ts:219-224`) — bytes, never frames. The client never touches child streams.
- Ruling 5: spawn with `node:child_process` raw streams. Terminate through `@orkestrel/process`
  — `stopChild`, `killTree`, `waitForExit`, and `resolveExecutable` are the fleet's termination
  primitives and reimplementing them fails the reuse law. The `Process` class, `lines`, and
  `send` are line-oriented, would corrupt frames, and are FORBIDDEN here.
- Ruling 10: `StdioTransportOptions` is `{ server: { command, directory?, environment? },
  grace? }`.
- Ruling 11: spawn failures surface as `LSPError` coded `spawn`.
- Ruling 15: the live receipt is Oxlint's `--lsp` mode, a development dependency of this
  workspace — initialize over real stdio, open a document with a known diagnostic, read it
  through the public API (`LSPClient` over `StdioTransport`), and prove no child survives
  `destroy` by recorded pid.
- The `LSPTransportInterface` remarks (`src/core/types.ts:211-218`) bind: `send` and `close`
  reject rather than throw; after `close` resolves, `send` resolves `false`; the client may
  call `start` again only after `close` resolves or the transport emits `exit`, and an
  implementation that cannot reconnect must reject that call. Decide the reconnect stance and
  state it in the TSDoc.

Host facts: the tree is clean at `88c01f1`; you run on the host with no sandbox, so child
processes, process trees, and kills all work; `npm` scripts resolve from `/home/user/lsp`; the
`src:server` test project includes `tests/src/server/**/*.test.ts` (`vite.config.ts:88-89`);
`tests/setupServer.ts` exists for shared server-test infrastructure;
`tests/src/server/index.test.ts` currently pins an empty barrel and is yours to update. The
`prove` instrument of `.claude/rules/quality.md` § Instruments is available on the host through
the `probe` MCP server only to the Orchestrator — where a claim needs it, record the claim and
the exact edit for the Orchestrator instead of skipping it.

## Scope

- Owned: `src/server/**` (types, the transport class, factories, and the barrel, placed per
  `.claude/rules/architecture.md`), `tests/src/server/**` (the fixture child script included,
  placed per `.claude/rules/tests.md`), `tests/setupServer.ts`, and the minimal honest guide
  rows: the server environment's Surface and Methods rows in `guides/lsp.md` and the directory
  index row in `guides/README.md` that points `src/server` at a guide section that exists. The
  full guide extension and the exclusions table stay with the later guide unit.
- Off-limits: `src/core/**` (the transport consumes the published core surface unchanged),
  `tests/src/core/**`, `tests/policy.test.ts`, `tests/setupPolicy.ts` (vendored),
  `package.json`, `vite.config.ts`, `tsconfig.json`, `.oxlintrc.json`, `.oxfmtrc.json`. If an
  export map or config row blocks the server environment from building or testing, stop and
  report rather than editing configuration.
- Scratch under `/home/user/lsp/tmp/` only.

## The work, types first

1. **Types.** Declare the server environment's public types in the server `types.ts` —
   `StdioTransportOptions` exactly as ruled — with readonly properties and TSDoc that states
   the reconnect stance, the `grace` deadline's meaning, and the termination path.
2. **Implementation.** `StdioTransport` implements `LSPTransportInterface`: `start` spawns the
   configured command through `resolveExecutable` and raw `node:child_process` streams and
   rejects coded `spawn` on failure; stdout chunks emit as `chunk` events untouched; `send`
   writes bytes and resolves `false` after close; `close` ends the child through `stopChild`
   with the `grace` deadline, escalating through the process helpers, and `exit` emits the
   child's real exit; stderr is drained. The factory row and barrel exports follow the core
   pattern.
3. **Tests, red-first where a defect is pinned.** A protocol-faithful fixture child (a real
   spawned Node script speaking Content-Length frames over stdio — no mocks, no fakes) proves:
   start/spawn-failure (`spawn` code), chunk passthrough of split and coalesced frames, send
   after close resolving `false`, close with a cooperative child (real exit surfaced), close
   with a child that ignores the grace (killed through the helpers, no orphan by recorded
   pid), exit emitted when the child dies unprompted, and the reconnect stance you declared.
   Update `tests/src/server/index.test.ts` to pin the real barrel.
4. **The live Oxlint receipt.** An integration row drives the workspace's own `oxlint --lsp`
   through `LSPClient` over `StdioTransport`: initialize resolves, a document with a known
   diagnostic opens and its diagnostics arrive through the public API, `destroy` completes,
   and the recorded child pid no longer exists afterward. Keep the source text deterministic.
5. **Guide rows.** The minimal honest server section per the scope.

## Required proofs

- Each defect-pinning row's recorded red (against the missing or deliberately disabled
  production line) and green, with exact commands; a row pinning built behavior carries its
  revert or mutation evidence the way the campaign's retained reports do, with `cmp`-proven
  restoration.
- `npm run format:check`, `npm run lint:check`, and `npm run check` exit 0.
- `npm run test:src:server` green on the host, with the run's counts recorded.
- `npm run test:src:core` still green (the core suite is untouched; record the counts).
- The Oxlint receipt's row output recorded, including the pid check.

## Execution

You perform this assignment directly and spawn nothing beyond your tests' children. Work in the
main checkout. Do not commit, push, or run `git checkout`, `git restore`, `git stash`,
`git reset`, or `git clean`; undo an edit by editing exactly that edit back.

## Output

Write the report to `/home/user/lsp/tmp/l4-stdio-transport-report.md`: the declared contract
and the reconnect stance, per-row proof commands with red and green readings, the gate
readings, the Oxlint receipt output, any claim reserved for the Orchestrator's `prove`
instrument, and the actual `git diff --stat` and `git status --porcelain` output. Return the
report path and a short summary. No process diary.

## Deviation contract

Stop and report — expected, found, exact evidence, done or not done, at most one hypothesis —
when: a design ruling conflicts with the tree or the rules; the server environment cannot
build or test without touching an off-limits file; a process helper's semantics do not match
ruling 5's assignment; or the Oxlint binary cannot produce a deterministic diagnostic. File
placement inside the owned set, fixture shape, and the reconnect stance are yours to decide
and record.

## Acceptance criteria

1. `npm run format:check`, `npm run lint:check`, and `npm run check` exit 0.
2. `npm run test:src:server` green on the host with recorded counts; `npm run test:src:core`
   unchanged and green.
3. The termination path runs through the `@orkestrel/process` helpers with no orphan by
   recorded pid; the line-oriented `Process`, `lines`, and `send` surfaces appear nowhere in
   the diff.
4. The live Oxlint receipt row passes with its output recorded.
5. The report exists at the named path with the evidence, diff stat, and status output.
