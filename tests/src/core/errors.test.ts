import { isLSPError, LSPError } from '@src/core'
import { describe, expect, it } from 'vitest'

describe('declared error contexts', () => {
	it('accepts a class-instance context', () => {
		const error = new LSPError('context', { code: 'framing' })
		Object.defineProperty(error, 'context', { value: new URL('https://example.invalid/context') })
		expect(isLSPError(error)).toBe(true)
	})

	it('accepts a callable context with declared members', () => {
		const error = new LSPError('context', { code: 'protocol' })
		Object.defineProperty(error, 'context', {
			value: Object.assign(() => undefined, {
				code: 4,
				messages: [{ jsonrpc: '2.0', method: 'initialized' }],
			}),
		})
		expect(isLSPError(error)).toBe(true)
	})

	it('validates message elements by index without invoking their iterator', () => {
		const messages = [{ jsonrpc: '2.0', method: 'initialized' }]
		Object.defineProperty(messages, Symbol.iterator, {
			get() {
				throw new Error('Iterator must not be read')
			},
		})
		const error = new LSPError('context', { code: 'framing', context: { messages: [] } })
		Object.defineProperty(error, 'context', { value: { messages } })
		expect(isLSPError(error)).toBe(true)
	})
})
