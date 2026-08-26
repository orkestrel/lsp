# Audit — the H2 round in the markdown tree, subjective lane

Role and engine: `reviewer`, Claude Opus 5, native read-only subagent, subject repository
`/home/user/markdown` on the `claude/lsp-spec-audit-est33d` branch with the H2 round HELD
UNCOMMITTED in the working tree. You are the round audit's subjective lane: design acceptance,
API and vocabulary shape, row naming, TSDoc and guide voice. You audit; you never edit, and you
never accept — the Orchestrator accepts. An objective `analyst` lane runs separately over the
Opus-written units; you do not run it.

The round's writers: H2-U1 (types), H2-U5 (the handle), and H2-U6 (the guide) were written by
Claude Opus 5; H2-U2 (the coordinate engine), H2-U3 (span threading), and H2-U4 (the rewrite
engine) were written by GPT-5.6 Sol; H2-U3.1 (the assert-helper widening in `tests/setup.ts`)
was written by Sonnet from a fully specified brief. Your lane is the cross-engine coverage for
the Sol-written units and the Sonnet fix; rule on them with full weight.

Before working, read: `/home/user/markdown/AGENTS.md`; the rules `.claude/rules/names.md`,
`.claude/rules/typescript.md`, `.claude/rules/tests.md`, `.claude/rules/documentation.md`, and
`.claude/rules/writing.md` (the Falsification law in `.claude/rules/quality.md` governs your
verdict shape). Then the binding design record:
`/home/user/lsp/.orkestrel/markdown/h2-design-reconciliation.md` and the adopted laws in
`h2-design-analyst-ruling.md`, same folder.

## Evidence set

- The unit records under `/home/user/lsp/.orkestrel/markdown/`: the briefs and reports for
  `h2-u2-coordinates`, `h2-u3-threading`, `h2-u4-rewrite`, and `h2-u3.1-narrowing`, with the
  per-unit diffs and statuses beside them.
- The whole held round: `h2-round-diff.txt` (3238 lines, captured 2026-08-26) and
  `h2-round-status.txt`, same folder.
- The live working tree itself — the held tree is the subject; read the current sources directly.
- The gate readings in the unit reports; the Orchestrator holds the authoritative runs.

## The claims, numbered and falsifiable — rule on each with evidence

1. The coordinate vocabulary is one family: `MarkdownSource`, `MarkdownSegment`, and the
   `sliceSource`, `joinSources`, `projectSpan`, `trimSource`, and `splitTableSources` leaves use
   one term per concept with the `{verb}{Noun}` helper form, no synonym alternation, and no
   compound entity member anywhere the round added.
2. The U2 and U3 test rows serve the reader: each added row's title states the behavior it
   proves, the per-construct threading rows name their construct, the `splitLines` behavioral
   pins cover the lone-`\r`-at-end and split-`\r\n` cases red-first as the design ruled, and no
   row asserts an implementation detail where a behavior belongs.
3. The U4 rewrite rows and the re-ruled consumers read as deliberate contract changes: the
   re-ruled rows record their reason, identity assertions state reuse rather than accidental
   equality, and the derivation rows name the one-source law they pin.
4. The U3.1 widening matches the file's own idiom exactly: the block assert family carries the
   `assertParagraphNode` shape — `BlockNode | undefined`, the combined guard, the
   `${block?.element}` message — with each element word kept, and nothing else in
   `tests/setup.ts` changed.
5. The TSDoc the Sol units added or changed in `src/core/helpers.ts` and `src/core/parsers.ts`
   survives the writing rules and the TSDoc conventions: third-person openers, no banned term, no
   count, backticked tokens followed by nouns, and claims no stronger than the code.
6. The round adds no undocumented public surface and removes no documented one: the `guides`
   parity project's population and the barrel agree in both directions on the held tree.

## Output

Return, as your final message, a verdict block per claim — CONFIRMED TRUE, CONFIRMED FALSE, or
UNPROVABLE with the exact evidence read (file and line, or record section) — followed by any
finding outside the claims with its severity and the unit that owns it, and ONE terminal line:
`VERDICT: PASS` when every claim confirms true, otherwise `VERDICT: FAIL`. No process diary. The
Orchestrator retains your verdict and reconciles it with the analyst lane.
