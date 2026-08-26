# Audit verdict — @orkestrel/lsp L2 core contract and codec

Round run 2026-08-25 on subject `073d7d2` in `/home/user/lsp`, brief
`tmp/units/l2-audit-brief.md` (retained beside this file as `l2-audit-brief.md`).

Lanes: the `reviewer` (Opus 5, native) ran as the independent lane — the engine that did not
write the subject — covering design fit and every correctness claim reading could reach; its
immutable return is retained as `l2-audit-reviewer-verdict.md`. The Sol `analyst` lane did not
run this round: its engine wrote the subject, and the objective lane is deferred to the combined
L2 + L3 round, recorded here per the audit step's rule. The `checker` did not run; the mechanical
criteria were re-run by the Orchestrator directly.

Orchestrator reproductions before ruling: the message-loss, unbounded-header, unknown-field, and
re-scan mechanics all confirm by direct read of `src/core/parsers.ts` (the loss is definitional —
a local array discarded by a mid-loop throw); `LSP_METHODS` freezes without `as const` while
`LSP_ENCODINGS` keeps its literals; `npm run test:policy` re-run by the Orchestrator reports
`93 passed (93)` (claim 5's residual, settled green).

## Rulings

- Claims 1, 2, 4, 5, 6, 7 — `CONFIRMED` with named attacks; claim 5's mechanical half settled by
  the Orchestrator's policy run. The `isLSPError` placement in `errors.ts` and the
  `LSPErrorContext`/`LSPErrorOptions` exports are correct rule-driven resolutions, not
  departures.
- Claim 3 — `BROKEN`, retained. A fault while scanning a later frame of a coalesced chunk
  discards every message already decoded from that chunk. Ordinary traffic reaches it (a
  diagnostics publication coalesced ahead of a malformed frame). Carrier: L2.1 item 1.
- Claim 8 — `BROKEN`, retained. The mid-body split retention path is executed by no row
  (carrier: L2.1 item 5), and the parser refuses unknown header fields with no ruling, test, or
  prose behind the refusal (carrier: L2.1 item 3, with the ruling below).
- Finding C — retained. Header accumulation with no terminator grows without bound, and the
  reconciliation's sentence "a hostile header cannot reserve unbounded memory" was false of the
  shipped code. This verdict is the correction of record; L2.1 item 2 makes the sentence true.
- Finding D — retained. The parser re-scans and re-copies the whole accumulation each call,
  quadratic in chunks. Carrier: L2.1 item 4.
- Finding E — retained. `LSP_METHODS` widens to `string`, defeating the narrowing L3 routes on.
  Carrier: L2.1 item 6.
- Finding F — carrier confirmed, no action this round: the guide and its parity gate belong to
  L6 in the reconciliation's unit table, and the surface F names is exactly what L6 exists to
  cover.

## Orchestrator rulings the fixes bind to

- **Unknown header fields are ignored, not refused.** The base protocol names its supported
  fields over an HTTP-style header part and mandates no refusal of others; the convention for
  that header form is tolerance, a future protocol revision may add fields, and the reference
  implementation reads the fields it knows. The tolerance is stated in the parser's TSDoc and
  pinned by a test.
- **Decoded work survives a fault.** A frame decoded before a fault in the same chunk is real
  traffic; the fault carries the already-decoded messages in the error's context so the consumer
  dispatches them before tearing down.
- **Both accumulation paths are bounded.** The declared-length bound stands; the undeclared
  header accumulation gets its own published bound.
- **Continuation appends; it never re-derives.** The state carried between calls preserves the
  resolved boundary so a chunked body costs linear work.

## Terminal ruling

`FAIL` — fix unit L2.1 carries every retained finding, runs on the Sol bench from the committed
`073d7d2` baseline, and lands before L3 opens so the client builds on the repaired codec and the
corrected parse signature. L2.1's auditor context: the combined L2 + L3 objective round (Sol
analyst on the accumulated core, told its engine wrote it) plus the reviewer's re-check of the
repaired rows rides with the L3 audit. Wave L acceptance still closes on the reconciliation's
exit criterion.
