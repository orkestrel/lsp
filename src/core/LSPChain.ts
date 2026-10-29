import type { LSPDecodeState } from './types.js'

/**
 * Walks retained decode segments newest first and copies their bytes in arrival order.
 *
 * @remarks
 * Each instance owns one traversal. Construct a fresh instance for each join, tail, or iteration.
 *
 * @example
 * ```ts
 * const bytes = new LSPChain(state).join()
 * const overlap = new LSPChain(state).tail(3)
 * ```
 */
export class LSPChain implements IterableIterator<LSPDecodeState> {
	readonly #head: LSPDecodeState
	#cursor: LSPDecodeState | undefined

	constructor(state: LSPDecodeState) {
		this.#head = state
		this.#cursor = state
	}

	/** Yields the next segment, newest first, or reports exhaustion. */
	next(): IteratorResult<LSPDecodeState, undefined> {
		const cursor = this.#cursor
		if (cursor === undefined) return { done: true, value: undefined }
		this.#cursor = cursor.previous
		return { done: false, value: cursor }
	}

	[Symbol.iterator](): this {
		return this
	}

	/** Flattens the remaining segments into an owned buffer at their original offsets. */
	join(): Uint8Array {
		const joined = new Uint8Array(this.#head.size)
		for (const segment of this) {
			joined.set(segment.bytes, segment.size - segment.bytes.byteLength)
		}
		return joined
	}

	/** Takes at most the requested final bytes, refusing a negative allocation length. */
	tail(count: number): Uint8Array {
		const size = Math.min(count, this.#head.size)
		const start = this.#head.size - size
		const tail = new Uint8Array(size)
		for (const segment of this) {
			const begin = segment.size - segment.bytes.byteLength
			if (segment.size <= start) break
			const from = Math.max(begin, start)
			tail.set(segment.bytes.subarray(from - begin), from - start)
		}
		return tail
	}
}
