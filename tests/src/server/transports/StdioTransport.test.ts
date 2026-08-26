import type { LSPExit } from '@src/core'
import { encodeLSPMessage, isLSPError } from '@src/core'
import { StdioTransport } from '@src/server'
import { createRecorder, waitForCondition } from '@orkestrel/test'
import { createScratch, destroyScratch } from '@orkestrel/test/server'
import {
	collectPeerMessages,
	createPeerOptions,
	readPeerPid,
	readPeerResult,
	readPeerShapes,
	waitForReaped,
} from '../../../setupServer.js'
import { realpathSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

// A spawned interpreter, a round trip through its pipes, and a kill escalation all cost more than
// the wait family's one-second default on a loaded host, so every peer wait carries this budget.
const PEER = { budget: 5_000 }

const PING = encodeLSPMessage({ jsonrpc: '2.0', method: 'probe/ping' })
const ECHO = encodeLSPMessage({ jsonrpc: '2.0', id: 1, method: 'probe/echo', params: {} })

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
			expect(readPeerResult(messages, 'path')).toBeNull()
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
			expect(readPeerResult(messages, 'path')).toBe(process.env.PATH ?? null)
			expect(readPeerResult(messages, 'variable')).toBeNull()
		} finally {
			await transport.close()
		}
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
		expect(exits.calls.flat()).toStrictEqual([{ code: null, signal: 'SIGKILL' }])
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
		for (const ending of ['close', 'exit']) {
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
		const [first, second] = generations
		expect(first).toBeGreaterThan(0)
		expect(second).not.toBe(first)
		for (const pid of generations) await waitForReaped(pid)
	}, 15_000)
})
