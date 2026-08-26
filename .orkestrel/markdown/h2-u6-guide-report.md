# Unit H2-U6 report — the markdown guide carries the provenance surface (2026-08-26)

Done, no deviation. `npx vitest run --project guides` exits 0 at `Tests 18 passed (18)`, from a
baseline of exit 1 at `Tests 4 failed | 14 passed (18)`. The gate added no obligation mid-unit.

## 1. What changed per file

`guides/markdown.md` — the provenance surface, its passage, and the changed signatures.

- **`### Types` table.** Added `MarkdownSpan`, `MarkdownSegment`, and `MarkdownSource` after
  `ListItemMatch`, and `MarkdownParseResult` and `MarkdownDerivation<T>` after
  `MarkdownRewriteHandler` — the same two slots `src/core/types.ts` puts them in. The
  `MarkdownInterface` row's member list gained `span`.
- **`### Parsers` table.** Added the `parseProvenance` row; the `parseDocument` row now names it as
  the parse whose document it projects.
- **`### Helpers` table.** Added `sliceSource`, `joinSources`, `projectSpan`, `trimSource`, and
  `normalizeParagraphLine` beside `splitLines`; `splitTableSources` beside `splitTableRow`; and
  `locateLink`, `locateEmphasis`, and `scanInlineSource` beside the inline scanners. Each signature
  is transcribed from the held declaration.
- **`## Methods` table.** Added the `span` row between `filter` and `map`, matching the declaration
  order at `src/core/types.ts:486`. The `map` row now states that it resolves each output node's
  region through the rewrite's derivations.
- **`## The parse pipeline`.** Added the **Lines carry coordinates, not only text** paragraph, which
  names `MarkdownSource` as what `splitLines` returns per line, gives `{ text, segments }` and
  `MarkdownSegment { offset, start, end }`, states that a run's original length derives from
  `end - start`, and names the leaves that narrow and remap the runs. The following paragraph now
  says `Markdown` calls `parseProvenance` rather than `parseDocument`, and stores the span map
  beside the document.
- **New `## Source provenance` section**, placed after `### Depth degrade semantics` and before
  `## Sanitization policy`. It carries the ruled promise as a rule list, the line-granularity
  normalization paragraph, the `parseProvenance` passage with the
  `const [document, spans] = parseProvenance(markdown)` shape, the `map` carry, and the
  **Where provenance stops, and why** list covering the adopted document, the inbound projection
  (with the `mergeProjections` paragraph named explicitly), and the separate-sources rewrite output.
  Its `### Coordinates inside a line` subsection covers `scanInlineSource` and names the coordinate
  leaves a caller writing their own phase needs.
- **`### Scan one inline construct`**, a new Patterns subsection carrying the `scanLink` and
  `scanEmphasis` examples that close the standing example failures, plus the `undefined` degrade
  case and a pointer to `locateLink` / `locateEmphasis`.
- **The tuple example at the old `:622`.** It now destructures
  `const [rewritten, derivations] = rewriteDocument(...)`, and the surrounding comment states the
  copy-on-write contract H2-U4 landed: an unchanged subtree keeps its identity, so an identity
  rewrite returns the same document object and records no derivation.

`src/core/types.ts` — comment lines only, no type or member change. Every deletion in the file's
whole-round diff is one of H2-U1's four; this unit deleted nothing from the committed baseline.

- `workspace` → `handle` at `:44` (`MarkdownSpan` remarks), `:414` (`MarkdownDerivation` remarks),
  and `:473`, `:478`, `:479` inside the `span` TSDoc. `grep -n workspace src/core/types.ts` now
  exits 1: no occurrence remains anywhere in the file.
- The `MarkdownSegment` remarks now state that the run's original length derives from `end - start`
  rather than being stored beside them, and that the run's derived extent ends where the next
  segment's `offset` begins — so a run may cover more of the original than it holds derived. The
  `MarkdownSpan` remarks already agreed and keep their wording.

## 2. The guides-project reading, before and after

Before, verbatim:

```text
npx vitest run --project guides
```

Exit 1: `Tests 4 failed | 14 passed (18)`. The failing rows were `documents every barrel export`,
`documents every interface method`, `Markdown exposes no undocumented method`, and
`documents an example for every Surface function`.

After, same command:

Exit 0: `Tests 18 passed (18)`. Re-run after the scoped `oxfmt --write` reflowed the tables, and
again after the prose corrections in section 4: exit 0 both times.

**The gate added no obligation mid-unit, because I checked for it before writing rather than after.**
Adding a Surface row of kind `function` extends `documents an example for every Surface function` to
that name, so before adding a row I read each candidate's TSDoc for an `@example`. `sliceSource`,
`joinSources`, `projectSpan`, `trimSource`, `normalizeParagraphLine`, `splitTableSources`,
`locateLink`, and `locateEmphasis` each already carry one, so their rows closed themselves.
`scanInlineSource` carries none, so its row obliged the fence in `### Coordinates inside a line`;
`parseProvenance` carries none, so its row obliged the fence in `## Source provenance`. Both landed
in the same pass as their rows, which is why the first full run came back green.

## 3. Scoped gate readings

Every command ran from `/home/user/markdown` on 2026-08-26, over the owned files.

| Command | Exit |
|---|---|
| `npx oxfmt --config .oxfmtrc.json --check guides/markdown.md src/core/types.ts` | 0 — "All matched files use the correct format" |
| `npx oxlint --config .oxlintrc.json --deny-warnings guides/markdown.md src/core/types.ts` | 0 — no diagnostics |
| `npm run check:src:core` | 0 |
| `npx tsc --noEmit -p tsconfig.json` | 0 |
| `npx vitest run --project guides` | 0 — `Tests 18 passed (18)` |
| `git diff --check` | 0 |

The baseline root check ran before any edit: `npx tsc --noEmit -p tsconfig.json` exited 0, as the
brief said it would.

`oxfmt --check` failed once mid-unit on `guides/markdown.md` (exit 1) because the added table rows
widened columns. I ran the scoped mutating `npx oxfmt --config .oxfmtrc.json guides/markdown.md`
over that one owned file and re-checked green. No tree-wide `format` or `lint --fix` ran.

## 4. Every fence claim, run before it was written

I did not reason about the returned values. I put each one through the real code in a throwaway
`tmp/probe/` instrument on the `probe` project, read the output, and wrote the fences from it. The
final instrument asserted every claim rather than printing it, so a wrong comment would have
reddened it: `npx vitest run --config vite.config.ts --no-cache --reporter=verbose --project probe
tmp/probe/h2u6c.test.ts` exited 0 at `Tests 10 passed (10)`. The probes are deleted; `tmp/probe/` is
empty and git-ignored, and the tree shows no trace.

What the probes settled, with the values the fences now carry:

- `'# Title\n\nA **bold** word.'` — document `{ 0, 25 }`, heading `{ 0, 7 }`, and
  `source.slice(0, 7) === '# Title'`. The heading region includes the `# ` marker, which is the
  "covers the syntax it consumed" rule.
- `'a \* b *c*'` — the first text node's `value` is `'a * b '` while its region is `{ 0, 7 }`,
  slicing the spelling `a \* b `. This is the values-never-move property, and it is why the guide
  says to read provenance off the source rather than reconstruct it from a value.
- `map` over `'# Hi\n\nText.'` — the lowercased text node reports `{ 2, 4 }`, where `Hi` sits in the
  ORIGINAL source, not where `hi` sits in the output.
- An adopted `htmlToMarkdown` document reports `undefined` for its root and every node.
- One node returned for several source text nodes reports `undefined`; a one-source replacement
  reports its source's region.
- Two instances over the same text hold independent maps: a node from one reports `undefined` in the
  other.
- `span` returns a fresh value per call — the two returns are `toEqual` and not `toBe`.
- `scanInlineSource(splitLines('> a *b*')[0], 2, 7, recorder)` records `{ 2, 4 }` for the text and
  `{ 4, 7 }` for the emphasis, slicing `a ` and `*b*`.
- `scanLink('[docs](https://x.dev)', 0, 21)` → `href` `'https://x.dev'`, `end` `21`;
  `scanEmphasis('**bold**', 0, 8)` → `strong` `true`, `end` `8`; `scanLink('[unclosed', 0, 9)` →
  `undefined`.
- `rewriteDocument` with an identity handler returns the very same document object and an empty
  derivation map; with a text rewrite it returns a rebuilt document and a non-empty one.

I also swept the added prose against the substitution table case-insensitively and across
inflections, over the added lines of both owned files
(`git diff -U0 -- guides/markdown.md src/core/types.ts | grep '^+'`). Corrected: `just` → `only`;
`via` → `through` at the three sites on lines I own; `above` → "the preceding fence"; `below` → the
granularity rewording ("Within a line", `### Coordinates inside a line`) and `later` in the
`## Methods` cross-reference. Ruled permitted and kept, with the sense: `once` meaning one time
rather than `after`; `both` at three sites where the sentence names its members; `new` as the
constructor operator and in the "distinct" sense; `here` on a pre-existing row the formatter
reflowed. Zero hits for `should`, `simply`/`easy`, `currently`/`now`, `utilize`/`leverage`,
`in order to`, `e.g.`/`i.e.`, `etc.`, `performant`/`robust`, `allows you to`, `and/or`, `please`,
`ensure`/`guarantee`, `foo`/`bar`/`baz`, and unspaced em dashes. I deleted two counts I had written
("Five rules", "Three surfaces") rather than correcting them, per the counts law.

## 5. Decisions I took and carried on from

**The word "join" in the ruled promise means a REWRITE-time join, and the guide says so precisely.**
The design record's guide-promise bullet reads "joins, projections, adopted documents, and synthetic
nodes return `undefined`", and its per-surface law says a `coalesceText` join drops provenance. The
held code does not do that: `src/core/helpers.ts:613-636` maps a merged text node to
`{ start: left.start, end: right.end }`, and the probe confirms a parse-time coalesced run keeps a
region — `'one\ntwo'` coalesces across the line boundary and reports `{ 0, 7 }`, and `'a \* b *c*'`
reports `{ 0, 7 }` for its first text node. Writing the promise unqualified would have shipped a
false sentence. Writing it precisely satisfies both: a parse-time run is contiguous in the original
and keeps its region, and an output node a rewrite assembles from separate source nodes has no
single region and reports `undefined` — which is the analyst ruling's actual law ("Promise
provenance only for parsed nodes, unchanged identities, and one-source rebuilds"). The guide's rule
list and its **Where provenance stops** list both say it that way. **I flag this as the one claim of
mine an auditor should attack first**, because it is the only place I read the design record rather
than transcribing it.

**The guide keeps `workspace` for the `Markdown` class; my new prose names the instance directly.**
The granted correction covers `src/core/types.ts` only, and the guide uses "workspace" for the class
in its opening, its `### Markdown` prose, and its `createMarkdown` row — all outside this unit's
work list. Rather than introduce a second term into the guide, my new prose writes "the `Markdown`
instance" and "the instance" where it needed a noun. The residual split is recorded in section 6.

**Passage placement.** `## Source provenance` sits after `### Depth degrade semantics` and before
`## Sanitization policy`, so the reader meets the parse pipeline, then its bounds, then what the
parse recorded. The coordinate mechanism splits between the pipeline section (where lines are born)
and the provenance section's `### Coordinates inside a line` (where the inline engine reads them).

**The `MarkdownSegment` correction states the derived extent too.** The granted correction is the
`end - start` derivation. Fixing only that would have left the neighbouring affine claim reading as
though a run's derived and original lengths always agree, which the probe falsifies: for
`joinSources(splitLines('a\r\nb'), '\n')` the separator run is `{ offset: 1, start: 1, end: 3 }` —
one derived code unit over a two-unit original region — and `projectSpan(joined, 0, 2)` returns
`{ 0, 3 }`, slicing `a\r\n`. The sentence I wrote names that case, so the affine claim stays true as
stated.

## 6. Observations outside scope, each against its owning unit

- **The guide's `workspace` vocabulary belongs to whichever unit owns the guide's opening prose.**
  `guides/markdown.md` calls a `Markdown` instance a "workspace" at its blockquote (`:3`), its
  opening paragraph (`:5`), the `### Types` intro (`:13`), the `### Markdown` prose (`:150`), and the
  `createMarkdown` row (`:158`). `src/core/types.ts` now says "handle" throughout. A reader meets two
  words for one thing across the published declarations and the guide. This unit's work list scoped
  the types file only; the guide-wide rename is its own unit.
- **H2-U4 owns the reused-identity collision H2-U5 recorded.** My separate-sources fence returns one
  SYNTHESIZED node for several sources, which resolves to `undefined`. An ORIGINAL node reused in two
  slots keeps its own region under the markdown engine, where the html engine collapses it. The guide
  states the synthesized case, which is what the code does; the divergence is unchanged by this unit.
- **`tests/guides.test.ts` executes no fence.** `.claude/rules/documentation.md` names that file as
  the home for executed prose proofs, and `.claude/rules/tests.md` says it proves "every executable
  fence returns what the guide says it returns". The file as held is the `@orkestrel/guide` parity
  drop-in and asserts name resolution only, so every value comment I added — the regions, the
  `undefined` results, the identity reuse — is proved by my probe run and by nothing standing in the
  suite. The file is report-only for this unit and I did not weaken or extend it. **The unit that
  owns `tests/guides.test.ts` should adopt the ten assertions from my instrument**, which is
  reproducible from the values in section 4.

## 7. Tree state

`git status --short` — the same population as the baseline, no file added or removed:

```text
 M guides/markdown.md
 M src/core/Markdown.ts
 M src/core/helpers.ts
 M src/core/parsers.ts
 M src/core/types.ts
 M tests/setup.ts
 M tests/src/core/Markdown.test.ts
 M tests/src/core/helpers.test.ts
 M tests/src/core/parsers.test.ts
```

`git diff --stat` over the whole tree:

```text
 guides/markdown.md              | 282 ++++++++++++---
 src/core/Markdown.ts            |  98 +++++-
 src/core/helpers.ts             | 764 ++++++++++++++++++++++++++++++++--------
 src/core/parsers.ts             | 167 +++++++--
 src/core/types.ts               | 121 ++++++-
 tests/setup.ts                  |  30 +-
 tests/src/core/Markdown.test.ts | 106 +++++-
 tests/src/core/helpers.test.ts  | 452 ++++++++++++++++++++++--
 tests/src/core/parsers.test.ts  | 217 +++++++++++-
 9 files changed, 1953 insertions(+), 284 deletions(-)
```

`git diff --stat` over the owned files alone, which carries the held round's earlier edits to them
plus this unit's:

```text
 guides/markdown.md | 282 +++++++++++++++++++++++++++++++++++++++++++++--------
 src/core/types.ts  | 121 ++++++++++++++++++++++-
 2 files changed, 356 insertions(+), 47 deletions(-)
```

At dispatch those two files stood at `guides/markdown.md | 78` and `src/core/types.ts | 116`, so
this unit's own contribution is the difference: the guide's provenance surface and passage, and the
five changed comment lines in the types file.

## 8. Claims needing the Orchestrator's own run

- The authoritative tree-wide gate chain is the Orchestrator's, per the writing-concurrency law. My
  readings are scoped to the owned files plus the two whole-project checks the brief named.
- I ran no `mcp__probe__prove` receipt. No claim in this unit names a TypeScript project, case, and
  edit-that-must-break, so the tool's precondition was never met; every claim I make is settled by
  the executed Vitest instrument in section 4 instead.
