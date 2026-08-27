import type { JSONRPCMessage } from './types.js'
import { JSONRPC_INVALID_REQUEST } from './constants.js'
import { LSPError } from './errors.js'

/**
 * Encodes a JSON-RPC message as one byte-accurate LSP base-protocol frame.
 *
 * @param message - The JSON-RPC message to encode.
 * @returns The ASCII header and UTF-8 content as one byte array.
 * @throws {@link LSPError} Thrown when the message cannot be serialized as JSON.
 *
 * @example
 * ```ts
 * const bytes = encodeLSPMessage({ jsonrpc: '2.0', method: 'initialized' })
 * ```
 */
export function encodeLSPMessage(message: JSONRPCMessage): Uint8Array {
	let content: string | undefined
	try {
		content = JSON.stringify(message)
	} catch (cause) {
		throw new LSPError('The JSON-RPC message cannot be serialized', {
			code: 'protocol',
			context: { code: JSONRPC_INVALID_REQUEST },
			cause,
		})
	}
	if (content === undefined)
		throw new LSPError('The JSON-RPC message cannot be serialized', {
			code: 'protocol',
			context: { code: JSONRPC_INVALID_REQUEST },
		})

	const encoder = new TextEncoder()
	const body = encoder.encode(content)
	const header = encoder.encode(`Content-Length: ${body.byteLength}\r\n\r\n`)
	const frame = new Uint8Array(header.byteLength + body.byteLength)
	frame.set(header)
	frame.set(body, header.byteLength)
	return frame
}

/**
 * Waits for a deadline to elapse.
 *
 * @param ms - The number of milliseconds to wait.
 * @returns A promise that resolves after the deadline elapses, and never rejects.
 *
 * @remarks
 * The deadline is armed with `AbortSignal.timeout`, whose timer does not hold the host event loop
 * open. A caller that wins its race against this promise therefore has nothing to clear, and the
 * losing deadline delays no exit.
 *
 * @example
 * ```ts
 * declare const work: Promise<void>
 *
 * await Promise.race([work, waitForDeadline(30_000)])
 * ```
 */
export function waitForDeadline(ms: number): Promise<void> {
	const deadline = AbortSignal.timeout(ms)
	return new Promise<void>((resolve) => {
		deadline.addEventListener('abort', () => resolve(), { once: true })
	})
}
