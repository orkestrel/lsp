import type { LSPTransportEventMap, LSPTransportInterface } from '@src/core'
import { createLSPClient, LSPClient } from '@src/core'
import { Emitter } from '@orkestrel/emitter'
import { describe, expect, it } from 'vitest'

describe('createLSPClient', () => {
	it('creates an LSPClient through its interface factory', () => {
		const transport: LSPTransportInterface = {
			emitter: new Emitter<LSPTransportEventMap>(),
			async start(): Promise<void> {},
			async send(): Promise<boolean> {
				return true
			},
			async close(): Promise<void> {},
		}

		const client = createLSPClient({ transport, workspace: 'file:///workspace' })

		expect(client).toBeInstanceOf(LSPClient)
	})
})
