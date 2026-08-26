import type { HTMLNode, TextNode } from '@src/core'
import { describe, expect, it } from 'vitest'
import { HTML, isTextNode } from '@src/core'

// Reproduces the reviewer-traced interleaving: a handler that rebuilds one text node and
// reuses the OTHER original text node gives the original an output entry, and a chain
// resolving the rebuilt node walks through it onto the foreign span.
describe('probe - derivation chain through a reused original', () => {
	it('premise control: the parser baseline spans hold', () => {
		const page = new HTML('<i>a</i><b>b</b>')
		const [textA, textB] = page.filter(isTextNode)
		expect(page.span(textA)).toEqual({ start: 3, end: 4 })
		expect(page.span(textB)).toEqual({ start: 11, end: 12 })
	})

	it('measures span(rewrittenA) under the traced vector', () => {
		const page = new HTML('<i>a</i><b>b</b>')
		const [textA, textB] = page.filter(isTextNode)
		if (textA === undefined || textB === undefined) throw new Error('expected two text nodes')
		const replacement: TextNode = { category: 'text', value: 'A' }
		const mapped = page.map((node: HTMLNode) =>
			node === textA ? replacement : node === textB ? textA : node,
		)
		const rewritten = mapped.find(
			(node: HTMLNode) => node.category === 'text' && node.value === 'A',
		)
		if (rewritten === undefined) throw new Error('expected the rebuilt node')
		// The contract owes textA's own region { start: 3, end: 4 }. The reviewer traces
		// { start: 11, end: 12 }. This assertion states the CONTRACT, so a red run
		// REPRODUCES the defect and the printed actual value is the measurement.
		expect(mapped.span(rewritten)).toEqual({ start: 3, end: 4 })
	})
})
