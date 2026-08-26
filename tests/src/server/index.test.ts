import * as entry from '@src/server'
import { describe, expect, it } from 'vitest'

describe('src server entry', () => {
	it('exports the stdio transport and its factory', () => {
		expect(Object.keys(entry).sort()).toStrictEqual(['StdioTransport', 'createStdioTransport'])
	})
})
