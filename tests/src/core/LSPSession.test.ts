import { encodeLSPMessage, LSPError } from '@src/core'
import { LSPSession } from '../../../src/core/LSPSession.js'
import { describe, expect, it } from 'vitest'

describe('LSPSession', () => {
	it('retains split bytes and resets the decoder after a refusal', () => {
		const session = new LSPSession()
		const message = { jsonrpc: '2.0', method: 'initialized' } as const
		const bytes = encodeLSPMessage(message)
		expect(session.decode(bytes.subarray(0, 10))).toEqual([])
		expect(session.decode(bytes.subarray(10))).toEqual([message])
		expect(session.decode(new TextEncoder().encode('Content-'))).toEqual([])
		expect(() => session.decode(new TextEncoder().encode('Length: x\r\n\r\n'))).toThrow(LSPError)
		expect(session.decode(bytes)).toEqual([message])
	})

	it('owns capability snapshots and keeps document ownership separate from result retention', () => {
		const session = new LSPSession()
		const capabilities = { textDocumentSync: 1 } as const
		session.capabilities = capabilities
		expect(session.capabilities).toEqual(capabilities)
		expect(session.capabilities).not.toBe(capabilities)
		expect(Object.isFrozen(session.capabilities)).toBe(true)
		const uri = 'file:///document.ts'
		session.open(uri)
		expect(() => session.open(uri)).toThrow(LSPError)
		session.record(uri, 'result', [])
		session.release(uri)
		expect(session.documents.has(uri)).toBe(false)
		expect(session.diagnostics.get(uri)).toEqual({ resultId: 'result', diagnostics: [] })
		session.open(uri)
		session.record(uri, undefined, [])
		expect(session.diagnostics.has(uri)).toBe(false)
	})
})
