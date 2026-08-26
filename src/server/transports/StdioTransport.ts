import type { EmitterInterface } from '@orkestrel/emitter'
import type { LSPTransportEventMap, LSPTransportInterface } from '@src/core'
import type { ChildProcess } from 'node:child_process'
import type { StdioTransportOptions } from '../types.js'
import { Emitter } from '@orkestrel/emitter'
import { LSPError } from '@src/core'
import { resolveExecutable, stopChild, waitForExit } from '@orkestrel/process/server'
import { spawn } from 'node:child_process'

/**
 * Streams Language Server Protocol bytes between a client and a child process over stdio.
 *
 * @remarks
 * The transport carries bytes and never frames: every standard-output chunk reaches the `chunk`
 * event exactly as the host delivered it, so a frame split across reads and two frames coalesced
 * into one read both arrive unaltered and the client's parser owns the framing. Standard error is
 * drained so a chatty server cannot fill its pipe and stall.
 *
 * The child stays in this process's group rather than leading its own, so `stopChild` reaches it
 * through a direct signal after the host reports that no group owns its identifier.
 *
 * `start` rejects with an `LSPError` coded `spawn` when the command is empty, when the host refuses
 * the spawn, and when the child reports a spawn fault; it rejects with one coded `duplicate` while a
 * child is still live. `send` and `close` reject rather than throw. `send` resolves `false` before
 * the first `start`, after `close` resolves, and after the child exits.
 *
 * @example
 * ```ts
 * const transport = new StdioTransport({ server: { command: ['my-server', '--stdio'] } })
 * await transport.start()
 * await transport.close()
 * ```
 */
export class StdioTransport implements LSPTransportInterface {
	readonly #emitter = new Emitter<LSPTransportEventMap>()
	readonly #command: readonly string[]
	readonly #directory: string | undefined
	readonly #environment: Readonly<Record<string, string | undefined>> | undefined
	readonly #grace: number
	#child: ChildProcess | undefined = undefined

	/**
	 * Creates a stdio transport over the configured child process.
	 *
	 * @param options - The child's command, working directory, environment, and grace window.
	 */
	constructor(options: StdioTransportOptions) {
		this.#command = Object.freeze([...options.server.command])
		this.#directory = options.server.directory
		this.#environment =
			options.server.environment === undefined
				? undefined
				: Object.freeze({ ...options.server.environment })
		this.#grace = options.grace ?? 5_000
	}

	get emitter(): EmitterInterface<LSPTransportEventMap> {
		return this.#emitter
	}

	/**
	 * Spawns the configured child process and observes its streams.
	 *
	 * @returns A promise that resolves after the host reports the child spawned.
	 * @throws An `LSPError` coded `duplicate` while a child is live, and one coded `spawn` when the
	 * command is empty or the host refuses the spawn.
	 */
	async start(): Promise<void> {
		if (this.#live())
			throw new LSPError('The stdio transport already owns a live child process', {
				code: 'duplicate',
			})
		const [file, ...parameters] = this.#command
		if (file === undefined || file.length === 0)
			throw new LSPError('The stdio transport requires a command executable', { code: 'spawn' })
		const child = this.#launch(file, parameters)
		this.#child = child
		try {
			await new Promise<void>((resolve, reject) => {
				child.once('spawn', () => resolve())
				child.once('error', (cause: unknown) =>
					reject(
						new LSPError('The stdio transport could not spawn its server', {
							code: 'spawn',
							cause,
						}),
					),
				)
			})
		} catch (error) {
			this.#child = undefined
			throw error
		}
		this.#observe(child)
	}

	/**
	 * Writes bytes to the child's standard input.
	 *
	 * @param bytes - The encoded frame to deliver.
	 * @returns True if the child's input stream accepted the bytes; false otherwise.
	 */
	async send(bytes: Uint8Array): Promise<boolean> {
		const child = this.#child
		if (child === undefined || child.exitCode !== null || child.signalCode !== null) return false
		const stdin = child.stdin
		if (stdin === null || stdin.writableEnded || stdin.destroyed) return false
		return await new Promise<boolean>((resolve) => {
			stdin.write(bytes, (fault: Error | null | undefined) =>
				resolve(fault === null || fault === undefined),
			)
		})
	}

	/**
	 * Ends the child process within the configured grace window.
	 *
	 * @returns A promise that resolves after the child has exited or been killed.
	 * @remarks Ending the child's input stream is the cooperative signal a conformant language server
	 * answers by exiting. A child still live after `grace` is handed to the process package's
	 * `stopChild` helper, which signals it, waits `grace`, and escalates to an unconditional kill.
	 */
	async close(): Promise<void> {
		const child = this.#child
		this.#child = undefined
		if (child === undefined || child.exitCode !== null || child.signalCode !== null) return
		const stdin = child.stdin
		if (stdin !== null && !stdin.writableEnded && !stdin.destroyed) stdin.end()
		await waitForExit(child, this.#grace)
		if (child.exitCode === null && child.signalCode === null)
			await stopChild(child, this.#grace, this.#grace)
	}

	#live(): boolean {
		const child = this.#child
		return child !== undefined && child.exitCode === null && child.signalCode === null
	}

	#launch(file: string, parameters: readonly string[]): ChildProcess {
		const directory = this.#directory
		const environment = this.#environment
		try {
			return spawn(
				resolveExecutable(file, {
					...(directory === undefined ? {} : { workspace: directory }),
					...(environment === undefined ? {} : { environment }),
				}) ?? file,
				[...parameters],
				{
					stdio: ['pipe', 'pipe', 'pipe'],
					...(directory === undefined ? {} : { cwd: directory }),
					...(environment === undefined ? {} : { env: { ...environment } }),
				},
			)
		} catch (cause) {
			throw new LSPError('The stdio transport could not spawn its server', { code: 'spawn', cause })
		}
	}

	#observe(child: ChildProcess): void {
		child.stdout?.on('data', (chunk: Buffer) => this.#emitter.emit('chunk', chunk))
		child.stderr?.resume()
		child.stdin?.on('error', (fault: unknown) => this.#emitter.emit('error', fault))
		child.on('error', (fault: unknown) => this.#emitter.emit('error', fault))
		child.on('close', (code: number | null, signal: NodeJS.Signals | null) =>
			this.#emitter.emit('exit', { code, signal }),
		)
	}
}
