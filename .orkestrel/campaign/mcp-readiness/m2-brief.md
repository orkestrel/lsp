# M2 — `x-mcp-header`: client projection, violating-tool exclusion, server validation

- **Role and engine**: `implementer`, Opus 5, native. Writing unit, sole writer in the mcp
  checkout. The campaign's last MUST-level code unit.
- **Objective**: the SEP-2243 custom-header contract holds on both sides — HTTP clients project
  annotated tool arguments into `Mcp-Param-*` headers and exclude tools whose annotations
  violate the constraints; the server validates recognized `Mcp-Param-*` headers against the
  body — turning the last conformance reds green: `http-custom-header-server-validation`
  (3/6), `http-custom-headers` (3/15), `http-invalid-tool-headers` (1/10).

## Context

- Repository: `C:\Users\mikes\WebstormProjects\mcp`, clean `main` at the commit the dispatch
  names (after M3). Commit nothing. Never touch `tmp/worktrees/`.
- Read first: `AGENTS.md`, `.claude/rules/typescript.md`, `.claude/rules/architecture.md`,
  `.claude/rules/patterns.md`, `.claude/rules/tests.md`. The spec captures: the campaign's
  `r1-report.md` row 33 and the Orchestrator's streamable-http read (the campaign folder's
  `spec-patterns.md` sibling files), and the runner's own scenario sources under
  `node_modules/@modelcontextprotocol/conformance/dist/` — read the three scenarios' checks
  before designing; their messages are recorded in `tmp/units/mc-report.md` and
  `tmp/units/m0-report.md`.
- The spec's rules you implement:
  - `x-mcp-header` value constraints: non-empty RFC 9110 token, no control characters,
    case-insensitively unique within the `inputSchema`, primitive parameter types only
    (integer within IEEE754 safe range; `number` refused), statically reachable from the
    schema root through `properties` keys alone (never `items`, composition, conditionals, or
    `$ref`). An annotation anywhere else makes the TOOL DEFINITION invalid.
  - Clients on Streamable HTTP MUST reject invalid definitions by EXCLUDING the tool from
    `tools/list` results, SHOULD log a warning naming the tool and reason, and MUST project
    valid annotations: extract the value at the exact property path (omit the header when
    absent or `null`), convert (string as-is; integer decimal; boolean lowercase), encode
    through the sentinel rules, and append `Mcp-Param-{Name}`. Clients on other transports MAY
    ignore the annotations — stdio, WebSocket, and MessagePort stay untouched.
  - Servers MUST reject a recognized `Mcp-Param-*` header with invalid characters, and MUST
    validate decoded header values against the body, `400` + `-32020` on failure; integer
    comparison SHOULD be numeric. Unrecognized `Mcp-Param-*` headers are forwarded/ignored.
  - The client-SHOULD retry-after-relist on a `HeaderMismatch` is NOT built in this unit; it is
    declared in the guide as a departure with its reason (the M5 pass carries the final prose
    if you leave a marker; you own the two existing "not satisfied" guide entries and replace
    them with the implemented truth).
- **Design constraints (fixed rulings):**
  - Never widen `MCPClientTransportInterface`. The guide's own closer names a per-request seam
    on the HTTP faces only.
  - Candidate shape, symmetric with M1's derive-from-the-message discipline: the HTTP client
    faces derive everything from the traffic they already carry — cache each tool's
    `x-mcp-header` annotations from the `tools/list` RESULTS they deliver, FILTER invalid
    definitions out of those results before delivering them (that is where the client-side
    exclusion lives), and project `Mcp-Param-*` headers onto `tools/call` requests from the
    cached annotations plus the call's own arguments. You may adopt this shape or a better one
    within the fixed constraints; name your choice and its reasoning in the report. Whatever
    the shape: the annotation validator and the projection derivation are centralized
    host-independent helpers/validators in core (both faces import them), and the sentinel
    encoding reuses `encodeSentinel`/`decodeSentinel` from M1 — no second codec.
  - A `tools/call` for a tool never seen through the transport projects nothing (no invented
    lookup); state that behavior in the guide sentence.
  - Server side: the server recognizes exactly the `Mcp-Param-*` names its OWN tool
    definitions annotate. Read where the handler can reach the served definitions and place
    the validation at the existing header-issue seam (`inferHeaderIssue` family) or beside it;
    keep the `-32020` shape.
- The failing-first record is standing: the three conformance rows above, with per-check
  messages in the unit reports named earlier. Expected landing: server row `9/0`
  (verify the runner's own count), client rows `18/0` and `11/0` (verify), total updated.
  `tests/conformanceClient.ts` is scenario-blind and calls the tools the client lists — the
  exclusion therefore changes what it calls; touch it only if a scenario's contract requires
  (own it if so).

## Amendment (2026-08-27, from the A-M1 verdict — do this first)

The A-M1 audit broke one placement verdict in the codec you reuse: `encodeSentinel` builds the
markers from a template literal while `decodeSentinel` parses them from a regex — two spellings
of one discipline that can drift. Before your projection work touches the codec's callers:
centralize the sentinel markers as exported constants in `src/core/constants.ts` (the pair, or
one exported pattern the template derives from — one spelling total), both functions reading
them; add the constants' guide Surface rows; and pin the centralization with a mutation probe
recorded in your report (perturb the constant, watch BOTH directions redden, restore). Keep
encode's membership rule as `decodeSentinel(value) === value`.

## Scope

- Owned: `src/core/constants.ts` (the amendment), `src/core/helpers.ts`,
  `src/core/validators.ts`, `src/core/types.ts` (only as the
  types force), `src/server/transports/HTTPClientTransport.ts`,
  `src/browser/transports/HTTPClientTransport.ts`, `src/server/inferers.ts`,
  `src/server/handlers.ts`, `src/core/MCPClient.ts` (only if your chosen shape places the
  exclusion there), the mirrored test files for every touched source file,
  `tests/setupConformance.ts` (only if the fixture must annotate a tool for the server-side
  scenario — read what the runner drives first), `tests/conformance.test.ts` (moved baselines),
  `tests/conformanceClient.ts` (only as bounded earlier), `guides/mcp.md` (the two closed
  entries, the transport sections' new sentences, Surface rows for new exports).
- Off-limits: everything else; `package.json`; the shared transport interface's declaration.

## Execution

Perform the assignment directly and spawn nothing. TTTDD; the unit-level failing-first rows
come before code. Validate scoped: `npm run check`, scoped oxlint and oxfmt `--check`,
`npm run test:src:core`, `npm run test:src:server`, `npm run test:src:browser`,
`npm run test:conformance` (after `npm run build:src` — the client driver reads `dist/`; record
the build as the authorized ancillary), `npm run test:guides`, `npm run test:policy`. No
tree-wide `format` or `lint --fix`.

## Output

Report to `tmp/units/m2-report.md` and as your final message: the shape you chose with its
reasoning, per-scenario baseline movement with runner messages, failing-first records, every
new export with its home, the guide entries as rewritten, and any claim you could not close.

## Deviation contract

Stop and report when: your chosen shape cannot satisfy a scenario check and the runner's
message shows why (report the tension between shape and scenario, decide nothing); the
exclusion or projection forces a change to the shared transport interface; or a test outside
the owned files reddens. Ancillary choices within the fixed rulings are yours to decide and
record.

## Acceptance criteria

1. The three conformance rows green, recorded red-then-green, with the totals updated; every
   other row unchanged.
2. The annotation validator proven over the spec's constraint list (each invalid form refused;
   the valid nested-properties chain admitted); the projection proven over the conversion and
   encoding table including omission on absent and `null`.
3. Exclusion proven: an invalid definition never reaches the caller's `tools/list` result on
   the HTTP faces, valid siblings survive, and the stdio path is untouched.
4. Server validation proven at the wire: invalid characters and decoded-mismatch each `400` +
   `-32020`; unrecognized params ignored; numeric comparison for integers.
5. All scoped runs green; the guide's two former gap entries state the implemented truth and
   the declared SHOULD departure.
