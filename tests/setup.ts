import type { JSONRPCMessage, JSONRPCNotification, JSONRPCRequest } from '@orkestrel/jsonrpc'
import type {
	LSPDecodeState,
	LSPExit,
	LSPServerCapabilities,
	LSPTransportEventMap,
	LSPTransportInterface,
} from '@src/core'
import {
	encodeLSPMessage,
	LSP_METHODS,
	LSP_HEADER_LIMIT,
	LSP_CONTENT_LIMIT,
	parseLSPMessages,
} from '@src/core'
import { Emitter } from '@orkestrel/emitter'
import { isJSONRPCRequest } from '@orkestrel/jsonrpc'
import { resolveRoot, waitForDelay } from '@orkestrel/test'

/** Carries a notification as a class instance for declared-message checks. */
export class LSPNotice implements JSONRPCNotification {
	readonly jsonrpc = '2.0' as const
	readonly method = 'initialized'
}

/** Resolves the workspace root from this module's conventional `tests/` location. */
export const WORKSPACE_ROOT = resolveRoot(import.meta)

/** Enumerates framing refusals with the bytes that reach each branch. */
export const LSP_FRAME_REFUSALS = Object.freeze([
	{
		title: 'a boundary-free header over the limit',
		text: 'x'.repeat(LSP_HEADER_LIMIT + 1),
		message: 'The LSP header exceeds the header limit',
		code: 'framing',
		value: LSP_HEADER_LIMIT + 1,
	},
	{
		title: 'a header boundary past the limit',
		text: 'x'.repeat(LSP_HEADER_LIMIT + 1) + '\r\n\r\n',
		message: 'The LSP header exceeds the header limit',
		code: 'framing',
		value: LSP_HEADER_LIMIT + 1,
	},
	{
		title: 'non-ASCII header bytes',
		text: 'X: \xff\r\n\r\n',
		message: 'The LSP header must contain ASCII bytes',
		code: 'framing',
	},
	{
		title: 'an invalid header field',
		text: 'Content-Length\r\n\r\n',
		message: 'The LSP header contains an invalid field',
		code: 'framing',
	},
	{
		title: 'a repeated content length',
		text: 'Content-Length: 1\r\nContent-Length: 1\r\n\r\n',
		message: 'The LSP header repeats Content-Length',
		code: 'framing',
	},
	{
		title: 'an empty content length',
		text: 'Content-Length:\r\n\r\n',
		message: 'The LSP Content-Length is empty',
		code: 'framing',
	},
	{
		title: 'a non-digit content length',
		text: 'Content-Length: x\r\n\r\n',
		message: 'The LSP Content-Length is invalid',
		code: 'framing',
	},
	{
		title: 'an unsafe content length',
		text: 'Content-Length: 999999999999999999\r\n\r\n',
		message: 'The LSP Content-Length is invalid',
		code: 'framing',
	},
	{
		title: 'a content length over the limit',
		text: `Content-Length: ${LSP_CONTENT_LIMIT + 1}\r\n\r\n`,
		message: 'The LSP Content-Length exceeds the content limit',
		code: 'framing',
		value: LSP_CONTENT_LIMIT + 1,
	},
	{
		title: 'a repeated content type',
		text: 'Content-Type: application/vscode-jsonrpc\r\nContent-Type: application/vscode-jsonrpc\r\n\r\n',
		message: 'The LSP header repeats Content-Type',
		code: 'framing',
	},
	{
		title: 'an unsupported media type',
		text: 'Content-Type: application/json\r\n\r\n',
		message: 'The LSP Content-Type is unsupported',
		code: 'framing',
	},
	{
		title: 'a malformed content-type parameter',
		text: 'Content-Type: application/vscode-jsonrpc; charset\r\n\r\n',
		message: 'The LSP Content-Type parameter is malformed',
		code: 'framing',
	},
	{
		title: 'a repeated charset',
		text: 'Content-Type: application/vscode-jsonrpc; charset=utf8; charset=utf8\r\n\r\n',
		message: 'The LSP Content-Type repeats charset',
		code: 'framing',
	},
	{
		title: 'an unsupported charset',
		text: 'Content-Type: application/vscode-jsonrpc; charset=utf16\r\n\r\n',
		message: 'The LSP Content-Type charset is unsupported',
		code: 'framing',
		value: 'utf16',
	},
	{
		title: 'an absent content length',
		text: 'X-Trace: 1\r\n\r\n',
		message: 'The LSP header requires Content-Length',
		code: 'framing',
	},
	{
		title: 'invalid UTF-8 body bytes',
		text: 'Content-Length: 1\r\n\r\n\xff',
		message: 'The LSP content is not valid UTF-8',
		code: 'framing',
	},
	{
		title: 'invalid JSON',
		text: 'Content-Length: 1\r\n\r\n{',
		message: 'The LSP content is not valid JSON',
		code: 'protocol',
	},
	{
		title: 'an invalid JSON-RPC shape',
		text: 'Content-Length: 2\r\n\r\n{}',
		message: 'The LSP content is not a valid JSON-RPC message',
		code: 'protocol',
	},
])

/** Owns one test's value observed across callbacks. */
export class LSPObservation<T> {
	#value: T

	constructor(value: T) {
		this.#value = value
	}

	get value(): T {
		return this.#value
	}

	set value(value: T) {
		this.#value = value
	}
}

/** Carries range members on a non-record prototype. */
export class WireRange {
	readonly start = { line: 0, character: 0 }
	readonly end = { line: 0, character: 4 }
}

/** Carries an error name and code without the package's brand. */
export class LookalikeError extends Error {
	override readonly name = 'LSPError'
	readonly code = 'framing'
}

/** Creates the inert transport used by the client factory proof. */
export function createFactoryTransport(): LSPTransportInterface {
	return {
		emitter: new Emitter<LSPTransportEventMap>(),
		async start(): Promise<void> {},
		async send(): Promise<boolean> {
			return true
		},
		async close(): Promise<void> {},
	}
}

/** Exchanges framed JSON-RPC traffic with the client under test. */
export class LSPFixtureTransport implements LSPTransportInterface {
	readonly #emitter = new Emitter<LSPTransportEventMap>()
	readonly #messages: JSONRPCMessage[] = []
	readonly #operations: string[] = []
	readonly #capabilities: LSPServerCapabilities
	readonly #shutdown: boolean
	readonly #initialize: boolean
	readonly #defer: boolean
	readonly #send:
		| { readonly method: string; readonly fault: 'throw' | 'false' | 'hang' }
		| undefined
	readonly #close: 'throw' | 'reject' | 'delay' | undefined
	readonly #handler:
		| ((peer: LSPFixtureTransport, message: JSONRPCMessage) => Promise<void> | void)
		| undefined
	#state: LSPDecodeState | undefined = undefined
	readonly #releases: Array<() => void> = []
	#starts = 0
	#closes = 0

	constructor(options?: {
		readonly capabilities?: LSPServerCapabilities
		readonly shutdown?: boolean
		readonly initialize?: boolean
		readonly defer?: boolean
		readonly send?: { readonly method: string; readonly fault: 'throw' | 'false' | 'hang' }
		readonly close?: 'throw' | 'reject' | 'delay'
		readonly handler?: (peer: LSPFixtureTransport, message: JSONRPCMessage) => Promise<void> | void
	}) {
		this.#capabilities = options?.capabilities ?? { textDocumentSync: 1 }
		this.#shutdown = options?.shutdown ?? true
		this.#initialize = options?.initialize ?? true
		this.#defer = options?.defer ?? false
		this.#send = options?.send
		this.#close = options?.close
		this.#handler = options?.handler
	}

	get emitter(): Emitter<LSPTransportEventMap> {
		return this.#emitter
	}

	get messages(): readonly JSONRPCMessage[] {
		return [...this.#messages]
	}

	get operations(): readonly string[] {
		return [...this.#operations]
	}

	get starts(): number {
		return this.#starts
	}

	get closes(): number {
		return this.#closes
	}

	async start(): Promise<void> {
		this.#starts += 1
		this.#operations.push('start')
		if (this.#defer) await new Promise<void>((resolve) => this.#releases.push(resolve))
	}

	release(): void {
		for (const release of this.#releases.splice(0)) release()
	}

	send(bytes: Uint8Array): Promise<boolean> {
		const [messages, state] = parseLSPMessages(bytes, this.#state)
		this.#state = state
		for (const message of messages) {
			if (
				this.#send?.fault === 'throw' &&
				this.#send.method === ('method' in message ? message.method : 'response')
			)
				throw new Error('Synchronous send failure')
		}
		return this.#deliver(messages)
	}

	close(): Promise<void> {
		this.#closes += 1
		this.#operations.push('close')
		if (this.#close === 'throw') throw new Error('Synchronous close failure')
		if (this.#close === 'reject') return Promise.reject(new Error('Close failure'))
		if (this.#close === 'delay')
			return waitForDelay(40).then(() => Promise.reject(new Error('Delayed close failure')))
		return Promise.resolve()
	}

	receive(message: JSONRPCMessage): void {
		this.#emitter.emit('chunk', encodeLSPMessage(message))
	}

	receiveBytes(bytes: Uint8Array): void {
		this.#emitter.emit('chunk', bytes)
	}

	exit(exit: LSPExit): void {
		this.#emitter.emit('exit', exit)
	}

	request(method: string): JSONRPCRequest | undefined {
		for (const message of this.#messages) {
			if (isJSONRPCRequest(message) && message.method === method) return message
		}
		return undefined
	}

	assertHandshake(): void {
		const first = this.#messages[0]
		const next = this.#messages[1]
		if (
			first === undefined ||
			!('method' in first) ||
			first.method !== LSP_METHODS.initialize ||
			next === undefined ||
			!('method' in next) ||
			next.method !== LSP_METHODS.initialized ||
			this.#messages.length !== 2
		)
			throw new Error('The fixture observed an invalid initialize ordering')
	}

	async #deliver(messages: readonly JSONRPCMessage[]): Promise<boolean> {
		for (const message of messages) {
			this.#messages.push(message)
			this.#operations.push('method' in message ? message.method : 'response')
			if (this.#send?.method === ('method' in message ? message.method : 'response')) {
				if (this.#send.fault === 'hang') return new Promise<boolean>(() => {})
				return false
			}
			if (
				this.#initialize &&
				isJSONRPCRequest(message) &&
				message.method === LSP_METHODS.initialize
			)
				this.receive({
					jsonrpc: '2.0',
					id: message.id,
					result: { capabilities: this.#capabilities },
				})
			if (isJSONRPCRequest(message) && message.method === LSP_METHODS.shutdown && this.#shutdown)
				this.receive({ jsonrpc: '2.0', id: message.id, result: null })
			await this.#handler?.(this, message)
		}
		return true
	}
}
