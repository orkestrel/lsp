# Unit: codec-fix — round-2 carriers F1-F7

Role and engine: builder (native, fully specified mechanical unit). Writing unit in
`C:\Users\mikes\WebstormProjects\codec` (HEAD `0524d8a`, clean). You perform this assignment
directly and spawn nothing. You commit nothing. Every fix below adopts an audit lane's
prescription verbatim — implement exactly what each carrier states, nothing more. The
reconciled verdict behind them: `C:\Users\mikes\WebstormProjects\lsp\.orkestrel\codec\codec-audit-verdict.md`
(context only; the carriers below are the complete instruction).

## F1 — mask-bit witnesses (tests/src/core/helpers.test.ts)

Add to the MEMBERSHIP table four rows, each `standard: false, url: false`, reasons in the
table's existing voice: `'AB=='` (two-pad unused bit 0x01), `'AI=='` (0x08), `'AC=='`
(0x02), `'AAB='` (one-pad unused bit 0x01). Extend SWEEP_CHARACTERS with `'B'`, `'h'`,
`'*'` — comment: B and h witness the low and high unused-bit positions in both pad classes;
`*` is a character neither alphabet holds, so lookup pollution fails the canonical sweep.

## F2 — vacuous iff assertions (tests/src/core/helpers.test.ts + guides/codec.md)

Delete the two `SWEEP.filter(...)` assertions in the "iff law" describe (the ones comparing
`is*(text)` against `decode*(text) !== undefined` — the guard IS that expression, so they
cannot fail). Keep the MEMBERSHIP-row loop; it is the iff evidence. In `guides/codec.md`,
correct the Tests-section sentence that says the sweep "binds each guard to its decoder" —
the binding evidence is the written-out membership rows; say that instead.

## F3 — the doors sentence (guides/codec.md:49-51)

The canonical-form-law paragraph lists doors with no face qualifier while the url face
legitimately admits `'aGk'`. Qualify: missing/excess padding and off-boundary length are the
§4 doors; state §5's spelling beside it — unpadded url alphabet, refusing `=`, `+`, `/`, and
`length % 4 === 1` residues. Keep the paragraph's voice; the `'aa=='`/`'aQ=='` example
stays.

## F4 — data tables to setup (tests/setup.ts + tests/src/core/helpers.test.ts)

Move VECTORS, MEMBERSHIP, FOREIGN, SWEEP_CHARACTERS, the SWEEP_TEXTS build + SWEEP, OCTETS,
SEXTETS, RFC_STANDARD, RFC_URL from `tests/src/core/helpers.test.ts` into `tests/setup.ts`
(exists, empty, already wired as setupFiles). Export each; import them in the test file.
tests/setup.ts stays host-independent (no node:*, DOM, window). Move the tables verbatim
(with F1's additions applied); registration (describe/it) stays in the test file.

## F5 — guards to validators (src/core/validators.ts + index.ts + guides/codec.md)

Create `src/core/validators.ts` holding `isBase64` and `isBase64URL` exactly as they are,
importing `decodeBase64`/`decodeBase64URL` from `./helpers.js`; move their TSDoc with them.
Remove both from `helpers.ts`. In `src/core/index.ts` add `export * from './validators.js'`
above the helpers row. In `guides/codec.md`, the Source line names both files
(`src/core/helpers.ts` for the codings, `src/core/validators.ts` for the guards).

## F6 — README.md

Replace the scaffold stub with, in order: the H1; the guide's opening charter paragraph
(copy from `guides/codec.md`, adjusted only as prose requires); the six-row Surface table;
the two laws as stated in the guide; the canonical-refusal example fence
(`'aa=='`/`'aQ=='`); a closing line pointing at `guides/codec.md` in the repository for the
membership bar and doctrine. Fences import from `@orkestrel/codec`.

## F7 — constants prose (src/core/constants.ts)

The header comment keeps its placement rationale but drops any derivation claim; both TSDoc
sentences reworded: the alphabet row — "The RFC 4648 §4 alphabet, index-ordered; {@link
BASE64_LOOKUP} is transcribed against it."; the lookup row — "Base64 character to 6-bit
value lookup, transcribed against {@link BASE64_ALPHABET}; the alphabet sweep in
tests/src/core/helpers.test.ts fails on any single-entry disagreement." No "used to build",
no "derived from".

## Scope

Owned: `tests/src/core/helpers.test.ts`, `tests/setup.ts`, `guides/codec.md`,
`src/core/helpers.ts`, `src/core/validators.ts` (new), `src/core/index.ts`,
`src/core/constants.ts`, `README.md`. Off-limits: everything else — package.json included
(no script changes are needed), every vendored file, every path outside the codec checkout.

## Gates (run in the codec repo; report exact tails)

`npm run format` then `format:check`; `lint:check`; `check`; `test:src`; `test:guides`;
`test:policy`; `test:config`. All exit 0. Expect test counts to MOVE (rows added, vacuous
assertions removed, a new source file) — report the new counts; do not chase the old ones.

## Deviation contract

Any carrier that cannot be implemented exactly as written stops the unit: report
expected/found/evidence. Formatting and phrasing inside a carrier's stated voice are yours.

## Output

Final message: per-carrier confirmation with file paths; the new test counts; every gate
tail; anything you had to decide inside a carrier's latitude.
