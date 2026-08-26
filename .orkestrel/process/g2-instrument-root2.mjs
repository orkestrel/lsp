import { spawn } from 'node:child_process'
const target = process.argv[2]
const guard = process.argv[3]
const writer = spawn(process.argv[0], [new URL('./writer2.mjs', import.meta.url).pathname, target, guard ?? ''], {
	stdio: ['ignore', 1, 2],
	detached: false,
})
writer.unref()
process.stdout.write(`grandchild:${String(writer.pid)}\n`)
setTimeout(() => process.exit(0), 150)
