## Owned files and decisions

- `src/core/LSPClient.ts`: Implements handshake, encoding validation, synchronization gating, push/pull diagnostics, correlation, cancellation, abort, exit handling, framing faults, and bounded idempotent destruction.
- `src/core/factories.ts`: Adds `createLSPClient`.
- `src/core/index.ts`: Exports the client and factory.
- `tests/src/core/LSPClient.test.ts`: Keeps the entity-specific fixture local. The fixture exchanges encoded bytes through the real codec and includes an ordering negative control.
- `tests/src/core/factories.test.ts`: Proves factory construction.
- Request bookkeeping uses monotonic IDs and a correlated pending map. Push publications use a URI-keyed table.
- Destruction uses the configured timeout, defaulting to 30 seconds, for shutdown and transport-close waits.

## Acceptance

```text
$ npx oxfmt --config .oxfmtrc.json --check src/core/LSPClient.ts src/core/factories.ts src/core/index.ts tests/src/core/LSPClient.test.ts tests/src/core/factories.test.ts
Checking formatting...

All matched files use the correct format.
Finished in 3ms on 5 files using 4 threads.
```

Exit 0.

```text
$ npx oxlint --config .oxlintrc.json --deny-warnings src/core/LSPClient.ts src/core/factories.ts src/core/index.ts tests/src/core/LSPClient.test.ts tests/src/core/factories.test.ts
```

No output; exit 0.

```text
$ npm run check:src:core
> @orkestrel/lsp@0.0.1 check:src:core
> tsc --noEmit -p configs/src/tsconfig.core.json
```

Exit 0.

```text
$ npm run check
> @orkestrel/lsp@0.0.1 check:src:server
> tsc --noEmit -p configs/src/tsconfig.server.json
```

Exit 0.

```text
$ npx vitest run --config vite.config.ts --no-cache --reporter=verbose --project src:core
 Test Files  5 passed (5)
      Tests  51 passed (51)
   Start at  21:34:26
   Duration  785ms (transform 1.08s, setup 197ms, import 1.10s, tests 102ms, environment 1ms)
```

Exit 0.

## Deviations

None.

## Git output

```text
$ git diff --stat
 src/core/index.ts | 2 ++
 1 file changed, 2 insertions(+)
```

Git omits untracked files from this stat.

```text
$ git status --porcelain
 M src/core/index.ts
?? src/core/LSPClient.ts
?? src/core/factories.ts
?? tests/src/core/LSPClient.test.ts
?? tests/src/core/factories.test.ts
```