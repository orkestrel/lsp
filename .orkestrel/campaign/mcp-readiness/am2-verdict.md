This is a source review. Nothing was executed. Writer-produced run counts are testimony only.

## 1. Markers — `CONFIRMED`

Attack that failed: treat `=?base64?=` as a sentinel (prefix `startsWith` and suffix `endsWith` both match, markers overlap). `decodeSentinel` requires `field.length >= MCP_SENTINEL_PREFIX.length + MCP_SENTINEL_SUFFIX.length` (`src/core/helpers.ts:1232-1236`); that value is length 10 against bound 11, so it stays literal. Empty payload `${PREFIX}${SUFFIX}` (`=?base64??=`) is a real sentinel and decodes to `''`.

`MCP_SENTINEL_PREFIX` / `MCP_SENTINEL_SUFFIX` are the one spelling (`src/core/constants.ts:83-86`). `encodeSentinel` builds from them (`src/core/helpers.ts:1278`); `decodeSentinel` recognizes by them. Encode membership is the unchanged line in `m2.diff`: `/^[ -~]*$/.test(value) && decodeSentinel(value) === value`.

## 2. `buildHeaderParameters` reachability — `CONFIRMED`

Attacks that failed:

- **Property named `items` or `oneOf`:** `extractHeaderAnnotations` walks `schema['properties']` by `Object.entries` key position (`src/core/helpers.ts:1368-1374`), never by keyword name. A leaf at `properties.items` / `properties.oneOf` with a legal annotation is admitted. An annotation under the `items` / `oneOf` *keyword* is not extracted; `countHeaderAnnotations` still counts it (`src/core/helpers.ts:1304-1323`), lengths disagree, definition refused.
- **Root annotation:** `path.length === 0` returns `undefined` (`src/core/helpers.ts:1363`).
- **`patternProperties`:** extract does not walk it; count does. An annotation there refuses the definition. A legal `properties` annotation plus `patternProperties` with no annotation keeps the counts equal.
- **Cycle:** extract has no ancestor set; `path.length > DEFAULT_MCP_LIMITS.depth` (32) returns `undefined` (`src/core/helpers.ts:1358`). Count terminates with a `Set`. JSON on the wire cannot be cyclic; the walk does not hang.
- **Depth at the bound:** the test is `>`; `path.length === 32` is admitted, `33` is refused.

Constraint list (token, primitive, case-insensitive uniqueness, properties-only reachability) is the `undefined` path in `buildHeaderParameters` (`src/core/helpers.ts:1406-1416`) plus `isFieldToken` / `isMCPHeaderPrimitive`.

## 3. Client cache across listings — `BROKEN`

Pagination accumulate holds: `#select` never clears `#parameters`; it only `set`s (`src/server/transports/HTTPClientTransport.ts:286` and the browser twin at `src/browser/transports/HTTPClientTransport.ts:283`). A page carrying `nextCursor` then a second page would keep page-one projections.

Rebuild preservation holds: `{ ...message, result: { ...result, tools: kept } }` (`src/server/transports/HTTPClientTransport.ts:289`) keeps `resultType`, `ttlMs`, `cacheScope`, and `nextCursor`. The Node exclusion test asserts `resultType` and `cacheScope` only (`tests/src/server/transports/HTTPClientTransport.test.ts:638-639`); `ttlMs` is in the fixture and unasserted; `nextCursor` is absent from the fixture. Those are test gaps, not a rebuild bug.

**Failing interleaving (replace vs accumulate):**

1. `tools/list` with no `cursor`, result `tools: [{ name: 'gone', inputSchema: { type: 'object', properties: { region: { type: 'string', 'x-mcp-header': 'Region' } } } }]`.
2. `tools/list` with no `cursor`, result `tools: []` (or any page that omits `gone`).
3. `tools/call` `{ name: 'gone', arguments: { region: 'us-west1' } }`.

Observed from the code: step 3 still projects `Mcp-Param-Region`. The transport's own comment says the table is “the one the caller was told about and nothing else” (`src/server/transports/HTTPClientTransport.ts:92-94`). After step 2 the caller was not told about `gone`. `#select` does not read `sent.params.cursor`, so a fresh listing and a continuation are the same accumulate.

**Smallest fix:** if the sent `tools/list` has no `cursor`, clear `#parameters` before adding this page; if it has a cursor, accumulate. Same change on both HTTP faces.

## 4. Server lookup — `BROKEN`

Forgery case holds: every modern `tools/call` dispatches a fresh `tools/list` (`src/server/handlers.ts:137-149`), so a client that never listed is still validated.

Held-open holds: `Symbol.asyncIterator in answer` then `answer.stop()` (`src/server/handlers.ts:148`); `MCPStreamController` implements both (`src/core/MCPStreamController.ts:143-170`). Parameters stay `[]`, so nothing is recognized.

Refusals do not echo the supplied header value: `inferParameterRefusal` names the field and body path only (`src/server/inferers.ts:214-229`); the handler test asserts `test.message` does not contain `client-supplied-value` (`tests/src/server/handlers.test.ts:1144`).

**Failing input — pagination:** the synthetic dispatch sends no `cursor` and does not follow `nextCursor` (`src/server/handlers.ts:139-146`). `extractToolSchema` scans that one result (`src/core/helpers.ts:1505-1517`). A tool absent from that page yields `buildHeaderParameters(undefined) ?? []`, so its `Mcp-Param-*` headers are unrecognized and forwarded.

Built-in page size: there is none. `MCPServer.#list` returns `buildToolDescriptors(this.#options.tools)` with no cursor read and no `nextCursor` (`src/core/MCPServer.ts:442-449`). Against the shipped list, every registry tool is on the one page the lookup reads. The escape fires through the documented replacement seam: `methods.add('tools/list', …)` (`guides/mcp.md:408-409`) with page size 1, tool `B` on page 2, `tools/call` for `B` carrying forged `Mcp-Param-*`.

**Smallest fix:** walk `nextCursor` until absent (or document that a replacement `tools/list` must return the named tool on the first page). Bound: do not change the built-in list's unpaged full-registry answer.

**Failing input — id `0`:** `mcp.dispatch({ id: 0, method: 'tools/list', … })` runs `MCPServer.#dispatch`, which emits `request` with that id (`src/core/MCPServer.ts:227`; `MCPServerEventMap.request` is `[method, id, era]` at `src/core/types.ts:1926`). A listener on `server.emitter` sees `('tools/list', 0, 'modern')` for every modern `tools/call`. The HTTP JSON-RPC response still uses the call's id (`src/server/handlers.ts:152`). The id leaves the handler onto the published observation seam.

**Smallest fix:** the dispatcher has no silent door. Document the synthetic `tools/list` on `request`, or give `MCPDispatcherInterface` a lookup that does not emit. Do not drop the dispatch: that is the forgery-case door.

## 5. Exclusion — `CONFIRMED`

Attack that failed: drop a valid sibling, a non-record entry, or a nameless entry, or settle a pending request via `error`.

`#select` keeps `!isRecord(tool) || !isString(tool['name'])` (`src/server/transports/HTTPClientTransport.ts:272-274`), drops only `parameters === undefined`, keeps valid siblings, emits `error` with the tool name (`src/server/transports/HTTPClientTransport.ts:277-284`). `MCPClient` subscribes to `message` and `close` only (`src/core/MCPClient.ts:246-247`); `#receive` correlates by id. Node test: `valid_tool` and `plain_tool` survive, `invalid_space_in_name` is named on `error` (`tests/src/server/transports/HTTPClientTransport.test.ts:633-641`). Browser twin drops `invalid_duplicate_diff_case` and keeps `valid_tool` (`tests/src/browser/transports/HTTPClientTransport.test.ts:214-217`).

## 6. Scope honesty — `CONFIRMED`

Attack that failed: a seventeenth file, a banned construct in the implementation files, or a derived red list that still names a population.

Supplied `m2.diff` / report diffstat names exactly those sixteen paths. Projection/validation symbols live in the HTTP faces, `src/core/helpers.ts` / `constants.ts` / `validators.ts` / `types.ts`, `src/server/handlers.ts`, and `src/server/inferers.ts`. Implementation greps on those files did not show `any`, non-null assertions, `@ts-ignore` / `@ts-nocheck` / `@ts-expect-error`, or `eslint-disable`. `EXPECTED_CLIENT_RED` / the server counterpart are `.filter((outcome) => outcome.failed > 0)` (`tests/conformance.test.ts:166-168`); every recorded `failed` is 0, so the derived lists are empty. Comments describe the mechanism that closed the row, not the current failed set (`tests/conformance.test.ts:149-160`).

## 7. Guide vs shipped code — `CONFIRMED`

Attack that failed: the SHOULD departure or the retitled `-32020` entry describing behavior the code does not have.

- Re-list-and-retry is absent from both HTTP client transports; the gap entry states it (`guides/mcp.md:4329-4343`).
- `-32020` refresh-and-retry is scoped to the protocol-version header (`guides/mcp.md:4312-4327`).
- Server four refusals, numeric integer compare, unrecognized name forwarded, per-call `tools/list`, held-open released (`guides/mcp.md:2519-2530`) match `handlers.ts` / `inferers.ts`.
- Client cache, exclusion on `error`, never-listed projects nothing (`guides/mcp.md:4345-4358`, `5196-5199`) match `#parameters.get(name) ?? []` and `#select`.
- “Not built” row is withholding on the *server* (`guides/mcp.md:4116`); the server still serves an invalid definition and recognizes no names from it (`src/server/handlers.ts:149` `?? []`).

The consumer-obligation sentence “re-caches from that listing” is true for a tool that still appears (Map `set` overwrites). It is the same accumulate hole as claim 3 for a tool the new listing omits.

## 8. Writer sound-and-unchanged verdicts — `CONFIRMED`

Attacked three:

1. **Grep `buildHeaderProjection|buildHeaderParameters|MCP_PARAM_PREFIX` under `src/`.** Hits: the two HTTP client transports, `src/server/handlers.ts`, `src/server/inferers.ts`, `src/core/helpers.ts`, `src/core/constants.ts`, plus comments in `src/core/validators.ts` and `src/core/types.ts`. No stdio / WebSocket / MessagePort module.
2. **Grep `x-mcp-header` / `Mcp-Param-` / `buildHeader` / `#parameters` / `#select` in those transport modules.** No matches.
3. **`tests/conformanceClient.ts` needed no change because exclusion changes what it calls.** Attack: `scripted ?? tools.map(...)` (`tests/conformanceClient.ts:200-203`) — a runner-supplied `toolCalls` list would bypass the listing. That arm is opt-in via `MCP_CONFORMANCE_CONTEXT` this file does not set. The default arm calls `client.tools()`, which is the already-filtered `#select` result (`src/core/MCPClient.ts:390-401`). Exclusion changes that array without editing the driver. The file's own comment states that (`tests/conformanceClient.ts:20-23`).

VERDICT: FAIL — 2 broken, 0 unresolved, 0 not-evidenced, 0 findings outside the claims
