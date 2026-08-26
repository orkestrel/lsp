# Unit brief: m4-guide — the mcp guide's M4 half

## Role and engine

`implementer` — Opus 5, native subagent. You write in `/home/user/mcp`, the sole writer in
that checkout, from the clean committed baseline `0fe1879` on branch
`claude/lsp-spec-audit-est33d`. You perform the assignment directly yourself and spawn
nothing.

## Objective

Bring `guides/mcp.md` to parity with the landed M4 surface: document the six barrel
symbols the parity gate names, land the era sweep's guide half, and record the tasks
delivery rulings (entitlement, delivery guarantee, the composing-envelope conformance
gap) as the landed code's documented contract. The guides project exits green.

## Context

- Read before editing, in order: `/home/user/mcp/AGENTS.md`; the applicable
  `/home/user/mcp/.claude/rules/` files — `documentation.md`, `writing.md`, `names.md`,
  and `tests.md` § the guides project; no skill (explicit none); the guide itself.
- The design authorities, absolute paths, read them rather than trusting this summary:
  - `/home/user/lsp/.orkestrel/mcp/m4-design-reconciliation.md` — the round's rulings:
    the admission-not-production transition path, the authorize-and-omit acknowledgement
    (each requested identifier resolves through `MCPTaskManagerInterface.task(id, options)`
    before acknowledging; an unresolved one is omitted with no distinguishing signal; a
    malformed array rejects `-32602`; the agreed set is fixed for the subscription's
    lifetime; no store read at delivery time).
  - `/home/user/lsp/.orkestrel/mcp/m4-envelope-probe.md` — the composing-envelope search
    bound: the wire envelope for a task frame on a `subscriptions/listen` stream is
    undefined in every available source; the package documents
    `params.notifications.taskIds` as its reading and names it a conformance gap, never
    settled wire.
  - `/home/user/lsp/.orkestrel/mcp/m4-era-report.md` — the era sweep's vocabulary: how the
    landed source and tests state the stable `2026-07-28` snapshot fact where they
    previously claimed draft status. The guide half is yours.
  - `/home/user/lsp/.orkestrel/mcp/m4-stream-report.md` and
    `/home/user/lsp/.orkestrel/mcp/m4-proof-report.md` — what landed on the wire surface
    and what the proof rows pin.
- The landed source is the truth for every sentence you write: `src/core/types.ts`,
  `src/core/validators.ts`, `src/core/helpers.ts`, `src/core/MCPServer.ts`,
  `src/core/MCPClient.ts` at `0fe1879`. Never document from a report what you can read
  from the code.
- Host environment: Linux, npm installed per checkout, network through the session proxy.
  Foreground commands finish well inside ten minutes on this tree.

## Measurements taken at dispatch, 2026-08-26

The guides gate is red with exactly the six symbols. `npm run test:guides` in
`/home/user/mcp`:

```text
+ [
+   "type MCPNotificationMetaObject",
+   "type MCPTaskDetailResult",
+   "type MCPTaskNotificationParams",
+   "function isMCPNotificationMetaObject",
+   "function isMCPTaskDetailResult",
+   "function isMCPTaskNotification",
+ ]
 ❯ tests/guides.test.ts:603:62 — it('documents every barrel export')
 Test Files  1 failed (1)
      Tests  1 failed | 143 passed (144)
```

The guide has no occurrence of any of the six names:
`grep -c 'MCPNotificationMetaObject\|MCPTaskDetailResult\|MCPTaskNotificationParams\|isMCPNotificationMetaObject\|isMCPTaskDetailResult\|isMCPTaskNotification' guides/mcp.md` → `0`.

The guide's sections (`grep -n '^## ' guides/mcp.md`): `Protocol` 76, `Surface` 202,
`Methods` 2759, `Patterns` 3270, `Tests` 3725, `Declared non-goals` 3744,
`Declared conformance gaps` 3808, `Declared packaging limits` 4089, `Contract` 4147; the
file is 4841 lines.

Draft-era residue stands in the guide while the source has none, for example: line 1323
`**This surface is DRAFT.**`, line 1852 `the draft Tasks extension's client half`, line
1870 `the draft Tasks extension id`, lines 1955-1958 `draft Tasks extension` in guard
rows, line 2087 `verbatim draft-schema spelling`, line 4058 the `notifications/tasks`
conformance-gap row, line 4065 the `TaskSubscriptionNotifications { taskIds?: string[] }`
schema mention. Sweep the whole file yourself; these are samples, not the population.

## Unknowns

- Whether the era reconciliation keeps any sentence that names the specification's draft
  tree as the extension's home while still pinning the `2026-07-28` snapshot as this
  package's contract. Read `m4-era-report.md` for the vocabulary the source adopted and
  mirror it; where the report leaves a guide sentence genuinely unsettled, decide the
  ancillary wording yourself and record the decision in your report.
- Whether the `tasks` filter member and the derived support fact from `m4-stream` need a
  Methods-table row, a Patterns section, or both. Decide from the guide's own structure
  and record the decision.

## Scope

- Owned: `guides/mcp.md`.
- Off-limits: everything else — all of `src/`, all of `tests/` (`tests/guides.test.ts`
  included), `package.json`, the other guides. A finding against an off-limits file is
  reported, never edited.
- Allowed tools: your full allowlist; validation commands are read-only or scoped to the
  guide.

## The work

1. **Document the six symbols** in the tables their kinds belong to (types in the type
   table, guards in the guard table), each row stating the installed shape you read from
   `src/core/types.ts` and `src/core/validators.ts`. This closes the red row.
2. **Land the era sweep's guide half.** Replace draft-era claims with the stable
   `2026-07-28` snapshot fact in the vocabulary the source adopted, per
   `m4-era-report.md`. Do not invent a new framing.
3. **Record the delivery rulings** where the guide documents `subscriptions/listen` and
   the tasks family: the `taskIds` request member and the `tasks` server option, the
   authorize-and-omit acknowledgement, the fixed agreed set, the absence of a
   delivery-time store read, the `-32602` malformed rejection, and the no-distinguishing-
   signal guarantee for an unknown, purged, or unauthorized identifier.
4. **Update the composing-envelope conformance gap** (the § Declared conformance gaps row
   near line 4058): the package's `params.notifications.taskIds` reading, named as a gap
   against unsettled wire, never as settled protocol.
5. **Probe every fence you add or change** before trusting it: run the real calls through
   a throwaway instrument under `tmp/probe/` and delete it. A fence comment must state
   the executed reading, never a derived one.

## Execution

You perform the assignment directly and spawn nothing. Validate scoped: the guides
project (`npm run test:guides`), and the repository's format check over the guide. Do not
run tree-wide mutating commands.

## Deviation contract

Stop and report, without improvising, when: a sentence the design authorities require
contradicts the landed source; a fence's executed reading contradicts the claim you were
told to document; or the parity gate demands an edit outside `guides/mcp.md`. An
ancillary conflict — where a row sits, which heading a subsection takes, exact wording the
authorities leave open — is yours to decide, record, and carry on from.

## Acceptance criteria, cheap-first

1. `grep` finds each of the six symbol names in `guides/mcp.md`.
2. The repository's format check over the guide exits 0.
3. `npm run test:guides` exits 0 at `144 passed (144)` from the recorded
   `1 failed | 143 passed (144)` baseline.
4. A writing-rules sweep over the added and changed lines passes, with the pattern and
   population named in the report.

## Output

Write the report to `/home/user/lsp/tmp/units/m4-guide-report.md`: what you documented
and where (section and line anchors), the era-sweep population and what each hit became,
each fence you probed with its executed reading, the decisions you made on the unknowns,
the gate readings with exit codes, the writing sweep's pattern and population, and the
actual `git status --short` and `git diff --stat` output. Your final message is a short
summary naming the report path.
