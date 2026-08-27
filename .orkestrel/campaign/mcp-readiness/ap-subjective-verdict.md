# A-P subjective lane verdict (returned 2026-08-27, `reviewer`/Opus 5, blind, no execution)

Rulings derived from the supplied diffs, the worktree source at `89f7bd7`, and the installed
`@orkestrel/mcp` `0.0.25` implementation; key arithmetic re-derived independently of the writers'
tables. Immutable record; reconciliation happens outside this file.

1. **CONFIRMED.** Both wire fields build from one `result.value` (`ProbeServer.ts:228-239`); the
   installed `MCPCallResult` arm returns the snapshot verbatim. The expected attack —
   `serializeJSON` refusing an `undefined`-valued key — fails because `Control.reason` is
   required and no stage emits `range: undefined`. Referral (objective): the `MCPCallResult` arm
   bypasses `buildModernResult`, so probe's modern replies carry no `_meta` server identity or
   cache fields — pre-existing, unruled.
2. **CONFIRMED.** `modernResultToLegacy` is a denylist; `structuredContent` rides the generic
   copy branch byte-identically.
3. **CONFIRMED.** No refusal payload's key count falls between 64 and 4096 (`ToolFailure` is
   small); refusal paths byte-identical to pre-image. Referral (objective): `limit.keys = 4096`
   also relaxes the INBOUND `_meta` key bound — a hostile-input surface change outside this
   claim.
4. **CONFIRMED.** Independent arithmetic: whole result = 44 + 11N keys; the 64 default admits
   N ≤ 1, the 4096 bound N ≤ 368; the `-32603` string is `#normalize`'s snapshot-refused branch.
5. **BROKEN.** `#execute` returns `rendered` unchecked; when `formatVerdict` text alone exceeds
   the 4 MiB content bound (roughly 47,000 issues, constructible with the existing generator),
   the reply is `-32603` and the receipt is lost — while `guides/probe.md:526-527` and the
   `ProbeServer.ts:233-234` comment state the invariant unconditionally. Fix: qualify both
   sentences to the real condition, or bound `rendered` against `#limits` and decide the
   over-bound answer deliberately.
6. **CONFIRMED.** Values identical at the same sites. Observation (Orchestrator's call): the
   published surface moved — the three constants are now public API; `LINT_DEADLINE` and
   `PROBE_KEYS` are single-site internals in tension with the minimal-API law; parity rows
   exist either way.
7. **BROKEN.** Three added sentences false or unearned:
   - "leaves the byte bounds the binding ones" — false; the key bound still binds (N ≤ 368;
     bytes would need ~11 KB per issue). Duplicated in `constants.ts:120-122` and
     `ProbeServer.ts:64-65`; correct all homes.
   - "the `@orkestrel/mcp` client … renders the text itself" — false; `buildCallOutcome`
     prefers `structuredContent` and DISCARDS content blocks; the repo's own drives import
     `formatVerdict` to render.
   - the receipt paragraph still instructs reading the last line while naming a client that
     never receives it, and omits `verdict.receipt` from the structured fields list.
   - Minor: the `PROBE_KEYS` guide row calls `_meta` "content"; match the TSDoc.
8. **CONFIRMED.** No banned construct; owned lists match; containment clean. Nit: `readAnswer`
   annotates `unknown`, `readCall` lets implicit `any` flow — use the annotated form in both.
9. **BROKEN.** Drive half holds (`isVerdict(outcome.value)` asserted); guide half repeats the
   claim-7 falsehoods — a consumer following it reads a line it never receives. Fix = claim 7's.
10. **BROKEN.** Attacked seven writer verdicts; three fell:
    - "fallback not cheaply drivable" refuted — threshold is 368 issues; the existing
      `Array.from` fixture reaches it for one longer type pass. Prescribed: a wide drive past
      368 asserting no `structuredContent`, one text block, receipt-pattern last line.
    - "moved measurement sentences" refuted — copied, not moved: duplicate explanation blocks
      remain at `LintStage.ts:55-59` and `ProbeServer.ts:58-66`; also `LintStage.#deadline` is
      now a superfluous rename-only field — read `LINT_DEADLINE` at both sites and drop it.
    - "no parity rows needed" refuted — literal `{ keys: 4096 }` at `ProbeServer.test.ts:360`
      and literal `2_000` at `LintStage.test.ts:659,698` (plus "2 s" prose comments) were left
      un-migrated; import the constants and assert against them.
    - Held: off-limits honesty; canonical-copy caveat; the `MCPLimitOptions.keys` upstream
      doc-drift routing.

## Findings outside the claims

- **F1.** `ProbeServer.#limits` is a second configured copy of a bound the composed server
  publishes precisely to prevent second copies (`MCPServerInterface.limit` is
  `Required<MCPLimitOptions>`, with TSDoc saying exactly this). Add any second leaf to the
  `limit` option and the copies silently disagree; nothing reds. Fix: hold the composed server
  and read `bytes`/`keys`/`depth` from its `limit` getter (mapping `content` → `bytes`).
- **F2.** `LINT_DEADLINE` TSDoc ships "Orchestrator measurement of record … this value is
  right" — agent-role vocabulary and an evaluative claim in published hover documentation. Fix:
  "Measured 2026-08-27: the workspace `oxlint --lsp` answers `initialize` in 155 ms, so this
  bound is more than ten times that reply."

VERDICT: FAIL — 4 broken, 0 unresolved, 0 not-evidenced, 2 findings outside the claims
