# G2 — Orkestrel ecosystem capability distillate

Read-only. Modify no file. Return evidence with `file:line` pointers. No raw file dumps, no
decisions, no recommendations.

## Question

Which `@orkestrel/*` packages exist, what capability does each provide, and which capabilities
overlap what `@orkestrel/lsp` implements locally today — with special depth on `@orkestrel/contract`
and `@orkestrel/test`?

## Scope

- `C:/Users/mikes/WebstormProjects/lsp/.claude/agents/orkestrel.md` (the catalog table)
- `C:/Users/mikes/WebstormProjects/scaffold/guides/**` (fleet conventions and package guides)
- Installed declarations under `C:/Users/mikes/WebstormProjects/lsp/node_modules/@orkestrel/*/dist/`
  — read `index.d.ts` surfaces for `contract`, `emitter`, `process`, `test`, `guide`, `probe`.
- For packages not installed in lsp (`queue`, `tool`, `middleware`, `websocket`, `worker`,
  `terminal`, `server`, `console`, `sea`, `markdown`, `html`, `workflow`): read each neighbor's
  `guides/README.md` and root `README.md` under `C:/Users/mikes/WebstormProjects/<name>/` only —
  one-paragraph capability summary each. Do not deep-read their sources.
- `C:/Users/mikes/WebstormProjects/lsp/src/**` — only to name overlap sites.

## Evidence sought

1. The catalog: package name, version, one-line capability, layer, per the catalog table.
2. `@orkestrel/contract` full exported surface from its installed `index.d.ts`: every exported
   symbol with a one-line meaning, and which of them `lsp/src` imports today (import sites,
   `file:line`).
3. `@orkestrel/emitter` and `@orkestrel/process` exported surfaces, and lsp's import sites.
4. `@orkestrel/test` (and `/server` entry) exported surface, and which helpers lsp's `tests/` uses
   versus hand-rolls (name the hand-rolled helper in lsp `tests/setup*.ts` and the `@orkestrel/test`
   export that overlaps it, with `file:line` on each side).
5. For each not-installed package: what it provides, and any concrete overlap with logic present in
   `lsp/src` (name the lsp `file:line` and the package capability; overlap facts only, no adoption
   advice).
6. Any scaffold guide statement about which dependencies a fleet package is expected to declare
   (dev or runtime), with pointers.

## Return shape

- `Question`: one line.
- `Evidence`: concise facts grouped by the numbered items, with pointers.
- `Distillate`: the smallest context a designer needs to decide dependency adoption for lsp.
- `Unknowns`: unresolved facts.
- `Deviation`: only if something blocked the reading.
