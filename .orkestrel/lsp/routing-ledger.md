# Routing ledger — lsp reconciliation and improvement campaign, 2026-08-26

## Bench liveness, read at session start

- **Cursor Grok**: LIVE. Round-trip probe through the versioned entry
  (`2026.08.25-3e8eec8`, model `cursor-grok-4.6-high`) returned `READY`
  (`tmp/cursor/probe.log`).
- **Codex / GPT-5.6 Sol**: binary resolves (`codex-cli 0.149.1`) and `codex login status`
  reports "Logged in using ChatGPT" — but the user instructed this session that Codex is not
  available to them and that Grok substitutes for Sol. USER-EXCLUDED, not dark. No Codex model
  call was made. The login-state contradiction is surfaced to the user in the session report.

## Substitutions, each recorded with its authority

- **Objective lane engine**: Grok in place of Sol, by the user's explicit instruction. This
  deviates from the orchestration default ("Never assign Grok to either lane in Claude Code");
  the user's current instruction outranks the file. Mitigation ordered by the user and applied:
  Opus verdicts carry more weight, Grok verdicts are verified against source before adoption, and
  the Orchestrator decides.
- **Grok driver drafting**: the Orchestrator drafted the bench briefs and launched the bench runs
  directly instead of routing the drafting through the `grok` driver role. Reason: the driver
  role carries no Write tool, and on this Windows host inline heredocs trip the Git Bash approval
  classifier, so the driver cannot reliably write brief files. Every brief is still a file before
  its launch, every run is journaled under `tmp/cursor/`, and the bench ran one lane at a time.

## Lanes run

| Unit | Role/engine | Subject | Journal |
| ---- | ----------- | ------- | ------- |
| G1 | Grok (bench) | mcp package shape distillate | `g1.log` |
| G2 v2 | Grok (bench) | ecosystem capability and overlap distillate | `g2.log` |
| G3 | Grok (bench) | probe consumer distillate | `g3.log` |
| — | orkestrel (Sonnet native) | dependency reconciliation | session transcript; catalog-row claim corrected by the Orchestrator (`orkestrel.md:59` carries the lsp row) |
| G4 | struck | lsp self-map | superseded: the Orchestrator read all of `src/`, `guides/lsp.md`, and the test layout first-hand; the overlap item moved into G2 v2 |
| Design, subjective | planner (Opus 5 native) | design-brief.md verdicts | agent transcript |
| Design, objective | Grok (bench, user substitution) | design-brief.md verdicts | `g5-objective.log` |
| U0 | Grok (bench) | fleet-findings verification | `u0.log` |
| U1 | implementer (Opus 5 native; Sol excluded, recorded) | validators combinator adoption | `tmp/units/u1-report.md` |
| — | Orchestrator probe | cyclomatic-complexity readings over lsp and mcp | `complexity-probe.sh`, `complexity-probe-results.txt` |
| D2, subjective | planner (Opus 5 native) | parser decomposition verdicts | agent transcript |
| D2, objective | Grok (bench, user substitution) | parser decomposition verdicts | `d2-objective.log` |
