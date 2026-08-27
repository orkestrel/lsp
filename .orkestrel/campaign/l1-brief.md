# L1 — adopt `Session` in lsp's `StdioClientTransport`

## Role and engine

`implementer` — Claude Opus 5, native. (Sol excluded this session, recorded.)

## Objective

Replace the transport's direct `node:child_process` machinery with one `@orkestrel/process`
`Session` per generation, consumed as a packed tarball until the registry serves the release,
with every documented transport obligation surviving verbatim.

## Context

Read before editing: `AGENTS.md`; `.claude/rules/{patterns,architecture,typescript,tests,
portability,documentation}.md`; the dispatch-named skill `orkestrel-harden-package`
(implementation, tests, documentation phases); the binding rulings at
`.orkestrel/campaign/d3-reconciliation.md` § Architecture of record (the adoption map) and the
`Session` contract as landed in `.orkestrel/campaign/p1b-report.md`; then the lsp sources you
own and `guides/lsp.md` § Stdio client transport.

Host facts: Windows 11; npm scripts as plain single commands. The Orchestrator has already
installed the packed process tarball into lsp and committed that swap — confirm
`node_modules/@orkestrel/process/package.json` reads version `0.0.7-tarball` state per the swap
record in `.orkestrel/campaign/tarball-swap.md`, and start from the clean committed baseline the
dispatch names.

The adoption map, binding:

- One `Session` per `start()` generation, constructed with
  `command: { file, arguments, environment?, isolated? }` mapped from the transport's
  `server.command` vector — first element the `file`, rest the `arguments` — and
  `workspace: server.directory` when present. lsp documents `server.environment` as the child's
  COMPLETE environment, so when it is present map it to `command.environment` plus
  `command.isolated: true`; when absent, pass neither.
- The transport's documented single `grace` knob governs every window, so map it onto the
  package's split knobs deliberately: race `session.ending` against the transport's own
  `grace`-bounded wait (the cooperative window after `end()`), pass `grace: this.#grace` (the
  escalation window inside `stop`), and `drain: this.#grace` (the grandchild-held-pipe bound —
  the analog of today's `waitForClose(grace)`), so every "bounded by `grace`" sentence in the
  TSDoc stays true. Never race `session.exit` for the cooperative window — it settles at the
  terminal moment, up to `drain` after native exit.
- `close()` becomes: `await session.end()` (cooperative, no termination) → race `session.ending`
  against the transport's `grace` timer (use the existing `waitForDeadline` helper from
  `@src/core`) → on expiry `await session.stop()` and treat a `false` confirmation as today's
  `timeout`-coded refusal that keeps the generation unretired → settle and retire exactly as
  today, then `await session.destroy()` on the retired path.
- `send(bytes)` delegates to `session.write(bytes)`; `chunk` re-emits from the session's
  `stdout` event; `exit` maps from the session's `exit` event (terminal moment, once) through
  the transport's existing generation-scoped retire; `error` maps from the session's `error`
  event; stderr needs no handling (the session retains evidence — delete the transport's
  drain-by-resume, and where the transport's TSDoc mentions draining stderr, reword to the
  retention the package now provides).
- The transport keeps: generation counter and ownership, the `duplicate` refusal window, the
  exit-once retire, `pid` (from `session.pid`, generation-gated as today), and every `LSPError`
  code and message.
- Deleted: the `node:child_process` import and `spawn`, `buildSpawn`, `stopChild`,
  `waitForExit`, `waitForClose` — no `@orkestrel/process/server` helper import remains in the
  transport.
- `src/server/types.ts` TSDoc: the option remarks name the old helpers and the old termination
  path — reword to the `Session` path while keeping every behavioral claim (complete
  environment, grace bounds, reconnect, refusal codes) true and testable. `guides/lsp.md`'s
  stdio-client-transport section follows the same reword.

## Scope

- Owned (lsp): `src/server/transports/StdioClientTransport.ts`, `src/server/types.ts`,
  `tests/src/server/transports/StdioClientTransport.test.ts` (ONLY rows that asserted the
  direct-spawn internals may change; rows asserting documented behavior — exit-once, chunk
  fidelity, `send` false after close, `duplicate` refusal, teardown bounds — stay unmodified,
  and a behavioral row that must change is a stop-and-report deviation),
  `tests/src/server/integration.test.ts` and `tests/setupServer.ts` only if imports must
  follow, `guides/lsp.md` (the stdio section and any surface row wording).
- Off limits: `package.json` and `package-lock.json` (the Orchestrator owns the swap and its
  restoration), `src/core/**`, `tests/src/core/**`, `guides/probe.md`, everything else.
- Validation, read-only and scoped: `npm run lint:check`, `npm run check:src:server`,
  `npm run test:src:server`, `npm run test:guides`, `npm run format:check`, and — because the
  transport feeds it — `npm run test:conformance`. Not `format`, `lint --fix`, `build`, or full
  `npm test`.

## Execution

You perform this assignment directly and spawn nothing (the suite's children are its subjects).

## Output

Write the report to `tmp/units/l1-report.md` and return it: the mapping as landed (each
documented obligation and the code that now carries it), which test rows changed and why each
was an internals row rather than a behavioral row, commands with real counts, the full
`git diff`, `git status --porcelain`. No process diary.

## Deviation contract

Stop and report when: a documented behavioral claim cannot survive the mapping; a behavioral
test row must change; the session contract lacks something the map requires. Ancillary choices —
private field names, TSDoc phrasing within the true set — are yours.

## Acceptance criteria, cheap first

1. `git status --porcelain` shows only owned files.
2. `grep -n "child_process\|buildSpawn\|stopChild\|waitForExit\|waitForClose" src/server` is
   empty.
3. `npm run lint:check`, `npm run check:src:server`, `npm run format:check` green.
4. `npm run test:src:server` green; every unchanged behavioral row listed in the report.
5. `npm run test:guides` green.
6. `npm run test:conformance` green (243 at last reading — state the real count).
