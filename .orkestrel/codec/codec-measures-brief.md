# Unit: codec-measures — measureBase64URL and measureHex complete the measure family

Role and engine: implementer, Opus 5 (native). Writing unit in
`C:\Users\mikes\WebstormProjects\codec` (HEAD `7b715ba`, clean). Perform directly, spawn
nothing, commit nothing. Read `codec/AGENTS.md` pointers and `guides/codec.md` first —
settled doctrine, extend never relax. Mirror `measureBase64`'s idiom exactly.

## Surface additions (exactly these)

| Export | Signature | Law |
| --- | --- | --- |
| `measureBase64URL` | `(text: string) => number \| undefined` | `measureBase64URL(text) === decodeBase64URL(text)?.length` for EVERY string. Walks the §5 grammar (pre-substitution refusals, residues, unused bits) without allocating or delegating to the decoder. |
| `measureHex` | `(text: string) => number \| undefined` | `measureHex(text) === decodeHex(text)?.length` for EVERY string. Validates the full lowercase even-length grammar; the count is `length / 2` only after the walk admits. |

Both in `helpers.ts` under the Measures section, TSDoc naming the sound triple and the
no-output-allocation point (mirroring `measureBase64`'s).

## Tests (extend the measure describe + setup tables)

- Law sweeps: `measureBase64URL` against `decodeBase64URL` over SWEEP + MEMBERSHIP +
  MEASURES + octet-prefix url encodings; `measureHex` against `decodeHex` over HEX_SWEEP +
  HEX_MEMBERSHIP + octet-prefix hex encodings. Two independent walks each — not vacuous.
- Direct rows in MEASURES (extend the table with a face column or sibling tables — your
  latitude, record it): url `''`->0, `'aGk'`->2, `'AQID'`->3, `'aa'`->undefined,
  `'aGk='`->undefined; hex `''`->0, `'ab'`->1, `'abcd'`->2, `'AB'`->undefined,
  `'abc'`->undefined.
- Mutation controls (prove, revert, record counts): an off-by-one in each new measure
  reddens its law sweep and rows.

## Guide and README

`guides/codec.md`: two surface rows; the measure family section now names the three
members and the one law sentence covers them; the membership/later list drops the url/hex
measures. `README.md` surface table in sync.

## Scope

Owned: `src/core/helpers.ts`, `tests/setup.ts`, `tests/src/core/helpers.test.ts`,
`guides/codec.md`, `README.md`. Off-limits: everything else.

## Gates (exact tails)

format then format:check; lint:check; check; test:src; test:guides; test:policy;
test:config. All exit 0; counts move, report the new ones.

## Deviation contract

Doctrine/surface conflicts stop the unit; layout and phrasing in owned files are yours.

## Output

Files changed; latitude decisions; mutation-control readings; gate tails; flags for audit.
