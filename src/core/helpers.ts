import type { JSONRPCMessage, LSPDecodeState } from './types.js'
import { JSONRPC_INVALID_REQUEST, JSONRPC_PARSE_ERROR, LSP_CONTENT_LIMIT } from './constants.js'
import { LSPError } from './errors.js'
import { isJSONRPCNotification, isJSONRPCRequest, isJSONRPCResponse } from './validators.js'
import { parseJSON } from '@orkestrel/contract'

/**
 * Encodes a JSON-RPC message as one byte-accurate LSP base-protocol frame.
 *
 * @param message - The JSON-RPC message to encode.
 * @returns The ASCII header and UTF-8 content as one byte array.
 * @throws {@link LSPError} Thrown when the message cannot be serialized as JSON.
 *
 * @example
 * ```ts
 * const bytes = encodeLSPMessage({ jsonrpc: '2.0', method: 'initialized' })
 * ```
 */
export function encodeLSPMessage(message: JSONRPCMessage): Uint8Array {
	let content: string | undefined
	try {
		content = JSON.stringify(message)
	} catch (cause) {
		throw new LSPError('The JSON-RPC message cannot be serialized', {
			code: 'protocol',
			context: { code: JSONRPC_INVALID_REQUEST },
			cause,
		})
	}
	if (content === undefined)
		throw new LSPError('The JSON-RPC message cannot be serialized', {
			code: 'protocol',
			context: { code: JSONRPC_INVALID_REQUEST },
		})

	const encoder = new TextEncoder()
	const body = encoder.encode(content)
	const header = encoder.encode(`Content-Length: ${body.byteLength}\r\n\r\n`)
	const frame = new Uint8Array(header.byteLength + body.byteLength)
	frame.set(header)
	frame.set(body, header.byteLength)
	return frame
}

/**
 * Flattens the retained segments of a decode state into one owned buffer.
 *
 * @param state - The decode state whose segment chain is flattened.
 * @returns The retained bytes in arrival order, in a buffer no state node shares.
 *
 * @remarks
 * The result always owns its bytes, so mutating it never reaches the state. A state with no
 * `previous` node already holds every retained byte in `bytes`, so a caller that flattens on a hot
 * path reads `bytes` directly in that case and calls this only for a linked chain.
 *
 * @example
 * ```ts
 * declare const state: LSPDecodeState
 *
 * const bytes = joinLSPSegments(state)
 * ```
 */
export function joinLSPSegments(state: LSPDecodeState): Uint8Array {
	const joined = new Uint8Array(state.size)
	let cursor: LSPDecodeState | undefined = state
	while (cursor !== undefined) {
		joined.set(cursor.bytes, cursor.size - cursor.bytes.byteLength)
		cursor = cursor.previous
	}
	return joined
}

/**
 * Takes the last retained bytes of a decode state as an owned buffer.
 *
 * @param state - The decode state whose segment chain is read backwards.
 * @param count - The most bytes to take. Must be zero or greater.
 * @returns The last `count` retained bytes, or every retained byte when the chain holds fewer.
 * @throws {@link RangeError} Thrown when `count` is negative, because a buffer of that length
 * cannot be allocated.
 *
 * @remarks
 * The walk stops at the first segment that satisfies `count`, so a scan window costs the window
 * rather than the chain.
 *
 * @example
 * ```ts
 * declare const state: LSPDecodeState
 *
 * const overlap = takeLSPTail(state, 3)
 * ```
 */
export function takeLSPTail(state: LSPDecodeState, count: number): Uint8Array {
	const size = Math.min(count, state.size)
	const tail = new Uint8Array(size)
	let cursor: LSPDecodeState | undefined = state
	let remaining = size
	while (cursor !== undefined && remaining > 0) {
		const taken = Math.min(remaining, cursor.bytes.byteLength)
		remaining -= taken
		tail.set(cursor.bytes.subarray(cursor.bytes.byteLength - taken), remaining)
		cursor = cursor.previous
	}
	return tail
}

/**
 * Finds the first base-protocol header boundary in a flat buffer.
 *
 * @param bytes - The bytes to scan.
 * @returns The index of the first `\r\n\r\n` sequence, or `undefined` when the buffer holds none.
 *
 * @remarks
 * The index addresses the buffer passed in. A caller scanning a window over a longer stream adds
 * that window's own offset to the result.
 *
 * @example
 * ```ts
 * const boundary = scanLSPBoundary(new TextEncoder().encode('Content-Length: 2\r\n\r\n{}'))
 * ```
 */
export function scanLSPBoundary(bytes: Uint8Array): number | undefined {
	for (let index = 0; index + 3 < bytes.byteLength; index += 1) {
		if (
			bytes[index] === 13 &&
			bytes[index + 1] === 10 &&
			bytes[index + 2] === 13 &&
			bytes[index + 3] === 10
		)
			return index
	}
	return undefined
}

/**
 * Reads one base-protocol header block and returns the content length it declares.
 *
 * @param header - The header bytes, ending before the `\r\n\r\n` boundary.
 * @param messages - The messages decoded before this header, attached to a refusal's context.
 * Default: an empty list.
 * @returns The declared `Content-Length` in bytes.
 * @throws {@link LSPError} Thrown with code `framing` when the header carries a non-ASCII byte, a
 * field without a name and a colon, a missing, repeated, empty, non-numeric, or unsafe
 * `Content-Length`, a length above {@link LSP_CONTENT_LIMIT}, a repeated `Content-Type`, an
 * unsupported media type, a malformed parameter, a repeated charset, or a charset other than UTF-8.
 *
 * @remarks
 * Field names are case-insensitive and unknown fields are ignored. `Content-Type` is optional, and
 * its charset parameter accepts the `utf-8` and `utf8` spellings.
 *
 * @example
 * ```ts
 * const length = readLSPHeader(new TextEncoder().encode('Content-Length: 2'))
 * ```
 */
export function readLSPHeader(
	header: Uint8Array,
	messages: readonly JSONRPCMessage[] = [],
): number {
	for (let index = 0; index < header.byteLength; index += 1) {
		const byte = header[index]
		if (byte === undefined || byte > 127)
			throw new LSPError('The LSP header must contain ASCII bytes', {
				code: 'framing',
				context: { messages: Object.freeze([...messages]) },
			})
	}

	const headerText = new TextDecoder().decode(header)
	const lines = headerText.split('\r\n')
	let resolved: number | undefined
	let contentType = false
	for (let index = 0; index < lines.length; index += 1) {
		const line = lines[index]
		if (line === undefined) continue
		const separator = line.indexOf(':')
		if (separator <= 0)
			throw new LSPError('The LSP header contains an invalid field', {
				code: 'framing',
				context: { messages: Object.freeze([...messages]) },
			})
		const name = line.slice(0, separator).trim().toLowerCase()
		const field = line.slice(separator + 1).trim()
		if (name === 'content-length') {
			if (resolved !== undefined)
				throw new LSPError('The LSP header repeats Content-Length', {
					code: 'framing',
					context: { messages: Object.freeze([...messages]) },
				})
			if (field.length === 0)
				throw new LSPError('The LSP Content-Length is empty', {
					code: 'framing',
					context: { messages: Object.freeze([...messages]) },
				})
			for (let digitIndex = 0; digitIndex < field.length; digitIndex += 1) {
				const digit = field.charCodeAt(digitIndex)
				if (digit < 48 || digit > 57)
					throw new LSPError('The LSP Content-Length is invalid', {
						code: 'framing',
						context: { messages: Object.freeze([...messages]) },
					})
			}
			const parsed = Number(field)
			if (!Number.isSafeInteger(parsed))
				throw new LSPError('The LSP Content-Length is invalid', {
					code: 'framing',
					context: { messages: Object.freeze([...messages]) },
				})
			if (parsed > LSP_CONTENT_LIMIT)
				throw new LSPError('The LSP Content-Length exceeds the content limit', {
					code: 'framing',
					context: { messages: Object.freeze([...messages]), value: parsed },
				})
			resolved = parsed
			continue
		}
		if (name === 'content-type') {
			if (contentType)
				throw new LSPError('The LSP header repeats Content-Type', {
					code: 'framing',
					context: { messages: Object.freeze([...messages]) },
				})
			contentType = true
			const parts = field.split(';')
			const media = parts[0]
			if (media === undefined || media.trim().toLowerCase() !== 'application/vscode-jsonrpc')
				throw new LSPError('The LSP Content-Type is unsupported', {
					code: 'framing',
					context: { messages: Object.freeze([...messages]) },
				})
			let charset = false
			for (let partIndex = 1; partIndex < parts.length; partIndex += 1) {
				const part = parts[partIndex]
				if (part === undefined) continue
				const equals = part.indexOf('=')
				if (equals < 0)
					throw new LSPError('The LSP Content-Type parameter is malformed', {
						code: 'framing',
						context: { messages: Object.freeze([...messages]) },
					})
				const parameter = part.slice(0, equals).trim().toLowerCase()
				if (parameter !== 'charset') continue
				if (charset)
					throw new LSPError('The LSP Content-Type repeats charset', {
						code: 'framing',
						context: { messages: Object.freeze([...messages]) },
					})
				charset = true
				const encoding = part
					.slice(equals + 1)
					.trim()
					.toLowerCase()
				if (encoding !== 'utf-8' && encoding !== 'utf8')
					throw new LSPError('The LSP Content-Type charset is unsupported', {
						code: 'framing',
						context: {
							messages: Object.freeze([...messages]),
							value: encoding,
						},
					})
			}
		}
	}

	if (resolved === undefined)
		throw new LSPError('The LSP header requires Content-Length', {
			code: 'framing',
			context: { messages: Object.freeze([...messages]) },
		})
	return resolved
}

/**
 * Reads one base-protocol content body as a validated JSON-RPC message.
 *
 * @param body - The content bytes the header's `Content-Length` measures.
 * @param messages - The messages decoded before this body, attached to a refusal's context.
 * Default: an empty list.
 * @returns The decoded request, notification, or response.
 * @throws {@link LSPError} Thrown with code `framing` when the bytes are not valid UTF-8, and with
 * code `protocol` when the text is not JSON or the value is not a JSON-RPC message.
 *
 * @example
 * ```ts
 * const body = new TextEncoder().encode('{"jsonrpc":"2.0","method":"initialized"}')
 * const message = readLSPBody(body)
 * ```
 */
export function readLSPBody(
	body: Uint8Array,
	messages: readonly JSONRPCMessage[] = [],
): JSONRPCMessage {
	let text: string
	try {
		text = new TextDecoder('utf-8', { fatal: true }).decode(body)
	} catch (cause) {
		throw new LSPError('The LSP content is not valid UTF-8', {
			code: 'framing',
			context: { messages: Object.freeze([...messages]) },
			cause,
		})
	}
	const parsed = parseJSON(text)
	if (parsed === undefined)
		throw new LSPError('The LSP content is not valid JSON', {
			code: 'protocol',
			context: { code: JSONRPC_PARSE_ERROR, messages: Object.freeze([...messages]) },
		})
	if (isJSONRPCRequest(parsed) || isJSONRPCNotification(parsed) || isJSONRPCResponse(parsed))
		return parsed
	throw new LSPError('The LSP content is not a valid JSON-RPC message', {
		code: 'protocol',
		context: { code: JSONRPC_INVALID_REQUEST, messages: Object.freeze([...messages]) },
	})
}

/**
 * Waits for a deadline to elapse.
 *
 * @param timeout - The number of milliseconds to wait.
 * @returns A promise that resolves after the deadline elapses, and never rejects.
 *
 * @remarks
 * The deadline is armed with `AbortSignal.timeout`, whose timer does not hold the host event loop
 * open. A caller that wins its race against this promise therefore has nothing to clear, and the
 * losing deadline delays no exit.
 *
 * @example
 * ```ts
 * declare const work: Promise<void>
 *
 * await Promise.race([work, waitForDeadline(30_000)])
 * ```
 */
export function waitForDeadline(timeout: number): Promise<void> {
	const deadline = AbortSignal.timeout(timeout)
	return new Promise<void>((resolve) => {
		deadline.addEventListener('abort', () => resolve(), { once: true })
	})
}
