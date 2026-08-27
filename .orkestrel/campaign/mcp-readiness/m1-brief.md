# M1 — standard-header completeness: `Mcp-Name` scope, the Base64 sentinel, and the modern
# refusal codes

- **Role and engine**: `implementer`, Opus 5, native. Writing unit, sole writer in the mcp
  checkout.
- **Objective**: the Streamable HTTP standard-header contract holds at MUST level — `Mcp-Name`
  required and validated on all three methods with the sentinel decoded before comparison,
  clients encode unsafe values, and a modern-headered request with missing or malformed body
  `_meta` answers `-32602` — turning the last `server-stateless` reds green.

## Context

- Repository: `C:\Users\mikes\WebstormProjects\mcp`, clean `main` at the commit the dispatch
  names (after M4). Commit nothing. Never touch `tmp/worktrees/`.
- Read first: `AGENTS.md`, `.claude/rules/typescript.md`, `.claude/rules/names.md`,
  `.claude/rules/architecture.md` (the codec is a centralized helper), `.claude/rules/tests.md`.
- Spec grounding (campaign captures `r1-report.md` rows 19-24 and the Orchestrator's
  streamable-http read): the standard-header table marks `Mcp-Method` required on all requests
  and `Mcp-Name` required for `tools/call` (`params.name`), `resources/read` (`params.uri`),
  and `prompts/get` (`params.name`); a value that cannot ride as plain ASCII — non-ASCII,
  control characters, leading or trailing whitespace, or a value matching the sentinel pattern
  itself — MUST be carried as `=?base64?{Base64OfUTF8}?=` (markers lowercase, exact); servers
  MUST decode an encoded value before comparing it to the body and MUST reject invalid
  characters; missing or mismatched → `400` + `-32020`. SEP-2575: a request missing either
  `_meta` protocol version or capabilities → `-32602` (`400`).
- Current state, verified in source: both `#buildHeaders` stamp `Mcp-Name` raw and only for
  `tools/call` (`src/server/transports/HTTPClientTransport.ts:190`,
  `src/browser/transports/HTTPClientTransport.ts:191`); `inferHeaderIssue` returns `undefined`
  for any non-`tools/call` method (`src/server/inferers.ts:106`); no sentinel codec exists
  anywhere. The HTTP post handler accepts a headerless legacy `initialize` and otherwise
  answers `-32022` for a legacy-invalid protocol header (`src/server/handlers.ts` around
  `:32-147`, per the absorption record) — the seam behind the two remaining `server-stateless`
  reds: `sep-2575-request-meta-invalid-missing-meta` and
  `sep-2575-request-meta-invalid-missing-protocol-version` expect `-32602`, get `-32022`
  (`tests/conformance.test.ts` row comment and `tmp/units/minput-report.md`).
- The conformance rows are the binding red record: `server-stateless` stands at
  `26 passed, 2 failed`; `http-header-validation` stands green at 13 and must stay green.
- MC's discovery bounds the client half: `MCPClientInterface` publishes no resources or prompts
  methods, so client-side `Mcp-Name` stamping beyond `tools/call` has no reachable path — do
  not build it; the server half and the encoding are the reachable obligations. The
  `http-standard-headers` client scenario's reachable checks are green and must stay green.

## Tasks

1. **The sentinel codec, one implementation.** Encode and decode helpers in
   `src/core/helpers.ts` (named per the naming rules), with the exact marker discipline: encode
   when the value is not plain printable ASCII (per RFC 9110 field-value characters), has
   leading or trailing whitespace, or itself matches the sentinel pattern; decode exactly the
   `=?base64?…?=` form. Guards or parsing stay where the kind rules place them. Unit rows in
   the mirrored suite cover the encoding table from the spec (plain ASCII unchanged, non-ASCII,
   whitespace-padded, embedded newline, sentinel-pattern literal) in both directions plus the
   non-sentinel passthrough.
2. **Client stamping.** Both HTTP client faces stamp `Mcp-Name` through the encoder for
   `tools/call` (the one method the client can issue that carries it). Keep the derivation
   shared-shape between the faces as it is today.
3. **Server validation scope.** `inferHeaderIssue` requires and validates `Mcp-Name` for
   `resources/read` against `params.uri` and `prompts/get` against `params.name`, decoding a
   sentinel-encoded header before comparison (also for `tools/call`), and rejecting a header
   value with invalid characters. Missing or mismatched → the existing `-32020` shape.
4. **The modern refusal codes.** In the HTTP seam, a request whose `mcp-protocol-version`
   header names a MODERN version but whose body lacks a parsable modern `_meta` answers `400` +
   `-32602`, never the legacy `-32022` fallthrough. The headerless legacy `initialize` path and
   the legacy-session flows stay exactly as they are — the live harness registration depends on
   them. `server-stateless` moves to `28 passed, 0 failed`, recorded red-then-green;
   `http-header-validation` stays 13 green.
5. **Guide**: the transport section's header sentences state the full scope and the sentinel;
   the era-scoped limits row for the client's method surface (the client stamps `Mcp-Name` only
   for `tools/call` because it issues no other named method) lands where the guide keeps such
   limits.

## Scope

- Owned: `src/core/helpers.ts`, `src/core/validators.ts` (only if a guard belongs there),
  `src/server/inferers.ts`, `src/server/handlers.ts`, `src/server/transports/HTTPClientTransport.ts`,
  `src/browser/transports/HTTPClientTransport.ts`, `guides/mcp.md` (the named sections),
  `tests/src/core/helpers.test.ts`, `tests/src/server/inferers.test.ts` (or the file that owns
  those proofs today), `tests/src/server/handlers.test.ts`, the transport test files for both
  faces, `tests/conformance.test.ts` (the moved baseline rows).
- Off-limits: everything else, including `tests/conformanceClient.ts` and `package.json`.

## Execution

Perform the assignment directly and spawn nothing. TTTDD; failing-first: the two
`server-stateless` checks are the standing red; add unit-level reds before code. Validate
scoped: `npm run check`, scoped oxlint and oxfmt `--check`, `npm run test:src:core`,
`npm run test:src:server`, `npm run test:src:browser`, `npm run test:conformance`,
`npm run test:guides`. No tree-wide `format` or `lint --fix`.

## Output

Report to `tmp/units/m1-report.md` and as your final message: per-task landing with
failing-first evidence, the moved baseline rows with runner messages, the codec's exact
membership rule, and any claim you could not close.

## Deviation contract

Stop and report when: the `-32602` change reddens any legacy-path test or conformance row (the
live registration path is load-bearing — report, do not force); a header scenario expectation
contradicts the spec capture; or a test outside the owned files reddens. Ancillary choices
(helper names within the rules, test placement) are yours to decide and record.

## Acceptance criteria

1. `server-stateless` recorded `28 passed, 0 failed` red-then-green; `http-header-validation`
   and every other green row unchanged.
2. The codec proven in both directions over the spec's encoding table; server comparison
   decodes before comparing on all three methods.
3. Scoped runs green; the guide's header sentences match the shipped scope.
