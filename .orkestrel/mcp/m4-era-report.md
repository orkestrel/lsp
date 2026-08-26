# Unit m4-era — report

Every named era site is replaced and the client-prose routing correction has landed; the
sweep leaves one `draft` hit in `tests/`, in the unrelated JSON-Schema-dialect sense. The
gates `format:check`, `lint:check`, `check`, and `test:src:core` each exited 0. No
declaration, expression, or statement moved: the whole diff is comments and TSDoc apart from
two `describe` suite titles, which the brief scopes as owned.

The standing replacement for the noun phrase "the draft Tasks extension" is "the stable Tasks
extension" — one term for one concept across source and tests. The full dated identity lands
at the identity sites rather than at every mention, so no site restates a fact another site
owns: the schema id sits once, in the tasks-family header comment in `src/core/types.ts`; the
snapshot date sits there, on `MCP_EXTENSION_TASKS` in `src/core/constants.ts`, and on the
`MCPServerOptions.task` remark where the "carries no stability guarantee" claim lived.

## What changed, site by site

`src/core/types.ts`:

- The tasks-family header comment (was `:733-734`): the DRAFT-and-`specification/draft`
  sentence is replaced by the stable, immutable snapshot dated 2026-07-28, its extension id
  `io.modelcontextprotocol/tasks`, and its generated schema id
  `https://modelcontextprotocol.io/ext-tasks/2026-07-28/schema.json`. The clause "every type
  below can change with it" is inverted: the snapshot is fixed, so every type in the family is
  written against it and a later revision arrives as its own dated snapshot.
- `MCPTaskOptions` TSDoc (was `:985`): "the server's draft Tasks extension" → "the server's
  stable Tasks extension".
- The `MCPServerOptions` remark (was `:1790`): "`task` enables the draft Tasks extension" →
  "the stable Tasks extension".
- `MCPServerOptions.task` (was `:1833-1838`): the member summary drops "draft", and "The
  extension is DRAFT and carries no stability guarantee" becomes the immutable snapshot dated
  2026-07-28, with the consequence the reader needs — the shape this option admits is fixed.
- `MCPTaskClientInterface` TSDoc (was `:2410`): "the draft Tasks extension" → "the stable
  Tasks extension".
- `MCPTaskClientInterface` TSDoc, the push sentence (was `:2423-2430`): the routing
  correction. The prose directs a subscribed consumer to the `listen` stream, states that a
  frame the server stamped for a subscription is claimed by that stream and does not re-emit
  through the `MCPClientEventMap` `notification` event, and keeps the unstamped case on that
  event. "at zero new mechanism" became "at no added mechanism", because `new` is a banned
  time word in `.claude/rules/writing.md`.
- `MCPTaskClientInterface.task` TSDoc (`:2455`): "the unrecognized draft members" → "the
  unrecognized members". This site sits outside the brief's `:2409-2430` range and is recorded
  as an addition in the following section.
- `MCPClientInterface.tasks` TSDoc (was `:2570`): "The draft Tasks extension's client half" →
  "The stable Tasks extension's client half".

`src/core/validators.ts` — `isMCPTaskDetail` TSDoc (was `:1089-1091`): the openness remark
keeps the behavior and changes its stated reason. Openness stands because the guard reads a
value a consumer's manager produced, and a guard over a foreign contract enforces the
published contract and no more (`.claude/rules/patterns.md` § Foreign contracts). The
draft-and-later-revision reason is gone.

`src/core/constants.ts`:

- `MCP_EXTENSION_TASKS` TSDoc (was `:63`, `:66`): the summary names the stable extension, and
  the remark adds that this key is the identity of the immutable snapshot dated 2026-07-28.
- `MCP_MISSING_CAPABILITY` TSDoc (was `:85-87`): the `-32003` observation is KEPT and its era
  attribution dropped — "The Tasks extension's own draft prose still shows `-32003` in
  examples" → "The Tasks extension's own prose examples show `-32003`". The rest of the
  remark, that the dated core schema fixes this code and a peer implements the dated schema,
  is unchanged.

`src/core/helpers.ts` — `isTaskSupported` TSDoc (was `:96`): "the draft Tasks extension" →
"the stable Tasks extension".

`src/core/MCPTaskClient.ts` — class TSDoc (was `:12`): "The CLIENT half of the draft Tasks
extension" → "the stable Tasks extension".

`src/core/MCPServer.ts`:

- Class TSDoc (was `:127`): "when the draft Tasks extension is configured" → "when the stable
  Tasks extension is configured".
- The registration comment (was `:346`): "The draft Tasks extension's methods" → "The stable
  Tasks extension's methods".
- The `#task` comment (was `:813`): "this server's half of the draft Tasks extension" → "of
  the stable Tasks extension".
- The `#named` comment (was `:1386-1388`): the same `-32003` observation, era attribution
  dropped and the over-long line rewrapped to the surrounding width. This site sits outside
  the brief's named list and is recorded as an addition in the following section.

`src/core/MCPClient.ts` — the `#tasks` field comment (was `:136`): "The draft Tasks
extension's client half" → "The stable Tasks extension's client half".

`tests/setup.ts` — `createTaskServer` TSDoc (was `:1143`) and the `TASK_CAPABILITIES` comment
(was `:1165`): "the draft Tasks extension" → "the stable Tasks extension" in each.

`tests/src/core/MCPServer.test.ts` — the W03-A banner (was `:4805`) and its `describe` title
(was `:4876`). The banner's trailing rule loses one `─` so the line stays at its 80-column
width, measured with `sed 's/─/-/g' | awk '{print length($0)}'` before and after: 80 both
times.

`tests/src/core/MCPTaskClient.test.ts` — the file header comment (was `:20`).

`tests/src/core/validators.test.ts` — the `describe` title (was `:1641`): "draft Tasks
extension validators" → "stable Tasks extension validators".

## Sites taken beyond the brief's named list

The brief's Unknowns section keeps a Tasks-extension era claim in `src/` or `tests/` in scope
wherever it sits, and names the report as where each addition is recorded. Two:

- `src/core/types.ts:2455` — "the unrecognized draft members this package deliberately
  preserves", inside `MCPTaskClientInterface.task`. The brief attributes "unrecognized draft
  members" to the `:2409-2430` range; the phrase sits at `:2449` in the baseline, past that
  range's end. Same sense, same repair, so it is done rather than reported as a mismatch.
- `src/core/MCPServer.ts:1386` — "The extension's own draft prose still shows `-32003` in
  examples", the twin of the `constants.ts` remark the brief names. The observation is kept
  under the brief's KEEP ruling for `-32003` and its era word removed, so the two remarks stay
  consistent.

I flag one judgment of my own on this pair: nothing else in `src/` or `tests/` mentioned the
extension's era, so the sweep in the following section is what bounds the addition set.

## Criterion 1 — the sweep

Pattern `draft`, case-insensitive, over the paths `src/` and `tests/`, run from
`/home/user/mcp`:

```text
$ grep -rin "draft" src/ tests/
tests/src/core/validators.test.ts:925:				$schema: 'https://json-schema.org/draft/2020-12/schema',
```

That hit is permitted: `draft/2020-12` is the JSON Schema dialect identifier inside a tool's
`inputSchema` fixture, so its sense is the JSON Schema specification's own draft series and it
carries no claim about the Tasks extension's era.

`guides/` is excluded from this sweep by the brief — `guides/mcp.md` still carries draft-era
claims and the `m4-guide` unit owns them. No hit in `guides/` is counted here as unswept.

A second pattern covered the era claim's other spellings, over the same paths:

```text
$ grep -rin "stability guarantee\|specification/" src/ tests/
$ echo $?
1
```

No hit, so no site states the extension's spec path or a missing stability guarantee.

## Gate readings

Each ran from `/home/user/mcp` on 2026-08-26, scoped as the brief's criteria name them:

| Command                  | Exit code | Reading                                                                  |
| ------------------------ | --------- | ------------------------------------------------------------------------ |
| `npm run format:check`   | 0         | `All matched files use the correct format.` — 217 files, 5457 ms         |
| `npm run lint:check`     | 0         | no output                                                                |
| `npm run check`          | 0         | root project plus `check:src:core`, `check:src:browser`, `check:src:server` |
| `npm run test:src:core`  | 0         | `Test Files  16 passed (16)` / `Tests  767 passed (767)`, 5.75 s         |

Observation on the test count: 767 passing over 16 files is the post-edit reading. I did not
take a pre-edit reading, so "no count moves" rests on the diff rather than on two runs — the
only test-file changes are two `describe` titles and comment text, neither of which registers
or removes a case. Treat the count as an observation, not as a proof of invariance.

## `git status --short`

```text
 M src/core/MCPClient.ts
 M src/core/MCPServer.ts
 M src/core/MCPTaskClient.ts
 M src/core/constants.ts
 M src/core/helpers.ts
 M src/core/types.ts
 M src/core/validators.ts
 M tests/setup.ts
 M tests/src/core/MCPServer.test.ts
 M tests/src/core/MCPTaskClient.test.ts
 M tests/src/core/validators.test.ts
```

Diffstat: 11 files changed, 41 insertions(+), 34 deletions(-). No file outside the brief's
owned list is modified; `guides/`, `src/core/index.ts`, `package.json`, and the lockfile are
untouched.

Prose-only evidence, from `git diff -U0` filtered to changed lines that are neither `//` nor
`*` comment lines:

```text
-describe('MCPServer — W03-A: the draft Tasks extension', () => {
+describe('MCPServer — W03-A: the stable Tasks extension', () => {
-describe('draft Tasks extension validators', () => {
+describe('stable Tasks extension validators', () => {
```

## Claims of my own I flag

- **The routing sentence rests on a read of `#routeSubscription`, not on an executed frame.**
  `src/core/MCPClient.ts:712-741` returns from `#routeSubscription` before
  `this.#emitter.emit('notification', owned)` for any notification carrying an
  `_meta[MCP_META_SUBSCRIPTION]` JSON-RPC id — including the case where no pending entry
  matches the id, which returns `true` at `:726`. The prose therefore claims what the code
  shows. Whether a stamped task frame reaches the `listen` stream end to end is `m4-proof`'s
  claim, not this unit's, and no test here exercises it.
- **The `-32003` observation is carried, not re-verified.** Neither `-32003` nor `-32021`
  appears in the staged authority (`grep -n "32003\|32021"` over
  `ext-tasks-2026-07-28-schema.ts` and `ext-tasks-2026-07-28-schema.json` returned nothing),
  so the observation refers to the extension's documentation prose, which sits outside the
  staged snapshot. That is consistent with the brief's ruling that the stable snapshot does not
  falsify the observation, and it means the snapshot does not confirm it either.
- **The single-home decision for the schema id is mine.** The id appears once, in the
  tasks-family header comment, rather than at each site that names the extension. The
  reconciliation records that nothing in the tree named the schema id and that the mirror row
  set carries it; this unit adds the one prose statement of it, and `m4-mirror` remains the
  pinned home.
- **`tests/src/core/validators.test.ts:1643-1645` is left alone.** Its comment — an extension
  that later defines options must not retroactively invalidate an option-free declaration — is
  a claim about revisions rather than about the draft era, and `m4-contract` owns the
  exactly-empty-capability repair that decides it. Editing it here would put one finding under
  two carriers.
