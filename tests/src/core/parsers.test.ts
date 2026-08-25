import type { JSONRPCMessage, JSONRPCNotification } from '@src/core'
import {
	encodeLSPMessage,
	isLSPError,
	JSONRPC_PARSE_ERROR,
	LSP_CONTENT_LIMIT,
	LSPError,
	parseLSPMessages,
} from '@src/core'
import { describe, expect, it } from 'vitest'

describe('parseLSPMessages', () => {
	it('decodes a UTF-8 frame containing an astral code point', () => {
		const message: JSONRPCNotification = {
			jsonrpc: '2.0',
			method: 'textDocument/publishDiagnostics',
			params: { message: 'A😀Z' },
		}
		const [messages, pending] = parseLSPMessages(encodeLSPMessage(message))

		expect(messages).toEqual([message])
		expect(pending.byteLength).toBe(0)
	})

	it('reassembles a header split mid-Content-Length', () => {
		const message: JSONRPCNotification = { jsonrpc: '2.0', method: 'initialized' }
		const frame = encodeLSPMessage(message)
		const [early, pending] = parseLSPMessages(frame.subarray(0, 11))
		const [messages, remaining] = parseLSPMessages(frame.subarray(11), pending)

		expect(early).toEqual([])
		expect(messages).toEqual([message])
		expect(remaining.byteLength).toBe(0)
	})

	it('separates several frames delivered in one chunk', () => {
		const messages: readonly JSONRPCMessage[] = [
			{ jsonrpc: '2.0', id: 1, method: 'initialize', params: {} },
			{ jsonrpc: '2.0', method: 'initialized' },
			{ jsonrpc: '2.0', id: 1, result: { capabilities: {} } },
		]
		const frames = messages.map((message) => encodeLSPMessage(message))
		const length = frames.reduce((total, frame) => total + frame.byteLength, 0)
		const chunk = new Uint8Array(length)
		let offset = 0
		for (const frame of frames) {
			chunk.set(frame, offset)
			offset += frame.byteLength
		}

		const [parsed, pending] = parseLSPMessages(chunk)
		expect(parsed).toEqual(messages)
		expect(pending.byteLength).toBe(0)
	})

	it('folds the legacy utf8 charset spelling', () => {
		const message: JSONRPCNotification = { jsonrpc: '2.0', method: 'initialized' }
		const encoder = new TextEncoder()
		const body = encoder.encode(JSON.stringify(message))
		const header = encoder.encode(
			`Content-Length: ${body.byteLength}\r\nContent-Type: application/vscode-jsonrpc; charset=utf8\r\n\r\n`,
		)
		const frame = new Uint8Array(header.byteLength + body.byteLength)
		frame.set(header)
		frame.set(body, header.byteLength)

		const [messages] = parseLSPMessages(frame)
		expect(messages).toEqual([message])
	})

	it('refuses a charset other than UTF-8', () => {
		const message: JSONRPCNotification = { jsonrpc: '2.0', method: 'initialized' }
		const encoder = new TextEncoder()
		const body = encoder.encode(JSON.stringify(message))
		const header = encoder.encode(
			`Content-Length: ${body.byteLength}\r\nContent-Type: application/vscode-jsonrpc; charset=utf-16\r\n\r\n`,
		)
		const frame = new Uint8Array(header.byteLength + body.byteLength)
		frame.set(header)
		frame.set(body, header.byteLength)

		let thrown: unknown
		try {
			parseLSPMessages(frame)
		} catch (error) {
			thrown = error
		}
		expect(thrown).toBeInstanceOf(LSPError)
		if (!isLSPError(thrown)) throw new Error('Expected a branded LSP error')
		expect(thrown.code).toBe('framing')
	})

	it('refuses an over-limit Content-Length before a body arrives', () => {
		const header = new TextEncoder().encode(`Content-Length: ${LSP_CONTENT_LIMIT + 1}\r\n\r\n`)

		let thrown: unknown
		try {
			parseLSPMessages(header)
		} catch (error) {
			thrown = error
		}
		expect(thrown).toBeInstanceOf(LSPError)
		if (!isLSPError(thrown)) throw new Error('Expected a branded LSP error')
		expect(thrown.code).toBe('framing')
		expect(thrown.context?.value).toBe(LSP_CONTENT_LIMIT + 1)
	})

	it('reports malformed JSON with the JSON-RPC parse code', () => {
		const body = new TextEncoder().encode('{')
		const header = new TextEncoder().encode(`Content-Length: ${body.byteLength}\r\n\r\n`)
		const frame = new Uint8Array(header.byteLength + body.byteLength)
		frame.set(header)
		frame.set(body, header.byteLength)
		let thrown: unknown

		try {
			parseLSPMessages(frame)
		} catch (error) {
			thrown = error
		}
		expect(thrown).toBeInstanceOf(LSPError)
		if (!isLSPError(thrown)) throw new Error('Expected a branded LSP error')
		expect(thrown.code).toBe('protocol')
		expect(thrown.context?.code).toBe(JSONRPC_PARSE_ERROR)
	})
})
