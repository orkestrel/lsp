# P2 — probe's default bounds move to the constants file

- **Role and engine**: `builder`, native Sonnet. Writing unit, sole writer in the probe
  checkout.
- **Objective**: the literal defaults scattered in probe's server classes live as named,
  documented constants in `src/core/constants.ts`, each consumed at its single site, with the
  guide's Surface rows extended to match.

## Context

- Repository: `C:\Users\mikes\WebstormProjects\probe`, clean `main` at `019c18a` (P1 landed).
  Commit nothing.
- Read first: `AGENTS.md`, `.claude/rules/names.md`, `.claude/rules/typescript.md`,
  `.claude/rules/architecture.md`, `.claude/rules/documentation.md`. The design law binding
  this unit: defaults are data, and `src/core/constants.ts` is their designated home beside
  `PROBE_STAGES`, `PROBE_PARTIES`, `PROBE_ERROR_CODES`, `RECEIPT_PREFIX`,
  `RECEIPT_SEPARATOR`.
- The three literals and their sites:
  1. `30_000` — the default inspection deadline, `src/server/Probe.ts` (around `:87`,
     `options?.deadline ?? 30_000`).
  2. `2_000` — the lint stage's lifecycle bound, `src/server/stages/LintStage.ts` (around
     `:60`, a `#deadline` class field; the transport grace spends half of it and the client
     timeout all of it). Orchestrator measurement of record, 2026-08-27: the workspace oxlint
     `--lsp` answers `initialize` in 155 ms, so the value is right and only its home moves.
  3. `4096` — the published key bound P1 added as a `#` field in `src/server/ProbeServer.ts`
     (`limit: { keys: … }`), with its measurement TSDoc (38 keys empty, 11 per issue). P1
     placed it inline because this file was its only owned source file; the constant belongs in
     `constants.ts`.

## Prescription

- Declare the constants in `src/core/constants.ts` in the existing style (exported `const`,
  frozen where object-shaped, TSDoc with an `@remarks` carrying what the current sites' comments
  say — move the P1 measurement sentences with the value). Names, following the existing
  `PROBE_*` pattern and the names rules: `PROBE_DEADLINE` (30_000), `LINT_DEADLINE` (2_000),
  `PROBE_KEYS` (4096). If a rule you read forbids one of these names, stop and report per the
  deviation contract rather than inventing another.
- Replace each literal with the imported constant. No behavior change of any kind.
- Export through the existing core barrel path (constants are already re-exported; verify).
- `guides/probe.md`: add the constants to the Surface table rows where the other `PROBE_*`
  constants sit, one line each matching the TSDoc.
- Tests: if a policy or guide gate requires a parity row for new exports, add it in the
  existing pattern; add no behavioral tests (the values are pinned by the consuming suites).

## Scope

- Owned: `src/core/constants.ts`, `src/server/Probe.ts`, `src/server/stages/LintStage.ts`,
  `src/server/ProbeServer.ts`, `guides/probe.md`, and the narrowest test file a parity gate
  forces.
- Off-limits: everything else, including `src/core/types.ts` (no type changes) and
  `package.json`.

## Execution

Perform the assignment directly and spawn nothing. Validate scoped: `npm run check`, scoped
oxlint and oxfmt `--check` on owned files, `npm run test:src:server`, `npm run test:guides`,
`npm run test:policy`. Do not run the whole suite, tree-wide `format`, or `build`.

## Output

Write your report to `tmp/units/p2-report.md` in the probe repository and return it as your
final message: the diff summary, each constant with its site, the exact commands with final
counts.

## Deviation contract

Stop and report when: a prescribed name collides or a rule forbids it; a test outside the owned
files reddens; or moving a literal changes any observable behavior. Ancillary choices (TSDoc
wording, guide row placement) are yours to decide and record.

## Acceptance criteria

1. No literal `30_000`, `2_000`, or `4096` default remains at the consuming sites; each reads
   its named constant.
2. Scoped check, lint, format-check green; `test:src:server`, `test:guides`, `test:policy`
   green.
3. The guide's Surface rows name the constants.
