import { describe, expect, it } from 'vitest'
import { createStdioTransport } from '../../src/server/factories'
import { FIXTURE_PEER } from '../../tests/setupServer'

describe('l4 claim 1 settling — stale generation exit', () => {
	it('measures whether a closed generation emits exit after close() resolves', async () => {
		const transport = createStdioTransport({
			server: { command: [process.execPath, FIXTURE_PEER] },
		})
		let exits = 0
		transport.emitter.on('exit', () => {
			exits += 1
		})
		await transport.start()
		await transport.close()
		const atCloseResolve = exits
		await transport.start()
		await new Promise((resolve) => setTimeout(resolve, 300))
		const afterBeat = exits
		await transport.close()
		// The reviewer's derivation predicts atCloseResolve === 0 and afterBeat === 1:
		// generation A's exit lands on the shared emitter while generation B is live.
		expect({ atCloseResolve, afterBeat }).toEqual({ atCloseResolve: 0, afterBeat: 1 })
	})
})
