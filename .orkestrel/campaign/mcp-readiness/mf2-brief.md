# MF2 — mcp fix round: the A-M audit's accepted findings plus the stateless-retry seam

- **Role and engine**: `implementer`, Opus 5, native. Writing unit, sole writer in the mcp
  checkout. Fix round: adopt prescribed fixes verbatim; the design rulings below are fixed.
- **Objective**: every accepted A-M finding lands; the MRTR surface tells the truth in types,
  code, tests, and guide; the client can answer a stateless round.

## Context

- Repository: `C:\Users\mikes\WebstormProjects\mcp`, clean `main` at `ab5cd27` (MC landed the
  client-conformance harness). Commit nothing. Never touch `tmp/worktrees/`.
- Read first: `AGENTS.md`, `.claude/rules/typescript.md`, `.claude/rules/names.md`,
  `.claude/rules/tests.md`, `.claude/rules/documentation.md`. The audit record:
  `C:\Users\mikes\WebstormProjects\lsp\.orkestrel\campaign\mcp-readiness\am-reconciliation.md`
  plus both verdicts beside it (`am-objective-verdict.md`, `am-subjective-verdict.md`), and
  MC's finding in `tmp/units/mc-report.md` § "The `sep-2322` red is a product finding".
- The schema authority is the pinned mirror `tests/mirrors/ext-tasks-2026-07-28-schema.json`.

## Fixes (rulings fixed; mechanics yours)

1. **Gate the port doors.** `#prompt` (`MCPServer.ts:686-694`) and `#resource` (`:534-542`) run
   a forwarded `MCPInputResult`'s `inputRequests` through the same capability gate before
   stamping; a round the client's declared capabilities exclude refuses `-32021` with the
   actionable payload. Measure the conformance consequence honestly: if
   `input-required-result-non-tool-request` moves, record its new tally with the runner's
   message and report it — do not force the row either way.
2. **Widen sampling to the pinned schema.** `MCPSampleResult.content` becomes the mirror's
   union — the three blocks, tool-use, tool-result, and a readonly array of sampling content
   blocks (mirror `:1858-1881`); `isMCPSampleResult` follows; the TSDoc at `types.ts:858-862`,
   the guard prose at `validators.ts:1908-1911`, and the guide row stop claiming the schema
   narrows it. `isMCPRoot` applies `isAbsoluteURI` to `uri` (the mirror's `format: uri`, the
   same treatment the elicitation `url` gets).
3. **The URL refusal payload becomes actionable**: `missing['elicitation'] = { url: {} }` in
   the URL branch (`helpers.ts:143`); the pinned loop row becomes the regression row asserting
   the actionable payload; the guide's refusal sentence names the URL case.
4. **One reading for an unparsable modern context.** SEP-2575 fixes bad or missing `_meta` at
   `-32602`. The retry door is already there (`MCPServer.ts:1080-1086`). Read the first door's
   arms: a legacy-projected request arrives with STAMPED `{}` capabilities (parsed context) and
   correctly gates `-32021`; the genuinely unparsable-context arm (`context?.capabilities`
   reading `undefined`) answers `-32602` like the retry door. Land the consistent reading,
   declare the wire behavior in the guide's failure taxonomy, and pin both doors with tests.
5. **The stateless retry (MC's finding).** `MCPCallOptions.input.state` becomes optional
   (`state?: string`); the client's retry includes `requestState` exactly when present and
   never otherwise (spec M5); `#retry` on the server side already models the optional field —
   verify and pin. Failing-first instrument: the recorded client-conformance row
   `sep-2322-client-request-state` at `4 passed, 1 failed` moves to `5 passed, 0 failed` —
   update the baseline row with the run recorded red-then-green, and extend
   `tests/conformanceClient.ts`'s input round answering if the driver needs the stateless arm
   (it reports the seam today; MC's report names the spot).
6. **Rename the `round` option key to `selector`** (`MCPInputOptions`), matching the package's
   own prose and the sibling noun keys; `MCPInputRound` stays the round. Update every consumer:
   the fixture (`tests/setupConformance.ts`), `tests/setup.ts` (whose TSDoc at `:381` still
   names `elicit` — fix that sentence too), and every test naming the key.
7. **Stale references, every named site**: the three dead anchors (`guides/mcp.md:532`, `:796`,
   `:3178` → `#ask-the-client-for-input-during-the-call-in-hand`, link text matching the
   heading); the `MCPServer.test.ts:1612` suite name; the `'elicit provider detail'` and
   `['elicit', 'principal']` control identifiers; the unescaped union pipes in the
   `MCPInputResponse` guide table row; the deprecated-carrier cells (`:2072`, `:2206`); the
   "server-keyed" map cells (`:2073`, `:2207`, `:2212`, `:2216`); `MCPElicitURL` "not produced
   here" (`:2202`).
8. **The guide's conformance narrative** (`:3960-3963`, `:4011`) states the current recorded
   baseline with the failing scenarios named and caused, or derives from the recorded table —
   no "no remaining failing scenario" claim while the table records reds.
9. **F3**: one sentence in the protected-state paragraph naming that the sealed round's size
   consumes `limit.state` (default 16 KiB), so a large mixed round is sized deliberately.
10. **F4**: the input-policy section documents URL-mode elicitation as a composable arm with
    the `elicitation.url` declaration it requires.
11. **The nested function** at `tests/setupConformance.test.ts:249` hoists to module scope
    beside the file's fixture builders.
12. **Wording**: "byte-exact" claims about sealed state become value-identical through
    canonical serialization wherever written; the `MCPLegacy.test.ts` fixture round becomes
    minimal with a comment saying the round is never issued on that path.

## Scope

- Owned: `src/core/types.ts`, `src/core/MCPServer.ts`, `src/core/MCPClient.ts`,
  `src/core/helpers.ts`, `src/core/validators.ts`, `guides/mcp.md`,
  `tests/src/core/MCPServer.test.ts`, `tests/src/core/MCPClient.test.ts`,
  `tests/src/core/MCPLegacy.test.ts`, `tests/src/core/validators.test.ts`, `tests/setup.ts`,
  `tests/setupConformance.ts`, `tests/setupConformance.test.ts`, `tests/conformance.test.ts`,
  `tests/conformanceClient.ts`.
- Off-limits: everything else, including `package.json` and `src/server`/`src/browser`.

## Execution

Perform the assignment directly and spawn nothing. TTTDD; failing-first for every behavioral
change with exact commands and counts. Validate scoped: `npm run check` (after
`npm run build:src` if the driver's types need the refreshed dist — record it),
`npm run test:src:core`, `npm run test:setup`, `npm run test:conformance`,
`npm run test:guides`, `npm run test:policy`, scoped oxlint and oxfmt `--check` on owned files.
No tree-wide `format` or `lint --fix`.

## Output

Report to `tmp/units/mf2-report.md` and as your final message: per-fix landing with
failing-first evidence, every conformance baseline row that moved with its runner message, the
two doors' pinned wire behavior, and any claim you could not close. Name which fixes departed
from a prescription (the cross-engine check reads those first).

## Deviation contract

Stop and report when: port gating reddens a scenario in a way the runner's message shows is a
runner expectation rather than a product defect (report the tension, decide nothing); the
stateless-retry change reaches `src/server` or `src/browser`; or a test outside the owned files
reddens. Ancillary choices (test naming, guide wording within the stated content) are yours to
decide and record.

## Acceptance criteria

1. Every fix row landed or reported as a deviation; none silently dropped.
2. `sep-2322-client-request-state` recorded at `5 passed, 0 failed` red-then-green.
3. The guide contains no dead anchor into the renamed heading, no `elicit` reference, no
   schema-narrowing claim the mirror contradicts, and a conformance narrative matching the
   recorded baseline.
4. All scoped runs green at the updated baselines.
