import type { EmitterInterface } from '@orkestrel/emitter'
import type { LSPExit, LSPTransportEventMap } from '@src/core'
import type { ChildProcess } from 'node:child_process'
import type { StdioTransportInterface, StdioTransportOptions } from '../types.js'
import { Emitter } from '@orkestrel/emitter'
import { LSPError } from '@src/core'
import { buildSpawn, stopChild, waitForClose, waitForExit } from '@orkestrel/process/server'
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
 * Each accepted `start` opens a generation that owns its child until termination settles. Only the
 * current generation reaches the emitter, so a child whose standard output a grandchild holds open
 * past its own exit delivers neither a stale `exit` nor a stale chunk into the generation that
 * replaced it. The retired generation's streams keep draining, so a pipe-holding grandchild never
 * blocks on a full pipe.
 *
 * The child stays in this process's group rather than leading its own, so `stopChild` reaches it
 * through a direct signal after the host reports that no group owns its identifier.
 *
 * `start` rejects with an `LSPError` coded `spawn` when the command is empty, when the host refuses
 * the spawn, and when the child reports a spawn fault; it rejects with one coded `duplicate` while
 * the previous generation is unsettled, which covers a live child, a child that has exited natively
 * while a grandchild still holds its standard output, and a `close` still in flight. `send` and
 * `close` reject rather than throw. `send` resolves `false` before the first `start`, after `close`
 * resolves, and after the child exits.
 *
 * @example
 * ```ts
 * const transport = new StdioTransport({ server: { command: ['my-server', '--stdio'] } })
 * await transport.start()
 * await transport.close()
 * ```
 */
export class StdioTransport implements StdioTransportInterface {
	readonly #emitter = new Emitter<LSPTransportEventMap>()
	readonly #command: readonly string[]
	readonly #directory: string | undefined
	readonly #environment: Readonly<Record<string, string | undefined>> | undefined
	readonly #grace: number
	#child: ChildProcess | undefined = undefined
	#generation = 0
	#owner: number | undefined = undefined
	#closing: Promise<void> | undefined = undefined

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

	get pid(): number | undefined {
		return this.#owner === this.#generation ? this.#child?.pid : undefined
	}

	/**
	 * Spawns the configured child process and observes its streams.
	 *
	 * @returns A promise that resolves after the host reports the child spawned.
	 * @throws An `LSPError` coded `duplicate` while the previous child still owns the current
	 * generation or a `close` is still in flight, and one coded `spawn` when the command is empty or
	 * the host refuses the spawn. Leave that window through `close`, whose wait for the child's stdio
	 * is bounded by `grace`, or by waiting for the transport's `exit` event.
	 */
	async start(): Promise<void> {
		// A natively exited child keeps owning its generation until a settlement retires it, and its
		// standard output can still deliver bytes through a grandchild holding the pipe. Comparing the
		// owner against the current generation is what refuses a replacement inside that window; a
		// liveness reading reports the child dead there and would hand the successor a shared owner.
		if (this.#owner === this.#generation || this.#closing !== undefined)
			throw new LSPError('The stdio transport has not retired its previous child generation', {
				code: 'duplicate',
			})
		const [file, ...parameters] = this.#command
		if (file === undefined || file.length === 0)
			throw new LSPError('The stdio transport requires a command executable', { code: 'spawn' })
		const generation = this.#generation
		const child = this.#launch(file, parameters)
		this.#child = child
		this.#owner = generation
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
			this.#owner = undefined
			throw error
		}
		this.#observe(child, generation)
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
	 * @returns A promise that resolves after the child has exited and its generation has retired.
	 * @throws An `LSPError` coded `timeout` when the process package cannot confirm the child
	 * stopped; the transport keeps the still-live child, so a later `start` is still refused.
	 * @remarks Ending the child's input stream is the cooperative signal a conformant language server
	 * answers by exiting. A child still live after `grace` is handed to the process package's
	 * `stopChild` helper, which signals it, waits `grace`, and escalates to an unconditional kill.
	 * A second `close` called while the first is in flight settles on that same termination rather
	 * than resolving early. The wait for the child's stdio to close is bounded by `grace` too, so a
	 * grandchild holding the child's standard output delays neither this call nor the `exit` event.
	 */
	async close(): Promise<void> {
		const closing = this.#closing
		if (closing !== undefined) return await closing
		const child = this.#child
		if (child === undefined || this.#owner !== this.#generation) return
		const settling = this.#settle(child, this.#generation)
		this.#closing = settling
		try {
			await settling
		} finally {
			this.#closing = undefined
		}
	}

	async #settle(child: ChildProcess, generation: number): Promise<void> {
		const stdin = child.stdin
		if (stdin !== null && !stdin.writableEnded && !stdin.destroyed) stdin.end()
		await waitForExit(child, this.#grace)
		if (child.exitCode === null && child.signalCode === null) {
			// The rejection below is unproven. A POSIX host cannot refuse SIGKILL, so no real child
			// drives a false return here: a fixture that ignores SIGTERM reports a confirmed stop at
			// a zero window and at a graced one alike, and simulating the helper would prove nothing
			// about it. A host that can hold a process past SIGKILL closes the gap — a Windows tree
			// whose kill utility fails, or a process blocked in the kernel — so the branch waits on
			// that host joining the suite's matrix.
			const stopped = await stopChild(child, this.#grace, this.#grace)
			if (!stopped)
				throw new LSPError('The stdio transport could not confirm its child process stopped', {
					code: 'timeout',
					context: { value: child.pid },
				})
		}
		if (generation === this.#generation) await waitForClose(child, this.#grace)
		this.#retire(generation, { code: child.exitCode, signal: child.signalCode })
	}

	#launch(file: string, parameters: readonly string[]): ChildProcess {
		const directory = this.#directory
		const environment = this.#environment
		try {
			const input = buildSpawn(
				{ file, arguments: parameters },
				{
					...(directory === undefined ? {} : { workspace: directory }),
					...(environment === undefined ? {} : { environment }),
				},
			)
			return spawn(input.file, [...input.arguments], {
				stdio: ['pipe', 'pipe', 'pipe'],
				windowsVerbatimArguments: input.verbatim,
				...(directory === undefined ? {} : { cwd: directory }),
				...(environment === undefined ? {} : { env: { ...environment } }),
			})
		} catch (cause) {
			throw new LSPError('The stdio transport could not spawn its server', { code: 'spawn', cause })
		}
	}

	#observe(child: ChildProcess, generation: number): void {
		child.stdout?.on('data', (chunk: Buffer) => this.#deliver(generation, chunk))
		child.stderr?.resume()
		child.stdin?.on('error', (fault: unknown) => this.#report(generation, fault))
		child.on('error', (fault: unknown) => this.#report(generation, fault))
		child.on('close', (code: number | null, signal: NodeJS.Signals | null) =>
			this.#retire(generation, { code, signal }),
		)
	}

	#deliver(generation: number, chunk: Uint8Array): void {
		if (generation !== this.#generation) return
		this.#emitter.emit('chunk', chunk)
	}

	#report(generation: number, fault: unknown): void {
		if (generation !== this.#generation) return
		this.#emitter.emit('error', fault)
	}

	// Retiring a generation is what makes its `exit` fire exactly once: the first settlement to
	// arrive — the host's own `close` event or the bounded wait inside `#settle` — advances the
	// counter, and every later listener carrying the retired number returns before it emits.
	#retire(generation: number, exit: LSPExit): void {
		if (generation !== this.#generation) return
		this.#generation += 1
		this.#emitter.emit('exit', exit)
	}
}
