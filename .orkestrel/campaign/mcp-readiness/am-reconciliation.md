# A-M reconciliation (Orchestrator, 2026-08-27)

Lanes: objective (Grok/bench, FAIL — 2 broken) and subjective (`reviewer`/Opus on its own
engine's work, FAIL — 6 broken, 4 findings). The subjective lane's extra breaks are all
substantiated and four were Orchestrator-reproduced in source (the ungated port forward at
`MCPServer.ts:686-694`; the `{ elicitation: {} }` URL refusal loop at `helpers.ts:141-144`; the
retry door's `-32602` at `MCPServer.ts:1080-1086`; the nested function at
`setupConformance.test.ts:249`). Where the lanes disagree, the subjective lane answered a
sharper question; no averaging.

## Accepted findings → fix unit MF2

1. **Gate the port doors.** `#prompt` and `#resource` run the forwarded `MCPInputResult`'s
   `inputRequests` through the same `#gate` before stamping. M4's rule binds the wire, not one
   method; the ports ship the server's wire. (Both-lane referral settled by the spec row: MRTR
   permits `InputRequiredResult` on those methods, and M4's MUST-NOT-send binds every issuer.)
2. **Widen sampling to the pinned schema.** `MCPSampleResult.content` becomes the mirror's
   union (text/image/audio blocks, tool-use, tool-result, and a readonly array of sampling
   blocks); `isMCPSampleResult` follows; the three prose sites stop claiming the schema says
   otherwise. Root URIs: `isMCPRoot` applies `isAbsoluteURI` (the same `format: uri` treatment
   the package gives the elicitation `url`).
3. **The URL refusal loop.** `missing['elicitation'] = { url: {} }` in the URL branch; the
   pinned loop test becomes the fix's regression row asserting the actionable payload; the
   guide's refusal sentence names the URL case.
4. **One reading for an unparsable modern context.** SEP-2575 fixes bad or missing `_meta` at
   `-32602`; the retry door is already there. The unit reads the first door's reachability (a
   legacy-projected request arrives with STAMPED `{}` capabilities and still gates `-32021`,
   which is right — the question is only the genuinely unparsable-context arm) and lands one
   consistent reading with the guide's failure taxonomy updated and the wire change declared.
5. **Stale references, all named sites**: three dead anchors; `tests/setup.ts:381` TSDoc; the
   `MCPServer.test.ts:1612` suite name; the `elicit` control identifiers; the unescaped union
   pipes in the `MCPInputResponse` table row; the deprecated-carrier and server-keyed cells;
   `MCPElicitURL` "not produced here".
6. **Guide conformance narrative** derives from the recorded table or states `[102, 8]` with
   `server-stateless` and `http-custom-header-server-validation` named and caused.
7. **`round` option key renamed to `selector`** — noun key matching the package's own prose
   ("the selector") and the sibling noun keys (`continuation`, `ttl`, `principal`); frees
   `round` to mean only `MCPInputRound`. (Orchestrator's naming ruling over the lane's
   `select`.)
8. **F3 coupling sentence** — round size consumes `limit.state`; one sentence in the
   protected-state paragraph.
9. **F4** — the input-policy section documents URL mode as a composable arm with the
   `elicitation.url` declaration it requires.
10. **The nested function hoists**; the two pre-existing instances (`tests/setupServer.ts:536`,
    `tests/src/server/transports/StdioServerTransport.test.ts:458`) are a carried finding, not
    this unit's.
11. **Wording**: "byte-exact" state claims become value-identical-through-canonical-
    serialization wherever written; the `MCPLegacy` fixture round becomes minimal with a
    comment saying it is never issued on that path.

## Closure

MF2 is written by Opus (Sol excluded). Prescription-verbatim rows close by mutation probe;
rows 1, 4, and 7 are design-bearing and get the cross-engine check: Grok rules on the diff and
on Orchestrator-produced run records. MF2 queues behind MC in the mcp checkout.
