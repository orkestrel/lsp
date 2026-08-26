import { describe, expect, it } from 'vitest'
import { createStdioTransport } from '../../src/server/factories'
import { FIXTURE_PEER } from '../../tests/setupServer'

describe('l4 claim 1 settling — stale exit on the kill path', () => {
	it('measures the emit ordering when stopChild has to kill', async () => {
		const transport = createStdioTransport({
			server: { command: [process.execPath, FIXTURE_PEER, '--stubborn'] },
			grace: 50,
		})
		let exits = 0
		transport.emitter.on('exit', () => {
			exits += 1
		})
		await transport.start()
		await new Promise((resolve) => setTimeout(resolve, 100))
		await transport.close()
		const atCloseResolve = exits
		await transport.start()
		await new Promise((resolve) => setTimeout(resolve, 300))
		const afterBeat = exits
		await transport.close()
		console.log(JSON.stringify({ atCloseResolve, afterBeat }))
		expect(afterBeat).toBeGreaterThanOrEqual(atCloseResolve)
	})
})
