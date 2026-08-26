# H3 acceptance evidence

Subject: the H3 implied-close unit, committed as html `0b71f48` on the
`claude/lsp-spec-audit-est33d` branch, 2026-08-26. Baseline was html `2c501b3` with a clean
tree, per the effective brief `h3-implied-close-brief-r2.md`, which superseded the original
brief on the baseline alone after H1.2 landed between staging and launch. The status at
capture listed exactly the owned files: `src/core/parsers.ts`, `src/core/constants.ts`,
`guides/html.md`, `tests/src/core/parsers.test.ts`, `tests/src/core/HTML.test.ts`, and
`tests/src/core/constants.test.ts`; `src/core/helpers.ts` and `src/core/types.ts` are
untouched.

## Host gate chain

The Orchestrator's independent run over the uncommitted tree (`h3-host-gates.sh`,
2026-08-26): `format:check` exit 0, `lint:check` exit 0, `check` exit 0, `build` exit 0,
`npm test` exit 0, terminal line `GATE_CHAIN_GREEN`.

## Unknowns closed in-unit

- The overflow path reaches the defect: the focused overflow row ran red against the
  shallow scan (a deepest `p` containing `xy`) and green after (`p` and `div` as
  siblings).
- The deep scan's first shape reddened the owned sanitize reparse-fixpoint row by closing
  `td` without `tr`; continuing along the reachable matching chain repaired it, and no row
  outside the owned files reddened.

## Bench limits honored

Network denial prevented an independent WHATWG fetch; the barrier derivation rests on the
brief's 13.2.6 ruling, with each key's departures recorded in the constants TSDoc. The
`prove` receipt was unavailable in the sandbox; the red-first records and the `cmp`-proven
top-only mutation account are the instrument evidence.

## Open at capture

The audit lane over H3 (native Opus `reviewer` — the engine that did not write the unit)
rules on the report against the committed diff at `h3-diff.txt`; its verdict lands beside
this file. The subject spans correctness (the scan and the barrier derivations) and shape
(the constants surface and the guide prose), so the analyst lane runs as the second lane
if the reviewer returns FAIL, per the audit step.
