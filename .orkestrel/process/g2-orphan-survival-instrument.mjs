import { spawn } from 'node:child_process'
import { readFileSync, statSync } from 'node:fs'
import { setTimeout as delay } from 'node:timers/promises'

const dir = new URL('./', import.meta.url).pathname
const target = `${dir}late.log`
const root = spawn(process.argv[0], [`${dir}root.mjs`, target], {
	stdio: ['ignore', 'pipe', 'inherit'],
	detached: process.platform !== 'win32',
})
let announced = ''
root.stdout.on('data', (chunk) => {
	announced += String(chunk)
})
const rootExit = new Promise((resolve) => root.on('exit', resolve))
const code = await rootExit
const pid = Number.parseInt(announced.replace('grandchild:', ''), 10)
const sizeAtExit = statSync(target, { throwIfNoEntry: false })?.size ?? 0
console.log(`root exited code=${code} grandchild=${pid} file_at_exit=${sizeAtExit}`)
await delay(500)
const sizeLater = statSync(target, { throwIfNoEntry: false })?.size ?? 0
let alive = false
try {
	process.kill(pid, 0)
	alive = true
} catch {
	alive = false
}
console.log(`after 500ms: file=${sizeLater} grew=${sizeLater > sizeAtExit} grandchild_alive=${alive}`)
// Negative control: a grandchild this probe kills must read dead and frozen.
if (alive) {
	process.kill(pid, 'SIGKILL')
	await delay(200)
	const sizeKilled = statSync(target, { throwIfNoEntry: false })?.size ?? 0
	await delay(200)
	const sizeKilled2 = statSync(target, { throwIfNoEntry: false })?.size ?? 0
	let aliveAfterKill = true
	try {
		process.kill(pid, 0)
	} catch {
		aliveAfterKill = false
	}
	console.log(`control after SIGKILL: frozen=${sizeKilled === sizeKilled2} alive=${aliveAfterKill}`)
}
