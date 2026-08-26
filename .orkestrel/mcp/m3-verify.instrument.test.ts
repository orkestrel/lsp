import { describe, expect, it } from 'vitest'
import { createTool, createToolManager } from '@orkestrel/tool'
import {
	createMCPClient,
	createMCPServer,
	MCP_META_SUBSCRIPTION,
} from '@src/core'
import type { JSONRPCNotification, MCPListenOptions } from '@src/core'
import { createLoopbackTransport, createSubscriptionServer } from '../../tests/setup.js'

// Orchestrator verification probes for the M3 analyst verdict's broken claims.

describe('m3 verification probes', () => {
	it('claim 1 — an accessor signal aborted between reads still opens the subscription', async () => {
		const source = new TransformStream<JSONRPCNotification, JSONRPCNotification>()
		const transport = createLoopbackTransport(createSubscriptionServer(() => source.readable))
		const client = createMCPClient({ transport })
		await client.connect()
		const controller = new AbortController()
		let reads = 0
		const options: MCPListenOptions = {
			get signal() {
				reads += 1
				if (reads === 2) controller.abort()
				return controller.signal
			},
		}
		const stream = client.listen({ toolsListChanged: true }, options)
		const opened = await stream.next()
		const methods = transport.messages.map((message) => message.method)
		expect({
			reads,
			aborted: controller.signal.aborted,
			done: opened.done,
			method: opened.done === false ? opened.value.method : undefined,
			methods,
		}).toEqual({
			reads: 4,
			aborted: true,
			done: false,
			method: 'notifications/subscriptions/acknowledged',
			methods: ['server/discover', 'subscriptions/listen'],
		})
	})

	it('claim 1 control — a plain pre-aborted signal refuses the first read unsent', async () => {
		const source = new TransformStream<JSONRPCNotification, JSONRPCNotification>()
		const transport = createLoopbackTransport(createSubscriptionServer(() => source.readable))
		const client = createMCPClient({ transport })
		await client.connect()
		const controller = new AbortController()
		controller.abort()
		const stream = client.listen({ toolsListChanged: true }, { signal: controller.signal })
		const [read] = await Promise.allSettled([stream.next()])
		expect(read.status).toBe('rejected')
		expect(transport.messages.map((message) => message.method)).toEqual(['server/discover'])
	})

	it('claim 4 — a stale-stamped progress frame for an active call never reaches its handler', async () => {
		const release = Promise.withResolvers<void>()
		const tools = createToolManager()
		tools.add(createTool({ name: 'slow', execute: async () => {
			await release.promise
			return 'done'
		} }))
		const mcp = createMCPServer({ identity: { name: 'progress-server', version: '1.0.0' }, tools })
		const transport = createLoopbackTransport(mcp)
		const client = createMCPClient({ transport })
		await client.connect()
		const reports: unknown[] = []
		const surfaced: string[] = []
		client.emitter.on('notification', (message) => {
			if ('method' in message) surfaced.push(message.method)
		})
		const call = client.call('slow', {}, { progress: (report) => void reports.push(report) })
		await Promise.resolve()
		const invocation = transport.messages.find((message) => message.method === 'tools/call')
		const callId = invocation !== undefined && 'id' in invocation ? invocation.id : undefined
		expect(callId).toBe(2)
		transport.receive({
			jsonrpc: '2.0',
			method: 'notifications/progress',
			params: {
				progressToken: 2,
				progress: 1,
				_meta: { [MCP_META_SUBSCRIPTION]: 999 },
			},
		})
		release.resolve()
		await call
		expect({ progress: reports.length, notifications: surfaced.length }).toEqual({
			progress: 0,
			notifications: 0,
		})
	})

	it('claim 4 control — the same progress frame without the stale stamp reaches the handler', async () => {
		const release = Promise.withResolvers<void>()
		const tools = createToolManager()
		tools.add(createTool({ name: 'slow', execute: async () => {
			await release.promise
			return 'done'
		} }))
		const mcp = createMCPServer({ identity: { name: 'progress-server', version: '1.0.0' }, tools })
		const transport = createLoopbackTransport(mcp)
		const client = createMCPClient({ transport })
		await client.connect()
		const reports: unknown[] = []
		const call = client.call('slow', {}, { progress: (report) => void reports.push(report) })
		await Promise.resolve()
		transport.receive({
			jsonrpc: '2.0',
			method: 'notifications/progress',
			params: { progressToken: 2, progress: 1 },
		})
		release.resolve()
		await call
		expect(reports.length).toBe(1)
	})
})
