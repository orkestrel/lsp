# MC — build the client-conformance harness

- **Role and engine**: `implementer`, Opus 5, native. Writing unit, sole writer in the mcp
  checkout.
- **Objective**: the installed conformance runner's client mode drives this package's own
  `MCPClient` over its HTTP client transport through every applicable non-auth `2026-07-28`
  scenario, with a recorded per-scenario baseline whose red rows become the header units'
  binding proofs.

## Context

- Repository: `C:\Users\mikes\WebstormProjects\mcp`, clean `main` at `74d7f1c`. Commit nothing.
- Read first: `AGENTS.md`, `.claude/rules/tests.md`, `.claude/rules/workspace.md`,
  `.claude/rules/typescript.md`. The M0/MF/M-input reports under `tmp/units/` carry the server
  harness's history.
- The runner: `node_modules/@modelcontextprotocol/conformance` (`0.2.0-alpha.10`), CLI
  `dist/index.js`. `client --help` documents: `--command <command>` (the client under test),
  `--scenario`, `--suite`, `--timeout`, `--spec-version`, `--output-dir`. Read the installed
  package's README and its client scenario sources to learn the exact contract: how the runner
  hands the client its target URL and the scenario's expected operations, and what the client
  process must do and print.
- Applicable client scenarios at `2026-07-28` from the runner's own `list` (verify with your own
  run): `tools_call`, `request-metadata`, `http-standard-headers`, `http-custom-headers`,
  `http-invalid-tool-headers`, `sep-2322-client-request-state`, `json-schema-ref-no-deref`.
  The `auth/*` scenarios are OUT of scope: this package implements no OAuth client — record
  that exclusion as a comment beside the scenario set.
- The client under test: `createMCPClient` over `createHTTPClientTransport` from this package.
  The driver the runner spawns must import the BUILT surface: the canonical gate chain builds
  before it tests, so `dist/` exists when the `test` gate runs; a standalone
  `npm run test:conformance` during development requires a prior scoped build, exactly the
  discipline probe's bin project records. State that requirement where the harness declares it.
- Expected reds you record rather than fix: client-side `Mcp-Name` beyond `tools/call` and the
  whole `x-mcp-header` family are confirmed gaps owned by the later header units
  (`plan.md` M1 and M2). `sep-2322-client-request-state` should pass — the client's
  `requestState` echo discipline was audited green at the design round; a red there is a
  finding, report it loudly.

## Scope

- Owned: `tests/setupConformance.ts`, `tests/setupConformance.test.ts`,
  `tests/conformance.test.ts`, plus one new driver file for the spawned client (place it by the
  rules you read — name it for what it is, keep it minimal, and note that the policy sweep's
  kind law reaches `tests/`; a runtime entry that must be self-contained documents that
  exception in a comment if you rely on it).
- Off-limits: everything under `src/`, `package.json`, `guides/`, configs.

## Execution

Perform the assignment directly and spawn nothing. Failing-first: record each scenario's first
honest outcome; reds land in the visible named-baseline shape the server run already uses.
Validate scoped: `npm run build:src` once (the driver needs `dist/`; record it as the recorded
ancillary the brief authorizes), then `npm run test:conformance`, scoped oxlint and oxfmt
`--check` on owned files, `npm run check`, `npm run test:setup`. No tree-wide `format` or
`lint --fix`.

## Output

Report to `tmp/units/mc-report.md` and as your final message: the client-mode contract you
found (how the runner drives the command), the driver's shape and placement reasoning, the
per-scenario baseline with the runner's message behind every red, and the exact commands with
final counts.

## Deviation contract

Stop and report when: the runner's client mode cannot drive an external command the way the
help implies; a scenario hangs repeatedly; the driver cannot reach the scenario's operations
through this package's public client surface (that is a product finding — record it red with
the seam named, never work around it through a foreign client); or an existing green row
reddens. Ancillary choices (driver naming, baseline shape) are yours to decide and record.

## Acceptance criteria

1. Every named non-auth client scenario runs with a recorded outcome; the `auth/*` exclusion is
   recorded beside the set.
2. `npm run test:conformance` green with the combined server and client baselines.
3. Scoped lint, format-check, `npm run check`, `npm run test:setup` green.
4. The report names each red row's owning unit (M1 or M2) or flags it as a new finding.
