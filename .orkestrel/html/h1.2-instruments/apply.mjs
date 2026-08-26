import { readFileSync, writeFileSync } from 'node:fs'

const spec = JSON.parse(readFileSync(process.argv[2], 'utf8'))
const text = readFileSync(spec.file, 'utf8')
const parts = text.split(spec.from)
if (parts.length !== 2) {
	console.error(`APPLY FAILED: ${parts.length - 1} matches for the quoted line`)
	process.exit(2)
}
writeFileSync(spec.file, parts.join(spec.to))
console.log('APPLIED')
