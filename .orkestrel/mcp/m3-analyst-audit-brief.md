# Audit — the M3 round and its M3.1 repairs, objective lane

Role and engine: `analyst`, GPT-5.6 Sol, reached through `codex exec`, sandbox
read-only, working directory `/home/user/mcp` at commit `f0ad416` (the M3.1 repairs over
the M3 round's `ce155db`), tree clean. You are the audit round's objective lane:
correctness, constraints, and what the code and contracts actually permit. You audit;
you never edit, and you never accept — the Orchestrator accepts.

The round's writers: M3-U1 (the subscription engine) was written by GPT-5.6 Sol — your
engine; the Opus `reviewer` lane already audited it and its findings are settled. M3-U1.2
(the drain reorder), M3-U2 (the guide and transcription), and M3.1 (the repair round)
were written by Claude Opus 5 — the engine that is NOT yours. Attack those hardest; you
are the non-writer lane over them, and the fix-round law routes M3.1's audit to you.

Before working, read: `/home/user/mcp/AGENTS.md`; the rules `.claude/rules/names.md`,
`.claude/rules/typescript.md`, `.claude/rules/patterns.md`, `.claude/rules/tests.md`,
`.claude/rules/documentation.md`, `.claude/rules/quality.md` (its Falsification law
governs your verdict shape); the guide `guides/mcp.md` § Consume a subscription from a
client.

## Evidence set, all read-only

In `/home/user/scaffold/.orkestrel/campaign/`: the design record
(`m3-design-reconciliation.md`), the unit pairs (`m3-u1-subscription-brief.md` and
`-report.md`, `m3-u1.2-drain-brief.md` and `-report.md`, `m3-u2-guide-brief.md` and
`-report.md`, `m3.1-audit-repairs-brief.md` and `-report.md` with `m3.1-diff.txt` and
`m3.1-status.txt`), the reviewer verdict (`m3-audit-reviewer-verdict.md`), and the
Orchestrator's settling receipts (`m3-settling-receipts.md`) with the probe instruments
beside them. The diffs are `git show ce155db` and `git show f0ad416` in
`/home/user/mcp`. The host gate chains of 2026-08-26: over `ce155db`, every gate exit 0
with the core project at 1134 passed and 1 pre-existing skip and the guides project at
142; over `f0ad416`, every gate exit 0 with the core project at 1135 passed and 1
pre-existing skip and the guides project at 143.

## The claims, numbered and falsifiable — rule on each with evidence

1. The `listen` iteration (`src/core/MCPClient.ts`, the loop the U1.2 reorder shaped) is
   correct across every interleaving the code permits: failure preempts a queued frame
   and a landed terminal; a queued frame outranks a landed graceful terminal; a consumer
   parked on an empty queue when the terminal lands resolves with the terminal; a waiter
   never coexists with a queued frame; overflow, abort, disconnect, and late-frame
   behavior hold through the reorder; no path leaks a pending entry, a waiter, or an
   abort listener.
2. The guide section and its transcription are true against the shipped code after
   M3.1: the narrowed fence read type-checks against the installed declarations; the
   capacity clause states exactly what `src/core/MCPClient.ts:406-413` does, the
   send-ordering included; the transcription's narrowing is the fence's own expression
   rather than a diverging one.
3. The M3.1 pin row binds the no-timeout ruling: the row as written fails under a
   deadline registered on the subscription's pending entry and passes without one, its
   expectation is a literal frame rather than a value derived from the implementation,
   and no liveness race in it can pass a deadline-bearing client by accident.
4. The reviewer's F2 referral, yours to rule: `#routeSubscription` runs before
   `#reportProgress` and claims-and-discards any stamped notification whose id names no
   active subscription, so a `notifications/progress` frame carrying a stale
   `MCP_META_SUBSCRIPTION` stamp is dropped before the progress handler and never
   reaches the `notification` event. Rule whether that interleaving is reachable through
   the shipped server, and whether the ruled late-stamped-frame discard properly extends
   to progress frames or swallows a frame the progress contract owes. A defect ruling
   names the failing proof's exact shape; a conformant ruling names the code and design
   lines that close it.
5. The round and repair diffs stay inside the law: `git show ce155db` and
   `git show f0ad416` touch only the units' owned files, and no added line carries a
   banned construct.

## Host environment and bench limits

Linux container, network DENIED in your sandbox. Your sandbox is read-only: a vitest run
fails on Vite's transient writes, so where a claim needs an execution, name the exact
command for the Orchestrator rather than inferring the result — the settling receipts
show the shape such commands take. Nested `git` invocations from a spawned tool can
report "not a git repository" while your own `git` reads succeed; that is the sandbox.

## Execution

You are the bench engine reading this brief inside your own CLI: do the work yourself,
directly, and spawn nothing beyond the read-only shell commands your audit needs.

## Output

Your final message is one verdict in the `orkestrel-falsify` shape: per-claim rulings —
CONFIRMED, BROKEN, UNRESOLVED, or NOT EVIDENCED — each with the exact evidence read or
the exact command a falsification needs, findings outside the claims if any, the claims
you attacked and could not break, and a single terminal line:
`VERDICT: PASS|FAIL — <n> broken, <n> unresolved, <n> not-evidenced, <n> findings outside the claims`.
No process diary.
