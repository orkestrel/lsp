# Unit g1-process — record the progress ruling in the process guide

## Role and engine

You are the `builder` lane, Sonnet, native, writing directly in `/home/user/process`. Perform
this assignment yourself and spawn nothing. You are the only writer in that tree for the unit's
duration. You do not commit, push, or run `git checkout`, `git restore`, `git stash`,
`git reset`, or `git clean`.

## Read first, in order

1. `/home/user/process/AGENTS.md`, then `.claude/rules/documentation.md` and
   `.claude/rules/writing.md` in that repository.
2. `/home/user/process/guides/process.md` — the file you edit.

No skill is named.

## The ruling this unit records (adopted; argue how, never whether)

The process package stays untouched by the fleet's progress work, and the reason lands in its
guide so the question is not reopened. The ruling: the package streams a child's output as
lines, and that stream IS the progress surface — a child that redraws a progress bar with a
carriage return yields one line per redraw, which the guide already documents at
`guides/process.md:269`. A separate progress channel would duplicate the stream the consumer
already reads.

## Standing conditions (verified 2026-08-26)

- `/home/user/process` is CLEAN at commit `817464d` on the `claude/lsp-spec-audit-est33d`
  branch.
- Dependencies are installed (`npm ci` ran green).
- `tests/guides.test.ts` gates the guide: every backticked API must resolve to a real public
  export of this package.

## Objective

The vicinity of `guides/process.md:269` carries the reason: extend that passage, or add one or
two sentences beside it, stating that the line stream is the package's progress surface and a
consumer reads progress off the lines it already receives, so no separate progress channel
exists. The exact placement — extending `:269` or a short passage late in `Patterns` before
`Tests` — is yours to decide and record.

## Scope

- Owned: `guides/process.md`.
- Off-limits: every other file in the repository.
- Allowed tools: read, edit, and the acceptance-criteria commands.

## Deviation contract

A parity failure no phrasing of your owned file can close, or a change that cannot land without
editing an off-limits file, stops the unit: report expected, found, exact evidence, done or not
done, and at most one short hypothesis. Wording and placement are yours to decide and record.

## Acceptance criteria, cheap-first, each command and output recorded

1. `npm run format:check` exits 0.
2. The guides Vitest project exits 0 — run the repository's own script where `package.json`
   declares one (`npm run test:guides`), else `npx vitest run --project guides`.

## Review evidence

This is a documentation change: your report carries the actual `git diff` and the actual
`git status --short` output.

## Output

Write your report to `/home/user/lsp/tmp/units/g1-process-report.md`: the sentence you landed
and where, the gate readings with exit codes, the diff, the status output, and any claim you
flag. No process diary.
