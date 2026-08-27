import type { JSONRPCMessage, LSPDecodeState } from './types.js'
import { LSP_HEADER_LIMIT } from './constants.js'
import { LSPError } from './errors.js'
import {
	joinLSPSegments,
	readLSPBody,
	readLSPHeader,
	scanLSPBoundary,
	takeLSPTail,
} from './helpers.js'

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
			let scan = pending.bytes
			let base = 0
			if (previous !== undefined) {
				const tail = takeLSPTail(previous, 3)
				scan = new Uint8Array(tail.byteLength + pending.bytes.byteLength)
				scan.set(tail)
				scan.set(pending.bytes, tail.byteLength)
				base = previous.size - tail.byteLength
			}

			const found = scanLSPBoundary(scan)
			if (found !== undefined) boundary = base + found

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

			joined = previous === undefined ? pending.bytes : joinLSPSegments(pending)
			length = readLSPHeader(joined.subarray(0, boundary), messages)
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

		if (joined === undefined)
			joined = pending.previous === undefined ? pending.bytes : joinLSPSegments(pending)

		messages.push(readLSPBody(joined.subarray(bodyStart, frameEnd), messages))

		if (frameEnd === joined.byteLength) pending = undefined
		else {
			const bytes = joined.slice(frameEnd)
			pending = { bytes, size: bytes.byteLength }
		}
	}

	return [messages, pending]
}
