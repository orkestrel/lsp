# p2-audit-2 — round verdict and reconciliation

Round subject: the `p2-range` unit — `Issue.line` replaced by a zero-based UTF-16
`range` (`LSPRange` reused from the installed `@orkestrel/lsp`) across the TypeStage,
LintStage, and RuntimeStage producers and the `formatIssue` renderer, held uncommitted
over probe `42e0b1e`. Reconciled 2026-08-26.

## Lanes that ran

| Lane | Engine | Result |
|---|---|---|
| Objective audit | Opus 5 (native, substituted for GPT-5.6 Sol — bench dark on model access, routing ledger) | `FAIL -- 0 broken, 1 unresolved` (`p2-audit-2-objective-verdict.md`) |
| Insurance evidence sweep | Cursor Grok (bridge) | Distillate, no verdict (`p2-insurance-distillate.md`) |
| Subjective lane | not run | The subject is a coordinate-contract adoption with no API-shape or naming change beyond the ruled `range` member; the design round already ruled the shape, and no trigger in the audit step named the lane. Recorded here per the audit-step contract. |

The unit's writer engine was Opus 5 (native), so the objective lane shares the writer's
engine under the recorded substitution. The insurance sweep (user ruling, 2026-08-26)
adds a non-Opus evidence reading; at reconciliation the Opus verdict carries the higher
prior per that ruling.

## Reconciliation

- Claims 2, 3, 4, 6, 7, 8, and 9: `CONFIRMED` by the lane with named attacks. Accepted.
- Claim 5: `CONFIRMED` with coverage stated — the RuntimeStage instrument row covered the
  line half alone. The settling instrument closed the residue: the raw-beside-stored
  reading proves the column conversion live (raw 16 stored 15), independent of the unit's
  self-report.
- Claim 1: `UNRESOLVED` on the RuntimeStage column basis, settled by the Orchestrator's
  instrument (`p2-settle-receipts.md`): the frames the stage receives are one-based in
  line and column at an interior column and at the column floor, so the lowering is
  correct and no negative `character` is reachable in this pipeline. The insurance
  distillate corroborates the mechanism: the Node pool wires `getSourceMap` into the
  `stacks` population (`TestRun.syncUpdateStacks`), the raw branch fires when no
  versioned map comes back, and the remap branch — one-based line, zero-based column —
  exists behind it. The measurement shows the raw branch is the one this pipeline takes.
- Registered, not repaired: **the RuntimeStage frame-basis dependence on Vitest's
  un-remapped stacks.** A Vitest change that routes the stage's frames through the remap
  branch flips the column basis and can produce `character: -1` at a mapped column 0,
  which the guard chain refuses loudly (a thrown invalid-verdict, never a silent wrong
  coordinate). The settling instrument re-produces the detecting measurement. Carried in
  the campaign state's registered-capabilities list.
- Claim 7's observation (the pinned-column comment's binary reading presumes the
  one-based basis) is documentation of the same registered risk and travels with it.

## Ruling

The round closes ACCEPTED. Every claim stands confirmed or settled by measurement, the
acceptance gate chain reads green on the held tree (`format:check`, `lint:check`,
`check`, `build`, and `npm test` all exit 0, every project passing — the routing ledger
row records the counts), and the P2 commit lands behind that chain as the round's single
commit.
