# Unit m4-proof — the question-2 invariants and the end-to-end tasks-delivery proof

## Role and engine

You are the `implementer` lane, Claude Opus 5, native, writing directly in `/home/user/mcp`.
Do the work yourself and spawn nothing. You are the only writer in that tree for the unit's
duration. You do not commit, push, or run `git checkout`, `git restore`, `git stash`,
`git reset`, or `git clean` — an edit you must undo, you undo exactly, by hand. You do not
accept your own work; the round audit's Sol `analyst` lane covers this unit.

## Read first, in order

1. `/home/user/mcp/AGENTS.md`, then `.claude/rules/tests.md`, `.claude/rules/typescript.md`,
   `.claude/rules/patterns.md`, and `.claude/rules/quality.md` in that repository.
2. `/home/user/lsp/.orkestrel/mcp/m4-design-reconciliation.md` — the round's charter; its
   question-2 rulings, the `m4-proof` amendment row, and the risk rows naming this unit are
   authoritative over any paraphrase here.
3. `/home/user/lsp/.orkestrel/mcp/m4-stream-report.md` — what the preceding unit landed,
   including its full diff. The two load-bearing sites your mutations target are in that diff.
4. `/home/user/mcp/guides/mcp.md` — the subscriptions section, for the shapes the package
   documents. You do not edit the guide (`m4-guide` owns it).

No skill is named.

## Standing conditions (verified 2026-08-26)

- `/home/user/mcp` is CLEAN at commit `bef9f40` on the `claude/lsp-spec-audit-est33d` branch.
  Dependencies are installed.
- The `guides` Vitest project carries one red row by design (six `m4-contract` symbols await
  `m4-guide`); never run the guides project and never report its redness.
- The scoped baseline the preceding unit recorded:
  `npx vitest run --config vite.config.ts --project src:core tests/src/core/helpers.test.ts tests/src/core/MCPServer.test.ts`
  exits 0 with `310 passed (310)`. Re-derive your own baselines for the files you touch before
  editing.
- A task-frame proof drives no child process and opens no listener: transports are in-memory,
  so every proof in this unit runs natively with no sandbox concern.

## The invariants this unit pins (adopted; argue how, never whether)

Each is a ruling from the reconciliation. Every new row is named for the behavior it proves.

1. **Omission is indistinguishable.** An identifier the acknowledgement's
   `task(id, options)` read does not resolve is omitted with no distinguishing signal: an
   unknown identifier, a purged identifier, and an unauthorized identifier produce
   byte-identical acknowledgements, and no error distinguishes them. Drive this with one real
   minimal `MCPTaskManagerInterface` implementation whose `task` method resolves from seeded
   state — a boundary stub implementing the real interface minimally, never a framework spy.
2. **A frame naming an identifier outside the agreed set is not delivered.**
3. **A frame naming an agreed identifier delivers with no manager read at delivery time.**
   Instrument the fixture manager to record its `task` calls (the recorder pattern from
   `@orkestrel/test` or a seeded counter of your own). Prove the instrument can fail: the
   count RISES during acknowledgement (the positive control), then stays fixed across every
   delivered frame. A future edit that resolves identifiers at delivery re-reddens this row;
   that tripwire is the row's purpose.
4. **The acknowledgement omits the `taskIds` member entirely when the server cannot push
   tasks** — no `task` option, or no `subscription` option.
5. **Request order is preserved and duplicates acquire no normalization** in the acknowledged
   set.
6. **End to end: a `notifications/tasks` frame reaches a subscribed client through the
   built-in `subscriptions/listen` stream, filtered and stamped.** A real fixture producer
   supplied through the `subscription` option emits task frames; a real `MCPClient` over the
   in-memory transport pair receives exactly the agreed-identifier frames, each carrying the
   `io.modelcontextprotocol/subscriptionId` stamp under `_meta`. Real implementations at every
   seam; nothing replaced.

## Binding the rows to the landed code

The capability landed before this unit, so a row proves it binds through a temporary mutation
of the exact landed line, run red, restored by hand to the byte the diff shows, and run green
— the same discipline as a red-first proof, inverted. The load-bearing sites, from the
`m4-stream` diff:

- the `filter.taskIds?.includes(notification.params.taskId) === true` admission in
  `src/core/helpers.ts` — mutating the branch to admit every validated tasks frame must redden
  exactly the outside-the-agreed-set row;
- the resolution loop in `src/core/MCPServer.ts` `#subscription` — mutating it to acknowledge
  `requestedTaskIds` unresolved must redden exactly the omission rows.

Record each mutation's exact command with its failing and passing counts. A mutation that
reddens anything beyond its named rows broke the harness, and its count is not evidence —
restore and re-derive. Where a row's binding is already carried by its own instrument-can-fail
control (the delivery-read counter's positive control), record that control in place of a
mutation and say so.

## Unknowns, named as unknowns

- **Whether `tests/setup.ts` already exports a task-manager fixture the tasks family's landed
  tests use.** Reuse and extend an existing fixture rather than declaring a sibling; report
  which you did.
- **Whether the client-side `listen` path needs a row in `tests/src/core/MCPClient.test.ts`
  beyond the end-to-end proof.** The reconciliation lists the file as owned; add a row only
  where a client-side behavior is otherwise unpinned, and report the ruling either way.
- **Whether `validators.test.ts` already pins `isMCPTaskNotification` admission and refusal.**
  The `m4-contract` unit landed rows there; extend only where a question-2 shape is unpinned.

## Scope

- Owned: `tests/setup.ts`, `tests/src/core/helpers.test.ts`,
  `tests/src/core/validators.test.ts`, `tests/src/core/MCPServer.test.ts`,
  `tests/src/core/MCPClient.test.ts`, plus the two source files ONLY within a mutation window
  that ends restored byte-identical.
- Off-limits: everything under `src/` as a lasting change, `guides/mcp.md`,
  `tests/conformance.test.ts`, `tests/setupConformance.ts`, `tests/mirrors/`, `vite.config.ts`,
  `package.json`, the lockfile, and everything under `/home/user/lsp` except reading the
  reconciliation and the `m4-stream` report.
- Allowed tools: read, edit, and the acceptance-criteria commands.

## Deviation contract

A pinned invariant the landed code fails — a mutation-free red row — is a primary-objective
conflict: stop and report expected, found, the exact command and output, done or not done, and
at most one short hypothesis; the round routes the fix. Fixture shape, row placement among the
owned files, and recorder design are yours to decide and record.

## Acceptance criteria, cheap-first, each command and output recorded

1. `npx --no-install oxfmt --config .oxfmtrc.json --check` over the owned test files exits 0.
2. `npx --no-install oxlint --config .oxlintrc.json --deny-warnings` over the same files
   exits 0.
3. `npm run check` exits 0.
4. The mutation table: each named mutation red with its count, each restoration green, and
   `git diff -- src/` empty at the end.
5. `npx vitest run --config vite.config.ts --project src:core tests/src/core/helpers.test.ts tests/src/core/validators.test.ts tests/src/core/MCPServer.test.ts tests/src/core/MCPClient.test.ts`
   exits 0 with the counts recorded, every new row collected and named in the output.

## Review evidence

This is a code change: your report carries the actual `git diff` and the actual
`git status --short` output, with `git diff -- src/` shown empty.

## Output

Write your report to `/home/user/lsp/tmp/units/m4-proof-report.md`: each invariant with the
row that pins it and its evidence, the mutation table, the fixture and recorder design, the
unknowns' answers, the gate readings with exit codes, the diff, the status output, and any
claim you flag for the analyst. No process diary.
