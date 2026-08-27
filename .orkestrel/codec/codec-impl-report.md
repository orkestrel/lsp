# codec-impl — returned report (implementer, Opus 5)

Wave 1 implemented; every named gate exit 0.

## Files

Written: `src/core/constants.ts`, `src/core/helpers.ts`, `guides/codec.md`,
`tests/guides.test.ts`, `tests/src/core/helpers.test.ts`. Edited: `src/core/index.ts`
(barrel `export * from './helpers.js'`), `guides/README.md` (By-concept, By-directory,
Dependency reference), `vite.config.ts` (guides project), `package.json` (`test:guides`
script + test chain only). Deleted: seeded `tests/src/core/index.test.ts`. No vendored file
touched; git status shows only these paths.

## Shapes chosen where the brief left one open

- Constants placement: the policy sweep does not decide barrel membership
  (`.claude/rules/architecture.md` § What the policy sweep proves); `inspectPolicySource`
  requires centralized declarations carry `export`, so the brief's non-exported-locals
  fallback would itself have failed the sweep (plus `Source.hidden()`). Shipped:
  `BASE64_ALPHABET` + `BASE64_LOOKUP` exported from `constants.ts`, kept out of the barrel,
  named in the guides suite's INTERNAL list — which is load-bearing in both directions (a
  name going public fails "names no symbol internal that the barrel already exports").
- Grammar: one table walk, no regex. `decodeBase64` validates while decoding, one
  four-character group at a time — membership, group-boundary length, `=` only in the final
  tail, zero unused trailing bits (`second & 0x0f` two-pad, `third & 0x03` one-pad). Guards
  delegate (`typeof value === 'string' && decode*(value) !== undefined`) — one grammar.
- Tests: `tests/src/core/helpers.test.ts` (fleet per-module shape); vector tables live in
  the file (the setup-module pattern needs a setup project/test/script the brief scoped
  package.json against; one consumer, extraction speculative).

## Recorded deviation

One alphabet pair, not two. The surface is fixed at six exports, so a shared parameterized
walk cannot exist without a seventh symbol; two lookup tables force the walks to be written
twice, forbidden by centralization and TTTDD consolidation. The §5 face is the §4 face under
a two-character substitution with padding stripped — server's own idiom. `decodeBase64URL`
refuses `+`, `/`, `=` before substituting, so the composition accepts exactly canonical
unpadded §5. Every refusal in the brief is pinned by test. Not a stop: no conflict with
charter, surface, or laws.

## Gates (exact tails)

format 761ms/28 files; format:check "All matched files use the correct format."; lint:check
silent 0; check clean both projects; test:src `Tests 36 passed (36)`; test:guides
`Tests 22 passed (22)`; test:policy `Tests 111 passed (111)`; test:config
`Tests 46 passed (46)`. build and test:distribution not run (reserved to the Orchestrator).

## Behaviors pinned beyond the brief

- Instrument controls: removing the two-pad unused-bit refusal reddened test:src at
  `3 failed | 33 passed`; removing the `isBase64URL` guide row reddened test:guides at
  `1 failed | 21 passed` on "documents every barrel export". Both reverted, both re-run
  green.
- Sweeps: every single byte and every byte pair round-trip on both faces; exhaustive walk
  over every text of length <= 4 drawn from `A Q a q 0 + / - _ =` and space carrying the iff
  law and the canonical-form law; alphabets read against an RFC transcription written in the
  test (spec-vs-table, both directions).
- Extra refusals: `'A==='`, `'AA=A'`, `'AAAA\n'`, the `'AA'`/`'AA=='` residue split between
  faces.
- Guides suite: alias-refusal on fence imports, package-export-key derivation, test-file
  inventory check, flagship-fence transcriptions driven against the code.

## Claim flagged for audit

The dispatch brief's `'aa==' -> '0w=='` example was wrong: `'aa=='` decodes to `0x69` and
re-encodes `'aQ=='` (checked against Node's codec); `'0w=='` is canonical for `0xd3` and
unrelated. Same correction on the url face (`'aa'` -> `'aQ'`). Requirement unaffected and
implemented; guide and tests state and drive the corrected relationship.

290,222 tokens, 84 tool uses, 1250s.
