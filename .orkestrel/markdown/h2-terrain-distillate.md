# H2 terrain — Grok distillate over markdown (2026-08-26)

Journal: `/home/user/markdown/tmp/cursor/provenance.log` (16,365 bytes, exit 0); brief at
`/home/user/markdown/tmp/cursor/provenance-brief.md`; the markdown tree stayed clean. The
driver's first attempt detached its exec against the launching law and died silently; the
foreground retry journaled correctly. Grok's `file:line` pointers are unverified —
spot-check each before it enters a brief.

## 1. Parse entry points and span recording

- `src/core/parsers.ts:125-127` `parseDocument` is the sole string→document walk, through
  `parseBlocks` (`:31-116`); `parseInline` (`:136-138`) runs as a **second** walk over
  reconstructed strings, not the original document.
- `src/core/Markdown.ts:43-45` and `src/core/factories.ts:80-82` construct from a string or
  an adopted document; no span state either way. No `parseProvenance` analogue exists
  (html: `/home/user/html/src/core/parsers.ts:34-46`).
- `src/core/helpers.ts:84-88` `splitLines` discards original offsets — no
  `normalizeSource`/`projectSpan` equivalent (contrast
  `/home/user/html/src/core/helpers.ts:37-39,66-76`).
- Scanners (`scanCode` `:376-400`, `scanLink` `:425-469`, `scanEmphasis` `:494-536`, table
  and list collectors `:662-707`) keep only a local cursor or line index, dropped once the
  node is built.
- Node types at `src/core/types.ts:44-271` carry no `start`/`end`/`span` field; `element`
  is the sole discriminant (guard example `src/core/validators.ts:497-500`).

## 2. Rewrite and transform surfaces

- Single rewrite spine: `MarkdownRewriteHandler` at `src/core/types.ts:329`;
  `rewriteDocument` at `src/core/helpers.ts:2403-2406`. It always allocates new parents
  (`:2378-2379`, `:2475-2569`), never passes the document root to `rewrite`
  (`:2374-2375`), and the depth cap passes the subtree **by reference** with `rewrite` not
  invoked (`:2387-2389`, `:2419-2421`). No derivation map is returned (contrast html
  `/home/user/html/src/core/helpers.ts:1246-1249,1312-1322`).
- No `pruneDocument` and no `extractRegion`/`collapseText` derivation equivalents exist.
- Other node-producing helpers with no provenance: `Markdown.map` (`Markdown.ts:93-95`),
  `coalesceText` (`helpers.ts:347`), `trimInlines` (`:1511`), `normalizeInlines`
  (`:1553-1556`), `mergeProjections` (`:1615`), `createProjection` (`factories.ts:43`),
  `projectionToBlocks`/`projectionToInlines` (`:1683,1721`),
  `projectHTMLLeaf`/`projectHTMLNode` (`:1756,1802`), `htmlToMarkdown` (`:2125-2137`),
  `markdownToHTML` (`:811`).

## 3. Public class surface and guide claims

- The `Markdown` class at `src/core/Markdown.ts:40-150`: constructor `:43-45`, `document`
  getter `:48-50`, `walk`/`find`/`filter` `:69-90`, `map` `:93-95`, `reduce`/`fold`
  `:98-107`, `stream` `:131-149`. No `span` accessor (html has `HTML.span` at
  `/home/user/html/src/core/HTML.ts:95-98` plus `#derive` at `:305-327`).
- `guides/markdown.md`: Surface and Types `:17-42` (no span field), Parsers `:57-61`,
  Helpers `:99` (copy-on-write, root excluded, cap pass-through), the class `:148-150`,
  Methods `:170-180`, AST model `:182-189`, parse pipeline `:206-213`, depth degrade
  `:226`, round-trip `:258`, emphasis canonicalization `:276` ("never of the source's
  original spelling"), `htmlToMarkdown` projection note `:288-298`, patterns `:442-459`.
  No section promises source offsets or provenance.

## 4. Tests

- Parse coverage: `tests/src/core/parsers.test.ts` (headings `:32` through composite
  round-trip `:674`, `parseBlocks` `:728`); scanner leaves in
  `tests/src/core/helpers.test.ts:73-476`.
- Rewrite coverage: `tests/src/core/helpers.test.ts:1589-1707`;
  `tests/src/core/Markdown.test.ts:108-162` (`map`), `:21-35` (construct and adopt).
- No AST-node offset assertion exists anywhere; only scanner-return cursors are checked
  (`helpers.test.ts:337-490`).
- Identity-across-transform rows: adopt shares the object (`Markdown.test.ts:31-34`),
  identity `map` uses `toEqual` not `toBe` on nodes (`:113-118`), copy-on-write
  (`helpers.test.ts:1616-1625`), depth-cap shared reference (`:1704-1706`), `walkNodes`
  yields the input by identity (`:1342`). No row asserts a span surviving a transform.

## 5. Structural differences shaping the port

- Block/inline split where html is homogeneous `children`: `types.ts:105-112,203-211`;
  `ListNode.items` not `children` (`:146-154`); table `header`/`rows` are inline arrays,
  not nodes (`:162-167`), flattened by `walkNodes`/`rewriteDocument`
  (`helpers.ts:2438-2446`).
- The parse is two walks: block detection on raw lines, then `parseInline` on trimmed and
  rejoined fragments (`parsers.ts:106-113`; `helpers.ts:668,762`) — a span-carrying parse
  must thread original offsets through the line split, the block-marker stripping, and the
  paragraph rebuild.
- Documents and nodes are readonly (`types.ts:10,335-338`; guide `:148-150`); `map` always
  returns a new `Markdown`.
- Markdown always rebuilds parents on rewrite, unlike html's identity-preserving subtree
  reuse (`/home/user/html/src/core/helpers.ts:1237-1239,1292-1314`); unchanged-leaf
  identity survives only when `rewrite` returns the same node.
- Nodes are already returned for separate sources today, with no ambiguity marker: the
  depth-cap rewrite (`helpers.test.ts:1704-1706`), identity-`rewrite` leaves under new
  parents, shared adopted documents (`Markdown.test.ts:31-34`), slot-mismatch child reuse
  (`helpers.ts:2467,2482,2494,2506,2520`), and many-to-one merges through
  `coalesceText`/`normalizeInlines`/`trimInlines` and
  `htmlToMarkdown` plus `mergeProjections` (`helpers.test.ts:2262-2265,2268-2282`).
- Cross-package boundary: `htmlToMarkdown` (`helpers.ts:2125-2137`) consumes
  `@orkestrel/html` nodes; the installed `@orkestrel/html@0.0.6` carries no spans to
  import, so inbound projection cannot inherit html provenance unless the port threads a
  map through `projectHTMLNode`/`mergeProjections` too.

## What this forces on H2

H2 is a capability port, not a drift repair: the design round rules on how spans thread the
two-walk parse, what derivation means where parents always rebuild, which merge surfaces
take ambiguity markers, whether the cross-package projection participates, and the unit
decomposition — before any implementation dispatch.
