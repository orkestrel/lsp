# M4 — name the stdio ingress contract

- **Role and engine**: `implementer`, Opus 5, native. Writing unit, sole writer in the mcp
  checkout.
- **Objective**: `createStdioServer`'s anonymous return type becomes a declared, documented
  public contract.

## Context

- Repository: `C:\Users\mikes\WebstormProjects\mcp`, clean `main` at the commit the dispatch
  message names (after the MF2 fix round). Commit nothing.
- Read first: `AGENTS.md` (types-first; single-word entity APIs), `.claude/rules/names.md`,
  `.claude/rules/typescript.md`, `.claude/rules/documentation.md`.
- Today: `export function createStdioServer(...): { start(): void; stop(): void }`
  (`src/server/factories.ts` around `:387`). `AGENTS.md` requires reusable and public types in
  `*/types.ts`; a consumer cannot declare a variable of this type. `StdioServerOptions` already
  sits in `src/server/types.ts` (around `:478`) with nothing to pair with.

## Tasks

1. Declare `StdioServerInterface` in `src/server/types.ts` beside `StdioServerOptions`, with
   TSDoc in the file's voice: `start` and `stop`, each documented with what it does and its
   idempotence if the implementation has it (read the factory body; document what is true).
2. `createStdioServer` returns `StdioServerInterface`.
3. `guides/mcp.md`: the Types table row for the new interface; the `createStdioServer` Surface
   row's prose names the returned contract. Follow the guide's existing row shapes exactly.
4. If the parity gate requires a Methods table for a behavioral interface, add it per
   `.claude/rules/documentation.md` (one method table keyed by the backticked name).

## Scope

- Owned: `src/server/types.ts`, `src/server/factories.ts`, `guides/mcp.md` (only the named
  rows), and the narrowest test file the parity gate forces.
- Off-limits: everything else.

## Execution

Perform the assignment directly and spawn nothing. Validate scoped: `npm run check`, scoped
oxlint and oxfmt `--check` on owned files, `npm run test:src:server`, `npm run test:guides`.
No tree-wide commands.

## Output

Report to `tmp/units/m4-report.md` and as your final message: the declaration as landed, the
guide rows, the run counts.

## Deviation contract

Stop and report when a test outside the owned files reddens or the parity gate demands a change
outside them. Ancillary choices (TSDoc wording) are yours to decide and record.

## Acceptance criteria

1. The interface is declared in `src/server/types.ts`, the factory returns it, and no anonymous
   object type remains in the factory's signature.
2. `npm run check`, scoped lint and format, `test:src:server`, `test:guides` green.
