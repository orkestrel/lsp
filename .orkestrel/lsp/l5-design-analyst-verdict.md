# Objective-lane ruling

## What conformance means

Recommended shape: use the vendored LSP 3.18.0 metaModel as the declarative authority, and use the installed `vscode-languageserver-protocol` runtime namespaces as an independent authority where its public entry exposes one.

The suite should prove:

- `LSP_METHODS.initialize`, `initialized`, `shutdown`, `exit`, `cancel`, `open`, `close`, `diagnostic`, and `publish` against matching metaModel request or notification rows. Require exact membership of the local table so a new local member cannot escape the matrix. The table claims only methods this client sends or consumes ([constants.ts](/home/user/lsp/src/core/constants.ts:1)); the client routes its protocol traffic through those members ([LSPClient.ts](/home/user/lsp/src/core/LSPClient.ts:182), [LSPClient.ts](/home/user/lsp/src/core/LSPClient.ts:232), [LSPClient.ts](/home/user/lsp/src/core/LSPClient.ts:529), [LSPClient.ts](/home/user/lsp/src/core/LSPClient.ts:594)). The metaModel names the matching diagnostic request, initialization request, lifecycle requests, document notifications, publication notification, and cancellation notification ([metaModel](/home/user/scaffold/tmp/cursor/sources/lsp-3.18-metaModel.json:1007), [metaModel](/home/user/scaffold/tmp/cursor/sources/lsp-3.18-metaModel.json:1181), [metaModel](/home/user/scaffold/tmp/cursor/sources/lsp-3.18-metaModel.json:2207), [metaModel](/home/user/scaffold/tmp/cursor/sources/lsp-3.18-metaModel.json:2269), [metaModel](/home/user/scaffold/tmp/cursor/sources/lsp-3.18-metaModel.json:2364), [metaModel](/home/user/scaffold/tmp/cursor/sources/lsp-3.18-metaModel.json:2393)).
- The public installed namespaces’ `.method` values for the same rows where available. The declarations expose such values for initialization and lifecycle methods ([protocol.d.ts](/home/user/lsp/node_modules/vscode-languageserver-protocol/lib/common/protocol.d.ts:1161), [protocol.d.ts](/home/user/lsp/node_modules/vscode-languageserver-protocol/lib/common/protocol.d.ts:1276), [protocol.d.ts](/home/user/lsp/node_modules/vscode-languageserver-protocol/lib/common/protocol.d.ts:1287)), document notifications ([protocol.d.ts](/home/user/lsp/node_modules/vscode-languageserver-protocol/lib/common/protocol.d.ts:1564), [protocol.d.ts](/home/user/lsp/node_modules/vscode-languageserver-protocol/lib/common/protocol.d.ts:1681), [protocol.d.ts](/home/user/lsp/node_modules/vscode-languageserver-protocol/lib/common/protocol.d.ts:1991)), and diagnostics ([protocol.diagnostic.d.ts](/home/user/lsp/node_modules/vscode-languageserver-protocol/lib/common/protocol.diagnostic.d.ts:251)).
- `cancel` against the metaModel alone. The installed package’s public root does not expose `CancelNotification`; its exports map admits only the documented package entries ([package.json](/home/user/lsp/node_modules/vscode-languageserver-protocol/package.json:15)). Do not import its private `protocol.$.js` file.
- Every local JSON-RPC numeral against the metaModel `ErrorCodes` values and installed `ErrorCodes`; every local LSP numeral against `LSPErrorCodes` in the metaModel and installed package. The local constants are at [constants.ts](/home/user/lsp/src/core/constants.ts:17), the metaModel values at [metaModel](/home/user/scaffold/tmp/cursor/sources/lsp-3.18-metaModel.json:14325), and the installed runtime assignments at [messages.js](/home/user/lsp/node_modules/vscode-jsonrpc/lib/common/messages.js:45) and [api.js](/home/user/lsp/node_modules/vscode-languageserver-protocol/lib/common/api.js:28).
- `LSP_ENCODINGS` against the named metaModel `PositionEncodingKind` values and installed namespace. Do not claim that this exhausts valid extension values because the metaModel explicitly permits custom values ([metaModel](/home/user/scaffold/tmp/cursor/sources/lsp-3.18-metaModel.json:15330)).
- `LSPTextDocumentSyncKind`, `LSPDiagnosticSeverity`, and `LSPDiagnosticTag` through authority-derived values passed into the local guards. Their metaModel enumerations are at [metaModel](/home/user/scaffold/tmp/cursor/sources/lsp-3.18-metaModel.json:14672), [metaModel](/home/user/scaffold/tmp/cursor/sources/lsp-3.18-metaModel.json:15407), and [metaModel](/home/user/scaffold/tmp/cursor/sources/lsp-3.18-metaModel.json:15437). The local unions and guards are at [types.ts](/home/user/lsp/src/core/types.ts:85), [types.ts](/home/user/lsp/src/core/types.ts:141), [validators.ts](/home/user/lsp/src/core/validators.ts:158), and [validators.ts](/home/user/lsp/src/core/validators.ts:253).
- Structural projection parity for the wire surface the client produces or consumes: initialize parameters and capabilities; initialize results and server capabilities; document-open and document-close parameters; diagnostic request parameters; publish parameters; diagnostic reports; positions, ranges, locations, code descriptions, related information, diagnostics, text-document identifiers, and text-document items. Assert that every local projected member exists upstream with matching requiredness and compatible descriptor. Do not require the local projection to reproduce unrelated upstream members.
- Guard parity against the installed namespaces where they provide guards: `Position`, `Range`, `Location`, `CodeDescription`, `DiagnosticRelatedInformation`, and `Diagnostic`. Use `Diagnostic.is3_17` for the package’s negotiated diagnostic surface. LSP 3.18 permits markup messages only when `markupMessageSupport` is advertised ([protocol.diagnostic.d.ts](/home/user/lsp/node_modules/vscode-languageserver-protocol/lib/common/protocol.diagnostic.d.ts:20)); this client advertises an empty diagnostic capability ([LSPClient.ts](/home/user/lsp/src/core/LSPClient.ts:219)), and its local contract accepts strings ([types.ts](/home/user/lsp/src/core/types.ts:102)). The installed namespace expressly supplies the string-only guard ([main.d.ts](/home/user/lsp/node_modules/vscode-languageserver-types/lib/umd/main.d.ts:577)).
- The dependency boundary: the upstream protocol family remains absent from runtime, peer, and optional dependency fields and from every `src` import. Extract imports with TypeScript’s parser rather than a regex. The package currently declares the authority only in `devDependencies` ([package.json](/home/user/lsp/package.json:80)); its runtime dependencies are separate ([package.json](/home/user/lsp/package.json:75)).

Deliberately exclude unrelated LSP requests and notifications, capability branches the client neither advertises nor reads, JSON-RPC envelope structure parity absent from the LSP metaModel, framing limits, transport lifecycle, and package-specific `LSPError` codes. Those remain ordinary package tests.

Risk: whole-structure equality would incorrectly demand unsupported capability-conditioned fields such as markup diagnostic messages and related diagnostic documents. Aggregate protocol-catalog equality would also turn this subset client into an accidental full LSP implementation.

## Failure naming

Recommended shape: represent every comparison as a row containing the local symbol, authority symbol, actual value, and authoritative value. Register a parameterized test per row and include the authoritative value in the assertion message:

```ts
expect(
	actual,
	`${symbol} drifted; ${authority}=${JSON.stringify(expected)}`,
).toStrictEqual(expected)
```

Use the local symbol in the test title. Emit a separate row for an unexpected local member, with the authority value reported as `undefined`. Never rely only on an aggregate object diff.

Put row construction and drift formatting in `tests/setupConformance.ts`; keep `expect`, `describe`, and test registration in test files. Setup modules may own case matrices, while assertions may not live there ([tests.md](/home/user/lsp/.claude/rules/tests.md:21), [tests.md](/home/user/lsp/.claude/rules/tests.md:62)).

Risk: a single set comparison can report that tables differ without identifying which public symbol moved. A helper that derives expected values from the local table would assert the implementation against itself, forbidden by [tests.md](/home/user/lsp/.claude/rules/tests.md:34).

## Where the metaModel lives

Recommended shape:

- `tests/fixtures/lsp-3.18.0-metaModel.json` — exact fetched bytes.
- `tests/fixtures/lsp-3.18.0-metaModel.provenance.json` — source URL, UTC refresh date, declared metaModel version, and SHA-256.

Pin the staged bytes to:

```text
caae8df639a4248520a3f589fd72945365e9d8ebca5baf564161a515430d9d41
```

The suite must hash the raw bytes before parsing and then assert `metaData.version === "3.18.0"` ([metaModel](/home/user/scaffold/tmp/cursor/sources/lsp-3.18-metaModel.json:1)). The upstream specification identifies this file as the actual LSP 3.18 metaModel ([specification](/home/user/scaffold/tmp/cursor/sources/lsp-3.18-specification.md:724)).

Document the refresh command and provenance update in `guides/lsp.md`. Fetch to a temporary path, verify the digest and parsed version, then replace the mirror and provenance together. Do not add comments or rewrite formatting inside the mirrored JSON; fetched mirrors must retain their bytes ([documentation.md](/home/user/lsp/.claude/rules/documentation.md:35)).

Risk: pinning only `metaData.version` permits same-version byte drift. A repository-owned digest detects that drift, though it is not an upstream signature.

## Project wiring

Recommended shape:

- Add `conformance()` to `vite.config.ts` immediately after `config()` and before `distribution()`.
- Configure `include: ['tests/conformance.test.ts']`, Node, browser disabled, and `setupFiles: ['./tests/setup.ts']`.
- Add the factory to the projects array in the same slot.
- Add `test:conformance` and invoke it from `test`.
- Keep `tests/setupConformance.ts` as an explicitly imported helper module, not a Vitest `setupFiles` entry.
- Add `tests/setupConformance.test.ts` for the helper’s controls; the existing `setup` project collects that filename pattern.

This follows the fixed workspace project contract ([workspace.md](/home/user/lsp/.claude/rules/workspace.md:123), [workspace.md](/home/user/lsp/.claude/rules/workspace.md:141)). The current configuration lacks the slot ([vite.config.ts](/home/user/lsp/vite.config.ts:165)). The vendored config proof already derives `conformance` from the exact trigger filename and requires only `tests/setup.ts` as its setup file ([config.test.ts](/home/user/lsp/tests/config.test.ts:115)); it also requires `test:conformance` to be reachable from `test` ([config.test.ts](/home/user/lsp/tests/config.test.ts:548)). Do not edit `tests/config.test.ts`.

The version-pin analogue must assert:

- Manifest declaration: `vscode-languageserver-protocol@^3.18.2`.
- Installed authority release: `3.18.2`.
- Locked release: `3.18.2`.
- MetaModel version: `3.18.0`.
- MetaModel digest: the pinned SHA-256 above.

The manifest and lock evidence are at [package.json](/home/user/lsp/package.json:93) and [package-lock.json](/home/user/lsp/package-lock.json:3462). Resolve the installed package through its public entry, then read the nearest package manifest; do not import an unexported `package.json` subpath.

Risk: checking only the manifest range allows a new installed release to silently change namespace values. Checking only `node_modules` allows an uncommitted installation to diverge from the lockfile.

## Missing protocol-version constant

Recommended shape: do not add a public protocol-version constant.

LSP initialization has no protocol-version handshake. The installed authority explicitly says the old version field was replaced by capabilities and that no version handshake exists ([protocol.d.ts](/home/user/lsp/node_modules/vscode-languageserver-protocol/lib/common/protocol.d.ts:1244)). The local initialize contract therefore has no version member ([types.ts](/home/user/lsp/src/core/types.ts:176)), and the client sends only process identity, workspace URI, and capabilities ([LSPClient.ts](/home/user/lsp/src/core/LSPClient.ts:227)).

A constant consumed only by conformance would be test metadata presented as product API. Using it in initialization would either add a foreign wire member or create a no-op read. Neither is a real product consumer under the minimal-public-API rule ([architecture.md](/home/user/lsp/.claude/rules/architecture.md:273)).

Pin `metaData.version` and the installed release in conformance. Keep protocol targeting expressed by the capability payload the client actually sends.

Risk: a public constant would imply a negotiated protocol value that the wire protocol does not carry.

## Unit decomposition

### LSP conformance proof

Owned files:

- `tests/fixtures/lsp-3.18.0-metaModel.json`
- `tests/fixtures/lsp-3.18.0-metaModel.provenance.json`
- `tests/setupConformance.ts`
- `tests/setupConformance.test.ts`
- `tests/conformance.test.ts`
- `vite.config.ts`
- `package.json`
- `guides/lsp.md`
- `guides/README.md`

Report-only files:

- `src/**`
- `tests/config.test.ts`
- `package-lock.json`

Red-first obligations:

- Register the conformance project before adding its script. `npm run test:config` must fail because the registered project is unreachable from a gate. Add `test:conformance` and its `test` chain entry, then rerun the same command green.
- Add permanent controls in `tests/setupConformance.test.ts` for a drifted method, numeral, structure descriptor, mirror byte, and forbidden source import. Each control must produce a drift naming the local symbol and authoritative value.
- Temporarily change `LSP_METHODS.initialize` to `initialize/control`. `npm run test:conformance` must fail naming `LSP_METHODS.initialize` and authority value `"initialize"`. Restore the exact source line and rerun green.

Acceptance criteria:

- The vendored mirror matches the pinned digest and parses as LSP 3.18.0.
- The method, numeral, enumeration, structural-projection, guard, authority-version, and dependency-boundary rows pass.
- `tests/setupConformance.test.ts` proves every shared instrument can fail.
- `tests/conformance.test.ts` is discovered only by `conformance`.
- `test:conformance` runs from `npm test`.
- `npm run test:setup`, `npm run test:conformance`, `npm run test:config`, and `npm run check` exit `0`.
- The suite makes no network request.
- No `src` file or public export changes.
- The guide states the authority, subset boundary, refresh procedure, and capability-conditioned diagnostic limit.

## Facts not verified

- The exact URL used to fetch the staged metaModel was not recorded in the staged file or terrain journal. Re-fetch through the specification’s `metaModel.json` link and require the same digest before recording provenance.
- I could not verify that upstream publishes a signed or first-party digest. The recommended SHA-256 is therefore a repository-owned byte pin.