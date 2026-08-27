# P4 — probe fix round: the A-P audit's accepted findings

- **Role and engine**: `implementer`, Opus 5, native. Writing unit, sole writer in the probe main
  checkout. This is a fix round: the findings below were reconciled from a blind adversarial
  audit (`ap-reconciliation.md` beside this brief); where a fix is prescribed, adopt it verbatim;
  the one design departure is stated as a ruling.
- **Objective**: every accepted finding lands; the guide's claims about the wire shape become
  true; the fallback preserves the receipt at every size and is proven by a test.

## Context

- Repository: `C:\Users\mikes\WebstormProjects\probe`, `main` at `63a9d9b`, clean. Commit
  nothing. Never touch `tmp/worktrees/` or `package.json`/`package-lock.json`.
- Read first: `AGENTS.md`, `.claude/rules/writing.md`, `.claude/rules/documentation.md`,
  `.claude/rules/tests.md`. The audit verdicts:
  `C:\Users\mikes\WebstormProjects\lsp\.orkestrel\campaign\mcp-readiness\ap-subjective-verdict.md`
  and the objective journal at
  `C:\Users\mikes\WebstormProjects\probe\tmp\worktrees\audit-p1\tmp\audit\objective.log`
  (read-only).
- Arithmetic of record (both lanes agree): a serialized `prove` result costs 44 keys plus 11 per
  issue; the server's published key bound is `PROBE_KEYS` (4096), so the record travels up to
  368 issues; the content byte bound is 4 MiB.

## Fixes

1. **Graduated fallback (ruling).** In `ProbeServer.#execute`: carried record → rendered text →
   a minimal `MCPCallResult` whose single text block carries the verdict's identity, digest,
   reason, and the closing receipt line (`receipt <token>` or `no receipt`), each arm admitted
   by the same bounds before it is returned. Build the minimal block's text through a new
   exported helper in `src/core/helpers.ts` (single-word-per-property laws do not bind a helper;
   name it in the `{verb}{Noun}` form, for example `formatReceipt`), reusing the exact line
   `formatVerdict` closes with — one implementation of the receipt line, not two. The minimal
   form's boundedness is constructible (a handful of keys, short strings); still check it and,
   where even it is refused, return it anyway as the last arm — its size cannot exceed the
   bounds a working server publishes, and a comment states that invariant.
2. **The comment and guide claims become true.** Rewrite the `#execute` comment and the guide's
   fallback sentences to the graduated behavior. Correct the three false sentences the audit
   named, in every home each has:
   - the byte-bound sentence (`guides/probe.md` around `:525`, `src/core/constants.ts` TSDoc
     around `:120`, `src/server/ProbeServer.ts` comment around `:64`): the published bound
     carries a record of up to 368 issues, past which the reply falls back to the text, then to
     the receipt block;
   - the client sentence (`guides/probe.md` around `:506`): the `@orkestrel/mcp` client's
     outcome carries the record alone and drops the content blocks; a caller wanting the
     rendered form calls `formatVerdict` from `@orkestrel/probe` on the record, or reads the
     text block off the raw wire;
   - the receipt paragraph (`guides/probe.md` around `:501-507`): name `verdict.receipt` as
     where a structured-content client reads the outcome, and scope the last-line instruction
     to the text block. Add `verdict.receipt` to the structured fields it enumerates.
   - the `PROBE_KEYS` Surface row: match the TSDoc's bound description (`_meta` is metadata,
     not content).
   - Add one sentence where the guide documents the bound: the published key bound also widens
     the inbound `_meta` key bound, deliberately — bytes and depth still bind, and the stdio
     parent is the trusted harness.
3. **The wide-drive proof (prescription).** A new test drives a control whose type stage
   produces past-368 issues (extend the existing `Array.from` generator to length 400 or more)
   through `ProbeServer`'s own dispatcher or the shipped bin, asserting: no `structuredContent`;
   exactly one text block; its last line matches the receipt pattern; no `-32603`. Also pin the
   graduated third arm: a run whose rendered text exceeds the bounds answers the minimal
   receipt block — reach it the cheap way both lanes named, by seeding the bound rather than
   forty-seven-thousand issues: drive `#execute`'s composition with a server whose
   `limit: { keys: … }` is small (a fixture-level bound, not an edit to `PROBE_KEYS`), or
   construct the oversized rendered text directly at the seam your test reaches. Record
   failing-first where a fix changes behavior.
4. **F1 (prescription).** `ProbeServer` holds the composed server in a `#` field and derives its
   bounds from that server's `limit` getter (mapping `content` to `bytes`) instead of the
   `#limits` second copy. One number decides both admissions; delete the drifting copy.
5. **P2 residue (prescriptions).** Delete the duplicated explanation comments at
   `src/server/stages/LintStage.ts:55-59` and `src/server/ProbeServer.ts:58-66` (the constants'
   TSDoc is the single home). Drop the rename-only `LintStage.#deadline` field; read
   `LINT_DEADLINE` at both use sites. Migrate the un-migrated literals: `{ keys: 4096 }` in
   `tests/src/server/ProbeServer.test.ts` (around `:360`) reads `PROBE_KEYS`; the `2_000`
   assertions in `tests/src/server/stages/LintStage.test.ts` (around `:659`, `:698`) read
   `LINT_DEADLINE`, and the "2 s" prose comments name the constant.
6. **F2 (prescription).** `LINT_DEADLINE` TSDoc reads: "Measured 2026-08-27: the workspace
   `oxlint --lsp` answers `initialize` in 155 ms, so this bound is more than ten times that
   reply." No agent-role vocabulary, no evaluative claim.
7. **Objective lane's finding (prescription).** The bound rows in
   `tests/src/server/ProbeServer.test.ts` that today pin a hand-built `createMCPServer` drive
   `ProbeServer`'s real composition instead, so they read the wiring the package ships. Keep a
   row pinning the installed default (64) only if it is reframed as what it is — a pin on the
   dependency's default, named as such.
8. **The `readCall` nit**: annotate the parse result `unknown` in both test helpers.

## Scope

- Owned: `src/server/ProbeServer.ts`, `src/server/stages/LintStage.ts`, `src/core/helpers.ts`,
  `src/core/constants.ts` (TSDoc only), `tests/src/server/ProbeServer.test.ts`,
  `tests/src/server/stages/LintStage.test.ts`, `tests/src/bin/main.test.ts`,
  `tests/src/core/helpers.test.ts` (the new helper's proof), `guides/probe.md`.
- Off-limits: everything else. `src/core/types.ts` only if the new helper needs a declared
  type — state it in the report if so.

## Execution

Perform the assignment directly and spawn nothing. TTTDD; failing-first for every behavioral
change with exact commands and counts. Validate scoped: `npm run check`, scoped oxlint and
oxfmt `--check` on owned files, `npm run test:src:core`, `npm run test:src:server`,
`npm run test:src:bin` (after `npm run build:src:server`), `npm run test:guides`,
`npm run test:policy`. No tree-wide `format`, `lint --fix`, or `build`.

## Output

Report to `tmp/units/p4-report.md` and as your final message: per-finding landing (fix, evidence,
counts), the failing-first records, the exact new invariant sentences, and any claim you could
not close.

## Deviation contract

Stop and report when: the graduated third arm cannot be reached by any seam the owned files
offer; deriving bounds from the server's `limit` getter is impossible at construction order; or
a test outside the owned files reddens. Ancillary choices (helper naming within the stated form,
test naming, comment wording) are yours to decide and record.

## Acceptance criteria

1. Every fix row above landed or reported as a deviation; no finding silently dropped.
2. Failing-first records for the wide drive and the third-arm pin.
3. The guide's fallback, client, and receipt sentences are true against the shipped code, and
   `test:guides` is green.
4. All scoped runs green.
