import { writeFileSync } from 'node:fs'
import { describe, it } from 'vitest'
import { parseDocument, renderHTML } from '@src/core'

describe('implied-close chain probe', () => {
	it('records the deep chain against the control', () => {
		const deep = renderHTML(parseDocument('<table><tr><td><p><button>x<td>y'))
		const control = renderHTML(parseDocument('<table><tr><td><p>x<td>y'))
		const lines = [`DEEP   : ${JSON.stringify(deep)}`, `CONTROL: ${JSON.stringify(control)}`]
		writeFileSync('/tmp/claude-0/-home-user/e44afe43-d783-57c4-9b94-e1b722b0b4a2/scratchpad/h3-impliedChain-probe.txt', lines.join('\n') + '\n')
	})
})
