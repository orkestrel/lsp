# extraction-wave audit — round 3 reconciled verdict

Lane: objective (Cursor Grok, the non-writer engine — Opus 5 wrote both units), blind, one
brief (`extract-audit-brief.md`, retained beside this file; lane distillate retained as
`extract-audit-objective-verdict.md`). Subjects: server `59a8e74`+`aaecb8c`, mcp `9986b0f`.
Lane terminal: `FAIL — 0 broken, 2 unresolved` — both UNRESOLVED named their settling runs,
which the Orchestrator executed.

## Per-claim

1 (server surface closure), 3 (containment exact), 4 (sentinel rewire exact — the only
regex+atob vs codec divergence class is unused trailing bits, verified against the regex and
the sentinel fixtures), 5 (isStandardBase64 scope), 6 (guides true), 8 (wave-ready after
re-pin) — CONFIRMED by the lane under named attacks.

7 (pins and blast radius) — settled CONFIRMED by the Orchestrator: `git show --name-only`
for all three commits returns exactly the briefs' owned files plus package.json/lockfile;
no vendored path.

2 (token delta bounded) — settled as a SPLIT-CLAIM: the universal "the only delta is the
whitespace closure" was too narrow. Orchestrator probe against the built server dist, with
the retired decoder transcribed from `33b39c7` (byte-equality as the old-accept oracle;
clean token verifies `client` and garbage refuses on both paths as live controls):

| mutant class | old | new |
| --- | --- | --- |
| unused-bit sibling of the final signature character | ACCEPT | refuse |
| `=` appended to the signature | ACCEPT | refuse |
| url alphabet swapped to standard (`_`->`/`) | ACCEPT | refuse |
| tab inserted mid-signature | ACCEPT | refuse |

Every divergent class is a second accepted spelling of the same signature closed — the
malleability class in full, not whitespace alone. Canonical tokens and garbage are
unchanged. No legitimate caller pattern breaks (a caller presents the token as signed).
The server commit message already states the general class; the retained unit report
carries this settlement as an Orchestrator addendum. No fix unit: the code is correct and
strictly better than the unit reported.

## Ruling

Round 3 closes ACCEPTED: every claim settled on evidence, no broken code, no fix carriers.
The extraction wave stands. Bounded on the record: what is NOT closed is out-of-tree
consumers of server's deleted helpers (unknowable from these trees, greenfield rule
applies) and the mcp legacy-transport timing budget flake (carried to that capability's
owner in the mcp unit report — not this wave's).
