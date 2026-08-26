**Unit H2-U1 complete.** `src/core/types.ts` declares the provenance contract; the scoped core check is red only where `Markdown` has no `span` yet, which the U5 unit closes.

## Declarations as landed

`MarkdownSpan` (after `ListItemMatch`, line 49) — a half-open region of the ORIGINAL markdown string in UTF-16 code units, `start` inclusive and `end` exclusive. TSDoc states that the coordinates address the constructor string rather than any later line text, that `markdown.slice(span.start, span.end)` returns the parsed source, and that the length is `end - start` with no length member to drift.

`MarkdownSegment` (line 67) — `{ offset, start, end }`, all `readonly number`. TSDoc states that `offset` addresses `MarkdownSource.text` while `start` and `end` address the original string, that the run's length is `end - start` in both so no length member exists, that a position `p` inside the run projects back to `start + (p - offset)`, and that every strip, trim, and join the block phase performs is affine at this granularity.

`MarkdownSource` (line 87) — `{ readonly text: string; readonly segments: readonly MarkdownSegment[] }`. TSDoc names it as what `splitLines` returns per line, says `text` is the line a parser reads with its terminator, `>` marker, or indent removed, and says `segments` cover `text` in ascending `offset` order with one run per contiguous stretch of the original.

`MarkdownParseResult` (line 397, after `MarkdownRewriteHandler`) — the labeled tuple `readonly [document: MarkdownDocument, spans: ReadonlyMap<MarkdownNode, MarkdownSpan>]`. TSDoc states that `spans` is keyed by node identity so it addresses that document's nodes and no other, that a node built from separate regions or from none is absent rather than mapped to a placeholder, and shows the destructuring form.

`MarkdownDerivation<T>` (line 417) — `readonly [value: T, derivations: ReadonlyMap<MarkdownNode, MarkdownNode | undefined>]`. TSDoc reads `derivations` against the source workspace's spans in three cases: a node mapped to an input node takes that input's span; a node mapped to `undefined` was produced from separate sources — a joined text run, a synthesized paragraph — so no single input covers it and it has no span; an absent entry means the output kept its own identity and the span it already had still stands.

`span(node: MarkdownNode): MarkdownSpan | undefined` (line 481) — joins `MarkdownInterface` between `filter` and `map`, with `@param`, `@returns`, and `@remarks` stating that provenance is per workspace and per node identity, that an adopted `MarkdownDocument` reports `undefined` for every node because it parsed no string, that a node assembled from separate sources reports `undefined`, and that each call returns a fresh value rather than the stored one.

I also rewrote the `MarkdownInterface` remarks bullet that read "**The seven-method surface.**" — the arriving member made that sentence false, and `AGENTS.md` § Writing bans the count. It now reads "**The surface.**" and names `span` in the member list. That edit is inside my owned file and required by the contract landing.

## Scoped readings

`npx tsc --noEmit -p configs/src/tsconfig.core.json` (the repository's `check:src:core`), exit 2, the whole output:

```
src/core/Markdown.ts(40,14): error TS2420: Class 'Markdown' incorrectly implements interface 'MarkdownInterface'.
  Property 'span' is missing in type 'Markdown' but required in type 'MarkdownInterface'.
src/core/Markdown.ts(94,3): error TS2741: Property 'span' is missing in type 'Markdown' but required in type 'MarkdownInterface'.
src/core/factories.ts(81,2): error TS2741: Property 'span' is missing in type 'Markdown' but required in type 'MarkdownInterface'.
```

Every diagnostic names the missing `span` method on `Markdown` — `src/core/Markdown.ts` at the class declaration and at the `map` return, and `src/core/factories.ts` at the `createMarkdown` return of that same instance. All three are the H2-U5 handle unit's, and they are the expected red the brief names. No diagnostic names `splitLines`, `parseProvenance`, or `rewriteDocument`: those signatures are unchanged, so H2-U2, H2-U3, and H2-U4 raise their own red when they land. The same command ran clean (exit 0) on the committed baseline before the edit.

`npx oxfmt --config .oxfmtrc.json --check src/core/types.ts` — exit 0, "All matched files use the correct format."

`npx oxlint --config .oxlintrc.json --deny-warnings src/core/types.ts` — exit 0, no findings printed.

`git diff --check` — exit 0, no output. `git status --porcelain` reports `M src/core/types.ts` and nothing else; `git diff --stat` reports 112 insertions and 4 deletions in that one file.

## Decisions I took and carried on from

Placement splits across two slots rather than gathering as one block. `MarkdownSpan`, `MarkdownSegment`, and `MarkdownSource` sit beside `ListItemMatch`, the file's existing slot for parse-machinery data that is not an AST node. `MarkdownParseResult` and `MarkdownDerivation` sit after `MarkdownRewriteHandler` and before `MarkdownInterface`, with the other pipeline function and result types, and after the `MarkdownDocument` and `MarkdownNode` declarations they reference, so nothing reads forward.

TSDoc voice follows the file over the rule's `-s` verb form for the data declarations. Every existing public data interface in this file opens with a noun phrase, and `.claude/rules/typescript.md` § Comments gives its verb examples for symbols that act. The `span` method opens with a verb (`Reads`); the interfaces and type aliases open with noun phrases matching their neighbors.

## Observations outside my scope

The installed `@orkestrel/html` release exposes no provenance vocabulary to match — searching its `dist/src/core/index.d.ts` for `Span`, `segment`, `provenance`, and `derivation` returns only an unrelated prose use of "segment" at line 1105. The names here are therefore original rather than mirrored, which agrees with the design record's ruling that the cross-package boundary stays excluded until html ships handle-relative spans.

`guides/markdown.md` carries claims these declarations make false, and the H2-U6 unit owns them: the `MarkdownInterface` Types row at line 42 lists `{ document, walk, find, filter, map, reduce, fold, stream }` without `span`, the `## Methods` table at lines 170-180 lists no `span` row, and the `### Types` table has no row for any of the arriving types. `tests/guides.test.ts` proves that every public export is documented, so the `guides` project goes red until U6 lands — I did not run it, and it is outside both my owned files and my criteria.

Relevant path: `/home/user/markdown/src/core/types.ts`.
