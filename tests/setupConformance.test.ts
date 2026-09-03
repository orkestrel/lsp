import {
	CONFORMANCE_MODEL,
	META_MODEL_DIGEST,
	META_MODEL_PATH,
	formatConformanceDrift,
	formatConformanceValue,
	readConformanceDrift,
	readEnumeration,
	readForbiddenImport,
	readMetaModel,
	readMethod,
	readProperty,
	readStructure,
} from './setupConformance.js'
import { createScratch, destroyScratch } from '@orkestrel/test/server'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('conformance infrastructure', () => {
	it('loads the pinned metaModel mirror', () => {
		expect(readMetaModel(META_MODEL_PATH).metaData.version).toBe('3.18.0')
	})

	it('reads a method hit and miss', () => {
		expect(readMethod(CONFORMANCE_MODEL, 'initialize')?.method).toBe('initialize')
		expect(readMethod(CONFORMANCE_MODEL, 'example/missing')).toBeUndefined()
	})

	it('reads an enumeration hit and miss', () => {
		expect(readEnumeration(CONFORMANCE_MODEL, 'ErrorCodes', 'ParseError')).toBe(-32700)
		expect(readEnumeration(CONFORMANCE_MODEL, 'ErrorCodes', 'Missing')).toBeUndefined()
	})

	it('reads a structure hit and miss', () => {
		expect(readStructure(CONFORMANCE_MODEL, 'Position')?.name).toBe('Position')
		expect(readStructure(CONFORMANCE_MODEL, 'Missing')).toBeUndefined()
	})

	it('reads a structure property hit and miss', () => {
		expect(readProperty(CONFORMANCE_MODEL, 'Position', 'line')?.base).toBe('uinteger')
		expect(readProperty(CONFORMANCE_MODEL, 'Position', 'column')).toBeUndefined()
	})

	it('reports a wrong method with the symbol and authority value', () => {
		expect(
			readConformanceDrift(
				'LSP_METHODS.initialize',
				'initialize/control',
				'metaModel',
				'initialize',
			),
		).toBe('LSP_METHODS.initialize drifted; metaModel=initialize')
	})

	it('reports a wrong numeral with the symbol and authority value', () => {
		expect(readConformanceDrift('JSONRPC_PARSE_ERROR', -1, 'installed', -32700)).toBe(
			'JSONRPC_PARSE_ERROR drifted; installed=-32700',
		)
	})

	it('reports a missing structure member with the symbol and authority value', () => {
		const property = readProperty(CONFORMANCE_MODEL, 'Position', 'column')
		expect(formatConformanceDrift('LSPPosition.column', 'Position.column', property)).toBe(
			'LSPPosition.column drifted; Position.column=undefined',
		)
	})

	it('formats a value JSON.stringify cannot serialize through String(value)', () => {
		expect(formatConformanceValue(9007199254740993n)).toBe('9007199254740993')
	})

	it('refuses a byte-perturbed mirror copy before parsing', async () => {
		const scratch = createScratch({ prefix: 'conformance-' })
		try {
			const text = readFileSync(META_MODEL_PATH, 'utf8')
			const path = scratch.write(
				'metaModel.json',
				`${text.startsWith('{') ? '[' : '{'}${text.slice(1)}`,
			)
			expect(() => readMetaModel(path, META_MODEL_DIGEST)).toThrow(
				`metaModel bytes drifted; SHA-256=${META_MODEL_DIGEST}`,
			)
		} finally {
			await destroyScratch(scratch)
		}
	})

	it('reports a forbidden import from TypeScript syntax', () => {
		expect(readForbiddenImport("import {} from 'vscode-jsonrpc'\n")).toBe('vscode-jsonrpc')
		expect(readForbiddenImport("import {} from '@orkestrel/contract'\n")).toBeUndefined()
	})
})
