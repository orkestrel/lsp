# A-M3 — falsification of the WebSocket closed-send unit

You are the objective cross-engine lane auditing a unit written by Opus. Attempt to refute every
claim from source; you cannot execute — rule from the code and the supplied evidence, marking
`UNRESOLVED` what only a run could settle. `CONFIRMED` requires naming the attack you tried that
failed. Edit nothing, spawn nothing. Rooted in a detached worktree at the audited commit; the
main checkout is out of bounds.

## Subject

mcp `bf21ac9` (M3): closed-channel `send` rejection on the browser WebSocket client and the
server-side carrier, the pump's disconnect handling pinned, the guide's WebSocket sections. The
commit includes the Orchestrator's serial integration of the returned A3 patch. Evidence beside
this brief: `m3.diff`, `m3-report.md` (testimony; run counts writer-produced except the browser
61-green, which the Orchestrator ran).

## Claims

1. The rejection state matrix is exact on both faces: closed transport, and a socket reporting
   `CLOSING`/`CLOSED` (browser) or not `WEBSOCKET_READY_OPEN` (server), reject; no socket yet
   and `CONNECTING` still queue on the browser face, and the queue flushes in order on open.
   Attack a state the matrix mishandles (for example a send racing the open event, or a socket
   present but `CONNECTING` on the server face).
2. The socket-state second source is read correctly: the browser face's numeric `readyState`
   comparisons match the WHATWG constants; the server face's comparison matches the installed
   `@orkestrel/websocket` wrapper's declared states.
3. The report's pump reading is true from source: `bindServer` wraps `send` totally and routes a
   rejection to the server emitter's `error`; the disconnect path aborts live requests so a
   departed peer is answered by no write; `sendStream` propagates to the same catch after
   disposal; `bridgeMessageTransport.send` rejects rather than absorbing.
4. The A3 replacement pins what its name claims (reject, no queue, no delivery), and no other
   existing assertion's product meaning changed in the diff.
5. The guide's added sentences are true against the shipped code: the rejection paragraphs on
   both faces, the non-normative-transport sentences in both sections, and the corrected
   clause 16 fault surface (`mcp.emitter`'s `error`, not the transport's).
6. The plain-`Error` ruling conforms to the package taxonomy: `MCPError`'s TSDoc, the guide's
   sentence, and the sibling transports all treat local disconnects as plain `Error`s, and the
   landed wording matches the Node client's exactly.
7. Scope honesty: the diff touches exactly the six files (five owned plus the integrated A3
   patch); no banned construct.
8. The writer's sound-and-unchanged verdicts hold. Attack at least: "no source change was
   needed for task 2" (find a pump path a rejecting send breaks that the reading missed), and
   the dead-peer observation (destroying the far end leaves `readyState` 1 and no `close` —
   check the wrapper's source for a signal the observation missed). Say how many you attacked.

## Verdict shape

Numbered verdicts (`CONFIRMED` with the failed attack / `BROKEN` with the exact failing input,
state, or interleaving plus the smallest fix / `UNRESOLVED` with what would settle it /
`NOT-EVIDENCED`), findings outside the claims to the `BROKEN` standard, then exactly one
terminal line in the standard `VERDICT: PASS|FAIL` form. No process diary.
