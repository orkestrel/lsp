# Unit g1-tool — record the progress ruling in the tool guide

## Role and engine

You are the `builder` lane, Sonnet, native, writing directly in `/home/user/tool`. Perform this
assignment yourself and spawn nothing. You are the only writer in that tree for the unit's
duration. You do not commit, push, or run `git checkout`, `git restore`, `git stash`,
`git reset`, or `git clean`.

## Read first, in order

1. `/home/user/tool/AGENTS.md`, then `.claude/rules/documentation.md` and
   `.claude/rules/writing.md` in that repository.
2. `/home/user/tool/guides/tool.md` — the file you edit; the blockquote spanning roughly
   `:20-25` carries the existing "Mechanism only." framing your addition joins.

No skill is named.

## The ruling this unit records (adopted; argue how, never whether)

The tool package stays untouched by the fleet's progress work, and the reason lands in its
guide so the question is not reopened. The ruling: a tool is inert mechanism, and progress
reporting lives one layer up, in the invoking consumer's execution context — in the Model
Context Protocol server package that context carries a progress reporter — so a progress surface
on the tool contract would move an application concern into the mechanism layer.

## Standing conditions (verified 2026-08-26)

- `/home/user/tool` is CLEAN at commit `7a52395` on the `claude/lsp-spec-audit-est33d` branch.
- Dependencies are installed (`npm ci` ran green).
- `tests/guides.test.ts` gates the guide: every backticked API must resolve to a real public
  export of THIS package. Name the invoking layer in prose — the `@orkestrel/mcp` package's
  execution context — and confirm with the gate that however you write it, parity stays green;
  where a backticked foreign token fails the gate, write it unbackticked.

## Objective

The mechanism-only blockquote near `guides/tool.md:26` carries the reason: extend it with one or
two sentences stating that progress reporting belongs to the invoking consumer's execution
context, one layer up, and never to the tool contract. Join the existing framing rather than
duplicating it.

## Scope

- Owned: `guides/tool.md`.
- Off-limits: every other file in the repository.
- Allowed tools: read, edit, and the acceptance-criteria commands.

## Deviation contract

A parity failure no phrasing of your owned file can close, or a change that cannot land without
editing an off-limits file, stops the unit: report expected, found, exact evidence, done or not
done, and at most one short hypothesis. Wording and exact placement inside the blockquote are
yours to decide and record.

## Acceptance criteria, cheap-first, each command and output recorded

1. `npm run format:check` exits 0.
2. The guides Vitest project exits 0 — run the repository's own script where `package.json`
   declares one (`npm run test:guides`), else `npx vitest run --project guides`.

## Review evidence

This is a documentation change: your report carries the actual `git diff` and the actual
`git status --short` output.

## Output

Write your report to `/home/user/lsp/tmp/units/g1-tool-report.md`: the sentence you landed and
where, the gate readings with exit codes, the diff, the status output, and any claim you flag.
No process diary.
