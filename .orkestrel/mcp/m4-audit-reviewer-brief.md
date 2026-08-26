# Review brief: m4-audit-reviewer — the M4 round's Sol-written units

## Role and engine

You hold the SUBJECTIVE audit lane for the mcp M4 round: design fit, naming, ergonomics,
vocabulary, and voice. Engine Opus 5, `reviewer`, read-only, clean context. The audited
units were written on the GPT-5.6 Sol bench, so your engine did not write them. Attempt
refutation on every claim; do not confirm by default. Argue no correctness finding the
objective lane owns; note a correctness-shaped reading as a candidate for that lane.

## Objective

Rule on the M4 round's Sol-written units in `/home/user/mcp` at commit `c2a35d4`, branch
`claude/lsp-spec-audit-est33d`, tree clean: `m4-mirror` with its `.1` closure (the
vendored conformance mirror, digest, and row arrays) and `m4-stream` (the
`notifications/tasks` delivery wiring through the `subscriptions/listen` stream). Return
the falsification verdict this brief specifies.

## Context

- `AGENTS.md` (especially the Design laws), `.claude/rules/names.md`,
  `.claude/rules/patterns.md`, `.claude/rules/typescript.md` (TSDoc),
  `.claude/rules/tests.md`, `.claude/rules/writing.md`, and `.claude/rules/quality.md`
  § Falsification govern this repository at those paths under `/home/user/mcp`. Read
  them.
- Skill: `orkestrel-falsify` owns the verdict shape, reproduced under **Verdict shape**.
- Orchestrator-supplied evidence, labeled as such — you run no command: the independent
  `verifier` read the whole gate chain green on this tree 2026-08-26 (`test:src`
  `1151 passed | 1 skipped`, `test:conformance` `42 passed (42)`).

## Evidence slice

Absolute paths.

- The commit captures: `/home/user/lsp/tmp/units/m4-commit-2b823f9.txt` (mirror),
  `m4-commit-bc54b38.txt` (mirror.1), `m4-commit-bef9f40.txt` (stream) — each a
  `git show` excluding the vendored `tests/mirrors/` file.
- The unit self-reports, subject to your attack:
  `/home/user/lsp/.orkestrel/mcp/m4-mirror-brief.md`, `m4-mirror-deviation.md`,
  `m4-mirror.1-report.md`, `m4-stream-report.md`; the round rulings in
  `m4-design-reconciliation.md`.
- The landed files themselves under `/home/user/mcp`: `src/core/types.ts`,
  `src/core/validators.ts`, `src/core/helpers.ts`, `src/core/MCPServer.ts`,
  `src/core/MCPClient.ts`, `tests/setupConformance.ts`, `tests/conformance.test.ts`,
  `guides/mcp.md`, and the vendored `tests/mirrors/ext-tasks-2026-07-28-schema.json`
  (fetched bytes — outside voice claims, authoritative for what the mirror mirrors).

## Numbered falsifiable claims

1. **Single-word surface.** The delivery surface's public names honor the Design laws:
   the `tasks` option and filter keys, the guard and type names the wiring composes, and
   every added member name are single descriptive words or follow the prescribed
   `{verb}{Noun}` helper form; the `taskIds` wire member is a foreign-contract spelling
   and is confined to the wire shapes. A compound entity member the laws forbid, added by
   these units, breaks this claim.
2. **One concept, one term.** Across the stream wiring and the mirror rows, the tasks
   vocabulary is consistent — one term each for the agreed set, the delivery, the
   acknowledgement, and the snapshot — with no synonym alternation against the
   established mcp vocabulary.
3. **Comment and TSDoc voice.** The comments and remarks `bef9f40` adds read in the
   surrounding files' established voice — rule first, behavior stated of the component,
   no human faculties — and each states a constraint the code cannot show rather than
   narrating the code.
4. **Mirror design fit.** The vendored-mirror-plus-digest-plus-row-arrays shape coheres
   with the repository's conformance pattern: the rows in `tests/setupConformance.ts`
   read as data rather than logic, the digest pin is discoverable, and the `.1` closure
   (the formatter exclusion and the corrected metadata row) leaves no seam a reader
   would trip on.
5. **Guide coherence with the wired surface.** The guide's account of the delivery
   surface reads as one design with the code shape the Sol units landed — the reader
   meets the same names, the same order of concepts, and no guide sentence describes a
   shape the code spells differently.

## Findings fitting no claim

Report any substantiated shape finding outside claims 1-5 to the `BROKEN` standard from
`.claude/rules/quality.md` § Falsification. A correctness-shaped finding is noted as a
candidate for the objective lane, never ruled here.

## Verdict shape

Return exactly, and nothing else: numbered verdicts, one per claim, in order, each
exactly one of `CONFIRMED`, `BROKEN`, `UNRESOLVED`, `NOT-EVIDENCED`, with the evidence
§ Falsification requires for that value; any findings fitting no claim; and one terminal
line, exactly one of:
`VERDICT: PASS -- <m> of <m> confirmed, no findings outside the claims`
`VERDICT: FAIL -- <n> broken, <u> unresolved, <e> not-evidenced, <x> findings outside the claims`

## Execution

You perform this review directly yourself and spawn nothing. Your tools are Read, Grep,
and Glob; you have no shell and make no edit. Where a conclusion rests on your own
derivation rather than a supplied measurement, label it a derivation. Attempt refutation
on every claim before you confirm it. Your final message is exactly the verdict.
