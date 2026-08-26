# Unit L6-A report — the inspection bound contract in the types file

Done. The ruled `open` contract is in `src/core/types.ts` and the revised `@param` line is in
`src/core/factories.ts`. No deviation.

## 1. What changed in each owned file

`/home/user/lsp/src/core/types.ts`:

- Declared `LSPOpenOptions` between `LSPClientOptions` and `LSPClientInterface`, with one required
  `readonly signal: AbortSignal` member. Its member TSDoc carries the analyst's Contract prose: the
  already-aborted signal refuses the operation before `textDocument/didOpen` is written, and an
  abort after that notification rejects with an `LSPError` coded `aborted`.
- Changed the `open` member from `open(document: LSPTextDocumentItem)` to
  `open(document: LSPTextDocumentItem, options: LSPOpenOptions)`. The return type is unchanged at
  `Promise<readonly LSPDiagnostic[]>`. This is the behavioral delta: the options bag and its signal
  are required, so no caller can reach `open` without supplying a cancellation owner.
- Gave `open` a TSDoc block carrying the path selection, the `@param` for each argument, the
  returns line, one `@throws` pairing each condition with its code (`closed`, `duplicate`,
  `protocol`, `aborted`), and `@remarks` stating that the signal controls this operation only, does
  not destroy the client, is not bounded by the configured `timeout`, and leaves the URI owned
  until `close` succeeds when `textDocument/didOpen` was already written.
- Added member TSDoc on `LSPClientOptions.timeout`: it bounds initialize and shutdown requests and
  destroy-time exit-write and transport-close settlement, `Default: 30000`, and does not bound
  diagnostics requested by `open`.
- Added member TSDoc on `LSPClientOptions.signal`: it aborts the client, rejects its pending
  operations with an `LSPError` coded `aborted`, and begins destruction.
- Ancillary decision, taken and recorded: changed the `destroy` first sentence from "within the
  configured deadline" to "within the configured timeout", and left the `@remarks` uses of
  "deadline" unchanged. Reason: the first sentence used "deadline" as a synonym for the `timeout`
  option, which the one-concept-one-term law forbids after the revised `timeout` prose. The
  `@remarks` uses name the instant that duration fixes, which is a different thing from the
  duration; rewriting them would produce "At the timeout, the client emits a coded `timeout` error".

`/home/user/lsp/src/core/factories.ts`:

- Revised the `createLSPClient` `@param options` line from "The transport, workspace, deadline,
  abort signal, and initial event hooks." to "The transport, workspace, lifecycle timeout, abort
  signal, and initial event hooks." The rest of the sentence is unchanged. The line wraps at the
  100-column print width the formatter enforces.

No other file was touched. `git status --short` reports `M src/core/factories.ts` and
`M src/core/types.ts` and nothing else.

## 2. The full `git diff` of the owned files

```diff
diff --git a/src/core/factories.ts b/src/core/factories.ts
index 402cf10..3525ca2 100644
--- a/src/core/factories.ts
+++ b/src/core/factories.ts
@@ -4,7 +4,8 @@ import { LSPClient } from './LSPClient.js'
 /**
  * Creates a transport-agnostic Language Server Protocol client.
  *
- * @param options - The transport, workspace, deadline, abort signal, and initial event hooks.
+ * @param options - The transport, workspace, lifecycle timeout, abort signal, and initial event
+ * hooks.
  * @returns A client that initializes and drives the configured protocol peer.
  *
  * @example
diff --git a/src/core/types.ts b/src/core/types.ts
index 5460597..8e07e85 100644
--- a/src/core/types.ts
+++ b/src/core/types.ts
@@ -266,20 +266,60 @@ export interface LSPClientOptions {
 	readonly error?: EmitterErrorHandler
 	readonly transport: LSPTransportInterface
 	readonly workspace: LSPDocumentURI
+	/**
+	 * Bounds the initialize and shutdown requests and the destroy-time exit-write and
+	 * transport-close settlement, in milliseconds. Default: `30000`.
+	 *
+	 * @remarks
+	 * This value does not bound diagnostics requested by `open`. That wait is bounded by the signal
+	 * `LSPOpenOptions` requires.
+	 */
 	readonly timeout?: number
+	/**
+	 * Aborts the client, rejects its pending operations with an `LSPError` coded `aborted`, and
+	 * begins destruction.
+	 */
 	readonly signal?: AbortSignal
 }
 
+/** Configures a document inspection. */
+export interface LSPOpenOptions {
+	/**
+	 * Aborts the diagnostics wait without destroying the client.
+	 *
+	 * @remarks
+	 * An already-aborted signal refuses the operation before `textDocument/didOpen` is written. An
+	 * abort after that notification rejects the operation with an `LSPError` coded `aborted`.
+	 */
+	readonly signal: AbortSignal
+}
+
 /** Defines the document-oriented behavior exposed by an LSP client. */
 export interface LSPClientInterface {
 	readonly emitter: EmitterInterface<LSPClientEventMap>
 	readonly capabilities: LSPServerCapabilities | undefined
 	readonly encoding: LSPPositionEncoding | undefined
 	start(): Promise<void>
-	open(document: LSPTextDocumentItem): Promise<readonly LSPDiagnostic[]>
+	/**
+	 * Opens a document and waits for diagnostics through the path selected from the server
+	 * capabilities.
+	 *
+	 * @param document - The document identity, version, language, and text sent to the server.
+	 * @param options - The cancellation signal that bounds the diagnostics wait.
+	 * @returns A promise that resolves with the published or pulled diagnostics.
+	 * @throws An `LSPError`. Thrown when the client is not ready, coded `closed`; when the URI is
+	 * already open, coded `duplicate`; when the server does not support document open and close,
+	 * coded `protocol`; and when `options.signal` is already aborted or aborts before diagnostics
+	 * settle, coded `aborted`.
+	 * @remarks
+	 * The signal controls this operation only. It does not destroy the client, and the configured
+	 * `timeout` does not bound this wait. When `textDocument/didOpen` was written before
+	 * cancellation, the URI remains owned until `close` succeeds.
+	 */
+	open(document: LSPTextDocumentItem, options: LSPOpenOptions): Promise<readonly LSPDiagnostic[]>
 	close(uri: LSPDocumentURI): Promise<void>
 	/**
-	 * Tears down the client within the configured deadline.
+	 * Tears down the client within the configured timeout.
 	 *
 	 * @returns A promise that resolves after transport settlement and listener removal.
 	 * @remarks A close failure that settles before the deadline is emitted before the emitter is
```

Diffstat:

```text
 src/core/factories.ts |  3 ++-
 src/core/types.ts     | 44 ++++++++++++++++++++++++++++++++++++++++++--
 2 files changed, 44 insertions(+), 3 deletions(-)
```

## 3. The `npm run check` standing diagnostic list, verbatim

```text
> @orkestrel/lsp@0.0.1 check
> tsc --noEmit --project tsconfig.json && npm run check:src

tests/src/server/integration.test.ts(40,37): error TS2554: Expected 2 arguments, but got 1.
```

Exit code 2.

The list is shorter than the brief predicted, and the brief's prediction is what is wrong, not the
contract. The root `tsc` step short-circuits the `&&`, so I ran the two scoped checks it never
reached; both are clean:

```text
npx tsc --noEmit -p configs/src/tsconfig.core.json   → exit 0, no output
npx tsc --noEmit -p configs/src/tsconfig.server.json → exit 0, no output
```

Two predicted diagnostics did not appear, and each has a measured cause rather than an inferred one:

- `src/core/LSPClient.ts` reports nothing despite declaring `implements LSPClientInterface` at
  line 59 with a one-parameter `open`. TypeScript accepts a shorter parameter list where a longer
  one is declared, so the class satisfies the widened member unchanged. The measurement is the
  clean `check:src:core` run over a project that includes that file; the arity rule is my reading of
  why.
- Every `.open(` call site in `tests/src/core/LSPClient.test.ts` reports nothing. That suite binds
  the concrete class (`const client = new LSPClient({ … })`, first at line 179), whose own `open`
  still takes one parameter. `tests/src/server/integration.test.ts` binds the interface through
  `createLSPClient` at line 23, which is why its call site at line 40 is the only diagnostic.

The consequence for the next unit: widening `LSPClient.open` to the ruled signature will turn every
one of those class-bound call sites red at that moment, not at this one. `grep -rn "\.open(" tests/`
lists them in `tests/src/core/LSPClient.test.ts` at lines 316, 332, 361, 374, 402, 423, 434, 463,
492, 531, 533, 537, 562, 565, 634, 637, 688, 694, 803, 809, 842, 848, 877, 931, 976, 1004, 1028,
1032, 1056, 1310, 1319, and 1339, plus the `@example` fence in `src/core/LSPClient.ts` at line 50.

## 4. Scoped gate readings with exit codes

```text
npx oxfmt --check src/core/types.ts src/core/factories.ts
Checking formatting...

All matched files use the correct format.
Finished in 2ms on 2 files using 4 threads.
exit=0
```

```text
npx oxlint --deny-warnings src/core/types.ts src/core/factories.ts
exit=0
```

Oxlint prints nothing on a clean scoped run, so I ran a negative control to prove the reading is a
clean result rather than a silent no-op. The control is a throwaway file in my own scratchpad,
outside the repository tree, carrying a `debugger` statement:

```text
npx oxlint --config .oxlintrc.json --deny-warnings <scratchpad>/control.ts
<scratchpad>/control.ts:2:1: error eslint(no-debugger): `debugger` statement is not allowed help: Remove the debugger statement
exit=1
```

The control failed at the stage it was declared to fail at and was deleted after the run. The same
command with the repository config over the owned files also exits 0:

```text
npx oxlint --config .oxlintrc.json --deny-warnings src/core/types.ts src/core/factories.ts
exit=0
```

Coverage note: the control proves the command reports and exits nonzero on a rule violation in a
file it linted. It does not prove which rules the repository config enables over `src/core`.

One further read-only proof, run because my change adds a declaration to a centralized file:

```text
npm run test:policy
 Test Files  1 passed (1)
      Tests  93 passed (93)
```

## 5. Observations outside scope

- **L6-B, the client unit.** `src/core/LSPClient.ts` line 316 creates
  `AbortSignal.timeout(this.#timeout)` for the publication wait and line 343 does the same for every
  correlated request. Both are the paths the analyst's implementation boundary re-scopes. Line 106
  holds `options.timeout ?? 30_000`, the literal my `Default: 30000` prose names. The `@example`
  fence at `src/core/LSPClient.ts` line 50 calls `client.open({ … })` with one argument and is the
  only non-test call site the widened class signature will break.
- **L6-B, the pinned rows.** The delayed-success rows the analyst calls load-bearing have no
  counterpart in the tree at this commit. `tests/src/core/LSPClient.test.ts` binds the concrete
  class throughout, so those rows land red only after the class signature moves.
- **L6-D, the guide unit, with no gate behind it.** This workspace declares no `guides` project and
  has no `tests/guides.test.ts`; `npx vitest run --project guides` reports
  `No projects matched the filter "guides"`, and `ls tests/*.test.ts` returns `config`,
  `conformance`, `distribution`, `policy`, `setupConformance`, and `setupServer` only. So the
  parity drift `LSPOpenOptions` introduces is invisible to every gate in the tree. `guides/lsp.md`
  line 163 still reads "Configures transport, workspace, deadline, abort signal, and event hooks."
  and lines 50-51 still use "deadline" for the teardown bound. L6-D must add the `LSPOpenOptions`
  surface row and the revised `open` methods row by inspection, because nothing will fail if it
  does not.
- **L6-E, the probe unit.** Untouched here. `LSPOpenOptions` is reachable from the barrel:
  `src/core/index.ts` star-exports `./types.js`, so `LintStage` can import the type through
  `@src/core` without a further export row.
- **Unregistered, for whoever owns `constants.ts`.** The `30_000` default stays inline at
  `src/core/LSPClient.ts` line 106. The analyst recorded moving it to `constants.ts` as an
  observation outside the L6 ruling, and this unit did not move it.
