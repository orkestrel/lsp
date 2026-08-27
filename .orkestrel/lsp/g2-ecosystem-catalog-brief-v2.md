# G2 v2 — Orkestrel ecosystem capability distillate

Supersedes `g2-ecosystem-catalog-brief.md`. Changed: dropped the uninstalled `msg` and `pool`
packages (ruled out and carried as a probe finding respectively by the Orchestrator), dropped the
catalog re-read (done by the Orchestrator), pointed the capability reading at lsp's vendored
dependency guides and the transitively installed declarations, and absorbed the former G4 item on
local-versus-dependency overlap.

Read-only. Modify no file. Return evidence with `file:line` pointers. No raw file dumps, no
decisions, no recommendations.

## Question

What do `@orkestrel/contract`, `@orkestrel/test`, `@orkestrel/abort`, `@orkestrel/timeout`,
`@orkestrel/websocket`, `@orkestrel/sse`, and `@orkestrel/tool` provide, and where does
`@orkestrel/lsp` implement locally what one of them already exports?

## Scope

- Vendored dependency guides: `C:/Users/mikes/WebstormProjects/lsp/guides/contract.md`,
  `emitter.md`, `process.md`, `test.md`.
- Installed declarations under `C:/Users/mikes/WebstormProjects/lsp/node_modules/@orkestrel/`:
  `contract/dist`, `emitter/dist`, `process/dist`, `test/dist`, `abort/dist`, `timeout/dist`,
  `websocket/dist`, `sse/dist`, `tool/dist` — read each package's `index.d.ts` (and a `server` entry
  where one exists).
- `C:/Users/mikes/WebstormProjects/lsp/src/**` and `C:/Users/mikes/WebstormProjects/lsp/tests/**` —
  only to name overlap sites.
- Nothing else.

## Evidence sought

1. `@orkestrel/contract`: the full exported surface (symbol, one-line meaning). Which exports lsp
   uses today (import sites with `file:line`), and which unused exports overlap logic lsp writes
   locally — name the lsp `file:line` beside the unused export. Look hard at: outcome/`Result`
   types, `attempt`, guard combinators (`arrayOf`, `recordOf`, `unionOf`, literal/enum guards),
   parsers, and anything resembling `holds`.
2. `@orkestrel/abort` and `@orkestrel/timeout`: full exported surfaces. Beside each export, any lsp
   site that hand-rolls the same behavior — signal composition, deadline races, abort listener
   management. Candidate sites to check: `src/core/LSPClient.ts` deadline race in the teardown
   region (`#boundExit`, `#closeTransport`), pending-entry abort listeners, and
   `AbortSignal.timeout` uses.
3. `@orkestrel/websocket` and `@orkestrel/sse`: full exported surfaces at one-line depth — what a
   transport built on each would consume. Note whether `@orkestrel/websocket` exposes client,
   server, or both halves, and for which hosts.
4. `@orkestrel/tool`: exported surface at one-line depth.
5. `@orkestrel/test` (root and `/server` entries): full exported surface. For each helper, whether
   lsp's `tests/setup.ts`, `tests/setupServer.ts`, or `tests/setupConformance.ts` hand-rolls an
   equivalent (name the lsp `file:line` and the export).
6. `@orkestrel/emitter` and `@orkestrel/process` (root and `/server`): exports lsp does not use
   today that overlap lsp-local logic, with `file:line` on the lsp side.

## Return shape

- `Question`: one line.
- `Evidence`: concise facts grouped by the numbered items, with pointers.
- `Distillate`: the smallest context a designer needs to decide dependency adoption and overlap
  removal for lsp.
- `Unknowns`: unresolved facts.
- `Deviation`: only if something blocked the reading.
