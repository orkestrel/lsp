# MC report — the client-conformance harness

The runner's client mode drives this package's own `MCPClient` over `createHTTPClientTransport`
through every non-auth `2026-07-28` scenario, with a per-scenario baseline in
`tests/conformance.test.ts`. `npm run test:conformance` is green at `Tests 47 passed (47)`.

One finding needs a decision before anything else: `npm run check` now requires `dist/` to
exist, and the gate chain runs `check` before `build`. The measurement and the patch are in
"The `check` gate now depends on `dist/`".

## The client-mode contract

Read from `node_modules/@modelcontextprotocol/conformance/README.md` and the installed
`dist/index.js`, then confirmed by running it.

The runner starts the scenario's own server, then spawns the command:

- It splits `--command` on a single space, takes the first token as the executable, and
  **appends the scenario server's URL as the last argument**. No token may contain a space.
  That rules out `process.execPath`, whose usual Windows value sits under `Program Files`.
- It spawns with `shell: true` and pipes both streams, with a `--timeout` kill (default 30000 ms).
- It sets `MCP_CONFORMANCE_SCENARIO` to the scenario name and `MCP_CONFORMANCE_PROTOCOL_VERSION`
  to the resolved revision.
- For a scenario that scripts exact work, it sets `MCP_CONFORMANCE_CONTEXT` to
  `{"name": SCENARIO, ...context}`. `http-custom-headers` is the only non-auth scenario that uses
  it, and its context carries a `toolCalls` array of `{name, arguments}`.
- The client process prints nothing the runner reads. The verdict comes from what the scenario
  server observed. The runner echoes the client's streams only when it exits nonzero.

Its reporting differs from server mode in a way the parser has to know:

- A single-scenario client run prints **no** `=== SUMMARY ===` block. Its verdict is one line,
  `Passed: N/D, M failed, W warnings`, where `D` is passed plus failed.
- A `--suite` run prints `=== SUITE SUMMARY ===` and a `Total: N passed, M failed, W warnings`
  line, which the existing `CONFORMANCE_TOTAL` pattern does not match.
- A check can report `SKIPPED` or `WARNING`, and neither tallies as passed or failed. The runner
  treats a warning as an overall failure even so.

## Driver shape and placement

`tests/conformanceClient.ts` — named for what it is, and pairing with `tests/conformance.test.ts`
and `tests/setupConformance.ts`.

Placement: no Vitest project collects it, which is correct — it is a runtime entry, not a test.
The policy sweep's kind law does not reach it: `POLICY_SOURCE_GLOB` in `tests/setupPolicy.ts` is
`{app,src}/**/*`, and the tests axis is inspected only through `POLICY_TESTS_MODULE_GLOB`
(`tests/**/setup*.ts`), `POLICY_TEST_GLOB` (`tests/{app,src}/**/*.test.ts`), and the suppression
sweep. The name deliberately avoids the `setup` prefix, because that prefix declares a setup
module resolvable by a mirrored test. `npm run test:policy` is green at `Tests 93 passed (93)`.

The driver carries **no scenario knowledge**. It connects, lists, then drives either the calls the
runner scripted or every tool the client itself listed, with arguments read from that tool's own
advertised schema. That is what makes `http-invalid-tool-headers` measure the client: a tool the
client failed to exclude is a tool this driver calls. A per-scenario call table would have made
those checks pass vacuously.

Three decisions worth naming:

- **It imports the built surface**, as the brief requires. A spawned `node` process resolves
  neither the `@src/*` aliases nor the `.js`-suffixed relative imports inside `src/`, so
  `@orkestrel/mcp` and `@orkestrel/mcp/server` are the only client face it can reach. Node
  self-reference resolution through the manifest's `exports` map was probed before relying on it.
- **Its helpers are module-scope and unexported.** A spawned entry cannot import
  `tests/setupConformance.ts`, whose own imports that process cannot resolve. The file's header
  records that exception, as the brief permits.
- **Its exit code separates two kinds of fault.** A peer refusing one call has answered
  correctly, so that fault is written to stderr and the exit code is left alone; a fault opening,
  listing, or closing means the client could not be driven, and sets the nonzero exit. Before
  that split, `json-schema-ref-no-deref` reported `OVERALL: FAILED` on a green check because the
  scenario's server answers `tools/call` with `-32601`.

The command is composed by `resolveConformanceDriver()` as
`node --experimental-strip-types tests/conformanceClient.ts`. The flag is there because the
manifest's `engines` floor is `>=22.12.0` and Node enables type stripping by default only from
22.18; it is accepted as a no-op above that, measured on v24.19.0. The path is relativized against
the working directory and the function throws, naming why, when that path contains a space the
runner's own splitting cannot carry.

## Per-scenario baseline

Recorded from the first honest run of each scenario, before any harness assertion existed. Every
row survived unchanged into `EXPECTED_CLIENT`.

| Scenario | passed | failed | warnings | The runner's message behind the red | Owner |
| --- | --- | --- | --- | --- | --- |
| `tools_call` | 1 | 0 | 0 | | |
| `request-metadata` | 8 | 0 | 0 | | |
| `sep-2322-client-request-state` | 4 | 1 | 0 | `sep-2322-client-no-state-omitted`: "MRTR client check … Tool was not called by client or MRTR flow not completed" | **new finding** |
| `http-standard-headers` | 3 | 0 | 0 | | |
| `http-custom-headers` | 3 | 15 | 0 | "Client called test_custom_headers but sent no Mcp-Param-\* headers", then "Missing Mcp-Param-`NAME` header. Client MUST include headers for x-mcp-header parameters" for each of Region, Priority, Verbose, Debug, EmptyVal, Method, NonAscii, Whitespace, LeadingSpace, TrailingSpace, InternalSpace, ControlChar, CrLf, and Tab | M2 |
| `http-invalid-tool-headers` | 1 | 10 | 0 | "Client called '`TOOL`' which has an invalid x-mcp-header. Clients MUST reject (exclude) such tools" for `invalid_empty_header`, `invalid_object_header`, `invalid_array_header`, `invalid_null_header`, `invalid_duplicate_same_case`, `invalid_duplicate_diff_case`, `invalid_space_in_name`, `invalid_colon_in_name`, `invalid_non_ascii_name`, and `invalid_control_char_name` | M2 |
| `json-schema-ref-no-deref` | 1 | 0 | 0 | | |

The `auth/*` family is excluded and the exclusion is recorded beside the set, in
`CONFORMANCE_CLIENT_SCENARIOS`'s TSDoc: each of those scenarios drives an OAuth 2.1 client
through discovery, dynamic registration, and a token grant, and this package publishes no OAuth
client. `tests/setupConformance.test.ts` proves the recorded set names no `auth/` scenario, and
`tests/conformance.test.ts` compares the recorded set against what the runner's own `list`
reports, so a client scenario the runner adds reddens instead of dropping out of the run.

### The `sep-2322` red is a product finding

The brief predicted this scenario would pass. It does not, and the seam is in the client's public
surface rather than on the wire.

The peer answers `test_mrtr_no_state` with an `input_required` result carrying `inputRequests`
and **no** `requestState`, and SEP-2322 requires the retry to answer that round while omitting
`requestState`. `MCPCallOptions.input` in `src/core/types.ts` declares:

```ts
readonly input?: {
	readonly state: string
	readonly responses: Readonly<Record<string, unknown>>
}
```

`state` is required and typed `string`, so a retry carrying responses without a state is
unreachable. `MCPInputResult` already models the peer's side of exactly that case — its
`requestState` is optional — so the two shapes disagree about a case the protocol has. The driver
stops at that round and reports the seam rather than reaching around the client, per the brief's
deviation contract. The other four checks in the scenario pass: the exact echo, the distinct
JSON-RPC id, the isolation of one call's round from another's, and a missing `resultType`
defaulting to complete.

### What the brief expected that did not appear

Client-side `Mcp-Name` beyond `tools/call` is **not** red. `http-standard-headers` declares its
`Mcp-Method` and `Mcp-Name` checks for `initialize`, `notifications/initialized`,
`resources/list`, `resources/read`, `prompts/list`, and `prompts/get`, and `MCPClientInterface`
publishes no method that issues any of them, so the runner reports each `SKIPPED` — tallying
neither. The three checks the client does reach (`Mcp-Method` on `tools/list` and `tools/call`,
`Mcp-Name` on `tools/call`) all pass. M1's subject is therefore visible to this harness only if
the client gains a resources or prompts surface; the baseline comment records that.

## The `check` gate now depends on `dist/`

`npm run check` runs `tsc --noEmit --project tsconfig.json`, whose include glob reaches `tests/`,
and the driver's published-specifier imports resolve into `dist/`. Measured by moving `dist`
aside and running the real command:

```text
tests/conformanceClient.ts(32,8): error TS2307: Cannot find module '@orkestrel/mcp' or its corresponding type declarations.
tests/conformanceClient.ts(34,33): error TS2307: Cannot find module '@orkestrel/mcp' or its corresponding type declarations.
tests/conformanceClient.ts(35,43): error TS2307: Cannot find module '@orkestrel/mcp/server' or its corresponding type declarations.
tests/conformanceClient.ts(205,14): error TS7006: Parameter 'tool' implicitly has an 'any' type.
```

Exit code 2. With `dist/` present the same command exits 0.

This is structural given the brief's requirement, not a choice inside the driver: every specifier
a spawned `node` process can resolve points at `dist/`, and `tsconfig.json` and `package.json` are
off-limits to this unit. `exclude` cannot help — it filters the include glob, not module
resolution.

The gate chain is `format:check → lint:check → check → build → test`, so `check` precedes the
build that would satisfy it. `npm run build` also runs `clean` first, which removes `dist/`.

Recommended patch to `package.json`, report-only, moving `build` ahead of `check`:

```diff
-		"prepublishOnly": "npm run format:check && npm run lint:check && npm run check && npm run build && npm test && npm run test:distribution -- --mode release",
+		"prepublishOnly": "npm run format:check && npm run lint:check && npm run build && npm run check && npm test && npm run test:distribution -- --mode release",
```

The alternatives cost more. Excluding the driver from `tsconfig.json` gives up typechecking the
one file that drives the published client, which is the thing `tests/setupConformance.ts`'s own
header argues is load-bearing. Prefixing `check` with a build makes every scoped typecheck pay for
a full build.

## Touched files

| File | Change |
| --- | --- |
| `tests/conformanceClient.ts` | New. The client under test the runner spawns: connects, lists, drives the scripted or listed calls, answers one input round. |
| `tests/setupConformance.ts` | Added the client-mode half: `CONFORMANCE_AUTH`, `CONFORMANCE_CLIENTS`, `CONFORMANCE_LISTED`, `CONFORMANCE_CLIENT_SCENARIOS`, `CONFORMANCE_OUTCOME`, `ConformanceOutcome`, `resolveConformanceDriver`, `parseConformanceClients`, `parseConformanceOutcome`, `executeConformanceClient`. |
| `tests/conformance.test.ts` | Added the `MCP client conformance` block and the `EXPECTED_CLIENT` baseline with its red-name list. |
| `tests/setupConformance.test.ts` | Added proofs for the command composition, the auth exclusion, and both new parsers. |

```text
 tests/conformance.test.ts      |  98 +++++++++++++++++++-
 tests/setupConformance.test.ts |  91 ++++++++++++++++++-
 tests/setupConformance.ts      | 199 +++++++++++++++++++++++++++++++++++++++++
 3 files changed, 386 insertions(+), 2 deletions(-)
 tests/conformanceClient.ts     | 213 +++++++++++++++++++++++++++++++++++++++++ (untracked)
```

## Commands and final counts

Run on 2026-08-27, Windows 11, Node v24.19.0, from `C:\Users\mikes\WebstormProjects\mcp` at
`74d7f1c`. Nothing was committed.

| Command | Result |
| --- | --- |
| `npm run build:src` | Exit 0. The recorded ancillary the brief authorizes; the driver needs `dist/`, and the checked-in `dist/` predated `MCPInputResponse`, so the first typecheck reported TS2305 on it. |
| `npm run test:conformance` | `Test Files 1 passed (1)`, `Tests 47 passed (47)` — was 43 before this unit. |
| `npm run test:setup` | `Test Files 5 passed (5)`, `Tests 86 passed (86)` — was 80 before this unit. |
| `npm run check` | Exit 0. Root `tsc` plus `check:src:core`, `check:src:browser`, `check:src:server`. |
| `npx oxlint --config .oxlintrc.json --deny-warnings` on the four owned files | Exit 0, no violations. |
| `npx oxfmt --config .oxfmtrc.json --check` on the four owned files | `All matched files use the correct format.` |
| `npm run test:policy` | `Tests 93 passed (93)`. Run because this unit adds a file under `tests/`. |
| `npm run test:guides` | `Tests 144 passed (144)`. Run because this unit adds a file the parity sweep could see. |

No tree-wide `format`, `lint --fix`, or `build` was run.

### Failing-first evidence

Each scenario's first honest outcome was taken by running the installed runner directly, one
scenario at a time, before any assertion existed. Those readings are the baseline table, and every
row survived into `EXPECTED_CLIENT` unchanged.

Each new assertion was then proved able to fail, by perturbation and restore:

| Perturbation | Command | Result |
| --- | --- | --- |
| `sep-2322-client-request-state` row set to `passed: 5, failed: 0` | `npm run test:conformance` | `Tests 2 failed \| 45 passed (47)` — the baseline row and the red-name list |
| `json-schema-ref-no-deref` removed from `CONFORMANCE_CLIENT_SCENARIOS` | `npm run test:conformance` | `Tests 2 failed \| 45 passed (47)` — the listing comparison and the baseline row |
| Driver filename changed in `resolveConformanceDriver` | `npm run test:setup` | `Tests 1 failed \| 85 passed (86)` — the command composition |
| `break` changed to `continue` in `parseConformanceClients` | `npm run test:setup` | `Tests 1 failed \| 85 passed (86)` — the section boundary |

Every perturbation was reverted from a backup taken before it, and `git status` confirms the tree
holds only the four intended files.

## Scope and deviations

Owned files only. Nothing under `src/`, `package.json`, `guides/`, or `configs/` was edited; the
`package.json` change is returned as a patch. No deviation trigger fired: the runner's client mode
drives an external command exactly as its help implies, no scenario hung, no existing green row
reddened, and the one operation the driver could not reach through the public client surface was
recorded red with the seam named rather than worked around.

Ancillary choices recorded: the driver's name and placement, the `ConformanceOutcome` shape
carrying `warnings` beside the counts, serial per-scenario invocation instead of `--suite`, and
the absence of a client-side total assertion — client mode prints no cross-scenario total when
each scenario runs on its own, so a total would be the test file's own arithmetic over the array
it already compared.
