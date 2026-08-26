import type { LSPTransportInterface } from '@src/core'

/**
 * Configures a Language Server Protocol child process reached over its standard streams.
 *
 * @remarks
 * `server.command` is the child's argument vector: its first element names the executable and the
 * rest are its arguments, so a launcher and its target stay one value and no shell splits them.
 * `server.directory` is the child's working directory, and the current one applies when it is
 * absent. `server.environment` is the child's complete environment, and this process's environment
 * applies when it is absent; the transport copies and freezes the record it receives, so a later
 * caller mutation cannot reach the spawn.
 *
 * `grace` bounds the cooperative termination window in milliseconds. Default: `5000`. The
 * termination path is fixed: `close` ends the child's input stream, waits `grace` for the child's
 * own exit through the process package's `waitForExit` helper, and hands a child that outlives that
 * window to its `stopChild` helper, which signals the child, waits `grace` again, and escalates to
 * an unconditional kill.
 *
 * The transport reconnects. After `close` resolves, or after the child exits on its own and the
 * transport emits `exit`, a further `start` call spawns a fresh child. A `start` call made while a
 * child is still live is refused with an `LSPError` whose `code` property is `duplicate`.
 */
export interface StdioTransportOptions {
	readonly server: {
		readonly command: readonly string[]
		readonly directory?: string
		readonly environment?: Readonly<Record<string, string | undefined>>
	}
	readonly grace?: number
}

/**
 * Defines the stdio transport's own surface beyond the byte transport it carries.
 *
 * @remarks
 * `pid` is the host's identifier for the child that owns the current generation. It reads
 * `undefined` before the first `start`, after a spawn the host refused, and after a generation
 * retires, so an identifier is present exactly while one child answers for the transport. A host
 * reuses an identifier after it reaps the process that held it, so a caller that keeps the number
 * past its generation holds a number rather than a claim on that child.
 */
export interface StdioTransportInterface extends LSPTransportInterface {
	readonly pid: number | undefined
}
