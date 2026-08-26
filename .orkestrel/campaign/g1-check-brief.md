# Unit g1-check — mechanical conformance review of the G1 guide rulings

## Role and engine

You are the `checker` lane, Sonnet, native, read-only. You edit nothing, run nothing, and spawn
nothing. You return per-claim verdicts with evidence.

## Context

The G1 units recorded, in each of the queue, process, tool, and middleware repositories, why
that package stays untouched by the fleet's progress work. Each unit was a `builder` owning only
its repository's guide. The Orchestrator captured the live diff and status evidence; the units'
reports carry their own copies and gate readings.

Read, per repository `<r>` in queue, process, tool, middleware:

- `/home/user/lsp/tmp/units/g1-<r>-brief.md` — the unit's charter.
- `/home/user/lsp/tmp/units/g1-<r>-report.md` — the unit's report.
- `/home/user/lsp/tmp/units/g1-<r>-evidence.txt` — the Orchestrator-captured
  `git status --short` and `git diff`.
- The live guide the diff lands in, under `/home/user/<r>/guides/`.
- `/home/user/lsp/.orkestrel/campaign/g1-terrain-distillate.md` — the ruling source each
  addition must state faithfully.

## Numbered claims, each ruled CONFIRMED or BROKEN with evidence, per repository

1. The captured status shows exactly the one owned guide file modified and nothing else.
2. The captured diff matches the diff the unit's report carries.
3. The added prose states the distillate's ruling for that package faithfully: queue — progress
   belongs to the job, the queue observes lifecycle only; process — the line stream is the
   progress surface; tool — progress reporting belongs to the invoking consumer's execution
   context, one layer up; middleware — no progress capability exists, and a consumer's multipart
   upload-progress request is the condition for a future reporter-callback admission, with no
   key or option presented as live.
4. The added prose carries no term the substitution table in that repository's
   `.claude/rules/writing.md` bans in a banned sense, and no count — name the pattern you swept
   with and the lines it covered.
5. The report records the `format:check` and guides-project gate readings with exit 0.

## Output

Per repository, one line per claim with its verdict and one-line evidence, then a single
terminal line: `VERDICT: PASS — every claim confirmed in every repository` or
`VERDICT: FAIL — <the broken claims, named by repository and number>`. No process diary.
