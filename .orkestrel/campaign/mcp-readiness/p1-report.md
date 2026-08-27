# P1 report — `prove` results carry `structuredContent`

Done. A successful `tools/call` now answers with the `Verdict` record in `structuredContent` beside
one `formatVerdict` text block, on the current revision and through the legacy projection. The
guide documents the shape and declares the departure from the serialized-JSON recommendation.

One thing the brief did not anticipate forced a design decision, recorded under "Decisions the
brief did not name": adding the field naively turns a real `tools/call` into `-32603` for most
verdicts. No deviation trigger fired.

## Touched files

| File                                  | Change                                                                                          |
| ------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `src/server/ProbeServer.ts`           | `#execute` carries the record beside the text; the server publishes its own key bound           |
| `tests/src/bin/main.test.ts`          | Two raw-wire drives of the built entry, plus the two client drives updated to the new reply     |
| `tests/src/server/ProbeServer.test.ts` | Pins the installed key bound behind the server's `limit`                                        |
| `guides/probe.md`                     | § Registering the server rewritten; § Tests rows updated                                        |

```text
 guides/probe.md                      |  62 +++---
 src/server/ProbeServer.ts            |  27 ++-
 tests/src/bin/main.test.ts           | 353 ++++++++++++++++++++++++++---------
 tests/src/server/ProbeServer.test.ts |  96 +++++++++-
 4 files changed, 427 insertions(+), 111 deletions(-)
```

## Failing first

Command: `npm run test:src:bin`

| When                          | Reading                                  |
| ----------------------------- | ---------------------------------------- |
| Baseline, before any edit     | `5 passed \| 6 skipped (11)`             |
| After the new assertions, before the fix | `4 failed \| 3 passed \| 6 skipped (13)` |
| After the fix                 | `7 passed \| 6 skipped (13)`             |

The four that ran red, each on the assertion naming the missing field:

- `carries the verdict record beside the rendered text on both eras`
- `carries a record whose control reports an issue per refused declaration`
- `answers a driven third-party client with the verdict record`
- `answers a pinned legacy client through the initialize path`

Command: `npm run test:src:server`

| When                | Reading                          |
| ------------------- | -------------------------------- |
| Baseline            | `172 passed \| 4 skipped (176)`  |
| After the fix       | `173 passed \| 4 skipped (177)`  |

`refuses a record-bearing result under the package default key bound` is the added row, and it did
**not** run red. It pins installed `@orkestrel/mcp` behaviour rather than probe's, so it passes
against the baseline source by construction. Run alone before the fix:
`npx vitest run --config vite.config.ts --no-cache --reporter=verbose --project src:server -t "refuses a record-bearing result under the package default key bound"`
→ `1 passed | 176 skipped (177)`.

## Decisions the brief did not name

### The record cannot be assigned to `structuredContent` directly

`MCPCallResult` admits the field, typed `structuredContent?: JSONValue`. `Verdict` is an
`interface`, so it gets no implicit index signature and is not assignable to `JSONRecord`. Measured
with a type probe against `configs/src/tsconfig.server.json`:

```text
error TS2322: Type 'Verdict' is not assignable to type 'JSONValue'.
  Type 'Verdict' is not assignable to type 'JSONRecord'.
    Index signature for type 'string' is missing in type 'Verdict'.
```

The fix uses `isBoundedJSON` from `@orkestrel/mcp`, the declared guard whose predicate is
`value is T & JSONValue`. No assertion, no type change in probe, no change to any off-limits file.

### The package default key bound turns most verdicts into a protocol error

`@orkestrel/mcp` 0.0.25 bounds a produced tool-call result by its **total enumerable key count**
across the whole graph as well as by its bytes, and `MCPServer.#execute` applies that bound to the
result an `execution` handler returns. `DEFAULT_MCP_LIMITS.keys` is 64.

Measured over the `Verdict` shape the guide documents (`tmp/probe/structured/*.mjs`, since removed):

| Issues in the control | Verdict keys | Verdict bounded at 64 | Whole result bounded at 64 |
| --------------------- | ------------ | --------------------- | -------------------------- |
| 0                     | 38           | yes                   | yes                        |
| 1                     | 49           | yes                   | yes                        |
| 2                     | 60           | yes                   | **no**                     |
| 3                     | 71           | **no**                | **no**                     |

Dispatched through a real `createMCPServer` + `createMCPLegacy`, a 10-issue verdict answered:

```text
{"code":-32603,"message":"Server execution returned an invalid tool result"}
```

That is the whole answer replaced, so the client loses the rendered text and its receipt as well as
the record. Shipping the field without addressing this would have introduced that regression.

Two changes close it, both in the owned source file:

1. The server publishes `limit: { keys: 4096 }`. Measured cost is 38 keys empty and 11 per issue,
   so this leaves the byte bounds binding for a verdict a real claim produces. It reaches inbound
   metadata too; that leaf's own 16 KiB byte limit is unchanged.
2. `#execute` checks the assembled result with `isBoundedJSON` and falls back to the text block
   alone when the pair still exceeds the bounds, so the receipt answers even when the record cannot
   travel.

The `4096` bound lives as a `#` field rather than a module constant: `tests/policy.test.ts` refuses
module data outside a data-kind file, and `src/core/constants.ts` is off-limits for this unit.

### Where the assertions live

`ProbeServer` exposes no output seam — `createStdioServer` writes to `process.stdout` and
`ProbeServer` passes no `output` — and adding one would edit `src/server/types.ts`, which is
off-limits. So the reply-shape assertions are driven at the wire in `tests/src/bin/main.test.ts`
against the built entry, and `tests/src/server/ProbeServer.test.ts` carries the installed-bound
proof at the same composition seam its existing transport-detach test uses.

The new raw-wire drive spawns the entry with plain pipes rather than through `/usr/bin/script`. The
pseudo-terminal is only needed for the existing claim about worker output, and that fixture is
absent on Windows, so the terminal-driven rows stay skipped on this host while the new rows run
everywhere.

### Consequence for existing rows

`@orkestrel/mcp`'s client prefers a result's `structuredContent` over its content blocks, so
`MCPCallOutcome.value` changed from the rendered string to the `Verdict` record for both client
drives. Those two tests are in an owned file and were updated with their comments.

## Guide sentences added

In § Registering the server, replacing the paragraphs that said the result carries one text block
and no `structuredContent`:

- **A successful `tools/call` answers with the `Verdict` record and its rendered text together.** —
  names both fields, states that `structuredContent` is the record `prove` returns in this process
  unchanged, and that a client preferring structured content receives the record.
- **The text block carries `formatVerdict`'s prose rather than the record's serialized JSON, which
  departs from the specification's recommendation.** — names the recommendation, gives the reason
  (the receipt's closing line stays quotable verbatim), and tells a client that wants the
  serialized JSON to serialize `structuredContent` itself.
- **The server publishes a key bound above the `@orkestrel/mcp` default, because a verdict's
  breadth is the claimant's.** — states the measurement with its date and the package version, the
  `-32603` failure the default produces, the published bound, and the text-only fallback.

The third-party-client paragraph now says the client hands back the record and that `main.test.ts`
runs the round trip on the current revision and through the legacy projection. The § Tests rows for
`ProbeServer.test.ts` and `main.test.ts` name their added proofs.

## Validation

| Command                                                                | Result                             |
| ---------------------------------------------------------------------- | ---------------------------------- |
| `npm run check`                                                        | clean                              |
| `npx oxlint --config .oxlintrc.json --deny-warnings <owned .ts files>` | clean                              |
| `npx oxfmt --config .oxfmtrc.json --check <owned files>`               | all matched files correctly formatted |
| `npm run test:src:server`                                              | `173 passed \| 4 skipped (177)`    |
| `npm run test:src:bin`                                                 | `7 passed \| 6 skipped (13)`       |
| `npm run test:guides`                                                  | `13 passed (13)`                   |
| `npm run test:policy`                                                  | `93 passed (93)`                   |

`npm run build:src:server` was run before each `test:src:bin` reading. That project drives
`dist/bin/main.js`, which loads `dist/src/server/index.js`, so the bin drive reads the previous
build until the server bundle is rebuilt. The brief said not to run `build`; the scoped
`build:src:server` was run instead of the tree-wide `build`, which would have cleaned `dist`
entirely. Without it criteria 3 and 6 are unreachable. Recorded as an ancillary decision.

`npm run test:policy` is outside the brief's named set. It was run because the source edit adds a
class field, and a policy failure there would have been a test reddening outside the owned files.

## Deviation state

None. No deviation trigger fired:

- `structuredContent` **does** survive `modernResultToLegacy` — proven by the pinned legacy client
  drive and by the legacy raw-wire call, both green.
- The installed `MCPCallResult` declaration **does** admit the field.
- No test outside the owned files reddened. `test:policy` and `test:guides` are green, and
  `test:src:server`'s pre-existing rows all still pass.

## Claims I could not close

- **The record on the wire is a canonically re-serialized copy, not the same object reference.**
  `MCPServer.#execute` runs `snapshotJSON` over the whole result, which returns a frozen owned graph
  rebuilt from canonical text with keys sorted. Content is deep-equal and the assertion
  `content === [{ type: 'text', text: formatVerdict(structuredContent) }]` proves the two wire
  fields describe the same verdict, but a reference-identity claim would be false.
- **The text-only fallback branch is not driven by a test.** Reaching it needs a verdict exceeding
  4096 keys or 4 MiB — roughly 370 issues in one stage — which no cheap real claim produces. The
  branch is a guard on the invariant that the receipt always answers, and the bound it guards is
  proven from both sides in `ProbeServer.test.ts`.
- **`MCPLimitOptions.keys` is documented as a metadata bound and implemented as a content bound
  too.** Its declaration reads "Maximum total enumerable keys accepted across one `_meta` value",
  while `MCPServer.#execute` and `#normalize` pass the same leaf as the content bound. That is an
  `@orkestrel/mcp` documentation defect, outside this unit and not mine to fix. Worth routing.
- **The pseudo-terminal rows stay skipped on this host.** `answers both protocol eras without
  exposing worker output on stdout` and `preserves worker diagnostics on stderr` need
  `/usr/bin/script`, which Git Bash on Windows does not ship. They use `objectContaining`, so they
  stay green with the added field, but they were not observed carrying it. The new raw-wire drive
  covers the same eras without a terminal.
