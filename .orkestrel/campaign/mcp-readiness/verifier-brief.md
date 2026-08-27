# V1 — independent gate evidence for the mcp and probe chains

- **Role and engine**: `verifier`, Sonnet, native. Read-only plus gate execution. You run the
  named commands, read their actual output, and report exit-code truth with exact failure
  excerpts. You fix nothing, edit nothing, and commit nothing.
- **Objective**: the authoritative, tree-wide gate reading for `@orkestrel/mcp` and
  `@orkestrel/probe` at the commits the dispatch names, in topological order (mcp before
  probe).

## Context

- Repositories: `C:\Users\mikes\WebstormProjects\mcp` and `C:\Users\mikes\WebstormProjects\probe`,
  each expected clean at the commit the dispatch names. Record `git status --porcelain` and
  `git rev-parse --short HEAD` for each repo before its chain and after it; a dirty tree at
  either reading is a finding, not something to clean.
- Host: Windows 11, Git Bash. Keep each shell call one plain command — no `&&` chains, no
  heredocs, no `node -e`.
- Standing conditions:
  - The mcp `check` script reads `dist/`, so the chain below runs `build` before `check`
    (the recorded MC reorder; a `check` against stale `dist/` reports failures that are not
    the tree's).
  - probe's suite drives its built bin and consumes git-ignored tarballs: confirm
    `tmp/tarballs/` in the probe repo lists the lsp and process tarballs before running the
    chain, and report their absence as a blocking finding rather than regenerating them.
  - The mcp repo's `tmp/worktrees/` and the probe repo's `tmp/probe/` directories are live
    campaign state — never touch either.
  - A timing or resource failure in a whole-suite run is a question, not an answer: report it
    with its exact output and move on; the Orchestrator takes the deciding re-run alone.

## Execution

Run each chain in order, one command per shell call, and stop a chain only if a command fails
in a way that makes the next command's reading meaningless (a failed `build` before a suite
that drives `dist/`); otherwise run every command and report every result.

mcp chain, in `C:\Users\mikes\WebstormProjects\mcp`:

1. `npm run format:check`
2. `npm run lint:check`
3. `npm run build`
4. `npm run check`
5. `npm test`

probe chain, in `C:\Users\mikes\WebstormProjects\probe`:

1. `npm run format:check`
2. `npm run lint:check`
3. `npm run build`
4. `npm run check`
5. `npm test`

## Output

Return as your final message: per-repo, the recorded commit and both `git status` readings,
then one table of command, exit code, and the summary line (or the exact failure excerpt) for
every command run. No process diary.

## Deviation contract

Stop and report only when a repository is not at the named commit or not clean at the start.
Everything else — including failures — is a result to report, not a deviation.

## Acceptance criteria

1. Every command in both chains ran (or its skip is justified by a failed prerequisite named
   in the report), each with its exit-code truth and summary line recorded.
2. Both status readings per repo recorded; any drift reported.
