import type {
	JSONRPCMessage,
	LSPDecodeState,
	LSPExit,
	LSPTransportEventMap,
	LSPTransportInterface,
} from '@src/core'
import {
	encodeLSPMessage,
	isJSONRPCRequest,
	LSPClient,
	LSP_METHODS,
	parseLSPMessages,
} from '@src/core'
import { Emitter } from '@orkestrel/emitter'
import { waitForDelay } from '@orkestrel/test'
import { describe, expect, it } from 'vitest'

class DeferredStartTransport implements LSPTransportInterface {
	readonly #emitter = new Emitter<LSPTransportEventMap>()
	readonly #messages: JSONRPCMessage[] = []
	readonly #starts: PromiseWithResolvers<void>[] = []
	#state: LSPDecodeState | undefined = undefined

	get emitter(): Emitter<LSPTransportEventMap> {
		return this.#emitter
	}

	get messages(): readonly JSONRPCMessage[] {
		return [...this.#messages]
	}

	get starts(): number {
		return this.#starts.length
	}

	start(): Promise<void> {
		const deferred = Promise.withResolvers<void>()
		this.#starts.push(deferred)
		return deferred.promise
	}

	release(index: number): void {
		this.#starts[index]?.resolve()
	}

	send(bytes: Uint8Array): Promise<boolean> {
		const [messages, state] = parseLSPMessages(bytes, this.#state)
		this.#state = state
		for (const message of messages) {
			this.#messages.push(message)
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

describe('recheck probe', () => {
	it('PROBE A: a start whose transport exits before its own start settles writes nothing into the successor generation', async () => {
		const transport = new DeferredStartTransport()
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
		first.catch(() => {})
		await waitForDelay()
		transport.exit({ code: 1, signal: null })
		await waitForDelay()
		transport.release(0)
		await waitForDelay()
		transport.release(1)
		await waitForDelay()
		const requests = transport.messages.filter(
			(message) => isJSONRPCRequest(message) && message.method === LSP_METHODS.initialize,
		)
		expect(requests).toHaveLength(1)
		const settled = await Promise.race([
			first.then(
				() => 'resolved',
				() => 'rejected',
			),
			waitForDelay(200).then(() => 'pending'),
		])
		expect(settled).toBe('rejected')
		await client.destroy()
	})
})
