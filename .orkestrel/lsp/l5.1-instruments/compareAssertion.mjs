import { readFileSync } from 'node:fs'

const text = readFileSync('tests/conformance.test.ts', 'utf8')
const prescription = [
	'expect(',
	"\tnew Set(CONFORMANCE_VALUES.filter((row) => row.symbol.startsWith('LSP_ENCODINGS.')).map((row) => row.symbol)),",
	').toStrictEqual(new Set(LSP_ENCODINGS.map((encoding) => `LSP_ENCODINGS.${encoding}`)))',
].join('\n')
const strip = (source) => source.replaceAll(/\s+/gu, '')
console.log('tokens equal:', strip(text).includes(strip(prescription)))
console.log('prescription:', strip(prescription))
