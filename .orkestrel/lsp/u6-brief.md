# U6 — audit fix unit: the accepted A1 findings

## Role and engine

`implementer` — Claude Opus 5, native.

## Objective

Land the accepted findings of the A1 audit round exactly as prescribed in
`.orkestrel/lsp/campaign-audit-verdict.md` and the reviewer's finding texts below. Every fix
adopts the auditor's prescription verbatim; invent nothing beyond them.

## Context

Read before editing: `.orkestrel/lsp/campaign-audit-verdict.md`; `.claude/rules/writing.md`;
`.claude/rules/typescript.md`; then the files you own. Baseline: the tree is clean at `e5dfac7`
(confirm with `git status --porcelain`).

The fixes, each with its prescription:

1. **F1 — `guides/lsp.md` framing section.** Add to the operations paragraph:
   "`scanLSPBoundary()` returns the boundary's index, so `bytes.subarray(0, boundary)` is the
   block `readLSPHeader()` reads and the body starts at `boundary + 4`." Rewrite the second fence
   so it slices ONE framed buffer at those offsets (build a full frame with `encodeLSPMessage` or
   a template, scan it, slice header and body from the scan result) rather than encoding a header
   by hand. Keep the fence's imports from `@orkestrel/lsp`.
2. **F2 — `guides/lsp.md`**: replace "the messages you pass as the second argument" with "the
   `messages` argument travels on that error's `context.messages` property" (adjust for F9's
   default: e.g. "the `messages` argument, when you pass one, travels…" — your wording, condition
   first).
3. **F3 — `guides/lsp.md`**: "Reach either grammar directly when you frame the bytes yourself."
   becomes "When you frame the bytes yourself, reach the header and body grammars directly."
4. **F4 — `guides/lsp.md`**: "The operations over a retained state are published beside the
   codec." becomes "The core package publishes the operations over a retained state beside the
   codec."
5. **F5 — `src/core/helpers.ts` `readLSPHeader` `@throws`**: rewrite in the "Thrown … when …"
   form ("Thrown with code `framing` when the header carries a non-ASCII byte, a field without a
   name and a colon, …" — cover the same refusal list). Repair the same inherited form break on
   `parseLSPMessages`'s `@throws` in `src/core/parsers.ts`.
6. **F6 — `src/core/validators.ts`**: the diagnostic `code` member check becomes
   `if (!optionalOf(unionOf(isNumber, isString))(value.code)) return false` (import `unionOf` is
   already present). Add one refusal case to `tests/src/core/validators.test.ts` binding it:
   `code: true` refused, `code: 'TS2304'` and `code: 2304` accepted.
7. **F7 — `src/core/helpers.ts`**: rename `waitForDeadline`'s parameter `ms` to `timeout`
   (declaration and TSDoc `@param`; the doc sentence "The number of milliseconds to wait." stays).
8. **F8 — `guides/lsp.md`** `waitForDeadline` surface row: "the loop" becomes "the host event
   loop".
9. **F9 — `src/core/helpers.ts`**: `messages` on `readLSPHeader` and `readLSPBody` gains the
   default `= []`, documented as "Default: an empty list." Simplify the guide fence calls to omit
   the argument where that reads better, per your judgment.
10. **F11 — `src/core/LSPClient.ts`**: one `//` comment at the `encoding` getter's `'utf-16'`
    literal naming it as the protocol's own default for a server that omits `positionEncoding`,
    distinct from the client's advertisement.

## Scope

- Owned: `guides/lsp.md`, `src/core/helpers.ts`, `src/core/parsers.ts` (the `@throws` line only),
  `src/core/validators.ts` (the F6 line only), `src/core/LSPClient.ts` (the F11 comment only),
  `tests/src/core/validators.test.ts` (the F6 cases only), `tests/guides.test.ts` only if a
  rewritten fence becomes value-asserting and obliges a transcription.
- Off limits: everything else; `package.json` and `tests/src/core/parsers.test.ts` explicitly.
- Validation, read-only and scoped: `npm run lint:check`, `npm run check:src:core`,
  `npm run test:src:core`, `npm run test:guides`. Never `format`, `lint --fix`, `build`, or full
  `npm test`.

## Execution

You perform this assignment directly and spawn nothing.

## Output

Write the report to `tmp/units/u6-report.md` and return it: per-finding disposition, commands
with counts, the full `git diff`, `git status --porcelain`. No process diary.

## Deviation contract

Stop and report when a prescription conflicts with a rule or with the code (expected, found,
evidence). Wording inside a prescribed sentence is yours where the prescription says so.

## Acceptance criteria, cheap first

1. `git diff --stat` names only owned files.
2. Each finding's prescription is implemented; F1's fence composes `scanLSPBoundary` with the
   slices `subarray(0, boundary)` and `boundary + 4`.
3. `npm run lint:check` and `npm run check:src:core` green.
4. `npm run test:src:core` green including the F6 cases; `npm run test:guides` green.
