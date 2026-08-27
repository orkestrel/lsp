# O1 report — ecosystem reconciliation (returned 2026-08-27, `orkestrel`/Sonnet)

## Package map (verified from trees)

| Package | Declared version | Note |
| ------- | ---------------- | ---- |
| `@orkestrel/process` | `0.0.6` | source ahead of registry (Session face), release pending |
| `@orkestrel/lsp` | `0.0.3` | source ahead, unpublished rename |
| `@orkestrel/mcp` | `0.0.25` | no drift found |
| `@orkestrel/probe` | `0.0.9` | pins registry lsp `^0.0.3`, mcp `^0.0.25` |

## Drift findings

- lsp `package.json:80` pins `@orkestrel/process` to `file:tmp/tarballs/orkestrel-process-0.0.6.tgz`
  (known campaign state, restoration recorded).
- lsp published `0.0.3` surface (`StdioTransport`/`createStdioTransport`) disagrees with source
  (`StdioClientTransport`/`createStdioClientTransport` over `createSession`); unpublished rename.
- mcp: no drift. probe: no pin drift, but it consumes the published old lsp names.

## Import inventories

- mcp → process: `src/server/transports/StdioClientTransport.ts:3,5,6` — `ProcessExit`, `Process`
  (from `/server`), `PROCESS_GRACE`. TSDoc-only mentions at `src/server/types.ts:366,390,453`.
- probe → mcp: `src/server/ProbeServer.ts:2,7,8` — `MCPCallResult`, `MCPExecutionContext`,
  `createMCPLegacy`, `createMCPServer`, `createStdioServer`.
- probe → lsp: `src/server/stages/LintStage.ts:3,5,6` — `LSPClientInterface`, `LSPDiagnostic`,
  `LSPExit`, `createLSPClient`, `createStdioTransport`; `src/core/types.ts:2` `LSPRange`;
  `src/core/validators.ts:24` `isLSPRange`.

## Peer posture

- mcp peer `@orkestrel/server` `^0.0.14` versus devDependency `^0.0.15` — inconsistent; mcp tests
  against `0.0.15` while advertising `0.0.14`. `router` peer matches. **Audit finding.**
- probe peers (`oxlint`, `typescript`, `vitest`, all optional): dev pins satisfy every range. No
  inconsistency.

## Release sequencing (runtime deps only)

`process` → `lsp` and `mcp` (independent, same round, either order) → `probe`. No cycle.
probe's re-pin commit owns the `LintStage.ts:6` rename to `createStdioClientTransport` — a
required consumer edit inside that release, not a cascade side effect.

## Unknowns, with Orchestrator settlements

- ~~Whether process `0.0.7` retains `Process`/`ProcessExit`/`PROCESS_GRACE`~~ — **settled**: the
  byte-stream campaign recomposed `Process` over the interned `Supervisor` with its public surface
  preserved; the unmodified `Process` suite ran green through A2/V2 (process `5365c51`). mcp's
  re-pin is a non-breaking bump.
- ~~Whether the lsp tarball matches registry `0.0.6`~~ — **settled**: the tarball packs process at
  `5365c51` (Session face included); it is `0.0.7` content labeled `0.0.6`, recorded in
  `.orkestrel/campaign/tarball-swap.md`.
- Whether `@orkestrel/server` `0.0.14 → 0.0.15` is behavior-compatible — open; the peer-range fix
  belongs to the audit.
- Live registry versions — out of scope by brief; local trees only.
