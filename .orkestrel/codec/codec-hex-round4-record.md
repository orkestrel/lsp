# codec hex + measure — round 4 record (implementation, audit, closure)

## Implementer report (Opus 5; condensed faithfully, all substance kept)

Files: constants.ts (+HEX_ALPHABET, written-out HEX_LOOKUP, lowercase-only — the missing
uppercase entries are what refuse 'AB'); helpers.ts (+encodeHex, +decodeHex, +measureBase64
under a Measures section); validators.ts (+isHex delegating); index.ts verified unchanged;
tests/setup.ts (+HEX_OCTETS oracle from toString(16).padStart, +HEX_MEMBERSHIP with
bytes-or-undefined rows, +HEX_SWEEP, +MEASURES); helpers.test.ts (hex sweeps, oracle both
directions, iff rows, measure-law describe, isHex in guard totality); guides.test.ts
(INTERNAL +2); guides/codec.md + README.md (surface rows, sound-triple law, hex doors with
the lowercase ruling, measure family, membership/non-goals, Tests rows). Latitude: separate
HEX_MEMBERSHIP table (hex rows owe bytes, not just admission); honest refusal reasons
('a b' dies on odd length before any lookup); the shipped Base64 surface-table rows had
unescaped pipes splitting them five-column against a four-column header — repaired; msg
producer claim REMOVED from the guide (no checkout to verify — only first-hand-read
producers named); no hex guide fences (TSDoc @example satisfies parity; flagged).
Mutation controls: uppercase lookup entries -> 4 failed | 58 passed; measure off-by-one ->
5 failed | 57 passed; reverts diff-verified. Gates: format 29 files, format:check clean,
lint:check clean, check clean, test:src 62, test:guides 22, test:policy 111, test:config
46. Flags: measure "independence" is provenance not shape (shared grammar structure — a
defect written identically into both walks would pass); no-allocation claim scoped to the
output buffer; the pipe repair touched wave-1 rows. 171,377 tokens, 75 tool uses, 681s.

## Orchestrator probe (established for the audit)

Built-dist differential: 20,000 hex encode/round-trip rounds byte-identical to Buffer;
full two-character canonical sweep over a 35-char pool with iff + re-encode laws; 120,000
measure-law texts (canonical + substitution/insertion/truncation mutants) all satisfying
the sound triple; zero failures; seeded controls (measure off-by-one, case-folding hex
via Buffer) both tripped.

## Audit (Cursor Grok objective, non-writer lane; verbatim log retained beside this file)

1 hex canonical CONFIRMED (attacks: Arabic-Indic digits, 0x, mixed case, odd, empty).
2 measure triple CONFIRMED (attacks: non-final '=' lookups, entailed last-group skips,
shared-mask drift is caught by MEMBERSHIP rows inside SWEEP). 3 doctrine CONFIRMED.
4 tests-bind BROKEN: hex round-trips witnessed byte lengths 0-2 only — a length>=3 defect
(separator, tail truncation) shipped green. 5 guide BROKEN: the laws paragraph claimed the
measure runs the canonical-form sweep population (it runs SWEEP+MEMBERSHIP+MEASURES+octet
prefixes, and no finite sweep reddens on "every text"); the Tests bullet lumped §8 into
the one-buffer/padding-residue list it did not run. 6 coherent CONFIRMED (one-member
measure family is the creation gate; no dead data; dist/README/guide in sync).
Terminal: FAIL — 2 broken, 0 unresolved, 0 not-evidenced, 0 outside.

## Closure (prescriptions adopted verbatim; quality.md mutation-probe rule)

Fix 4: decodeHex(encodeHex(OCTETS)) added to the whole-buffer test; hex added to the
residue-prefix loop. Proven: a seeded encodeHex truncation (slice(0,2)) reddened exactly
2 tests — the previously unwitnessable class; restored, diff-verified. Fix 5: both guide
sentences corrected to name their real populations. Full chain green after closure:
format:check, check, test:src 62, test:guides 22, test:policy 111, test:config 46, build.
Codec commit 7b715ba. Repack installed in server (3fddde8, lockfile-only, 238 green) and
mcp; mcp digestJSON converged onto encodeHex (dfe52c6, output byte-identical, full mcp
chain green: 1331/111/46/86/149/47/4). Hex has its first real consumer.
