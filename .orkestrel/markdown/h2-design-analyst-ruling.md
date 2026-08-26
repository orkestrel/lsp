# Objective-lane ruling

## Span coordinate system and parse thread

**Position:** Use half-open UTF-16 offsets into the original constructor string. Normalize the parser’s working source while retaining a boundary map back to the original string. Add `parseProvenance(markdown): MarkdownParseResult`; keep `parseDocument` as its document-only projection.

Recommended contract:

```ts
interface MarkdownSpan {
	readonly start: number
	readonly end: number
}

type MarkdownParseResult = readonly [
	document: MarkdownDocument,
	spans: ReadonlyMap<MarkdownNode, MarkdownSpan>,
]
```

`parseProvenance` must:

- Convert CRLF and lone CR to `\n`.
- Replace `U+0000` with `U+FFFD`.
- Record every normalized boundary’s original UTF-16 offset.
- Parse through the existing block and inline walks.
- Project each consumed normalized range through the boundary map before storing it.

The current `splitLines` normalizes line endings and returns strings without terminators or offsets (`src/core/helpers.ts:70-88`). `parseDocument` passes those strings into `parseBlocks` (`src/core/parsers.ts:125-127`). Provenance therefore requires source fragments that retain text plus boundary offsets. Do not infer offsets later from trimmed values.

Marker stripping and rebuilding must operate on mapped fragments:

- A heading owns the complete physical line. Its inline fragment starts after the opening marker and ends before stripped closing markers and edge whitespace (`src/core/helpers.ts:127-134`; `src/core/parsers.ts:66-72`).
- A blockquote owns the marked source lines. Nested content uses fragments sliced past each quote marker rather than the strings returned by `stripQuote` (`src/core/helpers.ts:199-213`; `src/core/parsers.ts:76-83`).
- A list and each list item own their marker and continuation source. Nested blocks receive mapped slices past the applicable indentation (`src/core/helpers.ts:703-787`).
- A table owns its header, delimiter, and body lines. Inline cell fragments map through pipe splitting, escape handling, and trimming (`src/core/helpers.ts:215-248`, `:662-686`).
- A paragraph owns the physical run from the first retained line through the last retained line. Inline children map through the per-line trimmed fragments and the original intervening line terminators; the current trim-and-join rebuild loses that relation (`src/core/parsers.ts:97-113`).
- A fenced code block owns its opening fence through its closing fence, or through input end when unclosed. Its `code` value may exclude fences while its span includes them (`src/core/parsers.ts:45-59`).
- The document span is `[0, markdown.length]`, including an input trailing terminator that `splitLines` currently removes (`src/core/helpers.ts:84-87`).

`parseInline` may remain the document-independent string API. The provenance parser must use the same scanner with an offset-bearing fragment, not duplicate `scanInline` (`src/core/helpers.ts:568-646`). Existing plain parsing should project the AST from that shared provenance-capable engine, as HTML’s `parseDocument` projects `parseProvenance` (`/home/user/html/src/core/parsers.ts:36-48`).

**Risk:** Reconstructing offsets from node values is unsound because escapes, code-span padding, heading trimming, table escapes, paragraph trimming, and marker removal change spelling or length (`src/core/helpers.ts:320-331`, `:376-403`, `:467-469`, `:581-595`).

## Carrier

**Position:** Keep provenance on each `Markdown` handle in a private identity map. Add the single-word method `span(node): MarkdownSpan | undefined`. Nodes gain no field.

For string construction, store the document and a copied operation-owned span map from `parseProvenance`. For adopted `MarkdownDocument` input, retain the existing document identity and start with an empty map. Current construction distinguishes parsing from adoption at `src/core/Markdown.ts:41-49`; adoption by reference is tested at `tests/src/core/Markdown.test.ts:31-35`.

`span` must return a fresh `{ start, end }` value, matching the HTML precedent (`/home/user/html/src/core/HTML.ts:89-98`). The public types belong in `src/core/types.ts`; the method belongs on `MarkdownInterface`, whose current surface has no provenance accessor (`src/core/types.ts:353-385`).

The first real consumer is a caller using `Markdown.find`, `filter`, or `walk` and then locating the returned node in the constructor source. `parseProvenance` serves `Markdown` construction and callers that need a document plus operation-owned spans without a handle.

**Risk:** A process-global or factory-owned map would mix independent parses of structurally equal or shared nodes. Provenance must remain handle-relative.

## Derivation under rebuilt parents

**Position:** Change the shared rewrite engine to preserve identity for an unchanged subtree and return operation-owned derivations for rebuilt nodes. `Markdown.map` must resolve those derivations against the source handle’s span map when it creates the new handle.

Use the HTML vocabulary and shape deliberately:

```ts
type MarkdownDerivation<T> = readonly [
	value: T,
	derivations: ReadonlyMap<MarkdownNode, MarkdownNode | undefined>,
]
```

A rebuilt node derived from one input node carries that input node’s span. A returned identity already present in the source handle resolves directly. An output identity associated with separate source nodes maps to `undefined`.

This requires changing `rewriteDocument`. It currently rebuilds every parent and root even when all children and the callback result are unchanged (`src/core/helpers.ts:2377-2384`, `:2457-2473`, `:2475-2569`). Its guide calls this copy-on-write (`guides/markdown.md:177`), while the implementation is unconditional copying. Identity preservation makes the implementation match that term and the HTML precedent (`/home/user/html/src/core/helpers.ts:1294-1311`, `:1350-1395`).

`Markdown.map` must still return a new handle, as currently promised and tested (`src/core/Markdown.ts:92-95`; `tests/src/core/Markdown.test.ts:113-118`). An identity rewrite may reuse the document tree while returning a distinct handle.

At the depth cap, retain the current unchanged reference and its span. The existing engine already passes capped subtrees through without invoking the callback (`src/core/helpers.ts:2418-2422`).

A slot-mismatch fallback keeps the accepted source child by identity and therefore lawfully keeps its span. A rebuilt parent remains derived from its original parent. The current fallbacks are at `src/core/helpers.ts:2464-2468`, `:2479-2483`, `:2491-2495`, `:2517-2521`, `:2529-2533`, and `:2544-2563`.

**Risk:** Changing `rewriteDocument` from a bare document return to a derivation return affects its existing public consumers and tests. Update every consumer in the same unit; do not add a compatibility engine.

## No-single-source surfaces

**Position:** Promise provenance only for parsed nodes, unchanged identities, and one-source rebuilds. A join or synthetic node has no span.

Apply that law as follows:

- `coalesceText`: a newly joined text node drops provenance, even when its inputs happen to be adjacent. Unjoined identities keep their entries. It currently creates a new text node for a join (`src/core/helpers.ts:347-357`).
- `trimInlines`: an unchanged node may retain provenance. A new text node made by trimming may retain the source text node’s span because it is a one-source rebuild. A dropped node has no output entry (`src/core/helpers.ts:1511-1526`).
- `normalizeInlines`: pass-through identities retain provenance. Text rebuilt from one text node or one break may inherit that node’s span. Coalesced text from separate nodes drops it. Removed breaks have no output (`src/core/helpers.ts:1553-1586`).
- `mergeProjections`: paragraphs synthesized from pending siblings have no single source and therefore no span. Child identities passed through may retain provenance only when the calling operation supplied provenance for them (`src/core/helpers.ts:1615-1661`).
- Slot-mismatch reuse: retain provenance for the reused original child, as an identity rather than a synthesis (`src/core/helpers.ts:2464-2563`).
- Adopted documents: expose no provenance, including when their nodes happen to be shared with another handle (`src/core/Markdown.ts:43-45`).
- Standalone helpers invoked on bare nodes do not acquire provenance implicitly. A caller must use an operation returning derivations and resolve them through a handle.

The guide must state that spans address the original constructor string before CRLF, CR, and null normalization; regions are half-open UTF-16 offsets; parsed nodes cover consumed syntax; one-source rewrites keep the source region; joins, projections, adopted documents, and synthetic nodes return `undefined`.

**Risk:** Assigning a parent’s span to a paragraph synthesized by `mergeProjections` would claim an HTML wrapper or sibling run was markdown source. That violates the no-single-source law.

## Cross-package boundary

**Position:** Exclude `htmlToMarkdown` provenance from this change.

The installed dependency is `@orkestrel/html@0.0.6` (`node_modules/@orkestrel/html/package.json:1-4`; `package.json:74-77`). Its installed declarations expose no `HTMLSpan`, `parseProvenance`, or `span`. `htmlToMarkdown` accepts only an `HTMLNode` and returns a bare `MarkdownDocument` (`src/core/helpers.ts:2081-2137`). Its fold creates, normalizes, joins, and flattens markdown nodes through `projectHTMLLeaf`, `projectHTMLNode`, and `mergeProjections` (`src/core/helpers.ts:1756-1764`, `:1802-1809`, `:2125-2137`). There is no source coordinate input to preserve.

Record this deferred capability in the Orchestrator’s finding register:

> When markdown’s installed `@orkestrel/html` release exposes handle-relative spans, design an explicit handle-based HTML-to-markdown provenance projection. Do not infer HTML spans from bare `HTMLNode` input.

Do not alter `htmlToMarkdown` now. A future change must decide whether it accepts an `HTMLInterface`, adds a separate provenance projection, and how HTML-to-markdown joins lose provenance.

**Risk:** Reading the newer `/home/user/html` source as though it were the installed dependency would create an API that cannot compile against `0.0.6`.

## Unit decomposition

### Parse contract and coordinate engine — package implementation

**Owned files:** `src/core/types.ts`, `src/core/helpers.ts`, `src/core/parsers.ts`, `src/core/index.ts`, `tests/src/core/parsers.test.ts`, relevant shared test setup.

**Red-first obligation:** Add failing assertions for CRLF, lone CR, `U+0000`, trailing terminators, astral characters, headings, paragraphs, blockquotes, lists, tables, fenced code, links, emphasis, escapes, hard breaks, and joined text.

**Acceptance:** `parseDocument(input)` deep-equals the document from `parseProvenance(input)`; every asserted span slices the original input at the promised syntax; joined nodes lack entries; parsing still uses the existing block and inline scanners; parser depth degradation remains total.

### Handle carrier — package implementation

**Owned files:** `src/core/types.ts`, `src/core/Markdown.ts`, `src/core/factories.ts`, `tests/src/core/Markdown.test.ts`.

**Red-first obligation:** Add failing assertions for `span` on parsed nodes, fresh returned span values, foreign nodes, adopted documents, and separate handles over the same text.

**Acceptance:** String construction exposes original-input spans; adoption exposes none; maps are handle-local; `span` returns `undefined` for absent provenance; no AST node shape changes.

### Rewrite derivation — package hardening

**Owned files:** `src/core/types.ts`, `src/core/helpers.ts`, `src/core/Markdown.ts`, `tests/src/core/helpers.test.ts`, `tests/src/core/Markdown.test.ts`.

**Red-first obligation:** Add failing assertions for identity reuse, changed leaves, rebuilt ancestors, callback-returned original identities, repeated output identity from separate sources, slot mismatch, chaining, and capped subtree reuse.

**Acceptance:** Identity rewrites reuse the tree while returning a new handle; one-source replacements and rebuilt ancestors resolve to their source spans; ambiguous outputs return `undefined`; the callback still never receives the document root; structural slot guards remain effective.

### Join and normalization law — package hardening

**Owned files:** `src/core/helpers.ts`, `tests/src/core/helpers.test.ts`.

**Red-first obligation:** Add failing derivation assertions around `coalesceText`, `trimInlines`, `normalizeInlines`, and `mergeProjections`.

**Acceptance:** Pass-through identities and one-source rebuilds can resolve; joins and synthesized paragraphs cannot; helper behavior and canonical projection laws remain unchanged.

### Guide and parity — documentation

**Owned files:** `guides/markdown.md`, `tests/guides.test.ts`, guide parity fixtures if required.

**Red-first obligation:** Make parity fail for the undocumented public types, parser entry, and `span` method. Add executable guide assertions for original-string slicing, normalization coordinates, adoption absence, rewrite carry, and join absence.

**Acceptance:** Every new public export is documented; the `MarkdownInterface` method table includes `span`; guide examples import from `@orkestrel/markdown`; behavioral claims execute.

### Inbound projection register — cross-package follow-up

**Owned record:** the Orchestrator’s campaign or finding register.

**Acceptance:** The entry names installed `@orkestrel/html@0.0.6` as the blocker, requires a span-carrying HTML release, and forbids inferred provenance from bare nodes.

## Facts not verified

- I found no `ROADMAP.md` or repository-local finding register under `/home/user/markdown`. I could not verify the Orchestrator’s required register path.
- I did not verify a published HTML release newer than the installed `0.0.6`; the readable `/home/user/html` tree has provenance, but it is not the dependency this package currently compiles against.