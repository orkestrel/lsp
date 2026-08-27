# M2F — fix round for the A-M2 broken claims

All three fixes landed. Both defects ran red before the fix and green after, on the same
commands. No conformance row moved. No test outside the owned files reddened.

Baseline: mcp `main` at `28f524c`, clean before editing. Nothing committed.

## Touched files

| File                                                     | Change                                                                             |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `src/server/transports/HTTPClientTransport.ts`           | `#select` clears `#parameters` when the sent `tools/list` carried no `cursor`      |
| `src/browser/transports/HTTPClientTransport.ts`          | The identical clear on the browser twin                                            |
| `src/server/handlers.ts`                                 | The synthetic `tools/list` lookup walks `nextCursor`, bounded by `MCP_LOOKUP_PAGES` |
| `src/core/constants.ts`                                  | New `MCP_LOOKUP_PAGES` bound with its reason                                       |
| `src/core/types.ts`                                      | `MCPServerEventMap.request` TSDoc names the synthetic listing and its id `0`       |
| `tests/src/server/transports/HTTPClientTransport.test.ts` | Stale-listing and continuation interleavings; `ttlMs` / `nextCursor` preservation  |
| `tests/src/browser/transports/HTTPClientTransport.test.ts` | Stale-listing interleaving; `ttlMs` / `nextCursor` preservation                   |
| `tests/src/server/handlers.test.ts`                      | Paged replacement listing: escape refused, match admitted, cap-hit forwarded       |
| `guides/mcp.md`                                          | Constants row, the residual bound, the observation seam, the cache-replacement rows |

Diffstat: 9 files changed, 442 insertions(+), 33 deletions(-).

## Failing-first records

### Fix 1 — the client cache tracks what the caller was last told

Command, both faces, run against `28f524c` plus the tests and the inert constant alone:

```text
npx vitest run --config vite.config.ts --no-cache --reporter=dot --project src:server \
  tests/src/server/handlers.test.ts tests/src/server/transports/HTTPClientTransport.test.ts
npx vitest run --config vite.config.ts --no-cache --reporter=dot --project src:browser \
  tests/src/browser/transports/HTTPClientTransport.test.ts
```

Red, Node face: `Tests 2 failed | 78 passed (80)`. Red, browser face:
`Tests 1 failed | 7 passed (8)`.

The failing test on each face is
`HTTPClientTransport — the x-mcp-header contract > projects nothing for a tool a later cursorless listing no longer carries`,
failing `expected 'us-west1' to be null` at the `mcp-param-region` assertion. It runs the
auditor's exact interleaving: list `gone` with an `x-mcp-header: 'Region'` annotation, re-list
with `tools: []` and no `cursor`, then `tools/call` `gone` with `{ region: 'us-west1' }`.

Green after the fix: `Tests 80 passed (80)` and `Tests 8 passed (8)`.

The continuation half is pinned beside it on the Node face,
`keeps the earlier page projectable when the next listing continues a cursor`: page one hands
back `nextCursor: 'page-2'`, the second listing is sent with `cursor: 'page-2'`, and both
`paged_one` and `paged_two` still project. It passed before and after, which is what it exists
to hold: the clear must not reach a continuation.

Preservation assertions extended on both faces. `ANNOTATED_TOOLS` gained
`nextCursor: 'page-2'`, and the exclusion test now asserts `ttlMs` is `0` and `nextCursor` is
`'page-2'` alongside the existing `resultType` and `cacheScope`. Those close the claim-3 test
gaps; the rebuild already preserved both, so they did not run red.

### Fix 2 — the server lookup walks the pages, bounded

Same command as the Node-face run. The failing test is
`createMCPPostHandler — Mcp-Param headers validated against the request body > refuses a forged header for a tool a replacement listing pages onto page two`,
failing `expected 200 to be 400`. It drives the documented replacement seam: a real
`MCPServer` whose registry holds the annotated `route` tool, with `methods.add('tools/list', …)`
replaced by a handler paging one definition per page and placing `route` on page two. The
`tools/call` carries a forged `Mcp-Param-value: 'client-supplied-value'` against a body value
of `'Hello'`. Before the fix the lookup read page one, recognized no `value` parameter, and
forwarded the forgery to a successful call.

Green after the fix: `Tests 80 passed (80)`, and the response is
`400` + `{ code: -32020, message: "Mcp-Param-value header does not match the request body value at 'value'." }`.

Two tests sit beside it and passed throughout, holding the edges the walk must not move:

- `admits a matching header for a tool a replacement listing pages onto page two` — the walk
  finds the definition and validates positively rather than refusing everything it reaches.
- `forwards a header unrecognized for a tool paged past the walk bound` — `createPagedServer(MCP_LOOKUP_PAGES)`
  puts `route` one page beyond the last page walked, and the forged header is forwarded
  untouched with a `200`. This is the residual limit stated as a test.

The built-in unpaged full-registry answer is unchanged: `MCPServer.#list` reads no `cursor` and
writes no `nextCursor`, so the walk breaks after one page against it. The whole `src:server`
project is green, including every pre-existing `Mcp-Param-*` row.

### Fix 3 — the synthetic dispatch is documented

A documentation ruling, so no failing-first proof. `npm run test:guides` is green at
`149 passed (149)`, which covers the parity obligation the new `MCP_LOOKUP_PAGES` export
carries.

## The bound chosen, and why

`MCP_LOOKUP_PAGES = 8`, exported from `src/core/constants.ts`.

The reason recorded in its TSDoc and in the guide: the walk's cost is paid per `tools/call`,
one in-memory dispatch per page. At a page size of 100 the bound reaches 800 definitions,
which covers a replacement listing paging at any ordinary size; a consumer paging more finely
than that pays the extra dispatches on every call it serves. The built-in listing answers the
whole registry on one page and never reaches the second, so the bound binds a replacement
handler alone.

A cap hit keeps today's behaviour rather than inventing a new refusal: the definition reads as
unfound, so its `Mcp-Param-*` headers are forwarded untouched — the same answer a name no
served definition annotates receives. A refusal at the cap would reject calls a consumer's own
deep paging caused, which is a policy decision the handler has no standing to take.

## The guide sentences as landed

Constants table, after the `MCP_HEADER_ANNOTATION` row:

> `MCP_LOOKUP_PAGES` | const | `8` — the `tools/list` pages one modern `tools/call` walks to reach its own annotations.

HTTP transport section, after the `Mcp-Param-*` validation paragraph:

> That dispatch follows `nextCursor` until it reaches the named tool or the answer carries no
> cursor, bounded by `MCP_LOOKUP_PAGES` pages. The built-in `tools/list` answers the whole
> registry on one page and never reaches the second, so the bound binds a consumer that
> replaced `tools/list` with a paging handler. **The residual limit:** a definition further in
> than that bound reads as no definition, so its `Mcp-Param-*` headers are forwarded
> untouched — the answer an unannotated name receives, which is also the answer a client
> forging them for such a tool receives. Page a replacement listing coarsely enough to keep
> every annotated tool inside the bound. The cost is one in-memory `tools/list` dispatch per
> page walked, per `tools/call`; a consumer whose replacement is expensive or held-open pays
> for it there.
>
> Each of those dispatches is observable. The synthetic `tools/list` fires the server's
> `request` event with the reserved id `0` ahead of the `tools/call`'s own, so an observer
> accounting for inbound traffic subtracts a `('tools/list', 0, 'modern')` that precedes a
> `tools/call`. The id is reserved by convention rather than enforced: a peer sending its own
> `tools/list` under id `0` is not told apart on that event.

The sentence the walk replaced read "The cost is one extra in-memory `tools/list` dispatch per
`tools/call`", which the walk makes false; the held-open clause it carried is kept.

Server POST handler API clause:

> The lookup follows `nextCursor` through at most `MCP_LOOKUP_PAGES` pages, so a replacement
> `tools/list` that pages the named tool further in than that recognizes none either; each page
> dispatched fires the `request` event under the reserved id `0`.

Consumer obligation, in the declared SHOULD departure:

> **The consumer's obligation:** call `tools()` again and retry the call. That listing carries
> no `cursor`, so the transport REPLACES its table with it: the next call projects the current
> headers for a tool the listing still advertises, and projects nothing for one it no longer
> advertises.

That is the claim-7 correction. The old text said "the transport re-caches from that listing",
which was true only for a tool the new listing still carries.

Client projection entry:

> The SENT request decides whether a delivered page joins that table or replaces it: a
> `tools/list` carrying no `cursor` is a fresh listing and CLEARS the table before caching its
> page, while a continuation carrying the cursor the previous page handed back accumulates onto
> it. So a tool a fresh listing omits stops projecting, and a tool on an earlier page of one
> paged listing keeps projecting.

The Node and browser client-transport API clauses each gained the same replace-versus-accumulate
sentence, so neither face's clause describes a cache the other does not have.

`MCPServerEventMap.request` TSDoc gained the parallel paragraph naming the synthetic listing,
its reserved id `0`, one event per page walked up to `MCP_LOOKUP_PAGES`, and the honest limit
that a peer using id `0` is not told apart there.

## Scoped run results

| Command                              | Result                                    |
| ------------------------------------- | ------------------------------------------- |
| `npm run check`                       | green, all four projects                  |
| `oxlint --deny-warnings` (9 owned files) | green, no diagnostics                  |
| `oxfmt --check` (9 owned files)       | `All matched files use the correct format` |
| `npm run test:src:core`               | `879 passed (879)`, 16 files              |
| `npm run test:src:server`             | `375 passed (375)`, 12 files              |
| `npm run test:src:browser`            | `65 passed (65)`, 4 files                 |
| `npm run test:guides`                 | `149 passed (149)`                        |
| `npm run build:src`                   | green (authorized ancillary)              |
| `npm run test:conformance`            | `47 passed (47)`                          |
| `npm run test:policy`                 | `93 passed (93)`                          |
| `npm run test:integration`            | `4 passed (4)`                            |

Conformance is unchanged. `tests/conformance.test.ts` was not edited: its
`reports the recorded total` case still asserts `[110, 0]` and passes, the recorded server
scenario baseline matches, and the client rows are green. `test:policy` and `test:integration`
are outside the brief's list; both were run read-only to confirm no test outside the owned files
reddened.

`git status --porcelain` names exactly the nine owned files. `tmp/worktrees/` was not touched.

## Ancillary decisions

- **Where the clear fires.** `#select` clears only after it has established a well-formed
  listing result — past the non-`tools/list` return, the error-response return, and the
  missing-`tools`-array return. A refused or malformed listing supersedes nothing, so it leaves
  the table alone. A fresh listing that returns an empty `tools` array does clear, which is the
  auditor's case.
- **What counts as a continuation.** `sent.params?.['cursor'] === undefined` decides. An absent
  `params` and an explicit `cursor: undefined` both read as fresh.
- **No new exported helper for the walk.** The `nextCursor` read is inline in
  `createMCPPostHandler` rather than a new `src/server/helpers.ts` export, because the brief
  scoped neither that file nor the barrel and a new export would owe its own guide row.
  `MCP_LOOKUP_PAGES` is the one new export, and it is the one the brief prescribed.
- **Two annotated locals in the walk.** `const listing: unknown` and `const next: unknown` carry
  explicit annotations. Inferred, they make `answer` and `cursor` mutually circular and `tsc`
  reports `TS7022: 'answer' implicitly has type 'any'`. The reason is recorded in a comment
  beside them so the annotations are not later "simplified" back into the error.
- **`callTool` extracted in the handler test.** The existing `callAnnotated` now delegates to it
  so a test can supply its own server. `ROUTE_SCHEMA` was hoisted so the registry tool and the
  paged listing advertise one schema rather than two copies that could drift.
- **Both faces pinned.** The brief required the stale interleaving on at least one face; it is on
  both, because both faces received the fix. The continuation half is on the Node face alone,
  where the paging fixtures live.

## Deviation state

None. No conformance row moved, no test outside the owned files reddened, and no conflict with
the brief's objective arose.
