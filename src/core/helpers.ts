import type { JSONRPCMessage } from '@orkestrel/jsonrpc'
import type { LSPDecodeState } from './types.js'
import { LSP_CONTENT_LIMIT } from './constants.js'
import { LSPError } from './errors.js'
import { isJSONRPCMessage, JSONRPC_INVALID_REQUEST, JSONRPC_PARSE_ERROR } from '@orkestrel/jsonrpc'
import { attempt, isNumber, parseJSON } from '@orkestrel/contract'

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
	const serialized = attempt(() => JSON.stringify(message))
	if (!serialized.success) {
		throw new LSPError('The JSON-RPC message cannot be serialized', {
			code: 'protocol',
			context: { code: JSONRPC_INVALID_REQUEST },
			cause: serialized.error,
		})
	}
	const content = serialized.value
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
 * Appends an owned byte segment while retaining the preceding framing metadata.
 *
 * @remarks
 * An empty chunk preserves the preceding state by identity, including its absence.
 *
 * @example
 * ```ts
 * const state = buildLSPSegment(undefined, new TextEncoder().encode('Content-'))
 * ```
 */
export function buildLSPSegment(
	state: LSPDecodeState | undefined,
	chunk: Uint8Array,
): LSPDecodeState | undefined {
	if (chunk.byteLength === 0) return state
	if (state === undefined) return { bytes: chunk.slice(), size: chunk.byteLength }
	if (state.boundary === undefined)
		return { bytes: chunk.slice(), previous: state, size: state.size + chunk.byteLength }
	return {
		bytes: chunk.slice(),
		previous: state,
		size: state.size + chunk.byteLength,
		boundary: state.boundary,
		length: state.length,
	}
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
	for (const index of bytes.keys()) {
		if (index + 3 >= bytes.byteLength) break
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
	for (const index of header.keys()) {
		const byte = header[index]
		if (byte === undefined || byte > 127)
			throw new LSPError('The LSP header must contain ASCII bytes', {
				code: 'framing',
				context: { messages: Object.freeze([...messages]) },
			})
	}

	const headerText = new TextDecoder().decode(header)
	const lines = headerText.split('\r\n')
	const fields = lines.reduce<{
		readonly length: number | undefined
		readonly content: boolean
	}>(
		(state, line) => {
			const separator = line.indexOf(':')
			if (separator <= 0)
				throw new LSPError('The LSP header contains an invalid field', {
					code: 'framing',
					context: { messages: Object.freeze([...messages]) },
				})
			const name = line.slice(0, separator).trim().toLowerCase()
			const field = line.slice(separator + 1).trim()
			if (name === 'content-length') {
				if (state.length !== undefined)
					throw new LSPError('The LSP header repeats Content-Length', {
						code: 'framing',
						context: { messages: Object.freeze([...messages]) },
					})
				if (field.length === 0)
					throw new LSPError('The LSP Content-Length is empty', {
						code: 'framing',
						context: { messages: Object.freeze([...messages]) },
					})
				if (/[^0-9]/u.test(field))
					throw new LSPError('The LSP Content-Length is invalid', {
						code: 'framing',
						context: { messages: Object.freeze([...messages]) },
					})
				const parsed = Number(field)
				if (!isNumber(parsed) || !Number.isSafeInteger(parsed))
					throw new LSPError('The LSP Content-Length is invalid', {
						code: 'framing',
						context: { messages: Object.freeze([...messages]) },
					})
				if (parsed > LSP_CONTENT_LIMIT)
					throw new LSPError('The LSP Content-Length exceeds the content limit', {
						code: 'framing',
						context: { messages: Object.freeze([...messages]), value: parsed },
					})
				return { length: parsed, content: state.content }
			}
			if (name === 'content-type') {
				if (state.content)
					throw new LSPError('The LSP header repeats Content-Type', {
						code: 'framing',
						context: { messages: Object.freeze([...messages]) },
					})
				const parts = field.split(';')
				const media = parts[0]
				if (media === undefined || media.trim().toLowerCase() !== 'application/vscode-jsonrpc')
					throw new LSPError('The LSP Content-Type is unsupported', {
						code: 'framing',
						context: { messages: Object.freeze([...messages]) },
					})
				parts.slice(1).reduce((charset, part) => {
					const equals = part.indexOf('=')
					if (equals < 0)
						throw new LSPError('The LSP Content-Type parameter is malformed', {
							code: 'framing',
							context: { messages: Object.freeze([...messages]) },
						})
					const parameter = part.slice(0, equals).trim().toLowerCase()
					if (parameter !== 'charset') return charset
					if (charset)
						throw new LSPError('The LSP Content-Type repeats charset', {
							code: 'framing',
							context: { messages: Object.freeze([...messages]) },
						})
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
					return true
				}, false)
				return { length: state.length, content: true }
			}
			return state
		},
		{ length: undefined, content: false },
	)

	if (fields.length === undefined)
		throw new LSPError('The LSP header requires Content-Length', {
			code: 'framing',
			context: { messages: Object.freeze([...messages]) },
		})
	return fields.length
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
	const decoded = attempt(() => new TextDecoder('utf-8', { fatal: true }).decode(body))
	if (!decoded.success) {
		throw new LSPError('The LSP content is not valid UTF-8', {
			code: 'framing',
			context: { messages: Object.freeze([...messages]) },
			cause: decoded.error,
		})
	}
	const parsed = parseJSON(decoded.value)
	if (parsed === undefined)
		throw new LSPError('The LSP content is not valid JSON', {
			code: 'protocol',
			context: { code: JSONRPC_PARSE_ERROR, messages: Object.freeze([...messages]) },
		})
	if (isJSONRPCMessage(parsed)) return parsed
	throw new LSPError('The LSP content is not a valid JSON-RPC message', {
		code: 'protocol',
		context: { code: JSONRPC_INVALID_REQUEST, messages: Object.freeze([...messages]) },
	})
}

/**
 * Waits for a deadline to elapse without holding the host event loop open.
 *
 * @param timeout - The number of milliseconds to wait.
 * @returns A promise that resolves after the deadline elapses, and never rejects.
 *
 * @remarks
 * The deadline is armed with `AbortSignal.timeout`. A caller that wins its race against this
 * promise has nothing to clear, and the losing deadline delays no exit.
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
