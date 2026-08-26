# Audit — the L5 round (L5-A, L5-A r2, L5-B), subjective lane

Role and engine: `reviewer`, Claude Opus 5, native read-only subagent, subject repository
`/home/user/lsp` at commit `27725c0`, tree clean. You are the audit round's subjective
lane: design acceptance, API and vocabulary, architecture fit, placement, simplification,
and guide voice. You audit; you never edit, and you never accept — the Orchestrator
accepts. An objective `analyst` lane runs separately; you do not run it.

The round's writers: the L5-A chain was written by a Sonnet `builder` with two
Orchestrator-owned edits (the canonical `.prettierignore` mirrors line in scaffold and the
probe move to `tests/mirrors/`); L5-B was written by GPT-5.6 Sol. Your engine wrote none of
the lsp diff under audit.

Before working, read: `/home/user/lsp/AGENTS.md`; the rules `.claude/rules/names.md`,
`.claude/rules/typescript.md`, `.claude/rules/architecture.md`, `.claude/rules/tests.md`,
`.claude/rules/workspace.md`, `.claude/rules/documentation.md`,
`.claude/rules/quality.md` (its Falsification law governs your verdict shape); the guide
`guides/lsp.md` § Conformance.

## Evidence set

- The design record: `/home/user/scaffold/.orkestrel/campaign/l5-design-reconciliation.md`
  and `l5-design-reconciliation-r2.md` (the binding rulings), with the lane rulings and
  probes beside them in that folder.
- The unit records, same folder: `l5a-metamodel-brief.md`, `l5a-metamodel-brief-r2.md`,
  `l5a-metamodel-report.md`, `l5a-metamodel-report-r2.md`, `l5a-acceptance.md`,
  `l5b-conformance-brief.md`, `l5b-conformance-report.md`.
- The actual diffs: `git show 586758d` (L5-A) and `git show 27725c0` (L5-B) in
  `/home/user/lsp`; the captured copy of the L5-B diff sits at
  `/home/user/scaffold/.orkestrel/campaign/l5b-diff.txt` with the status beside it.
- The host gate chains of 2026-08-26: every gate exit 0 over each landed tree
  (`l5a-acceptance.md` records the L5-A chain; the L5-B commit message records its own).

## The claims, numbered and falsifiable — rule on each with evidence

1. Placement and export law: `tests/setupConformance.ts` holds the loader, tables, lookup
   helpers, and drift formatting with no `describe`, `it`, or `expect` and every
   declaration exported; `tests/conformance.test.ts` only registers rows;
   `tests/setupConformance.test.ts` proves the infrastructure through the `setup`
   project's existing glob.
2. The wiring matches the vendored proof exactly: the `conformance` factory sits between
   `config` and `distribution` with the required include, Node environment, disabled
   browser, `setupFiles` exactly `['./tests/setup.ts']`, and no timeout; the
   `test:conformance` script string is exact and reachable from the `test` chain;
   `tests/config.test.ts` is unedited.
3. Failure naming serves the reader: each row's case title carries the local symbol, the
   assertion carries the authority value in the `${symbol} drifted; ${authority}=${value}`
   shape through the exported drift comparator, membership assertions name symbol sets and
   never tally, and no aggregate object diff stands where a per-row case belongs.
4. Comparison honesty: the methods table's membership equals the exact `LSP_METHODS` key
   set; `cancel` compares against the metaModel alone with no private subpath import; the
   open string enumerations claim no exhaustiveness; the structure rows stay at flat data
   and never interpret the metaModel's type-union grammar.
5. Vocabulary and shape: the lookup helpers take the repository's `read*` form returning
   `undefined` on a miss; the table constants follow `{QUALIFIER}_{NOUN}`; the TSDoc reads
   as the rules require; nothing in the diff adds a public `src/**` surface.
6. The L5-A chain fits the design: the mirror's bytes are untouched fetched bytes at
   `tests/mirrors/metaModel.json`, the refresh script and the guide's `## Conformance`
   passage name that path, the `.prettierignore` line matches the canonical scaffold copy
   verbatim, and the guide passage's promises are true of the landed L5-B proof.
7. The diffs stay inside each brief's owned files with no banned construct.

## Output

One verdict in the `orkestrel-falsify` shape: per-claim rulings — CONFIRMED, BROKEN,
UNRESOLVED, or NOT EVIDENCED — each with the exact evidence read or the exact command a
falsification needs, findings outside the claims if any, the claims you attacked and could
not break, and a single terminal line:
`VERDICT: PASS|FAIL — <n> broken, <n> unresolved, <n> not-evidenced, <n> findings outside the claims`.
No process diary.

## Constraints

Read-only tools. You may run scoped read-only commands, including test runs, in
`/home/user/lsp`; a test run mutates nothing. Perform the assignment directly and spawn
nothing.
