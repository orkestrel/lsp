# Unit P1 — LintStage adopts the @orkestrel/lsp client

Role and engine: `implementer`, Claude Opus 5, native subagent, sole writer in
`/home/user/probe`. You perform this assignment directly and spawn nothing beyond the
shell commands and the child processes your tests need. This unit runs natively because
its proofs drive a spawned language server — a subject the bench sandbox cannot measure.

Before working, read in order: `/home/user/probe/AGENTS.md`; the rules —
`.claude/rules/names.md`, `.claude/rules/typescript.md`, `.claude/rules/architecture.md`,
`.claude/rules/patterns.md`, `.claude/rules/tests.md`, `.claude/rules/documentation.md`,
`.claude/rules/quality.md`; no skill binds this unit; the guide `guides/probe.md` §§ the
stages and helpers sections.

## Objective

`LintStage` delegates its language-server spawn, Content-Length framing, request
correlation, and lifecycle to the installed `@orkestrel/lsp` package — the
`createStdioTransport` factory from `@orkestrel/lsp/server` and the `createLSPClient`
factory from `@orkestrel/lsp` — keeping the stage's own `Issue` mapping and its
`StageInterface` behavior unchanged.

## Context — standing conditions and measured facts

- Baseline: probe commit `4e7f933`. The tree is expectedly dirty with the Orchestrator's
  tarball swap in the `package.json` and `package-lock.json` files — the
  `@orkestrel/lsp` runtime dependency at the
  `file:../scaffold/tmp/tarballs/orkestrel-lsp-0.0.1.tgz` range, installed and verified
  (`INSTALLED @orkestrel/lsp 0.0.1`). Build on it; never revert it. The `file:` range is
  the pre-publish head start; the release re-pins it to the registry version.
- The installed client surface, verified against
  `node_modules/@orkestrel/lsp` source of 2026-08-26:
  - `createStdioTransport(options: StdioTransportOptions): LSPTransportInterface` from
    `@orkestrel/lsp/server`, where `StdioTransportOptions` is
    `{ server: { command: readonly string[], directory?: string, environment?: Readonly<Record<string, string | undefined>> }, grace?: number }`.
  - `createLSPClient(options: LSPClientOptions): LSPClientInterface` from
    `@orkestrel/lsp`, where `LSPClientOptions` is
    `{ on?, error?, transport, workspace: LSPDocumentURI, timeout?: number, signal?: AbortSignal }`
    and `LSPClientInterface` is `emitter`, `capabilities`, `encoding`, `start()`,
    `open(document: LSPTextDocumentItem): Promise<readonly LSPDiagnostic[]>`,
    `close(uri)`, and `destroy()`.
  - The client declares its own capabilities (`publishDiagnostics` included), keeps the
    `InitializeResult`, derives the position encoding, and selects the diagnostics path
    from the server's capability: `open` runs the pull path when the server's
    `diagnosticProvider` is present and collects the pushed
    `textDocument/publishDiagnostics` frames otherwise. The stage declares nothing and
    selects nothing.
- The current `LintStage` (`src/server/stages/LintStage.ts`, 463 lines): private spawn
  (`#warm` at :199-226 — `spawn(process.execPath, [binary, '--lsp'], …)` after
  `resolveWorkspaceBinary(workspace, 'oxlint')`), private framing (`#send` :348-350,
  `#read`/`#frame` :353-378 over `parseContentLength`), private correlation
  (`#sequence`, `#responses`, `#failures`, `#receive` :381-394, `#fail`/`#exit`
  :446-461), private lifecycle (`#destroy` → `#release` → `#retire` :114-176 with
  `#deadline = 2_000` and `SIGKILL`), an empty `capabilities: {}` in its own
  `initialize`, and the push-only diagnostics collection at :396-443 that maps LSP
  diagnostics to `Issue` values with `range.start.line + 1`.
- `parseContentLength` (`src/server/helpers.ts:606-611`) has these consumers, from a
  repository-wide search of 2026-08-26: `LintStage.ts`, its own declaration, the rows in
  `tests/src/server/helpers.test.ts:110-111` and `:627-631`, and the guide row at
  `guides/probe.md:189`. The framing capability moves into `@orkestrel/lsp`, so the
  helper, its rows, and its guide row are removed with their capability — not for lint.
- Host: Linux container, Node and npm on PATH, dependencies installed, the workspace
  `oxlint` binary present under `node_modules/.bin`. Network reaches the proxy; you
  install nothing.

## The work

1. In `#warm`, keep `resolveWorkspaceBinary`, then build the transport with
   `createStdioTransport` over `[process.execPath, binary, '--lsp']` in the workspace
   directory, build the client with `createLSPClient` over that transport and the
   workspace's `file://` URI, and await `start()`. The stage's own initialize payload,
   framing, and correlation machinery go.
2. Route the inspection through `client.open(document)` and map the returned
   diagnostics through the EXISTING `Issue` construction — `range.start.line + 1` stays;
   the P2 unit owns the `range` change. Close the document after reading.
3. Route teardown through `client.destroy()`. The stage's private deadline and
   `SIGKILL` machinery go; bound the teardown through the client's `timeout` option and
   the transport's `grace` option so the observable bound stays at 2000 milliseconds.
4. Remove `parseContentLength` from `src/server/helpers.ts`, its rows from
   `tests/src/server/helpers.test.ts`, and its guide row; state the adopted hookup in
   the guide's lint-stage rows — the exact factories, the command shape, and the honest
   limit that diagnostics-path selection belongs to the client.
5. Reshape `tests/src/server/stages/LintStage.test.ts` to the adopted lifecycle: the
   protocol-faithful fixture rows keep proving the stage against a real spawned server;
   rows that pinned the removed private framing go with it; every surviving behavioral
   row stays green.
6. Add the process-id teardown row: spawn through the stage against the fixture, record
   the child process id, destroy, and prove the process gone (`kill -0` refused or an
   equivalent ESRCH reading). Record the row's reading in your report with the observed
   process id.

## Unknowns

- Whether the stage's event surface loses an observable the current tests pin (a
  warming-failure shape, a correlation-failure shape) that the client's `emitter` and
  error codes express differently. Where a pinned observable cannot be preserved
  verbatim, map it to the client's coded error and record the mapping; where it cannot
  be expressed at all, stop and report.
- Whether the fixture server in `LintStage.test.ts:24-76` speaks enough protocol for the
  client's stricter initialize (the client validates the result). Extend the fixture's
  answers where the client requires more; record what was added.

## Scope

Owned files: `src/server/stages/LintStage.ts`, `src/server/helpers.ts` (the
`parseContentLength` removal only), `tests/src/server/stages/LintStage.test.ts`,
`tests/src/server/helpers.test.ts` (the framing rows only), `guides/probe.md` (the
lint-stage and framing rows only).

Report-only: `package.json` and `package-lock.json` (the Orchestrator's swap, never
edited), `src/server/types.ts` (the `StageInterface` contract, unchanged),
`src/core/types.ts` (the `Issue` shape, the P2 unit's subject), `tests/guides.test.ts`.

Off-limits: everything else, the other stages included.

Allowed tools: read, edit, and scoped shell commands in `/home/user/probe`. No commit,
no push, no `git checkout`/`restore`/`stash`/`reset`/`clean`, no installs, no tree-wide
`format` or `lint --fix`.

## Execution

You are a native subagent: do the work yourself, directly, and spawn nothing beyond the
shell commands and test child processes the work needs.

## Output

Your final message is the unit report, in this shape and nothing else:

1. What changed: each owned file with the exact behavioral delta.
2. The teardown row's reading with the observed process id, and the readings of the
   surviving behavioral rows.
3. The Unknowns' answers: the observable mapping and the fixture extensions, each named.
4. Gate readings with exit codes: the LintStage and helpers test files' project runs,
   scoped `oxfmt --check` and `oxlint --deny-warnings` over the owned files,
   `npm run check` (tree-wide), the guides parity project, `git diff --check`.
5. Observations outside scope, each named against the capability that owns it.

No process diary.

## Deviation contract

A conflict with the primary objective stops the unit: report expected, found, exact
evidence, done or not done, and at most one short hypothesis. The named stop conditions:
a pinned stage observable the client surface cannot express; the fixture cannot satisfy
the client's initialize validation; any diagnostic in `npm run check` outside your owned
files. Ancillary conflicts — test titles, guide row wording, the URI builder's internal
shape — are yours to decide, record, and carry on from.

## Acceptance criteria

Ordered cheap-first.

1. `git diff --check` exits 0 and the diff touches only owned files (the manifest and
   lockfile stay exactly the Orchestrator's swap).
2. Scoped `oxfmt --check` and `oxlint --deny-warnings` over the owned files exit 0.
3. `npm run check` exits 0 tree-wide.
4. The LintStage test file's project run exits 0 with the fixture rows green and the
   process-id teardown row's evidence recorded; the helpers test file's project run
   exits 0 with the framing rows gone.
5. The guides parity project exits 0; no `parseContentLength` token remains anywhere in
   the tree outside the lockfile.
6. No banned construct anywhere in the diff; the stage keeps `#` fields and single-word
   members.

## Review evidence

The Orchestrator captures the actual diff and the actual `git status` output after you
exit; the round's `analyst` lane — the engine that did not write this unit — audits the
claims against the diff.
