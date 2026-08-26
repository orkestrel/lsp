# Unit p2-range — report

`Issue.line` is replaced by `Issue.range?: LSPRange`, zero-based UTF-16 and half-open, reusing
`LSPRange` and `isLSPRange` from `@orkestrel/lsp`. Every producer stores that basis, `formatIssue`
is the only place a one-based line is derived, and each conversion ran red before it ran green.

Executor: `implementer` lane, Claude Opus 5, native, in `/home/user/probe`, from the clean baseline
`42e0b1e` on `claude/lsp-spec-audit-est33d`. Date: 2026-08-26.

## Per-producer coordinate ruling and `end` derivation

| Producer                        | Basis the tool reports                  | Conversion stored                          | `end` derivation                                                                    |
| ------------------------------- | --------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------ |
| `TypeStage.#issue`              | Zero-based UTF-16 already               | None; the compiler's position is carried    | `getLineAndCharacterOfPosition(start + (length ?? 0))` — a diagnostic reporting no length is a point, so the end resolves onto the start |
| `LintStage.#issues`             | Zero-based UTF-16, published by the LSP | None; each coordinate is copied             | The published `range.end`, copied coordinate by coordinate                          |
| `RuntimeStage.#issue`           | One-based line and column, Vitest frame | `line - 1`, and `column - 1` where numeric  | A frame names a point, so `end` is the same position object and the span is zero-width |

Ruling on the unknowns the brief named:

- **`end` where the tool reports no extent.** A zero-width range at the reported position. It is
  the value a span of no width carries anyway, so no sentinel enters and no consumer needs a second
  branch. `TypeStage` reaches it when `diagnostic.length` is absent; `RuntimeStage` reaches it on
  every frame.
- **A producer lacking even a start.** Three sites exist and each already answered with absence
  before this unit; each now omits `range` rather than `line`. `TypeStage.ts:452` (a diagnostic
  naming no file, reported against the project), `TypeStage.ts:457` (`diagnostic.start === undefined`),
  and `RuntimeStage.ts:900,903,919,928` (no `stacks` member, a non-array `stacks`, a frame whose
  `line` is not a number, and an exhausted frame list). `LintStage` has no such site: `LSPRange` is
  a required member of `LSPDiagnostic`, so every published diagnostic carries a span.
- **A frame carrying no numeric column.** `character` resolves to `0`, the first character of the
  line the frame did name. Absence is not available here, because `LSPPosition.character` is
  required, and lowering the line while inventing no column would misreport the position.

`RuntimeStage` lowers the column by one on a measurement rather than an inference. A throwaway
runtime probe under `tmp/probe/` drove the real stage over a generated failing test whose `toBe`
token sits at one-based column 16, and the stage stored
`{ start: { line: 5, character: 15 }, end: { line: 5, character: 15 } }`. The probe was deleted and
its claim promoted into the `RuntimeStage` row, which pins `character` to `15`.

## Renderer conversion

`formatIssue` reads `range.start.line + 1` and renders `path:<one-based line>`. The rendered shape
is unchanged and carries no column, per the brief. `formatCheck` and `formatVerdict` reach the
location only through `formatIssue`, so no second conversion exists.

## Reuse decision

`Issue.range` is `LSPRange` and `isIssue` composes `isLSPRange`, both imported from the
`@orkestrel/lsp` root. The semantics match exactly — zero-based, UTF-16, half-open — so a local
range type would have been the rename-wrapper the non-negotiables forbid. `src/core` importing that
root passes the core lint restriction, which bans only `@orkestrel/*/browser` and
`@orkestrel/*/server` subpaths (`.oxlintrc.json:134`), and `npm run check:src:core` confirms the
scoped project accepts it.

`LintStage` copies each published coordinate into a span this package owns rather than storing the
diagnostic's own object, because that object is foreign data whose lifetime is the inspection and
the issue outlives it.

## Falsified rows and their re-rule reasons

Every row from the distillate's minimum set, plus what running the suite added.

| Row                                                       | Re-rule reason                                                                 |
| --------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `src/core/types.ts` `Issue` member, remarks, `@example` ×2 | The member changed name, type, and basis                                        |
| `src/core/validators.ts:175-176`                           | The guard entry and its optional-key list name `line`                           |
| `src/core/helpers.ts:28` `formatIssue`                     | The renderer read `issue.line`; it now converts                                 |
| `src/server/stages/TypeStage.ts:456-459`                   | Stored a raised line and no extent                                              |
| `src/server/stages/LintStage.ts:270-276`                   | Stored a raised line and dropped the published span                             |
| `src/server/stages/RuntimeStage.ts:918-921`                | Stored the frame's one-based line verbatim                                      |
| `tests/src/core/helpers.test.ts:47,65,82,108`              | Fixtures carried `line:`                                                        |
| `tests/src/core/validators.test.ts:74`                     | Asserted the guard refuses a string `line`                                      |
| `tests/src/server/stages/RuntimeStage.test.ts:152,197`     | Asserted `line: expect.any(Number)`                                             |
| `guides/probe.md:41,103,115`                               | The `Issue` surface row, the `isIssue` row, and the `formatIssue` behavior row  |

Rows the suite added beyond the distillate:

| Row                                                | Re-rule reason                                                                      |
| --------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `tests/src/core/helpers.test.ts` test name           | The case was named "with and without a line"; the member is a location now            |
| `guides/probe.md` § How the lint stage speaks the protocol | The unit changes the projection that section describes, so it owns that prose  |
| `guides/probe.md` two Surface and Formatter tables   | The formatter widened both tables because the changed cells are longer. Mechanical reflow, no content moved |

Rows checked and ruled unaffected:

- `tests/guides.test.ts` derives the `Issue` member list from `types.ts` and the guide row rather
  than naming `Issue` at all (`grep -n "Issue\|formatIssue\|isIssue" tests/guides.test.ts` returned
  nothing), so the parity proof follows both edits without one. The `guides` project ran green.
- `tests/setupPolicy.ts`, `tests/policy.test.ts`, and `tests/config.test.ts` reference
  `PolicyViolation.line`, a distinct type. Untouched, and `test:policy` and the `config` project are
  unaffected.
- `src/bin/` carries no reference to an issue location (`grep -rn "\brange\b\|\bline\b" src/bin/`
  returned nothing), so no consumer there is falsified and no off-limits file was edited.

## Red-first proofs

Each conversion was mutated back to the standing coordinate at its single load-bearing line, run
red, restored, and run green. The commands are exact and were run bare.

| Conversion  | Command                                                                                                                          | Red                            | Green            |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ | ---------------- |
| Renderer    | `npx vitest run --config vite.config.ts --no-cache --project src:core tests/src/core/helpers.test.ts`                            | 4 failed \| 12 passed (16)     | 16 passed (16)   |
| `TypeStage` | `npx vitest run --config vite.config.ts --no-cache --project src:server tests/src/server/stages/TypeStage.test.ts -t 'stores a diagnostic zero-based'`    | 1 failed \| 22 skipped (23) — `expected 3 to be 2` | 1 passed \| 22 skipped (23) |
| `LintStage` | `npx vitest run --config vite.config.ts --no-cache --project src:server tests/src/server/stages/LintStage.test.ts -t 'stores a published span zero-based'` | 1 failed \| 29 skipped (30) — `expected 3 to be 2` | 1 passed \| 29 skipped (30) |
| `RuntimeStage` | `npx vitest run --config vite.config.ts --no-cache --project src:server tests/src/server/stages/RuntimeStage.test.ts -t 'stores the reported frame zero-based'` | 1 failed \| 39 skipped (40) — `expected 6 to be 5` | 1 passed \| 39 skipped (40) |

The mutations, each reverted to the shipped form after its red run:

- `src/core/helpers.ts`: `range.start.line + 1` → `range.start.line`.
- `src/server/stages/TypeStage.ts`: `start` → `{ line: start.line + 1, character: start.character }`.
- `src/server/stages/LintStage.ts`: `diagnostic.range.start.line` → `diagnostic.range.start.line + 1`.
- `src/server/stages/RuntimeStage.ts`: `stack.line - 1` → `stack.line` and `stack.column - 1` → `stack.column`.

Each mutation restores the coordinate the standing code stored, so the red reading is the standing
behaviour measured against the pin rather than a broken build.

## Gate readings

Run in the criteria's cheap-first order, bare, with the exit code read directly.

| Gate                                                                   | Exit | Reading                                     |
| ---------------------------------------------------------------------- | ---- | ------------------------------------------- |
| `npx oxfmt --config .oxfmtrc.json --check <12 owned files>`            | 0    | All matched files use the correct format    |
| `npx oxlint --config .oxlintrc.json --deny-warnings <11 owned files>`  | 0    | No output                                   |
| `npm run check`                                                        | 0    | Root, `src:core`, `src:server`, `src:bin`   |
| `npm run test:src:core`                                                | 0    | 3 files passed, 31 tests passed             |
| `npm run test:src:server`                                              | 0    | 7 files passed, 171 tests passed            |
| `npx vitest run --config vite.config.ts --no-cache --reporter=dot --project guides` | 0 | 1 file passed, 13 tests passed       |
| `npm run test:policy`                                                  | 0    | 1 file passed, 93 tests passed              |
| `npm run test:src`                                                     | 1    | 1 file failed \| 10 passed; 9 failed \| 204 passed (213) — every failure in `tests/src/bin/main.test.ts` |

**`npm run test:src` is red and the cause is a missing build, not this change.** The first failure
in that file reports `Error: Cannot find module '/home/user/probe/dist/bin/main.js'`, and
`ls dist` reports `No such file or directory`. The `src:bin` project drives the built entry, no
build has run in this tree, and the remaining eight failures in that file are the same missing entry
surfacing as boot timeouts and unmet arming conditions. `src/bin/` references no issue location, so
no edit of mine can reach it. I did not run `npm run build`: it is a tree-wide mutating command
outside the criteria and outside my owned files.

I therefore report `test:src` as red with that cause and report the two projects the change reaches,
`src:core` and `src:server`, green. The deciding whole-project reading belongs to the Orchestrator
after this unit exits, per the concurrency rule on timing and resource failures.

## Observations

- **The `character` coordinate is stored and never rendered.** `formatIssue` uses `start.line`
  alone, so `start.character`, `end.line`, and `end.character` reach no output surface in this
  package today. They are stored because the contract is the LSP span, and a consumer holding a
  verdict can address a diagnostic precisely with them.
- **`TypeStage` passes the compiler's own `LineAndCharacter` objects through as `LSPPosition`.**
  They are fresh per call and structurally compatible, so no copy is made. `LintStage` does copy,
  because its source object belongs to a foreign client and outlives the read.
- **The `guides/probe.md` diffstat reads 62 lines for four content edits.** The formatter widened
  two tables whose column width my longer cells changed. `npx oxfmt --check` on that file exits 0.

## Claims I flag for the analyst

1. **The pinned `character: 15` in the `RuntimeStage` row depends on which token Vitest blames.**
   It is measured, not derived, and the row's comment states the dependency. A Vitest release that
   blamed `expect` rather than `toBe` would redden this row without any defect in the conversion.
   I judged the pin worth its brittleness because `toBeGreaterThan(0)` does not distinguish a
   lowered column from a carried one, so the weaker form would not prove the conversion at all.
2. **`isIssue` now composes a foreign guard.** `isLSPRange` decides what shape `Issue.range` admits,
   so a change in that guard's strictness moves this package's contract without an edit here. I
   judged that correct under the reuse law, but it is the kind of coupling worth a second reading.
3. **`TypeStage` clamps nothing when `diagnostic.start + length` runs past the file.** The compiler
   is the only writer of both values and reports them against the file it parsed, so I did not add a
   bound. I did not construct a case that exceeds the file length.

## Review evidence

Working tree status, `git status --short`:

```text
 M guides/probe.md
 M src/core/helpers.ts
 M src/core/types.ts
 M src/core/validators.ts
 M src/server/stages/LintStage.ts
 M src/server/stages/RuntimeStage.ts
 M src/server/stages/TypeStage.ts
 M tests/src/core/helpers.test.ts
 M tests/src/core/validators.test.ts
 M tests/src/server/stages/LintStage.test.ts
 M tests/src/server/stages/RuntimeStage.test.ts
 M tests/src/server/stages/TypeStage.test.ts
```

Diffstat, `git diff --stat`:

```text
 guides/probe.md                              | 62 ++++++++++++++------------
 src/core/helpers.ts                          | 11 ++++-
 src/core/types.ts                            | 24 +++++++---
 src/core/validators.ts                       |  5 ++-
 src/server/stages/LintStage.ts               | 13 +++++-
 src/server/stages/RuntimeStage.ts            |  8 +++-
 src/server/stages/TypeStage.ts               | 11 ++++-
 tests/src/core/helpers.test.ts               | 38 +++++++++++++---
 tests/src/core/validators.test.ts            | 18 +++++++-
 tests/src/server/stages/LintStage.test.ts    | 38 +++++++++++++++-
 tests/src/server/stages/RuntimeStage.test.ts | 65 +++++++++++++++++++++++++---
 tests/src/server/stages/TypeStage.test.ts    | 38 +++++++++++++++-
 12 files changed, 274 insertions(+), 57 deletions(-)
```

### Source diff, `git diff -- src/`

```diff
diff --git a/src/core/helpers.ts b/src/core/helpers.ts
index 07e7286..2323490 100644
--- a/src/core/helpers.ts
+++ b/src/core/helpers.ts
@@ -4,6 +4,12 @@ import { PROBE_STAGES, RECEIPT_PREFIX, RECEIPT_SEPARATOR } from './constants.js'
 /**
  * Renders one tool message as a single line an agent can classify and locate.
  *
+ * @remarks
+ * `Issue.range` is stored zero-based, and this is the only place it is rendered, so the one-based
+ * line an editor shows is derived here and nowhere else. The rendered location carries the line
+ * alone: a reader opens a file at a line, and the column would widen every issue line in every
+ * verdict for a precision that address does not use.
+ *
  * @param issue - The message and location a stage reported
  * @returns The bracketed origin, location, and message, separated by spaces
  *
@@ -13,7 +19,7 @@ import { PROBE_STAGES, RECEIPT_PREFIX, RECEIPT_SEPARATOR } from './constants.js'
  * 	origin: 'claimant',
  * 	path: 'src/core/greeting.ts',
  * 	message: 'not assignable',
- * 	line: 1,
+ * 	range: { start: { line: 0, character: 6 }, end: { line: 0, character: 13 } },
  * }
  * const whole: Issue = {
  * 	origin: 'claimant',
@@ -25,7 +31,8 @@ import { PROBE_STAGES, RECEIPT_PREFIX, RECEIPT_SEPARATOR } from './constants.js'
  * ```
  */
 export function formatIssue(issue: Issue): string {
-	const where = issue.line === undefined ? issue.path : `${issue.path}:${issue.line}`
+	const range = issue.range
+	const where = range === undefined ? issue.path : `${issue.path}:${range.start.line + 1}`
 	return `[${issue.origin}] ${where} ${issue.message}`
 }
 
diff --git a/src/core/types.ts b/src/core/types.ts
index a584ee0..3552e03 100644
--- a/src/core/types.ts
+++ b/src/core/types.ts
@@ -1,4 +1,5 @@
 import type { EmitterErrorHandler, EmitterHooks, EmitterInterface } from '@orkestrel/emitter'
+import type { LSPRange } from '@orkestrel/lsp'
 import type { PROBE_ERROR_CODES, PROBE_PARTIES, PROBE_STAGES } from './constants.js'
 
 /**
@@ -166,9 +167,18 @@ export type Party = (typeof PROBE_PARTIES)[number]
  * path, the lint stage from the document URI it opened, and the runtime stage from the generated
  * specification it wrote to the test path the case declared.
  *
- * `line` is absent when the stage's tool reported no line, which happens for a whole-file
- * diagnostic. A runtime failure is not one of those: a failure Vitest reported at a stack frame
- * carries that frame's line.
+ * `range` is a half-open span in the zero-based UTF-16 coordinates the Language Server Protocol
+ * fixes, so one numbering carries every stage's location and each tool's own numbering is
+ * converted where it is read rather than where it is rendered. It is absent when the stage's tool
+ * reported no location, which happens for a whole-file diagnostic. A runtime failure is not one of
+ * those: a failure Vitest reported at a stack frame carries that frame's position.
+ *
+ * Each stage supplies the extent its own tool gives it. The type stage spans the diagnostic's
+ * reported length, and the lint stage carries the span the language server published. A tool that
+ * reports a point rather than a span, as a stack frame does, produces a zero-width range at that
+ * point, which is the same value a span of no width would carry.
+ *
+ * `formatIssue` renders `start.line` one-based, because that is the numbering an editor shows.
  *
  * @example
  * ```ts
@@ -176,7 +186,7 @@ export type Party = (typeof PROBE_PARTIES)[number]
  * 	origin: 'claimant',
  * 	path: 'src/core/greeting.ts',
  * 	message: "Type 'string' is not assignable to type 'number'.",
- * 	line: 1,
+ * 	range: { start: { line: 0, character: 6 }, end: { line: 0, character: 13 } },
  * }
  * ```
  */
@@ -187,8 +197,8 @@ export interface Issue {
 	readonly path: string
 	/** The diagnostic or failure message. */
 	readonly message: string
-	/** One-based line the tool reported, or absent when it reported none. */
-	readonly line?: number
+	/** Zero-based UTF-16 span the tool reported, or absent when it reported no location. */
+	readonly range?: LSPRange
 }
 
 /**
@@ -292,7 +302,7 @@ export interface Project {
  * 	origin: 'claimant',
  * 	path: 'src/core/farewell.ts',
  * 	message: 'not assignable',
- * 	line: 1,
+ * 	range: { start: { line: 0, character: 6 }, end: { line: 0, character: 13 } },
  * }
  * const verdict: Verdict = {
  * 	id: '88a5addc-7d33-40dc-9a5a-104b71f8787d',
diff --git a/src/core/validators.ts b/src/core/validators.ts
index daba1f9..c392711 100644
--- a/src/core/validators.ts
+++ b/src/core/validators.ts
@@ -21,6 +21,7 @@ import {
 	literalOf,
 	recordOf,
 } from '@orkestrel/contract'
+import { isLSPRange } from '@orkestrel/lsp'
 import { PROBE_PARTIES, PROBE_STAGES } from './constants.js'
 
 /**
@@ -172,8 +173,8 @@ export const isParty: Guard<Party> = literalOf(PROBE_PARTIES)
  * ```
  */
 export const isIssue: Guard<Issue> = recordOf(
-	{ origin: isParty, path: isString, message: isString, line: isNumber },
-	['line'],
+	{ origin: isParty, path: isString, message: isString, range: isLSPRange },
+	['range'],
 )
 
 /**
diff --git a/src/server/stages/LintStage.ts b/src/server/stages/LintStage.ts
index 1c18cad..73ccf33 100644
--- a/src/server/stages/LintStage.ts
+++ b/src/server/stages/LintStage.ts
@@ -266,13 +266,22 @@ export class LintStage implements LintStageInterface {
 
 	// Every issue here is one diagnostic Oxlint published about the text the caller supplied, so
 	// each one is that code failing. A server this stage cannot drive rejects the inspection
-	// instead, so no fault of its own reaches a caller as an issue.
+	// instead, so no fault of its own reaches a caller as an issue. The published range is already
+	// the zero-based UTF-16 span the issue stores, so no conversion happens here; each coordinate is
+	// read once into a span this package owns rather than the diagnostic's own object being carried
+	// into a value that outlives the inspection.
 	#issues(path: string, diagnostics: readonly LSPDiagnostic[]): readonly Issue[] {
 		return diagnostics.map((diagnostic): Issue => ({
 			origin: 'claimant',
 			path,
 			message: diagnostic.message,
-			line: diagnostic.range.start.line + 1,
+			range: {
+				start: {
+					line: diagnostic.range.start.line,
+					character: diagnostic.range.start.character,
+				},
+				end: { line: diagnostic.range.end.line, character: diagnostic.range.end.character },
+			},
 		}))
 	}
 }
diff --git a/src/server/stages/RuntimeStage.ts b/src/server/stages/RuntimeStage.ts
index 6977769..1243a20 100644
--- a/src/server/stages/RuntimeStage.ts
+++ b/src/server/stages/RuntimeStage.ts
@@ -918,7 +918,13 @@ export class RuntimeStage implements StageInterface {
 			if (!('line' in stack) || typeof stack.line !== 'number') {
 				return { origin: 'claimant', path, message }
 			}
-			return { origin: 'claimant', path, message, line: stack.line }
+			// A reported frame numbers its line and its column from one, so both are lowered into the
+			// zero-based coordinates the issue stores. A frame names a point rather than a span, so
+			// the end resolves to the start and the stored range is zero-width there. A frame
+			// carrying no numeric column names the line alone, which starts at its first character.
+			const character = 'column' in stack && typeof stack.column === 'number' ? stack.column - 1 : 0
+			const position = { line: stack.line - 1, character }
+			return { origin: 'claimant', path, message, range: { start: position, end: position } }
 		}
 		return { origin: 'claimant', path: original, message }
 	}
diff --git a/src/server/stages/TypeStage.ts b/src/server/stages/TypeStage.ts
index ba0f51b..6b33d45 100644
--- a/src/server/stages/TypeStage.ts
+++ b/src/server/stages/TypeStage.ts
@@ -455,7 +455,14 @@ export class TypeStage implements TypeStageInterface {
 		}
 		const path = relativeWorkspaceFile(this.#workspace, diagnostic.file.fileName)
 		if (diagnostic.start === undefined) return { origin: 'claimant', path, message }
-		const position = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start)
-		return { origin: 'claimant', path, message, line: position.line + 1 }
+		// The compiler already answers in the zero-based UTF-16 coordinates the issue stores, so the
+		// position is carried across rather than converted. `length` is the extent the compiler
+		// reported for this diagnostic, and a diagnostic that reported none is a point: the end
+		// resolves to the start, which is the zero-width range the issue's own contract names.
+		const start = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start)
+		const end = diagnostic.file.getLineAndCharacterOfPosition(
+			diagnostic.start + (diagnostic.length ?? 0),
+		)
+		return { origin: 'claimant', path, message, range: { start, end } }
 	}
 }
```

### Test diff, `git diff -- tests/`

```diff
diff --git a/tests/src/core/helpers.test.ts b/tests/src/core/helpers.test.ts
index ecd03e0..d708f4e 100644
--- a/tests/src/core/helpers.test.ts
+++ b/tests/src/core/helpers.test.ts
@@ -39,12 +39,12 @@ describe('core formatting helpers', () => {
 	// The issues `formatIssue` documents, transcribed as the typed literals the contract
 	// requires. `origin` is required on `Issue`, so a documented call that omitted it would fail
 	// this file's typecheck before any assertion ran.
-	it('renders both origins with and without a line', () => {
+	it('renders both origins with and without a location', () => {
 		const located: Issue = {
 			origin: 'claimant',
 			path: 'src/core/greeting.ts',
 			message: 'not assignable',
-			line: 1,
+			range: { start: { line: 0, character: 6 }, end: { line: 0, character: 13 } },
 		}
 		const whole: Issue = {
 			origin: 'instrument',
@@ -56,13 +56,41 @@ describe('core formatting helpers', () => {
 		expect(formatIssue(whole)).toBe('[instrument] src/core/greeting.ts not assignable')
 	})
 
+	// The stored span is zero-based and the rendered line is one-based, so the two numbers differ
+	// by exactly one at every line. A span past the first line separates that conversion from a
+	// renderer printing the stored number unchanged and from one printing a constant.
+	it('renders the stored zero-based line one-based and ignores the column', () => {
+		const first: Issue = {
+			origin: 'claimant',
+			path: 'src/core/greeting.ts',
+			message: 'not assignable',
+			range: { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } },
+		}
+		const later: Issue = {
+			origin: 'claimant',
+			path: 'src/core/greeting.ts',
+			message: 'not assignable',
+			range: { start: { line: 41, character: 8 }, end: { line: 43, character: 2 } },
+		}
+
+		expect(formatIssue(first)).toBe('[claimant] src/core/greeting.ts:1 not assignable')
+		expect(formatIssue(later)).toBe('[claimant] src/core/greeting.ts:42 not assignable')
+	})
+
 	it('renders zero, one, and multiple issues with correct summaries and order', () => {
 		expect(formatCheck({ stage: 'lint', elapsed: 17, issues: [] })).toBe('lint: 0 issues (17 ms)')
 		expect(
 			formatCheck({
 				stage: 'type',
 				elapsed: 23,
-				issues: [{ origin: 'claimant', path: 'src/core/first.ts', message: 'first', line: 4 }],
+				issues: [
+					{
+						origin: 'claimant',
+						path: 'src/core/first.ts',
+						message: 'first',
+						range: { start: { line: 3, character: 0 }, end: { line: 3, character: 4 } },
+					},
+				],
 			}),
 		).toBe('type: 1 issue (23 ms)\n  [claimant] src/core/first.ts:4 first')
 		expect(
@@ -79,7 +107,7 @@ describe('core formatting helpers', () => {
 						origin: 'claimant',
 						path: 'tests/src/core/second.test.ts',
 						message: 'second failure',
-						line: 8,
+						range: { start: { line: 7, character: 1 }, end: { line: 7, character: 1 } },
 					},
 				],
 			}),
@@ -105,7 +133,7 @@ describe('core formatting helpers', () => {
 						origin: 'claimant',
 						path: 'src/core/control.ts',
 						message: 'not assignable',
-						line: 1,
+						range: { start: { line: 0, character: 6 }, end: { line: 0, character: 13 } },
 					},
 				],
 			},
diff --git a/tests/src/core/validators.test.ts b/tests/src/core/validators.test.ts
index e1a00ea..bd79dd9 100644
--- a/tests/src/core/validators.test.ts
+++ b/tests/src/core/validators.test.ts
@@ -71,7 +71,23 @@ describe('core guards', () => {
 		expect(isClaim(claim)).toBe(true)
 		expect(isClaim({ ...claim, project: '' })).toBe(false)
 		expect(isIssue(issue)).toBe(true)
-		expect(isIssue({ ...issue, line: '1' })).toBe(false)
+		// The optional member is a span rather than a number, so a bare number, a half-built span,
+		// and a span carrying a non-numeric coordinate are each refused, while a whole span and an
+		// absent one are each admitted.
+		expect(
+			isIssue({
+				...issue,
+				range: { start: { line: 0, character: 0 }, end: { line: 0, character: 4 } },
+			}),
+		).toBe(true)
+		expect(isIssue({ ...issue, range: 1 })).toBe(false)
+		expect(isIssue({ ...issue, range: { start: { line: 0, character: 0 } } })).toBe(false)
+		expect(
+			isIssue({
+				...issue,
+				range: { start: { line: '0', character: 0 }, end: { line: 0, character: 4 } },
+			}),
+		).toBe(false)
 		expect(isCheck(check)).toBe(true)
 		expect(isCheck({ ...check, elapsed: '17' })).toBe(false)
 		expect(isToolchain(toolchain)).toBe(true)
diff --git a/tests/src/server/stages/LintStage.test.ts b/tests/src/server/stages/LintStage.test.ts
index bcbce4c..6e6132d 100644
--- a/tests/src/server/stages/LintStage.test.ts
+++ b/tests/src/server/stages/LintStage.test.ts
@@ -4,7 +4,7 @@ import { spawn } from 'node:child_process'
 import { resolve } from 'node:path'
 import { createTeardown, waitForCondition, waitForDelay } from '@orkestrel/test'
 import { createScratch } from '@orkestrel/test/server'
-import { isProbeError } from '@src/core'
+import { formatIssue, isProbeError } from '@src/core'
 import { LintStage, resolveWorkspaceBinary } from '@src/server'
 import { describe, expect, it } from 'vitest'
 import {
@@ -379,6 +379,42 @@ describe('lint stage', () => {
 		}
 	})
 
+	// The language server publishes the zero-based span the issue stores, so the stored coordinates
+	// are the server's own. The offending statement sits on the third line, which separates a
+	// carried coordinate from a raised one and from a constant. The rendered line is read back
+	// through `formatIssue`, so the stored value and the one-based number a reader opens are pinned
+	// by the same case.
+	it(
+		'stores a published span zero-based and renders its line one-based',
+		{ timeout: 60_000 },
+		async () => {
+			const stage = new LintStage(ROOT)
+			const text = ['// padding', '// padding', 'debugger', ''].join('\n')
+			try {
+				const check = await stage.inspect(
+					{
+						files: [],
+						test: { path: 'tests/src/server/lint-coordinates.test.ts', text },
+					},
+					{ signal: UNBOUNDED },
+				)
+
+				const issue = check.issues.find((row) => row.message.includes('debugger'))
+				expect(issue).toBeDefined()
+				expect(issue?.range?.start.line).toBe(2)
+				expect(issue?.range?.start.character).toBe(0)
+				expect(issue?.range?.end.line).toBe(2)
+				// The published span covers the statement, so it ends past where it starts.
+				expect(issue?.range?.end.character).toBeGreaterThan(0)
+				expect(formatIssue(issue ?? { origin: 'claimant', path: '', message: '' })).toContain(
+					'tests/src/server/lint-coordinates.test.ts:3 ',
+				)
+			} finally {
+				await stage.destroy()
+			}
+		},
+	)
+
 	it(
 		'serves sequential inspections of one declared path from one resident server',
 		{ timeout: 60_000 },
diff --git a/tests/src/server/stages/RuntimeStage.test.ts b/tests/src/server/stages/RuntimeStage.test.ts
index a039727..dd419a3 100644
--- a/tests/src/server/stages/RuntimeStage.test.ts
+++ b/tests/src/server/stages/RuntimeStage.test.ts
@@ -20,7 +20,7 @@ import { PassThrough } from 'node:stream'
 import { fileURLToPath } from 'node:url'
 import { captureError, createTeardown, waitForCondition } from '@orkestrel/test'
 import { createScratch } from '@orkestrel/test/server'
-import { computeReceipt, formatSpecification, isProbeError } from '@src/core'
+import { computeReceipt, formatIssue, formatSpecification, isProbeError } from '@src/core'
 import { RuntimeStage, createRevisionFile, normalizePath } from '@src/server'
 import { describe, expect, it } from 'vitest'
 import { createVitest } from 'vitest/node'
@@ -144,12 +144,15 @@ describe('runtime stage', () => {
 				expect(passing.issues).toStrictEqual([])
 				expect(failing.issues.length).toBeGreaterThan(0)
 				// Vitest reported the generated specification, at the frame inside it. The issue names
-				// the test path the case declared and keeps that frame's line, so a runtime failure whose
-				// stack carries a frame arrives with `line` set.
+				// the test path the case declared and keeps that frame's position, so a runtime failure
+				// whose stack carries a frame arrives with `range` set.
 				expect(failing.issues[0]).toMatchObject({
 					origin: 'claimant',
 					path: 'tmp/probe/runtime-failing.test.ts',
-					line: expect.any(Number),
+					range: {
+						start: { line: expect.any(Number), character: expect.any(Number) },
+						end: { line: expect.any(Number), character: expect.any(Number) },
+					},
 				})
 			} finally {
 				await stage.destroy()
@@ -157,6 +160,55 @@ describe('runtime stage', () => {
 		},
 	)
 
+	// The frame Vitest reports numbers its line and column from one, and the issue stores them
+	// from zero, so the two differ by exactly one. The failing expression sits well past the first
+	// line and past the first column of its own line, which separates the conversion from a stage
+	// storing the frame unchanged, from one storing a constant, and from one storing the file's
+	// first position. The rendered line is read back through `formatIssue`, so the stored value and
+	// the one-based number a reader opens are pinned by the same case.
+	it(
+		'stores the reported frame zero-based and renders its line one-based',
+		{ timeout: 60_000 },
+		async () => {
+			const stage = new RuntimeStage(ROOT)
+			// `expect` opens at one-based line 6, column 2; its failing `toBe` call is later on that
+			// same line. Both coordinates are therefore non-zero under either numbering.
+			const text = [
+				"import { expect, test } from 'vitest'",
+				'',
+				'// padding',
+				'// padding',
+				"test('fails', () => {",
+				'\texpect(2 + 2).toBe(5)',
+				'})',
+				'',
+			].join('\n')
+			try {
+				const check = await stage.inspect({
+					files: [],
+					test: { path: 'tmp/probe/runtime-coordinates.test.ts', text },
+				})
+
+				expect(check.issues).toHaveLength(1)
+				const issue = check.issues[0]
+				expect(issue?.range?.start.line).toBe(5)
+				// Vitest blames the assertion method, whose `toBe` token opens at one-based column 16
+				// of that line: tab, `expect`, `(`, `2`, ` `, `+`, ` `, `2`, `)`, `.`, then `t`. So a
+				// stored 15 is that column lowered by one and a stored 16 is the frame carried
+				// unchanged. A Vitest release that blamed a different token would move this number,
+				// and reporting that is what this row is for.
+				expect(issue?.range?.start.character).toBe(15)
+				// A stack frame names a point, so the stored span has no width.
+				expect(issue?.range?.end).toStrictEqual(issue?.range?.start)
+				expect(formatIssue(issue ?? { origin: 'claimant', path: '', message: '' })).toContain(
+					'tmp/probe/runtime-coordinates.test.ts:6 ',
+				)
+			} finally {
+				await stage.destroy()
+			}
+		},
+	)
+
 	// Gated on the host reading rather than on a platform name, here and in the two proofs that
 	// follow it: a host that creates no directory link the walker reads as a symbolic link cannot
 	// build the linked path each of them is about. The link is a junction, which is the call that
@@ -194,7 +246,10 @@ describe('runtime stage', () => {
 				expect(check.issues[0]).toMatchObject({
 					origin: 'claimant',
 					path: 'tmp/probe/symlinked.test.ts',
-					line: expect.any(Number),
+					range: {
+						start: { line: expect.any(Number), character: expect.any(Number) },
+						end: { line: expect.any(Number), character: expect.any(Number) },
+					},
 				})
 			} finally {
 				const teardown = createTeardown()
diff --git a/tests/src/server/stages/TypeStage.test.ts b/tests/src/server/stages/TypeStage.test.ts
index 67a3f22..a6fcc05 100644
--- a/tests/src/server/stages/TypeStage.test.ts
+++ b/tests/src/server/stages/TypeStage.test.ts
@@ -5,7 +5,7 @@ import { fileURLToPath } from 'node:url'
 import { captureError, createTeardown, waitForDelay } from '@orkestrel/test'
 import { createScratch } from '@orkestrel/test/server'
 import { TypeStage, normalizePath } from '@src/server'
-import { isProbeError } from '@src/core'
+import { formatIssue, isProbeError } from '@src/core'
 import { describe, expect, it } from 'vitest'
 import { WORKSPACE_ROOT } from '../../../setup.js'
 
@@ -112,6 +112,42 @@ describe('type stage', () => {
 		}
 	})
 
+	// The compiler already answers in the zero-based coordinates the issue stores, so the stored
+	// line is the compiler's own. The offending declaration sits on the third line, which separates
+	// a carried coordinate from a raised one and from a constant. The compiler also reports the
+	// extent of this diagnostic, so the stored span has real width rather than collapsing onto its
+	// start. The rendered line is read back through `formatIssue`, so the stored value and the
+	// one-based number a reader opens are pinned by the same case.
+	it(
+		'stores a diagnostic zero-based with its reported extent and renders its line one-based',
+		{ timeout: 60_000 },
+		async () => {
+			const stage = new TypeStage(ROOT)
+			const text = ['// padding', '// padding', "export const VALUE: number = 'bad'", ''].join('\n')
+			try {
+				const broken = await stage.inspect({
+					files: [{ path: 'src/core/type-coordinates.ts', text }],
+					test: {
+						path: 'tests/src/core/type-coordinates.test.ts',
+						text: "import { test } from 'vitest'\ntest('loads', () => {})\n",
+					},
+				})
+
+				const issue = broken.issues.find((row) => row.path === 'src/core/type-coordinates.ts')
+				expect(issue).toBeDefined()
+				expect(issue?.range?.start.line).toBe(2)
+				expect(issue?.range?.end.line).toBe(2)
+				// The diagnostic names a declaration rather than a point, so its span has width.
+				expect(issue?.range?.end.character).toBeGreaterThan(issue?.range?.start.character ?? 0)
+				expect(formatIssue(issue ?? { origin: 'claimant', path: '', message: '' })).toContain(
+					'src/core/type-coordinates.ts:3 ',
+				)
+			} finally {
+				await stage.destroy()
+			}
+		},
+	)
+
 	it(
 		'changes its verdict after an imported dependency changes on disk',
 		{ timeout: 60_000 },
```

### Guide diff, content hunks from `git diff -- guides/probe.md`

The two table hunks are the formatter widening columns whose width my longer cells changed; the
content edits inside them are the `Issue`, `isIssue`, and `formatIssue` rows.

```diff
-| `Issue`             | interface | `{ origin, path, message, line? }` — one message a stage reported and the party that must act on it. `line` is absent when the tool reported none.   |
+| `Issue`             | interface | `{ origin, path, message, range? }` — one message a stage reported and the party that must act on it. `range` is a zero-based UTF-16 `LSPRange`, absent when the tool reported no location. |

-| `isIssue`     | function | `(value: unknown) => value is Issue`     | Admits a record carrying an origin, a path, a message, and an optional line.                                                                                   |
+| `isIssue`     | function | `(value: unknown) => value is Issue`     | Admits a record carrying an origin, a path, a message, and an optional range.                                                                                  |

-| `formatIssue`          | function | `(issue: Issue) => string`                                | Renders one message as `[origin] path:line message`, dropping `:line` when the tool reported none.                                             |
+| `formatIssue`          | function | `(issue: Issue) => string`                                | Renders one message as `[origin] path:line message`, converting the stored zero-based `range.start.line` to the one-based line an editor shows and dropping `:line` when the tool reported no location. |

@@ -750,6 +750,12 @@ an `Issue`. `@orkestrel/lsp` owns everything between them, and the hookup is fix
   for it: a second bound would race the caller's, and which one answered would depend on scheduling.
   `Probe` passes the deadline it already armed for the inspection, so one budget covers the wait and
   reports the overrun.
+- **The published span reaches `Issue.range` unconverted.** The client advertises UTF-16 positions
+  and the protocol numbers lines and characters from zero, which is the coordinate basis
+  `Issue.range` stores, so this stage copies each coordinate rather than adjusting one. The type
+  stage lowers nothing either, because the compiler answers in that basis too, and the runtime stage
+  lowers a Vitest frame by one because that frame numbers from one. `formatIssue` is the only place
+  the one-based line a reader opens is derived.
 
 Each limit that split produces is the client's decision rather than this package's:
```

## Deviation state

No deviation. No off-limits file was edited, no unscoped consumer was falsified, and every owned
file in the brief's list that the change reaches was edited. `tests/src/core/types.test.ts` does not
exist, so the brief's conditional grant went unused. The `tmp/probe/` instrument was created,
measured, and deleted; `find tmp -type f` returns nothing and `tmp/` is git-ignored.

One standing condition the brief did not name surfaced and is reported rather than acted on: `dist/`
is absent, so the `src:bin` project cannot run and `npm run test:src` is red for that reason alone.
