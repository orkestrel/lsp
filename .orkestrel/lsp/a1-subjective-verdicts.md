# A1 subjective lane — reviewer / Opus 5, 2026-08-26

Design-fit review of the campaign diff `2c0eba8..e5dfac7`. Retained from the agent's report;
dispositions are in `campaign-audit-verdict.md`. The lane audited the shipped working tree (its
toolset has no shell for `git diff`; the byte-identity items were settled by the Orchestrator).

Rulings: naming passes (the `read*`/`scan*`/`join*`/`take*` vocabulary is internally consistent,
acronym case canonical, no lifecycle collision); placement and kind purity pass (leaves in
`helpers.ts` with the throwing-helper precedent, barrel reach confirmed, TSDoc complete); design
fit matches the D2 reconciliation and plan rulings 1-2 with no drift found.

Findings:

- **F1 (defect)**: `guides/lsp.md` framing section omits that `readLSPHeader` takes the block
  ENDING BEFORE the boundary — a reader slicing `subarray(0, boundary + 4)` after
  `scanLSPBoundary` gets "The LSP header contains an invalid field" pointing at a fine field —
  and its fence builds a header by hand instead of composing the two functions, so the boundary
  arithmetic the section exists to teach never appears. Fix: state
  "`bytes.subarray(0, boundary)` is the block `readLSPHeader()` reads and the body starts at
  `boundary + 4`" in the main flow and make the fence slice one framed buffer.
- **F2**: "the second argument" names a parameter by position — use the `messages` name.
- **F3**: condition after instruction and a dangling "either grammar" — "When you frame the bytes
  yourself, reach the header and body grammars directly."
- **F4**: actor-dropped passive — "The core package publishes the operations…".
- **F5**: `readLSPHeader`'s `@throws` misses the "Thrown when" form; `parseLSPMessages` carries
  the same inherited break.
- **F6**: the diagnostic `code` member is the file's one remaining hand-rolled union —
  `optionalOf(unionOf(isNumber, isString))` matches `code?: number | string` exactly; a gap in
  ruling 5's site list, not drift.
- **F7**: `ms` is a unit-abbreviation parameter name; the package vocabulary is `timeout`.
- **F8**: the surface row's "the loop" — "the host event loop".
- **F9**: `messages` is required while every documented call passes `[]` — give it a documented
  empty-list default so the consumer call is `readLSPHeader(header)`.
- **F10 (observation, no action)**: `waitForDeadline` is the barrel's only unqualified function
  name; qualifying it would misstate its domain.
- **F11 (observation → one-line comment)**: the `encoding` getter's `'utf-16'` is the protocol's
  own default, not the advertisement; nothing at the getter records that, inviting a wrong
  "finish the job" edit.
- **F12 (observation, no action)**: the scan-window build stays folded in the spine — one call
  site, correct under the helper rule; recorded so the next reader does not re-open it.

Referrals: R1 (per-invocation guard-closure allocation on the publish path — measurement, not a
verdict; recorded, no action without a measured need); R2 (byte-identity — settled by the
Orchestrator); R3 (ROADMAP — U3's subject).

Terminal line as returned: FAIL — defect F1.
