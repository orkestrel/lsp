# codec wave-1 audit — round 2 reconciled verdict

Lanes: reviewer (Opus 5, native, executed probes — told its engine wrote the subject) and
objective (Cursor Grok substituting for user-excluded Sol, read-only, Orchestrator-executed
evidence supplied). Both blind, one brief (`codec-audit-brief.md`, retained beside this
file). Subject: codec commit `0524d8a`. Both lane reports retained verbatim beside this file;
blind reports immutable.

## Per-claim reconciliation

1-5 (round-trip, canonical strictness, iff+totality, dist purity, §5 composition):
CONFIRMED by both lanes under real named attacks — reviewer exhaustively (21.4M-text sweep
with closed-form population check 16,843,008 = 64^4 + 64*64*16 + 64*4; the one-pad class
exhaustive; subarray views and Uint8Array subclasses; both dist conditions loaded standalone).
The SUBSTANCE of the codec is right.

6 (instruments bind): BROKEN — reviewer demonstrated, objective's UNRESOLVED settled by the
reviewer's executed evidence and collection arithmetic (which also corroborated the writer's
two mutation-control counts, closing the objective lane's settle-run). Defects: (a) the
unused-bit masks are 1-bit-witnessed — mutants `& 0x0e`/`& 0x0d`/`& 0x07` (two-pad) and
`& 0x02` (one-pad) survive the ENTIRE suite because SWEEP_CHARACTERS isolates only 0x04 and
0x02 (Orchestrator re-derived the witness math independently); (b) the iff sweep is vacuous
by construction — the guard IS `typeof === 'string' && decode !== undefined`, so the
assertion reduces to X !== X (tests.md names the shape: never assert an implementation
against itself); (c) objective's lookup-pollution evasion (`'*': 0`) is the same
witness-absence class — no foreign character in the sweep population.

7 (guide true): objective BROKEN, reviewer CONFIRMED — different objects, not a tie. The
doors sentence (guides/codec.md:49-51) states missing/excess padding and off-boundary length
as doors "the canonical-form law rules out" with no face qualifier; url `'aGk'` (length 3,
unpadded) is legitimately defined. Orchestrator reproduced by reading. The reviewer executed
value-level sentences; the objective lane read the universal. BROKEN stands, fix is a
qualifier. (The Tests-section sentence claiming the sweep "binds each guard to its decoder"
is false per 6b and is charged there.)

8 (self-declared rulings): (a) constants placement SOUND (both lanes; architecture.md's
sweep-scope text and the charter's no-constants surface force it); (c) single-alphabet
deviation SOUND (both lanes; exhaustive composition evidence). (b) BROKEN (both lanes,
independently, same fix): tests.md:184 is a flat universal — data tables belong in a setup
file at any size; tests/setup.ts exists EMPTY and is already wired as setupFiles in every
project; the writer's stated cost (new project/script/proof) was refuted on three checkable
counts. Recorded: the writer's ruling traded a named rule for a cost that does not exist.

9 (naming and shape): BROKEN (both lanes, same fix): isBase64/isBase64URL are Guard<string>
verbatim; patterns.md:115 and architecture.md's kind table give that shape one home,
src/core/validators.ts; fleet parallels scaffold/mcp/guide/test/probe all carry the split.
Naming itself (Base64URL, {verb}{Noun}, TSDoc, absent types.ts) held on both lanes.

10 (coherent whole): BROKEN (both lanes, same finding): README.md is the 98-byte scaffold
stub, ships in the tarball as the stranger's front door, guides/ does not ship; the package's
value is a canonicity contract the npm page would render in four words. Throughput ruled a
non-blocker by both lanes (release-note item; the extraction wave produces the measurement).

Outside the claims (reviewer, both substantiated): (i) constants.ts header says the table is
written out, its TSDoc says "used to build"/"derived from" — no derivation exists; (ii)
decodeBase64 allocates output before validating (bounded below the caller's own string).

## Rulings

Fix carriers F1-F7, one builder unit (all prescriptions adopted verbatim from the lanes, so
the round closes with Orchestrator mutation probes per quality.md § Rounds and verdicts,
not a fresh cross-engine round):

- F1 (6a+6c): MEMBERSHIP rows `'AB=='`, `'AI=='`, `'AC=='`, `'AAB='` (standard and url both
  false); SWEEP_CHARACTERS gains `'B'`, `'h'`, `'*'` (mask-bit witnesses both pad classes +
  a foreign character against lookup pollution).
- F2 (6b): delete the two vacuous iff filter assertions; MEMBERSHIP rows are the iff
  evidence; correct the guide's Tests-section sentence.
- F3 (7): qualify the doors sentence per face; state §5's spelling (unpadded; `=`, `+`, `/`,
  and residue-1 refused).
- F4 (8b): move the data tables into tests/setup.ts (host-independent), export, import.
- F5 (9): src/core/validators.ts holds the two guards importing the decoders; barrel gains
  `export * from './validators.js'`; guide Source line names both files.
- F6 (10): README.md replaced with the guide's opening, the surface table, the two laws, and
  the canonical-refusal example.
- F7 (outside-i): constants prose reworded — transcribed against the alphabet, pinned by the
  alphabet sweep; no derivation claim.
- F8 (outside-ii): recorded, NO fix unit — the allocation is bounded below the caller's own
  input (inefficiency at a wire boundary, not amplification); revisit only if the extraction
  wave's real-payload measurement flags it. Bounded on the record: everything adjacent to
  this (validation order, refusal completeness) is CONFIRMED.

What is NOT broken, on the record: the codec algebra itself — every law claim (1-5) was
exhaustively attacked and held; the writer's two instrument controls were real and their
counts exact; the naming, the deviation ruling, and the constants ruling stood.

Terminal: round 2 = FAIL (4 broken reconciled, 0 unresolved after settlement, 2 outside
findings, both carried or ruled). Fix round follows with mutation-probe closure.
