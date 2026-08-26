# Unit brief: fleet-gates-workflow — the release verifier sweep

## Role and engine

`verifier` — Sonnet, native subagent (Read, Grep, Glob, Bash; no edit or write tools).
You perform the assignment directly, spawn nothing, and fix nothing.

## Objective

Run the authoritative tree-wide gate chain in `/home/user/workflow` and report exit-code
truth, as the independent reading the campaign's exit criterion requires for every
touched checkout.

## Context

- Subject tree: `/home/user/workflow` on its checked-out branch. Confirm
  `git status --short` is empty and report the current `git log --oneline -1` head
  before running; report any dirt as a finding, not something to clean.
- The chain is the acceptance gate from the repository's `AGENTS.md`: the non-mutating
  variants, in order. Run each command bare — no pipeline stage after a gate command.
- Where a script named below is absent from `package.json`, report the absence and skip
  that command; absence is a reading, not a failure.

## Execution

Run, in order, from `/home/user/workflow`:

```text
npm run format:check
npm run lint:check
npm run check
npm run build
npm test
```

Continue through the chain even when a gate reds, so the report carries every reading.

## Output

Write nothing to the tree. Return as your final message: the head commit, each command
with its exit code, the summary line of every test project, and for any nonzero exit the
exact failing excerpt verbatim. End with one line: `GATES: GREEN` when every run exit
is 0, else `GATES: RED — <commands>`.
