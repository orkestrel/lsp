import type { Guard } from '@orkestrel/contract'
import type { LSPDiagnosticSeverity, LSPDiagnosticTag, LSPTextDocumentSyncKind } from '@src/core'
import {
	JSONRPC_INTERNAL_ERROR,
	JSONRPC_INVALID_PARAMS,
	JSONRPC_INVALID_REQUEST,
	JSONRPC_METHOD_NOT_FOUND,
	JSONRPC_PARSE_ERROR,
	LSP_CONTENT_MODIFIED,
	LSP_ENCODINGS,
	LSP_METHODS,
	LSP_REQUEST_CANCELLED,
	LSP_REQUEST_FAILED,
	LSP_SERVER_CANCELLED,
	isLSPCodeDescription,
	isLSPDiagnostic,
	isLSPDiagnosticOptions,
	isLSPDiagnosticRelated,
	isLSPDocumentDiagnosticReport,
	isLSPIdentity,
	isLSPInitializeResult,
	isLSPLocation,
	isLSPPosition,
	isLSPPublishDiagnosticsParams,
	isLSPRange,
	isLSPServerCapabilities,
	isLSPTextDocumentSyncOptions,
} from '@src/core'
import { isRecord } from '@orkestrel/contract'
import { WORKSPACE_ROOT } from './setup.js'
import { createHash } from 'node:crypto'
import { globSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'
import {
	CodeDescription,
	Diagnostic,
	DiagnosticRelatedInformation,
	DiagnosticSeverity,
	DiagnosticTag,
	DidCloseTextDocumentNotification,
	DidOpenTextDocumentNotification,
	DocumentDiagnosticRequest,
	ErrorCodes,
	ExitNotification,
	InitializeRequest,
	InitializedNotification,
	Location,
	LSPErrorCodes,
	Position,
	PositionEncodingKind,
	PublishDiagnosticsNotification,
	Range,
	ShutdownRequest,
	TextDocumentSyncKind,
} from 'vscode-languageserver-protocol'

/** Describes the metaModel collections used by the conformance proof. */
export interface ConformanceMetaModel {
	readonly metaData: Readonly<Record<string, unknown>>
	readonly requests: readonly unknown[]
	readonly notifications: readonly unknown[]
	readonly structures: readonly unknown[]
	readonly enumerations: readonly unknown[]
}

/** Describes one protocol method entry read from the metaModel. */
export interface ConformanceMethod {
	readonly method: string
	readonly direction: string
}

/** Describes one metaModel structure and its declared properties. */
export interface ConformanceStructure {
	readonly name: string
	readonly properties: readonly unknown[]
}

/** Describes one metaModel structure property. */
export interface ConformanceProperty {
	readonly name: string
	readonly optional: boolean
	readonly base: string | undefined
}

/** Describes one local method and its protocol authorities. */
export interface ConformanceMethodRow {
	readonly symbol: string
	readonly local: string
	readonly model: string | undefined
	readonly direction: string | undefined
	readonly expected: string
	readonly installed: string | undefined
}

/** Describes one local numeral and its protocol authorities. */
export interface ConformanceNumeralRow {
	readonly symbol: string
	readonly local: number
	readonly model: number | undefined
	readonly installed: number | undefined
}

/** Describes one local protocol value and its protocol authorities. */
export interface ConformanceValueRow {
	readonly symbol: string
	readonly local: string | number
	readonly model: string | number | undefined
	readonly installed: string | number | undefined
}

/** Describes one projected local structure member and its metaModel declaration. */
export interface ConformanceStructureRow {
	readonly symbol: string
	readonly structure: string
	readonly member: string
	readonly optional: boolean
	readonly base: string | undefined
	readonly authority: ConformanceProperty | undefined
}

/** Describes one authority-shaped value checked by local and installed guards. */
export interface ConformanceGuardRow {
	readonly symbol: string
	readonly value: unknown
	readonly local: Guard<unknown>
	readonly installed: Guard<unknown> | undefined
}

/** Pins the fetched metaModel bytes used by this suite. */
export const META_MODEL_DIGEST = 'caae8df639a4248520a3f589fd72945365e9d8ebca5baf564161a515430d9d41'

/** Pins the protocol version declared by the fetched metaModel. */
export const META_MODEL_VERSION = '3.18.0'

/** Pins the installed protocol release line accepted by this suite. */
export const PROTOCOL_RELEASE_LINE = /^3\.18\./u

/** Names the workspace manifest range required by this suite. */
export const PROTOCOL_DECLARED_RANGE = '^3.18.2'

/** Names the upstream runtime family forbidden from published dependencies and source imports. */
export const PROTOCOL_FAMILY: readonly string[] = [
	'vscode-languageserver-protocol',
	'vscode-languageserver-types',
	'vscode-jsonrpc',
]

/** Names the local synchronization mode that sends no document notification. */
export const SYNC_NONE: LSPTextDocumentSyncKind = 0

/** Names the local synchronization mode that sends the whole document on every change. */
export const SYNC_FULL: LSPTextDocumentSyncKind = 1

/** Names the local synchronization mode that sends incremental document changes. */
export const SYNC_INCREMENTAL: LSPTextDocumentSyncKind = 2

/** Names the local diagnostic severity reported as an error. */
export const SEVERITY_ERROR: LSPDiagnosticSeverity = 1

/** Names the local diagnostic severity reported as a warning. */
export const SEVERITY_WARNING: LSPDiagnosticSeverity = 2

/** Names the local diagnostic severity reported as information. */
export const SEVERITY_INFORMATION: LSPDiagnosticSeverity = 3

/** Names the local diagnostic severity reported as a hint. */
export const SEVERITY_HINT: LSPDiagnosticSeverity = 4

/** Names the local diagnostic tag marking unnecessary code. */
export const TAG_UNNECESSARY: LSPDiagnosticTag = 1

/** Names the local diagnostic tag marking deprecated code. */
export const TAG_DEPRECATED: LSPDiagnosticTag = 2

/** Resolves the workspace root URL to a filesystem path. */
export const WORKSPACE_PATH = fileURLToPath(WORKSPACE_ROOT)

/** Resolves the vendored metaModel mirror. */
export const META_MODEL_PATH = resolve(WORKSPACE_PATH, 'tests/mirrors/metaModel.json')

/** Resolves the installed protocol's public entry. */
export const PROTOCOL_ENTRY = createRequire(import.meta.url).resolve(
	'vscode-languageserver-protocol',
)

/** Resolves the installed protocol manifest from its public entry. */
export const PROTOCOL_MANIFEST_PATH = resolve(dirname(PROTOCOL_ENTRY), '../../package.json')

/** Resolves the workspace package manifest. */
export const WORKSPACE_MANIFEST_PATH = resolve(WORKSPACE_PATH, 'package.json')

/** Resolves the workspace lockfile. */
export const WORKSPACE_LOCK_PATH = resolve(WORKSPACE_PATH, 'package-lock.json')

/**
 * Formats a value for a direct conformance failure.
 *
 * @param value - The authoritative value to render.
 * @returns The string itself, its JSON form, or the value's `String` form when it has neither.
 */
export function formatConformanceValue(value: unknown): string {
	if (value === undefined) return 'undefined'
	if (typeof value === 'string') return value
	let serialized: string | undefined
	try {
		serialized = JSON.stringify(value)
	} catch {
		serialized = undefined
	}
	return serialized === undefined ? String(value) : serialized
}

/**
 * Formats a drift message with the local symbol and authoritative value.
 *
 * @param symbol - The local symbol the failing row names.
 * @param authority - The authority the value came from.
 * @param value - The authoritative value the local symbol must match.
 * @returns A message naming the symbol, the authority, and the authoritative value.
 */
export function formatConformanceDrift(symbol: string, authority: string, value: unknown): string {
	return `${symbol} drifted; ${authority}=${formatConformanceValue(value)}`
}

/**
 * Reports a drift message when a direct comparison differs.
 *
 * @param symbol - The local symbol the comparing row names.
 * @param local - The value this package declares.
 * @param authority - The authority the compared value came from.
 * @param value - The authoritative value the local value must match.
 * @returns The drift message, or `undefined` when the values are the same.
 */
export function readConformanceDrift(
	symbol: string,
	local: unknown,
	authority: string,
	value: unknown,
): string | undefined {
	return Object.is(local, value) ? undefined : formatConformanceDrift(symbol, authority, value)
}

/**
 * Computes the SHA-256 digest of a file's raw bytes.
 *
 * @param path - The file to hash.
 * @returns The digest as lowercase hexadecimal.
 * @throws Thrown when the path cannot be read.
 */
export function readFileDigest(path: string): string {
	return createHash('sha256').update(readFileSync(path)).digest('hex')
}

/**
 * Loads the pinned metaModel after validating its raw bytes.
 *
 * @param path - The mirror to read.
 * @param digest - The SHA-256 the raw bytes must hash to. Default: `META_MODEL_DIGEST`.
 * @returns The metaModel collections the conformance proof reads.
 * @throws Thrown when the raw bytes do not hash to `digest`, or when the parsed root omits a required collection.
 */
export function readMetaModel(
	path: string,
	digest: string = META_MODEL_DIGEST,
): ConformanceMetaModel {
	const actual = readFileDigest(path)
	if (actual !== digest) {
		throw new Error(formatConformanceDrift('metaModel bytes', 'SHA-256', digest))
	}
	const parsed: unknown = JSON.parse(readFileSync(path, 'utf8'))
	if (!isRecord(parsed)) throw new Error('The metaModel root is not a record')
	const metaData = parsed.metaData
	const requests = parsed.requests
	const notifications = parsed.notifications
	const structures = parsed.structures
	const enumerations = parsed.enumerations
	if (
		!isRecord(metaData) ||
		!Array.isArray(requests) ||
		!Array.isArray(notifications) ||
		!Array.isArray(structures) ||
		!Array.isArray(enumerations)
	) {
		throw new Error('The metaModel does not expose its required collections')
	}
	return { metaData, requests, notifications, structures, enumerations }
}

/**
 * Reads one method entry from the metaModel.
 *
 * @param model - The parsed metaModel to search.
 * @param method - The protocol method name to find.
 * @returns The method and its declared direction, or `undefined` when the metaModel omits it.
 */
export function readMethod(
	model: ConformanceMetaModel,
	method: string,
): ConformanceMethod | undefined {
	for (const entry of [...model.requests, ...model.notifications]) {
		if (!isRecord(entry) || entry.method !== method || typeof entry.messageDirection !== 'string') {
			continue
		}
		return { method: entry.method, direction: entry.messageDirection }
	}
	return undefined
}

/**
 * Reads one enumeration member value from the metaModel.
 *
 * @param model - The parsed metaModel to search.
 * @param enumeration - The declared enumeration name.
 * @param member - The declared member name inside that enumeration.
 * @returns The member's declared value, or `undefined` when the metaModel omits it.
 */
export function readEnumeration(
	model: ConformanceMetaModel,
	enumeration: string,
	member: string,
): string | number | undefined {
	for (const entry of model.enumerations) {
		if (!isRecord(entry) || entry.name !== enumeration || !Array.isArray(entry.values)) continue
		for (const value of entry.values) {
			if (!isRecord(value) || value.name !== member) continue
			if (typeof value.value === 'string' || typeof value.value === 'number') return value.value
		}
	}
	return undefined
}

/**
 * Reads one named structure from the metaModel.
 *
 * @param model - The parsed metaModel to search.
 * @param name - The declared structure name.
 * @returns The structure and its directly declared properties, or `undefined` when the metaModel omits it.
 */
export function readStructure(
	model: ConformanceMetaModel,
	name: string,
): ConformanceStructure | undefined {
	for (const entry of model.structures) {
		if (!isRecord(entry) || entry.name !== name || !Array.isArray(entry.properties)) continue
		return { name, properties: entry.properties }
	}
	return undefined
}

/**
 * Reads one directly declared structure property from the metaModel.
 *
 * @param model - The parsed metaModel to search.
 * @param structure - The declaring structure's name, which carries the property directly rather than through `extends` or `mixins`.
 * @param member - The declared property name.
 * @returns The property's requiredness and base type, or `undefined` when the structure does not declare it directly.
 * @remarks The base type is `undefined` for every property whose declared type is not a base type.
 */
export function readProperty(
	model: ConformanceMetaModel,
	structure: string,
	member: string,
): ConformanceProperty | undefined {
	const entry = readStructure(model, structure)
	if (entry === undefined) return undefined
	for (const property of entry.properties) {
		if (!isRecord(property) || property.name !== member || !isRecord(property.type)) continue
		const base =
			property.type.kind === 'base' && typeof property.type.name === 'string'
				? property.type.name
				: undefined
		return { name: member, optional: property.optional === true, base }
	}
	return undefined
}

/**
 * Reads one string member from a JSON manifest.
 *
 * @param path - The manifest to read.
 * @param member - The top-level member name to take.
 * @returns The member's string value, or `undefined` when the manifest omits it or holds another type.
 * @throws Thrown when the path cannot be read, or when its bytes are not JSON.
 */
export function readManifestMember(path: string, member: string): string | undefined {
	const parsed: unknown = JSON.parse(readFileSync(path, 'utf8'))
	if (!isRecord(parsed)) return undefined
	const value = Reflect.get(parsed, member)
	return typeof value === 'string' ? value : undefined
}

/**
 * Reads one declared dependency range from a JSON manifest.
 *
 * @param path - The manifest to read.
 * @param field - The dependency field to search, such as `devDependencies`.
 * @param dependency - The dependency name to take.
 * @returns The declared range, or `undefined` when the field or the dependency is absent.
 * @throws Thrown when the path cannot be read, or when its bytes are not JSON.
 */
export function readDeclaredDependency(
	path: string,
	field: string,
	dependency: string,
): string | undefined {
	const parsed: unknown = JSON.parse(readFileSync(path, 'utf8'))
	if (!isRecord(parsed)) return undefined
	const dependencies = Reflect.get(parsed, field)
	if (!isRecord(dependencies)) return undefined
	const value = Reflect.get(dependencies, dependency)
	return typeof value === 'string' ? value : undefined
}

/**
 * Reads the installed protocol release recorded by the workspace lockfile.
 *
 * @param path - The lockfile to read.
 * @returns The recorded release, or `undefined` when the lockfile omits the protocol package.
 * @throws Thrown when the path cannot be read, or when its bytes are not JSON.
 */
export function readLockVersion(path: string): string | undefined {
	const parsed: unknown = JSON.parse(readFileSync(path, 'utf8'))
	if (!isRecord(parsed) || !isRecord(parsed.packages)) return undefined
	const entry = Reflect.get(parsed.packages, 'node_modules/vscode-languageserver-protocol')
	if (!isRecord(entry)) return undefined
	return typeof entry.version === 'string' ? entry.version : undefined
}

/**
 * Reads the first forbidden protocol-family dependency from a manifest.
 *
 * @param path - The manifest to read.
 * @returns The offending `field.dependency` coordinate, `package.json` when the root is not a record, or `undefined` when no published field names the family.
 * @throws Thrown when the path cannot be read, or when its bytes are not JSON.
 */
export function readForbiddenDependency(path: string): string | undefined {
	const parsed: unknown = JSON.parse(readFileSync(path, 'utf8'))
	if (!isRecord(parsed)) return 'package.json'
	for (const field of ['dependencies', 'peerDependencies', 'optionalDependencies']) {
		const dependencies = Reflect.get(parsed, field)
		if (!isRecord(dependencies)) continue
		for (const dependency of PROTOCOL_FAMILY) {
			if (Reflect.has(dependencies, dependency)) return `${field}.${dependency}`
		}
	}
	return undefined
}

/**
 * Reads a protocol-family module specifier, or `undefined` for another package.
 *
 * @param specifier - The module specifier written in the source.
 * @returns The specifier itself when it names a protocol-family package or one of its subpaths, `undefined` otherwise.
 */
export function readProtocolSpecifier(specifier: string): string | undefined {
	for (const dependency of PROTOCOL_FAMILY) {
		if (specifier === dependency || specifier.startsWith(`${dependency}/`)) return specifier
	}
	return undefined
}

/**
 * Reads the first forbidden module specifier beneath one TypeScript syntax node.
 *
 * @param node - The syntax node to walk, including its descendants.
 * @returns The first protocol-family specifier reached in source order, or `undefined` when the subtree names none.
 * @remarks The walk covers static imports and exports, import assignments, and dynamic `import()` calls.
 */
export function readForbiddenNode(node: ts.Node): string | undefined {
	if (
		(ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
		node.moduleSpecifier !== undefined &&
		ts.isStringLiteral(node.moduleSpecifier)
	) {
		return readProtocolSpecifier(node.moduleSpecifier.text)
	}
	if (
		ts.isImportEqualsDeclaration(node) &&
		ts.isExternalModuleReference(node.moduleReference) &&
		node.moduleReference.expression !== undefined &&
		ts.isStringLiteral(node.moduleReference.expression)
	) {
		return readProtocolSpecifier(node.moduleReference.expression.text)
	}
	if (
		ts.isCallExpression(node) &&
		node.expression.kind === ts.SyntaxKind.ImportKeyword &&
		node.arguments.length === 1
	) {
		const [argument] = node.arguments
		if (argument !== undefined && ts.isStringLiteral(argument)) {
			return readProtocolSpecifier(argument.text)
		}
	}
	let forbidden: string | undefined = undefined
	node.forEachChild((child) => {
		if (forbidden === undefined) forbidden = readForbiddenNode(child)
	})
	return forbidden
}

/**
 * Reads the first forbidden import from TypeScript source text.
 *
 * @param source - The TypeScript source text to parse.
 * @param name - The filename the parser reports for that text. Default: `'source.ts'`.
 * @returns The first protocol-family specifier reached in source order, or `undefined` when the text names none.
 */
export function readForbiddenImport(
	source: string,
	name: string = 'source.ts',
): string | undefined {
	return readForbiddenNode(
		ts.createSourceFile(name, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS),
	)
}

/**
 * Reads the first forbidden protocol-family import beneath `src/`.
 *
 * @param root - The workspace root the published source glob resolves against.
 * @returns The offending `path:specifier` coordinate, or `undefined` when no published source names the family.
 * @throws Thrown when a globbed source file cannot be read.
 */
export function readForbiddenSource(root: string): string | undefined {
	for (const path of globSync(['src/**/*.ts', 'src/**/*.tsx', 'src/**/*.mts', 'src/**/*.cts'], {
		cwd: root,
	})) {
		const forbidden = readForbiddenImport(readFileSync(resolve(root, path), 'utf8'), path)
		if (forbidden !== undefined) return `${path}:${forbidden}`
	}
	return undefined
}

/**
 * Checks the string-message diagnostic form exposed by the installed public entry.
 *
 * @param value - The candidate diagnostic to check.
 * @returns True if the installed guards accept the value as a 3.17 string-message diagnostic; false otherwise.
 */
export function isInstalledDiagnostic(value: unknown): value is unknown {
	return Diagnostic.is(value) && Diagnostic.is3_17(value)
}

/** Holds the parsed metaModel used to construct every conformance row at import time. */
export const CONFORMANCE_MODEL = readMetaModel(META_MODEL_PATH)

/**
 * Builds one method row from a fixed protocol coordinate.
 *
 * @param symbol - The local symbol the row's case titles name.
 * @param local - The method string this package declares.
 * @param method - The metaModel method name the row reads.
 * @param expected - The message direction the metaModel must declare.
 * @param installed - The method string the installed namespace exposes, omitted as `undefined` where the namespace exposes none.
 * @returns The row the method suites register.
 */
export function createMethodRow(
	symbol: string,
	local: string,
	method: string,
	expected: string,
	installed: string | undefined,
): ConformanceMethodRow {
	const authority = readMethod(CONFORMANCE_MODEL, method)
	return {
		symbol,
		local,
		model: authority?.method,
		direction: authority?.direction,
		expected,
		installed,
	}
}

/**
 * Builds one numeral row from fixed metaModel and runtime coordinates.
 *
 * @param symbol - The local symbol the row's case titles name.
 * @param local - The numeral this package declares.
 * @param enumeration - The metaModel enumeration holding the authoritative member.
 * @param member - The metaModel member name inside that enumeration.
 * @param installed - The numeral the installed namespace exposes.
 * @returns The row the numeral suites register.
 */
export function createNumeralRow(
	symbol: string,
	local: number,
	enumeration: string,
	member: string,
	installed: number | undefined,
): ConformanceNumeralRow {
	const model = readEnumeration(CONFORMANCE_MODEL, enumeration, member)
	return { symbol, local, model: typeof model === 'number' ? model : undefined, installed }
}

/**
 * Builds one protocol-value row from fixed metaModel and runtime coordinates.
 *
 * @param symbol - The local symbol the row's case titles name.
 * @param local - The protocol value this package declares, taken from a typed local coordinate.
 * @param enumeration - The metaModel enumeration holding the authoritative member.
 * @param member - The metaModel member name inside that enumeration.
 * @param installed - The value the installed namespace exposes.
 * @returns The row the value suites register.
 */
export function createValueRow(
	symbol: string,
	local: string | number,
	enumeration: string,
	member: string,
	installed: string | number | undefined,
): ConformanceValueRow {
	return {
		symbol,
		local,
		model: readEnumeration(CONFORMANCE_MODEL, enumeration, member),
		installed,
	}
}

/**
 * Builds one projected structure-member row.
 *
 * @param symbol - The local symbol the row's case titles name.
 * @param structure - The metaModel structure declaring the member directly.
 * @param member - The declared property name inside that structure.
 * @param optional - If `true`, the local projection declares the member optional; if `false`, it declares the member required.
 * @param base - The metaModel base type the member must declare. Omit it where the declared type is not a base type.
 * @returns The row the structure suites register.
 */
export function createStructureRow(
	symbol: string,
	structure: string,
	member: string,
	optional: boolean,
	base?: string,
): ConformanceStructureRow {
	return {
		symbol,
		structure,
		member,
		optional,
		base,
		authority: readProperty(CONFORMANCE_MODEL, structure, member),
	}
}

/** Covers every protocol method the package sends or consumes. */
export const CONFORMANCE_METHODS: readonly ConformanceMethodRow[] = [
	createMethodRow(
		'LSP_METHODS.initialize',
		LSP_METHODS.initialize,
		'initialize',
		'clientToServer',
		InitializeRequest.method,
	),
	createMethodRow(
		'LSP_METHODS.initialized',
		LSP_METHODS.initialized,
		'initialized',
		'clientToServer',
		InitializedNotification.method,
	),
	createMethodRow(
		'LSP_METHODS.shutdown',
		LSP_METHODS.shutdown,
		'shutdown',
		'clientToServer',
		ShutdownRequest.method,
	),
	createMethodRow(
		'LSP_METHODS.exit',
		LSP_METHODS.exit,
		'exit',
		'clientToServer',
		ExitNotification.method,
	),
	createMethodRow('LSP_METHODS.cancel', LSP_METHODS.cancel, '$/cancelRequest', 'both', undefined),
	createMethodRow(
		'LSP_METHODS.open',
		LSP_METHODS.open,
		'textDocument/didOpen',
		'clientToServer',
		DidOpenTextDocumentNotification.method,
	),
	createMethodRow(
		'LSP_METHODS.close',
		LSP_METHODS.close,
		'textDocument/didClose',
		'clientToServer',
		DidCloseTextDocumentNotification.method,
	),
	createMethodRow(
		'LSP_METHODS.diagnostic',
		LSP_METHODS.diagnostic,
		'textDocument/diagnostic',
		'clientToServer',
		DocumentDiagnosticRequest.method,
	),
	createMethodRow(
		'LSP_METHODS.publish',
		LSP_METHODS.publish,
		'textDocument/publishDiagnostics',
		'serverToClient',
		PublishDiagnosticsNotification.method,
	),
]

/** Covers every declared JSON-RPC and LSP protocol error numeral. */
export const CONFORMANCE_NUMERALS: readonly ConformanceNumeralRow[] = [
	createNumeralRow(
		'JSONRPC_PARSE_ERROR',
		JSONRPC_PARSE_ERROR,
		'ErrorCodes',
		'ParseError',
		ErrorCodes.ParseError,
	),
	createNumeralRow(
		'JSONRPC_INVALID_REQUEST',
		JSONRPC_INVALID_REQUEST,
		'ErrorCodes',
		'InvalidRequest',
		ErrorCodes.InvalidRequest,
	),
	createNumeralRow(
		'JSONRPC_METHOD_NOT_FOUND',
		JSONRPC_METHOD_NOT_FOUND,
		'ErrorCodes',
		'MethodNotFound',
		ErrorCodes.MethodNotFound,
	),
	createNumeralRow(
		'JSONRPC_INVALID_PARAMS',
		JSONRPC_INVALID_PARAMS,
		'ErrorCodes',
		'InvalidParams',
		ErrorCodes.InvalidParams,
	),
	createNumeralRow(
		'JSONRPC_INTERNAL_ERROR',
		JSONRPC_INTERNAL_ERROR,
		'ErrorCodes',
		'InternalError',
		ErrorCodes.InternalError,
	),
	createNumeralRow(
		'LSP_REQUEST_CANCELLED',
		LSP_REQUEST_CANCELLED,
		'LSPErrorCodes',
		'RequestCancelled',
		LSPErrorCodes.RequestCancelled,
	),
	createNumeralRow(
		'LSP_CONTENT_MODIFIED',
		LSP_CONTENT_MODIFIED,
		'LSPErrorCodes',
		'ContentModified',
		LSPErrorCodes.ContentModified,
	),
	createNumeralRow(
		'LSP_SERVER_CANCELLED',
		LSP_SERVER_CANCELLED,
		'LSPErrorCodes',
		'ServerCancelled',
		LSPErrorCodes.ServerCancelled,
	),
	createNumeralRow(
		'LSP_REQUEST_FAILED',
		LSP_REQUEST_FAILED,
		'LSPErrorCodes',
		'RequestFailed',
		LSPErrorCodes.RequestFailed,
	),
]

/** Covers local closed protocol values without claiming closed custom string enumerations. */
export const CONFORMANCE_VALUES: readonly ConformanceValueRow[] = [
	createValueRow(
		'LSP_ENCODINGS.utf-8',
		LSP_ENCODINGS[0],
		'PositionEncodingKind',
		'UTF8',
		PositionEncodingKind.UTF8,
	),
	createValueRow(
		'LSP_ENCODINGS.utf-16',
		LSP_ENCODINGS[1],
		'PositionEncodingKind',
		'UTF16',
		PositionEncodingKind.UTF16,
	),
	createValueRow(
		'LSP_ENCODINGS.utf-32',
		LSP_ENCODINGS[2],
		'PositionEncodingKind',
		'UTF32',
		PositionEncodingKind.UTF32,
	),
	createValueRow(
		'LSPTextDocumentSyncKind.None',
		SYNC_NONE,
		'TextDocumentSyncKind',
		'None',
		TextDocumentSyncKind.None,
	),
	createValueRow(
		'LSPTextDocumentSyncKind.Full',
		SYNC_FULL,
		'TextDocumentSyncKind',
		'Full',
		TextDocumentSyncKind.Full,
	),
	createValueRow(
		'LSPTextDocumentSyncKind.Incremental',
		SYNC_INCREMENTAL,
		'TextDocumentSyncKind',
		'Incremental',
		TextDocumentSyncKind.Incremental,
	),
	createValueRow(
		'LSPDiagnosticSeverity.Error',
		SEVERITY_ERROR,
		'DiagnosticSeverity',
		'Error',
		DiagnosticSeverity.Error,
	),
	createValueRow(
		'LSPDiagnosticSeverity.Warning',
		SEVERITY_WARNING,
		'DiagnosticSeverity',
		'Warning',
		DiagnosticSeverity.Warning,
	),
	createValueRow(
		'LSPDiagnosticSeverity.Information',
		SEVERITY_INFORMATION,
		'DiagnosticSeverity',
		'Information',
		DiagnosticSeverity.Information,
	),
	createValueRow(
		'LSPDiagnosticSeverity.Hint',
		SEVERITY_HINT,
		'DiagnosticSeverity',
		'Hint',
		DiagnosticSeverity.Hint,
	),
	createValueRow(
		'LSPDiagnosticTag.Unnecessary',
		TAG_UNNECESSARY,
		'DiagnosticTag',
		'Unnecessary',
		DiagnosticTag.Unnecessary,
	),
	createValueRow(
		'LSPDiagnosticTag.Deprecated',
		TAG_DEPRECATED,
		'DiagnosticTag',
		'Deprecated',
		DiagnosticTag.Deprecated,
	),
]

/** Covers every projected local member of the wire structures the client produces or consumes. */
export const CONFORMANCE_STRUCTURES: readonly ConformanceStructureRow[] = [
	createStructureRow('LSPInitializeParams.processId', '_InitializeParams', 'processId', false),
	createStructureRow('LSPInitializeParams.clientInfo', '_InitializeParams', 'clientInfo', true),
	createStructureRow('LSPInitializeParams.rootUri', '_InitializeParams', 'rootUri', false),
	createStructureRow(
		'LSPInitializeParams.capabilities',
		'_InitializeParams',
		'capabilities',
		false,
	),
	createStructureRow('LSPClientCapabilities.general', 'ClientCapabilities', 'general', true),
	createStructureRow(
		'LSPClientCapabilities.textDocument',
		'ClientCapabilities',
		'textDocument',
		true,
	),
	createStructureRow(
		'LSPClientCapabilities.general.positionEncodings',
		'GeneralClientCapabilities',
		'positionEncodings',
		true,
	),
	createStructureRow(
		'LSPClientCapabilities.textDocument.synchronization',
		'TextDocumentClientCapabilities',
		'synchronization',
		true,
	),
	createStructureRow(
		'LSPClientCapabilities.textDocument.publishDiagnostics',
		'TextDocumentClientCapabilities',
		'publishDiagnostics',
		true,
	),
	createStructureRow(
		'LSPClientCapabilities.textDocument.diagnostic',
		'TextDocumentClientCapabilities',
		'diagnostic',
		true,
	),
	createStructureRow('LSPInitializeResult.capabilities', 'InitializeResult', 'capabilities', false),
	createStructureRow('LSPInitializeResult.serverInfo', 'InitializeResult', 'serverInfo', true),
	createStructureRow('LSPIdentity.name (client)', 'ClientInfo', 'name', false, 'string'),
	createStructureRow('LSPIdentity.version (client)', 'ClientInfo', 'version', true, 'string'),
	createStructureRow('LSPIdentity.name (server)', 'ServerInfo', 'name', false, 'string'),
	createStructureRow('LSPIdentity.version (server)', 'ServerInfo', 'version', true, 'string'),
	createStructureRow(
		'LSPServerCapabilities.positionEncoding',
		'ServerCapabilities',
		'positionEncoding',
		true,
	),
	createStructureRow(
		'LSPServerCapabilities.textDocumentSync',
		'ServerCapabilities',
		'textDocumentSync',
		true,
	),
	createStructureRow(
		'LSPServerCapabilities.diagnosticProvider',
		'ServerCapabilities',
		'diagnosticProvider',
		true,
	),
	createStructureRow(
		'LSPTextDocumentSyncOptions.openClose',
		'TextDocumentSyncOptions',
		'openClose',
		true,
		'boolean',
	),
	createStructureRow(
		'LSPTextDocumentSyncOptions.change',
		'TextDocumentSyncOptions',
		'change',
		true,
	),
	createStructureRow(
		'LSPDiagnosticOptions.identifier',
		'DiagnosticOptions',
		'identifier',
		true,
		'string',
	),
	createStructureRow(
		'LSPDiagnosticOptions.interFileDependencies',
		'DiagnosticOptions',
		'interFileDependencies',
		false,
		'boolean',
	),
	createStructureRow(
		'LSPDiagnosticOptions.workspaceDiagnostics',
		'DiagnosticOptions',
		'workspaceDiagnostics',
		false,
		'boolean',
	),
	createStructureRow(
		'LSP_METHODS.open.params.textDocument',
		'DidOpenTextDocumentParams',
		'textDocument',
		false,
	),
	createStructureRow(
		'LSP_METHODS.close.params.textDocument',
		'DidCloseTextDocumentParams',
		'textDocument',
		false,
	),
	createStructureRow(
		'LSPDocumentDiagnosticParams.textDocument',
		'DocumentDiagnosticParams',
		'textDocument',
		false,
	),
	createStructureRow(
		'LSPDocumentDiagnosticParams.identifier',
		'DocumentDiagnosticParams',
		'identifier',
		true,
		'string',
	),
	createStructureRow(
		'LSPDocumentDiagnosticParams.previousResultId',
		'DocumentDiagnosticParams',
		'previousResultId',
		true,
		'string',
	),
	createStructureRow(
		'LSPDocumentDiagnosticReport.full.kind',
		'FullDocumentDiagnosticReport',
		'kind',
		false,
	),
	createStructureRow(
		'LSPDocumentDiagnosticReport.full.resultId',
		'FullDocumentDiagnosticReport',
		'resultId',
		true,
		'string',
	),
	createStructureRow(
		'LSPDocumentDiagnosticReport.full.items',
		'FullDocumentDiagnosticReport',
		'items',
		false,
	),
	createStructureRow(
		'LSPDocumentDiagnosticReport.unchanged.kind',
		'UnchangedDocumentDiagnosticReport',
		'kind',
		false,
	),
	createStructureRow(
		'LSPDocumentDiagnosticReport.unchanged.resultId',
		'UnchangedDocumentDiagnosticReport',
		'resultId',
		false,
		'string',
	),
	createStructureRow(
		'LSPPublishDiagnosticsParams.uri',
		'PublishDiagnosticsParams',
		'uri',
		false,
		'DocumentUri',
	),
	createStructureRow(
		'LSPPublishDiagnosticsParams.version',
		'PublishDiagnosticsParams',
		'version',
		true,
		'integer',
	),
	createStructureRow(
		'LSPPublishDiagnosticsParams.diagnostics',
		'PublishDiagnosticsParams',
		'diagnostics',
		false,
	),
	createStructureRow('LSPPosition.line', 'Position', 'line', false, 'uinteger'),
	createStructureRow('LSPPosition.character', 'Position', 'character', false, 'uinteger'),
	createStructureRow('LSPRange.start', 'Range', 'start', false),
	createStructureRow('LSPRange.end', 'Range', 'end', false),
	createStructureRow('LSPLocation.uri', 'Location', 'uri', false, 'DocumentUri'),
	createStructureRow('LSPLocation.range', 'Location', 'range', false),
	createStructureRow('LSPCodeDescription.href', 'CodeDescription', 'href', false, 'URI'),
	createStructureRow(
		'LSPDiagnosticRelated.location',
		'DiagnosticRelatedInformation',
		'location',
		false,
	),
	createStructureRow(
		'LSPDiagnosticRelated.message',
		'DiagnosticRelatedInformation',
		'message',
		false,
		'string',
	),
	createStructureRow('LSPDiagnostic.range', 'Diagnostic', 'range', false),
	createStructureRow('LSPDiagnostic.severity', 'Diagnostic', 'severity', true),
	createStructureRow('LSPDiagnostic.code', 'Diagnostic', 'code', true),
	createStructureRow('LSPDiagnostic.codeDescription', 'Diagnostic', 'codeDescription', true),
	createStructureRow('LSPDiagnostic.source', 'Diagnostic', 'source', true, 'string'),
	createStructureRow('LSPDiagnostic.message', 'Diagnostic', 'message', false),
	createStructureRow('LSPDiagnostic.tags', 'Diagnostic', 'tags', true),
	createStructureRow('LSPDiagnostic.relatedInformation', 'Diagnostic', 'relatedInformation', true),
	createStructureRow('LSPDiagnostic.data', 'Diagnostic', 'data', true),
	createStructureRow(
		'LSPTextDocumentIdentifier.uri',
		'TextDocumentIdentifier',
		'uri',
		false,
		'DocumentUri',
	),
	createStructureRow('LSPTextDocumentItem.uri', 'TextDocumentItem', 'uri', false, 'DocumentUri'),
	createStructureRow('LSPTextDocumentItem.languageId', 'TextDocumentItem', 'languageId', false),
	createStructureRow(
		'LSPTextDocumentItem.version',
		'TextDocumentItem',
		'version',
		false,
		'integer',
	),
	createStructureRow('LSPTextDocumentItem.text', 'TextDocumentItem', 'text', false, 'string'),
]

/** Provides authority-shaped values for local and installed guard parity. */
export const CONFORMANCE_GUARDS: readonly ConformanceGuardRow[] = [
	{
		symbol: 'isLSPPosition',
		value: { line: 0, character: 0 },
		local: isLSPPosition,
		installed: Position.is,
	},
	{
		symbol: 'isLSPRange',
		value: { start: { line: 0, character: 0 }, end: { line: 0, character: 1 } },
		local: isLSPRange,
		installed: Range.is,
	},
	{
		symbol: 'isLSPLocation',
		value: {
			uri: 'file:///workspace/main.ts',
			range: { start: { line: 0, character: 0 }, end: { line: 0, character: 1 } },
		},
		local: isLSPLocation,
		installed: Location.is,
	},
	{
		symbol: 'isLSPCodeDescription',
		value: { href: 'https://example.test/diagnostic' },
		local: isLSPCodeDescription,
		installed: CodeDescription.is,
	},
	{
		symbol: 'isLSPDiagnosticRelated',
		value: {
			location: {
				uri: 'file:///workspace/main.ts',
				range: { start: { line: 0, character: 0 }, end: { line: 0, character: 1 } },
			},
			message: 'Related diagnostic',
		},
		local: isLSPDiagnosticRelated,
		installed: DiagnosticRelatedInformation.is,
	},
	{
		symbol: 'isLSPDiagnostic',
		value: {
			range: { start: { line: 0, character: 0 }, end: { line: 0, character: 1 } },
			severity: DiagnosticSeverity.Error,
			code: 'example',
			codeDescription: { href: 'https://example.test/diagnostic' },
			source: 'example',
			message: 'Example diagnostic',
			tags: [DiagnosticTag.Unnecessary],
			relatedInformation: [
				{
					location: {
						uri: 'file:///workspace/main.ts',
						range: { start: { line: 0, character: 0 }, end: { line: 0, character: 1 } },
					},
					message: 'Related diagnostic',
				},
			],
		},
		local: isLSPDiagnostic,
		installed: isInstalledDiagnostic,
	},
	{
		symbol: 'isLSPPublishDiagnosticsParams',
		value: { uri: 'file:///workspace/main.ts', version: 1, diagnostics: [] },
		local: isLSPPublishDiagnosticsParams,
		installed: undefined,
	},
	{
		symbol: 'isLSPDocumentDiagnosticReport',
		value: { kind: 'full', resultId: 'result', items: [] },
		local: isLSPDocumentDiagnosticReport,
		installed: undefined,
	},
	{
		symbol: 'isLSPIdentity',
		value: { name: 'Example server', version: '3.18.0' },
		local: isLSPIdentity,
		installed: undefined,
	},
	{
		symbol: 'isLSPTextDocumentSyncOptions',
		value: { openClose: true, change: TextDocumentSyncKind.Incremental },
		local: isLSPTextDocumentSyncOptions,
		installed: undefined,
	},
	{
		symbol: 'isLSPDiagnosticOptions',
		value: { identifier: 'example', interFileDependencies: false, workspaceDiagnostics: false },
		local: isLSPDiagnosticOptions,
		installed: undefined,
	},
	{
		symbol: 'isLSPServerCapabilities',
		value: {
			positionEncoding: PositionEncodingKind.UTF16,
			textDocumentSync: TextDocumentSyncKind.Incremental,
			diagnosticProvider: {
				identifier: 'example',
				interFileDependencies: false,
				workspaceDiagnostics: false,
			},
		},
		local: isLSPServerCapabilities,
		installed: undefined,
	},
	{
		symbol: 'isLSPInitializeResult',
		value: {
			capabilities: { positionEncoding: PositionEncodingKind.UTF16 },
			serverInfo: { name: 'Example server', version: '3.18.0' },
		},
		local: isLSPInitializeResult,
		installed: undefined,
	},
]

/** Reads the protocol version declared by the parsed metaModel. */
export const CONFORMANCE_META_VERSION =
	typeof CONFORMANCE_MODEL.metaData.version === 'string'
		? CONFORMANCE_MODEL.metaData.version
		: undefined

/** Reads the installed protocol release from its manifest. */
export const CONFORMANCE_INSTALLED_VERSION = readManifestMember(PROTOCOL_MANIFEST_PATH, 'version')

/** Reads the installed protocol release recorded by the workspace lockfile. */
export const CONFORMANCE_LOCK_VERSION = readLockVersion(WORKSPACE_LOCK_PATH)

/** Reads the workspace's declared protocol development range. */
export const CONFORMANCE_DECLARED_RANGE = readDeclaredDependency(
	WORKSPACE_MANIFEST_PATH,
	'devDependencies',
	'vscode-languageserver-protocol',
)

/** Reads the first forbidden runtime dependency from the workspace manifest. */
export const CONFORMANCE_FORBIDDEN_DEPENDENCY = readForbiddenDependency(WORKSPACE_MANIFEST_PATH)

/** Reads the first forbidden protocol-family import from published source. */
export const CONFORMANCE_FORBIDDEN_SOURCE = readForbiddenSource(WORKSPACE_PATH)
