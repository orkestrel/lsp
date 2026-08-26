import type { StdioTransportInterface, StdioTransportOptions } from './types.js'
import { StdioTransport } from './transports/StdioTransport.js'

/**
 * Creates a byte transport over a Language Server Protocol child process.
 *
 * @param options - The child's command, working directory, environment, and grace window.
 * @returns A transport that spawns the configured server and carries its stdio bytes.
 *
 * @example
 * ```ts
 * const transport = createStdioTransport({ server: { command: ['my-server', '--stdio'] } })
 * const client = createLSPClient({ transport, workspace: 'file:///workspace' })
 * await client.start()
 * ```
 */
export function createStdioTransport(options: StdioTransportOptions): StdioTransportInterface {
	return new StdioTransport(options)
}
