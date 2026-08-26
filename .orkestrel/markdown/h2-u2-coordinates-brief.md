# Unit H2-U2 — the markdown coordinate engine

Role and engine: Sol `implementer`, GPT-5.6 Sol, reached through `codex exec`, sandbox
`workspace-write`, working directory `/home/user/markdown`. You perform this assignment
directly and spawn nothing beyond the shell commands your work needs. Red-first for every
behavioral cluster.

Before working, read in order: `/home/user/markdown/AGENTS.md`; the rules —
`.claude/rules/names.md`, `.claude/rules/typescript.md`, `.claude/rules/architecture.md`,
`.claude/rules/tests.md`, `.claude/rules/documentation.md`, `.claude/rules/writing.md`,
`.claude/rules/quality.md`; no skill binds this unit; the guide `guides/markdown.md`
§ Helpers; the design record —
`/home/user/scaffold/.orkestrel/campaign/h2-design-reconciliation.md` (binding) with the
lane rulings beside it for rationale.

## Objective

`splitLines` walks the original constructor string and returns offset-bearing
`MarkdownSource` values, the `sliceSource`, `joinSources`, and `projectSpan` leaves carry
every strip, trim, and join, and the `stripQuote` and `extractHeading` carriers thread
coordinates — with the pinned line lists unchanged and every offset proved against the
original string.

## Context — standing conditions and the ruled mechanism

- The tree is expectedly dirty with the uncommitted H2-U1 contract in
  `src/core/types.ts` — `MarkdownSpan`, `MarkdownSegment`, `MarkdownSource`,
  `MarkdownParseResult`, and `MarkdownDerivation` are declared there; build on them,
  never revert them. The core check currently exits 2 with three diagnostics naming the
  missing `span` method on `Markdown` — the U5 unit's expected red; yours must add
  errors only in `src/core/parsers.ts` (the `parseBlocks` call boundary, if any) and
  clear them within your own files.
- The ruled mechanism (per-entry facts probed by the Orchestrator on 2026-08-26, in the
  design record): NO normalized coordinate layer exists. The parser retains `U+0000`;
  line-terminator normalization is line-granular; so `splitLines` walks the original
  once, emitting one line per `MarkdownSource` with one segment, and original offsets
  are bought outright. Never reconstruct offsets from node values.
- The current `splitLines` is `markdown.replace(/\r\n?/g, '\n').split('\n')` with the
  trailing terminator removed (`src/core/helpers.ts:84-88`). The documented line lists
  are the floor: `''` → one empty line, `'a\n\n\n'` → `['a', '', '']`
  (`tests/src/core/helpers.test.ts:73-95`), plus the edge shapes the walk must get
  right deliberately — a lone `\r` at end of input and a `\r\n` at end of input, probed
  by the Orchestrator: `splitLines('a\n')` → `['a']`, `splitLines('a\r\nb\rc')` →
  `['a','b','c']`. Pin the current outputs for these inputs red-first against the
  existing implementation BEFORE the walk lands, then prove the walk preserves them.
- The leaves, in `src/core/helpers.ts`, exported and tested:
  - `sliceSource(source, from, to): MarkdownSource` — the one primitive every prefix
    strip and suffix trim uses; offsets are `text`-relative; segments narrow
    accordingly.
  - `joinSources(sources, separator): MarkdownSource` — the one primitive every
    line-join uses; a separator standing for an original newline carries that newline's
    original offsets as a segment; a separator standing for nothing (a fabricated blank)
    contributes no segment.
  - `projectSpan(source, from, to): MarkdownSpan | undefined` — reads the segments,
    returns original coordinates, and returns `undefined` when either boundary falls
    outside every segment.
- The carriers: `stripQuote` becomes source-in, source-out (`src/core/helpers.ts:199-213`);
  `extractHeading` gains the field naming where its `text` starts inside the line — the
  trim of the closing `#` run and edge whitespace makes that offset underivable from the
  returned value (`src/core/helpers.ts:127-134`). Predicates and pure extractors keep
  taking a `string`; their call sites pass `line.text`.
- `parseBlocks` accepts `readonly MarkdownSource[]` in this unit ONLY to the extent the
  `splitLines` signature change forces its boundary; the span-recording walk itself is
  the U3 unit's — do not record spans, do not add `parseProvenance`.
- The guide rows this change makes false are yours: the `splitLines`, `stripQuote`, and
  `extractHeading` signature rows in `guides/markdown.md` § Helpers (and the Parsers row
  for `parseBlocks` if its printed signature changes). The `guides` project is red on
  the tree already (the U1 exports await the U6 documentation unit); your obligation is
  the named rows' truth, recorded in your report, not a green guides run.

## Red-first sequence

1. Pin the line lists (the documented floor plus the two probed edge shapes and a
   `'a\r\n'` trailing-CRLF case) against the CURRENT implementation — green before the
   walk, proving the pins bind to today's behavior.
2. Add the offset assertions — for a document containing CRLF, a lone CR, a retained
   `U+0000`, an astral character, and a trailing newline, every line's `start` indexes
   the original string at that line's first character, proved by slicing the original at
   the recorded offsets — red against the current implementation, green after the walk.
3. The leaves' rows: slice, join, and project each with hit, miss, boundary, and
   fabricated-blank cases, hand-written expectations.

## Host environment and bench limits

Linux container, Node and npm on PATH, network DENIED in your sandbox — no installs, no
fetches. Dependencies are installed. Nested `git` invocations from a spawned tool can
report "not a git repository" while your own `git status` succeeds; that is the sandbox.
Never make a whole-suite or timing-sensitive gate a criterion for yourself: run the
scoped projects and record any whole-suite reading as an observation; the Orchestrator
takes the authoritative gates after you exit.

## Unknowns

- Which call sites beyond `parseBlocks` consume `splitLines` today; derive the set with
  a repository search, update each to the source shape or to `line.text`, and report the
  set with the search's scope.
- Whether the table and list collectors touch `splitLines` output in ways that resist
  `line.text` pass-through inside this unit's boundary; where one does, stop and report
  rather than partially threading — the U3 unit owns the construct threading.

## Scope

Owned files: `src/core/helpers.ts`, `src/core/parsers.ts` (the `splitLines` boundary
only), `tests/src/core/helpers.test.ts`, `tests/src/core/parsers.test.ts` (only where a
row constructs `splitLines` input directly), `guides/markdown.md` (the named signature
rows only).

Report-only: `src/core/types.ts` (U1's contract, never edited), `src/core/Markdown.ts`,
`src/core/factories.ts`, `tests/guides.test.ts`.

Off-limits: everything else.

Allowed tools: read, edit, and scoped shell commands in `/home/user/markdown`. No commit,
no push, no `git checkout`/`restore`/`stash`/`reset`/`clean`, no tree-wide `format` or
`lint --fix`, no installs.

## Execution

You are the bench engine reading this brief inside your own CLI: do the work yourself,
directly, and spawn nothing beyond the shell commands your work needs.

## Output

Your final message is the unit report, in this shape and nothing else:

1. What changed: each owned file with the exact behavioral delta and the changed
   signatures printed.
2. The red-first records: each cluster's exact red and green commands with readings, the
   line-list pins' pre-walk green included.
3. The call-site set from the Unknowns, with the search scope named.
4. Scoped gate readings with exit codes: the helpers and parsers test files' project
   runs, scoped `oxfmt --check` and `oxlint --deny-warnings` over the owned files, the
   core type-check with every remaining diagnostic attributed to its owning unit,
   `git diff --check`.
5. Observations outside scope, each named against the capability that owns it.
6. Claims you flag as needing host verification.

No process diary.

## Deviation contract

A conflict with the primary objective stops the unit: report expected, found, exact
evidence, done or not done, and at most one short hypothesis. The named stop conditions:
a pinned line list changes under the walk; a `splitLines` consumer cannot take the source
shape or `line.text` without behavior change; the core check gains a diagnostic outside
your files and U5's three. Ancillary conflicts — leaf test titles, the segment-narrowing
arithmetic's internal shape, guide row wording — are yours to decide, record, and carry
on from.

## Acceptance criteria

Ordered cheap-first.

1. `git diff --check` exits 0 and the diff touches only owned files.
2. Scoped `oxfmt --check` and `oxlint --deny-warnings` over the owned files exit 0.
3. The pinned line lists are green before and after the walk, with the pre-walk record.
4. The offset assertions slice the original string correctly for every named input
   shape, red-first recorded.
5. The leaves exist, are exported, and their hit, miss, boundary, and fabricated-blank
   rows are green with hand-written expectations.
6. The helpers and parsers test projects exit 0 scoped over their files; the core check's
   remaining diagnostics are exactly U5's three.
7. The named guide rows state the landed signatures; no banned construct anywhere in the
   diff.

## Review evidence

The Orchestrator captures the actual diff and the actual `git status` output after you
exit; the round's `reviewer` lane — the engine that did not write this unit — audits it
with the H2 units, and your report's claims are audited against the diff.
