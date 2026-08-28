# Audit brief: codec hex + measure increment (round 4 of the codec chain)

You are an auditor. Attempt to REFUTE each claim; CONFIRMED requires naming the failed
attack; undecidable is UNRESOLVED with what settles it. You are read-only: rule from source,
diffs, rule texts, and the supplied executed evidence; where only a run settles it, say so.

## Subject and chain

Rounds 1-3 (implementation, falsification+fix, extraction wave) are closed — records in
`C:\Users\mikes\WebstormProjects\lsp\.orkestrel\` history (commit 91bcb4d) and the codec
repo log. This round's subject: the UNCOMMITTED working tree of
`C:\Users\mikes\WebstormProjects\codec` on top of `887f9cb` — the hex coding
(`encodeHex`/`decodeHex`/`isHex`) and `measureBase64`. Writer: Opus 5. Unit report:
the changes are exactly the working tree diff (`git -C ...codec diff` + `status`).
This round decides whether the increment is accepted into codec 0.0.1 before the release
wave. A finding now is worth more than a clean pass.

## Established — Orchestrator-executed, do not re-run

- Differential probe on the built dist: 20,000 hex encode/round-trip rounds byte-identical
  to Buffer's hex codec; the full two-character canonical sweep over a 35-character pool
  (uppercase, whitespace, foreign, url chars) with iff and re-encode laws; 120,000
  measure-law texts (canonical encodings plus substitution/insertion/truncation mutants):
  `measureBase64(text) === decodeBase64(text)?.length` held on every one; zero failures;
  seeded-defect controls (measure off-by-one, case-folding hex) both tripped.
- The writer's two mutation controls: uppercase lookup entries reddened 4 tests; measure
  off-by-one reddened 5; both reverts diff-verified. Writer-reported counts, but consistent
  with the suite the diff shows.

## Numbered claims

1. **Hex canonical form.** `decodeHex` accepts exactly even-length lowercase `[0-9a-f]*`
   and both round-trip laws hold; the guide states the lowercase-vs-RFC-table departure
   honestly and accurately. Attack the grammar edges (empty, odd, mixed case, unicode
   digits, `0x`) by reading the walk.
2. **Measure sound triple.** `measureBase64` returns exactly `decodeBase64(text)?.length`
   for every string, walks the FULL §4 grammar (residues, padding placement, membership,
   unused trailing bits) and allocates no output buffer, without delegating to the decoder.
   Attack: find a text class where the arithmetic and the decoder could disagree that the
   sweeps cannot witness (the two walks share grammar structure — hunt a defect that would
   be written identically into both).
3. **Doctrine conformance.** The additions honor every charter law: total, never-throw,
   no options, no error type, pure ES, guards in validators.ts, constants INTERNAL and out
   of the barrel, naming per names.md, TSDoc complete, no nested functions.
4. **The tests bind.** The new sweeps and rows would catch: a case-folding lookup, a
   measure arithmetic error, an oracle-table disagreement, an INTERNAL symbol going public.
   Attack the instrument RULES: name a defect class the new suite cannot witness (the
   round-2 lesson: mask-bit witnesses).
5. **Guide and README true.** Every new/changed sentence — the hex doors, the measure law,
   the membership/non-goals updates, the producers sentence (msg deliberately absent), the
   escaped-pipe table repair — is accurate; no universal became false; the wave-1 sentences
   still hold.
6. **Coherent increment.** Ship it inside 0.0.1: nothing half-added (a measure family with
   one member is the creation gate, not asymmetry), no dead data, README/guide/dist in
   sync, and the flagged items (no hex guide fences; charAt allocation caveat) are
   acceptable records rather than defects — or say which is a defect.

## Verdict shape

Numbered verdicts 1-6 (CONFIRMED/BROKEN/UNRESOLVED/NOT-EVIDENCED per the falsify law),
findings outside the claims to the BROKEN standard, one terminal line. No process diary.
