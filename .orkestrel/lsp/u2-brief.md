# U2 — client seam rulings and the two leaf extractions

## Role and engine

`implementer` — Claude Opus 5, native.

## Objective

Fold `#releaseGeneration`, extract `waitForDeadline` into `src/core/helpers.ts` and
`LSP_CAPABILITIES` into `src/core/constants.ts`, derive the initialize advertisement and the
encoding refusal from that constant, and land guide parity with an executed advertisement
assertion.

## Context

Read before editing: `AGENTS.md`; `.claude/rules/names.md`, `.claude/rules/typescript.md`,
`.claude/rules/architecture.md`, `.claude/rules/patterns.md`, `.claude/rules/tests.md`,
`.claude/rules/documentation.md`; `guides/lsp.md`; `.orkestrel/lsp/plan.md` rulings 1 and 2. No
dispatch-named skill applies.

Host facts: Windows 11; run npm scripts as plain single commands; the baseline is the commit that
landed U1 (the tree is clean when you start; confirm with `git status --porcelain`).

The design round ruled:

- **Fold `#releaseGeneration`** (`src/core/LSPClient.ts:696-698`): its one caller inside
  `#begin`'s catch (`:277`) awaits `this.#closeTransport()` directly; the method is deleted.
  `#cancelRequest` stays untouched — the round justified it and the ROADMAP row closes in U3, not
  here.
- **Extract `waitForDeadline(ms: number): Promise<void>`** into `src/core/helpers.ts`: a promise
  that resolves when the deadline elapses. The repeated construction it replaces sits in
  `#boundExit` (`:666-674`) and `#closeTransport` (`:676-694`); each caller keeps its own race
  and outcome mapping (`#closeTransport` still discriminates settled, failed, and deadline).
- **Extract `LSP_CAPABILITIES`** into `src/core/constants.ts`: the advertised capability record
  written inline at `:243-250`. `#begin` sends it as `params.capabilities`, and the encoding
  refusal at `:262-267` derives from it — the refusal accepts exactly the encodings the constant
  advertises, so the two `'utf-16'` literals that can drift become one source. The `encoding`
  getter's protocol-default literal (`:143-148`) is a different fact (the protocol's own default,
  not this client's advertisement) and is OUT of scope — leave it.
- **Guide parity**: `guides/lsp.md` surface tables gain `waitForDeadline` (helpers row) and
  `LSP_CAPABILITIES` (constants row) with one-line purposes; `tests/guides.test.ts` gains an
  executed assertion that `LSP_CAPABILITIES.general.positionEncodings` deep-equals `['utf-16']`,
  so the guide's "advertises utf-16 alone" sentence breaks when the code moves.

Named constraints:

- Do NOT annotate the constant's encodings array `as const` — `readonly ['utf-16']` then fails
  `includes(encoding: string)` and the repair a writer reaches for is a banned assertion. Use
  `satisfies LSPClientCapabilities` on the object (the current inline code already uses
  `satisfies`), with `Object.freeze` applied at EVERY level (freeze is shallow; the constants rule
  freezes object and array data).
- No new dependency, no `package.json` edit, no new export beyond the two named.
- The emitted error codes, messages, and event order of `destroy()` are behavior consumers
  observe; they must not change.

## Unknowns, each with its settling step — run these before editing

1. **Does `AbortSignal.timeout` keep the Node event loop alive after its race settles?** Settle
   with a runtime probe in `tmp/probe/` (the `probe` Vitest project collects it via
   `npm run test:probe`): spawn `process.execPath` with a short inline-file script that arms
   `AbortSignal.timeout(30_000)` inside a settled race and measure whether the child exits
   promptly; negative control: the same script with a plain `setTimeout(fn, 30_000)`, which is
   known to hold the loop and must make the child linger or be killed at the probe's bound. If the
   armed signal holds the loop, `waitForDeadline` must own a cleared timer
   (`setTimeout`/`clearTimeout`) and return a handle the callers clear — report that shape change
   in your report. Delete the probe before returning; nothing under `tmp/` is committed.
2. **Does `tests/conformance.test.ts` read the advertised capability set?** Grep it before
   writing the guide assertion; if it already asserts the advertisement, put the new executed
   assertion beside the existing mechanism rather than duplicating it, and say so.

## Scope

- Owned: `src/core/LSPClient.ts`, `src/core/helpers.ts`, `src/core/constants.ts`,
  `guides/lsp.md`, `tests/src/core/LSPClient.test.ts`, `tests/src/core/helpers.test.ts`,
  `tests/guides.test.ts`.
- Off limits: `src/core/validators.ts` (U1 owned it), `src/core/types.ts`, `src/server/**`,
  `package.json`, `package-lock.json`, `ROADMAP.md`, everything else.
- Tools: Read, Grep, Glob, Edit, Write, Bash (scoped npm scripts and the probe run only).
- Validation is read-only and scoped: `npm run lint:check`, `npm run check:src:core`,
  `npm run test:src:core`, `npm run test:guides`. Do not run `format`, `lint --fix`, `build`, or
  full `npm test`.

## Execution

You perform this assignment directly and spawn nothing (the probe's child process is the probe's
subject, not a dispatch).

## Output

Write your distilled report to `tmp/units/u2-report.md` and return it: the probe's reading with
its control, what changed per ruling, the guide rows and executed assertion added, commands run
with real counts, the full `git diff`, and `git status --porcelain`. No process diary.

## Deviation contract

Stop and report (expected, found, evidence, done or not done, one short hypothesis) when: the fold
changes any observable teardown behavior; the constant cannot typecheck without an assertion;
`tests/guides.test.ts`'s existing shape refuses the executed assertion; a test outside your owned
files fails on your change. Ancillary choices — TSDoc wording, test naming, row placement in the
guide tables — are yours to decide and record.

## Acceptance criteria, cheap first

1. `git diff --stat` shows only owned files.
2. The identifier `#releaseGeneration` is absent from the tree; `#begin`'s catch awaits
   `#closeTransport` directly; `#cancelRequest` is byte-unchanged.
3. `src/core/helpers.ts` exports `waitForDeadline`; `src/core/constants.ts` exports a
   deeply-frozen `LSP_CAPABILITIES`; neither file declares anything else new.
4. `#begin` sends `LSP_CAPABILITIES` and derives the encoding refusal from it; the advertisement
   and refusal share that one source; the `'utf-16'` literal remains only in the `encoding`
   getter's protocol-default.
5. `npm run lint:check` and `npm run check:src:core` green.
6. `npm run test:src:core` green, including: a `waitForDeadline` case proving it resolves at its
   deadline (measured with `performance.now()` against a generous lower bound) and, if the probe
   forced the cleared-timer shape, a case proving the timer is cleared; the existing destroy
   timeout-emission case still green unmodified.
7. `guides/lsp.md` carries the two new rows; `npm run test:guides` green with the new executed
   advertisement assertion present.

## Review evidence

The full `git diff`, `git status --porcelain`, and the probe transcript (command plus output) in
the report.
