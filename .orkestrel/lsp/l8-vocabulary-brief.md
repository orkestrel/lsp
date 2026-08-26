# Unit brief: l8-vocabulary — the registered lsp vocabulary pass

## Role and engine

`builder` — Sonnet, native subagent. You write in `/home/user/lsp`, the sole writer in
that checkout, from the clean committed baseline named in the dispatch message on branch
`main`. You perform the assignment directly yourself and spawn nothing.

## Objective

Close the campaign's registered lsp vocabulary observations: the decorative
`value is unknown` annotation and the inlined client timeout default. The scoped gates
read green.

## Context

- Read before editing: `/home/user/lsp/AGENTS.md`; `/home/user/lsp/.claude/rules/` —
  `names.md`, `typescript.md`, `writing.md`, `documentation.md`; no skill (explicit none).
- Measured sites, 2026-08-26:
  - `tests/setupConformance.ts:544`: `isInstalledDiagnostic(value: unknown): value is unknown`
    with the body `Diagnostic.is(value) && Diagnostic.is3_17(value)`. The annotation
    narrows nothing. The installed `vscode-languageserver-protocol` namespace types
    `Diagnostic.is` as a guard for its own `Diagnostic` type, so the honest signature is
    `value is Diagnostic` with the type imported from the installed package (test files
    may name foreign types). Consumer: the `installed:` field at `:1162`.
  - `src/core/LSPClient.ts:113`: `this.#timeout = options.timeout ?? 30_000` — the default
    sits inline. Hoist it to `src/core/constants.ts` as `LSP_TIMEOUT` with TSDoc in the
    file's established voice (the default request-settlement timeout in milliseconds), and
    read it at `:113`. The `AbortSignal.timeout(30_000)` fence at `LSPClient.ts:51` is an
    example value, not the default — leave it. The `Default: \`30000\`` TSDoc at
    `types.ts:271` and the guide sentence at `guides/lsp.md:19` state the value to the
    reader — leave both literal.
- A `guides` parity project may exist at your baseline (the preceding unit lands it). A new
  exported constant must then satisfy parity: add the `LSP_TIMEOUT` row to the constants
  surface in `guides/lsp.md` in the table's register. Where no parity project exists at
  your baseline, add the guide row anyway — the surface documentation contract binds
  regardless.
- Pre-unit baselines: take the readings from your own pre-edit `npm test` run and report
  them beside the post-edit run; the dispatch message names the expected shape.

## Scope

- Owned: `tests/setupConformance.ts`, `src/core/constants.ts`, `src/core/LSPClient.ts`,
  `guides/lsp.md`.
- Off-limits: `.orkestrel/`, `tmp/`, `ROADMAP.md`, `AGENTS.md`, `.claude/`, `.agents/`,
  everything else. A consequence outside the owned set is a deviation, never an edit.

## Deliverables

1. `isInstalledDiagnostic` returns `value is Diagnostic` with the type imported from
   `vscode-languageserver-protocol`; the TSDoc's `@returns` line still reads true. Where
   the import or the checker refuses that form, stop and report per the deviation
   contract rather than substituting another annotation.
2. `LSP_TIMEOUT` declared in `src/core/constants.ts` (frozen scalar, UPPER_SNAKE_CASE,
   complete TSDoc), read at `LSPClient.ts:113`, with no other `30_000` default left inline
   in `src/`.
3. The `LSP_TIMEOUT` guide row in `guides/lsp.md`, in the constants surface's register.

## Execution

You perform the assignment directly and spawn nothing. Validate scoped, cheap-first:

```text
npx oxfmt --config .oxfmtrc.json --check tests/setupConformance.ts src/core/constants.ts src/core/LSPClient.ts guides/lsp.md
npx --no-install oxlint --config .oxlintrc.json --deny-warnings tests/setupConformance.ts src/core/constants.ts src/core/LSPClient.ts
npm run check
npm test
```

## Deviation contract

Stop and report — expected, found, exact evidence — when the `Diagnostic` type import
fights the checker, when a parity row demands an edit outside the owned set, when a
pre-unit count moves beyond the guides project's own growth by one row, or when a gate
reds outside your edits. Wording inside a deliverable's stated shape is yours to decide
and record.

## Acceptance criteria, cheap-first

1. Scoped format and lint exit 0; `npm run check` exit 0.
2. `grep -n "value is unknown" tests/setupConformance.ts` reports no hit;
   `grep -rn "30_000" src/` reports only the example fence at `LSPClient.ts:51`.
3. `npm test` exit 0 with every pre-edit count unchanged except any guides-parity growth
   your own guide row causes; name both readings.
4. A writing-rules sweep over your added and changed prose lines passes, pattern and
   population named.

## Output

Write the report to `/home/user/lsp/tmp/units/l8-vocabulary-report.md`: each deliverable
with before and after, the gate readings with exit codes, the sweep, and the actual
`git status --short` and `git diff --stat` output. Your final message is a short summary
naming the report path.
