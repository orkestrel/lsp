import { readLSPPackageName } from './setupServer.js'
import * as setup from './setup.js'
import { describe, expect, it } from 'vitest'

describe('setup', () => {
	it('exports exactly WORKSPACE_ROOT', () => {
		expect(Object.keys(setup).sort()).toEqual(
			[
				'createFactoryTransport',
				'LookalikeError',
				'LSPFixtureTransport',
				'LSPNotice',
				'LSPObservation',
				'LSP_FRAME_REFUSALS',
				'WireRange',
				'WORKSPACE_ROOT',
			].sort(),
		)
	})

	it('resolves WORKSPACE_ROOT to the checkout holding @orkestrel/lsp', () => {
		expect(readLSPPackageName(setup.WORKSPACE_ROOT)).toBe('@orkestrel/lsp')
	})
})
