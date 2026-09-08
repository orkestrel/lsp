import type { LSPClientInterface, LSPClientOptions } from './types.js'
import { LSPClient } from './LSPClient.js'

/**
 * Creates a transport-agnostic Language Server Protocol client.
 *
 * @param options - The transport, workspace, lifecycle timeout, client abort, and initial event
 * hooks.
 * @returns A client that initializes and drives the configured protocol peer.
 *
 * @example Create a client and inspect a document
 * ```ts
 * import type { LSPTransportInterface } from '@orkestrel/lsp'
 * import { createLSPClient } from '@orkestrel/lsp'
 * import { join } from 'node:path'
 * import { pathToFileURL } from 'node:url'
 *
 * declare const transport: LSPTransportInterface
 * declare const directory: string
 *
 * const client = createLSPClient({ transport, workspace: pathToFileURL(directory).href })
 * await client.start()
 *
 * const signal = AbortSignal.timeout(30_000)
 * const uri = pathToFileURL(join(directory, 'main.ts')).href
 *
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
export function createLSPClient(options: LSPClientOptions): LSPClientInterface {
	return new LSPClient(options)
}
