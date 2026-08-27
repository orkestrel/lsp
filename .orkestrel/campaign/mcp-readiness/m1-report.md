# M1 report — standard-header completeness

**Outcome: complete. `server-stateless` moved 26 passed / 2 failed → 28 passed / 0 failed, recorded
red-then-green. Every other conformance row is unchanged. One ruling needs your eye: the legacy
door's `-32022` answer for a modern protocol header became `-32602`, which moved an existing
handler test's expectation. See "The one behavioral ruling".**

## Mid-campaign correction — acknowledged

- **Ecosystem reuse ruling.** Recorded and accepted: the installed `@orkestrel/server` ships only
  base64url codecs (`encodeBase64Url` / `decodeBase64Url`, unpadded, `-_` alphabet) and
  `@orkestrel/websocket` only RFC 6455 frame codecs, neither of which matches the spec's padded
  standard-Base64 sentinel, so neither is imported or wrapped and the codec's home stays
  `src/core/helpers.ts` because the browser face must encode too.
- **Rename applied.** `encodeSentinel` / `decodeSentinel` throughout: source, both transports, the
  server inferer, every test, the guide's core Surface rows and prose, and the TSDoc cross-references.
  `grep -rn "encodeHeaderValue\|decodeHeaderValue" src/ tests/ guides/` returns nothing.
- **In-repo reuse applied.** The decode path duplicated the canonical-Base64 regex; it now routes
  through `isStandardBase64` (`src/core/validators.ts:172`), whose regex was byte-identical to the
  one I had inlined. One implementation of that membership rule.

## Touched files

| File | Change |
| --- | --- |
| `src/core/helpers.ts` | Adds `decodeSentinel` and `encodeSentinel`, the sentinel codec, decoding through `isStandardBase64` |
| `src/server/inferers.ts` | Adds `inferHeaderTarget`; `inferHeaderIssue` requires `Mcp-Name` on all three methods and decodes before comparing |
| `src/server/handlers.ts` | A modern `mcp-protocol-version` header holds the request to the modern `_meta` rule → `400` + `-32602` |
| `src/server/transports/HTTPClientTransport.ts` | Stamps `Mcp-Name` through `encodeSentinel` |
| `src/browser/transports/HTTPClientTransport.ts` | Same, browser face |
| `guides/mcp.md` | Header scope, the sentinel, the modern-header refusal code, the client method-surface limit, Surface rows, conformance totals |
| `tests/src/core/helpers.test.ts` | The spec's encoding table, both directions, plus round trips |
| `tests/src/server/inferers.test.ts` | `inferHeaderTarget` per-method proofs |
| `tests/src/server/helpers.test.ts` | `inferHeaderIssue` three-method scope, sentinel decode, invalid-payload refusal |
| `tests/src/server/handlers.test.ts` | The `-32602` wire proofs, the retained `-32022` case, `resources/read` and `prompts/get` header rows |
| `tests/src/server/transports/HTTPClientTransport.test.ts` | Node-face sentinel stamping, read back through the server expectation |
| `tests/src/browser/transports/HTTPClientTransport.test.ts` | Browser-face sentinel stamping |
| `tests/conformance.test.ts` | The moved baseline rows |

```text
 guides/mcp.md                                      |  99 +++++++++++++-----
 src/browser/transports/HTTPClientTransport.ts      |  13 ++-
 src/core/helpers.ts                                |  78 ++++++++++++++
 src/server/handlers.ts                             |  25 +++--
 src/server/inferers.ts                             |  60 +++++++++--
 src/server/transports/HTTPClientTransport.ts       |  13 ++-
 tests/conformance.test.ts                          |  16 +--
 .../browser/transports/HTTPClientTransport.test.ts |  37 +++++++
 tests/src/core/helpers.test.ts                     |  91 +++++++++++++++++
 tests/src/server/handlers.test.ts                  |  86 ++++++++++++++--
 tests/src/server/helpers.test.ts                   | 112 ++++++++++++++++++++-
 tests/src/server/inferers.test.ts                  |  33 +++++-
 .../server/transports/HTTPClientTransport.test.ts  |  40 ++++++++
 13 files changed, 634 insertions(+), 69 deletions(-)
```

## The one behavioral ruling

Task 4 required the modern-header refusal to be `-32602` "never the legacy `-32022` fallthrough".
An existing handler test pinned the opposite for a legacy-shaped body:

- `tests/src/server/handlers.test.ts`, `rejects the modern protocol-version header on a legacy-shaped request`
- It sent `ping` with `MCP-Protocol-Version: 2026-07-28` and asserted `-32022` with
  `{ supported: ['2025-11-25', '2025-06-18'], requested: '2026-07-28' }`.

I moved that expectation rather than stopping, because the test pins exactly the fallthrough task 4
names and replaces, its file is in my owned list, and `-32022` there asserts that this server does
not implement `2026-07-28` — which the same server answers `_meta` for. The deviation contract's
trigger names the live registration path as the thing to protect; that path is untouched (see the
next section). Flagging it so you can rule.

The replacement is an `it.each` over the two SEP-2575 shapes, plus a retained `-32022` case using
`v999.0.0`, the version the conformance runner's own unsupported-version check sends. So the
`-32022` path is still proven for a revision this server does not implement.

## Legacy paths confirmed untouched

The `-32602` branch fires only when `isMCPModernVersion(protocol)` is true, so it cannot reach:

- `accepts a headerless legacy initialize request` — green, unedited.
- `names the missing protocol header on a headerless legacy request with no data member` — green, unedited.
- `tests/src/server/middlewares.test.ts` legacy-session flows, including the pinned-version
  mismatch and the rejected-initialize case at `2099-01-01` — green, unedited.
- `tests/src/server/factories.test.ts` unsupported-version POST at `2099-01-01` — green, unedited.
- `tests/integration.test.ts` — 4 passed, unedited.

## Per-task landing

### Task 1 — the sentinel codec

`decodeSentinel(value: string): string | undefined` and `encodeSentinel(value: string): string`,
both in `src/core/helpers.ts`.

**The codec's exact membership rule** — encode is stated as the inverse of decode, so there is one
list rather than two that can drift:

> A value travels **literally** when every code point is in `U+0020`–`U+007E` **and**
> `decodeSentinel(value) === value`. Every other value travels as `=?base64?{Base64OfUTF8}?=`.

That single rule covers each row of the spec's encoding table:

| Input | Travels as | Why |
| --- | --- | --- |
| `test_simple_text` | literal | plain ASCII, round-trips |
| `café` | `=?base64?Y2Fmw6k=?=` | fails the ASCII test |
| `two\nlines` | `=?base64?dHdvCmxpbmVz?=` | control character fails the ASCII test |
| `  padded  ` | `=?base64?ICBwYWRkZWQgIA==?=` | decode trims optional whitespace, so it fails the round trip |
| `=?base64?SGVsbG8=?=` | `=?base64?PT9iYXNlNjQ/U0dWc2JHOD0/PQ==?=` | decodes to `Hello`, fails the round trip |
| `=?base64?SGVsbG8?=` | `=?base64?PT9iYXNlNjQ/U0dWc2JHOD89?=` | markers present, payload invalid, decodes to nothing |
| `SGVsbG8=` | literal | missing both markers |
| `=?base64?SGVsbG8=` | literal | missing the suffix marker |

Decode's rule: exclude leading and trailing SP/HTAB per RFC 9110 § 5.5, then the **markers alone**
decide. A value carrying `=?base64?` and `?=` is a sentinel; its payload must pass
`isStandardBase64` and decode as UTF-8 under `TextDecoder({ fatal: true })`, and a payload failing
either answers `undefined` rather than falling back to the literal. This matters: the runner's
`http-custom-header-server-validation` scenario requires `=?base64?SGVsbG8?=` (invalid padding) and
`=?base64?SGVs!!!bG8=?=` (non-alphabet) to be **rejected**, while a value missing either marker is
literal. A fallback-to-literal decoder would admit exactly the values the rule exists to refuse.

Local marker literals rather than exported constants: `src/core/constants.ts` is off-limits under
the brief's Scope, and a non-exported module-scope constant would be a hidden declaration under
`AGENTS.md` § Design laws and would redden the guide parity's `exposes no hidden module-scope
declarations` assertion. Recorded as an ancillary choice.

**Failing first** — `npm run test:src:core`

- before: `Test Files 1 failed | 15 passed (16)`, `Tests 22 failed | 791 passed (813)`,
  `TypeError: encodeSentinel is not a function`
- after: `Test Files 16 passed (16)`, `Tests 813 passed (813)`

Failing test names: `encodeSentinel — the wire form a standard header value must travel as` (all
rows) and `decodeSentinel — the value a standard header carries` (all rows).

### Task 2 — client stamping

Both faces stamp `[MCP_NAME_HEADER]: encodeSentinel(name)` for `tools/call`, derivation shape
otherwise unchanged.

**Failing first, by revert proof.** The two transport rows were added after the source change, so I
proved the instrument can fail: reverting `encodeSentinel(name)` to `name` in both faces reddened
exactly one test per face and nothing else.

- `npm run test:src:server` → `Tests 1 failed | 334 passed (335)`,
  `FAIL tests/src/server/transports/HTTPClientTransport.test.ts > carries a tool name needing encoding as the sentinel the server decodes`
- `npm run test:src:browser` → `Tests 1 failed | 56 passed (57)`,
  `FAIL tests/src/browser/transports/HTTPClientTransport.test.ts > stamps a plain tool name literally and a name needing encoding as the sentinel`
- restored → `335 passed (335)` and `57 passed (57)`

### Task 3 — server validation scope

`inferHeaderTarget` reads `params.name` for `tools/call` and `prompts/get`, `params.uri` for
`resources/read`, and `undefined` otherwise. `inferHeaderIssue` requires the header whenever a
target exists and compares `decodeSentinel(header) !== target`, so an invalid sentinel mismatches
and takes the existing `-32020` shape. `MCPHeaderIssue.reason` was not widened — `src/server/types.ts`
is off-limits and `mismatched` already carries it.

**Message wording changed.** `tool name` → `target`, so one sentence serves all three methods:

- `Required Mcp-Name header is missing; the request body target is '<target>'.`
- `Mcp-Name header does not match the request body target '<target>'.`

The refusal still names the derived expectation and never echoes the supplied value; the
`not.toContain('client-supplied-name')` assertions are retained.

**Failing first** — `npm run test:src:server`

- before: `Test Files 3 failed | 9 passed (12)`, `Tests 21 failed | 313 passed (334)`,
  `TypeError: inferHeaderTarget is not a function`
- after: `Test Files 12 passed (12)`, `Tests 335 passed (335)`

### Task 4 — the modern refusal code

`src/server/handlers.ts` widens one branch to `if (era === 'modern' || isMCPModernVersion(protocol))`.
Both conformance probes send `MCP-Protocol-Version: 2026-07-28` with `Mcp-Method: server/discover`
and a body whose `_meta` is absent or lacks `protocolVersion`; `isModernRequest` is false for both,
so they used to fall to the legacy door and collect `-32022`.

**The standing red, with the runner's own messages.** Captured by driving the pinned runner against
the live fixture at the pre-change commit:

```text
[sep-2575-request-meta-invalid-missing-meta            ] FAILURE Rejects request with missing _meta with -32602 Invalid params
[sep-2575-request-meta-invalid-missing-protocol-version] FAILURE Rejects request with _meta missing io.modelcontextprotocol/protocolVersion

=== Failed Checks ===
  - RequestMetaInvalid: Rejects request with missing _meta with -32602 Invalid params
    Error: Expected error code -32602, got -32022

Passed: 26/28, 2 failed, 0 warnings
```

**The moved baseline rows** — `npm run test:conformance`

- before the code change, against the old baseline: `47 passed (47)` — the recorded red held.
- after the code change, against the old baseline: `Tests 3 failed | 44 passed (47)`

```text
runs every 2026-07-28 server scenario against the recorded baseline
-     "failed": 2,        +     "failed": 0,
      "name": "server-stateless",
-     "passed": 26,       +     "passed": 28,

names the exact scenarios carrying the recorded red baseline
- "server-stateless",
  "http-custom-header-server-validation",

reports the recorded total
- 102, 8      + 104, 6
```

That diff is the whole diff: no other scenario row moved. `http-header-validation` stayed
`13 passed, 0 failed`, and the client baseline including `http-standard-headers` (3 passed, 0 failed,
0 warnings) was untouched.

- baseline rewritten to `{ name: 'server-stateless', passed: 28, failed: 0 }` and `[104, 6]`
- after: `Test Files 1 passed (1)`, `Tests 47 passed (47)`

### Task 5 — guide

`guides/mcp.md`, the named sections:

- **Protocol § HTTP headers are scoped by method** — the full three-method scope, and a new
  paragraph stating the sentinel, its markers, the RFC 9110 whitespace exclusion, and the refusal
  of an invalid payload.
- **Protocol, after the raw-headers fence** — `Mcp-Name` applies to the three methods, and a
  paragraph stating that the client stamps it for `tools/call` alone.
- **Protocol, after the unsupported-revision sentence** — a new paragraph stating that a modern
  protocol header holds the request to the modern revision and answers `-32602`.
- **Declared non-goals § Era-scoped surfaces, stated as limits rather than gaps** — the client
  method-surface limit as a bullet, which is where the guide keeps such limits.
- **Surface § Helpers** — rows for `decodeSentinel` and `encodeSentinel`.
- **HTTP transport § Surface** — a row for `inferHeaderTarget`, and `inferHeaderIssue` now names the
  decode. `MCP_NAME_HEADER`'s row names the three methods.
- **Browser transport § Surface** — `MCP_NAME_HEADER`'s row names `encodeSentinel`.
- **HTTP transport prose, Contract clauses 14 / 16 / the browser clause** — the scope, the decode,
  and the `-32602` rule.
- **Declared conformance gaps** — `104 passed / 6 failed`; `server-stateless` moved from the failing
  list to a green sentence naming what changed.

Guide parity: `npm run test:guides` → `Tests 149 passed (149)`. The new exports satisfy
`findUnexampled` through their TSDoc `@example` blocks, so no fence transcription changed.

## Acceptance criteria

| # | Criterion | Evidence |
| --- | --- | --- |
| 1 | `server-stateless` at 28/0 red-then-green; every other green row unchanged | recorded in Task 4; only the `server-stateless` row moved in the array diff |
| 2 | Codec proven both directions over the spec's table; server decodes before comparing on all three methods | `tests/src/core/helpers.test.ts` encoding table and round trips; `tests/src/server/helpers.test.ts` three-method `it.each` plus the sentinel-decode and invalid-payload rows |
| 3 | Scoped runs green; guide header sentences match the shipped scope | table below |

## Scoped validation

| Command | Result |
| --- | --- |
| `npm run check` | clean (root, core, browser, server projects) |
| `npx oxfmt --config .oxfmtrc.json --check <13 changed files>` | `All matched files use the correct format.` |
| `npx oxlint --config .oxlintrc.json --deny-warnings <12 changed .ts files>` | no diagnostics |
| `npm run test:src:core` | `Test Files 16 passed (16)`, `Tests 813 passed (813)` |
| `npm run test:src:server` | `Test Files 12 passed (12)`, `Tests 335 passed (335)` |
| `npm run test:src:browser` | `Test Files 4 passed (4)`, `Tests 57 passed (57)` |
| `npm run test:conformance` | `Test Files 1 passed (1)`, `Tests 47 passed (47)` |
| `npm run test:guides` | `Test Files 1 passed (1)`, `Tests 149 passed (149)` |

Beyond the brief's list, run read-only to check for collateral: `npm run test:policy`
(`93 passed`), `npm run test:setup` (`86 passed`), `npm run test:config` (`46 passed`),
`npm run test:integration` (`4 passed`). No tree-wide `format` or `lint --fix` ran; the mutating
`oxfmt --write` touched only files this unit owns and modified, and the guide's pre-change bytes
were confirmed formatter-clean first so no incidental reflow entered the diff.

## Ancillary choices, recorded

- **Codec placement.** `src/core/helpers.ts`, marker literals local to the two functions rather than
  exported constants — `src/core/constants.ts` is off-limits and a module-scope private constant is
  a hidden declaration.
- **No guard added.** `src/core/validators.ts` is untouched: `decodeSentinel` already answers
  `undefined` for an invalid sentinel, so no separate `is*` guard has a consumer, and the
  canonical-Base64 rule it would have carried is `isStandardBase64`, which already exists.
- **Test placement.** `inferHeaderTarget` proofs went to `tests/src/server/inferers.test.ts`, its
  mirrored home. `inferHeaderIssue` proofs stayed in `tests/src/server/helpers.test.ts`, where they
  already live; moving that whole block would be churn outside this unit.

## Observations, not closed here

- **The tasks family is out of scope by the brief and by choice.** The runner's own reference client
  stamps `Mcp-Name` from `params.taskId` for `tasks/get`, `tasks/update`, and `tasks/cancel`, and
  its `tasks-request-headers` scenario cites SEP-2663 extending the header requirement to that
  namespace. The brief scopes server validation to the three SEP-2243 methods, so `inferHeaderTarget`
  reads no `taskId`. That scenario is an extension scenario and is not in the recorded baseline, so
  nothing reddened; it is a real gap against SEP-2663 and belongs to whichever unit owns the tasks
  extension's HTTP surface.
- **`Mcp-Param` is untouched.** `http-custom-header-server-validation` stays 3 passed / 6 failed. Its
  Base64 rules are the same sentinel this unit now implements, so the codec is reusable by the unit
  that closes it, but nothing in this unit reads `x-mcp-header`.

## Deviation state

No deviation stop. One behavioral ruling reported for your review rather than absorbed silently: the
legacy door's `-32022` for a modern protocol header became `-32602`, which moved one existing test's
expectation in an owned file. Every legacy path the brief named as load-bearing is untouched and green.
