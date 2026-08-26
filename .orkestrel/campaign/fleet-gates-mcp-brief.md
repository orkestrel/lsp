# Unit brief: fleet-gates-mcp — the authoritative reading for the exit criterion

## Role and engine

`verifier` — Sonnet, native subagent (Read, Grep, Glob, Bash; no edit or write tools).
You perform the assignment directly yourself, spawn nothing, and fix nothing.

## Objective

The authoritative gate reading for `/home/user/mcp` at `aa20c37` on branch
`claude/lsp-spec-audit-est33d`, after the M6 naming cascade.

## Execution

Run from `/home/user/mcp`, in order, and read each result before the next:

```text
git log --oneline -1
npm run format:check
npm run lint:check
npm run check
npm run build
npm test
```

`node_modules` is installed; run no install. The suite spawns real transports and
fixture servers, so a timing failure is a question rather than an answer: re-run the
failing file alone once and report each reading separately rather than ruling on it.
One pre-existing skip in the server project is expected.

## Output

Your final message: the head commit line, then one row per gate with its exit code and
the summary counts the runner prints, any failure excerpt verbatim, and a single
terminal line `GATES: GREEN` (every exit 0) or `GATES: RED` (any other exit).
