# Terrain brief: parse provenance (html, markdown)

Read-only reconnaissance. Return evidence only — no raw file dumps, no recommendations, no
design, no decisions. Every fact carries a `file:line` pointer.

## Question

Terrain for two provenance implementation briefs, one over `/home/user/html` and one over
`/home/user/markdown`. The planned change in each package adds source-retaining parse
provenance — a `Span { start, end }` half-open UTF-16 offset pair per node and a single-word
`span(node)` lookup on the parse entity — with offsets indexing the original input across CRLF
normalization.

For EACH of the two repositories, answer:

1. The parse entry points and the exact seam where input text first reaches the tokenizer or
   block scanner, including any CRLF or whitespace normalization site on that path.
2. The node type declarations in `src/core/types.ts` (or wherever node shapes live): each node
   union or interface a span would attach to, with its discriminant.
3. The tree-producing surfaces: parsed, sanitized, and distilled trees in `html`; block and
   inline parse plus the conversion helpers in `markdown` — where each is built and whether
   nodes are rebuilt or shared between stages.
4. Any existing offset, position, line, or index tracking already on those paths.
5. The blast set: every test file, fixture, guide section, and parity row that asserts node
   shapes or tree equality and would go false when nodes gain a `span` member — name each with
   `file:line`.
6. The barrel and guide surfaces that must change: `src/core/index.ts` exports, the guide's
   Surface and Methods tables for the parse entity.
7. The entity names as they exist: the class or entity that owns `parse` in each package, its
   option object, and its current public methods, so the new `span` member lands on the right
   owner.

## Output shape

Return a distillate in two sections, `## html` and `## markdown`, each containing the seven
numbered answers in order, each answer backed by `file:line` pointers. No raw dumps. No
recommendations. No decisions.
