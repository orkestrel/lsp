# P1a — extract the `Supervisor` engine and recompose `Process` over it

## Role and engine

`implementer` — Claude Opus 5, native. (The design lanes proposed Sol; Sol is user-excluded this
session, recorded in `.orkestrel/campaign/d3-reconciliation.md`.)

## Objective

In the `@orkestrel/process` repository at `C:\Users\mikes\WebstormProjects\process`, extract the
supervision engine `Process` shares with the forthcoming `Session` class into an interned
`Supervisor` class, and recompose `Process` over it with NO behavior change — the unmodified
`Process` suite green is the gate that defines success.

## Context

Read before editing, all inside the PROCESS repository: its `AGENTS.md` and
`.claude/rules/{architecture,names,typescript,patterns,tests}.md`; `guides/process.md` at the
supervised-children sections; then `src/server/Process.ts` in full, `src/core/types.ts`,
`src/server/helpers.ts` at the spawn and termination leaves, and `tests/src/server/Process.test.ts`
at whatever depth the extract needs. Dispatch-named skill: `orkestrel-harden-package` at
`.agents/skills/orkestrel-harden-package/SKILL.md` in the process repository — select only the
phases a narrow implementation unit needs (implementation, consolidation, tests, local
verification); the campaign's research and design are done and recorded.

Also read the ruling you implement: the lsp repository's
`C:\Users\mikes\WebstormProjects\lsp\.orkestrel\campaign\d3-reconciliation.md` (architecture of
record, names) — read-only.

Host facts: Windows 11; npm scripts as plain single commands; the process repository is clean at
`23808f2` (confirm with `git -C C:\Users\mikes\WebstormProjects\process status --porcelain`).

The ruled boundary of the extract:

- **`Supervisor` owns** (moved from `Process`): the eager spawn path (`mergeEnvironment`,
  `buildSpawn`, `spawn`, the host event wiring for child `error`/`exit`/`close`), the stderr
  retention and decoded `stderr` emission, the native-exit-to-drain-to-terminal-moment
  progression (`#expire`, `#wait`, `#close`, `#settle`), the stdin channel — the write map, the
  `delivery` bound, `#confirmWrite`/`#settleWrite`/`#settleWrites`, the stdin fault path — and
  the termination (`stop`'s shared barrier through `stopChild`, `destroy` sequencing hooks).
- **`Process` keeps**: its readline attach and the whole line pipeline (push, backlog,
  restrain/resume, truncation, `lines` iteration), `send`'s line framing (compose the text plus
  terminator, then hand the bytes to the engine's raw deliver primitive), its public getters
  (delegating to engine state where the state moved), and its published constructor contract.
- **The engine's face seam**: `Supervisor` exposes to its composing class (constructor-injected
  or accessor — your judgment) what a face needs and no more: the child's stdout Readable for
  the face to attach its own consumer, a raw byte deliver primitive for stdin, the monotonic
  facts (`pid`, `code`, `signal`, `settled`, `stopping`), the native-ending and terminal-moment
  settlements, and the stop/destroy operations. The engine emits nothing itself; each face owns
  its public emitter and event map. Nothing engine-internal leaks to any PUBLIC surface.
- `Supervisor` lives alone in `src/server/Supervisor.ts`, is exported from its file but NOT
  barrelled, and joins the guide-parity INTERNAL list (find where that list lives in this
  repository — the guides suite — and add the row).
- No public type changes in this unit: `ProcessInterface`, `ProcessOptions`,
  `ProcessEventMap`, and every published behavior stay byte-identical in meaning. `Session`
  lands in P1b, not here.

## Unknowns

Where the INTERNAL list lives in this repository's guides suite: settle by reading
`tests/guides.test.ts` before editing; if this repository's parity has no INTERNAL mechanism,
stop and report per the deviation contract instead of inventing one.

## Scope

- Owned (all in the process repository): `src/server/Supervisor.ts` (new),
  `src/server/Process.ts`, `tests/guides.test.ts` (the INTERNAL row only).
- Off limits: `src/core/types.ts`, `src/core/constants.ts`, `src/server/factories.ts`,
  `src/server/index.ts`, `src/server/ProcessManager.ts`, `src/server/execution/**`,
  `tests/src/server/Process.test.ts` (byte-identical — the gate), every other test,
  `guides/process.md` (P1b owns the guide), `package.json`, every vendored file.
- Tools: Read, Grep, Glob, Edit, Write, Bash (scoped npm scripts in the process repo only).
- Validation, read-only and scoped, run in the process repository: `npm run lint:check`,
  `npm run check`, `npm run test:src:server` (or this repository's equivalent scoped script —
  read `package.json` scripts and use the narrowest that collects the Process suite), the
  guides project script, `npm run format:check`. Do not run `format`, `lint --fix`, `build`, or
  the full `npm test`.

## Execution

You perform this assignment directly and spawn nothing (test children are the suite's subjects,
not dispatches).

## Output

Write the report to `C:\Users\mikes\WebstormProjects\lsp\tmp\units\p1a-report.md` and return it:
what moved into `Supervisor` and what stayed, the face seam's exact shape (the members `Session`
will consume in P1b), commands with real counts proving the unmodified suite green, the full
`git diff --stat` and `git status --porcelain` of the process repository. No process diary.

## Deviation contract

Stop and report when: any `Process` behavior must change to complete the extract; any row of
`Process.test.ts` fails; the INTERNAL mechanism does not exist; a policy or placement rule
refuses the engine shape. Ancillary choices — the seam's exact member names (they are internal),
private method naming — are yours to decide and record.

## Acceptance criteria, cheap first

1. `git status --porcelain` in the process repo shows exactly the owned files.
2. `tests/src/server/Process.test.ts` does not appear in the diff.
3. `Supervisor` is exported from its file, absent from `src/server/index.ts`, and named in the
   INTERNAL list.
4. `npm run lint:check` and `npm run check` green in the process repo.
5. The scoped server-suite run green with the same test count as the baseline (record the
   baseline count first, then the after count — they must be equal).
6. The guides project green.
7. `npm run format:check` green.

## Review evidence

The full `git diff` of `src/server/Process.ts` and the new `Supervisor.ts`, plus
`git status --porcelain`, in the report.
