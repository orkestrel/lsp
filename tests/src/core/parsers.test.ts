import type { JSONRPCMessage, JSONRPCNotification } from '@src/core'
import {
	encodeLSPMessage,
	isLSPError,
	JSONRPC_PARSE_ERROR,
	LSP_CONTENT_LIMIT,
	LSPError,
	LSP_HEADER_LIMIT,
	LSP_METHODS,
	parseLSPMessages,
} from '@src/core'
import { describe, expect, it } from 'vitest'

const INITIALIZE_METHOD: 'initialize' = LSP_METHODS.initialize

describe('parseLSPMessages', () => {
	it('decodes a UTF-8 frame containing an astral code point', () => {
		const message: JSONRPCNotification = {
			jsonrpc: '2.0',
			method: 'textDocument/publishDiagnostics',
			params: { message: 'A😀Z' },
		}
		const [messages, pending] = parseLSPMessages(encodeLSPMessage(message))

		expect(messages).toEqual([message])
		expect(pending).toBeUndefined()
	})

	it('reassembles a header split mid-Content-Length', () => {
		const message: JSONRPCNotification = { jsonrpc: '2.0', method: 'initialized' }
		const frame = encodeLSPMessage(message)
		const [early, pending] = parseLSPMessages(frame.subarray(0, 11))
		const [messages, remaining] = parseLSPMessages(frame.subarray(11), pending)

		expect(early).toEqual([])
		expect(pending?.size).toBe(11)
		expect(messages).toEqual([message])
		expect(remaining).toBeUndefined()
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
		expect(pending).toBeUndefined()
	})

	it('reassembles a frame split inside its body', () => {
		const message: JSONRPCNotification = {
			jsonrpc: '2.0',
			method: 'textDocument/publishDiagnostics',
			params: { uri: 'file:///workspace/main.ts' },
		}
		const encoder = new TextEncoder()
		const body = encoder.encode(JSON.stringify(message))
		const frame = encodeLSPMessage(message)
		const split = frame.byteLength - Math.floor(body.byteLength / 2)
		const [early, state] = parseLSPMessages(frame.subarray(0, split))
		const [messages, remaining] = parseLSPMessages(frame.subarray(split), state)

		expect(early).toEqual([])
		expect(state?.boundary).toBeGreaterThan(0)
		expect(state?.length).toBe(body.byteLength)
		expect(messages).toEqual([message])
		expect(remaining).toBeUndefined()
	})

	it('reassembles a frame split inside an astral UTF-8 sequence', () => {
		const message: JSONRPCNotification = {
			jsonrpc: '2.0',
			method: 'textDocument/publishDiagnostics',
			params: { message: 'A😀Z' },
		}
		const frame = encodeLSPMessage(message)
		const astral = frame.indexOf(240)
		const split = astral + 1
		const [early, state] = parseLSPMessages(frame.subarray(0, split))
		const [messages, remaining] = parseLSPMessages(frame.subarray(split), state)

		expect(astral).toBeGreaterThan(0)
		expect(early).toEqual([])
		expect(messages).toEqual([message])
		expect(remaining).toBeUndefined()
	})

	it('retains the next partial header after completing a split body', () => {
		const first: JSONRPCNotification = { jsonrpc: '2.0', method: 'initialized' }
		const next: JSONRPCNotification = { jsonrpc: '2.0', method: 'workspace/diagnostic/refresh' }
		const firstFrame = encodeLSPMessage(first)
		const nextFrame = encodeLSPMessage(next)
		const split = firstFrame.byteLength - 3
		const nextHeader = nextFrame.subarray(0, 9)
		const [early, state] = parseLSPMessages(firstFrame.subarray(0, split))
		const chunk = new Uint8Array(3 + nextHeader.byteLength)
		chunk.set(firstFrame.subarray(split))
		chunk.set(nextHeader, 3)
		const [messages, remaining] = parseLSPMessages(chunk, state)

		expect(early).toEqual([])
		expect(messages).toEqual([first])
		expect(remaining?.bytes).toEqual(nextHeader)
		expect(remaining?.previous).toBeUndefined()
		expect(remaining?.size).toBe(nextHeader.byteLength)
		expect(remaining?.boundary).toBeUndefined()
		expect(remaining?.length).toBeUndefined()
	})

	it('carries resolved framing across byte-sized body chunks', () => {
		const message: JSONRPCNotification = {
			jsonrpc: '2.0',
			method: 'textDocument/publishDiagnostics',
			params: { message: 'chunked' },
		}
		const encoder = new TextEncoder()
		const body = encoder.encode(JSON.stringify(message))
		const header = encoder.encode(`Content-Length: ${body.byteLength}\r\n\r\n`)
		const frame = encodeLSPMessage(message)
		let state = parseLSPMessages(frame.subarray(0, header.byteLength + 1))[1]
		let messages: readonly JSONRPCMessage[] = []
		const boundaries: Array<number | undefined> = []
		const lengths: Array<number | undefined> = []

		for (let index = header.byteLength + 1; index < frame.byteLength; index += 1) {
			const decoded = parseLSPMessages(frame.subarray(index, index + 1), state)
			messages = decoded[0]
			state = decoded[1]
			if (index + 1 < frame.byteLength) {
				boundaries.push(state?.boundary)
				lengths.push(state?.length)
			}
		}

		expect(boundaries).toEqual(new Array(body.byteLength - 2).fill(header.byteLength - 4))
		expect(lengths).toEqual(new Array(body.byteLength - 2).fill(body.byteLength))
		expect(messages).toEqual([message])
		expect(state).toBeUndefined()
	})

	it('decodes a request with id zero', () => {
		const message: JSONRPCMessage = { jsonrpc: '2.0', id: 0, method: 'initialize' }

		const [messages, state] = parseLSPMessages(encodeLSPMessage(message))
		expect(messages).toEqual([message])
		expect(state).toBeUndefined()
	})

	it('decodes a response with an empty-string id', () => {
		const message: JSONRPCMessage = { jsonrpc: '2.0', id: '', result: null }

		const [messages, state] = parseLSPMessages(encodeLSPMessage(message))
		expect(messages).toEqual([message])
		expect(state).toBeUndefined()
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

	it('preserves decoded messages when refusing a charset other than UTF-8', () => {
		const decoded: JSONRPCNotification = { jsonrpc: '2.0', method: 'initialized' }
		const message: JSONRPCNotification = { jsonrpc: '2.0', method: 'initialized' }
		const encoder = new TextEncoder()
		const body = encoder.encode(JSON.stringify(message))
		const header = encoder.encode(
			`Content-Length: ${body.byteLength}\r\nContent-Type: application/vscode-jsonrpc; charset=utf-16\r\n\r\n`,
		)
		const leading = encodeLSPMessage(decoded)
		const frame = new Uint8Array(leading.byteLength + header.byteLength + body.byteLength)
		frame.set(leading)
		frame.set(header, leading.byteLength)
		frame.set(body, leading.byteLength + header.byteLength)

		let thrown: unknown
		try {
			parseLSPMessages(frame)
		} catch (error) {
			thrown = error
		}
		expect(thrown).toBeInstanceOf(LSPError)
		if (!isLSPError(thrown)) throw new Error('Expected a branded LSP error')
		expect(thrown.code).toBe('framing')
		expect(thrown.context?.messages).toEqual([decoded])
	})

	it('preserves decoded messages when refusing an over-limit Content-Length', () => {
		const decoded: JSONRPCNotification = { jsonrpc: '2.0', method: 'initialized' }
		const leading = encodeLSPMessage(decoded)
		const header = new TextEncoder().encode(`Content-Length: ${LSP_CONTENT_LIMIT + 1}\r\n\r\n`)
		const chunk = new Uint8Array(leading.byteLength + header.byteLength)
		chunk.set(leading)
		chunk.set(header, leading.byteLength)

		let thrown: unknown
		try {
			parseLSPMessages(chunk)
		} catch (error) {
			thrown = error
		}
		expect(thrown).toBeInstanceOf(LSPError)
		if (!isLSPError(thrown)) throw new Error('Expected a branded LSP error')
		expect(thrown.code).toBe('framing')
		expect(thrown.context?.value).toBe(LSP_CONTENT_LIMIT + 1)
		expect(thrown.context?.messages).toEqual([decoded])
	})

	it('preserves decoded messages when reporting malformed JSON', () => {
		const decoded: JSONRPCNotification = { jsonrpc: '2.0', method: 'initialized' }
		const leading = encodeLSPMessage(decoded)
		const body = new TextEncoder().encode('{')
		const header = new TextEncoder().encode(`Content-Length: ${body.byteLength}\r\n\r\n`)
		const frame = new Uint8Array(leading.byteLength + header.byteLength + body.byteLength)
		frame.set(leading)
		frame.set(header, leading.byteLength)
		frame.set(body, leading.byteLength + header.byteLength)
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
		expect(thrown.context?.messages).toEqual([decoded])
	})

	it('refuses a boundary-free header beyond the header limit', () => {
		const chunk = new Uint8Array(LSP_HEADER_LIMIT + 1)
		chunk.fill(65)
		let thrown: unknown

		try {
			parseLSPMessages(chunk)
		} catch (error) {
			thrown = error
		}
		expect(thrown).toBeInstanceOf(LSPError)
		if (!isLSPError(thrown)) throw new Error('Expected a branded LSP error')
		expect(thrown.code).toBe('framing')
	})

	it('ignores an unknown header field', () => {
		const message: JSONRPCNotification = { jsonrpc: '2.0', method: 'initialized' }
		const encoder = new TextEncoder()
		const body = encoder.encode(JSON.stringify(message))
		const header = encoder.encode(`Content-Length: ${body.byteLength}\r\nX-Trace: 1\r\n\r\n`)
		const frame = new Uint8Array(header.byteLength + body.byteLength)
		frame.set(header)
		frame.set(body, header.byteLength)

		const [messages] = parseLSPMessages(frame)
		expect(messages).toEqual([message])
	})
})

void INITIALIZE_METHOD
