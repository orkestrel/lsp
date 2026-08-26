# Unit brief: m4-gates — the M4 round's authoritative gate evidence

## Role and engine

`verifier` — Sonnet, native subagent, read-only with Bash. You run commands and report
exit-code truth; you fix nothing, edit nothing, and never run a mutating git command.

## Objective

Run the authoritative gate chain in `/home/user/mcp` at commit `c2a35d4` on branch
`claude/lsp-spec-audit-est33d` and report the actual readings.

## Context

- The tree is CLEAN at `c2a35d4`; confirm with `git status --short` and `git log
  --oneline -1` as your first commands and report both.
- The M4 round landed `m4-era`, `m4-contract` (+`.1`), `m4-mirror` (+`.1`), `m4-stream`,
  `m4-proof`, and `m4-guide` across earlier checkpoints. This unit takes the round's
  whole-tree gate reading; the round audit follows it.
- Host: Linux, dependencies installed. The `src` project's earlier full reading was
  `1143 passed` with one skipped; `test:guides` reads `144 passed (144)` after
  `m4-guide`.

## Scope

- Owned files: none. You write nothing anywhere.
- Allowed: read-only inspection and the gate commands below.

## Execution

Run exactly, in order, reporting each exit code and the summary lines of each test run:

```text
npm run format:check
npm run lint:check
npm run check
npm run build
npm test
```

Do not stop on a red gate: run the whole chain, then report every reading. For a red test
row, quote the failing test's full name and the assertion excerpt exactly.

## Deviation contract

You never fix a failure. A command that cannot run at all (missing script, install
fault) is reported with its exact error text.

## Acceptance criteria

The report carries: the opening status and head readings; every gate's exit code; each
test project's pass/fail/skip summary line; and for any red row the exact failure
excerpt. Nothing else.

## Output

Write the report to `/home/user/lsp/tmp/units/m4-gates-report.md`. Your final message is
the exit-code list and, if any gate is red, the failing rows' names.
