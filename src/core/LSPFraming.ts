import type { JSONRPCMessage, LSPDecodeState } from './types.js'
import { LSP_HEADER_LIMIT } from './constants.js'
import { LSPError } from './errors.js'
import { readLSPBody, readLSPHeader, scanLSPBoundary } from './helpers.js'
import { LSPChain } from './LSPChain.js'

/** Advances one decode call through its complete frames and retained remainder. */
export class LSPFraming implements IterableIterator<JSONRPCMessage> {
	#state: LSPDecodeState | undefined
	readonly #messages: readonly JSONRPCMessage[]

	constructor(state: LSPDecodeState | undefined, messages: readonly JSONRPCMessage[]) {
		this.#state = state
		this.#messages = messages
	}

	get state(): LSPDecodeState | undefined {
		return this.#state
	}

	next(): IteratorResult<JSONRPCMessage, undefined> {
		const pending = this.#state
		if (pending === undefined || pending.size === 0) return { done: true, value: undefined }
		const resolved = pending.boundary === undefined ? this.#resolve(pending) : pending
		if (resolved === undefined) return { done: true, value: undefined }
		const bodyStart = resolved.boundary + 4
		const frameEnd = bodyStart + resolved.length
		if (resolved.size < frameEnd) {
			this.#state = resolved
			return { done: true, value: undefined }
		}
		const joined = resolved.previous === undefined ? resolved.bytes : new LSPChain(resolved).join()
		const message = readLSPBody(joined.subarray(bodyStart, frameEnd), this.#messages)
		if (frameEnd === joined.byteLength) this.#state = undefined
		else {
			const bytes = joined.slice(frameEnd)
			this.#state = { bytes, size: bytes.byteLength }
		}
		return { done: false, value: message }
	}

	[Symbol.iterator](): this {
		return this
	}

	#resolve(
		pending: LSPDecodeState,
	): Extract<LSPDecodeState, { readonly boundary: number }> | undefined {
		const previous = pending.previous
		const tail = previous === undefined ? undefined : new LSPChain(previous).tail(3)
		const scan =
			tail === undefined
				? pending.bytes
				: new Uint8Array(tail.byteLength + pending.bytes.byteLength)
		if (tail !== undefined) {
			scan.set(tail)
			scan.set(pending.bytes, tail.byteLength)
		}
		const found = scanLSPBoundary(scan)
		const boundary =
			found === undefined ? undefined : (previous?.size ?? 0) - (tail?.byteLength ?? 0) + found
		if (boundary === undefined) {
			if (pending.size > LSP_HEADER_LIMIT)
				throw new LSPError('The LSP header exceeds the header limit', {
					code: 'framing',
					context: { messages: Object.freeze([...this.#messages]), value: pending.size },
				})
			return undefined
		}
		if (boundary > LSP_HEADER_LIMIT)
			throw new LSPError('The LSP header exceeds the header limit', {
				code: 'framing',
				context: { messages: Object.freeze([...this.#messages]), value: boundary },
			})
		const joined = previous === undefined ? pending.bytes : new LSPChain(pending).join()
		const length = readLSPHeader(joined.subarray(0, boundary), this.#messages)
		return { bytes: joined, size: joined.byteLength, boundary, length }
	}
}
