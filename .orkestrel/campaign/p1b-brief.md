# P1b — the `Session` byte face

## Role and engine

`implementer` — Claude Opus 5, native. (Sol excluded this session, recorded.)

## Objective

In the `@orkestrel/process` repository at `C:\Users\mikes\WebstormProjects\process` (baseline
`5fabc07`, clean), implement the `Session` class — the raw supervised child the D3 round ruled —
over the `Supervisor` engine, with its types, factory, barrel row, real-child tests, and full
guide parity.

## Context

Read before editing: the process repository's `AGENTS.md` and
`.claude/rules/{names,typescript,architecture,patterns,tests,documentation,portability}.md`;
the dispatch-named skill `orkestrel-harden-package` at
`.agents/skills/orkestrel-harden-package/SKILL.md` in the process repository (select the
implementation, consolidation, tests, and documentation phases); the ruling you implement at
`C:\Users\mikes\WebstormProjects\lsp\.orkestrel\campaign\d3-reconciliation.md` (architecture and
names — binding) with the proof catalogue in `d3-objective-verdicts.md` § 6 and
`d3-subjective-verdicts.md` item 6 beside it; the P1a report at
`C:\Users\mikes\WebstormProjects\lsp\.orkestrel\campaign\p1a-report.md` (the face seam you
consume — its callback set, accessors, and `deliver`/`stop`/`destroy`/`ending`/`exit` members);
then the process sources: `src/server/Supervisor.ts`, `src/server/Process.ts` (as the face
precedent — how it composes the engine), `src/core/types.ts`, `guides/process.md`,
`tests/src/server/Process.test.ts` and `tests/src/server/fixtures/child.mjs` (the test patterns
and fixture modes you extend).

Host facts: Windows 11; npm scripts as plain single commands, run in the process repository.

## The ruled contract, binding

- **Types**, in `src/core/types.ts`: `SessionInterface` — `pid`, `code`, `signal`, `emitter`,
  `evidence`, `settled`, `stopping`, `ending: Promise<void>` (settles at the child's NATIVE
  exit, never rejects), `exit: Promise<ProcessExit>` (the terminal moment, as on `Process`),
  `write(bytes: Uint8Array): Promise<boolean>`, `end(): Promise<void>`, `stop()`, `destroy()`.
  `SessionEventMap` — `stdout: readonly [chunk: Uint8Array]`, `stderr: readonly [chunk: string]`,
  `error`, `exit` (terminal moment, at most once). `SessionOptions` — `command`, `workspace`,
  `grace`, `drain`, `evidence`, `delivery`, `signal`, `on` (`EmitterHooks<SessionEventMap>`),
  `error` — NO `backlog`, NO `writable`, NO `input`. Complete TSDoc per the typescript rules on
  every exported symbol, including the two-endings distinction on `ending` and `exit` and the
  not-a-termination semantics on `end`.
- **`Session`** in `src/server/Session.ts`: composes one `Supervisor`; validates its own options
  BEFORE constructing the engine (the P1a seam note — the engine's throw otherwise lands after a
  spawn); constructs the engine with `writable: true`; attaches ONE `data` listener to the
  seam's stdout and emits ONE owned `Uint8Array` COPY per host chunk (the host `Buffer` backing
  is pooled — the copy is the contract), guarded so nothing emits after the terminal moment;
  maps the seam callbacks onto its emitter (`stderr` text, `error`, `exit` once at terminal);
  `write` delegates to the engine's `deliver`; `end()` uses the engine's stdin-end capability
  YOU add in this unit (see the engine change); refusal semantics inherited: `write` resolves
  `false` when settled, stopping, faulted, or the channel is ended — never throws, never
  rejects.
- **The engine change**, in `src/server/Supervisor.ts` (owned per P1a's flag): a stdin-end
  capability — closes stdin without terminating (no `stopping`, no `stopChild`, no `drain`
  arming, no terminal moment), idempotent stable barrier, lets Node's `end` flush accepted
  writes, quiet host faults after `writableEnded` (the existing fault guard already reads it),
  no-op after `stop`/`destroy`. `Process` must not change: confirm `tests/src/server/`
  `Process.test.ts` stays byte-identical and green at 147 passed | 6 skipped.
- **Factory** `createSession(options: SessionOptions): SessionInterface` in
  `src/server/factories.ts`; barrel row `export * from './Session.js'` in
  `src/server/index.ts` (and the types flow through the existing types row).
- **Guide parity**, `guides/process.md`: Types, Surface (entity row for `Session`), and Methods
  rows; a Standard input passage covering `write` beside `send` and `end`; the terminal-moment
  section gains the sentence that `end` is the member that does not reach the moment; the
  Vocabulary rows the naming ruling owes — `Session` (why a second entity, why not `Child` or
  `Channel`), `Supervisor` (why interned), `ending` beside `exit`, `end` (why not `close`, why
  void), `write` beside `send`, `stdout` beside `stderr` (why one payload is decoded and one
  raw), the absent `backlog` and `writable`. Follow this guide's existing voice and table
  shapes; `tests/guides.test.ts` gains whatever rows or fence transcriptions its parity
  mechanism requires for the new names.

## Proof catalogue, binding (real children, mirroring the Process suite's patterns)

Byte fidelity: a binary payload (NUL bytes, invalid-UTF-8 sequences) arrives byte-identical
across `stdout` events; concatenation equals the child's exact output; a payload with no
trailing newline and one carrying a lone `\r` arrive unaltered; `\n` does not split events;
mutating an emitted chunk after the fact does not change a later read (owned copies).
`write`: echoes exact bytes with no added terminator (a raw-echo fixture mode); `false` after
`end`, after `stop` begins, after settle; a `delivery`-bounded unconfirmed `write` resolves
`false` against an unbounded control; teardown settles a pending `write` `false` with no `error`
event; a host stdin fault yields one `protocol`-style error event and later `write` `false`
(mirror the Process rows).
`end`: leaves the child live (`stopping` false, `code`/`signal` null, `ending` unsettled);
idempotent stable barrier; `end` then self-exit — `ending` settles, `exit` settles, `stop` never
called; `end`, expiry, `stop` — escalation confirmed; `end` after `stop` resolves and changes
nothing.
Endings: `ending` settles at native exit while `exit` waits on a descendant holding the pipe
(use the existing orphan/hold fixture modes); the `exit` event and promise agree, once;
`pid`/`evidence`/live `stderr` behave as on `Process`.
Suites: `Process.test.ts` untouched and green; the guides project green; every new fixture mode
lives in `tests/src/server/fixtures/child.mjs`.

## Scope

- Owned: `src/core/types.ts`, `src/server/Supervisor.ts`, `src/server/Session.ts` (new),
  `src/server/factories.ts`, `src/server/index.ts`, `tests/src/server/Session.test.ts` (new),
  `tests/src/server/fixtures/child.mjs`, `guides/process.md`, `tests/guides.test.ts`.
- Off limits: `src/server/Process.ts`, `tests/src/server/Process.test.ts`,
  `src/server/ProcessManager.ts`, `src/server/execution/**`, `src/core/constants.ts`,
  `package.json`, every vendored file, everything else.
- Validation, read-only and scoped in the process repo: `npm run lint:check`, `npm run check`,
  `npm run test:src:server`, `npm run test:guides`, `npm run test:policy`,
  `npm run format:check`. Not `format`, `lint --fix`, `build`, or full `npm test`.

## Execution

You perform this assignment directly and spawn nothing (fixture children are the suite's
subjects).

## Output

Write the report to `C:\Users\mikes\WebstormProjects\lsp\tmp\units\p1b-report.md` and return it:
the contract as landed, the engine's stdin-end shape, the new fixture modes, mutation evidence
that the new suite binds (at least one seeded defect per family: fidelity, write, end, endings),
commands with real counts, `git diff --stat`, `git status --porcelain`. No process diary.

## Deviation contract

Stop and report when: any `Process` behavior must change; the seam cannot carry a ruled member
without a public leak; a ruled name collides in this repository. Ancillary choices — fixture
mode names, test ordering, guide row phrasing within the ruled set — are yours to decide and
record.

## Acceptance criteria, cheap first

1. `git status --porcelain` shows exactly the owned files; `Process.test.ts` and `Process.ts`
   absent from the diff.
2. The ruled names land exactly; `Supervisor` stays out of the barrel; `Session` is barrelled.
3. `npm run lint:check`, `npm run check`, `npm run format:check` green.
4. `npm run test:src:server` green — the Process rows at their baseline count plus the new
   `Session` rows (state both numbers).
5. `npm run test:policy` green.
6. `npm run test:guides` green with the new rows and Vocabulary entries present.
7. Mutation evidence recorded per family, restored, and the suite green after restoration.
