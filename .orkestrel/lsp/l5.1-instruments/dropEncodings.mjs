import { readFileSync, writeFileSync } from 'node:fs'

const path = 'tests/setupConformance.ts'
const source = readFileSync(path, 'utf8')
const row = `	createValueRow(
		'LSP_ENCODINGS.utf-32',
		LSP_ENCODINGS[2],
		'PositionEncodingKind',
		'UTF32',
		PositionEncodingKind.UTF32,
	),
`
if (!source.includes(row)) throw new Error('the utf-32 row was not found')
writeFileSync(path, source.replace(row, ''))
