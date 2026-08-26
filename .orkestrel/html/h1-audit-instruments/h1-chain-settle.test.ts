import { describe, expect, it } from 'vitest'
import { HTML } from '../../src/core/HTML'

const ORIGINAL = '<!DOCTYPE html><main><p class="x">A <b>b</b> C</p><!--n--></main>'

describe('h1 claim 1 settling — chained derivation', () => {
	it('answers spans through a sanitize-distill-map chain', () => {
		const page = new HTML(ORIGINAL)
		const chained = page.sanitize({ comments: true }).distill().map((node) => node)
		let answered = 0
		for (const node of chained.walk()) {
			const region = chained.span(node)
			if (region === undefined) continue
			answered += 1
			expect(region.start).toBeGreaterThanOrEqual(0)
			expect(region.end).toBeGreaterThanOrEqual(region.start)
			expect(region.end).toBeLessThanOrEqual(ORIGINAL.length)
		}
		const rootRegion = chained.span(chained.document)
		expect(rootRegion).toBeDefined()
		if (rootRegion === undefined) return
		expect(ORIGINAL.slice(rootRegion.start, rootRegion.end)).toBe(
			'<main><p class="x">A <b>b</b> C</p><!--n--></main>',
		)
		const paragraph = chained.filter((node) => 'name' in node && node.name === 'p')[0]
		expect(paragraph).toBeDefined()
		if (paragraph === undefined) return
		const paragraphRegion = chained.span(paragraph)
		expect(paragraphRegion).toBeDefined()
		if (paragraphRegion === undefined) return
		expect(ORIGINAL.slice(paragraphRegion.start, paragraphRegion.end)).toBe(
			'<p class="x">A <b>b</b> C</p>',
		)
		expect(answered).toBeGreaterThan(0)
	})

	it('CONTROL — a fresh entity with no chain answers the same paragraph region', () => {
		const page = new HTML(ORIGINAL)
		const paragraph = page.filter((node) => 'name' in node && node.name === 'p')[0]
		expect(paragraph).toBeDefined()
		if (paragraph === undefined) return
		const region = page.span(paragraph)
		expect(region).toBeDefined()
		if (region === undefined) return
		expect(ORIGINAL.slice(region.start, region.end)).toBe('<p class="x">A <b>b</b> C</p>')
	})
})
