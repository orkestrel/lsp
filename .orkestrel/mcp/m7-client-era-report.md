| Item | What changed | Proof |
|---|---|---|
| Bare client | Removed legacy negotiation and fallback. Discovery failures name `createMCPLegacyClientTransport`. `MCPClientOptions.version` accepts `MCPModernVersion`. | `npx vitest run --config vite.config.ts --no-cache --reporter=dot --project src:core tests/src/core/MCPClient.test.ts -t "names the legacy adapter"` — red: `Tests 6 failed \| 129 skipped (135)`; green: `Tests 6 passed \| 129 skipped (135)` |
| Adapter | Added `MCPLegacyClientTransport` and `createMCPLegacyClientTransport`. The adapter performs `initialize`, synthesizes modern discovery, removes modern request metadata, and restores modern results. | `npx tsc --noEmit -p configs/src/tsconfig.core.json` — exit `0` |
| Fixture proof | Added in-process handshake, discovery, `tools/list`, `tools/call`, refusal, and fixture-negative-control rows. | `npx vitest run --config vite.config.ts --no-cache --reporter=dot --project src:core tests/src/core/MCPLegacyClientTransport.test.ts` — red: `Tests 4 failed \| 1 passed (5)`; green: `Tests 5 passed (5)` |
| Guide | Not changed because the scope deviation stopped the unit. | Not run |

Adapter decisions:

| Decision | Result |
|---|---|
| Name | `MCPLegacyClientTransport`; factory `createMCPLegacyClientTransport` |
| Seam | Decorates `MCPClientTransportInterface` |
| Handshake | Offers `MCP_PROTOCOL_VERSION` unless `version` names another supported legacy revision |
| Downward translation | `modernInvocationToLegacy` removes protocol version, client capabilities, and client identity metadata while retaining legacy-compatible metadata |
| Upward translation | `legacyResultToModern` adds `resultType`, server identity, and cache fields for `tools/list` |
| Shared helper home | `src/core/helpers.ts`: `legacyInvocationToModern`, `modernInvocationToLegacy`, `legacyResultToModern`, and `modernResultToLegacy` |
| Server decorator | `MCPLegacy` mechanically calls the shared helpers; its intended behavior is unchanged |

Test rulings caused by narrowing:

| Existing row | Ruling |
|---|---|
| `keeps a pinned legacy handshake unchanged, including its initialized notification` | Move to the adapter suite. |
| `rejects an unsupported legacy protocol, closes, and sends no initialized notification` | Move to the adapter suite. |
| `rejects a pinned legacy reply that negotiates a different supported revision` | Move to the adapter suite. |
| `rejects an absent legacy protocol and closes before initialization completes` | Move to the adapter suite. |
| `rejects a malformed legacy protocol and closes before initialization completes` | Move to the adapter suite. |
| `accepts a legacy result with no resultType` | Replace with bare-client refusal; prove restoration through the adapter. |
| `leaves the client disconnected when the initialized notification fails to send` | Move to the adapter suite. |
| `rejects a superseded legacy connect when disconnect lands during the initialized notification` | Move to the adapter suite. |
| `rejects a superseded legacy connect when disconnect lands during the initialize round trip` | Move to the adapter suite. |
| `leaves a live session untouched when a superseded attempt finally unwinds` | Rework around the adapter-owned handshake. |
| `settles a superseded attempt whose wire write never lands, then admits the next connect` | Rework around the adapter-owned handshake. |
| `still surfaces a failing initialized notification on a reconnect after a disconnect` | Move to the adapter suite. |
| `waits for its own handshake write on a reconnect after an earlier disconnect` | Move to the adapter suite. |
| `CONTROL — a legacy initialize result legitimately carries none and still connects` | Move to the adapter suite as its legacy control. |

Deviation:

- Expected: `npm run check` passes using only owned files.
- Found: it exits `2` because stale legacy client pins also occur in off-scope `tests/integration.test.ts`, `tests/src/core/helpers.test.ts`, `tests/src/server/factories.test.ts`, `tests/src/server/middlewares.test.ts`, and `tests/src/server/transports/HTTPClientTransport.test.ts`.
- Evidence: each diagnostic reports `MCPVersion` or `MCPLegacyVersion` is not assignable to `"2026-07-28"`.
- Done: the modern-only client, adapter implementation, shared translation helpers, refusal proof, and adapter fixture proof are present.
- Not done: off-scope test migration, remaining owned client-row migration, guide changes, formatting/lint gates, final projects, and acceptance gates.
- Hypothesis: the brief’s owned-file list omitted integration and transport tests that explicitly exercised the removed client legacy pin.

Actual `git diff --stat` output:

```text
 src/core/MCPClient.ts            | 107 +++++++----------------------------
 src/core/MCPLegacy.ts            |  54 ++++--------------
 src/core/factories.ts            |  24 ++++++++
 src/core/helpers.ts              | 117 +++++++++++++++++++++++++++++++++++++++
 src/core/index.ts                |   1 +
 src/core/types.ts                |  37 ++++++++++---
 tests/src/core/MCPClient.test.ts |  32 ++++++-----
 7 files changed, 222 insertions(+), 150 deletions(-)
```

Actual `git status --porcelain` output:

```text
 M src/core/MCPClient.ts
 M src/core/MCPLegacy.ts
 M src/core/factories.ts
 M src/core/helpers.ts
 M src/core/index.ts
 M src/core/types.ts
 M tests/src/core/MCPClient.test.ts
?? src/core/MCPLegacyClientTransport.ts
?? tests/src/core/MCPLegacyClientTransport.test.ts
```