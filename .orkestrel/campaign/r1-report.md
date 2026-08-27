# R1 report — stdio transport family rename to the client-half convention

## Rename table confirmed

| Old | New | Result |
| --- | --- | --- |
| class `StdioTransport` | `StdioClientTransport` | done |
| interface `StdioTransportInterface` | `StdioClientTransportInterface` | done |
| interface `StdioTransportOptions` | `StdioClientTransportOptions` | done |
| factory `createStdioTransport` | `createStdioClientTransport` | done |
| file `src/server/transports/StdioTransport.ts` | `src/server/transports/StdioClientTransport.ts` | done, via `git mv` |
| file `tests/src/server/transports/StdioTransport.test.ts` | `tests/src/server/transports/StdioClientTransport.test.ts` | done, via `git mv` |

Guide heading `## Stdio transport` renamed to `## Stdio client transport` in `guides/lsp.md`.
`guides/README.md` link target updated from `lsp.md#stdio-transport` to
`lsp.md#stdio-client-transport`. Common-noun prose ("the stdio transport" inside `LSPError`
messages and TSDoc) left unchanged, per the brief.

ROADMAP edits: the `## Next` row `SocketTransport` renamed to `SocketClientTransport`; the
WebSocket row replaced with the `WebSocketClientTransport` row text specified in the brief. No
other ROADMAP line changed.

## Reference-sweep proof

Command:

```
grep -rn "StdioTransport\b\|createStdioTransport\b" src tests guides ROADMAP.md README.md
```

Result: one match only, in the off-limits vendored mirror:

```
guides/probe.md:749:- **The transport is `createStdioTransport` from `@orkestrel/lsp/server`.** Its command vector is
```

`guides/probe.md` was not touched.

## Commands run, with counts

- `git mv src/server/transports/StdioTransport.ts src/server/transports/StdioClientTransport.ts`
  and the test-file `git mv` — both succeeded, confirmed by `git status --porcelain` reporting `R`.
- Reference rename applied by a Node script over the nine owned non-renamed-name files
  (`src/server/types.ts`, `src/server/factories.ts`, `src/server/index.ts`,
  `src/server/transports/StdioClientTransport.ts`, `tests/setupServer.ts`,
  `tests/src/server/factories.test.ts`, `tests/src/server/index.test.ts`,
  `tests/src/server/integration.test.ts`, `tests/src/server/transports/StdioClientTransport.test.ts`)
  — all 9 files reported changed.
- `guides/lsp.md`, `guides/README.md`, `ROADMAP.md` edited directly for prose/table/heading/link
  rows.
- `npm run lint:check` — exit 0, no warnings.
- `npm run check:src:server` — exit 0 (`tsc --noEmit -p configs/src/tsconfig.server.json`).
- `npm run format:check` — failed once (`guides/lsp.md`, `src/server/factories.ts`,
  `tests/src/server/index.test.ts` needed reflow from the edited lines), fixed by running
  `oxfmt --config .oxfmtrc.json` scoped to exactly those 3 files (not a tree-wide `format`), then
  `npm run format:check` passed: "All matched files use the correct format." on 154 files.
- `npm run test:src:server` — 4 test files passed, 20 tests passed, no test logic changed (renames
  only).
- `npm run test:guides` — 1 test file passed, 27 tests passed (anchor and surface rows resolve).

## `git diff --stat`

```
 ROADMAP.md                                         | 10 +++---
 guides/README.md                                   |  2 +-
 guides/lsp.md                                      | 20 ++++++------
 src/server/factories.ts                            | 12 ++++---
 src/server/index.ts                                |  2 +-
 src/server/transports/StdioClientTransport.ts      |  8 ++---
 src/server/types.ts                                |  4 +--
 tests/setupServer.ts                               |  8 ++---
 tests/src/server/factories.test.ts                 |  6 ++--
 tests/src/server/index.test.ts                     |  5 ++-
 tests/src/server/integration.test.ts               |  4 +--
 .../server/transports/StdioClientTransport.test.ts | 38 +++++++++++-----------
 12 files changed, 63 insertions(+), 56 deletions(-)
```

## `git status --porcelain`

```
 M ROADMAP.md
 M guides/README.md
 M guides/lsp.md
 M src/server/factories.ts
 M src/server/index.ts
RM src/server/transports/StdioTransport.ts -> src/server/transports/StdioClientTransport.ts
 M src/server/types.ts
 M tests/setupServer.ts
 M tests/src/server/factories.test.ts
 M tests/src/server/index.test.ts
 M tests/src/server/integration.test.ts
RM tests/src/server/transports/StdioTransport.test.ts -> tests/src/server/transports/StdioClientTransport.test.ts
```

Every changed path is an owned file from the brief's scope, with the two designated renames.
`guides/probe.md` is untouched. No deviation occurred.
