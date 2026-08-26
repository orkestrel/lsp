1. **BROKEN.** `listen` reads `options.signal` at [MCPClient.ts:406](/home/user/mcp/src/core/MCPClient.ts:406), :442, :443, and :446. A conforming accessor aborted the same signal during the second read. The listener was then attached after the abort, and the subscription still opened:

   ```text
   {"reads":4,"aborted":true,"done":false,"method":"notifications/subscriptions/acknowledged","methods":["server/discover","subscriptions/listen"]}
   ```

   If the consumer trusts the abort and drops the stream, its pending entry and abort listener remain live. The smallest fix is to read `options.signal` once, call `throwIfAborted()` on that snapshot, and use it for binding, registration, and pending cleanup. Add the accessor-abort input as the regression row. With a stable signal, the queue/terminal reorder holds: failure clears the queue, a queued frame precedes a terminal, a waiter and queued frame cannot coexist, and settlement removes the pending entry and registered listener.

2. **CONFIRMED.** The installed `IteratorResult` declaration discriminates `done?: false` from `done: true`; the fence’s `opened.done === false` guard therefore narrows `opened.value` to `JSONRPCNotification`. The transcription uses the same condition and member read at [guides.test.ts:1194](/home/user/mcp/tests/guides.test.ts:1194). Capacity validation at [MCPClient.ts:406](/home/user/mcp/src/core/MCPClient.ts:406) precedes id allocation, request construction, pending registration, and `send`. The guide states that ordering, and its executed transcription expects only the earlier `server/discover` method.

3. **CONFIRMED.** The pin at [MCPClient.test.ts:3604](/home/user/mcp/tests/src/core/MCPClient.test.ts:3604) parks `stream.next()` before waiting 50 ms and writes its literal expected frame only afterwards. A deadline planted on the subscription entry starts before acknowledgement delivery and expires after 25 ms, so the later write cannot win a liveness race. An independent in-memory plant against the built artifact returned:

   ```text
   {"status":"rejected","message":"MCP request 'subscriptions/listen' timed out after 25ms"}
   ```

   The unmodified artifact returned the literal stamped notification with `done: false`.

4. **BROKEN.** The shipped server cannot produce the disputed interleaving: [matchesSubscriptionNotification](/home/user/mcp/src/core/helpers.ts:907) admits only the supported subscription families, while [buildProgressNotification](/home/user/mcp/src/core/helpers.ts:375) adds no subscription stamp. The discard nevertheless swallows progress that the client contract owes when a peer supplies a valid active `progressToken` together with a stale subscription stamp. A probe through the published client-transport seam used active call id `2` and returned:

   ```text
   {"callId":2,"progress":0,"notifications":0}
   ```

   [MCPClient.ts:702](/home/user/mcp/src/core/MCPClient.ts:702) lets `#routeSubscription` claim the frame before `#reportProgress`, despite [types.ts:2316](/home/user/mcp/src/core/types.ts:2316) promising each progress frame for the request to its handler. The smallest fix is to run `#reportProgress` before `#routeSubscription`: valid active progress is claimed first, while an unclaimed stale-stamped progress frame remains subject to the ruled late-subscription discard. Pin those outcomes separately.

5. **CONFIRMED.** `ce155db` and `f0ad416` touch only the files assigned to their units. Added TypeScript lines contain no `any`, type assertion, non-null assertion, suppression, accessibility modifier, default export, mock, fake clock, skipped test, or deferred test. The added `as const` literals are the explicit permitted form. The M3.1 commit removes the carried `below` pointer violation, and the tree remains clean.

**Findings outside the claims:** None.

**Claims attacked and not broken:** The guide and transcription claim, the no-timeout pin claim, and the diff-scope and banned-code claim.

VERDICT: FAIL — 2 broken, 0 unresolved, 0 not-evidenced, 0 findings outside the claims