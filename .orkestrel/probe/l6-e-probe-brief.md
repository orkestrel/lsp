# Unit L6-E — the probe hands its deadline signal to the lint inspection

Role and engine: `implementer`, Claude Opus 5, native subagent working in `/home/user/probe` as
its sole writer. You perform this assignment directly and spawn nothing. The routing deviation is
on the record: this objective unit runs natively because its proof spawns the real Oxlint language
server, which the bench sandbox denies.

Read before editing, in order: the probe repository's `AGENTS.md`, its `.claude/rules/names.md`,
`.claude/rules/typescript.md`, `.claude/rules/tests.md`, and `.claude/rules/writing.md` files,
then the ruling this unit implements — `/home/user/lsp/.orkestrel/lsp/l6-design-reconciliation.md`
and the § Probe rewiring section of
`/home/user/lsp/.orkestrel/lsp/l6-design-analyst-ruling.md`. No skill applies.

## Standing tree state, named so you do not stop on it

The probe tree is a held round and is DIRTY by design: the P1 adoption diff (LintStage delegating
to `@orkestrel/lsp`, its tests, `guides/probe.md`, `src/server/helpers.ts`), the Orchestrator's
tarball swap (`package.json:97` carries
`"@orkestrel/lsp": "file:../lsp/tmp/tarballs/orkestrel-lsp-0.0.1.tgz"` with its lockfile), and the
applied fixture capability patch in `tests/src/server/Probe.test.ts` (the `initialize` answers at
`:55` and `:97` declaring `textDocumentSync`). Never revert, stash, or reset anything; preserve
the fixture patch. The round commits as one commit after the Orchestrator's gate chain.

The installed tarball was rebuilt 2026-08-26 from the lsp tree carrying the ruled contract:
`open(document: LSPTextDocumentItem, options: LSPOpenOptions)` with a REQUIRED
`readonly signal: AbortSignal`, the constructor `timeout` bounding lifecycle and settlement only,
an abort rejecting with an `LSPError` coded `aborted`, and the URI staying owned so `close` still
notifies the server. `npm run check` in this tree therefore reds on the one-argument `client.open`
call at `src/server/stages/LintStage.ts:184` until you land the rewire.

## Objective

Wire the coordinator's own deadline signal through a types-first seam into the lint inspection, so
the diagnostics wait has exactly one owner, and restore the two red coordinator rows.

## The work — the analyst's probe-rewiring prescriptions, adopted verbatim

Facts measured 2026-08-26: `Probe.#deadline` defaults through
`createTimeout({ ms: options?.deadline ?? 30_000 })` at `src/server/Probe.ts:87`; `#inspectStage`
at `:444` accepts an already-started `operation: Promise<Check>`; `#bound` at `:463` creates and
starts its timeout AFTER that promise began. `StageInterface` sits at `src/server/types.ts:108`
with `TypeStageInterface` extending it at `:160`. `LintStage` builds its client with
`timeout: this.#deadline` at `src/server/stages/LintStage.ts:140` and calls `client.open` with one
argument at `:184`.

1. Arm the coordinator timeout BEFORE the lint inspection starts. `Probe.#bound` takes an
   operation handler rather than an already-started promise, so the bound supplies its signal when
   it invokes the stage's inspection. Rework the touched call paths consistently; a stage whose
   inspection ignores the signal keeps working unchanged.
2. Add a types-first signal seam for the lint inspection in `src/server/types.ts`, without
   pretending unsupported stages honor cancellation: state on the seam exactly which inspections
   read the signal, per the foreign-contract asymmetry rule.
3. `LintStage` passes the supplied signal into `client.open(document, { signal })` at the `:184`
   call, creates no `AbortSignal.timeout` of its own for the wait, and keeps its constructor
   client `timeout` for initialize, shutdown, exit settlement, and transport-close settlement.
4. A deadline abort surfaces as the coordinator's existing refusal: a `ProbeError` carrying
   `code: 'deadline'`, `stage: 'lint'`, and the configured deadline, with the message shape
   `The lint stage exceeded 6000 ms` the rows pin. An `LSPError` must not replace the coordinator
   refusal — translate in `#translate` or at the seam, and record where.
5. Remove prose in `guides/probe.md` that says the client's `timeout` bounds diagnostics; state
   the coordinator-owned signal instead. Touch only sentences the rewire makes false.

## The rows

The acceptance run is
`npx vitest run --project src:server tests/src/server/Probe.test.ts tests/src/server/stages/LintStage.test.ts`.
On the standing tree it fails on the coordinator-deadline rows; after the rewire it must restore:

- `replaces a lint stage its deadline destroyed`;
- `names arming in a boot expiry and arms again for the next claim`;
- the coordinator refusal reading `The lint stage exceeded 6000 ms`;
- a later claim passing through the replacement stage.

Add or adjust rows only where the seam change makes an assertion false, and record each such
change with its reason. The real Oxlint 1.80.0 in this workspace declares `textDocumentSync` with
`openClose` and no `diagnosticProvider`, so the push path serves the lint rows.

## Scope

Owned files: `src/server/types.ts` (the seam), `src/server/Probe.ts`,
`src/server/stages/LintStage.ts`, `tests/src/server/Probe.test.ts` (rows only — the fixture
capability patch stays), `tests/src/server/stages/LintStage.test.ts`, and the named sentences in
`guides/probe.md`. Report-only: `src/server/helpers.ts`, `package.json`, `package-lock.json`,
`node_modules/@orkestrel/lsp/`. Off-limits: everything else. No commit, no push, no
`git checkout`/`restore`/`stash`/`reset`/`clean`, no installs, no tree-wide `format` or
`lint --fix` (scoped `oxfmt --write` over owned files only).

## Output

Your final report, written to `/home/user/lsp/tmp/units/l6-e-probe-report.md` and returned as your
final message:

1. What changed: each owned file with the exact behavioral delta, the seam shape stated with its
   honored-inspections sentence, and where the abort-to-refusal translation lives.
2. The acceptance run before and after, with exit codes and the restored rows named.
3. Scoped gate readings with exit codes: `npm run check` tree-wide, scoped `oxfmt --check` and
   `oxlint --deny-warnings` over the owned files, the unfiltered
   `npx vitest run --project src:server` project.
4. The full `git diff` of the owned files and `git status --short`.
5. Observations outside scope, each named against the unit that owns it.

## Deviation contract

A conflict with the ruled contract stops the unit: report expected, found, exact evidence, done or
not done, and at most one short hypothesis. The named stop conditions: the refusal message cannot
be preserved without touching a report-only file; the seam cannot avoid a false cancellation
promise on a stage that ignores it; a row outside the coordinator-deadline pair reddens and its
cause is not the seam change. The seam's exact TSDoc wording, row titles, and the translation's
placement between `#translate` and the seam are yours to decide, record, and carry on from.

## Acceptance criteria

Ordered cheap-first.

1. `git status --short` shows changes only in the owned files beyond the standing entries.
2. Scoped `oxfmt --check` and `oxlint --deny-warnings` over the owned files exit 0.
3. `npm run check` exits 0 tree-wide.
4. The acceptance run exits 0 with the named rows restored.
5. The unfiltered `src:server` project exits 0.

## Review evidence

The Orchestrator captures the actual diff and the actual `git status` output after you exit and
routes the round's audit to the `analyst` lane per the reconciliation, with the reviewer lane over
the guide sentences.
