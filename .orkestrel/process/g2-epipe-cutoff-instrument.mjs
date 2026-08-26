import { spawn } from 'node:child_process'
import { statSync } from 'node:fs'
import { setTimeout as delay } from 'node:timers/promises'

// Replicates the drain-bound cutoff: the parent destroys its pipe read ends after the
// detached root exits, then reads whether the unguarded grandchild survives and keeps
// appending to its file. `guard` runs the same shape with a stderr error handler.
const dir = new URL('./', import.meta.url).pathname
const variant = process.argv[2] ?? 'bare'
const target = `${dir}late2-${variant}.log`
const root = spawn(process.argv[0], [`${dir}root2.mjs`, target, variant === 'guard' ? 'guard' : ''], {
	stdio: ['ignore', 'pipe', 'pipe'],
	detached: true,
})
let announced = ''
root.stdout.on('data', (chunk) => {
	announced += String(chunk)
})
root.stderr.on('data', () => undefined)
await new Promise((resolve) => root.on('exit', resolve))
const pid = Number.parseInt(announced.replace('grandchild:', ''), 10)
await delay(100)
root.stdout.destroy()
root.stderr.destroy()
const sizeAtCut = statSync(target, { throwIfNoEntry: false })?.size ?? 0
await delay(500)
const sizeLater = statSync(target, { throwIfNoEntry: false })?.size ?? 0
let alive = false
try {
	process.kill(pid, 0)
	alive = true
} catch {
	alive = false
}
console.log(`${variant}: file_at_cut=${sizeAtCut} file_later=${sizeLater} grew=${sizeLater > sizeAtCut} writer_alive=${alive}`)
if (alive) process.kill(pid, 'SIGKILL')
