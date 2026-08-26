// M3 settling probe edit: revert the U1.2 drain reorder inside the probe worktree,
// reproducing the pre-fix order (terminal honored before the queue drains).
const fs = require('node:fs')
const path = 'src/core/MCPClient.ts'
let source = fs.readFileSync(path, 'utf8')
const terminalLine = 'if (subscription.terminal !== undefined) return subscription.terminal'
const drainLine = 'const queued = subscription.queue.shift()'
const terminalIndex = source.indexOf(terminalLine)
const drainIndex = source.indexOf(drainLine)
if (terminalIndex < 0 || drainIndex < 0) throw new Error('anchor not found')
if (terminalIndex < drainIndex) throw new Error('already reverted')
const terminalStart = source.lastIndexOf('\n', terminalIndex) + 1
const terminalEnd = source.indexOf('\n', terminalIndex) + 1
const removed = source.slice(terminalStart, terminalEnd)
source = source.slice(0, terminalStart) + source.slice(terminalEnd)
const drainAnchor = source.indexOf(drainLine)
const drainStart = source.lastIndexOf('\n', drainAnchor) + 1
source = source.slice(0, drainStart) + removed + source.slice(drainStart)
fs.writeFileSync(path, source)
console.log('REVERTED: terminal check moved above the drain')
