// M3 settling probe edit: plant `return false` as the first statement of
// #routeSubscription inside the probe worktree.
const fs = require('node:fs')
const path = 'src/core/MCPClient.ts'
let source = fs.readFileSync(path, 'utf8')
const anchor = source.indexOf('#routeSubscription(')
if (anchor < 0) throw new Error('routeSubscription not found')
const brace = source.indexOf('{', anchor)
if (brace < 0) throw new Error('body brace not found')
source = source.slice(0, brace + 1) + '\n\t\treturn false' + source.slice(brace + 1)
fs.writeFileSync(path, source)
console.log('MUTATED: #routeSubscription opens with return false')
