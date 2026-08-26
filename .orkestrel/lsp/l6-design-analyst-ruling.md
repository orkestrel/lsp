I’ll inspect the required contract, rules, brief, and cited evidence, then return only the brief’s requested ruling.
The evidence confirms that `open` is the only operation whose work budget belongs to the caller. I’m checking the consumer’s existing signal path and the client’s pending-entry mechanics so the signature and failure codes are implementable as stated.
## Ruling

Adopt a required per-`open` options bag with a required `AbortSignal`. Remove the constructor timeout from push and pull diagnostic waits.

```ts
/** Configures a document inspection. */
export interface LSPOpenOptions {
	/**
	 * Aborts the diagnostics wait without destroying the client.
	 *
	 * @remarks
	 * An already-aborted signal refuses the operation before `textDocument/didOpen` is written.
	 * An abort after that notification rejects the operation with an `LSPError` coded `aborted`.
	 */
	readonly signal: AbortSignal
}

export interface LSPClientInterface {
	readonly emitter: EmitterInterface<LSPClientEventMap>
	readonly capabilities: LSPServerCapabilities | undefined
	readonly encoding: LSPPositionEncoding | undefined
	start(): Promise<void>
	open(
		document: LSPTextDocumentItem,
		options: LSPOpenOptions,
	): Promise<readonly LSPDiagnostic[]>
	close(uri: LSPDocumentURI): Promise<void>
	destroy(): Promise<void>
}
```

`LSPOpenOptions` follows the sibling `MCPCallOptions` and `MCPListenOptions` precedent. The bag and `signal` must be required. An optional signal with no fallback permits an accidental permanent wait. An optional signal with the existing timeout preserves the deadline race.

The diagnostic wait has no client-level default bound. The required signal makes its owner explicit. `LSPClientOptions.timeout`, still defaulting to `30_000`, continues to govern lifecycle requests and teardown settlement. Moving that default into `constants.ts` remains a registered observation, not part of this ruling.

## Contract prose

Add this block to `LSPOpenOptions`:

> Configures a document inspection.
>
> `signal` aborts the diagnostics wait without destroying the client. An already-aborted signal refuses the operation before `textDocument/didOpen` is written. An abort after that notification rejects the operation with an `LSPError` coded `aborted`.

Add this block to `LSPClientInterface.open`:

> Opens a document and waits for diagnostics through the path selected from the server capabilities.
>
> `document` is the document identity, version, language, and text sent to the server. `options` supplies the required cancellation signal for the diagnostics wait.
>
> Returns the published or pulled diagnostics.
>
> Throws an `LSPError` coded `closed` when the client is not ready, `duplicate` when the URI is already open, `protocol` when the server does not support document open and close, and `aborted` when `options.signal` is already aborted or aborts before diagnostics settle.
>
> The signal controls this operation only. It does not destroy the client. The constructor timeout does not bound this wait. When `textDocument/didOpen` was written before cancellation, the URI remains owned until `close` succeeds.

Revise `LSPClientOptions.timeout` to say:

> Milliseconds allowed for initialize and shutdown requests and for destroy-time exit-write and transport-close settlement. Default: 30,000 ms. This value does not bound diagnostics requested by `open`.

Retain `LSPClientOptions.signal`, but state its distinct scope:

> Aborts the client, rejects its pending operations with an `LSPError` coded `aborted`, and begins destruction.

Revise the `LSPClient` example so every `open` supplies a signal and closes the admitted URI:

```ts
const signal = AbortSignal.timeout(30_000)
const uri = 'file:///workspace/main.ts'

const diagnostics = await client.open(
	{
		uri,
		languageId: 'typescript',
		version: 1,
		text: 'const value = 1',
	},
	{ signal },
)
await client.close(uri)
```

Revise `createLSPClient`’s `@param options` prose from “deadline” to “lifecycle timeout.”

## Implementation boundary

`LSPClient` must change these paths:

- `open` accepts `LSPOpenOptions`, refuses an already-aborted signal before claiming the URI, and passes the signal into the selected diagnostics path.
- `#openPush` registers the caller signal instead of creating `AbortSignal.timeout(this.#timeout)`.
- `#openPull` passes the caller signal to the correlated diagnostic request.
- The request machinery distinguishes lifecycle timeout settlement from caller abort settlement. Diagnostic cancellation rejects with `aborted`; initialize and shutdown expiry reject internally with `timeout`.
- A canceled pull request writes `$/cancelRequest` while the generation remains ready.
- Publication and pending-request records retain the signal and listener needed for deterministic removal at settlement.
- Caller abort removes only the affected publication or request. It does not invoke `#abortClient`.
- Caller abort does not delete the opened URI. This preserves the existing ownership rule and lets `close(uri)` send `textDocument/didClose`.
- `#request` calls for initialize and shutdown keep the constructor timeout.
- `#boundExit` and `#closeTransport` keep the constructor timeout.
- `close(uri)` remains unchanged. It is a notification write, not a correlated request, and the current implementation gives it no constructor-timeout deadline.

## Failure modes

| Path | Caller signal abort | Client-owned bound | Teardown |
| --- | --- | --- | --- |
| Push diagnostics | Rejects `open` with `aborted`; removes the publication listener; leaves the client ready and URI closeable | None | Direct `destroy` rejects the pending wait with `closed`; constructor-signal abort rejects it with `aborted` |
| Pull diagnostics | Rejects `open` with `aborted`; writes `$/cancelRequest` when ready; leaves the client ready and URI closeable | None | Direct `destroy` rejects the pending request with `closed`; constructor-signal abort rejects it with `aborted` |
| Initialize | Per-open signal does not apply | Request rejects with `timeout` | Failed startup releases the generation |
| Shutdown | Per-open signal does not apply | Internal request rejects with `timeout`; teardown absorbs that refusal and continues | Exit and transport close still run |
| Exit write settlement | Per-open signal does not apply | Wait ends at `LSPClientOptions.timeout` | Teardown proceeds to transport close |
| Transport close settlement | Per-open signal does not apply | Emits `timeout` before emitter destruction | `destroy` resolves after cleanup |
| `close(uri)` | Per-open signal does not apply | No deadline in the current contract | A refused write rejects with `closed` |

## Pinned rows

The LSP suite must pin:

- `refuses an already-aborted open before writing document open`
- `aborts a pushed diagnostic wait without destroying the client`
- `keeps a push-aborted document closeable`
- `aborts a pulled diagnostic request and writes cancellation`
- `keeps a pull-aborted document closeable`
- `resolves pushed diagnostics after the constructor timeout has elapsed`
- `resolves pulled diagnostics after the constructor timeout has elapsed`
- `isolates a call abort from another pending open`
- Existing `does not cancel an initialize request at its deadline`
- Existing `closes after the bounded shutdown fallback`
- Existing `bounds an exit write that never settles`
- Existing `emits a close deadline error before destroying the emitter`

The delayed-success rows are load-bearing. Caller-abort rows alone do not prove that the constructor timeout stopped governing diagnostics.

The Orchestrator should run:

```text
npm run test:src:core -- tests/src/core/LSPClient.test.ts
```

## Guide parity

Update `guides/lsp.md` so:

- The lifecycle section distinguishes the lifecycle timeout, the client-wide abort signal, and the required per-open signal.
- The client example passes `{ signal }` and closes the URI.
- The methods table uses `open(document: LSPTextDocumentItem, options: LSPOpenOptions): Promise<readonly LSPDiagnostic[]>`.
- The surface table exports `LSPOpenOptions`.
- `LSPClientOptions` is described as configuring transport, workspace, lifecycle timeout, client abort, and hooks.
- No row calls `timeout` an undifferentiated diagnostics deadline.

## Probe rewiring

The probe must pass the coordinator’s already-armed deadline signal into `LintStage`, then into:

```ts
client.open(document, { signal })
```

Do not create another `AbortSignal.timeout` inside `LintStage`. That would restore racing owners.

The current probe contract cannot perform this as a local call-site edit. `Probe.#bound` accepts an already-started `Promise`, constructs its timeout afterward, and `StageInterface.inspect` has no signal seam. The probe unit must therefore:

- Arm the coordinator timeout before starting the lint inspection.
- Pass an operation handler into `#bound`, allowing the bound to supply its signal when it invokes `LintStage.inspect`.
- Add a types-first signal seam for the lint inspection without pretending unsupported stages honor cancellation.
- Abort with, or translate back to, the coordinator’s existing `ProbeError` carrying `code: 'deadline'`, `stage: 'lint'`, and the configured deadline. An `LSPError` must not replace the coordinator refusal.
- Keep `LintStage`’s `timeout: 2000` for initialize, shutdown, exit settlement, and transport-close settlement.
- Remove prose that says the client’s timeout bounds diagnostics.

The probe acceptance run is:

```text
npx vitest run --project src:server tests/src/server/Probe.test.ts tests/src/server/stages/LintStage.test.ts
```

It must restore:

- `replaces a lint stage its deadline destroyed`
- `names arming in a boot expiry and arms again for the next claim`
- The coordinator refusal `The lint stage exceeded 6000 ms`
- A later claim passing through the replacement stage

## Rejected candidates

| Candidate | Rejection cost |
| --- | --- |
| Grouped constructor request and diagnostics bounds | A reusable client still owns caller policy. It cannot express independent budgets for concurrent opens, and matching the coordinator deadline creates competing timers and competing error ownership. |
| External `Promise.race` followed by `destroy()` | Cancellation destroys the shared client, drains unrelated work, changes the failure to client closure, and forces every consumer to reproduce document and request cleanup. Without destruction, the client retains the pending publication or request. |
| Optional per-open signal with the existing diagnostics timeout | The old conflation remains. Equal deadlines race, and the observed error depends on scheduling. |
| Optional per-open signal with no fallback | An omitted option silently creates an operation with no cancellation path. That contradicts the required-signal precedent for an event wait whose peer may stay silent. |
| Required signal plus a client diagnostics fallback | The fallback gives the wait competing owners again. The required signal already supplies the complete bound. |
