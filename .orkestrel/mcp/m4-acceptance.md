# M4 acceptance — the mcp tasks wave, 2026-08-26

M4 is accepted at mcp `11c879c` on `claude/lsp-spec-audit-est33d`.

## What closed

The wave's units all landed and are retained beside this file: `m4-mirror` and its
successor (`bc54b38`), `m4-stream` (`bef9f40`), `m4-proof` (`0fe1879`), `m4-guide`
(`c2a35d4`), the `m4-gates` sweep, and the `m4.1-repairs` fix unit (`11c879c`).

## The audit trail

- The round audit ran the substituted lanes per the user's ruling: the Grok objective
  lane and the Opus reviewer lane both returned FAIL, the checker's rows reconciled, and
  the R1 probe settled the digest row's reachability by measurement
  (`m4-round-audit-verdict.md`).
- Every reconciled finding closed in `m4.1-repairs` (Opus), whose deliverables adopted
  the reconciliation's prescriptions with two recorded ancillary decisions.
- The fix round closed on the `checker` lane (Sonnet, an engine that did not write the
  unit): PASS on every claim (`m4.1-checker-verdict.md`), beside the Orchestrator's own
  gate re-run.

## The acceptance evidence

The Orchestrator's scoped run after the writer exited, 2026-08-26: scoped format and
lint exit 0, `npm run check` exit 0, conformance `42 passed (42)` exit 0, guides
`144 passed (144)` exit 0, the scoped four-file core suite `596 passed (596)` exit 0.
The full-chain reading stands from `m4-gates`: `1151 passed | 1 skipped`, every exit 0.

## What follows in the M wave

M5 (the deprecated surface, `builder`) and then M6 (the naming cascade, ruled under the
user's delegated final say — the ruling is recorded in the routing ledger
`campaign/routing-2026-08-26-resume.md` and lands with the M6 unit, last so mcp bumps
once).
