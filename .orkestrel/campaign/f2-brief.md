# F2 — audit fix unit: the accepted A2 findings, both repositories

## Role and engine

`implementer` — Claude Opus 5, native.

## Objective

Land the accepted A2 findings exactly as prescribed in
`.orkestrel/campaign/a2-verdict.md`. Two trees, one writer, process first then lsp. Invent
nothing beyond the prescriptions.

## Context

Read first: `.orkestrel/campaign/a2-verdict.md`; then per repository its own rule files where a
fix touches them (`.claude/rules/writing.md`, `typescript.md`, `architecture.md`,
`documentation.md`). Baselines: process clean at `b07ba7f`, lsp clean at `61d9a3a` — confirm
both with `git status --porcelain` before editing.

The fixes:

### Process repository (`C:\Users\mikes\WebstormProjects\process`)

1. **A2-1, validation order.** In `Process`'s constructor prefix, validate in the `23808f2`
   engine order (command, workspace, grace, drain, delivery, evidence), then `backlog`, then
   construct `Supervisor` from a plain literal so option getters run once and never re-run
   after a refusal (`Session` is the precedent). Add the regression row: a construction whose
   `command.file` is empty AND whose `backlog` is invalid throws the `command` refusal, with the
   single-invalid `backlog` row beside it as the control.
2. **Rev-1.** `src/server/Session.ts` class TSDoc (the pooled-buffer sentences around lines
   18-21): replace with the corrected reason already at `src/core/types.ts:337-343` — the
   payload is a plain `Uint8Array` rather than the host `Buffer` the read produced, so a
   consumer keeps it, mutates it, and reads its whole backing buffer without depending on a host
   type.
3. **Rev-5.** `src/core/types.ts` `end` TSDoc: state that the flush is unbounded when the child
   stops reading its input, and that a caller wanting a bound races `end` against its own
   window. `guides/process.md`: the same sentence where the guide documents `end`, and the
   "Close a byte session cooperatively" pattern races `await session.end()` against the
   pattern's existing window instead of awaiting it bare.
4. **Rev-4.** `tests/src/server/Session.test.ts:105-106`: delete the `owns` assignment and
   inline the predicate as the anonymous callback at its one use.
5. **Rev-9.** Same file: rename the `pooled` variable to `host`.
6. **Rev-6.** `src/server/Supervisor.ts:230`: "Writes raw bytes to the open standard-input
   channel."
7. **Rev-7.** Referential `below` → `following` at `Supervisor.ts:423`, `:345`, `:357`,
   `Session.ts:54`; recast `Session.ts:198`'s "the second half of the same guarantee" as the
   invariant it names (no `guarantee` as a claim).
8. **Rev-8.** `guides/process.md:353-366`: keep the table, drop the deferring clause, introduce
   the table with a complete colon-terminated sentence naming what follows.

### lsp repository (`C:\Users\mikes\WebstormProjects\lsp`)

9. **Rev-2.** `src/server/types.ts:15-16` and `guides/lsp.md:135`: reword to the shared window —
   `close` closes the input channel and waits `grace` for the flush and the child's own ending
   together. `StdioClientTransport.ts`'s own `close` TSDoc is already correct; do not touch it.
10. **Rev-7 (lsp site).** `src/server/transports/StdioClientTransport.ts:166`: "The rejection
    below" → "The following rejection" (or equivalent with `following`).

## Scope

- Owned, process: `src/server/Process.ts`, `src/server/Session.ts`, `src/server/Supervisor.ts`,
  `src/core/types.ts`, `guides/process.md`, `tests/src/server/Session.test.ts`,
  `tests/src/server/Process.test.ts` ONLY for the new A2-1 regression rows (nothing existing
  changes).
- Owned, lsp: `src/server/types.ts`, `guides/lsp.md`, `src/server/transports/
  StdioClientTransport.ts` (the one comment word).
- Off limits: everything else in both trees; both `package.json` files; `guides/probe.md`.
- Validation, scoped and read-only, per repository after its edits: process —
  `npm run lint:check`, `npm run check`, `npm run test:src:server`, `npm run test:guides`,
  `npm run format:check`; lsp — `npm run lint:check`, `npm run check:src:server`,
  `npm run test:src:server`, `npm run test:guides`, `npm run format:check`.

## Execution

You perform this assignment directly and spawn nothing. Work the process tree to green first,
then the lsp tree.

## Output

Write the report to `tmp/units/f2-report.md` (in lsp) and return it: per-finding disposition,
the A2-1 regression rows' failing-first or mutation evidence, commands with real counts per
repository, both `git diff --stat` and `git status --porcelain` outputs. No process diary.

## Deviation contract

Stop and report when a prescription conflicts with a rule or the code, or when the validation-
order restoration moves any row of the unmodified `Process` suite beyond the two new rows.
Wording inside a prescribed sentence is yours where the prescription grants it.

## Acceptance criteria, cheap first

1. Both `git status --porcelain` outputs show only owned files.
2. The dual-invalid construction reports the `command` refusal (the new row proves it, and its
   mutation or failing-first evidence is recorded).
3. Process gates green: lint, check, `test:src:server` (169+2 new rows expected — state the real
   count), guides, format.
4. lsp gates green: lint, scoped check, `test:src:server` 20, guides 27, format.
5. No `below`-referential or `guarantee`-claim hit remains at the named sites.
