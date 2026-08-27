**Question:** Which `@orkestrel/*` packages have a charter that could genuinely host a shared byte-level Base64 codec, and what does every package's guide say that rules it in or out?

## Evidence

Every row is from the listed guide mirrors only. Environment is what that guide states, not what `src/core` conventionally means.

**abort.** Charter: a thin, traceable wrapper over native `AbortController` with parent-linked cancellation (`abort.md:3`). Environment: unstated as a published face; the guide cites Web APIs (`fetch`, streams, `AbortSignal`) and `src/core` (`abort.md:5`). Codec surface: none. Dependency: none visible.

**agent.** Charter: the conversation runtime — messages, prompt assembly, and the provider/tools loop; the model is not supplied (`agent.md:3`). Environment: unstated; Source `src/core` (`agent.md:3`). Codec surface: no encode/decode helpers; multimodal turns carry image **base64 strings** (`images?: readonly string[]`) (`agent.md:182`, `agent.md:489–490`); `IMAGE_TOKEN_ESTIMATE` says a base64 length is not a token proxy (`agent.md:426`). Dependency: none visible (`@orkestrel/workspace` / `@orkestrel/tool` are consumed; mcp is not named as a runtime import).

**brief.** Charter: a synchronous specification compiler on `@orkestrel/reason` that pins a JSON-serializable `Brief` (`brief.md:3–4`). Environment: unstated; Source `src/core` (`brief.md:21`). Codec surface: none. Dependency: none visible.

**browser.** Charter: a CDP automation layer split into environment-agnostic core and a Node server runtime (`browser.md:3–4`). Environment: **isomorphic core / node-only server** — core is “pure logic over an injected `CDPTransportInterface` — no `WebSocket`, no `node:*`, no filesystem — so it runs identically in Node or a browser” (`browser.md:4–7`); restated “Core is environment-agnostic… no `node:*`” (`browser.md:1197–1199`); server supplies `WebSocketCDPTransport`, process launch, and `node:fs/promises` screenshots (`browser.md:14–17`, `browser.md:282`). Codec surface: `BASE64_CHARS` / `BASE64_LOOKUP` (`browser.md:79–80`); **`decodeBase64`** — “Decode a base64-encoded string into raw bytes (pure JS, no `Buffer`/`atob` — runs identically Node/browser)” (`browser.md:125`); **`encodeBase64`** — “Encode bytes as base64 without Node or DOM globals” (`browser.md:524`); `concatBytes` (`browser.md:521`); screenshot result `{ bytes: Uint8Array; path }` (`browser.md:236`). Dependency: none visible on mcp or server.

**budget.** Charter: a cumulative cost tally whose `AbortSignal` fires at the ceiling (`budget.md:3`). Environment: unstated; Source `src/core` (`budget.md:7`). Codec surface: none (bytes appear only as an example unit of `consume`, `budget.md:3`). Dependency: none visible.

**console.** Charter: one output-control system (style, logging, reporting, capture, animations) with environment sinks (`console.md:3`). Environment: **isomorphic** — “one engine, environment sinks”; core, `createBrowserSink`, `createServerSink` (`console.md:5`). Codec surface: server-face **`decodeChunk`** — decode `process.*.write` chunk (`string` / `Uint8Array`) to text (`console.md:266`); `isBufferEncoding` (`console.md:267`). Dependency: none visible.

**contract.** Charter: runtime type guards, combinators, parsers, and a shape DSL (`contract.md:3`). Environment: unstated; Source `src/core` (`contract.md:3`). Codec surface: `isUint8Array` (`contract.md:76`); `INTRINSICS` includes `stringify` / `decode` (JSON, not Base64) (`contract.md:208`); **`encodeLeaf`** is JSON leaf encoding (`contract.md:544`). Dependency: none as a runtime import; mcp is named only as a downstream tool registrar (`contract.md:993`).

**csv.** Charter: a zero-dependency RFC 4180 CSV parser and renderer (`csv.md:3–4`). Environment: unstated; Source `src/core` (`csv.md:6–7`). Codec surface: format parse/render (`parseCSV` / `renderCSV` in the opening, `csv.md:10–18`); column type `'blob'` stored as strings (`csv.md:61`, `csv.md:165`); no Base64 or `Uint8Array` symbols. Dependency: none visible.

**database.** Charter: one typed database API over thin drivers; a table is a contract (`database.md:3–8`). Environment: **isomorphic with host drivers** — core plus SQLite in `src/server` and IndexedDB in `src/browser` (`database.md:20–28`). Codec surface: **`encodeValue` / `decodeValue` / `encodeRow` / `decodeRow`** — JS ↔ SQLite storage (`database.md:127–130`); `Blob` and `Uint8Array` named as driver-local values (`database.md:892`). Dependency: none visible on mcp or server.

**emitter.** Charter: the typed synchronous event emitter (`emitter.md:3`). Environment: unstated; Source `src/core` (`emitter.md:5`). Codec surface: none. Dependency: none visible.

**form.** Charter: the environment-agnostic form document — schema, answers, rules, settle-once (`form.md:3–4`). Environment: **browser-safe / host-agnostic** — “environment-agnostic”; “Nothing here renders… or opens a socket”; parking vs rendering belong to hosts (`form.md:3–13`); exports from `src/core` (`form.md:41`). Codec surface: none. Dependency: none visible.

**guide.** Charter: a pure, I/O-free guides-parity toolkit (`guide.md:3–4`). Environment: **browser-safe** — never imports `node:fs`; inventory is caller-supplied; “environment-agnostic” (`guide.md:394–399`). Codec surface: none. Dependency: none visible.

**html.** Charter: HTML parser, renderer, sanitizer, and distiller (`html.md:3`). Environment: unstated; Source `src/core` (`html.md:3`). Codec surface: **`decodeEntities`**, **`encodeText`**, **`encodeAttribute`** — HTML character references and markup escaping (`html.md:105`, `html.md:112–113`); “What roundtrips is the AST, NOT the input bytes” (`html.md:241`). Dependency: `@orkestrel/contract` only (`html.md:3`).

**indexeddb.** Charter: a Promise wrapper over raw browser IndexedDB, and nothing else (`indexeddb.md:3`). Environment: **browser-only** — `src/browser`, published `@orkestrel/indexeddb` (`indexeddb.md:3`); `isIndexedDBSupported` reads `globalThis.indexedDB` (`indexeddb.md:52`). Codec surface: none. Dependency: none visible.

**interpret.** Charter: a deterministic NL ↔ `@orkestrel/reason` bridge (`interpret.md:3–4`). Environment: unstated; Source `src/core` (`interpret.md:18–19`). Codec surface: none. Dependency: none visible.

**lsp.** Charter: host-independent LSP framing, validation, and a document client over an injected byte transport (`lsp.md:3`). Environment: **isomorphic core / node-only stdio** — “host-independent” (`lsp.md:3`); examples import `node:path` / `node:url` (`lsp.md:38–39`); `StdioTransport` is the server environment (`lsp.md:100–101`). Codec surface: **`encodeLSPMessage`** (`lsp.md:79`, `lsp.md:299`); **`parseLSPMessages`** / `LSPDecodeState` (`lsp.md:161–164`, `lsp.md:300–301`); transport `send(bytes: Uint8Array)` (`lsp.md:266`). Dependency: none visible.

**markdown.** Charter: a markdown layer over `@orkestrel/html` — parse to AST, project to HTML/markdown (`markdown.md:3`). Environment: unstated; Source `src/core` (`markdown.md:3`). Codec surface: inline escape decoding into node `value` (`markdown.md:290`); no Base64 / `Uint8Array`. Dependency: none visible on mcp or server.

**middleware.** Charter: fetch-native HTTP middleware batteries over the frozen server seam, plus a node-bound face (`middleware.md:3–13`). Environment: **split** — “pure, fetch-native core” vs “node-bound face” with `node:zlib` / `node:fs` (`middleware.md:4–11`, `middleware.md:66–68`). Codec surface: **`compressBytes`** via `CompressionStream` (`middleware.md:182`); **`readUploadedFile`** → `Uint8Array` (`middleware.md:222`). Dependency: **runtime on `@orkestrel/server`** — “Every battery is built over the frozen `@orkestrel/server` middleware seam” (`middleware.md:12–13`).

**msg.** Charter: a zero-dependency `.msg` / `.eml` parser with a pure-ES encoding layer (`msg.md:3–14`). Environment: **browser-safe** — “without a `TextDecoder` dependency, so the whole surface stays usable in the core's DOM/Node-free environment” (`msg.md:14–15`). Codec surface: “pure-ES encoding layer (Base64, UTF-8, Latin-1, Windows-1252, quoted-printable, RFC 2047 encoded words)” (`msg.md:11–13`); **`decodeBase64`** `(text: string) => Uint8Array` (`msg.md:179`); **`encodeUTF8` / `decodeUTF8` / `decodeLatin1` / `decodeWindows1252`** (`msg.md:180–183`); **`decodeMIMEEncoding`** including `'base64'` (`msg.md:188`); `MSGInput` is `Uint8Array | ArrayBuffer | EmailInput` (`msg.md:65`); `burnCFB` → `Uint8Array` (`msg.md:258`). No `encodeBase64` or base64url row. Dependency: none visible.

**ndjson.** Charter: a stateful NDJSON stream parser over string chunks (`ndjson.md:3–4`). Environment: unstated as a host; “no Emitter, no server / HTTP / agent coupling”; Source `src/core` (`ndjson.md:16–24`). Codec surface: none on the parser; “Pair it with a streaming `TextDecoder` when reading a byte stream” (`ndjson.md:18–19`). Dependency: none visible.

**ollama.** Charter: the concrete local-LLM `ProviderInterface` over Ollama `POST /api/chat` (`ollama.md:3`). Environment: published from `src/server` (`ollama.md:7`); also documents a browser `fetch` / `headers` seam (`ollama.md:101`, `ollama.md:150`). Codec surface: streaming uses `TextDecoder({ stream: true })` with `@orkestrel/ndjson` (`ollama.md:94`). Dependency: none as a package import of mcp; tests mention a recording proxy built with `@orkestrel/server` (`ollama.md:232`).

**pool.** Charter: a typed resource pool with unique ownership and FIFO settlement (`pool.md:3–4`). Environment: **unstated** (no Source/face sentence; tests sit under `tests/src/core`, `pool.md:233`). Codec surface: none. Dependency: none visible.

**probe.** Charter: the claim prover — type, lint, and test a proposed edit (`probe.md:3–4`). Environment: **split, proving face is process/Node** — Source `src/core`, `src/server`, `src/bin` (`probe.md:7–8`); `Probe` / stages live in `src/server` (`probe.md:159–163`); executes caller test code with host-process privileges (`probe.md:16–18`). Codec surface: none (bytes appear as claim/control file text and digests, not a codec). Dependency: mcp is a **client of probe**, not a dependency (`probe.md:509`, `probe.md:1009`).

**process.** Charter: a typed child-process toolkit; contracts in core, Node engine on the server face (`process.md:3–13`). Environment: **split** — “host-independent contracts… ship from `@orkestrel/process`. The Node implementations… from `@orkestrel/process/server`” (`process.md:11–13`). Codec surface: “Standard error is decoded and forwarded live”; byte-bounded stderr tail (`process.md:272–273`); examples use `TextEncoder` / `Uint8Array` (`process.md:1009–1010`). Dependency: none visible.

**program.** Charter: a program engine that orchestrates qualifier then rater (`program.md:3–7`). Environment: unstated; Source `src/core` (`program.md:29–30`). Codec surface: none. Dependency: none visible.

**qualifier.** Charter: a synchronous eligibility engine over `@orkestrel/reason` (`qualifier.md:3–6`). Environment: unstated; Source `src/core` (`qualifier.md:27–28`). Codec surface: none. Dependency: none visible.

**queue.** Charter: a cooperative FIFO job queue (`queue.md:3–4`). Environment: unstated; Source `src/core` (`queue.md:32`); `fetch` appears in an example (`queue.md:42`). Codec surface: none. Dependency: none visible.

**rater.** Charter: a quantitative rating layer over `@orkestrel/reason` (`rater.md:3–6`). Environment: unstated; Source `src/core` (`rater.md:15–16`). Codec surface: none. Dependency: none visible.

**reason.** Charter: a zero-dependency deterministic reasoning engine (`reason.md:3`). Environment: unstated; Source `src/core` (`reason.md:4`). Codec surface: none (“binary floating point” is IEEE numeric, `reason.md:636`). Dependency: none visible.

**relation.** Charter: a thin ORM loader over `@orkestrel/database` (`relation.md:3`). Environment: unstated; Source `src/core` (`relation.md:5`). Codec surface: none. Dependency: none visible.

**router.** Charter: environment-agnostic path registry plus fetch dispatcher, browser navigator, and node HTTP adapter (`router.md:3–8`). Environment: **isomorphic** — core / `src/browser` / `src/server` (`router.md:4–17`); node helpers import `node:http` (`router.md:88–92`). Codec surface: **`decodeParam`** — URL-decode a path capture (`router.md:76`); not Base64. Dependency: none visible.

**sea.** Charter: Node.js SEA builder — compress, blob, assemble, sign, embed assets into a standalone binary (`sea.md:3`). Environment: **node-only** — Source `src/server` (`sea.md:3`). Codec surface: binary injectors / magic bytes / Brotli (`sea.md:45`, `sea.md:71–80`); no Base64 encode/decode symbols. Dependency: none visible.

**sqlite.** Charter: a typed synchronous wrapper over `node:sqlite` (`sqlite.md:3`). Environment: **node-only** — `node:sqlite`, Source `src/server` (`sqlite.md:3`). Codec surface: `SQLiteValue` includes `Uint8Array` (`sqlite.md:55`); no Base64. Dependency: none visible.

**sse.** Charter: a stateful SSE stream parser over string chunks (`sse.md:3–4`). Environment: unstated as a host; “no Emitter, no server / HTTP / agent coupling”; Source `src/core` (`sse.md:16–19`). Codec surface: `NUL` / `BOM` as character constants (`sse.md:56–57`); no Base64 / `Uint8Array`. Dependency: none visible.

**table.** Charter: the environment-agnostic tabular document (`table.md:3–4`). Environment: **browser-safe / host-agnostic** — “environment-agnostic”; “names [no] host type” (`table.md:3–4`); exports from `src/core` (`table.md:56`). Codec surface: none. Dependency: none visible.

**template.** Charter: `{{name}}` fill over a values record (`template.md:3–5`). Environment: unstated; Source `src/core` (`template.md:10–11`). Codec surface: none. Dependency: none visible.

**terminal.** Charter: the terminal side of a form — key decoder, theme, reducers, parked broker, SSE bridge (`terminal.md:3–7`). Environment: **split** — core `TerminalInterface`; server TTY uses `node:readline` (`terminal.md:10–14`); core decoder “no `node:*`, no I/O” (`terminal.md:149–150`). Codec surface: **`parseKey`** — decode keypress bytes (`string` / `Uint8Array`) (`terminal.md:155`). Dependency: none visible on mcp or server.

**test.** Charter: published test helpers (record, wait, own, journey) (`test.md:3–4`). Environment: **split** — host-independent core (neither `node:*` nor DOM); `@orkestrel/test/server` Node face; `@orkestrel/test/browser` Vitest Browser Mode (`test.md:58–62`). Codec surface: **`decodeJSONLines`** (`test.md:9`, `test.md:148`); **`supportsBytes`** (`test.md:503`); “consumer's own codecs” in a wire-fixpoint pattern (`test.md:1177`, `test.md:1635–1639`). Dependency: **zero runtime `@orkestrel/*` deps** (`test.md:46–47`).

**timeout.** Charter: a re-armable `setTimeout` wrapper exposing an expiry `AbortSignal` (`timeout.md:3–6`). Environment: unstated; Source `src/core` (`timeout.md:14`). Codec surface: none. Dependency: none visible.

**tool.** Charter: the tool runtime — JSON-Schema-described callables, registry, contained results (`tool.md:3–8`). Environment: unstated; Source `src/core` (`tool.md:10`). Codec surface: none. Dependency: none; **mcp is a caller**, not a dependency (`tool.md:17`, `tool.md:25`).

**toolbox.** Charter: concrete LLM-callable tools over `@orkestrel/tool` (`toolbox.md:3`). Environment: **split** — factories in `src/core`, `createTerminalRoutes` in `src/server` (`toolbox.md:11`). Codec surface: none (POST **body byte cap** on terminal routes, `toolbox.md:217`). Dependency: terminal-route options **default to `@orkestrel/server`'s `DEFAULT_BODY_LIMIT`** (`toolbox.md:217`); see also `server.md` as the `openStream` substrate (`toolbox.md:965`).

**websocket.** Charter: server-native RFC 6455 wrapper over an upgraded `node:stream` Duplex; handshake, frame codec, ping/pong, close (`websocket.md:3`). Environment: **node-only** — `node:stream`, `node:crypto`, `node:http` (`websocket.md:3`, `websocket.md:10`, `websocket.md:34`); Source `src/server` (`websocket.md:5`). Codec surface: “masked/unmasked **frame codec**” (`websocket.md:3`); **`computeWebSocketAccept`** — “base64 SHA-1 of the key + `WEBSOCKET_GUID`” (`websocket.md:46`); **`isWebSocketKey`** — “canonical base64 encoding of a 16-byte `Sec-WebSocket-Key`” (`websocket.md:47`); `parseWebSocketFrame` / `encodeWebSocketFrame` / `parseUTF8` (`websocket.md:49–54`). Dependency: none visible on mcp or server.

**worker.** Charter: a Queue ⨉ Pool facade; Node thread pool on the server face (`worker.md:3–9`, `worker.md:25–30`). Environment: **split** — core `createWorker`; `createNodeWorker` / `serveWorker` over `node:worker_threads` (`worker.md:25–30`). Codec surface: none. Dependency: none visible.

**workflow.** Charter: orchestration as a JSON `Workflow → Phase → Task` tree driven by shipped substrate (`workflow.md:3`). Environment: unstated; Source `src/core` (`workflow.md:17`). Codec surface: none (“encode the §10 / §14 truth tables” is status derivation, `workflow.md:189`). Dependency: none visible.

**workspace.** Charter: a path-keyed map of immutable files with an editing surface; not a filesystem (`workspace.md:3–12`). Environment: **browser-safe** — “There is no disk, no `node:fs`” (`workspace.md:11`); Source `src/core` (`workspace.md:8`). Codec surface: binary file arm `{ data, mime }` (`workspace.md:38`); **`createBinaryContent(data: string, mime)`** (`workspace.md:107`); **`decodedSize(base64)`** — “decoded length of base64, computed arithmetically rather than by decoding” (`workspace.md:88`); `computeSize` uses “decoded bytes for binary” (`workspace.md:86`); example `'AAAA'` → size 3 via `decodedSize` (`workspace.md:225–227`). No `encodeBase64` / `decodeBase64`. Dependency: none visible.

## Candidates

Packages whose **charter language** (or a charter-adjacent opening claim) could cover a shared byte-level Base64 codec. Borderline cases are marked. No ranking.

**msg** (charter names Base64 encoding):

> “A pure-ES encoding layer (Base64, UTF-8, Latin-1, Windows-1252, quoted-printable, RFC 2047 encoded words) and the CFB sector/directory machinery (`parsers.ts` / `helpers.ts` / `shapers.ts`) back both formats without a `TextDecoder` dependency, so the whole surface stays usable in the core's DOM/Node-free environment.” (`msg.md:11–15`)

**browser** (borderline: charter is CDP; core already publishes the encode/decode pair):

> “A lightweight Chrome DevTools Protocol (CDP) automation layer, split into an environment-agnostic **core** and a Node **server** runtime. **Core** (`@orkestrel/browser`) is pure logic over an injected `CDPTransportInterface` — no `WebSocket`, no `node:*`, no filesystem — so it runs identically in Node or a browser” (`browser.md:3–7`)

Documented codec rows: `decodeBase64` (`browser.md:125`), `encodeBase64` (`browser.md:524`).

**workspace** (borderline: charter is a file map; binary content is already base64 text):

> “**The virtual file workspace for the `@orkestrel` line.** A workspace is a path-keyed map of immutable files with an editing surface over it.” (`workspace.md:3–4`)

> “`{ text, language } | { data, mime }` — the tagless text-or-binary union” (`workspace.md:38`)

**websocket** (borderline: charter is RFC 6455 frames; handshake uses base64; face is Node):

> “Once an HTTP server hands you an upgraded socket, this wrapper turns that raw byte stream into a typed, observable connection: it owns the upgrade handshake, the masked/unmasked frame codec, ping/pong, and the close handshake” (`websocket.md:3`)

**sea** (borderline: charter is SEA binary assembly, not a general codec):

> “Node.js SEA builder — compress, blob, assemble, sign, and embed assets into a standalone binary.” (`sea.md:3`)

**lsp** (borderline: charter is LSP byte framing, not Base64):

> “The core package provides host-independent Language Server Protocol framing, validation, and a document-oriented client over an injected byte transport.” (`lsp.md:3`)

**html** (borderline: charter is HTML; encode/decode are entity/markup codecs):

> “A zero-runtime-dependency-beyond-`@orkestrel/contract`, types-first HTML parser, renderer, sanitizer, and distiller — a hand-written, index-based tokenizer that turns any HTML string into a typed AST” (`html.md:3`)

**csv** (borderline: charter is RFC 4180 text parse/render):

> “A zero-dependency, types-first RFC 4180 CSV parser and renderer — a hand-written, single-pass tokenizer that turns CSV text into a typed `CSVTable`” (`csv.md:3–5`)

**console** (borderline: charter is output control; `decodeChunk` is stream-chunk → text):

> “One unified output-control system for a terminal, a browser, and a server.” (`console.md:3`)

**terminal** (borderline: charter includes a key decoder, not Base64):

> “What terminal owns is everything form has no opinion about: a key decoder, a presentation theme, the pure per-field reducers, the headless broker…” (`terminal.md:5–6`)

**ndjson** (borderline: charter is line parsing; bytes are delegated to `TextDecoder`):

> “Pair it with a streaming `TextDecoder` when reading a byte stream: the decoder handles partial characters, the parser handles partial lines.” (`ndjson.md:18–19`)

**database** (borderline: charter is a typed store; codecs are SQLite value mapping):

> “One typed database API that runs unchanged on top of an in-memory map or a persistent JSON file” (`database.md:3–4`)

**middleware** (borderline: compression/upload bytes; charter is HTTP policy over the server seam):

> “the pure, fetch-native core (`@orkestrel/middleware`) — thirteen `create{Noun}(options) => MiddlewareHandler<TState>` battery factories … Every battery is built over the frozen `@orkestrel/server` middleware seam” (`middleware.md:4–13`)

**contract** (borderline: charter is validation; `isUint8Array` / JSON `encodeLeaf` only):

> “The contract & validation surface — runtime type guards, guard combinators, flat parsers, and a shape DSL.” (`contract.md:3`)

## Unknowns

- A guide that only writes `Source: src/core` does not state whether that face is importable from a browser mcp core. Exports maps, `node:` imports in source, and package.json were out of scope.
- `mcp.md` and `server.md` were excluded, so those two charters — and any codec they already document — are not in this survey.
- Cycle evidence is only what a guide states. A runtime dependency the guide omits is invisible here.
- `browser.md` documents `encodeBase64` / `decodeBase64` as **avoiding** `atob` / `btoa` / `Buffer`. The artifact under placement is built **on** `btoa` / `atob`. The guide does not say RFC 4648 §4 padding, standard alphabet, or base64url for those helpers.
- `msg.md` documents `decodeBase64` and MIME `'base64'`, not `encodeBase64` or base64url.
- `workspace.md` takes binary `data` as a string and sizes it with `decodedSize`; who produces that base64 is unstated. Edits mint text only (`workspace.md:120`).
- `pool.md` never states an environment or barrel.
- `ollama.md` publishes from `src/server` and also describes browser `fetch`. Whether the published entry is browser-safe is unstated.
- Whether a browser-only package (`indexeddb`) is an allowed import for mcp core is unstated in these guides.
- Toolbox’s `DEFAULT_BODY_LIMIT` citation (`toolbox.md:217`) does not say whether core tools import `@orkestrel/server` or only the server-face routes do.
