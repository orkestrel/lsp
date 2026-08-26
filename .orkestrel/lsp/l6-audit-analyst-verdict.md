1. **CONFIRMED TRUE**

`LSPClient.open` snapshots `options.signal` at `/home/user/lsp/src/core/LSPClient.ts:159`. The aborted check at `:160` precedes lifecycle checks, URI ownership at `:183`, and either `didOpen` path at `:285` or `:349`. The pinned refusal verifies no open notification at `/home/user/lsp/tests/src/core/LSPClient.test.ts:446`.

2. **CONFIRMED TRUE**

Push abort settles only its publication at `/home/user/lsp/src/core/LSPClient.ts:585`. Pull abort settles only its request and writes `$/cancelRequest` with its id at `:566-582`. Neither path invokes `#abortClient`. URI ownership survives until `close` writes `didClose` at `:189-210`. The closeability and continued-use rows are at `/home/user/lsp/tests/src/core/LSPClient.test.ts:485`, `:528`, `:652`, and `:686`.

3. **CONFIRMED TRUE**

The constructor timeout enters correlated requests only when no caller signal exists at `/home/user/lsp/src/core/LSPClient.ts:375`. Its no-signal callers are initialize at `:249` and shutdown at `:646`; diagnostics supplies the caller signal at `:314`. Exit and transport settlement retain it at `:663-690`. The delayed rows configure `10 ms`, wait `30 ms`, then deliver success at `/home/user/lsp/tests/src/core/LSPClient.test.ts:550-568` and `:714-740`.

4. **CONFIRMED TRUE**

Each publication and request records one signal/listener pair at `/home/user/lsp/src/core/LSPClient.ts:76-94`, with one registration at `:345-347` or `:380-382`. Settlement deletes the entry before removing that exact listener at `:594-611`. Responses, publications, send failures, aborts, lifecycle expiry, transport exit, close, and destruction reach these settlement functions at `:383-404`, `:468-531`, `:556-592`, and `:614-647`. Repeated settlement finds no entry and returns without a second rejection.

5. **CONFIRMED TRUE**

The required `LSPOpenOptions.signal`, interface signature, scoped timeout prose, and error codes appear at `/home/user/lsp/src/core/types.ts:263-341`. `LSPClient` implements the interface at `/home/user/lsp/src/core/LSPClient.ts:66` with the matching signature at `:155-158`. The LSP round diff contains no assertion or suppression addition.

6. **CONFIRMED TRUE**

`Probe.#bound` starts the timeout and registers its expiry before invoking the operation at `/home/user/probe/src/server/Probe.ts:471-485`. Inspection, resolution, teardown, and recovery pass handlers that start their work inside an armed bound at `:411-445`, `:498-519`, `:550-560`, and `:616-623`. The lint handler passes that signal at `:426-435`; `LintStage` passes it to `client.open` at `/home/user/probe/src/server/stages/LintStage.ts:182-208` and creates no diagnostics timeout.

7. **CONFIRMED TRUE**

`#expiry` constructs the coordinator `ProbeError` with the pinned message, `code: 'deadline'`, and lint-stage context at `/home/user/probe/src/server/Probe.ts:578-598`. `#bound` observes the expiry separately, races each rejection, checks `timeout.expired`, recycles, and throws the retained coordinator refusal at `:479-492`. `Promise.race` observes the operation’s losing rejection. The reported host execution is recorded in `/home/user/lsp/.orkestrel/probe/l6-e-probe-report.md`, §2.

8. **CONFIRMED FALSE**

The interface-deviation clauses hold: the base and type-stage signatures at `/home/user/probe/src/server/types.ts:152` and `:193` explain why widening the base breaks `TypeStageInterface`; the compiler evidence is recorded in `/home/user/lsp/.orkestrel/probe/l6-e-probe-report.md`, §1. Missing options are refused before `#warmed()` is awaited at `/home/user/probe/src/server/stages/LintStage.ts:104-117`, and type/runtime handlers receive no signal.

The claim that this refusal precedes warming is false. `LintStage` starts `#warm()` during construction at `/home/user/probe/src/server/stages/LintStage.ts:76-82`, and `#warm` starts the client at `:141-157`. A caller can invoke the missing-options refusal only after construction has begun warming. The smallest correction is to state that refusal precedes awaiting the existing warm; making it precede warming requires a deliberate lazy-warm contract change.

9. **CONFIRMED TRUE**

When the supplied signal is aborted, `LintStage.#document` translates the client rejection to a claimant-owned deadline `ProbeError` before `#translate` runs at `/home/user/probe/src/server/stages/LintStage.ts:199-231`. `guardStage` passes a `ProbeError` unchanged at `/home/user/probe/src/server/helpers.ts:633-643`. On the `Probe` path, `#bound` replaces this stage-level rejection with the retained coordinator refusal at `/home/user/probe/src/server/Probe.ts:483-489`.

10. **CONFIRMED TRUE**

The captured diffs match the live working-tree diffs byte-for-byte. The LSP status names only the L6-owned source, test, and guide files in `/home/user/lsp/.orkestrel/lsp/l6-round-status.txt:1-6`. The probe allocation between standing P1 and L6-E is recorded in `/home/user/lsp/.orkestrel/probe/l6-e-probe-report.md`, §4; beyond P1, only the L6-E-owned files changed. Added-line inspection found no `any`, type assertion, non-null assertion, or suppression. The tarball dependency in `/home/user/probe/package.json:97` is the explicitly excluded standing P1 entry; L6-E adds no dependency.

**Finding outside the claims**

- **MEDIUM — P1 adoption, lint-stage progress attribution.** `LintStage.#document` raises `#progress` at `/home/user/probe/src/server/stages/LintStage.ts:195-198` but does not restore it before awaiting stage-owned `client.close` cleanup at `:213-218`. If diagnostics settle and the `didClose` transport write never settles, the coordinator expires while `progress` remains above its snapshot and classifies the failure as claimant-owned at `/home/user/probe/src/server/Probe.ts:588-592`. This contradicts the public progress contract at `/home/user/probe/src/server/types.ts:135-142`. Normal diagnostic cancellation remains correct. Repair requires a separate monotonic document revision and a progress gauge restored before close cleanup.

**Host-verification unknowns**

The reports supply these readings, but this read-only lane could not independently execute them:

- `/home/user/lsp`: `npm run test:src:core -- tests/src/core/LSPClient.test.ts`
- `/home/user/lsp`: `npm run test:src:server -- tests/src/server/integration.test.ts`
- `/home/user/probe`: `npx vitest run --project src:server tests/src/server/Probe.test.ts tests/src/server/stages/LintStage.test.ts`
- `/home/user/probe`: `npx vitest run --project src:server`

VERDICT: FAIL