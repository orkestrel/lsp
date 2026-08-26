import { Emitter } from '@orkestrel/emitter'
import { describe, expect, it } from 'vitest'
import { LSPClient } from '../../src/core/LSPClient'
import type { LSPTransportEventMap, LSPTransportInterface } from '../../src/core/types'

class DeferredStartTransport implements LSPTransportInterface {
	readonly #emitter = new Emitter<LSPTransportEventMap>()
	readonly #releases: Array<() => void> = []

	get emitter(): Emitter<LSPTransportEventMap> {
		return this.#emitter
	}

	async start(): Promise<void> {
		await new Promise<void>((resolve) => this.#releases.push(resolve))
	}

	release(): void {
		for (const release of this.#releases.splice(0)) release()
	}

	send(): Promise<boolean> {
		return Promise.resolve(true)
	}

	close(): Promise<void> {
		return Promise.resolve()
	}
}

describe('l3.3.1 referral probe — abort while transport start is pending', () => {
	it('reports the rejection code for an abort landing during the start await', async () => {
		const controller = new AbortController()
		const transport = new DeferredStartTransport()
		const client = new LSPClient({
			transport,
			workspace: 'file:///workspace',
			signal: controller.signal,
		})
		const starting = client.start().then(
			() => 'started',
			(error: unknown) => error,
		)
		await new Promise<void>((resolve) => setTimeout(resolve, 10))
		controller.abort('stop')
		await new Promise<void>((resolve) => setTimeout(resolve, 10))
		transport.release()
		const outcome = await starting
		const code =
			typeof outcome === 'object' && outcome !== null && 'code' in outcome
				? outcome.code
				: undefined
		expect([code]).toEqual(['measure'])
	})
})
