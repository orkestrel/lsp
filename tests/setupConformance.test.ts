import {
	CONFORMANCE_MODEL,
	META_MODEL_DIGEST,
	META_MODEL_PATH,
	formatConformanceDrift,
	formatConformanceValue,
	isSyntaxNode,
	readConformanceDrift,
	readEnumeration,
	readForbiddenImport,
	readForbiddenNode,
	readMetaModel,
	readMethod,
	readNodeSpecifier,
	readProperty,
	readStructure,
} from './setupConformance.js'
import { createScratch, destroyScratch } from '@orkestrel/test/server'
import { readFileSync } from 'node:fs'
import { parseSync } from 'vite'
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

	it('reports a static import of the protocol family', () => {
		expect(readForbiddenImport("import { Message } from 'vscode-jsonrpc'\n")).toBe('vscode-jsonrpc')
		expect(readForbiddenImport("import { isRecord } from '@orkestrel/contract'\n")).toBeUndefined()
	})

	it('reports a type-only import of the protocol family', () => {
		expect(readForbiddenImport("import type { Message } from 'vscode-jsonrpc'\n")).toBe(
			'vscode-jsonrpc',
		)
		expect(
			readForbiddenImport("import type { Guard } from '@orkestrel/contract'\n"),
		).toBeUndefined()
	})

	it('reports a bare side-effect import of the protocol family', () => {
		expect(readForbiddenImport("import 'vscode-jsonrpc'\n")).toBe('vscode-jsonrpc')
		expect(readForbiddenImport("import '@orkestrel/contract'\n")).toBeUndefined()
	})

	it('reports a re-export of the protocol family', () => {
		expect(readForbiddenImport("export { Message } from 'vscode-jsonrpc'\n")).toBe('vscode-jsonrpc')
		expect(readForbiddenImport("export * from 'vscode-jsonrpc'\n")).toBe('vscode-jsonrpc')
		expect(readForbiddenImport("export { isRecord } from '@orkestrel/contract'\n")).toBeUndefined()
		expect(readForbiddenImport("export * from '@orkestrel/contract'\n")).toBeUndefined()
	})

	it('reports an import assignment of the protocol family', () => {
		expect(readForbiddenImport("import rpc = require('vscode-jsonrpc')\n")).toBe('vscode-jsonrpc')
		expect(
			readForbiddenImport("import contract = require('@orkestrel/contract')\n"),
		).toBeUndefined()
	})

	it('reports a dynamic import of the protocol family', () => {
		expect(readForbiddenImport("const load = () => import('vscode-jsonrpc')\n")).toBe(
			'vscode-jsonrpc',
		)
		expect(
			readForbiddenImport("const load = () => import('@orkestrel/contract')\n"),
		).toBeUndefined()
	})

	it('reports a family specifier nested under a node that names another package', () => {
		expect(
			readForbiddenImport(
				"const load = () => import('@orkestrel/contract', { with: import('vscode-jsonrpc') })\n",
			),
		).toBe('vscode-jsonrpc')
	})

	it('reports the earlier of two family specifiers when the earlier one is nested', () => {
		expect(
			readForbiddenImport(
				"const load = () => import('@orkestrel/contract', { with: import('vscode-jsonrpc') })\nimport { Message } from 'vscode-jsonrpc/lib/common/message'\n",
			),
		).toBe('vscode-jsonrpc')
	})

	it('refuses source the parser rejects, naming the file', () => {
		expect(() => readForbiddenImport("import { from 'vscode-jsonrpc'\n", 'broken.ts')).toThrow(
			'The parser refused broken.ts:',
		)
	})

	it('reads no specifier from a non-literal import() expression or a require call', () => {
		expect(readForbiddenImport('const load = (name: string) => import(name)\n')).toBeUndefined()
		expect(readForbiddenImport("const rpc = require('vscode-jsonrpc')\n")).toBeUndefined()
	})

	it('reads a family specifier beneath a node carrying a parent back-link', () => {
		const program: Record<string, unknown> = { type: 'Program' }
		const statement = {
			type: 'ExpressionStatement',
			parent: program,
			expression: {
				type: 'ImportExpression',
				source: { type: 'Literal', value: 'vscode-jsonrpc' },
			},
		}
		program.body = [statement]
		expect(readForbiddenNode(program)).toBe('vscode-jsonrpc')
	})

	it('checks a record carrying a string type member as a syntax node', () => {
		expect(isSyntaxNode({ type: 'ImportDeclaration' })).toBe(true)
		expect(isSyntaxNode({ source: 'vscode-jsonrpc' })).toBe(false)
		expect(isSyntaxNode('ImportDeclaration')).toBe(false)
		expect(isSyntaxNode(null)).toBe(false)
	})

	it('reads the specifier each declaration form names, and none from the forms naming no module', () => {
		const source = [
			"import { Message } from 'vscode-jsonrpc'",
			"export * from 'vscode-jsonrpc'",
			"export { Message } from 'vscode-jsonrpc'",
			'export const local = 1',
			"import rpc = require('vscode-jsonrpc')",
			'import alias = rpc.Message',
		].join('\n')
		expect(parseSync('source.ts', `${source}\n`).program.body.map(readNodeSpecifier)).toEqual([
			'vscode-jsonrpc',
			'vscode-jsonrpc',
			'vscode-jsonrpc',
			undefined,
			'vscode-jsonrpc',
			undefined,
		])
	})

	it('reads a literal import expression as its specifier and a non-literal one as none', () => {
		const { program } = parseSync('source.ts', "import('vscode-jsonrpc')\nimport(specifier)\n")
		expect(
			program.body.map((statement) =>
				statement.type === 'ExpressionStatement'
					? readNodeSpecifier(statement.expression)
					: statement.type,
			),
		).toEqual(['vscode-jsonrpc', undefined])
	})
})
