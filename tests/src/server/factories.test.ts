import type { LSPExit } from '@src/core'
import { encodeLSPMessage } from '@src/core'
import { createStdioTransport } from '@src/server'
import { createRecorder, waitForCondition } from '@orkestrel/test'
import {
	collectPeerMessages,
	createPeerOptions,
	readPeerPid,
	waitForReaped,
} from '../../setupServer.js'
import { describe, expect, it } from 'vitest'

const PEER = { budget: 5_000 }

describe('createStdioTransport', () => {
	it('produces a transport that spawns, carries bytes, and ends its child', async () => {
		const chunks = createRecorder<[Uint8Array]>()
		const exits = createRecorder<[LSPExit]>()
		const transport = createStdioTransport(createPeerOptions({ grace: 2_000 }))
		transport.emitter.on('chunk', chunks.handler)
		transport.emitter.on('exit', exits.handler)
		await transport.start()
		expect(
			await transport.send(
				encodeLSPMessage({ jsonrpc: '2.0', id: 1, method: 'probe/echo', params: {} }),
			),
		).toBe(true)
		await waitForCondition(
			'the echo response',
			() => collectPeerMessages(chunks.calls.flat()).length >= 2,
			PEER,
		)
		const pid = readPeerPid(collectPeerMessages(chunks.calls.flat()))
		await transport.close()
		await waitForCondition('the child exit event', () => exits.count === 1, PEER)
		expect(exits.calls.flat()).toStrictEqual([{ code: 0, signal: null }])
		await waitForReaped(pid)
	})
})
