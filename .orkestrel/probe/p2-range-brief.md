# Unit p2-range — `Issue.line` becomes a zero-based `range`

## Role and engine

You are the `implementer` lane, Claude Opus 5, native, writing directly in `/home/user/probe`.
Do the work yourself and spawn nothing. You are the only writer in this tree for the unit's
duration. You do not audit or accept your own work; the Sol `analyst` lane audits this unit
afterwards.

## Read first, in order

1. `/home/user/probe/AGENTS.md`, then `.claude/rules/names.md`, `.claude/rules/typescript.md`,
   `.claude/rules/patterns.md`, `.claude/rules/tests.md`, and `.claude/rules/documentation.md`
   in that repository.
2. `/home/user/lsp/.orkestrel/probe/p2-terrain-distillate.md` — the measured blast radius; its
   `file:line` pointers are your work list's starting set, and you re-derive the full falsified
   set by running the suite.
3. `/home/user/probe/guides/probe.md` — the governing guide; its `Issue`, `isIssue`, and
   `formatIssue` rows change with this unit.

No skill is named.

## The ruling this unit implements (adopted; argue how, never whether)

`Issue.line` is replaced by a zero-based UTF-16 `range`, rendered one-based at format time;
every stage and renderer changes in the same unit. The ruling is the campaign plan's, standing
unless the user overrules; it is not this unit's to reopen.

## Standing conditions (verified 2026-08-26)

- `/home/user/probe` is CLEAN at commit `42e0b1e` on the `claude/lsp-spec-audit-est33d` branch.
- Dependencies are installed: the `@orkestrel/lsp` runtime dependency (`package.json:97`,
  `dependencies`) resolved from the rebuilt tarball
  `/home/user/lsp/tmp/tarballs/orkestrel-lsp-0.0.1.tgz`; the install printed
  `INSTALLED @orkestrel/lsp 0.0.1` and left the tree clean.
- The installed package exports, from its root:

  ```ts
  /** Describes a zero-based position inside a text document. */
  export declare interface LSPPosition {
  	readonly line: number
  	readonly character: number
  }
  /** Describes a half-open span inside a text document. */
  export declare interface LSPRange {
  	readonly start: LSPPosition
  	readonly end: LSPPosition
  }
  export declare function isLSPPosition(value: unknown): value is LSPPosition
  export declare function isLSPRange(value: unknown): value is LSPRange
  ```

- `tests/setupPolicy.ts` and `tests/policy.test.ts` reference a distinct `PolicyViolation.line`
  (`tests/setupPolicy.ts:37`) — a different type, out of this unit's scope; leave every
  policy-suite reference untouched.
- No `git checkout`, `git restore`, `git stash`, `git reset`, or `git clean`. No commit, no
  push, no install.

## Objective

`Issue` carries `range?: LSPRange` in place of `line?: number` — zero-based UTF-16, absent when
the tool reports no location — every producer computes it in its own coordinate basis, the
renderer converts to one-based at format time, the guard validates the shape, and the guide and
tests agree, with the coordinate conversions proven red-first.

The reuse law decides the type: `LSPRange` from `@orkestrel/lsp` matches the ruling's semantics
exactly (zero-based UTF-16, half-open) and the package is already a runtime dependency, so
`Issue.range` reuses `LSPRange` and `isIssue` reuses `isLSPRange`. Declaring a local range type
would be the wrapper the non-negotiables forbid. `src/core` importing `@orkestrel/lsp` root
exports is within the dependency direction (that root is the lsp package's host-independent
core), and `LintStage` already imports the root.

The measured sites, from the distillate (re-derive the complete set by running the suite):

- `src/core/types.ts:183-192` — the `Issue` member, its TSDoc, and the `@example` blocks at
  `:175-180` and `:291-296` that embed `line: 1`.
- `src/core/validators.ts:175` — the `isIssue` member guard.
- `src/core/helpers.ts:28` — `formatIssue`, the sole rendering site: today
  `` `${issue.path}:${issue.line}` ``. The rendered shape stays `path:<one-based line>` — the
  one-based conversion (`range.start.line + 1`) happens here and only here. Do not add a
  column to the rendered line; the ruling names the storage change and the one-based line
  rendering, nothing wider. Record the unrendered `character` as an observation.
- `src/server/stages/TypeStage.ts:456-459` — `getLineAndCharacterOfPosition` is zero-based
  UTF-16 already; the `+ 1` falls away, and `diagnostic.start` with `diagnostic.length` gives
  the end position where TypeScript supplies one.
- `src/server/stages/LintStage.ts:270-276` — the LSP diagnostic already carries a zero-based
  `LSPRange`; the `+ 1` falls away.
- `src/server/stages/RuntimeStage.ts:895-923` — the Vitest stack frame reports a one-based
  line (and column where present); convert to zero-based.
- Tests the change falsifies, minimum set: `tests/src/core/helpers.test.ts:47,65,82,108`;
  `tests/src/core/validators.test.ts:74`;
  `tests/src/server/stages/RuntimeStage.test.ts:152,197`.
- Guide rows: `guides/probe.md:41` (`Issue` surface), `:103` (`isIssue`), `:115`
  (`formatIssue` format).

## Unknowns, named as unknowns

- **Per-producer `end` derivation where the tool reports no extent.** TypeStage has
  `diagnostic.length` (an end is computable); the LSP diagnostic carries a full range; a
  runtime stack frame reports a point. How each producer derives `end` — a zero-width range at
  the reported position where no extent exists is the obvious shape — is yours to design,
  state, and record per producer in your report, and to document on the `range` member's TSDoc.
  Flag the decision for the analyst.
- **Whether a producer can lack even a start position it previously synthesized a line for.**
  If you meet one, absence (`undefined`) is the answer per the absence law; record the site.
- **Whether the suite reveals falsified rows beyond the distillate's minimum set.** Derive the
  set by running the relevant projects and record every additional row with its re-rule reason.

## Scope

- Owned: `src/core/types.ts`, `src/core/validators.ts`, `src/core/helpers.ts`,
  `src/server/stages/TypeStage.ts`, `src/server/stages/LintStage.ts`,
  `src/server/stages/RuntimeStage.ts`, `tests/src/core/helpers.test.ts`,
  `tests/src/core/validators.test.ts`, `tests/src/core/types.test.ts` if it exists,
  `tests/src/server/stages/TypeStage.test.ts`, `tests/src/server/stages/LintStage.test.ts`,
  `tests/src/server/stages/RuntimeStage.test.ts`, `tests/setup.ts` scoped to `Issue` fixtures
  it exports, and `guides/probe.md`.
- Off-limits: `tests/setupPolicy.ts`, `tests/policy.test.ts`, `tests/config.test.ts`,
  `tests/guides.test.ts`, `package.json`, the lockfile, `vite.config.ts`, everything under
  `src/bin/` unless the suite proves a falsified consumer there — in which case stop and
  report rather than editing an unscoped file.
- Allowed tools: read, edit, and the acceptance-criteria commands.

## Deviation contract

A change that cannot land without editing an off-limits file, a producer whose coordinate basis
contradicts the distillate's reading, or an `LSPRange` semantic that does not fit a producer's
data stops the unit: report expected, found, exact evidence, done or not done, and at most one
short hypothesis. The per-producer `end` shapes, fixture wording, and TSDoc phrasing are yours
to decide and record.

## Acceptance criteria, cheap-first, each command and output recorded

1. `npx oxfmt --config .oxfmtrc.json --check` over your owned source and test files exits 0.
2. `npx oxlint --config .oxlintrc.json --deny-warnings` over the same files exits 0.
3. `npm run check` exits 0.
4. A red-first proof per coordinate conversion: for TypeStage, LintStage, and RuntimeStage,
   a row pinning the zero-based stored value (and the renderer's one-based output) fails
   against the standing code and passes after — record each exact command with its failing and
   passing counts.
5. `npm run test:src` exits 0 with the counts recorded.
6. `npx vitest run --config vite.config.ts --no-cache --reporter=dot --project guides` exits 0
   — the guide rows you rewrite stay in parity.

## Review evidence

This is a code change: your report carries the actual `git diff` (per file or unified) and the
actual `git status --short` output.

## Output

Write your report to `/home/user/lsp/tmp/units/p2-range-report.md`: the per-producer coordinate
ruling and `end` derivation, the renderer conversion, every falsified row with its re-rule
reason, the red-first table, the gate readings with exit codes, the diff, the status output,
observations, and any claim you flag for the analyst. No process diary.
