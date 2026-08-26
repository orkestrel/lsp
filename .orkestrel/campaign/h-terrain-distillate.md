## html

### 1. Parse entry and tokenizer seam

String entry is `HTML`’s constructor, which calls `parseDocument` when the argument is a string (`/home/user/html/src/core/HTML.ts:70-71`). `createHTML` is the same path (`/home/user/html/src/core/factories.ts:37-38`).

`parseDocument` is the document coercer (`/home/user/html/src/core/parsers.ts:24-25`). CRLF and null rewrite happens **before** the scan loop:

```25:25:/home/user/html/src/core/parsers.ts
	const source = html.replace(/\r\n?/g, '\n').replaceAll('\0', '\uFFFD')
```

The tokenizer cursor then walks that **normalized** `source` (`/home/user/html/src/core/parsers.ts:34-35`). First lexical sites on that path:

- text run: `source.indexOf('<', index)` then `{ category: 'text', value }` (`/home/user/html/src/core/parsers.ts:38-43`)
- comment: `scanComment(source, index)` (`/home/user/html/src/core/parsers.ts:46-50`, `/home/user/html/src/core/helpers.ts:363-366`)
- doctype: `scanDoctype(source, index)` (`/home/user/html/src/core/parsers.ts:54-58`, `/home/user/html/src/core/helpers.ts:411-414`)
- tag: `scanTag(source, index)` (`/home/user/html/src/core/parsers.ts:82`, `/home/user/html/src/core/helpers.ts:287-288`)
- raw/literal body: `scanRawText(source, index, …)` (`/home/user/html/src/core/parsers.ts:144-145`, `/home/user/html/src/core/helpers.ts:494-496`)

`scanTag` for a start tag composes `parseStartTag` (`/home/user/html/src/core/helpers.ts:291`). `parseStartTag` itself does **not** normalize; it indexes the string it is given (`/home/user/html/src/core/helpers.ts:174-176`, `/home/user/html/src/core/types.ts:42-43`). From `parseDocument`, that string is already CRLF/null-normalized.

A later re-entry: sanitize re-parses kept comments and doctypes through `parseDocument(renderHTML(node))` (`/home/user/html/src/core/HTML.ts:284-289`).

CRLF test: `/home/user/html/tests/src/core/parsers.test.ts:198-199`. Guide statement of the same seam: `/home/user/html/guides/html.md:181-183`.

### 2. Node types a span would attach to

All in `/home/user/html/src/core/types.ts`. Discriminant is `category`.

| Type | Discriminant | Lines |
| --- | --- | --- |
| `HTMLDocument` | `'document'` | `140-144` |
| `ElementNode` | `'element'` | `79-87` |
| `TextNode` | `'text'` | `94-98` |
| `CommentNode` | `'comment'` | `110-114` |
| `DoctypeNode` | `'doctype'` | `126-134` |
| `HTMLNode` | union of those | `151` |

Not AST nodes (no `category` node union): `HTMLAttribute` (`27-32`), `HTMLStartTag` (`45-54`), `HTMLTag` (`57-66`). `HTMLStartTag.next` / `HTMLTag.next` are already exclusive UTF-16 offsets (`52-53`, `64-65`), not a `Span` on a tree node.

### 3. Tree-producing surfaces

**Parsed.** Built in `parseDocument` (`/home/user/html/src/core/parsers.ts:24-220`). Nodes are freshly allocated at each construction site (`42`, `78`, `147-152`, `162-167`, `182-187`, `207`, `215`, `220`). Adjacent text is coalesced into **new** text nodes (`198-218`).

**Sanitized.** `HTML.sanitize` → `pruneDocument` (`/home/user/html/src/core/HTML.ts:212-222`, `/home/user/html/src/core/helpers.ts:1382`). `pruneDocument` is copy-on-write: an unchanged subtree keeps its reference (`1423-1444`, remarks `1371-1372`). `#cleanNode` always rebuilds the document root (`280`) and a kept element (`295-302`); text is shared (`291`); comments and doctypes are **reparsed** into new nodes (`282-289`).

**Distilled.** `HTML.distill` (`256-266`): `pruneDocument` (`#pruneRegion`) → `extractRegion` on a sanitized document → `pruneDocument` (`#keepContent`). `#pruneRegion` rebuilds document and elements (`308-321`); non-elements shared (`311`). `extractRegion` returns a **new** document wrapping the region’s existing `children` (`1353-1354`) or the original document unchanged (`1357`). `#keepContent` rebuilds document and kept elements (`333-361`); text shared (`336`); comments/doctypes dropped (`337`). `mergeText` / `collapseText` allocate new text nodes when joining or collapsing (`1276-1288`, `1311-1319`).

`map` / `rewriteDocument` share unchanged document/element subtrees (`1185-1246`); identity map keeps the same root (`/home/user/html/tests/src/core/HTML.test.ts:180-183`).

### 4. Existing offset / position / index tracking

On the parse path, offsets are **scan cursors**, not node fields:

- `parseDocument` `index` over normalized `source` (`/home/user/html/src/core/parsers.ts:34`)
- `HTMLStartTag.next` / `HTMLTag.next` exclusive UTF-16 after `>` (`/home/user/html/src/core/types.ts:52-53`, `64-65`; `/home/user/html/src/core/helpers.ts:174-176`, `194-197`, `287`)
- `scanComment` / `scanDoctype` / `scanRawText` return `{ node, next }` — `next` lives on the return wrapper, not on the node (`/home/user/html/src/core/helpers.ts:363-366`, `379-380`, `411-414`, `482`, `494-516`)
- `parseStartTag` UTF-16 exactness, no source normalize (`/home/user/html/src/core/helpers.ts:174-176`; `/home/user/html/tests/src/core/helpers.test.ts:375-447`)

Because `parseDocument` rewrites CRLF/`\0` first (`parsers.ts:25`), every `next` / `index` on that path addresses the **normalized** string, not the original input. Direct `parseStartTag` / `scanTag` callers address the caller’s string.

No `span`, line, or column field on `HTMLNode`. `HTMLInterface.stream`’s `index` is a child cursor (`/home/user/html/src/core/HTML.ts:177`).

### 5. Blast set (node `span` member)

No fixture files. Hand-built trees live in `/home/user/html/tests/setup.ts` (`614-718`) and `/home/user/html/tests/setup.test.ts:374-376`.

**Exact tree/node `toEqual` against literals (no `span`):**

- `/home/user/html/tests/src/core/parsers.test.ts:36-80`, `114-181`, `220-251`
- `/home/user/html/tests/src/core/HTML.test.ts:63`, `140`, `401`, `413`, `582`, `619-641`, `878`, `890`
- `/home/user/html/tests/src/core/helpers.test.ts:275-347`, `356-367`, `828-833`, `846`, `861`, `907`, `961`
- `/home/user/html/tests/src/core/factories.test.ts:67-98`
- `/home/user/html/tests/setup.test.ts:374-378`

**Parsed-vs-reparsed / sanitize-fixpoint tree equality** (`JSON.stringify` or `toEqual` of two trees that would carry different original-input spans, or a rebuilt tree vs a parsed one):

- `/home/user/html/tests/src/core/parsers.test.ts:199` (CRLF vs LF parse equality)
- `/home/user/html/tests/src/core/parsers.test.ts:379` (`JSON.stringify(reparsed) !== JSON.stringify(document)`)
- `/home/user/html/tests/src/core/helpers.test.ts:119`, `990`, `1067`
- `/home/user/html/tests/src/core/HTML.test.ts:610-611`, `626`, `650`, `698-699`, `713-715`, `720`, `747`

**Closed guards / shapes** (extra `span` key refused; parser output would fail `isHTMLDocument` / leaf guards if `span` is a node field):

- `/home/user/html/src/core/validators.ts:65-68`, `76-79`, `87-95` (`recordOf` leaves)
- `/home/user/html/src/core/validators.ts:144` (document keys must be exactly `2`)
- `/home/user/html/src/core/validators.ts:146` (element keys must be exactly `4`)
- `/home/user/html/tests/src/core/validators.test.ts:48-52`, `70-81`
- `/home/user/html/src/core/shapers.ts:43-46`, `61-64`, `80-85`
- `/home/user/html/tests/src/core/shapers.test.ts:70-78`, `112-114`, `161-165` (`additionalProperties: false`)

**Guide sections that state node field lists:**

- Surface Types: `/home/user/html/guides/html.md:20-24`, `32`
- Validators closed shapes: `/home/user/html/guides/html.md:67-68`
- AST model: `/home/user/html/guides/html.md:166-177`
- Example literals: `/home/user/html/guides/html.md:332`, `351-353`, `365`, `500-503`, `532-535`, `645-646`

**Parity:** `/home/user/html/tests/guides.test.ts:81-86` (barrel vs Surface names), `99-108` (`HTMLInterface` Methods vs class). A new `Span` type and `span` method trip those until the guide lists them; the type-table **field lists** themselves are not mechanically compared.

### 6. Barrel and guide surfaces

Barrel is star-export of types plus `HTML` (`/home/user/html/src/core/index.ts:1-8`). A `Span` in `types.ts` would export without a new line; `HTMLInterface.span` is a type/method change, not a new barrel file.

Guide:

- Surface Types `HTMLInterface` member list: `/home/user/html/guides/html.md:32`
- Surface Types node rows: `/home/user/html/guides/html.md:20-24`
- `### \`HTML\``: `/home/user/html/guides/html.md:143-145`
- Methods `HTMLInterface`: `/home/user/html/guides/html.md:151-163` (`walk`, `find`, `filter`, `map`, `reduce`, `fold`, `stream`, `sanitize`, `distill` — no `span`)

### 7. Entity names

Owner of parse: class `HTML` implements `HTMLInterface` (`/home/user/html/src/core/HTML.ts:67`; `/home/user/html/src/core/types.ts:297`). There is **no** parse option object. Constructor is `constructor(input: string | HTMLDocument)` (`/home/user/html/src/core/HTML.ts:70`). Related option types are `SanitizeOptions` (`/home/user/html/src/core/types.ts:229-238`) and `DistillOptions` (`260-267`), not parse.

Public surface today: `document` getter (`74-77`); methods `walk`, `find`, `filter`, `map`, `reduce`, `fold`, `stream`, `sanitize`, `distill` (`95-266`). Factory: `createHTML` (`/home/user/html/src/core/factories.ts:37`). The string→AST function is `parseDocument` (`/home/user/html/src/core/parsers.ts:24`).

---

## markdown

### 1. Parse entry and tokenizer seam

String entry is `Markdown`’s constructor → `parseDocument` (`/home/user/markdown/src/core/Markdown.ts:43-44`). `createMarkdown` is the same path (`/home/user/markdown/src/core/factories.ts:80-81`).

`parseDocument` is `splitLines` then `parseBlocks` (`/home/user/markdown/src/core/parsers.ts:125-126`).

CRLF/CR collapse is the first rewrite, in `splitLines`:

```84:87:/home/user/markdown/src/core/helpers.ts
export function splitLines(markdown: string): readonly string[] {
	const lines = markdown.replace(/\r\n?/g, '\n').split('\n')
	if (lines.length > 1 && lines[lines.length - 1] === '') lines.pop()
	return lines
```

**Block scanner:** `parseBlocks` walks a **line array** with line `index` (`/home/user/markdown/src/core/parsers.ts:31-38`). Construct scanners: `extractFence` / `isThematicBreak` / `extractHeading` / `isQuote`+`stripQuote` / `collectTable` / `collectList` (`45-95`; table/list in `/home/user/markdown/src/core/helpers.ts:662-686`, `703-787`).

**Inline tokenizer:** `parseInline` → `scanInline(text, 0, text.length)` (`/home/user/markdown/src/core/parsers.ts:136-137`; `/home/user/markdown/src/core/helpers.ts:568-577`). `scanInline` indexes the **already extracted** inline string (heading text, joined paragraph, trimmed cell), not the original document.

A second text rewrite on the paragraph path: lines are trimmed / hard-break-preserved then `join('\n')` before `parseInline` (`/home/user/markdown/src/core/parsers.ts:106-113`). Blockquotes re-parse `stripQuote` lines (`76-82`). Nested lists re-enter `parseBlocks` (`785`).

CRLF parse-equality: `/home/user/markdown/tests/src/core/parsers.test.ts:663-665`. Guide: `/home/user/markdown/guides/markdown.md:69`, `210`.

### 2. Node types a span would attach to

All in `/home/user/markdown/src/core/types.ts`. Discriminant is `element`.

| Type | Discriminant | Lines |
| --- | --- | --- |
| `MarkdownDocument` | `'document'` | `217-221` |
| `HeadingNode` | `'heading'` | `118-124` |
| `ParagraphNode` | `'paragraph'` | `127-131` |
| `ListNode` | `'list'` | `146-154` |
| `ListItemNode` | `'listItem'` | `134-138` |
| `TableNode` | `'table'` | `162-175` |
| `CodeBlockNode` | `'codeBlock'` | `183-189` |
| `BlockquoteNode` | `'blockquote'` | `192-196` |
| `ThematicBreakNode` | `'thematicBreak'` | `199-201` |
| `TextNode` | `'text'` | `44-48` |
| `EmphasisNode` | `'emphasis'` | `56-62` |
| `CodeSpanNode` | `'codeSpan'` | `69-73` |
| `LineBreakNode` | `'break'` | `76-78` |
| `LinkNode` | `'link'` | `85-91` |
| `ImageNode` | `'image'` | `97-103` |
| `BlockNode` | block union | `204-211` |
| `InlineNode` | inline union | `106-112` |
| `MarkdownNode` | document \| block \| listItem \| inline | `228` |

Not tree nodes: `ListItemMatch` (`25-36`), `MarkdownCell` (`231-236`), `MarkdownProjection` (`260-271`). `TableAlign` is a column literal (`19`).

### 3. Tree-producing surfaces

**Block parse.** `parseBlocks` allocates nodes at each construct (`/home/user/markdown/src/core/parsers.ts:54-58`, `62`, `68-72`, `82`, `87`, `93`, `113`, `34`). Depth cap degrades to one paragraph of joined lines (`32-35`). `collectTable` builds a new `TableNode` (`686`); `collectList` builds `ListNode` / `ListItemNode` (`745-750`, `785-787`).

**Inline parse.** `scanInline` allocates text / `codeSpan` / `image` / `link` / `emphasis` / `break` (`/home/user/markdown/src/core/helpers.ts:591-645`). `parseInline` then `coalesceText` (`/home/user/markdown/src/core/parsers.ts:137`).

**Conversion out.** `markdownToHTML` always builds a **new** HTML document (`/home/user/markdown/src/core/helpers.ts:811-818`). No sharing with markdown nodes.

**Conversion in.** `htmlToMarkdown` always builds a **new** `MarkdownDocument` from html’s `foldNode` (`2125-2137`). `projectHTMLLeaf` / `projectHTMLNode` allocate markdown nodes (`guide /home/user/markdown/guides/markdown.md:93-94`). No sharing with the HTML tree.

**Rewrite.** `rewriteDocument` always allocates a new document root `{ element: 'document', children: blocks }` (`/home/user/markdown/src/core/helpers.ts:2470-2471`). Heading/paragraph/blockquote/list/table/emphasis/link/image use `{ ...current, … }` (`2475-2569`). `listItem` is reconstructed without spread (`2509`). Identity `map` is deep-equal, not same-reference (`/home/user/markdown/tests/src/core/Markdown.test.ts:113-117`). Fallback empty rebuild: `2599`.

### 4. Existing offset / position / index tracking

No `span` / line / column field on `MarkdownNode`.

Cursors that exist:

- `splitLines` then line `index` in `parseBlocks` (`/home/user/markdown/src/core/parsers.ts:38`)
- `collectTable` / `collectList` `{ node, next }` where `next` is a **line** index (`/home/user/markdown/src/core/helpers.ts:665`, `686`, `707`, `787`)
- `scanCode` `{ value, end }` character index in the inline source (`376`, remarks `361-369`)
- `scanLink` / `scanEmphasis` `{ node, end }` (`425`, `494`)
- `scanInline(source, from, to, depth)` (`568-577`)
- paragraph mapper `position` is the line index in the collected paragraph, not a document offset (`/home/user/markdown/src/core/parsers.ts:107-108`)

`htmlToMarkdown` also rewrites CRLF on projected code/text (`/home/user/markdown/src/core/helpers.ts:1865`, `1898`, `1905`) — conversion, not parse provenance.

Those character indices address **extracted** strings (info-stripped heading, trimmed cell, reconstructed paragraph), after `splitLines` destroyed original CRLF offsets.

### 5. Blast set (node `span` member)

No fixture files. Builders: `/home/user/markdown/tests/setup.js` imports from `tests/setup.ts` (used by `parsers.test.ts:12-17`, `Markdown.test.ts:11`).

**Exact node/tree `toEqual` against literals:**

- `/home/user/markdown/tests/src/core/parsers.test.ts:195-266`
- `/home/user/markdown/tests/src/core/helpers.test.ts:318`, `414-446`, `498`, `551`, `1212-1225`, `1660`, `1760-1779`, `1881-2544` (`projectHTML` / `htmlToMarkdown` expected trees)
- `/home/user/markdown/tests/src/core/factories.test.ts:116-224`
- `/home/user/markdown/tests/src/core/shapers.test.ts:66`, `114`, `204`, `241`

**Parsed-vs-rendered / projection roundtrip tree equality:**

- `/home/user/markdown/tests/src/core/parsers.test.ts:663-665` (CRLF vs LF)
- `/home/user/markdown/tests/src/core/helpers.test.ts:913`, `948`, `957`, `987`, `995`, `1010-1014`, `1023`, `1033`, `1065`, `1074`, `1132-1138`, `1161`, `1173`, `1188`, `1199`, `1207`, `1217`, `1228`, `1237-1294`, `2460`, `2466`, `2477-2478`
- `/home/user/markdown/tests/src/core/Markdown.test.ts:117` (identity `map` deep-equal)
- `/home/user/markdown/tests/src/core/helpers.test.ts:1625` (input snapshot vs mutated document)

**Closed guards / shapes:**

- `/home/user/markdown/src/core/validators.ts:380-399`, `424-443`, `497-500` (`recordOf` exact keys)
- `/home/user/markdown/tests/src/core/validators.test.ts:302-303`, `317-318`, `329-335`, `342-343`, `217` (`isMarkdownDocument` on parse results)
- `/home/user/markdown/src/core/shapers.ts:32-35`, `49-52`, `66-68`, `84-88`, `103-105`
- `/home/user/markdown/tests/src/core/shapers.test.ts:38-41`, `90-93`, `177-179`, `223-225`

**Guide sections stating field lists:**

- Surface Types: `/home/user/markdown/guides/markdown.md:19-35`
- Shapers: `/home/user/markdown/guides/markdown.md:108-112`
- `isMarkdownDocument` row: `/home/user/markdown/guides/markdown.md:146`
- AST model: `/home/user/markdown/guides/markdown.md:186`
- Example literals: `/home/user/markdown/guides/markdown.md:410`, `427`, `450`

**Parity:** `/home/user/markdown/tests/guides.test.ts` (same pattern as html: Surface names vs barrel, Methods vs `MarkdownInterface`). Methods table today: `/home/user/markdown/guides/markdown.md:170-180`.

### 6. Barrel and guide surfaces

Barrel star-exports types plus `Markdown` (`/home/user/markdown/src/core/index.ts:1-8`). `Span` in `types.ts` would export with no new line.

Guide:

- Surface Types `MarkdownInterface`: `/home/user/markdown/guides/markdown.md:42`
- Surface Types node rows: `/home/user/markdown/guides/markdown.md:19-35`
- `### \`Markdown\``: `/home/user/markdown/guides/markdown.md:148-150`
- Methods `MarkdownInterface`: `/home/user/markdown/guides/markdown.md:166-180` (`walk`, `find`, `filter`, `map`, `reduce`, `fold`, `stream` — no `span`)

### 7. Entity names

Owner of parse: class `Markdown` implements `MarkdownInterface` (`/home/user/markdown/src/core/Markdown.ts:40`; `/home/user/markdown/src/core/types.ts:353`). There is **no** parse option object. Constructor is `constructor(input: string | MarkdownDocument)` (`43`).

Public surface today: `document` getter (`47-50`); methods `walk`, `find`, `filter`, `map`, `reduce`, `fold`, `stream` (`69-149`). Factory: `createMarkdown` (`/home/user/markdown/src/core/factories.ts:80`). The string→AST function is `parseDocument` (`/home/user/markdown/src/core/parsers.ts:125`); block/inline phase entries are `parseBlocks` (`31`) and `parseInline` (`136`).
