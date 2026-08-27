**Question:** How does `@orkestrel/probe` consume `@orkestrel/lsp` today, and what constraints does that consumption place on lsp's API, its transport, and its performance?

**Evidence**

**1. Import sites and API used**

- `C:/Users/mikes/WebstormProjects/probe/src/core/types.ts:2` — type `LSPRange`. `Issue.range` is typed as `LSPRange` (`types.ts:201`).
- `C:/Users/mikes/WebstormProjects/probe/src/core/validators.ts:24` — `isLSPRange`. Used as the optional `range` guard on `isIssue` (`validators.ts:175-178`).
- `C:/Users/mikes/WebstormProjects/probe/src/server/stages/LintStage.ts:3-6` — types `LSPClientInterface`, `LSPDiagnostic`, `LSPExit`; factories `createLSPClient` from `@orkestrel/lsp` and `createStdioTransport` from `@orkestrel/lsp/server`.

`createLSPClient` option keys (`LintStage.ts:147-157`): `transport`, `workspace` (workspace `file://` URL), `timeout` (`2_000`).

`createStdioTransport` option keys (`LintStage.ts:148-154`): `server.command`, `server.directory`, `grace` (`#deadline / 2` → `1_000`).

Methods called on `LSPClientInterface`: `start` (`LintStage.ts:160`), `open` (`LintStage.ts:207-215`), `close` (`LintStage.ts:225`), `destroy` (`LintStage.ts:139`).

`open` document keys: `uri`, `languageId`, `version`, `text`. Second argument: `{ signal }`.

Event consumed: `client.emitter.on('exit', …)` (`LintStage.ts:159`). `LSPExit` members read: `signal`, `code` (`LintStage.ts:176-177`).

`LSPDiagnostic` members read (`LintStage.ts:273-285`): `message`, `range.start.line`, `range.start.character`, `range.end.line`, `range.end.character`. Copied into probe's `Issue.range` with no conversion.

No other `@orkestrel/lsp` import exists under `probe/src/`.

**2. Lint-stage lifecycle**

Spawn is not per `prove` and not per file. `Probe` construction creates one `LintStage` (`Probe.ts:98`). `LintStage` construction starts `#warm()` immediately (`LintStage.ts:80-82`). `#warm` builds the stdio child and client on the constructor stack, then `await client.start()` (`LintStage.ts:145-161`). The same client is reused across inspections (`server/types.ts:131-132`; `LintStage.ts:121`).

Unit of work: one `inspect` opens every draft in `subject.files` then `subject.test`, sequentially, in memory, then closes each URI (`LintStage.ts:124-126`, `186-226`). One URI may be open only once at a time (`LintStage.ts:192-198`). `Probe` serializes lint inspections through `#lintQueue` with `concurrency: 1` (`Probe.ts:109-113`). Within one `prove`, the case runs all stages then the control runs all stages (`Probe.ts:149-150`); type, lint, and runtime queues are admitted together with `Promise.all` (`Probe.ts:398-408`).

Stop: `Probe.destroy` tears down the lint stage (`Probe.ts:609-612`). `LintStage.destroy` calls `client.destroy()` (`LintStage.ts:101-106`, `138-139`). On inspection deadline expiry, `Probe.#recycle` destroys the stage and constructs a new `LintStage` (new child) before the next queued inspection (`Probe.ts:487-530`).

`AbortSignal` and bounds:

- Inspection diagnostics wait: caller-supplied `InspectionOptions.signal` only. Omitting it is refused (`LintStage.ts:113-118`; `server/types.ts:24-34`). `Probe.#inspectLint` passes the coordinator timeout's signal (`Probe.ts:426-435`). That timeout is `ProbeOptions.deadline`, default `30_000` ms (`Probe.ts:87`; `core/types.ts:409-413`). `LintStage` mints no second bound for diagnostics (`LintStage.ts:28-31`).
- Lifecycle (`initialize` / `shutdown`): client `timeout: 2_000` (`LintStage.ts:60`, `156`). Transport `grace: 1_000` (`LintStage.ts:153`). Probe teardown also races `stage.destroy()` against `ProbeOptions.deadline` (`Probe.ts:616-623`).
- Abort of the diagnostics wait is translated to `origin: 'claimant'`, `code: 'deadline'` (`LintStage.ts:218`, `234-239`). A coordinator that armed the signal replaces that with its own refusal (`guides/probe.md:379`).

**3. Prove pipeline stage list**

`PROBE_STAGES` is `['type', 'lint', 'runtime']` (`core/constants.ts:14`). Lint sits between type and runtime in the reported order.

- `type` — resident TypeScript language services; candidate text from an overlay; test on the root project (`TypeStage.ts:28-34`).
- `lint` — resident Oxlint language server over LSP stdio; virtual documents, nothing written (`LintStage.ts:17-27`).
- `runtime` — resident Vitest; writes a sibling specification, runs it, deletes it (`RuntimeStage.ts:49-57`).

**4. Performance-relevant facts**

Resident reuse: one Oxlint child per `Probe` / `LintStage` lifetime. Warming starts at construction; `prove` awaits arming (`guides/probe.md:828-831`; `Probe.ts:46`, `134-139`). No pool of servers. No second warm-start path besides construction and `#recycle` after expiry. Configuration is read once per stage, not per claim; editing `.oxlintrc.json` requires destroying the probe (`guides/probe.md:846-855`).

Spawn frequency: one child at `Probe` construction; another only if the lint stage is recycled after a deadline (`Probe.ts:528-530`). Boot arming already drives lint through `#inspect` (`Probe.ts:330-331` via `#boot`).

Measured / commented cost (`guides/probe.md:954-973`, host 2026-08-20): boot to first `tools/call` 4.1 s to 4.4 s; one warm `prove` 437 ms to 495 ms. That table does not isolate lint. Lint exchanges cross a child and do not hold the host event loop (`guides/probe.md:879-881`). Example `Check.elapsed` of 17 ms in types is documentation, not a measurement (`core/types.ts:213`). Lint `elapsed` is `Math.round(performance.now() - started)` around the inspection (`LintStage.ts:120-130`). Oxlint 1.80.0 measured 2026-08-26: `textDocumentSync.openClose`, no `diagnosticProvider`, so diagnostics are on the published path (`guides/probe.md:781-783`). A published notification the client rejects is dropped whole; the inspection then waits out the caller's bound (`guides/probe.md:787-789`).

**5. Binary launched**

Command: `[process.execPath, binary, '--lsp']` with `directory` = target workspace (`LintStage.ts:148-152`). `binary` is `resolveWorkspaceBinary(workspace, 'oxlint')` (`LintStage.ts:146`): reads that package's `package.json` `bin` field and resolves the `oxlint` entry next to the manifest (`helpers.ts:461-487`). Guide: workspace-installed Oxlint entry, not a `node_modules/.bin` shim (`guides/probe.md:749-753`). `languageId` from `inferDocumentLanguage`: `.tsx` → `typescriptreact`, `.js`/`.mjs`/`.cjs` → `javascript`, `.jsx` → `javascriptreact`, else `typescript` (`helpers.ts:554-559`).

**6. TODO / comment / roadmap**

No `TODO` or `FIXME` in `probe/src` or `probe/guides`. No `ROADMAP.md` in the probe repo.

Comments and guide rows that name lsp, transports, or lint-stage cost: `LintStage.ts` remarks on stdio ownership, pulled vs published diagnostics, 2 s lifecycle bound, 1 s grace (`LintStage.ts:17-46`, `55-59`); `guides/probe.md` sections “How the lint stage speaks the protocol”, “Lifecycle”, and “Cost” (`guides/probe.md:744-789`, `908-917`, `954-973`).

**7. Dependency pin**

`C:/Users/mikes/WebstormProjects/probe/package.json:97` — `"@orkestrel/lsp": "^0.0.3"` (registry range, not `file:`).

**Distillate**

Probe treats `@orkestrel/lsp` as the whole conversation layer and `@orkestrel/lsp/server`'s `createStdioTransport` as the only transport. The consumer requires: a factory `createLSPClient` accepting `{ transport, workspace, timeout }`; a stdio transport factory accepting `{ server: { command, directory }, grace }` that owns the child; `start` / `open(doc, { signal })` / `close(uri)` / `destroy`; an `exit` event with `{ code, signal }`; `open` returning `LSPDiagnostic[]` whose `message` and zero-based UTF-16 `range` are copied unchanged; `isLSPRange` and type `LSPRange` on the public `Issue` contract. Diagnostics cancellation must follow the caller's `AbortSignal` and must be separable from the 2 s initialize/shutdown `timeout`. Spawn is once per resident stage (Node + workspace `oxlint --lsp`), reused across proves, recycled only on deadline. Performance constraint: do not spawn per file or per prove; keep initialize/shutdown off the claim budget; let a long diagnostics wait be the coordinator's 30 s signal, not the client's lifecycle timeout. Oxlint today is the published-diagnostics path (`openClose`, no `diagnosticProvider`).

**Unknowns**

- Isolated lint-stage elapsed (spawn vs per-`open`) is not measured in the Cost table; only full `prove` / boot figures are.
- Whether `createLSPClient` capability advertisement is configurable from probe: probe passes no capability options; the guide states the client decides (`guides/probe.md:774-780`). The lsp package itself was out of scope.
- `ROADMAP.md` is absent; no roadmap row exists to cite.

**Deviation**

None. Scope held: `src/`, `package.json`, `guides/README.md`, `guides/probe.md`. Tests and `node_modules` unread.
