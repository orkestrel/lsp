# P1 integration — the returned Probe.test.ts fixture patch, applied

Orchestrator integration action of 2026-08-26, applying the P1 unit's exact returned
shared-file patch: the `ORDERED` and `STALLING` fixtures in
`tests/src/server/Probe.test.ts` (lines 55 and 97) answer `initialize` with
`result: { capabilities: { textDocumentSync: { openClose: true, change: 1 } } }` in
place of the empty capabilities object. Applied by one `sed` substitution over the two
byte-identical lines; `grep -c textDocumentSync` reads 2.

Reading after the patch: `npx vitest run --project src:server
tests/src/server/Probe.test.ts` → exit 1, `Tests 2 failed | 24 passed (26)` — the
`admits one inspection per stage at a time, in arrival order` row closed as the unit
predicted, and the two coordinator-deadline rows remain red on the P1 deviation's
subject: the client's single `timeout` bounding the diagnostics wait. The
`l6-open-bound-design-brief.md` round owns that fork; the probe tree stays held, one
writer serialized, until the L6 ruling lands and the P1.2 successor restores the rows.
