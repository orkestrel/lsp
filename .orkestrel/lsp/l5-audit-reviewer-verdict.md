# Audit verdict — the L5 round (L5-A, L5-A r2, L5-B), subjective lane

Lane held: **subjective** — design acceptance, API and vocabulary, architecture fit, placement, simplification, guide voice. Engine: Claude Opus 5, which wrote none of the lsp diff under audit. Instrument limit declared up front: my tool allowlist carries `Read`, `Grep`, and `Glob` and no shell, so I could not run `git show`, `npm run test:conformance`, or a hash. Every ruling below rests on the landed tree at `/home/user/lsp`, the captured diff at `/home/user/scaffold/.orkestrel/campaign/l5b-diff.txt`, and the campaign record. Where a claim needed execution I name the command rather than inferring the answer.

## 1. Placement and export law — CONFIRMED

`/home/user/lsp/tests/setupConformance.ts` carries no `describe`, `it`, or `expect` (pattern `\b(describe|it|expect)\s*\(` over the file: no matches), and no unexported top-level declaration (pattern `^(const|let|var|function|interface|type|class|async function) ` anchored at column 0: no matches — every top-level line begins `export`).

`/home/user/lsp/tests/conformance.test.ts` registers rows and nothing else: imports, then `describe`/`it.each` blocks whose bodies are single `expect` calls.

`/home/user/lsp/tests/setupConformance.test.ts` is collected by the `setup` project's existing glob `include: ['tests/setup*.test.ts']` at `/home/user/lsp/vite.config.ts:112`, which `setupConformance.test.ts` matches. No project edit was needed for it.

## 2. Wiring matches the vendored proof — CONFIRMED

`/home/user/lsp/vite.config.ts:133-142` declares `conformance` with `include: ['tests/conformance.test.ts']`, `environment: 'node'`, `browser: { enabled: false }`, `setupFiles: ['./tests/setup.ts']`, and no timeout — the only project factory between `config` (line 119) and `distribution` (line 144). `/home/user/lsp/vite.config.ts:179` lists `projects: [srcCore, srcServer, policy, setup, config, conformance, distribution, probe]`, placing it in the same slot.

`/home/user/lsp/package.json:65` reads exactly `vitest run --config vite.config.ts --no-cache --reporter=dot --project conformance`, and `/home/user/lsp/package.json:58` reaches it: `test` ends `&& npm run test:conformance`.

`tests/config.test.ts` appears in no `diff --git` header of the captured L5-B diff, so it was not edited.

## 3. Failure naming serves the reader — BROKEN

Confirmed and unbreakable: every row case title carries the local symbol through `it.each(...)('$symbol …')`, and `row.symbol` is the local name in every table. Every row assertion routes through the exported comparator `readConformanceDrift` (`/home/user/lsp/tests/setupConformance.ts:188-195`), whose message is `${symbol} drifted; ${authority}=${value}` (line 184) and which surfaces as the received value of `.toBeUndefined()`. No aggregate object diff stands where a per-row case belongs.

Broken on the membership sub-clause, at `/home/user/lsp/tests/conformance.test.ts:62-66`:

```ts
it('covers the declared LSP_ENCODINGS values without claiming string-enumeration closure', () => {
	expect(
		new Set(CONFORMANCE_VALUES.slice(0, LSP_ENCODINGS.length).map((row) => row.local)),
	).toStrictEqual(new Set(LSP_ENCODINGS))
})
```

What is wrong, on three independent grounds. It names a **value** set (`row.local`), not a symbol set — the methods membership assertion at line 26 gets this right with `row.symbol`. It selects its population **by position**, bounded by `LSP_ENCODINGS.length`, which is the tally the claim excludes. And because `createValueRow` was handed `LSP_ENCODINGS[0]`, `LSP_ENCODINGS[1]`, and `LSP_ENCODINGS[2]` at `/home/user/lsp/tests/setupConformance.ts:602-622`, the assertion compares `LSP_ENCODINGS` against itself — the shape `.claude/rules/tests.md` refuses under "Never assert an implementation against itself."

Why it matters. The positional selector couples the assertion to table ordering. Insert a sync-kind row above the encodings rows and this assertion silently inspects the wrong rows, passing or failing for a reason unrelated to encodings coverage, while its title still claims encodings coverage.

What right looks like — the shape the sibling assertion at line 26 already uses:

```ts
expect(
	new Set(CONFORMANCE_VALUES.filter((row) => row.symbol.startsWith('LSP_ENCODINGS.')).map((row) => row.symbol)),
).toStrictEqual(new Set(LSP_ENCODINGS.map((encoding) => `LSP_ENCODINGS.${encoding}`)))
```

This names a symbol set, selects by symbol rather than position, states no tally, and still reddens by name when the encodings population empties or grows.

## 4. Comparison honesty — CONFIRMED

The methods table's membership equals the exact `LSP_METHODS` key set: `/home/user/lsp/tests/conformance.test.ts:26-28` compares `row.symbol` against `Object.keys(LSP_METHODS).map((key) => 'LSP_METHODS.' + key)`, and `/home/user/lsp/src/core/constants.ts:2-12` declares `initialize`, `initialized`, `shutdown`, `exit`, `cancel`, `open`, `close`, `diagnostic`, and `publish` — each with a row at `/home/user/lsp/tests/setupConformance.ts:473-531`.

`cancel` compares against the metaModel alone: its row passes `undefined` as the installed coordinate (`/home/user/lsp/tests/setupConformance.ts:502`), and the installed-namespace case filters `row.installed !== undefined` (`/home/user/lsp/tests/conformance.test.ts:41`). The module's import block (lines 1-57) reaches `vscode-languageserver-protocol` at its bare specifier only — no subpath import anywhere in the file.

The open string enumerations claim no exhaustiveness: the encodings membership assertion compares against the package's own `LSP_ENCODINGS`, never against the metaModel's `PositionEncodingKind` member set, so the protocol's custom-encoding freedom is not asserted closed. (The mechanism that carries this is the subject of claim 3's finding; the honesty property itself holds.)

The structure rows stay at flat data. `readProperty` (`/home/user/lsp/tests/setupConformance.ts:273-289`) reads `property.type.kind === 'base'` and takes `property.type.name`, leaving `base` as `undefined` for every other descriptor; `/home/user/lsp/tests/conformance.test.ts:95` filters `row.base !== undefined` so a non-base descriptor asserts existence and requiredness only. Nothing walks a union member list.

## 5. Vocabulary and shape — BROKEN

Confirmed: the lookup helpers take the `read*` form and return `undefined` on a miss — `readMethod` (line 241), `readEnumeration` (257), `readStructure` (269), `readProperty` (288), `readManifestMember` (296), `readDeclaredDependency` (310), `readLockVersion` (319) each fall through to `undefined`. The table constants follow `{QUALIFIER}_{NOUN}`: `CONFORMANCE_METHODS`, `CONFORMANCE_NUMERALS`, `CONFORMANCE_VALUES`, `CONFORMANCE_STRUCTURES`, `CONFORMANCE_GUARDS`. Nothing in the L5-B diff adds a public `src/**` surface — no `diff --git` header in the captured diff names a path under `src/`.

Broken on the TSDoc sub-clause. Not one exported function in `/home/user/lsp/tests/setupConformance.ts` carries `@param` or `@returns` (pattern `@param|@returns` over the file: no matches). Every exported function has a single description line and stops there.

The control that makes this drift rather than a house style: the sibling setup module in the same repository. `/home/user/lsp/tests/setupServer.ts` documents every exported function fully — `createPeerOptions` (lines 37-42), `createHolderOptions` (66-72), `collectPeerMessages` (90-95), `readPeerResult` (109-113), `readPeerNumber` (126-133), `readProcessTable` (169-174), `readChildProcesses` (188-197) — each with `@param`, `@returns`, and `@remarks` where the behavior needs it, and line 206 even writes a default in the required form, `Default: \`5000\``.

Why it matters, at the sharpest instance: `readMetaModel` (`/home/user/lsp/tests/setupConformance.ts:202-228`) takes a defaulted parameter and **throws** on a digest mismatch, and its documentation is the single line "Loads the pinned metaModel after validating its raw bytes." `.claude/rules/typescript.md` § Comments requires the description, `@param`, `@returns`, a default written as "Default: …", and a thrown error written as "Thrown when …". A reader of this module learns the throw only by reading the body.

What right looks like — for `readMetaModel`, and the same treatment for each exported function beside it:

```ts
/**
 * Loads the pinned metaModel after validating its raw bytes.
 *
 * @param path - The mirror to read.
 * @param digest - The SHA-256 the raw bytes must hash to. Default: `META_MODEL_DIGEST`.
 * @returns The metaModel collections the conformance proof reads.
 * @throws Thrown when the raw bytes do not hash to `digest`, or when the parsed root omits a required collection.
 */
```

## 6. The L5-A chain fits the design — BROKEN

Confirmed: the refresh script names the mirrors path at `/home/user/lsp/scripts/metamodel.sh:13` (`DEST_PATH="tests/mirrors/metaModel.json"`) and again in its header at line 7. The guide's `## Conformance` passage names it at `/home/user/lsp/guides/lsp.md:115`. The `.prettierignore` line matches the canonical scaffold copy verbatim — `/home/user/lsp/.prettierignore` and `/home/user/scaffold/.prettierignore` read identically line for line, including the comment "# Fetched-bytes mirrors keep their upstream bytes and stay out of the formatter." and the entry `tests/mirrors/` at line 14; `.prettierignore` is a vendored path per `/home/user/scaffold/src/core/constants.ts:156`, so scaffold's root copy is the canonical one.

Broken on the last clause — the guide passage's promises are not all true of the landed L5-B proof. `/home/user/lsp/guides/lsp.md:115-117` reads:

> The mirror at `tests/mirrors/metaModel.json` holds the protocol's metaModel instance as fetched bytes, refreshed by running `scripts/metamodel.sh`.

Running that script is not a refresh. `/home/user/lsp/scripts/metamodel.sh` fetches, echoes the version and digest at line 35, and moves the file at line 38. It never touches `/home/user/lsp/tests/setupConformance.ts`, where `META_MODEL_DIGEST` (line 132) and `META_MODEL_VERSION` (line 135) pin the old bytes. A reader who follows the guide's sentence and nothing else gets a red conformance run reporting `metaModel bytes drifted; SHA-256=caae8df639a4248520a3f589fd72945365e9d8ebca5baf564161a515430d9d41`, with no instruction anywhere in the package about what to edit next.

This is drift of exactly the kind the charter names: the sentence was true when L5-A wrote it, because no digest pin existed yet; L5-B then added the pin and the sentence was never re-read against what shipped. The refresh ritual survives only in `/home/user/scaffold/.orkestrel/campaign/l5-design-reconciliation.md` — "the script prints the digest it fetched, and a refresh updates the constant in the same commit" — which is a campaign artifact due for the acceptance sweep, not a durable artifact in the package. A sweep of the lsp tree for `META_MODEL_DIGEST|digest|SHA-256` outside `node_modules` returns no prose in `guides/`, `README.md`, or `scripts/` that states the obligation.

Why it matters: the refresh is the one procedure a future maintainer will reach for, and the guide is where they will look. The pin's whole value is that an out-of-ritual edit reddens — which only holds if the ritual is written down where the person performing it reads.

What right looks like. Either the script closes the loop, or the guide names the step. The smaller change is the guide, extending the passage:

> Refresh the mirror by running `scripts/metamodel.sh`, which prints the fetched version and SHA-256. Update `META_MODEL_DIGEST` and `META_MODEL_VERSION` in `tests/setupConformance.ts` to the printed values in the same commit, so a mirror edited outside this procedure reddens the conformance run.

Whichever carrier you pick, that unit owns the prose describing the mechanism.

## 7. The diffs stay inside each brief's owned files with no banned construct — NOT EVIDENCED

Confirmed for L5-B. The captured diff's `diff --git` headers name `package.json`, `tests/conformance.test.ts`, `tests/setupConformance.test.ts`, `tests/setupConformance.ts`, and `vite.config.ts` — exactly the owned-file list at `/home/user/scaffold/.orkestrel/campaign/l5b-conformance-brief.md:151-152`, with nothing beyond it. A banned-construct sweep over the three landed test files (pattern `\bas\s+[A-Z]|:\s*any\b|@ts-(nocheck|ignore|expect-error)|eslint-disable|oxlint-disable|export default|\w!\.|\w!\)`) returns no matches, and a sweep for `it.todo|.skip(|TODO|FIXME` over `tests/*conformance*` returns none.

Not evidenced for L5-A. I cannot enumerate commit `586758d`'s file set: my allowlist has no shell, so `git show --stat 586758d` never ran, and `/home/user/scaffold/.orkestrel/campaign/l5a-acceptance.md:30-32` is another artifact stating the fact rather than the tree stating it. I verified each named file exists and carries the expected content, which establishes presence and not absence of a further edit.

The command that closes this: `git -C /home/user/lsp show --stat 586758d`, read against the L5-A r2 owned list (`scripts/metamodel.sh`, `guides/lsp.md`, `tests/mirrors/metaModel.json`) plus the Orchestrator's declared `.prettierignore` edit. Note for whoever runs it: `.prettierignore` sits outside the unit's owned list by design — `/home/user/scaffold/.orkestrel/campaign/l5-design-reconciliation-r2.md:25-27` declares that edit as the Orchestrator's and assigns it to this audit round, so its presence in the commit is a declared condition rather than a scope breach.

Also not evidenced by me: the mirror's byte identity with the fetched upstream bytes. `sha256sum /home/user/lsp/tests/mirrors/metaModel.json` settles it against `caae8df639a4248520a3f589fd72945365e9d8ebca5baf564161a515430d9d41`.

## Findings outside the claims

**F1 — The value rows for the type-only unions carry no local coordinate.** `/home/user/lsp/tests/setupConformance.ts:623-685` builds the `LSPTextDocumentSyncKind`, `LSPDiagnosticSeverity`, and `LSPDiagnosticTag` rows from bare number literals (`0`, `1`, `2`; `1`, `2`, `3`, `4`; `1`, `2`), because `/home/user/lsp/src/core/types.ts:86`, `:89`, and `:142` declare those unions as types with no runtime value. `createValueRow` types the parameter `string | number`, so neither `tsc` nor the runtime binds the literal to the union. Change `LSPDiagnosticSeverity` to `1 | 2 | 3 | 9` and every row stays green while its case title still says `LSPDiagnosticSeverity.Hint`. Contrast the encodings rows at lines 602-622, whose local coordinate really is `LSP_ENCODINGS[0..2]`. What right looks like: declare the local coordinates as typed constants — `const SEVERITY_HINT: LSPDiagnosticSeverity = 4` and siblings — so a union edit reddens `npm run check` rather than passing silently. Carrier: the capability that owns `CONFORMANCE_VALUES`.

**F2 — Only the methods table carries a membership assertion.** `/home/user/scaffold/.orkestrel/campaign/l5-design-reconciliation.md` § Failure naming rules that "Each table carries a membership assertion over the exact local symbol set so an empty or grown population reddens by name." `/home/user/lsp/tests/conformance.test.ts` carries one for methods (line 25) and the positional one for encodings (line 62); `CONFORMANCE_NUMERALS`, `CONFORMANCE_STRUCTURES`, and `CONFORMANCE_GUARDS` have none. The consequence is concrete: `/home/user/lsp/src/core/types.ts:103-113` declares `LSPDiagnostic` with `range`, `severity`, `code`, `codeDescription`, `source`, `message`, `tags`, `relatedInformation`, and `data`, and the structure rows cover all of them today — but adding a member gains no row and reddens nothing. The carrier is the brief rather than the unit: `/home/user/scaffold/.orkestrel/campaign/l5b-conformance-brief.md:42` restated the membership requirement for methods alone, and the executor implemented the brief it opened. Route this as a successor unit against the conformance capability, not as an L5-B defect.

**F3 — `WORKSPACE_ROOT` is now declared twice.** `/home/user/lsp/tests/setupServer.ts:10` and `/home/user/lsp/tests/setupConformance.ts:151` both read `export const WORKSPACE_ROOT = resolveRoot(import.meta)` — one concept, two exported declarations, in two modules the `setup` project loads. `AGENTS.md` § Design laws says centralize any pattern repeated twice, and `.claude/rules/tests.md` calls a near-duplicate helper a defect to consolidate. The L5-B brief itself pointed at `setupServer.ts` as the anchoring precedent; the unit copied the anchor rather than importing it. What right looks like: import `WORKSPACE_ROOT` from `./setupServer.js`, or promote it to `tests/setup.ts` — which stays host-independent, since `resolveRoot` reaches no `node:*` module — and have both modules import it.

**F4 — `REQUIRE` is a single-use exported callable named for its mechanism.** `/home/user/lsp/tests/setupConformance.ts:160` exports `REQUIRE = createRequire(import.meta.url)`, used once, at line 163. It holds a function rather than data, its name has no `{QUALIFIER}_{NOUN}` pair, and it describes the resolution mechanism rather than what the value is — all three against `.claude/rules/names.md`. It is exported only because the placement law requires every declaration in the module to be exported, which widens the module's surface for no consumer. `.claude/rules/architecture.md` § Kind purity names the disposition for exactly this shape: trivial and genuinely single-use folds into its caller. What right looks like: `export const PROTOCOL_ENTRY = createRequire(import.meta.url).resolve('vscode-languageserver-protocol')`, and delete `REQUIRE`.

## Claims I attacked and could not break

- **Claim 2**, attacked on every coordinate the vendored proof constrains — factory slot in both the declaration order and the `projects` array, include path, environment, browser flag, the single setup entry, the absent timeout, the script string character by character, and the `test` chain's reachability. Each matched. `tests/config.test.ts` is absent from the diff's file headers, so the refusal of a second setup entry was respected rather than edited around.
- **Claim 4**, attacked by looking for a private subpath import into the cancellation namespace, for an exhaustiveness assertion over `PositionEncodingKind`, and for any read of the metaModel's union grammar. None is present; `readProperty` degrades to existence-and-requiredness for every non-base descriptor, and the test filters accordingly.
- **Claim 1**, attacked by pattern-sweeping the setup module for suite constructs and for unexported top-level declarations, and by checking the `setup` glob really collects the sibling proof rather than needing a project edit.

## Referrals — outside my lane, addressed to the objective `analyst` lane

- **An emptied table's redness.** `CONFORMANCE_NUMERALS`, `CONFORMANCE_STRUCTURES`, and `CONFORMANCE_GUARDS` reach the suite only through `it.each(...)`. Whether an emptied table produces a Vitest "No test found in suite" error or a silently passing describe block is a runner-behavior question I could not execute. It decides how much of F2 is a real hole. Settling command: empty one table in a scratch copy and run `npm run test:conformance`.
- **`readProperty` and metaModel inheritance.** `/home/user/lsp/tests/setupConformance.ts:280` walks only the named structure's own `properties`, following no `extends` or `mixins`. The rows work around it by naming the declaring structure directly (`_InitializeParams`, `GeneralClientCapabilities`), which the design probed and blessed. Whether every projected member's declaring structure was chosen correctly, and whether any member sits on a mixin the row therefore misses, is a metaModel-correctness question for the objective lane.
- **`isInstalledDiagnostic` narrows to `unknown`.** `/home/user/lsp/tests/setupConformance.ts:400-402` declares `(value: unknown): value is unknown`, a degenerate predicate satisfying the `Guard<unknown>` slot on `ConformanceGuardRow.installed`. Whether the row type could carry a plain `(value: unknown) => boolean` without weakening the local-guard column is a type-shape question I did not compile.

VERDICT: FAIL — 3 broken, 0 unresolved, 1 not-evidenced, 4 findings outside the claims
