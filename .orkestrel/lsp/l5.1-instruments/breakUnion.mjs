import { readFileSync, writeFileSync } from 'node:fs'

const path = 'src/core/types.ts'
const source = readFileSync(path, 'utf8')
const line = 'export type LSPDiagnosticSeverity = 1 | 2 | 3 | 4'
if (!source.includes(line)) throw new Error('the LSPDiagnosticSeverity declaration was not found')
writeFileSync(path, source.replace(line, 'export type LSPDiagnosticSeverity = 1 | 2 | 3 | 9'))
