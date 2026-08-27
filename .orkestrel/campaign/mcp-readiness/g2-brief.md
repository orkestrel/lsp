# G2 — @orkestrel/probe absorption

You are a read-only scout inside the probe package working tree. Perform this assignment directly
and spawn nothing. Do not edit any file. Return evidence with `file:line` pointers, never raw file
dumps, and make no decisions or design proposals.

**Question**: How does `@orkestrel/probe` implement its MCP server application and drive its
toolchain stages, and where does it consume `@orkestrel/mcp` and `@orkestrel/lsp`?

## Scope

This repository only. Read `src/`, `tests/`, `guides/`, and configuration. Read
`node_modules/@orkestrel/*/package.json` or installed declarations only where an import target
must be identified. Never read `.env*`, `.npmrc`, auth files, or credentials.

## Evidence sought

1. Public surface: every export from `src/core/index.ts` and `src/server/index.ts`; the
   `src/bin/main.ts` entry behavior — how the server starts, which transport, which CLI arguments
   or environment values it reads.
2. `ProbeServer`: how the `prove` tool is registered (through `@orkestrel/tool`, `MCPServer`, or
   otherwise), its input and output schemas, tool annotations if any, its error reporting shape,
   and its logging posture (stdout versus stderr).
3. `Probe` and `Overlay`: what a prove run does end to end — overlay file handling, stage
   pipeline, result shaping (`shapers.ts`), and the evidence a caller receives.
4. Stages, one bullet each for `TypeStage`, `LintStage`, `RuntimeStage`: what each drives, which
   external processes it spawns, and where it uses `@orkestrel/process`, `@orkestrel/queue`, or
   `@orkestrel/timeout` (`file:line`).
5. LSP consumption: every `@orkestrel/lsp` import — which factories and classes, which language
   server binary it launches, which LSP requests it issues, how diagnostics arrive (push or
   pull), and its lifecycle and shutdown handling.
6. MCP consumption: every `@orkestrel/mcp` import — which classes, factories, and transports, and
   any session handling.
7. Tests: what `tests/` covers by area; every skipped test or TODO in `src/` and `tests/`
   (search for `TODO`, `.skip`, `.todo`).
8. Guides: list `guides/*.md` with each guide's subject in a few words; name which are vendored
   mirrors of dependency guides.
9. Registration: how a consumer registers probe as an MCP server — any `.mcp.json` example,
   README or guide instructions, and what the `probe` bin invocation looks like.

## Return shape

- `Question`: one line.
- `Evidence`: concise `file:line` bullets per numbered area.
- `Distillate`: the smallest summary the next engine needs, at most sixty lines.
- `Unknowns`: unresolved facts, not recommendations.
