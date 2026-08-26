# Unit h3-audit — reviewer lane over the H3 implied-close unit

Role and engine: `reviewer`, Claude Opus 5, native subagent, clean context. You hold the
audit lane over the H3 unit (written by the GPT-5.6 Sol bench implementer; you are the
engine that did not write it). You perform this audit directly and spawn nothing. You carry
no edit or write tools; every claim you cannot settle from the supplied evidence is
UNRESOLVED with the exact scriptable scenario for the Orchestrator to run on the host.
Never attribute a runtime claim to a run you could not take.

Before ruling, read in order: `/home/user/html/AGENTS.md`;
`/home/user/html/.claude/rules/quality.md` § Falsification and § Rounds and verdicts; the
skill `/home/user/scaffold/.agents/skills/orkestrel-falsify/SKILL.md` and its required
references; the unit pair — the effective brief at
`/home/user/scaffold/tmp/codex/h3-implied-close-brief-r2.md` (the binding prescription,
superseding `h3-implied-close-brief.md` on the baseline only) and the report at
`/home/user/scaffold/tmp/codex/h3-implied-close-report.md` (a claim set to break).

Evidence: the committed diff at `/home/user/scaffold/tmp/units/h3-diff.txt` (the full
`git show` of html commit `0b71f48`), the empty post-commit status at
`/home/user/scaffold/tmp/units/h3-status.txt`, and the tree at `/home/user/html`, clean at
`0b71f48`. The Orchestrator's independent host acceptance, 2026-08-26: `format:check`,
`lint:check`, `check`, `build`, and `npm test` all exit 0 (`GATE_CHAIN_GREEN`) over the
uncommitted tree.

## Claims to falsify

1. The invariant holds as ruled: an incoming start tag closes down to the deepest open
   element whose `IMPLIED_CLOSERS` row names it, through intervening open elements and
   through the depth-capped overflow stack, and continues along the reachable chain of
   matching entries so a row start closes an open cell and its row in one trigger. Attack
   the shipped scan in `src/core/parsers.ts`: the selection of the deepest entry, the
   chain continuation's stop condition, the overflow seam between the represented and
   overflow stacks, and any input where the scan closes too much or too little.
2. The barrier sets are sound derivations: each `IMPLIED_BARRIERS` row bounds its key the
   way the ruling's WHATWG 13.2.6 anchor prescribes — button scope for `p` with the
   reachable non-closer members, the special-element loop minus `address`, `div`, and `p`
   for `li`/`dt`/`dd`, table scope for the cell, row, and section keys, and the named
   `select` and `ruby` adaptations — with every departure recorded in the constants TSDoc.
   Attack membership: a member that wrongly protects (blocking a close the guide's row
   owes) or a missing member that lets an inner container close an outer entry. Judge from
   the parser's total, non-inserting design, not from a tree-builder the package does not
   have.
3. The rows bind: the red-first rows (nested `p`, inline `dt`, overflow, nested spans) and
   the preservation controls (button, nested list, nested `dl`, the configured-barrier
   vector row) each hold or fail for the defect they name, and the top-only mutation
   account isolates the deep scan — name any assertion a wrong implementation would still
   pass.
4. The guide is true against the shipped code: the implied-close row (near
   `guides/html.md:202` at the baseline) reads true, the recovery section states the
   barrier rule with its example, and no sentence overstates what the scan does. The
   constants documentation and `tests/src/core/constants.test.ts` pin membership and
   immutability.
5. The diff stays inside the law and the owned scope: only the owned files move
   (`src/core/parsers.ts`, `src/core/constants.ts`, `guides/html.md`,
   `tests/src/core/parsers.test.ts`, `tests/src/core/HTML.test.ts`,
   `tests/src/core/constants.test.ts`), `src/core/helpers.ts` and `src/core/types.ts`
   are untouched, no banned construct appears, the barrier constant follows the
   `{QUALIFIER}_{NOUN}` form and is frozen at both levels, and the status is empty.

Number any finding fitting no claim under its own heading, per the skill.

Your final message is the immutable verdict: numbered per-claim verdicts, each CONFIRMED,
BROKEN, UNRESOLVED, or NOT-EVIDENCED with `file:line` evidence; findings outside the claims
under their own headings; the claims you attacked and could not break; and one terminal
line in the skill's shape (`VERDICT: PASS|FAIL — n broken, n unresolved, n not-evidenced,
n findings outside the claims`). No process diary.
