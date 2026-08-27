# Campaign audit verdict — A1 round over `2c0eba8..e5dfac7`, 2026-08-26

Lanes run: objective falsification (Grok, bench, with scoped execution — journal `a1.log`),
subjective design-fit review (`reviewer`, Opus 5, native), mechanical conformance (`checker`,
Sonnet, native). No lane was skipped.

## Objective lane — PASS

Claims 1 through 6 CONFIRMED with executed evidence (scoped suites re-run on the bench: 138, 110,
and 25 passed; combinator semantics read from the installed contract implementation; the
incomplete-header no-join property traced; containment clean before and after). Claim 7
COULD-NOT-ATTACK inside the bench: the sandbox refused the file writes a seeded mutation needs —
the known bench-sandbox limit, not a finding.

**Claim 7 settled by the Orchestrator on the host, 2026-08-26**: one seeded mutation per unit,
applied and restored by exact inverse edits. U1's widened severity literal read
`1 failed | 137 passed (138)`; U2's widened advertisement read `1 failed | 24 passed (25)` in
guides and `3 failed | 135 passed (138)` in core; U5's unclamped `takeLSPTail` read
`1 failed | 137 passed (138)`, failing exactly the exceeds-chain case. Restoration:
`git status --porcelain` empty, `138 passed (138)`.

## Checker lane — items settled

`#releaseGeneration` absent, no forbidden syntax in added lines, combinator sites match the
ruling, guide rows present: PASS as reported. The four items the read-only toolset could not
reach were settled by Orchestrator evidence: `package.json` and `package-lock.json` byte-identical
across the campaign (empty diff), `tests/src/core/parsers.test.ts` byte-identical (empty diff),
`git ls-files tmp` empty, `#cancelRequest` byte-identical between `2c0eba8` and `e5dfac7` (both
bodies read and compared). The one FAIL — `LSP_CAPABILITIES` without `@example` — is RULED NOT A
DEFECT: every constant in `constants.ts` documents with a description and `@remarks` and no
example, the parity machinery requires examples for Surface functions, and the typescript rule
scopes `@example` to "where applicable"; the checker criterion was worded over-broadly for
constants by the dispatch.

## Subjective lane — FAIL on one defect, fix unit dispatched

- **F1 (defect, accepted)**: `guides/lsp.md` framing-your-own-bytes section omits the
  boundary-exclusion precondition (`subarray(0, boundary)` is the header block; the body starts
  at `boundary + 4`) and its fence does not compose with `scanLSPBoundary`. Carried by U6.
- **F2, F3, F4, F8 (polish, accepted)**: guide prose repairs per the writing rules. Carried by U6.
- **F5 (polish, accepted)**: the `@throws` "Thrown when" form on `readLSPHeader`, and the same
  inherited break on `parseLSPMessages`. Carried by U6.
- **F6 (polish, accepted)**: the sole remaining hand-rolled union — the diagnostic `code` member —
  adopts `optionalOf(unionOf(isNumber, isString))`; a gap in ruling 5's site list, not drift.
  Carried by U6 with a new refusal case binding it.
- **F7 (polish, accepted)**: the `ms` parameter renames to `timeout`. Carried by U6.
- **F9 (polish, accepted)**: `messages` on the two readers gains a documented empty-list default.
  Carried by U6.
- **F11 (observation, accepted as a one-line comment)**: the `encoding` getter's protocol-default
  literal gets the comment naming it as the protocol's default, closing the "finish the job"
  trap. Carried by U6.
- **F10, F12 (observations, recorded, no action)**: `waitForDeadline` is the barrel's one
  unqualified function name — qualifying it would misstate its domain; the scan-window build
  stays folded in the spine per the helper rule.
- **R1 (referral, recorded, no action)**: inline combinator calls construct guard closures per
  invocation on the publish path. The ruling specified inline adoption and no measurement shows
  the allocation matters; recorded for a future measured need.
- **R2 settled** (package byte-identity verified); **R3** is U3's subject.

## Terminal

PASS after U6 lands the accepted findings: no behavioral claim broke, the one defect is
documentation composition, and every fix adopts an auditor's verbatim prescription, so the round
closes with the host mutation probes already taken plus the Orchestrator's diff read of U6 —
per the fix-adopts-prescription rule — rather than a fresh cross-engine round.
