# Audit brief: p2-audit-2 — LSPRange adoption for Issue.line (substituted lane)

## Role and engine

You hold the OBJECTIVE audit lane for this round: correctness, constraints, and what the
code and contracts actually permit. Argue no shape, naming, or taste. Your engine is
Opus 5, running natively as a read-only subagent, substituting for GPT-5.6 Sol under the
engine-assignment table in `.agents/orchestration.md` § Engine assignment: the Codex bench
is dark for the `gpt-5.6-sol` model on this account (HTTP 400 "not supported when using
Codex with a ChatGPT account" on a fresh credential, probe thread
`01a03e0d-151c-7aa2-bfe7-5a7f7db1479a`, 2026-08-26). The substitution is recorded in the
routing ledger. You did not write this unit. Attempt refutation on every claim; do not
confirm by default.

This brief supersedes `/home/user/probe/tmp/codex/p2-audit-brief.md`, whose exec died on
an expired credential before delivering any verdict and whose model is refused on the
fresh one. The claims are carried over unchanged in substance; the execution sections are
adapted to your transport: you have the Read, Grep, and Glob tools and no shell, so every
executed measurement is supplied to you as labeled evidence and your own work is reading
the real sources and rendered evidence.

## Objective

Rule on the `p2-range` unit: the change replacing `Issue.line` with a zero-based UTF-16
`range` (`LSPRange`, reused from the installed `@orkestrel/lsp` package) across the
TypeStage, LintStage, RuntimeStage producers and the `formatIssue` consumer. Return the
falsification verdict this brief specifies.

## What this round decides

Whether the `p2-range` unit is accepted as committed, or sent back for a fix round. This
is not a courtesy pass — a confirmation you have not tried to break is worth nothing here,
and a defect that ships past this round ships to every consumer of `@orkestrel/lsp`-based
diagnostics.

## Context

- Repository: `/home/user/probe`, held UNCOMMITTED on top of commit `42e0b1e` on branch
  `claude/lsp-spec-audit-est33d`. The Orchestrator captured the held tree's state after
  the writer exited — supplied executed evidence you cannot re-run:
  - `/home/user/lsp/tmp/units/p2-audit-2-held-status.txt` — the `git status --short`
    output, twelve modified files plus the capture date line.
  - `/home/user/lsp/tmp/units/p2-audit-2-held-diff.txt` — the full `git diff` output,
    604 lines, captured 2026-08-26 in the same command as the status.
- A `dist/` directory exists in the probe tree. It is untracked build output the
  Orchestrator produced after the unit exited, to take a whole-suite gate reading. It is
  not part of the diff and carries no claim of its own; ignore it.
- `AGENTS.md`, `.claude/rules/quality.md` (especially its **Falsification** section), and
  `.claude/rules/writing.md` govern this repository and exist at those exact paths under
  `/home/user/probe`. Read them; this brief does not restate their content.
- Skill: `orkestrel-falsify`. Its verdict shape and terminal line are reproduced exactly
  under **Verdict shape** below; the method and the evidence law behind each verdict value
  are `.claude/rules/quality.md` § Falsification, which you must read directly.

## Already established — do not re-derive

- The unit's own report built a red-first mutation table with exact commands and counts,
  and a per-producer coordinate table. Treat them as the unit's self-report, subject to
  your own attack, never as independently verified fact.
- The pre-unit blast-radius sweep (`p2-terrain-distillate.md`) enumerated every call site
  touching `Issue.line` before the change; use it to check completeness, not to re-walk
  the whole codebase from scratch.
- The report's `test:src` red row is settled. The Orchestrator built the absent `dist/`
  (`npm run build` exit 0) and took the deciding whole-suite reading after the unit
  exited: the load run read one timing red in `tests/src/server/Probe.test.ts` (a
  60-second deadline fixture, concurrent with another repository's writer), and the same
  file alone reads `26 passed (26)` exit 0. Do not treat the report's `test:src` row or
  that timing red as a finding against the diff; the row's cause analysis (the missing
  built entry) is still yours to cross-check against the report's own text.

## Evidence slice

Every path is absolute.

- `/home/user/probe/tmp/codex/evidence/p2-range-brief.md` — the unit's charter: the
  adopted ruling (`Issue.line` becomes a zero-based UTF-16 `range` reusing `LSPRange`)
  and the reuse law behind it.
- `/home/user/probe/tmp/codex/evidence/p2-range-report.md` — the unit's report:
  per-producer coordinate table, falsified-row census with re-rule reasons, red-first
  mutation table with exact commands and counts, gate readings, full source and test
  diffs, and the unit's own flagged claims.
- `/home/user/probe/tmp/codex/evidence/p2-terrain-distillate.md` — the pre-unit
  blast-radius sweep.
- `/home/user/probe/tmp/codex/evidence/p2-audit-instrument.sh` and
  `/home/user/probe/tmp/codex/evidence/p2-audit-instrument-evidence.txt` — the
  Orchestrator's mutation re-run instrument and its readings (see claim 5).
- `/home/user/lsp/tmp/units/p2-audit-2-held-status.txt` and
  `/home/user/lsp/tmp/units/p2-audit-2-held-diff.txt` — the captured held-tree state
  (see Context).
- The held sources themselves, at their real paths under `/home/user/probe`:
  `src/core/types.ts`, `src/core/helpers.ts`, `src/core/validators.ts`,
  `src/server/stages/TypeStage.ts`, `src/server/stages/LintStage.ts`,
  `src/server/stages/RuntimeStage.ts`, their test files under `tests/src/`, and
  `guides/probe.md`. You read these directly; a captured diff is a copy to cross-check
  against the real file contents, never a substitute for your own read.
- The installed declaration of every substrate a claim depends on:
  `/home/user/probe/node_modules/@orkestrel/lsp/dist/src/core/index.d.ts` (and the
  `.d.cts` twin) — read the actual exported shape and guard contract of `LSPRange`,
  `LSPPosition`, and `isLSPRange` there. A claim about what these types or guards mean is
  decided by what is installed, not by what the unit's report says they mean.

## Unknowns

- Whether every producer's underlying tool version pins the coordinate basis the unit
  assumed (compiler API zero-based `LineAndCharacter`, the linter's published span shape,
  Vitest's one-based frame numbering) is not independently re-verified here; if a claim
  below turns on a tool-version assumption you cannot check from the installed packages
  and source alone, mark it `UNRESOLVED` and state what installed artifact would settle it.

## Numbered falsifiable claims

1. **Producer coordinate correctness.** Each producer stores the coordinate basis its tool
   actually reports, correctly converted: TypeStage carries the compiler's zero-based
   `LineAndCharacter` and derives `end` from `start + (length ?? 0)`; LintStage copies the
   published zero-based span coordinate by coordinate into an owned object (no aliasing of
   the source library's own object); RuntimeStage lowers a one-based Vitest frame by one on
   line and column, with `character` resolving to `0` where no numeric column exists, and
   stores a zero-width span (`start` equals `end`).
2. **Single rendering site.** `formatIssue` is the sole site that derives the one-based
   display line, and it derives it there and nowhere else — no other consumer in the diff
   performs its own zero-to-one conversion.
3. **Absence semantics preserved.** Every site that previously omitted `line` now omits
   `range`, and no sentinel value (`null`, `-1`, `{ start: { line: 0, character: 0 }, ... }`
   as a stand-in for "no location", or similar) was introduced anywhere in the diff.
4. **Guard composition and installed semantics.** `isIssue` composes `isLSPRange` correctly
   as an optional member (present-and-valid or absent, never present-and-invalid passing
   silently), and the installed `isLSPRange` contract — read from
   `/home/user/probe/node_modules/@orkestrel/lsp/dist/src/core/index.d.ts` and its guard
   logic if inlined, or its documented contract if the guard is a declaration only —
   matches what the `Issue` contract in `src/core/types.ts` needs. Read the installed
   guard, not its name; a guard named `isLSPRange` that validates a looser or stricter
   shape than `Issue.range` requires is a defect this claim exists to catch.
5. **Red-first table binds.** The Orchestrator re-ran every row of the report's mutation
   table against the held tree, on the host, after the unit exited. The exact instrument
   and its readings are supplied at
   `/home/user/probe/tmp/codex/evidence/p2-audit-instrument.sh` and
   `/home/user/probe/tmp/codex/evidence/p2-audit-instrument-evidence.txt`. This is
   supplied executed evidence: you did not run this instrument and cannot re-run it. Every
   row reddened with the report's recorded failure shape and restored byte-identical
   (`RESTORE_CMP_EXIT:0` per row, final tree check matching the held status capture). Your
   work under this claim: confirm from the real source that each cited load-bearing line
   is the single line the mutation names, not a broader change that would also redden
   unrelated tests; cross-check the instrument's readings against the report's table row
   by row and rule on any discrepancy; and rule whether the RuntimeStage instrument row —
   which mutates the line half (`stack.line - 1` to `stack.line`) alone, leaving the
   column half untouched — leaves the column conversion (`stack.column - 1`) pinned by any
   row, saying so under this claim or claim 7 if it does not. A conclusion you draw from
   source alone remains a derivation and is labeled as such.
6. **Scope honesty.** The report's diff, the Orchestrator-captured diff at
   `/home/user/lsp/tmp/units/p2-audit-2-held-diff.txt`, and the real held file contents
   agree. Cross-check the two diffs hunk by hunk, and spot-check each diff's post-image
   against the real file at the cited lines. The captured status shows exactly the twelve
   files the Context section lists and no others; a substantive change outside that list
   that bears on the `Issue.range` contract breaks this claim, an unrelated
   formatting-only change does not.
7. **The pinned `character: 15` assertion.** The unit flagged a test assertion pinning an
   exact `character: 15` value derived from Vitest stack-frame parsing, rather than a
   weaker `toBeGreaterThan(0)` form. Attempt to refute the unit's own justification: does
   the assertion's adjacent comment honestly disclose that the pinned value depends on
   Vitest's own frame-formatting behavior (and could break on a Vitest upgrade unrelated
   to this unit's logic)? And would the weaker `toBeGreaterThan(0)` form actually fail to
   distinguish "column correctly lowered by one" from "column left one-based and merely
   nonzero" — that is, is the pin load-bearing for what the test claims to prove, or is it
   over-specified? Rule explicitly which form is correct and why.
8. **The missing TypeStage end-of-file clamp.** The unit flagged that
   `diagnostic.start + (diagnostic.length ?? 0)` is never clamped to the file's own end
   offset. Attempt to construct a reachable case, using only the TypeScript compiler's own
   documented `Diagnostic` API contract, where `start + length` exceeds the source file's
   total length. If you cannot construct one, rule whether the absence of a clamp is a
   defect (the reachability standard in `.claude/rules/quality.md`) or a documented
   non-obligation, and say which reachability ground applies. A conclusion from the
   documented API contract alone is a derivation; label it as one.
9. **Prose sweep.** Every added TSDoc remark, code comment, and guide row introduced by
   this diff (in `guides/probe.md` and the touched source and test files) passes the
   substitution table and the count-in-prose ban in `.claude/rules/writing.md`. Sweep with
   the Grep tool over the real files, scoped to the added lines the captured diff names.
   Name the exact pattern you swept for (each banned term, each count-shaped sentence) and
   the population it covers (which files, which added lines) — a result naming neither its
   pattern nor its population is not evidence.

## Findings fitting no claim

Report any substantiated finding outside claims 1-9 to the same evidentiary standard as
`BROKEN`. An unsubstantiated one is not a finding; note it as a candidate for a successor
brief instead.

## Verdict shape

Return exactly this and nothing else — no process diary, no summary of what you read:

1. Numbered verdicts, one per claim above, in this order. Each is exactly one of
   `CONFIRMED`, `BROKEN`, `UNRESOLVED`, `NOT-EVIDENCED`, with the evidence
   `.claude/rules/quality.md` § Falsification requires for that value (for `CONFIRMED`,
   name the attack you tried that failed; for `BROKEN`, the exact input, state, or
   interleaving that falsifies it; for `UNRESOLVED`, what would settle it).
2. Any findings fitting no claim, substantiated to the `BROKEN` standard.
3. One terminal line, exactly one of:
   `VERDICT: PASS -- <m> of <m> confirmed, no findings outside the claims`
   `VERDICT: FAIL -- <n> broken, <u> unresolved, <e> not-evidenced, <x> findings outside the claims`
   `PASS` requires every claim `CONFIRMED`, nothing `UNRESOLVED`, nothing `NOT-EVIDENCED`,
   and no substantiated finding outside the claims.

## Execution

You perform this audit directly yourself and spawn nothing. Your tools are Read, Grep,
and Glob; you have no shell, make no edit, and run no command. You verify by reading the
held sources, the installed declarations, and the supplied evidence files. Where a
conclusion rests on your own derivation from source rather than a supplied measurement,
label it a derivation in your evidence for that claim, not a measurement. Attempt
refutation on every claim before you confirm it.

Your final message must be exactly the verdict this brief specifies: the numbered
per-claim verdicts, any findings fitting no claim, and the single terminal `VERDICT:` line.
