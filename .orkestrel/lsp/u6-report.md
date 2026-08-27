# U6 report — the accepted A1 findings landed

Every accepted finding is implemented as prescribed. No deviation: no prescription conflicted with a
rule or with the code. All scoped gates are green, and each new pin was mutation-probed and
restored.

## Per-finding disposition

| Finding | Disposition | Where |
| ------- | ----------- | ----- |
| F1 | Implemented. The prescribed precondition sentence is the operations paragraph's last sentence, verbatim. The own-framing fence now encodes one frame with `encodeLSPMessage`, scans it with `scanLSPBoundary`, and slices `frame.subarray(0, boundary)` and `frame.subarray(boundary + 4, boundary + 4 + length)`. The fence's two values are stated after it and asserted in `tests/guides.test.ts`. | `guides/lsp.md`, `tests/guides.test.ts` |
| F2 | Implemented, condition first: "when you pass a `messages` argument it travels on that error's `context.messages` property". | `guides/lsp.md` |
| F3 | Implemented verbatim. | `guides/lsp.md` |
| F4 | Implemented verbatim. | `guides/lsp.md` |
| F5 | Implemented. `readLSPHeader`'s `@throws` reads "Thrown with code `framing` when the header carries …" over the same refusal list; `parseLSPMessages`'s `@throws` reads "Thrown when the framing, the UTF-8 content, the JSON text, or the JSON-RPC message shape is invalid." | `src/core/helpers.ts`, `src/core/parsers.ts` |
| F6 | Implemented verbatim, plus the binding case `accepts either diagnostic code type and refuses a third`. | `src/core/validators.ts`, `tests/src/core/validators.test.ts` |
| F7 | Implemented. `ms` renamed to `timeout` in the declaration, the body, and the `@param`; the doc sentence is unchanged. | `src/core/helpers.ts` |
| F8 | Implemented. The formatter repads the whole column, so that table's rows moved with it. | `guides/lsp.md` |
| F9 | Implemented. Both readers take `messages: readonly JSONRPCMessage[] = []`, documented "Default: an empty list." The guide fence and both TSDoc examples now omit the argument. | `src/core/helpers.ts`, `guides/lsp.md` |
| F11 | Implemented as one `//` comment above the `encoding` getter's return, naming `utf-16` as the protocol's own default for a server that omitted `positionEncoding`, not this client's advertisement. | `src/core/LSPClient.ts` |

## Judgment calls inside the prescriptions

- F1's fence guards the `scanLSPBoundary` result with `if (boundary !== undefined)`, because the
  function returns `number | undefined` and the fence must stay honest TypeScript.
- The rewritten fence became value-asserting, which the brief's scope anticipated, so
  `tests/guides.test.ts` gained a transcription: the executed assertion reads `40` and
  `initialized` from the real codec, and a whitespace-normalized presence check guards the F1
  sentence.
- F9's TSDoc examples on both readers dropped their `[]` argument so the documented default and the
  documented call agree.

## Commands and counts

Run from `C:\Users\mikes\WebstormProjects\lsp` on 2026-08-26, Windows 11, baseline `e5dfac7`.

| Command | Result |
| ------- | ------ |
| `oxlint --config .oxlintrc.json --deny-warnings .` | exit 0 |
| `tsc --noEmit -p configs/src/tsconfig.core.json` (`check:src:core`) | exit 0 |
| `tsc --noEmit -p tsconfig.json` (root, covers the two test files) | exit 0 |
| `npm run test:src:core` | `5 passed (5)` files, `139 passed (139)` tests |
| `npm run test:guides` | `1 passed (1)` file, `27 passed (27)` tests |
| `oxfmt --config .oxfmtrc.json --check .` | `All matched files use the correct format`, 154 files, exit 0 |

Baseline counts for comparison: core was 138, guides was 25. The three added tests are the F6 case
and the two framing-fence transcription cases.

## Instrument controls

The lint gate prints nothing on success, so it was controlled before being believed: a planted
`const unused = 1` in `tmp/probe/lintcontrol.ts` reported
`eslint(no-unused-vars)` and exit 1; the file was deleted.

Each new pin was proved able to fail, then restored by the exact inverse edit:

| Pin | Seeded mutation | Reading | Restored |
| --- | --------------- | ------- | -------- |
| F6 case | `unionOf(isNumber, isString, isBoolean)` in `isLSPDiagnostic` | `1 failed \| 138 passed (139)`, failing `accepts either diagnostic code type and refuses a third` at `validators.test.ts:213` | yes |
| Fence transcription (values) | `scanLSPBoundary` returning `index + 1` | `1 failed \| 26 passed (27)`, the offsets test failing inside `readLSPBody` | yes |
| Fence transcription (prose) | guide sentence changed to `boundary + 5` | `1 failed \| 26 passed (27)`, failing the `toContain` presence check | yes |

After restoration: `139 passed (139)` and `27 passed (27)`, and `git status --porcelain` names only
the seven owned files.

## `git status --porcelain`

```text
 M guides/lsp.md
 M src/core/LSPClient.ts
 M src/core/helpers.ts
 M src/core/parsers.ts
 M src/core/validators.ts
 M tests/guides.test.ts
 M tests/src/core/validators.test.ts
?? .orkestrel/lsp/a1-audit-brief.md
?? .orkestrel/lsp/a1-checker-report.md
?? .orkestrel/lsp/a1-objective-verdicts.md
?? .orkestrel/lsp/a1-subjective-verdicts.md
?? .orkestrel/lsp/campaign-audit-verdict.md
?? .orkestrel/lsp/u6-brief.md
```

The untracked `.orkestrel/lsp/*` files are the Orchestrator's campaign artifacts, present before
this unit wrote anything. This unit created and removed `tmp/probe/lintcontrol.ts` and left the
git-ignored `tmp/probe/` directory in place.

## `git diff --stat`

```text
 guides/lsp.md                     | 70 +++++++++++++++++++++------------------
 src/core/LSPClient.ts             |  2 ++
 src/core/helpers.ts               | 30 +++++++++++------
 src/core/parsers.ts               |  3 +-
 src/core/validators.ts            |  2 +-
 tests/guides.test.ts              | 34 ++++++++++++++++++-
 tests/src/core/validators.test.ts |  6 ++++
 7 files changed, 100 insertions(+), 47 deletions(-)
```

## `git diff`

````diff
diff --git a/guides/lsp.md b/guides/lsp.md
index 45949b9..fca3c24 100644
--- a/guides/lsp.md
+++ b/guides/lsp.md
@@ -169,11 +169,13 @@ frames. Retained byte segments are owned copies, so caller mutation after parsin
 later continuation. The parser accepts unknown header fields and refuses malformed parameters in a
 known `Content-Type` field. Use `encodeLSPMessage()` to produce a byte-accurate frame.
 
-The operations over a retained state are published beside the codec. `joinLSPSegments()` flattens a
-segment chain into one owned buffer, and `takeLSPTail()` takes that chain's last bytes as an owned
-buffer, which is how a scan window survives a chunk split. `scanLSPBoundary()` reports the first
-`\r\n\r\n` index in a flat buffer, and that index addresses the buffer you passed, so a caller
-scanning a window adds the window's own offset to it.
+The core package publishes the operations over a retained state beside the codec.
+`joinLSPSegments()` flattens a segment chain into one owned buffer, and `takeLSPTail()` takes that
+chain's last bytes as an owned buffer, which is how a scan window survives a chunk split.
+`scanLSPBoundary()` reports the first `\r\n\r\n` index in a flat buffer, and that index addresses
+the buffer you passed, so a caller scanning a window adds the window's own offset to it.
+`scanLSPBoundary()` returns the boundary's index, so `bytes.subarray(0, boundary)` is the block
+`readLSPHeader()` reads and the body starts at `boundary + 4`.
 
 ```ts
 import type { LSPDecodeState } from '@orkestrel/lsp'
@@ -186,24 +188,26 @@ const boundary = scanLSPBoundary(bytes)
 const overlap = takeLSPTail(state, 3)
 ```
 
-Reach either grammar directly when you frame the bytes yourself. `readLSPHeader()` reads one header
-block and returns the `Content-Length` it declares. `readLSPBody()` reads the content bytes that
-length measures and returns the validated JSON-RPC message. Each refuses with an `LSPError`, and the
-messages you pass as the second argument travel on that error's `context.messages` property, so a
-caller that has already decoded frames keeps them through a refusal.
+When you frame the bytes yourself, reach the header and body grammars directly. `readLSPHeader()`
+reads one header block and returns the `Content-Length` it declares. `readLSPBody()` reads the
+content bytes that length measures and returns the validated JSON-RPC message. Each refuses with an
+`LSPError`, and when you pass a `messages` argument it travels on that error's `context.messages`
+property, so a caller that has already decoded frames keeps them through a refusal.
 
 ```ts
-import { readLSPBody, readLSPHeader } from '@orkestrel/lsp'
+import { encodeLSPMessage, readLSPBody, readLSPHeader, scanLSPBoundary } from '@orkestrel/lsp'
 
-const content = '{"jsonrpc":"2.0","method":"initialized"}'
-const encoder = new TextEncoder()
-const body = encoder.encode(content)
-const header = encoder.encode(`Content-Length: ${body.byteLength}`)
+const frame = encodeLSPMessage({ jsonrpc: '2.0', method: 'initialized' })
+const boundary = scanLSPBoundary(frame)
 
-const length = readLSPHeader(header, [])
-const message = readLSPBody(body.subarray(0, length), [])
+if (boundary !== undefined) {
+	const length = readLSPHeader(frame.subarray(0, boundary))
+	const message = readLSPBody(frame.subarray(boundary + 4, boundary + 4 + length))
+}
 ```
 
+`length` reads `40`, the encoded body's byte length, and `message.method` reads `initialized`.
+
 ## Validation
 
 Every payload this package reads off the wire arrives as `unknown`, so each guard narrows one
@@ -335,22 +339,22 @@ The client surface provides these entities and configuration contracts:
 
 The framing, timing, and error surface provides these exports:
 
-| Export             | Kind      | Purpose                                                       |
-| ------------------ | --------- | ------------------------------------------------------------- |
-| `encodeLSPMessage` | function  | Encodes a JSON-RPC message into an LSP frame.                 |
-| `parseLSPMessages` | function  | Decodes complete messages and returns retained framing state. |
-| `LSPDecodeState`   | type      | Describes retained incremental framing bytes.                 |
-| `joinLSPSegments`  | function  | Flattens retained decode segments into one owned buffer.      |
-| `takeLSPTail`      | function  | Takes the last retained bytes of a decode state.              |
-| `scanLSPBoundary`  | function  | Finds the first header boundary in a flat buffer.             |
-| `readLSPHeader`    | function  | Reads a header block and returns its declared content length. |
-| `readLSPBody`      | function  | Reads one content body as a validated JSON-RPC message.       |
-| `waitForDeadline`  | function  | Waits for a deadline to elapse without holding the loop open. |
-| `LSPError`         | class     | Reports a package failure with a stable code.                 |
-| `isLSPError`       | function  | Checks for a branded package error.                           |
-| `LSPErrorCode`     | type      | Lists stable package error codes.                             |
-| `LSPErrorContext`  | interface | Describes structured error details.                           |
-| `LSPErrorOptions`  | interface | Configures a package error.                                   |
+| Export             | Kind      | Purpose                                                                  |
+| ------------------ | --------- | ------------------------------------------------------------------------ |
+| `encodeLSPMessage` | function  | Encodes a JSON-RPC message into an LSP frame.                            |
+| `parseLSPMessages` | function  | Decodes complete messages and returns retained framing state.            |
+| `LSPDecodeState`   | type      | Describes retained incremental framing bytes.                            |
+| `joinLSPSegments`  | function  | Flattens retained decode segments into one owned buffer.                 |
+| `takeLSPTail`      | function  | Takes the last retained bytes of a decode state.                         |
+| `scanLSPBoundary`  | function  | Finds the first header boundary in a flat buffer.                        |
+| `readLSPHeader`    | function  | Reads a header block and returns its declared content length.            |
+| `readLSPBody`      | function  | Reads one content body as a validated JSON-RPC message.                  |
+| `waitForDeadline`  | function  | Waits for a deadline to elapse without holding the host event loop open. |
+| `LSPError`         | class     | Reports a package failure with a stable code.                            |
+| `isLSPError`       | function  | Checks for a branded package error.                                      |
+| `LSPErrorCode`     | type      | Lists stable package error codes.                                        |
+| `LSPErrorContext`  | interface | Describes structured error details.                                      |
+| `LSPErrorOptions`  | interface | Configures a package error.                                              |
 
 The JSON-RPC and initialization surface provides these payload types:
 
diff --git a/src/core/LSPClient.ts b/src/core/LSPClient.ts
index f8eb0ec..beb6aa1 100644
--- a/src/core/LSPClient.ts
+++ b/src/core/LSPClient.ts
@@ -145,6 +145,8 @@ export class LSPClient implements LSPClientInterface {
 	}
 
 	get encoding(): LSPPositionEncoding | undefined {
+		// `utf-16` here is the protocol's own default for a server that omitted `positionEncoding`,
+		// not this client's advertisement.
 		return (
 			this.#capabilities?.positionEncoding ??
 			(this.#capabilities === undefined ? undefined : 'utf-16')
diff --git a/src/core/helpers.ts b/src/core/helpers.ts
index 47ecc26..eef5895 100644
--- a/src/core/helpers.ts
+++ b/src/core/helpers.ts
@@ -137,11 +137,12 @@ export function scanLSPBoundary(bytes: Uint8Array): number | undefined {
  *
  * @param header - The header bytes, ending before the `\r\n\r\n` boundary.
  * @param messages - The messages decoded before this header, attached to a refusal's context.
+ * Default: an empty list.
  * @returns The declared `Content-Length` in bytes.
- * @throws {@link LSPError} Thrown with code `framing` for a non-ASCII byte, a field without a name
- * and a colon, a missing, repeated, empty, non-numeric, or unsafe `Content-Length`, a length above
- * {@link LSP_CONTENT_LIMIT}, and a repeated `Content-Type`, an unsupported media type, a malformed
- * parameter, a repeated charset, or a charset other than UTF-8.
+ * @throws {@link LSPError} Thrown with code `framing` when the header carries a non-ASCII byte, a
+ * field without a name and a colon, a missing, repeated, empty, non-numeric, or unsafe
+ * `Content-Length`, a length above {@link LSP_CONTENT_LIMIT}, a repeated `Content-Type`, an
+ * unsupported media type, a malformed parameter, a repeated charset, or a charset other than UTF-8.
  *
  * @remarks
  * Field names are case-insensitive and unknown fields are ignored. `Content-Type` is optional, and
@@ -149,10 +150,13 @@ export function scanLSPBoundary(bytes: Uint8Array): number | undefined {
  *
  * @example
  * ```ts
- * const length = readLSPHeader(new TextEncoder().encode('Content-Length: 2'), [])
+ * const length = readLSPHeader(new TextEncoder().encode('Content-Length: 2'))
  * ```
  */
-export function readLSPHeader(header: Uint8Array, messages: readonly JSONRPCMessage[]): number {
+export function readLSPHeader(
+	header: Uint8Array,
+	messages: readonly JSONRPCMessage[] = [],
+): number {
 	for (let index = 0; index < header.byteLength; index += 1) {
 		const byte = header[index]
 		if (byte === undefined || byte > 127)
@@ -271,6 +275,7 @@ export function readLSPHeader(header: Uint8Array, messages: readonly JSONRPCMess
  *
  * @param body - The content bytes the header's `Content-Length` measures.
  * @param messages - The messages decoded before this body, attached to a refusal's context.
+ * Default: an empty list.
  * @returns The decoded request, notification, or response.
  * @throws {@link LSPError} Thrown with code `framing` when the bytes are not valid UTF-8, and with
  * code `protocol` when the text is not JSON or the value is not a JSON-RPC message.
@@ -278,10 +283,13 @@ export function readLSPHeader(header: Uint8Array, messages: readonly JSONRPCMess
  * @example
  * ```ts
  * const body = new TextEncoder().encode('{"jsonrpc":"2.0","method":"initialized"}')
- * const message = readLSPBody(body, [])
+ * const message = readLSPBody(body)
  * ```
  */
-export function readLSPBody(body: Uint8Array, messages: readonly JSONRPCMessage[]): JSONRPCMessage {
+export function readLSPBody(
+	body: Uint8Array,
+	messages: readonly JSONRPCMessage[] = [],
+): JSONRPCMessage {
 	let text: string
 	try {
 		text = new TextDecoder('utf-8', { fatal: true }).decode(body)
@@ -309,7 +317,7 @@ export function readLSPBody(body: Uint8Array, messages: readonly JSONRPCMessage[
 /**
  * Waits for a deadline to elapse.
  *
- * @param ms - The number of milliseconds to wait.
+ * @param timeout - The number of milliseconds to wait.
  * @returns A promise that resolves after the deadline elapses, and never rejects.
  *
  * @remarks
@@ -324,8 +332,8 @@ export function readLSPBody(body: Uint8Array, messages: readonly JSONRPCMessage[
  * await Promise.race([work, waitForDeadline(30_000)])
  * ```
  */
-export function waitForDeadline(ms: number): Promise<void> {
-	const deadline = AbortSignal.timeout(ms)
+export function waitForDeadline(timeout: number): Promise<void> {
+	const deadline = AbortSignal.timeout(timeout)
 	return new Promise<void>((resolve) => {
 		deadline.addEventListener('abort', () => resolve(), { once: true })
 	})
diff --git a/src/core/parsers.ts b/src/core/parsers.ts
index ae7a44f..219ca74 100644
--- a/src/core/parsers.ts
+++ b/src/core/parsers.ts
@@ -22,7 +22,8 @@ import {
  * @param chunk - The next transport bytes.
  * @param state - Incomplete decode state returned by the preceding call. Default: `undefined`.
  * @returns The complete messages and the state required by the next call.
- * @throws {@link LSPError} Thrown for invalid framing, UTF-8, JSON, or JSON-RPC message shapes.
+ * @throws {@link LSPError} Thrown when the framing, the UTF-8 content, the JSON text, or the
+ * JSON-RPC message shape is invalid.
  *
  * @example
  * ```ts
diff --git a/src/core/validators.ts b/src/core/validators.ts
index 09cb2c8..a48145b 100644
--- a/src/core/validators.ts
+++ b/src/core/validators.ts
@@ -171,7 +171,7 @@ export function isLSPDiagnostic(value: unknown): value is LSPDiagnostic {
 	return holds(() => {
 		if (!isLSPRange(value.range) || !isString(value.message)) return false
 		if (!optionalOf(literalOf(1, 2, 3, 4))(value.severity)) return false
-		if (value.code !== undefined && !isNumber(value.code) && !isString(value.code)) return false
+		if (!optionalOf(unionOf(isNumber, isString))(value.code)) return false
 		if (value.codeDescription !== undefined && !isLSPCodeDescription(value.codeDescription))
 			return false
 		if (value.source !== undefined && !isString(value.source)) return false
diff --git a/tests/guides.test.ts b/tests/guides.test.ts
index 7532582..d7a09ae 100644
--- a/tests/guides.test.ts
+++ b/tests/guides.test.ts
@@ -3,7 +3,14 @@
 // package's own, and are the only part a sibling package changes.
 
 import { describe, expect, it } from 'vitest'
-import { LSP_CAPABILITIES } from '@src/core'
+import {
+	encodeLSPMessage,
+	isJSONRPCNotification,
+	LSP_CAPABILITIES,
+	readLSPBody,
+	readLSPHeader,
+	scanLSPBoundary,
+} from '@src/core'
 import {
 	createGuide,
 	createSource,
@@ -76,6 +83,31 @@ describe('advertised position encodings', () => {
 	})
 })
 
+// The framing guide's own-framing fence claims the offsets a caller slices a frame at, and the two
+// values that slicing yields. Parity proves those names resolve, so the fence is transcribed here
+// and its claimed values are asserted against what the codec returns.
+describe('framing bytes yourself', () => {
+	it('reads the declared length and the framed message at the boundary offsets', () => {
+		const frame = encodeLSPMessage({ jsonrpc: '2.0', method: 'initialized' })
+		const boundary = requireValue(scanLSPBoundary(frame), 'Missing header boundary')
+		const length = readLSPHeader(frame.subarray(0, boundary))
+		const message = readLSPBody(frame.subarray(boundary + 4, boundary + 4 + length))
+
+		expect(length).toBe(40)
+		expect(isJSONRPCNotification(message) ? message.method : undefined).toBe('initialized')
+	})
+
+	it('states those offsets in the framing guide', () => {
+		const text = requireValue(files['guides/lsp.md'], 'Missing file: guides/lsp.md').replace(
+			/\s+/g,
+			' ',
+		)
+		expect(text).toContain(
+			'`bytes.subarray(0, boundary)` is the block `readLSPHeader()` reads and the body starts at `boundary + 4`.',
+		)
+	})
+})
+
 for (const entry of manifest) {
 	const guide = createGuide(requireValue(files[entry.spec], `Missing file: ${entry.spec}`))
 	const source = createSource({ files, module: entry.source })
diff --git a/tests/src/core/validators.test.ts b/tests/src/core/validators.test.ts
index 6c3dc51..121bbed 100644
--- a/tests/src/core/validators.test.ts
+++ b/tests/src/core/validators.test.ts
@@ -207,6 +207,12 @@ describe('LSP wire element and literal boundaries', () => {
 		expect(isLSPServerCapabilities({ textDocumentSync: undefined })).toBe(true)
 	})
 
+	it('accepts either diagnostic code type and refuses a third', () => {
+		expect(isLSPDiagnostic({ ...diagnostic, code: 'TS2304' })).toBe(true)
+		expect(isLSPDiagnostic({ ...diagnostic, code: 2304 })).toBe(true)
+		expect(isLSPDiagnostic({ ...diagnostic, code: true })).toBe(false)
+	})
+
 	it('refuses a prototype-carrying instance and accepts an unknown extra member', () => {
 		expect(isLSPRange(new WireRange())).toBe(false)
 		expect(isLSPRange({ ...new WireRange() })).toBe(true)
````
