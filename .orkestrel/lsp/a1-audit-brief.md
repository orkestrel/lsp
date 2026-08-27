# A1 — falsification audit of the campaign's implementation

The subject is the committed campaign diff `2c0eba8..e5dfac7` on `main` of
`C:/Users/mikes/WebstormProjects/lsp` — the U1 combinator adoption (`869b506`), the U2 seam fold
and extractions (`05005da`), and the U5 codec decomposition (`e5dfac7`) — together with the unit
reports under `.orkestrel/lsp/` (`u1-report.md`, `u2-report.md`, `u5-report.md`), which are the
audited units' own claims.

Attempt REFUTATION of each numbered claim, not confirmation. A claim you cannot break is
CONFIRMED with the evidence that convinced you. A claim you break is BROKEN with the exact
failing input, state, or interleaving, plus the smallest correct fix. A claim you could not
attack either way is named as such.

Read before ruling: `AGENTS.md`; `.claude/rules/quality.md` § Falsification;
`.orkestrel/lsp/plan.md`; the three unit reports; then the diff itself
(`git diff 2c0eba8..e5dfac7 -- src tests guides`).

## Claims

1. Every guard U1 converted accepts exactly the set the `2c0eba8` baseline accepted, for every
   input — holes, array-likes, `Object.create(null)`, class instances, present-key `undefined`
   optionals, and cross-type near-misses included.
2. The U2 fold of `#releaseGeneration` changed no observable behavior: a failed initialize
   handshake still closes the transport, sets the same lifecycle, emits the same coded errors,
   and permits a clean restart.
3. `LSP_CAPABILITIES` is frozen at every level (the outer record, `general`, the encodings
   array, `textDocument`, and each leaf record), and no single-site edit can move the
   advertisement without moving the acceptance set.
4. `waitForDeadline` resolves at its deadline, never rejects, and `#closeTransport` still
   discriminates the settled, failed, and deadline outcomes exactly as the baseline did.
5. U5's `parseLSPMessages` is behavior-identical to the baseline: every refusal's code, message
   string, and context shape; every accepted frame sequence under incremental delivery split at
   any byte offset; and no segment join occurs while a header is incomplete.
6. The five U5 leaves honor their documented contracts under adverse input: `joinLSPSegments`
   always returns an owned buffer; `takeLSPTail` handles counts spanning segments, exceeding the
   chain, zero, and negative as documented; `scanLSPBoundary` never reads out of range and
   reports the first boundary or `undefined`; `readLSPHeader` and `readLSPBody` refuse exactly
   what the monolith refused, with identical `context.messages` freezing.
7. The retained proofs still bind: the tests added by U1, U2, and U5 each fail under a seeded
   defect of the kind they claim to catch (the unit reports' mutation evidence is honest — spot
   re-run at least one mutation per unit yourself).

## Execution rights and containment

You hold the OBJECTIVE lane and you may EXECUTE to falsify: scoped non-mutating commands only —
`npm run test:src:core`, `npm run test:policy`, `npm run test:guides`, `node` one-off scripts you
write under `tmp/cursor/a1/` (create it), and read-only `git` commands. You must not edit any
tracked file; a mutation you need for claim 7 is applied to a COPY of the file under
`tmp/cursor/a1/` only if runnable there, and otherwise you apply it to the tracked file, run the
suite, and restore the exact bytes — capture `git status --porcelain` and
`git diff --stat` before you begin and after you finish, and report both; any residual change is
a deviation you must name. Never run `format`, `lint --fix`, `build`, full `npm test`, or any
git command that discards changes.

## Output

Per-claim verdicts (CONFIRMED / BROKEN / COULD-NOT-ATTACK) with evidence and executed commands,
then a one-line terminal verdict: PASS if no claim is BROKEN, else FAIL with the broken claims
listed. No process diary.
