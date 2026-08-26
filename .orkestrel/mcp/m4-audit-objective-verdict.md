# m4 round — objective lane verdict (Grok), verbatim with the driver's return

Lane: objective audit, engine Cursor Grok, taking the lane in GPT-5.6 Sol's place under
the user's corrected 2026-08-26 ruling (routing ledger). Brief:
`mcp/tmp/cursor/m4-audit-objective-brief.md`, retained beside this file as
`m4-audit-objective-brief.md`. Subject: the Opus-written units (`m4-era`,
`m4-contract`+`.1`, `m4-proof`, `m4-guide`) at head `c2a35d4`. Returned 2026-08-26. The
Orchestrator's per-hit source confirmation and the reconciliation are in
`m4-round-audit-verdict.md`.

## The driver's return

Bench ran live — `agent --version` reported `2026.08.11-e8db854`, the login check
reported the account logged in. Launched through `mcp/tmp/cursor/run-m4-audit.sh`
(resolved `agent -p --trust --mode=ask --model cursor-grok-4.6-high`), journaled to
`mcp/tmp/cursor/m4-audit-objective.log` (5667 bytes, process pid 11594, roughly 480s
elapsed). The `agent -p` transport buffers its answer rather than streaming, so the long
silent window is the transport's shape, not a stuck bench. Containment held: the mcp
tree read clean throughout. No deviation.

## Grok's verdict, verbatim

```
1. CONFIRMED. [era-sweep completeness — draft/stability-guarantee patterns swept clean over src/, tests/, guides/mcp.md]
2. CONFIRMED. [contract drift repairs match schema — ttlMs/pollIntervalMs integers, open completed result, empty capability, distinct tasks/get shape]
3. CONFIRMED. [proof rows bind — admission expression and resolution loop each occur once, load-bearing, counts coherent]
4. CONFIRMED. [guide delivery sentences match code — authorize-and-omit, fixed agreed set, no delivery-time store read, -32602 malformed rejection, no distinguishing signal]
5. CONFIRMED. [scope honesty — each commit capture touches only its unit's claimed files, no cross-unit contradiction]
6. BROKEN. [prose sweep — count/ordinal-ban violations found in guides/mcp.md added lines: "the two options", "all three", "the same two", "third argument" (x2), "the two doors", "how the two compose", "one unit"]

VERDICT: FAIL -- 1 broken, 0 unresolved, 0 not-evidenced, 0 findings outside the claims
```
