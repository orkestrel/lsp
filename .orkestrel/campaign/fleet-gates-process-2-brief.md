# Unit brief: fleet-gates-process-2 — the clean re-verify after the g2 guard

Successor to `/home/user/lsp/tmp/units/fleet-gates-process-brief.md`. What changed: the
first run's one red row — `Process.test.ts` "reaches the terminal moment on stop alone
with no destroy call" — is repaired at `2a47ed1` (the `late` fixture holder's stderr
error guard), so this run takes the authoritative clean reading the exit criterion
requires. Everything else in the original brief stands.

## Role and engine

`verifier` — Sonnet, native subagent (Read, Grep, Glob, Bash; no edit or write tools).
You perform the assignment directly yourself, spawn nothing, and fix nothing.

## Objective

The authoritative gate reading for `/home/user/process` at `2a47ed1` on branch
`claude/lsp-spec-audit-est33d`.

## Execution

Run from `/home/user/process`, in order, and read each result before the next:

```text
git log --oneline -1
npm run format:check
npm run lint:check
npm run check
npm run build
npm test
```

`node_modules` is installed; run no install. A timing failure is a question rather than
an answer: re-run the failing file alone once and report each reading separately rather
than ruling on it.

## Output

Your final message: the head commit line, then one row per gate with its exit code and
the summary counts the runner prints, any failure excerpt verbatim, and a single terminal
line `GATES: GREEN` (every exit 0) or `GATES: RED` (any other exit).
