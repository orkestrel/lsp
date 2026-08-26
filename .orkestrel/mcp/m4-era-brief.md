# Unit m4-era — the stable-era prose sweep in the mcp tree

## Role and engine

`implementer`, Claude Opus 5, native subagent. You are the sole writer in `/home/user/mcp`
for this unit's duration. You perform the assignment directly and spawn nothing.

## Objective

Every claim in the mcp source and test prose that the Tasks extension is draft, lives under
`specification/draft/`, or carries no stability guarantee is replaced with the fact, and
the client's subscription-routing prose in `src/core/types.ts` is corrected. No behavior
changes.

The fact, whose substance every replacement carries (adapt the wording to each site; the
identifiers and the date are fixed):

> The package implements the stable, immutable MCP Tasks extension snapshot dated
> `2026-07-28`, extension id `io.modelcontextprotocol/tasks`, generated schema id
> `https://modelcontextprotocol.io/ext-tasks/2026-07-28/schema.json`.

## Context

Read before editing: `/home/user/mcp/AGENTS.md`; the rules `.claude/rules/writing.md`,
`.claude/rules/typescript.md`, and `.claude/rules/names.md` in that repository; then the
design record `/home/user/lsp/.orkestrel/mcp/m4-design-reconciliation.md` (question 5 is
this unit's charter) with the lane rulings `m4-design-planner-ruling.md` and
`m4-design-analyst-ruling.md` beside it. No skill is named. The guide for this package is
`guides/mcp.md`, and for this unit it is OFF-LIMITS — see the scope.

Standing conditions:

- `/home/user/mcp` is clean at commit `b50520a` on the `claude/lsp-spec-audit-est33d`
  branch. Every line coordinate in this brief was read at that commit. If a named site does
  not contain the claim this brief attributes to it, stop and report per the deviation
  contract.
- `guides/mcp.md` still carries draft-era claims. A later unit (`m4-guide`) owns them. Your
  tree-wide `draft` sweep therefore EXCLUDES `guides/`, and your report must not count the
  guide's hits as unswept.
- The staged authority, if a replacement sentence needs checking against it, is
  `/home/user/lsp/.orkestrel/mcp/ext-tasks-2026-07-28-schema.ts` and its generated
  `ext-tasks-2026-07-28-schema.json` (the released source identifies itself as immutable at
  lines 1-11 of the `.ts` file).
- The network is available but nothing in this unit needs it.

## The sites

Era claims to replace, each read at `b50520a`:

- `src/core/types.ts:728-745` — the era comment, including "carries no stability
  guarantee; every type below can change with it".
- `src/core/types.ts:984-996` — "the server's draft Tasks extension".
- `src/core/types.ts:1787-1793` and `:1832-1839` — the `MCPServerOptions.task` prose,
  including "The extension is DRAFT and carries no…".
- `src/core/types.ts:2409-2430` and `:2569-2577` — the client-half prose and "unrecognized
  draft members".
- `src/core/validators.ts:1089-1091` — the openness remark. The behavior stays; its stated
  reason changes: openness stands because a guard over a foreign contract enforces the
  published contract and no more (`.claude/rules/patterns.md` § Foreign contracts), not
  because the extension is draft.
- `src/core/MCPTaskClient.ts:11-26`, `src/core/MCPServer.ts:124-130`, `:346-350`, `:813`,
  `src/core/MCPClient.ts:136`, `src/core/helpers.ts:96-114` — comment and TSDoc mentions.
- `src/core/constants.ts:63` and `:82-86` — the extension-id TSDoc. KEEP the `-32003`
  remark: the extension's prose examples show `-32003` while the dated core schema fixes
  `-32021`, and the stable snapshot does not falsify that observation.
- `tests/setup.ts:1143`, `:1165`; `tests/src/core/MCPTaskClient.test.ts:20`;
  `tests/src/core/MCPServer.test.ts:4805`, `:4876`;
  `tests/src/core/validators.test.ts:1641` — comments and suite titles.

The client-prose routing correction, prose-only, in the same pass:

- `src/core/types.ts:2423-2430` claims subscribed task notifications arrive through the
  generic `notification` event. A stamped subscribed notification is claimed by
  `#routeSubscription` before the generic event fires
  (`src/core/MCPClient.ts:712-741` — read it before writing). Rewrite the prose to direct
  subscribed consumers to the `listen` stream and to state that a stamped frame does not
  re-emit through `MCPClientEventMap.notification`.

## Unknowns

None. The sweep set is closed by the search in the acceptance criteria; a hit outside the
named sites is still yours when its sense is a Tasks-extension era claim in `src/` or
`tests/`, and your report names any such addition with its path and line.

## Scope

- Owned: `src/core/types.ts`, `src/core/validators.ts`, `src/core/constants.ts`,
  `src/core/helpers.ts`, `src/core/MCPServer.ts`, `src/core/MCPClient.ts`,
  `src/core/MCPTaskClient.ts` — prose (comments and TSDoc) only; `tests/setup.ts`,
  `tests/src/core/MCPServer.test.ts`, `tests/src/core/MCPTaskClient.test.ts`,
  `tests/src/core/validators.test.ts` — comments and suite titles only.
- Off-limits: `guides/mcp.md` and everything under `guides/`; every declaration,
  expression, and statement (this unit moves no behavior); `src/core/index.ts`;
  `package.json` and the lockfile; every file not named as owned.
- Allowed tools: read, edit, and the scoped commands in the acceptance criteria. No
  commit, no push, no install, no `git checkout`, `git restore`, `git stash`, `git reset`,
  or `git clean`.

## Execution

Do the work yourself, in this checkout, and spawn nothing. Prose follows the writing
rules: present tense for what exists, no `should`, no counts, spaced em dashes, a date
written `2026-07-28`, code tokens backticked and followed by nouns.

## Deviation contract

A named site whose text does not match this brief's claim about it, or a replacement that
cannot be written without touching behavior, stops the unit: report expected, found, exact
evidence, done or not done, and at most one short hypothesis. The exact wording of a
replacement sentence, and whether one site's replacement is a sentence or a clause, are
yours to decide and record.

## Acceptance criteria, cheap-first

1. `grep -rin "draft" src/ tests/` returns only hits whose sense is unrelated to the Tasks
   extension's era; the report names every remaining hit with its path, line, and permitted
   sense, and names the pattern and the paths swept.
2. `npm run format:check` passes.
3. `npm run lint:check` passes.
4. `npm run check` passes.
5. `npm run test:src:core` passes; no count moves (prose only). Record the reported count
   as an observation with the run.

## Output

Write the report to `/home/user/lsp/tmp/units/m4-era-report.md`: what changed per file (site
by site), the sweep result per criterion 1, the gate readings with exit codes, the
`git status --short` output, and any claim of your own you flag. No process diary.

## Review evidence

The auditor receives the actual diff and the actual status output; your report carries the
sweep evidence. Do not capture the diff to a file yourself — the Orchestrator captures it
at integration.
