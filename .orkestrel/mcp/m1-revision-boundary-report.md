## 1. What changed and why

- `src/core/types.ts`: separated modern and legacy revision types. Bare discovery now exposes only the modern revision.
- `src/core/constants.ts`: split modern, legacy, and full client revision sets.
- `src/core/validators.ts`: added disjoint modern and legacy revision guards.
- `src/core/inferers.ts`: limited server revision inference to the modern revision.
- `src/core/helpers.ts`: made discovery modern-only while retaining legacy initialization support for the decorator.
- `src/core/MCPServer.ts`: rejected legacy and unknown stamped revisions with `-32022`; removed bare-server `ping`.
- `src/core/MCPLegacy.ts`: handled legacy `ping` inside the decorator while retaining legacy initialization and tool translation.
- `src/core/MCPClient.ts`: kept discovery and retries modern-only while preserving explicit legacy pin and handshake support.
- `tests/src/core/integration.test.ts`: added the revision-boundary era matrix.
- `tests/src/core/MCPClient.test.ts`: covered modern-only discovery, retry filtering, and request stamping.
- `tests/src/core/MCPLegacy.test.ts`: proved that legacy `ping` remains decorator-owned.
- `tests/src/core/MCPServer.test.ts`: covered legacy rejection, modern retry data, and removal of bare `ping`.
- `tests/src/core/helpers.test.ts`: updated discovery and binder expectations.
- `tests/src/core/inferers.test.ts`: proved that legacy-only offers cannot select a modern revision.
- `tests/src/core/validators.test.ts`: covered the disjoint revision guards and full client revision set.
- `tests/src/server/middlewares.test.ts`: made the allowed mechanical consumer update so its modern request fixture uses the modern revision.
- `guides/mcp.md`: documented the server, decorator, and client revision boundaries and updated API parity.

## 2. Red-first evidence

Exact command:

```text
npx vitest run --config vite.config.ts --no-cache --reporter=verbose --project src:core tests/src/core/integration.test.ts
```

Before implementation:

```text
Test Files  1 failed (1)
Tests       4 failed (4)
```

Failing tests:

```text
MCP revision boundary > advertises only the modern revision from a bare server
MCP revision boundary > rejects every non-modern stamped revision with modern-scoped retry data
MCP revision boundary > serves legacy initialize and ping only through createMCPLegacy
MCP revision boundary > keeps client requests modern after negotiating with a bare server
```

The same command after implementation:

```text
Test Files  1 passed (1)
Tests       4 passed (4)
```

## 3. Era matrix results

| Case | Result |
|---|---|
| Bare discovery advertises only `2026-07-28` | Pass |
| Bare requests stamped `2025-11-25`, `2025-06-18`, or `2099-01-01` return `-32022` with modern-only retry data | Pass |
| `createMCPLegacy` handles legacy initialization and `ping` | Pass |
| Bare unstamped initialization and `ping` return `-32601` | Pass |
| Modern-stamped `ping` returns `-32601` | Pass |
| Client negotiation against a bare server remains modern through rediscovery and tool calls | Pass |

## 4. Observations

Passed:

```text
npm run check
```

```text
npx oxfmt --config .oxfmtrc.json --check guides/mcp.md src/core/MCPClient.ts src/core/MCPLegacy.ts src/core/MCPServer.ts src/core/constants.ts src/core/helpers.ts src/core/inferers.ts src/core/types.ts src/core/validators.ts tests/src/core/MCPClient.test.ts tests/src/core/MCPLegacy.test.ts tests/src/core/MCPServer.test.ts tests/src/core/helpers.test.ts tests/src/core/inferers.test.ts tests/src/core/validators.test.ts tests/src/core/integration.test.ts tests/src/server/middlewares.test.ts
```

```text
npx oxlint --config .oxlintrc.json --deny-warnings src/core/MCPClient.ts src/core/MCPLegacy.ts src/core/MCPServer.ts src/core/constants.ts src/core/helpers.ts src/core/inferers.ts src/core/types.ts src/core/validators.ts tests/src/core/MCPClient.test.ts tests/src/core/MCPLegacy.test.ts tests/src/core/MCPServer.test.ts tests/src/core/helpers.test.ts tests/src/core/inferers.test.ts tests/src/core/validators.test.ts tests/src/core/integration.test.ts tests/src/server/middlewares.test.ts
```

```text
npx vitest run --config vite.config.ts --no-cache --reporter=dot --project src:core tests/src/core/helpers.test.ts tests/src/core/inferers.test.ts tests/src/core/MCPLegacy.test.ts tests/src/core/validators.test.ts tests/src/core/MCPServer.test.ts
```

Result: `5` files and `489` tests passed.

```text
npx vitest run --config vite.config.ts --no-cache --reporter=dot --project src:core tests/src/core/MCPClient.test.ts -t "invalid runtime pin|exposes discover|legacy-only offer|surfaces -32022|does not advertise the pinned modern revision|no further discovery|owns an inbound response"
```

Result: selected client cases passed.

```text
git diff --check
```

The host must run these listener-dependent or whole-tree gates:

```text
npm run test:src:core
```

The sandbox rejects listener creation with `listen EPERM ... 127.0.0.1`.

```text
npm run test:src:server
npm run test:conformance
npm run test:integration
```

These require real listener or service access unavailable in the sandbox.

```text
npm run test:src:browser
npm run test:guides
npm run test:distribution -- --mode release
```

These are non-core, spawned-process, browser, or release-distribution gates outside the permitted scoped run.

```text
npm run format:check
npm run lint:check
npm run build
npm test
```

These are whole-tree acceptance gates reserved for the Orchestrator host. Scoped formatting, linting, checking, and relevant tests passed.

## 5. Unknowns

- Host listener-dependent results remain unknown until the listed commands run outside the sandbox.
- Release-distribution behavior remains unknown because package installation, network access, and release-mode consumer execution were unavailable.
- `src/server/handlers.ts` required no edit: its existing use of `SUPPORTED_PROTOCOL_VERSIONS` now emits modern-only retry data.
- No browser source consumer required an update.

## 6. Deviations

None.

The initial worktree was clean. No package, version, commit, installation, or public identifier changes were made. No server or browser source file changed. The only non-core edit was the permitted mechanical server-test fixture update.

## 7. Actual repository output

`git diff --stat`:

```text
 guides/mcp.md                        | 130 ++++++++++++++++++++---------------
 src/core/MCPClient.ts                |  39 ++++++-----
 src/core/MCPLegacy.ts                |   1 +
 src/core/MCPServer.ts                |  11 ++-
 src/core/constants.ts                |  35 ++++++----
 src/core/helpers.ts                  |  13 ++--
 src/core/inferers.ts                 |   8 +--
 src/core/types.ts                    |  25 ++++---
 src/core/validators.ts               |  32 ++++++++-
 tests/src/core/MCPClient.test.ts     |  40 ++++-------
 tests/src/core/MCPLegacy.test.ts     |   2 +-
 tests/src/core/MCPServer.test.ts     |  41 ++++++-----
 tests/src/core/helpers.test.ts       |  16 +++--
 tests/src/core/inferers.test.ts      |   5 +-
 tests/src/core/validators.test.ts    |  19 ++++-
 tests/src/server/middlewares.test.ts |   8 +--
 16 files changed, 249 insertions(+), 176 deletions(-)
```

`git status --porcelain`:

```text
 M guides/mcp.md
 M src/core/MCPClient.ts
 M src/core/MCPLegacy.ts
 M src/core/MCPServer.ts
 M src/core/constants.ts
 M src/core/helpers.ts
 M src/core/inferers.ts
 M src/core/types.ts
 M src/core/validators.ts
 M tests/src/core/MCPClient.test.ts
 M tests/src/core/MCPLegacy.test.ts
 M tests/src/core/MCPServer.test.ts
 M tests/src/core/helpers.test.ts
 M tests/src/core/inferers.test.ts
 M tests/src/core/validators.test.ts
 M tests/src/server/middlewares.test.ts
?? tests/src/core/integration.test.ts
```