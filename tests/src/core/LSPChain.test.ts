import type { LSPDecodeState } from '@src/core'
import { LSPChain } from '@src/core'
import { describe, expect, it } from 'vitest'

describe('joinLSPSegments', () => {
	it('copies a single-segment state into an owned buffer', () => {
		const bytes = Uint8Array.of(1, 2, 3)
		const state: LSPDecodeState = { bytes, size: bytes.byteLength }

		const joined = new LSPChain(state).join()

		expect(Array.from(joined)).toEqual([1, 2, 3])
		expect(joined).not.toBe(bytes)
		joined.fill(0)
		expect(Array.from(bytes)).toEqual([1, 2, 3])
	})

	it('concatenates a linked chain in arrival order', () => {
		const first: LSPDecodeState = { bytes: Uint8Array.of(1, 2), size: 2 }
		const second: LSPDecodeState = { bytes: Uint8Array.of(3), previous: first, size: 3 }
		const third: LSPDecodeState = { bytes: Uint8Array.of(4, 5), previous: second, size: 5 }

		const joined = new LSPChain(third).join()

		expect(Array.from(joined)).toEqual([1, 2, 3, 4, 5])
		joined.fill(0)
		expect(Array.from(first.bytes)).toEqual([1, 2])
		expect(Array.from(third.bytes)).toEqual([4, 5])
	})
})

describe('takeLSPTail', () => {
	it('takes a tail shorter than the newest segment', () => {
		const first: LSPDecodeState = { bytes: Uint8Array.of(1, 2, 3), size: 3 }
		const second: LSPDecodeState = { bytes: Uint8Array.of(4, 5, 6, 7), previous: first, size: 7 }

		expect(Array.from(new LSPChain(second).tail(2))).toEqual([6, 7])
	})

	it('spans segments when the newest holds fewer bytes than the count', () => {
		const first: LSPDecodeState = { bytes: Uint8Array.of(1, 2, 3), size: 3 }
		const second: LSPDecodeState = { bytes: Uint8Array.of(4), previous: first, size: 4 }
		const third: LSPDecodeState = { bytes: Uint8Array.of(5), previous: second, size: 5 }

		expect(Array.from(new LSPChain(third).tail(3))).toEqual([3, 4, 5])
	})

	it('returns every retained byte when the count exceeds the chain', () => {
		const first: LSPDecodeState = { bytes: Uint8Array.of(1), size: 1 }
		const second: LSPDecodeState = { bytes: Uint8Array.of(2), previous: first, size: 2 }

		expect(Array.from(new LSPChain(second).tail(9))).toEqual([1, 2])
	})

	it('returns an empty buffer for a zero count', () => {
		const state: LSPDecodeState = { bytes: Uint8Array.of(1, 2), size: 2 }

		expect(new LSPChain(state).tail(0).byteLength).toBe(0)
	})

	it('returns an owned buffer rather than a retained segment', () => {
		const bytes = Uint8Array.of(1, 2)
		const state: LSPDecodeState = { bytes, size: 2 }

		const tail = new LSPChain(state).tail(2)
		tail.fill(0)

		expect(Array.from(bytes)).toEqual([1, 2])
	})

	it('refuses a negative count', () => {
		const state: LSPDecodeState = { bytes: Uint8Array.of(1), size: 1 }

		expect(() => new LSPChain(state).tail(-1)).toThrow(RangeError)
	})
})

describe('LSPChain', () => {
	it('joins a deep chain of single-byte nodes without recursive traversal', () => {
		const bytes = Uint8Array.from({ length: 65_536 }, (_, index) => index % 251)
		const state = bytes.reduce<LSPDecodeState>(
			(previous, byte) => ({
				bytes: Uint8Array.of(byte),
				previous,
				size: previous.size + 1,
			}),
			{ bytes: new Uint8Array(0), size: 0 },
		)
		expect(new LSPChain(state).join()).toEqual(bytes)
	})

	it('yields each node newest first and remains done after exhaustion', () => {
		const first: LSPDecodeState = { bytes: Uint8Array.of(1), size: 1 }
		const last: LSPDecodeState = { bytes: Uint8Array.of(2), previous: first, size: 2 }
		const chain = new LSPChain(last)
		expect(chain[Symbol.iterator]()).toBe(chain)
		expect(chain.next()).toEqual({ done: false, value: last })
		expect(chain.next()).toEqual({ done: false, value: first })
		expect(chain.next()).toEqual({ done: true, value: undefined })
		expect(chain.next()).toEqual({ done: true, value: undefined })
	})
})
