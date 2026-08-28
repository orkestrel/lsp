# Audit brief: codec measures + charsets (round 5 of the codec chain)

You are an auditor. Attempt to REFUTE each claim; CONFIRMED names the failed attack;
undecidable is UNRESOLVED with what settles it. Read-only: rule from source, diffs, rule
texts, and the executed evidence below; where only a run settles it, say so.

## Subject and chain

Rounds 1-4 closed (codec log + lsp archive commits 91bcb4d, 56f2b35). Subjects: commits
`92a18b4` (measureBase64URL + measureHex) and `b685b14` (the four charset codings — twelve
exports) in `C:\Users\mikes\WebstormProjects\codec`, both written by Opus 5. Diffs:
`git -C ...codec show <sha>`. Tree clean at `b685b14`. This round decides acceptance of the
final pre-release surface (22 exports). A finding now is worth more than a clean pass.

## Established — Orchestrator-executed on the built dist, do not re-run

- Differential probe: 20,000 UTF-8 rounds byte-identical to TextEncoder and equal to the
  fatal+ignoreBOM decoder plus round-trip identity; all 256 Latin-1 bytes against the
  IDENTITY oracle; all 256 windows-1252 bytes (251 vs the platform decoder, the five slots
  refusing directly, encode inverting each); 8,000 UTF-16LE rounds vs fatal+ignoreBOM;
  strict-refusal classes (overlongs, encoded surrogates, range, truncation, odd length,
  unpaired lead mid-stream, lone-surrogate encodes) all refusing; BOM preserved
  (EF BB BF 41 -> '\uFEFF A'); 120,000 measure-law texts across url and hex holding the
  sound triple; hostile guards (revoked proxy, DataView, Int8Array, string, null) all
  false with no throw; live negative controls tripped 3/3.
- The writers' mutation controls as reported (unit A: 3 and 5 reddened; unit B: overlong 3,
  slot-0x81 5, odd-length 3, U+0100 3 — each reverted to green).

## Numbered claims

1. **UTF-8 strict + BOM stance.** `decodeUTF8` refuses exactly the non-shortest-form,
   surrogate, out-of-range, and truncated classes; `encodeUTF8` refuses exactly ill-formed
   text; a leading BOM is preserved on BOTH Unicode faces; both round-trip laws hold on
   admitted sets. Attack byte classes the sweeps may not witness (lone continuation mid-
   stream, 0xF5-0xFF leads, boundary code points at each width threshold).
2. **Windows-1252 exact.** The 27-entry high table matches the published code page (the
   writer transcribed it FROM the platform oracle then cross-read — attack the circularity:
   verify entries against an independent statement of CP1252); identity bands correct; the
   five slots refuse; the mapping is a bijection; `encodeWindows1252` refuses every C1
   control.
3. **Latin-1 identity + guard side.** decode total over all bytes; encode refuses exactly
   code units above 0xFF; `isLatin1` is text-side iff encode — consistent with the stated
   guard-side ruling.
4. **UTF-16LE strict.** Odd length, unpaired lead (mid and final), unpaired trail all
   refuse; astral pairs round-trip; BOM preserved.
5. **The guard totality ruling.** Every bytes-side guard is total on any `unknown`
   including a revoked proxy (the `ArrayBuffer.isView` gate); the deliberate refusal of a
   proxy WRAPPING a real Uint8Array is sound — attack that ruling both ways (is the stated
   length-trap rationale real; does any fleet caller legitimately pass a proxied view?).
6. **Measures sound.** Both new measures hold the triple on every string; the §5 measure's
   composition over `measureBase64` mirrors the decoder's composition (the doctrine call
   the unit-A report flags); the guide's measure sentences ("walks the grammar itself",
   "cannot ask") remain TRUE given that composition — or name the sentence that became
   false and its smallest fix.
7. **Guide and README true.** The generalized families section (the old "encode cannot
   fail" universal was Base64-only and is now correctly scoped — the unit-B report flags
   that my dispatch brief's premise mis-stated the baseline; confirm the shipped text is
   now right); the three WHATWG divergence notes; the BOM stance; membership and later
   lists (later = measureUTF8 waiting on scaffold, whose `computeBytes` counts replacement
   bytes for lone surrogates — a verified divergence); no sentence elsewhere became false.
8. **The tests bind.** The four unit-B mutation classes plus unit-A's two are pinned; the
   oracle restrictions (identity Latin-1, 251-byte windows-1252, ignoreBOM) are correctly
   applied in the suite; name any defect class the new suites cannot witness (round-4's
   lesson: length-bounded witnesses; consider multi-unit UTF-8 sequences inside longer
   buffers, table entries only the oracle sweep reaches, measure texts beyond the
   populations).
9. **Coherent whole.** 22 exports, no dead data, `encodeWindows1252`'s linear scan (a
   ruling forced by the single-constant rule — acceptable or a defect?), the Patterns
   section still documenting Base64 fences only (flagged by both units — acceptable record
   or a defect?), dist/README/guide in sync. Ship it as the pre-release surface.

## Verdict shape

Numbered verdicts 1-9 per the falsify law; findings outside the claims to the BROKEN
standard; one terminal line. No process diary.
