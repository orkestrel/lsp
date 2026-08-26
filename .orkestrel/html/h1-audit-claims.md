# Audit round — H1 source provenance (html `3348c1b`), shared claim set

The subject is html commit `3348c1b` (unit H1, written on the GPT-5.6 Sol bench), atop the
separable lockfile commit `42982f0`. Both audit lanes rule on this same claim set; the dispatch
wrapper names each lane's perspective. The unit's report is a claim set to break, not a record to
trust.

Evidence: the committed diff at `/home/user/scaffold/tmp/units/h1-diff.txt` (the full `git show`
of `3348c1b`), the empty status at `/home/user/scaffold/tmp/units/h1-status.txt`, the tree at
`/home/user/html` clean at `3348c1b`, and the retained pair
`/home/user/scaffold/.orkestrel/campaign/h1-provenance-brief.md` and
`h1-provenance-report.md`. The Orchestrator's idle-host gate chain, 2026-08-26: `npm ci`,
`format:check`, `lint:check`, `check`, `build`, and `test` all exit 0; the core suite reports
290 passed, guides 18 passed.

## Claims to falsify

1. `HTML.span(node)` meets its documented contract exactly: the half-open UTF-16 region of the
   original constructor string for parsed nodes and for one-source nodes carried through `map`,
   `sanitize`, and `distill`; `undefined` for adopted documents, foreign nodes, multi-source
   joins, and nodes with no source. Attack the categories the rows may miss — a doctype, a
   comment, raw text under a recovered close, an attribute-carrying element — and the derivation
   seams: a chain composing `sanitize` then `distill` then `map`, a node object shared into a
   second tree, and a one-source `collapseText` rebuilt over a prior multi-source join.
2. The boundary map is correct at its seams: a CRLF pair emits one newline boundary mapped after
   the pair, a bare carriage return and a null replacement preserve width, astral characters
   advance through their two UTF-16 code units, and `parseHTMLSpan` projects a normalized
   boundary in constant work. Attack adjacent and terminal cases: consecutive CRLF pairs, a
   carriage return at end of input, a normalization substitution directly abutting a measured
   node's boundary, and a boundary that no offset entry covers.
3. The unclosed-element ruling holds: an element closed by a later implied closer ends at the
   closer token's opening `<`, and an element still open at end of input ends at the original
   input length. Attack nested unclosed elements, a raw-text element unclosed at end of input,
   and the recovered-close path through `scanRawText`.
4. Provenance state is entity-owned and inert: no module-scope provenance state exists, an
   adopted `HTMLDocument` starts with an empty map, the optional recorders change no node and no
   returned tree, and no caller-owned input is mutated. Attack cross-entity leakage — two
   entities parsing the same string, a derivation reading the wrong ancestor's map — and any
   reachable path where the recorder's map escapes the entity.
5. Each recorded control binds the row it names: every mutation account in the report is
   consistent with the shipped diff, and each named row fails for the defect it claims rather
   than asserting the implementation against itself. The unit's recorded limit is the seam: the
   reds are post-implementation mutation controls, not a chronological run against the untouched
   baseline — rule on whether any row is green by construction.
6. The diff stays inside the law and the owned scope: no banned construct; single-word entity
   API discipline for the `span` method; `parseHTMLSource` and `parseHTMLSpan` placed and named
   per the parsers kind rules with no hidden module helper; the optional recorder parameters on
   `parseDocument` and `scanRawText` are a designed seam rather than a leaked implementation
   detail; the guide's added examples resolve, read in the guide's voice, and claim only what
   the code earns; `src/core/validators.ts`, `src/core/shapers.ts`, and `tests/guides.test.ts`
   are untouched; and the status is empty.

Number any finding fitting no claim under its own heading, per the skill.
