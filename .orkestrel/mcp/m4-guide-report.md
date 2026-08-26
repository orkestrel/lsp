# Unit m4-guide — report

`guides/mcp.md` is at parity with the landed M4 surface: the six barrel symbols carry rows,
the era sweep leaves no `draft`, `stability guarantee`, or `specification/` hit in the file,
and the tasks-delivery rulings are documented where the guide already documents
`subscriptions/listen`. `npm run test:guides` exits 0 at `144 passed (144)` from the recorded
`1 failed | 143 passed (144)` baseline, and the scoped format check exits 0. Only
`guides/mcp.md` is modified.

## The six symbols, and where each row sits

Each row states the shape read from `src/core/types.ts` and `src/core/validators.ts` at
`0fe1879`, not from a report. Line anchors are post-edit.

| Symbol                        | Table                         | Line |
| ----------------------------- | ----------------------------- | ---- |
| `MCPNotificationMetaObject`   | `### Types` (line 2097)       | 2117 |
| `MCPTaskDetailResult`         | `### Types`                   | 2186 |
| `MCPTaskNotificationParams`   | `### Types`                   | 2187 |
| `isMCPNotificationMetaObject` | `### Helpers` (line 1981)     | 1992 |
| `isMCPTaskDetailResult`       | `### Helpers`                 | 2053 |
| `isMCPTaskNotification`       | `### Helpers`                 | 2054 |

Each row is placed beside the symbol it is a variant of: the metadata type beside
`MCPResultMetaObject` and its guard beside `isMCPResultMetaObject`, the two task types and
their guards beside `MCPTaskDetail` / `isMCPTaskDetail`.

The parity check `documents an example for every Surface function` passed with no fence
change for the three guards: each carries an `@example` block in `src/core/validators.ts`, and
`source.examples()` supplies those to `findUnexampled`. No example was added for a guard that
already had one.

## The era-sweep population, and what each hit became

The population is `grep -rin "draft\|stability guarantee\|specification/" guides/mcp.md` run
from `/home/user/mcp` before editing. It returned the following, and nothing else; the
post-edit run of the same pattern over the same path returns no hit (exit 1).

| Baseline line | Hit                                                              | What it became                                                                                                                       |
| ------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| 324           | `when the draft Tasks extension is configured`                   | `the stable Tasks extension`                                                                                                         |
| 1323-1327     | The block-quoted `**This surface is DRAFT.**` notice             | Deleted, and replaced by a plain opening fact: the stable immutable snapshot dated 2026-07-28, its extension id, its generated schema id |
| 1447          | `The extension's own draft prose still shows -32003 in examples` | `The extension's own prose examples show -32003` — the `constants.ts` wording                                                        |
| 1523-1524     | `Task notifications are not implemented`                        | Rewritten: a transition reaches a subscribed client through `subscriptions/listen`, with pointers to both subscription sections       |
| 1852          | `MCPTaskClient` entity row, `draft`                             | `stable`                                                                                                                             |
| 1870          | `MCP_EXTENSION_TASKS` const row, `draft`                        | `the stable Tasks extension id, dated 2026-07-28 and advertised by presence`                                                          |
| 1955          | `isTaskSupported` row, `draft` and the presence-only claim       | `stable`, plus the exactly-empty declaration the landed `isTaskSupported` enforces                                                    |
| 1958          | `isMCPTaskDetail` row, `unrecognized draft members`             | `unrecognized members`                                                                                                               |
| 2087          | `MCPTask` row, `verbatim draft-schema spelling`                 | `verbatim spelling from the dated snapshot`                                                                                          |
| 2093          | `MCPTaskOptions` row, `DRAFT`                                   | `stable`                                                                                                                             |
| 2121          | `MCPServerOptions` row, `DRAFT`                                 | `stable`                                                                                                                             |
| 2964          | `The DRAFT Tasks extension's consumer half`                     | `The stable Tasks extension's consumer half`                                                                                         |
| 3031          | `the draft Tasks extension's client half`                       | `the stable Tasks extension's client half`                                                                                           |
| 3074          | `The DRAFT Tasks extension's CLIENT half`                       | `The stable Tasks extension's CLIENT half`                                                                                           |
| 4058          | `The draft Tasks extension defines notifications/tasks`         | The conformance-gap row, rewritten — see the following section                                                                       |

The standing replacement is the `m4-era` unit's: the noun phrase "the draft Tasks extension"
becomes "the stable Tasks extension", one term for one concept across source, tests, and now
the guide. The full dated identity lands at identity sites rather than at every mention: the
schema id appears once, in the opening fact of `### Defer a call to a durable task`, and the
snapshot date appears there and on the `MCP_EXTENSION_TASKS` constant row.

## The delivery rulings, and where each landed

`### Configure modern subscriptions` (line 808) carries the server half, in four paragraphs
after the existing server fence plus one added fence:

- the `taskIds` filter key, added to the wire-spelling list at line 828, with the placement
  named as this package's reading and pointed at the conformance gap;
- the derived support fact — the member is honoured only when `task` and `subscription` are
  both configured, derived at answer time with no third flag;
- the authorize-and-omit acknowledgement — resolution through
  `MCPTaskManagerInterface.task(id, options)`, request order preserved, duplicates intact, an
  unresolved identifier omitted with no distinguishing signal, the member omitted entirely
  when nothing resolves, and `-32602` for a malformed array before any read;
- the fixed agreed set — reads happen once at acknowledgement and none at delivery, with
  mid-stream revocation named as the producer's, and `isMCPTaskNotification` gating the branch
  before the agreed set is read;
- the delivery claim — from producer delivery onward, in producer order, with no replay.

`### Consume a subscription from a client` (line 951) carries the client half at line 986: ask
by naming identifiers in `taskIds`, read the acknowledged set rather than the requested one,
and the stamp deciding that a stamped frame arrives on the stream rather than on the client's
`notification` event.

`#### MCPTaskClientInterface` (line 3171) carries the guide half of the client-prose routing
correction, as a paragraph after the `pollIntervalMs` one: which door a task notification
arrives through is decided by the subscription stamp. The vocabulary mirrors the landed
`MCPTaskClientInterface` TSDoc at `src/core/types.ts:2515-2521`, including "at no added
mechanism".

Surface rows updated for the same rulings: `buildSubscriptionFilter` (the `tasks` third
argument), `matchesSubscriptionNotification` (the guarded task branch),
`MCPSubscriptionFilter` (the `taskIds` member and the two-option condition), `MCPTaskDetail`
(now what a manager answers, unstamped), and the `tasks/get` row of the methods table at line
1518 (now `MCPTaskDetailResult`).

`## Tests` (line 3831) gained one link, to the end-to-end row `m4-proof` landed:
`../tests/src/core/MCPClient.test.ts`.

## The composing-envelope conformance gap

The row at `## Declared conformance gaps` (line 3915) is rewritten rather than deleted. It now
states: the member is shipped; where it sits on the wire is this package's reading; the
reading is `params.notifications.taskIds`, beside `resourceSubscriptions`, because the
fragment's own JSDoc calls it a field set for the `subscriptions/listen` request; the core
`2026-07-28` schema never mentions the fragment and declares no extension hook; the settled
flatness sentence stays (`TaskStatusNotificationParams` is the envelope intersected with the
detailed task, so a consumer reads `params.status`); the authority's internal contradiction is
recorded (its JSDoc prose says `tasksStatus` while its declaration and generated schema say
`taskIds`, and this package follows the declaration); and the cost is the extension's own
polling fallback rather than a protocol error.

## The fence, probed

One fence was added, in `### Configure modern subscriptions` after the existing server fence.
Every comment in it states an executed reading. The instrument was `tmp/probe/m4guide.test.ts`,
run through the `probe` project and deleted afterwards; `tmp/probe/` is empty.

Command:

```text
npx vitest run --config vite.config.ts --no-cache --reporter=verbose --project probe
```

Readings, transcribed from that run's stdout:

| Fence line                                                             | Reading  |
| ---------------------------------------------------------------------- | -------- |
| `buildSubscriptionFilter(asked, {}, false)`                            | `{}`     |
| `agreed.taskIds`                                                       | `["task-alpha","task-beta","task-alpha"]` |
| `isMCPTaskNotification(frame)`                                         | `true`   |
| `matchesSubscriptionNotification(frame, agreed)`                       | `true`   |
| `matchesSubscriptionNotification(other, agreed)` (`taskId: task-gamma`) | `false`  |
| `matchesSubscriptionNotification(partial, agreed)` (params not a snapshot) | `false` |

The instrument was proved able to fail before its silence was read as evidence. A control
drawn from outside the fence's population — `buildSubscriptionFilter` with `tasks` false
asserted to CARRY the member, which the reading says it drops — ran red under the same
command:

```text
 ❯ tmp/probe/m4control.test.ts:6:74
 Test Files  1 failed (1)
      Tests  1 failed (1)
```

The control file was deleted after that run.

Three further guard readings were taken in the same probe and used to write table cells rather
than fence comments: `isMCPNotificationMetaObject({})` is `true`, the same guard with a `null`
subscription id is `false`, `isMCPTaskDetailResult` is `true` for a stamped snapshot and
`false` for an unstamped one.

## The unknowns, answered

- **The era reconciliation keeps no sentence naming a draft tree.** The source adopted "the
  stable Tasks extension" as the standing noun phrase and put the dated identity at identity
  sites only. The guide mirrors that. My own decision inside it: the guide's identity site is
  the opening fact of `### Defer a call to a durable task`, which is where the deleted DRAFT
  notice sat, so a reader who came for that warning meets the replacement fact in the same
  place. The schema id appears there once and nowhere else in the guide.
- **The `tasks` filter member and the derived support fact take both a table row and prose.**
  The guide's structure decides it: `### Configure modern subscriptions` and `### Consume a
  subscription from a client` are where every other filter family is explained, and the
  `### Helpers` and `### Types` tables are where every symbol's shape is stated. Splitting
  them the other way would leave `buildSubscriptionFilter`'s third argument undocumented in
  the only table that documents arguments. No `## Patterns` entry was added: that section
  holds compositions across surfaces, and this is one surface.

## Gate readings

Each ran from `/home/user/mcp` on 2026-08-26, scoped as the brief's criteria name them.

| Command                                                        | Exit code | Reading                                     |
| -------------------------------------------------------------- | --------- | -------------------------------------------- |
| `grep -c` over the six symbol names                            | 0         | each name found; `isMCPTaskNotification` 5, `MCPNotificationMetaObject` 2, `MCPTaskDetailResult` 2, the rest 1 |
| `npx --no-install oxfmt --config .oxfmtrc.json --check guides/mcp.md` | 0   | `All matched files use the correct format.`  |
| `npm run test:guides`                                          | 0         | `Test Files  1 passed (1)` / `Tests  144 passed (144)`, 7.73 s |
| `grep -rin "draft\|stability guarantee\|specification/" guides/mcp.md` | 1  | no hit                                       |

The baseline the brief recorded, `1 failed | 143 passed (144)` with the six symbols in the
`documents every barrel export` diff, is the run this closes.

## The writing sweep

Pattern, run over the added and changed lines alone (`git diff -U0 -- guides/mcp.md`, the `+`
lines with the marker stripped, 160 lines):

```text
grep -nEi 'should|simply|\beasy|easier|\bjust\b|currently|\bnow\b|\bnew\b|latest|utilize|leverage|\bvia\b|in order to|e\.g\.|i\.e\.|etc\.|performant|robust|allows you to|and/or|\bsince\b|\bonce\b|please|sanity check|dummy|blacklist|whitelist|master|slave|ensure|guarantee|\babove\b|\bbelow\b|\bhere\b|this document|\bwe\b|\bour\b|let.s\b'
```

The first run returned four hits and the final run returns one:

- `Those reads happen once, at acknowledgement` — PERMITTED. The sense is "one time", not the
  temporal `after` the substitution table bans.

The three ruled against, and their repairs:

- `a refused identifier simply absent` → `a refused identifier absent`.
- `arrives here rather than on the client's notification event` → `arrives on this stream
  rather than`.
- `one unit, once a published source states the composition` → `one unit, after a published
  source states the composition`.

Two more terms were avoided while drafting rather than repaired: the reconciliation's phrase
"the delivery guarantee" became `Delivery is claimed from the producer onward, and no replay
is claimed`, because `guarantee` is banned as a claim about behavior; and the pre-existing
`the one-shot read above` on a line I rewrote became `the one-shot read`, because `above` is
banned as a reference direction.

## Findings outside this unit's scope

- **`guides/mcp.md:325` carries `It is simply the next registration`.** `simply` is banned by
  `.claude/rules/writing.md`. It sits in the paragraph whose previous line I edited for the era
  sweep, but it is not a line this unit's work makes false, so it is recorded here rather than
  repaired. It belongs to whichever unit owns a guide-wide writing sweep.
- **The formatter owns Markdown table padding.** `oxfmt` reads `.md`, and the first scoped
  `--check` after my edits exited 1 on the tasks-method table. Running the scoped mutating
  formatter over `guides/mcp.md` alone changed exactly that table's cell padding and nothing
  else, and the repeated `--check` exited 0. A later guide unit that hand-pads a table should
  expect the same correction.

## Claims of my own I flag

- **The delivery sentence claims what the server writes, not what the client receives.** I
  wrote "is stamped and written to this stream, in producer order" rather than "reaches the
  subscriber", because the client's own `capacity` bound can fail a subscription loudly and
  that is documented separately in the client section. The narrower sentence is what the
  landed server code supports.
- **The `-32602` sentence rests on a read of `#subscribe`, not on a run I took.** The refusal
  comes from `isMCPSubscriptionFilter` at `src/core/MCPServer.ts:1293-1299`, and `m4-proof`
  pins it with the row `refuses a malformed taskIds member as invalid params before reading
  the store`. My probe did not re-drive it.
- **The `MCPTaskDetail` row's rewrite is a judgment call.** The landed `MCPTaskDetailResult`
  makes the old cell's closing clause — "the shape `tasks/get` answers with" — false, so I
  replaced it with what the detail now is: what a consumer's manager answers, unstamped. The
  brief named neither cell; the parity gate could not have caught the stale clause, because it
  proves names rather than sentences.
- **One `## Tests` link was added on my own judgment.** The brief does not name it. The
  end-to-end proof `m4-proof` landed in `tests/src/core/MCPClient.test.ts`, which the section
  did not link, and the `links only to test files that exist` check passes on it.

## Deviation state

No deviation. No sentence the design authorities require contradicted the landed source, no
fence reading contradicted a claim I was told to document, and the parity gate demanded no
edit outside `guides/mcp.md`.

## Review evidence

### `git status --short`

```text
 M guides/mcp.md
```

### `git diff --stat`

```text
 guides/mcp.md | 213 +++++++++++++++++++++++++++++++++++++++++++---------------
 1 file changed, 160 insertions(+), 53 deletions(-)
```

The baseline commit is `0fe1879 Pin the tasks-delivery invariants with mutation-bound rows`.
No file under `src/` or `tests/` is modified, and `tmp/probe/` is empty.
