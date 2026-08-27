# U5 report — LSP codec decomposition into the `LSPDecodeState` algebra and the grammar readers

Unit complete. Baseline `05005da`, clean at start. Owned files only. No deviation.

## Touched files

- `src/core/helpers.ts` — adds the five leaves with TSDoc and `@example`; keeps `encodeLSPMessage`
  and `waitForDeadline` unchanged.
- `src/core/parsers.ts` — `parseLSPMessages` keeps the framing spine and calls the leaves.
- `tests/src/core/helpers.test.ts` — adds five `describe` blocks over the leaves.
- `guides/lsp.md` — adds two worked examples in Framing state and five Surface rows.
- `tests/guides.test.ts` — untouched. Neither new fence asserts a value, so the executed-fence law
  obliged no transcription.

## What each leaf owns

| Leaf               | Owns                                                                                                                                                                | Complexity |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| `joinLSPSegments`  | The forward walk of the `previous` chain into one owned buffer of `state.size`.                                                                                     | 2          |
| `takeLSPTail`      | The backwards walk taking `min(count, state.size)` trailing bytes into an owned buffer.                                                                             | 3          |
| `scanLSPBoundary`  | The first `\r\n\r\n` index in a flat buffer, relative to that buffer.                                                                                               | 6          |
| `readLSPHeader`    | The ASCII gate, field splitting, `Content-Length` digits, duplication, safe-integer and content-limit checks, and the whole `Content-Type` media/parameter/charset grammar. | 27         |
| `readLSPBody`      | The fatal UTF-8 decode, `parseJSON`, and the JSON-RPC shape gate; returns the message rather than pushing it.                                                        | 6          |

Stays in `parseLSPMessages`: state chaining, the overlap window and its absolute-offset translation
(`base = previous.size - tail.byteLength`), both `LSP_HEADER_LIMIT` refusals, the boundary
bookkeeping, the `previous === undefined` no-copy ternary at each join call site, the remainder
re-seed, and the loop. No public constructor for `LSPDecodeState`. `src/core/index.ts` and
`src/core/types.ts` are unchanged; the barrel already star-exports `helpers.js`.

## Behavior preservation

Every refusal message string, code, and context shape moved verbatim. Proof by set comparison of
the baseline against the pair of files that now hold them:

```text
$ git show HEAD:src/core/parsers.ts | grep -o "new LSPError('[^']*'" | sort > base-msgs.txt
$ cat src/core/parsers.ts src/core/helpers.ts | grep -o "new LSPError('[^']*'" | sort > new-msgs.txt
$ diff base-msgs.txt new-msgs.txt
0a1,2
> new LSPError('The JSON-RPC message cannot be serialized'
> new LSPError('The JSON-RPC message cannot be serialized'
```

The only difference is `encodeLSPMessage`'s two pre-existing strings, which live in `helpers.ts` and
were never in `parsers.ts`. No parser refusal string was added, removed, or altered.

`joinLSPSegments` is called only where the code already joined: after a boundary is resolved, and
before reading a body. No join runs during an incomplete header, so the 64 KiB header path stays
linear. `takeLSPTail(previous, 3)` allocates at most 3 bytes per chunk, replacing an allocation of
the same size.

## One implementation of the join walk

```text
$ rg -n "cursor\.size - cursor\.bytes\.byteLength|new Uint8Array\((?:state|pending)\.size\)|cursor = cursor\.previous" --glob '*.ts'
src\core\helpers.ts:64:	const joined = new Uint8Array(state.size)
src\core\helpers.ts:67:		joined.set(cursor.bytes, cursor.size - cursor.bytes.byteLength)
src\core\helpers.ts:68:		cursor = cursor.previous
src\core\helpers.ts:102:		cursor = cursor.previous
```

`helpers.ts:64-68` is the sole segment-join walk in the tree. Line 102 is `takeLSPTail`'s backwards
walk, a different operation. The two byte-identical walks at the baseline's `parsers.ts:102-110` and
`:241-250` are gone.

## Unknowns settled before editing

**1. oxlint's `complexity` counts `??` and `?.`, one each.** Probe file
`scratchpad/coalesce.ts`, run at `max=1`:

```text
$ oxlint -c complexity-1.json coalesce.ts
coalesce.ts:7:8: warning eslint(complexity): function `branches` has a complexity of 4. Maximum allowed is 1.
coalesce.ts:15:8: warning eslint(complexity): function `coalesce` has a complexity of 4. Maximum allowed is 1.
coalesce.ts:23:8: warning eslint(complexity): function `optional` has a complexity of 7. Maximum allowed is 1.
```

`branches` (three `if` statements) reads 4, which is the positive control. `coalesce` (three `??`)
also reads 4, so each `??` counts 1. `optional` (three `?.` and three `??`) reads 7, so each `?.`
counts 1 as well. `flat` (a bare `return`) is unreported at `max=1`, so it reads 1 — the low-end
control.

**2. `tests/setupConformance.ts` exercises no framing refusal.** It imports no codec function
(`parseLSPMessages` and `encodeLSPMessage` are absent from the file) and its `LSPErrorCodes` hits are
the installed `vscode-languageserver-protocol` numeric JSON-RPC codes, not this package's `LSPError`.
Its subject is type and constant parity against the installed protocol package. Observation only;
nothing in this unit depends on it.

## Probe readings

Instrument: `.orkestrel/lsp/complexity-probe.sh`, run unchanged (its file list still matches the
tree). Negative control at `max=1` flagged functions in every run, so the instrument fired both
times.

| Function           | Before | After |
| ------------------ | ------ | ----- |
| `parseLSPMessages` | 60     | 19    |
| `joinLSPSegments`  | —      | 2     |
| `takeLSPTail`      | —      | 3     |
| `scanLSPBoundary`  | —      | 6     |
| `readLSPHeader`    | —      | 27    |
| `readLSPBody`      | —      | 6     |

`parseLSPMessages` reads 19, strictly below the binding 30, and it also cleared 20 — the shell no
longer appears in the `max=20` run at all. `readLSPHeader` reads 27, above 20 alone, which D2
Verdict 3 accepts by design and records here. Per-leaf numbers come from a `max=1` run over
`src/core/helpers.ts` and `src/core/parsers.ts`; both probe transcripts are in the final message.

## New tests, and what each refuses

`joinLSPSegments` — copies a single-segment state into an owned buffer (mutating the result leaves
`state.bytes` intact); concatenates a linked chain in arrival order and leaves every segment intact.

`takeLSPTail` — a tail shorter than the newest segment; a tail spanning segments; a count exceeding
the chain returning every retained byte; a zero count returning an empty buffer; an owned buffer
rather than a retained segment; a negative count refused with `RangeError`.

`scanLSPBoundary` — a boundary at index 0; a boundary that ends the buffer; the first of several;
absent in a header without one; three near-misses (`A\r\n\r` truncated, `\r\r\n\n` transposed,
`\r\n\n\r\n` doubled line feed); an empty buffer.

`readLSPHeader` accepts — a plain length, a zero length, the content limit itself, a lowercase field
name, an unknown field, `Content-Type` without parameters, `charset=utf8`, `charset=UTF-8`, and a
parameter other than charset.

`readLSPHeader` refuses, each asserting `code` is `framing` — a non-ASCII byte inside an otherwise
well-formed field; an empty header; a field without a colon; a field without a name; a header with
no `Content-Length`; a repeated `Content-Length`; an empty `Content-Length`; a non-digit
`Content-Length`; a `Content-Length` beyond safe-integer precision; a `Content-Length` above the
limit (asserting `context.value` is `LSP_CONTENT_LIMIT + 1`); a repeated `Content-Type`; an
unsupported media type; a parameter without an equals sign; a repeated charset; a charset other than
UTF-8 (asserting `context.value` is `'utf-16'`). One further case asserts the refusal carries the
messages passed in on a frozen `context.messages`.

`readLSPBody` — returns the decoded message; decodes an astral code point; refuses invalid UTF-8
with `framing`; refuses invalid JSON with `protocol` and `context.code` `JSONRPC_PARSE_ERROR`;
refuses non-JSON-RPC JSON with `protocol` and `context.code` `JSONRPC_INVALID_REQUEST`; carries the
accumulated messages on a frozen `context.messages`.

No test pins a refusal message string, per D2 Verdict 3.

## The tests were proven able to fail

The suite was green on its first run, so two mutation rounds on `src/core/helpers.ts` (my own owned
file, nothing planted anywhere else) certified it. Both mutations were reverted and the suite
re-read green.

Round 1 — `takeLSPTail`'s `Math.min(count, state.size)` replaced by `count`:

```text
Tests  1 failed | 137 passed (138)
FAIL tests/src/core/helpers.test.ts > takeLSPTail > returns every retained byte when the count exceeds the chain
AssertionError: expected [ +0, +0, +0, +0, +0, +0, +0, 1, 2 ] to deeply equal [ 1, 2 ]
```

Two other mutations in that round proved inert and are reported as such rather than as evidence: the
scan loop bound `index + 3 < byteLength` widened to `<=` reads out of range and yields `undefined`,
so it changes nothing; and the ASCII gate `byte > 127` widened to `byte > 255` fell through to the
invalid-field refusal, which the original test could not tell apart because no test may pin a message
string. That inert result exposed a weak assertion, so the non-ASCII test was rewritten to a vector
that is well-formed apart from the high byte (`Content-Length: 2\r\nX-Note: café`), which the ASCII
gate alone refuses.

Round 2 — `scanLSPBoundary` returning `index + 1`, and the ASCII gate at `byte > 255`, with the
rewritten test in place:

```text
Tests  75 failed | 63 passed (138)
FAIL tests/src/core/helpers.test.ts > scanLSPBoundary > finds a boundary at the first index
FAIL tests/src/core/helpers.test.ts > scanLSPBoundary > finds a boundary that ends the buffer
FAIL tests/src/core/helpers.test.ts > scanLSPBoundary > reports the first of several boundaries
FAIL tests/src/core/helpers.test.ts > readLSPHeader > refuses a non-ASCII byte inside an otherwise well-formed field
```

The remaining failures in that round were `LSPClient.test.ts` and `parsers.test.ts` reddening on the
broken boundary index, which is the untouched suite doing its job.

## Commands run, with real counts

| Command                                                        | Result                            |
| -------------------------------------------------------------- | --------------------------------- |
| `npm run lint:check`                                            | green, no diagnostics             |
| `npm run check:src:core`                                        | green, no diagnostics             |
| `npm run test:policy`                                           | 110 passed (110), 1 file          |
| `npm run test:src:core`                                         | 138 passed (138), 5 files         |
| `npm run test:guides`                                           | 25 passed (25), 1 file            |
| `./node_modules/.bin/oxfmt --check` on the four owned files     | "All matched files use the correct format" |

`test:src:core` read 91 passed at the baseline and 138 after, so the leaf tests add 47 cases and the
untouched `tests/src/core/parsers.test.ts` still passes in full. That file does not appear in
`git diff --stat`.

Not run, per the brief: `format`, `lint --fix`, `build`, full `npm test`. The `oxfmt --check` call is
read-only and scoped to the four owned files; it caught one formatting defect (a `readLSPBody`
signature broken across lines that fits in exactly 100 columns) which is now fixed.

## Ancillary decisions

- Neither new guide fence asserts a value, matching the existing Validation fences, so
  `tests/guides.test.ts` needed no transcription and stays untouched.
- `takeLSPTail` documents a negative `count` as a `RangeError` prerequisite rather than clamping it
  or minting a new `LSPError` message. A test pins the refusal.
- The shell names the scan window's absolute start `base` rather than recomputing `previousSize` and
  `overlap` separately, so the offset translation has one source.
- `parseLSPMessages` keeps its `@remarks` verbatim, including the unknown-field rationale.
  `readLSPHeader` states what it tolerates without repeating that rationale.

## `git status --porcelain`

```text
 M guides/lsp.md
 M src/core/helpers.ts
 M src/core/parsers.ts
 M tests/src/core/helpers.test.ts
```

## `git diff --stat`

```text
 guides/lsp.md                  |  40 ++++
 src/core/helpers.ts            | 270 +++++++++++++++++++++++-
 src/core/parsers.ts            | 214 ++-----------------
 tests/src/core/helpers.test.ts | 466 ++++++++++++++++++++++++++++++++++++++++-
 4 files changed, 795 insertions(+), 195 deletions(-)
```

## Full `git diff`

```diff
diff --git a/guides/lsp.md b/guides/lsp.md
index fcdff19..45949b9 100644
--- a/guides/lsp.md
+++ b/guides/lsp.md
@@ -169,6 +169,41 @@ frames. Retained byte segments are owned copies, so caller mutation after parsin
 later continuation. The parser accepts unknown header fields and refuses malformed parameters in a
 known `Content-Type` field. Use `encodeLSPMessage()` to produce a byte-accurate frame.
 
+The operations over a retained state are published beside the codec. `joinLSPSegments()` flattens a
+segment chain into one owned buffer, and `takeLSPTail()` takes that chain's last bytes as an owned
+buffer, which is how a scan window survives a chunk split. `scanLSPBoundary()` reports the first
+`\r\n\r\n` index in a flat buffer, and that index addresses the buffer you passed, so a caller
+scanning a window adds the window's own offset to it.
+
+```ts
+import type { LSPDecodeState } from '@orkestrel/lsp'
+import { joinLSPSegments, scanLSPBoundary, takeLSPTail } from '@orkestrel/lsp'
+
+declare const state: LSPDecodeState
+
+const bytes = joinLSPSegments(state)
+const boundary = scanLSPBoundary(bytes)
+const overlap = takeLSPTail(state, 3)
+```
+
+Reach either grammar directly when you frame the bytes yourself. `readLSPHeader()` reads one header
+block and returns the `Content-Length` it declares. `readLSPBody()` reads the content bytes that
+length measures and returns the validated JSON-RPC message. Each refuses with an `LSPError`, and the
+messages you pass as the second argument travel on that error's `context.messages` property, so a
+caller that has already decoded frames keeps them through a refusal.
+
+```ts
+import { readLSPBody, readLSPHeader } from '@orkestrel/lsp'
+
+const content = '{"jsonrpc":"2.0","method":"initialized"}'
+const encoder = new TextEncoder()
+const body = encoder.encode(content)
+const header = encoder.encode(`Content-Length: ${body.byteLength}`)
+
+const length = readLSPHeader(header, [])
+const message = readLSPBody(body.subarray(0, length), [])
+```
+
 ## Validation
 
 Every payload this package reads off the wire arrives as `unknown`, so each guard narrows one
@@ -305,6 +340,11 @@ The framing, timing, and error surface provides these exports:
 | `encodeLSPMessage` | function  | Encodes a JSON-RPC message into an LSP frame.                 |
 | `parseLSPMessages` | function  | Decodes complete messages and returns retained framing state. |
 | `LSPDecodeState`   | type      | Describes retained incremental framing bytes.                 |
+| `joinLSPSegments`  | function  | Flattens retained decode segments into one owned buffer.      |
+| `takeLSPTail`      | function  | Takes the last retained bytes of a decode state.              |
+| `scanLSPBoundary`  | function  | Finds the first header boundary in a flat buffer.             |
+| `readLSPHeader`    | function  | Reads a header block and returns its declared content length. |
+| `readLSPBody`      | function  | Reads one content body as a validated JSON-RPC message.       |
 | `waitForDeadline`  | function  | Waits for a deadline to elapse without holding the loop open. |
 | `LSPError`         | class     | Reports a package failure with a stable code.                 |
 | `isLSPError`       | function  | Checks for a branded package error.                           |
diff --git a/src/core/helpers.ts b/src/core/helpers.ts
index af92bba..47ecc26 100644
--- a/src/core/helpers.ts
+++ b/src/core/helpers.ts
@@ -1,6 +1,8 @@
-import type { JSONRPCMessage } from './types.js'
-import { JSONRPC_INVALID_REQUEST } from './constants.js'
+import type { JSONRPCMessage, LSPDecodeState } from './types.js'
+import { JSONRPC_INVALID_REQUEST, JSONRPC_PARSE_ERROR, LSP_CONTENT_LIMIT } from './constants.js'
 import { LSPError } from './errors.js'
+import { isJSONRPCNotification, isJSONRPCRequest, isJSONRPCResponse } from './validators.js'
+import { parseJSON } from '@orkestrel/contract'
 
 /**
  * Encodes a JSON-RPC message as one byte-accurate LSP base-protocol frame.
@@ -40,6 +42,270 @@ export function encodeLSPMessage(message: JSONRPCMessage): Uint8Array {
 	return frame
 }
 
+/**
+ * Flattens the retained segments of a decode state into one owned buffer.
+ *
+ * @param state - The decode state whose segment chain is flattened.
+ * @returns The retained bytes in arrival order, in a buffer no state node shares.
+ *
+ * @remarks
+ * The result always owns its bytes, so mutating it never reaches the state. A state with no
+ * `previous` node already holds every retained byte in `bytes`, so a caller that flattens on a hot
+ * path reads `bytes` directly in that case and calls this only for a linked chain.
+ *
+ * @example
+ * ```ts
+ * declare const state: LSPDecodeState
+ *
+ * const bytes = joinLSPSegments(state)
+ * ```
+ */
+export function joinLSPSegments(state: LSPDecodeState): Uint8Array {
+	const joined = new Uint8Array(state.size)
+	let cursor: LSPDecodeState | undefined = state
+	while (cursor !== undefined) {
+		joined.set(cursor.bytes, cursor.size - cursor.bytes.byteLength)
+		cursor = cursor.previous
+	}
+	return joined
+}
+
+/**
+ * Takes the last retained bytes of a decode state as an owned buffer.
+ *
+ * @param state - The decode state whose segment chain is read backwards.
+ * @param count - The most bytes to take. Must be zero or greater.
+ * @returns The last `count` retained bytes, or every retained byte when the chain holds fewer.
+ * @throws {@link RangeError} Thrown when `count` is negative, because a buffer of that length
+ * cannot be allocated.
+ *
+ * @remarks
+ * The walk stops at the first segment that satisfies `count`, so a scan window costs the window
+ * rather than the chain.
+ *
+ * @example
+ * ```ts
+ * declare const state: LSPDecodeState
+ *
+ * const overlap = takeLSPTail(state, 3)
+ * ```
+ */
+export function takeLSPTail(state: LSPDecodeState, count: number): Uint8Array {
+	const size = Math.min(count, state.size)
+	const tail = new Uint8Array(size)
+	let cursor: LSPDecodeState | undefined = state
+	let remaining = size
+	while (cursor !== undefined && remaining > 0) {
+		const taken = Math.min(remaining, cursor.bytes.byteLength)
+		remaining -= taken
+		tail.set(cursor.bytes.subarray(cursor.bytes.byteLength - taken), remaining)
+		cursor = cursor.previous
+	}
+	return tail
+}
+
+/**
+ * Finds the first base-protocol header boundary in a flat buffer.
+ *
+ * @param bytes - The bytes to scan.
+ * @returns The index of the first `\r\n\r\n` sequence, or `undefined` when the buffer holds none.
+ *
+ * @remarks
+ * The index addresses the buffer passed in. A caller scanning a window over a longer stream adds
+ * that window's own offset to the result.
+ *
+ * @example
+ * ```ts
+ * const boundary = scanLSPBoundary(new TextEncoder().encode('Content-Length: 2\r\n\r\n{}'))
+ * ```
+ */
+export function scanLSPBoundary(bytes: Uint8Array): number | undefined {
+	for (let index = 0; index + 3 < bytes.byteLength; index += 1) {
+		if (
+			bytes[index] === 13 &&
+			bytes[index + 1] === 10 &&
+			bytes[index + 2] === 13 &&
+			bytes[index + 3] === 10
+		)
+			return index
+	}
+	return undefined
+}
+
+/**
+ * Reads one base-protocol header block and returns the content length it declares.
+ *
+ * @param header - The header bytes, ending before the `\r\n\r\n` boundary.
+ * @param messages - The messages decoded before this header, attached to a refusal's context.
+ * @returns The declared `Content-Length` in bytes.
+ * @throws {@link LSPError} Thrown with code `framing` for a non-ASCII byte, a field without a name
+ * and a colon, a missing, repeated, empty, non-numeric, or unsafe `Content-Length`, a length above
+ * {@link LSP_CONTENT_LIMIT}, and a repeated `Content-Type`, an unsupported media type, a malformed
+ * parameter, a repeated charset, or a charset other than UTF-8.
+ *
+ * @remarks
+ * Field names are case-insensitive and unknown fields are ignored. `Content-Type` is optional, and
+ * its charset parameter accepts the `utf-8` and `utf8` spellings.
+ *
+ * @example
+ * ```ts
+ * const length = readLSPHeader(new TextEncoder().encode('Content-Length: 2'), [])
+ * ```
+ */
+export function readLSPHeader(header: Uint8Array, messages: readonly JSONRPCMessage[]): number {
+	for (let index = 0; index < header.byteLength; index += 1) {
+		const byte = header[index]
+		if (byte === undefined || byte > 127)
+			throw new LSPError('The LSP header must contain ASCII bytes', {
+				code: 'framing',
+				context: { messages: Object.freeze([...messages]) },
+			})
+	}
+
+	const headerText = new TextDecoder().decode(header)
+	const lines = headerText.split('\r\n')
+	let resolved: number | undefined
+	let contentType = false
+	for (let index = 0; index < lines.length; index += 1) {
+		const line = lines[index]
+		if (line === undefined) continue
+		const separator = line.indexOf(':')
+		if (separator <= 0)
+			throw new LSPError('The LSP header contains an invalid field', {
+				code: 'framing',
+				context: { messages: Object.freeze([...messages]) },
+			})
+		const name = line.slice(0, separator).trim().toLowerCase()
+		const field = line.slice(separator + 1).trim()
+		if (name === 'content-length') {
+			if (resolved !== undefined)
+				throw new LSPError('The LSP header repeats Content-Length', {
+					code: 'framing',
+					context: { messages: Object.freeze([...messages]) },
+				})
+			if (field.length === 0)
+				throw new LSPError('The LSP Content-Length is empty', {
+					code: 'framing',
+					context: { messages: Object.freeze([...messages]) },
+				})
+			for (let digitIndex = 0; digitIndex < field.length; digitIndex += 1) {
+				const digit = field.charCodeAt(digitIndex)
+				if (digit < 48 || digit > 57)
+					throw new LSPError('The LSP Content-Length is invalid', {
+						code: 'framing',
+						context: { messages: Object.freeze([...messages]) },
+					})
+			}
+			const parsed = Number(field)
+			if (!Number.isSafeInteger(parsed))
+				throw new LSPError('The LSP Content-Length is invalid', {
+					code: 'framing',
+					context: { messages: Object.freeze([...messages]) },
+				})
+			if (parsed > LSP_CONTENT_LIMIT)
+				throw new LSPError('The LSP Content-Length exceeds the content limit', {
+					code: 'framing',
+					context: { messages: Object.freeze([...messages]), value: parsed },
+				})
+			resolved = parsed
+			continue
+		}
+		if (name === 'content-type') {
+			if (contentType)
+				throw new LSPError('The LSP header repeats Content-Type', {
+					code: 'framing',
+					context: { messages: Object.freeze([...messages]) },
+				})
+			contentType = true
+			const parts = field.split(';')
+			const media = parts[0]
+			if (media === undefined || media.trim().toLowerCase() !== 'application/vscode-jsonrpc')
+				throw new LSPError('The LSP Content-Type is unsupported', {
+					code: 'framing',
+					context: { messages: Object.freeze([...messages]) },
+				})
+			let charset = false
+			for (let partIndex = 1; partIndex < parts.length; partIndex += 1) {
+				const part = parts[partIndex]
+				if (part === undefined) continue
+				const equals = part.indexOf('=')
+				if (equals < 0)
+					throw new LSPError('The LSP Content-Type parameter is malformed', {
+						code: 'framing',
+						context: { messages: Object.freeze([...messages]) },
+					})
+				const parameter = part.slice(0, equals).trim().toLowerCase()
+				if (parameter !== 'charset') continue
+				if (charset)
+					throw new LSPError('The LSP Content-Type repeats charset', {
+						code: 'framing',
+						context: { messages: Object.freeze([...messages]) },
+					})
+				charset = true
+				const encoding = part
+					.slice(equals + 1)
+					.trim()
+					.toLowerCase()
+				if (encoding !== 'utf-8' && encoding !== 'utf8')
+					throw new LSPError('The LSP Content-Type charset is unsupported', {
+						code: 'framing',
+						context: {
+							messages: Object.freeze([...messages]),
+							value: encoding,
+						},
+					})
+			}
+		}
+	}
+
+	if (resolved === undefined)
+		throw new LSPError('The LSP header requires Content-Length', {
+			code: 'framing',
+			context: { messages: Object.freeze([...messages]) },
+		})
+	return resolved
+}
+
+/**
+ * Reads one base-protocol content body as a validated JSON-RPC message.
+ *
+ * @param body - The content bytes the header's `Content-Length` measures.
+ * @param messages - The messages decoded before this body, attached to a refusal's context.
+ * @returns The decoded request, notification, or response.
+ * @throws {@link LSPError} Thrown with code `framing` when the bytes are not valid UTF-8, and with
+ * code `protocol` when the text is not JSON or the value is not a JSON-RPC message.
+ *
+ * @example
+ * ```ts
+ * const body = new TextEncoder().encode('{"jsonrpc":"2.0","method":"initialized"}')
+ * const message = readLSPBody(body, [])
+ * ```
+ */
+export function readLSPBody(body: Uint8Array, messages: readonly JSONRPCMessage[]): JSONRPCMessage {
+	let text: string
+	try {
+		text = new TextDecoder('utf-8', { fatal: true }).decode(body)
+	} catch (cause) {
+		throw new LSPError('The LSP content is not valid UTF-8', {
+			code: 'framing',
+			context: { messages: Object.freeze([...messages]) },
+			cause,
+		})
+	}
+	const parsed = parseJSON(text)
+	if (parsed === undefined)
+		throw new LSPError('The LSP content is not valid JSON', {
+			code: 'protocol',
+			context: { code: JSONRPC_PARSE_ERROR, messages: Object.freeze([...messages]) },
+		})
+	if (isJSONRPCRequest(parsed) || isJSONRPCNotification(parsed) || isJSONRPCResponse(parsed))
+		return parsed
+	throw new LSPError('The LSP content is not a valid JSON-RPC message', {
+		code: 'protocol',
+		context: { code: JSONRPC_INVALID_REQUEST, messages: Object.freeze([...messages]) },
+	})
+}
+
 /**
  * Waits for a deadline to elapse.
  *
diff --git a/src/core/parsers.ts b/src/core/parsers.ts
index a6c755b..ae7a44f 100644
--- a/src/core/parsers.ts
+++ b/src/core/parsers.ts
@@ -1,13 +1,13 @@
 import type { JSONRPCMessage, LSPDecodeState } from './types.js'
-import {
-	JSONRPC_INVALID_REQUEST,
-	JSONRPC_PARSE_ERROR,
-	LSP_CONTENT_LIMIT,
-	LSP_HEADER_LIMIT,
-} from './constants.js'
+import { LSP_HEADER_LIMIT } from './constants.js'
 import { LSPError } from './errors.js'
-import { isJSONRPCNotification, isJSONRPCRequest, isJSONRPCResponse } from './validators.js'
-import { parseJSON } from '@orkestrel/contract'
+import {
+	joinLSPSegments,
+	readLSPBody,
+	readLSPHeader,
+	scanLSPBoundary,
+	takeLSPTail,
+} from './helpers.js'
 
 /**
  * Parses a byte chunk into complete LSP base-protocol messages and retained decode state.
@@ -56,34 +56,18 @@ export function parseLSPMessages(
 
 		if (boundary === undefined) {
 			const previous = pending.previous
-			const previousSize = previous?.size ?? 0
-			const overlap = Math.min(previousSize, 3)
-			let scan: Uint8Array
-			if (previous === undefined) scan = pending.bytes
-			else {
-				scan = new Uint8Array(overlap + pending.bytes.byteLength)
-				let cursor: LSPDecodeState | undefined = previous
-				let remaining = overlap
-				while (cursor !== undefined && remaining > 0) {
-					const count = Math.min(remaining, cursor.bytes.byteLength)
-					remaining -= count
-					scan.set(cursor.bytes.subarray(cursor.bytes.byteLength - count), remaining)
-					cursor = cursor.previous
-				}
-				scan.set(pending.bytes, overlap)
+			let scan = pending.bytes
+			let base = 0
+			if (previous !== undefined) {
+				const tail = takeLSPTail(previous, 3)
+				scan = new Uint8Array(tail.byteLength + pending.bytes.byteLength)
+				scan.set(tail)
+				scan.set(pending.bytes, tail.byteLength)
+				base = previous.size - tail.byteLength
 			}
 
-			for (let index = 0; index + 3 < scan.byteLength; index += 1) {
-				if (
-					scan[index] === 13 &&
-					scan[index + 1] === 10 &&
-					scan[index + 2] === 13 &&
-					scan[index + 3] === 10
-				) {
-					boundary = previousSize - overlap + index
-					break
-				}
-			}
+			const found = scanLSPBoundary(scan)
+			if (found !== undefined) boundary = base + found
 
 			if (boundary === undefined) {
 				if (pending.size > LSP_HEADER_LIMIT)
@@ -99,128 +83,8 @@ export function parseLSPMessages(
 					context: { messages: Object.freeze([...messages]), value: boundary },
 				})
 
-			if (previous === undefined) joined = pending.bytes
-			else {
-				joined = new Uint8Array(pending.size)
-				let cursor: LSPDecodeState | undefined = pending
-				while (cursor !== undefined) {
-					joined.set(cursor.bytes, cursor.size - cursor.bytes.byteLength)
-					cursor = cursor.previous
-				}
-			}
-
-			const headerBytes = joined.subarray(0, boundary)
-			for (let index = 0; index < headerBytes.byteLength; index += 1) {
-				const byte = headerBytes[index]
-				if (byte === undefined || byte > 127)
-					throw new LSPError('The LSP header must contain ASCII bytes', {
-						code: 'framing',
-						context: { messages: Object.freeze([...messages]) },
-					})
-			}
-
-			const headerText = new TextDecoder().decode(headerBytes)
-			const lines = headerText.split('\r\n')
-			let resolved: number | undefined
-			let contentType = false
-			for (let index = 0; index < lines.length; index += 1) {
-				const line = lines[index]
-				if (line === undefined) continue
-				const separator = line.indexOf(':')
-				if (separator <= 0)
-					throw new LSPError('The LSP header contains an invalid field', {
-						code: 'framing',
-						context: { messages: Object.freeze([...messages]) },
-					})
-				const name = line.slice(0, separator).trim().toLowerCase()
-				const field = line.slice(separator + 1).trim()
-				if (name === 'content-length') {
-					if (resolved !== undefined)
-						throw new LSPError('The LSP header repeats Content-Length', {
-							code: 'framing',
-							context: { messages: Object.freeze([...messages]) },
-						})
-					if (field.length === 0)
-						throw new LSPError('The LSP Content-Length is empty', {
-							code: 'framing',
-							context: { messages: Object.freeze([...messages]) },
-						})
-					for (let digitIndex = 0; digitIndex < field.length; digitIndex += 1) {
-						const digit = field.charCodeAt(digitIndex)
-						if (digit < 48 || digit > 57)
-							throw new LSPError('The LSP Content-Length is invalid', {
-								code: 'framing',
-								context: { messages: Object.freeze([...messages]) },
-							})
-					}
-					const parsed = Number(field)
-					if (!Number.isSafeInteger(parsed))
-						throw new LSPError('The LSP Content-Length is invalid', {
-							code: 'framing',
-							context: { messages: Object.freeze([...messages]) },
-						})
-					if (parsed > LSP_CONTENT_LIMIT)
-						throw new LSPError('The LSP Content-Length exceeds the content limit', {
-							code: 'framing',
-							context: { messages: Object.freeze([...messages]), value: parsed },
-						})
-					resolved = parsed
-					continue
-				}
-				if (name === 'content-type') {
-					if (contentType)
-						throw new LSPError('The LSP header repeats Content-Type', {
-							code: 'framing',
-							context: { messages: Object.freeze([...messages]) },
-						})
-					contentType = true
-					const parts = field.split(';')
-					const media = parts[0]
-					if (media === undefined || media.trim().toLowerCase() !== 'application/vscode-jsonrpc')
-						throw new LSPError('The LSP Content-Type is unsupported', {
-							code: 'framing',
-							context: { messages: Object.freeze([...messages]) },
-						})
-					let charset = false
-					for (let partIndex = 1; partIndex < parts.length; partIndex += 1) {
-						const part = parts[partIndex]
-						if (part === undefined) continue
-						const equals = part.indexOf('=')
-						if (equals < 0)
-							throw new LSPError('The LSP Content-Type parameter is malformed', {
-								code: 'framing',
-								context: { messages: Object.freeze([...messages]) },
-							})
-						const parameter = part.slice(0, equals).trim().toLowerCase()
-						if (parameter !== 'charset') continue
-						if (charset)
-							throw new LSPError('The LSP Content-Type repeats charset', {
-								code: 'framing',
-								context: { messages: Object.freeze([...messages]) },
-							})
-						charset = true
-						const encoding = part
-							.slice(equals + 1)
-							.trim()
-							.toLowerCase()
-						if (encoding !== 'utf-8' && encoding !== 'utf8')
-							throw new LSPError('The LSP Content-Type charset is unsupported', {
-								code: 'framing',
-								context: {
-									messages: Object.freeze([...messages]),
-									value: encoding,
-								},
-							})
-					}
-				}
-			}
-
-			if (resolved === undefined)
-				throw new LSPError('The LSP header requires Content-Length', {
-					code: 'framing',
-					context: { messages: Object.freeze([...messages]) },
-				})
-			length = resolved
+			joined = previous === undefined ? pending.bytes : joinLSPSegments(pending)
+			length = readLSPHeader(joined.subarray(0, boundary), messages)
 			pending = {
 				bytes: joined,
 				size: joined.byteLength,
@@ -238,42 +102,10 @@ export function parseLSPMessages(
 		const frameEnd = bodyStart + length
 		if (pending.size < frameEnd) return [messages, pending]
 
-		if (joined === undefined) {
-			if (pending.previous === undefined) joined = pending.bytes
-			else {
-				joined = new Uint8Array(pending.size)
-				let cursor: LSPDecodeState | undefined = pending
-				while (cursor !== undefined) {
-					joined.set(cursor.bytes, cursor.size - cursor.bytes.byteLength)
-					cursor = cursor.previous
-				}
-			}
-		}
+		if (joined === undefined)
+			joined = pending.previous === undefined ? pending.bytes : joinLSPSegments(pending)
 
-		const body = joined.subarray(bodyStart, frameEnd)
-		let text: string
-		try {
-			text = new TextDecoder('utf-8', { fatal: true }).decode(body)
-		} catch (cause) {
-			throw new LSPError('The LSP content is not valid UTF-8', {
-				code: 'framing',
-				context: { messages: Object.freeze([...messages]) },
-				cause,
-			})
-		}
-		const parsed = parseJSON(text)
-		if (parsed === undefined)
-			throw new LSPError('The LSP content is not valid JSON', {
-				code: 'protocol',
-				context: { code: JSONRPC_PARSE_ERROR, messages: Object.freeze([...messages]) },
-			})
-		if (isJSONRPCRequest(parsed) || isJSONRPCNotification(parsed) || isJSONRPCResponse(parsed))
-			messages.push(parsed)
-		else
-			throw new LSPError('The LSP content is not a valid JSON-RPC message', {
-				code: 'protocol',
-				context: { code: JSONRPC_INVALID_REQUEST, messages: Object.freeze([...messages]) },
-			})
+		messages.push(readLSPBody(joined.subarray(bodyStart, frameEnd), messages))
 
 		if (frameEnd === joined.byteLength) pending = undefined
 		else {
diff --git a/tests/src/core/helpers.test.ts b/tests/src/core/helpers.test.ts
index f71513a..d4fd11c 100644
--- a/tests/src/core/helpers.test.ts
+++ b/tests/src/core/helpers.test.ts
@@ -1,5 +1,17 @@
-import type { JSONRPCNotification } from '@src/core'
-import { encodeLSPMessage, isLSPError, JSONRPC_INVALID_REQUEST, waitForDeadline } from '@src/core'
+import type { JSONRPCNotification, LSPDecodeState } from '@src/core'
+import {
+	encodeLSPMessage,
+	isLSPError,
+	joinLSPSegments,
+	JSONRPC_INVALID_REQUEST,
+	JSONRPC_PARSE_ERROR,
+	LSP_CONTENT_LIMIT,
+	readLSPBody,
+	readLSPHeader,
+	scanLSPBoundary,
+	takeLSPTail,
+	waitForDeadline,
+} from '@src/core'
 import { describe, expect, it } from 'vitest'
 
 describe('encodeLSPMessage', () => {
@@ -38,6 +50,456 @@ describe('encodeLSPMessage', () => {
 	})
 })
 
+describe('joinLSPSegments', () => {
+	it('copies a single-segment state into an owned buffer', () => {
+		const bytes = Uint8Array.of(1, 2, 3)
+		const state: LSPDecodeState = { bytes, size: bytes.byteLength }
+
+		const joined = joinLSPSegments(state)
+
+		expect(Array.from(joined)).toEqual([1, 2, 3])
+		expect(joined).not.toBe(bytes)
+		joined.fill(0)
+		expect(Array.from(bytes)).toEqual([1, 2, 3])
+	})
+
+	it('concatenates a linked chain in arrival order', () => {
+		const first: LSPDecodeState = { bytes: Uint8Array.of(1, 2), size: 2 }
+		const second: LSPDecodeState = { bytes: Uint8Array.of(3), previous: first, size: 3 }
+		const third: LSPDecodeState = { bytes: Uint8Array.of(4, 5), previous: second, size: 5 }
+
+		const joined = joinLSPSegments(third)
+
+		expect(Array.from(joined)).toEqual([1, 2, 3, 4, 5])
+		joined.fill(0)
+		expect(Array.from(first.bytes)).toEqual([1, 2])
+		expect(Array.from(third.bytes)).toEqual([4, 5])
+	})
+})
+
+describe('takeLSPTail', () => {
+	it('takes a tail shorter than the newest segment', () => {
+		const first: LSPDecodeState = { bytes: Uint8Array.of(1, 2, 3), size: 3 }
+		const second: LSPDecodeState = { bytes: Uint8Array.of(4, 5, 6, 7), previous: first, size: 7 }
+
+		expect(Array.from(takeLSPTail(second, 2))).toEqual([6, 7])
+	})
+
+	it('spans segments when the newest holds fewer bytes than the count', () => {
+		const first: LSPDecodeState = { bytes: Uint8Array.of(1, 2, 3), size: 3 }
+		const second: LSPDecodeState = { bytes: Uint8Array.of(4), previous: first, size: 4 }
+		const third: LSPDecodeState = { bytes: Uint8Array.of(5), previous: second, size: 5 }
+
+		expect(Array.from(takeLSPTail(third, 3))).toEqual([3, 4, 5])
+	})
+
+	it('returns every retained byte when the count exceeds the chain', () => {
+		const first: LSPDecodeState = { bytes: Uint8Array.of(1), size: 1 }
+		const second: LSPDecodeState = { bytes: Uint8Array.of(2), previous: first, size: 2 }
+
+		expect(Array.from(takeLSPTail(second, 9))).toEqual([1, 2])
+	})
+
+	it('returns an empty buffer for a zero count', () => {
+		const state: LSPDecodeState = { bytes: Uint8Array.of(1, 2), size: 2 }
+
+		expect(takeLSPTail(state, 0).byteLength).toBe(0)
+	})
+
+	it('returns an owned buffer rather than a retained segment', () => {
+		const bytes = Uint8Array.of(1, 2)
+		const state: LSPDecodeState = { bytes, size: 2 }
+
+		const tail = takeLSPTail(state, 2)
+		tail.fill(0)
+
+		expect(Array.from(bytes)).toEqual([1, 2])
+	})
+
+	it('refuses a negative count', () => {
+		const state: LSPDecodeState = { bytes: Uint8Array.of(1), size: 1 }
+
+		expect(() => takeLSPTail(state, -1)).toThrow(RangeError)
+	})
+})
+
+describe('scanLSPBoundary', () => {
+	it('finds a boundary at the first index', () => {
+		expect(scanLSPBoundary(new TextEncoder().encode('\r\n\r\n{}'))).toBe(0)
+	})
+
+	it('finds a boundary that ends the buffer', () => {
+		expect(scanLSPBoundary(new TextEncoder().encode('AB\r\n\r\n'))).toBe(2)
+	})
+
+	it('reports the first of several boundaries', () => {
+		expect(scanLSPBoundary(new TextEncoder().encode('A\r\n\r\nB\r\n\r\n'))).toBe(1)
+	})
+
+	it('reports no boundary in a header without one', () => {
+		expect(scanLSPBoundary(new TextEncoder().encode('Content-Length: 2\r\n'))).toBeUndefined()
+	})
+
+	it('reports no boundary for a sequence the buffer truncates', () => {
+		expect(scanLSPBoundary(new TextEncoder().encode('A\r\n\r'))).toBeUndefined()
+	})
+
+	it('reports no boundary for a transposed carriage return', () => {
+		expect(scanLSPBoundary(new TextEncoder().encode('\r\r\n\n'))).toBeUndefined()
+	})
+
+	it('reports no boundary for a doubled line feed', () => {
+		expect(scanLSPBoundary(new TextEncoder().encode('\r\n\n\r\n'))).toBeUndefined()
+	})
+
+	it('reports no boundary in an empty buffer', () => {
+		expect(scanLSPBoundary(new Uint8Array(0))).toBeUndefined()
+	})
+})
+
+describe('readLSPHeader', () => {
+	it('reads the declared content length', () => {
+		expect(readLSPHeader(new TextEncoder().encode('Content-Length: 2'), [])).toBe(2)
+	})
+
+	it('reads a zero content length', () => {
+		expect(readLSPHeader(new TextEncoder().encode('Content-Length: 0'), [])).toBe(0)
+	})
+
+	it('reads the content limit itself', () => {
+		const header = new TextEncoder().encode(`Content-Length: ${LSP_CONTENT_LIMIT}`)
+
+		expect(readLSPHeader(header, [])).toBe(LSP_CONTENT_LIMIT)
+	})
+
+	it('matches a field name without regard to case', () => {
+		expect(readLSPHeader(new TextEncoder().encode('content-length: 7'), [])).toBe(7)
+	})
+
+	it('ignores an unknown field', () => {
+		const header = new TextEncoder().encode('Content-Length: 2\r\nX-Trace: 1')
+
+		expect(readLSPHeader(header, [])).toBe(2)
+	})
+
+	it('accepts a supported content type without parameters', () => {
+		const header = new TextEncoder().encode(
+			'Content-Length: 2\r\nContent-Type: application/vscode-jsonrpc',
+		)
+
+		expect(readLSPHeader(header, [])).toBe(2)
+	})
+
+	it('folds the legacy utf8 charset spelling', () => {
+		const header = new TextEncoder().encode(
+			'Content-Length: 2\r\nContent-Type: application/vscode-jsonrpc; charset=utf8',
+		)
+
+		expect(readLSPHeader(header, [])).toBe(2)
+	})
+
+	it('folds an uppercase charset spelling', () => {
+		const header = new TextEncoder().encode(
+			'Content-Length: 2\r\nContent-Type: application/vscode-jsonrpc; charset=UTF-8',
+		)
+
+		expect(readLSPHeader(header, [])).toBe(2)
+	})
+
+	it('ignores a parameter other than charset', () => {
+		const header = new TextEncoder().encode(
+			'Content-Length: 2\r\nContent-Type: application/vscode-jsonrpc; boundary=frame',
+		)
+
+		expect(readLSPHeader(header, [])).toBe(2)
+	})
+
+	it('refuses a non-ASCII byte inside an otherwise well-formed field', () => {
+		const header = new TextEncoder().encode('Content-Length: 2\r\nX-Note: café')
+		let thrown: unknown
+
+		try {
+			readLSPHeader(header, [])
+		} catch (error) {
+			thrown = error
+		}
+		if (!isLSPError(thrown)) throw new Error('Expected a branded LSP error')
+		expect(thrown.code).toBe('framing')
+	})
+
+	it('refuses an empty header', () => {
+		let thrown: unknown
+
+		try {
+			readLSPHeader(new Uint8Array(0), [])
+		} catch (error) {
+			thrown = error
+		}
+		if (!isLSPError(thrown)) throw new Error('Expected a branded LSP error')
+		expect(thrown.code).toBe('framing')
+	})
+
+	it('refuses a field without a colon', () => {
+		let thrown: unknown
+
+		try {
+			readLSPHeader(new TextEncoder().encode('Content-Length'), [])
+		} catch (error) {
+			thrown = error
+		}
+		if (!isLSPError(thrown)) throw new Error('Expected a branded LSP error')
+		expect(thrown.code).toBe('framing')
+	})
+
+	it('refuses a field without a name', () => {
+		let thrown: unknown
+
+		try {
+			readLSPHeader(new TextEncoder().encode(': 2'), [])
+		} catch (error) {
+			thrown = error
+		}
+		if (!isLSPError(thrown)) throw new Error('Expected a branded LSP error')
+		expect(thrown.code).toBe('framing')
+	})
+
+	it('refuses a header without a Content-Length', () => {
+		const header = new TextEncoder().encode('Content-Type: application/vscode-jsonrpc')
+		let thrown: unknown
+
+		try {
+			readLSPHeader(header, [])
+		} catch (error) {
+			thrown = error
+		}
+		if (!isLSPError(thrown)) throw new Error('Expected a branded LSP error')
+		expect(thrown.code).toBe('framing')
+	})
+
+	it('refuses a repeated Content-Length', () => {
+		const header = new TextEncoder().encode('Content-Length: 2\r\nContent-Length: 3')
+		let thrown: unknown
+
+		try {
+			readLSPHeader(header, [])
+		} catch (error) {
+			thrown = error
+		}
+		if (!isLSPError(thrown)) throw new Error('Expected a branded LSP error')
+		expect(thrown.code).toBe('framing')
+	})
+
+	it('refuses an empty Content-Length', () => {
+		let thrown: unknown
+
+		try {
+			readLSPHeader(new TextEncoder().encode('Content-Length:'), [])
+		} catch (error) {
+			thrown = error
+		}
+		if (!isLSPError(thrown)) throw new Error('Expected a branded LSP error')
+		expect(thrown.code).toBe('framing')
+	})
+
+	it('refuses a Content-Length carrying a non-digit', () => {
+		let thrown: unknown
+
+		try {
+			readLSPHeader(new TextEncoder().encode('Content-Length: 12a'), [])
+		} catch (error) {
+			thrown = error
+		}
+		if (!isLSPError(thrown)) throw new Error('Expected a branded LSP error')
+		expect(thrown.code).toBe('framing')
+	})
+
+	it('refuses a Content-Length beyond safe integer precision', () => {
+		let thrown: unknown
+
+		try {
+			readLSPHeader(new TextEncoder().encode('Content-Length: 99999999999999999999'), [])
+		} catch (error) {
+			thrown = error
+		}
+		if (!isLSPError(thrown)) throw new Error('Expected a branded LSP error')
+		expect(thrown.code).toBe('framing')
+	})
+
+	it('refuses a Content-Length above the content limit', () => {
+		const header = new TextEncoder().encode(`Content-Length: ${LSP_CONTENT_LIMIT + 1}`)
+		let thrown: unknown
+
+		try {
+			readLSPHeader(header, [])
+		} catch (error) {
+			thrown = error
+		}
+		if (!isLSPError(thrown)) throw new Error('Expected a branded LSP error')
+		expect(thrown.code).toBe('framing')
+		expect(thrown.context?.value).toBe(LSP_CONTENT_LIMIT + 1)
+	})
+
+	it('refuses a repeated Content-Type', () => {
+		const header = new TextEncoder().encode(
+			'Content-Length: 2\r\nContent-Type: application/vscode-jsonrpc\r\nContent-Type: application/vscode-jsonrpc',
+		)
+		let thrown: unknown
+
+		try {
+			readLSPHeader(header, [])
+		} catch (error) {
+			thrown = error
+		}
+		if (!isLSPError(thrown)) throw new Error('Expected a branded LSP error')
+		expect(thrown.code).toBe('framing')
+	})
+
+	it('refuses an unsupported media type', () => {
+		const header = new TextEncoder().encode('Content-Length: 2\r\nContent-Type: application/json')
+		let thrown: unknown
+
+		try {
+			readLSPHeader(header, [])
+		} catch (error) {
+			thrown = error
+		}
+		if (!isLSPError(thrown)) throw new Error('Expected a branded LSP error')
+		expect(thrown.code).toBe('framing')
+	})
+
+	it('refuses a Content-Type parameter without an equals sign', () => {
+		const header = new TextEncoder().encode(
+			'Content-Length: 2\r\nContent-Type: application/vscode-jsonrpc; charset',
+		)
+		let thrown: unknown
+
+		try {
+			readLSPHeader(header, [])
+		} catch (error) {
+			thrown = error
+		}
+		if (!isLSPError(thrown)) throw new Error('Expected a branded LSP error')
+		expect(thrown.code).toBe('framing')
+	})
+
+	it('refuses a repeated charset parameter', () => {
+		const header = new TextEncoder().encode(
+			'Content-Length: 2\r\nContent-Type: application/vscode-jsonrpc; charset=utf-8; charset=utf-8',
+		)
+		let thrown: unknown
+
+		try {
+			readLSPHeader(header, [])
+		} catch (error) {
+			thrown = error
+		}
+		if (!isLSPError(thrown)) throw new Error('Expected a branded LSP error')
+		expect(thrown.code).toBe('framing')
+	})
+
+	it('refuses a charset other than UTF-8 and reports the spelling it read', () => {
+		const header = new TextEncoder().encode(
+			'Content-Length: 2\r\nContent-Type: application/vscode-jsonrpc; charset=utf-16',
+		)
+		let thrown: unknown
+
+		try {
+			readLSPHeader(header, [])
+		} catch (error) {
+			thrown = error
+		}
+		if (!isLSPError(thrown)) throw new Error('Expected a branded LSP error')
+		expect(thrown.code).toBe('framing')
+		expect(thrown.context?.value).toBe('utf-16')
+	})
+
+	it('attaches the messages decoded before the header to a refusal', () => {
+		const decoded: JSONRPCNotification = { jsonrpc: '2.0', method: 'initialized' }
+		let thrown: unknown
+
+		try {
+			readLSPHeader(new TextEncoder().encode('X-Trace: 1'), [decoded])
+		} catch (error) {
+			thrown = error
+		}
+		if (!isLSPError(thrown)) throw new Error('Expected a branded LSP error')
+		expect(thrown.context?.messages).toEqual([decoded])
+		expect(Object.isFrozen(thrown.context?.messages)).toBe(true)
+	})
+})
+
+describe('readLSPBody', () => {
+	it('returns the decoded JSON-RPC message', () => {
+		const message: JSONRPCNotification = { jsonrpc: '2.0', method: 'initialized' }
+		const body = new TextEncoder().encode(JSON.stringify(message))
+
+		expect(readLSPBody(body, [])).toEqual(message)
+	})
+
+	it('decodes an astral code point', () => {
+		const message: JSONRPCNotification = {
+			jsonrpc: '2.0',
+			method: 'textDocument/publishDiagnostics',
+			params: { message: 'A😀Z' },
+		}
+		const body = new TextEncoder().encode(JSON.stringify(message))
+
+		expect(readLSPBody(body, [])).toEqual(message)
+	})
+
+	it('refuses content that is not valid UTF-8', () => {
+		let thrown: unknown
+
+		try {
+			readLSPBody(Uint8Array.of(123, 255, 125), [])
+		} catch (error) {
+			thrown = error
+		}
+		if (!isLSPError(thrown)) throw new Error('Expected a branded LSP error')
+		expect(thrown.code).toBe('framing')
+	})
+
+	it('refuses content that is not valid JSON', () => {
+		let thrown: unknown
+
+		try {
+			readLSPBody(new TextEncoder().encode('{'), [])
+		} catch (error) {
+			thrown = error
+		}
+		if (!isLSPError(thrown)) throw new Error('Expected a branded LSP error')
+		expect(thrown.code).toBe('protocol')
+		expect(thrown.context?.code).toBe(JSONRPC_PARSE_ERROR)
+	})
+
+	it('refuses JSON that is not a JSON-RPC message', () => {
+		let thrown: unknown
+
+		try {
+			readLSPBody(new TextEncoder().encode('{"jsonrpc":"1.0","method":"initialized"}'), [])
+		} catch (error) {
+			thrown = error
+		}
+		if (!isLSPError(thrown)) throw new Error('Expected a branded LSP error')
+		expect(thrown.code).toBe('protocol')
+		expect(thrown.context?.code).toBe(JSONRPC_INVALID_REQUEST)
+	})
+
+	it('attaches the messages decoded before the body to a refusal', () => {
+		const decoded: JSONRPCNotification = { jsonrpc: '2.0', method: 'initialized' }
+		let thrown: unknown
+
+		try {
+			readLSPBody(new TextEncoder().encode('{'), [decoded])
+		} catch (error) {
+			thrown = error
+		}
+		if (!isLSPError(thrown)) throw new Error('Expected a branded LSP error')
+		expect(thrown.context?.messages).toEqual([decoded])
+		expect(Object.isFrozen(thrown.context?.messages)).toBe(true)
+	})
+})
+
 describe('waitForDeadline', () => {
 	it('resolves no earlier than its deadline', async () => {
 		const started = performance.now()
```
