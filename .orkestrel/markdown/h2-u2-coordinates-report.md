1. What changed

- `src/core/helpers.ts`
  - `splitLines(markdown: string): readonly MarkdownSource[]`
  - `sliceSource(source: MarkdownSource, from: number, to: number): MarkdownSource`
  - `joinSources(sources: readonly MarkdownSource[], separator: string): MarkdownSource`
  - `projectSpan(source: MarkdownSource, from: number, to: number): MarkdownSpan | undefined`
  - `extractHeading(line: string): { readonly level: number; readonly text: string; readonly offset: number } | undefined`
  - `stripQuote(source: MarkdownSource): MarkdownSource`
  - `splitLines` walks original UTF-16 offsets and preserves the pinned line texts.
  - Source slicing narrows segments. Joining maps original LF and CRLF regions. Unmapped fabricated blanks add no segment.
  - `collectList` passes source-shaped values with empty segments across the forced `parseBlocks` boundary.
- `src/core/parsers.ts`
  - `parseBlocks(lines: readonly MarkdownSource[], depth: number): readonly BlockNode[]`
  - Predicates and extractors receive `line.text`. Blockquote recursion preserves `stripQuote` source segments. Table and list collectors retain their string APIs.
- `tests/src/core/helpers.test.ts`
  - Added line-list pins, original-offset slicing proofs, leaf cases, heading offsets, and quote-coordinate cases.
- `tests/src/core/parsers.test.ts`
  - Direct `parseBlocks` inputs now use `splitLines`.
- `guides/markdown.md`
  - Updated the `parseBlocks`, `splitLines`, `extractHeading`, and `stripQuote` signature rows.
- `src/core/types.ts` was not edited. Its expected U1 changes remain in the dirty tree.

2. Red-first records

- Line-list pins before the walk:
  - Command: `npx vitest run --config vite.config.ts --no-cache --reporter=dot --project src:core tests/src/core/helpers.test.ts`
  - Exit `0`: `263 passed`.
- Original-offset assertions before the walk:
  - Command: `npx vitest run --config vite.config.ts --no-cache --reporter=dot --project src:core tests/src/core/helpers.test.ts`
  - Exit `1`: `1 failed | 263 passed`.
  - Green command: `npx vitest run --config vite.config.ts --no-cache --reporter=dot --project src:core tests/src/core/helpers.test.ts`
  - Exit `0`: `264 passed`; the pinned line lists remained unchanged.
- Source leaves:
  - Command: `npx vitest run --config vite.config.ts --no-cache --reporter=dot --project src:core tests/src/core/helpers.test.ts`
  - Exit `1`: `13 failed | 264 passed`, each reporting a missing leaf.
  - Green command: `npx vitest run --config vite.config.ts --no-cache --reporter=dot --project src:core tests/src/core/helpers.test.ts`
  - Exit `0`: `277 passed`.
- Heading and quote carriers:
  - Command: `npx vitest run --config vite.config.ts --no-cache --reporter=dot --project src:core tests/src/core/helpers.test.ts`
  - Exit `1`: `6 failed | 272 passed`.
  - Green command: `npx vitest run --config vite.config.ts --no-cache --reporter=dot --project src:core tests/src/core/helpers.test.ts`
  - Exit `0`: `278 passed`.

3. Call-site set

Search scope: `.` across all file types, excluding `node_modules/**`, `dist/**`, and `coverage/**`, using:

`rg -n --glob '!node_modules/**' --glob '!dist/**' --glob '!coverage/**' "\b(splitLines|stripQuote|extractHeading|parseBlocks)\b" .`

Runtime source consumers:

- `splitLines`: `parseDocument`.
- `extractHeading`: `parseBlocks` and `startsBlock`.
- `stripQuote`: the blockquote branch in `parseBlocks`.
- `parseBlocks`: `parseDocument`, blockquote recursion, and `collectList`.
- `collectTable` and `collectList` accept `line.text` without parsed-output changes. `collectList` wraps recursive string lines as source values with empty segments for U3 to thread.

The search also found the named guide rows, TSDoc references, helper tests, and direct parser tests.

4. Scoped gate readings

- Helpers:
  - `npx vitest run --config vite.config.ts --no-cache --reporter=dot --project src:core tests/src/core/helpers.test.ts`
  - Exit `0`: `278 passed`.
- Parsers:
  - `npx vitest run --config vite.config.ts --no-cache --reporter=dot --project src:core tests/src/core/parsers.test.ts`
  - Exit `0`: `110 passed`.
- Format:
  - `npx oxfmt --config .oxfmtrc.json --check src/core/helpers.ts src/core/parsers.ts tests/src/core/helpers.test.ts tests/src/core/parsers.test.ts guides/markdown.md`
  - Exit `0`: all matched files use the correct format.
- Lint:
  - `npx oxlint --config .oxlintrc.json --deny-warnings src/core/helpers.ts src/core/parsers.ts tests/src/core/helpers.test.ts tests/src/core/parsers.test.ts`
  - Exit `0`, no diagnostics.
- Core type-check:
  - `npx tsc --noEmit -p configs/src/tsconfig.core.json`
  - Exit `2`, with only U5’s expected diagnostics:
    - `src/core/Markdown.ts:40` — missing `span`.
    - `src/core/Markdown.ts:94` — missing `span`.
    - `src/core/factories.ts:81` — missing `span`.
- Whitespace:
  - `git diff --check`
  - Exit `0`.
- Status contains the owned files plus the expected pre-existing `src/core/types.ts` U1 change.

5. Observations outside scope

- U3 construct threading owns replacing the table/list `line.text` boundary and list recursion’s empty segments with real source propagation.
- U5 handle integration owns the remaining `span` diagnostics.
- U6 documentation owns parity for the U1 public types and later provenance surface.
- The U1 `MarkdownSegment` TSDoc states equal derived and original run lengths. A normalized CRLF separator is one derived code unit mapped to two original code units. The ruled CRLF behavior landed; the contract prose needs reconciliation by its owning documentation unit.
- The CommonMark `U+0000` replacement question remains outside this provenance unit. The parser retains `U+0000` as ruled.

6. Claims needing host verification

- The `mcp__probe__prove` instrument could not run. It returned: `MCP tool call requires approval, but approval policy is never`. No proof receipt exists.
- The Orchestrator must take the authoritative whole-tree gates and the later U3 timing observation on the host.