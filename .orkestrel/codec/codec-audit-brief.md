# Audit brief: codec wave 1 (round 2 of the codec chain)

You are an auditor. Attempt to REFUTE each numbered claim, not to confirm it. CONFIRMED
requires naming the attack you tried that failed. A claim you cannot decide is UNRESOLVED,
not CONFIRMED — say what would settle it. Do not hedge toward an imagined consensus. Return
exactly the verdict shape at the end. You edit no source and spawn nothing.

## Subject and chain

- Round 1: implementation unit (Opus 5) — commit `0524d8a` in
  `C:\Users\mikes\WebstormProjects\codec`, on top of scaffold baseline `eb4938a`. It claimed:
  the six-export Base64 surface, canonical-strict both faces, one table walk, guards
  delegating to decoders, guide + parity suite, all scoped gates green. Its report:
  `C:\Users\mikes\WebstormProjects\lsp\.orkestrel\codec\codec-impl-report.md`; its dispatch
  brief sits beside it.
- This round decides whether codec 0.0.1 is ACCEPTED and the server/mcp extraction wave
  launches on it. A finding now is worth more than a clean pass: after acceptance, the next
  reader of a defect is a consumer.

## Review evidence

- The diff: `git -C C:\Users\mikes\WebstormProjects\codec show 0524d8a` (the whole
  implementation; the scaffold baseline is `eb4938a`). Status after commit: clean (0 dirty
  rows, captured by the Orchestrator).
- The governing charter/doctrine: `C:\Users\mikes\WebstormProjects\codec\guides\codec.md`
  (the subject's own guide — also under audit) and the archived charter verdict in the lsp
  repo history (commit 7fdcb40, `.orkestrel/campaign/codec-home/charter-verdict.md`).
- Canon: `codec/AGENTS.md` points at the scaffold checkout — `../scaffold/AGENTS.md`,
  `../scaffold/.claude/rules/` (names.md, typescript.md, architecture.md, patterns.md,
  tests.md, documentation.md, quality.md).

## Already established — verified by the Orchestrator directly, do not re-run

- Differential probe against Node's Buffer codec, run on the dist built from `0524d8a`
  (executed by the Orchestrator; canonicity oracle = re-encode equality, because Buffer
  decodes leniently): 20000 encode/round-trip rounds agree on both faces; all 8192
  two-character padding groups (`XX==` std, `XX` url) agree with the canonical set and the
  iff law; 4000 single-fault mutants each refused or still canonical; hostile guard values
  all false; failures: 0. Negative control (a seeded lenient decoder accepting non-canonical
  two-pad groups) produced 3840 comparator disagreements — the instrument detects the class
  it guards. COVERAGE BOUNDARY: the exhaustive group sweep covers only the two-pad
  (`& 0x0f`) class; the one-pad (`& 0x03`) class is covered by the writer's byte-pair sweep
  and named vectors, not by an Orchestrator-exhaustive sweep. Claim 2 names it.
- The `'aa==' -> 'aQ=='` canonical-neighbour correction, re-derived by hand.
- The build ran from the commit under audit before any dist reading.
- Writer-reported gate tails (format/lint/check/test:src 36/test:guides 22/test:policy 111/
  test:config 46, all exit 0) — the independent verifier re-runs these AFTER this round;
  treat them as the writer's claims, not as established.

## Numbered claims — attack each

1. **Round-trip identity.** `decode*(encode*(bytes))` deep-equals `bytes` for every byte
   sequence on both faces, empty included. Falsify with any byte sequence.
2. **Canonical-form strictness.** For every text either guard admits,
   `encode*(decode*(text)) === text`; every non-canonical spelling is refused — whitespace
   anywhere, wrong/absent/excess padding, `length % 4 === 1` residues, non-zero unused
   trailing bits in BOTH the two-pad and the ONE-PAD class (`third & 0x03` — the class the
   Orchestrator's exhaustive sweep did not cover: attack it directly, e.g. `'AAB='`-shaped
   texts), and cross-alphabet characters. Falsify with any admitted-but-non-canonical or
   refused-but-canonical text.
3. **The iff law and guard totality.** `is*(value)` is true exactly when `decode*` on that
   string is defined; guards are total on any `unknown` (hostile getters, non-strings,
   Uint8Array, functions) and never throw. Falsify with any disagreeing value or any throw.
4. **Shipped-graph purity.** The built `dist/src/core/index.js` (and its cjs twin) contains
   no `atob`/`btoa`/`Buffer`/`TextEncoder`/`TextDecoder`/`node:`/`@orkestrel/` reference,
   and each published entry point loads standalone and answers an export (the module-cycle
   law: prove by loading the artifact, not by the suite).
5. **The §5-by-substitution composition is exact.** `decodeBase64URL` refuses `+`, `/`, and
   `=` before substitution, so it accepts exactly canonical unpadded §5. Attack the
   composition math: mixed-alphabet texts (`'AQ-_'` vs `'AQ+_'`), padded url text, texts
   whose substituted form is canonical §4 while the original should be refused, the
   `'AA'`/`'AA=='` residue split, url one-pad-class unused bits.
6. **The instruments bind and none is vacuous.** The two mutation controls the report names
   exist and redden as reported; the RFC-transcription check would catch a swapped table
   entry (attack the RULE: name a table corruption or code change the suite would NOT
   catch, and demonstrate it as far as reading permits).
7. **The guide is true — not plausible, true.** Every behavioral sentence in
   `guides/codec.md` is accurate and pinned or directly verifiable, including the corrected
   canonical-neighbour sentence, the membership bar, the declared non-goals. Name any false
   universal — or any unfalsifiable one that replaced a false one.
8. **The self-declared rulings are sound.** (a) Constants exported from `constants.ts`, kept
   out of the barrel, INTERNAL-listed — against the actual text of
   `.claude/rules/architecture.md`; (b) vector tables living in the test file — against
   `.claude/rules/tests.md`; (c) the single-alphabet deviation — no duplicated walk, no dead
   second table, and the substitution idiom does not smuggle a §4 acceptance into §5.
   Attack the rulings the writer made, not just the code.
9. **Naming and shape conform.** `Base64URL` initialisms per `names.md`; `{verb}{Noun}`
   helpers; no nested function declarations; TSDoc per `typescript.md`; centralization per
   `architecture.md` (types.ts absent is correct only if no public type exists — check).
10. **Coherent as a whole.** Would you ship this as `@orkestrel/codec` 0.0.1 — manifest,
    README, guide, LICENSE, the tree a stranger installs? The one claim that catches
    accumulated damage no single diff shows.

## Unknowns

- Pure-ES throughput vs native codecs is unmeasured and out of scope (declared later work,
  not a claim). If you believe it blocks ACCEPTANCE rather than release, say so under
  claim 10 with the workload that would decide it.

## Verdict shape (exactly this)

Numbered verdicts 1-10, each `CONFIRMED` (name the attack that failed) / `BROKEN` (exact
failing input, state, or interleaving + smallest correct fix) / `UNRESOLVED` (what would
settle it) / `NOT-EVIDENCED` (which capture is missing). Then findings fitting no claim (to
the BROKEN standard of evidence). Then ONE terminal line:
`VERDICT: PASS — <m> of <m> confirmed, no findings outside the claims` or
`VERDICT: FAIL — <n> broken, <u> unresolved, <e> not-evidenced, <x> findings outside the claims`.
No process diary.
