# Unit report: l7-guides-parity

The workspace runs a `guides` project in the fleet drop-in shape, green at 23 passed, and the
whole `test` chain is green with every pre-unit count unchanged. No deviation was raised.

## Touched files

| File                  | Change                                                                              |
| --------------------- | ----------------------------------------------------------------------------------- |
| `tests/guides.test.ts` | New. The fleet drop-in verbatim outside its constants block.                        |
| `vite.config.ts`      | Adds the `guides` project factory and its projects-array row.                       |
| `package.json`        | Adds the `test:guides` script and its row in the `test` chain.                      |
| `guides/README.md`    | Reshapes the concept index into the `## By concept` table `parseManifest` reads.    |
| `guides/lsp.md`       | Adds the `Kind` column, deepens the Methods headings, adds the missing example fences. |

`src/core/index.ts` and `src/server/index.ts` were granted for barrel membership and were not
edited: the barrel ruling closed with no membership change, per the reasoning that follows.

## Manifest mapping, read from the installed declarations

`parseManifest(markdown, directory)` in
`node_modules/@orkestrel/guide/dist/src/core/index.js` scopes to the `## By concept` section,
skips every block that is not a table, and reads each row positionally: `row[0]` Concept,
`row[1]` Spec, `row[2]` Source, `row[3]` Tests. It takes the FIRST link href from the Spec and
Tests cells and EVERY link href from the Source cell, resolves each against `directory`, and
canonicalizes the Source list through `normalizeDirectories`. One source directory collapses to
a `string`; several become a `readonly string[]`.

So the machinery maps one concept carrying a two-directory Source cell into ONE entry whose
`source` is the directory list — one entry per concept, never one per source. That is the
mapping this workspace needs: `guides/lsp.md` documents `src/core` and `src/server` in one
surface, and `createSource({ files, module: ['src/core', 'src/server'] })` reflects the union of
both barrels. Splitting the concept in two would run the whole-guide surface bijection against
half the source each time and fail both ways.

The old `guides/README.md` stated the concept as a bullet list, which `parseManifest` reads as no
table and therefore no entry. Reshaping it into a table with the same content is the drift repair,
recorded here as the Unknowns section required. The Tests cell takes one link, so it names
`tests/src`, the directory holding both mirrored suites; the `## By directory` index keeps the
per-directory `tests/src/core` and `tests/src/server` rows.

Measured shape of the reshaped manifest, from the passing run: one entry, concept `Package`,
spec `guides/lsp.md`, source `['src/core', 'src/server']`, tests `tests/src`.

## INTERNAL and barrel rulings

`INTERNAL` is the empty frozen array, and no barrel row changed.

The evidence is the first run's stranded-symbol reading. `missingSymbols(source.exports(),
source.surface())` returned nothing on the first run and on every run since, so no direct
declaration under `src/core` or `src/server` sits outside its barrel. The drop-in's second
assertion — `INTERNAL.filter((key) => !stranded.includes(key))` — then requires `INTERNAL` to be
empty, and it is. `source.hidden()` likewise returned nothing, so no module-scope declaration
lacks `export`.

With no stranded export, the `.claude/rules/architecture.md` § Barrel exports choice between
barrelling and interning never arose: there is nothing to rule on. `StdioTransport` and
`LSPClient` are both already barrelled and both are constructible from values a consumer holds —
an `LSPTransportInterface` and a `StdioTransportOptions` respectively — so the barrel rows they
carry are the correct outcome under that rule, and each carries its documented fence.

## Parity repairs

Each repair is a drift the suite reported. Before and after are the guide text.

### The Surface tables carried no `Kind` column

`extractSurface` locates the `Kind` column by its exact header text and skips every row whose
`Kind` cell is not one of `type`, `interface`, `const`, `function`, `class`. With `Export |
Purpose` headers only, every row was skipped and `guide.surface()` returned nothing.

- Reported: `extracts a non-empty documented surface` — `expected 0 to be greater than 0`; and
  `documents every barrel export` — 83 keys missing.
- Before: `| Export | Purpose |` on each of the seven Surface tables.
- After: `| Export | Kind | Purpose |`, each row carrying the kind the barrel reflects.

The documented name set already matched the barrel exactly; only the kind was missing. Kinds were
taken from `createSource(...).surface()` rather than read off the source by eye, so the column
records what the reflector reports.

### The Methods headings sat at H3

`extractMethods` sets the current interface from an H4 carrying a code span, and attaches the
table that follows. At H3 no group was extracted, so both method tables were unchecked.

- Before: ``### `LSPClientInterface` `` and ``### `LSPTransportInterface` ``.
- After: ``#### `LSPClientInterface` `` and ``#### `LSPTransportInterface` ``.

Both groups now check green in each direction, and `LSPClient` and `StdioTransport` expose no
undocumented method.

### The validation guards carried no worked example

`findUnexampled` accepts either a fence mentioning the name at a word boundary or an `@example`
JSDoc block on the export. `source.examples()` reported `isLSPError`, `createLSPClient`,
`encodeLSPMessage`, `parseLSPMessages`, and `createStdioTransport`, and the guide's fences reached
no further.

- Reported: `documents an example for every Surface function` — 17 guards unexampled, from
  `isJSONRPCError` through `isLSPInitializeResult`.
- Before: no `## Validation` section.
- After: a `## Validation` section carrying three `ts` fences — wire-message narrowing, document
  and diagnostic narrowing, and handshake narrowing — each guard narrowing its own subject once.

Repairing this in the guide rather than in `src/core/validators.ts` keeps the unit inside its
owned files: adding `@example` blocks to the validators would have been a `src/` edit beyond the
barrels, which the deviation contract forbids. The fences are also the better documentation,
because the guards' value is what they let a reader read off a narrowed payload.

### `LSPTransportInterface.send` carried no worked example

- Reported: `LSPTransportInterface examples > documents an example for every method` — `['send']`.
- Before: the `## Transport seam` section described `send()` in prose with no fence.
- After: a `ts` fence in that section starting a transport, sending one encoded `exit`
  notification, and closing it, followed by one sentence naming what `accepted` holds.

The sentence deliberately does not restate the "after `close()` resolves, `send()` resolves
`false`" rule the same section already states, so that rule keeps one home.

## Fence typecheck, with its control

Every ```ts fence in `guides/lsp.md` was extracted to a scratch project under `tmp/fencecheck`
whose `paths` remap `@orkestrel/lsp` and `@orkestrel/lsp/server` onto the real sources, and
compiled under the root compiler options.

- Instrument: 6 fences extracted, `npx tsc --noEmit -p tmp/fencecheck/tsconfig.json` exit 0.
- First control, `capability.positionEncodings` under an `isLSPServerCapabilities` narrow: exit 0.
  The control did NOT fail, and that is a real coverage finding rather than a passing instrument:
  `LSPServerCapabilities` declares `readonly [capability: string]: unknown`, so a misspelled
  member on an open record is a legal read. The instrument cannot see a typo there.
- Second control, `value.lines` under an `isLSPPosition` narrow, drawn from the closed-type half
  of the population: `error TS2551: Property 'lines' does not exist on type 'LSPPosition'. Did
  you mean 'line'?`, exit 2. Removing the control returned exit 0.

Coverage the instrument establishes: every fence resolves its imports against the real barrels and
every member it reads on a CLOSED type exists. Coverage it does not establish: a member read on an
open capability record. `tmp/fencecheck` was removed after the run and no gate depends on it.

## Gate readings

Each command was run bare from `/home/user/lsp` and its exit code read.

| Command                                                                                  | Exit | Reading                     |
| ---------------------------------------------------------------------------------------- | ---- | --------------------------- |
| `npx oxfmt --config .oxfmtrc.json --check <owned files>`                                  | 0    | All matched files formatted |
| `npx --no-install oxlint --config .oxlintrc.json --deny-warnings tests/guides.test.ts vite.config.ts` | 0 | No diagnostic          |
| `npm run check`                                                                           | 0    | Root, core, and server scopes |
| `npm run test:guides`                                                                     | 0    | 23 passed (23)              |
| `npm test`                                                                                | 0    | Per-project counts that follow |

`guides/README.md` and `vite.config.ts` failed the first scoped format check and were rewritten by
`npx oxfmt --config .oxfmtrc.json guides/README.md vite.config.ts` before the recorded run. The
formatter also collapsed the projects array back onto one line.

Per-project counts from `npm test`, exit 0:

| Project     | Pre-unit baseline | This run    |
| ----------- | ----------------- | ----------- |
| src         | 104 passed        | 104 passed  |
| policy      | 93 passed         | 93 passed   |
| setup       | 16 passed         | 16 passed   |
| config      | 46 passed         | 46 passed   |
| conformance | 243 passed        | 243 passed  |
| guides      | absent            | 23 passed   |

`tests/config.test.ts` already expected a `guides` project whose include is `tests/guides.test.ts`
and whose setup is `['./tests/setup.ts']` as soon as that file exists, and it passes unchanged at
46, so the registration matches what the workspace's own configuration proof requires.

## Writing sweep

Pattern, run case-insensitively over one file:

```text
should|simpl|easy|easier|\bjust\b|currently|\bnow\b|\bnew\b|latest|utiliz|leverag|\bvia\b|in order to|e\.g\.|i\.e\.|etc\.|performant|robust|allows you to|and/or|\bsince\b|\bonce\b|please|sanity check|dummy|blacklist|whitelist|\bmaster\b|\bslave\b|ensure|guarantee|\bwe\b|\bour\b|let's|\babove\b|\bbelow\b
```

Population: every added line of `guides/README.md`, `guides/lsp.md`, `vite.config.ts`, and
`package.json` from `git diff -U0`, plus the whole of the untracked `tests/guides.test.ts` —
383 lines.

Hits, each ruled:

| Line                                                          | Ruling                                          |
| ------------------------------------------------------------- | ----------------------------------------------- |
| `new URL('../', import.meta.url)`                             | Permitted. `new` is a code operator, not prose. |
| `readFileSync(new URL(name, root), 'utf8')`                   | Permitted. Same.                                |
| `// … The four constants below are this package's own`        | Retained fleet text. See the following note.    |
| `* here stops being stranded, so the list cannot rot` block, `the second assertion below` | Retained fleet text. See the following note. |

Every added prose line in `guides/README.md` and `guides/lsp.md` is clean against the pattern.

## Observations, outside this unit's scope

Three findings the run produced that this unit did not close, recorded against the capability that
owns them rather than reopened here.

- The fleet drop-in's header comment says "The four constants below are this package's own" while
  the block it introduces declares `FENCE_LANGUAGES`, `EXAMPLE_LANGUAGE`, `MODULES`, `INTERNAL`,
  and `ROOT_FILES`. The count is wrong in the fleet copy at `/home/user/markdown/tests/guides.test.ts`
  too, and `.claude/rules/writing.md` bans both the count and `below`. Repairing it here would fork
  the drop-in from its fleet source, so the text was carried verbatim. The repair belongs to the
  drop-in's owner, once, for every package that carries it.
- `guides/lsp.md` declares no markdown link, so `resolves every relative link` and `links only to
  test files that exist` both assert over an empty population and pass vacuously. `ROOT_FILES` is
  empty for the same reason. Closing that gap means giving the guide a `## Tests` section linking
  its mirrored suites, which is beyond the repairs this suite reported.
- The drop-in asserts that every documented name resolves; it does not execute a flagship fence and
  assert the value its comments claim, which `.claude/rules/tests.md` § Cross-cutting proofs asks of
  `tests/guides.test.ts`. The fences added here claim no return values, so nothing false ships, and
  the fence typecheck recorded earlier covers their shape. Adding transcriptions would change the
  drop-in outside its constants block.

## Tree state

`git status --short`:

```text
 M .orkestrel/campaign/routing-2026-08-26-resume.md
 M .orkestrel/campaign/state.md
 M guides/README.md
 M guides/lsp.md
 M package.json
 M vite.config.ts
?? .orkestrel/mcp/m5-closure.md
?? .orkestrel/mcp/m5-deprecated-brief.md
?? .orkestrel/mcp/m5-deprecated-report.md
?? tests/guides.test.ts
```

The `.orkestrel/` rows are not this unit's. The tree was clean when the unit opened, and this unit
never wrote below `.orkestrel/`, which the brief marks off-limits; those files changed during the
run from outside it.

`git diff --stat` over every tracked file:

```text
 .orkestrel/campaign/routing-2026-08-26-resume.md |  26 +++
 .orkestrel/campaign/state.md                     |   2 +-
 guides/README.md                                 |  16 +-
 guides/lsp.md                                    | 285 +++++++++++++++--------
 package.json                                     |   3 +-
 vite.config.ts                                   |  13 +-
 6 files changed, 235 insertions(+), 110 deletions(-)
```

`git diff --stat` scoped to this unit's owned files:

```text
 guides/README.md |  16 ++--
 guides/lsp.md    | 285 ++++++++++++++++++++++++++++++++++++-------------------
 package.json     |   3 +-
 vite.config.ts   |  13 ++-
 4 files changed, 208 insertions(+), 109 deletions(-)
```

`tests/guides.test.ts` is untracked and carries 175 lines.
