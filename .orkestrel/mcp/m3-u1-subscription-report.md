## 1. What changed

- `src/core/types.ts`: added the exact `MCPSubscriptionStream`, `MCPListenOptions`, and `MCPClientInterface.listen` contracts.
- `src/core/validators.ts`: added and exported `isMCPSubscriptionResult`.
- `src/core/constants.ts`: added `DEFAULT_MCP_SUBSCRIPTION_CAPACITY` with value `64`.
- `src/core/MCPClient.ts`: implemented bounded subscription queues on pending entries, direct parked-read delivery, stamped-frame routing, terminal validation, cancellation, overflow failure, disconnect cleanup, and transport-close handling.
- `tests/setup.ts`: extended `createLoopbackTransport` to iterate held-open answers and emit every yielded frame plus the terminal. Added request recording, peer-frame injection, and `createSubscriptionServer`.
- `tests/src/core/MCPClient.test.ts`: added literal coverage for wire defaulting, acknowledgement order, owned frames, graceful closure, isolation, ordinary notifications, late-frame disposal, peer and malformed errors, abort behavior, `return()`, overflow, disconnect, and transport closure.
- `tests/src/core/validators.test.ts`: added valid, malformed, hostile-input, and published-guard-totality coverage.
- `src/core/index.ts`: untouched; existing star exports expose the constant, types, and guard.

## 2. Red-first records

- Types red: `npm run check:src:core` exited `2`. TypeScript reported that `MCPClient` lacked the required `listen` method in `MCPClient.ts` and `factories.ts`.
- Types green: the same command exited `0`.
- Client behavior red: `npx vitest run --config vite.config.ts --no-cache --reporter=dot --project src:core tests/src/core/MCPClient.test.ts` exited `1`. Every subscription row rejected from the pre-implementation refusal. The sandbox also produced unrelated `listen EPERM` failures in the existing HTTP rows.
- Client behavior green: `npx vitest run --config vite.config.ts --no-cache --reporter=dot --project src:core tests/src/core/MCPClient.test.ts -t 'subscriptions/listen'` exited `0`; `12 passed`.
- Validator census red: `npx vitest run --config vite.config.ts --no-cache --reporter=dot --project src:core tests/src/core/validators.test.ts` exited `1` because `isMCPSubscriptionResult` was absent from `PUBLISHED_GUARDS`.
- Validator green: the same command exited `0`; `135 passed`.

## 3. Mutation account

- Mutation: inserted `return false` as the opening line of `#routeSubscription`.
- Mutated `cmp -s tmp/m3-u1/MCPClient.ts.backup src/core/MCPClient.ts` reading: `1`.
- Mutation command: `npx vitest run --config vite.config.ts --no-cache --reporter=dot --project src:core tests/src/core/MCPClient.test.ts -t 'keeps concurrent subscriptions isolated by their stamped request ids|drops a late stamped frame after its subscription has closed|progress'`.
- Exact red cases:
  - `keeps concurrent subscriptions isolated by their stamped request ids`
  - `drops a late stamped frame after its subscription has closed`
- The progress rows remained green: `5 passed`; the named mutation cases failed.
- Restored `cmp` reading: `0`.
- The restored mutation command exited `0`; `7 passed`.

## 4. Unknowns readings

- The installed TypeScript library declares `AsyncGenerator` as extending `AsyncIteratorObject`. The loaded disposable library merges `AsyncIteratorObject` with `AsyncDisposable`, so `MCPSubscriptionStream` receives iterator disposal without another wrapper interface. Its explicit `return` requires an `MCPSubscriptionResult`.
- The loopback extension caused no non-network regression in the unfiltered client file: all non-HTTP rows passed. The existing HTTP rows could not open `127.0.0.1` in this sandbox.
- The acknowledgement method is `notifications/subscriptions/acknowledged`.
- The terminal carries no notification method. It is a correlated JSON-RPC result containing `resultType: 'complete'` and stamped `_meta`.
- The design record dropped a bespoke loopback extension, while this brief explicitly required extending `tests/setup.ts`. The brief won; the tests still drive a real `createMCPServer` through that loopback.

## 5. Scoped gate readings

- Subscription client rows: exit `0`; `12 passed`.
- Unfiltered client file: exit `1`; `134 passed`, with the existing HTTP cases failing because socket `listen` returned `EPERM`.
- Validators file: exit `0`; `135 passed`.
- Scoped `oxfmt --check`: exit `0`.
- Scoped `oxlint --deny-warnings`: exit `0`.
- `npm run check:src:core`: exit `0`.
- `git diff --check`: exit `0`.
- Diff scope contains only the owned files.

## 6. Observations outside scope

- Guide parity capability, owned by U2: `guides/mcp.md` still needs the `listen` surface, lifecycle obligations, and duplex-only incremental-delivery limit.
- HTTP subscription delivery capability: HTTP client transports still buffer event streams to closure; this unit did not touch those paths.
- Transport ingress backpressure capability: the bounded client queue limits retained frames but does not propagate demand into push transports.

## 7. Claims needing host verification

- Re-run the unfiltered client command on a host that permits `127.0.0.1` ephemeral listeners. This sandbox cannot establish its required same-command green.
- Run the authoritative integrated gates after U2 lands the guide changes.
- An unfiltered mutation-project reading also needs a socket-capable host; the scoped mutation command isolated the required cases here.