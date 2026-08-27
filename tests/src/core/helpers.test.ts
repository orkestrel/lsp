import type { JSONRPCNotification } from '@src/core'
import { encodeLSPMessage, isLSPError, JSONRPC_INVALID_REQUEST, waitForDeadline } from '@src/core'
import { describe, expect, it } from 'vitest'

describe('encodeLSPMessage', () => {
	it('measures Content-Length from encoded bytes including an astral code point', () => {
		const message: JSONRPCNotification = {
			jsonrpc: '2.0',
			method: 'textDocument/publishDiagnostics',
			params: { text: 'A😀Z' },
		}
		const content = JSON.stringify(message)
		const encoder = new TextEncoder()
		const length = encoder.encode(content).length
		const header = `Content-Length: ${length}\r\n\r\n`
		const bytes = encodeLSPMessage(message)

		expect(bytes.byteLength).toBe(encoder.encode(header).length + length)
		expect(new TextDecoder().decode(bytes.subarray(0, encoder.encode(header).length))).toBe(header)
		expect(new TextDecoder().decode(bytes.subarray(encoder.encode(header).length))).toBe(content)
	})

	it('reports a protocol error when JSON serialization fails', () => {
		const params: Record<string, unknown> = {}
		params.self = params
		const message: JSONRPCNotification = { jsonrpc: '2.0', method: 'initialized', params }
		let thrown: unknown

		try {
			encodeLSPMessage(message)
		} catch (error) {
			thrown = error
		}
		expect(isLSPError(thrown)).toBe(true)
		if (!isLSPError(thrown)) throw new Error('Expected a branded LSP error')
		expect(thrown.code).toBe('protocol')
		expect(thrown.context?.code).toBe(JSONRPC_INVALID_REQUEST)
	})
})

describe('waitForDeadline', () => {
	it('resolves no earlier than its deadline', async () => {
		const started = performance.now()

		await expect(waitForDeadline(30)).resolves.toBeUndefined()

		expect(performance.now() - started).toBeGreaterThanOrEqual(20)
	})

	it('settles a shorter deadline before a longer one', async () => {
		const order: string[] = []

		await Promise.all([
			waitForDeadline(40).then(() => order.push('long')),
			waitForDeadline(10).then(() => order.push('short')),
		])

		expect(order).toEqual(['short', 'long'])
	})
})
