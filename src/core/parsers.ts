import type { JSONRPCMessage, LSPDecodeState } from './types.js'
import { buildLSPSegment } from './helpers.js'
import { LSPFraming } from './LSPFraming.js'

/**
 * Parses a byte chunk into complete LSP base-protocol messages and retained decode state.
 *
 * @remarks
 * Pass the returned state to the next call. The parser accepts a split header or body, separates
 * coalesced frames, defaults an omitted content type to UTF-8, and refuses accumulation above
 * {@link LSP_HEADER_LIMIT} or a declared content length above {@link LSP_CONTENT_LIMIT}. Unknown
 * header fields are ignored because the base protocol names its supported fields without mandating
 * refusal, and tolerance is conventional for its HTTP-style header form.
 *
 * @param chunk - The next transport bytes.
 * @param state - Incomplete decode state returned by the preceding call. Default: `undefined`.
 * @returns The complete messages and the state required by the next call.
 * @throws {@link LSPError} Thrown when the framing, the UTF-8 content, the JSON text, or the
 * JSON-RPC message shape is invalid.
 *
 * @example
 * ```ts
 * const [messages, state] = parseLSPMessages(chunk)
 * const [later] = parseLSPMessages(nextChunk, state)
 * ```
 */
export function parseLSPMessages(
	chunk: Uint8Array,
	state?: LSPDecodeState,
): readonly [messages: readonly JSONRPCMessage[], state: LSPDecodeState | undefined] {
	const messages: JSONRPCMessage[] = []
	const framing = new LSPFraming(buildLSPSegment(state, chunk), messages)
	for (const message of framing) messages.push(message)
	return [messages, framing.state]
}
