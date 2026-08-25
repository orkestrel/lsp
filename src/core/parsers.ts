import type { JSONRPCMessage, LSPHeader } from './types.js'
import { JSONRPC_INVALID_REQUEST, JSONRPC_PARSE_ERROR, LSP_CONTENT_LIMIT } from './constants.js'
import { LSPError } from './errors.js'
import { isJSONRPCNotification, isJSONRPCRequest, isJSONRPCResponse } from './validators.js'
import { parseJSON } from '@orkestrel/contract'

/**
 * Parses a byte chunk into complete LSP base-protocol messages and retained incomplete bytes.
 *
 * @remarks
 * Pass the returned pending bytes to the next call. The parser accepts a split header or body,
 * separates coalesced frames, defaults an omitted content type to UTF-8, and refuses a declared
 * content length above {@link LSP_CONTENT_LIMIT} before retaining body bytes.
 *
 * @param chunk - The next transport bytes.
 * @param pending - Incomplete bytes returned by the preceding call. Default: an empty byte array.
 * @returns The complete messages and the bytes required by the next call.
 * @throws {@link LSPError} Thrown for invalid framing, UTF-8, JSON, or JSON-RPC message shapes.
 *
 * @example
 * ```ts
 * const [messages, pending] = parseLSPMessages(chunk)
 * const [later] = parseLSPMessages(nextChunk, pending)
 * ```
 */
export function parseLSPMessages(
	chunk: Uint8Array,
	pending: Uint8Array = new Uint8Array(),
): readonly [messages: readonly JSONRPCMessage[], pending: Uint8Array] {
	const messages: JSONRPCMessage[] = []
	let prefix = pending
	let suffix = chunk

	while (prefix.byteLength + suffix.byteLength > 0) {
		const total = prefix.byteLength + suffix.byteLength
		let boundary = -1
		for (let index = 0; index + 3 < total; index += 1) {
			const first = index < prefix.byteLength ? prefix[index] : suffix[index - prefix.byteLength]
			const secondIndex = index + 1
			const second =
				secondIndex < prefix.byteLength
					? prefix[secondIndex]
					: suffix[secondIndex - prefix.byteLength]
			const thirdIndex = index + 2
			const third =
				thirdIndex < prefix.byteLength ? prefix[thirdIndex] : suffix[thirdIndex - prefix.byteLength]
			const fourthIndex = index + 3
			const fourth =
				fourthIndex < prefix.byteLength
					? prefix[fourthIndex]
					: suffix[fourthIndex - prefix.byteLength]
			if (first === 13 && second === 10 && third === 13 && fourth === 10) {
				boundary = index
				break
			}
		}

		if (boundary < 0) {
			const retained = new Uint8Array(total)
			retained.set(prefix)
			retained.set(suffix, prefix.byteLength)
			return [messages, retained]
		}

		const headerBytes = new Uint8Array(boundary)
		const prefixHeaderLength = Math.min(prefix.byteLength, boundary)
		headerBytes.set(prefix.subarray(0, prefixHeaderLength))
		if (boundary > prefixHeaderLength) {
			headerBytes.set(suffix.subarray(0, boundary - prefixHeaderLength), prefixHeaderLength)
		}
		for (let index = 0; index < headerBytes.byteLength; index += 1) {
			const byte = headerBytes[index]
			if (byte === undefined || byte > 127)
				throw new LSPError('The LSP header must contain ASCII bytes', { code: 'framing' })
		}

		const headerText = new TextDecoder().decode(headerBytes)
		const lines = headerText.split('\r\n')
		let length: number | undefined
		let contentType = false
		for (let index = 0; index < lines.length; index += 1) {
			const line = lines[index]
			if (line === undefined) continue
			const separator = line.indexOf(':')
			if (separator <= 0)
				throw new LSPError('The LSP header contains an invalid field', { code: 'framing' })
			const name = line.slice(0, separator).trim().toLowerCase()
			const field = line.slice(separator + 1).trim()
			if (name === 'content-length') {
				if (length !== undefined)
					throw new LSPError('The LSP header repeats Content-Length', { code: 'framing' })
				if (field.length === 0)
					throw new LSPError('The LSP Content-Length is empty', { code: 'framing' })
				for (let digitIndex = 0; digitIndex < field.length; digitIndex += 1) {
					const digit = field.charCodeAt(digitIndex)
					if (digit < 48 || digit > 57)
						throw new LSPError('The LSP Content-Length is invalid', { code: 'framing' })
				}
				const parsed = Number(field)
				if (!Number.isSafeInteger(parsed))
					throw new LSPError('The LSP Content-Length is invalid', { code: 'framing' })
				if (parsed > LSP_CONTENT_LIMIT)
					throw new LSPError('The LSP Content-Length exceeds the content limit', {
						code: 'framing',
						context: { value: parsed },
					})
				length = parsed
				continue
			}
			if (name === 'content-type') {
				if (contentType)
					throw new LSPError('The LSP header repeats Content-Type', { code: 'framing' })
				contentType = true
				const parts = field.split(';')
				const media = parts[0]
				if (media === undefined || media.trim().toLowerCase() !== 'application/vscode-jsonrpc')
					throw new LSPError('The LSP Content-Type is unsupported', { code: 'framing' })
				let charset = false
				for (let partIndex = 1; partIndex < parts.length; partIndex += 1) {
					const part = parts[partIndex]
					if (part === undefined) continue
					const equals = part.indexOf('=')
					if (equals < 0) continue
					const parameter = part.slice(0, equals).trim().toLowerCase()
					if (parameter !== 'charset') continue
					if (charset)
						throw new LSPError('The LSP Content-Type repeats charset', { code: 'framing' })
					charset = true
					const encoding = part
						.slice(equals + 1)
						.trim()
						.toLowerCase()
					if (encoding !== 'utf-8' && encoding !== 'utf8')
						throw new LSPError('The LSP Content-Type charset is unsupported', {
							code: 'framing',
							context: { value: encoding },
						})
				}
				continue
			}
			throw new LSPError('The LSP header contains an unsupported field', {
				code: 'framing',
				context: { value: name },
			})
		}

		if (length === undefined)
			throw new LSPError('The LSP header requires Content-Length', { code: 'framing' })
		const header: LSPHeader = { length }
		const bodyStart = boundary + 4
		const frameEnd = bodyStart + header.length
		if (total < frameEnd) {
			const retained = new Uint8Array(total)
			retained.set(prefix)
			retained.set(suffix, prefix.byteLength)
			return [messages, retained]
		}

		const body = new Uint8Array(header.length)
		const prefixBodyStart = Math.min(bodyStart, prefix.byteLength)
		const prefixBodyEnd = Math.min(frameEnd, prefix.byteLength)
		if (prefixBodyEnd > prefixBodyStart) body.set(prefix.subarray(prefixBodyStart, prefixBodyEnd))
		const suffixBodyStart = Math.max(0, bodyStart - prefix.byteLength)
		const suffixBodyEnd = Math.max(0, frameEnd - prefix.byteLength)
		if (suffixBodyEnd > suffixBodyStart)
			body.set(suffix.subarray(suffixBodyStart, suffixBodyEnd), prefixBodyEnd - prefixBodyStart)

		let text: string
		try {
			text = new TextDecoder('utf-8', { fatal: true }).decode(body)
		} catch (cause) {
			throw new LSPError('The LSP content is not valid UTF-8', {
				code: 'framing',
				cause,
			})
		}
		const parsed = parseJSON(text)
		if (parsed === undefined)
			throw new LSPError('The LSP content is not valid JSON', {
				code: 'protocol',
				context: { code: JSONRPC_PARSE_ERROR },
			})
		if (isJSONRPCRequest(parsed) || isJSONRPCNotification(parsed) || isJSONRPCResponse(parsed))
			messages.push(parsed)
		else
			throw new LSPError('The LSP content is not a valid JSON-RPC message', {
				code: 'protocol',
				context: { code: JSONRPC_INVALID_REQUEST },
			})

		if (frameEnd < prefix.byteLength) {
			prefix = prefix.subarray(frameEnd)
		} else {
			suffix = suffix.subarray(frameEnd - prefix.byteLength)
			prefix = new Uint8Array()
		}
	}

	return [messages, new Uint8Array()]
}
