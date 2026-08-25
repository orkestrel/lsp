import type { EmitterInterface } from '@orkestrel/emitter'
import type {
	JSONRPCId,
	JSONRPCMessage,
	JSONRPCNotification,
	JSONRPCRequest,
	JSONRPCResponse,
	LSPClientEventMap,
	LSPClientInterface,
	LSPClientOptions,
	LSPDecodeState,
	LSPDiagnostic,
	LSPDocumentURI,
	LSPExit,
	LSPPositionEncoding,
	LSPServerCapabilities,
	LSPTextDocumentItem,
	LSPTransportInterface,
} from './types.js'
import { Emitter } from '@orkestrel/emitter'
import { JSONRPC_METHOD_NOT_FOUND, LSP_METHODS } from './constants.js'
import { LSPError, isLSPError } from './errors.js'
import { encodeLSPMessage } from './helpers.js'
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
 * deadline-bound pending entries correlate request outcomes.
 *
 * @example
 * ```ts
 * const client = new LSPClient({ transport, workspace: 'file:///workspace' })
 * await client.start()
 * const diagnostics = await client.open({
 * 	uri: 'file:///workspace/main.ts',
 * 	languageId: 'typescript',
 * 	version: 1,
 * 	text: 'const value = 1',
 * })
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
	readonly #pending = new Map<
		JSONRPCId,
		{
			readonly resolve: (value: unknown) => void
			readonly reject: (reason?: unknown) => void
			readonly method: string
			readonly deadline: AbortSignal
			readonly timeout: () => void
		}
	>()
	readonly #publications = new Map<
		LSPDocumentURI,
		{
			readonly resolve: (diagnostics: readonly LSPDiagnostic[]) => void
			readonly reject: (reason?: unknown) => void
		}
	>()
	readonly #documents = new Set<LSPDocumentURI>()
	readonly #diagnostics = new Map<
		LSPDocumentURI,
		{ readonly resultId: string; readonly diagnostics: readonly LSPDiagnostic[] }
	>()
	#state: LSPDecodeState | undefined = undefined
	#capabilities: LSPServerCapabilities | undefined = undefined
	#nextId = 0
	#destroying: Promise<void> | undefined = undefined
	#destroyed = false

	constructor(options: LSPClientOptions) {
		this.#emitter = new Emitter<LSPClientEventMap>({
			...(options.on === undefined ? {} : { on: options.on }),
			...(options.error === undefined ? {} : { error: options.error }),
		})
		this.#transport = options.transport
		this.#workspace = options.workspace
		this.#timeout = options.timeout ?? 30_000
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
		return (
			this.#capabilities?.positionEncoding ??
			(this.#capabilities === undefined ? undefined : 'utf-16')
		)
	}

	async start(): Promise<void> {
		if (this.#destroyed || this.#destroying !== undefined)
			throw new LSPError('The LSP client is closed', { code: 'closed' })
		if (this.#capabilities !== undefined) return
		try {
			await this.#transport.start()
		} catch (cause) {
			throw new LSPError('The LSP transport could not start', { code: 'spawn', cause })
		}
		if (this.#signal?.aborted === true)
			throw new LSPError('The LSP client was aborted', {
				code: 'aborted',
				cause: this.#signal.reason,
			})
		const result = await this.#request(LSP_METHODS.initialize, {
			processId: null,
			rootUri: this.#workspace,
			capabilities: {
				general: { positionEncodings: ['utf-16'] },
				textDocument: {
					synchronization: {},
					publishDiagnostics: {},
					diagnostic: {},
				},
			},
		})
		if (!isLSPInitializeResult(result))
			throw new LSPError('The LSP server returned an invalid initialize result', {
				code: 'protocol',
				context: { value: result },
			})
		const encoding = result.capabilities.positionEncoding
		if (encoding !== undefined && encoding !== 'utf-16')
			throw new LSPError('The LSP server selected an unsupported position encoding', {
				code: 'protocol',
				context: { value: encoding },
			})
		await this.#write({ jsonrpc: '2.0', method: LSP_METHODS.initialized, params: {} })
		this.#capabilities = Object.freeze({ ...result.capabilities })
	}

	async open(document: LSPTextDocumentItem): Promise<readonly LSPDiagnostic[]> {
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
		if (this.#capabilities?.diagnosticProvider !== undefined) return this.#openPull(document)
		return this.#openPush(document)
	}

	async close(uri: LSPDocumentURI): Promise<void> {
		await this.#write({
			jsonrpc: '2.0',
			method: LSP_METHODS.close,
			params: { textDocument: { uri } },
		})
		this.#documents.delete(uri)
		const publication = this.#publications.get(uri)
		if (publication !== undefined) {
			this.#publications.delete(uri)
			publication.reject(
				new LSPError('The document was closed before diagnostics arrived', {
					code: 'closed',
					context: { value: uri },
				}),
			)
		}
	}

	destroy(): Promise<void> {
		const destroying = this.#destroying
		if (destroying !== undefined) return destroying
		if (this.#destroyed) return Promise.resolve()
		const destruction = Promise.resolve().then(() => this.#teardown())
		this.#destroying = destruction
		return destruction
	}

	async #openPull(document: LSPTextDocumentItem): Promise<readonly LSPDiagnostic[]> {
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
		if (this.#signal?.aborted === true)
			throw new LSPError('The LSP client was aborted', {
				code: 'aborted',
				cause: this.#signal.reason,
			})
		if (this.#capabilities === undefined)
			throw new LSPError('The LSP transport is closed', { code: 'closed' })
		const previous = this.#diagnostics.get(document.uri)
		const result = await this.#request(LSP_METHODS.diagnostic, {
			textDocument: { uri: document.uri },
			...(this.#capabilities?.diagnosticProvider?.identifier === undefined
				? {}
				: { identifier: this.#capabilities.diagnosticProvider.identifier }),
			...(previous === undefined ? {} : { previousResultId: previous.resultId }),
		})
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
		return diagnostics
	}

	async #openPush(document: LSPTextDocumentItem): Promise<readonly LSPDiagnostic[]> {
		const publication = Promise.withResolvers<readonly LSPDiagnostic[]>()
		this.#publications.set(document.uri, publication)
		try {
			await this.#write({
				jsonrpc: '2.0',
				method: LSP_METHODS.open,
				params: { textDocument: document },
			})
		} catch (error) {
			this.#publications.delete(document.uri)
			this.#documents.delete(document.uri)
			publication.reject(error)
		}
		return publication.promise
	}

	#request(method: string, params?: Readonly<Record<string, unknown>>): Promise<unknown> {
		this.#nextId += 1
		const id = this.#nextId
		const request: JSONRPCRequest = {
			jsonrpc: '2.0',
			id,
			method,
			...(params === undefined ? {} : { params }),
		}
		return new Promise<unknown>((resolve, reject) => {
			const deadline = AbortSignal.timeout(this.#timeout)
			const timeout = this.#timeoutRequest.bind(this, id, method)
			deadline.addEventListener('abort', timeout, { once: true })
			this.#pending.set(id, { resolve, reject, method, deadline, timeout })
			this.#transport.send(encodeLSPMessage(request)).then(
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
		let written: boolean
		try {
			written = await this.#transport.send(encodeLSPMessage(notification))
		} catch (cause) {
			throw new LSPError(`The LSP notification '${notification.method}' could not be written`, {
				code: 'closed',
				cause,
			})
		}
		if (!written)
			throw new LSPError(`The LSP notification '${notification.method}' could not be written`, {
				code: 'closed',
			})
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
		const pending = id === null ? undefined : this.#pending.get(id)
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
			if (id === null) return
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
		if (id === null) return
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
		this.#publications.delete(notification.params.uri)
		publication.resolve(Object.freeze([...notification.params.diagnostics]))
	}

	#respondUnsupported(request: JSONRPCRequest): void {
		this.#transport
			.send(
				encodeLSPMessage({
					jsonrpc: '2.0',
					id: request.id,
					error: {
						code: JSONRPC_METHOD_NOT_FOUND,
						message: `Method not found: ${request.method}`,
					},
				}),
			)
			.then(
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
		if (!this.#settle(id, timeout, true)) return
		this.#transport
			.send(
				encodeLSPMessage({
					jsonrpc: '2.0',
					method: LSP_METHODS.cancel,
					params: { id },
				}),
			)
			.catch((error: unknown) => this.#emitter.emit('error', error))
	}

	#settle(id: JSONRPCId, value: unknown, failed: boolean): boolean {
		const pending = this.#pending.get(id)
		if (pending === undefined) return false
		this.#pending.delete(id)
		pending.deadline.removeEventListener('abort', pending.timeout)
		if (failed) pending.reject(value)
		else pending.resolve(value)
		return true
	}

	#drain(error: LSPError): void {
		for (const id of [...this.#pending.keys()]) this.#settle(id, error, true)
		for (const publication of this.#publications.values()) publication.reject(error)
		this.#publications.clear()
	}

	#receiveExit(exit: LSPExit): void {
		this.#state = undefined
		this.#capabilities = undefined
		this.#documents.clear()
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
		this.#drain(new LSPError('The LSP client is closing', { code: 'closed' }))
		if (this.#capabilities !== undefined) {
			try {
				await this.#request(LSP_METHODS.shutdown)
			} catch {}
		}
		try {
			await this.#write({ jsonrpc: '2.0', method: LSP_METHODS.exit })
		} catch {}
		const closing = this.#transport.close()
		const deadline = AbortSignal.timeout(this.#timeout)
		await Promise.race([
			closing.catch((error: unknown) => this.#emitter.emit('error', error)),
			new Promise<void>((resolve) =>
				deadline.addEventListener('abort', () => resolve(), { once: true }),
			),
		])
		this.#transport.emitter.off('chunk', this.#chunk)
		this.#transport.emitter.off('exit', this.#exit)
		this.#transport.emitter.off('error', this.#error)
		if (this.#abort !== undefined) this.#signal?.removeEventListener('abort', this.#abort)
		this.#state = undefined
		this.#capabilities = undefined
		this.#documents.clear()
		this.#destroyed = true
		this.#emitter.destroy()
	}
}
