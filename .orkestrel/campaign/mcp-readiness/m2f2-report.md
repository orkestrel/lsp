# M2F2 report — generation-guarded listing cache (A-M23F claim 4)

Done, no deviation. Both HTTP client faces now cache only what the current listing lineage
delivered, pinned red-then-green on each face. The carried findings landed with it.

## Touched files

| File                                                    | Change                                                                          |
| ------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `src/server/transports/HTTPClientTransport.ts`          | `#generation` counter, `#stamps` WeakMap, `#stamp` at send time, guarded `#select` |
| `src/browser/transports/HTTPClientTransport.ts`         | The identical change on the browser face                                        |
| `tests/src/server/transports/HTTPClientTransport.test.ts` | The out-of-order pin, the delivered-message tripwire, the overlapping companion  |
| `tests/src/browser/transports/HTTPClientTransport.test.ts` | The same rows plus the `FIRST_PAGE` / `SECOND_PAGE` fixtures the face lacked     |
| `guides/mcp.md`                                         | The concurrent rule in the client-projection entry and each face's API clause    |
| `src/core/constants.ts`                                 | Carried finding: the `DEFAULT_MCP_LIMITS` TSDoc `keys` patch                     |
| `tests/src/core/MCPLegacy.test.ts`                      | Carried finding: the `server/discover` row on the decorator's `default` arm      |

Diffstat: 7 files changed, 487 insertions(+), 13 deletions(-).

## The fix as landed

`send` calls `#stamp(message)` before opening its `fetch`. `#stamp` returns for anything but a
modern `tools/list`; a cursorless listing increments `#generation` first, and every modern
`tools/list` is stamped in `#stamps` (a `WeakMap` keyed by the sent message object, which
`#exchange` hands `#select` unchanged).

`#select` reads `const current = this.#stamps.get(sent) === this.#generation` and applies it to the
cache mutations alone:

```ts
const current = this.#stamps.get(sent) === this.#generation
if (current && sent.params?.['cursor'] === undefined) this.#parameters.clear()
// ...
if (current) this.#parameters.set(tool['name'], parameters)
```

The delivered message is untouched by the guard: the exclusion loop, the `error` emission, and the
returned `{ ...message, result: { ...result, tools: kept } }` run exactly as before for a
superseded listing.

## Failing-first records

Baseline before any edit: `npm run test:src:server` 378 passed (378); `npm run test:src:browser`
66 passed (66).

| Face    | Command                      | Red                             | Green                |
| ------- | ---------------------------- | ------------------------------- | -------------------- |
| Node    | `npm run test:src:server`    | 1 failed \| 379 passed (380)    | 381 passed (381)     |
| Browser | `npm run test:src:browser`   | 1 failed \| 67 passed (68)      | 69 passed (69)       |

Both red runs failed on the same row, `HTTPClientTransport — the x-mcp-header contract > caches
nothing from a listing a fresh one superseded before its answer arrived`, with the same assertion:

```
AssertionError: expected '3' to be null
expect(called.get('mcp-param-priority')).toBeNull()
```

`'3'` is the `Mcp-Param-Priority` the superseded continuation's `paged_two` projected onto a
`tools/call` the fresh listing never advertised — the union table. The green counts are 381 and 69
rather than 380 and 68 because the delivered-message tripwire landed after the red run.

The companion row `keeps both pages projectable when a fresh listing and its own continuation
overlap` was green in the red run and the green run on each face, so the guard did not cost the
well-ordered overlapping case.

The delivered-message tripwire `excludes and reports an invalid definition on a superseded listing
it caches nothing from` is an addition, not a failing-first fix: it pins acceptance criterion 2 —
the superseded page still arrives with its invalid definition dropped and the exclusion still on
`error`, while projecting nothing — and it is green before and after the fix. An early-return guard
in `#select` would redden it.

The carried `MCPLegacy` row `modern-method-not-found` is a tripwire too, green from the start:

```
npx vitest run --project src:core tests/src/core/MCPLegacy.test.ts -t "modern-method-not-found"
Tests  1 passed | 45 skipped (46)
```

It is distinct from the existing `forwards a modern consumer method through the decorator`, which
proves a consumer-registered method IS forwarded; this row proves a built-in modern method reaches
the `default` arm instead.

## Guide and TSDoc sentences as landed

Client-projection entry, appended to the replace-versus-accumulate paragraph:

> Arrival order cannot merge two listings into one table: a listing another cursorless `tools/list`
> supersedes before its answer arrives is still delivered to the caller, exclusions and all, and
> caches nothing.

Node HTTP client API clause, extending the existing sentence:

> A `tools/list` sent with no `cursor` REPLACES that table with its own page; one sent with a
> `cursor` accumulates onto it, and a listing another cursorless `tools/list` supersedes before its
> answer arrives is delivered to the caller but never cached.

Browser HTTP client API clause, inserted into the same contract list:

> ... accumulate onto it on one sent with a `cursor`, deliver but never cache a listing another
> cursorless `tools/list` supersedes before its answer arrives, drop each invalidly annotated
> definition and report it on `error` ...

The comment block over `#select`, identical on both faces, gains:

> Arrival order decides nothing, because the SEND's own lineage stamp does. A listing another
> cursorless `tools/list` superseded before its answer arrived is DELIVERED whole — the exclusion
> and its `error` still apply — and caches nothing, so the table describes the latest fresh listing
> and its own continuations however overlapping answers interleave. A caller working from a
> superseded page projects nothing for its tools, which is the safe direction: the server's own
> bounded lookup stays the validation authority.

## Scoped run table

| Command                                             | Result                        |
| --------------------------------------------------- | ----------------------------- |
| `npm run check`                                     | exit 0, no diagnostics        |
| oxlint `--deny-warnings`, the owned files            | exit 0                        |
| oxfmt `--check`, the owned files plus `guides/mcp.md` | exit 0, all files formatted   |
| `npm run test:src:core`                             | 880 passed (880)              |
| `npm run test:src:server`                           | 381 passed (381)              |
| `npm run test:src:browser`                          | 69 passed (69)                |
| `npm run test:guides`                               | 149 passed (149)              |
| `npm run test:policy`                               | 93 passed (93)                |
| `npm run build:src`                                 | exit 0                        |
| `npm run test:conformance`                          | 47 passed (47), no row moved  |

`npm run test:policy` is outside the brief's list; it is read-only and it is the sweep that judges
the placement law over the `src` files this unit edited, so it ran.

`git status --porcelain` names exactly the owned files and nothing else. Nothing was committed.

## Ancillary decisions

- **The stamp container is a `WeakMap` keyed by the sent message object.** `#exchange` hands
  `#select` that same object, so no correlation id is needed and a message the caller drops takes
  its stamp with it. No public type moved; `MCPClientTransportInterface` is unchanged.
- **The counter is `#generation` and the map is `#stamps`.** Both single words; the prose calls the
  thing they track a listing lineage.
- **The pins script arrival order inline rather than through a shared helper.** `tests/setup.ts` is
  off-limits, and a per-face helper would duplicate across the faces; each row instead holds its
  reply with `new Promise<Response>((resolve) => { release = resolve })` — an anonymous callback
  passed directly as an argument, capturing the resolver rather than declaring a nested function.
- **The new rows sit at the end of each face's `x-mcp-header contract` block**, beside the
  sequential replace-and-accumulate rows they extend.
- **The carried `constants.ts` patch landed with its wording exactly as the brief prescribed**, then
  the paragraph was rewrapped so the line fill matches its neighbours. No word changed. The same
  rewrap was applied to the one guide line the insertion left long.

## Observations, not criteria

- A caller that sends the SAME message object twice has its later send overwrite the earlier stamp,
  so both answers are judged against the later listing. `MCPClient.tools()` builds a fresh object
  per call, so no shipped path reaches this.
- `close()` and `start()` leave `#generation` and `#parameters` standing, matching the existing
  contract where only `#protocol` is cleared.
