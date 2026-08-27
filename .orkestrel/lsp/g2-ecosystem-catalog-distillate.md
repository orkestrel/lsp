## Question

What do `@orkestrel/contract`, `@orkestrel/test`, `@orkestrel/abort`, `@orkestrel/timeout`, `@orkestrel/websocket`, `@orkestrel/sse`, and `@orkestrel/tool` provide, and where does `@orkestrel/lsp` implement locally what one of them already exports?

## Evidence

Declarations live at each package’s `dist/src/{core,server}/index.d.ts` (not a top-level `dist/index.d.ts`). Versions on disk: `contract@0.0.13`, `emitter@0.0.8`, `process@0.0.6`, `test@0.0.11`, `abort@0.0.7`, `timeout@0.0.8`, `websocket@0.0.10`, `sse@0.0.5`, `tool@0.0.12`.

### 1. `@orkestrel/contract`

**Used by lsp today**

- Value imports: `holds`, `isBoolean`, `isInteger`, `isNumber`, `isRecord`, `isString` at `src/core/validators.ts:20`; `parseJSON` at `src/core/parsers.ts:10` (call `src/core/parsers.ts:264`); `holds`, `isError` at `src/core/errors.ts:2`.
- Tests: type `Guard` at `tests/setupConformance.ts:1`; `isRecord` at `tests/setupConformance.ts:30`.
- `holds` call sites: `src/core/validators.ts:30,41,60,79,99,116,127,138,149,160,201,222,242,255,273,289,309`; `src/core/errors.ts:39`.

**Surface (installed `contract/dist/src/core/index.d.ts`), grouped**

Guards (`is*`): `isNull`, `isUndefined`, `isDefined`, `isString`, `isNumber`, `isFiniteNumber`, `isInteger`, `isNonNegativeNumber`, `isNonNegativeInteger`, `isBoolean`, `isLiteralValue`, `isTrue`, `isFalse`, `isBigInt`, `isSymbol`, `isNullableString`, `isNullableNumber`, `isNullableBoolean`, `isObject`, `isRecord`, `isMap`, `isSet`, `isWeakMap`, `isWeakSet`, `isDate`, `isRegExp`, `isError`, `isPromise`, `isPromiseLike`, `isIterable`, `isAsyncIterable`, `isArrayBuffer`, `isSharedArrayBuffer`, `isArray`, `isDataView`, `isArrayBufferView`, typed-array `isInt8Array`…`isBigUint64Array`, `isFunction`, `isAsyncFunction`, `isGeneratorFunction`, `isAsyncGeneratorFunction`, `isConstructor`, `isInstance`, `isEmptyArray`/`isNonEmptyArray` and the Map/Set/Object/String empty/non-empty pair, `isJSONPrimitive`, `isJSONValue`, `isBoundedJSONValue`, `isBoundedJSONRecord`, `isContractError`, `isValidISOInstant`, `isZeroArg` and the async/generator variants.

Combinators (`*Of`): `arrayOf` (dense array, every element), `recordOf` (exact record, no extra keys), `objectOf` (open object, extra keys allowed), `literalOf`, `enumOf`, `unionOf`, `orOf`, `andOf`, `intersectionOf`, `tupleOf`, `mapOf`, `setOf`, `optionalOf`, `nullableOf`, `notOf`, `complementOf`, `whereOf`, `transformOf`, `lazyOf`, `keyOf`, `instanceOf`, `boundsOf`, `stringOf`.

Parsers: `parseJSON` (JSON.parse → `unknown` or `undefined`, never throws), `parseJSONAs`, `parseJSONValue`, `parseJSONValueField`, `parseString`/`parseNumber`/`parseInteger`/`parseBoolean`/`parseNull`/`parseArray`/`parseRecord`/`parseEnum` and each `*Field` variant, `resolveField`.

Outcome: `attempt` → `Result<T>` (`Success<T> | Failure<E>`), `holds` (predicate through `attempt`; only literal `true` passes), `contain`, `readValue`, `readSetEntries`.

Shape DSL: `createContract` / `ContractCompiler` compiling one `ContractShape` into schema / is / parse / audit / explain / generate; factories `stringShape`, `numberShape`, `integerShape`, `booleanShape`, `literalShape`, `arrayShape`, `objectShape`, `recordShape`, `unionShape`, `oneOfShape`, `nullableShape`, `jsonShape`, `rawShape`; `schemaToShape`, `valueToSchema`, `samplesToSchema`, clone/validate helpers, `ContractError` + `isContractError`.

**Unused exports that overlap lsp-local logic**

- `arrayOf` — unused. Local `Array.isArray` plus element loops: `src/core/validators.ts:175-179` (tags), `:182-185` (relatedInformation), `:204-207` (diagnostics), `:226-229` (items).
- `literalOf` — unused. Local `===` vocabularies: `jsonrpc === '2.0'` at `src/core/validators.ts:43,62,80`; severity `1|2|3|4` at `:163-167`; tags `1|2` at `:176-178`; `kind === 'unchanged'|'full'` at `:223-224`; sync `change` `0|1|2` at `:258-261`.
- `unionOf` — unused. Local string-or-number `id` at `src/core/validators.ts:44,84-86`; `textDocumentSync` numeral-or-options at `:292-296`.
- `recordOf` / `objectOf` — unused. Every validator is `isRecord` then `holds(() => field walks)` (`src/core/validators.ts:29-313`).
- `enumOf` — unused. Same closed numeric/string vocabularies as `literalOf` above.
- `attempt` / `Result` / `Success` / `Failure` — unused. Local throw/`try`/`catch`: `src/core/helpers.ts:19-26` (`JSON.stringify`); `src/core/parsers.ts:255-262` (`TextDecoder`); `src/core/LSPClient.ts:234-237,275`.
- `parseJSONAs` — unused. After `parseJSON`, local JSON-RPC guards: `src/core/parsers.ts:264-276`.
- `isArray` — unused beside native `Array.isArray` at the validator sites above.
- `holds` is already used; it is not unused overlap.

No lsp import of the shape DSL, `createContract`, or `ContractError`.

### 2. `@orkestrel/abort` and `@orkestrel/timeout`

lsp imports neither. Installed surfaces:

**abort** (`abort/dist/src/core/index.d.ts`): `Abort` / `AbortInterface` (own controller, `id`, `signal`, `aborted`, `abort(reason?)`); `AbortOptions`; `createAbort`; `isAbortSignal`; `linkSignal` (`AbortSignal.any([own, parent])`); `validateAbortOptions`.

**timeout** (`timeout/dist/src/core/index.d.ts`): `Timeout` / `TimeoutInterface` (`id`, `ms`, `signal`, `expired`, `start()`, `clear()`); `TimeoutOptions`; `createTimeout`; `isTimeoutDuration`; `isTimeoutSignal`; `MAX_TIMEOUT_MS`; `validateTimeoutOptions`. Parent abort clears the timer without aborting the timeout’s own signal.

**lsp-local equivalents**

- Deadline race: `AbortSignal.timeout(this.#timeout)` plus `Promise.race` in `#boundExit` (`src/core/LSPClient.ts:667-673`) and `#closeTransport` (`:678-687`). Same primitive at request bind (`:380`) and as TSDoc example (`:58`).
- Abort listener attach/remove: constructor client signal `addEventListener('abort', …, { once: true })` (`:130-131`), removed in teardown (`:659`); per-request `bound.addEventListener` (`:386-387`) / `pending.signal.removeEventListener` in `#settle` (`:611`); publication `signal.addEventListener` (`:353`) / `removeEventListener` in `#settlePublication` (`:601`).
- Signal composition: per-request uses caller `signal` **or** `AbortSignal.timeout`, not `linkSignal` / `AbortSignal.any` (`:380`). Client-level `#signal` is a separate listener (`:130`, `#abortClient` at `:638-641`).
- No `Timeout.start`/`clear` reuse; each deadline is a fresh `AbortSignal.timeout`. No `createAbort` id/trace handle.

### 3. `@orkestrel/websocket` and `@orkestrel/sse`

**websocket** — Node-only. Package `exports["."]` → `dist/src/server/index.d.ts`; `createNodeWebSocket` takes `node:stream` `Duplex`. One class, two modes: `key` present → server (writes `101`, unmasked frames); `key` omitted → client (no handshake, masked frames) (`NodeWebSocketOptions` at `websocket/dist/src/server/index.d.ts:270-281`, factory remarks `:23-29`). No browser/`WebSocket` host entry.

Transport-shaped members: `createNodeWebSocket` / `NodeWebSocket` / `NodeWebSocketInterface` (`send`, `ping`, `close`, `destroy`, `readyState`, `emitter`); events `open`, `message` (UTF-8 text), `close`, `error`, `ping`, `pong`; `signal` abort tears the socket; framing helpers `parseWebSocketFrame`, `encodeWebSocketFrame`, `computeWebSocketAccept`, `isWebSocketKey`, `isCloseCode`, opcode/close/ready constants. Text frames only on `send`/`message` (binary opcode exists as a constant).

**sse** — host-independent parser, no HTTP/EventSource client or server. `createSSEParser` / `SSEParser` / `SSEParserInterface`: `parse(chunk: string) → readonly SSEEvent[]`, `flush`, `reset`, sticky `id`/`retry`; `SSEEvent` (`data`, optional `event`/`id`/`retry`); `SSEError` / `isSSEError` (`OVERFLOW`); `BOM`, `NUL`. Feed string chunks; pair with `TextDecoder({ stream: true })` for bytes.

lsp has no import of either. Current byte transport is stdio `chunk: Uint8Array` (`src/server/transports/StdioTransport.ts:220-222`).

### 4. `@orkestrel/tool`

`tool/dist/src/core/index.d.ts`: `Tool` / `createTool` / `ToolInterface` (name, description, summary, parameters JSON Schema, `execute`); `ToolManager` / `createToolManager` / `ToolManagerInterface` (`add`, `tool`, `tools`, `definitions`, `execute` one-or-batch with per-call isolation, `remove`, `clear`, `count`); `ToolCall`, `ToolDefinition`, `ToolResult` = `ToolSuccess | ToolFailure` extending contract `Success`/`Failure`; `isToolCall`. lsp has no import.

### 5. `@orkestrel/test` (`.` and `/server`)

**Root** (`test/dist/src/core/index.d.ts`): `createRecorder`, `createRecorders`, `isRecorderMapComplete`, `createSignal`, `createResourceFactory`, `createTeardown`, `createHostileValues`, `waitForCondition`, `retryUntil`, `waitForEvent`, `waitForDelay`, `waitForAbort`, `captureError`, `requireValue`, `collect`, `collectStream`, `decodeJSONLines`, `roundTripJSON`, `invokeUnchecked`, `readProperty`, `flattenHeaders`, `resolveRoot`; types `WaitOptions`, `RetryOptions`, `RecorderInterface`, `EventSourceInterface`, `SignalInterface`, `TeardownInterface`, `JSONValue`, `JSONSafe`, `HeadersSource`.

**Server** (`test/dist/src/server/index.d.ts`): `createScratch`, `destroyScratch`, `isRunning`, `readInventory`, `createLoopback`, `createCookieJar`, `createLink`, `removeTree`, `requestUpgrade`, `waitForSocketClose`, `resolveContained`, `isExcluded`, `matchesIdentity`, `supportsBytes`, `supportsCase`, `supportsDirectoryLinks`, `supportsFileLinks`, `supportsMode`, `REMOVE_TREE_*`.

**lsp usage outside the three setup files** (context only): tests import `createRecorder`, `waitForDelay`, `waitForCondition`, `requireValue`, `createScratch`, `destroyScratch`, `isRunning`, `readInventory` directly.

**Those three setup files vs helpers**

- `tests/setup.ts:1-4` — uses `resolveRoot`; no other helper reimplemented.
- `tests/setupServer.ts:4-5` — uses `isRunning`, `waitForCondition`. `waitForReaped` (`:196-198`) composes them (`waitForCondition` + `!isRunning`); it does not replace either. `collectPeerMessages` (`:117-126`) drains `Uint8Array[]` through `parseLSPMessages` — not `collect` / `collectStream` (those drain `AsyncIterable` / `ReadableStream`).
- `tests/setupConformance.ts` — uses `Guard` and `isRecord` only from this family. Local `formatConformanceValue` JSON.stringify in try/catch (`:208-214`) overlaps `roundTripJSON`. Local `JSON.parse` of whole files (`:274,390,410,426`) overlaps `decodeJSONLines` only if the input were JSON Lines (it is not). Local `readProperty` (`:363`) is a metaModel structure lookup, not test’s `readProperty`. Throws `Error` (`:272,288`) rather than `requireValue`. Remaining root and server helpers have no equivalent in these three files. Browser `/browser` journey APIs are unused (lsp has no browser tests in scope).

### 6. `@orkestrel/emitter` and `@orkestrel/process`

**emitter — used:** `Emitter` at `src/core/LSPClient.ts:25,114` and `src/server/transports/StdioTransport.ts:5,43`; types `EmitterInterface`, `EmitterErrorHandler`, `EmitterHooks` at `src/core/types.ts:1`. Unused: `createEmitter`, `extractKeys`, `EventMap`, `EmitterHandler`, `EmitterOptions`. No lsp-local emitter or `Object.keys` stand-in found for those unused exports.

**process — used from `/server` only:** `buildSpawn`, `stopChild`, `waitForClose`, `waitForExit` at `src/server/transports/StdioTransport.ts:7` (calls `:169,177,184,192`).

**Unused process exports that overlap lsp-local logic**

- `createProcess` / `Process` / `ProcessInterface` — unused. `StdioTransport` spawns via `node:child_process.spawn` after `buildSpawn` (`src/server/transports/StdioTransport.ts:188-204`) and observes `stdout` `data` as raw bytes (`:210-222`). Comments at `:14-17` state the transport never frames and forwards host chunks unaltered.
- `Process.send` (line text) — unused. Local `send(bytes: Uint8Array)` writes the stdin pipe (`:127-136`).
- `Process.stop` / `destroy` — unused. Local `close` ends stdin, `waitForExit`, then `stopChild`, then `waitForClose` (`:166-185`).
- `mergeEnvironment` — unused. Local `env: { ...environment }` at spawn (`:203`).
- `ProcessManager` / `createProcessManager` — unused. Local single-child generation (`#child`, `#generation`, `#owner` at `:48-51,85-118,233-237`).
- `execute` / `executeSync` / `detach` / `Retention` — unused; no matching local one-shot or stream-head accumulator in `src/`.

**Additional: supervised child byte stream vs line stream**

Installed `@orkestrel/process` does **not** export a supervised child’s raw byte stream. Stdout is a **line** stream only: `ProcessInterface.lines` (`process/dist/src/core/index.d.ts:452`, `AsyncIterable<string>`), implemented on `Process.lines` (`process/dist/src/server/index.d.ts:413`). Framing is `readline` (guide `guides/process.md:266-271`). There is no `chunks` (or other `AsyncIterable<Uint8Array>` / `Buffer`) member on `ProcessInterface`.

Related, not a raw stdout byte stream: `ProcessEventMap.stderr` is `readonly [chunk: string]` — decoded stderr **text** (`process/dist/src/core/index.d.ts:360-362`). `Retention.retain` takes a `Buffer` for a bounded head (`process/dist/src/server/index.d.ts:719`), not a live child stdout iterable. `ExecuteResult.stdout` is a completed `string`.

That gap is why `StdioTransport` cannot consume `Process.lines` for LSP Content-Length framing.

## Distillate

- lsp already depends on `contract`, `emitter`, and `process` (plus `test` as a devDependency). It does not depend on `abort`, `timeout`, `websocket`, `sse`, or `tool`.
- Contract adoption in source is the primitive guards + `holds` + `parseJSON`. The combinators the validators re-encode by hand are `arrayOf`, `literalOf`, `unionOf`, `recordOf`/`objectOf`, and `enumOf`. Failure is `throw LSPError`, not `attempt`/`Result`.
- Abort/timeout overlap is native `AbortSignal.timeout` + `addEventListener`/`removeEventListener` + `Promise.race` in `LSPClient` teardown and pending/publication maps — the same jobs `Timeout` and `linkSignal` advertise, without those packages.
- WebSocket is a Node duplex wrapper (server and client modes of `NodeWebSocket`). SSE is a string-chunk parser. Tool is a JSON-Schema registry. None is referenced from lsp source.
- Test setup files reuse `resolveRoot`, `waitForCondition`, and `isRunning`. They do not reimplement the recorder/scratch/inventory family; `waitForReaped` wraps the two server waits.
- Emitter unused exports do not duplicate lsp-local code. Process unused `Process`/`createProcess` **do**: `StdioTransport` is a raw-byte stdio supervisor. `ProcessInterface.lines` is line-framed strings; LSP needs unaltered `Uint8Array` chunks.

## Unknowns

- Whether `arrayOf`/`recordOf`/`literalOf` would accept lsp’s optional-field and sparse-union shapes without extra `optionalOf`/`unionOf` wrapping was not typechecked.
- Whether `@orkestrel/websocket`’s text-only `send`/`message` can carry LSP binary frames was not exercised (LSP stdio is bytes; WebSocket `send` is `string`).
- Nested copies (`process` pins `emitter@0.0.7`; `abort` pins `contract@0.0.12`) were not compared to the hoisted `emitter@0.0.8` / `contract@0.0.13` surfaces beyond the package names.

## Deviation

None. Guides and installed `index.d.ts` files were readable; overlap search stayed inside `src/**` and `tests/**`.
