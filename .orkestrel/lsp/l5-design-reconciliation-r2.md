# L5 design reconciliation — amendment r2 (2026-08-26)

Amends `l5-design-reconciliation.md`; the original stands. What changed and why:

- **The fixture path is `tests/mirrors/metaModel.json`, not `tests/fixtures/metaModel.json`.**
  The L5-A run surfaced that the tree-wide `format:check` gate flags the mirror — the
  Orchestrator reproduced it (`npm run format:check` reporting
  `tests/fixtures/metaModel.json` as the one unformatted file) — and both formatter ignore
  carriers, `.oxfmtrc.json` and `.prettierignore`, are vendored files a target must not
  edit. The ruling: fetched-bytes mirrors live under `tests/mirrors/`, a directory the
  canonical vendored `.prettierignore` ignores, keeping authored fixtures under
  `tests/fixtures/` fully formatted (the mcp precedent's `browserServer.ts` stays
  enforced). The Orchestrator probed the convention in lsp before ruling: with the line
  present and the file moved, `format:check` exits 0 over 142 files.
- **The canonical line lands in the scaffold host inventory in this commit** — the one
  lawful edit site for a vendored file. The vendored surface moves, so scaffold owes a
  bump and publish at the campaign's release, and each target re-pins and repairs then.
  The lsp working copy carries the identical line ahead of that release; until the re-pin,
  `scaffold audit` in lsp reports that file as drift — a recorded converging state, not a
  defect.
- **L5-A completes through the successor brief `l5a-metamodel-brief-r2.md`** (the
  predecessor pair stands): the script destination and the guide path move to the mirrors
  path, with the probe state declared as standing conditions.
- **The L5-B brief must name the mirrors path** everywhere the design said `tests/fixtures`.
- **Audit note.** The Orchestrator wrote the canonical ignore line and performed the probe
  move; both are part of the L5-A r2 unit's subject, and the L5 audit round's lane — an
  engine the Orchestrator does not share — rules on them with the rest of L5.

The exit criterion is unchanged; this is a re-baseline of the units, not a rescope.
