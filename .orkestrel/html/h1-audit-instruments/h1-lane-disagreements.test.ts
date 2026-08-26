import { describe, expect, it } from 'vitest'
import { HTML } from '../../src/core/HTML'
import { parseHTMLSpan } from '../../src/core/parsers'
import type { TextNode } from '../../src/core/types'

describe('h1 lane-disagreement probes', () => {
	it('PROBE A - map returning one object for two source nodes leaves it unprovenanced', () => {
		const shared: TextNode = { category: 'text', value: 'z' }
		const page = new HTML('<i>a</i><b>b</b>')
		const mapped = page.map((node) => (node.category === 'text' ? shared : node))
		expect(mapped.span(shared)).toBeUndefined()
	})

	it('PROBE B - parseHTMLSpan refuses an uncovered boundary', () => {
		expect(parseHTMLSpan([0, 1], 1, 2)).toBeUndefined()
	})

	it('PROBE C - a block start while p is open implies the close under a nested inline', () => {
		const page = new HTML('<p><b>x<div>y')
		const paragraph = page.filter((node) => 'name' in node && node.name === 'p')[0]
		expect(paragraph).toBeDefined()
		if (paragraph === undefined) return
		expect(page.span(paragraph)).toEqual({ start: 0, end: 7 })
	})
})
