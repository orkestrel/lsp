import type { EmitterInterface } from '@orkestrel/emitter'
import type {
	JSONRPCId,
	JSONRPCMessage,
	JSONRPCNotification,
	JSONRPCRequest,
	JSONRPCResponse,
	LSPClientEventMap,
	LSPClientInterface,
	LSPClientLifecycle,
	LSPClientOptions,
	LSPOpenOptions,
	LSPDecodeState,
	LSPDiagnostic,
	LSPDocumentDiagnosticParams,
	LSPDocumentURI,
	LSPExit,
	LSPInitializeParams,
	LSPPending,
	LSPPositionEncoding,
	LSPServerCapabilities,
	LSPTextDocumentItem,
	LSPTransportInterface,
} from './types.js'
import { Emitter } from '@orkestrel/emitter'
import {
	JSONRPC_METHOD_NOT_FOUND,
	LSP_CAPABILITIES,
	LSP_METHODS,
	LSP_TIMEOUT,
} from './constants.js'
import { LSPError, isLSPError } from './errors.js'
import { encodeLSPMessage, waitForDeadline } from './helpers.js'
import { parseLSPMessages } from './parsers.js'
import {
	isJSONRPCNotification,
	isJSONRPCRequest,
	isJSONRPCResponse,
	isLSPDocumentDiagnosticReport,
	isLSPInitializeResult,
	isLSPPublishDiagnosticsParams,
} from './validators.js'

/**
 * Drives a Language Server Protocol peer through an injected byte transport.
 *
 * @remarks
 * The client advertises UTF-16 positions, owns opened document URIs until they are closed, and
 * selects pull or push diagnostics from the server's initialize result. Monotonic identifiers and
 * signal-bound pending entries correlate request outcomes.
 *
 * @example
 * ```ts
 * import type { LSPTransportInterface } from '@orkestrel/lsp'
 * import { join } from 'node:path'
 * import { pathToFileURL } from 'node:url'
 *
 * declare const transport: LSPTransportInterface
 * declare const directory: string
 *
 * const client = new LSPClient({ transport, workspace: pathToFileURL(directory).href })
 * await client.start()
 * const signal = AbortSignal.timeout(30_000)
 * const uri = pathToFileURL(join(directory, 'main.ts')).href
 * const diagnostics = await client.open(
 * 	{
 * 		uri,
 * 		languageId: 'typescript',
 * 		version: 1,
 * 		text: 'const value = 1',
 * 	},
 * 	{ signal },
 * )
 * await client.close(uri)
 * await client.destroy()
 * ```
 */
export class LSPClient implements LSPClientInterface {
	readonly #emitter: Emitter<LSPClientEventMap>
	readonly #transport: LSPTransportInterface
	readonly #workspace: LSPDocumentURI
	readonly #timeout: number
	readonly #signal: AbortSignal | undefined
	readonly #abort: (() => void) | undefined
	readonly #chunk: (chunk: Uint8Array) => void
	readonly #exit: (exit: LSPExit) => void
	readonly #error: (error: unknown) => void
	readonly #pending = new Map<JSONRPCId, LSPPending<unknown> & { readonly method: string }>()
	readonly #publications = new Map<LSPDocumentURI, LSPPending<readonly LSPDiagnostic[]>>()
	readonly #documents = new Set<LSPDocumentURI>()
	readonly #diagnostics = new Map<
		LSPDocumentURI,
		{ readonly resultId: string; readonly diagnostics: readonly LSPDiagnostic[] }
	>()
	#state: LSPDecodeState | undefined = undefined
	#capabilities: LSPServerCapabilities | undefined = undefined
	#nextId = 0
	#generation = 0
	#lifecycle: LSPClientLifecycle = { phase: 'idle' }

	constructor(options: LSPClientOptions) {
		this.#emitter = new Emitter<LSPClientEventMap>({
			...(options.on === undefined ? {} : { on: options.on }),
			...(options.error === undefined ? {} : { error: options.error }),
		})
		this.#transport = options.transport
		this.#workspace = options.workspace
		this.#timeout = options.timeout ?? LSP_TIMEOUT
		this.#signal = options.signal
		this.#abort = options.signal === undefined ? undefined : this.#abortClient.bind(this)
		this.#chunk = this.#receiveChunk.bind(this)
		this.#exit = this.#receiveExit.bind(this)
		this.#error = this.#receiveError.bind(this)
		this.#transport.emitter.on('chunk', this.#chunk)
		this.#transport.emitter.on('exit', this.#exit)
		this.#transport.emitter.on('error', this.#error)
		if (this.#abort !== undefined) {
			this.#signal?.addEventListener('abort', this.#abort, { once: true })
			if (this.#signal?.aborted === true) this.#abortClient()
		}
	}

	get emitter(): EmitterInterface<LSPClientEventMap> {
		return this.#emitter
	}

	get capabilities(): LSPServerCapabilities | undefined {
		return this.#capabilities
	}

	get encoding(): LSPPositionEncoding | undefined {
		// `utf-16` here is the protocol's own default for a server that omitted `positionEncoding`,
		// not this client's advertisement.
		return (
			this.#capabilities?.positionEncoding ??
			(this.#capabilities === undefined ? undefined : 'utf-16')
		)
	}

	start(): Promise<void> {
		if (this.#lifecycle.phase === 'ready') return Promise.resolve()
		if (this.#lifecycle.phase === 'starting') return this.#lifecycle.promise
		if (this.#lifecycle.phase === 'destroying' || this.#lifecycle.phase === 'destroyed')
			return Promise.reject(new LSPError('The LSP client is closed', { code: 'closed' }))
		this.#generation += 1
		const generation = this.#generation
		const starting = Promise.resolve().then(() => this.#begin(generation))
		this.#lifecycle = { phase: 'starting', promise: starting, generation }
		return starting
	}

	async open(
		document: LSPTextDocumentItem,
		options: LSPOpenOptions,
	): Promise<readonly LSPDiagnostic[]> {
		const signal = options.signal
		if (signal.aborted)
			throw new LSPError('The LSP diagnostic wait was aborted', {
				code: 'aborted',
				cause: signal.reason,
			})
		if (this.#lifecycle.phase !== 'ready')
			throw new LSPError('The LSP client is closed', { code: 'closed' })
		if (this.#documents.has(document.uri))
			throw new LSPError('The document URI is already open', {
				code: 'duplicate',
				context: { value: document.uri },
			})
		const synchronization = this.#capabilities?.textDocumentSync
		if (
			synchronization === undefined ||
			synchronization === 0 ||
			(typeof synchronization === 'object' && synchronization.openClose !== true)
		)
			throw new LSPError('The LSP server does not support document open and close', {
				code: 'protocol',
				context: { value: synchronization },
			})

		this.#documents.add(document.uri)
		if (this.#capabilities?.diagnosticProvider !== undefined)
			return this.#openPull(document, signal)
		return this.#openPush(document, signal)
	}

	async close(uri: LSPDocumentURI): Promise<void> {
		if (this.#lifecycle.phase !== 'ready')
			throw new LSPError('The LSP client is closed', { code: 'closed' })
		if (!this.#documents.has(uri))
			throw new LSPError('The document URI is not open', {
				code: 'protocol',
				context: { value: uri },
			})
		await this.#write({
			jsonrpc: '2.0',
			method: LSP_METHODS.close,
			params: { textDocument: { uri } },
		})
		this.#documents.delete(uri)
		this.#settlePublication(
			uri,
			new LSPError('The document was closed before diagnostics arrived', {
				code: 'closed',
				context: { value: uri },
			}),
			true,
		)
	}

	destroy(): Promise<void> {
		if (this.#lifecycle.phase === 'destroying') return this.#lifecycle.promise
		if (this.#lifecycle.phase === 'destroyed') return Promise.resolve()
		const generation = this.#lifecycle.phase === 'ready' ? this.#lifecycle.generation : undefined
		const destruction = Promise.resolve().then(() => this.#teardown())
		this.#lifecycle = {
			phase: 'destroying',
			promise: destruction,
			...(generation === undefined ? {} : { generation }),
		}
		return destruction
	}

	async #begin(generation: number): Promise<void> {
		try {
			await this.#transport.start()
		} catch (cause) {
			if (this.#ownsGeneration(generation)) this.#lifecycle = { phase: 'closed' }
			throw new LSPError('The LSP transport could not start', { code: 'spawn', cause })
		}
		try {
			if (!this.#ownsGeneration(generation))
				throw new LSPError('The LSP transport is closed', { code: 'closed' })
			const params = {
				processId: null,
				rootUri: this.#workspace,
				capabilities: LSP_CAPABILITIES,
			} satisfies LSPInitializeParams
			const result = await this.#request(LSP_METHODS.initialize, params)
			if (!isLSPInitializeResult(result))
				throw new LSPError('The LSP server returned an invalid initialize result', {
					code: 'protocol',
					context: { value: result },
				})
			const encoding = result.capabilities.positionEncoding
			if (encoding !== undefined && !LSP_CAPABILITIES.general.positionEncodings.includes(encoding))
				throw new LSPError('The LSP server selected an unsupported position encoding', {
					code: 'protocol',
					context: { value: encoding },
				})
			if (!this.#ownsGeneration(generation))
				throw new LSPError('The LSP transport is closed', { code: 'closed' })
			await this.#write({ jsonrpc: '2.0', method: LSP_METHODS.initialized, params: {} })
			if (!this.#ownsGeneration(generation))
				throw new LSPError('The LSP transport is closed', { code: 'closed' })
			this.#capabilities = Object.freeze({ ...result.capabilities })
			this.#lifecycle = { phase: 'ready', generation }
		} catch (error) {
			if (this.#ownsGeneration(generation)) {
				await this.#closeTransport()
				if (this.#ownsGeneration(generation)) {
					this.#clearSession()
					this.#lifecycle = { phase: 'closed' }
				}
			}
			throw error
		}
	}

	async #openPull(
		document: LSPTextDocumentItem,
		signal: AbortSignal,
	): Promise<readonly LSPDiagnostic[]> {
		try {
			await this.#write({
				jsonrpc: '2.0',
				method: LSP_METHODS.open,
				params: { textDocument: document },
			})
		} catch (error) {
			this.#documents.delete(document.uri)
			throw error
		}
		if (signal.aborted)
			throw new LSPError('The LSP diagnostic wait was aborted', {
				code: 'aborted',
				cause: signal.reason,
			})
		if (this.#signal?.aborted === true)
			throw new LSPError('The LSP client was aborted', {
				code: 'aborted',
				cause: this.#signal.reason,
			})
		if (this.#capabilities === undefined)
			throw new LSPError('The LSP transport is closed', { code: 'closed' })
		const previous = this.#diagnostics.get(document.uri)
		const params = {
			textDocument: { uri: document.uri },
			...(this.#capabilities?.diagnosticProvider?.identifier === undefined
				? {}
				: { identifier: this.#capabilities.diagnosticProvider.identifier }),
			...(previous === undefined ? {} : { previousResultId: previous.resultId }),
		} satisfies LSPDocumentDiagnosticParams
		const result = await this.#request(LSP_METHODS.diagnostic, params, signal)
		if (!isLSPDocumentDiagnosticReport(result))
			throw new LSPError('The LSP server returned an invalid diagnostic report', {
				code: 'protocol',
				context: { value: result },
			})
		if (result.kind === 'unchanged') {
			if (previous === undefined)
				throw new LSPError('The LSP server returned an unchanged report without prior results', {
					code: 'protocol',
					context: { value: result },
				})
			this.#diagnostics.set(document.uri, {
				resultId: result.resultId,
				diagnostics: previous.diagnostics,
			})
			return previous.diagnostics
		}
		const diagnostics = Object.freeze([...result.items])
		if (result.resultId !== undefined)
			this.#diagnostics.set(document.uri, { resultId: result.resultId, diagnostics })
		else this.#diagnostics.delete(document.uri)
		return diagnostics
	}

	// The publication promise is returned before the open write settles, so the caller adopts it
	// on the same turn it is registered: a drain, an abort, or the write's own failure settles the
	// caller instead of rejecting a promise nothing observes while the write is still in flight.
	#openPush(document: LSPTextDocumentItem, signal: AbortSignal): Promise<readonly LSPDiagnostic[]> {
		const publication = Promise.withResolvers<readonly LSPDiagnostic[]>()
		const abort = this.#abortPublication.bind(this, document.uri, signal)
		this.#publications.set(document.uri, { ...publication, signal, abort })
		signal.addEventListener('abort', abort, { once: true })
		if (signal.aborted) abort()
		void this.#write({
			jsonrpc: '2.0',
			method: LSP_METHODS.open,
			params: { textDocument: document },
		}).catch((error: unknown) => {
			this.#settlePublication(document.uri, error, true)
			this.#documents.delete(document.uri)
		})
		return publication.promise
	}

	#request(
		method: string,
		params?: Readonly<Record<string, unknown>>,
		signal?: AbortSignal,
	): Promise<unknown> {
		this.#nextId += 1
		const id = this.#nextId
		const request: JSONRPCRequest = {
			jsonrpc: '2.0',
			id,
			method,
			...(params === undefined ? {} : { params }),
		}
		return new Promise<unknown>((resolve, reject) => {
			const bound = signal ?? AbortSignal.timeout(this.#timeout)
			const abort =
				signal === undefined
					? this.#timeoutRequest.bind(this, id, method)
					: this.#abortRequest.bind(this, id, method, signal)
			this.#pending.set(id, { resolve, reject, method, signal: bound, abort })
			bound.addEventListener('abort', abort, { once: true })
			if (bound.aborted) abort()
			this.#send(request).then(
				(written) => {
					if (!written)
						this.#settle(
							id,
							new LSPError(`The LSP request '${method}' could not be written`, {
								code: 'closed',
							}),
							true,
						)
				},
				(cause: unknown) => {
					this.#settle(
						id,
						new LSPError(`The LSP request '${method}' could not be written`, {
							code: 'closed',
							cause,
						}),
						true,
					)
				},
			)
		})
	}

	async #write(notification: JSONRPCNotification): Promise<void> {
		const written = await this.#send(notification)
		if (!written)
			throw new LSPError(`The LSP notification '${notification.method}' could not be written`, {
				code: 'closed',
			})
	}

	async #send(message: JSONRPCMessage): Promise<boolean> {
		const method = 'method' in message ? message.method : undefined
		const phase = this.#lifecycle.phase
		const permitted =
			phase === 'ready' ||
			(phase === 'starting' &&
				(method === undefined ||
					method === LSP_METHODS.initialize ||
					method === LSP_METHODS.initialized)) ||
			(phase === 'destroying' && (method === LSP_METHODS.shutdown || method === LSP_METHODS.exit))
		if (!permitted) throw new LSPError('The LSP transport is closed', { code: 'closed' })
		try {
			return await this.#transport.send(encodeLSPMessage(message))
		} catch (cause) {
			throw new LSPError('The LSP message could not be written', { code: 'closed', cause })
		}
	}

	#receiveChunk(chunk: Uint8Array): void {
		try {
			const [messages, state] = parseLSPMessages(chunk, this.#state)
			this.#state = state
			for (const message of messages) this.#receive(message)
		} catch (error) {
			this.#state = undefined
			const messages = isLSPError(error) ? error.context?.messages : undefined
			if (messages !== undefined) {
				for (const message of messages) this.#receive(message)
			}
			this.#emitter.emit(
				'error',
				new LSPError('The LSP transport delivered a malformed frame', {
					code: 'framing',
					...(isLSPError(error) && error.context !== undefined ? { context: error.context } : {}),
					cause: error,
				}),
			)
		}
	}

	#receive(message: JSONRPCMessage): void {
		if (isJSONRPCResponse(message)) {
			this.#receiveResponse(message)
			return
		}
		if (isJSONRPCRequest(message)) {
			this.#respondUnsupported(message)
			return
		}
		if (isJSONRPCNotification(message)) this.#receiveNotification(message)
	}

	#receiveResponse(response: JSONRPCResponse): void {
		const id = response.id
		if (id === null) {
			const error = response.error
			if (error === undefined) return
			this.#emitter.emit(
				'error',
				new LSPError('The LSP server reported an uncorrelated error', {
					code: 'server',
					context: { code: error.code, value: error },
				}),
			)
			return
		}
		const pending = this.#pending.get(id)
		if (pending === undefined) {
			this.#emitter.emit(
				'error',
				new LSPError('The LSP server returned a response with no pending request', {
					code: 'protocol',
					context: { value: response },
				}),
			)
			return
		}
		if ('error' in response) {
			this.#settle(
				id,
				new LSPError(`The LSP server rejected '${pending.method}'`, {
					code: 'server',
					context: { code: response.error.code, value: response.error },
				}),
				true,
			)
			return
		}
		this.#settle(id, response.result, false)
	}

	#receiveNotification(notification: JSONRPCNotification): void {
		if (notification.method !== LSP_METHODS.publish) {
			this.#emitter.emit('notification', notification)
			return
		}
		if (!isLSPPublishDiagnosticsParams(notification.params)) {
			this.#emitter.emit(
				'error',
				new LSPError('The LSP server published invalid diagnostics', {
					code: 'protocol',
					context: { value: notification },
				}),
			)
			return
		}
		const publication = this.#publications.get(notification.params.uri)
		if (publication === undefined) {
			this.#emitter.emit('notification', notification)
			return
		}
		this.#settlePublication(
			notification.params.uri,
			Object.freeze([...notification.params.diagnostics]),
			false,
		)
	}

	#respondUnsupported(request: JSONRPCRequest): void {
		this.#send({
			jsonrpc: '2.0',
			id: request.id,
			error: {
				code: JSONRPC_METHOD_NOT_FOUND,
				message: `Method not found: ${request.method}`,
			},
		}).then(
			(written) => {
				if (!written)
					this.#emitter.emit(
						'error',
						new LSPError('The unsupported request response could not be written', {
							code: 'closed',
						}),
					)
			},
			(error: unknown) => this.#emitter.emit('error', error),
		)
	}

	#timeoutRequest(id: JSONRPCId, method: string): void {
		const timeout = new LSPError(`The LSP request '${method}' exceeded its deadline`, {
			code: 'timeout',
			context: { value: id },
		})
		this.#settle(id, timeout, true)
	}

	#abortRequest(id: JSONRPCId, method: string, signal: AbortSignal): void {
		const aborted = new LSPError(`The LSP request '${method}' was aborted`, {
			code: 'aborted',
			context: { value: id },
			cause: signal.reason,
		})
		if (!this.#settle(id, aborted, true)) return
		if (this.#lifecycle.phase !== 'ready') return
		this.#cancelRequest(id)
	}

	#cancelRequest(id: JSONRPCId): void {
		this.#send({
			jsonrpc: '2.0',
			method: LSP_METHODS.cancel,
			params: { id },
		}).catch((error: unknown) => this.#emitter.emit('error', error))
	}

	#abortPublication(uri: LSPDocumentURI, signal: AbortSignal): void {
		const aborted = new LSPError('The LSP diagnostic wait was aborted', {
			code: 'aborted',
			context: { value: uri },
			cause: signal.reason,
		})
		this.#settlePublication(uri, aborted, true)
	}

	// The lookup, the removal, and the abort-listener detach are identical for both entry maps,
	// so one method owns them. The resolve paths stay apart: a publication owns its own frozen
	// copy of the diagnostics list, and a request resolves the value it received.
	#settleEntry<Key, Value>(
		entries: Map<Key, LSPPending<Value>>,
		key: Key,
	): LSPPending<Value> | undefined {
		const entry = entries.get(key)
		if (entry === undefined) return undefined
		entries.delete(key)
		entry.signal.removeEventListener('abort', entry.abort)
		return entry
	}

	#settlePublication(uri: LSPDocumentURI, value: unknown, failed: boolean): boolean {
		const publication = this.#settleEntry(this.#publications, uri)
		if (publication === undefined) return false
		if (failed) publication.reject(value)
		else if (Array.isArray(value)) publication.resolve(Object.freeze([...value]))
		return true
	}

	#settle(id: JSONRPCId, value: unknown, failed: boolean): boolean {
		const pending = this.#settleEntry(this.#pending, id)
		if (pending === undefined) return false
		if (failed) pending.reject(value)
		else pending.resolve(value)
		return true
	}

	#drain(error: LSPError): void {
		for (const id of [...this.#pending.keys()]) this.#settle(id, error, true)
		for (const uri of [...this.#publications.keys()]) this.#settlePublication(uri, error, true)
	}

	#receiveExit(exit: LSPExit): void {
		const lifecycle = this.#lifecycle
		if (lifecycle.phase === 'destroying')
			this.#lifecycle = { phase: 'destroying', promise: lifecycle.promise }
		else if (lifecycle.phase !== 'destroyed') this.#lifecycle = { phase: 'closed' }
		this.#clearSession()
		this.#drain(
			new LSPError('The LSP transport exited', { code: 'closed', context: { value: exit } }),
		)
		this.#emitter.emit('exit', exit)
	}

	#receiveError(error: unknown): void {
		this.#emitter.emit('error', error)
	}

	#abortClient(): void {
		const reason = this.#signal?.reason
		this.#drain(new LSPError('The LSP client was aborted', { code: 'aborted', cause: reason }))
		this.destroy().catch((error: unknown) => this.#emitter.emit('error', error))
	}

	async #teardown(): Promise<void> {
		try {
			this.#drain(new LSPError('The LSP client is closing', { code: 'closed' }))
			if (this.#capabilities !== undefined) {
				try {
					await this.#request(LSP_METHODS.shutdown)
				} catch {}
			}
			if (this.#lifecycle.phase === 'destroying' && this.#lifecycle.generation !== undefined)
				await this.#boundExit()
			await this.#closeTransport()
		} finally {
			this.#transport.emitter.off('chunk', this.#chunk)
			this.#transport.emitter.off('exit', this.#exit)
			this.#transport.emitter.off('error', this.#error)
			if (this.#abort !== undefined) this.#signal?.removeEventListener('abort', this.#abort)
			this.#clearSession()
			this.#lifecycle = { phase: 'destroyed' }
			this.#emitter.destroy()
		}
	}

	async #boundExit(): Promise<void> {
		await Promise.race([
			this.#write({ jsonrpc: '2.0', method: LSP_METHODS.exit }).catch(() => undefined),
			waitForDeadline(this.#timeout),
		])
	}

	async #closeTransport(): Promise<void> {
		const closing = Promise.resolve().then(() => this.#transport.close())
		const outcome = await Promise.race<unknown>([
			closing.then(
				() => false,
				(error: unknown) => error,
			),
			waitForDeadline(this.#timeout).then(() => true),
		])
		if (outcome === true)
			this.#emitter.emit(
				'error',
				new LSPError('The LSP transport close exceeded its deadline', { code: 'timeout' }),
			)
		else if (outcome !== false) this.#emitter.emit('error', outcome)
	}

	#ownsGeneration(generation: number): boolean {
		return (
			(this.#lifecycle.phase === 'starting' || this.#lifecycle.phase === 'ready') &&
			this.#lifecycle.generation === generation
		)
	}

	#clearSession(): void {
		this.#state = undefined
		this.#capabilities = undefined
		this.#documents.clear()
		this.#diagnostics.clear()
	}
}
