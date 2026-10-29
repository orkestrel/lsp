import { createLSPClient, LSPClient } from '@src/core'
import { createFactoryTransport } from '../../setup.js'
import { describe, expect, it } from 'vitest'

describe('createLSPClient', () => {
	it('creates an LSPClient through its interface factory', () => {
		const transport = createFactoryTransport()

		const client = createLSPClient({ transport, workspace: 'file:///workspace' })

		expect(client).toBeInstanceOf(LSPClient)
	})
})
