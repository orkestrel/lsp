# M0 report — widen the mcp server conformance run to the full 2026-07-28 listing

## Selection mechanism found and how it was extended

`tests/setupConformance.ts` calls `executeRunner(['server', '--url', url, '--spec-version',
CONFORMANCE_SPEC])` with no `--suite` flag. The runner's `server` command defaults `--suite` to
`active`, which excludes its `draft` and `pending` scenarios. `list --spec-version 2026-07-28`
(which carries no `--suite` option) reports every scenario applicable to that spec version
regardless of suite — 40 server scenarios — so the 23-passed/0-failed baseline covered only the
20 `active` scenarios, not the full listing the brief names.

`executeConformance` now passes `--suite all`, which runs the runner's `active` + `draft` +
`pending` scenarios together. Running the pinned build with `--suite all --spec-version
2026-07-28` against the fixture reports "Running all suite (40 scenarios)", matching `list`
exactly. No scenario needed `--force`: every one is already applicable at `2026-07-28` under
`--suite all`.

## Per-scenario outcome, every 2026-07-28 server scenario

Order matches the runner's own summary order (`list` order). Every scenario ran; none hung,
crashed, or is `not runnable`.

| Scenario | Outcome | Runner message (failing scenarios only) |
| --- | --- | --- |
| `server-stateless` | fail (24 passed, 4 failed) | SEP-2575 checks expect `-32602` for a bad/missing `_meta`; the fixture answers `-32022 Unsupported MCP protocol version '2026-07-28'` because the shipped server negotiates only `2025-06-18`/`2025-11-25` |
| `completion-complete` | pass | |
| `tools-list` | pass | |
| `tools-call-simple-text` | pass | |
| `tools-call-image` | pass | |
| `tools-call-audio` | pass | |
| `tools-call-embedded-resource` | pass | |
| `tools-call-mixed-content` | pass | |
| `tools-call-error` | pass | |
| `tools-call-with-progress` | pass | |
| `json-schema-2020-12` | fail (0 passed, 1 failed) | "Tool 'json_schema_2020_12_tool' not found" — the fixture's tool registry declares no such tool |
| `server-sse-multiple-streams` | pass | |
| `resources-list` | pass | |
| `resources-read-text` | pass | |
| `resources-read-binary` | pass | |
| `resources-templates-read` | pass | |
| `sep-2164-resource-not-found` | pass | |
| `prompts-list` | pass | |
| `prompts-get-simple` | pass | |
| `prompts-get-with-args` | pass | |
| `prompts-get-embedded-resource` | pass | |
| `prompts-get-with-image` | pass | |
| `dns-rebinding-protection` | pass | |
| `caching` | pass | |
| `http-header-validation` | pass | |
| `http-custom-header-server-validation` | fail (3 passed, 6 failed) | SEP-2243 expects HTTP 400 and JSON-RPC `-32020 HeaderMismatch` for an invalid/mismatched `Mcp-Param` header; the shipped route accepts both and answers 200 |
| `input-required-result-basic-elicitation` | fail (0 passed, 1 failed) | "Expected InputRequiredResult but got a complete result" — no fixture tool returns `resultType: 'input_required'` |
| `input-required-result-basic-sampling` | fail (0 passed, 1 failed) | same gap, sampling variant |
| `input-required-result-basic-list-roots` | fail (0 passed, 1 failed) | same gap, `roots/list` variant |
| `input-required-result-request-state` | fail (0 passed, 1 failed) | same gap |
| `input-required-result-multiple-input-requests` | fail (0 passed, 1 failed) | same gap |
| `input-required-result-multi-round` | fail (0 passed, 1 failed) | same gap |
| `input-required-result-missing-input-response` | pass (0 passed, 0 failed) | its one check reports `WARNING` (not `FAILURE`) once its prerequisite tool call answers `tool not found: test_input_required_result_elicitation`, so the runner tallies neither pass nor fail |
| `input-required-result-non-tool-request` | fail (0 passed, 1 failed) | "JSON-RPC error: Prompt not found: test_input_required_result_prompt" |
| `input-required-result-result-type` | fail (0 passed, 1 failed) | expects `resultType: "input_required"`, gets `"complete"` |
| `input-required-result-unsupported-methods` | pass | |
| `input-required-result-tampered-state` | fail (0 passed, 1 failed) | "Prerequisite failed: could not get initial InputRequiredResult" |
| `input-required-result-capability-check` | fail (0 passed, 1 failed) | "expected InputRequiredResult with sampling-only inputRequests" |
| `input-required-result-ignore-extra-params` | pass | |
| `input-required-result-validate-input` | pass (0 passed, 0 failed) | both its checks report `WARNING` for the same prerequisite-missing reason |

Total: 74 passed, 21 failed. Twelve scenarios carry the recorded red baseline:
`server-stateless`, `json-schema-2020-12`, `http-custom-header-server-validation`,
`input-required-result-basic-elicitation`, `-basic-sampling`, `-basic-list-roots`,
`-request-state`, `-multiple-input-requests`, `-multi-round`, `-non-tool-request`,
`-result-type`, `-tampered-state`, `-capability-check` (thirteen rows; two of the fourteen
`input-required-result-*` scenarios stay at 0/0 and pass).

## Baseline location and shape

`tests/conformance.test.ts` keeps the existing mechanism: a literal `EXPECTED` array of
`{ name, passed, failed }` asserted with `toEqual` against the live run's `result.scenarios`.
This is already the project's visible-baseline shape — a scenario silently dropped fails the
exact-array comparison, and every row that carries a red count is committed to source with a
comment naming why. No `--expected-failures` YAML file was added: the array already names every
scenario and its exact tally, so a second baseline file would duplicate the same information in
the runner's own shape rather than adding coverage. A `runs the exact scenarios carrying the
recorded red baseline` assertion (`EXPECTED_RED`, derived from `EXPECTED`) makes the red set a
second, independently readable check: it fails if a scenario's `failed` count moves off zero (or
back to it) without the row comment being updated, catching drift the row-by-row `toEqual` alone
would still catch but a reviewer scanning only the new test would otherwise miss.

The `reports the recorded total` assertion moved from `[23, 0]` to `[74, 21]`, and `runs every
recorded scenario with no failure` was renamed to `runs every 2026-07-28 server scenario against
the recorded baseline` because the assertion no longer claims zero failures.

## Commands run and their final counts

- `npm run test:conformance` — `Test Files 1 passed (1)`, `Tests 43 passed (43)`.
- `npx oxlint --config .oxlintrc.json tests/conformance.test.ts tests/setupConformance.ts` —
  exit 0, no violations.
- `npm run check` — `tsc --noEmit --project tsconfig.json` and all three `check:src:*` projects
  passed with no diagnostics.

## Scope and deviations

Owned files only: `tests/conformance.test.ts`, `tests/setupConformance.ts`. No file under `src/`
was touched, and no new baseline file was added under `tests/`. No scenario hung or crashed the
runner, so no deviation triggered. The `not runnable` case named in the brief's Unknowns did not
occur: every 2026-07-28 server scenario is applicable and the runner ran it; the scenarios the
fixture cannot yet answer register as ordinary tallied failures instead.
