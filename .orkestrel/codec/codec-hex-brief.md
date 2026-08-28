# Unit: codec-hex — the hex coding and the measure family enter codec

Role and engine: implementer, Opus 5 (native). Writing unit in
`C:\Users\mikes\WebstormProjects\codec` (HEAD `887f9cb`, clean). You perform this assignment
directly and spawn nothing. You commit nothing.

Read `codec/AGENTS.md` and its scaffold canon pointers, then `guides/codec.md` in full —
the charter, the families, the two laws, and the membership bar are settled doctrine this
unit extends, never relaxes. Mirror the existing Base64 idiom exactly (constants table
written out, guards in validators.ts delegating to decoders, membership rows in
tests/setup.ts, TSDoc voice).

## Objective

Add the second coding and the first measure to `@orkestrel/codec`: `encodeHex`, `decodeHex`,
`isHex`, and `measureBase64` — with the same law discipline as wave 1, all gates green.

## The surface additions (exactly these, no more — no measureBase64URL, no measureHex)

| Export | Signature | Law |
| --- | --- | --- |
| `encodeHex` | `(bytes: Uint8Array) => string` | Base16 per RFC 4648 §8 with the LOWERCASE alphabet as the canonical spelling — two digits per byte. Total. |
| `decodeHex` | `(text: string) => Uint8Array<ArrayBuffer> \| undefined` | Accepts ONLY canonical lowercase even-length hex; uppercase, odd length, `0x` prefixes, whitespace, any foreign character — `undefined`. Never throws. |
| `isHex` | `(value: unknown) => value is string` | True iff `decodeHex` would answer defined. Total on any value. Lives in `validators.ts`. |
| `measureBase64` | `(text: string) => number \| undefined` | The sound triple: `measureBase64(text) === decodeBase64(text)?.length` for EVERY string — a validating walk that allocates nothing. Lives in `helpers.ts`. |

Both round-trip laws bind hex exactly as they bind Base64:
`decodeHex(encodeHex(bytes))` deep-equals `bytes` always; `encodeHex(decodeHex(text)) ===
text` for every text `isHex` admits (which is what refuses uppercase: `'AB'` re-encodes as
`'ab'`, so admitting it would break the law — same argument as `'aa=='`).

**The case ruling, stated in the guide honestly:** RFC 4648 §8's table spells the alphabet
uppercase; this package's canonical spelling is lowercase, declared as a deliberate
departure matching every fleet producer (scaffold `bytesToHex`, mcp digest hex, Node's
`digest('hex')`, msg `toHexLower`). One canonical spelling per input is the charter's law;
lowercase is the one the fleet already speaks.

**`measureBase64` implementation law:** it walks the full §4 grammar (length residue,
padding placement, alphabet membership, unused trailing bits) WITHOUT allocating the output
— that is its reason to exist. It must not delegate to `decodeBase64` (a measure that
decodes has measured nothing); the law test binds the two independent walks against each
other. Its TSDoc names the law and the no-allocation point.

## Implementation constraints

- `src/core/constants.ts`: `HEX_ALPHABET` (`'0123456789abcdef'`) and a written-out
  `HEX_LOOKUP` (16 lowercase entries), same idiom and TSDoc voice as the Base64 pair;
  both INTERNAL (out of the barrel, added to the guides suite's INTERNAL list).
- `src/core/helpers.ts`: `encodeHex`, `decodeHex`, `measureBase64` beside the Base64
  functions, same section-comment style. `src/core/validators.ts`: `isHex` delegating to
  `decodeHex`. Barrel already exports both files via `export *` — verify, do not duplicate.
- Pure ES throughout; no regex required (table walks preferred, and the iff law binds any
  alternative to its decoder).
- TSDoc every export: summary, @remarks naming the RFC section, the canonical-form law, the
  lowercase departure (hex), the sound triple (measure), @param/@returns/@example.

## Tests (extend tests/setup.ts tables + tests/src/core/helpers.test.ts, same shapes)

- Hex law sweeps: all 256 single bytes and all 65,536 byte pairs round-trip; empty both
  directions; the independent oracle — compare `encodeHex` against a test-local
  `byte.toString(16).padStart(2, '0')` construction over all 256 bytes (spec-vs-table, both
  directions: also `decodeHex` of that oracle's output).
- Hex membership rows (each pinning `is`/`decode` agreement): `'ab'` -> `[0xab]`; `''` ->
  `[]`; `'AB'` false (uppercase); `'aB'` false; `'abc'` false (odd); `'0xab'` false;
  `'a b'` false; `'ab\n'` false; `'g0'` false (foreign); non-strings to `isHex` false.
- Measure law sweep: for EVERY text in the existing SWEEP population plus every Base64
  membership-row text, `measureBase64(text) === decodeBase64(text)?.length` — this is NOT
  vacuous: two independent walks. Plus direct rows: `''` -> 0, `'aGk='` -> 2, `'AQID'` ->
  3, `'aa=='` -> undefined, `'A'` -> undefined.
- Mutation controls (prove, revert, record the counts): drop the uppercase refusal from
  `decodeHex`'s table (add an uppercase entry) -> the suite reddens; break `measureBase64`'s
  padding arithmetic (off-by-one) -> the law sweep reddens.

## Guide and README

`guides/codec.md`: the four surface rows; the hex doors paragraph beside the Base64 one
(with the lowercase departure stated); the `measure*` family added to the families section
with its law (the websocket `measureWebSocketFrame` precedent may be named); the Membership
section updates — hex moves from later to shipped, `measureBase64` likewise, and the later
list shrinks accordingly; the Tests section rows for the new sweeps. `README.md`: surface
table and laws kept in sync (same content discipline as wave 1). `guides/README.md` only if
a row there names the surface — check.

## Scope

Owned: `src/core/constants.ts`, `src/core/helpers.ts`, `src/core/validators.ts`,
`src/core/index.ts` (verify only), `tests/setup.ts`, `tests/src/core/helpers.test.ts`,
`tests/guides.test.ts` (INTERNAL list only), `guides/codec.md`, `guides/README.md`,
`README.md`. Off-limits: `package.json`, lockfile, every vendored file, everything outside
the codec checkout.

## Gates (report exact tails)

`npm run format` then `format:check`; `lint:check`; `check`; `test:src`; `test:guides`;
`test:policy`; `test:config`. All exit 0. Counts will move — report the new ones.

## Deviation contract

A conflict with the charter, the laws, or the stated surface stops the unit (expected/
found/evidence, one hypothesis). Phrasing, row ordering, and table layout inside the owned
files are yours — decide, record, continue.

## Output

Final message: files changed; the shapes chosen in latitude; the mutation-control readings
(red counts, then restored green); every gate tail; claims flagged for audit.
