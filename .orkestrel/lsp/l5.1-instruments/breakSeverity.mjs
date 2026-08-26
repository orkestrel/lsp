import { readFileSync, writeFileSync } from 'node:fs'

const path = 'tests/setupConformance.ts'
const source = readFileSync(path, 'utf8')
const line = 'export const SEVERITY_HINT: LSPDiagnosticSeverity = 4'
if (!source.includes(line)) throw new Error('the SEVERITY_HINT declaration was not found')
writeFileSync(path, source.replace(line, 'export const SEVERITY_HINT: LSPDiagnosticSeverity = 9'))
