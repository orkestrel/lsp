import type {
	JSONRPCMessage,
	JSONRPCRequest,
	LSPDecodeState,
	LSPExit,
	LSPServerCapabilities,
	LSPTextDocumentSyncKind,
	LSPTransportEventMap,
	LSPTransportInterface,
} from '@src/core'
import {
	encodeLSPMessage,
	isJSONRPCRequest,
	isLSPError,
	JSONRPC_METHOD_NOT_FOUND,
	LSPClient,
	LSPError,
	LSP_METHODS,
	parseLSPMessages,
} from '@src/core'
import { Emitter } from '@orkestrel/emitter'
import { createRecorder, waitForDelay } from '@orkestrel/test'
import { describe, expect, it } from 'vitest'

class LSPFixtureTransport implements LSPTransportInterface {
	readonly #emitter = new Emitter<LSPTransportEventMap>()
	readonly #messages: JSONRPCMessage[] = []
	readonly #operations: string[] = []
	readonly #capabilities: LSPServerCapabilities
	readonly #shutdown: boolean
	readonly #initialize: boolean
	readonly #defer: boolean
	readonly #send:
		| { readonly method: string; readonly fault: 'throw' | 'false' | 'hang' }
		| undefined
	readonly #close: 'throw' | 'reject' | 'delay' | undefined
	readonly #handler:
		| ((peer: LSPFixtureTransport, message: JSONRPCMessage) => Promise<void> | void)
		| undefined
	#state: LSPDecodeState | undefined = undefined
	readonly #releases: Array<() => void> = []
	#starts = 0
	#closes = 0

	constructor(options?: {
		readonly capabilities?: LSPServerCapabilities
		readonly shutdown?: boolean
		readonly initialize?: boolean
		readonly defer?: boolean
		readonly send?: { readonly method: string; readonly fault: 'throw' | 'false' | 'hang' }
		readonly close?: 'throw' | 'reject' | 'delay'
		readonly handler?: (peer: LSPFixtureTransport, message: JSONRPCMessage) => Promise<void> | void
	}) {
		this.#capabilities = options?.capabilities ?? { textDocumentSync: 1 }
		this.#shutdown = options?.shutdown ?? true
		this.#initialize = options?.initialize ?? true
		this.#defer = options?.defer ?? false
		this.#send = options?.send
		this.#close = options?.close
		this.#handler = options?.handler
	}

	get emitter(): Emitter<LSPTransportEventMap> {
		return this.#emitter
	}

	get messages(): readonly JSONRPCMessage[] {
		return [...this.#messages]
	}

	get operations(): readonly string[] {
		return [...this.#operations]
	}

	get starts(): number {
		return this.#starts
	}

	get closes(): number {
		return this.#closes
	}

	async start(): Promise<void> {
		this.#starts += 1
		this.#operations.push('start')
		if (this.#defer) await new Promise<void>((resolve) => this.#releases.push(resolve))
	}

	release(): void {
		for (const release of this.#releases.splice(0)) release()
	}

	send(bytes: Uint8Array): Promise<boolean> {
		const [messages, state] = parseLSPMessages(bytes, this.#state)
		this.#state = state
		for (const message of messages) {
			if (
				this.#send?.fault === 'throw' &&
				this.#send.method === ('method' in message ? message.method : 'response')
			)
				throw new Error('Synchronous send failure')
		}
		return this.#deliver(messages)
	}

	close(): Promise<void> {
		this.#closes += 1
		this.#operations.push('close')
		if (this.#close === 'throw') throw new Error('Synchronous close failure')
		if (this.#close === 'reject') return Promise.reject(new Error('Close failure'))
		if (this.#close === 'delay')
			return waitForDelay(40).then(() => Promise.reject(new Error('Delayed close failure')))
		return Promise.resolve()
	}

	receive(message: JSONRPCMessage): void {
		this.#emitter.emit('chunk', encodeLSPMessage(message))
	}

	receiveBytes(bytes: Uint8Array): void {
		this.#emitter.emit('chunk', bytes)
	}

	exit(exit: LSPExit): void {
		this.#emitter.emit('exit', exit)
	}

	request(method: string): JSONRPCRequest | undefined {
		for (const message of this.#messages) {
			if (isJSONRPCRequest(message) && message.method === method) return message
		}
		return undefined
	}

	assertHandshake(): void {
		const first = this.#messages[0]
		const next = this.#messages[1]
		if (
			first === undefined ||
			!('method' in first) ||
			first.method !== LSP_METHODS.initialize ||
			next === undefined ||
			!('method' in next) ||
			next.method !== LSP_METHODS.initialized ||
			this.#messages.length !== 2
		)
			throw new Error('The fixture observed an invalid initialize ordering')
	}

	async #deliver(messages: readonly JSONRPCMessage[]): Promise<boolean> {
		for (const message of messages) {
			this.#messages.push(message)
			this.#operations.push('method' in message ? message.method : 'response')
			if (this.#send?.method === ('method' in message ? message.method : 'response')) {
				if (this.#send.fault === 'hang') return new Promise<boolean>(() => {})
				return false
			}
			if (
				this.#initialize &&
				isJSONRPCRequest(message) &&
				message.method === LSP_METHODS.initialize
			)
				this.receive({
					jsonrpc: '2.0',
					id: message.id,
					result: { capabilities: this.#capabilities },
				})
			if (isJSONRPCRequest(message) && message.method === LSP_METHODS.shutdown && this.#shutdown)
				this.receive({ jsonrpc: '2.0', id: message.id, result: null })
			await this.#handler?.(this, message)
		}
		return true
	}
}

describe('LSPClient', () => {
	it('performs initialize then initialized with nothing between', async () => {
		const transport = new LSPFixtureTransport()
		const client = new LSPClient({ transport, workspace: 'file:///workspace' })

		await client.start()

		expect(() => transport.assertHandshake()).not.toThrow()
		const initialize = transport.request(LSP_METHODS.initialize)
		expect(initialize?.params).toEqual({
			processId: null,
			rootUri: 'file:///workspace',
			capabilities: {
				general: { positionEncodings: ['utf-16'] },
				textDocument: {
					synchronization: {},
					publishDiagnostics: {},
					diagnostic: {},
				},
			},
		})
		await client.destroy()
	})

	it('shares one handshake across concurrent starts', async () => {
		const transport = new LSPFixtureTransport({ initialize: false })
		const client = new LSPClient({ transport, workspace: 'file:///workspace' })
		const starts = [client.start(), client.start()]
		await waitForDelay()
		const requests = transport.messages.filter(
			(message): message is JSONRPCRequest =>
				isJSONRPCRequest(message) && message.method === LSP_METHODS.initialize,
		)
		for (const request of requests)
			transport.receive({
				jsonrpc: '2.0',
				id: request.id,
				result: { capabilities: { textDocumentSync: 1 } },
			})

		await Promise.all(starts)

		expect(transport.starts).toBe(1)
		expect(requests).toHaveLength(1)
		await client.destroy()
	})

	it('refuses document close outside a ready generation', async () => {
		const transport = new LSPFixtureTransport({ initialize: false })
		const client = new LSPClient({ transport, workspace: 'file:///workspace' })

		await expect(client.close('file:///workspace/main.ts')).rejects.toMatchObject({
			code: 'closed',
		})
		const starting = client.start()
		await waitForDelay()
		await expect(client.close('file:///workspace/main.ts')).rejects.toMatchObject({
			code: 'closed',
		})
		const initialize = transport.request(LSP_METHODS.initialize)
		if (initialize === undefined) throw new Error('Expected an initialize request')
		transport.receive({
			jsonrpc: '2.0',
			id: initialize.id,
			result: { capabilities: { textDocumentSync: 1 } },
		})
		await starting
		await client.destroy()
		await expect(client.close('file:///workspace/main.ts')).rejects.toMatchObject({
			code: 'closed',
		})
	})

	it('does not cancel an initialize request at its deadline', async () => {
		const transport = new LSPFixtureTransport({ initialize: false })
		const client = new LSPClient({ transport, workspace: 'file:///workspace', timeout: 10 })

		await expect(client.start()).rejects.toMatchObject({ code: 'timeout' })

		expect(transport.operations).not.toContain(LSP_METHODS.cancel)
		await client.destroy()
	})

	it('tears down a pending handshake without protocol traffic', async () => {
		const transport = new LSPFixtureTransport({ initialize: false })
		const client = new LSPClient({ transport, workspace: 'file:///workspace', timeout: 10 })
		const starting = client.start()
		await waitForDelay()

		await client.destroy()
		await expect(starting).rejects.toMatchObject({ code: 'closed' })

		expect(transport.operations).not.toContain(LSP_METHODS.cancel)
		expect(transport.operations).not.toContain(LSP_METHODS.exit)
	})

	it('negative control: reports initialized before initialize', async () => {
		const transport = new LSPFixtureTransport()

		await transport.send(
			encodeLSPMessage({ jsonrpc: '2.0', method: LSP_METHODS.initialized, params: {} }),
		)

		expect(() => transport.assertHandshake()).toThrow(
			'The fixture observed an invalid initialize ordering',
		)
	})

	it('defaults the negotiated encoding to utf-16', async () => {
		const transport = new LSPFixtureTransport()
		const client = new LSPClient({ transport, workspace: 'file:///workspace' })
		expect(client.encoding).toBeUndefined()

		await client.start()

		expect(client.encoding).toBe('utf-16')
		await client.destroy()
	})

	it('refuses utf-8 after advertising only utf-16', async () => {
		const transport = new LSPFixtureTransport({
			capabilities: { positionEncoding: 'utf-8', textDocumentSync: 1 },
		})
		const client = new LSPClient({ transport, workspace: 'file:///workspace' })

		await expect(client.start()).rejects.toMatchObject({ code: 'protocol' })
		expect(client.capabilities).toBeUndefined()
		expect(client.encoding).toBeUndefined()
		expect(
			transport.messages.map((message) => ('method' in message ? message.method : 'response')),
		).toEqual([LSP_METHODS.initialize])
		await client.destroy()
	})

	it('refuses open when synchronization is absent', async () => {
		const transport = new LSPFixtureTransport({ capabilities: {} })
		const client = new LSPClient({ transport, workspace: 'file:///workspace' })
		await client.start()

		await expect(
			client.open({
				uri: 'file:///workspace/absent.ts',
				languageId: 'typescript',
				version: 1,
				text: '',
			}),
		).rejects.toMatchObject({ code: 'protocol' })
		await client.destroy()
	})

	it('refuses open when synchronization is zero', async () => {
		const transport = new LSPFixtureTransport({ capabilities: { textDocumentSync: 0 } })
		const client = new LSPClient({ transport, workspace: 'file:///workspace' })
		await client.start()

		await expect(
			client.open({
				uri: 'file:///workspace/zero.ts',
				languageId: 'typescript',
				version: 1,
				text: '',
			}),
		).rejects.toMatchObject({ code: 'protocol' })
		await client.destroy()
	})

	it('accepts numeric synchronization modes', async () => {
		const synchronizations: readonly LSPTextDocumentSyncKind[] = [1, 2]
		for (const synchronization of synchronizations) {
			const uri = `file:///workspace/numeric-${synchronization}.ts`
			const transport = new LSPFixtureTransport({
				capabilities: { textDocumentSync: synchronization },
				handler: (peer, message) => {
					if ('method' in message && message.method === LSP_METHODS.open)
						peer.receive({
							jsonrpc: '2.0',
							method: LSP_METHODS.publish,
							params: { uri, diagnostics: [] },
						})
				},
			})
			const client = new LSPClient({ transport, workspace: 'file:///workspace' })
			await client.start()

			await expect(
				client.open({ uri, languageId: 'typescript', version: 1, text: '' }),
			).resolves.toEqual([])
			await client.destroy()
		}
	})

	it('refuses synchronization options without openClose true', async () => {
		for (const textDocumentSync of [{}, { openClose: false }]) {
			const transport = new LSPFixtureTransport({ capabilities: { textDocumentSync } })
			const client = new LSPClient({ transport, workspace: 'file:///workspace' })
			await client.start()

			await expect(
				client.open({
					uri: 'file:///workspace/options.ts',
					languageId: 'typescript',
					version: 1,
					text: '',
				}),
			).rejects.toMatchObject({ code: 'protocol' })
			await client.destroy()
		}
	})

	it('accepts synchronization options with openClose true', async () => {
		const uri = 'file:///workspace/options-true.ts'
		const transport = new LSPFixtureTransport({
			capabilities: { textDocumentSync: { openClose: true } },
			handler: (peer, message) => {
				if ('method' in message && message.method === LSP_METHODS.open)
					peer.receive({
						jsonrpc: '2.0',
						method: LSP_METHODS.publish,
						params: { uri, diagnostics: [] },
					})
			},
		})
		const client = new LSPClient({ transport, workspace: 'file:///workspace' })
		await client.start()

		await expect(
			client.open({ uri, languageId: 'typescript', version: 1, text: '' }),
		).resolves.toEqual([])
		await client.destroy()
	})

	it('resolves push diagnostics including an empty publication', async () => {
		const uri = 'file:///workspace/push.ts'
		const transport = new LSPFixtureTransport({
			handler: (peer, message) => {
				if ('method' in message && message.method === LSP_METHODS.open)
					peer.receive({
						jsonrpc: '2.0',
						method: LSP_METHODS.publish,
						params: { uri, diagnostics: [] },
					})
			},
		})
		const client = new LSPClient({ transport, workspace: 'file:///workspace' })
		await client.start()

		await expect(
			client.open({ uri, languageId: 'typescript', version: 1, text: '' }),
		).resolves.toEqual([])
		await client.destroy()
	})

	it('bounds a push diagnostic publication deadline', async () => {
		const transport = new LSPFixtureTransport()
		const client = new LSPClient({ transport, workspace: 'file:///workspace', timeout: 10 })
		await client.start()

		await expect(
			client.open({
				uri: 'file:///workspace/silent.ts',
				languageId: 'typescript',
				version: 1,
				text: '',
			}),
		).rejects.toMatchObject({ code: 'timeout' })
		await client.destroy()
	})

	it('resolves a full pull diagnostic report', async () => {
		const transport = new LSPFixtureTransport({
			capabilities: {
				textDocumentSync: 1,
				diagnosticProvider: { interFileDependencies: false, workspaceDiagnostics: false },
			},
			handler: (peer, message) => {
				if ('method' in message && 'id' in message && message.method === LSP_METHODS.diagnostic)
					peer.receive({
						jsonrpc: '2.0',
						id: message.id,
						result: { kind: 'full', resultId: 'result-a', items: [] },
					})
			},
		})
		const client = new LSPClient({ transport, workspace: 'file:///workspace' })
		await client.start()

		await expect(
			client.open({
				uri: 'file:///workspace/pull.ts',
				languageId: 'typescript',
				version: 1,
				text: '',
			}),
		).resolves.toEqual([])
		await client.destroy()
	})

	it('refuses an unchanged pull report without a prior result id', async () => {
		const transport = new LSPFixtureTransport({
			capabilities: {
				textDocumentSync: 1,
				diagnosticProvider: { interFileDependencies: false, workspaceDiagnostics: false },
			},
			handler: (peer, message) => {
				if ('method' in message && 'id' in message && message.method === LSP_METHODS.diagnostic)
					peer.receive({
						jsonrpc: '2.0',
						id: message.id,
						result: { kind: 'unchanged', resultId: 'orphan' },
					})
			},
		})
		const client = new LSPClient({ transport, workspace: 'file:///workspace' })
		await client.start()

		await expect(
			client.open({
				uri: 'file:///workspace/unchanged.ts',
				languageId: 'typescript',
				version: 1,
				text: '',
			}),
		).rejects.toMatchObject({ code: 'protocol' })
		await client.destroy()
	})

	it('clears a prior result id when a full report omits one', async () => {
		const uri = 'file:///workspace/cache.ts'
		let request = 0
		const transport = new LSPFixtureTransport({
			capabilities: {
				textDocumentSync: 1,
				diagnosticProvider: { interFileDependencies: false, workspaceDiagnostics: false },
			},
			handler: (peer, message) => {
				if (!isJSONRPCRequest(message) || message.method !== LSP_METHODS.diagnostic) return
				request += 1
				if (request === 1)
					peer.receive({
						jsonrpc: '2.0',
						id: message.id,
						result: { kind: 'full', resultId: 'result-a', items: [] },
					})
				else if (request === 2)
					peer.receive({ jsonrpc: '2.0', id: message.id, result: { kind: 'full', items: [] } })
				else
					peer.receive({
						jsonrpc: '2.0',
						id: message.id,
						result: { kind: 'unchanged', resultId: 'result-a' },
					})
			},
		})
		const client = new LSPClient({ transport, workspace: 'file:///workspace' })
		await client.start()
		await client.open({ uri, languageId: 'typescript', version: 1, text: '' })
		await client.close(uri)
		await client.open({ uri, languageId: 'typescript', version: 2, text: '' })
		await client.close(uri)

		await expect(
			client.open({ uri, languageId: 'typescript', version: 3, text: '' }),
		).rejects.toMatchObject({ code: 'protocol' })
		await client.destroy()
	})

	it('drops diagnostic result ids across an exited generation', async () => {
		const uri = 'file:///workspace/session.ts'
		const params: unknown[] = []
		const transport = new LSPFixtureTransport({
			capabilities: {
				textDocumentSync: 1,
				diagnosticProvider: { interFileDependencies: false, workspaceDiagnostics: false },
			},
			handler: (peer, message) => {
				if (!isJSONRPCRequest(message) || message.method !== LSP_METHODS.diagnostic) return
				params.push(message.params)
				peer.receive({
					jsonrpc: '2.0',
					id: message.id,
					result: { kind: 'full', resultId: 'session-result', items: [] },
				})
			},
		})
		const client = new LSPClient({ transport, workspace: 'file:///workspace' })
		await client.start()
		await client.open({ uri, languageId: 'typescript', version: 1, text: '' })
		transport.exit({ code: 1, signal: null })
		await client.start()
		await client.open({ uri, languageId: 'typescript', version: 2, text: '' })

		expect(params[1]).not.toMatchObject({ previousResultId: 'session-result' })
		await client.destroy()
	})

	it('restarts the transport after a failed handshake', async () => {
		let initialize = 0
		const transport = new LSPFixtureTransport({
			initialize: false,
			handler: (peer, message) => {
				if (!isJSONRPCRequest(message) || message.method !== LSP_METHODS.initialize) return
				initialize += 1
				peer.receive({
					jsonrpc: '2.0',
					id: message.id,
					result: {
						capabilities: {
							positionEncoding: initialize === 1 ? 'utf-8' : 'utf-16',
							textDocumentSync: 1,
						},
					},
				})
			},
		})
		const client = new LSPClient({ transport, workspace: 'file:///workspace' })

		await expect(client.start()).rejects.toMatchObject({ code: 'protocol' })
		await client.start()

		expect(transport.starts).toBe(2)
		await client.destroy()
	})

	it('emits an unowned URI publication as a notification', async () => {
		const notifications = createRecorder<[JSONRPCMessage]>()
		const transport = new LSPFixtureTransport()
		const client = new LSPClient({
			transport,
			workspace: 'file:///workspace',
			on: { notification: notifications.handler },
		})
		await client.start()

		transport.receive({
			jsonrpc: '2.0',
			method: LSP_METHODS.publish,
			params: { uri: 'file:///workspace/unowned.ts', diagnostics: [] },
		})

		expect(notifications.count).toBe(1)
		expect(notifications.calls[0]?.[0]).toMatchObject({ method: LSP_METHODS.publish })
		await client.destroy()
	})

	it('refuses a duplicate open URI', async () => {
		const uri = 'file:///workspace/duplicate.ts'
		const transport = new LSPFixtureTransport({
			handler: (peer, message) => {
				if ('method' in message && message.method === LSP_METHODS.open)
					peer.receive({
						jsonrpc: '2.0',
						method: LSP_METHODS.publish,
						params: { uri, diagnostics: [] },
					})
			},
		})
		const client = new LSPClient({ transport, workspace: 'file:///workspace' })
		await client.start()
		await client.open({ uri, languageId: 'typescript', version: 1, text: '' })

		await expect(
			client.open({ uri, languageId: 'typescript', version: 1, text: '' }),
		).rejects.toMatchObject({ code: 'duplicate' })
		await client.destroy()
	})

	it('correlates out-of-order diagnostic responses', async () => {
		const requests: JSONRPCRequest[] = []
		const transport = new LSPFixtureTransport({
			capabilities: {
				textDocumentSync: 1,
				diagnosticProvider: { interFileDependencies: false, workspaceDiagnostics: false },
			},
			handler: (peer, message) => {
				if (isJSONRPCRequest(message) && message.method === LSP_METHODS.diagnostic) {
					requests.push(message)
					const first = requests[0]
					const next = requests[1]
					if (first !== undefined && next !== undefined) {
						peer.receive({
							jsonrpc: '2.0',
							id: next.id,
							result: {
								kind: 'full',
								items: [
									{
										range: { start: { line: 2, character: 0 }, end: { line: 2, character: 1 } },
										message: 'next',
									},
								],
							},
						})
						peer.receive({
							jsonrpc: '2.0',
							id: first.id,
							result: {
								kind: 'full',
								items: [
									{
										range: { start: { line: 1, character: 0 }, end: { line: 1, character: 1 } },
										message: 'first',
									},
								],
							},
						})
					}
				}
			},
		})
		const client = new LSPClient({ transport, workspace: 'file:///workspace' })
		await client.start()

		const first = client.open({
			uri: 'file:///workspace/first.ts',
			languageId: 'typescript',
			version: 1,
			text: '',
		})
		const next = client.open({
			uri: 'file:///workspace/next.ts',
			languageId: 'typescript',
			version: 1,
			text: '',
		})

		await expect(Promise.all([first, next])).resolves.toMatchObject([
			[{ message: 'first' }],
			[{ message: 'next' }],
		])
		expect(requests[0]?.id).not.toBe(requests[1]?.id)
		await client.destroy()
	})

	it('emits a protocol error for an unknown response id', async () => {
		const errors = createRecorder<[unknown]>()
		const transport = new LSPFixtureTransport()
		const client = new LSPClient({
			transport,
			workspace: 'file:///workspace',
			on: { error: errors.handler },
		})
		await client.start()

		transport.receive({ jsonrpc: '2.0', id: 999, result: null })

		expect(errors.count).toBe(1)
		expect(errors.calls[0]?.[0]).toMatchObject({ code: 'protocol' })
		await client.destroy()
	})

	it('answers an unsupported inbound server request with method not found', async () => {
		const transport = new LSPFixtureTransport()
		const client = new LSPClient({ transport, workspace: 'file:///workspace' })
		await client.start()

		transport.receive({ jsonrpc: '2.0', id: 'server-a', method: 'workspace/configuration' })
		await waitForDelay()

		expect(transport.messages).toContainEqual({
			jsonrpc: '2.0',
			id: 'server-a',
			error: {
				code: JSONRPC_METHOD_NOT_FOUND,
				message: 'Method not found: workspace/configuration',
			},
		})
		await client.destroy()
	})

	it('answers an unsupported inbound server request during initialization', async () => {
		const transport = new LSPFixtureTransport({ initialize: false })
		const client = new LSPClient({ transport, workspace: 'file:///workspace' })
		const starting = client.start()
		await waitForDelay()
		const initialize = transport.request(LSP_METHODS.initialize)
		if (initialize === undefined) throw new Error('Expected an initialize request')

		transport.receive({ jsonrpc: '2.0', id: 'server-start', method: 'workspace/configuration' })
		await waitForDelay()

		expect(transport.messages).toContainEqual({
			jsonrpc: '2.0',
			id: 'server-start',
			error: {
				code: JSONRPC_METHOD_NOT_FOUND,
				message: 'Method not found: workspace/configuration',
			},
		})
		transport.receive({
			jsonrpc: '2.0',
			id: initialize.id,
			result: { capabilities: { textDocumentSync: 1 } },
		})
		await starting
		await client.destroy()
	})

	it('times out one request and sends its cancel notification', async () => {
		const transport = new LSPFixtureTransport({
			capabilities: {
				textDocumentSync: 1,
				diagnosticProvider: { interFileDependencies: false, workspaceDiagnostics: false },
			},
			handler: (peer, message) => {
				if (
					'method' in message &&
					'id' in message &&
					message.method === LSP_METHODS.diagnostic &&
					message.params?.textDocument !== undefined
				) {
					const textDocument = message.params.textDocument
					if (
						typeof textDocument === 'object' &&
						textDocument !== null &&
						'uri' in textDocument &&
						textDocument.uri === 'file:///workspace/healthy.ts'
					)
						peer.receive({
							jsonrpc: '2.0',
							id: message.id,
							result: { kind: 'full', items: [] },
						})
				}
			},
		})
		const client = new LSPClient({ transport, workspace: 'file:///workspace', timeout: 20 })
		await client.start()
		const stalled = client.open({
			uri: 'file:///workspace/stalled.ts',
			languageId: 'typescript',
			version: 1,
			text: '',
		})
		const healthy = client.open({
			uri: 'file:///workspace/healthy.ts',
			languageId: 'typescript',
			version: 1,
			text: '',
		})

		await expect(healthy).resolves.toEqual([])
		await expect(stalled).rejects.toMatchObject({ code: 'timeout' })
		const diagnostic = transport.request(LSP_METHODS.diagnostic)
		expect(transport.messages).toContainEqual({
			jsonrpc: '2.0',
			method: LSP_METHODS.cancel,
			params: { id: diagnostic?.id },
		})
		await client.destroy()
	})

	it('aborts every pending request and begins destruction', async () => {
		const controller = new AbortController()
		const transport = new LSPFixtureTransport({
			capabilities: {
				textDocumentSync: 1,
				diagnosticProvider: { interFileDependencies: false, workspaceDiagnostics: false },
			},
		})
		const client = new LSPClient({
			transport,
			workspace: 'file:///workspace',
			timeout: 20,
			signal: controller.signal,
		})
		await client.start()
		const first = client.open({
			uri: 'file:///workspace/abort-a.ts',
			languageId: 'typescript',
			version: 1,
			text: '',
		})
		const next = client.open({
			uri: 'file:///workspace/abort-b.ts',
			languageId: 'typescript',
			version: 1,
			text: '',
		})

		controller.abort('stop')

		await expect(first).rejects.toMatchObject({ code: 'aborted' })
		await expect(next).rejects.toMatchObject({ code: 'aborted' })
		await waitForDelay(50)
		expect(transport.closes).toBe(1)
	})

	it('rejects pending work as closed and re-emits transport exit', async () => {
		const exits = createRecorder<[LSPExit]>()
		const transport = new LSPFixtureTransport({
			capabilities: {
				textDocumentSync: 1,
				diagnosticProvider: { interFileDependencies: false, workspaceDiagnostics: false },
			},
		})
		const client = new LSPClient({
			transport,
			workspace: 'file:///workspace',
			on: { exit: exits.handler },
		})
		await client.start()
		const pending = client.open({
			uri: 'file:///workspace/exit.ts',
			languageId: 'typescript',
			version: 1,
			text: '',
		})
		const exit = { code: 1, signal: null }

		transport.exit(exit)

		await expect(pending).rejects.toMatchObject({ code: 'closed' })
		expect(exits.calls).toEqual([[exit]])
		await client.destroy()
	})

	it('drains decoded notifications before surfacing a framing fault', async () => {
		const events: string[] = []
		const transport = new LSPFixtureTransport()
		const client = new LSPClient({
			transport,
			workspace: 'file:///workspace',
			on: {
				notification: () => events.push('notification'),
				error: (error) => events.push(isLSPError(error) ? error.code : 'unknown'),
			},
		})
		await client.start()
		const notification = encodeLSPMessage({ jsonrpc: '2.0', method: 'window/logMessage' })
		const malformed = new TextEncoder().encode('Content-Length: x\r\n\r\n')
		const chunk = new Uint8Array(notification.byteLength + malformed.byteLength)
		chunk.set(notification)
		chunk.set(malformed, notification.byteLength)

		transport.receiveBytes(chunk)

		expect(events).toEqual(['notification', 'framing'])
		await client.destroy()
	})

	it('preserves a JSON-RPC error response in a server error context', async () => {
		const wire = { code: -32_001, message: 'Server failed', data: { reason: 'fixture' } }
		const transport = new LSPFixtureTransport({
			capabilities: {
				textDocumentSync: 1,
				diagnosticProvider: { interFileDependencies: false, workspaceDiagnostics: false },
			},
			handler: (peer, message) => {
				if ('method' in message && 'id' in message && message.method === LSP_METHODS.diagnostic)
					peer.receive({ jsonrpc: '2.0', id: message.id, error: wire })
			},
		})
		const client = new LSPClient({ transport, workspace: 'file:///workspace' })
		await client.start()

		const result = client.open({
			uri: 'file:///workspace/server-error.ts',
			languageId: 'typescript',
			version: 1,
			text: '',
		})
		await expect(result).rejects.toMatchObject({
			code: 'server',
			context: { code: wire.code, value: wire },
		})
		await client.destroy()
	})

	it('surfaces a null-id error response with its server code', async () => {
		const errors = createRecorder<[unknown]>()
		const transport = new LSPFixtureTransport()
		const client = new LSPClient({
			transport,
			workspace: 'file:///workspace',
			on: { error: errors.handler },
		})
		await client.start()

		transport.receive({
			jsonrpc: '2.0',
			id: null,
			error: { code: -32_700, message: 'Parse error' },
		})

		expect(errors.calls[0]?.[0]).toMatchObject({ code: 'server', context: { code: -32_700 } })
		await client.destroy()
	})

	it('settles a synchronous request send throw as closed', async () => {
		const transport = new LSPFixtureTransport({
			capabilities: {
				textDocumentSync: 1,
				diagnosticProvider: { interFileDependencies: false, workspaceDiagnostics: false },
			},
			send: { method: LSP_METHODS.diagnostic, fault: 'throw' },
		})
		const client = new LSPClient({ transport, workspace: 'file:///workspace', timeout: 10 })
		await client.start()

		await expect(
			client.open({
				uri: 'file:///workspace/throw.ts',
				languageId: 'typescript',
				version: 1,
				text: '',
			}),
		).rejects.toMatchObject({ code: 'closed' })
		await waitForDelay(20)
		expect(transport.messages).not.toContainEqual({
			jsonrpc: '2.0',
			method: LSP_METHODS.cancel,
			params: expect.anything(),
		})
		await client.destroy()
	})

	it('settles a refused mid-session send as closed', async () => {
		const transport = new LSPFixtureTransport({
			capabilities: {
				textDocumentSync: 1,
				diagnosticProvider: { interFileDependencies: false, workspaceDiagnostics: false },
			},
			send: { method: LSP_METHODS.diagnostic, fault: 'false' },
		})
		const client = new LSPClient({ transport, workspace: 'file:///workspace' })
		await client.start()

		await expect(
			client.open({
				uri: 'file:///workspace/refused.ts',
				languageId: 'typescript',
				version: 1,
				text: '',
			}),
		).rejects.toMatchObject({ code: 'closed' })
		await client.destroy()
	})

	it('sends close before releasing a document URI', async () => {
		const uri = 'file:///workspace/close.ts'
		const transport = new LSPFixtureTransport({
			handler: (peer, message) => {
				if ('method' in message && message.method === LSP_METHODS.open)
					peer.receive({
						jsonrpc: '2.0',
						method: LSP_METHODS.publish,
						params: { uri, diagnostics: [] },
					})
			},
		})
		const client = new LSPClient({ transport, workspace: 'file:///workspace' })
		await client.start()
		await client.open({ uri, languageId: 'typescript', version: 1, text: '' })

		await client.close(uri)
		await expect(
			client.open({ uri, languageId: 'typescript', version: 2, text: '' }),
		).resolves.toEqual([])
		expect(transport.messages).toContainEqual({
			jsonrpc: '2.0',
			method: LSP_METHODS.close,
			params: { textDocument: { uri } },
		})
		await client.destroy()
	})

	it('settles a publication that races document close', async () => {
		const uri = 'file:///workspace/race.ts'
		const transport = new LSPFixtureTransport({
			handler: (peer, message) => {
				if ('method' in message && message.method === LSP_METHODS.close)
					peer.receive({
						jsonrpc: '2.0',
						method: LSP_METHODS.publish,
						params: { uri, diagnostics: [] },
					})
			},
		})
		const client = new LSPClient({ transport, workspace: 'file:///workspace' })
		await client.start()
		const publication = client.open({ uri, languageId: 'typescript', version: 1, text: '' })

		await client.close(uri)

		await expect(publication).resolves.toEqual([])
		await client.destroy()
	})

	it('destroys in shutdown exit close order', async () => {
		const transport = new LSPFixtureTransport()
		const client = new LSPClient({ transport, workspace: 'file:///workspace' })
		await client.start()

		await client.destroy()

		expect(transport.operations.slice(-3)).toEqual([
			LSP_METHODS.shutdown,
			LSP_METHODS.exit,
			'close',
		])
	})

	it('closes after the bounded shutdown fallback', async () => {
		const transport = new LSPFixtureTransport({ shutdown: false })
		const client = new LSPClient({ transport, workspace: 'file:///workspace', timeout: 20 })
		await client.start()

		await client.destroy()

		expect(transport.operations).not.toContain(LSP_METHODS.cancel)
		expect(transport.operations.slice(-2)).toEqual([LSP_METHODS.exit, 'close'])
	})

	it('completes destruction after a synchronous transport close throw', async () => {
		const errors = createRecorder<[unknown]>()
		const transport = new LSPFixtureTransport({ close: 'throw' })
		const client = new LSPClient({
			transport,
			workspace: 'file:///workspace',
			on: { error: errors.handler },
		})
		await client.start()

		await expect(client.destroy()).resolves.toBeUndefined()

		expect(client.emitter.destroyed).toBe(true)
		expect(errors.count).toBe(1)
	})

	it('surfaces a transport close rejection before destroying the emitter', async () => {
		const destroyed: boolean[] = []
		const codes: Array<string | undefined> = []
		const transport = new LSPFixtureTransport({ close: 'reject' })
		let client: LSPClient | undefined = undefined
		client = new LSPClient({
			transport,
			workspace: 'file:///workspace',
			on: {
				error: (error) => {
					codes.push(isLSPError(error) ? error.code : undefined)
					destroyed.push(client?.emitter.destroyed ?? true)
				},
			},
		})
		await client.start()

		await client.destroy()

		expect(destroyed).toEqual([false])
		expect(codes).toEqual([undefined])
		expect(client.emitter.destroyed).toBe(true)
	})

	it('emits a close deadline error before destroying the emitter', async () => {
		const destroyed: boolean[] = []
		const codes: Array<string | undefined> = []
		const transport = new LSPFixtureTransport({ close: 'delay' })
		let client: LSPClient | undefined = undefined
		client = new LSPClient({
			transport,
			workspace: 'file:///workspace',
			timeout: 10,
			on: {
				error: (error) => {
					codes.push(isLSPError(error) ? error.code : undefined)
					destroyed.push(client?.emitter.destroyed ?? true)
				},
			},
		})
		await client.start()

		await client.destroy()
		await waitForDelay(50)

		expect(destroyed).toEqual([false])
		expect(codes).toEqual(['timeout'])
		expect(client.emitter.destroyed).toBe(true)
	})

	it('bounds an exit write that never settles', async () => {
		const transport = new LSPFixtureTransport({
			send: { method: LSP_METHODS.exit, fault: 'hang' },
		})
		const client = new LSPClient({ transport, workspace: 'file:///workspace', timeout: 10 })
		await client.start()

		await expect(client.destroy()).resolves.toBeUndefined()
		expect(client.emitter.destroyed).toBe(true)
	})

	it('does not write exit after the transport generation exits', async () => {
		const transport = new LSPFixtureTransport()
		const client = new LSPClient({ transport, workspace: 'file:///workspace' })
		await client.start()
		transport.exit({ code: 1, signal: null })

		await client.destroy()

		expect(
			transport.messages.filter(
				(message) => 'method' in message && message.method === LSP_METHODS.exit,
			),
		).toEqual([])
	})

	it('makes destroy idempotent', async () => {
		const transport = new LSPFixtureTransport()
		const client = new LSPClient({ transport, workspace: 'file:///workspace' })
		await client.start()

		await Promise.all([client.destroy(), client.destroy(), client.destroy()])
		await client.destroy()

		expect(transport.closes).toBe(1)
		expect(
			transport.messages.filter(
				(message) => 'method' in message && message.method === LSP_METHODS.shutdown,
			),
		).toHaveLength(1)
	})

	it('starts again after a transport exit', async () => {
		const transport = new LSPFixtureTransport()
		const client = new LSPClient({ transport, workspace: 'file:///workspace' })
		await client.start()
		transport.exit({ code: 1, signal: null })

		await client.start()

		expect(transport.starts).toBe(2)
		await client.destroy()
	})

	it('completes a restart issued from the exit handler as a second generation', async () => {
		const transport = new LSPFixtureTransport({ initialize: false })
		let restart: Promise<void> | undefined
		const client = new LSPClient({
			transport,
			workspace: 'file:///workspace',
			on: {
				exit: () => {
					restart = client.start()
					restart.catch(() => {})
				},
			},
		})
		const first = client.start()
		await waitForDelay()

		transport.exit({ code: 1, signal: null })

		await expect(first).rejects.toMatchObject({ code: 'closed' })
		await waitForDelay()
		const initialize = transport.messages.filter(
			(message): message is JSONRPCRequest =>
				isJSONRPCRequest(message) && message.method === LSP_METHODS.initialize,
		)[1]
		if (initialize === undefined) throw new Error('Expected a restarted initialize request')
		transport.receive({
			jsonrpc: '2.0',
			id: initialize.id,
			result: { capabilities: { textDocumentSync: 1 } },
		})

		await expect(restart).resolves.toBeUndefined()
		expect(transport.starts).toBe(2)
		expect(transport.messages.at(-1)).toMatchObject({ method: LSP_METHODS.initialized })
		await client.destroy()
	})

	it('does not initialize a superseded transport generation', async () => {
		const transport = new LSPFixtureTransport({ defer: true })
		let restart: Promise<void> | undefined
		const client = new LSPClient({
			transport,
			workspace: 'file:///workspace',
			on: {
				exit: () => {
					restart = client.start()
					restart.catch(() => {})
				},
			},
		})
		const first = client.start()
		first.catch(() => {})
		await waitForDelay()

		transport.exit({ code: 1, signal: null })
		await waitForDelay()
		expect(transport.starts).toBe(2)
		transport.release()

		await expect(first).rejects.toMatchObject({ code: 'closed' })
		await expect(restart).resolves.toBeUndefined()
		expect(
			transport.messages.filter(
				(message) => isJSONRPCRequest(message) && message.method === LSP_METHODS.initialize,
			),
		).toHaveLength(1)
		await client.destroy()
	})

	it('rejects a start superseded by an abort as closed', async () => {
		const controller = new AbortController()
		const transport = new LSPFixtureTransport({ defer: true })
		const client = new LSPClient({
			transport,
			workspace: 'file:///workspace',
			signal: controller.signal,
		})
		const first = client.start()
		first.catch(() => {})
		await waitForDelay()

		controller.abort('stop')
		transport.release()

		await expect(first).rejects.toMatchObject({ code: 'closed' })
		expect(
			transport.messages.filter(
				(message) => isJSONRPCRequest(message) && message.method === LSP_METHODS.initialize,
			),
		).toHaveLength(0)
	})

	it('detaches a drained publication deadline before the next generation', async () => {
		const transport = new LSPFixtureTransport()
		const client = new LSPClient({
			transport,
			workspace: 'file:///workspace',
			timeout: 400,
		})
		await client.start()
		const uri = 'file:///workspace/generation.ts'
		const first = client.open({ uri, languageId: 'typescript', version: 1, text: '' })
		first.catch(() => {})
		await waitForDelay(10)

		transport.exit({ code: 1, signal: null })

		await expect(first).rejects.toMatchObject({ code: 'closed' })
		await waitForDelay(150)
		await client.start()
		const next = client.open({ uri, languageId: 'typescript', version: 2, text: '' })
		next.catch(() => {})
		await waitForDelay(310)
		transport.receive({
			jsonrpc: '2.0',
			method: LSP_METHODS.publish,
			params: { uri, diagnostics: [] },
		})

		await expect(next).resolves.toEqual([])
		await client.destroy()
	})

	it('brands emitted and rejected failures as LSP errors', async () => {
		const transport = new LSPFixtureTransport({ capabilities: {} })
		const client = new LSPClient({ transport, workspace: 'file:///workspace' })
		await client.start()
		let caught: unknown

		try {
			await client.open({
				uri: 'file:///workspace/error.ts',
				languageId: 'typescript',
				version: 1,
				text: '',
			})
		} catch (error) {
			caught = error
		}
		expect(isLSPError(caught)).toBe(true)
		expect(caught).toBeInstanceOf(LSPError)
		await client.destroy()
	})
})
