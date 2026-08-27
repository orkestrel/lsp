# M0 — widen the mcp server conformance run to the full 2026-07-28 listing

- **Role and engine**: `builder`, native Sonnet. Writing unit, sole writer in the mcp checkout.
- **Objective**: every server scenario the installed conformance runner lists at
  `--spec-version 2026-07-28` runs in the conformance test project, with a recorded, visible
  red baseline for the scenarios that fail today. This is the campaign's failing-first
  instrument: later units shrink the baseline.

## Context

- Repository: `C:\Users\mikes\WebstormProjects\mcp` (clean `main`; commit nothing).
- Read first: `AGENTS.md`, `.claude/rules/tests.md`, `.claude/rules/typescript.md` in that
  repository. Non-negotiables bind: no `any`, no assertions, no suppressions, no new packages,
  no deleted symbols.
- The harness: `tests/setupConformance.ts` boots the server under test and invokes the runner
  (`server --url <url> --spec-version 2026-07-28` around `:51` and `:1251`);
  `tests/conformance.test.ts` records scenario names near `:34` and asserts totals near `:174`
  (`passed: 23, failed: 0` today). Read both before editing; the exact selection mechanism
  (whether scenarios run by name or the runner runs its whole applicable set) is an unknown you
  resolve and report.
- The runner binary: `node_modules/@modelcontextprotocol/conformance/dist/index.js`
  (`0.2.0-alpha.10`). `list --spec-version 2026-07-28` prints the scenario set. The runner
  supports `--scenario <name>`, `--suite <name>`, `--expected-failures <path>` (YAML baseline),
  and `--output-dir`.
- Server scenarios at `2026-07-28` per that listing, beyond the currently recorded set:
  `server-stateless`, `json-schema-2020-12`, `sep-2164-resource-not-found`, `caching`,
  `http-header-validation`, `http-custom-header-server-validation`,
  `input-required-result-basic-elicitation`, `input-required-result-basic-sampling`,
  `input-required-result-basic-list-roots`, `input-required-result-request-state`,
  `input-required-result-multiple-input-requests`, `input-required-result-multi-round`,
  `input-required-result-missing-input-response`, `input-required-result-non-tool-request`,
  `input-required-result-result-type`, `input-required-result-unsupported-methods`,
  `input-required-result-tampered-state`, `input-required-result-capability-check`,
  `input-required-result-ignore-extra-params`, `input-required-result-validate-input`.
  Verify against your own `list` run; the runner's names are authoritative.

## Unknowns

- How the current harness selects the recorded scenarios, and why the asserted total is 23 when
  the listing is larger. Resolve by reading the harness; state the mechanism in your report.
- Some MRTR scenarios may need the harness server configured with capabilities or an
  elicitation-capable tool the current fixture lacks. Where the existing setup patterns extend
  naturally, extend them minimally; where a scenario cannot run at all, record it as
  `not runnable: <reason>` in the baseline and your report rather than forcing it.

## Scope

- Owned: `tests/conformance.test.ts`, `tests/setupConformance.ts`, and (if you choose the
  runner's YAML baseline) a new file under `tests/` for it.
- Off-limits: everything under `src/`, `package.json`, `guides/`, every config file.
- Do not weaken or delete any existing assertion; the currently recorded scenarios stay green.

## Execution

Perform the assignment directly and spawn nothing. Validate scoped: run the conformance project
(`npm run test:conformance`) and, cheap first, `npx oxlint --config .oxlintrc.json
tests/conformance.test.ts tests/setupConformance.ts` plus `npm run check` if the harness types
moved. Do not run the whole suite, `format` tree-wide, or `build`.

## Output

Write your report to `tmp/units/m0-report.md` in the mcp repository:

- The selection mechanism you found and how you extended it.
- Per-scenario outcome for every 2026-07-28 server scenario: pass, fail (with the runner's
  message, condensed), or not runnable (with reason).
- The baseline's location and shape (named expected failures, visible — never silently skipped).
- The exact commands you ran and their final counts.

## Deviation contract

Stop and report when: a scenario hangs past the runner's timeout repeatedly; the runner itself
crashes; extending the harness would require touching `src/` or adding a dependency; or the
existing recorded scenarios stop passing. Ancillary choices (baseline file shape, test naming)
are yours to decide and record.

## Acceptance criteria

1. Scoped lint on the owned files: no violations.
2. `npm run test:conformance` exits green with every 2026-07-28 server scenario either passing
   or named in the visible baseline.
3. The report lists every scenario with its outcome; the red list is exact.
