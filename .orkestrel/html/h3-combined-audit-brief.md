# Audit — the combined H3+H3.1 round, objective lane

Role and engine: `analyst`, GPT-5.6 Sol, reached through `codex exec`, sandbox read-only,
working directory `/home/user/html`. You perform this assignment directly and spawn nothing
beyond the read-only shell commands your verdicts need. You are the audit round's objective
lane: correctness, constraints, and what the code and contracts actually permit. The
subjective lane (Opus reviewer) already ran over H3 alone and returned FAIL; your lane
rules on the round's final state. You audit; you never edit, and you never accept — the
Orchestrator accepts.

Before working, read: `/home/user/html/AGENTS.md`; the rules `.claude/rules/names.md`,
`.claude/rules/typescript.md`, `.claude/rules/architecture.md`, `.claude/rules/tests.md`,
`.claude/rules/documentation.md`, `.claude/rules/quality.md` (its Falsification law governs
your verdict shape); the guide `guides/html.md` § The parse pipeline.

## The subject

Two commits form the round. H3 (html commit `0b71f48`, written by Sol) landed the
deep-scan implied-close mechanism with `IMPLIED_BARRIERS`. Its audit's first lane returned
FAIL (`h3-audit-reviewer-verdict.md` in the evidence set): the stop-condition ambiguity,
the unfetched authority, a self-derived test loop, and a false guide row. The Orchestrator
ruled the referred claims on executed instruments (`h3-claim-rulings.md`,
`h3-whatwg-diff.md`, the probe pair beside them) and H3.1 (written by Claude Opus 5, the
engine that did not write H3) carried every finding. Your lane rules whether the round's
final state closes them.

## Evidence set, all read-only

- The H3 evidence: `/home/user/scaffold/.orkestrel/campaign/h3-implied-close-report.md`,
  `h3-audit-brief.md`, `h3-audit-reviewer-verdict.md`, `h3-claim-rulings.md`,
  `h3-whatwg-diff.md`, `h3-impliedChain-probe.txt`, and
  `h3-impliedChain-probe.instrument.ts`, all in that campaign folder.
- The H3 diff is reproducible as `git show 0b71f48` in `/home/user/html`.
- The H3.1 evidence: the brief at
  `/home/user/scaffold/.orkestrel/campaign/h3.1-fix-brief.md`, the unit report at
  `/home/user/scaffold/tmp/units/h3.1-fix-report.md`, the actual diff at
  `/home/user/scaffold/tmp/units/h3.1-diff.txt` (444 lines), and the actual status at
  `/home/user/scaffold/tmp/units/h3.1-status.txt` (six modified files). The working tree
  you sit in carries the H3.1 state.
- The fetched WHATWG authority extraction is transcribed in `h3-whatwg-diff.md`; your
  sandbox denies the network, so audit against the transcription and say so where you rely
  on it.

## The claims, numbered and falsifiable — rule on each with evidence

1. The blocked-candidate exit is `continue`, each candidate is ruled by its own
   `IMPLIED_BARRIERS` row, and `<table><tr><td><p><button>x<td>y` renders
   `<table><tr><td><p><button>x</button></p></td><td>y</td></tr></table>`, pinned by a
   literal test row that was red before the fix.
2. No existing behavior moved: every pre-H3.1 test row passes unchanged, and the
   depth-scan, overflow-seam, and shallowest-unblocked-selection semantics the reviewer
   confirmed inside H3's claim 1 are intact.
3. The self-derived loop is gone: no test row derives its population or its expectation
   from `IMPLIED_BARRIERS` or `IMPLIED_CLOSERS`, the replacement vectors carry hand-written
   literal expectations covering the adopted barrier classes, and the mutation accounts
   discriminate — the barrier-check-disable control reddens the barrier rows while the
   deep scan stands, and the `break` revert reddens exactly the deep-vector row.
4. The prose is true against the shipped code: the recovery row's Behavior cell names the
   bound, the pipeline sentence claims no narrower crossing than the code performs, the
   TSDoc records the `html` departure and states `select` as a base-scope member, and no
   guide sentence about the implied-close mechanism is falsifiable against a run.
5. The F1 extraction is lawful and complete: `findOpenPosition` and `projectDepth` are
   exported pure leaves with tests, `src/core/parsers.ts` computes every deepest-position
   lookup and depth projection only through them, and their publication through the barrel
   with guide rows satisfies parity.
6. The round stays inside the law: the H3.1 diff touches only the six owned files, no
   banned construct appears, and the guide's remaining changed lines are formatter
   repadding only (`git diff --ignore-all-space` over `guides/html.md` reduces to the
   substantive edits).

## Output

One verdict in the `orkestrel-falsify` shape: per-claim rulings — CONFIRMED, BROKEN,
UNRESOLVED, or NOT EVIDENCED — each with the exact evidence read or the exact command a
falsification needs, findings outside the claims if any, the claims you attacked and could
not break, and a single terminal line:
`VERDICT: PASS|FAIL — <n> broken, <n> unresolved, <n> not-evidenced, <n> findings outside the claims`.
No process diary.

## Constraints

Read-only: no edit, no write, no `git checkout`/`restore`/`stash`/`reset`/`clean`. You may
run scoped read-only commands, including test runs, in `/home/user/html`; a test run
mutates nothing. The network is denied. Nested `git` from a spawned tool can report "not a
git repository" while your own `git status` succeeds; that is the sandbox. The
`tmp/probe/impliedChain.test.ts` file is the Orchestrator's instrument; you may run it.
