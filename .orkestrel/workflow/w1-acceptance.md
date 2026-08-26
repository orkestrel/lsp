# W1 acceptance evidence

Subject: the W1 progress reshape, committed as workflow `b00af86` on the
`claude/lsp-spec-audit-est33d` branch, 2026-08-26. Baseline was workflow `6ad5b53` with a
clean tree. The status at capture listed exactly the owned files: `guides/workflow.md`,
`src/core/types.ts`, `src/core/validators.ts`, `src/core/cloners.ts`, `tests/setup.ts`,
`tests/src/core/validators.test.ts`, `tests/src/core/cloners.test.ts`, and
`tests/src/core/tasks/Task.test.ts`. The post-commit status is empty.

## Host gate chain

The Orchestrator's independent run over the uncommitted tree (`w1-host-gates.sh`,
2026-08-26): `format:check` exit 0, `lint:check` exit 0, `check` exit 0, `build` exit 0,
`npm test` exit 0, terminal line `GATE_CHAIN_GREEN`.

## Ruling on the unit's deviation

The literal acceptance command `grep -n "unit" src/core/types.ts src/core/validators.ts
src/core/cloners.ts` also matches pre-existing runner prose about substrate units, which the
unit reported instead of editing. The criterion's intent was the progress surface: every
progress-member `unit` declaration and read is gone, `RunnerEventMap.unit` is the one
remaining `unit` member and predates the unit, and no unrelated prose moved. The reading is
accepted; the criterion closes.

## Instrument limit

The `prove` receipt was unavailable to the unit (`MCP tool call requires approval, but
approval policy is never`), consistent with the session-wide instrument state. The direct
mutation run on the `total < progress` comparison — red under the disabled comparison, green
after the exact clause returned — stands as the bounds evidence, with the shipped clause
subject to the audit lane's reading of the committed diff.

## Open at capture

The audit lane over W1 (native Opus `reviewer` — the engine that did not write the unit)
rules on the report against the committed diff at `w1-diff.txt`; its verdict lands beside
this file.
