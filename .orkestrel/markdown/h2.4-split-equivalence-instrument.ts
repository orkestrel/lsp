import { describe, expect, it } from 'vitest'
import { splitTableRow } from '@src/core'

// The pre-3710f65 splitTableRow loop, copied verbatim from the h2.4 diff's minus lines,
// with the two validator calls inlined to their one-line meanings.
function oldSplitTableRow(row: string): readonly string[] {
	const cells: string[] = []
	let current = ''
	const trimmed = row.trim()
	for (let index = 0; index < trimmed.length; index += 1) {
		const character = trimmed[index]
		if (character === '\\' && trimmed[index + 1] === '|') {
			current += '|'
			index += 1
		} else if (character === '|') {
			cells.push(current)
			current = ''
		} else {
			current += character
		}
	}
	cells.push(current)
	if (cells.length > 0 && (cells[0] ?? '').trim() === '') cells.shift()
	if (cells.length > 0 && (cells[cells.length - 1] ?? '').trim() === '') cells.pop()
	return cells
}

// Negative control: keeps the outer empty cells the real rule drops.
function controlSplit(row: string): readonly string[] {
	const cells: string[] = []
	let current = ''
	const trimmed = row.trim()
	for (let index = 0; index < trimmed.length; index += 1) {
		const character = trimmed[index]
		if (character === '\\' && trimmed[index + 1] === '|') {
			current += '|'
			index += 1
		} else if (character === '|') {
			cells.push(current)
			current = ''
		} else {
			current += character
		}
	}
	cells.push(current)
	return cells
}

const NAMED = [
	'a|b\\',
	'|a|  |b|',
]

const ATOMS = ['', 'a', ' ', '\\|', '\\', '|', 'é✓', '  b ', '\\\\|', 'a\\']
const CORPUS: string[] = []
for (const left of ATOMS) {
	for (const middle of ATOMS) {
		for (const right of ATOMS) {
			CORPUS.push(`${left}|${middle}|${right}`)
			CORPUS.push(`|${left}|${middle}${right}`)
			CORPUS.push(`${left}${middle}${right}`)
		}
	}
}

describe('splitTableRow equivalence with the removed loop', () => {
	it('matches on the referral inputs', () => {
		for (const row of NAMED) {
			expect(splitTableRow(row), JSON.stringify(row)).toEqual(oldSplitTableRow(row))
		}
	})
	it('matches across the deterministic corpus', () => {
		for (const row of CORPUS) {
			expect(splitTableRow(row), JSON.stringify(row)).toEqual(oldSplitTableRow(row))
		}
	})
	it('control: a rule that keeps outer empties reports a difference', () => {
		const different = CORPUS.filter(
			(row) => JSON.stringify(controlSplit(row)) !== JSON.stringify(splitTableRow(row)),
		)
		expect(different.length).toBeGreaterThan(0)
	})
})
