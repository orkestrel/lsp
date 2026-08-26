# Design brief M3 — the client subscription surface

One brief, two lanes. The subjective lane (`planner`, Claude Opus 5, native subagent) argues
shape, naming, ergonomics, and design fit; the objective lane (`analyst`, GPT-5.6 Sol,
`codex exec`, sandbox `read-only`, working directory `/home/user/mcp`) argues correctness,
constraints, and what the code and contracts actually permit. Each lane reads this brief and
its evidence slice, works blind to the other, performs the assignment directly, and spawns
nothing. Neither lane edits anything.

Before ruling, read in order: `/home/user/mcp/AGENTS.md`; the applicable rules —
`.claude/rules/names.md`, `.claude/rules/typescript.md`, `.claude/rules/patterns.md`,
`.claude/rules/architecture.md`, `.claude/rules/tests.md`, `.claude/rules/documentation.md`,
`.claude/rules/quality.md`; no skill binds this round; the guide `guides/mcp.md` §§ modern
subscriptions and the declared conformance gaps; the terrain distillate at
`/home/user/scaffold/.orkestrel/campaign/m3-terrain-distillate.md` (spot-check any pointer
you lean on — the guide's line numbers shifted at mcp `c130277` when the continuation
repairs re-padded the Types table and deleted a gaps entry).

## The question

Design the client side of modern subscriptions for `@orkestrel/mcp`: the campaign ruling
gives `MCPClient` an entity-scoped subscription capability delivering a backpressured async
stream with abort-driven closure, closing the declared client-side gap.

## Fixed by prior rulings (not yours to reopen)

- The package is modern-only at the 2026-07-28 revision, with the optional legacy wrapper;
  the wire method is `subscriptions/listen` — `resources/subscribe` stays unregistered.
- The capability is entity-scoped on the client, its stream is backpressured (a slow
  consumer must slow delivery, never grow an unbounded buffer), and closure is
  abort-driven (an abort signal ends the stream; no polling anywhere).
- Single-word public members; types first in `src/core/types.ts`.

## Verified terrain (mcp `c130277`)

- `MCPSubscriptionFilter` at `src/core/types.ts:1325-1334`; the graceful terminator
  `MCPSubscriptionResult` with its `_meta` subscription id at `:1336-1349`.
- `MCPStream = AsyncGenerator<JSONRPCNotification, JSONRPCResponse, unknown>` at
  `src/core/types.ts:1441`, with `MCPStreamControllerInterface` and the server-side
  controller in `src/core/MCPStreamController.ts`.
- The server registers `subscriptions/listen` at `src/core/MCPServer.ts:316` with the
  handler at `:1286` onward; capacity default `128` in `src/core/constants.ts`; the
  reserved `_meta` key at `src/core/constants.ts:59`.
- The client's request sites are `server/discover` (`src/core/MCPClient.ts:307`),
  `tools/list` (`:371`), and `tools/call` (`:390`); incoming notifications reach
  `emitter.emit('notification', owned)` in `#receive`, with the per-call `progress` handler
  the only interception; the event shape is
  `notification: readonly [message: JSONRPCMessage]` at `src/core/types.ts:2241`.
- The guide's client-side gap entry (no `subscriptions/listen` initiator or stream API) is
  the entry this capability deletes; the M2.1 precedent for deleting a closed gap entry is
  in `.orkestrel/campaign/m2.1-continuation-repairs-report.md`.

## Rule on at least these axes

1. **The entity and its member names.** Where the capability lives (a member on
   `MCPClient`, a sub-entity the way `tasks` hangs off the client, or another shape), and
   the single word for each member. Weigh the existing `tasks` precedent and the
   one-concept-one-term law against the server's `subscribe` vocabulary.
2. **The stream's contract.** What the consumer iterates (owned notification frames, a
   narrowed shape, or typed events), how backpressure binds to the transport
   (`for await` demand against `#receive` delivery — what buffers, what bound, and what
   happens at the bound), how the graceful `MCPSubscriptionResult` terminator surfaces,
   and how a mid-stream connection loss ends iteration. Rule whether `MCPStream` and its
   controller are reused, wrapped with a genuine boundary, or wrongly coupled.
3. **Closure.** The abort signal's placement (per-listen option the way `MCPCallOptions`
   carries `signal`), what the client sends or stops on abort, what the server observes,
   and the disposal story (`Symbol.asyncDispose` precedent in
   `MCPStreamControllerInterface`).
4. **Filter surface.** Whether the client republishes `MCPSubscriptionFilter` as-is, and
   how an empty or absent filter reads.
5. **Interception boundary.** How `#receive` routes subscription-bound notifications to
   the stream without breaking the existing `notification` event's contract for
   non-subscription traffic — and what happens to a subscription notification when the
   consumer abandoned the stream without aborting.
6. **Unit decomposition.** The implementation units this design yields — types, client
   implementation, tests (real in-process server, no loopback listener needed), guide
   section, and the gap-entry deletion — each with owned files, red-first proof
   obligations, and independently checkable acceptance criteria, sized for one bench
   implementer unit where possible.

## Output

Your final message is your lane's ruling: per-axis positions with `file:line` evidence
where the code constrains the choice, the risks you see, at most one recommended shape per
axis, and the unit decomposition with acceptance criteria. Name any fact you could not
verify. No process diary.
