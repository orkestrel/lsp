import { isLSPError, LSPError } from '@src/core'
import { describe, expect, it } from 'vitest'
import { LSPNotice } from '../../setup.js'

describe('declared error contexts', () => {
	it('accepts declared message unions with inherited members and extra fields', () => {
		const request = Object.assign(new LSPNotice(), {
			id: Number.NaN,
			result: 'an unrelated field',
			params: Object.create({ inherited: true }),
		})
		const success = Object.assign(new LSPNotice(), { id: Infinity, result: undefined })
		Object.defineProperty(success, 'method', {
			get() {
				throw new Error('a response does not declare method')
			},
		})
		const failure = Object.assign(new LSPNotice(), {
			id: null,
			error: Object.create({ code: Number.NaN, message: 'failure' }),
		})
		const error = new LSPError('context', {
			code: 'protocol',
			context: { messages: [request, success, failure] },
		})
		expect(isLSPError(error)).toBe(true)
	})

	it('refuses malformed and throwing declared message members without throwing', () => {
		const error = new LSPError('context', { code: 'framing' })
		Object.defineProperty(error, 'context', {
			configurable: true,
			value: { messages: [{ jsonrpc: '2.0', id: null, error: { code: 1 } }] },
		})
		expect(isLSPError(error)).toBe(false)
		Object.defineProperty(error, 'context', {
			value: {
				messages: [
					{
						get jsonrpc() {
							throw new Error('unreadable version')
						},
					},
				],
			},
		})
		expect(isLSPError(error)).toBe(false)
	})

	it('accepts a class-instance notification in the declared messages', () => {
		const error = new LSPError('context', {
			code: 'framing',
			context: { messages: [new LSPNotice()] },
		})
		expect(isLSPError(error)).toBe(true)
	})

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
