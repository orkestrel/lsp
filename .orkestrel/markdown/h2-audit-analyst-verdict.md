### Claim 1 — CONFIRMED FALSE

The shape, readonly, UTF-16, half-open, handle-local, fresh-value, and adoption statements hold. Several behavioral sentences do not:

- `MarkdownSpan` says slicing a span returns the source the node was parsed from ([types.ts](/home/user/markdown/src/core/types.ts:44)). `coalesceText` instead joins `{2,3}` and `{6,8}` into `{2,8}`, including the gap ([helpers.ts](/home/user/markdown/src/core/helpers.ts:620), [helpers.test.ts](/home/user/markdown/tests/src/core/helpers.test.ts:546)).
- `MarkdownSegment` calls every transform affine ([types.ts](/home/user/markdown/src/core/types.ts:64)), but compressed CRLF and trailing-space segments use a special end-boundary projection rather than the documented `start + (p - offset)` relation ([helpers.ts](/home/user/markdown/src/core/helpers.ts:232)).
- `MarkdownSource` says segments cover its text ([types.ts](/home/user/markdown/src/core/types.ts:87)), while the fabricated-blank join test produces derived separators with no covering segment ([helpers.test.ts](/home/user/markdown/tests/src/core/helpers.test.ts:214)).
- `MarkdownParseResult` says nodes assembled from separate regions are absent ([types.ts](/home/user/markdown/src/core/types.ts:397)); `coalesceText` assigns such a node the enclosing `{left.start,right.end}` span.
- `MarkdownDerivation` says every mapped node takes its mapped input’s span and every absent entry means retained identity ([types.ts](/home/user/markdown/src/core/types.ts:413)). `#derive` prefers the output identity’s existing span ([Markdown.ts](/home/user/markdown/src/core/Markdown.ts:217)), while synthetic descendants can also be absent ([helpers.test.ts](/home/user/markdown/tests/src/core/helpers.test.ts:1916)).
- `MarkdownInterface.span` says a joined text run has no region ([types.ts](/home/user/markdown/src/core/types.ts:478)); parse-time coalescing records one.

### Claim 2 — CONFIRMED FALSE

`#derive` uses the required source-first order and terminates cycles through `visited`, but the derivation walk can return another node’s span.

Public counterexample:

- Parse `a\n\nb\n\nc`, yielding source nodes `A`, `B`, and `C`.
- A map replaces `A` and `B` with shared identity `S`; `S` correctly has no span.
- A chained map replaces each `S` with shared `T` and replaces `C` with `S`.
- `rewriteDocument` records `T → S` and `S → C` under [helpers.ts](/home/user/markdown/src/core/helpers.ts:3072).
- `#derive` follows `T → S → C` and assigns `C`’s `{6,7}` span to `T` under [Markdown.ts](/home/user/markdown/src/core/Markdown.ts:217).

The walk terminates, but the returned span belongs to `C`, not to `T` or its spanless source `S`.

### Claim 3 — CONFIRMED FALSE

The parse path can over-claim dropped source text.

For `a \nb`, `normalizeParagraphLine` trims the single trailing space ([helpers.ts](/home/user/markdown/src/core/helpers.ts:281)). `joinSources` then maps the derived newline over the original `" \n"` region ([helpers.ts](/home/user/markdown/src/core/helpers.ts:180)). The scanner emits text value `a\nb`, but `projectSpan` returns `{0,4}`, covering `a \nb`, including the discarded space ([parsers.ts](/home/user/markdown/src/core/parsers.ts:174), [helpers.ts](/home/user/markdown/src/core/helpers.ts:1033)).

The hard-break case with a longer trailing-space run is correctly assigned to the break ([parsers.test.ts](/home/user/markdown/tests/src/core/parsers.test.ts:915)); ordinary normalization remains an open over-claim door.

### Claim 4 — CONFIRMED TRUE

`sliceSource` clamps the requested range, intersects it with each segment’s derived extent, rebases each retained offset, and projects its original endpoints independently ([helpers.ts](/home/user/markdown/src/core/helpers.ts:127)).

At an exact segment edge, the left slice retains only the left run and the right slice retains only the right run. A zero-width segment at that edge is preserved with its original zero-width range and rebased to the corresponding slice boundary. Existing boundary and unmapped-range rows agree with that arithmetic ([helpers.test.ts](/home/user/markdown/tests/src/core/helpers.test.ts:133)).

### Claim 5 — CONFIRMED FALSE

`projectSpan` is deterministic but chooses the wrong segment at a discontinuous abutment.

For:

```ts
{
  text: 'ab',
  segments: [
    { offset: 0, start: 0, end: 1 },
    { offset: 1, start: 5, end: 6 },
  ],
}
```

`projectSpan(source, 1, 1)` returns `{ start: 1, end: 1 }` because the first segment accepts `from <= limit` and returns immediately ([helpers.ts](/home/user/markdown/src/core/helpers.ts:236)).

The documented segment contract says the first run’s derived extent ends where the next segment begins ([types.ts](/home/user/markdown/src/core/types.ts:64)). Position `1` therefore belongs to the second run and projects to `{5,5}`.

### Claim 6 — CONFIRMED FALSE

Construction and adoption are sound: string construction copies the parse map, adoption starts empty, and `#derive` populates only identities reached through the output document ([Markdown.ts](/home/user/markdown/src/core/Markdown.ts:55), [Markdown.ts](/home/user/markdown/src/core/Markdown.ts:213)).

The chained counterexample from Claim 2 breaks lifecycle soundness after `map`: the resulting handle answers `{6,7}` for current output identity `T`, although that span belongs to prior input node `C`. The derivation map conflates the identity’s role as an input hop with its separate role as an output elsewhere in the same rewrite.

### Claim 7 — CONFIRMED FALSE

The literal example values at lines 262–263, 295–297, 309, 329–332, 355, 361, and 383–384 agree with their narrow inputs.

The surrounding universal claims do not:

- “The source the node was parsed from” and “syntax it consumed” ([markdown.md](/home/user/markdown/guides/markdown.md:269)) fail for `a \nb`, whose text span includes the discarded space.
- “Nothing else” rewrites within a line ([markdown.md](/home/user/markdown/guides/markdown.md:281)) conflicts with escape decoding in `scanInlineSource` ([helpers.ts](/home/user/markdown/src/core/helpers.ts:937)) and escaped-pipe normalization in `splitTableSources` ([helpers.ts](/home/user/markdown/src/core/helpers.ts:487)).
- “An output derived from separate inputs takes none” ([markdown.md](/home/user/markdown/guides/markdown.md:316)) fails for the chained `T → S → C` derivation.
- “One node returned for several input nodes” always resolves to `undefined` ([markdown.md](/home/user/markdown/guides/markdown.md:347)) is false when an existing spanned identity is reused; source-first resolution returns its prior span.

### Claim 8 — CONFIRMED TRUE

The supplied root `tsc --noEmit` reading exits `0`. The root project enables `noUncheckedIndexedAccess` ([tsconfig.json](/home/user/markdown/tsconfig.json:11)), and the round’s indexed block accesses now pass through helpers accepting `BlockNode | undefined` and narrowing before return ([setup.ts](/home/user/markdown/tests/setup.ts:66)). The U3.1 record identifies the prior diagnostics and the matching clean root command ([h2-u3.1-narrowing-report.md](/home/user/lsp/.orkestrel/markdown/h2-u3.1-narrowing-report.md)).

### Findings outside the claims

- **MAJOR — H2-U6:** The guide’s behavioral examples have no permanent executed parity proof. `tests/guides.test.ts` checks surface names, examples’ presence, imports, and links, but executes no value assertion ([guides.test.ts](/home/user/markdown/tests/guides.test.ts:113)). This violates the behavioral parity law ([documentation.md](/home/user/markdown/.claude/rules/documentation.md:36)). The U6 report confirms its temporary instrument was deleted.
- **MINOR — H2-U1:** The added public TSDoc opens with noun phrases in `MarkdownSpan`, `MarkdownSegment`, `MarkdownSource`, `MarkdownParseResult`, and `MarkdownDerivation`. The TypeScript rule requires a third-person `-s` verb ([typescript.md](/home/user/markdown/.claude/rules/typescript.md:74)).

VERDICT: FAIL