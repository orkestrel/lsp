# Unit: codec-charsets — UTF-8, Latin-1, Windows-1252, and UTF-16LE enter codec

Role and engine: implementer, Opus 5 (native). Writing unit in
`C:\Users\mikes\WebstormProjects\codec` (baseline: the HEAD the dispatch message names,
clean). Perform directly, spawn nothing, commit nothing. Read `codec/AGENTS.md` pointers
and `guides/codec.md` first — settled doctrine, extend never relax. Pure ES in src remains
absolute: no `TextEncoder`/`TextDecoder`/`Buffer`/`node:*`. `String.prototype.isWellFormed`
IS ECMA-262 (ES2024) and may be used.

## Direction convention (settled)

`encode*` moves toward the coding's WIRE form, `decode*` toward its NATIVE form. For these
four codings the wire form is BYTES: `encode*(text) => bytes`, `decode*(bytes) => text` —
inverted from Base64, exactly as the charter's families section already states.

## Guard-side ruling (settled — state it in the guide's families section)

One `is*` guard per coding, attached to its PARTIAL direction: bytes-side
(`value is Uint8Array`, iff `decode*` defined) for UTF-8, Windows-1252, and UTF-16LE, whose
decoders can refuse; text-side (`value is string`, iff `encode*` defined) for Latin-1,
whose decoder is total. UTF-8's text side ships NO guard: `text.isWellFormed()` is the
platform's own sound partner for `encodeUTF8`, and wrapping it would be a superfluous
wrapper — the guide names it instead.

## Surface additions (exactly these twelve)

| Export | Signature | Law |
| --- | --- | --- |
| `encodeUTF8` | `(text: string) => Uint8Array<ArrayBuffer> \| undefined` | RFC 3629 shortest-form bytes; `undefined` exactly when the text is ill-formed (a lone surrogate). |
| `decodeUTF8` | `(bytes: Uint8Array) => string \| undefined` | Strict: refuses overlongs, encoded surrogates, code points past U+10FFFF, truncated sequences. A leading BOM is PRESERVED as U+FEFF — the round-trip law forces it; the platform decoder's default stripping is the documented divergence. |
| `isUTF8` | `(value: unknown) => value is Uint8Array` | iff `decodeUTF8` defined. |
| `encodeLatin1` | `(text: string) => Uint8Array<ArrayBuffer> \| undefined` | ISO-8859-1 identity (code unit = byte); `undefined` when any code unit exceeds 0xFF. |
| `decodeLatin1` | `(bytes: Uint8Array) => string` | TOTAL — every byte maps to U+0000-U+00FF; this coding's decode has no failure mode, and the guide says so. |
| `isLatin1` | `(value: unknown) => value is string` | iff `encodeLatin1` defined (the partial direction). |
| `encodeWindows1252` | `(text: string) => Uint8Array<ArrayBuffer> \| undefined` | Inverse of the decode mapping; `undefined` for any character outside the code page's image. |
| `decodeWindows1252` | `(bytes: Uint8Array) => string \| undefined` | Identity for 0x00-0x7F and 0xA0-0xFF; the written-out high table for 0x80-0x9F; the FIVE undefined slots (0x81, 0x8D, 0x8F, 0x90, 0x9D) refuse. |
| `isWindows1252` | `(value: unknown) => value is Uint8Array` | iff decode defined. |
| `encodeUTF16LE` | `(text: string) => Uint8Array<ArrayBuffer> \| undefined` | Little-endian code units; `undefined` when ill-formed (lone surrogate — `isWellFormed` may implement the check). |
| `decodeUTF16LE` | `(bytes: Uint8Array) => string \| undefined` | Refuses odd length and unpaired surrogates. A leading BOM (FF FE) is preserved as U+FEFF. |
| `isUTF16LE` | `(value: unknown) => value is Uint8Array` | iff decode defined. |

Both round-trip laws per coding over their admitted sets. Bijectivity claims the tests
must assert: Windows-1252's defined mapping is a bijection (no character reachable from
two bytes); Latin-1 is the identity bijection.

## Placement

Codings in `helpers.ts` (new section comments per coding family); guards in
`validators.ts`; `WINDOWS_1252_HIGH` written out in `constants.ts` (the 27 defined
high-slot entries; its TSDoc names the five absent slots as the refusal), INTERNAL-listed.
Specs named in TSDoc: RFC 3629/Unicode (UTF-8), ISO/IEC 8859-1 (Latin-1), the Windows-1252
code page with the WHATWG Encoding index as the transcription source (Windows-1252),
Unicode UTF-16LE.

## Test oracles — the traps, in order of how expensive they are to get wrong

- **NEVER use `TextDecoder('latin1')` as the Latin-1 oracle** — WHATWG's `latin1` label IS
  windows-1252. The ISO-8859-1 oracle is the identity: `String.fromCharCode(...bytes)`.
- The WHATWG windows-1252 index maps the five undefined slots to C1 controls
  (0x81 -> U+0081). Oracle `TextDecoder('windows-1252')` therefore agrees only on the 251
  defined bytes; assert the five refusals directly and state the divergence in the guide.
- `TextDecoder('utf-8', { fatal: true })` STRIPS a leading BOM unless `ignoreBOM: true` —
  the UTF-8 oracle is `new TextDecoder('utf-8', { fatal: true, ignoreBOM: true })`. Same
  for `'utf-16le'`.
- PROBE every oracle's actual behavior before trusting it (a throwaway assertion the
  platform must fail — e.g. the fatal decoder throwing on 0xC0 0x80 — run first, then the
  sweep). Where a platform oracle diverges from the strict coding, restrict it to the
  agreeing population and assert the divergent classes directly.

## Tests (extend the established shapes)

- Round-trip sweeps: all 256 single bytes through decodeLatin1/encode back; the 251
  defined windows-1252 bytes both directions plus the five refusals; UTF-8 over every
  code point boundary class (1/2/3/4-byte thresholds: U+0000, U+007F, U+0080, U+07FF,
  U+0800, U+FFFF, U+10000, U+10FFFF) and a well-formed string fuzz population (include
  astral pairs, U+FEFF mid-string and leading); UTF-16LE likewise with odd-length and
  unpaired-surrogate refusals (lead-only, trail-only, lead-then-BMP).
- Strict-refusal vectors, each pinned: overlongs (0xC0 0x80; 0xE0 0x80 0x80), encoded
  surrogates (0xED 0xA0 0x80), range (0xF4 0x90 0x80 0x80), truncations (0xE2 0x82),
  windows-1252 slots, utf-16 odd length.
- Platform-oracle sweeps over the agreeing populations, both directions.
- iff rows per guard; guard totality on hostile values (extend the existing describe).
- Mutation controls (prove, revert, record counts) — at least: admit one overlong; admit
  slot 0x81; accept odd UTF-16 length; encodeLatin1 accepting U+0100.

## Guide and README

Surface rows; a charset doors passage (per-coding refusals, the BOM stance, the three
WHATWG divergences named honestly); the guard-side ruling in the families section; the
membership/later lists updated — after this unit the later list holds only `measureUTF8`,
named as waiting on scaffold's convergence (its `bytesToHex`/UTF-8 counter). README table
in sync.

## Scope

Owned: `src/core/constants.ts`, `src/core/helpers.ts`, `src/core/validators.ts`,
`tests/setup.ts`, `tests/src/core/helpers.test.ts`, `tests/guides.test.ts` (INTERNAL list
only), `guides/codec.md`, `README.md`. Off-limits: everything else, `src/core/index.ts`
included (star-exports already carry helpers and validators — verify only).

## Gates (exact tails)

format then format:check; lint:check; check; test:src; test:guides; test:policy;
test:config. All exit 0; counts move, report the new ones.

## Deviation contract

Doctrine/surface conflicts and any oracle whose probed behavior contradicts this brief's
statement of it stop the unit (expected/found/evidence). Layout, phrasing, table shapes,
and walk style are yours — decide, record, continue.

## Output

Files changed; latitude decisions; oracle-probe findings; mutation-control readings; gate
tails; flags for audit.
