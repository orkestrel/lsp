import type { LSPErrorCode, LSPErrorContext, LSPErrorOptions } from './types.js'
import { holds, isError } from '@orkestrel/contract'

/** Reports a package failure with a stable machine-readable category. */
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
		Object.defineProperty(this, Symbol.for('@orkestrel/lsp.error'), { value: true })
		this.code = options.code
		this.context = options.context === undefined ? undefined : Object.freeze({ ...options.context })
	}
}

/**
 * Checks whether an unknown value is a branded package error.
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
	if (!isError(value)) return false
	return holds(() => {
		if (Object.getPrototypeOf(value) === Error.prototype) return false
		const code = Reflect.get(value, 'code')
		return (
			value.name === 'LSPError' &&
			Object.getOwnPropertyDescriptor(value, Symbol.for('@orkestrel/lsp.error'))?.value === true &&
			(code === 'spawn' ||
				code === 'framing' ||
				code === 'protocol' ||
				code === 'duplicate' ||
				code === 'server' ||
				code === 'timeout' ||
				code === 'aborted' ||
				code === 'closed')
		)
	})
}
