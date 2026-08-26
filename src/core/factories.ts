import type { LSPClientInterface, LSPClientOptions } from './types.js'
import { LSPClient } from './LSPClient.js'

/**
 * Creates a transport-agnostic Language Server Protocol client.
 *
 * @param options - The transport, workspace, lifecycle timeout, client abort, and initial event
 * hooks.
 * @returns A client that initializes and drives the configured protocol peer.
 *
 * @example
 * ```ts
 * import type { LSPTransportInterface } from './types.js'
 * import { pathToFileURL } from 'node:url'
 *
 * declare const transport: LSPTransportInterface
 * declare const directory: string
 *
 * const client = createLSPClient({ transport, workspace: pathToFileURL(directory).href })
 * await client.start()
 * ```
 */
export function createLSPClient(options: LSPClientOptions): LSPClientInterface {
	return new LSPClient(options)
}
