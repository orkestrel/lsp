# P1a report — `Supervisor` extracted, `Process` recomposed over it

## Outcome

Done. `tests/src/server/Process.test.ts` is byte-identical and green at the same count as the
baseline. Every acceptance criterion is met. Two flags for the orchestrator sit under
**Deviations and flags**: the `tests/guides.test.ts` edit reached one line beyond "the INTERNAL row
only", and P1b needs a stdin-close operation this unit did not add.

## What moved into `Supervisor`

`C:\Users\mikes\WebstormProjects\process\src\server\Supervisor.ts` (new, 417 lines).

- The eager spawn path: the option and command reads, `snapshotCommand`, `validateCommand`,
  `validateWorkspace`, `validateTimer` for `grace`, `drain`, and `delivery`, `validateBytes` for
  `evidence`, `mergeEnvironment`, `buildSpawn`, `spawn`, and the child `error`, `exit`, and `close`
  wiring.
- The stderr retention and its decoded chunks: `#tail`, `trimTail`, the `StringDecoder`, `#retain`,
  and the `evidence` value.
- The native-exit-to-drain-to-terminal-moment progression: `#expire`, `#wait`, `#complete` (the
  child `close` listener, renamed from `#close` so the face callback field could take that name),
  and `#settle`.
- The stdin channel: `#writes`, the `delivery` bound, `#confirmWrite`, `#settleWrite`,
  `#settleWrites`, `#completeInput`, `#failInputStream`, `#failInputCallback`, and `#failure`.
- Termination: `stop`'s shared `#termination` barrier through `stopChild`, `#kill`, `destroy`'s
  `#destruction` barrier, `#end`, the `signal` option's listener, `#terminate`, and
  `#removeAbortListener`.
- New, named by the brief's seam and unconsumed in this unit: `ending`, the native-exit waiter.

## What stayed in `Process`

`C:\Users\mikes\WebstormProjects\process\src\server\Process.ts`.

- The readline attach and the whole line pipeline: `#reader`, `#queue`, `#waiters`, `#head`,
  `#pending`, `#requested`, `#paused`, `#truncated`, `#ended`, `#backlog`, `#lines`, `#iterate`,
  `#next`, `#take`, `#push`, `#restrain`, `#relieve`, `#finish`, and `#capBacklog`.
- `send`'s line framing: `send` composes `${text}\n` as UTF-8 bytes and hands them to
  `Supervisor.deliver`. Every refusal gate stayed with the channel, in the engine.
- Its emitter, its `ProcessEventMap`, and its published constructor contract.
- Its public getters. `pid`, `code`, `signal`, `evidence`, `settled`, `stopping`, and `exit`
  delegate to the engine; `lines`, `truncated`, and `emitter` read face state.
- Validation of `backlog`, which runs before the engine is constructed so an invalid value still
  refuses construction with nothing spawned.

## The face seam — the exact members P1b consumes

`Supervisor` is exported from its own file, absent from `src/server/index.ts`, and named in the
parity `INTERNAL` list.

Constructor:

```ts
new Supervisor(options: ProcessOptions, face: {
	readonly chunk: (text: string) => void        // a decoded stderr chunk arrived
	readonly fault: (cause: unknown) => void      // a child or stdin fault arrived
	readonly relieve: () => void                  // a termination began; release face backpressure
	readonly close: () => void                    // terminal moment; end the face's read pipeline
	readonly terminal: (exit: ProcessExit) => void // the frozen terminal state exists
	readonly teardown: () => void                 // termination completed; release the face
})
```

Accessors and operations:

| Member | Type | Note |
| ------ | ---- | ---- |
| `stdout` | `Readable` | the child's stdout; the face attaches its own consumer |
| `pid` | `number \| undefined` | |
| `code` | `number \| null` | reads the host child directly |
| `signal` | `string \| null` | reads the host child directly |
| `evidence` | `string` | decoded byte-bounded stderr tail, frozen at the terminal moment |
| `settled` | `boolean` | |
| `stopping` | `boolean` | |
| `ending` | `Promise<void>` | the child's own exit, without the drain window |
| `exit` | `Promise<ProcessExit>` | the terminal moment |
| `deliver(bytes: Uint8Array)` | `Promise<boolean>` | raw stdin write, no framing added |
| `stop()` | `Promise<boolean>` | shared barrier |
| `destroy()` | `Promise<void>` | shared barrier; runs `stop`, then `face.teardown` |

What P1b must know about the seam:

- **The engine takes `ProcessOptions`.** `src/core/types.ts` and `src/server/types.ts` were both
  outside this unit's write scope, and a new exported type in `src/server/types.ts` would have
  obliged a row in the off-limits `guides/process.md`. `Session` satisfies the parameter
  structurally with `{ command, workspace, grace, drain, evidence, delivery, writable: true,
  signal }`; the engine never reads `backlog`, `on`, or `error`. P1b owns `types.ts` and can narrow
  the parameter to a named type then.
- **The face callback bundle is an inline parameter type** for the same reason. `Session` writes the
  same object literal; structural typing needs no shared name.
- **The engine hoists its own option reads**, so a face reads only its own options before
  constructing the engine, and must validate them there. Order the face's validation before the
  engine's construction, as `Process` does with `backlog`, or an invalid face option throws after a
  child is already spawned.
- **The engine publishes nothing.** A face republishes each callback on its own typed emitter.
  Binding `Emitter.emit` to one event name does not typecheck — TypeScript collapses the generic
  payload to the first member of the map — so each face needs a small private method per event, as
  `Process.#reportStderr`, `#reportFault`, and `#reportExit` do.
- **No arrow functions in the callback object.** `policy/no-nested-functions` exempts only a
  callback passed directly as an argument, and a property value is not one. Bind private methods.
- **`Session`'s `stdout` event** attaches to `engine.stdout` in the face. The engine reads stdout
  never and destroys it at the terminal moment.
- **`ending` resolves at the native exit**, and defensively at the terminal moment for a spawn that
  produced no native exit at all, so it can never outlive the supervision.

## Deviations and flags

1. **`tests/guides.test.ts` needed one line beyond the INTERNAL row.** The per-face population rows
   assert `stranded: []` for every published face, independently of the guide-level `INTERNAL`
   check. Adding `Supervisor` failed both. The edit keys the deliberate-strand list by face
   (`INTERNALS`), derives the flat `INTERNAL` from it, and has the per-face row read its own key
   through `requireValue`. One home for the fact, and the per-face row still fails when a name stops
   being stranded. Failing rows before: `strands exactly its expected declarations` for
   `@orkestrel/process/server barrel`, and `re-exports every direct declaration that is not named
   internal`.
2. **P1b needs a stdin-close operation the seam does not carry.** `Session.end()` must close stdin
   without terminating the child. The engine ends stdin only at construction (`writable !== true`)
   and destroys it inside `#kill`. Nothing in P1a consumes an `end`, so adding one would have been
   unproven speculation. **Scope `src/server/Supervisor.ts` as an owned file in P1b.**
3. **`Supervisor` has no test file of its own.** The mirror policy is one-directional — a test
   requires a module, not the reverse — and the unmodified `Process` suite drives every engine path
   transitively. P1b's `Session` suite adds the second face's coverage.
4. **Renames inside the engine**, recorded as ancillary choices: the child `close` listener
   `#close` became `#complete` (the face callback field took `#close`), and `destroy`'s barrier
   `#ending` became `#destruction` (the native-exit waiter took `#ending`).
5. No `Process` behavior changed. The one order change with no observable case: with two options
   invalid at once, `backlog` is now reported before `evidence`, `grace`, `drain`, `delivery`,
   `command`, or `workspace`. No test supplies two invalid options, and every single-invalid case
   throws exactly as before, before any spawn.

## Commands, with real counts

Run in `C:\Users\mikes\WebstormProjects\process`, baseline `23808f2`.

| Command | Before | After |
| ------- | ------ | ----- |
| `npm run test:src:server` | 7 files passed; 147 passed \| 6 skipped (153) | 7 files passed; 147 passed \| 6 skipped (153) |
| `npm run test:guides` | 1 file passed; 99 passed \| 2 skipped (101) | 1 file passed; 99 passed \| 2 skipped (101) |
| `npm run test:policy` | not taken | 1 file passed; 93 passed (93) |
| `npm run check` | not taken | exit 0 |
| `npm run lint:check` | not taken | exit 0 |
| `npm run format:check` | not taken | `All matched files use the correct format.` (149 files) |

Between the INTERNAL row's two states, `npm run test:guides` reported `2 failed | 97 passed | 2
skipped (101)` — the failing-first proof that the row binds.

## Working tree

`git status --porcelain`:

```text
 M src/server/Process.ts
 A src/server/Supervisor.ts
 M tests/guides.test.ts
```

`Supervisor.ts` reads `A` rather than `??` because `git add -N` was used to produce the diff below.
The file is untouched on disk; nothing else is staged. `tests/src/server/Process.test.ts` does not
appear.

`git diff --stat` (with the intent-to-add):

```text
 src/server/Process.ts    | 298 ++++++---------------------------
 src/server/Supervisor.ts | 417 +++++++++++++++++++++++++++++++++++++++++++++++
 tests/guides.test.ts     |  18 +-
 3 files changed, 479 insertions(+), 254 deletions(-)
```

## Full diff — `tests/guides.test.ts`

```diff
@@ -181,12 +181,20 @@ const REFUSALS: Readonly<
 	}),
 })
 /**
- * Declarations deliberately kept out of a barrel, as `symbolKey` strings.
+ * Declarations deliberately kept out of a barrel, as `symbolKey` strings, keyed by the face whose
+ * module declares each one.
  *
- * Naming one here is what makes it intentional rather than forgotten, and the assertion over
- * this list fails when a name here stops being stranded, so the list cannot rot.
+ * Naming one here is what makes it intentional rather than forgotten, and the assertions over this
+ * table fail when a name here stops being stranded, so the table cannot rot. `Supervisor` is the
+ * supervision engine each published face composes: its constructor takes the composing face's own
+ * callbacks, which no consumer holds, so a consumer cannot construct one.
  */
-const INTERNAL: readonly string[] = Object.freeze([])
+const INTERNALS: Readonly<Record<string, readonly string[]>> = Object.freeze({
+	'@orkestrel/process': Object.freeze([]),
+	'@orkestrel/process/server': Object.freeze(['class Supervisor']),
+})
+/** Every deliberately stranded declaration, read as one scope the way a guide's source is. */
+const INTERNAL: readonly string[] = Object.freeze(Object.values(INTERNALS).flat())
 /**
  * Test files no guide's Tests section lists, as repository-relative paths.
  *
@@ -297,7 +305,7 @@ const POPULATIONS = Object.freeze([
 		name: `${face.specifier} barrel`,
 		files,
 		module: face.module,
-		stranded: [],
+		stranded: requireValue(INTERNALS[face.specifier], `Missing internal list: ${face.specifier}`),
 		phantom: [],
 	})),
 	{
```

## Full diff — `src/server/Process.ts` and `src/server/Supervisor.ts`

```diff
diff --git a/src/server/Process.ts b/src/server/Process.ts
index 79bdca8..b4bcb08 100644
--- a/src/server/Process.ts
+++ b/src/server/Process.ts
@@ -1,32 +1,12 @@
-import type { ChildProcessWithoutNullStreams } from 'node:child_process'
 import type { Interface as ReadLineInterface } from 'node:readline'
 import type { EmitterInterface } from '@orkestrel/emitter'
 import type { ProcessEventMap, ProcessExit, ProcessInterface, ProcessOptions } from '@src/core'
 import { Buffer } from 'node:buffer'
-import { spawn } from 'node:child_process'
 import { createInterface } from 'node:readline'
-import { StringDecoder } from 'node:string_decoder'
 import { Emitter } from '@orkestrel/emitter'
-import {
-	ProcessError,
-	PROCESS_BACKLOG,
-	PROCESS_CONFIRMATION,
-	PROCESS_DRAIN,
-	PROCESS_EVIDENCE,
-	PROCESS_GRACE,
-} from '@src/core'
-import {
-	buildSpawn,
-	mergeEnvironment,
-	snapshotCommand,
-	stopChild,
-	trimTail,
-	validateBytes,
-	validateCommand,
-	validateTimer,
-	validateWorkspace,
-	waitForClose,
-} from './helpers.js'
+import { PROCESS_BACKLOG } from '@src/core'
+import { validateBytes } from './helpers.js'
+import { Supervisor } from './Supervisor.js'
 
 /**
  * Supervises one child while keeping every observation channel aligned at termination.
@@ -61,42 +41,18 @@ import {
  */
 export class Process implements ProcessInterface {
 	readonly #emitter: Emitter<ProcessEventMap>
-	readonly #child: ChildProcessWithoutNullStreams
+	readonly #engine: Supervisor
 	readonly #reader: ReadLineInterface
-	readonly #grace: number
-	readonly #drain: number
-	readonly #evidence: number
 	readonly #backlog: number
-	readonly #delivery: number
-	readonly #decoder = new StringDecoder('utf8')
-	readonly #exit = Promise.withResolvers<ProcessExit>()
 	readonly #lines: AsyncIterable<string>
 	readonly #queue: string[] = []
 	readonly #waiters: Array<PromiseWithResolvers<IteratorResult<string, void>>> = []
-	readonly #signal: AbortSignal | undefined
-	readonly #abort: EventListener | undefined
-	readonly #writes = new Map<
-		PromiseWithResolvers<boolean>,
-		ReturnType<typeof setTimeout> | undefined
-	>()
-	#tail: Buffer = Buffer.alloc(0)
 	#head = 0
 	#pending = 0
 	#requested = false
 	#paused = false
 	#truncated = false
-	// A guard reads `#stopping`, never `#termination !== undefined`. `#kill` assigns the boolean in
-	// its synchronous prefix, which runs while `stop` is still evaluating
-	// `this.#termination = this.#kill()`, so the boolean also covers the retention and backpressure
-	// decisions taken while `#termination` is still `undefined`.
-	#stopping = false
-	#settled = false
 	#ended = false
-	#input = 0
-	#failure: Error | undefined
-	#waiting: Promise<void> | undefined
-	#termination: Promise<boolean> | undefined
-	#ending: Promise<void> | undefined
 
 	/**
 	 * Spawn one child process and begin stream capture.
@@ -105,87 +61,47 @@ export class Process implements ProcessInterface {
 	 * @throws A {@link ProcessError} coded `invalid` when an option or command string is malformed
 	 */
 	constructor(options: ProcessOptions) {
-		// Every option and command property is read once, here, before anything is spawned. Reading a
-		// property runs the caller's own getter, so a read after the spawn would let that getter throw
-		// while a live child exists and no one holds a reference to it. Hoisting the reads is what
-		// makes a construction failure unable to strand a process.
-		const source = options.command
-		const workspace = options.workspace
-		const grace = options.grace
-		const drain = options.drain
-		const evidence = options.evidence
+		// The line pipeline's own option is read and validated here, before the engine reads the rest
+		// and spawns, so a malformed `backlog` refuses construction while nothing has started. The
+		// engine hoists its own reads for the same reason.
 		const backlog = options.backlog
-		const delivery = options.delivery
-		const writable = options.writable
-		const signal = options.signal
 		const on = options.on
 		const error = options.error
-		const command = snapshotCommand(source)
-		const input = command.input
-		validateCommand(command)
-		validateWorkspace(workspace)
-		validateTimer(grace, "option 'grace'")
-		validateTimer(drain, "option 'drain'")
-		validateTimer(delivery, "option 'delivery'")
-		validateBytes(evidence, "option 'evidence'", 0)
 		validateBytes(backlog, "option 'backlog'", 1)
 		this.#emitter = new Emitter<ProcessEventMap>({
 			...(on === undefined ? {} : { on }),
 			...(error === undefined ? {} : { error }),
 		})
-		this.#grace = grace ?? PROCESS_GRACE
-		this.#drain = drain ?? PROCESS_DRAIN
-		this.#evidence = evidence ?? PROCESS_EVIDENCE
 		this.#backlog = backlog ?? PROCESS_BACKLOG
-		this.#delivery = delivery ?? 0
-		this.#signal = signal
 		this.#lines = Object.freeze({ [Symbol.asyncIterator]: this.#iterate.bind(this) })
-		const childEnvironment = mergeEnvironment(command.isolated === true, command.environment)
-		const plan = buildSpawn(command, { workspace, environment: childEnvironment })
-		this.#child = spawn(plan.file, [...plan.arguments], {
-			cwd: workspace,
-			detached: process.platform !== 'win32',
-			env: childEnvironment,
-			stdio: ['pipe', 'pipe', 'pipe'],
-			windowsHide: true,
-			windowsVerbatimArguments: plan.verbatim,
+		this.#engine = new Supervisor(options, {
+			chunk: this.#reportStderr.bind(this),
+			fault: this.#reportFault.bind(this),
+			relieve: this.#releaseBackpressure.bind(this),
+			close: this.#closeReader.bind(this),
+			terminal: this.#reportExit.bind(this),
+			teardown: this.#emitter.destroy.bind(this.#emitter),
 		})
-		this.#reader = createInterface({ input: this.#child.stdout, crlfDelay: Infinity })
+		// The host delivers no output before this synchronous constructor returns, so framing attaches
+		// here without losing a byte the engine already spawned for.
+		this.#reader = createInterface({ input: this.#engine.stdout, crlfDelay: Infinity })
 		this.#reader.on('line', this.#push.bind(this))
 		this.#reader.once('close', this.#finish.bind(this))
-		this.#child.once('error', (cause: unknown) => this.#emitter.emit('error', cause))
-		this.#child.once('exit', this.#expire.bind(this))
-		this.#child.once('close', this.#close.bind(this))
-		this.#child.stdin.on('error', (cause: Error) => this.#failInputStream(cause))
-		this.#child.stderr.on('data', this.#retain.bind(this))
-		if (input !== undefined) {
-			this.#input += 1
-			this.#child.stdin.write(input, this.#completeInput.bind(this))
-		}
-		if (writable !== true) {
-			this.#input += 1
-			this.#child.stdin.end(this.#completeInput.bind(this))
-		}
-		if (signal !== undefined) {
-			this.#abort = this.#terminate.bind(this)
-			signal.addEventListener('abort', this.#abort, { once: true })
-			if (signal.aborted) void this.stop()
-		}
 	}
 
 	/** The host process id, fixed when construction returns, or `undefined` when the spawn produced none. */
 	get pid(): number | undefined {
-		return this.#child.pid
+		return this.#engine.pid
 	}
 
 	/** The exit code the host recorded, or `null` while the child has not exited and when a signal ended it. */
 	get code(): number | null {
-		return this.#child.exitCode
+		return this.#engine.code
 	}
 
 	/** The terminating signal name the host recorded, or `null` while the child has not exited and when it exited on its own. */
 	get signal(): string | null {
-		return this.#child.signalCode
+		return this.#engine.signal
 	}
 
 	/** The typed lifecycle observation surface. */
@@ -200,7 +116,7 @@ export class Process implements ProcessInterface {
 
 	/** The decoded byte-bounded stderr tail, frozen at the terminal moment. */
 	get evidence(): string {
-		return this.#tail.toString('utf8')
+		return this.#engine.evidence
 	}
 
 	/** True when the `lines` stream omitted output after a retention bound was reached. */
@@ -210,17 +126,17 @@ export class Process implements ProcessInterface {
 
 	/** True after the terminal moment arrived and `exit` settled. */
 	get settled(): boolean {
-		return this.#settled
+		return this.#engine.settled
 	}
 
 	/** True after termination began, including after the terminal moment. */
 	get stopping(): boolean {
-		return this.#stopping
+		return this.#engine.stopping
 	}
 
 	/** The terminal child state, observed once after stream close or the drain cutoff. */
 	get exit(): Promise<ProcessExit> {
-		return this.#exit.promise
+		return this.#engine.exit
 	}
 
 	/**
@@ -241,24 +157,7 @@ export class Process implements ProcessInterface {
 	 * @returns True when the host accepted the bytes without reporting a fault; false when the channel was closed, destroyed, ended, failed, or remained unconfirmed through `delivery`
 	 */
 	send(text: string): Promise<boolean> {
-		const stdin = this.#child.stdin
-		if (this.#settled || this.#stopping || this.#failure !== undefined || !stdin.writable) {
-			return Promise.resolve(false)
-		}
-		const settled = Promise.withResolvers<boolean>()
-		this.#writes.set(settled, undefined)
-		try {
-			stdin.write(`${text}\n`, this.#confirmWrite.bind(this, settled))
-		} catch {
-			this.#settleWrite(settled, false)
-			return settled.promise
-		}
-		if (this.#delivery > 0 && this.#writes.has(settled)) {
-			const timer = setTimeout(() => this.#settleWrite(settled, false), this.#delivery)
-			timer.unref()
-			this.#writes.set(settled, timer)
-		}
-		return settled.promise
+		return this.#engine.deliver(Buffer.from(`${text}\n`, 'utf8'))
 	}
 
 	/**
@@ -273,9 +172,7 @@ export class Process implements ProcessInterface {
 	 * @returns True when the child's native exit was observed; false when the confirmation deadline elapsed without it
 	 */
 	stop(): Promise<boolean> {
-		if (this.#termination !== undefined) return this.#termination
-		this.#termination = this.#kill()
-		return this.#termination
+		return this.#engine.stop()
 	}
 
 	/**
@@ -287,9 +184,7 @@ export class Process implements ProcessInterface {
 	 * @returns The stable barrier shared by every call
 	 */
 	destroy(): Promise<void> {
-		if (this.#ending !== undefined) return this.#ending
-		this.#ending = this.#end()
-		return this.#ending
+		return this.#engine.destroy()
 	}
 
 	#iterate(): AsyncIterator<string, void, void> {
@@ -335,8 +230,9 @@ export class Process implements ProcessInterface {
 		// With no consumer ever attached, retention stops at the mark and the stream keeps draining
 		// so the child can exit; a consumer attaching later receives the head, a gap, then the live
 		// stream.
-		const limit = this.#stopping ? this.#backlog * 2 : this.#backlog
-		if ((!this.#requested || this.#stopping) && this.#pending + bytes > limit) {
+		const stopping = this.#engine.stopping
+		const limit = stopping ? this.#backlog * 2 : this.#backlog
+		if ((!this.#requested || stopping) && this.#pending + bytes > limit) {
 			this.#truncated = true
 			return
 		}
@@ -346,7 +242,7 @@ export class Process implements ProcessInterface {
 	}
 
 	#restrain(): void {
-		if (this.#paused || this.#stopping || !this.#requested) return
+		if (this.#paused || this.#engine.stopping || !this.#requested) return
 		if (this.#pending < this.#backlog) return
 		this.#paused = true
 		this.#reader.pause()
@@ -354,7 +250,7 @@ export class Process implements ProcessInterface {
 
 	#relieve(): void {
 		if (!this.#paused || this.#ended) return
-		if (!this.#stopping && this.#pending > this.#backlog / 2) return
+		if (!this.#engine.stopping && this.#pending > this.#backlog / 2) return
 		this.#paused = false
 		this.#reader.resume()
 	}
@@ -369,108 +265,32 @@ export class Process implements ProcessInterface {
 		this.#waiters.length = 0
 	}
 
-	#retain(chunk: unknown): void {
-		if (!Buffer.isBuffer(chunk) || this.#settled) return
-		this.#tail = trimTail(Buffer.concat([this.#tail, chunk]), this.#evidence)
-		const text = this.#decoder.write(chunk)
-		if (text.length > 0) this.#emitter.emit('stderr', text)
-	}
-
-	#close(): void {
-		if (this.#settled) return
-		this.#settle(true)
+	// The engine publishes nothing itself, so each moment it hands over is republished here on this
+	// face's own typed event map. A generic `emit` cannot be bound to one event without collapsing
+	// its payload to the first member of the map.
+	#reportStderr(chunk: string): void {
+		this.#emitter.emit('stderr', chunk)
 	}
 
-	// A native exit does not close the read ends: a descendant that inherited them holds them open
-	// for its own remaining life, and one that never ends never closes them at all. Arming the same
-	// bounded wait a requested termination awaits is what makes every ending reach the terminal
-	// moment.
-	#expire(): void {
-		if (this.#settled) return
-		void this.#wait()
+	#reportFault(cause: unknown): void {
+		this.#emitter.emit('error', cause)
 	}
 
-	// One bounded wait per close, created once and shared: the native exit arms it and a termination
-	// awaits the same one, so a close never carries two overlapping bounds. `waitForClose` clears its
-	// own timer on either outcome. The constructor registers `#close` before this listener exists, so
-	// a natural close settles drained and the continuation below finds the latch already set.
-	#wait(): Promise<void> {
-		this.#waiting ??= waitForClose(this.#child, this.#drain).then(() => {
-			if (!this.#settled) this.#settle(false)
-		})
-		return this.#waiting
-	}
-
-	#settle(drained: boolean): void {
-		// Flush the decoder while the stderr event channel is still live.
-		const suffix = this.#decoder.end()
-		if (suffix.length > 0) this.#emitter.emit('stderr', suffix)
-		// Latch before the terminal value is resolved and delivered below, so a consumer handed that
-		// value never reads a child still reporting itself unfinished.
-		this.#settled = true
-		this.#removeAbortListener()
-		// Closing readline ends pending reads while preserving lines already framed and queued.
-		this.#reader.close()
-		const exit = Object.freeze({ code: this.code, signal: this.signal, drained })
-		this.#exit.resolve(exit)
+	#reportExit(exit: ProcessExit): void {
 		this.#emitter.emit('exit', exit)
-		// Release read handles only after every public pull surface is final.
-		this.#child.stdout.destroy()
-		this.#child.stderr.destroy()
 	}
 
-	#terminate(): void {
-		void this.stop()
-	}
-
-	#removeAbortListener(): void {
-		if (this.#signal === undefined || this.#abort === undefined) return
-		this.#signal.removeEventListener('abort', this.#abort)
-	}
-
-	#confirmWrite(settled: PromiseWithResolvers<boolean>, error?: Error | null): void {
-		if (error === undefined || error === null) {
-			this.#settleWrite(settled, true)
-			return
-		}
-		this.#failInputCallback(error)
-	}
-
-	#completeInput(): void {
-		this.#input -= 1
-	}
-
-	#settleWrite(settled: PromiseWithResolvers<boolean>, accepted: boolean): void {
-		if (!this.#writes.has(settled)) return
-		const timer = this.#writes.get(settled)
-		this.#writes.delete(settled)
-		clearTimeout(timer)
-		settled.resolve(accepted)
-	}
-
-	#settleWrites(): void {
-		for (const settled of this.#writes.keys()) this.#settleWrite(settled, false)
-	}
-
-	#failInputStream(cause: Error): void {
-		// `writableEnded` keeps a package-ended or consumer-ended channel quiet after its input phase
-		// settles. A `writable: true` channel never sets it until ended, so a later host fault remains
-		// classifiable after `#input` reaches zero.
-		if (this.#child.stdin.writableEnded || this.#input > 0) {
-			this.#settleWrites()
-			return
-		}
-		this.#failInputCallback(cause)
+	// Closing readline ends pending reads while preserving lines already framed and queued.
+	#closeReader(): void {
+		this.#reader.close()
 	}
 
-	#failInputCallback(cause: Error): void {
-		if (this.#failure !== undefined || this.#stopping) return
-		this.#failure = cause
-		this.#settleWrites()
-		this.#emitter.emit(
-			'error',
-			new ProcessError('The standard-input channel failed', { code: 'protocol', cause }),
-		)
+	// A paused stdout holds the child's own write, and therefore its exit. Bound the retained head,
+	// then release backpressure before the engine signals; later lines drop at the teardown cap
+	// instead of pausing the reader again.
+	#releaseBackpressure(): void {
+		this.#capBacklog()
+		this.#relieve()
 	}
 
 	#capBacklog(): void {
@@ -482,24 +302,4 @@ export class Process implements ProcessInterface {
 			this.#truncated = true
 		}
 	}
-
-	async #kill(): Promise<boolean> {
-		// A paused stdout holds the child's own write, and therefore its exit. Bound the retained head,
-		// then release backpressure before signalling; later lines drop at the teardown cap instead of
-		// pausing the reader again.
-		this.#stopping = true
-		this.#capBacklog()
-		this.#relieve()
-		const confirmed = await stopChild(this.#child, this.#grace, PROCESS_CONFIRMATION)
-		this.#settleWrites()
-		this.#child.stdin.destroy()
-		if (!this.#settled) await this.#wait()
-		if (!this.#settled) this.#settle(false)
-		return confirmed
-	}
-
-	async #end(): Promise<void> {
-		await this.stop()
-		this.#emitter.destroy()
-	}
 }
diff --git a/src/server/Supervisor.ts b/src/server/Supervisor.ts
new file mode 100644
index 0000000..3c7529d
--- /dev/null
+++ b/src/server/Supervisor.ts
@@ -0,0 +1,417 @@
+import type { ChildProcessWithoutNullStreams } from 'node:child_process'
+import type { Readable } from 'node:stream'
+import type { ProcessExit, ProcessOptions } from '@src/core'
+import { Buffer } from 'node:buffer'
+import { spawn } from 'node:child_process'
+import { StringDecoder } from 'node:string_decoder'
+import {
+	ProcessError,
+	PROCESS_CONFIRMATION,
+	PROCESS_DRAIN,
+	PROCESS_EVIDENCE,
+	PROCESS_GRACE,
+} from '@src/core'
+import {
+	buildSpawn,
+	mergeEnvironment,
+	snapshotCommand,
+	stopChild,
+	trimTail,
+	validateBytes,
+	validateCommand,
+	validateTimer,
+	validateWorkspace,
+	waitForClose,
+} from './helpers.js'
+
+/**
+ * Supervises one child process and reports each lifecycle moment to the face composing it.
+ *
+ * @remarks
+ * This is the engine every supervised-child face shares. It owns the eager spawn, the byte-bounded
+ * stderr tail and its decoded chunks, the standard-input channel and its bounded confirmation, the
+ * termination sequence, and the progression from the child's native exit through the bounded `drain`
+ * window to one terminal moment. It owns no output framing and no observation surface: a face
+ * attaches its own consumer to `stdout`, frames bytes however its contract promises, and owns the
+ * emitter and event map its consumers subscribe to.
+ *
+ * The child's ending and the supervision's ending are distinct. `pid`, `code`, and `signal` read the
+ * host child directly, so they expose native exit as soon as the host records it, and `ending`
+ * settles at that same moment. `settled`, `exit`, and `evidence` reach one terminal moment after the
+ * read channels close or the bounded `drain` window cuts them off. That window is armed by the
+ * child's native exit and by a termination this package initiated, so every way a child can end
+ * reaches the moment. The terminal routine hands the face its `close` and `terminal` moments before
+ * it destroys stdout and stderr, so a face's own pull surfaces are final while its read ends still
+ * exist.
+ *
+ * The face is a set of callbacks rather than an emitter, because each face publishes a different
+ * event map over the same moments. `chunk` and `fault` carry the live stderr text and the child or
+ * channel faults, `relieve` reports that a termination began so the face can release whatever
+ * backpressure it holds, `close` ends the face's read pipeline at the terminal moment, `terminal`
+ * carries the frozen {@link ProcessExit}, and `teardown` releases the face's own surface after the
+ * termination completes.
+ */
+export class Supervisor {
+	readonly #chunk: (text: string) => void
+	readonly #fault: (cause: unknown) => void
+	readonly #relieve: () => void
+	readonly #close: () => void
+	readonly #terminal: (exit: ProcessExit) => void
+	readonly #teardown: () => void
+	readonly #child: ChildProcessWithoutNullStreams
+	readonly #grace: number
+	readonly #drain: number
+	readonly #evidence: number
+	readonly #delivery: number
+	readonly #decoder = new StringDecoder('utf8')
+	readonly #exit = Promise.withResolvers<ProcessExit>()
+	readonly #ending = Promise.withResolvers<void>()
+	readonly #signal: AbortSignal | undefined
+	readonly #abort: EventListener | undefined
+	readonly #writes = new Map<
+		PromiseWithResolvers<boolean>,
+		ReturnType<typeof setTimeout> | undefined
+	>()
+	#tail: Buffer = Buffer.alloc(0)
+	// A guard reads `#stopping`, never `#termination !== undefined`. `#kill` assigns the boolean in
+	// its synchronous prefix, which runs while `stop` is still evaluating
+	// `this.#termination = this.#kill()`, so the boolean also covers the retention and backpressure
+	// decisions a face takes while `#termination` is still `undefined`.
+	#stopping = false
+	#settled = false
+	#input = 0
+	#failure: Error | undefined
+	#waiting: Promise<void> | undefined
+	#termination: Promise<boolean> | undefined
+	#destruction: Promise<void> | undefined
+
+	/**
+	 * Spawn one child process and begin standard-error capture.
+	 *
+	 * @remarks
+	 * The face's callbacks are captured before anything is read or spawned, so the first moment the
+	 * child can produce already has somewhere to go. `options` supplies the command, workspace,
+	 * termination, capture, and standard-input settings; a face's own settings, such as an output
+	 * retention bound, are read and validated by that face before it constructs this engine, so an
+	 * invalid one refuses construction while nothing has been spawned.
+	 *
+	 * @param options - Command, workspace, termination, capture, and stdin settings
+	 * @param face - The composing face's callbacks for each lifecycle moment
+	 * @throws A {@link ProcessError} coded `invalid` when an option or command string is malformed
+	 */
+	constructor(
+		options: ProcessOptions,
+		face: {
+			readonly chunk: (text: string) => void
+			readonly fault: (cause: unknown) => void
+			readonly relieve: () => void
+			readonly close: () => void
+			readonly terminal: (exit: ProcessExit) => void
+			readonly teardown: () => void
+		},
+	) {
+		this.#chunk = face.chunk
+		this.#fault = face.fault
+		this.#relieve = face.relieve
+		this.#close = face.close
+		this.#terminal = face.terminal
+		this.#teardown = face.teardown
+		// Every option and command property is read once, here, before anything is spawned. Reading a
+		// property runs the caller's own getter, so a read after the spawn would let that getter throw
+		// while a live child exists and no one holds a reference to it. Hoisting the reads is what
+		// makes a construction failure unable to strand a process.
+		const source = options.command
+		const workspace = options.workspace
+		const grace = options.grace
+		const drain = options.drain
+		const evidence = options.evidence
+		const delivery = options.delivery
+		const writable = options.writable
+		const signal = options.signal
+		const command = snapshotCommand(source)
+		const input = command.input
+		validateCommand(command)
+		validateWorkspace(workspace)
+		validateTimer(grace, "option 'grace'")
+		validateTimer(drain, "option 'drain'")
+		validateTimer(delivery, "option 'delivery'")
+		validateBytes(evidence, "option 'evidence'", 0)
+		this.#grace = grace ?? PROCESS_GRACE
+		this.#drain = drain ?? PROCESS_DRAIN
+		this.#evidence = evidence ?? PROCESS_EVIDENCE
+		this.#delivery = delivery ?? 0
+		this.#signal = signal
+		const childEnvironment = mergeEnvironment(command.isolated === true, command.environment)
+		const plan = buildSpawn(command, { workspace, environment: childEnvironment })
+		this.#child = spawn(plan.file, [...plan.arguments], {
+			cwd: workspace,
+			detached: process.platform !== 'win32',
+			env: childEnvironment,
+			stdio: ['pipe', 'pipe', 'pipe'],
+			windowsHide: true,
+			windowsVerbatimArguments: plan.verbatim,
+		})
+		this.#child.once('error', this.#fault)
+		this.#child.once('exit', this.#expire.bind(this))
+		this.#child.once('close', this.#complete.bind(this))
+		this.#child.stdin.on('error', this.#failInputStream.bind(this))
+		this.#child.stderr.on('data', this.#retain.bind(this))
+		if (input !== undefined) {
+			this.#input += 1
+			this.#child.stdin.write(input, this.#completeInput.bind(this))
+		}
+		if (writable !== true) {
+			this.#input += 1
+			this.#child.stdin.end(this.#completeInput.bind(this))
+		}
+		if (signal !== undefined) {
+			this.#abort = this.#terminate.bind(this)
+			signal.addEventListener('abort', this.#abort, { once: true })
+			if (signal.aborted) void this.stop()
+		}
+	}
+
+	/** The child's standard-output stream, for the composing face to attach its own consumer to. */
+	get stdout(): Readable {
+		return this.#child.stdout
+	}
+
+	/** The host process id, fixed when construction returns, or `undefined` when the spawn produced none. */
+	get pid(): number | undefined {
+		return this.#child.pid
+	}
+
+	/** The exit code the host recorded, or `null` while the child has not exited and when a signal ended it. */
+	get code(): number | null {
+		return this.#child.exitCode
+	}
+
+	/** The terminating signal name the host recorded, or `null` while the child has not exited and when it exited on its own. */
+	get signal(): string | null {
+		return this.#child.signalCode
+	}
+
+	/** The decoded byte-bounded stderr tail, frozen at the terminal moment. */
+	get evidence(): string {
+		return this.#tail.toString('utf8')
+	}
+
+	/** True after the terminal moment arrived and `exit` settled. */
+	get settled(): boolean {
+		return this.#settled
+	}
+
+	/** True after termination began, including after the terminal moment. */
+	get stopping(): boolean {
+		return this.#stopping
+	}
+
+	/**
+	 * The child's own ending, awaited without the terminal moment's drain window.
+	 *
+	 * @remarks
+	 * Never rejects, and resolves no value: `code` and `signal` carry the terminal facts as soon as
+	 * the host records them. It settles at the native exit, and at the terminal moment for a child
+	 * whose spawn produced no native exit at all, so it can never outlive the supervision.
+	 */
+	get ending(): Promise<void> {
+		return this.#ending.promise
+	}
+
+	/** The terminal child state, observed once after stream close or the drain cutoff. */
+	get exit(): Promise<ProcessExit> {
+		return this.#exit.promise
+	}
+
+	/**
+	 * Write raw bytes to the open standard-input channel.
+	 *
+	 * @remarks
+	 * Never rejects, and adds no framing: a face composes whatever terminator its contract promises
+	 * before it calls this. `true` means the host accepted the bytes without reporting a fault; it
+	 * does not prove that the child read them. An ordinary write settles when the kernel accepts it.
+	 * Only a full pipe can hold the write unconfirmed. The `delivery` option can bound that wait, and
+	 * every terminal teardown path settles pending writes. After `stop` or `destroy` begins, a later
+	 * call settles `false`, because teardown cannot confirm delivery for bytes it is about to
+	 * discard.
+	 *
+	 * @param bytes - The payload to write, already framed by the caller
+	 * @returns True when the host accepted the bytes without reporting a fault; false when the channel was closed, destroyed, ended, failed, or remained unconfirmed through `delivery`
+	 */
+	deliver(bytes: Uint8Array): Promise<boolean> {
+		const stdin = this.#child.stdin
+		if (this.#settled || this.#stopping || this.#failure !== undefined || !stdin.writable) {
+			return Promise.resolve(false)
+		}
+		const settled = Promise.withResolvers<boolean>()
+		this.#writes.set(settled, undefined)
+		try {
+			stdin.write(bytes, this.#confirmWrite.bind(this, settled))
+		} catch {
+			this.#settleWrite(settled, false)
+			return settled.promise
+		}
+		if (this.#delivery > 0 && this.#writes.has(settled)) {
+			const timer = setTimeout(() => this.#settleWrite(settled, false), this.#delivery)
+			timer.unref()
+			this.#writes.set(settled, timer)
+		}
+		return settled.promise
+	}
+
+	/**
+	 * Terminates the child process tree and reaches the terminal observation moment.
+	 *
+	 * @remarks
+	 * Never rejects, and every call shares one termination. After the termination sequence returns,
+	 * confirmed or not, it waits at most `drain` for the read channels to close, then cuts them off
+	 * and settles `exit` when they remain open. A cutoff reached before the native exit reports the
+	 * `code` and `signal` the host had recorded by then, which is `null` for a child still running.
+	 *
+	 * @returns True when the child's native exit was observed; false when the confirmation deadline elapsed without it
+	 */
+	stop(): Promise<boolean> {
+		if (this.#termination !== undefined) return this.#termination
+		this.#termination = this.#kill()
+		return this.#termination
+	}
+
+	/**
+	 * Stops the child and releases the composing face after the terminal state freezes.
+	 *
+	 * @remarks
+	 * Always resolves, including when termination was never confirmed. Every call shares one barrier.
+	 *
+	 * @returns The stable barrier shared by every call
+	 */
+	destroy(): Promise<void> {
+		if (this.#destruction !== undefined) return this.#destruction
+		this.#destruction = this.#end()
+		return this.#destruction
+	}
+
+	#retain(chunk: unknown): void {
+		if (!Buffer.isBuffer(chunk) || this.#settled) return
+		this.#tail = trimTail(Buffer.concat([this.#tail, chunk]), this.#evidence)
+		const text = this.#decoder.write(chunk)
+		if (text.length > 0) this.#chunk(text)
+	}
+
+	#complete(): void {
+		if (this.#settled) return
+		this.#settle(true)
+	}
+
+	// A native exit does not close the read ends: a descendant that inherited them holds them open
+	// for its own remaining life, and one that never ends never closes them at all. Arming the same
+	// bounded wait a requested termination awaits is what makes every ending reach the terminal
+	// moment. `ending` settles here rather than at that moment, because it reports the child's own
+	// exit and not the release of the channels a descendant may still hold.
+	#expire(): void {
+		this.#ending.resolve()
+		if (this.#settled) return
+		void this.#wait()
+	}
+
+	// One bounded wait per close, created once and shared: the native exit arms it and a termination
+	// awaits the same one, so a close never carries two overlapping bounds. `waitForClose` clears its
+	// own timer on either outcome. The constructor registers `#complete` before this listener exists,
+	// so a natural close settles drained and the continuation below finds the latch already set.
+	#wait(): Promise<void> {
+		this.#waiting ??= waitForClose(this.#child, this.#drain).then(() => {
+			if (!this.#settled) this.#settle(false)
+		})
+		return this.#waiting
+	}
+
+	#settle(drained: boolean): void {
+		// Flush the decoder while the face's stderr channel is still live.
+		const suffix = this.#decoder.end()
+		if (suffix.length > 0) this.#chunk(suffix)
+		// Latch before the terminal value is resolved and delivered below, so a consumer handed that
+		// value never reads a child still reporting itself unfinished.
+		this.#settled = true
+		this.#removeAbortListener()
+		// Ending the face's read pipeline here preserves whatever it has already framed and queued.
+		this.#close()
+		const exit = Object.freeze({ code: this.code, signal: this.signal, drained })
+		this.#exit.resolve(exit)
+		// A spawn that produced no child reports no native exit, so the terminal moment is the last
+		// place `ending` can settle rather than wait forever.
+		this.#ending.resolve()
+		this.#terminal(exit)
+		// Release read handles only after every pull surface is final.
+		this.#child.stdout.destroy()
+		this.#child.stderr.destroy()
+	}
+
+	#terminate(): void {
+		void this.stop()
+	}
+
+	#removeAbortListener(): void {
+		if (this.#signal === undefined || this.#abort === undefined) return
+		this.#signal.removeEventListener('abort', this.#abort)
+	}
+
+	#confirmWrite(settled: PromiseWithResolvers<boolean>, error?: Error | null): void {
+		if (error === undefined || error === null) {
+			this.#settleWrite(settled, true)
+			return
+		}
+		this.#failInputCallback(error)
+	}
+
+	#completeInput(): void {
+		this.#input -= 1
+	}
+
+	#settleWrite(settled: PromiseWithResolvers<boolean>, accepted: boolean): void {
+		if (!this.#writes.has(settled)) return
+		const timer = this.#writes.get(settled)
+		this.#writes.delete(settled)
+		clearTimeout(timer)
+		settled.resolve(accepted)
+	}
+
+	#settleWrites(): void {
+		for (const settled of this.#writes.keys()) this.#settleWrite(settled, false)
+	}
+
+	#failInputStream(cause: Error): void {
+		// `writableEnded` keeps a package-ended or consumer-ended channel quiet after its input phase
+		// settles. A `writable: true` channel never sets it until ended, so a later host fault remains
+		// classifiable after `#input` reaches zero.
+		if (this.#child.stdin.writableEnded || this.#input > 0) {
+			this.#settleWrites()
+			return
+		}
+		this.#failInputCallback(cause)
+	}
+
+	#failInputCallback(cause: Error): void {
+		if (this.#failure !== undefined || this.#stopping) return
+		this.#failure = cause
+		this.#settleWrites()
+		this.#fault(new ProcessError('The standard-input channel failed', { code: 'protocol', cause }))
+	}
+
+	async #kill(): Promise<boolean> {
+		// A paused stdout holds the child's own write, and therefore its exit. The face releases its
+		// backpressure before anything is signalled; later output drops at the face's teardown bound
+		// instead of pausing the stream again.
+		this.#stopping = true
+		this.#relieve()
+		const confirmed = await stopChild(this.#child, this.#grace, PROCESS_CONFIRMATION)
+		this.#settleWrites()
+		this.#child.stdin.destroy()
+		if (!this.#settled) await this.#wait()
+		if (!this.#settled) this.#settle(false)
+		return confirmed
+	}
+
+	async #end(): Promise<void> {
+		await this.stop()
+		this.#teardown()
+	}
+}
```
