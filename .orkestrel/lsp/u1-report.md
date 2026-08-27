# U1 report — contract combinator adoption in `src/core/validators.ts`

Role: `implementer`, Opus 5 native. Baseline: `1d351fb`. Status: done, no deviation.

## What changed per site

Every table site converted; no site refused. The import line gained `arrayOf`, `literalOf`,
`optionalOf`, `unionOf` and nothing else. No guard changed its `export function is*` form, its
`isRecord(value)` root, or its `holds(() => …)` boundary. No new export, no dependency change.

| Site | Replacement |
| --- | --- |
| `isLSPDiagnostic` severity chain | `if (!optionalOf(literalOf(1, 2, 3, 4))(value.severity)) return false` |
| `isLSPDiagnostic` tags loop | `if (!optionalOf(arrayOf(literalOf(1, 2)))(value.tags)) return false` |
| `isLSPDiagnostic` relatedInformation loop | `return optionalOf(arrayOf(isLSPDiagnosticRelated))(value.relatedInformation)` — replaces the trailing `return true` |
| `isLSPPublishDiagnosticsParams` diagnostics loop | `return arrayOf(isLSPDiagnostic)(value.diagnostics)` |
| `isLSPDocumentDiagnosticReport` items loop | `return arrayOf(isLSPDiagnostic)(value.items)` |
| `isLSPTextDocumentSyncOptions` change chain | `optionalOf(literalOf(0, 1, 2))(value.change)` |
| `isLSPServerCapabilities` textDocumentSync union | `optionalOf(unionOf(literalOf(0, 1, 2), isLSPTextDocumentSyncOptions))(value.textDocumentSync)` |

The variadic `literalOf` overload (`index.d.ts:3751`) compiles for every call. No assertion, no
`any`, no suppression directive was needed anywhere.

## New test cases

All three sit in a new `describe('LSP wire element and literal boundaries')` block in
`tests/src/core/validators.test.ts`. No pre-existing test was edited. A module-scope `WireRange`
class supplies the prototype-carrying instance.

- `refuses a sparse element array and accepts its dense counterpart` — refuses a sparse `tags`
  array (`new Array<unknown>(3)` with indices 0 and 2 set), a sparse `diagnostics` array, and a
  sparse `items` array; refuses a non-array `tags`; accepts the dense counterpart of each and an
  empty `tags` array as the discriminating control.
- `bounds every literal member set and keeps a present undefined optional` — refuses `severity: 5`,
  `severity: 0`, and `severity: '1'` (identity, no coercion); accepts the present-key
  `severity: undefined` and `severity: 4`; refuses `tags: [3]` and `tags: [undefined]` while
  accepting `tags: [2]`; refuses a related-information element missing its `location`; refuses
  `change: 3` and `textDocumentSync: 3` while accepting `change: 2`, `textDocumentSync: 0`,
  `textDocumentSync: { openClose: true }`, and the present-key `undefined` of each; refuses
  `textDocumentSync: { change: 3 }`.
- `refuses a prototype-carrying instance and accepts an unknown extra member` — refuses
  `new WireRange()` through `isLSPRange` while accepting its spread copy; accepts a diagnostic
  carrying an extra unknown member.

## Commands and counts

Run on Windows 11, 2026-08-26, from the repository root.

| Command | Result |
| --- | --- |
| `npm run lint:check` | exit 0 |
| `npm run check:src:core` | exit 0 |
| `npx tsc --noEmit --project tsconfig.json` | exit 0 — extra read-only run; `check:src:core` does not cover the test file |
| `npm run test:src:core` | 5 test files passed, 89 tests passed |
| `npx oxfmt --config .oxfmtrc.json --check src/core/validators.ts tests/src/core/validators.test.ts` | exit 0 — scoped, non-mutating; the tree-wide `format` was not run |

I did not record a pre-change test count, so the 89 is the post-change reading alone. Two
instruments establish that the new cases are not descriptive.

**Mutation control (owned source, restored exactly by hand, no git command used).** With
`literalOf(1, 2, 3, 4)` widened to include `5`, `optionalOf(arrayOf(literalOf(1, 2)))(value.tags)`
replaced by an `Array.isArray` check, and `arrayOf(isLSPDiagnostic)(value.diagnostics)` replaced by
`Array.isArray(value.diagnostics)`, `npm run test:src:core` reported `2 failed | 87 passed (89)`,
failing exactly `refuses a sparse element array and accepts its dense counterpart` and
`bounds every literal member set and keeps a present undefined optional`. After restoring the three
lines, the same command reported `89 passed (89)`.

**Equivalence probe (deleted; never committed).** `tmp/probe/equivalence.test.ts` transcribed the
pre-change bodies from `1d351fb` and compared them against the shipped guards over vector matrices
covering the diagnostic, container, capability, and sync surfaces — including holes, present
`undefined`, cross-type near-misses, array-likes, `Object.create(null)`, and a class instance.
`npm run test:probe` reported `4 passed (4)`: every vector agreed, and the negative control (a body
outside the baseline population) disagreed, proving the comparison can report a difference. The
probe was deleted before reporting.

## Refused conversions

None. Every ruled-in site converted without a semantic change or an assertion.

## Working-tree note

`git status --porcelain` shows `.orkestrel/lsp/routing-ledger.md` modified and four untracked
`.orkestrel/lsp/*` files. Those are the Orchestrator's own campaign artifacts, present before this
unit started; this unit did not touch them. Acceptance criterion 1 reads exactly two files once
`.orkestrel/` is excluded.
