# P3 — probe adopts the renamed lsp surface (tarball wave)

- **Role and engine**: `implementer`, Opus 5, native. Writing unit, sole writer in the probe main
  checkout.
- **Objective**: probe consumes the renamed lsp client-transport surface, every old-name
  reference is gone, the vendored `guides/lsp.md` mirror exists, and the scoped suites prove the
  real oxlint integration through the new surface.

## Context

- Repository: `C:\Users\mikes\WebstormProjects\probe`, `main` at `89f7bd7` with an
  Orchestrator-owned uncommitted swap already applied: `package.json` pins `@orkestrel/lsp` to
  `file:tmp/tarballs/orkestrel-lsp-0.0.3.tgz` (the packed rename surface) with an `overrides`
  entry routing `@orkestrel/process` to the Session-face tarball; the lockfile is updated and
  `node_modules` reinstalled. Verified installed: `createStdioClientTransport` is declared in
  `node_modules/@orkestrel/lsp/dist/src/server/index.d.ts`, and the installed process serves
  `createSession`. Leave `package.json` and `package-lock.json` exactly as found — the swap and
  its restoration obligation are recorded campaign state, not yours.
- Consequence you repair: `src/server/stages/LintStage.ts:6` imports `createStdioTransport` from
  `@orkestrel/lsp/server`, which the installed declarations no longer export. The main checkout
  does not typecheck until this unit lands.
- Read first: `AGENTS.md`, `.claude/rules/typescript.md`, `.claude/rules/documentation.md`
  (§ Parity on vendored mirrors), `.claude/rules/names.md`.
- The audit worktree under `tmp/worktrees/` belongs to a concurrent read-only round: never touch
  `tmp/worktrees/`, and never run a tree-wide command that would reach into it.

## Tasks

1. Sweep the tree for every lsp-sourced old name (`createStdioTransport`, `StdioTransport`,
   `StdioTransportOptions`, `StdioTransportInterface` as imported from `@orkestrel/lsp` — do not
   confuse `@orkestrel/mcp`'s own transport names) across `src/`, `tests/`, `guides/`. Name the
   search scope in your report. Update every reference to the renamed surface
   (`createStdioClientTransport`, `StdioClientTransport*`), reading the installed declarations
   for the exact option and interface shapes.
2. Vendor the lsp guide mirror: copy
   `C:\Users\mikes\WebstormProjects\lsp\guides\lsp.md` to `guides/lsp.md` byte-identical — a
   mirror is fetched bytes, never rewritten. Record the source's SHA-256 in your report.
3. Name the mirror where the guide map requires it: the `guides/probe.md` See-also mirror list,
   and `guides/README.md` if its directory index lists mirrors (read it and follow its shape).
4. Prove the integration: the LintStage suite drives the workspace's real oxlint through the
   renamed transport.

## Scope

- Owned: `src/server/stages/LintStage.ts`, `tests/src/server/stages/LintStage.test.ts` (only if
  it names the old surface), `guides/lsp.md` (new), `guides/probe.md` (the See-also list and any
  sentence naming the old factory), `guides/README.md` (index row only).
- Off-limits: `package.json`, `package-lock.json`, `tmp/worktrees/`, everything else.

## Execution

Perform the assignment directly and spawn nothing. Validate scoped: `npm run check`, scoped
oxlint on owned files, `npm run test:src:server` (the real-oxlint proof), `npm run test:guides`,
`npm run test:policy`. Do not run tree-wide `format`, `lint --fix`, or `build`.

## Output

Write your report to `tmp/units/p3-report.md`: the sweep scope and every hit with its
resolution, the mirror's source hash, the scoped run counts, and any claim you could not close.

## Deviation contract

Stop and report when: a test reddens for a behavioral reason (a difference between the old and
renamed lsp surface is an lsp finding, not yours to fix); the installed declarations lack a
symbol the code needs; or the guide gate demands a change outside your owned files. Ancillary
choices (mirror index row wording) are yours to decide and record.

## Acceptance criteria

1. A sweep proves no lsp-sourced old name remains (state the pattern and scope).
2. `npm run check` green; scoped lint green.
3. `test:src:server`, `test:guides`, `test:policy` green — the LintStage rows drive real oxlint
   through `createStdioClientTransport`.
4. `guides/lsp.md` is byte-identical to its named source.
