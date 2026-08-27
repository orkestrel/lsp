**Question:** What does every `@orkestrel` package currently encode, decode, escape, or otherwise reversibly transform, and what are the exact semantics of each such surface?

## Inventory

### `@orkestrel/browser` (source)

- **`decodeBase64`** — `browser/src/core/helpers.ts:107`. Base64 text → `Uint8Array`. Spec: RFC 4648 alphabet via `BASE64_CHARS` (`constants.ts:11`); whitespace/`=` stripped, invalid chars skipped (`helpers.ts:96–97,108`). Decode-only as a pair with `encodeBase64`, but decode is **lenient** (skips junk). Browser-safe (no `Buffer`/`atob`). Stateless. Exported via `src/core/index.ts`; module is the CDP helper dump (snapshots, locators, codegen).
- **`encodeBase64`** — `helpers.ts:136`. `Uint8Array` → padded standard Base64 (`+`,`/`,`=`). Spec: RFC 4648 §4 alphabet. Encode side of the pair; total on any byte array. Browser-safe. Stateless. Same export/coupling.
- **`textToBytes` / `bytesToText`** — `helpers.ts:153–159`. UTF-8 text ↔ bytes via `TextEncoder` / `TextDecoder()` (non-fatal). Spec: WHATWG Encoding. Pair. `bytesToText` **lenient** (U+FFFD on bad UTF-8). Browser-safe. Stateless. Same module.
- **`concatBytes`** — `helpers.ts:1262`. `Uint8Array[]` → one `Uint8Array`. none/domain. Not a charset/codec; byte concat. Browser-safe. Stateless. Exported.
- **`readBrowserStreamChunk`** — `helpers.ts:1279`. CDP `IO.read` record → bytes; `base64Encoded === true` routes through `decodeBase64`, else `textToBytes` (`:1285`). Spec: CDP. Decode-only. Throws `BrowserError` on malformed record. Browser-safe. Stateless. Same module.
- **`decodeBrowserSnapshot`** (+ `decodeRareStringData` / `decodeRareBooleanData` / `decodeRareIntegerData` / `decodeBrowserAttributes`) — `helpers.ts:2923–3151`. CDP DOM snapshot wire → `BrowserSnapshot` nodes. Spec: CDP. Decode-only. Lenient empty maps on off-shape. Browser-safe. Stateless. Exported; used by `BrowserPage`.

### `@orkestrel/server` (source)

- **`encodeBase64` / `decodeBase64`** — `server/src/server/helpers.ts:439,463`. Bytes ↔ standard padded Base64 via `btoa`/`atob` + `fromCharCode`/`charCodeAt`. Spec: RFC 4648 §4 (comment `:427–429`). Pair. Decode **throws `DOMException`** on malformed. Function body is Web-API (`btoa`/`atob`); **module imports `node:net` / `node:events`** (`helpers.ts:1,16–17`) so importing the symbol is node-bound. Stateless. Exported via `src/server/index.ts` (`export * from './helpers.js'`). Guide `server.md` lists only the url pair, not these two.
- **`encodeBase64Url` / `decodeBase64Url`** — `helpers.ts:482,505`. Bytes ↔ unpadded base64url (`-`,`_`, no `=`). Spec: RFC 4648 §5 (alphabet swap + pad restore). Pair. Decode restores alphabet/padding then `decodeBase64` — **throws `DOMException`**. Same node-bound module. Stateless. Published (`server.md:95–96`).
- **`decodeCookieValue`** — `helpers.ts:199`. Percent-encoded cookie value → string via `decodeURIComponent`. Spec: RFC 3986 percent-encoding (cookie value). Decode-only (inverse of `serializeCookie`’s `encodeURIComponent`). **Lenient**: malformed `%` stays literal (`:201–204`). Stateless. Published.
- **`parseCookies`** — `helpers.ts:147`. `Cookie:` header → `name → decoded value`. Spec: RFC 6265. Decode-only. **Total**: bad pairs skipped; duplicate name wins. Stateless. Published.
- **`serializeCookie`** — `helpers.ts:262`. `(name, value, options)` → `Set-Cookie` text; value `encodeURIComponent`. Spec: RFC 6265. Encode-only. **Throws `HTTPError(500)`** if `Domain`/`Path` fail `isCookieAttribute`. Stateless. Published.
- **`signToken` / `verifyToken` / `decodeTokenPayload`** — `helpers.ts:541,582,618`. String ↔ `<base64url(JSON {value,exp})>.<base64url(HMAC-SHA256)>`. Spec: none/domain (HMAC token; payload encoding is RFC 4648 §5). Pair at token layer. `signToken` throws `HTTPError(500)` on empty secret; `verifyToken` / `decodeTokenPayload` **total** (`undefined` on bad base64/JSON/shape/expiry). Uses `TextEncoder` + WebCrypto. Stateless. Published.
- **`serializeEvent`** — `helpers.ts:1246`. `SSEMessage` → SSE wire text (`event:`/`id:`/`retry:`/`data:` + blank line). Spec: HTML SSE (WHATWG). Encode-only (inverse of `@orkestrel/sse` parser). Total. Stateless. Published.
- **`enqueueStreamText`** — `helpers.ts:1273`. Text → UTF-8 bytes onto a `ReadableStream` via caller `TextEncoder`. Spec: WHATWG Encoding. Encode-only. Stateless. Published.
- **`decompressRequestBody`** — `helpers.ts:1540`. gzip/deflate bytes → raw bytes via `DecompressionStream`. Spec: RFC 1952 / RFC 1951. Decode-only. Throws `ContentTooLargeError` over cap; `HTTPError(400)` on corrupt. Stateless per call (stream). Published.
- **`readBody`** — `helpers.ts:1614`. Request bytes → JSON (`parseJSON` + `scrubPrototype`) or UTF-8 text (`TextDecoder()`, non-fatal) or `undefined` if empty. Spec: HTTP + ECMA-404. Decode-only. Throws size/corrupt errors; JSON parse failure is whatever `parseJSON` returns. Stateless. Published.

### `@orkestrel/mcp` (source)

- **`encodeSentinel` / `decodeSentinel`** — `mcp/src/core/helpers.ts:1274,1230`; markers `MCP_SENTINEL_PREFIX='=?base64?'` / `MCP_SENTINEL_SUFFIX='?='` (`constants.ts:83–86`). Header field string ↔ either literal printable ASCII or `=?base64?{RFC4648 of UTF-8}?=`. Spec: none/domain (MCP header sentinel; payload is RFC 4648 §4 + UTF-8). Pair. `decodeSentinel` **total**: unmarked value returned after RFC 9110 OWS trim; marked but non-canonical/`atob`/non-UTF-8 → `undefined` (no literal fallback) (`:1207–1211,1238–1245`). `encodeSentinel` wraps when the round-trip would not be identity (`:1275–1278`). Uses `atob`/`btoa` + `TextEncoder` + `TextDecoder('utf-8',{fatal:true})`. Browser-safe (no `node:*` in `helpers.ts`). Stateless. **Published** (`export * from './helpers.js'` in `src/core/index.ts`); **not documented in `mcp.md`**.
- **`isStandardBase64`** — `validators.ts:173`. Predicate only: canonical padded `[A-Za-z0-9+/]` with `=` pad (JSON Schema `byte`). Spec: RFC 4648 §4 grammar. Not a transform. Browser-safe. Exported. Used by `decodeSentinel`.
- **`serializeJSON`** — `helpers.ts:218`. JSON value → canonical JSON text within byte/key/depth limits; UTF-8 byte accounting via `charCodeAt` (`:265–285`). Spec: ECMA-404. Encode-only. **Total**: `undefined` if invalid/out of bounds/`JSON.stringify` would fail. Browser-safe. Stateless. Published (`mcp.md` names it).
- **`decodeBoundedMessage`** — `helpers.ts:1189`. JSON-RPC text → `JSONRPCMessage | undefined` after byte bound then `JSON.parse` + `parseJSONRPCMessage`. Spec: JSON-RPC 2.0. Decode-only. **Total**. Browser-safe. Stateless. Published.
- Image/audio/blob content types (`types.ts` ~289–378) **carry** base64 strings; this package does not decode them to bytes.

### `@orkestrel/html` (source)

- **`decodeEntities`** — `html/src/core/helpers.ts:155`. HTML text → text with numeric and `;`-terminated named references resolved; unknown named refs kept literal; bad numeric → U+FFFD; incomplete `&…` left as `&` + rest (`:180–210`). Spec: WHATWG named entities (`NAMED_ENTITIES` from entities.json, `constants.ts:599`) + HTML numeric character references. Decode-only vs `encodeText`/`encodeAttribute` (those only emit `&amp;`/`&lt;`/`&gt;`/`&quot;`, not the full named table). **Lenient**. Browser-safe. Stateless. Exported (`src/core/index.ts`).
- **`encodeText`** — `helpers.ts:657`. Literal text → `&amp;` `&lt;` `&gt;`. Spec: HTML text data. Encode-only (minimal). Total. Stateless. Exported.
- **`encodeAttribute`** — `helpers.ts:667`. Literal attribute → `&amp;` `&quot;` (double-quoted context). Spec: HTML attribute. Encode-only. Total. Stateless. Exported.
- **`sanitizeURL`** — `helpers.ts:683`. URL string → decoded/control-stripped URL or `''`; repeats `decodeEntities` up to 8 times, fail-closed if still changing (`:690–698`). Spec: none/domain (HTML sanitizer). Decode-then-filter. **Lenient** (returns `''`). Stateless. Exported.
- **`parseDocument` / `parseProvenance`** — `parsers.ts:36,46`. HTML string → AST; “malformed input recovers without throwing” (`:34–35`). Spec: HTML (hand tokenizer; not a full WHATWG tree builder). Decode-ish. **Lenient**. Stateless. Exported.
- **`renderHTML`** — `helpers.ts:889`. AST → canonical HTML (text via `encodeText`, attrs via `encodeAttribute`). Spec: HTML. Encode-ish. **Total** (`''` on hostile/cycle; depth-capped). Stateless. Exported. Guide: AST round-trips, not input bytes.

### `@orkestrel/markdown` (source)

- **`unescapeText`** — `markdown/src/core/helpers.ts:568`. Markdown source with `\x` → literal `x` for escapable chars. Spec: CommonMark backslash escapes. Decode-only (encode side is inline in `renderMarkdown`). Total. Browser-safe (imports `@orkestrel/html`). Stateless. Exported.
- **`parseDocument` / `parseProvenance` / `parseInline`** — `parsers.ts:199,210,227`. Markdown text → AST (inline escapes resolved into `text.value`). Spec: CommonMark/GFM subset. Decode-ish. Stateless. Exported.
- **`renderMarkdown`** — `helpers.ts:1615`. AST → canonical markdown; backslash-escapes text so parse↔render is sound (`:1595–1602`). Spec: CommonMark/GFM canonical forms. Encode-ish. **Total** (depth cap degrades). Stateless. Exported.
- **`renderHTML`** — `helpers.ts:1580`. Markdown AST → sanitized HTML via `@orkestrel/html`. Spec: HTML. Encode-only. Stateless. Exported.

### `@orkestrel/lsp` (source)

- **`encodeLSPMessage`** — `lsp/src/core/helpers.ts:19`. `JSONRPCMessage` → `Content-Length` + `\r\n\r\n` + UTF-8 JSON bytes (`TextEncoder`). Spec: LSP base protocol + JSON-RPC 2.0. Encode-only vs `parseLSPMessages`. **Throws `LSPError`** if `JSON.stringify` fails/undefined. Browser-safe. Stateless. Exported.
- **`parseLSPMessages`** — `parsers.ts:34`. Byte chunk + `LSPDecodeState` → messages + retained state. Spec: LSP base protocol. Decode-only. **Throws `LSPError`** on header/body limit, framing, UTF-8, JSON, or JSON-RPC shape. **Stateful** (`LSPDecodeState`). Browser-safe. Exported.
- **`readLSPBody`** — `helpers.ts:289`. Body bytes → JSON-RPC via `TextDecoder('utf-8',{fatal:true})` then `@orkestrel/contract` `parseJSON`. Spec: UTF-8 (WHATWG fatal) + JSON-RPC. Decode-only. **Throws `LSPError`** (`framing` on UTF-8, `protocol` on JSON/shape). Stateless. Exported (used by parser).
- **`readLSPHeader` / `scanLSPBoundary`** — `helpers.ts` (~119–270). Header bytes → `Content-Length`; unknown fields ignored. Spec: LSP. Decode-only. Throws on missing/invalid length. Stateless.

### `@orkestrel/websocket` (source)

- **`parseWebSocketFrame` / `encodeWebSocketFrame`** — `websocket/src/server/helpers.ts:88,281`. Wire `Buffer` ↔ RFC 6455 frame (FIN/opcode/mask/length/payload XOR). Spec: RFC 6455 §5. Pair. Parse **total** (`undefined` if incomplete; unmasked still decodes). Encode **throws `RangeError`** on bad opcode/mask. String payload UTF-8 via `Buffer.from(...,'utf-8')`. **Node-only** (`node:crypto`, `Buffer`). Parse is incremental-but-stateless per call (caller holds buffer). Exported.
- **`measureWebSocketFrame` / `isWebSocketFrameCanonical`** — `helpers.ts:156,192`. Length-prefix / canonical-length checks. Spec: RFC 6455 §5.2. Decode-adjacent. Total (`undefined` until buffered). Node-only. Exported.
- **`parseUTF8`** — `helpers.ts:225`. Bytes → string or `undefined` via `TextDecoder('utf-8',{fatal:true})`. Spec: UTF-8. Decode-only. **Total**. Node-only (`Buffer` param). Stateless. Exported.
- **`computeWebSocketAccept`** — `helpers.ts:22`. Key string → base64(SHA-1(key+GUID)). Spec: RFC 6455 §4.2.2. Encode-only (not invertible). Node-only (`node:crypto`). Stateless. Exported.
- **`isWebSocketKey`** — `helpers.ts:45`. Predicate: 24-char `A-Za-z0-9+/` + `==` and `Buffer.from(key,'base64').length===16`. Spec: RFC 6455 §4.1. Not a transform. Node-only. Exported.
- **`NodeWebSocket.#encodeClose` / `#decodeClose`** — `NodeWebSocket.ts:402,416`. Close code+reason ↔ payload bytes. Spec: RFC 6455 §5.5.1 / §7.4. Internal. Node-only.

### `@orkestrel/console` (source)

- **`decodeChunk`** — `console/src/server/helpers.ts:119`. `string|Buffer|Uint8Array|unknown` → text. Buffer uses Node `encoding` or `'utf8'`; `Uint8Array` via `TextDecoder()`; else `String(chunk)`; catch → `'[unprintable]'`. Spec: Node `BufferEncoding` (utf8/hex/base64/latin1/…). Decode-only. **Total**. **Node-only** (`Buffer`). Stateless. Exported `@orkestrel/console/server`.
- **`ProcessCapture.#decode`** — `ProcessCapture.ts:221`. Streaming UTF-8 via `node:string_decoder` `StringDecoder('utf8')` across writes; non-utf8 encodings one-shot through `decodeChunk`. Spec: UTF-8. Decode-only. **Stateful**. Node-only. Internal to the class (class is exported).
- **`strip`** — `core/helpers.ts:61`. String → string with ANSI/CSI/OSC sequences removed. Spec: ECMA-48 / xterm. Decode-ish (not reversible). Total. Browser-safe. Stateless. Exported.
- **`stripControls`** — `core/helpers.ts:84`. Strip C0/DEL except `\t\n\r`. none/domain. Total. Stateless. Exported.
- **`stringifyValue` / `formatArgs`** — `core/helpers.ts:609,649`. JS value / console args → display string (circular-safe `JSON.stringify`, Error as `name: message`). Spec: none/domain. Encode-only. **Total**. Browser-safe. Stateless. Exported.
- **`escapePercent`** — `browser/helpers.ts:140`. `%` → `%%` for `console` format strings. Spec: none/domain (DevTools `%c`). Encode-only. Total. Browser face. Stateless. Exported `@orkestrel/console/browser`.
- **`ANSIRenderer`** — `core/ANSIRenderer.ts`. Style data → SGR escape codes. Spec: ECMA-48 SGR. Encode-only. Browser-safe. Stateless per call. Exported.

### `@orkestrel/terminal` (source)

- **`parseKey`** — `terminal/src/core/helpers.ts:73`. `string|Uint8Array` → `KeyEvent`; bytes via `TextDecoder()` then tables `SEQUENCE_NAMES` / `CONTROL_NAMES`, else printable / empty name. Spec: none/domain (VT/xterm key sequences). Decode-only. **Total** (`name:''` unknown). Browser-safe. Stateless. Exported.
- **`serializePending` / `serializeExpire` / `serializeShutdown`** — `helpers.ts:884–894`. Domain records → `{event, data: JSON.stringify(...), id?}`. Spec: SSE event shape. Encode-only. Stateless. Exported.
- **`PromptClient`** — `PromptClient.ts:164–170`. Byte stream → SSE events via `TextDecoder({stream:true})` + `@orkestrel/sse`. Spec: WHATWG Encoding + SSE. Decode-only. **Stateful** (decoder + parser). Browser-safe. Class exported.

### `@orkestrel/process` (source)

- **`Supervisor.#decoder`** — `process/src/server/Supervisor.ts:68,322`. Stderr `Buffer` chunks → UTF-8 text via `StringDecoder('utf8')`; flushed on settle (`:355`). Spec: UTF-8. Decode-only. **Stateful**. **Node-only**. Internal.
- **`trimHead`** — `server/helpers.ts:69`. Bytes → prefix not splitting a UTF-8 sequence. Spec: UTF-8. Not a full codec. Node-only (`Buffer`). Stateless. Exported.

### `@orkestrel/sea` (source)

- **`compressFile` / `compressDirectory`** — `sea/src/server/helpers.ts:226,274`. File bytes → Brotli `.br` via `brotliCompressSync`. Spec: RFC 7932. Encode-only here (no decompress helper in this sweep). **Throws `SEAError('OUTPUT')`** on symlink output. **Node-only** (`node:zlib`, `node:fs`). Stateless per file. Exported.
- **`Injector.#serializeResourceTree`** — `injectors/Injector.ts:660`. PE resource tree → buffer. Spec: PE/COFF. Encode-only. Internal. Node-only.
- **`AssetManager` client HTML** — `assets/AssetManager.ts:80–86`. HTML string → UTF-8 bytes via `TextEncoder`; throws `Error` if encode fails. Spec: UTF-8. Encode-only. Internal.

### `@orkestrel/test` (source)

- **`decodeJSONLines`** — `test/src/core/helpers.ts:297`. NDJSON/JSON Lines text → `unknown[]`; skips empty lines; strips `\r`. Spec: JSON Lines + ECMA-404. Decode-only. **Throws `Error`** (`Invalid JSON on line N`, `cause` = `SyntaxError`). Browser-safe. Stateless. Exported.

### `@orkestrel/msg` (guide only — no checkout)

- **`decodeBase64`** — `msg.md:179`. Base64 text → `Uint8Array`. Spec: unnamed in table (charter says Base64). Decode-only (no `encodeBase64` in guide). Semantics of padding/invalid **unstated** on this symbol. Browser-safe (pure-ES, no `TextDecoder`). Stateless. Published (`msg.md:210`).
- **`encodeUTF8` / `decodeUTF8`** — `msg.md:180–181`. String ↔ UTF-8 bytes. Spec: WHATWG-style decode; invalid → U+FFFD; overlong rejected via `UTF8_SEQUENCE_MINIMUM` (`msg.md:136`). Pair. Decode **lenient** (replacement, not throw). Published.
- **`decodeLatin1`** — `msg.md:182`. Bytes → ISO-8859-1 string. Decode-only. Published.
- **`decodeWindows1252`** — `msg.md:183`. Bytes → string; `0x80–0x9F` via `WINDOWS_1252_HIGH`. Decode-only. Published.
- **`readUTF16String`** — `msg.md:170`. `DataView` slice → UTF-16LE string. **Throws `MSGError('MALFORMED')`** if out of bounds. Published.
- **`readANSIString`** — `msg.md:171`. PT_STRING8 bytes → string via encoding dispatch. Decode-only. Published.
- **`resolveEncoding`** — `msg.md:184`. Charset label → `MSGEncoding` (`utf-8|utf-16le|windows-1252|latin1`), fallback charset if unknown. **Lenient**. Published.
- **`decodeMIMEEncoding`** — `msg.md:188`. MIME body text + CTE → bytes (`base64` / `quoted-printable` / passthrough). Spec: RFC 2045. Decode-only. **Throws `MSGError('MALFORMED')` on invalid Base64**. Published.
- **`decodeMIMEText`** — `msg.md:189`. MIME body → text via `decodeMIMEEncoding` + `resolveEncoding`. Decode-only. Published.
- **`decodeMIMEWords`** — `msg.md:190`. Header text with `=?charset?B/Q?...?=` → Unicode. Spec: RFC 2047. Decode-only. Published (listed in table; not in the import example block).
- **`toHexLower`** — `msg.md:173`. Number → zero-padded lowercase hex. Encode-only. Published.
- **`msftUUIDStringify`** — `msg.md:174`. Mixed-endian Microsoft UUID bytes → string. Encode-only. Published.
- **`fileTimeToUTCString`** — `msg.md:172`. Windows FILETIME → UTC date string. Encode-only. Published.
- **`burnCFB`** (via `MSGInterface.burn`) — `msg.md:11–13,258` in prior seed. Structured CFB tree → `Uint8Array`. Spec: CFB/OLE2. Encode-only. Published on the class.

### `@orkestrel/csv` (guide)

- **`parseCSV` / `readRecords` / `scanQuoted`** — `csv.md:152,147,144`. CSV text → `CSVTable` / raw records; BOM stripped; `escape: 'double'|'backslash'`. Spec: RFC 4180 + dialects. Decode-ish. **Lenient** unless `strict` (then throws). Stateless. Published.
- **`renderCSV` / `renderTSV` / `wrapQuoted`** — `csv.md:127–128,122`. Table/rows → CSV/TSV text; quoted fields escaped per `escape`; formula sanitization. Spec: RFC 4180. Encode-ish. **Total** (circular → `blank`). Stateless. Published.

### `@orkestrel/database` (guide)

- **`encodeValue` / `decodeValue`** — `database.md:127–128`. JS value ↔ `SQLiteValue` for a column’s `ColumnStorage` (`text|integer|real|boolean|json|blob`, `:262`). Spec: none/domain (SQLite affinities). Pair. **Total, never throws**. Environment: core (isomorphic); SQLite face node-only, IndexedDB browser. Stateless. Published.
- **`encodeRow` / `decodeRow`** — `database.md:129–130`. `Row` ↔ `SQLiteRow` by schema; absent columns omitted on decode. Pair. Published.

### `@orkestrel/workspace` (guide)

- **`decodedSize`** — `workspace.md:88`. Base64 string → decoded byte length **without decoding** (example `'AAAA'` → 3, `:227`). Spec: RFC 4648 length arithmetic. Neither encode nor decode of payload. Browser-safe. Stateless. Published.
- **`computeSize`** — `workspace.md:86`. `FileContent` → UTF-8 byte length (text) or `decodedSize` (binary `{data, mime}`). Published.
- **`createBinaryContent`** — `workspace.md:107`. Takes `data: string` (already base64) + mime. No encode/decode. Published.
- **`escapeRegExp`** — `workspace.md:96`. Literal → regex-safe source. Encode-only. Published.

### `@orkestrel/router` (guide)

- **`decodeParam`** — `router.md:76`. Path capture → URL-decoded string; **tolerates malformed `%`**. Spec: RFC 3986. Decode-only. Lenient. Core (browser-safe). Stateless. Published.
- **`matchPath`** — `router.md:77`. Pathname vs compiled pattern → decoded params or `undefined`. Decode-adjacent. Published.
- **`escapeRegExp`** — `router.md:72`. Same class as workspace. Published.

### `@orkestrel/contract` (guide)

- **`parseJSON` / `parseJSONAs`** — `contract.md:189–190`. JSON text → `unknown` / `T|undefined`. Spec: ECMA-404. Decode-only. **Total** (`undefined`, never throws on bad text). Core. Stateless. Published.
- **`encodeLeaf`** — `contract.md:544`. Non-container JS value → JSON text or `undefined` (via captured `JSON.stringify`); bigint refused before stringify. Spec: ECMA-404. Encode-only. Total (`undefined`). Published.
- **`canonicalStringify` / `canonicalizeValue`** — `contract.md:542–543`. Value → key-sorted JSON or `undefined`; unreadable structure **throws `ContractError { code: 'structure' }`**. Spec: ECMA-404 + package canonicalization. Encode-only. Mixed total/throwing. Published.

### `@orkestrel/form` (guide)

- **`serializeForm` / `parseForm`** — `form.md:172,196`. Form schema ↔ JSON projection; `custom` validators dropped both ways. Spec: none/domain. Pair (verbatim on data members, `:437,485`). `parseForm` **total** (`undefined`); `serializeForm` **throws `SCHEMA`** if clone/own fails (`:1485`). Browser-safe. Stateless. Published.

### `@orkestrel/sse` (guide)

- **`SSEParser.parse` / `flush` / `reset`** — `sse.md:117,23–34`. String chunks → `SSEEvent[]`; BOM on first chunk; `id:` with NUL voided. Spec: WHATWG SSE. Decode-only (encode lives in `@orkestrel/server` `serializeEvent`). **Stateful**. Throws `SSEError('OVERFLOW')` if over `limit`; otherwise spec-faithful discard. Core. Published.

### `@orkestrel/ndjson` (guide)

- **`NDJSONParser.parse` / `reset`** — `ndjson.md:83`. String chunks → records; complete `\n` lines `JSON.parse`d; malformed/non-record **skipped**. Spec: NDJSON + ECMA-404. Decode-only. **Stateful**. **Lenient**. No size limit. Core. Published. Bytes delegated to caller `TextDecoder`.

### `@orkestrel/middleware` (guide)

- **`compressBytes`** — `middleware.md:182`. Bytes → gzip/deflate via `CompressionStream`. Spec: RFC 1952/1951. Encode-only. Core (feature-detected). Published.
- **`compressNodeBytes`** — `middleware.md:213`. Same via `node:zlib`. **Node-only**. Published.
- **`createCompression`** — `middleware.md:68`. Node zlib sibling of the fetch compression battery. Node-only.
- **Static `decodeURIComponent`** — `middleware.md:421`. Request path → decoded path; **refuses malformed escapes**. Spec: RFC 3986. Decode-only. **Strict**. Node face.
- **`createAssets`** — `middleware.md:429–432`. Browser-relative key decoded; Brotli body decompressed once. Decode-only for Brotli. Node face.

### `@orkestrel/ollama` (guide)

- Streaming path uses **`TextDecoder({ stream: true })` + `@orkestrel/ndjson`** (`ollama.md:94`). Bytes → UTF-8 text → records; flush + trailing `\n` at end. Spec: WHATWG Encoding + NDJSON. Decode-only. **Stateful**. Internal to the provider (not a published codec helper). Empty/non-JSON generate body degrades to `{}`.

### No transform surface found (source and/or guide)

`abort`, `agent` (carries workspace base64 image strings; no encode/decode helper), `brief`, `budget`, `emitter`, `guide`, `indexeddb`, `interpret`, `pool`, `probe` (SHA-256 hex digest only — one-way), `program`, `qualifier`, `queue`, `rater`, `reason`, `relation`, `sqlite` (stores `Uint8Array` natively), `table`, `template`, `timeout`, `tool`, `toolbox` (path params decoded by router), `worker` (host structured clone), `workflow` (“encode truth tables” is status derivation).

## Clusters

**Byte↔text / Base64 family:** `browser.encodeBase64`/`decodeBase64`; `browser.textToBytes`/`bytesToText`; `server.encodeBase64`/`decodeBase64`; `server.encodeBase64Url`/`decodeBase64Url`; `mcp.encodeSentinel`/`decodeSentinel` (and `isStandardBase64`); `msg.decodeBase64`; `msg.encodeUTF8`/`decodeUTF8`; `workspace.decodedSize`; `websocket.computeWebSocketAccept`/`isWebSocketKey`; `websocket.parseUTF8`; `lsp.readLSPBody` UTF-8; `console.decodeChunk`/`ProcessCapture.#decode`; `process.Supervisor.#decoder`; `sea.AssetManager` `TextEncoder`; `ollama` streaming `TextDecoder`.

**Charset decoders (non-UTF-8):** `msg.decodeLatin1`; `msg.decodeWindows1252`; `msg.readUTF16String`; `msg.readANSIString`; `msg.resolveEncoding`; `console.decodeChunk` honoring Node `latin1`/`hex`/`base64` encodings.

**MIME / RFC 2045 / 2047:** `msg.decodeMIMEEncoding` (base64, quoted-printable, passthrough); `msg.decodeMIMEText`; `msg.decodeMIMEWords`.

**HTML / markdown structural escapes:** `html.decodeEntities`/`encodeText`/`encodeAttribute`/`sanitizeURL`; `html.parseDocument`/`renderHTML`; `markdown.unescapeText`/`parseDocument`/`renderMarkdown`/`renderHTML`.

**CSV quoting:** `csv.parseCSV`/`scanQuoted`/`wrapQuoted`/`renderCSV`/`renderTSV`.

**Percent / URI / cookie / path:** `server.decodeCookieValue`/`parseCookies`/`serializeCookie`; `router.decodeParam`/`matchPath`; `middleware` static/assets `decodeURIComponent`; `console.escapePercent`.

**JSON text codecs:** `contract.parseJSON`/`parseJSONAs`/`encodeLeaf`/`canonicalStringify`; `mcp.serializeJSON`/`decodeBoundedMessage`; `test.decodeJSONLines`; `ndjson.NDJSONParser`; `form.serializeForm`/`parseForm`; `console.stringifyValue`.

**Protocol framing:** `lsp.encodeLSPMessage`/`parseLSPMessages`; `websocket.parseWebSocketFrame`/`encodeWebSocketFrame`/`measureWebSocketFrame`; `sse.SSEParser`; `server.serializeEvent`; `terminal.parseKey`; `terminal.serializePending` family; `browser.decodeBrowserSnapshot`/`readBrowserStreamChunk`.

**Compression (content-coding, not Base64):** `server.decompressRequestBody`; `middleware.compressBytes`/`compressNodeBytes`; `sea.compressFile`/`compressDirectory`; `middleware.createAssets` Brotli decompress.

**Value mapping (storage / identity):** `database.encodeValue`/`decodeValue`/`encodeRow`/`decodeRow`; `server.signToken`/`verifyToken`/`decodeTokenPayload`; `msg.fileTimeToUTCString`/`msftUUIDStringify`/`toHexLower`; `msg` CFB `burn`; `sea.Injector.#serializeResourceTree`; `workspace.escapeRegExp`; `router.escapeRegExp`.

**ANSI / display:** `console.strip`/`stripControls`/`ANSIRenderer`.

## Unknowns

- **`msg.decodeBase64`** (no checkout): alphabet, padding, whitespace, and invalid-input behavior are not stated on that symbol; only `decodeMIMEEncoding(..., 'base64')` is documented as throwing `MSGError('MALFORMED')`. No `encodeBase64` / base64url in the guide. Quoted-printable exists only inside `decodeMIMEEncoding`, not as a named pair. RFC 2047 Q/B error policy unstated.
- **`database.encodeValue`/`decodeValue`:** guide states total JS ↔ `SQLiteValue` by `ColumnStorage`; the per-type mapping (especially `json` / `blob` / `boolean`) is not spelled in the helper table. No local checkout.
- **`workspace` binary `data`:** stored as a string sized by `decodedSize`; who produces the base64, and whether it is standard vs url vs unpadded, is unstated. No encode/decode of that payload.
- **`@orkestrel/mcp` guide vs source:** `encodeSentinel`/`decodeSentinel`/`MCP_SENTINEL_*` are implemented and barrel-exported; `mcp.md` does not name them.
- **`@orkestrel/server` guide vs source:** `encodeBase64`/`decodeBase64` are exported from `helpers.ts` but omitted from `server.md`’s helper table (url pair is listed). `atob` padding/whitespace rules follow the host `atob`, not a package-local grammar.
- **`browser.decodeBase64` vs `server.decodeBase64` vs `mcp.decodeSentinel`:** three different Base64 membership/error policies (skip junk / throw `DOMException` / total `undefined` after canonical grammar). No shared spec citation beyond RFC 4648 alphabet comments on server/mcp.
- **`csv` / `sse` / `ndjson` / `form` / `contract` / `router` / `middleware` / `database` / `msg`:** implementations not read (no checkout); rows are guide-accurate only.
- Packages listed under “No transform surface” were judged from source (checkouts) or guide (others); a symbol that only `JSON.stringify`s for logging/errors was not counted as a codec surface.
