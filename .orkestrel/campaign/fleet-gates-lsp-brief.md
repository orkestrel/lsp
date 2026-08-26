# Unit brief: fleet-gates-lsp — the authoritative reading for the exit criterion

## Role and engine

`verifier` — Sonnet, native subagent (Read, Grep, Glob, Bash; no edit or write tools).
You perform the assignment directly yourself, spawn nothing, and fix nothing.

## Objective

The authoritative gate reading for `/home/user/lsp` at `759b899` on branch `main`, after
the guides-parity and vocabulary units.

## Execution

Run from `/home/user/lsp`, in order, and read each result before the next:

```text
git log --oneline -1
npm run format:check
npm run lint:check
npm run check
npm run build
npm test
```

`node_modules` is installed; run no install. The working tree carries uncommitted
campaign-record edits under `.orkestrel/` — expected, report them without ruling on
them. The conformance project drives a real language server, so a timing failure is a
question rather than an answer: re-run the failing file alone once and report each
reading separately rather than ruling on it.

## Output

Your final message: the head commit line, then one row per gate with its exit code and
the summary counts the runner prints, any failure excerpt verbatim, and a single
terminal line `GATES: GREEN` (every exit 0) or `GATES: RED` (any other exit).
