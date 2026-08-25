import type {
	JSONRPCError,
	JSONRPCNotification,
	JSONRPCRequest,
	JSONRPCResponse,
	LSPCodeDescription,
	LSPDiagnostic,
	LSPDiagnosticOptions,
	LSPDiagnosticRelated,
	LSPDocumentDiagnosticReport,
	LSPIdentity,
	LSPInitializeResult,
	LSPLocation,
	LSPPosition,
	LSPPublishDiagnosticsParams,
	LSPRange,
	LSPServerCapabilities,
	LSPTextDocumentSyncOptions,
} from './types.js'
import { holds, isBoolean, isInteger, isNumber, isRecord, isString } from '@orkestrel/contract'

/**
 * Checks whether an unknown value is a JSON-RPC error payload.
 *
 * @param value - The value to inspect.
 * @returns True if the value is a JSON-RPC error payload; false otherwise.
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
 */
export function isLSPDiagnostic(value: unknown): value is LSPDiagnostic {
	if (!isRecord(value)) return false
	return holds(() => {
		if (!isLSPRange(value.range) || !isString(value.message)) return false
		if (
			value.severity !== undefined &&
			value.severity !== 1 &&
			value.severity !== 2 &&
			value.severity !== 3 &&
			value.severity !== 4
		)
			return false
		if (value.code !== undefined && !isNumber(value.code) && !isString(value.code)) return false
		if (value.codeDescription !== undefined && !isLSPCodeDescription(value.codeDescription))
			return false
		if (value.source !== undefined && !isString(value.source)) return false
		if (value.tags !== undefined) {
			if (!Array.isArray(value.tags)) return false
			for (let index = 0; index < value.tags.length; index += 1) {
				const tag = value.tags[index]
				if (tag !== 1 && tag !== 2) return false
			}
		}
		if (value.relatedInformation !== undefined) {
			if (!Array.isArray(value.relatedInformation)) return false
			for (let index = 0; index < value.relatedInformation.length; index += 1) {
				if (!isLSPDiagnosticRelated(value.relatedInformation[index])) return false
			}
		}
		return true
	})
}

/**
 * Checks whether an unknown value is published diagnostic parameters.
 *
 * @param value - The value to inspect.
 * @returns True if the value is published diagnostic parameters; false otherwise.
 */
export function isLSPPublishDiagnosticsParams(
	value: unknown,
): value is LSPPublishDiagnosticsParams {
	if (!isRecord(value)) return false
	return holds(() => {
		if (!isString(value.uri)) return false
		if (value.version !== undefined && !isInteger(value.version)) return false
		if (!Array.isArray(value.diagnostics)) return false
		for (let index = 0; index < value.diagnostics.length; index += 1) {
			if (!isLSPDiagnostic(value.diagnostics[index])) return false
		}
		return true
	})
}

/**
 * Checks whether an unknown value is a document diagnostic report.
 *
 * @param value - The value to inspect.
 * @returns True if the value is a document diagnostic report; false otherwise.
 */
export function isLSPDocumentDiagnosticReport(
	value: unknown,
): value is LSPDocumentDiagnosticReport {
	if (!isRecord(value)) return false
	return holds(() => {
		if (value.kind === 'unchanged') return isString(value.resultId)
		if (value.kind !== 'full') return false
		if (value.resultId !== undefined && !isString(value.resultId)) return false
		if (!Array.isArray(value.items)) return false
		for (let index = 0; index < value.items.length; index += 1) {
			if (!isLSPDiagnostic(value.items[index])) return false
		}
		return true
	})
}

/**
 * Checks whether an unknown value is an LSP identity.
 *
 * @param value - The value to inspect.
 * @returns True if the value is an LSP identity; false otherwise.
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
 */
export function isLSPTextDocumentSyncOptions(value: unknown): value is LSPTextDocumentSyncOptions {
	if (!isRecord(value)) return false
	return holds(
		() =>
			(value.openClose === undefined || isBoolean(value.openClose)) &&
			(value.change === undefined ||
				value.change === 0 ||
				value.change === 1 ||
				value.change === 2),
	)
}

/**
 * Checks whether an unknown value is diagnostic provider options.
 *
 * @param value - The value to inspect.
 * @returns True if the value is diagnostic provider options; false otherwise.
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
 */
export function isLSPServerCapabilities(value: unknown): value is LSPServerCapabilities {
	if (!isRecord(value)) return false
	return holds(
		() =>
			(value.positionEncoding === undefined || isString(value.positionEncoding)) &&
			(value.textDocumentSync === undefined ||
				value.textDocumentSync === 0 ||
				value.textDocumentSync === 1 ||
				value.textDocumentSync === 2 ||
				isLSPTextDocumentSyncOptions(value.textDocumentSync)) &&
			(value.diagnosticProvider === undefined || isLSPDiagnosticOptions(value.diagnosticProvider)),
	)
}

/**
 * Checks whether an unknown value is a successful initialize result.
 *
 * @param value - The value to inspect.
 * @returns True if the value is a successful initialize result; false otherwise.
 */
export function isLSPInitializeResult(value: unknown): value is LSPInitializeResult {
	if (!isRecord(value)) return false
	return holds(
		() =>
			isLSPServerCapabilities(value.capabilities) &&
			(value.serverInfo === undefined || isLSPIdentity(value.serverInfo)),
	)
}
