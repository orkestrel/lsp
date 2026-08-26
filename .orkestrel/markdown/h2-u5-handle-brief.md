# Unit H2-U5 — the Markdown handle carries provenance

Role and engine: `implementer`, Claude Opus 5, native subagent working in `/home/user/markdown` as
its sole writer. You perform this assignment directly and spawn nothing.

Read before editing, in order: the markdown repository's `AGENTS.md`, its
`.claude/rules/names.md`, `.claude/rules/typescript.md`, `.claude/rules/tests.md`, and
`.claude/rules/writing.md` files, then the design record this unit implements —
`/home/user/lsp/.orkestrel/markdown/h2-design-reconciliation.md` (the ruled forks and the unit
table) and the Carrier, Derivation, and No-single-source sections of
`/home/user/lsp/.orkestrel/markdown/h2-design-analyst-ruling.md` — and the `#derive` ordering case
in `/home/user/lsp/.orkestrel/markdown/h2-design-planner-ruling.md` (the lines naming
`/home/user/html/src/core/HTML.ts:305-327`). No skill applies.

## Standing tree state, named so you do not stop on it

The markdown tree is a held round and is DIRTY by design: the H2-U1 types
(`src/core/types.ts`), the H2-U2 coordinate engine and H2-U3 span threading
(`src/core/parsers.ts`, `src/core/helpers.ts`, their tests), and the H2-U4 rewrite engine
(`rewriteDocument` returning `MarkdownDerivation<MarkdownDocument>`) all sit uncommitted. Never
revert, stash, or reset anything. The round commits as one commit after the Orchestrator's gate
chain. Tree-wide `npm run check` stays red on the guides project until H2-U6 lands
(`guides/markdown.md:622` binds the tuple example); that red is not yours. Another lane writes the
`/home/user/probe` checkout concurrently; if a test run misses a timing deadline under load,
report the reading and carry on — the Orchestrator takes the deciding solo re-run.

`npm run check:src:core` exits 2 today with exactly these diagnostics, all granted to this unit
(measured 2026-08-26 in the H2-U4 report):

```text
src/core/Markdown.ts(40,14): TS2420 — Markdown lacks span
src/core/Markdown.ts(94,3): TS2741 — returned Markdown lacks span
src/core/Markdown.ts(94,23): TS2345 — MarkdownDerivation<MarkdownDocument> is not
  assignable to string | MarkdownDocument
src/core/factories.ts(81,2): TS2741 — returned Markdown lacks span
```

## Objective

The `Markdown` handle stores handle-relative provenance, exposes it through `span`, and resolves
rewrite derivations through `#derive` when `map` creates the new handle, closing every standing
core diagnostic.

## The contract, adopted from the ruled design

Facts measured 2026-08-26: `MarkdownSpan`, `MarkdownSegment`, `MarkdownSource`,
`MarkdownParseResult` (`src/core/types.ts:397`), and `MarkdownDerivation` (`:417`) exist from
H2-U1; `MarkdownInterface.span` is declared at `src/core/types.ts:481`. `parseProvenance` sits at
`src/core/parsers.ts:210` returning `MarkdownParseResult`, and `parseDocument` projects the
document out of it at `:200`. The html precedent: `span` returning a fresh value at
`/home/user/html/src/core/HTML.ts:89-98`, `#derive` with its load-bearing comment at `:305-327`.

1. **Construction.** String input runs `parseProvenance` once and stores the document plus a
   COPIED span map in a private `#spans` identity map. Adopted `MarkdownDocument` input keeps the
   existing adopt-by-reference behavior and starts with an empty map. Do not parse twice.
2. **`span(node): MarkdownSpan | undefined`.** Returns a FRESH `{ start, end }` value on every
   call, `undefined` for a node without provenance here — foreign nodes, adopted documents, and
   synthetic nodes included. Nodes gain no field; provenance stays handle-relative.
3. **`#derive(document, derivations)`.** A private method creating the new handle and resolving
   each output node through the derivation chain, with the read-source-first ordering the html
   precedent carries: for each node, read the resolved candidate's span BEFORE following its own
   derivation entry, and guard the walk with a visited set. The ordering is load-bearing — a
   handler that hands back an original node from elsewhere in the tree terminates on its own
   region instead of following its output entry onto a foreign one.
4. **`map` resolution.** `map` destructures the `rewriteDocument` tuple and returns
   `#derive`'s handle. `map` still returns a NEW `Markdown` instance always; an identity rewrite
   may reuse the document tree inside it.
5. **The pinned rows at `tests/src/core/Markdown.test.ts:113-118`** are re-ruled deliberately: the
   identity-rewrite row keeps `rewritten` distinct from `markdown` and may strengthen the document
   assertion to identity reuse. Record the re-ruling and its reason in the report.
6. **Factories and TSDoc.** `createMarkdown` keeps its shape; its diagnostic closes when the class
   gains `span`. Update the `Markdown` class TSDoc remarks to state the provenance contract:
   string construction exposes original-input spans, adoption exposes none, `span` values are
   fresh, and joins or synthetic nodes return `undefined`. Touch the factory TSDoc only where the
   provenance contract makes a sentence false.

## The rows, red-first

Insert each failing proof before its implementation lands, and record the exact command with its
red and green readings. The analyst's obligations and the planner's ordering case, all in
`tests/src/core/Markdown.test.ts`:

- `span` on parsed nodes returns the original-input region;
- `span` returns a fresh value per call — mutating one return does not affect the next;
- a foreign node and an adopted document's nodes return `undefined`;
- separate handles over the same text hold independent maps;
- `map`: a one-source replacement's output node carries the source node's span, and a rebuilt
  ancestor carries its original's span;
- `map`: an output built from separate sources resolves to `undefined`;
- the chain-termination case: a handler returns an original node taken from a DIFFERENT position
  in the tree, and the returned node's span equals its own region, not the slot it was placed in;
- the re-ruled identity-rewrite row.

Name each test for what it proves, never for the control that specified it.

## Scope

Owned files: `src/core/Markdown.ts`, `src/core/factories.ts`, and
`tests/src/core/Markdown.test.ts`. Report-only: `src/core/types.ts`, `src/core/helpers.ts`,
`src/core/parsers.ts`, `tests/src/core/helpers.test.ts`, `tests/src/core/parsers.test.ts`, and
`guides/markdown.md`. Off-limits: everything else. No commit, no push, no
`git checkout`/`restore`/`stash`/`reset`/`clean`, no installs, no tree-wide `format` or
`lint --fix` (scoped `oxfmt --write` over owned files only), no new dependency, no `any`, no type
assertion, no suppression directive.

## Output

Your final report, written to `/home/user/lsp/tmp/units/h2-u5-handle-report.md` and returned as
your final message:

1. What changed: each owned file with the exact behavioral delta, and the `#derive` ordering
   stated in one sentence.
2. Red-first records per row cluster with commands and exit codes.
3. The re-ruled rows with reasons.
4. Scoped gate readings with exit codes: `npx oxfmt --config .oxfmtrc.json --check` and
   `npx oxlint --config .oxlintrc.json --deny-warnings` over the owned files,
   `npm run check:src:core`, and
   `npm run test:src:core -- tests/src/core/Markdown.test.ts`.
5. An observation reading of the unfiltered `npm run test:src:core` project — report the result;
   the Orchestrator takes the authoritative run.
6. `git diff --stat` and `git status --short`.
7. Observations outside scope, each named against the unit that owns it — H2-U6 owns
   `guides/markdown.md` parity, the `span` method row, and the tuple example at `:622`.

## Deviation contract

A conflict with the ruled contract stops the unit: report expected, found, exact evidence, done or
not done, and at most one short hypothesis. The named stop conditions: a diagnostic outside the
granted list survives in the core project; closing a row requires touching a report-only file; the
read-source-first ordering cannot terminate a chain without a behavioral change elsewhere. Row
titles, the TSDoc wording, and where the copied-map loop sits inside the constructor are yours to
decide, record, and carry on from.

## Acceptance criteria

Ordered cheap-first.

1. `git status --short` shows changes only in the owned files beyond the standing held entries.
2. Scoped `oxfmt --check` and `oxlint --deny-warnings` over the owned files exit 0.
3. `npm run check:src:core` exits 0 — every granted diagnostic closed, none added.
4. `npm run test:src:core -- tests/src/core/Markdown.test.ts` exits 0 with the named rows green.

## Review evidence

The Orchestrator captures the actual diff and the actual `git status` output after you exit. The
audit routes per the reconciliation: `analyst` (Sol) over this unit's derivation ordering,
`reviewer` (Opus) over the U2/U3/U4 units.
