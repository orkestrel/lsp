# M4 ruling — subjective lane (`planner`, Claude Opus 5, native, read-only)

Returned 2026-08-26; retained verbatim by the Orchestrator.

I held the **subjective** lane: shape, naming, ergonomics, design fit, what the API must feel like to a consumer.

## 1. The transition path

**Position: change nothing on `MCPTaskManagerInterface`. The transition path already exists and is `MCPSubscriptionOptions.listen`.** M4 lands the family by teaching the subscription mechanism to carry a notification it already refuses, not by growing the task port a second direction.

The package's own contract says why. `MCPTaskManagerInterface` is a pull store because the package holds no task state, and the reason is stated as a boundary rather than a convenience: "a durable operation outlives the process that answered the request and MCP has no durable place to keep one" (`/home/user/mcp/src/core/types.ts:741-745`). The consumer who owns that store is the same consumer who supplies `subscription.listen`, and `listen` is already an event-driven producer of `JSONRPCNotification` that parks on its own source while idle (`/home/user/mcp/src/core/types.ts:1416-1438`). The consumer therefore already holds both halves — the thing that observes a transition, and the door that pushes a frame. Nothing in this package sits between them, and nothing needs to.

What lands instead is admission: the built-in `#subscription` generator owns the acknowledgement, the filter match, the id stamp, and the closure order (`/home/user/mcp/src/core/MCPServer.ts:1304-1364`), and today `matchesSubscriptionNotification` returns `false` for every method outside its four (`/home/user/mcp/src/core/helpers.ts:907-923`). A `notifications/tasks` frame a consumer produces is dropped silently. One branch keyed on `params.taskId`, mirroring the `notifications/resources/updated` branch keyed on `params.uri` at `/home/user/mcp/src/core/helpers.ts:920-922`, is the whole of the server's transition work.

Ruling on the candidates the brief named:

- **A manager-emitted event surface — refused.** `.claude/rules/patterns.md` § Stateful emitters composes an emitter into an entity *this package owns*, with `on`/`error` options, a `destroy` ordering obligation, and listener isolation this package enforces. `MCPTaskManagerInterface` is a consumer-implemented port over a durable store, and an emitter on it asserts that transitions happen in this process — which is exactly the claim the port's own remark denies. It also taxes every implementer: a store backed by a queue in another process would have to invent an in-process emitter to satisfy a contract it cannot honour.
- **A server-supplied callback the manager invokes — refused.** It inverts the port. The package would hand a sink across a boundary whose far side legitimately outlives this process, and the sink's lifetime has no owner: `MCPMethodOptions.signal` is the *request's* lifetime and aborts the moment the answer is flushed (`/home/user/mcp/src/core/types.ts:1398-1403`, and the hazard stated at `:829-839`). A callback bound to it dies milliseconds after every task it was meant to report on — the same trap the file already documents for `options.signal`, arriving through a new door.
- **The subscription handler observing the store — refused outright.** That is a poll loop wearing a producer's coat, and `AGENTS.md` § Design laws bans polling architecture without qualification.
- **The shape I rule better: no new port.** It is the only candidate that adds no public surface at all on the manager side, and `AGENTS.md` § Design laws § Minimal public API makes "add nothing" the default a candidate must beat.

One consequence to fix in the same ruling: **the server honours `taskIds` only when it can actually push a task frame, and that fact is derived rather than declared.** A server pushes task notifications when the Tasks extension is configured (`this.#options.task !== undefined`, the same fact that gates the `tasks/*` registrations at `/home/user/mcp/src/core/MCPServer.ts:356-359`) **and** a subscription producer exists (`this.#options.subscription !== undefined`, read at `/home/user/mcp/src/core/MCPServer.ts:1332`). Both are already server state. Storing a third declaration would be the second flag that drifts, which `AGENTS.md` § Design laws § Derive state forbids.

## 2. The filter and acknowledgement

**Position: `taskIds?: readonly string[]` joins `MCPSubscriptionFilter` as a peer of `resourceSubscriptions`, and the acknowledgement needs no new type at all.**

The member is a verbatim wire spelling, so it lands under the exemption the type's own remark already states — those keys "are not this package's to choose" (`/home/user/mcp/src/core/types.ts:1314-1334`). The staged authority fixes the spelling twice: the contract declares `taskIds?: string[]` on `TaskSubscriptionNotifications` (`/home/user/lsp/.orkestrel/mcp/ext-tasks-2026-07-28-schema.ts:322-327`) and the generated schema repeats it (`/home/user/lsp/.orkestrel/mcp/ext-tasks-2026-07-28-schema.json:1530-1540`). `readonly string[]` matches the sibling exactly (`/home/user/mcp/src/core/types.ts:1333`), and the ergonomics are already right: a string array of ids beside a string array of URIs reads as one idea, and `client.listen` takes `MCPSubscriptionFilter` directly (`/home/user/mcp/src/core/MCPClient.ts:404-411`), so the client half gains the capability with no new method and no new option.

The acknowledgement needs nothing new because `buildSubscriptionAcknowledgement` already echoes the honoured filter under `params.notifications` (`/home/user/mcp/src/core/helpers.ts:957-969`), and the authority's acknowledged fragment declares the same `taskIds` member with the same shape (`/home/user/lsp/.orkestrel/mcp/ext-tasks-2026-07-28-schema.ts:335-340`). That the echo is already the mechanism is the strongest evidence the M3 architecture anticipated this family correctly.

`isMCPSubscriptionFilter` gains one clause in the shape of its existing `resourceSubscriptions` clause (`/home/user/mcp/src/core/validators.ts:1264-1276`), and the guard stays total and open to unknown members.

**On an entry the caller is not entitled to see: the server resolves no task id at listen time, echoes the requested ids as honoured, and lets the producer decide what it delivers.**

This is the judgment call in the round, so I state the reasoning. Resolving each requested id through `tasks.task(id, options)` before acknowledging feels right — it reuses the authorization seam the port already owns (`/home/user/mcp/src/core/types.ts:900-914`) and it would drop unentitled ids the way `buildSubscriptionFilter` drops unsupported URIs. It is wrong, and the anti-enumeration law is the reason. The `-32602` rule exists so a `taskId` cannot be probed for existence — the guide states it as byte-identical treatment of the never-existed, the purged, and the unentitled (`/home/user/mcp/guides/mcp.md:1449-1454`). An acknowledgement that echoes the subset that resolved is a **batch** oracle: one listen request carrying a hundred guesses returns exactly which ones exist and belong to the caller. That is strictly worse than the single-id probe the law already refuses, and it arrives through the one method that answers in bulk.

Echoing the request instead leaks nothing, because the client already knows what it asked for. Entitlement lands where the principal lives — in the consumer's producer, which is the only party holding both the caller context and the store. `MCPMethodOptions.caller` reaches `listen` unchanged (`/home/user/mcp/src/core/types.ts:1427-1430`), so the producer has what it needs and this package has, as everywhere else in this extension, no principal of its own to check one against.

`buildSubscriptionFilter` therefore takes the tasks decision as an explicit input rather than reading it out of `supported`. The supported side of the filter has no honest spelling for "any task id" — a list cannot mean "all", and inventing `taskIds: []` or a wildcard string is precisely the sentinel `AGENTS.md` § Design laws § Absence bans. A third parameter, `tasks: boolean`, keeps the helper pure and total, matches the boolean-behaviour law, and leaves `MCPSubscriptionOptions` untouched so no shipped M3 surface breaks.

## 3. The notification shape

**Position: a distinct params type in the tasks family, `MCPTaskNotificationParams`, defined as `MCPTaskDetail` intersected with an optional correlation metadata member — plus one guard, `isMCPTaskNotification`.**

The authority makes the params flat and makes `_meta` load-bearing. `TaskStatusNotificationParams` is `NotificationParams & DetailedTask` (`/home/user/lsp/.orkestrel/mcp/ext-tasks-2026-07-28-schema.ts:298-299`), `NotificationParams` carries `_meta` (`/home/user/lsp/.orkestrel/mcp/ext-tasks-2026-07-28-schema.json:2434-2442`), and that metadata object declares `io.modelcontextprotocol/subscriptionId` as **optional**, with the reason spelled out: the key is present on every frame delivered on a listen stream and absent on frames that are not (`/home/user/lsp/.orkestrel/mcp/ext-tasks-2026-07-28-schema.json:2424-2433`). This package already writes that key on every stamped frame (`/home/user/mcp/src/core/helpers.ts:932-948`), so the shipped behaviour is already conformant and only the declaration is missing.

Placement and naming:

- Put `MCPTaskNotificationParams` in the **tasks** section beside `MCPTaskDetail` (`/home/user/mcp/src/core/types.ts:792-810`), not in the subscription section. The type's owner is the task; the subscription is the carrier. A consumer looking for it looks under tasks.
- Add `MCPNotificationMetaObject` in the metadata family beside `MCPResultMetaObject` and `MCPSubscriptionResultMetaObject` (`/home/user/mcp/src/core/types.ts:1282-1285`, `:1336-1340`). The symmetry is exact and self-documenting: the subscription **result** pins the id as required, the subscription-borne **notification** pins the same id as optional, and the difference is the authority's own.
- `isMCPTaskNotification` binds the method to the params. It survives the wrapper test in `.claude/rules/architecture.md` § Wrapper test because it adds a real invariant rather than renaming one: `isMCPTaskDetail` alone cannot tell a task frame from any other frame whose params happen to carry a `taskId`.

**Runner-up, refused: carry no new type and have consumers call `isMCPTaskDetail(notification.params)`.** It works today — that guard admits unrecognized members (`/home/user/mcp/src/core/validators.ts:1104-1119`, remark at `:1089-1091`) and `_meta` passes through it. It is refused because it leaves the correlation key untyped, so a consumer running several subscriptions correlates frames by reading an untyped record, and because it makes the client's narrowing a two-step nobody will get right the first time. The single guard is the ergonomic difference between the family feeling shipped and feeling merely reachable.

## 4. The verification form

**Position: both, with the vendored mirror as the primary and a live round-trip as its complement. Refuse JSON-Schema validation of wire messages.**

State first what each form can falsify, because the forms are not substitutes:

- A **vendored mirror with comparison rows** falsifies *declaration* drift: a member this package spells differently, a field the authority requires and this package made optional, a status the authority dropped, a nullable this package flattened. That is exactly the class M4's phrase "signatures verified against it" names, and it is the only form that can see a signature the package never wrote at all.
- A **live round-trip** falsifies *wiring*: that a produced `notifications/tasks` frame survives ownership, matches the honoured filter, carries the stamp, and reaches the client's stream in wire order. A mirror cannot see a matcher branch that was never added.
- **JSON-Schema validation of captured messages** falsifies neither well. It validates instances, so it is blind to a declaration with no instance, and every instance it does judge was produced by the fixture that this package wrote — an implementation asserted against itself, which `.claude/rules/tests.md` names as the failure that reads exactly like a real test. It also needs a JSON-Schema validator, which is an npm package the user has not requested; `AGENTS.md` forbids adding one, and `AGENTS.md` § Project model forbids a second source-language analyzer besides.

The mirror's shape follows the lsp precedent verbatim: bytes pinned by digest and refused on mismatch (`/home/user/lsp/tests/setupConformance.ts:132-135`, `:258-287`), path resolved from one exported constant (`:181-182`), row builders that compare one local symbol against one authority coordinate (`:552-585`). Mirror the **JSON**, not the `.ts`: the JSON is generated, digest-stable, and readable as data, while comparing against the `.ts` would require parsing TypeScript in a repository that bans a second parser. Its home is the existing `conformance` project — `tests/conformance.test.ts` is fixed as the place "where this package drifts from the official tooling it tracks" (`.claude/rules/tests.md` § Cross-cutting proofs), and `tests/setupConformance.ts` already owns that project's shared infrastructure.

**On whether the live runner exercises tasks: it does not. I read it rather than inferring it.** The pinned runner is `@modelcontextprotocol/conformance` `0.2.0-alpha.10` (`/home/user/mcp/package.json:107`), installed at `/home/user/mcp/node_modules/@modelcontextprotocol/conformance`. Searching that installed tree for `tasks/get`, `notifications/tasks`, and `io.modelcontextprotocol/tasks` returns no file; searching it for `taskId`, `TaskStatus`, and a `resultType`-adjacent `task` returns zero occurrences across zero files. The repository's own fixture registry carries no task tooling either (`/home/user/mcp/tests/setupConformance.ts:125-302`), and `tests/conformance.test.ts` contains no case-insensitive match for `task`. The runner pins the base protocol and leaves the extension entirely unproven, which is why the mirror is not optional.

## 5. The stale era comment

**The correction: the extension publishes a stable immutable snapshot dated `2026-07-28` under the id `io.modelcontextprotocol/tasks`, at schema id `https://modelcontextprotocol.io/ext-tasks/2026-07-28/schema.json` — the same revision date this package implements.** Delete every claim that it is draft, that it lives under `specification/draft/`, and that it carries no stability guarantee.

Sweep, by file and line, from a case-insensitive search for `draft` and `io.modelcontextprotocol/tasks` across `**/*.{ts,md}` in `/home/user/mcp`:

- `src/core/types.ts:733-734` — the era comment itself, including "carries no stability guarantee; every type below can change with it".
- `src/core/types.ts:985` — "the server's draft Tasks extension".
- `src/core/types.ts:1790`, `:1833`, `:1837` — the `MCPServerOptions.task` prose, including "The extension is DRAFT and carries no…".
- `src/core/types.ts:2410`, `:2449`, `:2570` — the client-half prose and "unrecognized draft members".
- `src/core/validators.ts:1089-1091` — the openness remark. **The behaviour survives the correction; its stated reason does not.** Openness stands because a guard over a foreign contract enforces the published contract and no more (`.claude/rules/patterns.md` § Foreign contracts), not because the extension is draft. Rewriting the reason is part of the correction, not beside it.
- `src/core/MCPServer.ts:127`, `:346`, `:813`; `src/core/MCPClient.ts:136`; `src/core/helpers.ts:96-114` — comment and TSDoc mentions.
- `src/core/constants.ts:63`, `:82-86` — the extension-id constant's TSDoc. **Keep the `-32003` remark.** It says the extension's own prose examples show `-32003` while the dated core schema fixes `-32021`, and the staged snapshot does not falsify it; it becomes a checkable claim rather than a hedge.
- `guides/mcp.md:1323-1327` — the block-quoted DRAFT notice, which is the loudest false statement in the package and the one a consumer reads before deciding whether to configure `task`. Its final sentence — "Configure `task` only where a breaking change between releases is acceptable" — is a product recommendation the authority no longer supports.
- `guides/mcp.md:324`, `:1447`, `:1852`, `:1870`, `:1955`, `:1958`, `:2964`, `:3031`, `:3074` — table cells, surface rows, and section prose.
- `guides/mcp.md:4057-4074` — the declared non-goal. Partly falsified and partly not, so it is **rewritten, not deleted wholesale**. Falsified: the member is named, and it is `taskIds` in the contract and in the generated schema alike. Standing: the composing envelope is still absent, so the residual doubt moves from "the family is excluded" to a named conformance gap. Its settled sentence about `TaskStatusNotificationParams` being flat is correct and stays.
- `tests/setup.ts:1143`, `:1165`; `tests/src/core/MCPTaskClient.test.ts:20`; `tests/src/core/MCPServer.test.ts:4805`, `:4876`; `tests/src/core/validators.test.ts:1641` — comments and suite titles.

Nothing in the tree names the schema id at all, which is why the mirror row set carries it: an id stated only in prose is a claim nothing tries.

## 6. The unit cut

Serial throughout — every unit writes in the main checkout, one at a time, each from a clean committed baseline, per `.agents/orchestration.md` § Writing concurrency.

| Unit | Role and engine | Owns | Depends on |
| --- | --- | --- | --- |
| `m4-era` | `implementer` — Opus 5 (native) | Source comments and TSDoc in `src/core/types.ts`, `validators.ts`, `constants.ts`, `helpers.ts`, `MCPServer.ts`, `MCPClient.ts`; comments and suite titles in `tests/setup.ts`, `tests/src/core/MCPServer.test.ts`, `MCPTaskClient.test.ts`, `validators.test.ts` | — |
| `m4-contract` | `implementer` — Opus 5 (native) | `src/core/types.ts`, `src/core/validators.ts` | `m4-era` |
| `m4-mirror` | `sol` — GPT-5.6 Sol (bridge) | `tests/mirrors/ext-tasks-2026-07-28.json`, `tests/setupConformance.ts`, `tests/conformance.test.ts` | `m4-contract` |
| `m4-stream` | `sol` — GPT-5.6 Sol (bridge) | `src/core/helpers.ts`, `src/core/MCPServer.ts` | `m4-mirror` |
| `m4-proof` | `implementer` — Opus 5 (native) | `tests/setup.ts`, `tests/src/core/helpers.test.ts`, `validators.test.ts`, `MCPServer.test.ts`, `MCPClient.test.ts` | `m4-stream` |
| `m4-guide` | `implementer` — Opus 5 (native) | `guides/mcp.md` | `m4-proof` |
| `m4-gates` | `verifier` — Sonnet (native) | nothing | `m4-guide` |

Routing rationale, against `.agents/orchestration.md` § The engines: `m4-contract` is API shape, naming, and family placement — Opus. `m4-mirror` and `m4-stream` are constraint-heavy mechanical precision against a fixed external schema and an ordering-sensitive generator — Sol. `m4-proof` goes to Opus so the engine that proves the wiring is not the engine that wrote it. `m4-guide` is documentation voice — Opus. No unit is reading-heavy enough to belong to Grok; the absorption this round needed is already in the brief and in this ruling.

`m4-mirror` precedes `m4-stream` deliberately. The rows compare declarations against the authority, so any pre-existing signature drift surfaces before wiring is built on top of it — the reverse order discovers a wrong signature after the code that depends on it exists.

Acceptance criteria, cheap-first within each unit:

**`m4-era`** — a case-insensitive search for `draft` across `src/`, `tests/`, and `guides/mcp.md` returns only hits whose sense is unrelated to the Tasks extension, each named in the report with its path and its permitted sense; `npm run format:check` and `npm run lint:check` pass; `npm run check` passes; the scoped `test:src:core` project passes. No behavioural change, so no test count moves.

**`m4-contract`** — `MCPSubscriptionFilter` declares `taskIds?: readonly string[]`; `MCPNotificationMetaObject` and `MCPTaskNotificationParams` exist in the sections this ruling names; `isMCPTaskNotification` and the extended `isMCPSubscriptionFilter` exist and are exported through `src/core/index.ts`; `npm run check` passes; scoped `test:src:core` passes.

**`m4-mirror`** — `tests/mirrors/ext-tasks-2026-07-28.json` is byte-identical to `/home/user/lsp/.orkestrel/mcp/ext-tasks-2026-07-28-schema.json` and its SHA-256 is pinned in `tests/setupConformance.ts`; the row set covers, at minimum, `Task` (each required member, and `ttlMs` nullable), `TaskStatus` (each member), `DetailedTask` (each variant and the payload it owes), `CreateTaskResult` (`resultType: 'task'` and flatness), `GetTaskResult` / `UpdateTaskResult` / `CancelTaskResult` (`resultType: 'complete'`), `TaskStatusNotificationParams`, `TaskSubscriptionNotifications`, `TaskSubscriptionAcknowledgedNotifications`, `TasksExtensionCapability`, and the schema `$id`; a negative control drawn from outside the mirror's membership rule reports failure under the same conditions and is named in the report; `npm run test:conformance` passes and its reported case count is recorded.

**`m4-stream`** — `matchesSubscriptionNotification` admits `notifications/tasks` against `filter.taskIds` by reading `params.taskId` and refuses it otherwise; `buildSubscriptionFilter` takes the tasks decision as an explicit boolean and honours `taskIds` only under it; `MCPServer` derives that boolean from `#options.task` and `#options.subscription` and stores no third flag; `npm run check` passes; scoped `test:src:core` passes with its count recorded.

**`m4-proof`** — a real fixture producer registered through `subscription.listen` emits a `notifications/tasks` frame that a real `MCPClient.listen` stream receives, filtered by `taskIds` and stamped with the subscription id, with no mock, fake, spy, or module replacement anywhere in the path; a frame naming a `taskId` outside the acknowledged set is not delivered; the acknowledgement echoes the requested `taskIds` when the server can push and omits the member when it cannot; each new assertion is shown to fail against the pre-`m4-stream` behaviour, with the exact command and its failing count recorded before and its passing count after; scoped `test:src:core` passes.

**`m4-guide`** — the Tasks and Subscriptions sections document `taskIds`, the notification params shape, the correlation key, and the entitlement ruling; the declared non-goal at `guides/mcp.md:4057-4074` is rewritten as the shipped surface plus a named conformance gap for the composing envelope; every backticked name resolves to a real export and every new export is documented; each executable fence's transcription in `tests/guides.test.ts` asserts the values its comments claim; `npm run test:guides` passes.

**Exit criterion.** M4 ends when each of these capabilities has closed, each implemented, repaired, retained, or intentionally excluded on evidence:

1. The extension's era, spec path, and schema id are stated correctly wherever the package states them — **repaired**.
2. Every task-family signature this package declares is compared, row by row, against the staged authoritative schema by a digest-pinned mirror whose instrument has failed under a control — **implemented**.
3. `notifications/tasks` reaches a subscribed client through the built-in `subscriptions/listen` stream, filtered and stamped, proven end to end with real implementations — **implemented**.
4. `taskIds` enters the filter, the acknowledgement, and the client's `listen` signature at its verbatim wire spelling — **implemented**.
5. `MCPTaskManagerInterface` is unchanged, and the reason is documented on the interface that carries the obligation — **retained**.
6. Entitlement for a `taskIds` entry rests with the consumer's producer, and the package resolves no task id at listen time — **intentionally excluded**, on the anti-enumeration evidence in question 2.
7. The gates run green under an independent `verifier`.

## Risks the implementing briefs must carry

**The composing envelope is unresolved, and a guessed nesting key ships a dialect no peer speaks.** The package's own guide already refused the family for this reason (`/home/user/mcp/guides/mcp.md:4064-4068`), and the staged snapshot does not close it — see the unknowns. Every brief that touches the filter states the assumption it implements (`taskIds` sits directly under `params.notifications`, beside `resourceSubscriptions`) as an assumption, and names it in the guide as a conformance gap rather than as settled wire.

**`isMCPTaskDetail` is open to unknown members, and `MCPTaskNotificationParams` inherits that openness.** A frame whose `_meta` is malformed passes the detail guard. The new `isMCPTaskNotification` must decide what it checks about `_meta` and state it; checking nothing is a defensible answer under the foreign-contract rule, and leaving the decision implicit is not.

**The acknowledgement echo is the sharpest security surface in the change.** A future edit that "improves" it by resolving ids through the store re-creates the batch oracle. The brief for `m4-stream` states the invariant — the server resolves no task id at listen time — and the brief for `m4-proof` pins it with an assertion that fails if a resolution is ever added.

**The derived tasks-support boolean has two inputs and no single home.** A reader of `MCPSubscriptionOptions.notifications` sees tools, prompts, and resources declared explicitly and tasks declared nowhere. That asymmetry is correct under the derive-state law and it will read as an omission to the next person. The TSDoc on `MCPSubscriptionFilter` and the guide's subscriptions section carry the explanation, or the next round adds the flag this ruling refused.

**`m4-era` and `m4-contract` both write `src/core/types.ts`.** Serialization is the whole mitigation; a checkpoint commit before each is mandatory, and neither brief may be dispatched beside the other.

**A test that emits a task frame drives no child process and opens no listener**, so it is measurable inside a bench sandbox. The `m4-proof` brief states that explicitly, because a unit that assumes otherwise will invent an isolation it does not need.

## What I could not settle from the tree

1. **Where `TaskSubscriptionNotifications` composes into the `subscriptions/listen` request.** Measured: the staged contract declares the fragment and never references it (`/home/user/lsp/.orkestrel/mcp/ext-tasks-2026-07-28-schema.ts:313-340`), and the generated schema defines it as a bare `$def` with no composing definition — a search of the staged JSON for `SubscriptionsListen` returns only the unrelated `NotificationMetaObject` description at line 2429. Settling command: fetch the core `spec.types.ts` and core JSON schema for revision `2026-07-28` and search both for `TaskSubscriptionNotifications` and `taskIds`.
2. **Which spelling a peer implements, given the fragment's own prose contradicts its declaration.** The JSDoc says "Clients include tasksStatus to subscribe" while the declared member is `taskIds` (`/home/user/lsp/.orkestrel/mcp/ext-tasks-2026-07-28-schema.ts:322-327`), and the generated schema carries only `taskIds`. I ruled for `taskIds` because the generated schema is what a validator enforces, but the contradiction is in the authority rather than in my reading of it, and it is the same doubt the package recorded on 2026-08-08.
3. **Where `TaskSubscriptionAcknowledgedNotifications` composes into `notifications/subscriptions/acknowledged`.** Same source, same command. My ruling places it under `params.notifications` because that is where this package already writes the honoured filter (`/home/user/mcp/src/core/helpers.ts:957-969`) and because the fragment's name says it is a field set for that notification, not a replacement for its params.
4. **Whether `arrayOf(isString)` in the extended `isMCPSubscriptionFilter` narrows to `readonly string[]` without a new combinator.** The existing clause narrows `resourceSubscriptions` the same way (`/home/user/mcp/src/core/validators.ts:1274-1275`), so the pattern is proven, but I did not read `arrayOf`'s declaration. The `m4-contract` unit settles it before writing, not after.
