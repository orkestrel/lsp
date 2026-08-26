1. What changed

- [src/core/parsers.ts](/home/user/markdown/src/core/parsers.ts): threads one operation-owned recorder through blocks and inline fragments. `parseProvenance` returns the document/map tuple. `parseDocument` projects its document. Unclosed fences retain the original input end.

```ts
parseBlocks(
	lines: readonly MarkdownSource[],
	depth: number,
	spans?: Map<MarkdownNode, MarkdownSpan>,
	limit?: number,
): readonly BlockNode[]

parseProvenance(markdown: string): MarkdownParseResult
parseDocument(markdown: string): MarkdownDocument
parseInline(text: string): readonly InlineNode[]
```

- [src/core/helpers.ts](/home/user/markdown/src/core/helpers.ts): adds mapped trimming, paragraph normalization, table-cell source splitting, shared construct locators, and offset-bearing inline scanning. List collection no longer creates empty-segment sources. Coalesced text spans cover the complete original run.

```ts
trimSource(source: MarkdownSource): MarkdownSource
normalizeParagraphLine(source: MarkdownSource, breaks: boolean): MarkdownSource
splitTableSources(row: MarkdownSource): readonly MarkdownSource[]
coalesceText(
	nodes: readonly InlineNode[],
	spans?: Map<MarkdownNode, MarkdownSpan>,
): readonly InlineNode[]
locateLink(
	source: string,
	start: number,
	to: number,
): { readonly close: number; readonly end: number } | undefined
locateEmphasis(
	source: string,
	start: number,
	to: number,
): {
	readonly strong: boolean
	readonly open: number
	readonly close: number
	readonly end: number
} | undefined
scanInlineSource(
	source: MarkdownSource,
	from: number,
	to: number,
	spans: Map<MarkdownNode, MarkdownSpan>,
	depth?: number,
): readonly InlineNode[]
collectTable(
	lines: readonly MarkdownSource[],
	start: number,
	spans?: Map<MarkdownNode, MarkdownSpan>,
): { readonly node: TableNode; readonly next: number }
collectList(
	lines: readonly MarkdownSource[],
	start: number,
	depth: number,
	spans?: Map<MarkdownNode, MarkdownSpan>,
	limit?: number,
): { readonly node: ListNode; readonly next: number }
```

- [src/core/index.ts](/home/user/markdown/src/core/index.ts): unchanged. Its existing `export * from './parsers.js'` row exports `parseProvenance`; its helpers row exports the reusable leaves.
- [tests/src/core/parsers.test.ts](/home/user/markdown/tests/src/core/parsers.test.ts): pins original-string slices for the document, blocks, list items, inline families, coalesced text, CRLF hard breaks, and unclosed fences. It also pins the complete serialized AST and verifies that every carried node identity has a span.
- [tests/src/core/helpers.test.ts](/home/user/markdown/tests/src/core/helpers.test.ts): covers mapped trimming, hard-break normalization, escaped table cells, locators, source scanning, source-based collectors, and coalesced span transfer.
- [guides/markdown.md](/home/user/markdown/guides/markdown.md): updates the changed `parseBlocks`, `coalesceText`, `collectTable`, and `collectList` signature rows.

2. Red-first records

The main red command was:

```text
npm run test:src:core -- --run tests/src/core/parsers.test.ts -t 'parseProvenance — original-source spans' --reporter=verbose
```

It exited `1`: `9 failed`, `1 passed`. The failures were:

| Construct | Red reading |
|---|---|
| Document | `expected a document span` |
| Heading and text | `expected heading spans` |
| Paragraph and coalesced text | `expected paragraph spans` |
| Blockquote and nested paragraph | `expected blockquote spans` |
| List and list item | `expected list spans` |
| Table and cell inlines | `expected table spans` |
| Fence and thematic break | `expected leaf block spans` |
| Emphasis, code span, link, image, and text descendants | `expected inline spans` |
| Hard break | `expected a hard-break span` |

The unclosed-fence red command was:

```text
npm run test:src:core -- --run tests/src/core/parsers.test.ts -t 'runs an unclosed fence span through the original input end' --reporter=verbose
```

It exited `1`: received `` ```ts\r\ncode `` instead of `` ```ts\r\ncode\r\n ``.

The final provenance command was the main command above. It exited `0`: `12 passed`, including nested-list, blank-continuation, unclosed-fence, hard-break, and values-never-move rows.

The pre-threading value record used:

```text
npm run test:probe -- --run tmp/probe/h2-u3-baseline.test.ts
```

It exited `0` and printed the serialized composite AST. The shipped parser test embeds that exact serialization. The final pin passes and also checks every node from `walkNodes(document)` against the same parse’s map.

3. Unknowns

- Inline recovery: every inline family was recoverable without changing `scanInline(source, from, to, depth?)`. The search covered the pending-text and hard-break branches plus `scanCode`, `locateLink`, and `locateEmphasis`. `scanInlineSource` drives those same leaves with `MarkdownSource`.
- List fidelity: the collector branch set is marker content, indented continuation, blank continuation, lazy continuation, sibling or different-block stop, and depth-cap nested chain. Each branch retains real segments. The nested-chain span starts after the applicable parent indentation.

4. Scoped gate readings

- `npm run test:src:core -- --run tests/src/core/parsers.test.ts` — exit `0`; `122 passed`.
- `npm run test:src:core -- --run tests/src/core/helpers.test.ts` — exit `0`; `285 passed`.
- Scoped `oxfmt --check` over the owned files — exit `0`.
- Scoped `oxlint --deny-warnings` over the TypeScript owned files — exit `0`.
- `npm run check:src:core` — exit `2`, with only U5 diagnostics:

```text
src/core/Markdown.ts(40,14): TS2420 — missing span
src/core/Markdown.ts(94,3): TS2741 — missing span
src/core/factories.ts(81,2): TS2741 — missing span
```

- `git diff --check` — exit `0`.
- The added-line banned-syntax sweep found no `any`, assertion, suppression directive, non-null assertion, or accessibility modifier; search exit `1` means no matches.

5. Observations outside scope

- H2-U5 handle carrier: [Markdown.ts](/home/user/markdown/src/core/Markdown.ts) and [factories.ts](/home/user/markdown/src/core/factories.ts) still require the declared `span` method.
- H2-U6 guide parity: the `parseProvenance` passage, U1 type rows, and rows for the added reusable provenance leaves remain assigned to U6.
- H2-U1 contract: [types.ts](/home/user/markdown/src/core/types.ts) remains dirty from the standing U1 change. This unit did not edit it.
- H2 orchestration acceptance: the tree-wide authoritative gates remain deferred until U5 and U6 land.

6. Claims needing host verification

- Run the segment-lookup timing observation on the host; this unit did not use timing as an acceptance gate.
- Run the `probe` MCP negative-control receipt on the host if the campaign requires a receipt. The sandbox’s known approval refusal prevented that instrument here.
- Run the authoritative gate chain and cross-engine review after the remaining H2 units land.