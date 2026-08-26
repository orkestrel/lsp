import { describe, expect, it } from 'vitest'
import { createRecorder, waitForDelay } from '@orkestrel/test'
import { createScratch } from '@orkestrel/test/server'
import { StdioTransport } from '@src/server'
import type { LSPExit } from '@src/core'

// Reproduces the analyst-claimed interleaving: parent A exits natively while a detached
// grandchild holds its standard output, so `close` has not fired and the generation is
// unretired; a replacement `start` is then measured for acceptance, and the release is
// measured for a single shared exit and stale bytes.
describe('probe - generation reuse across an unprompted zombie window', () => {
	it('measures start acceptance and exit collapse across the held pipe', async () => {
		const scratch = createScratch()
		try {
			const release = `${scratch.path}/release`
			const parent = [
				"const { spawn } = require('node:child_process')",
				'const tag = `STALE:${process.pid}`',
				'process.stdout.write(`READY:${process.pid}\\n`)',
				`const release = ${JSON.stringify(release)}`,
				'const program = [',
				"\t`const fs = require('node:fs')`,",
				'\t`const started = Date.now()`,',
				'\t`const timer = setInterval(() => {`,',
				'\t`\tif (!fs.existsSync(${JSON.stringify(release)}) && Date.now() - started < 15000) return`,',
				'\t`\tclearInterval(timer)`,',
				'\t`\tprocess.stdout.write(${JSON.stringify(tag + String.fromCharCode(10))})`,',
				'\t`\tprocess.exit(0)`,',
				'\t`}, 25)`,',
				"].join('\\n')",
				"spawn(process.execPath, ['-e', program], { stdio: ['ignore', 1, 'ignore'], detached: true }).unref()",
				'process.exit(0)',
			].join('\n')
			const transport = new StdioTransport({
				server: { command: [process.execPath, '-e', parent] },
				grace: 250,
			})
			const chunks = createRecorder<[Uint8Array]>()
			const exits = createRecorder<[LSPExit]>()
			transport.emitter.on('chunk', chunks.handler)
			transport.emitter.on('exit', exits.handler)
			await transport.start()
			const opened = performance.now()
			let dead = false
			while (performance.now() - opened < 5_000) {
				dead = !(await transport.send(new Uint8Array([10])))
				if (dead) break
				await waitForDelay(10)
			}
			expect(dead).toBe(true)
			// The zombie window: the child exited natively, the held pipe defers `close`,
			// and no transport exit has fired.
			expect(exits.count).toBe(0)
			let accepted = false
			let refusal: unknown
			try {
				await transport.start()
				accepted = true
			} catch (thrown) {
				refusal = thrown
			}
			scratch.write('release', '')
			const released = performance.now()
			while (performance.now() - released < 10_000) {
				if (exits.count >= 1) break
				await waitForDelay(25)
			}
			await waitForDelay(400)
			const text = Buffer.concat(chunks.calls.map((call) => Buffer.from(call[0]))).toString('utf8')
			const readies = [...text.matchAll(/READY:(\d+)/g)].map((match) => match[1])
			const stales = [...text.matchAll(/STALE:(\d+)/g)].map((match) => match[1])
			console.log(
				JSON.stringify({ accepted, refusal: String(refusal), exits: exits.count, readies, stales }),
			)
			// The MEASUREMENT block: the contract owes a refused replacement while the
			// retiring generation is unsettled. A red here with accepted=true reproduces
			// the analyst's claim; the printed record carries the interleaving facts.
			expect(accepted).toBe(false)
		} finally {
			await destroyProbe(scratch)
		}
	}, 30_000)
})

async function destroyProbe(scratch: { destroy(): void }): Promise<void> {
	await waitForDelay(50)
	scratch.destroy()
}
