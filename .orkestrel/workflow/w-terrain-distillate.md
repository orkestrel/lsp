**Question:** Terrain for swapping `@orkestrel/workflow` task progress `{ current, total?, unit? }` to the MCP progress notification shape `{ progress, total?, message? }`, removing `unit`, no shim.

---

### 1. Progress surface in `src/`

**Type (authoritative shape)**

- `src/core/types.ts:191-195` — `TaskProgress`: `{ readonly current: number; readonly total?: number; readonly unit?: string }`
- `src/core/types.ts:185-189` — TSDoc: `current` + optional `total` (finite, non-negative; `total` ≥ `current`); `unit` is optional observer-facing text

**Interfaces that embed it**

- `src/core/types.ts:217-222` — `TaskActivityInput.progress?: TaskProgress`
- `src/core/types.ts:227-233` — `TaskActivity.progress?: TaskProgress` (plus required `operations` / `constraints` / `updated`)
- `src/core/types.ts:458` — `TaskSnapshot.activity?: TaskActivity`
- `src/core/types.ts:891` — `TaskInterface.activity: TaskActivity | undefined`
- `src/core/types.ts:711-714` — `TaskEventMap.report` / `.pulse` payloads: `readonly [activity: TaskActivity]`
- `src/core/types.ts:911` — `TaskInterface.report(input: TaskActivityInput): Result<TaskActivity, WorkflowError>`
- `src/core/types.ts:1573` — `TaskControllerInterface.report` same signature

**`unit` declaration sites (progress member only)**

- `src/core/types.ts:189` — TSDoc names `unit`
- `src/core/types.ts:194` — `readonly unit?: string`
- `src/core/validators.ts:246` — allowed keys `'current' | 'total' | 'unit'`
- `src/core/validators.ts:253` — `const unit = progress.unit`
- `src/core/validators.ts:258` — `unit !== undefined && !isNonEmptyString(unit)` rejects empty `unit`
- `src/core/cloners.ts:122` — same allowed-key set
- `src/core/cloners.ts:129` — `const unit = progressInput.unit`
- `src/core/cloners.ts:133` — freeze-copy `{ current, total?, unit? }`

Not progress: `src/core/types.ts:2044` `RunnerEventMap.unit` is a runner lifecycle event `[id]`.

**Guards / clone (no dedicated parser, factory, or constant)**

- `src/core/validators.ts:222-325` — `isTaskActivityInput`: progress optional; if present, plain record, keys only `current`/`total`/`unit`; `current` finite ≥ 0; `total` if present finite and ≥ `current`; `unit` if present non-empty string
- `src/core/validators.ts:330-369` — `isTaskActivity` forwards `progress` into `isTaskActivityInput`
- `src/core/validators.ts:178` — snapshot leaf: `task.activity === undefined || isTaskActivity(task.activity)`
- `src/core/cloners.ts:61-179` — `cloneTaskActivity`: freeze-copies `{ current, ...(total), ...(unit) }`
- `src/core/cloners.ts:15-29` — `cloneWorkflowSnapshot` JSON-clones then `isOwnedWorkflowSnapshot` (which uses `isTaskActivity`)

**Class members**

- `src/core/tasks/Task.ts:101` — `#activity: TaskActivity | undefined`
- `src/core/tasks/Task.ts:119` — constructor `activity?: TaskActivity`
- `src/core/tasks/Task.ts:176` — restore path: `cloneTaskActivity(activity)`
- `src/core/tasks/Task.ts:234-236` — getter `activity`
- `src/core/tasks/Task.ts:266` — `start` seeds `cloneTaskActivity({})`
- `src/core/tasks/Task.ts:347-371` — `report` → `cloneTaskActivity` → emit `report`
- `src/core/tasks/Task.ts:373-378` — `pulse` re-emits stored `#activity` (no reshape)
- `src/core/tasks/Task.ts:448` — `snapshot()` copies `#activity` as-is
- `src/core/tasks/TaskController.ts:42,54,80-81` — forwards `TaskActivityInput` / `TaskActivity`; does not read members

No `TaskProgress` factory, constant, or shaper. `src/core/shapers.ts` and `src/core/constants.ts` do not mention this shape. `src/core/helpers.ts:524` strips `activity` on recovery-to-pending; does not read `unit`/`current`.

---

### 2. Emit and consume sites

**Construct**

- `src/core/cloners.ts:130-134` — only freeze-construction of a progress object: `{ current, total?, unit? }`
- Callers that pass progress objects into that clone: `Task.report` (`Task.ts:357`), restore (`Task.ts:176`), tests/guides listed in §3–4

**Cross emitter / transport**

- `src/core/tasks/Task.ts:360` — `this.#emitter.emit('report', activity)` after clone
- `src/core/tasks/Task.ts:378` — `this.#emitter.emit('pulse', activity)` (frame already stored)
- `src/core/types.ts:712-714` — event payloads are whole `TaskActivity`, not a bare progress object
- `src/core/WorkflowRunner.ts:676-678` — `TaskController` closure: `task.report(input)` when attempt still owns the task
- `src/core/tasks/TaskController.ts:80-81` — `report` delegates that closure
- `src/core/WorkflowPersistence.ts:159-160,170-171` — subscribes `report`/`pulse` for coalesced snapshot writes; does not read progress members
- Snapshot restore: `src/core/phases/Phase.ts:510` passes `snapshot.activity` into `Task`; stores clone via `cloneWorkflowSnapshot` (`MemoryWorkflowStore.ts:47,52`, `DatabaseWorkflowStore.ts:74,79`, `Workflow.ts:400`, `factories.ts:177,206,212`)

**Reads of `unit` or of members the swap removes/renames (`current`, `unit`)**

- `src/core/validators.ts:246,251-258` — reads `current`/`total`/`unit`
- `src/core/cloners.ts:122,127-133` — reads and copies `current`/`total`/`unit`
- Tests/guides in §3–4 construct or expect those keys
- No `src/` consumer reads `activity.progress.unit` or `.current` as a named property except validators/cloners

---

### 3. Blast set (current shape or `unit`)

**Fixtures**

- `tests/setup.ts:19-24` — `INVALID_TASK_ACTIVITIES` rows:
  - `{ progress: { current: Number.NaN } }`
  - `{ progress: { current: -1 } }`
  - `{ progress: { current: 2, total: 1 } }`
  - `{ progress: { current: 1, unit: '' } }`

**Tests that assert that fixture or the live shape**

- `tests/src/core/validators.test.ts:21-22` — accepts `{ progress: { current: 1 }, operations: [], constraints: [] }`
- `tests/src/core/validators.test.ts:34-35` — `it.each(INVALID_TASK_ACTIVITIES)`
- `tests/src/core/cloners.test.ts:15-16,21-23` — constructs and `toEqual` `{ current: 2, total: 4, unit: 'steps' }`
- `tests/src/core/cloners.test.ts:43` — `{ progress: { current: 1, extra: true } }` unknown-key reject
- `tests/src/core/cloners.test.ts:52-54` — `it.each(INVALID_TASK_ACTIVITIES)`
- `tests/src/core/tasks/Task.test.ts:178-180` — `report({ progress: { current: 2, total: 4, unit: 'files' } })`
- `tests/src/core/tasks/Task.test.ts:194-197` — `report({ progress: { current: 5 } })` then `toEqual({ current: 5 })`
- `tests/src/core/tasks/Task.test.ts:212` — `report({ progress: { current: 2, total: 1 } })` MUTATION

**Guide fences / Surface row that write the shape**

- `guides/workflow.md:295` — `{ progress: { current: 2, total: 10, unit: 'files' } }`
- `guides/workflow.md:341` — Surface: `` `{ current, total?, unit? }` ``
- `guides/workflow.md:972` — `{ current: 240, total: 1_000, unit: 'files' }`
- `guides/workflow.md:982` — prose rule `total < current`

`tests/guides.test.ts` bijection is export-name / method-name, not shape-cell text. `tests/setup.test.ts:80-89` only checks `INVALID_TASK_ACTIVITIES` frozen/arity/uniqueness, not member names.

Not this shape: `tests/src/core/Workflow.test.ts:649` “partially-progressed” tree; `guides/probe.md` `StageInterface.progress` (numeric stage level).

---

### 4. Guide surfaces (`guides/`)

**Surface** — `guides/workflow.md:19` (`## Surface`)

- `guides/workflow.md:87` — `Task` class: “bounded current activity”
- `guides/workflow.md:213-215` — `cloneTaskActivity` / `isTaskActivityInput` / `isTaskActivity` (progress bounds named on the input guard)
- `guides/workflow.md:341` — `TaskProgress` row: `{ current, total?, unit? }`
- `guides/workflow.md:344-345` — `TaskActivityInput` / `TaskActivity` embed `progress?`
- `guides/workflow.md:357` — `TaskSnapshot.activity?`
- `guides/workflow.md:364` — `TaskEventMap` includes `report` / `pulse`
- `guides/workflow.md:373,378` — `TaskInterface` / `TaskControllerInterface` activity checkpoints

**Methods** — `guides/workflow.md:401` (`## Methods`)

- `guides/workflow.md:457-458` — `TaskInterface.report` / `pulse`
- `guides/workflow.md:539-540` — `TaskControllerInterface.report` / `pulse`

**Prose / fences**

- `guides/workflow.md:287-301` — helper fence with `{ current, total, unit }`
- `guides/workflow.md:942,961` — observer “progress UI”; `report(activity)` / `pulse(activity)`
- `guides/workflow.md:965-982` — section “Long-running task activity and cooperative control”; fence + `total < current`
- `guides/workflow.md:1384` — “subscribe … for progress / metrics”

`README.md:24-25` mentions “progress” without the member shape.

---

### 5. `@orkestrel/mcp`

- `package.json:93-101` `dependencies` — no `@orkestrel/mcp`
- `package.json:102-117` `devDependencies` — no `@orkestrel/mcp`
- `src/` — no import of `@orkestrel/mcp`
- `tests/` — no import of `@orkestrel/mcp`
- `package-lock.json:301-303,332` — package present as a transitive dependency of installed `@orkestrel/probe` (`^0.0.23`), not a direct workflow dependency

---

### 6. Barrel

`src/core/index.ts` (package `"."` export):

- `src/core/index.ts:1` — `export * from './types.js'` → `TaskProgress`, `TaskActivityInput`, `TaskActivity`, `TaskEventMap`, `TaskInterface`, `TaskControllerInterface`, `TaskOptions`, `TaskSnapshot`
- `src/core/index.ts:7` — `export * from './cloners.js'` → `cloneTaskActivity`
- `src/core/index.ts:8` — `export * from './validators.js'` → `isTaskActivityInput`, `isTaskActivity`
- `src/core/index.ts:15-16` — `export * from './tasks/Task.js'` / `TaskController.js`

`src/browser/index.ts` and `src/server/index.ts` do not re-export these types.

---

### 7. Owning entity

**Class:** `Task` — `src/core/tasks/Task.ts:37` implements `TaskInterface` (`src/core/types.ts:851`).

**Option object:** `TaskOptions` — `src/core/types.ts:744-752`: `{ on?, error?, metadata?, silence? }`. No progress field. Progress enters only via `report(TaskActivityInput)`.

**Event map:** `TaskEventMap` — `src/core/types.ts:696-717`: `start`, `complete`, `fail`, `pause`, `resume`, `skip`, `stop`, `report([activity])`, `pulse([activity])`, `silence`. Wired at `Task.ts:145-148`; exposed `Task.ts:182-183` / `TaskInterface.emitter` `types.ts:852`.

**Public methods / activity members on `TaskInterface` (`types.ts:851-927`):** `start`, `complete`, `fail`, `skip`, `stop`, **`report`**, **`pulse`**, `pause`, `resume`, `wait`, `patch`, `snapshot`; plus `activity` / `silence` / `silent`. Implementations: `Task.ts:254` `start`, `347` `report`, `373` `pulse`, `432` `snapshot`.

**Forwarding handle (not the owner):** `TaskController` — `src/core/tasks/TaskController.ts:36`; `TaskControllerInterface` `types.ts:1556-1588`; `report`/`pulse` at `TaskController.ts:80-85`; ownership gate `WorkflowRunner.ts:670-686`.

---

**Unknowns:** none from this tree; MCP notification type itself is not in this repo’s `src/` or `package.json`.
