I hold the **subjective lane** of the H2 design round, and only that lane. This ruling answers `/home/user/scaffold/tmp/units/h2-provenance-design-brief.md` in its Output shape.

---

# Axis 1 — The span coordinate system and the parse thread

## Position

Markdown needs **one** coordinate layer, not html's two. Every offset the parse carries is an offset into the original constructor string from the first line split onward, and there is no `normalizeSource` and no per-character boundary array anywhere in the design.

The reason is in the code. Html normalizes per character — CRLF, lone CR, and `U+0000` (`/home/user/html/src/core/helpers.ts:37-56`) — so a per-character boundary map is the natural granularity there, and `projectSpan` closes a normalized-to-original hop (`:66-76`). Markdown normalizes only line terminators, and it does that inside the line split it already performs: `splitLines` runs `markdown.replace(/\r\n?/g, '\n').split('\n')` (`/home/user/markdown/src/core/helpers.ts:84-88`). Line-terminator normalization is line-granular by construction. Markdown rewrites no `U+0000`, so a null character is an ordinary literal with an ordinary length-1 region. Making `splitLines` walk the string instead of rewriting it therefore buys original coordinates outright, and the whole normalized-coordinate layer disappears.

What remains is the real problem the brief names: the parse fabricates strings. The paragraph rebuild trims each line, re-appends two spaces on a hard break, and joins with `\n` (`/home/user/markdown/src/core/parsers.ts:106-113`). The blockquote path re-parses de-quoted lines (`:76-84`, `helpers.ts:211-213`). The list path slices each continuation line at the marker width and joins (`helpers.ts:734-739, 762-772`). The depth cap joins the remaining lines into one literal paragraph (`parsers.ts:32-36`). Every one of those fabrications is a **prefix strip, a suffix trim, or a join of whole lines** — piecewise affine at line granularity, never per character.

That fact chooses the shape. A fabricated string carries a short list of runs, each naming where its characters came from.

## Recommended shape

Two types in `src/core/types.ts` and three leaves in `src/core/helpers.ts`:

- `MarkdownSpan` — `{ readonly start: number; readonly end: number }`. A half-open region of the original constructor string in UTF-16 code units. Matches `HTMLSpan` (`/home/user/html/src/core/types.ts:160-165`) exactly, because it means exactly the same thing.
- `MarkdownSource` — `{ readonly text: string; readonly segments: readonly MarkdownSegment[] }`. A string the parse is looking at, plus where each of its runs came from.
- `MarkdownSegment` — `{ readonly offset: number; readonly start: number; readonly end: number }`. `offset` addresses `text`; `start` and `end` address the original string, half-open, in the same vocabulary `MarkdownSpan` uses. The run length derives from `end - start` rather than being stored beside it.
- `splitLines(markdown: string): readonly MarkdownSource[]` — walks the original once, emitting one line per source with one segment, and preserves its documented line list exactly (`helpers.test.ts:73-95` pins `''` to `['']` and `'a\n\n\n'` to `['a', '', '']`).
- `sliceSource(source: MarkdownSource, from: number, to: number): MarkdownSource` — the one primitive every strip and trim uses.
- `joinSources(sources: readonly MarkdownSource[], separator: string): MarkdownSource` — the one primitive the paragraph rebuild, the blockquote gather, the list gather, and the depth degrade all use. Each join newline is a length-1 segment over the original newline it stands for.
- `projectSpan(source: MarkdownSource, from: number, to: number): MarkdownSpan | undefined` — reads the segments and returns original coordinates, and returns `undefined` when either boundary falls outside every segment. The name matches html's `projectSpan` because the role matches.

Carriers take a `MarkdownSource` value; predicates and pure extractors keep taking a `string`. That line is worth stating as a rule, because it bounds the blast radius to the files that actually move text:

- `stripQuote` becomes source-in, source-out.
- `parseBlocks` takes `readonly MarkdownSource[]`.
- `extractHeading` gains one field naming where its `text` starts inside the line (`helpers.ts:127-133` trims a trailing `#` run and surrounding whitespace, so that offset is not derivable from the returned value).
- `extractListItem` gains nothing — its `marker` field is already the offset of `content` (`types.ts:34-35`, `helpers.ts:177-183`).
- `isBlankLine`, `isQuote`, `isThematicBreak`, `isFenceClose`, `isTableStart`, `countIndent`, and `startsBlock` are untouched; their call sites pass `line.text`.

Two fabrications carry no source and take none. `collectList` pushes a literal `''` for a blank continuation line (`helpers.ts:770`), and the paragraph rebuild's re-appended two spaces stand for the original trailing-space run, which is real text at a real offset, so that one is covered and the blank line is not.

The inline walk needs no new coordinate machinery. `scanInline` already tracks a window and an end boundary for every construct it emits (`helpers.ts:568-647`, with `span.end`, `link.end`, and `emphasis.end` at `:605, :616, :623, :630`), and the start of each is the caller's `index`. Recording is the caller projecting `[index, end)` through the source's segments. Escape resolution makes a text node's `value` differ from its slice (`:581-584`), which is the same asymmetry html accepts for entity decoding (`/home/user/html/src/core/parsers.ts:68-73`): a span points at the region that produced the node, never at a string equal to it.

## Entry point

`parseProvenance(markdown: string): MarkdownParseResult` in `src/core/parsers.ts`, returning `readonly [document: MarkdownDocument, spans: ReadonlyMap<MarkdownNode, MarkdownSpan>]`. `parseDocument` becomes `parseProvenance(markdown)[0]`. This is the html door verbatim (`/home/user/html/src/core/parsers.ts:36-38, 46, 327`), and the name is worth keeping across the sibling packages: a developer who has read one reaches for the other without looking.

---

# Axis 2 — The carrier

## Position

Provenance lives on the `Markdown` handle, in a `#` field, read through a one-word `span` accessor. Nodes gain no field, and no side map is handed to a consumer to carry themselves.

## Evidence

`Markdown` already holds exactly one `#` field and adopts a document as-is (`/home/user/markdown/src/core/Markdown.ts:41-45`), which is the same constructor fork html splits on (`/home/user/html/src/core/HTML.ts:73-82`). Node types carry no positional field (`markdown/src/core/types.ts:44-48, 56-62, 85-91`), and adding one would put a fact on the value that every rewrite, every projection, and every hand-built fixture would have to keep true.

## Recommended shape

- `MarkdownInterface` gains `span(node: MarkdownNode): MarkdownSpan | undefined` (`types.ts:353-385`). It belongs on the interface rather than on the class alone, because `map` returns a `MarkdownInterface` (`types.ts:375`) and a handle whose provenance is unreachable is provenance nobody can use.
- `Markdown` stores `readonly #spans: Map<MarkdownNode, MarkdownSpan>`, fills it from `parseProvenance` for a string input, and leaves it empty for an adopted document.
- `span` returns a fresh value rather than the stored record, matching `HTML.span` (`/home/user/html/src/core/HTML.ts:95-98`), so a consumer cannot reach into the handle's state through a returned object.
- `createMarkdown` keeps its signature (`factories.ts:80-82`). The capability arrives through the handle both factories already return, so nothing new is exported to serve it.

The name is `span`, not `provenance`, `region`, `origin`, or `source`. It is one word, it is a bare noun, it names the thing returned rather than the mechanism, and it is what the sibling package calls it.

---

# Axis 3 — Derivation under rebuilding parents

## Position

`rewriteDocument` returns its derivations beside its document, and `Markdown.map` resolves each output node through that chain to a span. `rewriteDocument` keeps its always-rebuild allocation behavior unchanged.

## Evidence

`rewriteDocument` allocates a fresh object at every level it descends into (`helpers.ts:2470, 2485, 2497, 2509, 2523, 2535, 2569`) and returns a bare `MarkdownDocument` (`:2403-2406`). `Markdown.map` wraps that in `new Markdown(document)` (`Markdown.ts:94`), which takes the adopted-document fork and would start with an empty span map — so without a derivation channel, provenance dies at the first `map`, and there is nowhere in the current return to put it.

Two paths already preserve identity and need no channel. The depth cap pushes the subtree by reference with `rewrite` uninvoked (`:2419-2421`), and every slot-mismatch arm keeps the original child object (`:2467, 2482, 2494, 2506, 2520, 2532, 2547, 2562`). An identity lookup finds those nodes' spans with no machinery at all, and the kept node genuinely does have that source.

## Recommended shape

- `MarkdownDerivation<T>` — `readonly [value: T, derivations: ReadonlyMap<MarkdownNode, MarkdownNode | undefined>]`, matching `HTMLDerivation<T>` (`/home/user/html/src/core/types.ts:185-188`). A mapped `undefined` marks an output identity returned for separate sources; an absent entry means the output kept its own identity.
- `rewriteDocument` returns `MarkdownDerivation<MarkdownDocument>`, recording the rebuilt-to-original edge at each level and the rewritten-to-candidate edge after the handler runs, as html does (`/home/user/html/src/core/helpers.ts:1373-1384`).
- `Markdown` gains a `#derive(document, derivations)` private method that walks the output, follows each node's chain until a span is found, and stops on a visited node. Html's version reads the source's span before following its own entry (`/home/user/html/src/core/HTML.ts:311-327`), and that ordering is load-bearing: a handler that hands back an original node terminates on its own region instead of following an unrelated entry onto a foreign one.
- The tuple never reaches the handle's API. `map` still returns a `MarkdownInterface` (`types.ts:375`), so the destructuring cost lands on the one in-package caller.

## Declined, deliberately

Adding html's identity-preserving subtree reuse to `rewriteDocument` would make provenance survive by plain identity with no derivation map at all — a genuinely smaller mechanism. Refuse it here. Whether a rewrite re-allocates an unchanged subtree is an allocation-behavior decision with its own blast radius: the guide documents the always-rebuild contract (`guides/markdown.md:226`, `helpers.ts:2377-2384`) and the suite pins it (`helpers.test.ts:1616-1625`, `Markdown.test.ts:113-118`). Buying provenance by flipping it means a provenance campaign silently re-rules an unrelated behavior, and the next reader cannot tell which decision the change was about. Take that ruling on its own brief if it is wanted.

---

# Axis 4 — The no-single-source surfaces

## Position

One law, stated once in the guide and applied per surface: **a node has a span only where one contiguous region of the constructor string produced it.**

| Surface | Ruling | Why |
| --- | --- | --- |
| `coalesceText` (`helpers.ts:347-356`) | **Keeps** provenance — first run's `start`, last run's `end` | The merged runs are adjacent windows of one source, so the joined region is contiguous. Html rules the same way for its final text coalescing (`/home/user/html/src/core/parsers.ts:291-321`). |
| Depth-degrade paragraph (`parsers.ts:32-36`) | **Keeps** it, spanning the whole run | The joined lines are consecutive lines of one source. |
| Depth-cap subtree pass-through (`helpers.ts:2419-2421`) | **Keeps** it, free | The node object is identical; identity finds its span. |
| Slot-mismatch child reuse (`helpers.ts:2467, 2482, 2494, 2506, 2520, 2532, 2547, 2562`) | **Keeps** it, free | The original child is kept by reference and really does have that source. |
| `trimInlines` (`:1511`), `normalizeInlines` (`:1553`), `mergeProjections` (`:1615`), `projectionToBlocks` (`:1683`), `projectionToInlines` (`:1721`) | **Inert** | They run only on the html-to-markdown path, over nodes that never had a span. Add nothing to them. |
| Adopted `MarkdownDocument` (`Markdown.ts:44`) | **None** | No constructor string exists. `span` returns `undefined` for every node, matching html (`/home/user/html/src/core/HTML.ts:78-81`). |
| A rewrite output built from separate sources | **None** | The derivation records `undefined` and `#derive` resolves nothing. |
| A rewrite output the handler fabricated | **None** | No chain reaches a source. |

The guide's promise, in the shape `/home/user/html/guides/html.md:190` already sets: provenance stays beside the tree on the handle and nodes gain no field; `span(node)` returns a half-open region of the original constructor string in UTF-16 code units; a parsed node covers the region the scanner consumed; a one-source rebuild keeps that region through `map`; a join across separate sources and a fabricated node have none; an adopted document starts with none.

---

# Axis 5 — The cross-package boundary

## Position

Excluded on evidence, with a register entry naming its exact trigger.

`htmlToMarkdown` takes an `HTMLNode`, not an `HTMLInterface` (`helpers.ts:2125`). Html keeps provenance on the handle and not on the node (`/home/user/html/src/core/HTML.ts:71, 95-98`), so no html release, spans or not, puts a region on the value this function receives. Admitting inbound provenance is therefore not a version question at all — it is a signature question about which value crosses the boundary, plus threading a map through `projectHTMLNode` (`:1802`), `projectHTMLLeaf` (`:1756`), and `mergeProjections` (`:1615`). That is its own design, and folding it into this campaign would double the surface while answering a question nobody has asked.

Register the entry against `htmlToMarkdown` in the campaign record, with the trigger stated as its cause rather than as a version: **when a released `@orkestrel/html` exposes a node's region on a value `htmlToMarkdown` can accept, re-rule the inbound projection.** The declared range is `"@orkestrel/html": "^0.0.6"` (`/home/user/markdown/package.json:76`).

The guide says the honest thing beside the existing projection passage (`guides/markdown.md:282-298`): a document built by `htmlToMarkdown` has no provenance, because the projection's input carries no source of its own.

---

# Risks

**The paragraph rebuild's re-appended spaces.** `parsers.ts:107-111` writes `${paragraphLine.trim()}  ` when a line ends in two spaces. Those fabricated characters map onto the original trailing-space run, which exists whenever the branch fires — but the branch's condition reads the untrimmed line while the value it emits is trimmed, so the run's length and the emitted length can disagree beyond the two spaces. Settle by a test over a line ending in more than two spaces, asserting the emitted hard break's span against the original run rather than against a computed length.

**Segment lookup cost.** `projectSpan` scans a source's segments per node. A pathological paragraph is a source with a segment per line, and the inline walk projects once per emitted node, so the parse acquires a per-node factor it does not have today. Settle with a timing observation over a large real document, taken by the Orchestrator after the writing unit exits rather than inside it.

**`splitLines` behavioral drift.** Replacing `replace` plus `split` with a walk is the one change that can silently alter the line list every downstream detector reads. The existing cases (`helpers.test.ts:73-95`) are the floor, not the ceiling: a lone `\r` at end of input and a `\r\n` split across the pop rule are the cases the current implementation gets right by accident of ordering. Settle by pinning the current output for those inputs red-first, before the walk lands.

**Guide-signature parity.** `guides/markdown.md:59-61` and the Helpers table pin `splitLines`, `parseBlocks`, `stripQuote`, and `extractHeading` by signature, so the coordinate change makes guide rows false before any span exists. Settle by scoping the guide rows to the unit that changes each signature, not to the documentation unit at the end.

**`#derive` chain termination.** The read-source-first ordering at `/home/user/html/src/core/HTML.ts:311-327` is a subtle correctness property carried by a comment, and a port that reorders the loop passes every happy-path test while attaching a foreign region to a handler-returned original node. Settle with a case whose handler returns an original node from a different position, asserting the returned node's span equals its own region.

**Vocabulary collision on `MarkdownSource`.** Html's guide uses "fragment" for a partial document (`/home/user/html/guides/html.md:180`), which is why this design does not take that word — but "source" is generic enough that a reader can hear it as "the markdown source string." Settle by naming it in the guide's parse-pipeline passage as the parse's own carrier, or accept the objective lane's alternative.

---

# Unit decomposition

Every unit performs its assignment directly. Writers serialize; `src/core/helpers.ts` and `tests/src/core/helpers.test.ts` are contended by more than one unit and are granted in order.

## U1 — The provenance contract

**Role and engine:** `implementer`, Opus 5. Type naming and API shape carry the judgment this unit exists for.
**Owns:** `src/core/types.ts`.
**Depends on:** nothing.
**Work:** declare `MarkdownSpan`, `MarkdownSegment`, `MarkdownSource`, `MarkdownParseResult`, `MarkdownDerivation<T>`, and add `span(node)` to `MarkdownInterface`, each with complete TSDoc.
**Red-first:** none — this unit ships no behavior.
**Acceptance criteria, cheap-first:**
1. `npx tsc --noEmit -p configs/src/tsconfig.core.json` reports errors only in the files U2 through U4 own, and every reported error names a signature this design changes.
2. Every declared member is `readonly`; no `any`, no assertion, no sentinel value.
3. Every new symbol reaches `src/core/index.ts` through the existing `export * from './types.js'` row (`index.ts:1`), with no barrel edit.
4. `MarkdownSegment` stores no length field.

## U2 — Original coordinates through the line split

**Role and engine:** `implementer`, Sol. Offset arithmetic and boundary conditions are constraint-heavy and taste-free.
**Owns:** `src/core/helpers.ts`, `tests/src/core/helpers.test.ts`.
**Depends on:** U1.
**Work:** rewrite `splitLines` as a walk returning `readonly MarkdownSource[]`; add `sliceSource`, `joinSources`, and `projectSpan`; convert `stripQuote` to source-in, source-out; add the heading text's start offset to `extractHeading`'s return record. Update the guide rows for each changed signature (`guides/markdown.md:59-61` and the Helpers table).
**Red-first:** pin the current `splitLines` line lists — including `''`, `'a\n\n\n'`, a lone trailing `\r`, and a `\r\n` at end of input — against the existing implementation before the walk lands, and record the failing count of the offset assertions that the walk turns green.
**Acceptance criteria, cheap-first:**
1. `npm run lint:check` and `npm run format:check` pass over the owned files.
2. `npx tsc --noEmit -p configs/src/tsconfig.core.json` reports errors only in `src/core/parsers.ts` and `src/core/Markdown.ts`.
3. `npx vitest run --project src:core tests/src/core/helpers.test.ts` passes, and the pinned line lists are unchanged from the pre-change run.
4. For a document containing CRLF, a lone CR, a `U+0000`, and a trailing newline, every line's `start` indexes the original string at that line's first character, asserted by slicing the original at the recorded offsets.
5. `projectSpan` returns `undefined` for a boundary no segment covers, proved by a source built from a blank continuation line.

## U3 — Recording spans through both walks

**Role and engine:** `implementer`, Sol. Threading coordinates through the block detector, the marker strips, and the inline scanner is mechanical precision over a fixed contract.
**Owns:** `src/core/parsers.ts`, `src/core/helpers.ts`, `tests/src/core/parsers.test.ts`, `tests/src/core/helpers.test.ts`.
**Depends on:** U1, U2.
**Work:** `parseBlocks` takes `readonly MarkdownSource[]`; the blockquote gather, the list gather, the table collect, the paragraph rebuild, and the depth degrade thread sources; `parseProvenance` records a span per node from both walks; `parseDocument` reduces to its first element; `coalesceText` keeps the merged region.
**Red-first:** assert a span for a heading, a paragraph, a nested blockquote, a list item, a table cell, a code span, an emphasis run, a link, and a hard break, each red before the threading lands.
**Acceptance criteria, cheap-first:**
1. `npm run lint:check` and `npm run format:check` pass over the owned files.
2. `npx tsc --noEmit -p configs/src/tsconfig.core.json` reports errors only in `src/core/Markdown.ts`.
3. `npx vitest run --project src:core` passes over `parsers.test.ts` and `helpers.test.ts`.
4. For each node type named in the red-first list, slicing the original string at the recorded span yields the region that produced that node, asserted against a literal expected substring rather than a recomputed one.
5. A text node carrying a resolved escape has a span covering the backslash.
6. A node inside a blank continuation line the list gather fabricated has no span.
7. `parseDocument` returns a document deep-equal to the pre-change output for every existing case in `parsers.test.ts`.

## U4 — The handle, the accessor, and derivation

**Role and engine:** `implementer`, Opus 5. The accessor's shape, the interface's growth, and the derivation chain's ordering carry design judgment.
**Owns:** `src/core/Markdown.ts`, `src/core/helpers.ts` (`rewriteDocument` only), `tests/src/core/Markdown.test.ts`, `tests/src/core/helpers.test.ts`.
**Depends on:** U1, U3.
**Work:** `Markdown` gains `#spans`, `span`, and `#derive`; `rewriteDocument` returns `MarkdownDerivation<MarkdownDocument>` and records its edges; `map` resolves through `#derive`.
**Red-first:** assert that an identity `map` preserves every node's span, that a fabricating `map` drops the fabricated node's span, that a handler returning an original node from another position keeps that node's own region, and that an adopted document reports `undefined` for every node — each red before the change.
**Acceptance criteria, cheap-first:**
1. `npm run lint:check` and `npm run format:check` pass over the owned files.
2. `npm run check` passes.
3. `npx vitest run --project src:core` passes.
4. `span` returns a value that is not the stored record, proved by mutating the returned object and reading `span` again.
5. `rewriteDocument`'s document output is deep-equal to the pre-change output for every existing case at `helpers.test.ts:1558-1707`, and the depth-cap shared-reference assertion at `:1704-1706` is unchanged.
6. `Markdown.map` returns a `MarkdownInterface`; no tuple appears in any public signature.

## U5 — The guide's provenance passage

**Role and engine:** `implementer`, Opus 5. Documentation voice and the promise's exact wording.
**Owns:** `guides/markdown.md`, `guides/README.md`.
**Depends on:** U4.
**Work:** add the provenance passage to the AST-model section; add the `span` row to the `MarkdownInterface` methods table (`guides/markdown.md:170-180`); state the parse-pipeline change (`:206-215`); state the derivation rule beside the depth-degrade row (`:226`); state the `htmlToMarkdown` exclusion beside the projection passage (`:282-298`); update the concept index row if the source column moves.
**Acceptance criteria, cheap-first:**
1. `npm run format:check` passes.
2. `npx vitest run --project guides` passes: every backticked API resolves, and every new public export is documented.
3. Each behavioral sentence in the passage has an executed assertion that breaks if the sentence goes false, per `.claude/rules/documentation.md` § Parity.
4. The methods table's rows match `MarkdownInterface`'s call-signature members exactly.

## U6 — Gate evidence

**Role and engine:** `verifier`, Sonnet.
**Depends on:** U5.
**Work:** run `npm run format:check`, `npm run lint:check`, `npm run check`, `npm run build`, `npm test`, in order, and report each exit code and its output.
**Acceptance criteria:** every gate green, read from its own bare output.

## Audit

Route the objective lane to `analyst` (Sol) over U2, U3, and U4 — offset arithmetic, boundary conditions, and the derivation chain's ordering are correctness claims. Route the subjective lane to `reviewer` (Opus 5) over U1, U4, and U5 — the vocabulary, the accessor's shape, and the guide's promise. U4 was written by Opus, so its objective lane is the auditor that did not write it.

---

# Facts I could not verify

- I executed nothing. This lane is read-only, so every claim here rests on source reading, and no behavioral claim in it has been run.
- I read `scanCode`, `scanLink`, and `scanEmphasis` only through `scanInline`'s use of their `end` boundaries (`helpers.ts:602-631`). I did not read their bodies, so I have not confirmed that each `end` is the exclusive boundary of the construct rather than of a sub-part.
- I read the declared range `"@orkestrel/html": "^0.0.6"` in `package.json:76`. I did not read the installed tree under `node_modules`, so the installed version and its exports are unconfirmed.
- I did not read `tests/guides.test.ts`, so the parity mechanism U5's criteria name is taken from `.claude/rules/documentation.md` rather than from the test.
- My call-site sweep for `rewriteDocument`, `splitLines`, `stripQuote`, and `extractHeading` covered `*.ts` files under `/home/user/markdown` only. It did not cover Markdown, JSON, or configuration files, so a reference in another file type is outside what I checked.
- The Grok distillate's pointers that I did not open myself — the guide line ranges at `guides/markdown.md:442-459`, the scanner test ranges at `helpers.test.ts:337-490`, and the `Markdown.test.ts:21-35` adopt rows — remain unverified.
