# P-wave terrain distillate — probe's LSP machinery, `Issue.line`, and manifest

Lane: `grok` bridge to Cursor Grok, read-only over `/home/user/probe`, 2026-08-25. The liveness
probe round-tripped (`ready`, exit 0) before the run. Brief retained beside this file as
`p-terrain-brief.md`; the journal lived at `tmp/cursor/p-terrain-journal.txt` and is swept at
acceptance. The distillate follows unaltered.

---

**1. LintStage language-server machinery**

**Spawn.** `LintStage.#warm` resolves the workspace `oxlint` bin then spawns Node on that file with `--lsp` only: `spawn(process.execPath, [binary, '--lsp'], { cwd: this.#workspace, stdio: 'pipe' })` — `src/server/stages/LintStage.ts:199-203`. Binary resolution is `resolveWorkspaceBinary(workspace, 'oxlint')` — `LintStage.ts:199`, helper `src/server/helpers.ts:453-463`. Stderr is drained (`stderr.resume`) and stdout is parsed — `LintStage.ts:205-206`.

**Content-Length write.** `#send` stringifies the JSON-RPC body and prefixes `Content-Length: ${Buffer.byteLength(content)}\r\n\r\n` then `stdin.write` — `LintStage.ts:348-350`.

**Content-Length parse.** `#read` concatenates stdout chunks and loops `#frame` — `LintStage.ts:353-356`. `#frame` splits on `\r\n\r\n`, calls `parseContentLength(header)`, slices that many bytes, `JSON.parse`s, then `#receive` — `LintStage.ts:358-378`. Parser lives in `src/server/helpers.ts:606-611`. Tests: `tests/src/server/helpers.test.ts:110-111`, `:627-631`. Guide row: `guides/probe.md:189`.

**Request ids.** Counter `#sequence` starts at `0` — `LintStage.ts:60`. `#request` increments `#sequence`, uses it as `id`, stores resolvers in `#responses`/`#failures` keyed by `id` — `LintStage.ts:53-54`, `:314-322`. `#notify` also increments `#sequence` but sends no `id` — `LintStage.ts:334-336`. Correlation in `#receive` — `LintStage.ts:381-394`. `#fail`/`#exit` reject outstanding ids — `LintStage.ts:446-461`.

**Lifecycle.** Constructor starts `#warmth = this.#warm()` — `LintStage.ts:70-76`. Warm: spawn, `#request('initialize', …)`, `#notify('initialized', {})` — `LintStage.ts:214-226`. Teardown: `#destroy` → `#release` → `#retire`, which `#request('shutdown', undefined)` then `#notify('exit', undefined)` — `LintStage.ts:114-127`, `:154-176`, `:170-173`. `#deadline = 2_000`; on timeout `SIGKILL` — `LintStage.ts:51`, `:148-164`. Test fixture: `tests/src/server/stages/LintStage.test.ts:24-26`, `:54-76`, `:663-762`.

**Capabilities sent.** `processId`, `rootUri`, `capabilities: {}` (empty), `workspaceFolders: [{ uri, name: 'workspace' }]` — `LintStage.ts:214-224`. No other capability object found.

**Diagnostics.** Push only, via `textDocument/publishDiagnostics` — `LintStage.ts:396-405`, `:411-443`. `textDocument/diagnostic` (pull): no such site found.

**2. `Issue` type and `line`**

Declaration: `src/core/types.ts:183-192`; member `readonly line?: number` at `:190-191`. Guard: `src/core/validators.ts:174-176`.

Constructors writing `line`: `LintStage.ts:432-440` (LSP `range.start.line + 1`); `TypeStage.ts:457-459` (`getLineAndCharacterOfPosition`, `+1`); `RuntimeStage.ts:918-921` (Vitest `stack.line`, as-is). Constructors omitting `line`: `RuntimeStage.ts:487-494`, `:526-530`, `:571-577`, `:616-622`, `:815-819`, `:822-826`, `:831-835`, `:840-844`, `:849-853`, `:856-860`, `:866-870`.

Only reader: `formatIssue` — `src/core/helpers.ts:27-29` (falls to `issue.path` when `line` undefined); `formatCheck` — `:52`; `formatVerdict` — `:91-92`.

Tests: `tests/src/core/helpers.test.ts:42-56`, `:65`, `:82`, `:108`, `:228-231`; `tests/src/core/validators.test.ts:74`; `tests/src/server/stages/RuntimeStage.test.ts:147-152`, `:194-197`. No `line` assertion found in `LintStage.test.ts` or `TypeStage.test.ts`.

Guide rows: `guides/probe.md:41`, `:103`, `:115`. No other `guides/*.md` names `Issue.line`.

**3. TypeStage LanguageService; TypeScript 7 / native preview**

Loads workspace `typescript` — `TypeStage.ts:71-74`; `typescript.createLanguageService(host)` — `:305-324`; cache `#services: Map<string, LanguageService>` — `:55`; diagnostics via `getCompilerOptionsDiagnostics` (`:386`) and `getSyntacticDiagnostics`/`getSemanticDiagnostics` (`:429-430`); dispose `:213`, `:396`. Guide: `guides/probe.md:154`.

No "TypeScript 7" or "native preview" prose found in `guides/probe.md` (searched those terms and `tsgo`). Closest version mention: TypeScript **6.0.3** at `guides/probe.md:881`. Tree-wide the only `7.0`-adjacent hit is `oxlint-tsgolint >=7.0.2001` in `package-lock.json:2802`, not probe-guide prose.

**4. Probe guide sections**

LintStage: `### The engine` `146:166`; `### Server helpers` `168:196`; `#### StageInterface` `209:214`; `## What the lint stage does not see` `703:716`; lifecycle detail `806:809`, `835:849`; test pointer `914:917`.

Issue: `### Contracts` `28:51`; `### Validators` `90:107`; `### Formatters and the token` `109:120`; `## What a probe proves` `284:299` (no `line` mention there).

Stage lifecycle: `## Lifecycle` `753:876` (next heading `## Cost` at `877`); cross-refs `209:214`, `773:782`, `835:840`, `841:844`.

**5. Manifest and package strings**

`dependencies` (`package.json:94:101`): `@orkestrel/contract` `^0.0.13`, `@orkestrel/emitter` `^0.0.8`, `@orkestrel/mcp` `^0.0.24`, `@orkestrel/queue` `^0.0.10`, `@orkestrel/timeout` `^0.0.8`, `@orkestrel/tool` `^0.0.12`.

`devDependencies` (`:102:114`): `@microsoft/api-extractor` `^7.59.0`, `@orkestrel/guide` `^0.0.14`, `@orkestrel/scaffold` `^0.0.53`, `@orkestrel/test` `^0.0.11`, `@types/node` `^26.3.0`, `oxfmt` `^0.65.0`, `oxlint` `^1.80.0`, `typescript` `^6.0.3`, `vite` `^8.2.2`, `vite-plugin-dts` `^5.0.3`, `vitest` `^4.1.11`.

`@orkestrel/lsp`: no such site found in `/home/user/probe`.

`@orkestrel/mcp` hits: `package.json:97`; `package-lock.json:14,336,338`; `src/server/ProbeServer.ts:2,7,8,67`; `tests/src/server/ProbeServer.test.ts:3,4,252`; `tests/src/bin/main.test.ts:8,9,367`; `guides/probe.md:485,924,932`; `guides/tool.md:17`; `guides/scaffold.md:1170`; `guides/contract.md:987`; `.claude/agents/orkestrel.md:55,61`; `guides/mcp.md` (many hits, `:134` through `:3839` — see the journal for the full enumeration).

Distillate: `Issue.line` has exactly one reader (`formatIssue` in `src/core/helpers.ts:27-29`), so any change to its optionality or type touches only that formatter chain plus the constructors above. `LintStage` runs its own hand-rolled LSP client (spawn, Content-Length framing, id correlation, push-diagnostics lifecycle) rather than a shared `@orkestrel/lsp` package — no such package exists in this tree. `TypeStage` uses the real `typescript` `LanguageService` in-process; the probe guide carries no TypeScript 7/native-preview prose. `@orkestrel/mcp` is a direct runtime dependency, wired through `ProbeServer.ts`.

Unknowns: none — every requested item was found or explicitly reported absent by the Grok distillate.

---

## Orchestrator planning notes taken from this distillate

- P1 replaces the whole `#send`/`#read`/`#frame`/`#request`/`#notify`/`#receive` machinery plus
  the warm and retire lifecycle with `LSPClient`; the spawn site and `resolveWorkspaceBinary`
  stay probe's, moving behind the stdio transport L4 builds. `LintStage` declares empty
  capabilities today, so the `LSPClient` capability declaration is a behavior change the P1
  brief must name.
- `parseContentLength` in `src/server/helpers.ts:606-611` loses its consumer under P1; its row
  and guide row (`guides/probe.md:189`) belong in P1's blast set.
- Diagnostics are push-only today; P1's capability-selected pull path is behavior the brief must
  pin against the real oxlint binary on the host.
- P2's blast set is bounded: the declaration, the guard, the constructor sites in LintStage,
  TypeStage, and RuntimeStage, the formatter chain in `src/core/helpers.ts`, the named test
  rows, and the guide rows at `guides/probe.md:41`, `:103`, `:115`.
- P3's receipt-gate prose is an addition — no existing TypeScript 7 prose to amend.
- `@orkestrel/lsp` enters `dependencies` (runtime — `LintStage` is shipped server source),
  installed as a tarball until the package publishes, range recorded at the swap.
