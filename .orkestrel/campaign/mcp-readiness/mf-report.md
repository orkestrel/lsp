# MF report — complete the conformance fixture for the 2026-07-28 scenario set

The recorded baseline moved from `74 passed, 21 failed` to `91 passed, 15 failed`. Every row whose
red existed only because the fixture never declared what the scenario names is green. The red that
remains is five library gaps and the two rows the brief reserved.

## Per-row before and after

| Scenario | Before | After | Classification |
| --- | --- | --- | --- |
| `json-schema-2020-12` | 0/1 | 7/0 | closed by the fixture |
| `input-required-result-request-state` | 0/1 | 2/0 | closed by the fixture |
| `input-required-result-multi-round` | 0/1 | 3/0 | closed by the fixture |
| `input-required-result-non-tool-request` | 0/1 | 2/0 | closed by the fixture |
| `input-required-result-result-type` | 0/1 | 1/0 | closed by the fixture |
| `input-required-result-tampered-state` | 0/1 | 1/0 | closed by the fixture |
| `input-required-result-validate-input` | 0/0 | 2/0 | gained two passes |
| `input-required-result-ignore-extra-params` | 1/0 | 0/0 | lost one pass; see the observation |
| `input-required-result-basic-elicitation` | 0/1 | 0/1 | library gap |
| `input-required-result-basic-sampling` | 0/1 | 0/1 | library gap |
| `input-required-result-basic-list-roots` | 0/1 | 0/1 | library gap |
| `input-required-result-multiple-input-requests` | 0/1 | 0/1 | library gap |
| `input-required-result-capability-check` | 0/1 | 0/1 | library gap |
| `server-stateless` | 24/4 | 24/4 | reserved by the brief; unchanged |
| `http-custom-header-server-validation` | 3/6 | 3/6 | reserved by the brief; unchanged |
| every other row | — | unchanged | — |

`input-required-result-missing-input-response` and `input-required-result-unsupported-methods` are
unchanged at 0/0 and 1/0.

## The fixture surface added

Everything below is in `C:\Users\mikes\WebstormProjects\mcp\tests\setupConformance.ts`.

| Symbol | Serves |
| --- | --- |
| `CONFORMANCE_SCHEMA` and the `json_schema_2020_12_tool` registration | `json-schema-2020-12` |
| `CONFORMANCE_ANSWERS` and the tool family it registers | every `input-required-result-*` tool call |
| `CONFORMANCE_SECRET`, `CONFORMANCE_PRINCIPAL`, `CONFORMANCE_TTL`, `CONFORMANCE_CONTINUATION` | the continuation and principal policy `MCPServerOptions.input` requires |
| `CONFORMANCE_FORMS` and `buildConformanceElicitation` | the `elicit` selector: which round each tool is on |
| `CONFORMANCE_REQUESTS`, `CONFORMANCE_STATE`, `buildConformanceRound` | `input-required-result-non-tool-request` |
| `readConformanceAnswers` | fills the multi-round prompt from the elicited answer |
| the `test_input_required_result_prompt` entry in `CONFORMANCE_PROMPTS` and its `buildConformanceMessages` branch | the same scenario's round two |
| the `input` option on `buildConformanceOptions` | the whole SEP-2322 tools/call family |

The registered tool names are `json_schema_2020_12_tool`,
`test_input_required_result_elicitation`, `test_input_required_result_sampling`,
`test_input_required_result_list_roots`, `test_input_required_result_request_state`,
`test_input_required_result_multiple_inputs`, `test_input_required_result_multi_round`,
`test_input_required_result_tampered_state`, and `test_input_required_result_capabilities`.

### The composition rule I held to

No fixture code produces an `input_required` result for `tools/call`. The library owns that arm
through `MCPServerOptions.input`: it mints the request key, seals the state, and verifies each
retry, and the consumer supplies only the continuation port, the TTL, the principal, and the
selector that says which round the call is on. `MCPMethodManagerInterface.add` would let a fixture
override `tools/call` and hand-roll every MRTR answer, which would turn every green row into a
statement about the fixture. I did not use it.

`prompts/get` is the opposite division and the library states it: `MCPPromptManagerInterface.prompt`
may return an `MCPInputResult` of its own, so the key, the request, and the round there are the
host's. That is why `-non-tool-request` is green beside three tools/call rows that are not.

The continuation port is the shipped `createMCPContinuation`, so the `-tampered-state` rejection
comes from an HMAC signature that does not verify, not from a fixture comparison.

## Rows left red, with the runner's own message

Each message is from `--output-dir` `checks.json` written by the pinned runner against the live
fixture.

### Library gaps, all one seam

`MCPServerOptions.input` can express exactly one `elicitation/create` request under a key
`MCPServer` mints. The five rows below are five different consequences of that one limit.

- `input-required-result-basic-elicitation` — `inputRequests missing expected key "user_name"`.
  The consumer cannot choose the request key; `MCPServer.#required` mints `crypto.randomUUID()`.
- `input-required-result-basic-sampling` — `Expected method "sampling/createMessage", got
  "elicitation/create"`. `MCPInputRequest` and `isMCPInputRequestMap` both admit
  `sampling/createMessage` and `roots/list`, and `MCPInputResult` carries them, so the wire types
  are complete. `MCPInputOptions` has no way to ask for one: `MCPInputHandler` returns an
  `MCPElicitation`, which is a form and nothing else.
- `input-required-result-basic-list-roots` — `Expected method "roots/list", got
  "elicitation/create"`. Same seam.
- `input-required-result-multiple-input-requests` — `Expected at least 3 inputRequests, got 1;
  Expected a sampling/createMessage inputRequest; Expected a roots/list inputRequest; Expected
  inputRequests with different method types (elicitation + sampling + roots/list)`. The selector
  returns one `MCPElicitation`, so the map it produces always has exactly one entry.
- `input-required-result-capability-check` — `JSON-RPC error: Server requires the elicitation
  capability for this request`. The scenario declares `sampling` and no `elicitation`, then
  requires sampling-only requests. The server's refusal is correct for what it was asked to
  produce; the scenario cannot pass while elicitation is the only thing the mechanism can ask
  for. Closing the preceding row closes this one.

### Rows the brief reserved

- `http-custom-header-server-validation` (3/6) — `Expected HTTP 400, got 200. Server MUST reject
  with 400 Bad Request.` and `Expected JSON-RPC error code -32020 (HeaderMismatch), got
  (missing).` Unchanged; not touched.
- `server-stateless` (24/4) — unchanged, and the recorded reason was incomplete. Its four
  failures have **two** distinct causes, not one:
  - `sep-2575-request-meta-invalid-missing-meta` and
    `sep-2575-request-meta-invalid-missing-protocol-version` — `Expected error code -32602, got
    -32022`. That is the protocol revision the M0 record names.
  - `sep-2575-server-rejects-undeclared-capability` — `Server executed 'test_missing_capability'
    although the client did not declare the 'sampling' capability — it MUST reject with -32021`.
  - `sep-2575-missing-capability-http-400` — `Not testable: server does not list the diagnostic
    tool 'test_missing_capability' in tools/list, so the -32021 HTTP status could not be
    validated.`

    The second pair needs a `test_missing_capability` tool declared **and** a library seam that
    gates a tool on a declared client capability. Declaring the tool alone would move the row, so
    I left it alone under the brief's ruling that the row stays exactly as recorded. The unit that
    owns `server-stateless` owns both halves.

## Shared-file patch, report-only

`C:\Users\mikes\WebstormProjects\mcp\tests\setupConformance.test.ts` is not an owned file and I did
not edit it. `npm run test:setup` reports `2 failed | 73 passed (75)` against it. One failure is
mine to explain, one is not.

### Patch 1 — the tool registry list, caused by this unit

Replace the literal list at line 114:

```ts
		expect(tools.tools().map((tool) => tool.name)).toEqual([
			'test_simple_text',
			'test_image_content',
			'test_multiple_content_types',
			'test_audio_content',
			'test_embedded_resource',
			'test_error_handling',
			'test_tool_with_progress',
			'test_header_parameter',
			'json_schema_2020_12_tool',
			'test_input_required_result_elicitation',
			'test_input_required_result_sampling',
			'test_input_required_result_list_roots',
			'test_input_required_result_request_state',
			'test_input_required_result_multiple_inputs',
			'test_input_required_result_multi_round',
			'test_input_required_result_tampered_state',
			'test_input_required_result_capabilities',
		])
```

### Patch 2 — a failure that predates this unit

Line 63, `expect(result.passed).toBe(0)`, is false at the baseline commit `23e8a02` and has nothing
to do with this unit. M0 widened `executeConformance` to `--suite all`, which admits
`sep-2164-resource-not-found`, and one of that scenario's checks passes with no server at all —
it reads a refused connection as a resource that is not there. Measured directly against the dead
endpoint the brief's helper uses:

```text
$ node node_modules/@modelcontextprotocol/conformance/dist/index.js server \
    --url http://127.0.0.1:1/mcp --spec-version 2026-07-28 --suite all
✗ sep-2164-resource-not-found: 1 passed, 1 failed
Total: 1 passed, 73 failed

$ node node_modules/@modelcontextprotocol/conformance/dist/index.js server \
    --url http://127.0.0.1:1/mcp --spec-version 2026-07-28
Total: 0 passed, 21 failed
```

The second run is the `active` default the helper used before M0, and `sep-2164-resource-not-found`
does not appear in it. Replace lines 62 to 64 with:

```ts
		expect(result.scenarios.length).toBeGreaterThan(0)
		// Almost nothing passes without a server, but not nothing: `sep-2164-resource-not-found`
		// reads a refused connection as a resource that is not there. So the claim is the
		// relationship a live fixture reverses, not a zero the runner's scenario set can move.
		expect(result.failed).toBeGreaterThan(result.passed)
```

### Recommended, not patched

`buildConformanceElicitation`, `buildConformanceRound`, and `readConformanceAnswers` are new
exported helpers with no proof in `tests/setupConformance.test.ts`. The round selector is worth one
directly: `buildConformanceElicitation({ request, name: 'test_input_required_result_multi_round',
arguments: {} })` returns the step-one form at `state: 0`, the same call with `state: 0` returns the
step-two form at `state: 1`, and with `state: 1` returns `undefined`. A name absent from
`CONFORMANCE_FORMS` returns `undefined` at every state. That belongs to whoever owns the file.

## Observations

- **`ignore-extra-params` lost its pass and gained no failure.** Before, no MRTR tool existed, so
  the call fell through to the registry and answered a complete `isError` result, which the
  scenario read as success. Now the call carries `inputResponses` with no `requestState`, and
  `MCPServer.#retry` refuses it: `Invalid params: 'inputResponses' and 'requestState' are required
  together`. The scenario's check is a SHOULD, so the runner reports WARNING and tallies neither.
  The row is 0/0, not red. `missing-input-response` was already 0/0 for the same reason and stays
  there. Whether a retry that omits `requestState` deserves a re-issued round instead of an error
  is a library question, and both rows are where it would show up.
- **A tool never receives the answer its own round asked for.** `MCPServer.#retry` verifies the
  elicitation response against the schema it issued, then calls `ToolManagerInterface.execute`,
  whose signature takes a call and nothing else. `MCPExecutionContext.request` does carry the raw
  `inputResponses`, so a consumer can re-read them there, but that is the consumer re-deriving
  what the server already verified. The fixture's round-two text is therefore static, and says so
  in `CONFORMANCE_ANSWERS`. No scenario check reads that text.
- **`sep-2164-resource-not-found` carries a WARNING the green row hides**: `Error data.uri is
  undefined, expected "test://nonexistent-resource-for-conformance-testing". This is a SHOULD
  requirement.` The row is 2/0 and stays 2/0; the library attaches no `data.uri` to its
  resource-not-found error.

## Commands and final counts

| Command | Result |
| --- | --- |
| `npm run test:conformance` (before, at `23e8a02`) | `Test Files 1 passed (1)`, `Tests 43 passed (43)` at the `74 passed, 21 failed` baseline |
| `npm run test:conformance` (mid-change, against the stale baseline) | `Tests 3 failed \| 40 passed (43)`; the runner reported `91 passed, 15 failed` |
| `npm run test:conformance` (after) | `Test Files 1 passed (1)`, `Tests 43 passed (43)` |
| `npm run check` | `tsc --noEmit --project tsconfig.json` and `check:src:core`, `check:src:browser`, `check:src:server` all clean |
| `npx oxlint --config .oxlintrc.json --deny-warnings tests/conformance.test.ts tests/setupConformance.ts` | exit 0 |
| `npx oxfmt --config .oxfmtrc.json --check tests/conformance.test.ts tests/setupConformance.ts` | `All matched files use the correct format.` |
| `npm run test:policy` | `Test Files 1 passed (1)`, `Tests 93 passed (93)` |
| `npm run test:setup` | `2 failed \| 73 passed (75)` — both failures in the unowned sibling, patched above |

Diffstat:

```text
 tests/conformance.test.ts |  72 ++++++----
 tests/setupConformance.ts | 346 +++++++++++++++++++++++++++++++++++++++++++++-
 2 files changed, 388 insertions(+), 30 deletions(-)
```

`tests/conformance.test.ts` carries more reflow than content: `oxfmt` rewrapped one line M0 left
over the width limit, at the `EXPECTED_RED` assertion.

## Scope and deviations

Owned files only. Nothing under `src/`, `package.json`, `guides/`, or `configs/` was touched, and
nothing was committed. The runner neither crashed nor hung, and no scenario went from a zero
`failed` to a nonzero one, so no deviation trigger fired.

Ancillary choices I made and record here: the round index rides in the continuation's consumer
state rather than in fixture storage, so two concurrent exchanges cannot collide; the MRTR tools
are registered from the `CONFORMANCE_ANSWERS` keys so a scenario's tool name exists in one place;
and the multi-round prompt is advertised in `prompts/list` rather than answered unlisted, because a
host that answers a prompt it will not name is not a host.

A throwaway runtime probe under `tmp/probe/` produced the runner's per-check messages quoted here,
through the runner's own `--output-dir` `checks.json`. It was deleted; `tmp/units/m0-report.md` was
left in place.
