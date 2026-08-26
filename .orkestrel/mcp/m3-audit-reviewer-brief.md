# Audit — the M3 round, subjective lane

Role and engine: `reviewer`, Claude Opus 5, native read-only subagent, subject repository
`/home/user/mcp` at commit `ce155db`, tree clean. You are the audit round's subjective
lane: design acceptance, API and vocabulary, architecture fit, guide voice, and
conceptual coherence — and for the parts another engine wrote, the round's
non-writer-lane coverage. You audit; you never edit, and you never accept — the
Orchestrator accepts.

The round's writers: M3-U1 (the client subscription engine, `src/core/**` and the test
rows) was written by GPT-5.6 Sol; M3-U1.1 (two import lines) by Sonnet; M3-U1.2 (the
drain reorder) and M3-U2 (the guide) by Claude Opus 5. Your engine did not write U1 or
U1.1 — attack those hardest; a separate Sol `analyst` lane covers the Opus-written parts
per the loop.

Before working, read: `/home/user/mcp/AGENTS.md`; the rules `.claude/rules/names.md`,
`.claude/rules/typescript.md`, `.claude/rules/patterns.md`, `.claude/rules/tests.md`,
`.claude/rules/documentation.md`, `.claude/rules/quality.md` (its Falsification law
governs your verdict shape); the guide `guides/mcp.md` §§ the subscription sections.

## Evidence set, all read-only

In `/home/user/scaffold/.orkestrel/campaign/`: the design record
(`m3-design-reconciliation.md`) with both lane rulings, the unit pairs
(`m3-u1-subscription-brief.md`/`-report.md`, `m3-u1.1-imports-brief.md`,
`m3-u1.2-drain-brief.md`/`m3-u1.2-drain-report.md`,
`m3-u2-guide-brief.md`/`m3-u2-guide-report.md`). The round's combined diff is
`git show ce155db` in `/home/user/mcp`. The host gate chain of 2026-08-26 over the
committed tree: every gate exit 0, the core suite at 1134 passed with 1 pre-existing
skip, the guides project at 142.

## The claims, numbered and falsifiable — rule on each with evidence

1. The landed contract equals the reconciled design exactly:
   `listen(notifications: MCPSubscriptionFilter | undefined, options: MCPListenOptions):
   MCPSubscriptionStream` with the required `signal` in a required bag, the optional
   `capacity` defaulting to `DEFAULT_MCP_SUBSCRIPTION_CAPACITY`, the
   `MCPSubscriptionStream` alias (no wrapper interface), and the vocabulary the design
   ruled — no synonym drift against the package's existing terms.
2. The behavioral surface matches the design's rulings, each pinned by a literal test
   row: acknowledgement first; owned frames in wire order; the validated terminal as the
   return value with a queued frame outranking a landed terminal; the empty-object wire
   defaulting; no timeout; the pre-aborted first read; abort's `notifications/cancelled`
   on the duplex carrier; loud overflow; disconnect and transport-loss rejection;
   late-stamped-frame discard with unstamped paths untouched.
3. The test instrument is honest: the loopback extension iterates real held-open answers
   from a real `createMCPServer` and its comment states the prior unary scenarios never
   produced that arm; the burst row was born red against the drain defect; the routing
   mutation control discriminates as recorded; no row asserts the implementation against
   itself.
4. The guide is true against the shipped code and complete for the surface: every new
   export documented, the methods table matching `MCPClientInterface`, the executable
   fence and its transcription proving what the prose promises, the two replaced gap
   entries stating the duplex-only limit and the partly-closed abort honestly, and the
   abandonment obligation stated. Rule also on the U2 observation the round carries: a
   `capacity` that is not a positive integer throws `MCPError` `-32602` on the first
   read, and no guide row states it — decide whether the surface owes that row or the
   refusal is below documentation grain, and say which.
5. The round stays inside the law: the combined diff touches only the units' owned
   files; no banned construct in any added line; the drain reorder's inline comment
   carries an invariant the code cannot show rather than reviewer-talk.

## Output

One verdict in the `orkestrel-falsify` shape: per-claim rulings — CONFIRMED, BROKEN,
UNRESOLVED, or NOT EVIDENCED — each with the exact evidence read or the exact command a
falsification needs, findings outside the claims if any, the claims you attacked and
could not break, and a single terminal line:
`VERDICT: PASS|FAIL — <n> broken, <n> unresolved, <n> not-evidenced, <n> findings outside the claims`.
No process diary.

## Constraints

Read-only tools (`Read`, `Grep`, `Glob`) — you carry no shell, so where a claim needs an
execution, name the exact command for the Orchestrator rather than inferring the result.
Perform the assignment directly and spawn nothing.
