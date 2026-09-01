import type { Guard } from '@orkestrel/contract'
import type {
	JSONRPCError,
	JSONRPCNotification,
	JSONRPCRequest,
	JSONRPCResponse,
	LSPCodeDescription,
	LSPDiagnostic,
	LSPDiagnosticOptions,
	LSPDiagnosticRelated,
	LSPDiagnosticSeverity,
	LSPDiagnosticTag,
	LSPDocumentDiagnosticReport,
	LSPIdentity,
	LSPInitializeResult,
	LSPLocation,
	LSPPosition,
	LSPPublishDiagnosticsParams,
	LSPRange,
	LSPServerCapabilities,
	LSPTextDocumentSyncKind,
	LSPTextDocumentSyncOptions,
} from './types.js'
import {
	arrayOf,
	holds,
	isBoolean,
	isInteger,
	isNumber,
	isRecord,
	isString,
	literalOf,
	optionalOf,
	unionOf,
} from '@orkestrel/contract'
import { LSP_DIAGNOSTIC_SEVERITIES, LSP_DIAGNOSTIC_TAGS, LSP_SYNC_KINDS } from './constants.js'

/**
 * Checks whether an unknown value is a diagnostic severity.
 *
 * @param value - The value to inspect.
 * @returns True if the value is a diagnostic severity; false otherwise.
 *
 * @example
 * ```ts
 * isLSPDiagnosticSeverity(1) // true
 * isLSPDiagnosticSeverity(5) // false
 * ```
 */
export const isLSPDiagnosticSeverity: Guard<LSPDiagnosticSeverity> =
	literalOf(LSP_DIAGNOSTIC_SEVERITIES)

/**
 * Checks whether an unknown value is a diagnostic tag.
 *
 * @param value - The value to inspect.
 * @returns True if the value is a diagnostic tag; false otherwise.
 *
 * @example
 * ```ts
 * isLSPDiagnosticTag(2) // true
 * isLSPDiagnosticTag(3) // false
 * ```
 */
export const isLSPDiagnosticTag: Guard<LSPDiagnosticTag> = literalOf(LSP_DIAGNOSTIC_TAGS)

/**
 * Checks whether an unknown value is a text synchronization mode.
 *
 * @param value - The value to inspect.
 * @returns True if the value is a text synchronization mode; false otherwise.
 *
 * @example
 * ```ts
 * isLSPTextDocumentSyncKind(2) // true
 * isLSPTextDocumentSyncKind(3) // false
 * ```
 */
export const isLSPTextDocumentSyncKind: Guard<LSPTextDocumentSyncKind> = literalOf(LSP_SYNC_KINDS)

/**
 * Checks whether an unknown value is a JSON-RPC error payload.
 *
 * @param value - The value to inspect.
 * @returns True if the value is a JSON-RPC error payload; false otherwise.
 *
 * @example
 * ```ts
 * isJSONRPCError({ code: -32601, message: 'Method not found' }) // true
 * isJSONRPCError({ code: -32601 }) // false
 * ```
 */
export function isJSONRPCError(value: unknown): value is JSONRPCError {
	if (!isRecord(value)) return false
	return holds(() => isNumber(value.code) && isString(value.message))
}

/**
 * Checks whether an unknown value is a JSON-RPC request.
 *
 * @param value - The value to inspect.
 * @returns True if the value is a JSON-RPC request; false otherwise.
 *
 * @example
 * ```ts
 * isJSONRPCRequest({ jsonrpc: '2.0', id: 1, method: 'initialize' }) // true
 * isJSONRPCRequest({ jsonrpc: '2.0', method: 'initialized' }) // false
 * ```
 */
export function isJSONRPCRequest(value: unknown): value is JSONRPCRequest {
	if (!isRecord(value)) return false
	return holds(
		() =>
			value.jsonrpc === '2.0' &&
			(isString(value.id) || isNumber(value.id)) &&
			isString(value.method) &&
			(value.params === undefined || isRecord(value.params)) &&
			!('result' in value) &&
			!('error' in value),
	)
}

/**
 * Checks whether an unknown value is a JSON-RPC notification.
 *
 * @param value - The value to inspect.
 * @returns True if the value is a JSON-RPC notification; false otherwise.
 *
 * @example
 * ```ts
 * isJSONRPCNotification({ jsonrpc: '2.0', method: 'initialized' }) // true
 * isJSONRPCNotification({ jsonrpc: '2.0', id: 1, method: 'initialize' }) // false
 * ```
 */
export function isJSONRPCNotification(value: unknown): value is JSONRPCNotification {
	if (!isRecord(value)) return false
	return holds(
		() =>
			value.jsonrpc === '2.0' &&
			!('id' in value) &&
			isString(value.method) &&
			(value.params === undefined || isRecord(value.params)) &&
			!('result' in value) &&
			!('error' in value),
	)
}

/**
 * Checks whether an unknown value is a JSON-RPC response.
 *
 * @param value - The value to inspect.
 * @returns True if the value is a JSON-RPC response; false otherwise.
 *
 * @example
 * ```ts
 * isJSONRPCResponse({ jsonrpc: '2.0', id: 1, result: null }) // true
 * isJSONRPCResponse({ jsonrpc: '2.0', id: 1, method: 'initialize' }) // false
 * ```
 */
export function isJSONRPCResponse(value: unknown): value is JSONRPCResponse {
	if (!isRecord(value)) return false
	return holds(() => {
		if (value.jsonrpc !== '2.0' || 'method' in value) return false
		const result = 'result' in value
		const error = 'error' in value
		if (result === error) return false
		if (result) return isString(value.id) || isNumber(value.id)
		return (
			(value.id === null || isString(value.id) || isNumber(value.id)) && isJSONRPCError(value.error)
		)
	})
}

/**
 * Checks whether an unknown value is an LSP position.
 *
 * @param value - The value to inspect.
 * @returns True if the value is an LSP position; false otherwise.
 *
 * @example
 * ```ts
 * isLSPPosition({ line: 0, character: 4 }) // true
 * isLSPPosition({ line: -1, character: 4 }) // false
 * ```
 */
export function isLSPPosition(value: unknown): value is LSPPosition {
	if (!isRecord(value)) return false
	return holds(
		() =>
			isInteger(value.line) &&
			value.line >= 0 &&
			isInteger(value.character) &&
			value.character >= 0,
	)
}

/**
 * Checks whether an unknown value is an LSP range.
 *
 * @param value - The value to inspect.
 * @returns True if the value is an LSP range; false otherwise.
 *
 * @example
 * ```ts
 * const start = { line: 0, character: 0 }
 * isLSPRange({ start, end: { line: 0, character: 4 } }) // true
 * isLSPRange({ start }) // false
 * ```
 */
export function isLSPRange(value: unknown): value is LSPRange {
	if (!isRecord(value)) return false
	return holds(() => isLSPPosition(value.start) && isLSPPosition(value.end))
}

/**
 * Checks whether an unknown value is an LSP location.
 *
 * @param value - The value to inspect.
 * @returns True if the value is an LSP location; false otherwise.
 *
 * @example
 * ```ts
 * const range = { start: { line: 0, character: 0 }, end: { line: 0, character: 4 } }
 * isLSPLocation({ uri: 'file:///main.ts', range }) // true
 * isLSPLocation({ uri: 'file:///main.ts' }) // false
 * ```
 */
export function isLSPLocation(value: unknown): value is LSPLocation {
	if (!isRecord(value)) return false
	return holds(() => isString(value.uri) && isLSPRange(value.range))
}

/**
 * Checks whether an unknown value is an LSP code description.
 *
 * @param value - The value to inspect.
 * @returns True if the value is an LSP code description; false otherwise.
 *
 * @example
 * ```ts
 * isLSPCodeDescription({ href: 'https://example.test/rules/unused' }) // true
 * isLSPCodeDescription({ href: 404 }) // false
 * ```
 */
export function isLSPCodeDescription(value: unknown): value is LSPCodeDescription {
	if (!isRecord(value)) return false
	return holds(() => isString(value.href))
}

/**
 * Checks whether an unknown value is related diagnostic information.
 *
 * @param value - The value to inspect.
 * @returns True if the value is related diagnostic information; false otherwise.
 *
 * @example
 * ```ts
 * const range = { start: { line: 0, character: 0 }, end: { line: 0, character: 4 } }
 * const location = { uri: 'file:///main.ts', range }
 * isLSPDiagnosticRelated({ location, message: 'Declared here' }) // true
 * isLSPDiagnosticRelated({ message: 'Declared here' }) // false
 * ```
 */
export function isLSPDiagnosticRelated(value: unknown): value is LSPDiagnosticRelated {
	if (!isRecord(value)) return false
	return holds(() => isLSPLocation(value.location) && isString(value.message))
}

/**
 * Checks whether an unknown value is an LSP diagnostic.
 *
 * @param value - The value to inspect.
 * @returns True if the value is an LSP diagnostic; false otherwise.
 *
 * @example
 * ```ts
 * const range = { start: { line: 0, character: 0 }, end: { line: 0, character: 4 } }
 * isLSPDiagnostic({ range, message: 'Unused variable', severity: 2 }) // true
 * isLSPDiagnostic({ range, message: 'Unused variable', severity: 9 }) // false
 * ```
 */
export function isLSPDiagnostic(value: unknown): value is LSPDiagnostic {
	if (!isRecord(value)) return false
	return holds(() => {
		if (!isLSPRange(value.range) || !isString(value.message)) return false
		if (!optionalOf(isLSPDiagnosticSeverity)(value.severity)) return false
		if (!optionalOf(unionOf(isNumber, isString))(value.code)) return false
		if (value.codeDescription !== undefined && !isLSPCodeDescription(value.codeDescription))
			return false
		if (value.source !== undefined && !isString(value.source)) return false
		if (!optionalOf(arrayOf(isLSPDiagnosticTag))(value.tags)) return false
		return optionalOf(arrayOf(isLSPDiagnosticRelated))(value.relatedInformation)
	})
}

/**
 * Checks whether an unknown value is published diagnostic parameters.
 *
 * @param value - The value to inspect.
 * @returns True if the value is published diagnostic parameters; false otherwise.
 *
 * @example
 * ```ts
 * isLSPPublishDiagnosticsParams({ uri: 'file:///main.ts', diagnostics: [] }) // true
 * isLSPPublishDiagnosticsParams({ uri: 'file:///main.ts' }) // false
 * ```
 */
export function isLSPPublishDiagnosticsParams(
	value: unknown,
): value is LSPPublishDiagnosticsParams {
	if (!isRecord(value)) return false
	return holds(() => {
		if (!isString(value.uri)) return false
		if (value.version !== undefined && !isInteger(value.version)) return false
		return arrayOf(isLSPDiagnostic)(value.diagnostics)
	})
}

/**
 * Checks whether an unknown value is a document diagnostic report.
 *
 * @param value - The value to inspect.
 * @returns True if the value is a document diagnostic report; false otherwise.
 *
 * @example
 * ```ts
 * isLSPDocumentDiagnosticReport({ kind: 'full', items: [] }) // true
 * isLSPDocumentDiagnosticReport({ kind: 'partial', items: [] }) // false
 * ```
 */
export function isLSPDocumentDiagnosticReport(
	value: unknown,
): value is LSPDocumentDiagnosticReport {
	if (!isRecord(value)) return false
	return holds(() => {
		if (value.kind === 'unchanged') return isString(value.resultId)
		if (value.kind !== 'full') return false
		if (value.resultId !== undefined && !isString(value.resultId)) return false
		return arrayOf(isLSPDiagnostic)(value.items)
	})
}

/**
 * Checks whether an unknown value is an LSP identity.
 *
 * @param value - The value to inspect.
 * @returns True if the value is an LSP identity; false otherwise.
 *
 * @example
 * ```ts
 * isLSPIdentity({ name: 'example-language-server', version: '1.2.0' }) // true
 * isLSPIdentity({ version: '1.2.0' }) // false
 * ```
 */
export function isLSPIdentity(value: unknown): value is LSPIdentity {
	if (!isRecord(value)) return false
	return holds(
		() => isString(value.name) && (value.version === undefined || isString(value.version)),
	)
}

/**
 * Checks whether an unknown value is expanded text synchronization options.
 *
 * @param value - The value to inspect.
 * @returns True if the value is expanded text synchronization options; false otherwise.
 *
 * @example
 * ```ts
 * isLSPTextDocumentSyncOptions({ openClose: true, change: 1 }) // true
 * isLSPTextDocumentSyncOptions({ openClose: true, change: 3 }) // false
 * ```
 */
export function isLSPTextDocumentSyncOptions(value: unknown): value is LSPTextDocumentSyncOptions {
	if (!isRecord(value)) return false
	return holds(
		() =>
			(value.openClose === undefined || isBoolean(value.openClose)) &&
			optionalOf(isLSPTextDocumentSyncKind)(value.change),
	)
}

/**
 * Checks whether an unknown value is diagnostic provider options.
 *
 * @param value - The value to inspect.
 * @returns True if the value is diagnostic provider options; false otherwise.
 *
 * @example
 * ```ts
 * isLSPDiagnosticOptions({ interFileDependencies: false, workspaceDiagnostics: false }) // true
 * isLSPDiagnosticOptions({ interFileDependencies: false }) // false
 * ```
 */
export function isLSPDiagnosticOptions(value: unknown): value is LSPDiagnosticOptions {
	if (!isRecord(value)) return false
	return holds(
		() =>
			(value.identifier === undefined || isString(value.identifier)) &&
			isBoolean(value.interFileDependencies) &&
			isBoolean(value.workspaceDiagnostics),
	)
}

/**
 * Checks whether an unknown value is server capabilities this client can consume.
 *
 * @param value - The value to inspect.
 * @returns True if the value is consumable server capabilities; false otherwise.
 *
 * @example
 * ```ts
 * isLSPServerCapabilities({ positionEncoding: 'utf-16', textDocumentSync: 1 }) // true
 * isLSPServerCapabilities({ textDocumentSync: 'full' }) // false
 * ```
 */
export function isLSPServerCapabilities(value: unknown): value is LSPServerCapabilities {
	if (!isRecord(value)) return false
	return holds(
		() =>
			(value.positionEncoding === undefined || isString(value.positionEncoding)) &&
			optionalOf(unionOf(isLSPTextDocumentSyncKind, isLSPTextDocumentSyncOptions))(
				value.textDocumentSync,
			) &&
			(value.diagnosticProvider === undefined || isLSPDiagnosticOptions(value.diagnosticProvider)),
	)
}

/**
 * Checks whether an unknown value is a successful initialize result.
 *
 * @param value - The value to inspect.
 * @returns True if the value is a successful initialize result; false otherwise.
 *
 * @example
 * ```ts
 * isLSPInitializeResult({ capabilities: { textDocumentSync: 1 } }) // true
 * isLSPInitializeResult({ capabilities: null }) // false
 * ```
 */
export function isLSPInitializeResult(value: unknown): value is LSPInitializeResult {
	if (!isRecord(value)) return false
	return holds(
		() =>
			isLSPServerCapabilities(value.capabilities) &&
			(value.serverInfo === undefined || isLSPIdentity(value.serverInfo)),
	)
}
