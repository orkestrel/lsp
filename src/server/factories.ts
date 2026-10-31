import type { LSPStdioTransportInterface, LSPStdioTransportOptions } from './types.js'
import { LSPStdioTransport } from './transports/LSPStdioTransport.js'

/**
 * Creates a byte transport over a Language Server Protocol child process.
 *
 * @param options - The child's initial event hooks, listener-error handler, command, working
 * directory, environment, and grace window.
 * @returns A transport that spawns the configured server and carries its stdio bytes.
 *
 * @example
 * ```ts
 * import { createLSPClient } from '@orkestrel/lsp'
 * import { pathToFileURL } from 'node:url'
 *
 * declare const directory: string
 *
 * const transport = createLSPStdioTransport({ server: { command: ['my-server', '--stdio'] } })
 * const client = createLSPClient({ transport, workspace: pathToFileURL(directory).href })
 * await client.start()
 * ```
 */
export function createLSPStdioTransport(
	options: LSPStdioTransportOptions,
): LSPStdioTransportInterface {
	return new LSPStdioTransport(options)
}
