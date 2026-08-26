# L5 round acceptance — the lsp conformance suite

Accepted 2026-08-26. The round lands as lsp commits `586758d` (L5-A, the metaModel
mirror and its refresh script), `27725c0` (L5-B, the conformance suite), `2b171bf`
(L5.1, the reviewer-audit fixes), and `c1f5cea` (L5.2, the total drift formatter).

## The audit trail

- The `reviewer` lane (Claude Opus 5, `l5-audit-reviewer-verdict.md`) returned FAIL;
  every finding was carried into the L5.1 brief and landed in `2b171bf`, with the
  Orchestrator's own receipts in `l5-audit-orchestrator-receipts.md`.
- The combined `analyst` lane (GPT-5.6 Sol, `l5-combined-audit-verdict.md`) audited the
  round after L5.1 and returned FAIL with one broken claim: `formatConformanceValue`
  accepted `unknown`, called `JSON.stringify`, and documented no failure — the analyst
  executed a `BigInt` through it and read the thrown `TypeError`, propagated by
  `formatConformanceDrift` and `readConformanceDrift`.
- The membership bindings, typed coordinates, metaModel ownership, installed diagnostic
  predicate, and scope claims were each attacked and CONFIRMED, with the mutation
  controls' recorded failures and byte-exact restorations in `l5.1-fix-report.md`.

## Closing the broken claim

The prescription offered documentation of the failure or removal of it; the adopted arm
removes it — a drift reporter that throws while reporting hides the drift it reports.
L5.2 (`builder`, Sonnet, brief `l5.2-formatter-brief.md`, report
`l5.2-formatter-report.md`) wraps the `JSON.stringify` call so an unserializable value
formats through `String(value)`, updates the TSDoc to the total behavior, and pins the
`BigInt` row red-first: the recorded red is the thrown `TypeError`, the green asserts
`'123'` from `BigInt(123)`.

Orchestrator verification before commit: `git stash list` empty (the unit's "stashed"
wording described an own-edit revert, not the banned `git stash`); the tree carried only
the two owned files; the re-read formatter matches the adopted arm — the try/catch
yields `undefined` on serialization failure and the return selects `String(value)` for
exactly that case, with every serializable value's output unchanged.

## Gate evidence

The host chain of 2026-08-26 over the L5.2 tree (`be7xs1piv`): `format:check`,
`lint:check`, `check`, `build`, and `test` each exit 0, ending `GATE_CHAIN_GREEN`. The
conformance project reports its rows green inside the `test` gate.

## Registered observations, not reopened

- The guide's refresh sentence is unguarded prose because no guides parity project
  exists in the lsp `vite.config.ts` file — registered against the lsp parity
  capability for the wave that adds the guides project.
- The `value is unknown` annotation on `isInstalledDiagnostic` narrows nothing at
  runtime; the analyst ruled the executed comparison sound. Registered as vocabulary
  polish for the M6-adjacent lsp naming pass.
