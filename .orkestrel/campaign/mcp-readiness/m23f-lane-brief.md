# A-M23F — cross-engine check of the M3F and M2F fix rounds

You are the objective audit lane, running on Cursor Grok as the recorded substitute for GPT-5.6
Sol. Perform this assignment directly and spawn nothing. This is a read-only source review of
this worktree (mcp at commit `854a621`); your mode cannot execute commands, so rule from source
and from the supplied evidence files. Writer-produced run counts inside the unit reports are
testimony; the Orchestrator-executed record in `tmp/audit/runs.txt` is evidence.

## Subject

The fix rounds M3F and M2F, landed as the last commits of this tree:

- `tmp/audit/m3f.diff` — M3F (commit `28f524c`): the Node WebSocket client face's closed-send
  guard, the browser A3 pin's no-queue half, and the guide's bounded WebSocket universals.
- `tmp/audit/m2f.diff` — M2F (commit `854a621`): the HTTP client projection cache's
  fresh-versus-continuation split, the POST handler's bounded `nextCursor` walk, and the
  synthetic-listing observation documentation.
- `tmp/audit/m3f-report.md`, `tmp/audit/m2f-report.md` — the units' returned reports.

The current source tree in this worktree is the landed state; read it directly wherever the
diffs are not enough.

## Claims to falsify

Attack each claim. For each, return a verdict — CONFIRMED, BROKEN, UNRESOLVED, or
NOT-EVIDENCED — with the exact evidence (`file:line`) and the attack you ran against it. A
claim is CONFIRMED only if your attacks failed to break it.

1. **The Node guard is complete and does not over-reject.** In
   `src/server/transports/WebSocketClientTransport.ts`, `send` rejects a bound socket whose
   `readyState` is not `WEBSOCKET_READY_OPEN`, the unbound arm behaves as before, and no
   legitimate open-socket flow the shipped tests pin is rejected. Attack: find a socket state
   or ordering where the guard rejects a send the old code correctly delivered, or where a
   closed-channel send still resolves.
2. **The A3 pin's no-queue half is sound despite the missing red.** In
   `tests/src/browser/factories.test.ts`, the A3 row proves reject, no delivery, and no queue
   (reconnect plus the id-98 control). M3F could not record a red because the guarded line
   lives in `src/browser/transports/WebSocketClientTransport.ts`, off-limits to that unit; it
   instead measured the instrument's power with a removed probe row showing a queued pre-open
   send is flushed and delivered after reconnect. Attack the substitution: is there a defect
   shape in the browser face's `send` (a push before the throw) this row would fail to
   redden? Read the browser transport's `send` and `#flush` and rule whether the assertion on
   the received-id list would catch the auditor's named failing input.
3. **The M3F guide sentences state only what ships.** The two bounded WebSocket universals,
   the corrected clauses the report calls 16 and 17, and the pre-open row's new sentence in
   `guides/mcp.md`. Attack: find a sentence in the touched WebSocket clauses that claims
   behavior the code does not have, including the dead-peer bound and the two faces'
   divergence description.
4. **The fresh-listing clear is correct on both faces and cannot be tricked.** In both
   `src/server/transports/HTTPClientTransport.ts` and
   `src/browser/transports/HTTPClientTransport.ts`, a sent cursorless `tools/list` clears
   `#parameters` before caching, a continuation accumulates, and the clear fires only on a
   well-formed listing result. Attack: a malformed or refused listing that wrongly clears; a
   continuation wrongly clearing; a fresh listing that fails to clear; an interleaving of
   concurrent listings that leaves the table describing neither listing; the auditor's
   original interleaving still projecting.
5. **The bounded walk closes the paged-replacement escape without breaking the built-in.** In
   `src/server/handlers.ts`, the synthetic lookup follows `nextCursor` up to
   `MCP_LOOKUP_PAGES` (8, `src/core/constants.ts`), a cap hit or a streamed answer leaves the
   definition unfound (headers forwarded untouched), and the built-in unpaged registry answer
   is unchanged. Attack: a replacement listing shape that still smuggles an annotated tool
   past validation within the bound (a repeated cursor, a cycle, a non-string cursor, a
   stream on a later page); a way the walk changes behavior for a server that never replaced
   `tools/list`; the id-0 dispatch reaching anything beyond the `request` observation event.
6. **The observation documentation is honest.** `MCPServerEventMap.request` TSDoc in
   `src/core/types.ts` and the guide's HTTP section name the synthetic listing under reserved
   id `0`, including that the reservation is convention rather than enforcement. Attack: a
   claim in those sentences the dispatcher does not honor, or an observer-visible behavior of
   the walk the documentation omits (for example, that the listing now fires up to
   `MCP_LOOKUP_PAGES` times per call rather than once).
7. **The M2F cache and consumer-obligation guide rows are true.** The replaced cost sentence,
   the replace-versus-accumulate rule on both faces' clauses, and the claim-7 correction
   (re-list and retry now works for an omitted tool). Attack: any touched sentence in
   `guides/mcp.md` contradicted by the shipped transports or handler.
8. **Scope honesty.** Each diff names exactly the files its unit's report claims (M3F: the
   guide, the Node WS transport, its test file, the browser factories test file; M2F: the
   nine files its table names), and the implementation files contain no `any`, no non-null
   assertion, no `as` assertion, no ts-ignore family, no eslint-disable. The two explicit
   `unknown` locals in the walk are annotations, not assertions. Attack: grep the diffs and
   the touched source files for banned constructs and for an unlisted file.

## Output

Write nothing to disk. Return, as your final message: a numbered verdict per claim with
evidence and the attack, any finding outside the claims, and one terminal line in exactly this
shape:

VERDICT: PASS — 0 broken, N unresolved, M not-evidenced
or
VERDICT: FAIL — K broken, N unresolved, M not-evidenced
