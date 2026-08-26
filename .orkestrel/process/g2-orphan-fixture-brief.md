# Unit brief: g2-orphan-fixture — the process fixture's held-pipe guard

## Role and engine

`builder` — Sonnet, native subagent. You write in `/home/user/process`, the sole writer in
that checkout, from the clean committed baseline `ddc9286` on branch
`claude/lsp-spec-audit-est33d`. You perform the assignment directly yourself and spawn
nothing.

## Objective

The `late` fixture holder survives the destruction of its held pipe, so the
stop-versus-orphan proof reads green on this host, with the red-first record bound to the
fix.

## Context

- Read before editing: `/home/user/process/AGENTS.md`;
  `/home/user/process/.claude/rules/` — `tests.md`, `typescript.md`, `writing.md`; no
  skill (explicit none).
- The failing proof, measured by the Orchestrator on 2026-08-26 in this container:

  ```text
  npx vitest run --config vite.config.ts --no-cache --reporter=dot --project src:server tests/src/server/Process.test.ts
  ```

  fails `1 failed | 55 passed | 1 skipped (57)` — the row
  `reaches the terminal moment on stop alone with no destroy call` times out because the
  condition "the stopped descendant appends further markers after the stop resolved"
  never holds.
- The settled mechanism, proved by an out-of-repo instrument (retained by the
  Orchestrator): the package's drain bound destroys the held pipes — correct behavior —
  and the fixture's `late` holder (`tests/src/server/fixtures/child.mjs`, the
  `mode === 'late'` branch) writes to the inherited stderr with no error handler, so the
  destroyed pipe's stream error crashes the grandchild after one final append and the
  file-side proof freezes. The same shape with
  `process.stderr.on('error', () => undefined)` keeps the writer alive and appending.
  The container's orphan semantics are normal (a plain orphan survives its parent's
  exit, measured), so the guard is the whole fix.
- Host facts: POSIX; the fixture is a self-contained entrypoint importing no repository
  sibling, and the repair keeps it that way.

## Scope

- Owned: `tests/src/server/fixtures/child.mjs` (the `late` branch only).
- Off-limits: everything else — `src/` above all; the test file's assertions are correct
  and stay untouched. A consequence outside the owned set is a deviation, never an edit.

## Deliverables

1. Record the red first: run the preceding command and quote its failing line and counts
   in the report.
2. In the `late` branch, swallow the held pipe's stream error so the holder outlives the
   pipe — `process.stderr.on('error', () => undefined)` before the interval arms — with a
   one-line comment stating the constraint: the held pipe's destruction must not end the
   file-side proof.
3. Record the green: the same command, exit 0, `56 passed | 1 skipped (57)`.
4. Bind the fix: revert your guard line in place, run the single row
   (`-t "reaches the terminal moment on stop alone"`) and record the red returning, then
   restore the guard and record the green again. Use an exact-line edit for the revert,
   never a checkout command.

## Execution

You perform the assignment directly and spawn nothing. Validate scoped:

```text
npx oxfmt --config .oxfmtrc.json --check tests/src/server/fixtures/child.mjs
npx --no-install oxlint --config .oxlintrc.json --deny-warnings tests/src/server/fixtures/child.mjs
npx vitest run --config vite.config.ts --no-cache --reporter=dot --project src:server tests/src/server/Process.test.ts
```

## Deviation contract

Stop and report — expected, found, exact evidence — when the red does not reproduce
before your edit, when the guard does not turn the row green, when the mutation revert
does not re-red the row, or when any other row moves. Comment wording is yours to decide
and record.

## Acceptance criteria, cheap-first

1. Scoped format and lint exit 0.
2. The red-first record, the green record, and the mutation-binding record, each with its
   exact command and counts.
3. The full `Process.test.ts` file reads `56 passed | 1 skipped (57)` exit 0.
4. A writing-rules sweep over your added comment passes.

## Output

Write the report to `/home/user/lsp/tmp/units/g2-orphan-fixture-report.md`: the diff, the
red, green, and binding records verbatim, the sweep, and the actual `git status --short`
and `git diff --stat` output. Your final message is a short summary naming the report
path.
