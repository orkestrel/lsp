# D2 — parser decomposition design round

One brief, two blind lanes (subjective: shape, naming, fit; objective: correctness, constraints).
Read-only; neither lane edits or accepts.

## Execution

You perform this assignment directly and spawn nothing. Read first: `AGENTS.md`;
`.claude/rules/architecture.md` (kind purity, leaf test, wrapper test, "parsers.ts" naming laws),
`.claude/rules/names.md`, `.claude/rules/tests.md`; then `src/core/parsers.ts` in full,
`src/core/types.ts:350-374` (`LSPDecodeState`), `tests/src/core/parsers.test.ts`, and
`src/core/helpers.ts`.

## Evidence

- A cyclomatic-complexity probe (oxlint `complexity` rule, retained at
  `.orkestrel/lsp/complexity-probe-results.txt`) measured `parseLSPMessages` at 60 — the only
  lsp function above the oxlint default of 20; the next-highest lsp reading is 14.
- The function (`src/core/parsers.ts:33-286`, one exported function of roughly 250 lines) owns,
  in one body: decode-state chaining; a boundary scan with a 3-byte overlap across retained
  segments; segment joining into one buffer; ASCII header validation; header-field parsing
  (`Content-Length` digits and duplication, `Content-Type` media and charset parameters); body
  slicing; UTF-8 decoding; JSON parsing through `parseJSON`; JSON-RPC shape validation; and
  remainder re-seeding.
- The suite (`tests/src/core/parsers.test.ts`, 327 lines) proves incremental split/coalesced
  frames and fault injection; the conformance project (`243 passed` on 2026-08-26) also exercises
  the codec. These proofs are the package's most safety-critical.
- The campaign's design round already ruled the byte seam and client-owned framing permanent
  (`.orkestrel/lsp/plan.md` ruling 3). This round changes nothing about WHERE framing lives —
  only about the internal shape of the codec.

## Questions

1. **Decompose or rule the monolith honest?** `parsers.ts` is a centralized kind file of exported
   functions, so any extracted step must itself be exported and tested (no hidden module
   helpers). Does splitting `parseLSPMessages` into exported leaves improve the code under this
   repository's laws, or does the incremental state machine's cohesion (retained-state chaining
   threaded through every step) make extraction a net loss? Rule it.
2. **If decomposing: name the leaves.** For each: signature, owning file (`parsers.ts` takes only
   `parse*` coercers returning `T | undefined`; a pure lexical scan or join belongs in
   `helpers.ts` per the one-directional naming law), what it owns, and what stays in
   `parseLSPMessages`. Candidate seams to argue for or against: the segment join
   (`LSPDecodeState` → one `Uint8Array`), the boundary scan, the header parse (bytes or text →
   `{ length }` or a refusal), and the message shape gate. Mind that several steps throw
   `LSPError` with the accumulated-messages context — a leaf that throws is not a `parse*`
   coercer, so name where refusal stays.
3. **Proof obligations.** Whatever you rule, state the acceptance criteria that keep the codec's
   proofs binding: which existing tests must stay green UNMODIFIED, what new leaf tests are owed,
   and what the complexity probe must read afterward.
4. **Worth it now?** Weigh churn risk on fault-sensitive proven code against the measured
   complexity and the fleet's possible future adoption of the complexity rule. A defensible "no,
   record the ruling" is a valid answer.

## Output

Numbered verdicts with reasons and `file:line` evidence; if decomposing, the unit's owned files
and acceptance criteria. No process diary.
