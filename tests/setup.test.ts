import { readFileSync } from 'node:fs'
import * as setup from './setup.js'
import { describe, expect, it } from 'vitest'

// tests/setup.test.ts — proves `tests/setup.ts`, `setupFiles[0]` for every Vitest project. The
// module exports `WORKSPACE_ROOT`, so this proof pins both the export surface and the resolved
// root against the checkout's own `package.json`.

function readPackageName(root: URL): string {
	const manifestPath = new URL('package.json', root)
	const contents: unknown = JSON.parse(readFileSync(manifestPath, 'utf8'))
	if (
		typeof contents !== 'object' ||
		contents === null ||
		!('name' in contents) ||
		typeof contents.name !== 'string'
	) {
		throw new Error('package.json name must be a string')
	}
	return contents.name
}

describe('setup', () => {
	it('exports exactly WORKSPACE_ROOT', () => {
		expect(Object.keys(setup)).toEqual(['WORKSPACE_ROOT'])
	})

	it('resolves WORKSPACE_ROOT to the checkout holding @orkestrel/lsp', () => {
		expect(readPackageName(setup.WORKSPACE_ROOT)).toBe('@orkestrel/lsp')
	})
})
