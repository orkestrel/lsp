# codec measures + charsets + convergence — round 5 record

## Unit A — measures (implementer, Opus 5; 150,659 tok, 56 uses, 548s)

measureBase64URL carries the §5 substitution over measureBase64 exactly as the decoder
carries it (own alphabet refusal + residue padding, landing on a measure, never a decoder);
measureHex counts length/2 only after the full walk admits. MEASURES gained a per-face
column pair (one text asks both faces in opposite directions: 'aGk=' is 2 on §4, refused on
§5); HEX_MEASURES sibling table; populations in setup per the data-table rule. Mutation
controls: url padding arithmetic -> 3 failed | 68 passed; hex off-by-one -> 5 failed | 66;
restored 71 green (was 62). Flag: the §5 measure's marginal coverage is the substitution
prefix — held as its own copy by doctrine, mutation-proven non-vacuous.

## Unit B — charsets (implementer, Opus 5; 287,684 tok, 118 uses, 1556s)

Twelve exports: UTF-8 / Latin-1 / Windows-1252 / UTF-16LE, strict two-direction codings,
one guard each on the partial direction (bytes-side for the three refusable decoders,
text-side for Latin-1). WINDOWS_1252_HIGH written out (27 entries; the five absent slots
ARE the refusal). BOM preserved on both Unicode faces. test:src 71 -> 143.
Oracle-probe findings beyond the brief: fatal windows-1252 does NOT refuse the undefined
slots (C1 best-fit survives the flag); only a LEADING BOM strips; TextEncoder writes
EF BF BD for a lone surrogate; and instanceof Uint8Array THROWS on a revoked proxy — every
bytes-side guard gates through ArrayBuffer.isView first (a proxy wrapping a real view is
refused deliberately: its length trap could walk a decoder past the bytes). Mutation
controls: overlong 3, slot-0x81 5, odd-length 3, U+0100 3 — each restored green. Flags:
the dispatch brief mis-stated the families baseline (generalized rather than stopped);
the windows-1252 table transcribed from the oracle then cross-read; Patterns still Base64
fences only; scaffold computeBytes counts replacement bytes where encodeUTF8 refuses
(the measureUTF8 divergence, read from installed scaffold 0.0.58).

## Orchestrator probe (established)

Built-dist differential: 20,000 UTF-8 rounds (TextEncoder-identical, fatal+ignoreBOM-equal,
round-trip); 256 Latin-1 identities (identity oracle, never the latin1 label); 256
windows-1252 bytes (251 vs platform, 5 direct refusals, encode inverting); 8,000 UTF-16LE
rounds; strict-refusal classes; BOM vector; 120,000 measure-law texts; hostile guards
including a revoked proxy — zero failures, 3/3 controls tripped.

## Audit (Cursor Grok objective, non-writer; verbatim log retained beside this file)

1-8 CONFIRMED under named attacks: lone-continuation/0xF5-0xFF leads read against the width
table; the CIRCULARITY attack failed — WINDOWS_1252_HIGH matches the published
Microsoft/Unicode mapping independently of the WHATWG oracle; the isView gate verified as
the only total shape (no fleet src constructs a Uint8Array proxy); the §5 measure
composition ruled inside the guide's own sentences ("cannot ask" means cannot ask a
DECODER); the families generalization confirmed correct. 9 BROKEN: package.json still
universalized "total ... in both directions" and its keywords stopped at Base64 — the
retired universal living on in the manifest. Residual unwitnessed classes named for the
successor: 3/4-byte UTF-8 defects outside the named refusals beyond the two-byte sweep;
U+D7FF/U+E000 absent from TEXTS; measure texts past length 4 that are not octet-prefix
encodings; a shared transcription error between table and oracle.
Terminal: FAIL — 1 broken, 0 unresolved, 0 not-evidenced, 0 outside.

## Closure

The manifest fix adopted verbatim (description names the shipped families, "total"
retired, keywords complete) — commit 69173c6, full chain + distribution green (143/111/46/
22 + 9). Repack installed in server (c9d08cd lockfile-only, 238 green) and mcp.

## Unit C — mcp sentinel UTF-8 convergence (implementer, Opus 5; 125,306 tok, 55 uses, 504s)

Failing proof first: decodeSentinel(encodeSentinel('﻿x')) returned 'x' (BOM stripped
by the fatal TextDecoder) — exact red retained — then 'x' -> '﻿x' green after
`return decodeUTF8(bytes)` replaced the decoder and its containment. Encode side stays
TextEncoder by recorded ruling (replacement spelling is mcp policy; encodeUTF8's refusal
would widen the return). src/core now carries ZERO TextDecoder uses (browser/server
streaming faces untouched, correctly non-fatal). Guide updated; equivalence spot-checks
(/w== refuses at UTF-8, QQ== admits) unchanged. One full-suite flake on the unit's first
run (uncaptured name, exit 0 anomaly, two clean re-runs); the Orchestrator's authoritative
post-exit chain ran green: 1332/111/46/86/149/47/4. mcp commit 146f235.

## Standing after round 5

codec 69173c6: 22 exports, three byte<->text codings + url variant, four charsets, five
guards, three measures. LATER list: measureUTF8 only (waits on scaffold convergence; the
computeBytes divergence is recorded). Consumers on the refreshed tarball: server c9d08cd,
mcp 146f235. Successor rows: the four unwitnessed classes from claim 8; Patterns fences
for the charset faces (owns tests/guides.test.ts); encodeWindows1252's linear scan stands
by the single-constant rule.
