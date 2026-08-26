# Unit m2-audit — reviewer lane over the M2 input continuation

Role and engine: `reviewer`, Claude Opus 5, native subagent, clean context. You hold the audit
lane over the M2 unit (written by the GPT-5.6 Sol bench implementer; you are the engine that
did not write it). You perform this audit directly and spawn nothing. You carry no edit or
write tools; every claim you cannot settle from the supplied evidence is UNRESOLVED with the
exact scriptable scenario for the Orchestrator to run on the host. Never attribute a runtime
claim to a run you could not take.

Before ruling, read in order: `/home/user/mcp/AGENTS.md`;
`/home/user/mcp/.claude/rules/quality.md` § Falsification and § Rounds and verdicts; the skill
`/home/user/scaffold/.agents/skills/orkestrel-falsify/SKILL.md` and its required references;
the unit pair in `/home/user/scaffold/.orkestrel/campaign/` —
`m2-input-continuation-brief.md` (the binding prescription, including the ruled option shape)
and `m2-input-continuation-report.md` (a claim set to break) — and the acceptance record
`m2-acceptance.md`.

Evidence: the committed diff at `/home/user/scaffold/tmp/units/m2-diff.txt` (the full
`git show` of mcp commit `fa11c89`), the empty post-commit status at
`/home/user/scaffold/tmp/units/m2-status.txt`, and the tree at `/home/user/mcp`, clean at
`fa11c89`. The Orchestrator's independent host acceptance, 2026-08-26: `format:check`,
`lint:check`, `check`, `build`, and `npm test` all exit 0 (`GATE_CHAIN_GREEN`), the guides
project 139 passed including the stdio transcription, the `src:core` project green including
the loopback HTTP rows the bench sandbox refused.

## Claims to falsify

1. The option shape is the ruled one: `MCPCallOptions` gains `input` with `state: string` and
   `responses: Readonly<Record<string, unknown>>` required together, no other member moves,
   and the TSDoc no longer claims a two-leaf surface while stating the required-together rule
   and the byte-identical `arguments` obligation. Attack the type boundary: can a caller
   place the pair apart through the public types, and does any other door (`resource`,
   `prompt`, the legacy transport) change shape it must not?
2. The wire placement is exact: with the group, `call` produces `params` carrying
   `requestState` and `inputResponses` as top-level siblings of `name` and `arguments`, never
   nested and never under `_meta`; without the group, neither key appears; and the caller's
   `arguments` reference is placed as given (no copy, no mutation). Attack the spread's
   interaction with `_meta` stamping in `#request` and with the progress-token path.
3. The behavioral rows bind: the recorder placement row, the real-server continuation row,
   and the changed-arguments digest-refusal row each fail for the defect they name — judge
   from what each asserts, and name any assertion a wrong implementation would still pass.
4. The guide fence at `guides/mcp.md:1177` is true against the shipped code: the imports
   resolve through `@orkestrel/mcp`, the retry reuses the same `name` and the same
   `arguments` value, and no sentence in the continuation section survives from a shape that
   lost. Recompute any value a comment claims.
5. The diff stays inside the law and the owned scope: no banned construct, the report's
   legacy-transport reading (`modernInvocationToLegacy` copies every non-`_meta` top-level
   parameter, `src/core/helpers.ts:850-865`) is true as cited, and the status is empty.

Number any finding fitting no claim under its own heading, per the skill.

Your final message is the immutable verdict: numbered per-claim verdicts, each CONFIRMED,
BROKEN, UNRESOLVED, or NOT-EVIDENCED with `file:line` evidence; findings outside the claims
under their own headings; the claims you attacked and could not break; and one terminal line
in the skill's shape (`VERDICT: PASS|FAIL — n broken, n unresolved, n not-evidenced,
n findings outside the claims`). No process diary.
