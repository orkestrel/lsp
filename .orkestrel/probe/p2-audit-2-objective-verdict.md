# p2-audit-2 — objective lane verdict, verbatim

Lane: objective audit, engine Opus 5 (native, substituted for GPT-5.6 Sol; the bench is
dark for the Sol model on this account, recorded in the routing ledger). Brief:
`p2-audit-2-brief.md` beside this file. Returned 2026-08-26. The Orchestrator's
reconciliation is in `p2-audit-2-verdict.md`; the settling instrument and readings for the
one unresolved claim are in `p2-settle-receipts.md`.

---

## 1. Producer coordinate correctness — UNRESOLVED

TypeStage and LintStage confirm. **Derivation** from the held source: `src/server/stages/TypeStage.ts:462-466` carries `getLineAndCharacterOfPosition(diagnostic.start)` unconverted and derives `end` from `diagnostic.start + (diagnostic.length ?? 0)`; `src/server/stages/LintStage.ts:278-284` copies `start.line`, `start.character`, `end.line`, `end.character` individually into an object literal this package allocates, aliasing no part of `diagnostic.range`. Both are corroborated by the supplied instrument readings (`RED_EXIT:1`, `expected 3 to be 2`, then `GREEN_EXIT:0`).

RuntimeStage's line half and its zero-width span confirm: `src/server/stages/RuntimeStage.ts:925-927` lowers `stack.line` by one, resolves `character` to `0` where no numeric `column` exists, and assigns one `position` object to both `start` and `end`.

**The RuntimeStage column half is unresolved, and its premise is contradicted by the installed dependency.** The claim rests on "a one-based Vitest frame". The installed `/home/user/probe/node_modules/@vitest/utils/dist/source-map.js` shows that is conditional, not fixed:

- `parseStacktrace` lines 391-415: when `options.getSourceMap?.(stack.file)` returns a map, the frame's `line` and `column` are **replaced** by `getOriginalPosition`.
- `originalPositionFor` lines 196-200 returns `line: segment[SOURCE_LINE] + 1` (one-based) and `column: segment[SOURCE_COLUMN]` — **zero-based**, as that same file states at line 166: `COL_GTR_EQ_ZERO = "column must be greater than or equal to 0 (columns start at column 0)"`.

Under that branch `stack.column - 1` under-reports the column by one, and a frame at a mapped column `0` stores `character: -1`. That value is not inert in this package's own shipped code (**derivation**, each link read directly): `isLSPPosition` (`node_modules/@orkestrel/lsp/dist/src/core/index.js:151-154`) requires `isInteger && >= 0`, so `isLSPRange` refuses the range, `isIssue` refuses the issue, `arrayOf(isIssue)` inside `isCheck` refuses the check, `isVerdict` refuses the verdict, and `src/server/ProbeServer.ts:205-211` throws `The prove tool returned an invalid verdict` — discarding a whole correct inspection. Before this change `line: isNumber` admitted every numeric value, so this failure mode is new with the change.

I could not break the claim, because the supplied measurement refutes the branch for the one frame exercised: `tests/src/server/stages/RuntimeStage.test.ts:200` asserts `start.character` is `15` for a `toBe` token at zero-based column 15, and that row runs `GREEN_EXIT:0` in the Orchestrator's instrument. A remapped column would have stored `14`. So on this host, with this Vitest, the frame RuntimeStage selected arrived one-based.

What would settle it: an executed reading of the raw `error.stacks[0].column` printed beside the stored `range.start.character` for a runtime failure under the installed Vitest, plus a case whose failing token sits at column 0 of its line. Both need a run; this lane has no shell.

## 2. Single rendering site — CONFIRMED

Attack tried: find a second zero-to-one conversion or a second reader of `range.start.line` anywhere the change reaches. **Derivation** from a repository-wide search excluding `node_modules` for `\.line \+ 1|line - 1|start\.line` and for `range|\.line\b` over `src/**/*.ts`: the only `+ 1` on an issue coordinate is `src/core/helpers.ts:35`. `formatCheck` (`helpers.ts:59`) and `formatVerdict` (`helpers.ts:98-99`) reach a location only through `formatIssue`. `src/bin/` matches neither `formatIssue` nor `issues`. `tests/setupPolicy.ts:301` (`position.line + 1`) is `PolicyViolation`, a distinct type in a vendored file the diff does not touch. Population: every `.ts` and `.md` file in the repository outside `node_modules`.

## 3. Absence semantics preserved — CONFIRMED

Attack tried: find a site that gained a stand-in value where it previously omitted the member, or any sentinel literal. **Derivation** from the held source: `src/server/stages/TypeStage.ts:454` and `:457` return without `range`; `src/server/stages/RuntimeStage.ts:901`, `:904`, `:919`, and `:929` return without `range`. LintStage has no such site, because `LSPDiagnostic.range` is a required member (`node_modules/@orkestrel/lsp/dist/src/core/index.d.ts:463-464`), so every published diagnostic carries a span. No `null`, no `-1`, and no zero-position literal is introduced anywhere in the diff.

`character: 0` at `RuntimeStage.ts:925` is not a sentinel under this claim: the range is present because a line was reported, and `0` names the first character of that line rather than standing in for "no location". It does collide with a genuine one-based column 1, which is an information loss rather than an absence sentinel.

## 4. Guard composition and installed semantics — CONFIRMED

Attack tried, and refuted, on both halves.

Present-and-invalid does not pass silently. **Derivation** from the installed `recordOf` (`node_modules/@orkestrel/contract/dist/src/core/index.js:5714-5723`): for each declared name it reads `INTRINSICS.own(value, key)`; a key in the `optional` list may be absent, but `if (present) { if (guard === void 0 || !guard(value[key])) return false }` runs unconditionally. So `['range']` at `src/core/validators.ts:177` buys absence and nothing else. `tests/src/core/validators.test.ts:83-90` pins that with a bare number, a half-built span, and a span carrying a string coordinate, each expected `false`.

The installed guard matches what the contract needs. `isLSPRange` (`index.js:161-164`) requires `isRecord` plus `isLSPPosition` on `start` and `end`; `isLSPPosition` (`index.js:151-154`) requires integer `line >= 0` and integer `character >= 0`. That is exactly the "zero-based UTF-16" LSP basis `src/core/types.ts:170-179` documents `Issue.range` to carry — the LSP `uinteger` domain, which the `number` in `LSPPosition` cannot express. Its openness over extra members is the form `.claude/rules/patterns.md` § Foreign contracts prescribes for a foreign interface, and refusing that openness would fail closed on a valid implementation.

The guard is therefore correct. The exposure this composition creates sits with the producer and is recorded under claim 1, not here.

## 5. Red-first table binds — CONFIRMED, with its coverage stated

Each cited line is the single line its mutation names. **Derivation** against the real held source, corroborated by the instrument's own `TARGET_OCCURRENCES:1` per row: `src/core/helpers.ts:35` (the only `+ 1` on an issue coordinate), `src/server/stages/TypeStage.ts:466` (`range: { start, end }`), `src/server/stages/LintStage.ts:280` (`line: diagnostic.range.start.line,`), `src/server/stages/RuntimeStage.ts:926` (`stack.line - 1`). None is a broader change that could redden an unrelated test: each red run names the coordinate assertion it was aimed at.

Row-by-row cross-check of the **supplied executed evidence** against the report's table:

- Renderer — same command, `RED_EXIT:1` with `Failed Tests 4` and `expected '…greeting.ts:0…' to be '…greeting.ts:1…'`, matching the report's `4 failed | 12 passed (16)`; `GREEN_EXIT:0`, `Tests 16 passed (16)`. Agrees.
- TypeStage — the instrument's mutation text differs from the report's (`range: { start, end }` rewritten in place, versus the report's rewrite of `start`), but the two are the same edit: raise the stored `start.line` by one, leave `end`. Red `expected 3 to be 2` and `1 failed | 22 skipped (23)` match the report exactly. No discrepancy to rule against.
- LintStage — same line, same command, `expected 3 to be 2`, `1 failed | 29 skipped (30)`. Agrees.
- RuntimeStage — **discrepancy.** The report records the mutation as `stack.line - 1 → stack.line` **and** `stack.column - 1 → stack.column`; the instrument applied the line half alone. The recorded red shape (`expected 6 to be 5`, `1 failed | 39 skipped (40)`) is the line assertion's and is produced by the line half by itself, so the readings agree while the mutations do not. My ruling: the instrument's coverage is narrower than the report's table on this row, and the narrowing is not concealed by the reading it produced.

On the brief's question: **the column conversion is pinned by a row** — `tests/src/server/stages/RuntimeStage.test.ts:200`, `expect(issue?.range?.start.character).toBe(15)`, which reads `16` and fails if `- 1` is removed (**derivation**). But that pin was never independently reddened: its red-first evidence is the unit's self-report alone, which this brief instructs me to treat as subject to attack rather than as verified fact.

Restoration holds. Every row reports `RESTORE_CMP_EXIT:0`, and the instrument's closing `git status --short` reproduces the twelve-file held status with a `git diff --stat` over `src/` matching the captured diff line for line.

Two further conversions carry an assertion but no mutation row: TypeStage's `end` derivation from `(diagnostic.length ?? 0)` (pinned by `TypeStage.test.ts:141`, `end.character` greater than `start.character`) and LintStage's three remaining copied coordinates (pinned by `LintStage.test.ts:405-408`).

## 6. Scope honesty — CONFIRMED

Attack tried: find a hunk present in one diff and absent from the other, a post-image that disagrees with the real file, or a thirteenth changed file.

Hunk-by-hunk, the report's `git diff -- src/` and `git diff -- tests/` carry the identical hunk headers and bodies as `/home/user/lsp/tmp/units/p2-audit-2-held-diff.txt` — `helpers.ts` at `@@ -4,6 +4,12 @@`, `@@ -13,7 +19,7 @@`, `@@ -25,7 +31,8 @@`; `types.ts` at `@@ -1,4 +1,5 @@`, `@@ -166,9 +167,18 @@`, `@@ -176,7 +186,7 @@`, `@@ -187,8 +197,8 @@`, `@@ -292,7 +302,7 @@`; `validators.ts` at `@@ -21,6 +21,7 @@`, `@@ -172,8 +173,8 @@`; `LintStage.ts` at `@@ -266,13 +266,22 @@`; `RuntimeStage.ts` at `@@ -918,7 +918,13 @@`; `TypeStage.ts` at `@@ -455,7 +455,14 @@`; and every test hunk. The report abbreviates `guides/probe.md` to its content rows and says so; the captured diff carries the full table reflow, whose non-content rows differ only in trailing padding.

Post-image spot-checks against the real held files (**derivation**, read directly): `src/core/helpers.ts:33-37`, `src/core/types.ts:170-201`, `src/core/validators.ts:24` and `:175-178`, `src/server/stages/TypeStage.ts:458-466`, `src/server/stages/LintStage.ts:267-286`, `src/server/stages/RuntimeStage.ts:921-927`, `tests/src/core/helpers.test.ts:42-78`, `tests/src/core/validators.test.ts:74-90`, `tests/src/server/stages/LintStage.test.ts:382-416`, `tests/src/server/stages/RuntimeStage.test.ts:163-210`, `tests/src/server/stages/TypeStage.test.ts:115-149`, `guides/probe.md:753-758`. Every one matches its captured post-image.

The captured status lists exactly the twelve files the Context section names, with no untracked entry, and the instrument's independent later status reproduces it. I also checked the row the report ruled unaffected rather than taking its word: `tests/guides.test.ts` names neither `Issue`, `formatIssue`, `isIssue`, nor `range` — its `line` matches are its own local variables at lines 53-148 — so the parity proof derives the member list generically and follows both edits without an edit of its own. `tests/config.test.ts:852-853` and `tests/setupPolicy.ts:1993` carry `line:` for `PolicyViolation`, a distinct type in files the diff does not touch.

## 7. The pinned `character: 15` assertion — CONFIRMED

The disclosure is honest. `tests/src/server/stages/RuntimeStage.test.ts:195-199` states which token Vitest blames, spells the column out character by character, gives the reading of both candidate values, and says outright that "A Vitest release that blamed a different token would move this number, and reporting that is what this row is for." That is the dependency the claim asks about, disclosed in the terms the claim asks for.

The weaker form is refused. For a token at one-based column 16, `toBeGreaterThan(0)` passes on a stored `15` and equally on a stored `16`, so it cannot separate "column lowered by one" from "column carried one-based and merely nonzero" — which is the only property this row exists to prove. The pin is load-bearing, not over-specified, and no cheaper form distinguishes the two. **The pin is correct; `toBeGreaterThan(0)` is not.**

One incompleteness in the disclosure, recorded rather than counted against the claim: the comment names token choice as the Vitest-side variable, and its binary reading ("a stored 15 is that column lowered by one and a stored 16 is the frame carried unchanged") holds only while the frame's column is one-based. Under the source-map branch documented in claim 1 the readings invert — `15` would be the frame carried unchanged and `14` the lowered value — so the row would redden and its own comment would misdirect the reader toward a blamed-token explanation. That is claim 1's subject, not a second finding.

## 8. The missing TypeStage end-of-file clamp — CONFIRMED as a non-defect

I could not construct a reachable case. **Derivation** from the installed compiler, `node_modules/typescript/lib/typescript.js:11712-11726`: `computeLineAndCharacterOfPosition` calls `computeLineOfPosition`, whose binary search returns the last line index for a position past the final line start, then returns `character: position - lineStarts[lineNumber]`. So an over-running `start + length` neither throws nor produces a negative coordinate — the only `Debug.assert` on that path guards a position *preceding* the file. The worst outcome is a non-negative `end.character` past the line's real end, on a member this package never renders.

The reachability ground: `diagnostic.start` and `diagnostic.length` have one writer, the compiler, reporting against the file it parsed, and the documented `Diagnostic` contract admits no input a caller supplies that pushes their sum past the text. The legitimate boundary case — a diagnostic at end of file with `length` `0` — yields exactly `text.length`, a valid end-exclusive position. An overrun therefore requires a compiler defect rather than any input this package's shipped code or a documented extension seam can present, so no clamp is owed and no documentation obligation attaches — the contract in question is TypeScript's, not one this package publishes.

## 9. Prose sweep — CONFIRMED

Population: the added lines of the twelve changed files, taken from the captured diff's post-image ranges — `guides/probe.md` 33-51, 104, 113-120, 753-758; `src/core/helpers.ts` 7-11, 22, 34-35; `src/core/types.ts` 2, 170-181, 189, 200-201, 305; `src/core/validators.ts` 24, 176-177; `src/server/stages/LintStage.ts` 269-272, 278-284; `src/server/stages/RuntimeStage.ts` 921-927; `src/server/stages/TypeStage.ts` 458-466; `tests/src/core/helpers.test.ts` 42, 47, 59-78, 84-91, 110, 136; `tests/src/core/validators.test.ts` 74-90; `tests/src/server/stages/LintStage.test.ts` 7, 382-416; `tests/src/server/stages/RuntimeStage.test.ts` 23, 147-152, 163-210, 249-252; `tests/src/server/stages/TypeStage.test.ts` 8, 115-149.

Patterns swept, case-insensitively across the twelve files, then each hit ruled against the added ranges: `\b(should|simply|easy|easier|just|currently|now|latest|utilize|leverage|via|in order to|e\.g\.|i\.e\.|etc\.|performant|robust|allows you to|and/or|please|dummy|blacklist|whitelist|ensure|guarantee|above|below)\b` and `\b(new|once|since|we|our|let's|here|foo|bar|baz|best|worst|most|fastest|safest|simplest)\b`.

Hits inside the added population, each ruled by the sense its row bans:

- `here` at `src/core/helpers.ts:9` ("derived here and nowhere else") and `src/server/stages/LintStage.ts:270` ("no conversion happens here") — **permitted**. The ban in § Code tokens, references, and links is on `here` as link text; both are locative adverbs in running prose.
- `once` at `src/server/stages/LintStage.ts:271` ("read once into a span this package owns") — **permitted**. The row bans the temporal `once` meaning `after`; this means one time.

Every other hit sits outside the added ranges on untouched lines: `performance.now()` throughout the stage sources and tests (a code token, exempt in any case), `above`/`below` at `RuntimeStage.ts:75`, `:184`, `:429`, `:475`, `LintStage.test.ts:293-294`, `RuntimeStage.test.ts:1177`, `now` in `validators.test.ts:141`, `new` in constructor calls and in `guides/probe.md:72`, `:169`, `:541`, `:815`, `since` in `guides/probe.md:684` and `types.ts:423`, `once` in `types.ts:380` and `guides/probe.md:832`, `:916`, `worst` in `types.ts:448`, `here` in `types.ts:158`, `:278`, `validators.ts:47`, `:124`, `:220`, `TypeStage.ts:75`, `:260`, `:278`, `LintStage.ts:83`, `:144`, `:267`, `RuntimeStage.ts:301`, `:884`, `helpers.test.ts:20`, `:467`, `:524`, `validators.test.ts:142`, `guides/probe.md:767`.

Count-shaped sentences, read line by line over the same added population: none states a count of a set anyone can add to. `"the two numbers differ by exactly one"` and `"the two differ by exactly one"` name their members in the same sentence and state an offset value; `"Both coordinates are therefore non-zero"` tallies the fixed pair `line` and `character`, named by the sentence before it; `"renders both origins"` tallies the two origins the test's own literals name; `"one-based column 16"`, `"a stored 15"`, `"a stored 16"`, `"one-based line 6, column 2"`, and `"the third line"` are measured values and file positions, not tallies. The enumeration `"tab, expect, (, 2, ␣, +, ␣, 2, ), ., then t"` names its members and states no number.

The `guides/probe.md` table reflow introduced no prose: comparing each reflowed row's text against its pre-image in the captured diff, only trailing padding differs outside the `Issue`, `isIssue`, and `formatIssue` rows.

---

No findings outside claims 1-9 met the `BROKEN` standard.

VERDICT: FAIL -- 0 broken, 1 unresolved, 0 not-evidenced, 0 findings outside the claims
