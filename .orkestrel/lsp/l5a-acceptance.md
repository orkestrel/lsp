# L5-A acceptance — the lsp metaModel mirror (2026-08-26)

Accepted. The unit lands in lsp commit `586758d` on the `claude/lsp-spec-audit-est33d` branch.

## What the round covered

- The predecessor run (brief `l5a-metamodel-brief.md`, report `l5a-metamodel-report.md`)
  fetched the LSP 3.18.0 metaModel instance and wrote the refresh script and guide passage
  against the `tests/fixtures` path, then surfaced that the tree-wide `format:check` gate
  flags the fetched bytes.
- The Orchestrator's ruling and probe (recorded in `l5-design-reconciliation-r2.md`):
  fetched-bytes mirrors live under `tests/mirrors/`, the canonical vendored
  `.prettierignore` gains that entry in the scaffold host inventory (scaffold commit
  `701e12a`), and the lsp working copy carries the identical line ahead of the release —
  recorded converging drift until the re-pin.
- The successor run (brief `l5a-metamodel-brief-r2.md`, report `l5a-metamodel-report-r2.md`)
  moved the script destination and the guide passage to the mirrors path and re-verified
  the fixture against the pin.

## Acceptance evidence

- Fixture: `tests/mirrors/metaModel.json`, SHA-256
  `caae8df639a4248520a3f589fd72945365e9d8ebca5baf564161a515430d9d41`, 434,788 bytes,
  `metaData.version` `3.18.0` — verified by the r2 unit and by the Orchestrator's digest
  reading before the ruling.
- Host gate chain over the completed tree on 2026-08-26 (script
  `l5a-host-gates.sh`, log `l5a-host-gates.log`): `format:check`, `lint:check`, `check`,
  `build`, and `npm test` each exit 0; the chain's `GATE_CHAIN_GREEN` sentinel printed and
  the harness task recorded exit code 0. The `test:config` project reports 46 passed.
- Diff and status captured at commit: the delta is `.prettierignore` (the mirrors entry),
  `guides/lsp.md` (the `## Conformance` passage), `scripts/metamodel.sh` (new, executable),
  and `tests/mirrors/metaModel.json` (new, fetched bytes).

## Audit posture

The L5-A subject — the mirror, the script, the guide passage, and the Orchestrator's own
ignore-line edit and probe move — is audited with the rest of L5 by the L5 audit round's
lane on an engine the Orchestrator does not share, per the note in
`l5-design-reconciliation-r2.md`. Acceptance here closes the unit, not the round.

## Obligations recorded

- scaffold owes a bump and publish at the campaign's release because the vendored
  `.prettierignore` surface moved; each target then re-pins and repairs.
- `scaffold audit` in lsp reports the `.prettierignore` copy as drift until that re-pin —
  converging state, not a defect.
