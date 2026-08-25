import type { JSONRPCMessage, LSPDecodeState } from './types.js'
import {
	JSONRPC_INVALID_REQUEST,
	JSONRPC_PARSE_ERROR,
	LSP_CONTENT_LIMIT,
	LSP_HEADER_LIMIT,
} from './constants.js'
import { LSPError } from './errors.js'
import { isJSONRPCNotification, isJSONRPCRequest, isJSONRPCResponse } from './validators.js'
import { parseJSON } from '@orkestrel/contract'

/**
 * Parses a byte chunk into complete LSP base-protocol messages and retained decode state.
 *
 * @remarks
 * Pass the returned state to the next call. The parser accepts a split header or body, separates
 * coalesced frames, defaults an omitted content type to UTF-8, and refuses accumulation above
 * {@link LSP_HEADER_LIMIT} or a declared content length above {@link LSP_CONTENT_LIMIT}. Unknown
 * header fields are ignored because the base protocol names its supported fields without mandating
 * refusal, and tolerance is conventional for its HTTP-style header form.
 *
 * @param chunk - The next transport bytes.
 * @param state - Incomplete decode state returned by the preceding call. Default: `undefined`.
 * @returns The complete messages and the state required by the next call.
 * @throws {@link LSPError} Thrown for invalid framing, UTF-8, JSON, or JSON-RPC message shapes.
 *
 * @example
 * ```ts
 * const [messages, state] = parseLSPMessages(chunk)
 * const [later] = parseLSPMessages(nextChunk, state)
 * ```
 */
export function parseLSPMessages(
	chunk: Uint8Array,
	state?: LSPDecodeState,
): readonly [messages: readonly JSONRPCMessage[], state: LSPDecodeState | undefined] {
	const messages: JSONRPCMessage[] = []
	let pending: LSPDecodeState | undefined
	if (chunk.byteLength === 0) pending = state
	else if (state === undefined) pending = { bytes: chunk.slice(), size: chunk.byteLength }
	else if (state.boundary === undefined)
		pending = { bytes: chunk.slice(), previous: state, size: state.size + chunk.byteLength }
	else
		pending = {
			bytes: chunk.slice(),
			previous: state,
			size: state.size + chunk.byteLength,
			boundary: state.boundary,
			length: state.length,
		}

	while (pending !== undefined && pending.size > 0) {
		let boundary = pending.boundary
		let length = pending.length
		let joined: Uint8Array | undefined

		if (boundary === undefined) {
			const previous = pending.previous
			const previousSize = previous?.size ?? 0
			const overlap = Math.min(previousSize, 3)
			let scan: Uint8Array
			if (previous === undefined) scan = pending.bytes
			else {
				scan = new Uint8Array(overlap + pending.bytes.byteLength)
				let cursor: LSPDecodeState | undefined = previous
				let remaining = overlap
				while (cursor !== undefined && remaining > 0) {
					const count = Math.min(remaining, cursor.bytes.byteLength)
					remaining -= count
					scan.set(cursor.bytes.subarray(cursor.bytes.byteLength - count), remaining)
					cursor = cursor.previous
				}
				scan.set(pending.bytes, overlap)
			}

			for (let index = 0; index + 3 < scan.byteLength; index += 1) {
				if (
					scan[index] === 13 &&
					scan[index + 1] === 10 &&
					scan[index + 2] === 13 &&
					scan[index + 3] === 10
				) {
					boundary = previousSize - overlap + index
					break
				}
			}

			if (boundary === undefined) {
				if (pending.size > LSP_HEADER_LIMIT)
					throw new LSPError('The LSP header exceeds the header limit', {
						code: 'framing',
						context: { messages: Object.freeze([...messages]), value: pending.size },
					})
				return [messages, pending]
			}
			if (boundary > LSP_HEADER_LIMIT)
				throw new LSPError('The LSP header exceeds the header limit', {
					code: 'framing',
					context: { messages: Object.freeze([...messages]), value: boundary },
				})

			if (previous === undefined) joined = pending.bytes
			else {
				joined = new Uint8Array(pending.size)
				let cursor: LSPDecodeState | undefined = pending
				while (cursor !== undefined) {
					joined.set(cursor.bytes, cursor.size - cursor.bytes.byteLength)
					cursor = cursor.previous
				}
			}

			const headerBytes = joined.subarray(0, boundary)
			for (let index = 0; index < headerBytes.byteLength; index += 1) {
				const byte = headerBytes[index]
				if (byte === undefined || byte > 127)
					throw new LSPError('The LSP header must contain ASCII bytes', {
						code: 'framing',
						context: { messages: Object.freeze([...messages]) },
					})
			}

			const headerText = new TextDecoder().decode(headerBytes)
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
			length = resolved
			pending = {
				bytes: joined,
				size: joined.byteLength,
				boundary,
				length,
			}
		}
		if (boundary === undefined || length === undefined)
			throw new LSPError('The LSP decode state is incomplete', {
				code: 'framing',
				context: { messages: Object.freeze([...messages]) },
			})

		const bodyStart = boundary + 4
		const frameEnd = bodyStart + length
		if (pending.size < frameEnd) return [messages, pending]

		if (joined === undefined) {
			if (pending.previous === undefined) joined = pending.bytes
			else {
				joined = new Uint8Array(pending.size)
				let cursor: LSPDecodeState | undefined = pending
				while (cursor !== undefined) {
					joined.set(cursor.bytes, cursor.size - cursor.bytes.byteLength)
					cursor = cursor.previous
				}
			}
		}

		const body = joined.subarray(bodyStart, frameEnd)
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
			messages.push(parsed)
		else
			throw new LSPError('The LSP content is not a valid JSON-RPC message', {
				code: 'protocol',
				context: { code: JSONRPC_INVALID_REQUEST, messages: Object.freeze([...messages]) },
			})

		if (frameEnd === joined.byteLength) pending = undefined
		else {
			const bytes = joined.slice(frameEnd)
			pending = { bytes, size: bytes.byteLength }
		}
	}

	return [messages, pending]
}
