# m4 round — audit verdict and reconciliation

Round subject: the M4 tasks wave at mcp `c2a35d4` — `m4-era`, `m4-contract` (+`.1`),
`m4-mirror` (+`.1`), `m4-stream`, `m4-proof`, `m4-guide`, with the whole-tree gates green
(`m4-gates-report.md`). Reconciled 2026-08-26.

## Lanes that ran

| Lane | Engine | Result |
|---|---|---|
| Objective audit, over the Opus-written units | Cursor Grok (in Sol's place per the user's corrected ruling) | `FAIL -- 1 broken` (`m4-audit-objective-verdict.md`) |
| Subjective review, over the Sol-written units | Opus 5 (`reviewer`) | `FAIL -- 1 broken, 1 not-evidenced, 5 findings outside the claims` (`m4-audit-reviewer-verdict.md`) |
| Mechanical checks | Sonnet (`checker`) | Reported (`m4-audit-checker-report.md`) |

Every unit therefore had at least one lane whose engine did not write it: Grok over the
Opus units, Opus over the Sol units.

## Source confirmation of the Grok BROKEN (claim 6, prose sweep)

Per the user's ruling a Grok `BROKEN` is accepted only after source confirmation. The
Orchestrator re-read every cited hit against `guides/mcp.md` and the `c2a35d4` capture:

- **Sustained**: `guides/mcp.md:925` ("The third argument is the derived support fact")
  and `:2085` ("a `true` third argument") — positional references to a named parameter,
  banned; `:913` ("the same two the other families use") — a count over helpers with the
  members unnamed in the sentence.
- **Reworded as hygiene**: `:885` "no third flag records it" — the sentence names the
  members (`task` and `subscription`) and the pair cannot grow, so the count rule admits
  it, and the ordinal still reads positional; the fix rewords to "no stored flag".
- **Dropped, on the record**: "all three" and "how the two compose" match nothing in the
  file (false citations); "the two doors" (`:3210`) and "one unit" (`:4151`, `:4180`)
  sit on lines the `c2a35d4` capture does not touch, outside the claim's population.

Spot-checks on the load-bearing Grok `CONFIRMED` rows: claim 2's integer repair reads
true (`tests/mirrors/ext-tasks-2026-07-28-schema.json:79-83` carries the `type:
"integer"` branch; `src/core/types.ts:790` and `:1110` carry the contract), and claim 4
is independently corroborated by the reviewer's claim-5 sentence-by-sentence walk.

## Settling the referrals

- **R1 — the digest row's reachability**: settled by the Orchestrator's probe
  (`scratchpad m4-r1-probe.sh`, 2026-08-26). One appended byte in the mirror fails
  COLLECTION with the named drift error (`readTaskSchema` →
  `formatConformanceDrift('Tasks schema bytes', 'SHA-25…')`, `1 failed (1)`, `no tests`,
  exit 1); the restored file runs `42 passed (42)` exit 0. Drift is caught loudly at
  module load; the row is the readable statement of the pin and can only pass. The F5
  rename states what the row proves; the row stays.
- **R2 — the formatter path behind F3**: `format:check` is green at the `f1632ad`
  baseline (the mirror brief records it) and at head (`m4-gates-report.md`), so the tree
  is stable under `oxfmt`, the repository's formatter. The `2b823f9` reformatting churn
  is historical, produced by the mirror brief's `prettier --check` acceptance criterion.
  Recorded: no tree change owed; campaign briefs name `oxfmt` from here on.

## The checker's rows, reconciled

- Check 4's mismatches dissolve against successor briefs the checker was not supplied:
  `.prettierignore` is `m4-mirror.1-brief.md` § 1's owned file, and
  `tests/src/core/helpers.test.ts` is `m4-contract.1-brief.md` Patch 1.
- Check 1's membership gap reconciles: the five status narrowings are covered through
  the `DetailedTask` union projection (`readTaskVariant` over
  `['$defs','DetailedTask','anyOf', 0..4]`, `tests/setupConformance.ts:230-244` with the
  call sites at `:465-503`), which the checker's `$defs`-name pattern could not see. The
  generic embedded shapes are outside the mirror's intended tasks-surface scope, and the
  digest pins every byte of them regardless.
- Check 3's one non-mirror `draft` hit is the JSON Schema `$schema` URL literal in a
  fixture — a code token, not an era claim.
- Check 5 confirms the carried `simply` at `guides/mcp.md:325`.

## Round ruling

`FAIL` — one fix unit closes it. `m4.1-repairs` (Opus implementer; auditor: `checker`,
an engine that did not write it, plus the Orchestrator's gate re-run) carries, with
exactly one carrier per finding:

1. Reviewer claim 4: the `TaskStatusNotificationParams metadata` row reprojects to
   `['$defs','NotificationMetaObject','properties','io.modelcontextprotocol/subscriptionId','$ref']`
   expecting `'#/$defs/RequestId'`; the escaped upstream prose leaves the source.
2. Reviewer F1 + F2: the `buildSubscriptionFilter` boolean parameter renames `tasks` →
   `enabled` with its `@param` reworded and `Default: \`false\`` appended.
3. Reviewer F5 (+R1): the conformance row title becomes "pins the vendored schema's
   raw-byte digest".
4. Reviewer F4: the guide's conformance-project section restates the project as the
   foreign-runner run plus the digest-pinned schema mirror, naming the mirror path and
   the digest constant.
5. Grok claim 6, verified subset: `:925` and `:2085` name the parameter instead of its
   position; `:913` drops the count; `:885` rewords to "no stored flag".
6. The carried `simply` at `:325` deletes.

Reviewer claim 3 (`NOT-EVIDENCED`) is a brief mis-scope, not a unit defect: the audited
commit adds no comment population; its one `@param` line is carried by item 2. Recorded
here as the audit step requires; no further carrier.

Acceptance of the round follows the fix unit's landing, the checker's closure reading,
and the Orchestrator's gate re-run.
