import type { StdioClientTransportInterface, StdioClientTransportOptions } from './types.js'
import { StdioClientTransport } from './transports/StdioClientTransport.js'

/**
 * Creates a byte transport over a Language Server Protocol child process.
 *
 * @param options - The child's command, working directory, environment, and grace window.
 * @returns A transport that spawns the configured server and carries its stdio bytes.
 *
 * @example
 * ```ts
 * import { createLSPClient } from '../core/factories.js'
 * import { pathToFileURL } from 'node:url'
 *
 * declare const directory: string
 *
 * const transport = createStdioClientTransport({ server: { command: ['my-server', '--stdio'] } })
 * const client = createLSPClient({ transport, workspace: pathToFileURL(directory).href })
 * await client.start()
 * ```
 */
export function createStdioClientTransport(
	options: StdioClientTransportOptions,
): StdioClientTransportInterface {
	return new StdioClientTransport(options)
}
