# Unit: codec-roundout — measureUTF8, the witness classes, and the fences

Role and engine: implementer, Opus 5 (native). Writing unit in
`C:\Users\mikes\WebstormProjects\codec` (HEAD `69173c6`, clean). Perform directly, spawn
nothing, commit nothing. Read `codec/AGENTS.md` pointers and `guides/codec.md` first —
settled doctrine. Three groups, all in this one unit.

## Group 1 — measureUTF8 (the last surface addition)

| Export | Signature | Law |
| --- | --- | --- |
| `measureUTF8` | `(text: string) => number \| undefined` | `measureUTF8(text) === encodeUTF8(text)?.length` for EVERY string. Counts the wire bytes of well-formed text (1/2/3/4 per code point) without allocating; `undefined` exactly when the text is ill-formed. Never delegates to the encoder. |

Note the direction: the other measures take wire text and count native bytes; UTF-8's wire
form IS bytes, so this measure takes native text and counts wire bytes. Generalize the
guide's measure-family sentence to say a measure answers the coding's BYTE-side size
question without doing the work, with the per-face law spelled in each row. In `helpers.ts`
beside the other measures; TSDoc names the law, the no-allocation point, and the recorded
divergence: scaffold's `computeBytes` counts a lone surrogate as the three replacement
bytes `TextEncoder` writes, where this measure refuses — the strict door, deliberately.

Tests: the law sweep against `encodeUTF8` over TEXTS + ILL_FORMED + a boundary population
(each width threshold, BOM, astral); direct rows (`''` -> 0, `'A'` -> 1, `'é'` -> 2,
`'€'` -> 3, `'😀'`/`'\u{10000}'` -> 4, `'\uD800'` -> undefined); a mutation control (an
off-by-one in one width's count reddens the sweep and rows — prove, revert, record).

## Group 2 — the four witness classes (round-5 claim 8's prescriptions, adopted)

1. **Multi-byte UTF-8 defects beyond the two-byte sweep.** Add to the suite: (a) an
   embedded-pair sweep — every byte pair wrapped as `[0x41, b1, b2, 0x41]` (65,536 buffers)
   with `decodeUTF8` compared against the fatal+ignoreBOM oracle; (b) a per-position
   mutation sweep — for the canonical encoding of each `UTF8_BOUNDARIES` code point,
   substitute every byte position through all 256 values and compare against the oracle.
   Both deterministic, both in the existing describe shapes.
2. **U+D7FF and U+E000** join `TEXT_CHARACTERS` (the surrogate-range outer boundaries), so
   TEXTS carries them everywhere it is driven.
3. **Longer refused measure texts.** Add a deterministic seeded mutant population (a
   written-out xorshift in setup, seeded constant — no `Math.random`): canonical §4/§5/hex
   encodings of prefixes up to ~24 bytes with one substitution, insertion, or truncation
   each, driven through every measure's law sweep against its decoder.
4. **The transcription circularity.** Add `WINDOWS_1252_INDEX` to `tests/setup.ts` — an
   INDEPENDENT hand transcription of the published CP1252 high-slot mapping (0x80-0x9F,
   the five undefined slots absent), written in the test tree, NOT copied from
   `src/core/constants.ts` — and a test comparing `WINDOWS_1252_HIGH` against it entry by
   entry, both key sets both directions. The oracle sweep stays; this kills the shared-
   error class the way `RFC_STANDARD` does for Base64.

## Group 3 — the fences

`guides/codec.md` `## Patterns` gains worked fences for the hex face, the charset faces,
and the measures (one fence per family is enough — your latitude on grouping; every value a
fence's comments claim must be true). `tests/guides.test.ts` gains the flagship-fence
transcriptions driving each new fence's claims, exactly the way the Base64 fences are
driven. This unit OWNS `tests/guides.test.ts` fully (unlike prior units) — extend the
transcription section; touch nothing else in it beyond the fence transcriptions and, if a
fence needs it, the INTERNAL list stays as is.

## Scope

Owned: `src/core/helpers.ts`, `tests/setup.ts`, `tests/src/core/helpers.test.ts`,
`tests/guides.test.ts`, `guides/codec.md`, `README.md` (surface row + family sentence).
Off-limits: everything else — `src/core/validators.ts` and `constants.ts` included (no new
guard: measures ship none; the src windows-1252 table is settled).

## Gates (exact tails)

format then format:check; lint:check; check; test:src; test:guides; test:policy;
test:config. All exit 0; counts move, report the new ones. Keep the suite's wall clock
sane: the two new sweeps are ~80k oracle comparisons — if test:src exceeds roughly 20s,
report the duration rather than trimming coverage.

## Deviation contract

Doctrine/surface conflicts and oracle contradictions stop the unit. Fence grouping, table
shapes, population sizes within the stated classes are yours — decide, record, continue.

## Output

Files changed; latitude decisions; mutation-control readings; gate tails (with test:src
duration); flags for audit.
