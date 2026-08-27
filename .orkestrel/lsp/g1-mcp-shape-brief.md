# G1 — mcp package shape distillate

Read-only. Modify no file. Return evidence with `file:line` pointers. No raw file dumps, no
decisions, no design proposals.

## Question

What is the `@orkestrel/mcp` package's decomposition pattern — entities, managers, controllers,
transports, environments — and what is its transport seam contract, so a sibling package can mirror
the shape?

## Scope

- `C:/Users/mikes/WebstormProjects/mcp/src/**` (read all)
- `C:/Users/mikes/WebstormProjects/mcp/package.json`
- `C:/Users/mikes/WebstormProjects/mcp/guides/README.md`
- Nothing else. Do not read tests or node_modules.

## Evidence sought

1. Per environment (`core`, `server`, `browser`): every class file, its single responsibility in one
   sentence, and its line count. Which centralized kind files exist per environment.
2. The transport seam: the exact interface(s) in `types.ts` a transport implements — method names,
   event names, option shapes, generation or lifecycle mechanics — with `file:line`.
3. How `MCPClient` composes its sub-entities (`MCPMethodManager`, `MCPProgressReporter`,
   `MCPStreamController`, `MCPTaskClient`, others): which are `#` fields, which are exposed as
   readonly getters, which are constructor-injected, with `file:line`.
4. Which `@orkestrel/*` runtime dependencies mcp declares and, for each, the import sites in `src/`
   showing what it is used for.
5. The transport implementations per environment (stdio, HTTP, WebSocket, MessagePort): which are
   client halves, which server halves, and what each owns (process, socket, fetch loop).
6. The `guides/README.md` `## By concept` table shape: its columns and a couple of representative
   rows.

## Return shape

- `Question`: one line.
- `Evidence`: concise facts with `file:line` pointers, grouped by the numbered items.
- `Distillate`: the smallest context a designer needs to mirror this shape in a sibling package.
- `Unknowns`: unresolved facts.
- `Deviation`: only if something blocked the reading.
