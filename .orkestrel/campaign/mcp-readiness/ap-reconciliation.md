# A-P reconciliation (Orchestrator, 2026-08-27)

Lanes: subjective (`reviewer`/Opus, no execution, FAIL — 4 broken, 2 findings), objective
(Grok/bench, FAIL — 1 broken, 6 unresolved, 1 finding). Process fact recorded: the bench's ask
mode rejected `node`/`npm`/`vitest`, so the objective lane could not execute; its unresolved rows
carry exact settling commands, and future behavioural audit lanes get Orchestrator-produced run
records supplied in the brief.

## Per-claim ruling

1–2. **CONFIRMED.** Both lanes' source reads agree (one build site for both fields; denylist
   legacy projection); the writer's failing-first wire drives recorded them red-then-green; the
   fix round's verification re-runs the rows.
3. **CONFIRMED.** The diff leaves every refusal path untouched (both lanes verified); existing
   suites pin them.
4. **CONFIRMED** by matching independent arithmetic in both lanes (44 + 11N; cut at N = 1 versus
   368; `-32603` from the dispatcher's snapshot refusal).
5. **BROKEN** (subjective, Orchestrator-reproduced at `ProbeServer.ts:237-239`): `rendered` is
   returned unchecked, so a text block past the byte bound loses the receipt to `-32603` while
   guide and comment claim the receipt unconditionally. Objective's settling construction (a
   400-issue control) becomes the fix unit's test.
6. **CONFIRMED** both lanes.
7/9. **BROKEN** (subjective, client half Orchestrator-reproduced at installed
   `buildCallOutcome`): the byte-bound sentence is false (the key bound still binds), the named
   client discards content blocks and cannot render the text, and the receipt paragraph was not
   re-read against the structured field.
8. **CONFIRMED** both lanes; the `readCall` implicit-`any` nit rides the fix unit.
10. **BROKEN** in both lanes independently: the fallback IS cheaply drivable (the existing
    generator past the 368 cut); P2's comments were copied, not moved; P2 left literal
    expectations un-migrated.

## Findings adopted

- **F1** `#limits` second-copy drift → derive from the composed server's `limit` getter.
- **F2** `LINT_DEADLINE` TSDoc vocabulary → reword to the measured condition.
- **Objective finding** — the bound tests drive a hand-built server, not `ProbeServer`'s
  wiring → the fix unit's new rows drive the real dispatcher or the shipped bin.

## Rulings taken by the Orchestrator

- **The fallback becomes graduated rather than documented away**: carried record → rendered
  text → a minimal text block carrying identity, digest, reason, and the closing receipt line,
  each admitted by the same bounds — making "the receipt always answers" true at every size.
  This sits inside the subjective lane's second option ("check `rendered` and decide there");
  the minimal form is the deciding.
- **The constants stay public** (`constants.ts` entries are exported by the placement law;
  parity rows exist); the minimal-API observation is recorded, not actioned.
- **The inbound `_meta` widening to 4096 keys is deliberate** and gets a guide sentence (bytes
  and depth still bind; the stdio parent is the trusted harness).
- **Routed onward, not this unit**: the modern-path `buildModernResult` bypass (no `_meta`
  server identity on custom-execution results) and the `MCPLimitOptions.keys` doc-versus-
  enforcement drift — mcp findings for the mcp queue's guide-honesty unit to rule code-versus-
  documentation.

## Closure path

P4 (`implementer`, Opus) lands the fixes. Prescription-verbatim parts close by mutation probe
(disable the load-bearing line, watch the adopted pin fail, restore); the graduated-fallback
departure gets a cross-engine check: the Orchestrator produces the executed records, the Grok
lane rules on them.
