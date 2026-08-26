import type {
	JSONRPCMessage,
	JSONRPCRequest,
	LSPDecodeState,
	LSPExit,
	LSPTransportEventMap,
	LSPTransportInterface,
} from '@src/core'
import {
	encodeLSPMessage,
	isJSONRPCRequest,
	isLSPError,
	LSPClient,
	LSP_METHODS,
	parseLSPMessages,
} from '@src/core'
import { Emitter } from '@orkestrel/emitter'
import { waitForDelay } from '@orkestrel/test'
import { describe, expect, it } from 'vitest'

class ProbeTransport implements LSPTransportInterface {
	readonly #emitter = new Emitter<LSPTransportEventMap>()
	readonly #messages: JSONRPCMessage[] = []
	readonly #initialize: boolean
	#state: LSPDecodeState | undefined = undefined
	#starts = 0

	constructor(options?: { readonly initialize?: boolean }) {
		this.#initialize = options?.initialize ?? true
	}

	get emitter(): Emitter<LSPTransportEventMap> {
		return this.#emitter
	}

	get messages(): readonly JSONRPCMessage[] {
		return [...this.#messages]
	}

	get starts(): number {
		return this.#starts
	}

	async start(): Promise<void> {
		this.#starts += 1
	}

	send(bytes: Uint8Array): Promise<boolean> {
		const [messages, state] = parseLSPMessages(bytes, this.#state)
		this.#state = state
		for (const message of messages) {
			this.#messages.push(message)
			if (
				this.#initialize &&
				isJSONRPCRequest(message) &&
				message.method === LSP_METHODS.initialize
			)
				this.receive({
					jsonrpc: '2.0',
					id: message.id,
					result: { capabilities: { textDocumentSync: 1 } },
				})
			if (isJSONRPCRequest(message) && message.method === LSP_METHODS.shutdown)
				this.receive({ jsonrpc: '2.0', id: message.id, result: null })
		}
		return Promise.resolve(true)
	}

	close(): Promise<void> {
		return Promise.resolve()
	}

	receive(message: JSONRPCMessage): void {
		this.#emitter.emit('chunk', encodeLSPMessage(message))
	}

	exit(exit: LSPExit): void {
		this.#emitter.emit('exit', exit)
	}
}

describe('recheck probes', () => {
	it('PROBE 1: a restart issued from the exit handler completes a second generation', async () => {
		const transport = new ProbeTransport({ initialize: false })
		let restart: Promise<void> | undefined
		const client: LSPClient = new LSPClient({
			transport,
			workspace: 'file:///workspace',
			on: {
				exit: () => {
					restart = client.start()
					restart.catch(() => {})
				},
			},
		})
		const first = client.start()
		await waitForDelay()
		transport.exit({ code: 1, signal: null })
		await expect(first).rejects.toSatisfy(
			(value) => isLSPError(value) && value.code === 'closed',
		)
		await waitForDelay()
		const requests = transport.messages.filter(
			(message): message is JSONRPCRequest =>
				isJSONRPCRequest(message) && message.method === LSP_METHODS.initialize,
		)
		const second = requests[1]
		if (second !== undefined)
			transport.receive({
				jsonrpc: '2.0',
				id: second.id,
				result: { capabilities: { textDocumentSync: 1 } },
			})
		await waitForDelay()
		expect(transport.starts).toBe(2)
		await expect(restart).resolves.toBeUndefined()
		await client.destroy()
	})

	it('PROBE 2: a drained publication deadline cannot reject the next generation publication', async () => {
		const transport = new ProbeTransport()
		const client = new LSPClient({ transport, workspace: 'file:///workspace', timeout: 400 })
		await client.start()
		const uri = 'file:///a.ts'
		const first = client.open({ uri, languageId: 'typescript', version: 1, text: 'a' })
		first.catch(() => {})
		await waitForDelay(10)
		transport.exit({ code: 1, signal: null })
		await expect(first).rejects.toSatisfy((value) => isLSPError(value))
		await waitForDelay(150)
		await client.start()
		const second = client.open({ uri, languageId: 'typescript', version: 2, text: 'a' })
		second.catch(() => {})
		await waitForDelay(310)
		transport.receive({
			jsonrpc: '2.0',
			method: LSP_METHODS.publish,
			params: { uri, diagnostics: [] },
		})
		await expect(second).resolves.toEqual([])
		await client.destroy()
	})
})
