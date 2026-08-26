import * as core from '@src/core'
import { LSP_ENCODINGS, LSP_METHODS } from '@src/core'
import {
	CONFORMANCE_DECLARED_RANGE,
	CONFORMANCE_FORBIDDEN_DEPENDENCY,
	CONFORMANCE_FORBIDDEN_SOURCE,
	CONFORMANCE_GUARDS,
	CONFORMANCE_INSTALLED_VERSION,
	CONFORMANCE_LOCK_VERSION,
	CONFORMANCE_META_VERSION,
	CONFORMANCE_METHODS,
	CONFORMANCE_NUMERALS,
	CONFORMANCE_STRUCTURES,
	CONFORMANCE_VALUES,
	META_MODEL_DIGEST,
	META_MODEL_PATH,
	META_MODEL_VERSION,
	PROTOCOL_DECLARED_RANGE,
	PROTOCOL_RELEASE_LINE,
	readConformanceDrift,
	readFileDigest,
} from './setupConformance.js'
import { describe, expect, it } from 'vitest'

describe('LSP method conformance', () => {
	it('covers the exact LSP_METHODS symbol set', () => {
		expect(new Set(CONFORMANCE_METHODS.map((row) => row.symbol))).toStrictEqual(
			new Set(Object.keys(LSP_METHODS).map((key) => `LSP_METHODS.${key}`)),
		)
	})

	it.each(CONFORMANCE_METHODS)('$symbol matches the metaModel method', (row) => {
		expect(readConformanceDrift(row.symbol, row.local, 'metaModel', row.model)).toBeUndefined()
	})

	it.each(CONFORMANCE_METHODS)('$symbol matches the metaModel direction', (row) => {
		expect(
			readConformanceDrift(row.symbol, row.expected, 'metaModel messageDirection', row.direction),
		).toBeUndefined()
	})

	it.each(CONFORMANCE_METHODS.filter((row) => row.installed !== undefined))(
		'$symbol matches the installed method namespace',
		(row) => {
			expect(
				readConformanceDrift(row.symbol, row.model, 'installed', row.installed),
			).toBeUndefined()
		},
	)
})

describe('LSP numeral conformance', () => {
	it('covers every negative numeral the core barrel exports', () => {
		expect(new Set(CONFORMANCE_NUMERALS.map((row) => row.symbol))).toStrictEqual(
			new Set(
				Object.entries(core)
					.filter(([, value]) => typeof value === 'number' && value < 0)
					.map(([name]) => name),
			),
		)
	})

	it.each(CONFORMANCE_NUMERALS)('$symbol matches the installed namespace', (row) => {
		expect(readConformanceDrift(row.symbol, row.local, 'installed', row.installed)).toBeUndefined()
	})

	it.each(CONFORMANCE_NUMERALS)('$symbol matches the metaModel enumeration', (row) => {
		expect(readConformanceDrift(row.symbol, row.local, 'metaModel', row.model)).toBeUndefined()
	})
})

describe('LSP value conformance', () => {
	it('covers the declared LSP_ENCODINGS symbols without claiming string-enumeration closure', () => {
		expect(
			new Set(
				CONFORMANCE_VALUES.filter((row) => row.symbol.startsWith('LSP_ENCODINGS.')).map(
					(row) => row.symbol,
				),
			),
		).toStrictEqual(new Set(LSP_ENCODINGS.map((encoding) => `LSP_ENCODINGS.${encoding}`)))
	})

	it.each(CONFORMANCE_VALUES)('$symbol matches the installed namespace', (row) => {
		expect(readConformanceDrift(row.symbol, row.local, 'installed', row.installed)).toBeUndefined()
	})

	it.each(CONFORMANCE_VALUES)('$symbol matches the metaModel enumeration', (row) => {
		expect(readConformanceDrift(row.symbol, row.local, 'metaModel', row.model)).toBeUndefined()
	})
})

describe('LSP structure conformance', () => {
	it('covers exactly the projected structure members this package speaks', () => {
		expect(new Set(CONFORMANCE_STRUCTURES.map((row) => row.symbol))).toStrictEqual(
			new Set([
				'LSPInitializeParams.processId',
				'LSPInitializeParams.clientInfo',
				'LSPInitializeParams.rootUri',
				'LSPInitializeParams.capabilities',
				'LSPClientCapabilities.general',
				'LSPClientCapabilities.textDocument',
				'LSPClientCapabilities.general.positionEncodings',
				'LSPClientCapabilities.textDocument.synchronization',
				'LSPClientCapabilities.textDocument.publishDiagnostics',
				'LSPClientCapabilities.textDocument.diagnostic',
				'LSPInitializeResult.capabilities',
				'LSPInitializeResult.serverInfo',
				'LSPIdentity.name (client)',
				'LSPIdentity.version (client)',
				'LSPIdentity.name (server)',
				'LSPIdentity.version (server)',
				'LSPServerCapabilities.positionEncoding',
				'LSPServerCapabilities.textDocumentSync',
				'LSPServerCapabilities.diagnosticProvider',
				'LSPTextDocumentSyncOptions.openClose',
				'LSPTextDocumentSyncOptions.change',
				'LSPDiagnosticOptions.identifier',
				'LSPDiagnosticOptions.interFileDependencies',
				'LSPDiagnosticOptions.workspaceDiagnostics',
				'LSP_METHODS.open.params.textDocument',
				'LSP_METHODS.close.params.textDocument',
				'LSPDocumentDiagnosticParams.textDocument',
				'LSPDocumentDiagnosticParams.identifier',
				'LSPDocumentDiagnosticParams.previousResultId',
				'LSPDocumentDiagnosticReport.full.kind',
				'LSPDocumentDiagnosticReport.full.resultId',
				'LSPDocumentDiagnosticReport.full.items',
				'LSPDocumentDiagnosticReport.unchanged.kind',
				'LSPDocumentDiagnosticReport.unchanged.resultId',
				'LSPPublishDiagnosticsParams.uri',
				'LSPPublishDiagnosticsParams.version',
				'LSPPublishDiagnosticsParams.diagnostics',
				'LSPPosition.line',
				'LSPPosition.character',
				'LSPRange.start',
				'LSPRange.end',
				'LSPLocation.uri',
				'LSPLocation.range',
				'LSPCodeDescription.href',
				'LSPDiagnosticRelated.location',
				'LSPDiagnosticRelated.message',
				'LSPDiagnostic.range',
				'LSPDiagnostic.severity',
				'LSPDiagnostic.code',
				'LSPDiagnostic.codeDescription',
				'LSPDiagnostic.source',
				'LSPDiagnostic.message',
				'LSPDiagnostic.tags',
				'LSPDiagnostic.relatedInformation',
				'LSPDiagnostic.data',
				'LSPTextDocumentIdentifier.uri',
				'LSPTextDocumentItem.uri',
				'LSPTextDocumentItem.languageId',
				'LSPTextDocumentItem.version',
				'LSPTextDocumentItem.text',
			]),
		)
	})

	it.each(CONFORMANCE_STRUCTURES)('$symbol exists in the named metaModel structure', (row) => {
		expect(
			readConformanceDrift(
				row.symbol,
				row.authority !== undefined,
				`${row.structure}.${row.member} present`,
				true,
			),
		).toBeUndefined()
	})

	it.each(CONFORMANCE_STRUCTURES)('$symbol matches metaModel requiredness', (row) => {
		expect(
			readConformanceDrift(row.symbol, row.optional, 'metaModel optional', row.authority?.optional),
		).toBeUndefined()
	})

	it.each(CONFORMANCE_STRUCTURES.filter((row) => row.base !== undefined))(
		'$symbol matches the metaModel base type',
		(row) => {
			expect(
				readConformanceDrift(row.symbol, row.base, 'metaModel base', row.authority?.base),
			).toBeUndefined()
		},
	)
})

describe('LSP guard conformance', () => {
	it('covers exactly the exported guards this package publishes', () => {
		expect(new Set(CONFORMANCE_GUARDS.map((row) => row.symbol))).toStrictEqual(
			new Set([
				'isLSPPosition',
				'isLSPRange',
				'isLSPLocation',
				'isLSPCodeDescription',
				'isLSPDiagnosticRelated',
				'isLSPDiagnostic',
				'isLSPPublishDiagnosticsParams',
				'isLSPDocumentDiagnosticReport',
				'isLSPIdentity',
				'isLSPTextDocumentSyncOptions',
				'isLSPDiagnosticOptions',
				'isLSPServerCapabilities',
				'isLSPInitializeResult',
			]),
		)
	})

	it.each(CONFORMANCE_GUARDS)('$symbol accepts an authority-shaped value', (row) => {
		expect(
			readConformanceDrift(row.symbol, row.local(row.value), 'metaModel shape', true),
		).toBeUndefined()
	})

	it.each(CONFORMANCE_GUARDS.filter((row) => row.installed !== undefined))(
		'$symbol matches the installed executable guard',
		(row) => {
			expect(
				readConformanceDrift(row.symbol, row.installed?.(row.value), 'installed guard', true),
			).toBeUndefined()
		},
	)
})

describe('LSP dependency conformance', () => {
	it('keeps the upstream protocol family out of published dependency fields', () => {
		expect(
			readConformanceDrift(
				'package.json dependencies',
				CONFORMANCE_FORBIDDEN_DEPENDENCY,
				'boundary',
				undefined,
			),
		).toBeUndefined()
	})

	it('keeps the upstream protocol family out of src imports', () => {
		expect(
			readConformanceDrift('src imports', CONFORMANCE_FORBIDDEN_SOURCE, 'boundary', undefined),
		).toBeUndefined()
	})
})

describe('LSP authority pins', () => {
	it('pins the metaModel raw-byte digest before parsing', () => {
		expect(
			readConformanceDrift(
				'metaModel bytes',
				readFileDigest(META_MODEL_PATH),
				'SHA-256',
				META_MODEL_DIGEST,
			),
		).toBeUndefined()
	})

	it('pins the metaModel protocol version', () => {
		expect(
			readConformanceDrift(
				'metaData.version',
				CONFORMANCE_META_VERSION,
				'metaModel',
				META_MODEL_VERSION,
			),
		).toBeUndefined()
	})

	it('pins the installed release to the 3.18 line', () => {
		expect(
			readConformanceDrift(
				'installed release',
				PROTOCOL_RELEASE_LINE.test(CONFORMANCE_INSTALLED_VERSION ?? ''),
				'release line 3.18.x',
				true,
			),
		).toBeUndefined()
	})

	it('pins the lockfile to the installed release', () => {
		expect(
			readConformanceDrift(
				'package-lock.json release',
				CONFORMANCE_LOCK_VERSION,
				'installed',
				CONFORMANCE_INSTALLED_VERSION,
			),
		).toBeUndefined()
	})

	it('pins the workspace declaration to the approved range', () => {
		expect(
			readConformanceDrift(
				'package.json range',
				CONFORMANCE_DECLARED_RANGE,
				'declared',
				PROTOCOL_DECLARED_RANGE,
			),
		).toBeUndefined()
	})
})
