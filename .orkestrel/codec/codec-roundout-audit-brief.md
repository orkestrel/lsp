# Audit brief: codec round-out (round 6, the final pre-release round)

You are an auditor. Attempt to REFUTE each claim; CONFIRMED names the failed attack;
undecidable is UNRESOLVED with what settles it. Read-only; rule from source, the diff, rule
texts, and the executed evidence below.

## Subject and chain

Rounds 1-5 closed (codec log; lsp archive 3013cdd and earlier). Subject: the UNCOMMITTED
working tree of `C:\Users\mikes\WebstormProjects\codec` on `69173c6` — `measureUTF8`, the
four round-5 witness classes, the Patterns fences, and one keyword reorder. Writer: Opus 5.
Diff: `git -C ...codec diff` + `status`. This is the LAST round before the release wave.

## Established — Orchestrator-executed on the built dist

- 30,000-round probe: `measureUTF8(text) === (text.isWellFormed() ? TextEncoder bytes :
  undefined)` over widths 1-4 including U+D7FF/U+E000/BOM/astral with injected lone
  surrogates in both positions — zero failures, off-by-one control tripped.
- Writer mutation controls: measureUTF8 width defect 3 failed/154; decodeUTF8 surrogate
  refusal removed reddens the NEW per-position sweep; continuation check removed reddens
  the NEW embedded-pair sweep — each restored to 157 green.

## Numbered claims

1. **measureUTF8 sound.** The encode-side triple holds on every string; the walk counts
   1/2/3/4 per code point without allocating or delegating; the direction inversion and the
   scaffold `computeBytes` divergence are stated truly in TSDoc, guide, and README.
2. **The four witness classes are actually closed.** (a) the embedded-pair and per-position
   sweeps reach multi-byte defects the two-byte sweep could not (attack: name a UTF-8
   defect class STILL unwitnessed); (b) U+D7FF/U+E000 now ride TEXTS and UTF8_BOUNDARIES;
   (c) the seeded mutant population reaches refused measure texts past length 4 on every
   face (117 §4-admitted / 37 hex-admitted claimed — verify the reach assertion exists);
   (d) WINDOWS_1252_INDEX is genuinely independent (characters + Unicode names, test-tree,
   not copied from constants) and the comparison is both-directions.
3. **The fences are true and driven.** Every value every new fence claims is transcribed
   and executed in tests/guides.test.ts; no fence sentence is false; the three flagged
   consequences (setup.ts now importing @src/core into every project; the test file's
   relative constants import; the package.json line) are each sound or name the defect.
4. **Ship it.** 23 exports, guide/README/dist in sync, no dead data, nothing half-added —
   the final pre-release surface.

## Verdict shape

Numbered verdicts 1-4 per the falsify law; findings outside the claims to the BROKEN
standard; one terminal line. No process diary.
