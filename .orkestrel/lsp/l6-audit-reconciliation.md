# L6 round audit — reconciliation, 2026-08-26

Lanes run: `reviewer` (Claude Opus 5, native, verdict in `l6-audit-reviewer-verdict.md`) and
`analyst` (GPT-5.6 Sol, bench session `01a03ce8-eaa2-7791-af2b-a6c712dd212a`, verdict in
`l6-audit-analyst-verdict.md`). Both lanes ran blind on the round captures of 2026-08-26. The
`checker` lane did not run: no acceptance criterion in this round is a count, path, or parity row
a mechanical pass would settle beyond what the two lanes read. Cross-engine coverage held: the
analyst ruled the Opus-written L6-A, L6-D, and L6-E; the reviewer ruled the Sol-written L6-B.

Both lanes returned FAIL. Every failure is closed by the fix round cut here; no finding is
dropped.

## The rulings, finding by finding, each with its carrier

1. **Reviewer claim 5 — the L6-B conversion record is insufficient. Sustained.** The report
   records three row conversions in one clause with no per-row reason and no retired-coverage
   note. Carrier: unit L6.1 writes the successor record
   `.orkestrel/lsp/l6-b-client-report-r2.md` with a row per conversion — old title, new title,
   the ruling clause that made the old assertion false, and the coverage the conversion retired.
2. **Reviewer F1 — the `#timeoutRequest` cancellation branch is unreachable. Sustained; the
   branch is deleted.** The reviewer's enumeration: `#request` has three call sites — initialize
   during `starting`, shutdown during `destroying`, the diagnostic during `ready` with the caller
   signal — and only a signal-less request binds `#timeoutRequest`, so the `ready`-phase guard at
   `src/core/LSPClient.ts:562` can never pass. The analyst's claim 3 confirms the same call-site
   and phase enumeration independently. The reviewer's interleaving referral is answered by that
   enumeration: a lifecycle request settles or times out inside its own phase, and no path
   carries a signal-less pending request into `ready`. The design no longer earns the machinery;
   deletion is behavior-preserving. Carrier: L6.1.
3. **Reviewer F2 — the `open` `@param options` line describes the member rather than the bag.
   Sustained.** Carrier: L6.1, with the reviewer's replacement sentence.
4. **Reviewer F3 — the factory names an unqualified "abort signal" beside a second signal.
   Sustained.** Carrier: L6.1, adopting the guide row's term "client abort".
5. **Reviewer F4 — the `timeout` prose understates transport-close settlement. Ruled: reword.**
   The code closes the transport from `#releaseGeneration` on a handshake failure as well as at
   destroy time; the sentence in `src/core/types.ts:271` and `guides/lsp.md:18-19` restricts the
   settlement to destroy time. Mean-what-you-say beats claim-less-than-true here: the sentence
   drops the destroy-time restriction from the transport-close clause while keeping it on the
   exit write. Carrier: L6.1, both files, same wording in both.
6. **Analyst claim 8 — the L6-E report's warming sentence is false. Sustained as a record
   correction.** The product prose is clean: the guide row at `guides/probe.md:228` and the
   source comment at `src/server/stages/LintStage.ts:106-108` claim the refusal precedes serving,
   not warming, and the Orchestrator's sweep of 2026-08-26 (`rg` over the probe guide and the
   lint stage for the spawning claim) found the false sentence only in
   `.orkestrel/probe/l6-e-probe-report.md` § 1. Carrier: the correction note
   `l6-e-probe-report-correction.md` beside the report, quoting the analyst's ruling.
7. **Analyst MEDIUM — the lint stage's progress gauge misattributes a hung close cleanup.
   Sustained; fixed in the round.** `LintStage.#document` raises `#progress` at admission and
   still holds it raised while the `finally` block awaits the stage-owned `client.close` cleanup,
   so a coordinator expiry during that await reads `progress` above its snapshot and classifies
   the failure claimant-owned, against the contract at `src/server/types.ts:135-142`. The gauge
   also serves as the `didOpen` version, so restoring it needs a separate monotonic revision.
   The finding is inside the held, uncommitted probe round, so it is the round's to fix before
   the one commit. Carrier: unit P1.1.

## The fix round

| Unit | Role and engine | Tree | Subject | Auditor |
|---|---|---|---|---|
| L6.1 | `sol` — GPT-5.6 Sol, bench | `/home/user/lsp` | The dead-branch deletion, the F2/F3/F4 prose, the successor L6-B record | `reviewer` — Opus 5, the engine that did not write it |
| P1.1 | `implementer` — Opus 5, native | `/home/user/probe` | The revision split and the gauge restore, with rows the bench cannot prove (the proof spawns the real language server) | `analyst` — Sol, the engine that did not write it |

The routing deviation for P1.1 repeats the L6-E deviation on the same evidence: the proof drives
a language-server grandchild the bench sandbox denies.

## Host obligations retained by the Orchestrator

The analyst's unknowns, run after the fix units land and before the round commits, solo:

- `/home/user/lsp`: `npm run test:src:core -- tests/src/core/LSPClient.test.ts`
- `/home/user/lsp`: `npm run test:src:server -- tests/src/server/integration.test.ts`
- `/home/user/probe`: `npx vitest run --project src:server tests/src/server/Probe.test.ts tests/src/server/stages/LintStage.test.ts`
- `/home/user/probe`: `npx vitest run --project src:server`

Then the full gate chains in each tree, the ONE round commit in lsp, the tarball rebuild and
repack, the probe re-install, and the ONE round commit in probe.
