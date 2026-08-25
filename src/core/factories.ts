import type { LSPClientInterface, LSPClientOptions } from './types.js'
import { LSPClient } from './LSPClient.js'

/**
 * Creates a transport-agnostic Language Server Protocol client.
 *
 * @param options - The transport, workspace, deadline, abort signal, and initial event hooks.
 * @returns A client that initializes and drives the configured protocol peer.
 *
 * @example
 * ```ts
 * const client = createLSPClient({ transport, workspace: 'file:///workspace' })
 * await client.start()
 * ```
 */
export function createLSPClient(options: LSPClientOptions): LSPClientInterface {
	return new LSPClient(options)
}
