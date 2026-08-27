# M3F report — fix round for the A-M3 broken claims

Done: all three fixes. Baseline `a7d245c`, clean; nothing committed; `tmp/worktrees/` untouched.
The working tree holds exactly the four owned files.

## Touched files

| File                                                        | Change                                                                                                                                    |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `src/server/transports/WebSocketClientTransport.ts`         | `send` rejects a bound socket whose `readyState` is not `WEBSOCKET_READY_OPEN`, beside the unchanged unbound arm; class TSDoc restated.    |
| `tests/src/server/transports/WebSocketClientTransport.test.ts` | Added `startClosingPeer` and the bound-but-closed row (the failing-first pin), plus a pre-`start()` refusal row with its delivery control. |
| `tests/src/browser/factories.test.ts`                       | A3 row gains the no-queue half: reconnect, and an id-98 control proving the reconnected socket carries traffic.                            |
| `guides/mcp.md`                                             | Bounded the two WebSocket universals; corrected the Node-face clause the guard made stale.                                                 |

```text
 guides/mcp.md                                      | 39 +++++++++----
 src/server/transports/WebSocketClientTransport.ts  | 23 ++++++--
 tests/src/browser/factories.test.ts                | 29 ++++++---
 .../transports/WebSocketClientTransport.test.ts    | 99 ++++++++++++++++++++++
 4 files changed, 165 insertions(+), 25 deletions(-)
```

## Fix 1 — the Node client face joins the guard

Failing-first, `2026-08-27`:

```text
npx vitest run --config vite.config.ts --no-cache --reporter=dot --project src:server \
  tests/src/server/transports/WebSocketClientTransport.test.ts
```

- Before the guard: `Tests 1 failed | 16 passed (17)`. The failing name is
  `WebSocketClientTransport — close releases what the connect acquired > rejects a send on a bound socket the peer already closed, and writes no frame`, reported as
  `AssertionError: promise resolved "undefined" instead of rejecting`.
- After the guard: `Tests 17 passed (17)`, and `18 passed (18)` with the pre-`start()` row added.

The guard is the server carrier's second-source reading in the same wording:

```ts
if (socket === undefined || socket.readyState !== WEBSOCKET_READY_OPEN) {
	throw new Error('WebSocket transport is not connected')
}
```

**The state the red was taken in, and why it is that one.** The brief names the CLOSING window
(peer close processed, `close` not yet run). Reading `@orkestrel/websocket`'s shipped wrapper,
a peer close frame runs `#close` → `#readyState = 2` → `#finish` → `#readyState = 3` →
`emit('close')` in one synchronous pass, and `Emitter.emit` is synchronous, so a transport that
is already subscribed has `#socket` cleared in the same turn. The window is real where the
transport is not yet subscribed: `createNodeWebSocket({ socket, head })` ingests `head` inside
its own constructor, before `#connect` assigns `#socket` and calls `#bind`. A peer that writes
its `101` and an unmasked close frame in one write lands that close in the handshake `head`, so
the transport installs a socket already past `OPEN`, its own `close` never fires, and its own
flag stays clear. That is the audit's condition — bound socket, transport state silent, only
`readyState` knows — reached through the public API with a real peer and no mock.
`startClosingPeer` is that peer. `expect(closed).toBe(0)` is asserted before the send, so a run
where the close arrived as a later `data` event fails at the precondition rather than passing
for the wrong reason.

The unbound arm is unchanged: `rejects a send issued after close() as not connected` and the
`close()`-during-suspended-`start()` row still pass, with the open-socket control in the former
still resolving.

## Fix 2 — the A3 pin gains its no-queue half

The auditor's prescription verbatim: after the rejection, `start()` again, wait until open, and
assert id `99` never arrives. Added with a control — id `98` is really sent on the reconnected
socket and its reply must come back — so the absent `99` is a fact about the queue rather than
about a channel carrying nothing.

**Failing-first could not be taken as red-then-green, and here is what was taken instead.** The
browser `send` already rejects before it pushes, so the assertion is green from the start; the
only line whose reversal reddens it lives in `src/browser/transports/WebSocketClientTransport.ts`,
which is off-limits to this unit, and planting a defect there is not available to me. I measured
the instrument's power instead, with a throwaway probe row added to the owned file and then
removed by exactly that edit:

```text
npx vitest run --config vite.config.ts --no-cache --reporter=dot --project src:browser \
  tests/src/browser/factories.test.ts     →  36 passed (36), probe included
```

The probe drove `start()` (unawaited) → `send(id 77)` pre-open → `close()` → `start()` again,
and the id-77 reply arrived on the reconnected socket. So this exact instrument — reconnect,
`waitForDelay(50)`, read `received` ids — does see a queued message flushed after a reconnect.
The A3 negative is therefore measured rather than assumed. The defect it catches is reachable:
`close()` leaves `#queue` standing and `#flush` splices whatever is in it, so a `send` that
pushed before it threw (the auditor's named failing input) would be delivered on the next open.

## Fix 3 — the two guide universals, as bounded

Server paragraph (`guides/mcp.md`, `A closed channel rejects, and the pump survives the
rejection`):

> It aborts every in-flight request the moment this transport's `close` fires, so a peer whose
> disconnect reaches that event — a close frame, a socket the host ends, or a socket fault — is
> answered by no write at all; and it catches a rejection that does reach it, routing that fault
> to `mcp.emitter`'s `error` event rather than letting it escape the async listener. That bound
> is the host's report, not the peer's departure: a peer that vanishes without a close frame or
> a socket fault leaves `readyState` at `OPEN`, so `send` frames the response, writes it to
> nobody, and resolves. Detecting that departure needs an RFC 6455 ping/pong liveness deadline,
> which this transport does not run.

Browser paragraph (`The browser face queues a pre-open send and rejects a closed one`) — the
claim is kept, because fix 1 makes it true for the condition it names, and bounded by naming the
one state where the faces diverge:

> The Node face rejects that same condition with the same words, reading the wrapper's
> `readyState` beside its own state the way this face reads the native socket's; it also rejects
> the pre-open send this face queues, because it holds no connection to flush one onto.

Two further WebSocket rows M3 added were corrected, both in the owned file:

- Clause 16 carried the same unbounded disconnect universal; it now reads `a peer whose
  disconnect fires this transport's close`, with the dead-peer limit in the same parenthesis.
- Clause 17 described the Node face's `send` as the unbound arm alone, which fix 1 made stale.
  It now states both arms and names the handshake-`head` close as the state the transport's own
  flag cannot reach.

The added browser-paragraph clause about the pre-open send had no executed assertion, so it is
now pinned by `rejects a send issued before start(), where the browser face queues one`, whose
control sends `server/discover` after `start()` and reads the reply back.

## Scoped validation

Every command run in `C:\Users\mikes\WebstormProjects\mcp`, `2026-08-27`, after the last edit.

| Command                                                          | Result                     |
| ----------------------------------------------------------------- | -------------------------- |
| `oxfmt --config .oxfmtrc.json --check <4 owned files>`           | All matched files formatted |
| `oxlint --config .oxlintrc.json --deny-warnings <3 owned files>` | no diagnostics             |
| `npm run check`                                                  | pass, all four projects    |
| `npm run test:src:server`                                        | `370 passed (370)`         |
| `npm run test:src:browser`                                       | `64 passed (64)`           |
| `npm run test:guides`                                            | `149 passed (149)`         |
| `npm run test:integration`                                       | `4 passed (4)`             |

`git status --porcelain` reports only the four owned files as modified. No tree-wide mutating
command was run; `oxfmt --write` ran on `tests/src/browser/factories.test.ts` alone.

## Acceptance criteria

1. **Met.** The Node face rejects the bound-but-not-open send, recorded red (`1 failed | 16
   passed`) then green (`17 passed`, `18 passed` with the added row). The unbound arm's rows are
   unchanged and still pass.
2. **Met.** The A3 row proves reject, no delivery, and no queue, with the reconnect and the
   id-98 control. The red-then-green record could not be taken; see fix 2 for the instrument
   measurement taken in its place.
3. **Met.** The WebSocket universals are bounded to what ships, the two stale clauses are
   corrected, and every scoped run is green.

## Deviation state

No stop-and-report deviation. The guard reddened no client flow outside the closed-channel
condition, and no test outside the owned files reddened.

Decisions recorded as ancillary, per the deviation contract:

- The failing-first state for fix 1 is the handshake-`head` close rather than a held CLOSING
  wrapper, because the shipped wrapper leaves no cross-turn CLOSING window for a subscribed
  transport. Reasoning and evidence are under fix 1.
- Clause 16 and clause 17 were corrected alongside the two named paragraphs, both WebSocket rows
  M3 added inside the owned file, because the change made clause 17 false and clause 16 carried
  the same universal the round is bounding.
- The pre-`start()` refusal row was added to pin a sentence this unit wrote.

## Observation, outside this unit's scope

A pre-open `send` survives `close()` and is delivered on the next `start()`: `close()` does not
clear `#queue`, and `#flush` splices it onto the socket that opens next. Measured by the probe
described under fix 2 — id 77, queued before open, closed, reconnected, delivered. Whether a
transport that reported a close may still write a message the caller handed its previous
connection is a product question this brief did not scope, and nothing here was changed for it.
