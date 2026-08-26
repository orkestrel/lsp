import { spawn } from 'node:child_process'
const target = process.argv[2]
const grandchild = spawn(process.argv[0], [new URL('./writer.mjs', import.meta.url).pathname, target], {
	stdio: ['ignore', 1, 2],
	detached: false,
})
grandchild.unref()
process.stdout.write(`grandchild:${String(grandchild.pid)}\n`)
setTimeout(() => process.exit(0), 150)
