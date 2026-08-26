# Unit H2-U3 — spans through both walks

Role and engine: Sol `implementer`, GPT-5.6 Sol, reached through `codex exec`, sandbox
`workspace-write`, working directory `/home/user/markdown`. You perform this assignment
directly and spawn nothing beyond the shell commands your work needs. Red-first per node
type.

Before working, read in order: `/home/user/markdown/AGENTS.md`; the rules —
`.claude/rules/names.md`, `.claude/rules/typescript.md`, `.claude/rules/architecture.md`,
`.claude/rules/tests.md`, `.claude/rules/documentation.md`, `.claude/rules/writing.md`,
`.claude/rules/quality.md`; no skill binds this unit; the guide `guides/markdown.md`
§§ Helpers and Parsers; the design record —
`/home/user/scaffold/.orkestrel/campaign/h2-design-reconciliation.md` (binding) and the
analyst lane ruling beside it
(`h2-design-analyst-ruling.md`), whose per-construct threading table is this unit's
acceptance detail.

## Objective

`parseBlocks` records a `MarkdownSpan` for every block node against the original
constructor string, the inline walk records spans through offset-bearing fragments
driving the same `scanInline` engine, `parseProvenance(markdown)` returns the
`MarkdownParseResult` tuple — the document and the
`ReadonlyMap<MarkdownNode, MarkdownSpan>` — and `parseDocument` projects the document out
of it.

## Context — standing conditions and the ruled mechanism

- The tree is expectedly dirty with the uncommitted H2-U1 contract in
  `src/core/types.ts` and the H2-U2 coordinate engine in `src/core/helpers.ts`,
  `src/core/parsers.ts`, their test files, and the guide's signature rows. Build on
  them; never revert them. `MarkdownParseResult` is declared at `src/core/types.ts:397`
  and its TSDoc names `parseProvenance` and the `parseDocument` projection.
- The core check exits 2 with exactly the U5 unit's expected diagnostics — the missing
  `span` method at `src/core/Markdown.ts:40`, `:94`, and `src/core/factories.ts:81`.
  Your changes must leave exactly those; clear any diagnostic your own files gain.
- The landed U2 state you build on: `splitLines(markdown): readonly MarkdownSource[]`
  walks the original with one segment per line; `sliceSource`, `joinSources`, and
  `projectSpan` carry every strip, trim, and join; `stripQuote` is source-in source-out;
  `extractHeading` returns `{ level, text, offset }`;
  `parseBlocks(lines: readonly MarkdownSource[], depth): readonly BlockNode[]`;
  `collectList` wraps recursive string lines as source values with EMPTY segments — that
  boundary is yours to replace with real source propagation; `collectTable` accepts
  `line.text` — thread it.
- The ruled mechanism, binding: original-walk segments, never a normalized layer; NEVER
  reconstruct offsets from node values. The document span is `[0, markdown.length]`,
  the removed trailing terminator included. `parseInline` keeps its document-independent
  string signature (design ruling: the provenance walk drives the same `scanInline`
  engine with offset-bearing fragments; no scanner is duplicated).
- The `coalesceText` law (`src/core/helpers.ts:519`): where adjacent text fragments
  coalesce, the recorded span covers the whole coalesced run against the original.
- The planner risk bound to this unit: the trailing-space hard-break run — the trailing
  spaces a hard break consumes belong to the break's consumed syntax; pin its exact
  span red-first.
- The map is keyed by node identity, so the walk must record against the exact node
  values the document carries. Internal shape — a recorder threaded through the walk, or
  paired returns — is yours to decide and record; the exported contract is fixed.
- The guide rows this change makes false are yours: the signature rows for any exported
  helper whose printed signature changes. The `parseProvenance` documentation passage
  and the U1 type rows belong to the U6 unit — leave them.
- `src/core/index.ts` is the sole barrel: export `parseProvenance` (and any intentional
  reusable leaf you add) through it.

## Red-first sequence

Per node type — heading, paragraph, blockquote, list and item, table, fence, thematic
break, and the inline families through the fragment walk — add the span assertion
red-first against the tree before your threading lands, slicing the ORIGINAL string at
the recorded offsets as the proof, then green after. The coalesced-run case and the
trailing-space hard-break case are named rows. Pin also: a parse whose node VALUES are
byte-identical to the pre-threading parse for a document exercising every construct —
provenance is additive; values never move.

## Host environment and bench limits

Linux container, Node and npm on PATH, network DENIED in your sandbox — no installs, no
fetches. Dependencies are installed. Nested `git` invocations from a spawned tool can
report "not a git repository" while your own `git status` succeeds; that is the sandbox.
The `probe` MCP instrument refuses in this sandbox (approval policy `never`, measured by
the U2 unit) — record any claim needing it as a host observation instead of calling it.
Never make a whole-suite or timing-sensitive gate a criterion for yourself; the
Orchestrator takes the authoritative gates and the segment-lookup timing observation
after you exit.

## Unknowns

- Whether every inline construct's consumed syntax is recoverable from `scanInline`
  fragment offsets without widening its public signature. Where one is not, stop and
  report the construct rather than widening the API.
- Whether the list collector's continuation-line joining preserves segment fidelity
  through `joinSources` for lazy continuation shapes; derive the cases from the
  collector's own branches and report the set.

## Scope

Owned files: `src/core/parsers.ts`, `src/core/helpers.ts`, `src/core/index.ts` (the
barrel line only), `tests/src/core/parsers.test.ts`, `tests/src/core/helpers.test.ts`,
`guides/markdown.md` (changed signature rows only).

Report-only: `src/core/types.ts`, `src/core/Markdown.ts`, `src/core/factories.ts`,
`tests/guides.test.ts`.

Off-limits: everything else.

Allowed tools: read, edit, and scoped shell commands in `/home/user/markdown`. No
commit, no push, no `git checkout`/`restore`/`stash`/`reset`/`clean`, no tree-wide
`format` or `lint --fix`, no installs.

## Execution

You are the bench engine reading this brief inside your own CLI: do the work yourself,
directly, and spawn nothing beyond the shell commands your work needs.

## Output

Your final message is the unit report, in this shape and nothing else:

1. What changed: each owned file with the exact behavioral delta and the exported
   signatures printed.
2. The red-first records per node type: exact commands, red readings, green readings,
   the values-never-move pin included.
3. The Unknowns' answers with the search or branch set named.
4. Scoped gate readings with exit codes: the parsers and helpers test files' project
   runs, scoped `oxfmt --check` and `oxlint --deny-warnings` over the owned files, the
   core type-check with every remaining diagnostic attributed, `git diff --check`.
5. Observations outside scope, each named against the capability that owns it.
6. Claims you flag as needing host verification.

No process diary.

## Deviation contract

A conflict with the primary objective stops the unit: report expected, found, exact
evidence, done or not done, and at most one short hypothesis. The named stop conditions:
a node value changes under the threading; an inline construct's span needs a `scanInline`
signature change; the core check gains a diagnostic outside your files and U5's three.
Ancillary conflicts — recorder shape, test titles, guide row wording — are yours to
decide, record, and carry on from.

## Acceptance criteria

Ordered cheap-first.

1. `git diff --check` exits 0 and the diff touches only owned files.
2. Scoped `oxfmt --check` and `oxlint --deny-warnings` over the owned files exit 0.
3. The values-never-move pin is green, with the pre-threading record.
4. Every node type's span assertion slices the original string correctly, red-first
   recorded; the coalesced-run and hard-break rows included.
5. `parseProvenance` is exported through the barrel and returns the tuple;
   `parseDocument` projects out of it; the empty-segment list boundary is gone.
6. The parsers and helpers test projects exit 0 scoped; the core check's remaining
   diagnostics are exactly U5's three.
7. The changed guide signature rows state the landed signatures; no banned construct
   anywhere in the diff.

## Review evidence

The Orchestrator captures the actual diff and the actual `git status` output after you
exit; the round's `reviewer` lane — the engine that did not write this unit — audits
your report's claims against the diff.
