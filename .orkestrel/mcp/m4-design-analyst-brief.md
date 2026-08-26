# Design round M4 — the tasks proof and the notifications/tasks family

One brief, both adversarial lanes, blind to each other. The subjective lane is `planner` (Claude
Opus 5, native, read-only). The objective lane is `analyst` (GPT-5.6 Sol, bench, read-only). Each
lane argues its perspective over the same questions and returns a ruling; the Orchestrator
reconciles. You design and rule; you never edit, and you never accept.

Subject repository: `/home/user/mcp`, clean at commit `b50520a` on the
`claude/lsp-spec-audit-est33d` branch. The package implements MCP protocol revision 2026-07-28
natively with an optional legacy wrapper.

Before working, read: `/home/user/mcp/AGENTS.md`; the rules `.claude/rules/names.md`,
`.claude/rules/typescript.md`, `.claude/rules/architecture.md`, `.claude/rules/patterns.md`,
`.claude/rules/tests.md`, and `.claude/rules/documentation.md`; the guide `guides/mcp.md` §§ Tasks
and Subscriptions. No skill applies to this design lane.

## The authority, staged 2026-08-26

The `modelcontextprotocol/ext-tasks` repository publishes a STABLE immutable snapshot dated
`2026-07-28` — the same revision date the package implements. The Orchestrator staged it at:

- `/home/user/lsp/.orkestrel/mcp/ext-tasks-2026-07-28-schema.ts` — the source-of-truth TypeScript
  contract (8708 bytes);
- `/home/user/lsp/.orkestrel/mcp/ext-tasks-2026-07-28-schema.json` — the generated JSON Schema
  with `$id` `https://modelcontextprotocol.io/ext-tasks/2026-07-28/schema.json` (99192 bytes).

Read the `.ts` contract in full; it is short. Facts it settles: `Task` requires `taskId`,
`status`, `createdAt`, `lastUpdatedAt`, and a NULLABLE `ttlMs`, with `statusMessage` and
`pollIntervalMs` optional; `DetailedTask` is the five-variant status union; `CreateTaskResult` is
`Result & Task & { resultType: 'task' }` flat; `tasks/get` answers
`Result & DetailedTask & { resultType: 'complete' }`; `tasks/update` and `tasks/cancel` answer
`Result & { resultType: 'complete' }`; `notifications/tasks` params are
`NotificationParams & DetailedTask`; the `subscriptions/listen` request gains
`taskIds?: string[]` and the acknowledged notification echoes the agreed `taskIds`; the extension
capability id is `io.modelcontextprotocol/tasks` declared as an empty object.

## Measured terrain, 2026-08-26

- `src/core/types.ts:733` carries a comment dating the extension as DRAFT
  (`specification/draft`) — stale against the stable snapshot named earlier.
- The task types sit at `src/core/types.ts:750-830`: `MCPTaskStatus`, `MCPTask`,
  `MCPTaskDetail` (the five-variant union), `MCPTaskResult` (`resultType: 'task'`, flat),
  `MCPTaskContext`, and `MCPTaskManagerInterface` (a pull store: `task` answers a snapshot or
  `undefined`; deliberately no plural accessor).
- `src/core/MCPTaskClient.ts` is the client-side task surface.
- `rg -n "notifications/tasks" src/ tests/src/` returns nothing: the family does not exist.
- `rg -n "taskIds" src/ tests/` returns nothing: the listen filter carries no tasks member.
- The M3 subscription architecture: `MCPSubscriptionFilter` at `src/core/types.ts:1325`
  (tools, prompts, resources members), `MCPSubscriptionHandler` at `:1427` producing
  notifications for one honoured filter, `MCPSubscriptionOptions` at `:1433`, the server's
  built-in `subscriptions/listen` registration at `src/core/MCPServer.ts:316` with its handler at
  `:1286`, and the client's `listen` at `src/core/MCPClient.ts:404` returning a backpressured
  `MCPSubscriptionStream`.
- Conformance in this package is the LIVE `@modelcontextprotocol/conformance` foreign runner
  (`tests/setupConformance.ts`, `tests/conformance.test.ts`); no schema mirror exists under
  `tests/`. The lsp sibling package carries the other precedent: a vendored immutable metaModel
  mirror under `tests/mirrors/` with a dedicated conformance project comparing local declarations
  against it row by row.

## The plan's ruling to design within

M4 — tasks proof: signatures verified against the staged authoritative schema; the
`notifications/tasks` family lands so transitions arrive without polling. The scope is fixed;
name work outside it as a registered capability, never as a unit.

## The questions — argue each from your lane's perspective

1. **The transition path.** `MCPTaskManagerInterface` is a pull store, yet `notifications/tasks`
   requires the server to learn of transitions the manager's own work produces. What is the
   minimal contract change that lets transitions arrive without polling — and without the server
   polling the store either? Rule on the candidate shapes you see (a manager-emitted event
   surface, a server-supplied callback the manager invokes, the subscription handler observing
   the store, or another shape you argue better) with the repository's emitter and port patterns
   as the law.
2. **The filter and acknowledgement.** How does `taskIds` enter `MCPSubscriptionFilter` and the
   acknowledged shape while keeping the wire spellings verbatim and the existing members
   untouched? What happens on a `taskIds` entry naming a task the caller is not entitled to see,
   given the `-32602` anti-enumeration law the manager contract states?
3. **The notification shape.** `notifications/tasks` params are `NotificationParams &
   DetailedTask` — flat, not nested. Which existing type carries this
   (`MCPTaskDetail` plus metadata, or a distinct notification params type), and where does it sit
   in the types file's naming families?
4. **The verification form.** What does "signatures verified against it" become in this package:
   a vendored immutable mirror of the staged schema under `tests/mirrors/` with comparison rows
   (the lsp precedent), JSON-Schema validation of real wire messages captured from the live
   fixture round-trip, or both? Rule on cost and on what each form can actually falsify. The live
   conformance runner pins the base protocol, not the extension; state whether the runner
   exercises tasks at all, as an unknown for the Orchestrator if you cannot read it from the
   pinned runner's declarations.
5. **The stale era comment.** The `src/core/types.ts:733` comment dates the extension as DRAFT.
   State the correction and any other prose the stable snapshot falsifies (sweep the types file's
   task sections and `guides/mcp.md` § Tasks for claims about the extension's stability, its
   spec path, or its schema id).
6. **The unit cut.** Propose the units, their owned files, their serial order, their engines by
   work class, and each unit's independently checkable acceptance criteria. State the exit
   criterion whose closure ends M4.

## Output

Return, as your final message, a ruling with: your position per question, numbered; the evidence
behind each (file and line); the unit cut with routing; the risks the implementing briefs must
carry; and what you could not settle from the tree, named as unknowns for the Orchestrator. No
process diary. The Orchestrator retains your ruling to `/home/user/lsp/.orkestrel/mcp/` and
reconciles it with the other lane.
