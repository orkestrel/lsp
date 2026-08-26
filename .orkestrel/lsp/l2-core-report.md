## Owned files

- `src/core/types.ts`: v1 JSON-RPC, LSP wire, transport, client, initialization, and error contracts.
- `src/core/constants.ts`: methods, encodings, named wire errors, and the 67,108,864-byte (64 MiB) content limit.
- `src/core/errors.ts`: branded `LSPError` and total `isLSPError` guard.
- `src/core/validators.ts`: total envelope, diagnostic, report, capability, and initialization guards.
- `src/core/parsers.ts`: incremental split/coalesced frame decoding, charset validation, size refusal, UTF-8 decoding, and JSON-RPC validation.
- `src/core/helpers.ts`: byte-accurate frame encoding.
- `src/core/index.ts`: sole public barrel.
- `src/core/factories.ts`: not created. L2 introduces no entity factory.
- `tests/src/core/helpers.test.ts`: encoding and serialization proofs.
- `tests/src/core/validators.test.ts`: valid, wrong-typed, primitive, null, and hostile-proxy guard proofs.
- `tests/src/core/parsers.test.ts`: astral content, split headers, coalesced frames, charset, limit, and malformed JSON proofs.
- `tests/src/core/index.test.ts`: placeholder removed.

## InitializeParams resolution

| Model member | Model `optional` | Decision |
|---|---:|---|
| `processId` | false | Included as `number \| null` |
| `clientInfo` | true | Included as `LSPIdentity` |
| `locale` | true | Omitted; client does not populate it |
| `rootPath` | true | Omitted; deprecated and not populated |
| `rootUri` | false | Included as `LSPDocumentURI \| null` |
| `capabilities` | false | Included as `LSPClientCapabilities` |
| `initializationOptions` | true | Omitted |
| `trace` | true | Omitted |
| `workDoneToken` | true | Omitted from the resolved mixin |
| `workspaceFolders` | true | Omitted from the resolved extension |

The installed emitter declarations match the sketch: `EmitterInterface`, `EmitterHooks`, and `EmitterErrorHandler`. The event maps use readonly labeled tuples.

## Acceptance commands

```text
$ npx oxfmt --config .oxfmtrc.json --check src/core/types.ts src/core/constants.ts src/core/errors.ts src/core/validators.ts src/core/parsers.ts src/core/helpers.ts src/core/index.ts tests/src/core/helpers.test.ts tests/src/core/validators.test.ts tests/src/core/parsers.test.ts
All matched files use the correct format.
Finished in 2ms on 10 files using 4 threads.
```

Exit 0.

```text
$ npx oxlint --config .oxlintrc.json --deny-warnings src/core/types.ts src/core/constants.ts src/core/errors.ts src/core/validators.ts src/core/parsers.ts src/core/helpers.ts src/core/index.ts tests/src/core/helpers.test.ts tests/src/core/validators.test.ts tests/src/core/parsers.test.ts
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
 Test Files  3 passed (3)
      Tests  14 passed (14)
   Start at  20:53:19
   Duration  411ms (transform 553ms, setup 112ms, import 598ms, tests 30ms, environment 0ms)
```

Exit 0.

```text
$ git status --porcelain
 M src/core/index.ts
 D tests/src/core/index.test.ts
?? src/core/constants.ts
?? src/core/errors.ts
?? src/core/helpers.ts
?? src/core/parsers.ts
?? src/core/types.ts
?? src/core/validators.ts
?? tests/src/core/helpers.test.ts
?? tests/src/core/parsers.test.ts
?? tests/src/core/validators.test.ts
```

Only owned paths appear.

## Deviations

No contract deviations. The `isLSPError` guard resides beside `LSPError` in `errors.ts`, as required by the governing error-class/guard placement rule. Its requested name and public surface are unchanged.

## Git output

```text
$ git diff --stat
 src/core/index.ts            | 6 ++++++
 tests/src/core/index.test.ts | 8 --------
 2 files changed, 6 insertions(+), 8 deletions(-)
```

Git omits untracked files from this stat.

```text
$ git status --porcelain
 M src/core/index.ts
 D tests/src/core/index.test.ts
?? src/core/constants.ts
?? src/core/errors.ts
?? src/core/helpers.ts
?? src/core/parsers.ts
?? src/core/types.ts
?? src/core/validators.ts
?? tests/src/core/helpers.test.ts
?? tests/src/core/parsers.test.ts
?? tests/src/core/validators.test.ts
```