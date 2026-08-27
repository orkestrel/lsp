**Question:** How does `@orkestrel/process`'s supervised child spawn, consume stdout, and live — and what constrains a raw byte-chunk stream beside `lines`?

**Evidence**

**1. `ProcessInterface` / `Process` / `lines` / unread stdout**

`ProcessInterface` (`C:/Users/mikes/WebstormProjects/process/src/core/types.ts:203`):
- `pid` — host id, fixed at construction, or `undefined` if spawn produced none (`:205`)
- `code` / `signal` — host `exitCode` / `signalCode`; `null` while live (`:207–209`)
- `emitter` — typed `ProcessEventMap` surface (`:211`)
- `lines` — single-consumer `AsyncIterable<string>` of framed stdout, ends at the terminal moment (`:212–231`)
- `evidence` — decoded, byte-bounded stderr tail; frozen after the terminal moment (`:232–242`)
- `truncated` — `lines` omitted output at a retention bound (`:243–244`)
- `settled` — `exit` has settled; evidence frozen, `lines` ended (`:245–253`)
- `stopping` — monotonic; a termination was initiated (`:254–264`)
- `exit` — never-rejecting `Promise<ProcessExit>` (`:265–273`)
- `send` / `stop` / `destroy` — stdin write; tree stop; stop then destroy emitter (`:274–323`)

`Process` implements that contract (`Process.ts:62`). Public getters at `Process.ts:176–224`; methods at `:243`, `:275`, `:289`.

Constructor options: `ProcessOptions` (`types.ts:146–166`) — required `command`, `workspace`; optional `on` (`EmitterHooks<ProcessEventMap>`), `error` (`EmitterErrorHandler`), `grace`, `drain`, `evidence`, `backlog`, `delivery`, `writable`, `signal`. Guide table: `guides/process.md:278–292`.

`lines` implementation:
- `node:readline` `createInterface({ input: this.#child.stdout, crlfDelay: Infinity })` at spawn (`Process.ts:153`)
- `line` → `#push`; `close` → `#finish` (`:154–155`)
- Public `lines` is a frozen async iterable whose iterator is `#iterate` (`:142`, `:197–198`, `:295–307`)
- Framing: LF, CRLF, bare CR; split CRLF joins; trailing unterminated line on stdout close (`types.ts:216–220`; `process.md:266–270`)

Stdout is consumed **eagerly at spawn**, not at first `lines` read. The constructor attaches readline immediately (`Process.ts:153–155`). `#requested` stays `false` until the first `[Symbol.asyncIterator]` (`:295–297`). `#push` still runs (`:325`).

Unread stdout:
- No iterator ever requested: stdout keeps draining; retention stops at `backlog`; later framed lines drop and `truncated` becomes `true`; a late iterator gets retained head, a gap, then live stream (`types.ts:172–180`; `Process.ts:335–341`; `process.md:417–419`). Proven: `Process.test.ts:13–26`, `:28–43`.
- Iterator requested: pause at `backlog`, resume at half (`Process.ts:348–360`; `process.md:415–416`).
- Termination: pause released, never reapplied; cap is twice `backlog`; later lines dropped (`Process.ts:476–492`; `process.md:423–426`).

**2. Lifecycle**

Spawn uses `buildSpawn`. Options/command snapshotted and validated first (`Process.ts:107–131`); `mergeEnvironment` then `buildSpawn(command, { workspace, environment })` (`:143–144`); `spawn(plan.file, [...plan.arguments], { cwd, detached: platform !== 'win32', env, stdio: ['pipe','pipe','pipe'], windowsHide, windowsVerbatimArguments: plan.verbatim })` (`:145–152`). `buildSpawn` itself: `helpers.ts:435–438`.

Host events (`Process.ts:156–160`):
- child `error` → emit `error`
- child `exit` → `#expire` → `#wait` (`waitForClose` for `drain`) (`:388–401`)
- child `close` → `#close` → `#settle(true)` (`:379–382`)
- stdin `error` → `#failInputStream`
- stderr `data` → `#retain`

`#settle` (`:404–420`): flush `StringDecoder`, latch `#settled`, close readline, resolve `exit` + emit `exit`, then `stdout.destroy()` / `stderr.destroy()`.

`stop` (`:275–278`, `#kill` `:486–498`): one shared `#termination`. Sets `#stopping`, caps backlog, relieves pause, `stopChild(this.#child, this.#grace, PROCESS_CONFIRMATION)` (`helpers.ts:738–755`), settles pending writes, `stdin.destroy()`, then `#wait` / `#settle(false)` if still open.

`destroy` (`:289–293`, `#end` `:501–504`): `await this.stop()` then `#emitter.destroy()`.

`PROCESS_GRACE` = `5_000` (`constants.ts:1–2`). Used as default when `grace` omitted (`Process.ts:136`). POSIX cooperative window; unused on Windows (`types.ts:125–126`; `process.md:281–284`).

Stdin:
- `writable !== true` → `stdin.end` after optional constructor `input` (`Process.ts:161–168`)
- `writable: true` leaves the pipe open for `send` (`types.ts:162–163`)
- `send` writes `` `${text}\n` `` (`Process.ts:251`); `false` if settled/stopping/failed/not writable (`:245–246`)
- `delivery` bounds an unconfirmed write (`:160–161`, `:256–260`); `0` or omitted disables

Stderr:
- `stderr.on('data', #retain)` (`:160`)
- `#retain` (`:372–377`): keep `Buffer` tail via `trimTail(..., #evidence)`; `StringDecoder('utf8').write(chunk)` (`:71`); emit `stderr` with the decoded **string** when nonempty
- decoder `.end()` flushed as a last `stderr` event in `#settle` (`:406–407`)
- Live event is decoded text, not `Uint8Array`. `evidence` is `this.#tail.toString('utf8')` (`:202–204`)

**3. Generation / single-use / reconnect**

One child per instance. Spawn is the constructor (`Process.ts:102–107`, `:145`). No `start` / respawn member on `ProcessInterface` (`types.ts:203–324`) or `Process`. After the terminal moment, `lines` ends and `send` is `false`; nothing reopens the child.

A second supervised child is a new `Process` (or `createProcess`, `factories.ts:27–28`). `ProcessManager.launch` constructs `new Process(options)` (`ProcessManager.ts:182–184`); after that child settles it is evicted and the id is freed (`:191–196`), so a later `launch` under the same id is a **new** instance. A still-live id throws `duplicate` (`:117–118`).

`process.md` and `src/**` do not mention mcp, stdio transport, or reconnect. The guide’s reconnect-relevant fact is: `Process` supervises one child (`process.md:3–4`, `:264–266`).

**4. Byte-stream constraints**

Surfaces that exist today:
- Push: `ProcessEventMap` is `stderr` (string), `error`, `exit` only (`types.ts:112–119`). No stdout `chunk` event.
- Pull: `lines: AsyncIterable<string>` only (`:231`). No `AsyncIterable<Uint8Array>`.
- Raw bytes elsewhere: `execute` listens to `stdout`/`stderr` `data` and retains `Buffer` via `Retention` (`execute.ts:166–173`); `ExecuteInput` carries `Uint8Array` (`types.ts:372–374`). That path is one-shot capture, not `Process`.

Coexistence with `lines`:
- readline’s `input` **is** `this.#child.stdout` (`Process.ts:153`). There is no `PassThrough` / fork. Pause/resume is `#reader.pause()` / `#reader.resume()` (`:348–360`).
- The guide states readline frames every line a delivered chunk carries before a pause takes effect (`process.md:421–423`).
- `lines` and a second stdout consumer are not implemented; stdout has one consumer in this class.

No `ProcessOptions` key selects stdout handling (line vs bytes vs ignore). `backlog` only bounds the **line** queue (`types.ts:158–159`). `evidence` is stderr only (`:156–157`). `writable` is stdin only (`:162–163`).

**5. Event map / emitter / guide tables**

`Process` constructs `new Emitter<ProcessEventMap>({ on?, error? })` (`Process.ts:132–135`). Options type those as `EmitterHooks<ProcessEventMap>` and `EmitterErrorHandler` (`types.ts:147–148`). `destroy` destroys the emitter after stop (`Process.ts:501–504`). Guide: observe via `child.emitter.on` or the `on` option; `error` handler vs `error` event are distinct (`process.md:1024–1033`).

Guide shape for the class:
- **Surface** catalog: Entities row `Process` — “framed lines under a bounded backlog” (`process.md:63–70`); Types row `ProcessInterface` lists the readonly members (`:180`); Surface notes keep `pid`/`code`/`signal`/`emitter`/`lines`/`evidence`/`truncated`/`settled`/`stopping`/`exit` as Surface rows (`:203–208`).
- **Methods** table for `ProcessInterface`: `send`, `stop`, `destroy` only (`:235–247`).
- Event map table: `stderr(chunk)` · `error(cause)` · `exit(exit)` (`:1035–1037`).

**6. Tests**

Suite that drives `Process`: `tests/src/server/Process.test.ts` (`describe('Process')` at `:12`). Real children: `createProcess` + `childCommand` / `resolveChildFixture` from `tests/setupServer.ts:9–23`, fixture `tests/src/server/fixtures/child.mjs` (modes `chatty`, `empty`, `partial-line`, `evidence`, `unicode-evidence`, `echo`, `sleep`, `hang`, `trap`, `flood`, `orphan*`, `tree`, `exit`, …). Framing rows also spawn `process.execPath -e` inline (`Process.test.ts:97–166`).

Patterns a new stdout capability would sit beside: eager drain with no consumer (`:13`); backlog drop vs lossless pause (`:28`, `:63`); terminator / split-CRLF / CR redraw (`:97–166`); stderr live event vs bounded tail (`:168`); stdin `send` / `delivery` / `protocol` (`:218–397`); termination, drain cutoff, spawn fault (`:412+`); `invalid` option refusals (`:1448+`). Guide inventory: `process.md:1276–1289`.

Sibling suites: `ProcessManager.test.ts`, `Retention.test.ts`, `helpers.test.ts`, `execution/execute.test.ts`, `executeSync.test.ts`, `detach.test.ts`. Guide: `process.md:1229–1323`.

**7. `package.json`**

- Version `0.0.6` (`package.json:3`)
- Dependencies: `@orkestrel/contract` `^0.0.13`, `@orkestrel/emitter` `^0.0.8` (`:84–87`)
- `prepublishOnly`: `format:check` → `lint:check` → `check` → `build` → `test` → `test:distribution -- --mode release` (`:81`)

**Distillate**

`Process` is one eager spawn. Constructor pipes all three stdio, hands **stdout exclusively** to `readline`, and starts framing immediately. Unread stdout is still consumed: queued until `backlog`, then dropped (`truncated`), unless an iterator is attached — then the reader pauses. `lines` is `AsyncIterable<string>`; the emitter has no stdout bytes. Raw `Uint8Array` exists on the **execute** capture path (`data` + `Retention`), not on `Process`. Stderr is the only live byte-ish channel, and it is already decoded to `string` before `stderr` fires. There is no option that switches stdout from lines to chunks. A byte stream beside `lines` has no current hook: it would be a new `ProcessInterface` member and/or `ProcessEventMap` event, and it cannot attach to `this.#child.stdout` without replacing or forking the readline input the class already owns. One instance cannot respawn; reconnect is a new `Process`. mcp reconnect is not declared here.

**Unknowns**

- What `@orkestrel/mcp`’s stdio transport does on reconnect — not stated in process `src/**` or `guides/process.md`.
- Whether a `data` listener attached to the same `stdout` Readable beside readline would still see chunks in this Node line — the class never attaches one, so coexistence is unshown.

**Deviation**

None. Scope was process `src/**`, `guides/README.md`, `guides/process.md`, `tests/**` structure / Process suite, and `package.json`. Lsp was not read.
