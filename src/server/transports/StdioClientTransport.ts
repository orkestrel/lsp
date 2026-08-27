import type { EmitterInterface } from '@orkestrel/emitter'
import type { LSPExit, LSPTransportEventMap } from '@src/core'
import type { ProcessExit, SessionInterface } from '@orkestrel/process'
import type { StdioClientTransportInterface, StdioClientTransportOptions } from '../types.js'
import { Emitter } from '@orkestrel/emitter'
import { LSPError, waitForDeadline } from '@src/core'
import { createSession } from '@orkestrel/process/server'

/**
 * Streams Language Server Protocol bytes between a client and a child process over stdio.
 *
 * @remarks
 * The transport carries bytes and never frames: every standard-output chunk reaches the `chunk`
 * event exactly as the host delivered it, so a frame split across reads and two frames coalesced
 * into one read both arrive unaltered and the client's parser owns the framing. Standard error is
 * read continuously and retained as a bounded tail by the process package, so a chatty server
 * cannot fill its pipe and stall.
 *
 * Each accepted `start` opens a generation that owns its child until termination settles. Only the
 * current generation reaches the emitter, so a child whose standard output a grandchild holds open
 * past its own exit delivers neither a stale `exit` nor a stale chunk into the generation that
 * replaced it. The process package waits at most `grace` for that output after the child's own
 * ending and then closes the read end, so a pipe-holding grandchild defers no settlement and stalls
 * on no full pipe.
 *
 * A termination reaches the child's whole tree: the child leads its own process group on a POSIX
 * host and that group receives the signals, while Windows carries no such group and the host's
 * `taskkill` utility ends the tree there instead.
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
 * const transport = new StdioClientTransport({ server: { command: ['my-server', '--stdio'] } })
 * await transport.start()
 * await transport.close()
 * ```
 */
export class StdioClientTransport implements StdioClientTransportInterface {
	readonly #emitter = new Emitter<LSPTransportEventMap>()
	readonly #command: readonly string[]
	readonly #directory: string | undefined
	readonly #environment: Readonly<Record<string, string | undefined>> | undefined
	readonly #grace: number
	#session: SessionInterface | undefined = undefined
	#generation = 0
	#owner: number | undefined = undefined
	#closing: Promise<void> | undefined = undefined

	/**
	 * Creates a stdio transport over the configured child process.
	 *
	 * @param options - The child's command, working directory, environment, and grace window.
	 */
	constructor(options: StdioClientTransportOptions) {
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
		return this.#owner === this.#generation ? this.#session?.pid : undefined
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
		const session = this.#open(file, parameters, generation)
		// The session spawns eagerly and the host fixes the child's identifier before construction
		// returns, so an absent identifier is a spawn the host refused rather than one still in
		// flight. Taking ownership only past this reading is what keeps a refused spawn off the
		// emitter, because every session callback is gated on the generation it owns.
		if (session.pid === undefined) throw await this.#refuse(session)
		this.#session = session
		this.#owner = generation
	}

	/**
	 * Writes bytes to the child's standard input.
	 *
	 * @param bytes - The encoded frame to deliver.
	 * @returns True if the child's input channel accepted the bytes; false otherwise.
	 */
	async send(bytes: Uint8Array): Promise<boolean> {
		const session = this.#session
		// A child the host has recorded as ended accepts nothing further, and its input channel can
		// stay writable past that moment while a descendant holds the pipe open, so the refusal is
		// read from the terminal facts rather than from the channel alone.
		if (session === undefined || session.code !== null || session.signal !== null) return false
		return await session.write(bytes)
	}

	/**
	 * Ends the child process within the configured grace window.
	 *
	 * @returns A promise that resolves after the child has exited and its generation has retired.
	 * @throws An `LSPError` coded `timeout` when the process package cannot confirm the child
	 * stopped; the transport keeps the still-live child, so a later `start` is still refused.
	 * @remarks Closing the child's input channel is the cooperative signal a conformant language
	 * server answers by exiting, and it terminates nothing on its own. A child still live after
	 * `grace` is handed to the session's `stop`, which signals the child's process group and
	 * escalates to an unconditional kill after `grace` on a POSIX host, and ends the child's tree
	 * through the host's `taskkill` utility on Windows. A second `close` called while the first is in
	 * flight settles on that same termination rather than resolving early. The wait for the child's
	 * stdio to close is bounded by `grace` too, so a grandchild holding the child's standard output
	 * delays neither this call nor the `exit` event.
	 */
	async close(): Promise<void> {
		const closing = this.#closing
		if (closing !== undefined) return await closing
		const session = this.#session
		if (session === undefined || this.#owner !== this.#generation) return
		const settling = this.#settle(session, this.#generation)
		this.#closing = settling
		try {
			await settling
		} finally {
			this.#closing = undefined
		}
	}

	async #settle(session: SessionInterface, generation: number): Promise<void> {
		// One deadline bounds the whole cooperative phase, because the transport documents one
		// `grace` rather than a window per step: a child that stops reading its input holds the
		// channel's flush open, and a second timer would let that flush spend the window the child's
		// own ending was promised.
		const cooperative = waitForDeadline(this.#grace)
		await Promise.race([session.end(), cooperative])
		// `ending` settles at the child's own exit, while `exit` waits out the window a grandchild
		// holding the pipe opens, so racing `exit` here would escalate against a child that already
		// left.
		await Promise.race([session.ending, cooperative])
		if (session.code === null && session.signal === null) {
			// The following rejection is unproven. A POSIX host cannot refuse SIGKILL, so no real child
			// drives a false return here: a fixture that ignores SIGTERM reports a confirmed stop at
			// a zero window and at a graced one alike, and simulating the session would prove nothing
			// about it. A host that can hold a process past SIGKILL closes the gap — a Windows tree
			// whose kill utility fails, or a process blocked in the kernel — so the branch waits on
			// that host joining the suite's matrix.
			const stopped = await session.stop()
			if (!stopped)
				throw new LSPError('The stdio transport could not confirm its child process stopped', {
					code: 'timeout',
					context: { value: session.pid },
				})
		}
		const exit = await session.exit
		this.#retire(generation, { code: exit.code, signal: exit.signal })
		await session.destroy()
	}

	#open(file: string, parameters: readonly string[], generation: number): SessionInterface {
		const directory = this.#directory
		const environment = this.#environment
		try {
			return createSession({
				command: {
					file,
					arguments: parameters,
					// `server.environment` is the child's COMPLETE environment, so an isolated spawn is
					// what makes the configured record the whole of it rather than an overlay on this
					// process's own.
					...(environment === undefined ? {} : { environment, isolated: true }),
				},
				// An unconfigured directory means this process's own, which is the directory the host
				// would hand the child anyway.
				workspace: directory ?? process.cwd(),
				grace: this.#grace,
				drain: this.#grace,
				// The listeners are installed with the spawn rather than after it, so the first chunk a
				// child can produce already has somewhere to go.
				on: {
					stdout: this.#deliver.bind(this, generation),
					error: this.#report.bind(this, generation),
					exit: this.#conclude.bind(this, generation),
				},
			})
		} catch (cause) {
			throw new LSPError('The stdio transport could not spawn its server', { code: 'spawn', cause })
		}
	}

	async #refuse(session: SessionInterface): Promise<LSPError> {
		const reported = Promise.withResolvers<unknown>()
		session.emitter.on('error', reported.resolve)
		// A refused spawn reports its host cause on the session's `error` event before the child's
		// ending settles, so that ending bounds the wait for the cause rather than a timer of its own.
		const cause = await Promise.race([reported.promise, session.ending])
		await session.destroy()
		return new LSPError('The stdio transport could not spawn its server', { code: 'spawn', cause })
	}

	#owns(generation: number): boolean {
		return this.#owner === generation && generation === this.#generation
	}

	#deliver(generation: number, chunk: Uint8Array): void {
		if (!this.#owns(generation)) return
		this.#emitter.emit('chunk', chunk)
	}

	#report(generation: number, fault: unknown): void {
		if (!this.#owns(generation)) return
		this.#emitter.emit('error', fault)
	}

	// A close in flight owns its generation's retirement. The session reaches its terminal moment
	// inside `stop` even when that termination went unconfirmed, so retiring from this event would
	// release the refusal window that a `timeout`-coded close keeps open over a still-live child.
	#conclude(generation: number, exit: ProcessExit): void {
		if (!this.#owns(generation) || this.#closing !== undefined) return
		this.#retire(generation, { code: exit.code, signal: exit.signal })
	}

	// Retiring a generation is what makes its `exit` fire exactly once: the first settlement to
	// arrive — the session's own terminal moment or the bounded wait inside `#settle` — advances the
	// counter, and every later listener carrying the retired number returns before it emits.
	#retire(generation: number, exit: LSPExit): void {
		if (generation !== this.#generation) return
		this.#generation += 1
		this.#emitter.emit('exit', exit)
	}
}
