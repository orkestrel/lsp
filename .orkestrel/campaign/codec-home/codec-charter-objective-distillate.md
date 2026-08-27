**Charter.** `@orkestrel/codec` is the L0 leaf for reversible byte↔alphabet encodings: pure ECMAScript, browser-safe, no `@orkestrel/*` dependency, no `node:*`, no `atob`/`btoa`/`Buffer`/`TextEncoder`. A member maps `Uint8Array` to alphabet-constrained text and back under one RFC encoding, one membership grammar, and the decode law below. It is not a host-encoder wrapper, not a framing or compression or JSON or URI or markup package, and not a place that absorbs consumer policy (MCP sentinels, CDP junk-skip, HMAC tokens, MIME CTE, JSON Schema format names). Those packages call codec and keep the policy.

## Families

**`encode*` (admitted).** Job: bytes → canonical text. Law: total on `Uint8Array`; never throws; output is the RFC canonical form (RFC 4648 §4 padded `+/`; RFC 4648 §5 unpadded `-_`). `decode*(encode*(bytes))` is identity on every byte sequence, including empty.

**`decode*` (admitted).** Job: text → bytes or absence. Law: **total-undefined** — `Uint8Array | undefined`, never throws, never skips junk. Readable-invalid input (wrong alphabet, whitespace, §4 missing padding, length remainder 1) returns `undefined`. This is the package's only error doctrine. Malformed text is invalid input, not unreadability, so there is no `CodecError` and no `DOMException`.

**`is*` (admitted).** Job: total membership on `unknown`; never throws. Law: for every `string` value, `isBase64(text)` if and only if `decodeBase64(text) !== undefined` (same pairing for the url names). Guard-valid text is never refused by its decoder; every defined decode output is guard-valid. Callers parse-then-trust: `is*` or `decode*` , then use the bytes. `isBase64` is RFC 4648 §4 canonical padded grammar, the same regex mcp pins today (`''`, `'YQ=='`, `'YWI='`, `'YWJj'` pass; `'$'`, `'A'`, `'AA-_'`, non-strings fail). `isBase64Url` is the §5 alphabet with optional padding, matching `decodeBase64Url`. Encode is the canonicalizer: `encodeBase64Url(decodeBase64Url(text))` equals `text` only when `text` is already unpadded.

**Rejected families.** `parse*` — contract already owns that prefix for JS-value coercion; decode is the codec equivalent. `*Of` — no encoding combinators exist in the inventory. Throwing decode — server's `atob` throw is a host accident; `verifyToken` / `decodeTokenPayload` already catch it to return `undefined`, and mcp is required to stay total. Coded refusals — no reader-boundary unreadability in a byte alphabet. Named lenient decode (`decodeBase64Lenient`) in wave 1 — browser is not a wave 1 consumer, and a symbol without a migrating caller violates the creation gate. `*Size` in wave 1 — `decodedSize` has no checkout and no stated alphabet; arithmetic that disagrees with strict `decode*` is a silent size lie.

## Membership bar

Admit a symbol when it is a reversible byte↔text mapping under a named encoding RFC (or WHATWG Encoding Standard charset), implementable in pure ECMAScript without a host encoder, with one membership grammar that is a sound pair with `decode*`, and with a caller that is not inventing a second error law. Refuse a symbol when the work is compression, protocol framing, markup/CSV/markdown escaping, JSON, URI percent-encoding, value mapping, a one-way digest, a host `TextEncoder`/`TextDecoder`/`atob` wrap, or a product policy over an encoding. Platform UTF-8 stays at the consumer because fatality already disagrees across `lsp` (throws), `websocket.parseUTF8` (undefined), `browser.bytesToText` (U+FFFD), `mcp` sentinels (fatal after Base64), and `console` (non-fatal). A lenient alphabet variant ships only under an explicit name, and only when that consumer migrates; skip-junk is not the default `decode*`.

## Cluster rulings

- **Byte↔text / Base64 family — IN-1** for `encodeBase64` / `decodeBase64` / `encodeBase64Url` / `decodeBase64Url` / `isBase64` / `isBase64Url` (server extracts; mcp sentinel inlines and `isStandardBase64` switch to them). **LATER** for `browser` encode/decode (CDP tests pin skip-junk: `AQ!ID` equals `AQID`) and for `msg.decodeBase64` (no checkout; MIME throws `MSGError('MALFORMED')` on invalid Base64, which a caller maps from `undefined`). **NEVER** for `encodeSentinel` / `decodeSentinel` (MCP header policy; they call codec then fatal UTF-8 — `/w==` is valid Base64 and must decode to `[0xff]`, while the sentinel stays `undefined` because UTF-8 is fatal), `computeWebSocketAccept` (SHA-1 + GUID, not invertible, `node:crypto`), `isWebSocketKey` (RFC 6455 16-byte predicate; websocket would pay a runtime dep it does not have), and every `TextEncoder`/`TextDecoder`/`StringDecoder` wrap (`browser.textToBytes`/`bytesToText`, `lsp.readLSPBody`, `websocket.parseUTF8`, `console.decodeChunk`, `process.Supervisor.#decoder`, `sea` `TextEncoder`, ollama streaming).
- **Charset decoders — LATER** for msg's pure-ES `encodeUTF8` / `decodeUTF8` / `decodeLatin1` / `decodeWindows1252` if msg accepts losing its empty `dependencies` line (catalog L0 → L1). **NEVER** for `readUTF16String` / `readANSIString` / `resolveEncoding` (MSG layout, bounds throws, fallback-charset policy) and for Node `BufferEncoding` latin1/hex/base64 on `console.decodeChunk`.
- **MIME / RFC 2045 / 2047 — NEVER.** Quoted-printable, CTE dispatch, and RFC 2047 words are msg domain with `MSGError` policy, not alphabet codecs.
- **HTML / markdown structural escapes — NEVER.** Entity tables, sanitizer loops, and CommonMark backslash policy belong to `@orkestrel/html` and `@orkestrel/markdown`.
- **CSV quoting — NEVER.** Dialect and `strict` vs lenient belong to `@orkestrel/csv`.
- **Percent / URI / cookie / path — NEVER.** `router.decodeParam` (lenient `%`), middleware static `decodeURIComponent` (strict), and `server.decodeCookieValue` (lenient) already disagree; unifying them in codec breaks two of those paths, and all three wrap the platform.
- **JSON text codecs — NEVER.** `@orkestrel/contract` owns JSON; mcp's `serializeJSON` / `decodeBoundedMessage` add byte/key/depth policy on top.
- **Protocol framing — NEVER.** LSP `Content-Length`, RFC 6455 frames, SSE, CDP snapshots, and VT keys are parsers with their own error types and state.
- **Compression — NEVER.** gzip/deflate/Brotli are content-codings (`CompressionStream` / `node:zlib`), not alphabets.
- **Value mapping — NEVER** for `database.encodeValue`, HMAC tokens, FILETIME, Microsoft UUIDs, CFB `burn`, and `toHexLower` (number padding, not RFC 4648 §8). **LATER** for a byte↔hex pair (`encodeHex` / `decodeHex`) if a caller needs the RFC 4648 §8 encoding rather than a digest (`probe.computeDigest` is SHA-256 hex, one-way).
- **ANSI / display — NEVER.** Strip and SGR are not reversible encodings.
- **Base64 arithmetic — LATER.** `workspace.decodedSize` stays in workspace until a checkout states alphabet and invalid-input behavior; a `*Size` helper is admissible only as the sound triple `size(text) === decode*(text).byteLength` when defined.

## Wave-1 exports

`@orkestrel/codec` `0.0.1` ships:

- `encodeBase64`
- `decodeBase64`
- `encodeBase64Url`
- `decodeBase64Url`
- `isBase64`
- `isBase64Url`

No other symbol.

## Consequences

**Stand up `@orkestrel/codec` as L0 with empty `dependencies`, `lib` ESNext only.** Pure-ES implementation is what makes that `lib` legal: server's Base64 lives in a module that imports `node:net` / `node:events` (`server/src/server/helpers.ts` lines 1, 16–17), so those symbols are not importable into a browser-safe graph today; mcp core is `lib` `ESNext`+`WebWorker` and must stay that way. `atob` in codec would force DOM or WebWorker types onto an L0 leaf and would keep host whitespace/remainder rules that mcp's grammar already refuses.

**`@orkestrel/server` (installed `0.0.16`, catalog L3).** Add `@orkestrel/codec`. Delete the four helpers from `src/server/helpers.ts`. Do not re-export them (`quality.md`: never re-export a dependency's symbol). `signToken` / `verifyToken` / `decodeTokenPayload` call codec; the `try/catch` around `decodeBase64Url` becomes an `undefined` check (today a throw is already swallowed to `undefined`). Tests: `decodeBase64('not base64!')` must expect `undefined`, not `DOMException` (`helpers.test.ts` line 476–477). Guide table rows for the four helpers move to codec. Tightening vs host `atob`: unpadded §4 and whitespace that `atob` may accept become `undefined`; server tests do not pin those inputs; encode paths already emit canonical text.

**`@orkestrel/mcp` (installed `0.0.26`, catalog L3).** Add `@orkestrel/codec`. `encodeSentinel` uses `encodeBase64` on `TextEncoder` bytes; `decodeSentinel` uses `decodeBase64` then `TextDecoder('utf-8', { fatal: true })`. Delete `isStandardBase64`; blob/audio/image validators and the sentinel import `isBase64`. That is a published rename (`mcp.md` documents `isStandardBase64`). Sentinel tests that pin `Y2Fmw6k=` and refuse `SGVsbG8?=` stay green only if codec §4 padding matches the current regex.

**Publish order.** Codec first; server and mcp in parallel after that pin; then catalog downstream that declare those runtime ranges — `@orkestrel/probe` (mcp `^0.0.26`) and `@orkestrel/toolbox` (server `^0.0.16`). mcp's peer on server is not required for this extraction.

**`@orkestrel/browser` does not change in wave 1.** Replacing its decoder with strict `decodeBase64` would fail `helpers.test.ts` (`AQ ID\n`, `AQ!ID`).

**`@orkestrel/msg` does not take the dependency in wave 1.** That swap spends the empty-deps catalog line for an unpublished Base64 semantic.

**Risk that cannot be ruled out.** External (non-fleet) importers of `@orkestrel/server`'s four Base64 helpers or of `isStandardBase64` see a breaking removal with no shim. Fleet checkouts show no other runtime importer. Host `atob` remainder and whitespace behavior is unmeasured on this Node version against the proposed grammar; the only server pin is `not base64!` throws.

## Unknowns

- `msg.decodeBase64` alphabet, padding, whitespace, and invalid-input behavior (guide names the symbol; only `decodeMIMEEncoding(..., 'base64')` is documented as throwing).
- Workspace binary `data` alphabet (standard vs url vs unpadded) and `decodedSize` on invalid text; no workspace checkout.
- Whether any published consumer outside these checkouts imports `encodeBase64` / `decodeBase64` / `encodeBase64Url` / `decodeBase64Url` from `@orkestrel/server` or `isStandardBase64` from `@orkestrel/mcp`.
- Unused-bit (non-zero pad bits, e.g. `YR==`) acceptance: mcp's regex admits those strings; this tree does not pin decode bytes for them. Wave 1 follows the regex, not a stricter unused-bit rule.
