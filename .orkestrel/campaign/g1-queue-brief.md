# Unit g1-queue — record the progress ruling in the queue guide

## Role and engine

You are the `builder` lane, Sonnet, native, writing directly in `/home/user/queue`. Perform this
assignment yourself and spawn nothing. You are the only writer in that tree for the unit's
duration. You do not commit, push, or run `git checkout`, `git restore`, `git stash`,
`git reset`, or `git clean`.

## Read first, in order

1. `/home/user/queue/AGENTS.md`, then `.claude/rules/documentation.md` and
   `.claude/rules/writing.md` in that repository.
2. `/home/user/queue/guides/queue.md` — the file you edit.

No skill is named.

## The ruling this unit records (adopted; argue how, never whether)

The queue package stays untouched by the fleet's progress work, and the reason lands in its
guide so the question is not reopened. The ruling: the queue owns lifecycle observation only;
progress belongs to the job the queue runs, reported through that job's own contract, so a
queue-level progress channel would duplicate a surface the job already owns. The guide's CUT
language already names "the progress / message channels" as deliberately CUT at
`guides/queue.md:29` and `:149`.

## Standing conditions (verified 2026-08-26)

- `/home/user/queue` is CLEAN at commit `3a9a7a7` on the `claude/lsp-spec-audit-est33d` branch.
- Dependencies are installed (`npm ci` ran green).
- `tests/guides.test.ts` gates the guide: every backticked API must resolve to a real public
  export of this package.

## Objective

The passage at `guides/queue.md:149` carries the reason beside the CUT: extend that sentence or
add one beside it stating that progress belongs to the job the queue runs and reaches the
consumer through the job's own contract, so the queue observes lifecycle only. One or two
sentences; no new section unless the surrounding structure forces one — that placement is yours
to decide and record.

## Scope

- Owned: `guides/queue.md`.
- Off-limits: every other file in the repository.
- Allowed tools: read, edit, and the acceptance-criteria commands.

## Deviation contract

A parity failure no phrasing of your owned file can close, or a change that cannot land without
editing an off-limits file, stops the unit: report expected, found, exact evidence, done or not
done, and at most one short hypothesis. Wording, exact placement, and whether the addition is a
sentence or a bullet are yours to decide and record.

## Acceptance criteria, cheap-first, each command and output recorded

1. `npm run format:check` exits 0.
2. The guides Vitest project exits 0 — run the repository's own script where `package.json`
   declares one (`npm run test:guides`), else `npx vitest run --project guides`.

## Review evidence

This is a documentation change: your report carries the actual `git diff` and the actual
`git status --short` output.

## Output

Write your report to `/home/user/lsp/tmp/units/g1-queue-report.md`: the sentence you landed and
where, the gate readings with exit codes, the diff, the status output, and any claim you flag.
No process diary.
