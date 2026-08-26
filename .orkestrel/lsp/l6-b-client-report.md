## 1. What changed

- [src/core/LSPClient.ts](/home/user/lsp/src/core/LSPClient.ts:155): `open` snapshots the required signal, rejects an already-aborted call before URI ownership or `didOpen`, and passes the signal to push or pull diagnostics. Caller aborts reject with `aborted`, preserve client readiness and URI ownership, and send `$/cancelRequest` for active pull requests. Constructor timeout remains on lifecycle requests and teardown settlement. The class example uses the required options and closes the URI.
- [tests/src/core/LSPClient.test.ts](/home/user/lsp/tests/src/core/LSPClient.test.ts:437): added every pinned row, converted the former diagnostics-timeout rows to caller-signal behavior, updated every existing `open` call, and retained the lifecycle regression rows.
- [tests/src/server/integration.test.ts](/home/user/lsp/tests/src/server/integration.test.ts:40): the named call passes `{ signal: AbortSignal.timeout(10_000) }`; the constructor keeps `timeout: 10_000`.

## 2. Red-first records

The red and green runs used the command shown for each row.

| Row and command | Red reading | Green reading |
| --- | --- | --- |
| `refuses an already-aborted open before writing document open`<br>`npm run test:src:core -- tests/src/core/LSPClient.test.ts -t 'refuses an already-aborted open before writing document open'` | Exit 1: recorder contained `textDocument/didOpen`. | Exit 0: passed. |
| `aborts a pushed diagnostic wait without destroying the client`<br>`npm run test:src:core -- tests/src/core/LSPClient.test.ts -t 'aborts a pushed diagnostic wait without destroying the client'` | Exit 1: received `timeout`, expected `aborted`. | Exit 0: passed. |
| `keeps a push-aborted document closeable`<br>`npm run test:src:core -- tests/src/core/LSPClient.test.ts -t 'keeps a push-aborted document closeable'` | Exit 1: received `timeout`, expected `aborted`. | Exit 0: passed. |
| `aborts a pulled diagnostic request and writes cancellation`<br>`npm run test:src:core -- tests/src/core/LSPClient.test.ts -t 'aborts a pulled diagnostic request and writes cancellation'` | Exit 1: received `timeout`, expected `aborted`. | Exit 0: passed with the canceled request ID recorded in `$/cancelRequest`. |
| `keeps a pull-aborted document closeable`<br>`npm run test:src:core -- tests/src/core/LSPClient.test.ts -t 'keeps a pull-aborted document closeable'` | Exit 1: received `timeout`, expected `aborted`. | Exit 0: passed. |
| `resolves pushed diagnostics after the constructor timeout has elapsed`<br>`npm run test:src:core -- tests/src/core/LSPClient.test.ts -t 'resolves pushed diagnostics after the constructor timeout has elapsed'` | Exit 1: constructor timeout rejected the publication wait. | Exit 0: delayed publication resolved. |
| `resolves pulled diagnostics after the constructor timeout has elapsed`<br>`npm run test:src:core -- tests/src/core/LSPClient.test.ts -t 'resolves pulled diagnostics after the constructor timeout has elapsed'` | Exit 1 under the isolated baseline-call control: the diagnostic request rejected with `timeout`. | Exit 0: delayed response resolved. |
| `isolates a call abort from another pending open`<br>`npm run test:src:core -- tests/src/core/LSPClient.test.ts -t 'isolates a call abort from another pending open'` | Exit 1: the affected call received `timeout`, not `aborted`. | Exit 0: passed; the unrelated publication settled. |

The delayed push and pull success rows are load-bearing and passed after the configured `10 ms` constructor timeout had elapsed.

## 3. Listener-hygiene reading

Pending requests and publications retain their signal and bound abort listener at [LSPClient.ts:76](/home/user/lsp/src/core/LSPClient.ts:76). Push registration occurs at [LSPClient.ts:343](/home/user/lsp/src/core/LSPClient.ts:343), and request registration occurs at [LSPClient.ts:374](/home/user/lsp/src/core/LSPClient.ts:374).

Publication settlement deletes the record and removes its exact listener at [LSPClient.ts:594](/home/user/lsp/src/core/LSPClient.ts:594). Request settlement does the same at [LSPClient.ts:604](/home/user/lsp/src/core/LSPClient.ts:604). Responses, publications, send failures, caller aborts, lifecycle timeouts, transport exit, close, and destruction route through these settlement methods.

## 4. Scoped gate readings

- `npm run test:src:core -- tests/src/core/LSPClient.test.ts` — exit 0; the unfiltered file passed.
- `npx oxfmt --check src/core/LSPClient.ts tests/src/core/LSPClient.test.ts tests/src/server/integration.test.ts` — exit 0.
- `npx oxlint --deny-warnings src/core/LSPClient.ts tests/src/core/LSPClient.test.ts tests/src/server/integration.test.ts` — exit 0.
- `npm run check` — exit 0 tree-wide.
- `git diff --check` — exit 0.

## 5. Observations outside scope

- L6-A owns the held [src/core/types.ts](/home/user/lsp/src/core/types.ts) and [src/core/factories.ts](/home/user/lsp/src/core/factories.ts) changes. This unit did not alter them.
- L6-D owns the held [guides/lsp.md](/home/user/lsp/guides/lsp.md) change. This unit did not alter it.
- L6-B host verification is Orchestrator-owned: `npm run test:src:server -- tests/src/server/integration.test.ts` was not run in the bench sandbox because it spawns the real language server.
- L6-B host instrumentation is Orchestrator-owned: the `probe` MCP receipt is unavailable under approval policy `never`.
- L6-E preparation is Orchestrator-owned: rebuild and repack the tarball after this unit before running the probe consumer.