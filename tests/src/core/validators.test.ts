import {
	isJSONRPCError,
	isJSONRPCNotification,
	isJSONRPCRequest,
	isJSONRPCResponse,
	isLSPCodeDescription,
	isLSPDiagnostic,
	isLSPDiagnosticOptions,
	isLSPDiagnosticRelated,
	isLSPDocumentDiagnosticReport,
	isLSPError,
	isLSPIdentity,
	isLSPInitializeResult,
	isLSPLocation,
	isLSPPosition,
	isLSPPublishDiagnosticsParams,
	isLSPRange,
	isLSPServerCapabilities,
	isLSPTextDocumentSyncOptions,
	LSPError,
} from '@src/core'
import { describe, expect, it } from 'vitest'

describe('JSON-RPC guards', () => {
	it('accepts each envelope arm and refuses overlapping arms', () => {
		expect(isJSONRPCRequest({ jsonrpc: '2.0', id: 1, method: 'initialize', params: {} })).toBe(true)
		expect(isJSONRPCNotification({ jsonrpc: '2.0', method: 'initialized' })).toBe(true)
		expect(isJSONRPCResponse({ jsonrpc: '2.0', id: 'request', result: null })).toBe(true)
		expect(
			isJSONRPCResponse({
				jsonrpc: '2.0',
				id: null,
				error: { code: -32700, message: 'Parse error' },
			}),
		).toBe(true)
		expect(isJSONRPCError({ code: -32603, message: 'Internal error', data: null })).toBe(true)
		expect(
			isJSONRPCResponse({
				jsonrpc: '2.0',
				id: 1,
				result: null,
				error: { code: -32603, message: 'Internal error' },
			}),
		).toBe(false)
	})

	it('returns false for null, primitives, arrays, and wrong-typed members', () => {
		for (const value of [null, undefined, true, 1, 'message', []]) {
			expect(isJSONRPCRequest(value)).toBe(false)
			expect(isJSONRPCNotification(value)).toBe(false)
			expect(isJSONRPCResponse(value)).toBe(false)
		}
		expect(isJSONRPCRequest({ jsonrpc: '2.0', id: null, method: 'initialize' })).toBe(false)
		expect(isJSONRPCNotification({ jsonrpc: '2.0', method: 1 })).toBe(false)
		expect(isJSONRPCResponse({ jsonrpc: '2.0', id: 1, error: 'failed' })).toBe(false)
		expect(isJSONRPCError({ code: '-32603', message: 'Internal error' })).toBe(false)
	})
})

describe('LSP wire guards', () => {
	it('accepts the diagnostic and initialization structures this client reads', () => {
		const position = { line: 0, character: 2 }
		const range = { start: position, end: { line: 0, character: 4 } }
		const location = { uri: 'file:///workspace/main.ts', range }
		const related = { location, message: 'Related declaration' }
		const diagnostic = {
			range,
			severity: 2,
			code: 'unused',
			codeDescription: { href: 'https://example.invalid/unused' },
			source: 'fixture',
			message: 'Unused declaration',
			tags: [1],
			relatedInformation: [related],
			data: { fixable: true },
		}

		expect(isLSPPosition(position)).toBe(true)
		expect(isLSPRange(range)).toBe(true)
		expect(isLSPLocation(location)).toBe(true)
		expect(isLSPCodeDescription(diagnostic.codeDescription)).toBe(true)
		expect(isLSPDiagnosticRelated(related)).toBe(true)
		expect(isLSPDiagnostic(diagnostic)).toBe(true)
		expect(
			isLSPPublishDiagnosticsParams({
				uri: 'file:///workspace/main.ts',
				version: 1,
				diagnostics: [diagnostic],
			}),
		).toBe(true)
		expect(
			isLSPDocumentDiagnosticReport({ kind: 'full', resultId: 'r1', items: [diagnostic] }),
		).toBe(true)
		expect(isLSPDocumentDiagnosticReport({ kind: 'unchanged', resultId: 'r1' })).toBe(true)
		expect(isLSPIdentity({ name: 'fixture', version: '1.0.0' })).toBe(true)
		expect(isLSPTextDocumentSyncOptions({ openClose: true, change: 1 })).toBe(true)
		expect(
			isLSPDiagnosticOptions({
				identifier: 'fixture',
				interFileDependencies: false,
				workspaceDiagnostics: false,
			}),
		).toBe(true)
		expect(
			isLSPServerCapabilities({
				positionEncoding: 'utf-16',
				textDocumentSync: { openClose: true, change: 1 },
				diagnosticProvider: {
					interFileDependencies: false,
					workspaceDiagnostics: false,
				},
				experimental: { fixture: true },
			}),
		).toBe(true)
		expect(
			isLSPInitializeResult({
				capabilities: { positionEncoding: 'utf-16' },
				serverInfo: { name: 'fixture' },
			}),
		).toBe(true)
	})

	it('returns false for hostile and wrong-typed wire values without throwing', () => {
		const revocable = Proxy.revocable({}, {})
		revocable.revoke()
		for (const value of [null, false, 4, 'diagnostic', [], revocable.proxy]) {
			expect(() => isLSPDiagnostic(value)).not.toThrow()
			expect(isLSPDiagnostic(value)).toBe(false)
			expect(() => isLSPPublishDiagnosticsParams(value)).not.toThrow()
			expect(isLSPPublishDiagnosticsParams(value)).toBe(false)
			expect(() => isLSPDocumentDiagnosticReport(value)).not.toThrow()
			expect(isLSPDocumentDiagnosticReport(value)).toBe(false)
			expect(() => isLSPInitializeResult(value)).not.toThrow()
			expect(isLSPInitializeResult(value)).toBe(false)
		}
		expect(
			isLSPDiagnostic({
				range: { start: { line: -1, character: 0 }, end: { line: 0, character: 0 } },
				message: 'Invalid range',
			}),
		).toBe(false)
		expect(isLSPPublishDiagnosticsParams({ uri: 1, diagnostics: 'not an array' })).toBe(false)
		expect(isLSPDocumentDiagnosticReport({ kind: 'unchanged', resultId: 1 })).toBe(false)
		expect(isLSPInitializeResult({ capabilities: { textDocumentSync: 4 } })).toBe(false)
	})

	it('recognizes branded package errors and refuses lookalikes', () => {
		const error = new LSPError('Invalid frame', {
			code: 'framing',
			context: { code: -32700 },
		})
		expect(isLSPError(error)).toBe(true)
		expect(error.context).toEqual({ code: -32700 })
		expect(isLSPError(new Error('Invalid frame'))).toBe(false)
		expect(isLSPError({ name: 'LSPError', code: 'framing' })).toBe(false)
		expect(isLSPError(null)).toBe(false)
	})
})
