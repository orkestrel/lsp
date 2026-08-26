# Review brief: h2-round2-review — the h2 fix round's subjective lane

## Role and engine

You hold the SUBJECTIVE audit lane for the markdown h2 fix round: design fit, vocabulary,
guide voice, TSDoc shape, and test-row naming. Engine Opus 5, `reviewer`, read-only,
clean context. You wrote none of the audited units. Argue no correctness finding another
lane owns; where a reading is correctness-shaped rather than shape-shaped, note it as a
candidate for the objective lane rather than ruling on it. Attempt refutation on every
claim; do not confirm by default.

## Objective

Rule on the landed h2 fix-round surface in `/home/user/markdown` at head `bda6e1e`: the
prose corrections (`e4c434c`), the fence transcription (`e5876ff`), and the row closures
(`bda6e1e`). Return the falsification verdict this brief specifies.

## Context

- Repository: `/home/user/markdown`, branch `claude/lsp-spec-audit-est33d`, head
  `bda6e1e`, working tree CLEAN. You read the landed files directly.
- `AGENTS.md`, `.claude/rules/writing.md`, `.claude/rules/typescript.md` (TSDoc),
  `.claude/rules/names.md`, `.claude/rules/tests.md`, `.claude/rules/documentation.md`,
  and `.claude/rules/quality.md` § Falsification govern this repository at those paths.
  Read them; this brief does not restate their content.
- Skill: `orkestrel-falsify` owns the verdict shape, reproduced under **Verdict shape**.
- Orchestrator-executed evidence, labeled as such — you cannot run commands: after each
  writer exited the Orchestrator re-ran the scoped gates; the latest reading on this tree
  is `src:core` `602 passed (602)` exit 0 (2026-08-26).

## Evidence slice

Absolute paths.

- `/home/user/lsp/tmp/units/h2-audit2-commit-e4c434c.txt`,
  `/home/user/lsp/tmp/units/h2-audit2-commit-e5876ff.txt`, and
  `/home/user/lsp/tmp/units/h2-audit2-commit-bda6e1e.txt` — the three commits,
  Orchestrator-captured `git show` output.
- The landed files themselves under `/home/user/markdown`: `guides/markdown.md`,
  `src/core/types.ts`, `src/core/Markdown.ts`, `tests/src/core/Markdown.test.ts`,
  `tests/src/core/parsers.test.ts`, `tests/src/core/helpers.test.ts`.
- The unit reports, for what each unit decided and flagged (their self-reports, subject
  to your attack): `/home/user/lsp/.orkestrel/markdown/h2.2.1-prose-report.md`,
  `h2.3-fences-report.md`, and `/home/user/lsp/tmp/units/h2.3.1-rows-report.md`.

## Numbered falsifiable claims

1. **Guide voice.** The corrected and added sentences in `guides/markdown.md` (the
   § Source provenance section and the `projectSpan` prose near line 229) read in the
   guide's established register: rule first, condition before instruction, no register
   break against the surrounding untouched prose. Name any sentence that breaks the
   register and say what the surrounding voice does differently.
2. **One concept, one term.** Across the three commits' added lines, the provenance
   vocabulary is consistent: one term each for the original-source region, the mapping
   record, and the projection operation, with no synonym alternation against the terms
   the untouched prose already uses. A drifted term names both spellings and their sites.
3. **Row naming.** Every added or moved test row's name states the behavior it proves, in
   the repository's row-naming voice, and no name leaks an implementation detail or a
   control identifier. Read every `it(...)` name the three commits add or move.
4. **TSDoc shape.** The corrected remarks in `src/core/types.ts` (the `MarkdownSegment`,
   `MarkdownDerivation`, and `MarkdownSource` blocks and the other touched blocks) and
   the `src/core/Markdown.ts` class block follow `.claude/rules/typescript.md`'s TSDoc
   conventions — opener form, tense, and vocabulary — and read as one voice with the
   file's untouched remarks.
5. **Reuse over duplication.** The transcription round's decision to carry six fence
   readings by naming landed rows rather than duplicating them is design-fit: no carried
   reading would be materially clearer as its own row, and no added row duplicates a
   landed row's proof. Rule per carried reading, from the reuse table in
   `h2.3-fences-report.md` § Reuse table against the real rows.
6. **Placement coherence.** After the move, `tests/src/core/helpers.test.ts` holds the
   `scanInlineSource` coverage coherently — the two describe blocks sit adjacently or are
   distinctly scoped, with no overlapping row names — and the header comment of
   `tests/src/core/parsers.test.ts` reads true of the file it now describes.
7. **Plain-language reading.** Sweep the three commits' added prose lines (guide
   sentences, TSDoc, test comments — not code) against `AGENTS.md` § Writing's
   plain-language principles as a reader: key point first in each paragraph, one idea per
   sentence, no buildup. Name the population you read and any line that fails on first
   read.

## Findings fitting no claim

Report any substantiated shape finding outside claims 1-7 to the `BROKEN` evidentiary
standard from `.claude/rules/quality.md` § Falsification. A correctness-shaped finding is
noted as a candidate for the objective lane, never ruled here.

## Verdict shape

Return exactly this and nothing else — no process diary:

1. Numbered verdicts, one per claim, in order, each exactly one of `CONFIRMED`, `BROKEN`,
   `UNRESOLVED`, `NOT-EVIDENCED`, with the evidence `.claude/rules/quality.md`
   § Falsification requires for that value.
2. Any findings fitting no claim.
3. One terminal line, exactly one of:
   `VERDICT: PASS -- <m> of <m> confirmed, no findings outside the claims`
   `VERDICT: FAIL -- <n> broken, <u> unresolved, <e> not-evidenced, <x> findings outside the claims`

## Execution

You perform this review directly yourself and spawn nothing. Your tools are Read, Grep,
and Glob; you have no shell and make no edit. Where a conclusion rests on your own
derivation rather than a supplied measurement, label it a derivation. Attempt refutation
on every claim before you confirm it. Your final message is exactly the verdict.
