# Audit brief: h2-round2 — the h2.2.1 corrections and the h2.3 fence transcription

## Role and engine

You hold the OBJECTIVE audit lane for this round: correctness, constraints, and what the
code and contracts actually permit. Argue no shape, naming, or taste. Your engine is
Opus 5, running natively as a read-only subagent, substituting for GPT-5.6 Sol under the
engine-assignment table in `.agents/orchestration.md` § Engine assignment: the Codex bench
is dark for the `gpt-5.6-sol` model on this account (HTTP 400 on a fresh credential,
2026-08-26, recorded in the routing ledger). You wrote neither audited unit. Attempt
refutation on every claim; do not confirm by default.

## Objective

Rule on the landed pair in `/home/user/markdown`: the `h2.2.1-prose` corrections (commit
`e4c434c`) and the `h2.3-fences` transcription (commit `e5876ff`). Return the
falsification verdict this brief specifies.

## What this round decides

Whether the markdown fix round's prose and proof half is accepted, sending the round on
to `h2.4-mechanical`, or sent back for a fix unit. The h2.2 audit already FAILED once on
this prose; a correction that quietly reopened a broken finding is exactly what this
round exists to catch.

## Context

- Repository: `/home/user/markdown`, branch `claude/lsp-spec-audit-est33d`, head
  `e5876ff`, working tree CLEAN. You read the landed files directly.
- `AGENTS.md`, `.claude/rules/quality.md` (especially § Falsification),
  `.claude/rules/writing.md`, `.claude/rules/tests.md`, and
  `.claude/rules/documentation.md` govern this repository at those paths under
  `/home/user/markdown`. Read them; this brief does not restate their content.
- Skill: `orkestrel-falsify` owns the verdict shape, reproduced under **Verdict shape**;
  the method and evidence law are `.claude/rules/quality.md` § Falsification.
- Orchestrator-executed evidence, labeled as such — you cannot re-run commands:
  - After the h2.3 writer exited, the Orchestrator re-ran the gates on this tree:
    `npx oxfmt --config .oxfmtrc.json --check` over the two test files → exit 0;
    `npx vitest run --config vite.config.ts --no-cache --reporter=dot --project src:core`
    → `Test Files 6 passed (6)`, `Tests 599 passed (599)`, exit 0 (2026-08-26).
  - The h2.2.1 unit's recorded gates: scoped `src:core` `592 passed`, guides `18 passed`,
    format and check exit 0.
  - You have no independent gate reading beyond these; where a claim would need one, say
    so under that claim rather than treating a supplied reading as your own.

## Evidence slice

Every path absolute.

- `/home/user/lsp/tmp/units/h2-audit2-commit-e4c434c.txt` — `git show e4c434c`, the full
  h2.2.1 commit (370 lines), Orchestrator-captured.
- `/home/user/lsp/tmp/units/h2-audit2-commit-e5876ff.txt` — `git show e5876ff`, the full
  h2.3 commit (166 lines), Orchestrator-captured.
- `/home/user/lsp/.orkestrel/markdown/h2.2.1-prose-brief.md` and `-report.md` — the
  corrections unit's charter and self-report.
- `/home/user/lsp/.orkestrel/markdown/h2.3-fences-brief.md` and `-report.md` — the
  transcription unit's charter and self-report, including its reuse table and its own
  flagged claim.
- `/home/user/lsp/.orkestrel/markdown/h2.2-audit-analyst-verdict.md` — the FAIL verdict
  whose broken findings `h2.2.1` exists to close.
- `/home/user/lsp/.orkestrel/markdown/h2-audit-reconciliation.md` — the round's
  authoritative rulings (R1 through R6 and Amendment 2026-08-26, the direct-input
  derivation rule).
- The landed files themselves under `/home/user/markdown`: `guides/markdown.md`,
  `src/core/types.ts`, `src/core/helpers.ts`, `src/core/Markdown.ts`,
  `tests/src/core/Markdown.test.ts`, `tests/src/core/parsers.test.ts`,
  `tests/src/core/helpers.test.ts`. The captured commits are copies to cross-check
  against the real files, never a substitute for your own read.

## Numbered falsifiable claims

1. **The h2.2.1 corrections close every broken finding.** Each finding the h2.2 analyst
   verdict broke — the cascade bullet, the derivation qualifier, the guide's coverage
   sentence, the boundary rule across the guide and the `MarkdownSource` remark, and the
   `Markdown` class TSDoc's resolution order — reads closed in the landed prose at head.
   Check the actual sentences against each finding's text in the verdict, not against the
   unit's report of them. A finding closed by deletion rather than correction still
   counts as closed only where the reconciliation permits it.
2. **The corrected prose matches the measured semantics.** The cascade bullet states the
   last-segment-at-the-position rule; the derivation prose states the fixed resolution
   order (own region, else the direct input's region, else `undefined`, never a further
   derivation edge) that Amendment 2026-08-26 fixes; the boundary rule states the
   later-segment resolution for a zero-width boundary position. Each of these is pinned
   by an executed row somewhere in `tests/src/core/` — name the pinning row for each, and
   a prose rule you cannot tie to any executed row is a finding under this claim, labeled
   with what would settle it.
3. **Fence-to-row fidelity.** Every behavioral fence reading in `guides/markdown.md`
   § Source provenance has exactly one carrier: an added row in the `e5876ff` diff or a
   named landed row in the h2.3 report's reuse table. Walk the section's fences yourself
   against the diff and the reuse table; verify each named reuse row exists in the real
   test file and asserts the value the table claims for it. A fence reading with no
   carrier, or a reuse row that asserts something else, breaks this claim.
4. **Row-to-fence truth.** Each added row's asserted values equal the fence comment's
   values: the heading region `{ start: 0, end: 7 }` slicing `'# Title'`, the decoded
   escape value `'a * b '` with region `{ start: 0, end: 7 }` slicing the spelling, the
   handle-free document span `{ start: 0, end: 25 }`, the lowered rewrite `'hi'` at
   `{ start: 2, end: 4 }`, the kept own region `{ start: 0, end: 2 }`, the adopted-HTML
   `undefined`, and the `scanInlineSource` coordinates `{ start: 2, end: 4 }` and
   `{ start: 4, end: 7 }`. Read the real test source, not the report's copy.
5. **The wider-than-fence projection row.** The h2.3 unit flagged that its adopted-HTML
   row asserts `undefined` for every node the walk yields while the fence claims only the
   document. Rule whether the wider assertion is correct against the shipped resolution
   semantics (the map is keyed by node identity and an adopted document's nodes were
   never recorded) or must be narrowed to the fence. A conclusion from source alone is a
   derivation; label it.
6. **The `scanInlineSource` placement.** The unit placed the row in
   `tests/src/core/parsers.test.ts` while `scanInlineSource` lives in
   `src/core/helpers.ts`, whose mirrored suite is `tests/src/core/helpers.test.ts`, and
   recorded its reasons. Rule against `.claude/rules/tests.md`'s mirroring law: is the
   placement permitted (name the clause) or a conformance defect (name the clause it
   breaks)?
7. **Scope honesty.** The `e4c434c` commit touches only the h2.2.1 unit's owned prose
   surfaces and the `e5876ff` commit touches only `tests/src/core/Markdown.test.ts` and
   `tests/src/core/parsers.test.ts`; the captured commits, the real history, and the
   units' briefs agree on ownership; and no landed hunk edits a behavior rather than
   prose or tests (a `src/` hunk in `e4c434c` must be prose-only — TSDoc or comments —
   to hold).
8. **The bridging observation is carried, not dropped.** The `projectSpan` bridging
   clause (`guides/markdown.md:229`) has no executed `projectSpan` row over an uncovered
   interior in `tests/src/core/helpers.test.ts`; confirm the gap is real by reading that
   suite, and confirm the h2.3 report names a carrier for it. A gap that is real but
   carried is an observation to confirm, not a broken claim; a gap that is real and
   uncarried breaks this claim.
9. **Prose sweep.** The added and changed prose lines of the two commits pass the
   substitution table and the count-in-prose ban in `.claude/rules/writing.md`. Sweep the
   real files with the Grep tool, scoped to the lines the captured commits name. Name the
   exact pattern and the population — a result naming neither is not evidence.

## Findings fitting no claim

Report any substantiated finding outside claims 1-9 to the same evidentiary standard as
`BROKEN`. An unsubstantiated one is not a finding; note it as a candidate for a successor
brief instead.

## Verdict shape

Return exactly this and nothing else — no process diary, no summary of what you read:

1. Numbered verdicts, one per claim above, in this order. Each is exactly one of
   `CONFIRMED`, `BROKEN`, `UNRESOLVED`, `NOT-EVIDENCED`, with the evidence
   `.claude/rules/quality.md` § Falsification requires for that value (for `CONFIRMED`,
   name the attack you tried that failed; for `BROKEN`, the exact input, state, or text
   that falsifies it; for `UNRESOLVED`, what would settle it).
2. Any findings fitting no claim, substantiated to the `BROKEN` standard.
3. One terminal line, exactly one of:
   `VERDICT: PASS -- <m> of <m> confirmed, no findings outside the claims`
   `VERDICT: FAIL -- <n> broken, <u> unresolved, <e> not-evidenced, <x> findings outside the claims`
   `PASS` requires every claim `CONFIRMED`, nothing `UNRESOLVED`, nothing `NOT-EVIDENCED`,
   and no substantiated finding outside the claims.

## Execution

You perform this audit directly yourself and spawn nothing. Your tools are Read, Grep,
and Glob; you have no shell, make no edit, and run no command. You verify by reading the
landed files, the captured commits, and the supplied reports and verdicts. Where a
conclusion rests on your own derivation from source rather than a supplied measurement,
label it a derivation in your evidence for that claim. Attempt refutation on every claim
before you confirm it.

Your final message must be exactly the verdict this brief specifies: the numbered
per-claim verdicts, any findings fitting no claim, and the single terminal `VERDICT:` line.
