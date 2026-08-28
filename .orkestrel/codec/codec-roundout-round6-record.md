# codec round-out — round 6 record (the final pre-release round)

## Implementer report (Opus 5; 262,979 tok, 97 uses, 1253s; condensed faithfully)

measureUTF8 beside the other measures — encode-side triple, isWellFormed then a charCodeAt
width walk, no allocation, no encoder delegation; the measures block comment generalized to
the byte-side size question with the direction inversion spelled. Witness classes:
embedded-pair sweep (every byte pair wrapped 41 b1 b2 41 vs the fatal+ignoreBOM oracle);
per-position mutation sweep over UTF8_BOUNDARIES encodings (every position through all 256
values); U+D7FF/U+E000 into TEXT_CHARACTERS AND UTF8_BOUNDARIES (beyond the brief — gives
the mutation sweep reach into the encoded-surrogate band from a canonical neighbour);
MEASURE_MUTANTS (xorshift32 seed 0x1252c0de, 466 deduplicated texts to length 49, admitted
and refused on every face, driven through every measure's law sweep); WINDOWS_1252_INDEX —
character-valued, Unicode-named, test-tree independent transcription compared both
directions against the source table. Fences: hex / charsets / measures in Patterns, every
line transcribed and driven in tests/guides.test.ts. Latitude: mutants drive every face
(the triple holds over every string); the fixed-width-charset claim got an executed
assertion. Flags, all ruled sound by the audit: package.json keyword reorder was
pre-existing format dirt at HEAD (verified by stash); setup.ts imports @src/core encoders
for population construction (not an oracle; loads src into every project — all green); the
test file reads WINDOWS_1252_HIGH by relative path (deliberately off the barrel).
Mutation controls: measureUTF8 width defect 3 failed/154; decodeUTF8 surrogate refusal
removed reddens the NEW per-position sweep; continuation check removed reddens the NEW
embedded-pair sweep — the added sweeps are live instruments, not grown populations.
Gates: 157 src (1.96s with ~73k new oracle comparisons) / 25 guides / 111 policy /
46 config, format/lint/check clean.

## Orchestrator probe (established)

30,000-round measureUTF8 law probe on the built dist vs isWellFormed+TextEncoder, widths
1-4 with U+D7FF/U+E000/BOM/astral and lone surrogates injected both positions — zero
failures, off-by-one control tripped.

## Audit (Cursor Grok objective, non-writer; verbatim log beside this file)

1 BROKEN: README lacked the computeBytes divergence sentence (present in TSDoc and guide) —
smallest fix, copy it beside the sound-triple paragraph. The substance held: the probe, the
walk, and the ruling that isWellFormed is ECMA-262, not forbidden delegation.
2 CONFIRMED: CESU-8 and wrapped-overlong attacks ruled INSIDE the new sweeps' reach; the
index transcription verified independent both directions with the length pin.
3 CONFIRMED: every fence line matches the barrel; all three flagged consequences sound.
4 CONFIRMED: 23 exports coherent, dist/guide/README in sync, no dead data.
Terminal: FAIL — 1 broken, 0 unresolved, 0 not-evidenced, 0 outside.

## Closure

The README sentence adopted verbatim; guides 25 / full chain / distribution 9 green; codec
commit d728574; tarball repacked and refreshed in server (0f89ed5, 238 green) and mcp
(ef32daa, 882 core green). The codec's successor list is EMPTY: every LATER shipped, every
witness class closed, every fence driven. What remains lives in other repos by design —
scaffold converging computeBytes/bytesToHex/hex-decode onto codec is a scaffold-repo
release decision.
