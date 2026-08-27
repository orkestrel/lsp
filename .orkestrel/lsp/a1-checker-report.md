# A1 checker lane — checker / Sonnet, 2026-08-26

Mechanical conformance over `2c0eba8..e5dfac7`. Retained from the agent's report; dispositions in
`campaign-audit-verdict.md`.

- PASS: `#releaseGeneration` absent from `src/` and `tests/`; no forbidden syntax in the touched
  core files (assertion forms, `any`, suppression directives all absent; `as const` sites are the
  permitted value form); U1's combinator sites match the ruling table verbatim; U2's exports,
  single remaining `'utf-16'` getter literal, and `#begin` derivation confirmed; U5's leaf set
  present with TSDoc and guide rows; `tmp/probe/` empty; the guide carries rows for all new
  exports.
- FAIL as reported, RULED NOT A DEFECT by the Orchestrator: `LSP_CAPABILITIES` has no `@example`
  — the constants convention in the file has none, parity requires examples for Surface
  functions, and the rule scopes `@example` to "where applicable". The dispatch's criterion was
  over-broad for constants.
- Named as not mechanically checkable with a Read/Grep/Glob toolset, settled by the Orchestrator
  with shell evidence: `package.json`/`package-lock.json` byte-identical across the campaign
  (empty diff); `tests/src/core/parsers.test.ts` byte-identical (empty diff); `git ls-files tmp`
  empty; `#cancelRequest` byte-identical between the endpoints (both bodies compared).
- Process note for the next audit dispatch: supply the diff and status evidence inside a
  read-only lane's brief, per the permission floor, or give the mechanical lane a shell-bearing
  role.
