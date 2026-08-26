# Audit — the combined L5+L5.1 round, objective lane

Role and engine: `analyst`, GPT-5.6 Sol, reached through `codex exec`, sandbox read-only,
working directory `/home/user/lsp`. You perform this assignment directly and spawn nothing
beyond the read-only shell commands your verdicts need. You are the audit round's
objective lane: correctness, constraints, and what the code and contracts actually permit.
The subjective lane (Opus reviewer) already ran over the pre-fix round and returned FAIL;
your lane rules on the round's final state and on the referrals that lane addressed to
you. You audit; you never edit, and you never accept — the Orchestrator accepts.

Your engine wrote L5-B (`27725c0`); the L5.1 fix (`2b171bf`) and the audit verdict you
rule against were written by Claude Opus 5, and the L5-A chain by a Sonnet builder with
two Orchestrator edits — so every finding you confirm or break on the fix is another
engine's work, and the round's lane coverage holds.

Before working, read: `/home/user/lsp/AGENTS.md`; the rules `.claude/rules/names.md`,
`.claude/rules/typescript.md`, `.claude/rules/tests.md`, `.claude/rules/quality.md` (its
Falsification law governs your verdict shape); the guide `guides/lsp.md` § Conformance.

## Evidence set, all read-only

In `/home/user/scaffold/.orkestrel/campaign/`: the design record
(`l5-design-reconciliation.md`, `-r2.md`), the unit pairs (`l5b-conformance-brief.md` and
`-report.md`, `l5.1-fix-brief.md` and `-report.md`), the reviewer verdict
(`l5-audit-reviewer-verdict.md`), and the Orchestrator receipts
(`l5-audit-orchestrator-receipts.md`). The diffs are reproducible in `/home/user/lsp` as
`git show 586758d`, `git show 27725c0`, and `git show 2b171bf`; captured copies sit beside
the reports. The host gate chains of 2026-08-26 ran green over each landed tree, with the
conformance project at 243 rows on the final one. Your sandbox denies the network and
refuses Vite's transient writes — where a test run fails on those writes, name the
command for the host instead of inferring the result.

## The claims, numbered and falsifiable — rule on each with evidence

1. Every reviewer finding is closed as prescribed: the encodings assertion selects by
   symbol prefix and compares symbol sets with no positional selector and no
   self-comparison; every exported function in `tests/setupConformance.ts` carries the
   TSDoc members `.claude/rules/typescript.md` requires, with the `readMetaModel` block
   matching the prescription; the guide's refresh procedure names the script, the two
   constants, and the same-commit obligation; `WORKSPACE_ROOT` has one declaration;
   `PROTOCOL_ENTRY` replaced `REQUIRE`. Formatter re-wrapping of the adopted tokens is
   the formatter's decision, not a departure — rule on token equivalence.
2. The membership assertions bind declaration-versus-table: the numerals assertion's
   expected set derives from the core barrel's negative numeric exports and equals the
   table's symbols; the structures and guards pins are hand-written literals; no expected
   set derives from the table under assertion; and the four mutation accounts in the
   L5.1 report discriminate as recorded.
3. The typed coordinates bind: the sync, severity, and tag rows read exported constants
   typed by their unions, so both mutation directions (the coordinate and the union)
   redden `npm run check` — verify from the source and the recorded diagnostics.
4. The comparison layer is correct against the metaModel's own shape: `readProperty`
   walks only a structure's own `properties` and follows no `extends` or `mixins` — rule
   whether every projected member's named declaring structure is the one that declares it
   in the mirror, and whether any covered member sits on a mixin or parent the row
   therefore reads wrongly or by accident. The mirror is at
   `tests/mirrors/metaModel.json`; parse it yourself.
5. The `isInstalledDiagnostic` guard's `value is unknown` predicate (the reviewer's
   referral): rule whether the degenerate predicate weakens any row — whether a plain
   boolean return or a differently-shaped `installed` column would catch a drift this
   shape misses, or whether the shape is sound for what the rows assert.
6. The round stays inside the law: each commit's diff touches only its brief's owned
   files (the F3 grants included), and no banned construct appears in any added line.

## Output

One verdict in the `orkestrel-falsify` shape: per-claim rulings — CONFIRMED, BROKEN,
UNRESOLVED, or NOT EVIDENCED — each with the exact evidence read or the exact command a
falsification needs, findings outside the claims if any, the claims you attacked and could
not break, and a single terminal line:
`VERDICT: PASS|FAIL — <n> broken, <n> unresolved, <n> not-evidenced, <n> findings outside the claims`.
No process diary.

## Constraints

Read-only: no edit, no write, no `git checkout`/`restore`/`stash`/`reset`/`clean`. The
network is denied. Nested `git` from a spawned tool can report "not a git repository"
while your own `git status` succeeds; that is the sandbox.
