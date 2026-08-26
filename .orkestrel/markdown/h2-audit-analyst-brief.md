# Lane assignment — you hold ONE lane

You are the objective audit lane (`analyst`, GPT-5.6 Sol) for the H2 round audit in
`/home/user/markdown`. You hold this one lane only. Do the work yourself, directly, in this
session. Do not simulate any other lane, and do not reconcile — the Orchestrator
reconciles. Your sandbox is read-only: you audit, you never edit, and you never accept.

# Audit — the H2 round in the markdown tree, objective lane

The subject repository is `/home/user/markdown` on the `claude/lsp-spec-audit-est33d`
branch with the H2 provenance round HELD UNCOMMITTED in the working tree. Your lane is
correctness, constraints, and what the code and contracts actually permit. A subjective
lane runs separately; you do not run it and its subjects do not bound yours.

The round's writers: H2-U1 (the types contract), H2-U5 (the provenance handle in
`Markdown.ts`), and H2-U6 (the guide) were written by Claude Opus 5; H2-U2 (the coordinate
engine), H2-U3 (span threading), and H2-U4 (the rewrite engine) were written by GPT-5.6
Sol; H2-U3.1 (an assert-helper widening) by Sonnet. Your lane is the cross-engine coverage
for the Opus-written units; rule on them with full weight, and rule on any objective defect
you find anywhere in the round regardless of writer.

Before working, read: `/home/user/markdown/AGENTS.md`; the rules
`.claude/rules/typescript.md`, `.claude/rules/tests.md`, `.claude/rules/patterns.md`, and
`.claude/rules/documentation.md` (the Falsification law in `.claude/rules/quality.md`
governs your verdict shape). Then the binding design record:
`/home/user/lsp/.orkestrel/markdown/h2-design-reconciliation.md` and the adopted laws in
`h2-design-analyst-ruling.md`, same folder.

## Evidence set

- The unit records under `/home/user/lsp/.orkestrel/markdown/`: the briefs and reports for
  `h2-u1-types`, `h2-u5-handle`, and `h2-u6-guide`, with the sibling unit records beside
  them.
- The whole held round: `h2-round-diff.txt` (3238 lines, covering exactly the tree's
  modified files) and `h2-round-status.txt`, same folder.
- The live working tree itself — the held tree is the subject; read the current sources
  directly.
- Orchestrator host evidence, taken 2026-08-26: the `guides` parity project reports
  `18 passed (18)` and the root `tsc --noEmit` exits 0 on the held tree. Your sandbox runs
  nothing; these runs are supplied.

## The claims, numbered and falsifiable — rule on each with evidence

1. Every behavioral sentence of the provenance prose in `src/core/types.ts` — the
   `MarkdownSpan`, `MarkdownSegment`, `MarkdownSource`, `MarkdownDerivation`, and
   `MarkdownInterface.span` documentation — is true of the shipped implementation. Rule
   sentence by sentence against executed behavior: where a sentence states a law the code
   contradicts — in particular, what a text run coalesced at parse time from adjacent
   fragments reports through `span`, against what `coalesceText` in `src/core/helpers.ts`
   actually records — the sentence is CONFIRMED FALSE with the code and the test row that
   prove it.
2. `Markdown.#derive` resolves a span through the derivation chain correctly: the
   read-source-first order is uniform, the walk terminates for every chain the public API
   can build — including a chained rewrite whose output identity reappears as a later
   hop's source — and no chain the implementation permits returns a span belonging to a
   different node.
3. `coalesceText` merges only what it may claim: rule whether a merged node's recorded
   region can cover original text that belongs to neither fragment — a merge across a
   dropped or transformed region (the trailing-space hard-break path in
   `src/core/parsers.ts` and the normalization leaves in `src/core/helpers.ts` are
   candidate doors) — and whether any such over-claim is reachable through `parse`.
4. `sliceSource` computes exact boundaries for a multi-segment source: each produced
   segment's derived range and original range agree with the inputs at every boundary,
   including a zero-width segment between two runs and a slice landing exactly on a
   segment edge.
5. `projectSpan` is deterministic and correct for a zero-width range (`from === to`) at a
   position where two segments abut, and its choice is consistent with the documented
   contract.
6. The U5 handle keeps the span map sound across the entity's lifecycle: `#spans` is
   populated and read so that `span` answers for exactly the nodes of the current
   document, `map` resolves the tuple so a rewrite's derivations bind to the input
   document's nodes, and no operation leaves the handle answering from a stale document's
   identities.
7. The guide's provenance passage makes no claim the code refuses: recompute each value
   comment and behavioral sentence in the `## Source provenance` section of
   `guides/markdown.md` against the shipped implementation, and rule any false one
   CONFIRMED FALSE with the computation that breaks it.
8. The round leaves no type-level red the scoped projects cannot see: the test files
   compile under the root `tsconfig.json` with `noUncheckedIndexedAccess`, judged from the
   supplied root reading and your own reading of the indexed accesses the round added.

## Output

Return, as your final message, a verdict block per claim — CONFIRMED TRUE, CONFIRMED
FALSE, or UNPROVABLE with the exact evidence read (file and line, or record section) —
followed by any finding outside the claims with its severity and the unit that owns it,
and ONE terminal line: `VERDICT: PASS` when every claim confirms true, otherwise
`VERDICT: FAIL`. No process diary.
