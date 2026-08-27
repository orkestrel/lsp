# MF — complete the conformance fixture for the 2026-07-28 scenario set

- **Role and engine**: `implementer`, Opus 5, native. Writing unit, sole writer in the mcp
  checkout.
- **Objective**: the conformance fixture answers every scenario whose M0 red row exists only
  because the fixture never declared what the scenario names — the MRTR tool family,
  `json_schema_2020_12_tool`, and the MRTR prompt — so those rows turn green and the recorded
  baseline shrinks to the genuine product findings.

## Context

- Repository: `C:\Users\mikes\WebstormProjects\mcp`, clean `main` at `23e8a02` (M0 landed:
  `--suite all`, 40-scenario baseline `74 passed, 21 failed`). Commit nothing.
- Read first: `AGENTS.md`, `.claude/rules/tests.md`, `.claude/rules/typescript.md`,
  `.claude/rules/patterns.md`. Non-negotiables bind; no new packages; no suppressions.
- The M0 record: `tmp/units/m0-report.md` — per-scenario outcomes and runner messages.
- The runner's scenario sources are installed at
  `node_modules/@modelcontextprotocol/conformance/dist/` — read the scenario definitions to
  learn the exact fixture names and behaviors each scenario expects (tool names such as
  `test_input_required_result_elicitation`, the prompt behind
  `input-required-result-non-tool-request`, the `json_schema_2020_12_tool` schema, what the
  `tampered-state` scenario mutates, what `capability-check` declares in client capabilities).
  The runner's names are authoritative; do not guess them.
- The product machinery you compose (verify, never reimplement): a fixture tool's `execute` may
  return a full `MCPCallResult`, including `resultType: 'input_required'` with `inputRequests`
  and `requestState` (`isMCPInputResult` requires at least one of them); retries deliver
  `inputResponses` through the execution seam; `createMCPContinuation` on
  `@orkestrel/mcp/server` (`src/server/factories.ts:38`) is the integrity-protected
  continuation mechanism — use it for the `requestState` scenarios (`request-state`,
  `multi-round`, `tampered-state`) so the tampered-state rejection comes from the product
  mechanism, not from fixture hand-rolling.

## Fixed rulings you implement against

- `server-stateless` and `http-custom-header-server-validation` are PRODUCT findings owned by
  later units. Leave their red rows exactly as recorded; do not touch `src/` to move them.
- Every other red row is presumed fixture-closable. Where a row stays red after the fixture
  answers what the scenario names, that residue is a product finding: record it in your report
  with the runner's message, leave its row red with an updated comment naming the product seam,
  and do not fix it in `src/`.

## Scope

- Owned: `tests/setupConformance.ts`, `tests/conformance.test.ts`.
- Off-limits: everything under `src/`, `package.json`, `guides/`, configs.

## Execution

Perform the assignment directly and spawn nothing. Work failing-first per row family: the M0
baseline is the red record; after each fixture addition, re-run and watch the row move. Validate
scoped: `npm run test:conformance`, scoped oxlint on the owned files, `npm run check`. Do not run
the whole suite, tree-wide `format`, or `build`.

## Output

Write your report to `tmp/units/mf-report.md` in the mcp repository and return it as your final
message: per-row before/after tallies, the fixture surface you added (names and the scenario each
serves), every row left red with its classification (product finding + seam, or the two
already-owned rows), and the exact commands with final counts.

## Deviation contract

Stop and report when: a scenario's expectation cannot be met through the public `@orkestrel/mcp`
surface (that is a product finding — report, leave red, continue with the rest); the runner
crashes or hangs; or an existing green row reddens. Ancillary choices (fixture naming style,
helper placement inside the setup file) are yours to decide and record.

## Acceptance criteria

1. Scoped lint and `npm run check` green.
2. `npm run test:conformance` green with the shrunk baseline; every `input-required-result-*`
   row and `json-schema-2020-12` either green or classified as a product finding in the report.
3. The two product-owned rows (`server-stateless`, `http-custom-header-server-validation`)
   unchanged.
4. The `EXPECTED_RED` companion list matches the new reality.
