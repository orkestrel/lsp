# Reconciliation — H1 audit round (html `3348c1b`)

Both lanes ran blind on the shared claim set (`h1-audit-claims.md`): the reviewer (Opus 5,
native, subjective) returned FAIL — 4 broken, 1 unresolved, 1 finding outside — and the analyst
(GPT-5.6 Sol, bench, objective; journal `tmp/codex/h1-audit-analyst.jsonl`, session
`01a03b9e-39ea-73a2-8ccc-79c94f588c2a`) returned FAIL — 6 broken. The immutable lane returns
are `h1-audit-reviewer-verdict.md` and `h1-audit-analyst-verdict.md`. The Orchestrator settled
every lane disagreement by executed probe on 2026-08-26; the instruments and their measured
outputs are retained under `h1-audit-instruments/`.

## Per-claim rulings

1. **BROKEN on one leg; the other leg settled CONFIRMED.** The reviewer's unresolved chain
   scenario ran green: the sanitize-distill-map chain answers, the re-rooted document slicing
   to `<main><p class="x">A <b>b</b> C</p><!--n--></main>` and the paragraph to its exact
   region (`h1-audit-instruments/h1-chain-settle.test.ts`; the first run's red was a probe
   design error — `distill` re-roots into `main`, so no `main` element survives — and that red
   doubles as the instrument's failure proof). The analyst's identity-collision vector
   measured: `map` returning one object for separate source nodes keeps the second
   derivation, and `span(shared)` answered `{ start: 11, end: 12 }` where the contract owes
   `undefined` (`h1-audit-instruments/h1-lane-disagreements.test.ts`, PROBE A). → H1.1 item 1.
2. **BROKEN.** Both lanes; measured: `parseHTMLSpan([0, 1], 1, 2)` fabricates
   `{ start: 1, end: 1 }` for a boundary no entry covers (PROBE B). → carried inside H1.1
   item 3's contract change.
3. **Split.** The reviewer's derivations for its vectors stand — the mismatched pop, the
   end-of-input drain, and the recovered-close raw-text path agree with the unit's executed
   values. The analyst's nested-inline vector measured: `<p><b>x<div>y` records the `p` as
   `[0, 13)` where `guides/html.md:198` ("a block start while `p` is open → implied close")
   owes `[0, 7)` (PROBE C). The defect predates H1: the `7d82b86` baseline carries the
   identical top-of-stack `IMPLIED_CLOSERS` scan, so the parser never delivered the documented
   nested-inline close. Recorded against the parser-conformance capability as successor unit
   H3 (Wave H): the parser fix, the guide row's honesty, and the spans that follow it. The H1
   boundary ruling itself — the closer and end-of-input boundaries over the trees the parser
   produces — stands.
4. **BROKEN.** Both lanes: the recorder parameters mutate caller-owned maps across the
   published surface, against the immutability law. The reviewer's bounded keep-one-recorder
   variant is not adopted; the analyst's reading enforces the law as written. → H1.1 item 2.
5. **BROKEN.** Both lanes: the propagation, absence, and identity rows drew every red from one
   control — the `span` method's absence — which discriminates among none of them; an
   implementation recording no spans at all passes the absence row while that control still
   reds. The parsed-slice and original-coordinate rows carry binding controls and stand.
   → H1.1 item 4, adopting the reviewer's two row-specific mutations and PROBE A as the
   collision row's red-first.
6. **BROKEN.** Both lanes: `parseHTMLSource` and `parseHTMLSpan` are pure leaves misplaced in
   `parsers.ts` under `parse` names their own TSDoc contradicts, and the guide's parsers intro
   at `guides/html.md:83` contradicts its own table rows; the analyst adds that
   `guides/html.md:214` still denies any node-position model while `:183` documents one.
   → H1.1 item 3 (move, rename, narrow) and item 5 (guide coherence).

## Findings outside the claims

- Reviewer F1 (the `map` "allocates nothing" sentence now false in `guides/html.md:117` and
  `src/core/HTML.ts:133-135`, plus the per-node `WeakSet` allocation) → H1.1 item 5.
- The reviewer's struck fence-transcription gap (`tests/guides.test.ts` performs no fence
  transcription, and the file predates the change and was off-limits) stays struck and is
  recorded for the package's own successor scope, never an H1.1 carrier.

## Carriers — the H1.1 fix round

Unit H1.1, `sol` implementer on the bench, baseline `3348c1b`, queued behind M7.4; the
fix-round auditor is the reviewer (Opus, non-writer). Brief:
`tmp/codex/h1.1-provenance-repairs-brief.md`.

1. A rewrite returning one object for separate source nodes leaves that node unprovenanced:
   conflicting derivations mark the output ambiguous and `span` answers `undefined`. PROBE A
   is the red-first row.
2. No public function mutates a caller-owned collection: provenance reaches callers as
   returned values, `scanRawText` carries its region inside the record it already returns, and
   the recorder parameters leave the public surface. The concrete returned shape is the
   unit's recorded choice within that constraint.
3. `parseHTMLSource` and `parseHTMLSpan` move to `src/core/helpers.ts` as `normalizeSource`
   and `projectSpan`, and `projectSpan` returns `HTMLSpan | undefined`, answering `undefined`
   for any boundary no offset entry covers; call sites record nothing on `undefined`; the
   guide's Parsers and Helpers tables and the `:83` intro follow the move. PROBE B is the
   red-first row for the narrowed contract.
4. The propagation, absence, and identity rows get row-specific mutations, each reddening
   exactly its named row: record the first source of a multi-source join (the absence row's
   red), and delete the derivation chain step (the propagation row's red); the collision row
   from item 1 carries its own. The report records each single-row red.
5. Guide coherence: `guides/html.md:214` stops denying a node-position model; the
   "allocates nothing" sentence is restated in both homes to the property that survives; the
   per-node `WeakSet` hoists to one guard per derivation.

Every retained finding names exactly one carrier; the walk found no dropped finding.

## Round consequences

- H3 (Wave H successor): the nested-inline implied close, pre-existing, with the guide row and
  the spans that follow — measured vector retained in PROBE C.
- The `prove` receipts the H1 report left outstanding fall to the Orchestrator on the host
  after H1.1 exits, per `.claude/rules/quality.md` § Instruments.

VERDICT: FAIL — reconciled to the H1.1 carrier set with H3 recorded as successor scope
