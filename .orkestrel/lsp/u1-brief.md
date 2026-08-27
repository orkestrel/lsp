# U1 — contract combinator adoption in `src/core/validators.ts`

## Role and engine

`implementer` — Claude Opus 5, native. (The design assigned this unit to the Sol `implementer`;
Sol is user-excluded this session, so the writing falls to the Opus `implementer` per the
engine-unavailable table. Recorded in `.orkestrel/lsp/plan.md`.)

## Objective

Replace the hand-walked element loops and multi-literal chains in `src/core/validators.ts` with
inline calls to the declared `@orkestrel/contract` combinators, at exactly the sites ruled in, and
prove the accepted set of every exported guard did not move.

## Context

Read before editing: `AGENTS.md`; `.claude/rules/typescript.md`, `.claude/rules/patterns.md`,
`.claude/rules/architecture.md`, `.claude/rules/tests.md`, `.claude/rules/names.md`;
`guides/lsp.md` § Validation; `guides/contract.md` (the vendored dependency guide — the
combinator semantics rows for `arrayOf`, `literalOf`, `unionOf`, `optionalOf`); the installed
declarations at `node_modules/@orkestrel/contract/dist/src/core/index.d.ts` for the exact
overloads. No dispatch-named skill applies.

Host facts: Windows 11, Git Bash for scripts, PowerShell primary shell; run npm scripts as plain
single commands; the repository is clean at the checkpoint commit you start from.

The design round ruled (full reconciliation in `.orkestrel/lsp/plan.md`, ruling 5):

- Every guard keeps its `export function is*` form, its `isRecord(value)` root, and its
  `holds(() => …)` boundary. The fleet style (mcp `validators.ts`) is function guards calling
  combinators inline.
- Adopt these conversions and no others:

| Site (current lines) | Replace with |
| --- | --- |
| `isLSPDiagnostic` severity chain (`validators.ts:162-169`) | `optionalOf(literalOf(1, 2, 3, 4))(value.severity)` |
| `isLSPDiagnostic` tags loop (`:174-180`) | `optionalOf(arrayOf(literalOf(1, 2)))(value.tags)` |
| `isLSPDiagnostic` relatedInformation loop (`:181-186`) | `optionalOf(arrayOf(isLSPDiagnosticRelated))(value.relatedInformation)` |
| `isLSPPublishDiagnosticsParams` diagnostics loop (`:204-208`) | `arrayOf(isLSPDiagnostic)(value.diagnostics)` |
| `isLSPDocumentDiagnosticReport` items loop (`:226-230`) | `arrayOf(isLSPDiagnostic)(value.items)` |
| `isLSPTextDocumentSyncOptions` change chain (`:258-261`) | `optionalOf(literalOf(0, 1, 2))(value.change)` |
| `isLSPServerCapabilities` textDocumentSync union (`:292-296`) | `optionalOf(unionOf(literalOf(0, 1, 2), isLSPTextDocumentSyncOptions))(value.textDocumentSync)` |

- REFUSED by the round — do not introduce: `objectOf` or `recordOf` anywhere (the `isRecord` root
  must stay; `objectOf` admits member-carrying callables and prototype-chain reads, and
  `isLSPRange` ships on probe's public `Issue` contract); `enumOf`; `attempt`/`Result`; any change
  to `isJSONRPCError`, `isJSONRPCRequest`, `isJSONRPCNotification`, `isJSONRPCResponse`,
  `isLSPPosition`, `isLSPRange`, `isLSPLocation`, `isLSPCodeDescription`,
  `isLSPDiagnosticRelated`, `isLSPIdentity`, `isLSPInitializeResult` bodies beyond what the table
  names; any new export; any dependency change.
- Equivalence facts already verified: `arrayOf` refuses a sparse array, and the current loops
  refuse a hole too (`isLSPDiagnostic(undefined)` is false; `tag !== 1 && tag !== 2` rejects
  `undefined`), so the accepted sets coincide. Your tests pin this rather than trust it.
- Combinator-produced guards return `Guard<T>` where `T` is structural; the surrounding
  `holds(() => …)` boolean context needs no assignability beyond `boolean`, so no assertion is
  ever needed. If a conversion cannot typecheck without an assertion or a semantic change, stop
  and report per the deviation contract.

## Unknowns

None load-bearing. If the installed `literalOf` rejects a call form the table assumes (list
versus array), read the overloads at `index.d.ts:3749-3751` and use the form that compiles; both
forms are declared.

## Scope

- Owned: `src/core/validators.ts`, `tests/src/core/validators.test.ts`.
- Shared (report-only, do not edit): none.
- Off limits: every other file, `package.json` and `package-lock.json` explicitly included.
- Tools: Read, Grep, Glob, Edit, Write, Bash (scoped npm scripts only).
- Validation is read-only and scoped: `npm run lint:check`, `npm run check:src:core`,
  `npm run test:src:core`. Do not run `format`, `lint --fix`, `build`, or the full `npm test`.

## Execution

You perform this assignment directly and spawn nothing.

## Output

Return a distilled report: what changed per site; the new test cases added with what each refuses;
the exact commands run with their pass/fail counts; any site where the conversion was refused and
why. No process diary.

## Deviation contract

Stop and report (expected, found, evidence, done or not done, at most one short hypothesis) when:
a conversion changes an accepted set; a conversion needs an assertion or a new export to
typecheck; a test outside your owned files fails on your change. Ancillary choices — case naming,
test ordering — are yours to decide and record.

## Acceptance criteria, cheap first

1. `git diff --stat` shows exactly `src/core/validators.ts` and
   `tests/src/core/validators.test.ts`.
2. Every table site uses its named combinator; the import line adds only `arrayOf`, `literalOf`,
   `optionalOf`, `unionOf` to the existing `@orkestrel/contract` import; no other body changed.
3. `npm run lint:check` green.
4. `npm run check:src:core` green.
5. `npm run test:src:core` green with no pre-existing test edited.
6. New cases in `tests/src/core/validators.test.ts` proving the accepted set is unmoved: a sparse
   `tags` array (`[1, , 2]` via `Array(3)` construction or a literal with a hole) refused; a
   sparse `diagnostics` array refused; `severity: 5` refused; `severity: undefined` present-key
   accepted exactly as before; `change: 3` refused; `textDocumentSync: 3` refused;
   `textDocumentSync: { openClose: true }` accepted; a class instance passed to `isLSPRange`
   refused; an extra unknown member on a diagnostic still accepted.

## Review evidence

Return with your report: the full `git diff` of the two owned files and `git status --porcelain`.
