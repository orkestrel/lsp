# mcp-extract — returned report (implementer, Opus 5)

All gates green, nothing committed by the unit.

## Red, then green (the accepted behavior change, bound)

Failing proof first, `tests/src/core/helpers.test.ts`, row "refuses a sentinel whose payload
sets a bit the padding discards", run scoped before touching src:
`AssertionError: expected 'A' to be undefined` — `Tests 1 failed | 165 skipped (166)`.
Same command after the implementation: `Tests 1 passed | 165 skipped (166)`. Sentinel
describes together: `25 passed | 141 skipped (166)`.

## Changes

- `src/core/helpers.ts`: `import { decodeBase64, encodeBase64 } from '@orkestrel/codec'`;
  `isStandardBase64` dropped from the validators import (only `decodeSentinel` used it
  here). `decodeSentinel` calls `decodeBase64(payload)` and refuses on `undefined`; the
  fatal-UTF-8 TextDecoder and RFC 9110 OWS handling untouched. `encodeSentinel` spells its
  payload with `encodeBase64(new TextEncoder().encode(value))`. TSDoc names the canonical
  §4 grammar, states the `QR==`/`QQ==` refusal with a matching example, and records that
  `isStandardBase64` remains the validators' wider JSON Schema `byte` policy.
- `tests/src/core/helpers.test.ts`: the refusal row asserts `'=?base64?QR==?='` is
  `undefined` AND the canonical companion `'=?base64?QQ==?='` is `'A'` — the refusal is
  about canonicality, not an unreachable byte.
- `guides/mcp.md`: sentinel paragraph names codec's `decodeBase64` as the payload grammar;
  the two core-dependency claims the import made false (header blockquote, clause 9)
  corrected to include `@orkestrel/codec`.
- `src/core/validators.ts`, `package.json`, lockfile untouched by the unit.

## Evidence beyond the brief

- Lenient-acceptance sweep BEFORE writing: every sentinel payload literal in the repo run
  through the installed codec — each keeps its current verdict (decoders: `Y2Fmw6k=`,
  `IHBhZGRlZCA=`, `ICBwYWRkZWQgIA==`, `dHdvCmxpbmVz`, three `PT9iYXNlNjQ/` forms,
  `SGVsbG8=`, `SGVsbG8sIOS4lueVjA==`, `/w==`; refusals unchanged: `SGVs!!!bG8=`,
  `AAAA?=BBBB`, `SGVsbG8`). No fixture, conformance row, or helper depended on the old
  leniency.
- `atob`/`btoa` grep: zero in `src/core`, zero across all of `src`; built core carries the
  codec import and no host codec.
- One flake observed, OUTSIDE this unit: `MCPLegacyClientTransport` "bounds a forwarded
  request that receives no peer response" (20ms budget vs waitForDelay(30)) failed once
  under the full concurrent run; did not reproduce across six isolated runs, three stashed
  control runs, and four restored runs. Read as a contention-sensitive budget owned by the
  legacy-transport capability. CARRIED as a fleet row for that capability's owner.

## Gates (exact tails, all exit 0)

format 127 files; format:check clean; lint:check clean; check clean (root + core + browser
+ server projects); test:src:core 881 (16 files); test:src 1331 (32 files); test:guides
149; test:policy 111; test:config 46; build green 2.57s (run beyond the brief because the
unit adds an external import).

## Orchestrator addendum

After the unit returned, the tarball was refreshed to the repacked codec (887f9cb, the
ArrayBuffer-backed decode declarations) and the scoped gates re-run green: check exit 0,
test:src:core 881.

136,225 tokens, 85 tool uses, 1043s.
