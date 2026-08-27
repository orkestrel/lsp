# M2 report — `x-mcp-header`: client projection, violating-tool exclusion, server validation

**Outcome: complete. All three conformance rows are green, recorded red-then-green, and the
server total moved to `110 passed / 0 failed`. `MCPClientTransportInterface` is unchanged. The
amendment landed first, with its mutation probe. One ruling needs your eye: the server-side
lookup dispatches `tools/list` through the same dispatcher on every modern `tools/call`, which
costs one extra in-memory dispatch per call — see "The shape I chose".**

| Scenario | Before | After |
| --- | --- | --- |
| `http-custom-header-server-validation` | 3 passed / 6 failed | 9 passed / 0 failed |
| `http-custom-headers` | 3 passed / 15 failed | 18 passed / 0 failed |
| `http-invalid-tool-headers` | 1 passed / 10 failed | 11 passed / 0 failed |
| Server total | 104 passed / 6 failed | 110 passed / 0 failed |

Every other row is unchanged; the evidence is in "Per-scenario movement".

## Amendment (done first) — the sentinel markers are one spelling

`src/core/constants.ts` gains `MCP_SENTINEL_PREFIX` (`'=?base64?'`) and `MCP_SENTINEL_SUFFIX`
(`'?='`). `encodeSentinel` builds from them; `decodeSentinel` recognizes a sentinel by
`startsWith` / `endsWith` over them instead of its own regex, so the markers are spelled once.
Encode's membership rule is untouched: `decodeSentinel(value) === value` plus the printable-ASCII
test.

Replacing the anchored regex with string operations moved one boundary, so it is pinned: the old
`/^=\?base64\?([\s\S]*)\?=$/` needed at least 11 characters, while `startsWith` + `endsWith` alone
would accept the 10-character `=?base64?=` by letting the markers overlap. `decodeSentinel` now
requires `field.length >= MCP_SENTINEL_PREFIX.length + MCP_SENTINEL_SUFFIX.length`, and
`treats a value too short to hold both markers as literal` asserts it.

**Mutation probe.** `MCP_SENTINEL_PREFIX` perturbed to `'=?base32?'`:

- `npm run test:src:core` → `Test Files 1 failed | 15 passed (16)`, `Tests 9 failed | 806 passed (815)`
- Reddened in BOTH directions: four `encodeSentinel` rows (`encodes a non-ASCII value`,
  `encodes a value carrying leading or trailing whitespace`, `encodes a value carrying an embedded
  newline`, `encodes a value wearing the sentinel markers, well formed or not`) and five
  `decodeSentinel` rows (`decodes a well-formed sentinel back to its UTF-8 value`, `refuses a
  sentinel whose payload has invalid padding`, `refuses a sentinel whose payload has non-alphabet
  characters`, `refuses a sentinel whose payload is not UTF-8`, `reads its markers from the one
  pair of exported constants`).
- Restored from a backup taken before the edit → `Tests 815 passed (815)`.

## The shape I chose

### Client faces — the brief's candidate shape, adopted unchanged

Each HTTP client transport threads the SENT message into `#deliver` → `#capture`, so it knows
which reply answers a `tools/list`. A new `#select` then runs on that reply alone: it derives each
listed tool's projections with `buildHeaderParameters`, caches them in a `#parameters`
`Map<string, readonly MCPHeaderParameter[]>`, DROPS every definition the derivation refuses, and
emits the rebuilt result. `#buildHeaders` projects a later `tools/call` from
`this.#parameters.get(name) ?? []` plus the call's own `arguments`.

Reasoning for adopting it rather than a better one: the transport already carries both halves of
the derivation — the schema arrives in the result it delivers, and the arguments arrive in the
message it sends — so nothing has to cross `MCPClientTransportInterface`. That is the same
derive-from-the-message discipline M1's `Mcp-Name` stamping follows, and it is why the guide's old
"needs a widened `send`" reading was wrong. A tool no listing carried projects nothing; the
`Map` lookup is the whole mechanism, and there is no fallback lookup to invent one.

Two ancillary decisions inside that shape:

- **The warning rides the `error` event.** SEP-2243 says a client SHOULD log a warning naming the
  tool and the reason. `MCPClientTransportEventMap` is part of the shared transport declaration and
  is off-limits, and `error` is already this transport's channel for a contained fault a `send`
  swallows. `MCPClient` subscribes only to `message` and `close`
  (`src/core/MCPClient.ts:246-247`), so the emission cannot disturb a pending request.
- **A listing entry that is not a record, or carries no string `name`, is KEPT.** There is nothing
  to validate and nothing to cache, and inventing an exclusion for it would drop a tool the
  protocol never made invalid.

### Server face — read the served definitions, fresh, per call

`src/server/handlers.ts` gains one block after the `inferHeaderIssue` seam, scoped to a modern
`tools/call` with a string `params.name`. It dispatches `tools/list` through the SAME `mcp`
dispatcher, reads the named tool's schema with `extractToolSchema`, derives the projections with
`buildHeaderParameters`, and refuses through `inferParameterRefusal` with the existing `400` +
`-32020` shape.

Why that door: `HTTPHandlerOptions` and `MCPHeaderIssue` live in `src/server/types.ts`, which is
off-limits, and `MCPDispatcherInterface` publishes `emitter`, `limit`, `dispatch`, and `handle` and
nothing else. `dispatch` is therefore the only reach the handler has to its own server's tool
definitions.

Why fresh rather than cached: I considered caching from the `tools/list` answers the handler itself
serves, symmetric with the client. It has a hole the MUST exists to close. `Mcp-Param-*` lets a
gateway route or authorize on a value without parsing the body, and the server's validation is what
stops a client lying to that gateway. A cache populated by the client's own earlier `tools/list`
means a client that never lists is never validated — the exact request a forger would send. A cache
also goes stale against a registry a consumer mutates with `tools.add`. Both failures are silent.

**The cost, stated plainly.** One extra in-memory `tools/list` dispatch per modern `tools/call`. For
the built-in handler that is a map over the registry's definitions with no I/O. A consumer who
replaced `tools/list` with an expensive handler pays for it on every tool call; that is recorded in
the guide's HTTP transport section rather than left for them to measure. A held-open `tools/list`
answer is `stop()`ped and read as no definition, so such a consumer refuses nothing rather than
leaking a stream.

The synthetic request carries the incoming call's own `_meta`, so it runs under the same version
context and capability declaration; its id is `0` and never leaves the handler.

### Why `inferParameterRefusal` returns a message rather than an `MCPHeaderIssue`

`MCPHeaderIssue.header` is the closed union `'MCP-Protocol-Version' | 'Mcp-Method' | 'Mcp-Name'`
(`src/server/types.ts:49`), and that file is off-limits. The new inferer answers the refusal message
directly and `handlers.ts` wraps it in the same `buildJSONRPCError(id, MCP_HEADER_MISMATCH, …)`.
Recorded as an ancillary choice; widening the union is the alternative and it needs an owned
`src/server/types.ts`.

## New exports, with their homes

| Export | Home | What it is |
| --- | --- | --- |
| `MCP_SENTINEL_PREFIX` | `src/core/constants.ts` | The sentinel's opening marker (amendment) |
| `MCP_SENTINEL_SUFFIX` | `src/core/constants.ts` | The sentinel's closing marker (amendment) |
| `MCP_PARAM_PREFIX` | `src/core/constants.ts` | `'Mcp-Param-'` |
| `MCP_HEADER_ANNOTATION` | `src/core/constants.ts` | `'x-mcp-header'` |
| `MCPHeaderPrimitive` | `src/core/types.ts` | `'boolean' \| 'integer' \| 'string'` |
| `MCPHeaderParameter` | `src/core/types.ts` | `{ name; path; primitive }` — one projection |
| `isFieldToken` | `src/core/validators.ts` | Total guard for one RFC 9110 token |
| `isMCPHeaderPrimitive` | `src/core/validators.ts` | Total guard for the three admissible types |
| `countHeaderAnnotations` | `src/core/helpers.ts` | Every annotation key at any position; iterative, ancestor-tracked |
| `extractHeaderAnnotations` | `src/core/helpers.ts` | The annotations a `properties` chain reaches |
| `buildHeaderParameters` | `src/core/helpers.ts` | The one valid/invalid decision both sides make |
| `renderHeaderValue` | `src/core/helpers.ts` | The conversion table, stated once |
| `buildHeaderProjection` | `src/core/helpers.ts` | The `Mcp-Param-*` headers one call carries |
| `extractToolSchema` | `src/core/helpers.ts` | One named tool's `inputSchema` out of a `tools/list` answer |
| `inferParameterRefusal` | `src/server/inferers.ts` | The server's refusal for a disagreeing header |

Both new guards are registered in `PUBLISHED_GUARDS` (`tests/src/core/validators.test.ts`), so the
hostile-corpus totality sweep covers them; that registration was itself a recorded red
(`expected [ 'isFieldToken', …(1) ] to deeply equal []`).

**How reachability is decided without a second keyword list.** `extractHeaderAnnotations` walks the
`properties` chain alone. `countHeaderAnnotations` counts every `x-mcp-header` key anywhere.
`buildHeaderParameters` refuses when the two disagree, so an annotation under `items`, `oneOf`,
`if`, `$defs`, `additionalProperties`, or any position a later JSON Schema keyword adds is caught
without this package enumerating traversable keywords. Depth is bounded by `path.length` against
`DEFAULT_MCP_LIMITS.depth`, which is also what makes a self-referential schema terminate; the count
walk is iterative with an ancestor `Set`, so it terminates on a cycle without a depth bound.

## Failing-first records

Every row below is `npm run test:<project>`, run on 2026-08-27, Windows 11, Node v24.19.0, from
`C:\Users\mikes\WebstormProjects\mcp` at `bf21ac9`. Nothing was committed.

| Unit | Command | Before | After |
| --- | --- | --- | --- |
| The two guards | `npm run test:src:core` | `Tests 24 failed \| 815 passed (839)`, `TypeError: isFieldToken is not a function` | `Tests 839 passed (839)` |
| The five core helpers | `npm run test:src:core` | `Tests 40 failed \| 839 passed (879)` | `Tests 879 passed (879)` |
| Node-face transport | `npm run test:src:server` | `Tests 3 failed \| 342 passed (345)` | `Tests 345 passed (345)` |
| Browser-face transport | `npm run test:src:browser` | `Tests 2 failed \| 62 passed (64)` | `Tests 64 passed (64)` |
| Server validation | `npm run test:src:server` | `Tests 14 failed \| 354 passed (368)` | `Tests 368 passed (368)` |

Failing test names, by block:

- `isFieldToken — the RFC 9110 token an x-mcp-header annotation must be` (every row) and
  `isMCPHeaderPrimitive — the schema types an annotation may sit on` (both rows).
- `buildHeaderParameters — the x-mcp-header projections one inputSchema declares` (every row,
  including the whole invalid-form matrix and the unreachable-position matrix),
  `countHeaderAnnotations — how many x-mcp-header keys a value carries anywhere`,
  `extractHeaderAnnotations — the reachable half of the annotation walk`,
  `renderHeaderValue — the text one projected argument travels as`,
  `buildHeaderProjection — the Mcp-Param headers one call carries`, and
  `extractToolSchema — the named tool inputSchema inside a tools/list answer`.
- `HTTPClientTransport — the x-mcp-header contract > excludes an invalidly annotated tool from the
  tools/list result it delivers`, `> projects the annotated arguments of a listed tool into
  Mcp-Param headers`, `> omits the header of a null argument and encodes one a field cannot carry
  plainly` (Node); `> excludes an invalidly annotated tool and reports the exclusion on error`,
  `> projects a listed tool arguments into encoded Mcp-Param headers, omitting a null` (browser).
  `> projects nothing for a tool it never carried a listing for` passed on both faces before the
  change and after it — it is the control, not a proof of the change.
- `inferParameterRefusal` (every row) and `createMCPPostHandler — Mcp-Param headers validated
  against the request body` (every `$branch with HTTP 400, -32020, and no echoed header value`
  row). The accept rows in that block passed before the change too, and are the controls that the
  new refusal does not over-reach.

## Per-scenario movement, with the runner's own readings

The standing red held at the baseline commit: `npm run test:conformance` → `Tests 47 passed (47)`
with `http-custom-header-server-validation` recorded at 3/6, `http-custom-headers` at 3/15, and
`http-invalid-tool-headers` at 1/10.

After `npm run build:src` and the code change, against the OLD baseline: `Tests 5 failed | 42
passed (47)`. The whole diff:

```text
runs every 2026-07-28 server scenario against the recorded baseline
-     "failed": 6,        +     "failed": 0,
      "name": "http-custom-header-server-validation",
-     "passed": 3,        +     "passed": 9,

names the exact scenarios carrying the recorded red baseline
- ["http-custom-header-server-validation"]   + []

reports the recorded total
- 104, 6      + 110, 0

runs every non-auth 2026-07-28 client scenario against the recorded baseline
-     "failed": 15,       +     "failed": 0,
-     "passed": 3,        +     "passed": 18,      (http-custom-headers)
-     "failed": 10,       +     "failed": 0,
-     "passed": 1,        +     "passed": 11,      (http-invalid-tool-headers)

names the exact client scenarios carrying the recorded red baseline
- ["http-custom-headers", "http-invalid-tool-headers"]   + []
```

That is the whole diff: the server array compared equal on every other row, including
`http-header-validation` at 13/0, `server-stateless` at 28/0, and `dns-rebinding-protection` at
2/0; the client array compared equal on every other row.

Baselines then rewritten in `tests/conformance.test.ts` to `{ http-custom-header-server-validation:
9/0 }`, `{ http-custom-headers: 18/0 }`, `{ http-invalid-tool-headers: 11/0 }`, and `[110, 0]`, each
with the comment above it restated from the gap it used to name to the mechanism that closed it.
`npm run test:conformance` → `Tests 47 passed (47)`.

`EXPECTED_RED` and `EXPECTED_CLIENT_RED` are derived, so both are now empty and the two
"names the exact scenarios carrying the recorded red baseline" assertions became "no scenario
fails". The comments describing what a nonzero row would mean stay, because they state the rule
rather than the current population.

`tests/conformanceClient.ts` is UNTOUCHED. It is scenario-blind and calls exactly the tools the
client listed, so the exclusion changes what it calls without changing it — which is precisely why
`http-invalid-tool-headers` measures the client rather than the driver.
`tests/setupConformance.ts` is untouched too: its `test_header_parameter` fixture already carries
`x-mcp-header: 'value'` on a required string property, which is exactly what the server-validation
scenario looks for.

## The guide entries as rewritten

- **Protocol § A tool parameter can name its own header** — new. The annotation's four validity
  rules as a list, what each side does with an invalid definition, the conversion and encoding
  table, the omit-on-absent-or-null rule, the server's four refusals, and the forwarding of an
  unrecognized name. It also states that a `tools/call` for a tool the transport never carried a
  listing for projects nothing.
- **Declared non-goals, "Not built" table** — the row `x-mcp-header server-side annotation and
  definition filtering` is replaced by `Withholding a consumer's own invalidly annotated tool from
  tools/list`: the annotation is now read and enforced on both sides, the exclusion MUST binds an
  HTTP client and this package's transports honour it, and the server deliberately serves such a
  definition rather than hiding a consumer's tool over one bad property.
- **Declared conformance gaps § the reproducible run** — `110 passed / 0 failed`;
  `http-custom-header-server-validation` moved from the failing sentence to a green one naming the
  mechanism; the client paragraph now reads "Every recorded client scenario is green" with both
  rows' new counts and their cause.
- **`-32020` refresh-and-retry-once** — retitled "…could not fix the version half of it" and
  scoped to the protocol-version header, because the `Mcp-Param-*` half is a different case.
- **Re-listing and retrying once after a `Mcp-Param-*` `HeaderMismatch` — a declared SHOULD
  departure** — new, and this is the SHOULD the brief excluded from this unit. It names the
  reachable path (a server that changes annotations after the listing the transport cached), the
  reason it is not built (retrying inside the transport re-invokes somebody's tool under a table
  the caller never saw, and the transport is the wrong layer to rule that safe), what it costs, the
  consumer's obligation (call `tools()` again, then retry), and the closer (a retry policy owned by
  `MCPClient`, needing the per-request options seam the neighbouring entries name).
- **`Mcp-Param-*` / `x-mcp-header` client projection** — was "not satisfied"; now "satisfied,
  without widening the shared transport contract", and it records WHY the previous reading was
  wrong: the schema already travels through the transport in the `tools/list` result it delivers,
  so nothing has to be passed into `send`. It states that `MCPClientTransportInterface` is
  unchanged and that stdio, WebSocket, and `MessagePort` are untouched.
- **HTTP transport prose and Contract clause 12** — the `tools/list` lookup, the four refusals, the
  numeric integer comparison, the untouched unrecognized name, and the per-call dispatch cost.
- **HTTP client transport Contract clause and the browser transport section and clause** — the
  cache, the exclusion with its `error` report, the projection, and the never-listed rule.
- **Surface rows** — Core Constants (four), Core Helpers (eight), Core Types (two), HTTP transport
  Helpers (one). `npm run test:guides` proves each resolves and that no barrel export is
  undocumented.

## Scoped validation

| Command | Result |
| --- | --- |
| `npm run check` | Exit 0 — root `tsc` plus the core, browser, and server projects |
| `npx oxlint --config .oxlintrc.json --deny-warnings` on the 15 changed `.ts` files | Exit 0, no diagnostics |
| `npx oxfmt --config .oxfmtrc.json --check` on all 16 changed files | `All matched files use the correct format.` |
| `npm run test:src:core` | `Test Files 16 passed (16)`, `Tests 879 passed (879)` |
| `npm run test:src:server` | `Test Files 12 passed (12)`, `Tests 368 passed (368)` |
| `npm run test:src:browser` | `Test Files 4 passed (4)`, `Tests 64 passed (64)` |
| `npm run test:conformance` | `Test Files 1 passed (1)`, `Tests 47 passed (47)` |
| `npm run test:guides` | `Test Files 1 passed (1)`, `Tests 149 passed (149)` |
| `npm run test:policy` | `Test Files 1 passed (1)`, `Tests 93 passed (93)` |
| `npm run test:setup` | `Test Files 5 passed (5)`, `Tests 86 passed (86)` |
| `npm run test:integration` | `Test Files 1 passed (1)`, `Tests 4 passed (4)` |
| `npm run test:config` | `Test Files 1 passed (1)`, `Tests 46 passed (46)` |

`npm run build:src` ran twice — once to record the standing red and once before the post-change
conformance run — as the brief's authorized ancillary. `dist` is git-ignored
(`.gitignore:12`), so neither build changed the tree. No tree-wide `format`, `lint --fix`, or
`build` ran; the mutating `oxfmt --write` touched six files this unit owns, and `guides/mcp.md` was
confirmed formatter-clean at `HEAD` first (`git show HEAD:guides/mcp.md` → a scratch copy →
`oxfmt --check` → clean), so no incidental reflow entered the diff.

## Diffstat

```text
 guides/mcp.md                                      | 234 +++++++++++----
 src/browser/transports/HTTPClientTransport.ts      |  68 ++++-
 src/core/constants.ts                              |  36 +++
 src/core/helpers.ts                                | 266 ++++++++++++++++-
 src/core/types.ts                                  |  28 ++
 src/core/validators.ts                             |  45 +++
 src/server/handlers.ts                             |  35 ++-
 src/server/inferers.ts                             |  67 +++++
 src/server/transports/HTTPClientTransport.ts       |  66 ++++-
 tests/conformance.test.ts                          |  35 ++-
 .../browser/transports/HTTPClientTransport.test.ts | 133 +++++++++
 tests/src/core/helpers.test.ts                     | 328 +++++++++++++++++++++
 tests/src/core/validators.test.ts                  |  49 +++
 tests/src/server/handlers.test.ts                  | 177 ++++++++++-
 tests/src/server/inferers.test.ts                  |  92 +++++-
 .../server/transports/HTTPClientTransport.test.ts  | 177 +++++++++++
 16 files changed, 1733 insertions(+), 103 deletions(-)
```

## Acceptance criteria

| # | Criterion | Evidence |
| --- | --- | --- |
| 1 | Three rows green, red-then-green, totals updated, every other row unchanged | "Per-scenario movement": the standing red at 47/47, the post-change 5-failure diff naming only those rows, the rewritten baselines, and 47/47 again |
| 2 | Validator proven over the constraint list; projection proven over the conversion and encoding table including omission on absent and `null` | `buildHeaderParameters — …` carries a row per invalid form (empty name, space, colon, non-ASCII, control character, non-string annotation, object, array, null, number, untyped, same-case duplicate, different-case duplicate) and a row per unreachable position (`items`, a composition keyword, a conditional keyword, a `$defs` target, `additionalProperties`, the root itself), plus `admits an annotation nested through a chain of properties keys`. `renderHeaderValue — …` and `buildHeaderProjection — …` carry the conversion and encoding table, the omit-on-absent-or-null row, and the empty-string row |
| 3 | Exclusion proven on the HTTP faces; valid siblings survive; stdio untouched | `excludes an invalidly annotated tool …` on both faces asserts the delivered tool list, the surviving siblings, the preserved `resultType` / `cacheScope`, and the reported exclusion. Stdio: `git diff --stat` reports no change to `src/server/transports/StdioClientTransport.ts` or `StdioServerTransport.ts`, and `grep -rn 'buildHeaderProjection\|buildHeaderParameters\|MCP_PARAM_PREFIX' src/ -l` names only the two HTTP transports, the core leaves, and the two server files — no stdio, WebSocket, or `MessagePort` module reaches the projection. `npm run test:src:server` is green with those files unedited |
| 4 | Server validation proven at the wire | `createMCPPostHandler — Mcp-Param headers validated against the request body` drives the shipped POST handler over a real `MCPServer` and a real `ToolManager`: invalid padding and a non-alphabet payload each `400` + `-32020`, a decoded mismatch the same, an unrecognized `Mcp-Param-Unknown` accepted at 200, and `Mcp-Param-Count: '007'` against a body `7` accepted while `'8'` and `'  '` are refused |
| 5 | Scoped runs green; the guide's two former gap entries state the implemented truth and the declared SHOULD departure | "Scoped validation" and "The guide entries as rewritten" |

## Deviation state

No deviation stop. Every fixed ruling in the brief held: `MCPClientTransportInterface` is unchanged,
the exclusion lives on the HTTP client faces, the validator and the projection are centralized
host-independent leaves in `src/core/validators.ts` and `src/core/helpers.ts` that both faces
import, the sentinel encoding reuses `encodeSentinel` / `decodeSentinel` with no second codec, and a
`tools/call` for an unseen tool projects nothing.

Three ancillary choices recorded rather than escalated: the `error` event as the exclusion warning's
channel, `inferParameterRefusal` answering a message rather than an `MCPHeaderIssue`, and the
per-call `tools/list` dispatch in place of a cache. The last is the one worth your eye — it trades a
per-`tools/call` in-memory dispatch for a validation that cannot be bypassed by a client that never
listed, and the trade is stated in the guide rather than left implicit.

Local test fixtures were declared in `tests/src/server/handlers.test.ts` (`createAnnotatedServer`)
and `tests/src/server/inferers.test.ts` (`createHeaderRequest`) rather than in `tests/setup.ts`,
which the brief's Scope leaves off-limits. Each is used by one suite. If you want them shared,
that is a one-file successor unit owning `tests/setup.ts`.
