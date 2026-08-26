# Audit brief: m4-audit-objective — the M4 round's Opus-written units

## Role and engine

You hold the OBJECTIVE audit lane for the mcp M4 round: correctness, constraints, and
what the code and contracts actually permit. Your engine is Cursor Grok, taking this lane
in GPT-5.6 Sol's place under the user's 2026-08-26 ruling (the Sol model is dark on this
account; the substitution is recorded in the routing ledger). You wrote none of the
audited units. Attempt refutation on every claim; do not confirm by default. Return
evidence with `file:line` pointers behind every verdict.

## Objective

Rule on the M4 round's Opus-written units in `/home/user/mcp` at commit `c2a35d4`,
branch `claude/lsp-spec-audit-est33d`, tree clean: `m4-era` (the era sweep),
`m4-contract` with its `.1` patch unit (the tasks contract surface and drift repairs),
`m4-proof` (the delivery invariants), and `m4-guide` (the guide's M4 half). Return the
falsification verdict this brief specifies.

## Context

- `AGENTS.md`, `.claude/rules/quality.md` (especially § Falsification), and
  `.claude/rules/writing.md` govern this repository at those paths under
  `/home/user/mcp`. Read them.
- The design authorities and unit self-reports are staged under `tmp/cursor/evidence/`:
  `m4-design-reconciliation.md` (the round's rulings), `m4-era-report.md`,
  `m4-contract-report.md`, `m4-proof-report.md`, `m4-guide-report.md`, and the commit
  captures `m4-commit-<sha>.txt` for `f1632ad`, `2b823f9`, `bc54b38`, `bef9f40`,
  `0fe1879`, and `c2a35d4` (each a `git show` excluding the vendored `tests/mirrors/`
  file). Treat every report as the unit's self-report, subject to your attack.
- The vendored schema mirror is at `tests/mirrors/ext-tasks-2026-07-28-schema.json` —
  fetched bytes, exempt from prose sweeps, authoritative for schema-shape claims.
- Supplied executed evidence, labeled as such: the Orchestrator's independent `verifier`
  ran the whole gate chain on this tree 2026-08-26 — `format:check`, `lint:check`,
  `check`, `build`, `npm test` all exit 0; `test:src` `1151 passed | 1 skipped (1152)`,
  `test:guides` `144 passed (144)`, `test:conformance` `42 passed (42)`,
  `test:integration` `4 passed (4)`. Do not re-run gates; your work is reading.

## Numbered falsifiable claims

1. **Era-sweep completeness.** No draft-era claim about the Tasks extension remains in
   `src/`, `tests/` (the vendored `tests/mirrors/` file exempt), or `guides/mcp.md`: no
   sentence presents the surface as draft-unstable where the round's ruling states the
   stable `2026-07-28` snapshot fact, and no residual `specification/draft` or
   `stability guarantee` phrasing survives. Sweep the real files; name the patterns and
   the population.
2. **Contract drift repairs match the schema.** Each repair the design round required
   reads true against the vendored schema and the landed `src/core/types.ts`: integer
   `ttlMs` and `pollIntervalMs`; the completed result open to unrecognized members; the
   extension capability exactly empty; a `tasks/get` result shape distinct from the
   manager snapshot. Cite the schema fragment and the type declaration for each.
3. **The proof rows bind.** The two mutation targets `m4-proof-report.md` cites (the
   admission expression in `src/core/helpers.ts` and the resolution loop in
   `src/core/MCPServer.ts`) each occur exactly once at the cited site, each is
   load-bearing for the rows the report says reddened, and the report's red counts are
   internally coherent with its row list. A conclusion you draw from source alone is a
   derivation and is labeled as such.
4. **The guide's delivery sentences are true of the landed code.** The
   authorize-and-omit acknowledgement, the fixed agreed set, the absence of a
   delivery-time store read, the `-32602` malformed rejection, and the
   no-distinguishing-signal guarantee each match the code path in `src/core/MCPServer.ts`
   and `src/core/helpers.ts` that implements it. Cite guide line and code line per
   sentence.
5. **Scope honesty.** Each commit capture touches only the files its unit's self-report
   claims, and no capture carries a hunk that contradicts another unit's report.
6. **Prose sweep.** The added lines of `m4-commit-c2a35d4.txt` (the guide unit) pass the
   substitution table and the count-in-prose ban in `.claude/rules/writing.md`. Name the
   pattern and the population. The known carried finding — a banned `simply` on the
   untouched `guides/mcp.md:325` — is already recorded; do not count it against this
   claim, but report any further hit.

## Verdict shape

Return exactly, and nothing else: numbered verdicts, one per claim, in order, each
exactly one of `CONFIRMED`, `BROKEN`, `UNRESOLVED`, `NOT-EVIDENCED`, with the evidence
`.claude/rules/quality.md` § Falsification requires for that value; any findings fitting
no claim substantiated to the `BROKEN` standard; and one terminal line, exactly one of:
`VERDICT: PASS -- <m> of <m> confirmed, no findings outside the claims`
`VERDICT: FAIL -- <n> broken, <u> unresolved, <e> not-evidenced, <x> findings outside the claims`

## Execution

Read-only: read the real sources, the staged evidence, and the vendored schema; edit
nothing and run no mutating command. Your final message is exactly the verdict.
