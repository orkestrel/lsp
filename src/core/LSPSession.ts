import type {
	JSONRPCMessage,
	LSPDecodeState,
	LSPDiagnostic,
	LSPDocumentURI,
	LSPServerCapabilities,
} from './types.js'
import { LSPError } from './errors.js'
import { parseLSPMessages } from './parsers.js'
import { isLSPTextDocumentSyncOptions } from './validators.js'

/** Owns one client generation's decoder, capabilities, documents, and diagnostic results. */
export class LSPSession {
	#state: LSPDecodeState | undefined
	#capabilities: LSPServerCapabilities | undefined
	readonly #documents = new Set<LSPDocumentURI>()
	readonly #diagnostics = new Map<
		LSPDocumentURI,
		{ readonly resultId: string; readonly diagnostics: readonly LSPDiagnostic[] }
	>()

	get capabilities(): LSPServerCapabilities | undefined {
		return this.#capabilities
	}

	set capabilities(value: LSPServerCapabilities) {
		this.#capabilities = Object.freeze({ ...value })
	}

	get documents(): ReadonlySet<LSPDocumentURI> {
		return this.#documents
	}

	get diagnostics(): ReadonlyMap<
		LSPDocumentURI,
		{ readonly resultId: string; readonly diagnostics: readonly LSPDiagnostic[] }
	> {
		return this.#diagnostics
	}

	decode(chunk: Uint8Array): readonly JSONRPCMessage[] {
		try {
			const [messages, state] = parseLSPMessages(chunk, this.#state)
			this.#state = state
			return messages
		} catch (error) {
			this.#state = undefined
			throw error
		}
	}

	open(uri: LSPDocumentURI): void {
		if (this.#documents.has(uri))
			throw new LSPError('The document URI is already open', {
				code: 'duplicate',
				context: { value: uri },
			})
		const synchronization = this.#capabilities?.textDocumentSync
		if (
			synchronization === undefined ||
			synchronization === 0 ||
			(isLSPTextDocumentSyncOptions(synchronization) && synchronization.openClose !== true)
		)
			throw new LSPError('The LSP server does not support document open and close', {
				code: 'protocol',
				context: { value: synchronization },
			})
		this.#documents.add(uri)
	}

	release(uri: LSPDocumentURI): void {
		this.#documents.delete(uri)
	}

	record(
		uri: LSPDocumentURI,
		resultId: string | undefined,
		diagnostics: readonly LSPDiagnostic[],
	): void {
		if (resultId === undefined) this.#diagnostics.delete(uri)
		else this.#diagnostics.set(uri, { resultId, diagnostics })
	}
}
