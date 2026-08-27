# U5 — decompose the LSP codec into the `LSPDecodeState` algebra and the two grammar readers

## Role and engine

`implementer` — Claude Opus 5, native. (The design lane proposed the Sol `implementer`; Sol is
user-excluded this session, so the writing falls to Opus per the engine-unavailable table.
Recorded in `.orkestrel/lsp/d2-reconciliation.md`.)

## Objective

Extract the five leaves the D2 round ruled in from `parseLSPMessages` into
`src/core/helpers.ts`, leaving the framing spine in `src/core/parsers.ts`, with behavior
preserved byte-for-byte at every refusal and every accepted frame.

## Context

Read before editing, in order: `AGENTS.md`; `.claude/rules/architecture.md`,
`.claude/rules/names.md`, `.claude/rules/typescript.md`, `.claude/rules/tests.md`,
`.claude/rules/documentation.md`; `.orkestrel/lsp/d2-subjective-verdicts.md` (the design you are
implementing — its Verdict 2 fixes the leaf set, signatures, naming reasons, and what stays; its
Verdict 3 fixes the proof obligations) and `.orkestrel/lsp/d2-reconciliation.md` (the ruling and
its retained tensions); then `src/core/parsers.ts` in full, `src/core/helpers.ts`,
`src/core/types.ts:350-374`, and `tests/src/core/parsers.test.ts`. No dispatch-named skill
applies.

Host facts: Windows 11; run npm scripts as plain single commands; your baseline is the commit
that landed U2 (confirm a clean tree with `git status --porcelain` before starting).

The leaf set (Verdict 2 is authoritative; summary):

- `joinLSPSegments(state: LSPDecodeState): Uint8Array` — always-owned flatten of the segment
  chain. The shell keeps the no-copy path as a ternary at both call sites
  (`previous === undefined ? pending.bytes : joinLSPSegments(pending)`), so the two duplicated
  walks become one implementation.
- `takeLSPTail(state: LSPDecodeState, count: number): Uint8Array` — the last
  `min(count, state.size)` retained bytes, owned; replaces the reverse cursor walk.
- `scanLSPBoundary(bytes: Uint8Array): number | undefined` — first `\r\n\r\n` index in a flat
  buffer. The overlap window and the absolute-offset translation stay in the shell.
- `readLSPHeader(header: Uint8Array, messages: readonly JSONRPCMessage[]): number` — the whole
  header grammar with every `LSPError` refusal preserved verbatim (codes, message strings,
  `context.value`, and the frozen `messages` context).
- `readLSPBody(body: Uint8Array, messages: readonly JSONRPCMessage[]): JSONRPCMessage` — fatal
  UTF-8 decode, `parseJSON`, and the JSON-RPC shape gate, refusals preserved verbatim.

What stays in `parseLSPMessages`: the state chaining, both `LSP_HEADER_LIMIT` accumulation
refusals, the boundary bookkeeping, the remainder re-seed, and the loop. No public constructor
for `LSPDecodeState`. No edit to `src/core/index.ts` or `src/core/types.ts`.

Named constraints:

- Behavior preservation is absolute: no refusal message string changes, no code changes, no
  context shape changes, no change to which bytes any call accepts or returns.
- No join during an incomplete header: `joinLSPSegments` is called only where the current code
  already joins. A join-per-chunk header path is quadratic in a 64 KiB header — refuse any shape
  that introduces one.
- Performance sanity: `takeLSPTail` allocates at most the overlap bytes per chunk.
- TSDoc per the typescript rules on all five exports, each with an `@example`.

## Unknowns, each with its settling step

1. **Does oxlint's `complexity` rule count `?.` and `??`?** Before editing, re-run the retained
   probe (`.orkestrel/lsp/complexity-probe.sh` — adjust its file list to the current tree if
   needed) to record the baseline, and re-run it after editing for the acceptance reading.
2. **Does `tests/setupConformance.ts` exercise framing refusals?** Grep it; record the answer as
   an observation in your report. It changes nothing you edit.

## Scope

- Owned: `src/core/helpers.ts`, `src/core/parsers.ts`, `guides/lsp.md`,
  `tests/src/core/helpers.test.ts`, and `tests/guides.test.ts` ONLY for the transcription a new
  value-asserting guide fence obliges (the executed-fence law: change a fence, change the
  transcription beside it) — touch nothing else in that file.
- Off limits: `tests/src/core/parsers.test.ts`, `tests/src/core/LSPClient.test.ts`,
  `tests/setupServer.ts`, `tests/setupConformance.ts`, `tests/conformance.test.ts`,
  `src/core/types.ts`, `src/core/index.ts`, `src/core/validators.ts`,
  `src/core/LSPClient.ts`, `src/server/**`, `package.json`, `ROADMAP.md`, everything else.
- Tools: Read, Grep, Glob, Edit, Write, Bash (scoped npm scripts and the probe script only).
- Validation, read-only and scoped: `npm run lint:check`, `npm run check:src:core`,
  `npm run test:src:core`, `npm run test:policy`, `npm run test:guides`. Do not run `format`,
  `lint --fix`, `build`, or full `npm test`.

## Execution

You perform this assignment directly and spawn nothing.

## Output

Write your distilled report to `tmp/units/u5-report.md` and return it: what each leaf owns, the
one-implementation join proof, the probe readings before and after (per function), the new test
cases with what each refuses, commands run with real counts, the full `git diff`, and
`git status --porcelain`. No process diary.

## Deviation contract

Stop and report (expected, found, evidence, done or not done, one short hypothesis) when: any
behavior-preservation conflict appears; a leaf cannot keep a refusal's exact context without a
new type; the probe's after-reading for `parseLSPMessages` is 30 or above (report the reading —
never invent a further seam to clear it); any off-limits test fails on your change. Ancillary
choices — TSDoc wording, guide row phrasing, test naming and ordering — are yours to decide and
record.

## Acceptance criteria, cheap first

1. `git diff --stat` names only the owned files.
2. The diff shows every refusal message string preserved verbatim and exactly one implementation
   of the segment-join walk in the tree.
3. `npm run lint:check` green.
4. `npm run check:src:core` green.
5. `npm run test:policy` green (kind purity; every centralized declaration exported).
6. `npm run test:src:core` green with `tests/src/core/parsers.test.ts` byte-identical to the
   baseline (prove with `git diff --stat` — it must not appear).
7. New `describe` blocks in `tests/src/core/helpers.test.ts` per D2 Verdict 3: join
   single/multi-segment and returned-buffer ownership; tail shorter/spanning/exceeding/zero
   counts; boundary at start, at end, absent, and the near-misses; every header refusal reached
   from header bytes alone asserting `code` and `context.value` where set, plus the accepted
   cases; body refusals asserting `code` and `context.code`.
8. `guides/lsp.md` Surface rows and worked examples for all five exports; `npm run test:guides`
   green.
9. The probe re-run reads `parseLSPMessages` strictly below 30; the report records the reading
   for it and for each new leaf, and states whether the shell cleared 20.

## Review evidence

The full `git diff`, `git status --porcelain`, and both probe transcripts in the report.
