# Check brief: m4-audit-checker — the M4 round's mechanical criteria

## Role and engine

`checker` — Sonnet, native, read-only. Mechanical conformance evidence only: you verify
countable, greppable, comparable facts and report them with the command-shaped evidence a
reader can re-run. You rule on no design or correctness question.

## Objective

Verify the M4 round's mechanical acceptance criteria in `/home/user/mcp` at commit
`c2a35d4`, branch `claude/lsp-spec-audit-est33d`, tree clean.

## Evidence slice

- The vendored schema: `/home/user/mcp/tests/mirrors/ext-tasks-2026-07-28-schema.json`.
- The conformance rows: `/home/user/mcp/tests/setupConformance.ts` and
  `/home/user/mcp/tests/conformance.test.ts`.
- The guide: `/home/user/mcp/guides/mcp.md`.
- The commit captures under `/home/user/lsp/tmp/units/`: `m4-commit-f1632ad.txt`,
  `m4-commit-2b823f9.txt`, `m4-commit-bc54b38.txt`, `m4-commit-bef9f40.txt`,
  `m4-commit-0fe1879.txt`, `m4-commit-c2a35d4.txt`.
- The unit briefs and reports under `/home/user/lsp/.orkestrel/mcp/` for the ownership
  lists: `m4-era-brief.md`, `m4-contract-brief.md`, `m4-mirror-brief.md`,
  `m4-stream-brief.md`, `m4-proof-brief.md`, `m4-guide-brief.md` and their reports.

## Checks, each reported with its evidence

1. **Mirror membership.** Enumerate the schema's `$defs` member names from the vendored
   JSON and the row subjects in `tests/setupConformance.ts`; report any `$defs` member
   with no row and any row with no `$defs` member, by name.
2. **The six symbols.** Each of `MCPNotificationMetaObject`, `MCPTaskDetailResult`,
   `MCPTaskNotificationParams`, `isMCPNotificationMetaObject`, `isMCPTaskDetailResult`,
   and `isMCPTaskNotification` appears in a surface table row of `guides/mcp.md`; report
   the line for each.
3. **Era residue.** Case-insensitive occurrence lists for `draft`,
   `stability guarantee`, and `specification/` over `src/`, `tests/` excluding
   `tests/mirrors/`, and `guides/mcp.md`; report every hit with its line, ruling none —
   the objective lane rules senses, you report the population.
4. **Scope honesty, mechanical.** For each commit capture, list the files it touches and
   compare against the owned-files list in its unit's brief; report any file outside its
   list, by commit and path.
5. **The carried finding.** Confirm the banned `simply` still sits on
   `guides/mcp.md:325` (or report its current line), as the recorded carried finding —
   report only, no ruling.

## Output

Write the report to `/home/user/lsp/tmp/units/m4-audit-checker-report.md`: each check
with its evidence and a per-check `MATCH` / `MISMATCH` / `REPORTED` status. Your final
message is the per-check status list and any mismatch's exact names. You edit nothing
and run nothing mutating.
