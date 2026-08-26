# Audit — the L6 round in the lsp tree (L6-A, L6-B, L6-D), subjective lane

Role and engine: `reviewer`, Claude Opus 5, native read-only subagent, subject repository
`/home/user/lsp` on `main` at commit `adceab2` with the L6 round HELD UNCOMMITTED in the working
tree. You are the audit round's subjective lane: design acceptance, API and vocabulary shape,
TSDoc and guide voice, placement, and simplification. You audit; you never edit, and you never
accept — the Orchestrator accepts. An objective `analyst` lane runs separately over the round's
correctness claims and the probe-side L6-E unit; you do not run it and you do not rule on the
probe tree.

The round's writers: L6-A (`src/core/types.ts`, `src/core/factories.ts`) and L6-D
(`guides/lsp.md`) were written by the Opus 5 native `implementer`; L6-B (`src/core/LSPClient.ts`,
`tests/src/core/LSPClient.test.ts`, `tests/src/server/integration.test.ts`) was written by GPT-5.6
Sol on the bench. Cross-engine coverage for the Opus-written units comes from the analyst lane;
your lane supplies the cross-engine coverage for the Sol-written L6-B, so its claims are yours to
rule on with full weight, not as a courtesy pass.

Before working, read: `/home/user/lsp/AGENTS.md`; the rules `.claude/rules/names.md`,
`.claude/rules/typescript.md`, `.claude/rules/patterns.md`, `.claude/rules/tests.md`,
`.claude/rules/documentation.md`, `.claude/rules/writing.md`, and `.claude/rules/quality.md` (its
Falsification law governs your verdict shape); the guide `guides/lsp.md`.

## Evidence set

- The binding ruling: `/home/user/lsp/.orkestrel/lsp/l6-design-reconciliation.md` and the adopted
  contract in `l6-design-analyst-ruling.md`, same folder.
- The unit records, same folder: `l6-a-types-brief.md`, `l6-a-types-report.md`,
  `l6-b-client-brief.md`, `l6-b-client-report.md`, `l6-d-guide-brief.md`, `l6-d-guide-report.md`.
- The actual diff and status, captured 2026-08-26: `l6-round-diff.txt` and `l6-round-status.txt`,
  same folder — the whole held round in one capture. Per-unit captures sit beside them
  (`l6-a-diff.txt`, `l6-b-diff.txt`, `l6-d-diff.txt`).
- The live working tree itself: read the current `src/core/types.ts`, `src/core/factories.ts`,
  `src/core/LSPClient.ts`, `guides/lsp.md`, and the test files directly — the held tree is the
  subject, and the captures are its record.
- The gate readings in the L6-B report: the scoped runs and the tree-wide `npm run check` exit 0.

## The claims, numbered and falsifiable — rule on each with evidence

1. The `LSPOpenOptions` contract in `src/core/types.ts` states the ruled scope split exactly: the
   required `readonly signal: AbortSignal` owns the diagnostics wait, and the constructor
   `timeout` prose claims only initialize, shutdown, exit-write, and transport-close settlement.
   No sentence claims a bound the code does not enforce.
2. The API shape obeys the naming laws: `open(document, options)` keeps single-word members, the
   options bag groups rather than compounds, the `aborted` and `closed` error codes are real
   domain states beside the existing codes, and no decorative literal or sentinel appears.
3. The `createLSPClient` factory TSDoc's timeout wording matches the types contract and the guide
   word-for-word on scope — the same term for the same concept, no synonym drift.
4. The `LSPClient` class TSDoc and its example show the required options bag and the `close`
   notification, and every sentence survives the writing rules — no `should`, no counts, no
   unspaced em dash, no claim the reader cannot check.
5. The L6-B test rows serve the reader: each added or converted row's title states the behavior it
   proves, the delayed-success rows read as load-bearing scope proofs rather than timing
   accidents, the caller-signal conversions record their reason in the report, and no row asserts
   an implementation detail where a behavior belongs.
6. The guide (L6-D) matches the landed source exactly: the scope-split paragraph, the revised
   fence carrying `{ signal: ... }` and `close(uri)`, and the methods and surface rows agree with
   `src/core/types.ts` as held — every backticked name resolves, every promised behavior is the
   one the client implements, and the prose claims no more.
7. The round adds no undocumented public surface and removes no documented one: the exports
   reachable from the barrel and the guide's surface rows still agree in both directions.

## Output

Return, as your final message, a verdict block per claim — CONFIRMED TRUE, CONFIRMED FALSE, or
UNPROVABLE with the exact evidence read (file and line, or record section) — followed by any
finding outside the claims with its severity and the unit that owns it, and ONE terminal line:
`VERDICT: PASS` when every claim confirms true, otherwise `VERDICT: FAIL`. No process diary. The
Orchestrator retains your verdict to `.orkestrel/lsp/` and reconciles it with the analyst lane.
