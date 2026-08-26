# Unit L6-D report — the inspection bound in the guide

`guides/lsp.md` states the ruled contract. Every item of the analyst's Guide parity list closes on a
named line of the diff, `npx oxfmt --check guides/lsp.md` exits 0, and the tree carries no
modification outside the owned file and the standing `src/core` entries. No deviation.

## What changed

### `## Client lifecycle` — the scope split

A paragraph lands after the ready-generation paragraph and before the factory example. It carries
the parity list's first item: the lifecycle `timeout`, the client-wide `signal`, and the required
per-open `signal`, each with its scope. Added text, verbatim:

> The lifecycle bound, the client abort, and the per-open abort have separate scopes. The `timeout`
> option bounds the initialize and shutdown requests and the destroy-time exit-write and
> transport-close settlement, and `30000` milliseconds applies when it is absent. The `signal`
> option on `LSPClientOptions` aborts the client, rejects its pending operations with an `LSPError`
> coded `aborted`, and begins destruction. `LSPOpenOptions` requires its own `signal` member on
> every `open()` call, and that signal bounds that call's diagnostics wait alone. The client refuses
> a call whose signal is already aborted, before writing `textDocument/didOpen`. An abort after that
> notification rejects the call with an `LSPError` coded `aborted`, leaves the client ready, and
> leaves the document owned until `close()` succeeds. The `timeout` option does not bound a
> diagnostics wait. Arm the signal you pass to `open()` to bound one.

Each sentence tracks a ruling clause: the `timeout` re-scope from § Contract prose, the retained
`LSPClientOptions.signal` scope from the same section, the already-aborted refusal and the
post-notification rejection from the `LSPOpenOptions` block, and the retained URI ownership from the
`open` block. The wording is mine; the content is the analyst's.

### `## Client lifecycle` — the example fence

The fence takes the analyst's revised shape. It arms `AbortSignal.timeout(30_000)` in the caller,
binds `uri` so the same value reaches `open` and `close`, passes the options bag as the second
argument, and closes the admitted URI before `destroy()`. The import stays `@orkestrel/lsp`.

### `## Transport seam` — the retained "deadline"

The teardown sentences keep the word where it names the instant the `timeout` duration fixes, and
the sentence that sets that instant now names the duration: `bounds exit and close settlement` reads
`bounds exit and close settlement by the `timeout` option`, and `before the deadline` reads
`before that deadline`. This closes the parity list's last item for the passage the brief named at
guide lines 50-51: the section describes transport-close settlement, which `timeout` still governs,
so the vocabulary matches the split L6-A recorded for the `destroy` TSDoc rather than dropping the
word.

### `## Methods` — the `open` row

The signature cell reads
`open(document: LSPTextDocumentItem, options: LSPOpenOptions): Promise<readonly LSPDiagnostic[]>`.
The behavior cell moves from `Opens a document and resolves its pull or push diagnostics.` to
`Opens a document and waits for diagnostics under the required `options` signal.`, so no row in the
table describes the wait as bounded by anything the caller does not supply. Every cell in the table
is re-padded to the widened signature column; the row bytes are equal-width and the formatter reads
the file clean.

### `## Surface` — the client table

The `LSPClientOptions` row moves from `Configures transport, workspace, deadline, abort signal, and
event hooks.` to `Configures transport, workspace, lifecycle timeout, client abort, and event
hooks.`. An `LSPOpenOptions` row lands beneath it reading `Configures a document inspection with the
signal that bounds its diagnostics wait.`, placed with the client's other configuration contract
rather than at the table's end.

## The diff

```diff
diff --git a/guides/lsp.md b/guides/lsp.md
index 004a8d3..14df9a0 100644
--- a/guides/lsp.md
+++ b/guides/lsp.md
@@ -14,6 +14,17 @@ The client accepts `open()` and `close()` only during a ready generation. A dead
 wire writes with an `LSPError` whose `code` property is `closed`. During teardown, the client sends
 `shutdown`, then permits only `exit` on an initialized generation that has not exited.
 
+The lifecycle bound, the client abort, and the per-open abort have separate scopes. The `timeout`
+option bounds the initialize and shutdown requests and the destroy-time exit-write and
+transport-close settlement, and `30000` milliseconds applies when it is absent. The `signal` option
+on `LSPClientOptions` aborts the client, rejects its pending operations with an `LSPError` coded
+`aborted`, and begins destruction. `LSPOpenOptions` requires its own `signal` member on every
+`open()` call, and that signal bounds that call's diagnostics wait alone. The client refuses a call
+whose signal is already aborted, before writing `textDocument/didOpen`. An abort after that
+notification rejects the call with an `LSPError` coded `aborted`, leaves the client ready, and
+leaves the document owned until `close()` succeeds. The `timeout` option does not bound a
+diagnostics wait. Arm the signal you pass to `open()` to bound one.
+
 Use the published client factory with any transport that implements the byte seam:
 
 ```ts
@@ -24,12 +35,20 @@ declare const transport: LSPTransportInterface
 
 const client = createLSPClient({ transport, workspace: 'file:///workspace' })
 await client.start()
-const diagnostics = await client.open({
-	uri: 'file:///workspace/main.ts',
-	languageId: 'typescript',
-	version: 1,
-	text: 'const value = 1',
-})
+
+const signal = AbortSignal.timeout(30_000)
+const uri = 'file:///workspace/main.ts'
+
+const diagnostics = await client.open(
+	{
+		uri,
+		languageId: 'typescript',
+		version: 1,
+		text: 'const value = 1',
+	},
+	{ signal },
+)
+await client.close(uri)
 await client.destroy()
 ```
 
@@ -46,10 +65,10 @@ Each accepted `start()` call opens a generation, and an implementation emits `ch
 obligation.
 
 The client also defends against a foreign transport that throws synchronously. It converts a send
-fault into a coded `LSPError`, bounds exit and close settlement, and removes transport listeners
-during teardown. A close failure that settles before the deadline is emitted before the client
-destroys its emitter. At the deadline, the client emits an `LSPError` coded `timeout` and absorbs
-the later close outcome.
+fault into a coded `LSPError`, bounds exit and close settlement by the `timeout` option, and removes
+transport listeners during teardown. A close failure that settles before that deadline is emitted
+before the client destroys its emitter. At the deadline, the client emits an `LSPError` coded
+`timeout` and absorbs the later close outcome.
 
 ## Stdio transport
 
@@ -126,12 +145,12 @@ form matching the client's advertised capability.
 
 The client interface exposes these behavioral methods:
 
-| Method    | Signature                                                                | Behavior                                                                                 |
-| --------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
-| `start`   | `start(): Promise<void>`                                                 | Starts or restarts a transport generation and completes its initialize handshake.        |
-| `open`    | `open(document: LSPTextDocumentItem): Promise<readonly LSPDiagnostic[]>` | Opens a document and resolves its pull or push diagnostics.                              |
-| `close`   | `close(uri: LSPDocumentURI): Promise<void>`                              | Notifies the peer that an owned document closed.                                         |
-| `destroy` | `destroy(): Promise<void>`                                               | Drains work, performs bounded protocol and transport teardown, and destroys the emitter. |
+| Method    | Signature                                                                                         | Behavior                                                                                 |
+| --------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
+| `start`   | `start(): Promise<void>`                                                                          | Starts or restarts a transport generation and completes its initialize handshake.        |
+| `open`    | `open(document: LSPTextDocumentItem, options: LSPOpenOptions): Promise<readonly LSPDiagnostic[]>` | Opens a document and waits for diagnostics under the required `options` signal.          |
+| `close`   | `close(uri: LSPDocumentURI): Promise<void>`                                                       | Notifies the peer that an owned document closed.                                         |
+| `destroy` | `destroy(): Promise<void>`                                                                        | Drains work, performs bounded protocol and transport teardown, and destroys the emitter. |
 
 ### `LSPTransportInterface`
 
@@ -160,7 +179,8 @@ The client surface provides these entities and configuration contracts:
 | `LSPClient`             | Implements the document-oriented client.                                                          |
 | `createLSPClient`       | Creates an `LSPClientInterface` from `LSPClientOptions`.                                          |
 | `LSPClientInterface`    | Defines the readonly `emitter`, `capabilities`, and `encoding` properties and the client methods. |
-| `LSPClientOptions`      | Configures transport, workspace, deadline, abort signal, and event hooks.                         |
+| `LSPClientOptions`      | Configures transport, workspace, lifecycle timeout, client abort, and event hooks.                |
+| `LSPOpenOptions`        | Configures a document inspection with the signal that bounds its diagnostics wait.                |
 | `LSPClientEventMap`     | Maps client notifications, exits, and errors to listener arguments.                               |
 | `LSPClientLifecycle`    | Describes lifecycle ownership and transport generations.                                          |
 | `LSPClientCapabilities` | Describes the capabilities advertised during initialization.                                      |
```

## The parity reading

Every backticked token in the revised guide resolves. The instrument extracted each backticked
identifier from the guide with `grep -o '`[A-Za-z_][A-Za-z0-9_.]*`' guides/lsp.md`, extracted each
exported declaration name from `src/core/*.ts` and `src/server/**/*.ts`, and compared the two sets
with `comm`. Its coverage is the identifier population that pattern admits: it reads a token
containing letters, digits, underscores, and dots, so a token carrying a slash — `textDocument/didOpen`,
`$/cancelRequest` — falls outside it and is ruled by hand in the following list.

Tokens that resolve to a source export, confirmed by the set intersection: `JSONRPCError`,
`JSONRPCErrorResponse`, `JSONRPCId`, `JSONRPCMessage`, `JSONRPCNotification`, `JSONRPCRequest`,
`JSONRPCResponse`, `JSONRPCResultResponse`, `JSONRPC_INTERNAL_ERROR`, `JSONRPC_INVALID_PARAMS`,
`JSONRPC_INVALID_REQUEST`, `JSONRPC_METHOD_NOT_FOUND`, `JSONRPC_PARSE_ERROR`, `LSPClient`,
`LSPClientCapabilities`, `LSPClientEventMap`, `LSPClientInterface`, `LSPClientLifecycle`,
`LSPClientOptions`, `LSPCodeDescription`, `LSPDecodeState`, `LSPDiagnostic`, `LSPDiagnosticOptions`,
`LSPDiagnosticRelated`, `LSPDiagnosticSeverity`, `LSPDiagnosticTag`, `LSPDocumentDiagnosticParams`,
`LSPDocumentDiagnosticReport`, `LSPDocumentURI`, `LSPError`, `LSPErrorCode`, `LSPErrorContext`,
`LSPErrorOptions`, `LSPExit`, `LSPIdentity`, `LSPInitializeParams`, `LSPInitializeResult`,
`LSPLocation`, `LSPOpenOptions`, `LSPPosition`, `LSPPositionEncoding`,
`LSPPublishDiagnosticsParams`, `LSPRange`, `LSPServerCapabilities`, `LSPTextDocumentIdentifier`,
`LSPTextDocumentItem`, `LSPTextDocumentSync`, `LSPTextDocumentSyncKind`,
`LSPTextDocumentSyncOptions`, `LSPTransportEventMap`, `LSPTransportInterface`, `LSP_CONTENT_LIMIT`,
`LSP_CONTENT_MODIFIED`, `LSP_ENCODINGS`, `LSP_HEADER_LIMIT`, `LSP_METHODS`, `LSP_REQUEST_CANCELLED`,
`LSP_REQUEST_FAILED`, `LSP_SERVER_CANCELLED`, `StdioTransport`, `StdioTransportOptions`,
`createLSPClient`, `createStdioTransport`, `encodeLSPMessage`, `isJSONRPCError`,
`isJSONRPCNotification`, `isJSONRPCRequest`, `isJSONRPCResponse`, `isLSPCodeDescription`,
`isLSPDiagnostic`, `isLSPDiagnosticOptions`, `isLSPDiagnosticRelated`,
`isLSPDocumentDiagnosticReport`, `isLSPError`, `isLSPIdentity`, `isLSPInitializeResult`,
`isLSPLocation`, `isLSPPosition`, `isLSPPublishDiagnosticsParams`, `isLSPRange`,
`isLSPServerCapabilities`, `isLSPTextDocumentSyncOptions`, `parseLSPMessages`. Each is reachable
from the `src/core/index.ts` barrel, which star-exports `types.ts`, `constants.ts`, `errors.ts`,
`validators.ts`, `parsers.ts`, `helpers.ts`, `factories.ts`, and `LSPClient.ts`, or from the server
barrel for the `Stdio*` pair. `LSPOpenOptions` is the token this unit added, declared at
`src/core/types.ts:286`.

Tokens the comparison reported as non-exports, each ruled against the source:

| Token                                                  | Resolves to                                                                                     |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| `timeout`, `signal`                                    | `LSPClientOptions` members at `src/core/types.ts:277` and `:282`; `signal` also `LSPOpenOptions.signal` at `:294` |
| `options`                                              | The `open` parameter name at `src/core/types.ts:319`                                            |
| `start`, `open`, `close`, `destroy`, `send`            | `LSPClientInterface` and `LSPTransportInterface` call-signature members                          |
| `emitter`, `capabilities`, `encoding`, `code`          | Readonly interface properties on those interfaces and on `LSPError`                             |
| `aborted`, `closed`, `duplicate`, `timeout`, `spawn`   | `LSPErrorCode` members at `src/core/types.ts:333`                                               |
| `chunk`, `exit`, `error`                               | `LSPTransportEventMap` and `LSPClientEventMap` event names                                      |
| `grace`, `server.command`, `server.directory`, `server.environment` | `StdioTransportOptions` members in `src/server/types.ts`                            |
| `shutdown`                                             | The protocol method the client sends during teardown                                            |
| `false`                                                | The `send` return value, not an identifier                                                      |
| `META_MODEL_DIGEST`, `META_MODEL_VERSION`              | `tests/setupConformance.ts` constants the Conformance section instructs the reader to update    |
| `stopChild`                                            | `@orkestrel/process/server`, a declared runtime dependency, imported at `src/server/transports/StdioTransport.ts:7`; the guide attributes it to that package |

Slash-bearing tokens, ruled by hand: `textDocument/didOpen` is `LSP_METHODS.open` at
`src/core/constants.ts:8`. It is the only such token this unit added.

No token fails to resolve.

## Commands and their output

The formatter reads the owned file clean:

```text
$ npx oxfmt --check guides/lsp.md
Checking formatting...

All matched files use the correct format.
Finished in 464ms on 1 files using 4 threads.
EXIT:0
```

The tree carries the owned file and the standing `src/core` entries:

```text
$ git status --short
 M guides/lsp.md
 M src/core/factories.ts
 M src/core/types.ts
```

The `.orkestrel/lsp/l6-a-*` files that were untracked when this unit started are absent from that
listing because the Orchestrator committed them as `d384f40 Retain the L6-A unit record` while the
unit ran. They exist on disk and this unit removed nothing.

The example fence compiles against the ruled signature, proved rather than inspected. The fence body
was copied into `tmp/l6d-fence-check.ts`, importing `../src/core/index.js`, and compiled standalone:

```text
$ npx tsc --noEmit --ignoreConfig --strict --skipLibCheck --target esnext --module preserve \
    --moduleResolution bundler --lib esnext,webworker tmp/l6d-fence-check.ts
src/core/LSPClient.ts(462,23): error TS18048: 'response.error' is possibly 'undefined'.
EXIT:2
```

The negative control removed the `{ signal }` argument from a copy of that same file and must fail
at the call site:

```text
$ npx tsc --noEmit --ignoreConfig ... tmp/l6d-fence-control.ts
src/core/LSPClient.ts(462,23): error TS18048: 'response.error' is possibly 'undefined'.
tmp/l6d-fence-control.ts(13,35): error TS2554: Expected 2 arguments, but got 1.
EXIT:2
```

The control broke exactly where the claim declared it would, so the instrument reaches the fence and
the fence supplies the required bag. Coverage: the instrument compiles the fence body against
`src/core/index.ts` under standalone flags, not under `configs/src/tsconfig.core.json`, so it proves
the call arity and the `LSPDocumentURI` assignment and nothing about the repository's scoped
project. The `LSPClient.ts(462,23)` line in both runs is an artifact of `--ignoreConfig` dropping the
repository's compiler options, not a defect: `npm run check:src:core` exits 0 on the same tree. Both
instrument files were removed after the runs; `tmp/` is git-ignored and the status listing confirms
neither survives.

The writing sweep over the whole owned file ran
`grep -nEi 'should|simply|\beasy|easier|\bjust\b|currently|\bnow\b|\bnew\b|latest|utiliz|leverag|\bvia\b|in order to|e\.g\.|i\.e\.|etc\.|performant|robust|allows you to|and/or|\bsince\b|\bonce\b|please|sanity|dummy|blacklist|whitelist|\bmaster\b|\bslave\b|ensure|guarantee' guides/lsp.md`
and returned one hit, at guide line 63: `emitting `exit` at most once for it`. That `once` carries
the frequency sense the substitution table does not ban, it sits in Transport seam prose this unit
did not touch, and it is recorded as permitted. A separate `grep -n '—' guides/lsp.md` returned
nothing, so the spaced-em-dash rule has no subject in this file.

## Acceptance criteria

| Criterion                                                                  | State                                                                                  |
| -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `git status --short` shows the owned file beside the standing `src` entries | Met; the listing is reproduced earlier                                                 |
| `npx oxfmt --check guides/lsp.md` exits 0                                   | Met; exit 0                                                                            |
| Every parity-list item closes on a named diff line                          | Met; the following table names each line                                               |
| The example fence compiles against the ruled signature                      | Met, and proved by the compile with its negative control rather than left to inspection |

Each parity-list item and the diff line that closes it:

| Parity item                                                     | Closing line                                                                        |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Lifecycle section distinguishes the three bounds                 | `+The lifecycle bound, the client abort, and the per-open abort have separate scopes.` and the ten lines that follow it |
| Example passes `{ signal }` and closes the admitted URI          | `+	{ signal },` and `+await client.close(uri)`                                        |
| Methods table `open` row carries the two-parameter signature     | `+| `open`    | `open(document: LSPTextDocumentItem, options: LSPOpenOptions): …`     |
| Surface table gains an `LSPOpenOptions` row                      | `+| `LSPOpenOptions`        | Configures a document inspection with the signal …`      |
| `LSPClientOptions` row names lifecycle timeout and client abort  | `+| `LSPClientOptions`      | Configures transport, workspace, lifecycle timeout, …`   |
| No row or sentence calls `timeout` an undifferentiated deadline  | `+fault into a coded `LSPError`, bounds exit and close settlement by the `timeout` option, …` with `+before that deadline`, and the Methods table's rewritten `open` behavior cell |

## Observations outside scope

- **The client implementation ignores the documented bag.** `LSPClient.open` at
  `src/core/LSPClient.ts:148` still reads `async open(document: LSPTextDocumentItem)`, so the fence's
  `{ signal }` argument reaches a method that discards it until the client paths land. TypeScript
  accepts the narrower implementation against the wider interface member by arity, which is why
  `npm run check:src:core` exits 0 on this tree. This belongs to **L6-B**, which the reconciliation
  routes to `sol` for the client paths; the guide documents the ruled contract, as the round
  intends.
- **No gate reads this guide.** The workspace registers no `guides` test project — `package.json`'s
  `test` script chains `test:src`, `test:policy`, `test:setup`, `test:config`, and
  `test:conformance` — so the parity law over this file is proved by the reading in this report and
  by review, never by a red test. The brief names the missing project as a registered `ROADMAP.md`
  item, and it stays outside this unit.
- **The `stopChild` reference points outside the package.** Guide line 82 backticks a helper
  `@orkestrel/process/server` exports rather than one this package publishes. The sentence attributes
  it to that package, so it is not drift, but a parity gate that reads backticked tokens against this
  package's barrel alone would report it. Recording it against the **ROADMAP `guides` project** item
  so whoever writes that gate scopes its token rule before the file reddens on a correct sentence.

## Deviation state

None. No conflict arose between the ruled contract, the landed types, and the guide's existing
claims. Sentence wording within the analyst's stated content is this unit's, recorded verbatim in
the preceding sections.
