# Unit report: l8-vocabulary

Baseline `eefa27a` on `main`, working tree clean before edits.

## Deliverable 1: `isInstalledDiagnostic` signature

- Before: `tests/setupConformance.ts:544` — `isInstalledDiagnostic(value: unknown): value is unknown`.
- After: imports `type { Diagnostic as InstalledDiagnostic } from 'vscode-languageserver-protocol'`
  and returns `value is InstalledDiagnostic`. The body is unchanged
  (`Diagnostic.is(value) && Diagnostic.is3_17(value)`); the `@returns` TSDoc line still reads
  true. The import resolves and the checker accepts the form (`npm run check` exit `0`), so no
  deviation.

## Deliverable 2: `LSP_TIMEOUT` constant

- Before: `src/core/LSPClient.ts:113` — `this.#timeout = options.timeout ?? 30_000` (inline
  default).
- After: `src/core/constants.ts` declares
  `export const LSP_TIMEOUT = 30_000` with the TSDoc `Names the default request-settlement
  timeout in milliseconds.`; `LSPClient.ts:113` reads `this.#timeout = options.timeout ??
  LSP_TIMEOUT` and imports it alongside the existing `constants.js` imports.
  `grep -rn "30_000" src/` reports only the example fence at `LSPClient.ts:51` and the constant's
  own declaration line; no other inline default remains.

## Deliverable 3: guide row

- Added the `LSP_TIMEOUT` row to the constant surface table in `guides/lsp.md`, directly after
  `LSP_ENCODINGS` (matching declaration order in `constants.ts`), reading `Names the default
  request-settlement timeout in milliseconds.`

## Gate readings

```text
npx oxfmt --config .oxfmtrc.json --check tests/setupConformance.ts src/core/constants.ts src/core/LSPClient.ts guides/lsp.md
→ All matched files use the correct format. (exit 0)

npx --no-install oxlint --config .oxlintrc.json --deny-warnings tests/setupConformance.ts src/core/constants.ts src/core/LSPClient.ts
→ exit 0, no output

npm run check
→ tsc --noEmit (root, core, server) all clean, exit 0
```

## `npm test` — pre-edit and post-edit readings

Pre-edit baseline (from the dispatch brief, matching the repository's own pre-existing state at
`eefa27a`): src 104, policy 93, setup 16, config 46, guides 23, conformance 243, every exit 0.

Post-edit reading (this unit's own run):

```text
Test Files  9 passed (9)   Tests  104 passed (104)   [src]
Test Files  1 passed (1)   Tests   93 passed (93)    [policy]
Test Files  2 passed (2)   Tests   16 passed (16)    [setup]
Test Files  1 passed (1)   Tests   46 passed (46)    [config]
Test Files  1 passed (1)   Tests   23 passed (23)    [guides]
Test Files  1 passed (1)   Tests  243 passed (243)   [conformance]
```

`npm test` exit `0`. Every count is unchanged from the pre-edit baseline — the guide row is a
content addition inside an existing parity fence, not a new test, so the guides project stayed at
23.

## Writing-rules sweep

Population: every added prose line in the diff (`git diff --unified=0`), which is the guide table
row (`Names the default request-settlement timeout in milliseconds.`) and the matching TSDoc
comment above the constant declaration — two lines.

Pattern: the `.claude/rules/writing.md` substitution table, swept case-insensitively
(`should|simply|easy|just|currently|now|new|latest|utilize|leverage|via|in order to|e\.g\.|i\.e\.|
etc\.|performant|robust|allows you to|and/or|since|once|please|sanity check|dummy|blacklist|
whitelist|master|slave`).

Result: no hit.

## `git status --short`

```text
 M guides/lsp.md
 M src/core/LSPClient.ts
 M src/core/constants.ts
 M tests/setupConformance.ts
```

## `git diff --stat`

```text
 guides/lsp.md             | 1 +
 src/core/LSPClient.ts     | 4 ++--
 src/core/constants.ts     | 3 +++
 tests/setupConformance.ts | 3 ++-
 4 files changed, 8 insertions(+), 3 deletions(-)
```
