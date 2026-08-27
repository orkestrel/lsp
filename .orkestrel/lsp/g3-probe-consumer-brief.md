# G3 — probe consumer distillate

Read-only. Modify no file. Return evidence with `file:line` pointers. No raw file dumps, no
decisions, no design proposals.

## Question

How does `@orkestrel/probe` consume `@orkestrel/lsp` today, and what constraints does that
consumption place on lsp's API, its transport, and its performance?

## Scope

- `C:/Users/mikes/WebstormProjects/probe/src/**`
- `C:/Users/mikes/WebstormProjects/probe/package.json`
- `C:/Users/mikes/WebstormProjects/probe/guides/README.md` and any guide naming the lint stage
- `C:/Users/mikes/WebstormProjects/probe/ROADMAP.md` if present
- Nothing else. Do not read tests or node_modules.

## Evidence sought

1. Every import site of `@orkestrel/lsp` in probe's `src/` with `file:line`, and the exact API used
   (class, factory, option keys, methods called, events consumed).
2. The lint stage lifecycle: when the language server child is spawned, per what unit of work (per
   prove call, per file, pooled), when it is stopped, and where the `AbortSignal` and timeout bounds
   come from.
3. The full stage list of the prove pipeline and where the lint stage sits in it; each stage's
   subject in one line.
4. Performance-relevant facts: any measured or commented cost of the lint stage, server spawn
   frequency, and any pooling, reuse, or warm-start mechanism present or absent.
5. Which language server binary probe launches (command, args) and how it resolves it.
6. Any TODO, comment, or roadmap row in probe referencing lsp, transports, or lint-stage cost.
7. probe's `package.json` dependency pin of `@orkestrel/lsp` (registry range or `file:`).

## Return shape

- `Question`: one line.
- `Evidence`: concise facts grouped by the numbered items, with pointers.
- `Distillate`: the smallest context a designer needs to judge what transports and API shape the
  consumer requires.
- `Unknowns`: unresolved facts.
- `Deviation`: only if something blocked the reading.
