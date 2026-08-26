import { readFileSync, writeFileSync } from 'node:fs'

const path = 'tests/setupConformance.ts'
const source = readFileSync(path, 'utf8')
const row = `	createNumeralRow(
		'LSP_REQUEST_FAILED',
		LSP_REQUEST_FAILED,
		'LSPErrorCodes',
		'RequestFailed',
		LSPErrorCodes.RequestFailed,
	),
`
if (!source.includes(row)) throw new Error('the LSP_REQUEST_FAILED row was not found')
writeFileSync(path, source.replace(row, ''))
