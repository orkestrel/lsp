import type { JSONRPCNotification, LSPDecodeState } from '@src/core'
import {
	buildLSPSegment,
	encodeLSPMessage,
	isLSPError,
	JSONRPC_INVALID_REQUEST,
	JSONRPC_PARSE_ERROR,
	LSP_CONTENT_LIMIT,
	readLSPBody,
	readLSPHeader,
	scanLSPBoundary,
	waitForDeadline,
} from '@src/core'
import { attempt } from '@orkestrel/contract'
import { describe, expect, it } from 'vitest'

describe('buildLSPSegment', () => {
	it('preserves the state identity for an empty chunk', () => {
		const state: LSPDecodeState = { bytes: Uint8Array.of(1), size: 1 }
		expect(buildLSPSegment(undefined, new Uint8Array(0))).toBeUndefined()
		expect(buildLSPSegment(state, new Uint8Array(0))).toBe(state)
	})

	it('constructs a first segment with its byte size', () => {
		expect(buildLSPSegment(undefined, Uint8Array.of(1, 2))).toEqual({
			bytes: Uint8Array.of(1, 2),
			size: 2,
		})
	})

	it('links a header-phase segment without resolved framing metadata', () => {
		const previous: LSPDecodeState = { bytes: Uint8Array.of(1), size: 1 }
		const state = buildLSPSegment(previous, Uint8Array.of(2, 3))
		expect(state).toEqual({ bytes: Uint8Array.of(2, 3), previous, size: 3 })
		expect(state?.previous).toBe(previous)
	})

	it('links a body-phase segment with the same boundary and length', () => {
		const previous: LSPDecodeState = { bytes: Uint8Array.of(1), size: 1, boundary: 20, length: 40 }
		const state = buildLSPSegment(previous, Uint8Array.of(2))
		expect(state).toEqual({ bytes: Uint8Array.of(2), previous, size: 2, boundary: 20, length: 40 })
		expect(state?.previous).toBe(previous)
	})

	it('owns a copy unaffected by later chunk mutation', () => {
		const chunk = Uint8Array.of(1, 2)
		const state = buildLSPSegment(undefined, chunk)
		expect(state?.bytes).not.toBe(chunk)
		chunk.fill(0)
		expect(state?.bytes).toEqual(Uint8Array.of(1, 2))
	})
})

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
		const outcome = attempt(() => {
			encodeLSPMessage(message)
		})
		const thrown = outcome.success ? undefined : outcome.error
		expect(isLSPError(thrown)).toBe(true)
		if (!isLSPError(thrown)) throw new Error('Expected a branded LSP error')
		expect(thrown.code).toBe('protocol')
		expect(thrown.context?.code).toBe(JSONRPC_INVALID_REQUEST)
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
		const outcome = attempt(() => {
			readLSPHeader(header, [])
		})
		const thrown = outcome.success ? undefined : outcome.error
		if (!isLSPError(thrown)) throw new Error('Expected a branded LSP error')
		expect(thrown.code).toBe('framing')
	})

	it('refuses an empty header', () => {
		const outcome = attempt(() => {
			readLSPHeader(new Uint8Array(0), [])
		})
		const thrown = outcome.success ? undefined : outcome.error
		if (!isLSPError(thrown)) throw new Error('Expected a branded LSP error')
		expect(thrown.code).toBe('framing')
	})

	it('refuses a field without a colon', () => {
		const outcome = attempt(() => {
			readLSPHeader(new TextEncoder().encode('Content-Length'), [])
		})
		const thrown = outcome.success ? undefined : outcome.error
		if (!isLSPError(thrown)) throw new Error('Expected a branded LSP error')
		expect(thrown.code).toBe('framing')
	})

	it('refuses a field without a name', () => {
		const outcome = attempt(() => {
			readLSPHeader(new TextEncoder().encode(': 2'), [])
		})
		const thrown = outcome.success ? undefined : outcome.error
		if (!isLSPError(thrown)) throw new Error('Expected a branded LSP error')
		expect(thrown.code).toBe('framing')
	})

	it('refuses a header without a Content-Length', () => {
		const header = new TextEncoder().encode('Content-Type: application/vscode-jsonrpc')
		const outcome = attempt(() => {
			readLSPHeader(header, [])
		})
		const thrown = outcome.success ? undefined : outcome.error
		if (!isLSPError(thrown)) throw new Error('Expected a branded LSP error')
		expect(thrown.code).toBe('framing')
	})

	it('refuses a repeated Content-Length', () => {
		const header = new TextEncoder().encode('Content-Length: 2\r\nContent-Length: 3')
		const outcome = attempt(() => {
			readLSPHeader(header, [])
		})
		const thrown = outcome.success ? undefined : outcome.error
		if (!isLSPError(thrown)) throw new Error('Expected a branded LSP error')
		expect(thrown.code).toBe('framing')
	})

	it('refuses an empty Content-Length', () => {
		const outcome = attempt(() => {
			readLSPHeader(new TextEncoder().encode('Content-Length:'), [])
		})
		const thrown = outcome.success ? undefined : outcome.error
		if (!isLSPError(thrown)) throw new Error('Expected a branded LSP error')
		expect(thrown.code).toBe('framing')
	})

	it('refuses a Content-Length carrying a non-digit', () => {
		const outcome = attempt(() => {
			readLSPHeader(new TextEncoder().encode('Content-Length: 12a'), [])
		})
		const thrown = outcome.success ? undefined : outcome.error
		if (!isLSPError(thrown)) throw new Error('Expected a branded LSP error')
		expect(thrown.code).toBe('framing')
	})

	it('refuses a Content-Length beyond safe integer precision', () => {
		const outcome = attempt(() => {
			readLSPHeader(new TextEncoder().encode('Content-Length: 99999999999999999999'), [])
		})
		const thrown = outcome.success ? undefined : outcome.error
		if (!isLSPError(thrown)) throw new Error('Expected a branded LSP error')
		expect(thrown.code).toBe('framing')
	})

	it('refuses a Content-Length above the content limit', () => {
		const header = new TextEncoder().encode(`Content-Length: ${LSP_CONTENT_LIMIT + 1}`)
		const outcome = attempt(() => {
			readLSPHeader(header, [])
		})
		const thrown = outcome.success ? undefined : outcome.error
		if (!isLSPError(thrown)) throw new Error('Expected a branded LSP error')
		expect(thrown.code).toBe('framing')
		expect(thrown.context?.value).toBe(LSP_CONTENT_LIMIT + 1)
	})

	it('refuses a repeated Content-Type', () => {
		const header = new TextEncoder().encode(
			'Content-Length: 2\r\nContent-Type: application/vscode-jsonrpc\r\nContent-Type: application/vscode-jsonrpc',
		)
		const outcome = attempt(() => {
			readLSPHeader(header, [])
		})
		const thrown = outcome.success ? undefined : outcome.error
		if (!isLSPError(thrown)) throw new Error('Expected a branded LSP error')
		expect(thrown.code).toBe('framing')
	})

	it('refuses an unsupported media type', () => {
		const header = new TextEncoder().encode('Content-Length: 2\r\nContent-Type: application/json')
		const outcome = attempt(() => {
			readLSPHeader(header, [])
		})
		const thrown = outcome.success ? undefined : outcome.error
		if (!isLSPError(thrown)) throw new Error('Expected a branded LSP error')
		expect(thrown.code).toBe('framing')
	})

	it('refuses a Content-Type parameter without an equals sign', () => {
		const header = new TextEncoder().encode(
			'Content-Length: 2\r\nContent-Type: application/vscode-jsonrpc; charset',
		)
		const outcome = attempt(() => {
			readLSPHeader(header, [])
		})
		const thrown = outcome.success ? undefined : outcome.error
		if (!isLSPError(thrown)) throw new Error('Expected a branded LSP error')
		expect(thrown.code).toBe('framing')
	})

	it('refuses a repeated charset parameter', () => {
		const header = new TextEncoder().encode(
			'Content-Length: 2\r\nContent-Type: application/vscode-jsonrpc; charset=utf-8; charset=utf-8',
		)
		const outcome = attempt(() => {
			readLSPHeader(header, [])
		})
		const thrown = outcome.success ? undefined : outcome.error
		if (!isLSPError(thrown)) throw new Error('Expected a branded LSP error')
		expect(thrown.code).toBe('framing')
	})

	it('refuses a charset other than UTF-8 and reports the spelling it read', () => {
		const header = new TextEncoder().encode(
			'Content-Length: 2\r\nContent-Type: application/vscode-jsonrpc; charset=utf-16',
		)
		const outcome = attempt(() => {
			readLSPHeader(header, [])
		})
		const thrown = outcome.success ? undefined : outcome.error
		if (!isLSPError(thrown)) throw new Error('Expected a branded LSP error')
		expect(thrown.code).toBe('framing')
		expect(thrown.context?.value).toBe('utf-16')
	})

	it('attaches the messages decoded before the header to a refusal', () => {
		const decoded: JSONRPCNotification = { jsonrpc: '2.0', method: 'initialized' }
		const outcome = attempt(() => {
			readLSPHeader(new TextEncoder().encode('X-Trace: 1'), [decoded])
		})
		const thrown = outcome.success ? undefined : outcome.error
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
		const outcome = attempt(() => {
			readLSPBody(Uint8Array.of(123, 255, 125), [])
		})
		const thrown = outcome.success ? undefined : outcome.error
		if (!isLSPError(thrown)) throw new Error('Expected a branded LSP error')
		expect(thrown.code).toBe('framing')
	})

	it('refuses content that is not valid JSON', () => {
		const outcome = attempt(() => {
			readLSPBody(new TextEncoder().encode('{'), [])
		})
		const thrown = outcome.success ? undefined : outcome.error
		if (!isLSPError(thrown)) throw new Error('Expected a branded LSP error')
		expect(thrown.code).toBe('protocol')
		expect(thrown.context?.code).toBe(JSONRPC_PARSE_ERROR)
	})

	it('refuses JSON that is not a JSON-RPC message', () => {
		const outcome = attempt(() => {
			readLSPBody(new TextEncoder().encode('{"jsonrpc":"1.0","method":"initialized"}'), [])
		})
		const thrown = outcome.success ? undefined : outcome.error
		if (!isLSPError(thrown)) throw new Error('Expected a branded LSP error')
		expect(thrown.code).toBe('protocol')
		expect(thrown.context?.code).toBe(JSONRPC_INVALID_REQUEST)
	})

	it('attaches the messages decoded before the body to a refusal', () => {
		const decoded: JSONRPCNotification = { jsonrpc: '2.0', method: 'initialized' }
		const outcome = attempt(() => {
			readLSPBody(new TextEncoder().encode('{'), [decoded])
		})
		const thrown = outcome.success ? undefined : outcome.error
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
