## 1. What changed

`/home/user/mcp/guides/mcp.md`

- **§ Consume a subscription from a client (new, after § Configure modern subscriptions):** the client half of the subscription concept — `listen`'s shape and return contract, the `undefined`-filter wire defaulting, acknowledgement-first / terminal-as-return-value, the required `signal` and the abandonment obligation, and `capacity` with its loud overflow. Carries the executable fence importing from `@orkestrel/mcp`.
- **§ Surface → Constants:** added `DEFAULT_MCP_SUBSCRIPTION_CAPACITY`.
- **§ Surface → Helpers:** added `isMCPSubscriptionResult`.
- **§ Surface → Types:** added `MCPSubscriptionStream` and `MCPListenOptions`.
- **§ Methods → `MCPClientInterface`:** added the `listen` row; the intro sentence now names `listen` between `call` and `disconnect`.
- **§ Declared conformance gaps:** replaced the two named entries (quoted in full following), and corrected one neighbouring bullet whose "the unproven half is `MCPClient`'s" became false — an ancillary call I made and carried on from.

`/home/user/mcp/tests/guides.test.ts` — touched, as the brief's Output requires me to report: the fence's claims are behavioural, so they get an executed transcription (`§ Consume a subscription from a client — what the stream delivers`) driving a real in-process `MCPServer` over the duplex loopback.

The replacement gap entries, in full:

> **Incremental client-side consumption of a held-open Streamable HTTP exchange — duplex-only.**
> `MCPClient.listen` opens `subscriptions/listen` and consumes the reply as it arrives, and over a
> duplex carrier that is what happens: each stamped frame is delivered the moment the transport
> carries it. The HTTP client transports buffer a `text/event-stream` reply to completion before
> they emit anything, so a `listen` over an HTTP client transport yields its acknowledgement,
> every frame, and its terminal together when the stream closes. The subscription API is correct
> over that carrier and useless for the reason a subscription exists. **What it costs:** a
> long-lived HTTP subscription reports nothing until it ends, so an HTTP consumer that wants
> frames as they happen has no carrier here — use the WebSocket, stdio, or `MessagePort` face
> instead. **Closer:** the transport-ingress backpressure capability — a per-request awaited
> delivery handler and `signal` on `send`, with incremental HTTP decoding on the server and
> browser faces.

> **A per-request abort reaching one in-flight HTTP fetch — partly closed, and the rest needs the
> same seam.** `listen` carries a required per-subscription `signal`: aborting it closes that
> subscription, releases its registration, and writes `notifications/cancelled` on a duplex
> carrier, so a caller CAN abandon one long-lived exchange without abandoning the transport.
> `MCPClientTransportInterface.send` still takes a message and no per-request options, and the
> HTTP transports carry only a construction-time `timeout` applied uniformly through
> `AbortSignal.timeout`. So the signal ends the client's interest in the subscription and cannot
> cancel the fetch already in flight underneath it. **What it costs:** an aborted HTTP
> subscription stops delivering to its consumer while its request runs to completion on the wire.
> **Closer:** the same transport-ingress backpressure capability — a per-request options bag on
> `send` carrying that `signal`, which is why this entry and the one preceding it would return as
> ONE unit and never separately.

Both entries' load-bearing citations were checked against source, not against the design record: `readEventStream` drains to completion (`src/browser/helpers.ts`, its own TSDoc says so), `src/server/transports/HTTPClientTransport.ts:208` awaits it and `:216` emits every message in a loop, and `src/core/types.ts:2178` declares `send(message: JSONRPCMessage): Promise<void>` with no options parameter.

## 2. The red-first record

`npm run test:guides`, before any edit — **exit 1, `Tests 3 failed | 136 passed (139)`**, matching the reading the dispatch recorded. The failing rows and their exact payloads:

- `MCP > documents every barrel export` — `["const DEFAULT_MCP_SUBSCRIPTION_CAPACITY", "interface MCPListenOptions", "type MCPSubscriptionStream", "function isMCPSubscriptionResult"]`
- `MCP > MCPClientInterface > documents every interface method` — `['listen']`
- `MCP > MCPClientInterface > MCPClient exposes no undocumented method` — `['listen']`

`npm run test:guides`, after the guide edits and before the transcription was added — **exit 0, `Tests 139 passed (139)`**. That is the parity scope closed: every export named in Context is documented and the methods table matches `MCPClientInterface`.

`npm run test:guides`, final — **exit 1, `Tests 1 failed | 141 passed (142)`**. The single failure is the behavioural row I added, described in section 3.

## 3. The example's form and its executed proof

The fence sits in § Consume a subscription from a client, imports `createMCPClient`, `isMCPSubscriptionResult`, and `type MCPSubscriptionResult` from `@orkestrel/mcp`, and takes a free `transport` binding — the same form the neighbouring `MCPTaskClientInterface` fence uses. It does not use an HTTP client transport, because the gap entry it points at says that carrier delivers nothing until closure.

The transcription drives a real `createMCPServer` (through `createSubscriptionServer`) over the duplex loopback. Membership rule of the instrument, stated in the file: a notification carrying the subscription's reserved id enters the stream, one carrying no id does not. Both are injected through the same `transport.receive` door while the subscription is live, so the negative reading reports on the stamping rather than on a dead delivery path.

Rows and their state:

- `yields the acknowledgement first, then the stamped frames, and returns the terminal` — **green**. Asserts `opened.done === false`, the acknowledgement method, the stamped frames in wire order, `closure.resultType === 'complete'`, and `isMCPSubscriptionResult(closure) === true` (the fence's `// true` comment).
- `claims a stamped frame and declines an unstamped one arriving the same way` — **green**.
- `delivers every frame that arrived before the first read` — **red**, and it is the deviation. See section 6.

Two throwaway probes characterized the red and were deleted (`tmp/probe/listenDrain.test.ts`, `tmp/probe/listenDrainReal.test.ts`); the burst row is their promoted form.

## 4. Scoped gate readings

| Command | Exit |
| --- | --- |
| `npx tsc --noEmit --project tsconfig.json` | 0 |
| `npx oxfmt --config .oxfmtrc.json --check guides/mcp.md tests/guides.test.ts` | 0 |
| `npx oxlint --config .oxlintrc.json --deny-warnings tests/guides.test.ts guides/mcp.md` | 0 |
| `git diff --check` | 0 |
| `npm run test:guides` | 1 — the burst row only |

`oxfmt` formats Markdown in this repository, and my table rows failed it. I ran `npx oxfmt --write guides/mcp.md`, scoped to that one owned file, never tree-wide. Its hunks land only at 876, 1880, 1937, 2100, 3022, 3034, 3858, and 3888 — my regions, with no unrelated reflow.

`git status --short` carries the M3-U1 working set plus exactly my two owned files. Owned diffstat: `guides/mcp.md` +103/-23, `tests/guides.test.ts` +185/-2.

## 5. Observations outside scope

- **Transport ingress backpressure capability:** the duplex-only limit and the un-cancellable in-flight fetch are documented in the replaced entries, not closed. Unchanged from the design record's register.
- **`MCPClient.listen` capacity validation, owned by the client subscription capability:** a `capacity` that is not a positive integer throws `MCPError` `-32602` on the first read. I documented the default and the overflow but not this refusal, because the brief's Context does not name it and it is a call-shape error rather than a subscription behaviour. It has no guide row today.
- **Campaign record:** `/home/user/scaffold/.orkestrel/campaign/m3-u1-subscription-report.md`, which the brief names, does not exist. The U1 report is at `/home/user/scaffold/tmp/units/m3-u1-subscription-report.md`; I read it there. Retention has not copied it into `.orkestrel/campaign/`.

## 6. Deviation — the completeness sentence is falsified by the shipped client

This is the brief's named stop condition: a shipped behavior contradicts a fact in Context.

**Expected.** Context: "The stream yields the acknowledgement first, then every stamped notification as an owned frame, and returns the validated `MCPSubscriptionResult` on graceful closure." The design record rules the same, and the bounded queue is the mechanism that makes it true for frames arriving faster than the consumer reads.

**Found.** `MCPClient.listen` discards every frame still queued when the graceful terminal arrives. Frames survive only as far as the consumer happened to read before the terminal landed.

**Exact evidence.** In `src/core/MCPClient.ts`, the `listen` body checks the terminal before draining the queue:

```ts
for (;;) {
    if (subscription.failure !== undefined) throw subscription.failure.reason
    if (subscription.terminal !== undefined) return subscription.terminal
    const queued = subscription.queue.shift()
```

Measured through a real `MCPServer` with no direct injection — write N frames, close, then drain: 2 written → `[]` delivered; 4 written → `[]`; 8 written → `[]`. The promoted regression guard is `tests/guides.test.ts > guides/mcp.md § Consume a subscription from a client — what the stream delivers > delivers every frame that arrived before the first read`. Command: `npx vitest run --config vite.config.ts --no-cache --reporter=dot --project guides -t 'delivers every frame that arrived before the first read'` — exit 1, `Tests 1 failed | 141 skipped (142)`, `Received` missing `notifications/resources/list_changed`. Run three times, identical each time: the last frame is always lost.

**Done.** Every parity obligation in the brief: the named exports documented, the methods table matched to `MCPClientInterface`, the two gap entries replaced in the section's voice, the fence added, and the fence's own drain-as-you-go pattern proven green.

**Not done.** Acceptance criterion 3 — the guides project exits 1, on that one row. I left it red deliberately rather than weakening the sentence at `guides/mcp.md:885-886` ("Every frame the server stamps with this subscription's id arrives as an owned snapshot, in wire order"). Weakening it would document a defect as the contract; deleting the row would ship a false sentence under a green gate. The repair is one line in `src/core/MCPClient.ts`, which this unit does not own.

**Hypothesis.** Moving the `subscription.terminal` check to after the `queue.shift()` drain — return the terminal only when the queue is empty — closes it, and the red row is the guard that binds the fix.

**Claim I flag for host verification.** The measured frame counts come from this container. The loss itself is deterministic and structural rather than timing-dependent, but exactly how many frames survive a partial drain is timing-dependent, so re-read the burst row's `Received` list on the host before quoting a count.
