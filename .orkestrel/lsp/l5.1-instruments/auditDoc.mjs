import { readFileSync } from 'node:fs'
import ts from 'typescript'

const path = 'tests/setupConformance.ts'
const text = readFileSync(path, 'utf8')
const source = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
for (const statement of source.statements) {
	if (!ts.isFunctionDeclaration(statement) || statement.name === undefined) continue
	const documentation = text
		.slice(statement.pos, statement.name.getStart(source))
		.match(/\/\*\*[\s\S]*?\*\//u)
	const block = documentation === null ? '' : documentation[0]
	const parameters = statement.parameters.map((parameter) => parameter.name.getText(source))
	const documented = [...block.matchAll(/@param (\w+)/gu)].map((match) => match[1])
	const returns = block.includes('@returns')
	const throwing = statement.body !== undefined && /\bthrow new\b/u.test(statement.body.getText(source))
	const documentedThrow = block.includes('@throws Thrown when')
	const problems = []
	if (parameters.join(',') !== documented.join(',')) problems.push(`params ${parameters} vs ${documented}`)
	if (!returns) problems.push('no @returns')
	if (throwing && !documentedThrow) problems.push('throws undocumented')
	console.log(`${problems.length === 0 ? 'OK  ' : 'FAIL'} ${statement.name.text} ${problems.join('; ')}`)
}
