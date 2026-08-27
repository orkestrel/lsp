# codec wave-1 audit — reviewer lane verdict (Opus 5, executed probes), verbatim

1. Round-trip identity — CONFIRMED. Attack that failed: differential round-trip against a
from-spec oracle and Node's Buffer on the built dist — all 65,536 byte pairs, all 256 single
bytes, 16.7M-sampled triples, lengths 0-3, 20,000 random sequences up to length 40, a
100,000-byte buffer, a subarray view at offset 7, and a Uint8Array subclass. Encoders
byte-identical to Buffer on every random case. Empty round-trips both faces. 0 failures.

2. Canonical-form strictness — CONFIRMED. Attack that failed: exhaustive sweep of all
21,381,376 four-character texts over a 68-character set, each compared against an
independently written strict oracle and each admitted text re-encoded. Admitted §4 count =
16,843,008 = 64^4 + 64*64*16 + 64*4, the closed-form canonical population. Plus all length
1/2/3 texts; the one-pad class exhaustively — all 262,144 `XYZ=` texts, admitted iff
`LOOKUP[Z] & 0x03 === 0`; the two-pad class exhaustively; 800,000 random texts over a pool
including control and zero-width characters; 400,000 single-mutation texts reaching
padding-in-a-non-final-group and %4===1 residues. Lone surrogates and astral characters
refuse. Zero admitted-but-non-canonical, zero refused-but-canonical.

3. Iff law and guard totality — CONFIRMED. The iff comparison over all sweep and fuzz
populations; totality against Symbol, 10n, new String('aGk='), Object.create(null),
ArrayBuffer, a function, a Promise, a Proxy with throwing traps, and objects whose length/
charAt/toString/valueOf/Symbol.toPrimitive all throw. No throw, no true. Note: the iff law
holds BY CONSTRUCTION — see claim 6 for what that costs the suite.

4. Shipped-graph purity — CONFIRMED. Text scan of all four dist artifacts for atob, btoa,
Buffer, TextEncoder, TextDecoder, node:, @orkestrel/, bare require(, dynamic import( — zero
hits. One entry point; both conditions load standalone and answer all six exports;
encodeBase64 returns 'aGk=' through each.

5. §5-by-substitution — CONFIRMED. 'AQ-_' true / 'AQ+_' false, 'aGk=' false, 'AA' true vs
'AA==' false, 'aa' false vs 'aQ' true, '-'/'--'/'---' false and '----' true, '_w' true,
'AB' false (url one-pad unused bits), and the whole 21.4M sweep through decodeBase64URL
against the oracle. The pre-substitution refusal of +, /, = means + can only originate from
- and / only from _, so the accepted set is exactly canonical unpadded §5.

6. Instruments bind — BROKEN. Two independent defects, demonstrated with a probe run inside
--project src:core (deleted; tree clean).
(a) The unused-trailing-bit rule is 1-bit-bound out of 4 (two-pad) and 1-of-2 (one-pad).
Mutants `& 0x0e`, `& 0x0d`, `& 0x07` (line 73) and `& 0x02` (line 74) are indistinguishable
from the shipped decoder across every text the whole suite drives — SWEEP (14,641 texts),
all 19 MEMBERSHIP rows, 5 VECTORS, 64 alphabet-sweep texts both directions, every
single-byte and byte-pair round-trip, all 9 flagship fences. Probe: divergent and
divergentURL empty for all four mutants. Cause: a mask bit is witnessed only by a text whose
masked value is exactly that bit; available two-pad second-values isolate only 0x04 and
one-pad third-values only 0x02 (twoPadIsolated === [0x04], onePadIsolated === [0x02],
asserted). Real defects, not equivalent mutants: decodeMutant('AB==', 0x0e) returns [0]
against canonical 'AA=='; decodeMutant('AAB=', ..., 0x02) returns [0,0] against canonical
'AAA='; url mutant 'AB' likewise. The one control that does redden — 0x0f -> 0x0b — is the
instrument's single live bit of six. Smallest fix: add 'B' and 'h' to SWEEP_CHARACTERS, or
four MEMBERSHIP rows 'AB==', 'AI==', 'AC==', 'AAB=' all false on both faces.
(b) The iff sweep cannot fail. isBase64 IS `typeof === 'string' && decodeBase64 !==
undefined`, so the assertion reduces to X !== X — the probe shows the identical assertion
passing for a guard delegating to a decoder that accepts 'AQ ID'. tests.md names the shape
(never assert an implementation against itself); guides/codec.md:161 says the sweep "binds
each guard to its decoder", which the delegation does, not the sweep. The non-vacuous iff
evidence is entirely the 19 written-out MEMBERSHIP rows. Smallest fix: delete the sweep's
iff assertions and keep the rows, or assert guards against the re-encode oracle.
The report's two named controls are corroborated arithmetically and do bind (3 failed | 33
passed against a 36-test file, composition confirmed by collection; 1 failed | 21 passed
against 22). The RFC-transcription check does catch a swapped table entry in both
directions; the failure is in the pad-class masks and the iff sweep.

7. Guide true — CONFIRMED. Every behavioral sentence executed against the built dist: zero
runtime dependencies, pure-ES negative list, no error type/options/class/type (index.d.ts
declares six functions and export {}), the Surface table, the two laws, non-goals,
membership bar against the charter. The corrected canonical-neighbour sentence is right —
'aa==' reaches for 0x69 ((26<<2)|(26>>4) = 105) and re-encodes 'aQ=='; '0w==' is 0xd3,
unrelated. Both halves substring-pinned AND executed at tests/guides.test.ts:283-296. The
one inaccurate sentence is the Tests-section iff-sweep description, charged under claim 6.

8. Self-declared rulings — BROKEN (part b). (a) sound: the charter fixes the surface at six
and excludes constants; architecture.md:50 plus the guides suite's source.hidden() kill the
non-exported fallback; the INTERNAL list is load-bearing both directions; the one stretch
(intern clause written for classes) is forced by the charter. (c) sound: no duplicated walk,
no second table, no dead code; claims 2 and 5 show no §4 acceptance smuggled into §5.
(b) BROKEN: tests.md:184 is a flat universal — data tables belong in a setup file at any
size. VECTORS, MEMBERSHIP, FOREIGN, SWEEP_CHARACTERS, SWEEP, OCTETS, SEXTETS, RFC_STANDARD,
RFC_URL are declared in the test file. The ruling's justification is false on three counts:
(i) tests/setup.ts exists, is empty, and is already wired as setupFiles for src:core at
vite.config.ts:44; (ii) workspace.md:137 triggers the setup project/script only when a root
file matches tests/setup*.test.ts — inert data needs no such proof; (iii) tests/setup.ts is
neither in the brief's vendored list nor the policy sweep's population. Smallest fix: move
the nine declarations into tests/setup.ts, export, import.

9. Naming and shape — BROKEN. Naming clean: Base64URL per names.md:111,114; {verb}{Noun};
QUALIFIER_NOUN constants; no nested functions; TSDoc complete; types.ts correctly absent.
Centralization not clean: isBase64/isBase64URL are Guard<string> verbatim; patterns.md:115
gives that shape a sole home, validators.ts; architecture.md:16-24 lists Guards |
*/validators.ts and :67-70 draws the line exactly where these fall (isVacant stays in
helpers only because it is not a Guard<T>). Fleet: scaffold validators.ts isPath (identical
signature) vs scaffold helpers isDeferredPath/isCanonPath (string->boolean); guide, test,
probe, scaffold all carry validators.ts; codec is the outlier. architecture.md:138-140:
unreachable by the policy sweep, a review finding, not a red test — which is why it
survived every green gate. Smallest fix: src/core/validators.ts importing the decoders;
barrel export above helpers; guide names both files.

10. Coherent whole — BROKEN. npm pack --dry-run --ignore-scripts returns 9 files: LICENSE,
README.md (98 bytes), six dist files, package.json. README is the untouched scaffold
placeholder; files is ["dist/src", "README.md"], so guides/ does not ship; the npm page
would render four words of prose for a package whose value is a canonicity contract.
README.md was in scope (not in the brief's vendored list); the report does not mention it.
Smallest fix: replace with the guide's opening, surface table, laws, refusal example.
LICENSE and manifest correct. Throughput does NOT block acceptance — it is a release-note
item; the extraction wave produces the measurement; the charter already ruled the escape
hatch non-breaking.

Findings outside the claims:
1. constants.ts contradicts itself in twelve lines: header says the table is written out
rather than computed; TSDoc says "used to build" and "derived from"; no derivation exists.
Fix: "Transcribed against {@link BASE64_ALPHABET}; the alphabet sweep fails on any
single-entry disagreement."
2. decodeBase64 allocates its output before validating any character (helpers.ts:63) — an
isBase64(x) on a hostile length-4n string allocates 0.75*|x| bytes then refuses on the first
group. Graded low: bounded below the caller's own string; inefficiency at a wire boundary,
not amplification. Fix if wanted: hoist the allocation or size after a membership pre-pass.

Housekeeping: probe file tests/src/core/canonical.test.ts created, run (44 passed), deleted;
status 0 rows; HEAD 0524d8a; dist rebuilt once by pack before --ignore-scripts, verified
character-identical.

VERDICT: FAIL — 4 broken, 0 unresolved, 0 not-evidenced, 2 findings outside the claims

158,574 tokens, 46 tool uses, 857s.
