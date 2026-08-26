import type { LSPExit } from '@src/core'
import { encodeLSPMessage, isLSPError } from '@src/core'
import { StdioTransport } from '@src/server'
import { createRecorder, waitForCondition } from '@orkestrel/test'
import { createScratch, destroyScratch, isRunning } from '@orkestrel/test/server'
import {
	FIXTURE_AMBIENT,
	KILLED_EXIT,
	collectPeerMessages,
	createHolderOptions,
	createPeerOptions,
	readPeerNumber,
	readPeerPid,
	readPeerResult,
	readPeerShapes,
	waitForReaped,
} from '../../../setupServer.js'
import { realpathSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

// A spawned interpreter, a round trip through its pipes, and a kill escalation all cost more than
// the wait family's one-second default on a loaded host, so every peer wait carries this budget.
const PEER = { budget: 5_000 }

const PING = encodeLSPMessage({ jsonrpc: '2.0', method: 'probe/ping' })
const ECHO = encodeLSPMessage({ jsonrpc: '2.0', id: 1, method: 'probe/echo', params: {} })
const HOLD = encodeLSPMessage({ jsonrpc: '2.0', id: 2, method: 'probe/hold', params: {} })
const ORPHAN = encodeLSPMessage({ jsonrpc: '2.0', id: 3, method: 'probe/orphan', params: {} })

describe('StdioTransport', () => {
	it('rejects an empty command as a spawn failure', async () => {
		const transport = new StdioTransport({ server: { command: [] } })
		const fault = await transport.start().then(
			() => undefined,
			(error: unknown) => error,
		)
		expect(isLSPError(fault)).toBe(true)
		expect(isLSPError(fault) ? fault.code : undefined).toBe('spawn')
	})

	it('rejects an executable the host cannot launch as a spawn failure', async () => {
		const transport = new StdioTransport({
			server: { command: ['orkestrel-lsp-absent-executable', '--stdio'] },
		})
		const fault = await transport.start().then(
			() => undefined,
			(error: unknown) => error,
		)
		expect(isLSPError(fault)).toBe(true)
		expect(isLSPError(fault) ? fault.code : undefined).toBe('spawn')
		expect(await transport.send(PING)).toBe(false)
		expect(transport.pid).toBeUndefined()
	})

	it('refuses a second start while its child is live', async () => {
		const transport = new StdioTransport(createPeerOptions())
		await transport.start()
		try {
			const fault = await transport.start().then(
				() => undefined,
				(error: unknown) => error,
			)
			expect(isLSPError(fault)).toBe(true)
			expect(isLSPError(fault) ? fault.code : undefined).toBe('duplicate')
		} finally {
			await transport.close()
		}
	})

	it('refuses a start issued while a close is still in flight', async () => {
		const transport = new StdioTransport(createPeerOptions({ grace: 2_000 }))
		await transport.start()
		const closing = transport.close()
		const fault = await transport.start().then(
			() => undefined,
			(error: unknown) => error,
		)
		try {
			await closing
			expect(isLSPError(fault)).toBe(true)
			expect(isLSPError(fault) ? fault.code : undefined).toBe('duplicate')
		} finally {
			await transport.close()
		}
	})

	it('settles a concurrent close on the same termination the first close awaits', async () => {
		const chunks = createRecorder<[Uint8Array]>()
		const transport = new StdioTransport(createPeerOptions({ stubborn: true, grace: 200 }))
		transport.emitter.on('chunk', chunks.handler)
		await transport.start()
		await transport.send(ECHO)
		await waitForCondition(
			'the echo response',
			() => collectPeerMessages(chunks.calls.flat()).length >= 2,
			PEER,
		)
		const pid = readPeerPid(collectPeerMessages(chunks.calls.flat()))
		const first = transport.close()
		const second = transport.close()
		try {
			await second
			expect(isRunning(pid)).toBe(false)
		} finally {
			await first
			await waitForReaped(pid)
		}
	}, 15_000)

	it('delivers a frame split across host reads without joining the chunks', async () => {
		const chunks = createRecorder<[Uint8Array]>()
		const transport = new StdioTransport(createPeerOptions())
		transport.emitter.on('chunk', chunks.handler)
		await transport.start()
		try {
			await waitForCondition('the peer ready frame', () => chunks.count === 1, PEER)
			await transport.send(encodeLSPMessage({ jsonrpc: '2.0', method: 'probe/split' }))
			await waitForCondition('the split report', () => chunks.count >= 3, PEER)
			const tail = chunks.calls.slice(1).flat()
			const [first, ...rest] = tail
			expect(rest.length).toBeGreaterThan(0)
			expect(collectPeerMessages(first === undefined ? [] : [first])).toStrictEqual([])
			expect(readPeerShapes(collectPeerMessages(tail))).toStrictEqual(['split'])
		} finally {
			await transport.close()
		}
	})

	it('delivers coalesced frames as the single chunk the host read', async () => {
		const chunks = createRecorder<[Uint8Array]>()
		const transport = new StdioTransport(createPeerOptions())
		transport.emitter.on('chunk', chunks.handler)
		await transport.start()
		try {
			await waitForCondition('the peer ready frame', () => chunks.count === 1, PEER)
			await transport.send(encodeLSPMessage({ jsonrpc: '2.0', method: 'probe/coalesce' }))
			await waitForCondition('the coalesced report', () => chunks.count >= 2, PEER)
			const carried = chunks.calls
				.slice(1)
				.flat()
				.map((chunk) => readPeerShapes(collectPeerMessages([chunk])))
			expect(carried).toContainEqual(['first', 'second'])
		} finally {
			await transport.close()
		}
	})

	it('carries the configured directory and environment into the child', async () => {
		const scratch = createScratch({ prefix: 'lsp-peer-' })
		const chunks = createRecorder<[Uint8Array]>()
		const transport = new StdioTransport(
			createPeerOptions({
				directory: scratch.path,
				environment: { LSP_FIXTURE_VALUE: 'carried' },
			}),
		)
		transport.emitter.on('chunk', chunks.handler)
		await transport.start()
		try {
			await waitForCondition('the peer ready frame', () => chunks.count === 1, PEER)
			await transport.send(ECHO)
			await waitForCondition(
				'the echo response',
				() => collectPeerMessages(chunks.calls.flat()).length >= 2,
				PEER,
			)
			const messages = collectPeerMessages(chunks.calls.flat())
			expect(readPeerResult(messages, 'directory')).toBe(realpathSync(scratch.path))
			expect(readPeerResult(messages, 'variable')).toBe('carried')
			expect(readPeerResult(messages, 'ambient')).toBeNull()
		} finally {
			await transport.close()
			await destroyScratch(scratch)
		}
	})

	it('gives the child this process environment when the options configure none', async () => {
		const chunks = createRecorder<[Uint8Array]>()
		const transport = new StdioTransport(createPeerOptions())
		transport.emitter.on('chunk', chunks.handler)
		await transport.start()
		try {
			await waitForCondition('the peer ready frame', () => chunks.count === 1, PEER)
			await transport.send(ECHO)
			await waitForCondition(
				'the echo response',
				() => collectPeerMessages(chunks.calls.flat()).length >= 2,
				PEER,
			)
			const messages = collectPeerMessages(chunks.calls.flat())
			expect(readPeerResult(messages, 'ambient')).toBe(FIXTURE_AMBIENT)
			expect(readPeerResult(messages, 'variable')).toBeNull()
		} finally {
			await transport.close()
		}
	})

	it('reports the host identifier of the child owning the current generation', async () => {
		const chunks = createRecorder<[Uint8Array]>()
		const transport = new StdioTransport(createPeerOptions({ grace: 2_000 }))
		transport.emitter.on('chunk', chunks.handler)
		expect(transport.pid).toBeUndefined()
		await transport.start()
		try {
			await transport.send(ECHO)
			await waitForCondition(
				'the echo response',
				() => collectPeerMessages(chunks.calls.flat()).length >= 2,
				PEER,
			)
			// The peer reports its own identifier over the protocol, so the transport's reading is
			// checked against the child's own answer rather than against the call that produced it.
			expect(transport.pid).toBe(readPeerPid(collectPeerMessages(chunks.calls.flat())))
		} finally {
			await transport.close()
		}
		expect(transport.pid).toBeUndefined()
		await waitForReaped(readPeerPid(collectPeerMessages(chunks.calls.flat())))
	})

	it('resolves send as false before the first start and after close resolves', async () => {
		const transport = new StdioTransport(createPeerOptions())
		expect(await transport.send(PING)).toBe(false)
		await transport.start()
		expect(await transport.send(PING)).toBe(true)
		await transport.close()
		expect(await transport.send(PING)).toBe(false)
	})

	it('ends a cooperative child and surfaces its real exit', async () => {
		const chunks = createRecorder<[Uint8Array]>()
		const exits = createRecorder<[LSPExit]>()
		const transport = new StdioTransport(createPeerOptions({ grace: 2_000 }))
		transport.emitter.on('chunk', chunks.handler)
		transport.emitter.on('exit', exits.handler)
		await transport.start()
		await transport.send(ECHO)
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

	it('kills a child that outlives its grace window and leaves no process behind', async () => {
		const chunks = createRecorder<[Uint8Array]>()
		const exits = createRecorder<[LSPExit]>()
		const transport = new StdioTransport(createPeerOptions({ stubborn: true, grace: 200 }))
		transport.emitter.on('chunk', chunks.handler)
		transport.emitter.on('exit', exits.handler)
		await transport.start()
		await transport.send(ECHO)
		await waitForCondition(
			'the echo response',
			() => collectPeerMessages(chunks.calls.flat()).length >= 2,
			PEER,
		)
		const pid = readPeerPid(collectPeerMessages(chunks.calls.flat()))
		const started = performance.now()
		await transport.close()
		expect(performance.now() - started).toBeGreaterThanOrEqual(200)
		await waitForCondition('the child exit event', () => exits.count === 1, PEER)
		expect(exits.calls.flat()).toStrictEqual([KILLED_EXIT])
		await waitForReaped(pid)
	}, 15_000)

	it('emits the exit a child reports when it ends unprompted', async () => {
		const exits = createRecorder<[LSPExit]>()
		const transport = new StdioTransport(createPeerOptions())
		transport.emitter.on('exit', exits.handler)
		await transport.start()
		await transport.send(
			encodeLSPMessage({ jsonrpc: '2.0', method: 'probe/exit', params: { code: 7 } }),
		)
		await waitForCondition('the child exit event', () => exits.count === 1, PEER)
		expect(exits.calls.flat()).toStrictEqual([{ code: 7, signal: null }])
		expect(await transport.send(PING)).toBe(false)
	})

	it('starts a fresh child after close resolves and after an unprompted exit', async () => {
		const chunks = createRecorder<[Uint8Array]>()
		const exits = createRecorder<[LSPExit]>()
		const transport = new StdioTransport(createPeerOptions({ grace: 2_000 }))
		transport.emitter.on('chunk', chunks.handler)
		transport.emitter.on('exit', exits.handler)
		const generations: number[] = []
		// The endings run close, unprompted exit, close: each iteration waits for the exit its own
		// ending produced before the next start, so the third start is the restart that follows a
		// natively ended generation rather than a cooperative close.
		for (const ending of ['close', 'exit', 'close']) {
			chunks.clear()
			await transport.start()
			await transport.send(ECHO)
			await waitForCondition(
				`the echo response before the ${ending} ending`,
				() => collectPeerMessages(chunks.calls.flat()).length >= 2,
				PEER,
			)
			generations.push(readPeerPid(collectPeerMessages(chunks.calls.flat())))
			if (ending === 'close') await transport.close()
			else
				await transport.send(
					encodeLSPMessage({ jsonrpc: '2.0', method: 'probe/exit', params: { code: 0 } }),
				)
			await waitForCondition(
				`the ${ending} exit event`,
				() => exits.count === generations.length,
				PEER,
			)
		}
		expect(generations).toHaveLength(3)
		expect(new Set(generations).size).toBe(generations.length)
		for (const pid of generations) await waitForReaped(pid)
	}, 15_000)

	it('keeps a retired generation off the emitter while a grandchild holds its output', async () => {
		const scratch = createScratch({ prefix: 'lsp-holder-' })
		const release = join(scratch.path, 'release')
		const chunks = createRecorder<[Uint8Array]>()
		const exits = createRecorder<[LSPExit]>()
		const transport = new StdioTransport(createHolderOptions(release, 200))
		transport.emitter.on('chunk', chunks.handler)
		transport.emitter.on('exit', exits.handler)
		await transport.start()
		try {
			await waitForCondition('the holder ready frame', () => chunks.count >= 1, PEER)
			await transport.send(HOLD)
			await waitForCondition(
				'the grandchild report',
				() => readPeerResult(collectPeerMessages(chunks.calls.flat()), 'grandchild') !== undefined,
				PEER,
			)
			const held = readPeerNumber(collectPeerMessages(chunks.calls.flat()), 'grandchild')
			await transport.close()
			expect(exits.count).toBe(1)
			chunks.clear()
			await transport.start()
			await waitForCondition('the replacement ready frame', () => chunks.count >= 1, PEER)
			scratch.write('release', '')
			await waitForReaped(held)
			await transport.send(ECHO)
			await waitForCondition(
				'the replacement echo response',
				() => readPeerResult(collectPeerMessages(chunks.calls.flat()), 'pid') !== undefined,
				PEER,
			)
			expect(readPeerShapes(collectPeerMessages(chunks.calls.flat()))).not.toContain('grandchild')
			expect(exits.count).toBe(1)
		} finally {
			await transport.close()
			await destroyScratch(scratch)
		}
	}, 30_000)

	it('refuses a replacement while a natively exited child still owns its generation', async () => {
		const scratch = createScratch({ prefix: 'lsp-orphan-' })
		const release = join(scratch.path, 'release')
		const chunks = createRecorder<[Uint8Array]>()
		const exits = createRecorder<[LSPExit]>()
		const transport = new StdioTransport(createHolderOptions(release, 200))
		transport.emitter.on('chunk', chunks.handler)
		transport.emitter.on('exit', exits.handler)
		await transport.start()
		try {
			await waitForCondition('the holder ready frame', () => chunks.count >= 1, PEER)
			await transport.send(ORPHAN)
			await waitForCondition(
				'the orphan report',
				() => readPeerResult(collectPeerMessages(chunks.calls.flat()), 'grandchild') !== undefined,
				PEER,
			)
			const held = readPeerNumber(collectPeerMessages(chunks.calls.flat()), 'grandchild')
			// The zombie window: the child has ended natively, its grandchild still holds the pipe
			// that defers `close`, and the transport has therefore retired nothing.
			await waitForCondition(
				'the child to stop accepting bytes',
				async () => {
					return !(await transport.send(PING))
				},
				PEER,
			)
			expect(exits.count).toBe(0)
			const refusal = await transport.start().then(
				() => undefined,
				(error: unknown) => error,
			)
			expect(isLSPError(refusal)).toBe(true)
			expect(isLSPError(refusal) ? refusal.code : undefined).toBe('duplicate')
			scratch.write('release', '')
			await waitForReaped(held)
			await waitForCondition('the child exit event', () => exits.count === 1, PEER)
			chunks.clear()
			await transport.start()
			await waitForCondition('the replacement ready frame', () => chunks.count >= 1, PEER)
			await transport.send(ECHO)
			await waitForCondition(
				'the replacement echo response',
				() => readPeerResult(collectPeerMessages(chunks.calls.flat()), 'pid') !== undefined,
				PEER,
			)
			expect(readPeerShapes(collectPeerMessages(chunks.calls.flat()))).not.toContain('grandchild')
			expect(exits.count).toBe(1)
		} finally {
			await transport.close()
			await destroyScratch(scratch)
		}
	}, 30_000)
})
