// Re-pads one pipe-table row to a target display length by adjusting the spaces
// before its final `|`. Used to keep the type table in guides/workflow.md aligned
// after an in-cell prose edit.
import { readFileSync, writeFileSync } from 'node:fs'

const [file, lineArgument, widthArgument] = process.argv.slice(2)
const index = Number(lineArgument) - 1
const width = Number(widthArgument)
const lines = readFileSync(file, 'utf8').split('\n')
const body = lines[index].replace(/\s*\|\s*$/, '')
const padding = width - body.length - 1
if (padding < 1) throw new Error(`row ${lineArgument} exceeds width ${widthArgument}`)
lines[index] = `${body}${' '.repeat(padding)}|`
writeFileSync(file, lines.join('\n'))
console.log(`line ${lineArgument} length=${lines[index].length}`)
