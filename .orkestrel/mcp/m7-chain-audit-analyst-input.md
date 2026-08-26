# Lane dispatch — objective audit of the mcp client era boundary

Role and engine: `analyst`, GPT-5.6 Sol, reached through `codex exec`, sandbox `read-only`,
working directory `/home/user/mcp`. You hold the OBJECTIVE lane of this audit round —
correctness, constraints, what the code and both protocol revisions actually permit. The Sol
engine wrote the subject: attack hardest where agreeing would be easiest. You perform this audit
directly and spawn nothing. You edit nothing; your sandbox refuses writes, and a probe you cannot
run is an UNRESOLVED verdict carrying the exact scriptable scenario for the Orchestrator to run
at reconciliation. The sandbox also denies loopback listeners, so the socket rows are readable
evidence, not runnable ones.

Open and follow the audit brief at `/home/user/scaffold/tmp/units/m7-audit-brief.md`. It names
the subject (mcp commits `06d7f4a`, `33be98b`, `e5ac674` from baseline `a379b08`), the numbered
claims to falsify, and the evidence: the combined diff at
`/home/user/scaffold/tmp/units/m7-chain-diff.txt`, the status at
`/home/user/scaffold/tmp/units/m7-chain-status.txt`, the tree at `/home/user/mcp` clean at
`e5ac674`, and the retained unit pairs in `/home/user/scaffold/.orkestrel/campaign/`.

Before ruling, read in order: `/home/user/mcp/AGENTS.md`; `/home/user/mcp/.claude/rules/quality.md`
§ Falsification and § Rounds and verdicts; the skill
`/home/user/scaffold/.agents/skills/orkestrel-falsify/SKILL.md` and its required references; then
the brief and its evidence. The guide under audit is `/home/user/mcp/guides/mcp.md`. Claim 9 and
the ruling on the Orchestrator-written pin inside claim 8 are yours.

Your final message is the immutable verdict: numbered per-claim verdicts, each CONFIRMED, BROKEN,
UNRESOLVED, or NOT-EVIDENCED with `file:line` evidence; findings outside the claims under their
own headings; one terminal line in the skill's shape
(`VERDICT: PASS|FAIL — n broken, n unresolved, n not-evidenced, n findings outside the claims`).
No process diary.
