# Unit w1-audit — reviewer lane over the W1 progress reshape

Role and engine: `reviewer`, Claude Opus 5, native subagent, clean context. You hold the audit
lane over the W1 unit (written by the GPT-5.6 Sol bench implementer; you are the engine that
did not write it). You perform this audit directly and spawn nothing. You carry no edit or
write tools; every claim you cannot settle from the supplied evidence is UNRESOLVED with the
exact scriptable scenario for the Orchestrator to run on the host. Never attribute a runtime
claim to a run you could not take.

Before ruling, read in order: `/home/user/workflow/AGENTS.md`;
`/home/user/workflow/.claude/rules/quality.md` § Falsification and § Rounds and verdicts; the
skill `/home/user/scaffold/.agents/skills/orkestrel-falsify/SKILL.md` and its required
references; the unit pair — the brief at
`/home/user/scaffold/tmp/codex/w1-progress-brief.md` (the binding prescription) and the report
at `/home/user/scaffold/tmp/codex/w1-progress-report.md` (a claim set to break).

Evidence: the committed diff at `/home/user/scaffold/tmp/units/w1-diff.txt` (the full
`git show` of workflow commit `b00af86`), the empty post-commit status at
`/home/user/scaffold/tmp/units/w1-status.txt`, and the tree at `/home/user/workflow`, clean at
`b00af86`. The Orchestrator's independent host acceptance, 2026-08-26: `format:check`,
`lint:check`, `check`, `build`, and `npm test` all exit 0 (`GATE_CHAIN_GREEN`). The ruled
reference shape is the MCP progress notification as `@orkestrel/mcp` types it — read it for
corroboration at `/home/user/mcp/src/core/types.ts` (the progress notification members) —
carried structurally, never as a dependency: the `package.json` file is off-limits to the
unit and its diff must not touch it.

## Claims to falsify

1. The type shape is the ruled one: `TaskProgress` carries exactly `progress` (required
   number), `total` (optional number), and `message` (optional string), readonly, structurally
   matching the MCP progress notification's member set; the `unit` member is gone from the
   progress surface with no compatibility path, no second progress-like shape survives, and
   `RunnerEventMap.unit` is a pre-existing member outside the progress surface that the diff
   lawfully leaves. Attack residual members, optionality drift, and any shim.
2. The validator binds the bounds: it refuses a non-finite `progress`, a negative `progress`,
   a `total` below `progress` or non-finite, an empty `message`, and the removed `unit`
   member as an unknown key — judge each row from what it asserts and from the validator's
   actual refusal mechanism, and name any assertion a wrong implementation would still pass.
3. The consumer sweep is complete and honest: re-run the report's patterns
   (`rg -n '\.(current|unit)\b' src` and `rg -n '\b(current|unit)\s*[:?]' src`) against the
   committed tree and rule on every hit; no progress consumer outside the diff still reads
   the removed members, and the cloner and fixtures carry the shape.
4. The guide is true against the shipped code: `guides/workflow.md` documents
   `{ progress, total?, message? }`, no sentence survives from the
   `{ current, total?, unit? }` shape, and the existing parity coverage lawfully accepted the
   edit without a `tests/guides.test.ts` change.
5. The diff stays inside the law and the owned scope: no banned construct, only the owned
   files move (`guides/workflow.md`, `src/core/types.ts`, `src/core/validators.ts`,
   `src/core/cloners.ts`, `tests/setup.ts`, `tests/src/core/validators.test.ts`,
   `tests/src/core/cloners.test.ts`, `tests/src/core/tasks/Task.test.ts`), the status is
   empty, and the report's red-first evidence coheres with the diff (the baseline red
   `3 failed | 787 passed` against the renamed expectations, the after-run
   `790 passed`).

Number any finding fitting no claim under its own heading, per the skill.

Your final message is the immutable verdict: numbered per-claim verdicts, each CONFIRMED,
BROKEN, UNRESOLVED, or NOT-EVIDENCED with `file:line` evidence; findings outside the claims
under their own headings; the claims you attacked and could not break; and one terminal line
in the skill's shape (`VERDICT: PASS|FAIL — n broken, n unresolved, n not-evidenced,
n findings outside the claims`). No process diary.
