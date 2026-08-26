# Unit m4-contract — the tasks-notification contract surface and drift repairs

## Role and engine

`implementer`, Claude Opus 5, native subagent. You are the sole writer in `/home/user/mcp`
for this unit's duration. You perform the assignment directly and spawn nothing.

## Objective

The M4 contract surface exists in the types and validators and is exported through the
barrel, and each authority-drift defect the design round found is repaired with a
failing-then-green proof. No server or subscription wiring lands here — a later unit owns
that.

## Context

Read before editing: `/home/user/mcp/AGENTS.md`; the rules `.claude/rules/names.md`,
`.claude/rules/typescript.md`, `.claude/rules/patterns.md`, `.claude/rules/tests.md`, and
`.claude/rules/writing.md` in that repository. Then the design record
`/home/user/lsp/.orkestrel/mcp/m4-design-reconciliation.md` — questions 2 and 3 are this
unit's charter, and its `m4-contract` row (amended 2026-08-26) is your ownership — with
the lane rulings beside it. No skill is named. The guide is OFF-LIMITS; a later unit owns
it.

The authority: `/home/user/lsp/.orkestrel/mcp/ext-tasks-2026-07-28-schema.ts` and its
generated `ext-tasks-2026-07-28-schema.json` — the stable, immutable Tasks extension
snapshot dated 2026-07-28. Where this brief cites a schema coordinate, read it there
before writing.

Standing conditions:

- `/home/user/mcp` is DIRTY: the `m4-era` unit's prose sweep (11 files, comments and TSDoc
  only, diff at `/home/user/lsp/.orkestrel/mcp/m4-era-diff.txt`) is held uncommitted. Work
  on top of it and never revert any part of it. `git status` listing those files is
  expected, not a deviation.
- The `m4-era` sweep may have shifted line numbers by a few lines in `src/core/types.ts`,
  `validators.ts`, `constants.ts`, and `helpers.ts`. Coordinates in this brief were read
  at commit `b50520a`; locate each site by its content, not only its number.
- The network is available but nothing in this unit needs it.
- No role runs `git checkout`, `git restore`, `git stash`, `git reset`, or `git clean`,
  and this unit does not commit, push, or install.

## The surface to add

1. **`taskIds?: readonly string[]` on `MCPSubscriptionFilter`** (near
   `src/core/types.ts:1314-1334`), a peer of `resourceSubscriptions` at its verbatim wire
   spelling — the foreign-key exemption the type's own remark states. Its TSDoc carries:
   the wire placement (`params.notifications.taskIds`, the package's reading — the
   authority declares the fragment without composing it, so state it as the package's
   reading); and why the server honours it only when the Tasks extension and a
   subscription producer are both configured, as a derived fact with no third flag.
2. **`MCPNotificationMetaObject`** in the metadata family beside `MCPResultMetaObject`
   (near `types.ts:1282-1285`, `:1336-1340`): the reserved
   `io.modelcontextprotocol/subscriptionId` key OPTIONAL, because the authority pins it
   present on frames delivered on a listen stream and absent otherwise
   (`ext-tasks-2026-07-28-schema.json`, the `NotificationMetaObject` definition).
3. **`MCPTaskNotificationParams`** in the tasks family beside `MCPTaskDetail` (near
   `types.ts:792-810`): `MCPTaskDetail` intersected with an optional
   `_meta: MCPNotificationMetaObject` and the family's openness idiom — the authority
   makes the params flat (`TaskStatusNotificationParams` is
   `NotificationParams & DetailedTask`), so no `task` wrapper member exists.
4. **`isMCPTaskNotification`** in `src/core/validators.ts`: narrows a
   `JSONRPCNotification` to the `notifications/tasks` method with
   `isMCPTaskDetail`-conformant params. About `_meta` it checks shape-when-present only
   and demands nothing — the stamp is the server's to write. The reconciliation fixes this
   decision; state it in the guard's TSDoc.
5. **The extended `isMCPSubscriptionFilter`** (near `validators.ts:1264-1276`): one
   `taskIds` clause in the exact shape of the `resourceSubscriptions` clause. Read the
   `arrayOf` declaration first and settle whether `arrayOf(isString)` narrows to
   `readonly string[]` — the sibling clause is the precedent; record what you found.
6. **The barrel**: `src/core/index.ts` exports every new public symbol through the
   existing section order.

## The drift repairs, each with a failing proof first

Record, per repair: the exact command, its failing count before, the same command green
after. A guard change whose proof never ran red does not bind.

- **Integer bounds.** The authority types `ttlMs` and `pollIntervalMs` as integers; the
  local guards accept any finite number (near `validators.ts:1047-1050` and
  `:1118-1120`). Tighten to integers. New red-first rows: a fractional `ttlMs` and a
  fractional `pollIntervalMs` each refuse, red against the standing guard.
- **The completed `result` is an open record.** The authority declares a completed task's
  `result` as an open object (`ext-tasks-2026-07-28-schema.ts:127-136`); the local
  completed arm requires `MCPResult` (near `types.ts:805-810`,
  `validators.ts:1124-1127`). Widen type and guard to the authority's shape. The standing
  row near `tests/src/core/validators.test.ts:1740-1746` — a completed detail whose
  `result` carries a malformed `_meta` asserted `false` — becomes false under the repair:
  re-rule it to assert the authority's behavior, and record the reason in the row.
- **The capability is exactly empty.** The authority declares the
  `io.modelcontextprotocol/tasks` capability as an empty object with no additional
  properties (`ext-tasks-2026-07-28-schema.ts:342-350`); `isTaskSupported` accepts
  non-empty records (near `src/core/helpers.ts:98-124` — your ownership of that file is
  scoped to this one function). Tighten it. The standing row at
  `tests/src/core/validators.test.ts:1646` — `{ later: {} }` asserted `true` — becomes
  false: re-rule it with its reason, red-first against the standing guard.
- **The get result is distinct from the manager snapshot.** The wire `tasks/get` result is
  `Result & DetailedTask & { resultType: 'complete' }`
  (`ext-tasks-2026-07-28-schema.ts:212-225`), while `MCPTaskClient.task` narrows the wire
  answer with bare `isMCPTaskDetail` (`src/core/MCPTaskClient.ts:56-63`) — the stamped
  wire result and the unstamped `MCPTaskDetail` are collapsed. Add the distinct wire
  result type in the tasks family with its guard, or an explicit projection in the client
  before returning — your judgment, within the single-word naming laws — and update the
  `tasks/get` read path in `MCPTaskClient.ts` (your ownership of that file is scoped to
  this path). Derive the falsified test set by running the scoped suite; fixture rows in
  `tests/src/core/MCPTaskClient.test.ts` that return a bare detail for `tasks/get` are
  yours to align, with each re-rule recorded.

## Unknowns

- Whether `arrayOf(isString)` narrows without a new combinator — settle by reading before
  writing, and record the answer.
- The exact falsified-row set for the get-result repair — derive it by running
  `npm run test:src:core` after the change and report what moved.

## Scope

- Owned: `src/core/types.ts`, `src/core/validators.ts`, `src/core/index.ts`;
  `src/core/helpers.ts` scoped to the `isTaskSupported` function; `src/core/MCPTaskClient.ts`
  scoped to the `tasks/get` read path; `tests/src/core/validators.test.ts` and
  `tests/src/core/MCPTaskClient.test.ts` scoped to the drift-repair and new-guard rows.
- Off-limits: `guides/`, `src/core/MCPServer.ts`, `src/core/MCPClient.ts`,
  `src/core/helpers.ts` beyond `isTaskSupported`, `src/core/constants.ts`,
  `tests/setup.ts`, `tests/setupConformance.ts`, `tests/conformance.test.ts`,
  `package.json`, the lockfile, and every other file.
- Allowed tools: read, edit, and the scoped commands in the acceptance criteria.

## Execution

Do the work yourself, in this checkout, and spawn nothing. Types land before guards, guards
before consumers, per TTTDD. TSDoc follows the writing rules.

## Deviation contract

A cited site whose content does not match this brief's claim about it, a repair that cannot
land without touching an off-limits file, or a falsified row outside your owned test files
stops the unit: report expected, found, exact evidence, done or not done, and at most one
short hypothesis. Naming choices inside the fixed shapes, and whether the get-result repair
is a distinct type or a projection, are yours to decide and record.

## Acceptance criteria, cheap-first

1. `npm run format:check` passes.
2. `npm run lint:check` passes.
3. `npm run check` passes.
4. `npm run test:src:core` passes; record the reported count, each red-first reading with
   its exact command and failing count, and each re-ruled row with its reason.
5. Every new public symbol is exported through `src/core/index.ts`, named in the report.

## Output

Write the report to `/home/user/lsp/tmp/units/m4-contract-report.md`: what changed per file,
the red-first table, the re-ruled rows with reasons, the `arrayOf` and get-result decisions,
the gate readings with exit codes, the `git status --short` output, and any claim you flag.
No process diary. Do not capture the diff yourself — the Orchestrator captures it at
integration.
