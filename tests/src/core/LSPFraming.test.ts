import type { JSONRPCMessage } from '@orkestrel/jsonrpc'
import type { LSPDecodeState } from '@src/core'
import { buildLSPSegment, encodeLSPMessage, isLSPError } from '@src/core'
import { LSPFraming } from '../../../src/core/LSPFraming.js'
import { LSP_FRAME_REFUSALS } from '../../setup.js'
import { attempt } from '@orkestrel/contract'
import { describe, expect, it } from 'vitest'

describe('LSPFraming', () => {
	it('yields one complete message per next call', () => {
		const first: JSONRPCMessage = { jsonrpc: '2.0', method: 'one' }
		const second: JSONRPCMessage = { jsonrpc: '2.0', method: 'two' }
		const bytes = Uint8Array.from([...encodeLSPMessage(first), ...encodeLSPMessage(second)])
		const framing = new LSPFraming(buildLSPSegment(undefined, bytes), [])
		expect(framing[Symbol.iterator]()).toBe(framing)
		expect(framing.next()).toEqual({ done: false, value: first })
		expect(framing.state?.bytes).toEqual(encodeLSPMessage(second))
		expect(framing.next()).toEqual({ done: false, value: second })
		expect(framing.state).toBeUndefined()
		expect(framing.next()).toEqual({ done: true, value: undefined })
	})

	it('retains the same incomplete header after done', () => {
		const state = buildLSPSegment(undefined, new TextEncoder().encode('Content-'))
		const framing = new LSPFraming(state, [])
		expect(framing.next().done).toBe(true)
		expect(framing.state).toBe(state)
		expect(framing.next().done).toBe(true)
		expect(framing.state).toBe(state)
	})

	it('retains resolved metadata for an incomplete body after done', () => {
		const bytes = new TextEncoder().encode('Content-Length: 40\r\n\r\n{')
		const framing = new LSPFraming(buildLSPSegment(undefined, bytes), [])
		expect(framing.next().done).toBe(true)
		expect(framing.state).toEqual({ bytes, size: bytes.byteLength, boundary: 18, length: 40 })
		const retained = framing.state
		expect(framing.next().done).toBe(true)
		expect(framing.state).toBe(retained)
	})

	it('finishes an absent or empty state without resolving a frame', () => {
		expect(new LSPFraming(undefined, []).next()).toEqual({ done: true, value: undefined })
		const state: LSPDecodeState = { bytes: new Uint8Array(0), size: 0 }
		const framing = new LSPFraming(state, [])
		expect(framing.next().done).toBe(true)
		expect(framing.state).toBe(state)
	})

	it.each(LSP_FRAME_REFUSALS)('preserves the decoded log when refusing $title', (row) => {
		const first: JSONRPCMessage = { jsonrpc: '2.0', method: 'one' }
		const invalid = Uint8Array.from(row.text, (character) => character.charCodeAt(0))
		const bytes = Uint8Array.from([...encodeLSPMessage(first), ...invalid])
		const messages: JSONRPCMessage[] = []
		const framing = new LSPFraming(buildLSPSegment(undefined, bytes), messages)
		const outcome = attempt(() => {
			for (const message of framing) messages.push(message)
		})
		const error = outcome.success ? undefined : outcome.error
		if (!isLSPError(error)) throw new Error('Expected a branded LSP error')
		expect(error.message).toBe(row.message)
		expect(error.code).toBe(row.code)
		expect(error.context?.messages).toEqual([first])
		expect(error.context?.messages).not.toBe(messages)
		expect(Object.isFrozen(error.context?.messages)).toBe(true)
		expect(error.context?.value).toBe('value' in row ? row.value : undefined)
	})

	it('decodes a coalesced sequence too deep for recursive framing', () => {
		const message: JSONRPCMessage = { jsonrpc: '2.0', method: '' }
		const frame = encodeLSPMessage(message)
		const bytes = new Uint8Array(frame.byteLength * 16_384)
		for (const index of Array.from({ length: 16_384 }).keys())
			bytes.set(frame, index * frame.byteLength)
		const messages: JSONRPCMessage[] = []
		const framing = new LSPFraming(buildLSPSegment(undefined, bytes), messages)
		for (const decoded of framing) messages.push(decoded)
		expect(messages).toHaveLength(16_384)
		expect(messages.every((decoded) => JSON.stringify(decoded) === JSON.stringify(message))).toBe(
			true,
		)
		expect(framing.state).toBeUndefined()
	})
})
