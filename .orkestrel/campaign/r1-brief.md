# R1 — stdio transport family rename to the client-half convention

## Role and engine

`builder` — Sonnet native. Fully specified; every name and replacement is fixed by this brief.

## Objective

Rename lsp's stdio transport family to the mcp client-half convention, atomically, with no
compatibility alias, and rename the ROADMAP's deferred transport rows to the same convention.

## Context

Read before editing: `AGENTS.md` non-negotiables; `.claude/rules/names.md` § Acronyms;
`.claude/rules/architecture.md` § Barrel exports. Dispatch-named skill: none (this unit is a
mechanical rename inside one package; the campaign's cross-package skill governs the
Orchestrator's plan, not this unit's mechanics).

Baseline: the clean commit the Orchestrator dispatches you from (confirm
`git status --porcelain` shows only `.orkestrel/` artifacts or nothing). Host: Windows 11; npm
scripts as plain single commands.

The renames, exact:

| Old | New |
| --- | --- |
| class `StdioTransport` | `StdioClientTransport` |
| interface `StdioTransportInterface` | `StdioClientTransportInterface` |
| interface `StdioTransportOptions` | `StdioClientTransportOptions` |
| factory `createStdioTransport` | `createStdioClientTransport` |
| file `src/server/transports/StdioTransport.ts` | `src/server/transports/StdioClientTransport.ts` |
| file `tests/src/server/transports/StdioTransport.test.ts` | `tests/src/server/transports/StdioClientTransport.test.ts` |

Perform file renames with `git mv`. Update every reference in the owned files — imports, barrel
row, TSDoc prose that names the old identifiers, guide heading, guide surface rows, guide
examples, and the guides README anchor. The guide heading `## Stdio transport` becomes
`## Stdio client transport`, and the `guides/README.md` link target `lsp.md#stdio-transport`
becomes `lsp.md#stdio-client-transport`. Prose that says "the stdio transport" as a common noun
may stay; prose naming an identifier changes with it.

ROADMAP edits, exact and only these:

1. In `## Next`, the row starting `- **\`SocketTransport\`.**` becomes
   `- **\`SocketClientTransport\`.**` with the rest of the row unchanged.
2. In `## Next`, the WebSocket row is replaced by:
   `- **\`WebSocketClientTransport\`.** Client halves mirroring the mcp package's pair: a Node`
   `  half that can build on \`@orkestrel/websocket\` the way mcp's server-side client transport`
   `  does, and a browser half over the platform \`WebSocket\` — each prepending the header bytes`
   `  on \`message\` and stripping them on \`send\`, so the client keeps the byte seam unchanged.`
   `  A consumer that must reach a language server over WebSocket triggers it.`
3. No other ROADMAP line changes. The Delivered row for this rename is written later by the
   campaign's consolidated ROADMAP unit, with this unit's commit hash.

## Scope

- Owned: `src/server/types.ts`, `src/server/factories.ts`,
  `src/server/transports/StdioTransport.ts` (renamed), `src/server/index.ts`,
  `tests/setupServer.ts`, `tests/src/server/factories.test.ts`,
  `tests/src/server/index.test.ts`, `tests/src/server/integration.test.ts`,
  `tests/src/server/transports/StdioTransport.test.ts` (renamed), `guides/lsp.md`,
  `guides/README.md`, `ROADMAP.md`.
- Off limits: `guides/probe.md` (a vendored mirror that still names `createStdioTransport`;
  leave it byte-identical — it refreshes when the probe package republishes), `src/core/**`,
  `package.json`, everything else.
- Validation, read-only and scoped: `npm run lint:check`, `npm run check:src:server`,
  `npm run test:src:server`, `npm run test:guides`, `npm run format:check`. Do not run
  `format`, `lint --fix`, `build`, or full `npm test`.

## Execution

You perform this assignment directly and spawn nothing.

## Output

Write the report to `tmp/units/r1-report.md` and return it: the rename table confirmed, the
reference sweep result (the exact search proving no old identifier remains outside
`guides/probe.md`), commands with counts, `git diff --stat`, `git status --porcelain`.

## Deviation contract

Stop and report if any reference to the old names exists outside the owned files and
`guides/probe.md`, or if a gate fails for a cause outside the rename. Everything else in this
brief is fixed; no ancillary decisions remain.

## Acceptance criteria, cheap first

1. `git status --porcelain` shows only the owned files (two as renames).
2. `grep -rn "StdioTransport\b\|createStdioTransport\b" src tests guides ROADMAP.md README.md`
   matches only `guides/probe.md`.
3. `npm run lint:check`, `npm run check:src:server`, `npm run format:check` green.
4. `npm run test:src:server` green with no test logic changed (renames only).
5. `npm run test:guides` green (anchor and surface rows resolve).
