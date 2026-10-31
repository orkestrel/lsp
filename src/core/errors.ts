import type { JSONRPCMessage } from '@orkestrel/jsonrpc'
import type { LSPErrorCode, LSPErrorContext, LSPErrorOptions } from './types.js'
import { arrayOf, holds, INTRINSICS, isFunction, isInstance, isObject } from '@orkestrel/contract'
import { LSP_ERROR_CODES } from './constants.js'

/**
 * Reports a package failure with a stable machine-readable category.
 *
 * @example
 * ```ts
 * const error = new LSPError('The LSP header requires Content-Length', {
 * 	code: 'framing',
 * 	context: { value: 0 },
 * })
 * error.code // 'framing'
 * isLSPError(error) // true
 * ```
 */
export class LSPError extends Error {
	override readonly name = 'LSPError'
	readonly code: LSPErrorCode
	readonly context: LSPErrorContext | undefined

	/**
	 * Creates a package error.
	 *
	 * @param message - The human-readable failure description.
	 * @param options - The machine-readable category, structured context, and optional cause.
	 */
	constructor(message: string, options: LSPErrorOptions) {
		const cause = options.cause
		super(message, cause === undefined ? undefined : { cause })
		Object.defineProperty(this, Symbol.for('@orkestrel/lsp.LSPError'), { value: this })
		this.code = options.code
		this.context = options.context === undefined ? undefined : Object.freeze({ ...options.context })
	}
}

/**
 * Checks whether an unknown value is a branded package error.
 *
 * @remarks
 * The accepted categories are read from {@link LSP_ERROR_CODES}, so the guard and the
 * {@link LSPErrorCode} union cannot disagree about which codes this package declares. An own
 * identity brand accepts errors from another package copy and subclasses with a different name,
 * and refuses transparent proxies. The context must satisfy its declared member types.
 *
 * @param value - The value to inspect.
 * @returns True if the value is an LSP error; false otherwise.
 *
 * @example
 * ```ts
 * isLSPError(new LSPError('Invalid frame', { code: 'framing' })) // true
 * isLSPError(new Error('Invalid frame')) // false
 * ```
 */
export function isLSPError(value: unknown): value is LSPError {
	return holds(() => {
		if (!isInstance(value, Error) || INTRINSICS.prototype(value) === Error.prototype) return false
		if (
			!INTRINSICS.own(value, Symbol.for('@orkestrel/lsp.LSPError')) ||
			INTRINSICS.describe(value, Symbol.for('@orkestrel/lsp.LSPError'))?.value !== value ||
			typeof INTRINSICS.reflect.read(value, 'message') !== 'string'
		)
			return false
		const code = INTRINSICS.reflect.read(value, 'code')
		if (!LSP_ERROR_CODES.some((declared) => declared === code)) return false
		const context = INTRINSICS.reflect.read(value, 'context')
		if (context === undefined) return true
		if (!isObject(context) && !isFunction(context)) return false
		const detail = INTRINSICS.reflect.read(context, 'code')
		const messages = INTRINSICS.reflect.read(context, 'messages')
		return (
			(detail === undefined || typeof detail === 'number') &&
			(messages === undefined ||
				arrayOf((message): message is JSONRPCMessage =>
					holds(() => {
						if (!isObject(message) && !isFunction(message)) return false
						if (INTRINSICS.reflect.read(message, 'jsonrpc') !== '2.0') return false
						const id = INTRINSICS.reflect.read(message, 'id')
						const identified = typeof id === 'string' || typeof id === 'number'
						if (
							holds(() => {
								if (typeof INTRINSICS.reflect.read(message, 'method') !== 'string') return false
								const params = INTRINSICS.reflect.read(message, 'params')
								return (
									(id === undefined || identified) &&
									(params === undefined || isObject(params) || isFunction(params))
								)
							})
						)
							return true
						const error = INTRINSICS.reflect.read(message, 'error')
						const result = INTRINSICS.reflect.read(message, 'result')
						if (error === undefined)
							return identified && INTRINSICS.reflect.present(message, 'result')
						return (
							(id === null || identified) &&
							result === undefined &&
							(isObject(error) || isFunction(error)) &&
							typeof INTRINSICS.reflect.read(error, 'code') === 'number' &&
							typeof INTRINSICS.reflect.read(error, 'message') === 'string'
						)
					}),
				)(messages))
		)
	})
}
