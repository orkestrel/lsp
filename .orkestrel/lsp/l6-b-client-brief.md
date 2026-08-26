# Unit L6-B — the client carries the required per-open signal

Role and engine: Sol `implementer`, GPT-5.6 Sol, reached through `codex exec`, sandbox
`workspace-write`, working directory `/home/user/lsp`. You perform this assignment directly and
spawn nothing beyond the shell commands your work needs.

Read before editing, in order: the repository `AGENTS.md`, the `.claude/rules/names.md`,
`.claude/rules/typescript.md`, `.claude/rules/tests.md`, and `.claude/rules/writing.md` files,
then the ruling this unit implements — `.orkestrel/lsp/l6-design-reconciliation.md` and the
adopted contract in `.orkestrel/lsp/l6-design-analyst-ruling.md` (§ Implementation boundary,
§ Failure modes, § Pinned rows). No skill applies.

## Standing tree state, named so you do not stop on it

The tree is a held round and is DIRTY by design: `src/core/types.ts` and `src/core/factories.ts`
carry the landed L6-A contract (the required `LSPOpenOptions` at `types.ts:286`, the two-parameter
`open` at `types.ts:319`), and `guides/lsp.md` carries the L6-D parity edit. Never revert, stash,
or reset anything. The round commits as one commit after the Orchestrator's gate chain.

`npm run check` on this baseline reports exactly one diagnostic —
`tests/src/server/integration.test.ts(40,37): error TS2554: Expected 2 arguments, but got 1.` —
because TypeScript lets the class's one-parameter `open` satisfy the widened interface member.
Widening the class signature turns every one-argument `.open(` call site red; that repair is
yours.

## Objective

Make `LSPClient` implement the ruled contract: `open` takes the required `LSPOpenOptions`, the
caller signal bounds the push and the pull diagnostics waits, and the constructor `timeout` stops
bounding them while keeping initialize, shutdown, exit-write settlement, and transport-close
settlement.

## The work — the analyst's implementation boundary, adopted verbatim

Facts measured 2026-08-26: the class `#timeout` field defaults at `LSPClient.ts:106`
(`options.timeout ?? 30_000`); the push wait builds `AbortSignal.timeout(this.#timeout)` at
`:316`; every correlated request builds it at `:343`; `#boundExit` and `#closeTransport` build it
at `:612` and `:623` and KEEP it; the cancel method constant is `constants.ts:7`
(`cancel: '$/cancelRequest'`); `aborted` and `closed` already sit in the `LSPErrorCode` union at
`types.ts:340-341`, so the types file needs nothing.

1. `open` accepts `LSPOpenOptions`, snapshots `options.signal` ONCE into a local, refuses an
   already-aborted snapshot with an `LSPError` coded `aborted` BEFORE claiming the URI or writing
   `textDocument/didOpen`, and passes the snapshot into the selected diagnostics path. Read the
   foreign options object exactly once per member; no result may depend on read count.
2. `#openPush` registers the caller signal in place of `AbortSignal.timeout(this.#timeout)` at
   `:316`.
3. `#openPull` passes the caller signal to the correlated diagnostic request in place of the
   `:343` deadline for that path.
4. The request machinery distinguishes lifecycle timeout settlement from caller abort settlement:
   a diagnostics cancellation rejects with `aborted`; initialize and shutdown expiry keep
   rejecting with `timeout`.
5. A canceled pull request writes `$/cancelRequest` through the `constants.ts` method name while
   the generation remains ready.
6. Publication and pending-request records retain the signal and its listener so settlement
   removes both deterministically — no leaked listener after resolve, reject, or abort.
7. A caller abort removes only the affected publication or request. It never invokes the
   client-wide abort path and never deletes the opened URI: the URI stays owned so `close(uri)`
   still writes `textDocument/didClose`.
8. `#request` calls for initialize and shutdown keep the constructor timeout; `#boundExit` and
   `#closeTransport` at `:612` and `:623` stay unchanged.
9. Update the `@example` fence in the `LSPClient.ts` class TSDoc (the one-argument `client.open`
   call near `:50`) to the ruled two-argument shape.

## The rows, red-first

Promote into `tests/src/core/LSPClient.test.ts`, each named for what it proves and each red or
green as stated against the baseline before your source edit lands — record the red commands and
readings, then the green:

- `refuses an already-aborted open before writing document open` — the transport recorder shows no
  `textDocument/didOpen` write.
- `aborts a pushed diagnostic wait without destroying the client` — the client stays ready and a
  later `open` on another URI succeeds.
- `keeps a push-aborted document closeable` — `close(uri)` after the abort writes
  `textDocument/didClose`.
- `aborts a pulled diagnostic request and writes cancellation` — the recorder shows
  `$/cancelRequest` with the canceled request id.
- `keeps a pull-aborted document closeable`.
- `resolves pushed diagnostics after the constructor timeout has elapsed` — construct with a small
  `timeout` (for example 50 ms), deliver the publication after it passes, and the wait resolves.
- `resolves pulled diagnostics after the constructor timeout has elapsed` — same shape on the pull
  path. These delayed-success rows are load-bearing: caller-abort rows alone do not prove the
  constructor timeout stopped governing diagnostics.
- `isolates a call abort from another pending open` — an abort of one open leaves a concurrent
  open's wait pending and able to settle.

Every existing row keeps passing, the named lifecycle rows included: the initialize-deadline row,
the bounded-shutdown row, the exit-write bound row, and the close-deadline emission row. Update
each existing one-argument `.open(` call site to supply a signal — the sites in
`tests/src/core/LSPClient.test.ts` at lines 316, 332, 361, 374, 402, 423, 434, 463, 492, 531,
533, 537, 562, 565, 634, 637, 688, 694, 803, 809, 842, 848, 877, 931, 976, 1004, 1028, 1032,
1056, 1310, 1319, and 1339 as of the baseline — choosing per row between a plain
`new AbortController().signal` for rows that never abort and an armed signal where the row's
subject needs one. In `tests/src/server/integration.test.ts`, change the `:40` call to pass
`{ signal: AbortSignal.timeout(10_000) }` and keep the client's `timeout: 10_000` for lifecycle;
touch nothing else in that file.

## Host environment and bench limits

Linux container, Node and npm on PATH, network DENIED in your sandbox — no installs. Dependencies
are installed. The `src:core` project runs entirely on in-memory transports and is yours to run.
Do NOT run `tests/src/server/integration.test.ts` or any `src:server` test: those rows spawn a
real language server as a grandchild of the test runner, which this sandbox denies and which fails
as a false green — the Orchestrator runs that project on the host after you exit and its result is
a host observation, not your criterion. Nested `git` from a spawned tool can report "not a git
repository" while your own `git status` succeeds; that is the sandbox. The `probe` MCP instrument
refuses here (approval policy `never`) — record any claim needing it as a host observation.

## Scope

Owned files: `src/core/LSPClient.ts`, `tests/src/core/LSPClient.test.ts`, and the single named
call-site edit in `tests/src/server/integration.test.ts`. Report-only: `src/core/types.ts`,
`src/core/helpers.ts`, `src/core/constants.ts`, `guides/lsp.md`, `tests/setup.ts`. Off-limits:
everything else. No commit, no push, no `git checkout`/`restore`/`stash`/`reset`/`clean`, no
tree-wide `format` or `lint --fix`, no installs.

## Execution

You are the bench engine reading this brief inside your own CLI: do the work yourself, directly,
and spawn nothing beyond the shell commands your work needs.

## Output

Your final message is the unit report, in this shape and nothing else:

1. What changed: each owned file with the exact behavioral delta.
2. The red-first records: each promoted row's red and green commands with readings, and the
   delayed-success rows called out.
3. The listener-hygiene reading: how settlement removes the retained signal listener on each path,
   with the code location.
4. Scoped gate readings with exit codes: `npm run test:src:core -- tests/src/core/LSPClient.test.ts`
   unfiltered, scoped `oxfmt --check` and `oxlint --deny-warnings` over the owned files,
   `npm run check` tree-wide, `git diff --check`.
5. Observations outside scope, each named against the unit that owns it — the host `src:server`
   run included.

No process diary.

## Deviation contract

A conflict with the ruled contract stops the unit: report expected, found, exact evidence, done or
not done, and at most one short hypothesis. The named stop conditions: a lifecycle row the change
reddens beyond the listed one-argument call sites; a pull cancellation that cannot write
`$/cancelRequest` without touching a report-only file; the URI-ownership rule conflicting with an
existing row's expectation. Row titles, local names, and per-row signal choices are yours to
decide, record, and carry on from.

## Acceptance criteria

Ordered cheap-first.

1. `git diff --check` exits 0; the diff touches only owned files.
2. Scoped `oxfmt --check` and `oxlint --deny-warnings` over the owned files exit 0.
3. The promoted rows are green red-first; the delayed-success rows are green; every pre-existing
   row in the file stays green.
4. `npm run test:src:core -- tests/src/core/LSPClient.test.ts` exits 0 unfiltered.
5. `npm run check` exits 0 tree-wide.

## Review evidence

The Orchestrator captures the actual diff and the actual `git status` output after you exit, runs
the `src:server` integration project on the host, rebuilds and repacks the tarball for the probe
consumer, and routes the round's audit to the `analyst` lane per the reconciliation. The pins
commit as the regression guards.
