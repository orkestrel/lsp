I have the local evidence. The rest of this message is the brief’s Evidence and Unknowns distillate only.

# Evidence

## 1. mcp protocol truth (`/home/user/mcp`)

### Every occurrence of the literal `2026-07-28` in `src/`, `tests/`, and `guides/`

**`src/`**

- `/home/user/mcp/src/core/types.ts:191` — `export type MCPVersion = '2026-07-28' | '2025-11-25' | '2025-06-18'`
- `/home/user/mcp/src/core/constants.ts:11` — comment: `2026-07-28 is stateless`
- `/home/user/mcp/src/core/constants.ts:21` — `export const MCP_MODERN_VERSION: MCPVersion = '2026-07-28'`
- `/home/user/mcp/src/core/constants.ts:33` — first member of `SUPPORTED_PROTOCOL_VERSIONS`
- `/home/user/mcp/src/core/inferers.ts:10,15` — `'modern'` for `2026-07-28`; `case '2026-07-28':`
- `/home/user/mcp/src/core/parsers.ts:156` — TSDoc example payload
- `/home/user/mcp/src/core/errors.ts:17,21` — TSDoc example `supported: ['2026-07-28']`
- `/home/user/mcp/src/core/factories.ts:53` — TSDoc example `_meta` version
- `/home/user/mcp/src/core/MCPServer.ts:142` — TSDoc example `_meta` version

**`guides/`**

- `/home/user/mcp/guides/mcp.md` — `:84,153,165,216,221,381,428,522,1452,1557,1679,1680,1824,2861,3097,3195,3220,3228,3230,3232,3237,3316,3337,3448,3524,3526,3541,3551,3583,3645,3708,3762,3878,3977,3981,4177,4631`
- `/home/user/mcp/guides/probe.md:441` — `data.supported` list includes `2026-07-28`

**`tests/`** (literal `'2026-07-28'` or that string inside a larger JSON/ISO stamp)

- `/home/user/mcp/tests/setupConformance.ts:49` — `CONFORMANCE_SPEC = '2026-07-28'`
- `/home/user/mcp/tests/guides.test.ts:489`
- `/home/user/mcp/tests/src/core/inferers.test.ts:6`
- `/home/user/mcp/tests/src/core/helpers.test.ts:566,586,634,697,1363,1503,1504`
- `/home/user/mcp/tests/src/core/parsers.test.ts:33,204,212,225,247,261,302,332,340,359,363,367,372,377,382,387,432`
- `/home/user/mcp/tests/src/core/validators.test.ts:1543,1580,1911`
- `/home/user/mcp/tests/src/core/MCPLegacy.test.ts:105`
- `/home/user/mcp/tests/src/core/MCPServer.test.ts:443,526,560,780,1596,1649,1785,1834,1873,1923,1970,2019,2167,3197,3892,4224,4351,4819,5002`
- `/home/user/mcp/tests/src/core/MCPClient.test.ts:294,622,744,749,792,808,812,919,952,957-960,977,984,995,1012,1035,1050,1074,1141,1167,1192,1214,1257,1624,1938,2720,2748,2807,2808,2903,2904,3109,3110,3205,3239`
- `/home/user/mcp/tests/src/server/inferers.test.ts:23`
- `/home/user/mcp/tests/src/server/helpers.test.ts:312,337`
- `/home/user/mcp/tests/src/server/factories.test.ts:285,778`
- `/home/user/mcp/tests/src/server/handlers.test.ts:148,156,181,188,227,235,316,385,395,453,462,521,532,565,573,689,699`
- `/home/user/mcp/tests/src/server/middlewares.test.ts:338,345`

(ISO stamps `2026-07-28T00:00:00Z` in `helpers.test.ts` / `MCPClient.test.ts` are date fields, not protocol-revision members.)

Outside the three named trees, `/home/user/mcp/README.md:83` also contains the literal.

### Declared values of `MCP_PROTOCOL_VERSION`, `MCP_LEGACY_VERSION`, `SUPPORTED_PROTOCOL_VERSIONS`

Prior map pointer `src/core/constants.ts:15,18,32` is still the declaration site. Values on disk:

```15:36:/home/user/mcp/src/core/constants.ts
export const MCP_PROTOCOL_VERSION: MCPVersion = '2025-11-25'
export const MCP_LEGACY_VERSION: MCPVersion = '2025-06-18'
export const MCP_MODERN_VERSION: MCPVersion = '2026-07-28'
export const SUPPORTED_PROTOCOL_VERSIONS: readonly MCPVersion[] = Object.freeze([
	'2026-07-28',
	'2025-11-25',
	'2025-06-18',
])
```

Prior-map claim that the array omits `'2026-07-28'` is stale. The array includes it. `MCP_PROTOCOL_VERSION` remains the newest **legacy initialize** revision, not the modern one (`constants.ts:7-13`).

**`MCP_PROTOCOL_VERSION` consumers (source)**

- declared `constants.ts:15`
- imported/read `src/server/inferers.ts:9,65,136` (missing-header message; default return)
- imported/read `src/core/MCPLegacy.ts:27,218` (legacy projection error text)
- imported/read `src/core/MCPClient.ts:44,676,709` (legacy `#initialize` pin / fallback)

**`MCP_LEGACY_VERSION` consumers (source)**

- declared `constants.ts:18`
- imported/read `src/core/helpers.ts:43,947-948` (`buildInitializeResult` fallback)

**`SUPPORTED_PROTOCOL_VERSIONS` consumers (source)**

- declared `constants.ts:32-36`
- `src/core/inferers.ts:4,32` (`inferVersion` walks it newest-first)
- `src/core/validators.ts:70,1216,1219` (`isMCPVersion`)
- `src/core/helpers.ts:46,890,947` (`buildDiscoverResult` / newest-legacy pick)
- `src/core/MCPServer.ts:60,403` (unsupported-version `supported` list)
- `src/core/MCPClient.ts:46,208` (constructor unsupported-version `supported`)
- `src/server/handlers.ts:10,120` (HTTP header mismatch `supported`)

Test files also import the same three names (among them `tests/src/core/MCPServer.test.ts:64,68`, `tests/src/core/MCPClient.test.ts:24,27`, `tests/src/core/validators.test.ts:105,643`, `tests/src/server/middlewares.test.ts:10,13`, `tests/integration.test.ts:28,335`).

### Progress surface

Present. MCP uses `notifications/progress` and `_meta.progressToken`, not LSP `$/progress`.

Declarations:

- `MCPProgress` `{ progress, total?, message? }` — `src/core/types.ts:678-683`
- `MCPProgressInterface.report` — `types.ts:686-688`
- `MCPProgressHandler` — `types.ts:707`
- `MCPExecutionContext.progress?` — `types.ts:715`
- `MCPCallOptions.progress?` — `types.ts:2279`

Handlers / builders:

- `isMCPProgress` — `src/core/validators.ts:324-338`
- `parseRequestContext` accepts `_meta.progressToken` as string or integer — `src/core/parsers.ts:128-129`
- `buildProgressNotification` method `'notifications/progress'`, params `{ progressToken, progress, total?, message? }` — `src/core/helpers.ts:371-384`
- `MCPProgressReporter` copies the token into each notification — `src/core/MCPProgressReporter.ts:34-52,69,119`
- `MCPServer` reads `_meta.progressToken` and, with an explicit executor, runs `#progress` — `src/core/MCPServer.ts:803-810,904-937`
- `MCPClient.#request` stamps `progressToken: id` when a caller supplied a handler — `src/core/MCPClient.ts:429-441`
- `MCPClient.#reportProgress` claims inbound `notifications/progress` by token — `src/core/MCPClient.ts:611-622`

Barrel re-export: `src/core/index.ts:10`.

### Cancellation surface

No `$/cancelRequest` anywhere in the tree (searched the checkout). MCP equivalent is `notifications/cancelled`.

- `buildCancelledNotification` — `src/core/helpers.ts:415-423` — `method: 'notifications/cancelled'`, params `{ requestId, reason? }`
- `readCancelledId` — `helpers.ts:1010-1015`
- `bindServer` aborts the live `AbortController` for that id and writes no response — `helpers.ts:1145-1148,1156-1159`
- `MCPClient.#abortRequest` sends that notification only when `transport.duplex` is true — `src/core/MCPClient.ts:941-949`
- Guide attribution: `guides/mcp.md:3761-3771` — `2026-07-28 removes client→server notifications over Streamable HTTP`

### Capability-negotiation shape

**Types**

- Client: `MCPClientCapabilities` — `src/core/types.ts:217-229` (open record plus `experimental?`, `roots?`, `sampling?`, `elicitation?`, `extensions?`)
- Server: `MCPServerCapabilities` — `types.ts:232-243` (open record plus `logging?`, `completions?`, `prompts?`, `resources?`, `tools?`, `extensions?`)
- Guards: `isMCPClientCapabilities` `validators.ts:420`; `isMCPServerCapabilities` `validators.ts:468`

**Modern (no `initialize`)**

- Per-request `_meta` keys `MCP_META_VERSION` / `MCP_META_CAPABILITIES` — `constants.ts:38-42`
- `parseRequestContext` requires both a string version and `isMCPClientCapabilities` — `parsers.ts:123-125`
- Client default `options.capabilities ?? {}` — `MCPClient.ts:221`; stamped onto modern `_meta` at `MCPClient.ts:431-437`
- Discovery result `capabilities` is **read** — `MCPClient.ts:321,330,358`

**Legacy `initialize`**

- Built and sent by `MCPClient.#initialize` — `MCPClient.ts:872-879`:

```ts
{ protocolVersion: version, capabilities: {}, clientInfo: this.#identity }
```

- Handled by `MCPLegacy.#legacy` case `'initialize'` — `src/core/MCPLegacy.ts:107-116` → `buildInitializeResult`
- Result built at `helpers.ts:941-955`: `{ protocolVersion, capabilities: { tools: {} }, serverInfo: { name, version } }`
- `#initialize` then reads **only** `result.protocolVersion` (`MCPClient.ts:882-891`) and sends `notifications/initialized` (`MCPClient.ts:913`). `InitializeResult.capabilities` and `serverInfo` are received on the wire and **ignored**.

A modern-shaped `initialize` on the bare server is `-32601` (no handler); only `MCPLegacy` serves it (`MCPServer.test.ts` / `MCPLegacy.ts`).

### Features the tree attributes to `2026-07-28`, and the version-type/constants mismatch

From guides/tests only:

| Attribution | Pointer | Quoted text |
|---|---|---|
| Modern era: per-request `_meta`, no handshake, no session | `guides/mcp.md:84` | `` `2026-07-28` \| modern \| Per-request `_meta` carrying the reserved protocol-version key. No handshake, no session. `` |
| Stateless; defines no `initialize` | `constants.ts:11-13` | `2026-07-28 is stateless and defines no initialize, so it can never be the handshake's version` |
| Era selected structurally, never stored | `guides/mcp.md:3195-3198` | `The 2026-07-28 era is selected structurally, per request, and never stored.` |
| Roots, Sampling, Logging deprecated | `guides/mcp.md:3524` | `All are deprecated in 2026-07-28` |
| Server-initiated `elicitation/create` removed | `guides/mcp.md:3526` | `2026-07-28 removes server-initiated requests entirely.` |
| `subscriptions/listen` modern-only | `guides/mcp.md:3551` | `it is a 2026-07-28 method` |
| `resources/subscribe` / `unsubscribe` and `-32002` removed | `guides/mcp.md:521-522` | `were removed at 2026-07-28 and so was the dedicated -32002 resource-not-found code` |
| Streamable HTTP client→server notifications removed | `guides/mcp.md:3762` | `2026-07-28 removes client→server notifications over Streamable HTTP` |
| Conformance pin | `tests/setupConformance.ts:49` | `CONFORMANCE_SPEC = '2026-07-28'` |
| `SUPPORTED` advertised newest-first including modern | `guides/mcp.md:88-89,1679-1680` | `Frozen preference order: 2026-07-28, 2025-11-25, 2025-06-18` |

**Mismatch named by the prior map:** `types.ts:191` admits `'2026-07-28'` **and** `SUPPORTED_PROTOCOL_VERSIONS` **includes** it (`constants.ts:33`). The type/array mismatch does not exist on disk.

What **is** explained, tested, and acknowledged is a different fact: `'2026-07-28'` is a supported **modern** revision and is **not** a legal `initialize` `protocolVersion`.

- Explained: `constants.ts:7-13`; `guides/mcp.md:3974-3982` (`a client asking to initialize at '2026-07-28' is asking to negotiate a revision that defines no negotiation`)
- Tested: `tests/src/core/helpers.test.ts:633-634` — `buildInitializeResult(..., '2026-07-28')['protocolVersion']` is `'2025-11-25'`
- `isMCPVersion('2026-07-28')` is `true` because it walks `SUPPORTED_PROTOCOL_VERSIONS` (`validators.ts:1218-1219`)

---

## 2. probe language-server inventory (`/home/user/probe`)

### LSP methods sent or handled (literal method strings)

All live in `src/server/stages/LintStage.ts`. Prior-map pointers, confirmed or corrected:

| Method | Direction | Pointer | Prior map |
|---|---|---|---|
| `initialize` | request sent | `:214` `this.#request('initialize', {` | confirmed |
| `initialized` | notify sent | `:225` `this.#notify('initialized', {})` | confirmed |
| `textDocument/didOpen` | notify sent | `:254` | confirmed |
| `textDocument/didClose` | notify sent | `:311` | confirmed |
| `textDocument/publishDiagnostics` | inbound handled | `:396` | confirmed |
| `shutdown` | request sent | `:172` `this.#request('shutdown', undefined)` | prior map `:167` is the comment; the call is `:172` |
| `exit` | notify sent | `:173` `this.#notify('exit', undefined)` | prior map named shutdown only |

No other `textDocument/` literals in `src/`. No `didChange`, `documentSymbol`, `foldingRange`, `selectionRange`, `semanticTokens`, `$/cancelRequest`, `$/progress`. Fixture servers in tests repeat the same method set (`tests/src/server/stages/LintStage.test.ts:54-79`, `tests/src/server/Probe.test.ts:55-67`).

Inbound JSON-RPC **responses** are matched by numeric `id`, not by method (`LintStage.ts:381-394`). Any other inbound **method** is dropped at `:396`.

### Exact `initialize` params and client `capabilities`

`LintStage.ts:214-224`:

```ts
await this.#request('initialize', {
  processId: process.pid,
  rootUri: pathToFileURL(this.#workspace).href,
  capabilities: {},
  workspaceFolders: [{ uri: pathToFileURL(this.#workspace).href, name: 'workspace' }],
})
```

Empty `capabilities: {}`. No `clientInfo`, `locale`, `trace`, `initializationOptions`, `workDoneToken`, `general.positionEncodings`, or `textDocument.*`.

Language id on later `didOpen` comes from `inferDocumentLanguage` — `src/server/helpers.ts:546-551` (`.tsx` → `typescriptreact`, `.js/.mjs/.cjs` → `javascript`, `.jsx` → `javascriptreact`, else `typescript`). Prior map `helpers.ts:535` is the TSDoc, not the function.

### Server capabilities read vs ignored

`#request` resolves `'result' in message ? message.result : undefined` (`LintStage.ts:392`) and `#warm` **awaits that promise and discards the value** (`:214` then `:225`). Every field of `InitializeResult` — including `capabilities`, `serverInfo`, `positionEncoding` — is **received and ignored**, not absent.

### JSON-RPC framing

Own implementation. No LSP library.

- Write: `LintStage.ts:348-350` — `` `Content-Length: ${Buffer.byteLength(content)}\r\n\r\n` `` + JSON
- Read: `LintStage.ts:353-378` — split on `\r\n\r\n`, then `parseContentLength`
- Parser: `src/server/helpers.ts:606-611` — `/(?:^|\r\n)Content-Length:\s*(\d+)(?:\r\n|$)/i`

### Position, range, URI; UTF-8/UTF-16/UTF-32 negotiation

URI: `pathToFileURL(...).href` on open (`LintStage.ts:235,256`) and close (`:311`).

Range consumption (`LintStage.ts:418-440`): if `diagnostic.range.start.line` is a number, `line: start.line + 1` (LSP 0-based → one-based). `start.character`, `range.end`, and encoding are not stored.

`Issue` (`src/core/types.ts:183-191`): `{ origin, path, message, line? }` — no column, no URI, no `Range`.

Position-encoding negotiation: **absent**. Searched `src/` and `tests/` for `utf-8` / `utf-16` / `utf-32` / `positionEncoding` / `positionEncodings`; the only `utf-8` hit under `src` is JSON decode `LintStage.ts:370` (`toString('utf8')` of the frame body). Client `capabilities` is `{}`.

### `publishDiagnostics` consumption

`LintStage.ts:396-405`: method must be `textDocument/publishDiagnostics`; `params.uri` string; `params.diagnostics` array; lookup `#publishes.get(params.uri)`; map through `#issues`.

`#issues` (`:411-443`) skips non-objects; requires `message: string`; optional `range.start.line`. `params.version`, `relatedInformation`, tags, severity, code are **received (in the array elements) and ignored**.

### Teardown sequence

`#destroy` → `#release` → `#retire` (`:114-177`):

1. `#request('shutdown', undefined)` (`:172`)
2. `#notify('exit', undefined)` (`:173`)
3. wait on child `exit`/`close` (`:122-125,158`)
4. if the 2s deadline fires: `child.kill('SIGKILL')` (`:160,175`)

Order on the wire is shutdown request, then exit notification. No wait for the `exit` notification (it has none).

### TYPE stage engine; other stages and LSP

`TypeStage` (`src/server/stages/TypeStage.ts:3-11,73,269-323`) loads the workspace `typescript` module and calls `typescript.createLanguageService(host)`. That is the in-process TypeScript **Language Service API**, not a `tsserver` process, not the `tsc` CLI, not `tsgo`.

`RuntimeStage.ts` has no `lsp` / `textDocument` matches. Only `LintStage` speaks LSP.

### `tsgo` / `typescript-go` / `TypeScript 7`

No matches in `src/`, `tests/`, or `guides/`. The only tree hit is lockfile optional peer of **oxlint**, not probe source:

- `/home/user/probe/package-lock.json:2802` `"oxlint-tsgolint": ">=7.0.2001"`
- `:2806-2808` `peerDependenciesMeta.oxlint-tsgolint.optional: true`

No `typescript-go` or `TypeScript 7` string.

---

## 3. html and markdown AST shape (`/home/user/html`, `/home/user/markdown`)

### html node types — position fields

Prior map `types.ts:39,52,64` “UTF-16 source offsets on nodes”: those lines are **`HTMLStartTag` / `HTMLTag` scanner results**, not AST nodes.

**Scanner types (UTF-16 offsets):**

- `HTMLStartTag.next: number` — `types.ts:52-53` — `The exclusive UTF-16 source offset immediately after the closing >.`
- `HTMLTag.next: number` — `types.ts:64-65` — same unit statement
- Remarks `types.ts:38-39` — `next remains an exact UTF-16 source offset`
- `parseStartTag(html, offset)` — `helpers.ts:171-174` — `offset` is `The UTF-16 offset of the opening <`

**AST node types — no `offset` / `range` / `position` / `start` / `end` fields:**

- `HTMLAttribute` `types.ts:27-32` — `name`, `value?`
- `ElementNode` `types.ts:79-87` — `category: 'element'`, `name`, `attributes`, `children`
- `TextNode` `types.ts:94-98` — `category: 'text'`, `value`
- `CommentNode` `types.ts:110-114` — `category: 'comment'`, `value`
- `DoctypeNode` `types.ts:126-134` — `category: 'doctype'`, `name`, `public?`, `system?`
- `HTMLDocument` `types.ts:140-144` — `category: 'document'`, `children`
- `HTMLNode` union `types.ts:151` — those five; none carry source coordinates

Parsers use offsets **internally** (`helpers.ts` `scanTag`/`scanComment`/`scanDoctype`) and drop them when constructing nodes (comment recovery returns `{ category: 'comment', value }` with `next` only as a scan cursor, `helpers.ts:397-399`).

Unit-statement source for UTF-16: `types.ts:39,52-53` and `helpers.ts:171`; test `tests/src/core/helpers.test.ts:441` `it('tracks UTF-16 offsets exactly')` against `parseStartTag(...).next`.

### markdown node types — position fields

Every node in `/home/user/markdown/src/core/types.ts` has `element` plus domain fields. **None** declare offset/range/position:

- `TextNode` `:44-48` — `element: 'text'`, `value`
- `EmphasisNode` `:56-62` — `element`, `strong`, `children`
- `CodeSpanNode` `:69-73` — `element`, `value`
- `LineBreakNode` `:76-78` — `element: 'break'`
- `LinkNode` `:85-91` — `element`, `href`, `children`
- `ImageNode` `:97-103` — `element`, `src`, `children`
- `HeadingNode` `:118-124` — `element: 'heading'`, `level`, `children`
- `ParagraphNode` `:127-131` — `element`, `children`
- `ListItemNode` `:134-138` — `element`, `children`
- `ListNode` `:146-154` — `element`, `ordered`, `start`, `items`
- `TableNode` `:162-175` — `element`, `header`, `rows`, `align`
- `CodeBlockNode` `:183-188` — `element`, `lang?`, `code`
- `BlockquoteNode` `:192-196` — `element`, `children`
- `ThematicBreakNode` `:199-201` — `element: 'thematicBreak'`
- `MarkdownDocument` `:217-221` — `element: 'document'`, `children`

(`ListNode.start` is the ordered-list ordinal, not a source offset — `types.ts:150-151`.)

Searched `src/core/types.ts` in both packages; markdown AST carries no source coordinates.

### Outline / heading-tree / symbol-table / folding-range-like derivation

**html** — searched `src/` (including distill) for outline/heading-tree/documentSymbol/folding/symbol-table: no such derivation. `distill` keeps `h1`–`h6` as ordinary elements via `CONTENT_ELEMENTS` (`src/core/constants.ts:305-327`) and `HTMLInterface.distill` (`types.ts:339-344`). Guide `guides/html.md:298-311` tells a consumer to **read the distilled AST** for heading structure; it does not build a heading tree.

**markdown** — heading **parse**, not an outline index:

- `extractHeading` — `src/core/helpers.ts:127-135` — `{ level, text }` from one line
- `parseBlocks` builds `HeadingNode` — `src/core/parsers.ts:66-71`
- `Markdown.find`/`filter`/`fold` can collect headings (`Markdown.ts:33,69-88`; `types.ts:289`)

No symbol table, folding ranges, or hierarchical outline type in `src/` or `guides/markdown` sources searched.

### Markdown node → source offset through the html layer

**No such trace.** Hops:

1. Markdown parse: `parseDocument` → `{ element: 'document', children }` with no offsets — `parsers.ts:125-126`
2. Markdown → HTML AST: `markdownToHTML` — `helpers.ts:811` — returns `HTMLDocument` (html nodes also have no offsets)
3. HTML → markdown AST: `htmlToMarkdown(node: HTMLNode)` — `helpers.ts:2125` — input already positionless
4. `renderHTML` (markdown) sanitizes `markdownToHTML` then serializes a string — `helpers.ts:1111-1114`

html `parseStartTag` offsets never attach to `HTMLNode`, so they cannot propagate into `MarkdownNode`.

### Public parse / render / walk surfaces (barrel + declarations)

**html** barrel `src/core/index.ts` re-exports types, constants, validators, parsers, helpers, shapers, factories, `HTML`.

| Surface | Declaration |
|---|---|
| `parseDocument` | `src/core/parsers.ts:24` |
| `createHTML` | `src/core/factories.ts:37` |
| `HTML` constructor → `parseDocument` | `src/core/HTML.ts` (import `:35`; construct uses parse) |
| `HTMLInterface.walk` | `types.ts:308`; impl `HTML.ts:95-97` → `walkNodes` |
| `walkNodes` | `helpers.ts:1064` |
| `find` / `filter` / `reduce` / `map` / `fold` / `stream` | `types.ts:310-332`; `HTML.ts` |
| `renderHTML` / `renderText` | `helpers.ts:768,919` |
| `sanitize` / `distill` | `types.ts:338-344` |
| `parseStartTag` / `scanTag` | `helpers.ts:174,287` |

**markdown** barrel `src/core/index.ts` same pattern.

| Surface | Declaration |
|---|---|
| `parseDocument` / `parseBlocks` / `parseInline` | `parsers.ts:31,125,136` |
| `createMarkdown` | `factories.ts:80` |
| `Markdown.walk` | `types.ts:365`; impl `Markdown.ts:69-71` → `walkNodes` |
| `walkNodes` | `helpers.ts:2159` |
| `find` / `filter` / `reduce` / `map` / `fold` / `stream` | `types.ts:366-385` |
| `extractHeading` | `helpers.ts:127` |
| `markdownToHTML` | `helpers.ts:811` |
| `htmlToMarkdown` | `helpers.ts:2125` |
| `renderHTML` / `renderMarkdown` | `helpers.ts:1111,1146` |

Those walks/folds/heading nodes are the structure `documentSymbol` / `foldingRange` / `selectionRange` / `semanticTokens` would have to build on. No package currently exposes ranges or token indices.

---

## 4. Progress mechanisms at implementation depth

Shared lifecycle table in each package’s `.claude/rules/names.md:185-199`: `start`, `stop`, `pause`, `resume`, `skip`, `abort`, `clear`, `destroy`, `execute`. Same text in workflow, process, tool, queue, middleware.

### workflow (`/home/user/workflow`)

**Emitter events and payloads**

`WorkflowEventMap` `src/core/types.ts:617-640`: `start [id]`, `complete []`, `fail [TaskResult]`, `pause []`, `resume []`, `skip []`, `stop []`, `add [phase, index]`, `remove [phase]`, `move [phase, index]`, `update [phase]`.

Emit sites `src/core/Workflow.ts`: pause `:264`, resume `:272`, remove `:343`, move `:368`, update `:391`, start/complete/fail/skip/stop `:440-444`, add `:455`.

`PhaseEventMap` `types.ts:658-681`: same lifecycle names plus `add [task, index]`, `remove/move/update [task, …]`.

Emit sites `src/core/phases/Phase.ts`: pause `:275`, resume `:283`, remove `:331`, move `:345`, update `:359`, start/complete/fail/skip/stop `:433-437`, add `:470`.

`TaskEventMap` `types.ts:696-717`: `start [id]`, `complete [result]`, `fail [result]`, `pause []`, `resume []`, `skip []`, `stop []`, `report [activity]`, `pulse [activity]`, `silence []`.

Emit sites `src/core/tasks/Task.ts`: start `:270`, complete `:297`, fail `:321`, skip `:332`, stop `:343`, report `:360`, pulse `:378`, pause `:386`, resume `:393`, silence `:528`.

`RunnerEventMap` `types.ts:2040-2055`: `start []`, `unit [id]`, `spawn [id, parent]`, `settle [id]`, `fail [id, error]`, `finish [results]`, `abort [reason]`.

Emit sites `src/core/Runner.ts`: start `:192`, finish `:203`, abort `:231`, spawn `:318`, unit `:374`, settle `:400`, fail `:410`.

**State / phase transitions**

```330:330:/home/user/workflow/src/core/types.ts
export type LifecycleStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped' | 'stopped'
```

`TaskStatus` / `PhaseStatus` / `WorkflowStatus` are that same union (`types.ts:346,358,370`).

**Percentage / count / ratio as progress**

`TaskProgress` `types.ts:191-195`: `{ current: number, total?: number, unit?: string }` — count-like current/total, not a percentage field. Carried on `TaskActivity.progress` (`types.ts:227-229`). `TaskInterface.report` replaces activity (`types.ts:905-908`).

**Cancellation**

Plumbed. `TaskInterface.signal: AbortSignal` (`types.ts:899`); `WorkflowInterface.signal` (`types.ts:1193`); `QueueExecution`-style runner `Controller.signal` (`types.ts:2079`). Combined with `AbortSignal.any` in `WorkflowRunner.ts:968-989,113-116`. Honoured at task wait (`TaskController.ts:68,89,110`), schedule (`helpers.ts:877-890,958`), and runner skip/abort paths (`WorkflowRunner.ts:555-566,712,741,821,844`).

**Partial-result surface**

`TaskInterface.report` / `pulse` plus `TaskEventMap.report`/`pulse` (`types.ts:711-714,905-913`; emit `Task.ts:360,378`) — incremental activity **before** `complete`/`fail`. Runner `settle` is per-unit completion, not a streaming partial of one unit’s value.

**Lifecycle vocabulary**

Package rule `.claude/rules/names.md:185-199`. Domain status union `types.ts:330`. Entity methods `start`/`complete`/`fail`/`skip`/`stop`/`pause`/`resume` on Task (`types.ts:900-904`).

### process (`/home/user/process`)

**Emitter events**

`ProcessEventMap` `src/core/types.ts:112-119`: `stderr [chunk]`, `error [error]`, `exit [ProcessExit]`.

Emit sites `src/server/Process.ts`: error (child) `:156`, stderr `:376,:407`, exit `:416`, stdin-channel error `:470-473`.

`ProcessManagerEventMap` `types.ts:468-473`: `launch [id]`, `exit [id, ProcessExit]`.

Emit sites `src/server/ProcessManager.ts`: launch `:134`, exit `:195`.

**State / phase transitions**

No status union. Observable bits: `ProcessInterface.settled` (`types.ts:253`), `stopping` (`types.ts:264`), `ProcessExit` `{ code, signal, drained }` (`types.ts:57-64`). Construction starts the child; `stop`/`destroy` terminate.

**Percentage / count / ratio**

No progress percentage/count/ratio field. `types.ts:217` mentions a child redrawing a **progress bar** with CR as line-framing, not a reported ratio.

**Cancellation**

`ProcessOptions.signal?: AbortSignal` (`types.ts:165`). Honoured in `Process.ts:169-172` (`abort` → `#terminate` / `stop()` if already aborted). `stop()` `:275-278`. Sync-host note in prior map (`types.ts` around the no-cooperative-window remark) is about Windows `grace`, not missing `signal`.

**Partial-result surface**

`lines: AsyncIterable<string>` (`types.ts:231`) streams stdout lines before `exit`. Trailing unframed partial is **not** promised (`types.ts:227-229`).

**Lifecycle vocabulary**

`.claude/rules/names.md:185-199`. Methods actually present: `stop`, `destroy` (`Process.ts:275,289`). No `start` (spawn is construction). No `pause`/`resume`/`skip` on the child.

### tool (`/home/user/tool`)

Searched `src/` for `EventMap`, `.emit(`, `AbortSignal`, `progress`, `percent`, `partial`: **no matches**.

- No emitter / event map in `src/core/types.ts`
- Outcomes: `ToolSuccess` / `ToolFailure` / `ToolResult` (`types.ts:45-74`) — terminal only
- `ToolInterface.execute` (`types.ts:93`) — no signal argument
- `ToolManagerInterface.execute` (`types.ts:176-183`) — isolated complete `ToolResult`, no incremental callback

Absence is from `src/` (types + implementation), not types-only.

**Lifecycle vocabulary:** `.claude/rules/names.md:185-199` (the shared table). Guide `guides/tool.md:26`: `A Tool is inert — a definition plus a handler, with no lifecycle`. No package-owned phase union.

### queue (`/home/user/queue`)

**Emitter events**

`QueueEventMap<TResult>` `src/core/types.ts:78-93`: `enqueue [id]`, `start [id]`, `retry [id, attempt]`, `success [id, result]`, `failure [id, error]`, `abort [reason]`, `drain []`.

Emit sites `src/core/Queue.ts`: abort `:343`, enqueue `:436`, start `:589`, retry `:604`, drain `:672,:677,:697`, success `:675`, failure `:676`.

**State / phase transitions**

No status union. Flags on `QueueInterface` (`types.ts:210-212`): `paused`, `stopped`. Methods `start`/`stop`/`pause`/`resume`/`abort`/`clear`/`destroy` (`types.ts:217-229`). `retry` carries completed-attempt **count** (`types.ts:84`).

**Percentage / count / ratio as progress**

No `progress` / percentage / ratio field in `src/`. `count` / `active` are queue occupancy (`types.ts:208-209`), not job progress. `retry`’s `attempt` is a retry counter.

**Cancellation**

Plumbed. `QueueExecution.signal` (`types.ts:114`). Per-entry `QueueEntryOptions.signal?` (`types.ts:154`). Combined `AbortSignal.any` with queue abort and optional timeout (`Queue.ts:706-713`). Honoured at `#race` if already aborted (`:734-738`). `abort()` aborts `#abort` controller and emits `abort` (`:338-343`).

**Partial-result surface**

None in `src/`. An entry settles once via `success`/`failure`. No incremental output type.

**Lifecycle vocabulary**

`.claude/rules/names.md:185-199`. Interface verbs match that table (`types.ts:217-229`). JSDoc at `types.ts:224`: `Cancel active work, reject pending work, and await cleanup.`

### middleware (`/home/user/middleware`)

**Emitter events**

No `EventMap` and no `.emit(` in `src/`. Observation is callbacks (`BoundaryOptions.report`, `TelemetryOptions.record` — `src/core/types.ts:30-32,63-65`), not an emitter.

**State / phase transitions**

`UploadStatus = 'staged' | 'moved'` — `src/server/types.ts:138`. Used on `UploadedFileInterface.status` (`:159`). Core `MultipartFile.status: string` (`src/core/types.ts:541`). HTTP `TelemetryEntry.status` / `DeadlineOptions.status` are HTTP status codes (`types.ts:50,164`), not lifecycle phases.

**Percentage / count / ratio**

No progress percentage/count/ratio in `src/`. `duration` on telemetry is elapsed ms (`types.ts:51`). Multipart `size` is file bytes (`types.ts:539`).

**Cancellation**

Plumbed on deadline and multipart:

- `createDeadline` links `@orkestrel/timeout` to `request.signal` via `linkSignal` — `src/core/middlewares.ts:390-397`; options `types.ts:157-158`
- `MultipartParser` holds `#signal: AbortSignal` (`src/server/MultipartParser.ts:19,36`); `#pull` throws `'request aborted mid-upload'` when aborted (`:249,252`)

No package-wide work-done token.

**Partial-result surface**

None. Multipart parse completes to `MultipartBody` (`types.ts:549-552`). Deadline race returns one `Response` (`middlewares.ts:401-408`).

**Lifecycle vocabulary**

`.claude/rules/names.md:185-199`. Upload-specific: `'staged' | 'moved'` (`server/types.ts:132-138`). Deadline uses `timeout.start()` / `timeout.clear()` (`middlewares.ts:392,410`) — `start`/`clear` from that table.

---

# Unknowns

- **Prior-map mismatch as stated** (`MCPVersion` includes `'2026-07-28'` while `SUPPORTED_PROTOCOL_VERSIONS` does not): **resolved on disk** — the array includes it. Searched `src/`, `tests/`, `guides/` for an acknowledgement of that *omission*; none remains, because the omission is gone. The remaining explained/tested gap is initialize-vs-modern, cited above.
- **Whether oxlint’s `--lsp` child uses `oxlint-tsgolint` / tsgo internally:** not in `/home/user/probe` source. Only `package-lock.json` optional peer of the `oxlint` package. Searched probe `src/`, `tests/`, `guides/` for `tsgo`, `typescript-go`, `TypeScript 7`.
- **Oxlint `InitializeResult.capabilities` shape this workspace’s binary actually returns:** probe discards the result (`LintStage.ts:214`). This sweep did not run the binary (read-only, no probes).
- **html scanner `next` offsets during `parseDocument`:** used as parse cursors in `helpers.ts`; they are not stored on `HTMLNode`. If a hidden side map existed it would have to live outside `types.ts`; searched `src/core` for offset fields on node object literals — AST construction stays `{ category, … }` without `next`.
- **Fleet-report Unknown “Guide/README purpose confirmation”:** not required by this brief’s four questions; manifests were not re-read for purpose lines.
- **tool / middleware progress under unpublished names:** searched `src/` (not only `types.ts`) for `EventMap`, `.emit(`, `AbortSignal`, `progress`, `percent`, `partial`. Tool `src/` has none of those. Middleware has abort plumbing and `UploadStatus` only.

All nine named checkout roots were present and readable at the absolute paths in the brief.
