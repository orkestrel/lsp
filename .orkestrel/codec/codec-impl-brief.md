# Unit: codec-impl — wave 1 of @orkestrel/codec

Role and engine: implementer, Opus 5 (native). Writing unit. You perform this assignment
directly and spawn nothing. You commit nothing — the Orchestrator commits with your report.

## Objective

Implement wave 1 of `@orkestrel/codec` in `C:\Users\mikes\WebstormProjects\codec`: the six
exports, their tests, the guide, and the guides-parity wiring — all gates green.

## Context

The workspace was scaffolded at commit eb4938a (`scaffold new codec --src core`, scaffold
0.0.58): manifest, toolchain, vendored policy suite, empty `src/core/index.ts`, seeded
`tests/src/core/index.test.ts`, `tests/policy.test.ts` + `tests/config.test.ts` +
`tests/distribution.test.ts`, guides mirrors (README/guide/scaffold), AGENTS.md pointer.
`npm install` has run. Read `codec/AGENTS.md` first and follow its pointers: the coding
contract and rules live in the scaffold checkout beside these repos
(`../scaffold/AGENTS.md`, `../scaffold/.claude/rules/`). The vendored policy suite
(`tests/policy.test.ts`) enforces the contract mechanically — run it early.

Fleet templates to read before writing (match their idiom exactly):
- `C:\Users\mikes\WebstormProjects\process` — the guides-parity wiring: `tests/guides.test.ts`,
  the `guides` project in `vite.config.ts`, the `test:guides` script and its place in the
  `test` chain, and `guides/README.md` row shape.
- `C:\Users\mikes\WebstormProjects\browser\src\core\constants.ts` (lines 1-30) and
  `helpers.ts` (100-160) — the table-codec idiom, including the policy-driven rule that a
  lookup table is WRITTEN OUT at module scope rather than computed (module-scope computation
  is rejected by the policy sweep).
- `C:\Users\mikes\WebstormProjects\server\src\server\helpers.ts` (the Base64 region, ~425-510)
  — TSDoc voice for codec functions (@remarks naming the RFC, @param/@returns).

## The charter (the guide's opening — write it in this voice)

Codec — the fleet's byte<->text codings. A coding is a spec-named, stateless mapping with one
canonical spelling per input — RFC 4648 Base64 and base64url today — written as an `encode*`
that produces only the canonical form, a `decode*` that accepts exactly that form and answers
`undefined` for everything else, and an `is*` guard that names the exact set its decoder
accepts. Every function is pure ES over `string` and `Uint8Array`: no `atob`/`btoa`/`Buffer`/
`TextEncoder`/`TextDecoder`/`node:*`, no dependency on another `@orkestrel` package. Totality
is implemented rather than caught: codec ships no error type, no options bag, no class, no
type of its own. It is not a formats package — it does not compress, frame a stream, escape a
document, map values into a store, or read JSON.

## The surface (exactly these six, no more)

| Export | Signature | Law |
| --- | --- | --- |
| `encodeBase64` | `(bytes: Uint8Array) => string` | RFC 4648 §4: standard alphabet, padded, canonical. Total — cannot fail. |
| `decodeBase64` | `(text: string) => Uint8Array \| undefined` | Accepts ONLY the canonical §4 form; `undefined` otherwise. Never throws. |
| `isBase64` | `(value: unknown) => value is string` | True iff `decodeBase64` would answer defined. Total on any value. |
| `encodeBase64URL` | `(bytes: Uint8Array) => string` | RFC 4648 §5: url alphabet (`-`,`_`), UNPADDED, canonical. Total. |
| `decodeBase64URL` | `(text: string) => Uint8Array \| undefined` | Accepts ONLY canonical unpadded §5 — a padded input, `+`, or `/` is `undefined`. Never throws. |
| `isBase64URL` | `(value: unknown) => value is string` | True iff `decodeBase64URL` would answer defined. Total. |

The two laws, which the tests must pin as laws (sweeps, not just spot vectors):

1. `decode*(encode*(bytes))` deep-equals `bytes` for every byte sequence (empty included).
2. `encode*(decode*(text))` === `text` for every text the guard admits.

Law 2 forces CANONICAL-FORM decoding: reject wrong alphabet, whitespace, wrong padding,
`length % 4 === 1` residue classes, AND non-zero unused trailing bits — `'aa=='` re-encodes
as `'0w=='`, so `decodeBase64('aa==')` is `undefined` and `isBase64('aa==')` is false. Same
for the url face (`'aa'` vs canonical `'0w'`). Guards and decoders are one grammar: implement
the membership check and the decode as one pass or two exactly-agreeing ones — the iff law is
tested, so they cannot drift.

## Implementation constraints

- `src/core/constants.ts`: the two alphabets and their reverse lookup tables, written out per
  the browser idiom (policy forbids computed module scope). Constants are NOT exported from
  the barrel (publishing an alphabet invites hand-rolling the coding — charter ruling).
  If the policy suite requires every source file's exports in the barrel, keep the tables in
  `helpers.ts` as non-exported module locals written out literally — check the policy rules
  and pick the compliant shape; record which.
- `src/core/helpers.ts`: the six functions. Pure ES: only `string`/`Uint8Array`/arithmetic.
  No regex REQUIRED — a table walk that validates while decoding is preferred (one grammar,
  one pass); if you use a regex for the guard, the iff law still binds it to the decoder.
- `src/core/index.ts`: the barrel, exporting exactly the six.
- TSDoc every export: one-sentence summary, @remarks naming the RFC section and the
  canonical-form law (and for decoders that `undefined` is the only failure mode), @param,
  @returns, @example where the fleet's idiom carries one.
- No nested function declarations; match fleet formatting (tabs, oxfmt settles the rest).

## Tests

Replace the seeded `tests/src/core/index.test.ts` with the fleet's per-module shape (e.g.
`tests/src/core/helpers.test.ts` — read how process/browser name theirs and match). Required
coverage, both faces:

- Law 1 as a sweep: the full 0-255 octet space in one buffer round-trips; lengths 0,1,2,3
  round-trip (padding residues).
- Law 2 as a sweep over admitted vectors; and the iff law: for every vector in a mixed
  valid/invalid table, `is*(text) === (decode*(text) !== undefined)`.
- Named vectors: `'hi'` -> `'aGk='` (§4) and `'aGk'` (§5); `[0xfb,0xff,0xbf]` -> `'+/+/'`
  (§4) vs `'-_-_'` (§5); empty string/bytes both directions.
- Canonical refusals (each `undefined` AND guard-false): `'aa=='` and url `'aa'` (unused
  bits); `'AQ ID'` (whitespace); `'A'` (residue 1); `'AQID='` (bad padding); `'aGk'` on
  standard (missing padding); `'aGk='` on url (padding present); `'+/+/'` on url; `'-_-_'`
  on standard; `'===='`; non-strings to guards (numbers, null, bytes) false, decoders are
  string-typed so no runtime-type rows needed there.
- Guards on hostile values: no throw for any input.

## Guide and parity

- Write `guides/codec.md`: charter paragraph (above), the three families and the two laws,
  the surface table (six rows, one line each in the fleet's table voice), a Membership
  section carrying the bar and the gravity rule (state: stateless spec-named byte<->text,
  one canonical form, guard-decidable, both laws, a real consumer; never state-carrying,
  parameterized, document-grammar, or caller-policy transforms), and Declared non-goals
  (no lenient doors — leniency lives with the consumer that owns it; UTF-8, hex, charset
  decoders, and measure* are later candidates behind the bar; no error type by design).
- Update `guides/README.md`: the By-concept row (Codec | codec.md | src/core |
  tests/src/core) and By-directory row, matching process's README shape.
- Wire the parity suite: `tests/guides.test.ts`, the `guides` project in `vite.config.ts`,
  `test:guides` script, and add it into the `test` chain — copy process's wiring, adjusted
  to core-only.

## Scope

Owned: everything under `C:\Users\mikes\WebstormProjects\codec` except `node_modules`,
`package-lock.json`, and the scaffold-vendored files (`tests/policy.test.ts`,
`tests/setupPolicy.ts`, `tests/config.test.ts`, `tests/distribution.test.ts`, `AGENTS.md`,
`CLAUDE.md`, `.claude/*`, configs, dotfiles, `guides/guide.md`, `guides/scaffold.md`,
`LICENSE`, `scripts/*`) — NEVER edit a vendored file; if one blocks you, stop and report.
`package.json`: you may add the `test:guides` script and amend the `test` chain only.
Off-limits: every path outside the codec checkout (read-only access to the template repos is
fine). Tools: Read, Grep, Glob, Write, Edit, Bash (scoped to the codec repo).

## Gates (run inside the codec repo; report exact readings)

`npm run format` then `npm run format:check`; `npm run lint:check`; `npm run check`;
`npm run test:src`; `npm run test:guides`; `npm run test:policy`; `npm run test:config`.
All must exit 0. Do not run `build` or `test:distribution` (the Orchestrator takes those).

## Deviation contract

A conflict with the charter, the surface, or the laws stops the unit: report expected/found/
evidence and one hypothesis, change nothing further. Ancillary choices (test file naming,
table layout, TSDoc phrasing) are yours: decide, record in the report, carry on. If the
policy suite rejects a shape this brief mandates, that is a primary conflict — stop and
report the exact failing rule text.

## Output

Return as your final message: files written/edited (paths); the shape you chose where the
brief left one open (constants placement, grammar implementation); every gate's exact tail
reading; behaviors you pinned beyond the brief; claims you flag for audit; deviations.
