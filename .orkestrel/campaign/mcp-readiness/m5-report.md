# M5 report — queue-on-close fix, lifetime-row promotion, guide honesty, peer alignment

Every fix and ruling in the brief landed. No deviation stopped the unit. Baseline: mcp `main` at
`854a621`, clean at start; nothing committed. Every command below ran in
`C:\Users\mikes\WebstormProjects\mcp` on 2026-08-27.

## Touched files

| File                                                        | Change                                                                                             |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `src/browser/transports/WebSocketClientTransport.ts`        | `close()` and `#onClose()` clear `#queue`; the class TSDoc's queue and close remarks state the discard |
| `tests/src/browser/transports/WebSocketClientTransport.test.ts` | Added the failing-first row for the discard, with its post-reconnect delivery control          |
| `tests/src/server/factories.test.ts`                        | Promoted the three M4 `StdioServerInterface` lifetime rows                                         |
| `guides/mcp.md`                                             | Every honesty row; the browser WebSocket clauses; the gap sweep's rewordings                       |
| `src/core/types.ts`                                         | TSDoc on `MCPLimitOptions.keys` and on `MCPServerOptions.execution`                                |
| `package.json`                                              | Peer `@orkestrel/server` `^0.0.14` → `^0.0.15`                                                     |

```text
 guides/mcp.md                                      | 158 ++++++++++++++++-----
 package.json                                       |   2 +-
 src/browser/transports/WebSocketClientTransport.ts |  15 +-
 src/core/types.ts                                  |  10 +-
 .../transports/WebSocketClientTransport.test.ts    |  19 +++
 tests/src/server/factories.test.ts                 |  66 +++++++++
 6 files changed, 233 insertions(+), 37 deletions(-)
```

`git status --porcelain` reports those six files as modified and nothing else. `dist/` is
git-ignored (`.gitignore:12`), so the authorized `build:src` left no tracked change.

## Fix 1 — the pre-open queue is discarded at close

Failing-first, both runs `npm run test:src:browser`:

| Stage           | Result                       | Reading                                                              |
| ---------------- | ---------------------------- | -------------------------------------------------------------------- |
| Baseline, no row | `65 passed (65)`             | The shipped browser rows before the new one                          |
| Red              | `1 failed \| 65 passed (66)` | `AssertionError: expected [ 77, 78 ] to deeply equal [ 78 ]`         |
| Green            | `66 passed (66)`             | Every shipped row still green, the A3 row included                   |

The red state is exactly what M3F measured: id 77, queued before `start()`, survives `close()`
and is delivered on the socket the next `start()` opens.

Failing test name: `drops a queued send at close so it never rides the next connection`
(`tests/src/browser/transports/WebSocketClientTransport.test.ts`, in the
`WebSocketClientTransport — a send the channel cannot carry rejects` block). Its control sends
id 78 after the reconnect and reads the reply back, so the delivery path is alive and the
absence of 77 is a fact about the queue.

The fix clears `#queue` in `close()` and in `#onClose()`. Assigning a fresh array is the whole
change; `#flush` already splices what it writes.

## Fix 2 — the promoted `StdioServerInterface` lifetime rows

Recreated in `tests/src/server/factories.test.ts` from the M4 report's record, in the
`createStdioServer — pipes stdio through the core bindServer port` block:

| Row                                                                          | Proves                                                                     |
| ----------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `arms the pump once however many times start() is called`                    | Three `start()` calls, one inbound request, exactly one reply line          |
| `arms nothing on a start() after stop(), so serving again takes a fresh handle` | A request written after `stop(); start()` draws no line                   |
| `subscribes to input on start() and releases it on stop(), each synchronously` | `input.listenerCount('data')` reads `[0, 1, 0]` across construction, `start()`, `stop()` |

`npm run test:src:server`: `378 passed (378)`, up from the 375 the M2F commit records. The
shipped repeated-`stop()` row (`stop() returns synchronously and releases only the
factory-owned input listeners`) is untouched and not duplicated.

These are promotions of rows M4 measured, not a defect fix, so no red was taken. Each asserts an
exact value rather than a bound: a transport that re-armed would write a second line, and a
subscription deferred a tick would read `[0, 0, 0]`.

## Fix 3 — the honesty rows, as landed

### The browser WebSocket clauses fix 1 made stale

Added after the `**The browser face queues a pre-open `send` and rejects a closed one.**`
paragraph (`### Browser transport`):

> **A queue rides one connection.** `close()` discards whatever is still queued, and so does the
> native `close` event, so a frame the caller handed a connection that then ended is dropped
> rather than written onto the socket a later `start()` opens. A caller that closes a transport
> with a pre-open `send` outstanding therefore delivers nothing at all: the `send` already
> resolved, because queuing is what it resolved on, and the message it queued goes with the
> connection it was queued for. Re-send anything that must survive a reconnect.

Three further sentences the change made stale, corrected in place:

- The `WebSocketClientTransport` Entities row now reads `queues sends until `open`, flushed in
  order and discarded at close; a closed-channel send rejects.`
- Contract clause 21 gained `a queue rides ONE connection, so `close()` and the native `close`
  event each DISCARD what is still in it rather than flushing it onto the socket a later
  `start()` opens`.
- The `## Methods` release-per-carrier paragraph now reads `the browser one also discards its
  pre-open queue, so nothing queued against the ended connection rides the next one`.

The M3F clauses re-read for staleness: the Node-face clauses 16 and 17 are unaffected (the Node
face queues nothing), and the shipped browser-paragraph sentence about the pre-open queue still
flushing on open stays true.

### The `MCPLegacy` legacy-method-set consequence

Added after `Every other method is refused with `-32601` at the door.`:

> **That fixed set is the whole legacy era, so the modern-only surfaces do not exist for a legacy
> client.** `server/discover` and `subscriptions/listen` are 2026-07-28 methods with no legacy
> spelling, so a legacy-era client naming either gets `-32601` at the decorator's door — the same
> refusal every other unlisted method earns there. The multi-round input mechanism is refused one
> step further in — a legacy `tools/call` carrying `requestState` or `inputResponses` gets
> `-32602`, because those parameters belong to a round the dated protocol could not have produced
> — and a modern result the dated revision has no shape for is projected as `-32000`. So a legacy
> client discovers the server through `initialize`, lists and calls tools, and has no path to
> modern discovery, subscriptions, or an input round at all. The way to reach one is to speak
> modern: the decorator passes a modern-shaped invocation through untouched, so composing the
> layer costs a modern client nothing.

Evidence: `src/core/MCPLegacy.ts:128-164` — the switch cases are `initialize`, `ping`,
`tools/list`, `tools/call`, and the `default` arm answers `Method not found: <method>`; the
`tools/call` case refuses `requestState` / `inputResponses` with `-32602`; `#forward` projects an
unsupported modern result through the `-32000` arm.

### The M8 fail-closed departure

New entry in `## Declared conformance gaps`, before the `Mcp-Param-*` projection entry:

> **A retry the server cannot verify is refused, not re-requested — a declared SHOULD departure.**
> The MRTR page says a server that finds requested information missing on a retry SHOULD answer a
> NEW `input_required` round re-requesting it rather than an error. This server answers `-32602`
> to every verification failure, an omitted issued key and an absent `requestState` included. It
> fails closed on purpose: the round the server would re-issue is the one sealed inside the
> carrier it just declined to trust, and minting a fresh round from an unverifiable retry hands a
> client that failed verification a new sealed state to try again with. The other half of that
> clause is satisfied — unrecognized extra `inputResponses` keys are ignored, because the server
> reads exactly the keys it issued. **What it costs:** a client that drops the carrier or omits an
> issued key starts the call again from its first round instead of receiving the missing question
> a second time. The conformance runner records the cost exactly: its
> `input-required-result-missing-input-response` and `input-required-result-ignore-extra-params`
> scenarios check a SHOULD, so a refusal reports WARNING and both scenarios are recorded at
> 0 passed / 0 failed rather than green. **Closer:** one unit separating the omitted-key case from
> the unverifiable-carrier case and re-issuing the round for the first alone; it is not scheduled,
> and it needs a reading of how a re-issued round binds to state the client already returned.

Evidence: the campaign's `spec-patterns.md` row M8 (SHOULD); `tests/conformance.test.ts:104` and
`:111` carry both scenarios at `passed: 0, failed: 0` with the WARNING reason recorded beside
them.

### The stdio shutdown posture

Two places, one ruling. In `### stdio transport`, appended to the teardown paragraph:

> That ladder is signal-first — the supervisor terminates the child, then destroys its `stdin` —
> rather than the stdin-close-and-wait the specification asks a stdio client for. The posture and
> its cost are stated under [Declared conformance gaps](#declared-conformance-gaps).

And the ruling itself, a new gap entry before the rate-limiting entry:

> **The stdio client shuts a child down signal-first, not stdin-first — a declared SHOULD
> departure owned by another package.** The stdio page says a client SHOULD close the child's
> `stdin`, wait for it to exit, and terminate it only if it does not. `StdioClientTransport.close`
> runs `@orkestrel/process`'s bounded teardown, whose ladder is the other way round: the
> supervisor signals the child (`SIGTERM`, then `SIGKILL` after the grace window; on Windows a
> `taskkill /F /T` over the tree), and destroys `stdin` after that. **What it costs:** a child
> that would have exited cleanly on EOF is signalled instead, so its own shutdown work runs
> against a deadline and, on Windows, does not run at all — a `SIGTERM` handler never fires there,
> and the diagnostics it would have written never exist. **Closer:** `@orkestrel/process`. The
> ladder belongs to the supervisor that owns the child, not to a transport reaching around it, so
> this package adopts a cooperative stop as soon as `Process` offers one; the improvement is
> recorded against that package.

Evidence read in the installed package: `node_modules/@orkestrel/process/dist/src/server/index.js`
— `#kill` runs `stopChild` and only then `this.#child.stdin.destroy()`; `stopChild` is
`SIGTERM` → grace → `SIGKILL` on POSIX and `killTree` (with a `SIGKILL` fallback) on Windows.

### `createMCPContinuation` as the `requestState` protector

Added to the MRTR section after the round-keys paragraph:

> **`createMCPContinuation` is what protects the `requestState` echo, and it is required.**
> `MCPInputOptions.continuation` has no default: the carrier travels through a client that may
> have rewritten it, so the integrity of every binding inside it — principal, expiry, original id,
> revision, method, tool name, argument digest, and the issued round — rests entirely on that
> port. `createMCPContinuation(secret)` is the shipped implementation, adapting
> `@orkestrel/server`'s `signToken` / `verifyToken` to the port: `seal` signs the canonical state
> string and `open` verifies it, returning `undefined` for anything it cannot verify, which is
> what turns a tampered carrier into `-32602`. Pass `[current, ...older]` to rotate a secret
> without invalidating state already in flight — a carrier sealed under a listed older secret
> still opens, while a new one seals under the current. Core supplies no signer of its own, and a
> consumer substituting its own port takes that integrity property with it: a port whose `open`
> returns whatever it was given makes every binding a client-supplied claim.

Evidence: `src/server/factories.ts:39-47`; `MCPInputOptions.continuation` is required
(`src/core/types.ts:764-773`); the installed `signToken` signs under the FIRST secret and
`verifyToken` verifies against each candidate, yielding `undefined` on any failure
(`node_modules/@orkestrel/server/dist/src/server/index.d.ts:1755-1776`, `:1966-1988`).

### The auth exclusion — the case found

**Found landed in two places, missing from a third.** The client-conformance narrative in
`## Declared conformance gaps` already carried it (`The `auth/*` family is outside the recorded
set, because each of those scenarios drives an OAuth 2.1 client through discovery, dynamic
registration, and a token grant, and this package publishes no OAuth client.`), and MC's own
declaration sits in `CONFORMANCE_CLIENT_SCENARIOS`'s TSDoc (`tests/setupConformance.ts:80-95`)
with the executed proof `excludes the runner OAuth family from the recorded scenario set`
(`tests/setupConformance.test.ts:153`). It was missing from `## Declared non-goals`, where a
consumer plans against the surface rather than against the conformance run, so this row landed
in the `Protocol surfaces this package does not implement` table:

> | An OAuth 2.1 authorization client | The flow that mints a bearer — discovery, dynamic
> registration, a token grant — is a client this package does not publish. Every HTTP client
> transport takes a `headers` record, so a consumer supplies its own bearer, and server-side
> authorization composes IN FRONT as ordinary `@orkestrel/server` middleware. The conformance
> runner's `auth/*` client scenarios are outside the recorded set for this reason — see
> [Declared conformance gaps](#declared-conformance-gaps). |

Both HTTP client faces do take `headers` (`src/server/types.ts:296-301`; the browser row at
`#### Types`).

### `MCPLimitOptions.keys` — documented, enforcement unchanged

The drift is real and reaches both bounds. `keys` is passed as the breadth leaf of every bounded
value: the `_meta` check (`src/core/MCPServer.ts:241`) and the produced-content snapshots
(`:471`, `:524`, `:574`, `:614`, `:670`, `:877`, `:903`, `:950`, `:979`, `:1226`, `:1517`,
`:1623`, `:1664`). Nothing was changed in enforcement.

`src/core/types.ts`:

```ts
/**
 * Maximum total enumerable keys accepted in one bounded value: one `_meta` value under
 * `metadata`, and one produced tool-call result under `content`.
 */
readonly keys?: number
```

`guides/mcp.md`, `### Bound hostile input and live resources` — the defaults sentence now reads
`one MiB for a raw message, 16 KiB for `_meta`, 64 total object keys, 16 KiB for `requestState`,
four MiB for produced tool content, …` and continues:

> `keys` is the breadth bound for BOTH bounded values, not a `_meta` leaf: `metadata` and
> `content` cap the bytes of their own value, while `keys` and `depth` cap the shape of each. A
> result whose breadth exceeds `keys` is refused the way oversized content is, an `_meta` value
> exceeding it the way invalid metadata is, and raising the key budget for extension-rich metadata
> raises it for tool output too.

The `MCPLimitOptions` Surface row gained `` `keys` and `depth` bound the SHAPE of every bounded
value — one `_meta` and one produced result alike — while `metadata` and `content` bound their
own value's bytes.``

### The `buildModernResult` bypass — documented as a SHOULD departure

Added to `### Execute rich results and request-scoped progress`, after the paragraph on returning
a validated `MCPCallResult`:

> **A returned `MCPCallResult` reaches the wire unstamped, and that is a declared departure.** The
> normalization path builds its answer through `buildModernResult`, which stamps the
> `io.modelcontextprotocol/serverInfo` identity into `_meta`. A handler that returns a complete
> `MCPCallResult` instead is taken at its word: the server bounds it, re-proves its shape, and
> sends what the handler composed, so nothing adds the identity the other path adds. The dated
> revision says a server SHOULD carry its identity in a result's `_meta`, and this is the one
> result shape that does not. **What it costs:** a peer reading `serverInfo` off a `tools/call`
> result finds it on every normalized result and on no custom-execution one, so a consumer using
> `execution` for rich content stamps the key itself — through `buildModernResult`, which is
> exported for exactly this — wherever that peer matters. **Why it is not fixed here:** stamping
> the key onto a handler's own result would edit a result the handler declared complete, and the
> `_meta` it composed is the handler's. **Closer:** a consumer's own
> `buildModernResult(result, identity)` call inside the handler.

Behaviour unchanged. Evidence: `MCPServer.#execute` returns the snapshotted `MCPCallResult`
directly (`src/core/MCPServer.ts:948-954`) and `#call` wraps it with `buildJSONRPCResult` alone
(`:800-801`), while `#normalize` stamps through `buildModernResult` (`:1662-1670`). The SHOULD is
R1 row 8 (`serverInfo` in every result `_meta`, SEP-2575).

The claim already has an executed gate: `tests/src/core/MCPServer.test.ts:1117` asserts
`expect(response?.result).toEqual(rich)` for a handler-returned `MCPCallResult` carrying no
`_meta`, which reddens the moment anything stamps one.

`MCPServerOptions.execution`'s TSDoc did NOT imply the stamp, so the brief's condition for a
TSDoc sentence was not met. One was added anyway, because the consumer meets the option there and
the omission is invisible from the type:

> A handler returning a complete {@link MCPCallResult} is taken at its word: the server bounds it
> and re-proves its shape, then sends what the handler composed. Nothing stamps the `_meta` server
> identity `buildModernResult` puts on a normalized result, so a handler whose peer reads that key
> composes it through `buildModernResult` itself.

## The gap-entry sweep — a disposition for every entry

Ruled against the landed M1, M2, M3, M3F, and M2F state. Every "still true" row names what was
read to confirm it.

| Entry (opening words)                                              | Disposition                                                                                                                                                   |
| ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Incremental client-side consumption of a held-open exchange        | **Still true, unchanged.** Both HTTP client faces await `readEventStream(response)` to completion before emitting (`src/server/…/HTTPClientTransport.ts:228`, `src/browser/…:226`). |
| A per-request abort reaching one in-flight HTTP fetch              | **Still true, unchanged.** `send(message: JSONRPCMessage): Promise<void>` carries no options bag (`src/core/types.ts:2403`).                                  |
| `-32020` refresh-and-retry-once                                    | **Still true, unchanged.** No retry path exists in either HTTP client transport, and both derive the version through the shared `inferRequestVersion` (`:197` Node, `:198` browser), which is the clause's parenthetical. A-M2 confirmed it against `a7d245c`. |
| Re-listing and retrying once after a `HeaderMismatch`              | **Still true, unchanged.** No retry exists, and the entry's replace-versus-accumulate sentence now matches shipped code after M2F (`#select` clears `#parameters` when the sent listing carried no `cursor`). |
| `Mcp-Param-*` / `x-mcp-header` client projection — satisfied       | **Already true, verified.** M2 landed the surface and M2F corrected the cache rule this entry states; the entry needs no reword.                              |
| Tool-invocation rate limiting                                      | **Still true, unchanged.** No campaign unit touched it; it is a declared policy refusal.                                                                       |
| A unary HTTP request cannot be cancelled mid-flight                | **Still true, unchanged.** Structural, and recorded as a rejection of record in the plan.                                                                      |
| A tool run through the default registry cannot observe cancellation | **Still true, unchanged.** `ToolManagerInterface.execute(call)` still takes a call and nothing else.                                                          |
| A producer that ignores its signal cannot be forced to finish      | **Still true, unchanged.** A language limit.                                                                                                                  |
| An inbound `notifications/cancelled` is honoured only where the carrier has one | **Still true, unchanged.** No unit touched the carrier set.                                                                                       |
| The cancellation page and the subscriptions page disagree          | **Still true, unchanged.** An upstream contradiction.                                                                                                         |
| A consumer's own registered method cannot be called with this client | **Still true, unchanged.** `MCPClient`'s public surface is unchanged by this campaign.                                                                       |
| Do not reach for the client's own transport as a second door       | **Still true, unchanged.** The id-space hazard is unchanged.                                                                                                  |
| Where the task subscription filter sits on the wire                | **Still true, unchanged.** Awaiting a published source.                                                                                                       |
| The modern-only scope of `subscriptions/listen` (pointer)          | **Still true, unchanged.** The non-goals entry it points at stands, and the new `MCPLegacy` paragraph agrees with it.                                          |
| The `MCPClientTransportInterface` rename is deferred               | **Still true, unchanged.** A rejection of record in the plan.                                                                                                 |
| The remaining corrected guide fences are prose-checked             | **Stale — reworded.** Its universal ("the other corrected fences … no executed transcription") went false as later rounds added executed transcriptions for the stdio and subscription fences. It now names what IS executed and states the cost of what is not. |

Two further stale facts found in the same sweep and corrected, recorded here as ancillary
decisions rather than as brief rows:

- `## Declared packaging limits`, the IDE entry, quoted the conformance run at `23 passed / 0
  failed` — the pre-M0 fixture's number. The same guide records `110 passed / 0 failed` two
  sections earlier, so the file contradicted itself. Corrected to `110 passed / 0 failed`.
- The `### Bound hostile input and live resources` defaults sentence attributed the key budget to
  `_meta` alone. Corrected with the `keys` ruling above.

## Fix 4 — peer alignment

```diff
 	"peerDependencies": {
 		"@orkestrel/router": "^0.0.11",
-		"@orkestrel/server": "^0.0.14"
+		"@orkestrel/server": "^0.0.15"
 	},
```

The advertised floor now names the release `devDependencies` installs and the gates exercise.
Nothing pins the range: `tests/` and `guides/` contain no `peerDependencies` reference, and
`vite.config.ts:16-26` reads its KEYS alone (externalization), so the range change is inert to the
build. `test:config`, `test:policy`, and `test:distribution` are all green after it.

## Scoped runs

| Command                                                                 | Result                                     |
| ------------------------------------------------------------------------ | -------------------------------------------- |
| `npm run check`                                                          | Exit 0, no diagnostics, all four projects   |
| `npx oxlint --config .oxlintrc.json --deny-warnings <4 owned .ts files>` | Exit 0, no findings                         |
| `npx oxfmt --config .oxfmtrc.json --check <6 owned files>`               | `All matched files use the correct format`  |
| `npm run test:src:browser`                                               | `66 passed (66)`                            |
| `npm run test:src:server`                                                | `378 passed (378)`                          |
| `npm run test:guides`                                                    | `149 passed (149)` — unchanged              |
| `npm run test:policy`                                                    | `93 passed (93)`                            |
| `npm run test:config`                                                    | `46 passed (46)`                            |
| `npm run test:distribution`                                              | `11 passed \| 4 skipped (15)`               |
| `npm run build:src`                                                      | Exit 0 (authorized ancillary)               |
| `npm run test:conformance`                                               | `47 passed (47)`, `[110, 0]` intact         |

`oxfmt --write` ran on `guides/mcp.md` alone, a file this unit owns; it re-aligned the two tables
this unit added rows to. No tree-wide mutating command ran, and `tmp/worktrees/` was never
touched.

## Findings outside the owned files — reported, not edited

1. **`DEFAULT_MCP_LIMITS`'s TSDoc carries the same `keys` drift** the brief ruled on for
   `MCPLimitOptions`. `src/core/constants.ts:163` reads `64 metadata keys admits the reserved keys
   plus many extensions`, while the leaf bounds produced content too. Exact patch:

   ```diff
   - * memory; 64 metadata keys admits the reserved keys plus many extensions; 128 concurrent
   + * memory; 64 keys admits `_meta`'s reserved keys plus many extensions, and bounds a produced
   + * result's breadth by the same leaf; 128 concurrent
   ```

2. **No test names `server/discover` or `subscriptions/listen` at the legacy door.** The new
   `MCPLegacy` paragraph's specific claim rests on the switch's `default` arm, which
   `tests/src/core/MCPLegacy.test.ts:239-247` pins only through the generic `unknown/method` case.
   A successor row in that file's case table — the same shape, with `server/discover` as the
   method — would break if the decorator ever grew a case for a modern method. One line, in a file
   this unit does not own.

## Deviation state

No stop-and-report deviation. No conformance row moved, no test outside the owned files reddened,
and no honesty row contradicted shipped code beyond what the brief's rulings anticipated.

Decisions recorded as ancillary, per the deviation contract:

- The stdio shutdown ruling lives in `## Declared conformance gaps` with the other departures, and
  the `### stdio transport` section carries one mechanical sentence pointing at it, so the ruling
  has one home rather than two copies that can drift.
- The `MCPServerOptions.execution` TSDoc sentence was added although the member's TSDoc did not
  imply the stamp, because the omission is invisible from the type and the consumer meets the
  option there.
- The stale `23 passed / 0 failed` packaging number and the `keys` defaults sentence were
  corrected as part of the honesty pass; both sit in the owned guide and both were false.
- The M8 entry's cost is stated through the two conformance scenarios that record it, rather than
  as a bare assertion about client behaviour.
