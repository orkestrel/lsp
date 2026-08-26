# Unit P1 report

**Deviation: the adopted client imposes an inspection deadline the stage never had, and it breaks two rows in an off-limits file. Every owned file is complete and green.**

## 1. What changed

- `/home/user/probe/src/server/stages/LintStage.ts` — the private spawn, `Content-Length` framing, request correlation, and lifecycle are gone. `#warm` resolves the binary, builds `createStdioTransport({ server: { command: [process.execPath, binary, '--lsp'], directory: workspace }, grace: 1000 })`, builds `createLSPClient({ transport, workspace: pathToFileURL(workspace).href, timeout: 2000 })`, registers the client's `exit` listener, and awaits `start()`. `#document` raises `progress` at admission, calls `client.open`, maps through the existing `Issue` construction with `range.start.line + 1`, and closes the document in `finally`. `#destroy` is `await this.#client?.destroy()`. A new `#translate` phrases a failure: destroyed → the stage's destroyed refusal; a recorded server ending → `The Oxlint language server exited with <ending>`; otherwise the client's own coded error, which `guardStage` carries. `#documents` is a `Set` of open URIs holding only the claimant-origin collision refusal.
- `/home/user/probe/src/server/helpers.ts` — `parseContentLength` removed with its capability.
- `/home/user/probe/tests/src/server/helpers.test.ts` — the framing rows and the import removed; the `server wire helpers` block renamed `server text helpers`, because nothing left in it is about the wire.
- `/home/user/probe/tests/src/server/stages/LintStage.test.ts` — the fixture's `initialize` result declares `textDocumentSync: { openClose: true, change: 1 }`; the `HOST` resolve hook is scoped to the workspace's own `src/` tree; the process-id teardown row is added; two rows re-pinned (see § 3).
- `/home/user/probe/guides/probe.md` — the `parseContentLength` row deleted; the `LintStage` engine row names the delegation; a new **How the lint stage speaks the protocol** section states the factories, the command vector, the `workspace`/`timeout`/`grace` options, and the limits that belong to the client (capability declaration, diagnostics-path selection, `openClose` refusal, refused-diagnostic notification); the Lifecycle teardown bullet names the client and the transport's cooperative window.

Diffstat over owned files: `5 files changed, 214 insertions(+), 377 deletions(-)`.

## 2. Readings

- Process-id teardown row, `ends the language server process it owns when teardown settles`: `isProcessLive(owned)` is `true` before `destroy` and `false` after; the row's vitest annotation recorded **process 16752** on the accepted run (**10534** on the first run of the row). The control is the pre-teardown live reading, so the refusal afterwards reads the teardown rather than an unreachable id.
- Surviving behavioral rows, final run 2026-08-26: `tests/src/server/stages/LintStage.test.ts` + `tests/src/server/helpers.test.ts` → **64 passed, exit 0**. Baseline before the change was 23 passed in `LintStage.test.ts`; the file now carries 24. Teardown timings held: `never answers its warming exchange` 1113 ms (baseline 2114 ms), `answers shutdown and ignores exit` 1072 ms (baseline 2067 ms), `dies by signal` 412 ms, `cannot spawn` 260 ms, `destroy interrupts initialize` 356 ms. Every real-Oxlint override row stayed green, so `rootUri` alone reaches Oxlint's configuration without the `workspaceFolders` member the old stage sent.

## 3. The Unknowns, answered

**Observable mapping.** Two pinned observables could not be preserved verbatim.

- `settles teardown when destroy interrupts a language server that never answers initialize` reported `The Oxlint language server exited with code 0`; it now reports `The lint stage has been destroyed`. Cause: the client settles its outstanding `initialize` inside `destroy` rather than leaving it for the server's ending 200 ms later. The row now also asserts `stage.progress` is `0`, which is what separates that refusal from one raised at the entry guard — the inspection was admitted before teardown and never reached a document.
- `refuses an inspection through a stage fault when the language server closes its input` pinned `EPIPE`; it now pins the `ProbeError` shape plus `The LSP notification 'textDocument/didOpen' could not be written`. Cause: the transport owns the write and resolves it `false`, so the host's pipe code reaches the client's `error` event rather than the operation. The row keeps its `readInputRefusal('SIGKILL')` control and its skip condition, and it ran rather than skipped on this host.

**Fixture extensions.** The `LintStage.test.ts` fixture's `initialize` result gained `textDocumentSync: { openClose: true, change: 1 }`. The client refuses `open` before any text reaches a server that declares no `openClose`, and real Oxlint declares that capability — measured 2026-08-26, its `initialize` result is `{"textDocumentSync":{"openClose":true,"change":1,"save":{"includeText":false}},...}` with `serverInfo` version `1.80.0` and no `diagnosticProvider`, so its diagnostics arrive on the pushed path. A second extension was forced outside the fixture: the `HOST` script's resolve hook rewrote every relative `.js` specifier to `.ts`, which broke `@orkestrel/lsp/server`'s own `../core/index.js` import; it now fires only when `context.parentURL` sits under the workspace's `src/` directory.

## 4. Gate readings

Run in `/home/user/probe`, 2026-08-26, each read bare:

- `git diff --check` → exit 0. Working tree carries only the five owned files plus the Orchestrator's `package.json`/`package-lock.json` swap, untouched.
- `npx oxfmt --config .oxfmtrc.json --check <owned files>` → exit 0.
- `npx oxlint --config .oxlintrc.json --deny-warnings <owned source and test files>` → exit 0. Instrument control: the same command over a throwaway `tmp/lintcontrol/control.ts` carrying `debugger` reported `error eslint(no-debugger)` and exit 1; the control file was created under git-ignored `tmp/` and removed.
- `npm run check` (tree-wide) → exit 0.
- `npx vitest run --project src:server tests/src/server/stages/LintStage.test.ts tests/src/server/helpers.test.ts` → **64 passed, exit 0**.
- `npm run test:guides` → 13 passed, exit 0. `npm run test:policy` → 93 passed, exit 0.
- `grep -rn "parseContentLength" . --exclude-dir=node_modules --exclude=package-lock.json` → no match.

## 5. Deviation — off-limits file made false

**Expected.** `tests/src/server/Probe.test.ts` is off-limits and the brief named no carrier for it.

**Found.** `npx vitest run --project src:server tests/src/server/Probe.test.ts` → **3 failed | 23 passed, exit 1** (baseline: green). Its two Oxlint fixtures, `ORDERED` (line 55) and `STALLING` (line 97), both answer `initialize` with `result: { capabilities: {} }`:

```
ProbeError: The probe could not arm: The lint stage could not serve (The LSP server does not support document open and close)
Caused by: LSPError: The LSP server does not support document open and close
 ❯ LSPClient.open node_modules/@orkestrel/lsp/dist/src/core/index.js:689:143
```

**Exact patch, both lines byte-identical, one occurrence each at line 55 and line 97:**

```
-	"\t\tif (message.method === 'initialize') send({ jsonrpc: '2.0', id: message.id, result: { capabilities: {} } })",
+	"\t\tif (message.method === 'initialize') send({ jsonrpc: '2.0', id: message.id, result: { capabilities: { textDocumentSync: { openClose: true, change: 1 } } } })",
```

**That patch closes only one of the three rows.** `admits one inspection per stage at a time, in arrival order` uses `ORDERED` and fails on the capability alone. `replaces a lint stage its deadline destroyed` and `names arming in a boot expiry and arms again for the next claim` both require the lint stage to hold a silenced document past a caller-set `deadline: 6_000`, and both assert `The lint stage exceeded 6000 ms`. The brief's prescribed `timeout: 2000` gives the stage an inspection deadline it never had, so the stage settles first. Measured with a throwaway runtime probe carrying the patched `STALLING` fixture, run through the `probe` project and deleted afterwards:

```
STALL elapsed=2076ms message=The lint stage could not serve (The LSP diagnostic publication exceeded its deadline) control=0
```

The control — the same fixture, a candidate carrying no marker — answered with 0 issues, so the reading is about the silenced document rather than a stage that answers nothing.

**Done vs not done.** Every owned file is complete and its gates are green. Not done: the coordinator's contract that an inspection is bounded by `ProbeOptions.deadline` and a stage bounds only its teardown. `@orkestrel/lsp` reads `LSPClientOptions.timeout` for requests **and** for the pushed-diagnostics deadline (`#openPush` builds `AbortSignal.timeout(this.#timeout)`), so no value of that option bounds warming and `shutdown` at 2 s while leaving an inspection to the coordinator. The client's own default is `30_000`, which ties the coordinator's default `30_000` and would race.

**Hypothesis.** The stage's teardown bound and the stage's inspection bound need separate knobs, and the client offers one; passing `LSPClientOptions.signal` and aborting it at the stage's own 2 s teardown deadline would restore the split, at the cost of a `timeout` value large enough not to preempt any coordinator deadline.

`src/server/types.ts` needs no patch: its `StageInterface.destroy` prose speaks only of teardown bounds, which still hold. `src/core/types.ts` § `ProbeOptions` names `deadline` as the coordinator's budget for one active stage inspection and is the prose the finding contradicts, should the Orchestrator keep the 2 s inspection deadline.
