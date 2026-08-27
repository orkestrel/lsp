# codec-fix — returned report (builder, Sonnet) + Orchestrator closure

## Builder's return (condensed; all seven carriers exact, no deviation stop)

- F1: MEMBERSHIP rows `'AB=='`/`'AI=='`/`'AC=='`/`'AAB='` (standard and url false) beside
  the `'aa=='` rows; SWEEP_CHARACTERS gains `'B'`, `'h'`, `'*'` with the rationale comment.
- F2: the two vacuous `SWEEP.filter(...)` iff assertions deleted (with their empty `it`);
  the MEMBERSHIP loop is the iff evidence; guide Tests-section sentence corrected.
- F3: doors paragraph qualified per face — §4 doors named, §5's spelling stated (unpadded;
  `=`, `+`, `/`, residue-1 refused); parity-pinned sentences preserved character-for-character.
- F4: VECTORS, MEMBERSHIP, FOREIGN, SWEEP_CHARACTERS, SWEEP build, OCTETS, SEXTETS,
  RFC_STANDARD, RFC_URL moved to `tests/setup.ts` (exported, host-independent); test file
  imports them; registration stays in the test file.
- F5: `src/core/validators.ts` holds the guards (TSDoc moved, decoders imported from
  `./helpers.js`); barrel exports validators above helpers; guide Source line names both.
- F6: README replaced — charter opening, surface table, the two laws, the canonical-refusal
  fence, pointer at the guide.
- F7: constants TSDoc reworded to "transcribed against"; the header already made no
  derivation claim and was left as-is (recorded latitude).
- Latitude recorded: membership-row reason phrasing mirrors the carrier's parentheticals;
  the doors paragraph reordered so "That last refusal" still refers to the trailing-bit rule;
  README rendered without added section headers.
- Builder gates: format 29 files; format:check clean; lint:check clean; check clean;
  test:src 39; test:guides 22; test:policy 111; test:config 46 — all exit 0.
  222,555 tokens, 59 tool uses, 666s.

## Orchestrator mutation-probe closure (quality.md § Rounds and verdicts — prescriptions
adopted verbatim, so probes close the round in place of a fresh cross-engine audit)

| Mutation applied | test:src reading | Restored |
| --- | --- | --- |
| `(second & 0x0f)` -> `(second & 0x0e)` | `Tests 2 failed \| 37 passed (39)` | yes (exact edit reverted) |
| `(third & 0x03)` -> `(third & 0x02)` | `Tests 2 failed \| 37 passed (39)` | yes |
| `'*': 0` added to BASE64_LOOKUP | `Tests 1 failed \| 38 passed (39)` | yes |

Each pin fails exactly when its load-bearing line is disabled; the round-2 instrument
defects (mask-bit blindness, lookup pollution) are now witnessed. The vacuous iff assertions
are gone, so no test asserts the implementation against itself.

## Authoritative gates (Orchestrator, full chain, canon order)

format:check clean (29 files); lint:check clean; check clean; build green (dts 1189ms,
vite 1.27s); npm test — src 39, policy 111, config 46, guides 22, all passed;
test:distribution 9 passed against the packed tree (README and files changes proven in the
artifact). Working tree at commit time: only the seven carriers' files modified.

F8 (pre-validation allocation) remains recorded-no-fix per the reconciled verdict.
