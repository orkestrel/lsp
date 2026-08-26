# Unit H2-U6 — the markdown guide carries the provenance surface

Role and engine: `implementer`, Claude Opus 5, native subagent working in `/home/user/markdown` as
its sole writer. You perform this assignment directly and spawn nothing.

Read before editing, in order: the markdown repository's `AGENTS.md`, its
`.claude/rules/documentation.md`, `.claude/rules/writing.md`, and `.claude/rules/names.md` files,
then the design record this unit implements —
`/home/user/lsp/.orkestrel/markdown/h2-design-reconciliation.md` (the guide-promise bullet and the
ruled forks) and the No-single-source and Carrier sections of
`/home/user/lsp/.orkestrel/markdown/h2-design-analyst-ruling.md`. The prior unit reports in the
same folder (`h2-u2-coordinates-report.md` through `h2-u5-handle-report.md`) name what each unit
landed. No skill applies.

## Standing tree state, named so you do not stop on it

The markdown tree is a held round and is DIRTY by design: the H2 units U1 through U5 plus the
U3.1 assert-helper widening sit uncommitted. Never revert, stash, or reset anything. The round
commits as one commit after the Orchestrator's gate chain. The U3.1 unit landed before you, so
`npx tsc --noEmit -p tsconfig.json` exits 0 on your baseline; if it does not, stop and report.

## Objective

The `guides` vitest project exits 0: every held-round export is documented, the `span` method row
exists in both parity directions, every Surface function carries an example, and the guide's
provenance prose states exactly the ruled contract — with the granted TSDoc corrections in
`src/core/types.ts` landed beside it.

## The red enumeration, measured 2026-08-26

`npx vitest run --project guides` exits 1 today: `Tests 4 failed | 14 passed (18)`.

- `documents every barrel export` names: `type MarkdownDerivation`, `type MarkdownParseResult`,
  `interface MarkdownSegment`, `interface MarkdownSource`, `interface MarkdownSpan`,
  `function joinSources`, `function locateEmphasis`, `function locateLink`,
  `function normalizeParagraphLine`, `function parseProvenance`, `function projectSpan`,
  `function scanInlineSource`, `function sliceSource`, `function splitTableSources`,
  `function trimSource`.
- `documents every interface method` and `Markdown exposes no undocumented method` both name
  `span`.
- `documents an example for every Surface function` names `scanLink` and `scanEmphasis`.

The gate defines the closure: a surface row you add for a function can extend the example
obligation to it. Iterate until the project reports 18-or-more passed and none failed, and record
each obligation the gate added as you closed the last.

## The work

1. **The provenance passage.** State the ruled promise in the guide's own voice: spans address the
   original constructor string; regions are half-open UTF-16 offsets; parsed nodes cover consumed
   syntax; one-source rewrites keep the source region through `map`; joins, projections, adopted
   documents, and synthetic nodes return `undefined`. Line endings normalize at line granularity
   (CRLF and lone CR); the parser performs no per-character rewrite, so a span always slices the
   constructor string verbatim. Cover the projection exclusion explicitly: a paragraph
   `mergeProjections` synthesizes has no single source and no span.
2. **The `span` method row** in the `MarkdownInterface` methods table, matching the declaration at
   `src/core/types.ts:481`, and the `parseProvenance` passage with its
   `const [document, spans] = parseProvenance(markdown)` shape.
3. **The surface rows and examples** for every export the red enumeration names, honest to the
   held sources — read each signature before writing its row. The `scanLink` and `scanEmphasis`
   examples close the standing example failures.
4. **The pipeline passage** names `MarkdownSource` and what `splitLines` returns, per the ruled
   coordinate mechanism: `{ text, segments }` with `MarkdownSegment { offset, start, end }`, the
   run length deriving from `end - start`.
5. **The tuple example at `guides/markdown.md:622`** destructures
   `rewriteDocument`'s `MarkdownDerivation` return; the surrounding prose matches the copy-on-write
   contract H2-U4 landed.
6. **Granted TSDoc corrections in `src/core/types.ts`**, comment lines only, and only these:
   - `workspace` → `handle` at the four sites the H2-U5 report names — `:44`, `:409`, and inside
     `:466-479` — and nowhere else in the file (the H2-U5 observation: `workspace` names the
     repository elsewhere in this fleet).
   - The `MarkdownSegment` TSDoc states the run length derives from `end - start` rather than
     being stored beside it, where the landed text says otherwise; leave it untouched where it
     already agrees.
7. **Prose law.** Every sentence you add survives the writing rules: no counts, no `should`, no
   unspaced em dash, no claim the reader cannot check. Fences import through
   `@orkestrel/markdown`, never `@src/core`. Run every example you write mentally against the held
   source, and where a fence claims a concrete return, confirm the claim against the real
   signature.

## Scope

Owned files: `guides/markdown.md` and the named comment-line regions of `src/core/types.ts` (no
type or member change — TSDoc text only). Report-only: every other source and test file, and
`tests/guides.test.ts` (the gate is the law; never weaken it). Off-limits: everything else. No
commit, no push, no `git checkout`/`restore`/`stash`/`reset`/`clean`, no installs, no tree-wide
`format` or `lint --fix` (scoped `oxfmt --write` over owned files only).

## Output

Your final report, written to `/home/user/lsp/tmp/units/h2-u6-guide-report.md` and returned as
your final message:

1. What changed per file, with the passages named.
2. The guides-project reading before (exit 1, `4 failed | 14 passed`) and after (exit 0), commands
   verbatim, plus any obligation the gate added mid-unit and how you closed it.
3. Scoped gate readings with exit codes: `oxfmt --check` and `oxlint --deny-warnings` over the
   owned files, `npm run check:src:core`, `npx tsc --noEmit -p tsconfig.json`.
4. `git diff --stat` and `git status --short`.
5. Observations outside scope, each named against the unit that owns it.

## Deviation contract

A conflict with the ruled contract stops the unit: report expected, found, exact evidence, done or
not done, and at most one short hypothesis. Named stop conditions: closing a parity failure
requires editing `tests/guides.test.ts` or a source signature; the baseline root check is red; a
guide sentence the design record requires contradicts the held source. Passage placement, row
wording, and example content are yours to decide, record, and carry on from.

## Acceptance criteria

Ordered cheap-first.

1. `git status --short` shows changes only in the owned files beyond the standing held entries.
2. Scoped `oxfmt --check` and `oxlint --deny-warnings` over the owned files exit 0.
3. `npm run check:src:core` and `npx tsc --noEmit -p tsconfig.json` exit 0.
4. `npx vitest run --project guides` exits 0 with no failed row.

## Review evidence

The Orchestrator captures the actual diff and status after you exit. The round audit routes per
the reconciliation: `reviewer` (Opus) coverage rides the round; the `analyst` (Sol) lane covers
the Opus-written units.
