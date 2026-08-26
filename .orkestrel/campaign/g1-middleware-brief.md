# Unit g1-middleware — record the progress ruling in the middleware guide

## Role and engine

You are the `builder` lane, Sonnet, native, writing directly in `/home/user/middleware`.
Perform this assignment yourself and spawn nothing. You are the only writer in that tree for
the unit's duration. You do not commit, push, or run `git checkout`, `git restore`,
`git stash`, `git reset`, or `git clean`.

## Read first, in order

1. `/home/user/middleware/AGENTS.md`, then `.claude/rules/documentation.md` and
   `.claude/rules/writing.md` in that repository.
2. `/home/user/middleware/guides/middleware.md` — the file you edit; the multipart
   documentation sits at `:104-118`, `:150-160`, `:193-224`, `:436-447`, and `:652-720`.

No skill is named.

## The ruling this unit records (adopted; argue how, never whether)

The middleware package stays untouched by the fleet's progress work, and the reason lands in
its guide so the question is not reopened. The ruling: the package observes through callbacks
and carries no progress capability in its contract — a probe of `src/core/types.ts` matches no
progress member, and the `report` member at `types.ts:32` is an error sink. The one admitting
trigger is a consumer asking for multipart upload progress, which a future change would answer
with a reporter callback in the multipart options. Record that trigger as the condition for a
future admission. `MultipartOptions` carries no such key on 2026-08-26, so name no key, show no
option, and write nothing a reader could mistake for a live surface.

## Standing conditions (verified 2026-08-26)

- `/home/user/middleware` is CLEAN at commit `8ea6c03` on the `claude/lsp-spec-audit-est33d`
  branch.
- Dependencies are installed (`npm ci` ran green).
- `tests/guides.test.ts` gates the guide: every backticked API must resolve to a real public
  export of this package, so an invented option key fails the gate.

## Objective

A short passage beside the multipart documentation — near the block at `:652-720`, or the
`Patterns` position you judge closest to the multipart material — states that multipart
processing reports no progress, and that a consumer's request for upload progress is the
condition under which a reporter callback would join the multipart options. One or two
sentences; placement is yours to decide and record.

## Scope

- Owned: `guides/middleware.md`.
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

Write your report to `/home/user/lsp/tmp/units/g1-middleware-report.md`: the sentence you
landed and where, the gate readings with exit codes, the diff, the status output, and any claim
you flag. No process diary.
