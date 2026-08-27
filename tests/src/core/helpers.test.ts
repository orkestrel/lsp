import type { JSONRPCNotification, LSPDecodeState } from '@src/core'
import {
	encodeLSPMessage,
	isLSPError,
	joinLSPSegments,
	JSONRPC_INVALID_REQUEST,
	JSONRPC_PARSE_ERROR,
	LSP_CONTENT_LIMIT,
	readLSPBody,
	readLSPHeader,
	scanLSPBoundary,
	takeLSPTail,
	waitForDeadline,
} from '@src/core'
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

describe('joinLSPSegments', () => {
	it('copies a single-segment state into an owned buffer', () => {
		const bytes = Uint8Array.of(1, 2, 3)
		const state: LSPDecodeState = { bytes, size: bytes.byteLength }

		const joined = joinLSPSegments(state)

		expect(Array.from(joined)).toEqual([1, 2, 3])
		expect(joined).not.toBe(bytes)
		joined.fill(0)
		expect(Array.from(bytes)).toEqual([1, 2, 3])
	})

	it('concatenates a linked chain in arrival order', () => {
		const first: LSPDecodeState = { bytes: Uint8Array.of(1, 2), size: 2 }
		const second: LSPDecodeState = { bytes: Uint8Array.of(3), previous: first, size: 3 }
		const third: LSPDecodeState = { bytes: Uint8Array.of(4, 5), previous: second, size: 5 }

		const joined = joinLSPSegments(third)

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

		expect(Array.from(takeLSPTail(second, 2))).toEqual([6, 7])
	})

	it('spans segments when the newest holds fewer bytes than the count', () => {
		const first: LSPDecodeState = { bytes: Uint8Array.of(1, 2, 3), size: 3 }
		const second: LSPDecodeState = { bytes: Uint8Array.of(4), previous: first, size: 4 }
		const third: LSPDecodeState = { bytes: Uint8Array.of(5), previous: second, size: 5 }

		expect(Array.from(takeLSPTail(third, 3))).toEqual([3, 4, 5])
	})

	it('returns every retained byte when the count exceeds the chain', () => {
		const first: LSPDecodeState = { bytes: Uint8Array.of(1), size: 1 }
		const second: LSPDecodeState = { bytes: Uint8Array.of(2), previous: first, size: 2 }

		expect(Array.from(takeLSPTail(second, 9))).toEqual([1, 2])
	})

	it('returns an empty buffer for a zero count', () => {
		const state: LSPDecodeState = { bytes: Uint8Array.of(1, 2), size: 2 }

		expect(takeLSPTail(state, 0).byteLength).toBe(0)
	})

	it('returns an owned buffer rather than a retained segment', () => {
		const bytes = Uint8Array.of(1, 2)
		const state: LSPDecodeState = { bytes, size: 2 }

		const tail = takeLSPTail(state, 2)
		tail.fill(0)

		expect(Array.from(bytes)).toEqual([1, 2])
	})

	it('refuses a negative count', () => {
		const state: LSPDecodeState = { bytes: Uint8Array.of(1), size: 1 }

		expect(() => takeLSPTail(state, -1)).toThrow(RangeError)
	})
})

describe('scanLSPBoundary', () => {
	it('finds a boundary at the first index', () => {
		expect(scanLSPBoundary(new TextEncoder().encode('\r\n\r\n{}'))).toBe(0)
	})

	it('finds a boundary that ends the buffer', () => {
		expect(scanLSPBoundary(new TextEncoder().encode('AB\r\n\r\n'))).toBe(2)
	})

	it('reports the first of several boundaries', () => {
		expect(scanLSPBoundary(new TextEncoder().encode('A\r\n\r\nB\r\n\r\n'))).toBe(1)
	})

	it('reports no boundary in a header without one', () => {
		expect(scanLSPBoundary(new TextEncoder().encode('Content-Length: 2\r\n'))).toBeUndefined()
	})

	it('reports no boundary for a sequence the buffer truncates', () => {
		expect(scanLSPBoundary(new TextEncoder().encode('A\r\n\r'))).toBeUndefined()
	})

	it('reports no boundary for a transposed carriage return', () => {
		expect(scanLSPBoundary(new TextEncoder().encode('\r\r\n\n'))).toBeUndefined()
	})

	it('reports no boundary for a doubled line feed', () => {
		expect(scanLSPBoundary(new TextEncoder().encode('\r\n\n\r\n'))).toBeUndefined()
	})

	it('reports no boundary in an empty buffer', () => {
		expect(scanLSPBoundary(new Uint8Array(0))).toBeUndefined()
	})
})

describe('readLSPHeader', () => {
	it('reads the declared content length', () => {
		expect(readLSPHeader(new TextEncoder().encode('Content-Length: 2'), [])).toBe(2)
	})

	it('reads a zero content length', () => {
		expect(readLSPHeader(new TextEncoder().encode('Content-Length: 0'), [])).toBe(0)
	})

	it('reads the content limit itself', () => {
		const header = new TextEncoder().encode(`Content-Length: ${LSP_CONTENT_LIMIT}`)

		expect(readLSPHeader(header, [])).toBe(LSP_CONTENT_LIMIT)
	})

	it('matches a field name without regard to case', () => {
		expect(readLSPHeader(new TextEncoder().encode('content-length: 7'), [])).toBe(7)
	})

	it('ignores an unknown field', () => {
		const header = new TextEncoder().encode('Content-Length: 2\r\nX-Trace: 1')

		expect(readLSPHeader(header, [])).toBe(2)
	})

	it('accepts a supported content type without parameters', () => {
		const header = new TextEncoder().encode(
			'Content-Length: 2\r\nContent-Type: application/vscode-jsonrpc',
		)

		expect(readLSPHeader(header, [])).toBe(2)
	})

	it('folds the legacy utf8 charset spelling', () => {
		const header = new TextEncoder().encode(
			'Content-Length: 2\r\nContent-Type: application/vscode-jsonrpc; charset=utf8',
		)

		expect(readLSPHeader(header, [])).toBe(2)
	})

	it('folds an uppercase charset spelling', () => {
		const header = new TextEncoder().encode(
			'Content-Length: 2\r\nContent-Type: application/vscode-jsonrpc; charset=UTF-8',
		)

		expect(readLSPHeader(header, [])).toBe(2)
	})

	it('ignores a parameter other than charset', () => {
		const header = new TextEncoder().encode(
			'Content-Length: 2\r\nContent-Type: application/vscode-jsonrpc; boundary=frame',
		)

		expect(readLSPHeader(header, [])).toBe(2)
	})

	it('refuses a non-ASCII byte inside an otherwise well-formed field', () => {
		const header = new TextEncoder().encode('Content-Length: 2\r\nX-Note: café')
		let thrown: unknown

		try {
			readLSPHeader(header, [])
		} catch (error) {
			thrown = error
		}
		if (!isLSPError(thrown)) throw new Error('Expected a branded LSP error')
		expect(thrown.code).toBe('framing')
	})

	it('refuses an empty header', () => {
		let thrown: unknown

		try {
			readLSPHeader(new Uint8Array(0), [])
		} catch (error) {
			thrown = error
		}
		if (!isLSPError(thrown)) throw new Error('Expected a branded LSP error')
		expect(thrown.code).toBe('framing')
	})

	it('refuses a field without a colon', () => {
		let thrown: unknown

		try {
			readLSPHeader(new TextEncoder().encode('Content-Length'), [])
		} catch (error) {
			thrown = error
		}
		if (!isLSPError(thrown)) throw new Error('Expected a branded LSP error')
		expect(thrown.code).toBe('framing')
	})

	it('refuses a field without a name', () => {
		let thrown: unknown

		try {
			readLSPHeader(new TextEncoder().encode(': 2'), [])
		} catch (error) {
			thrown = error
		}
		if (!isLSPError(thrown)) throw new Error('Expected a branded LSP error')
		expect(thrown.code).toBe('framing')
	})

	it('refuses a header without a Content-Length', () => {
		const header = new TextEncoder().encode('Content-Type: application/vscode-jsonrpc')
		let thrown: unknown

		try {
			readLSPHeader(header, [])
		} catch (error) {
			thrown = error
		}
		if (!isLSPError(thrown)) throw new Error('Expected a branded LSP error')
		expect(thrown.code).toBe('framing')
	})

	it('refuses a repeated Content-Length', () => {
		const header = new TextEncoder().encode('Content-Length: 2\r\nContent-Length: 3')
		let thrown: unknown

		try {
			readLSPHeader(header, [])
		} catch (error) {
			thrown = error
		}
		if (!isLSPError(thrown)) throw new Error('Expected a branded LSP error')
		expect(thrown.code).toBe('framing')
	})

	it('refuses an empty Content-Length', () => {
		let thrown: unknown

		try {
			readLSPHeader(new TextEncoder().encode('Content-Length:'), [])
		} catch (error) {
			thrown = error
		}
		if (!isLSPError(thrown)) throw new Error('Expected a branded LSP error')
		expect(thrown.code).toBe('framing')
	})

	it('refuses a Content-Length carrying a non-digit', () => {
		let thrown: unknown

		try {
			readLSPHeader(new TextEncoder().encode('Content-Length: 12a'), [])
		} catch (error) {
			thrown = error
		}
		if (!isLSPError(thrown)) throw new Error('Expected a branded LSP error')
		expect(thrown.code).toBe('framing')
	})

	it('refuses a Content-Length beyond safe integer precision', () => {
		let thrown: unknown

		try {
			readLSPHeader(new TextEncoder().encode('Content-Length: 99999999999999999999'), [])
		} catch (error) {
			thrown = error
		}
		if (!isLSPError(thrown)) throw new Error('Expected a branded LSP error')
		expect(thrown.code).toBe('framing')
	})

	it('refuses a Content-Length above the content limit', () => {
		const header = new TextEncoder().encode(`Content-Length: ${LSP_CONTENT_LIMIT + 1}`)
		let thrown: unknown

		try {
			readLSPHeader(header, [])
		} catch (error) {
			thrown = error
		}
		if (!isLSPError(thrown)) throw new Error('Expected a branded LSP error')
		expect(thrown.code).toBe('framing')
		expect(thrown.context?.value).toBe(LSP_CONTENT_LIMIT + 1)
	})

	it('refuses a repeated Content-Type', () => {
		const header = new TextEncoder().encode(
			'Content-Length: 2\r\nContent-Type: application/vscode-jsonrpc\r\nContent-Type: application/vscode-jsonrpc',
		)
		let thrown: unknown

		try {
			readLSPHeader(header, [])
		} catch (error) {
			thrown = error
		}
		if (!isLSPError(thrown)) throw new Error('Expected a branded LSP error')
		expect(thrown.code).toBe('framing')
	})

	it('refuses an unsupported media type', () => {
		const header = new TextEncoder().encode('Content-Length: 2\r\nContent-Type: application/json')
		let thrown: unknown

		try {
			readLSPHeader(header, [])
		} catch (error) {
			thrown = error
		}
		if (!isLSPError(thrown)) throw new Error('Expected a branded LSP error')
		expect(thrown.code).toBe('framing')
	})

	it('refuses a Content-Type parameter without an equals sign', () => {
		const header = new TextEncoder().encode(
			'Content-Length: 2\r\nContent-Type: application/vscode-jsonrpc; charset',
		)
		let thrown: unknown

		try {
			readLSPHeader(header, [])
		} catch (error) {
			thrown = error
		}
		if (!isLSPError(thrown)) throw new Error('Expected a branded LSP error')
		expect(thrown.code).toBe('framing')
	})

	it('refuses a repeated charset parameter', () => {
		const header = new TextEncoder().encode(
			'Content-Length: 2\r\nContent-Type: application/vscode-jsonrpc; charset=utf-8; charset=utf-8',
		)
		let thrown: unknown

		try {
			readLSPHeader(header, [])
		} catch (error) {
			thrown = error
		}
		if (!isLSPError(thrown)) throw new Error('Expected a branded LSP error')
		expect(thrown.code).toBe('framing')
	})

	it('refuses a charset other than UTF-8 and reports the spelling it read', () => {
		const header = new TextEncoder().encode(
			'Content-Length: 2\r\nContent-Type: application/vscode-jsonrpc; charset=utf-16',
		)
		let thrown: unknown

		try {
			readLSPHeader(header, [])
		} catch (error) {
			thrown = error
		}
		if (!isLSPError(thrown)) throw new Error('Expected a branded LSP error')
		expect(thrown.code).toBe('framing')
		expect(thrown.context?.value).toBe('utf-16')
	})

	it('attaches the messages decoded before the header to a refusal', () => {
		const decoded: JSONRPCNotification = { jsonrpc: '2.0', method: 'initialized' }
		let thrown: unknown

		try {
			readLSPHeader(new TextEncoder().encode('X-Trace: 1'), [decoded])
		} catch (error) {
			thrown = error
		}
		if (!isLSPError(thrown)) throw new Error('Expected a branded LSP error')
		expect(thrown.context?.messages).toEqual([decoded])
		expect(Object.isFrozen(thrown.context?.messages)).toBe(true)
	})
})

describe('readLSPBody', () => {
	it('returns the decoded JSON-RPC message', () => {
		const message: JSONRPCNotification = { jsonrpc: '2.0', method: 'initialized' }
		const body = new TextEncoder().encode(JSON.stringify(message))

		expect(readLSPBody(body, [])).toEqual(message)
	})

	it('decodes an astral code point', () => {
		const message: JSONRPCNotification = {
			jsonrpc: '2.0',
			method: 'textDocument/publishDiagnostics',
			params: { message: 'A😀Z' },
		}
		const body = new TextEncoder().encode(JSON.stringify(message))

		expect(readLSPBody(body, [])).toEqual(message)
	})

	it('refuses content that is not valid UTF-8', () => {
		let thrown: unknown

		try {
			readLSPBody(Uint8Array.of(123, 255, 125), [])
		} catch (error) {
			thrown = error
		}
		if (!isLSPError(thrown)) throw new Error('Expected a branded LSP error')
		expect(thrown.code).toBe('framing')
	})

	it('refuses content that is not valid JSON', () => {
		let thrown: unknown

		try {
			readLSPBody(new TextEncoder().encode('{'), [])
		} catch (error) {
			thrown = error
		}
		if (!isLSPError(thrown)) throw new Error('Expected a branded LSP error')
		expect(thrown.code).toBe('protocol')
		expect(thrown.context?.code).toBe(JSONRPC_PARSE_ERROR)
	})

	it('refuses JSON that is not a JSON-RPC message', () => {
		let thrown: unknown

		try {
			readLSPBody(new TextEncoder().encode('{"jsonrpc":"1.0","method":"initialized"}'), [])
		} catch (error) {
			thrown = error
		}
		if (!isLSPError(thrown)) throw new Error('Expected a branded LSP error')
		expect(thrown.code).toBe('protocol')
		expect(thrown.context?.code).toBe(JSONRPC_INVALID_REQUEST)
	})

	it('attaches the messages decoded before the body to a refusal', () => {
		const decoded: JSONRPCNotification = { jsonrpc: '2.0', method: 'initialized' }
		let thrown: unknown

		try {
			readLSPBody(new TextEncoder().encode('{'), [decoded])
		} catch (error) {
			thrown = error
		}
		if (!isLSPError(thrown)) throw new Error('Expected a branded LSP error')
		expect(thrown.context?.messages).toEqual([decoded])
		expect(Object.isFrozen(thrown.context?.messages)).toBe(true)
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
