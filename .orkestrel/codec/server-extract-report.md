# server-extract — returned report (implementer, Opus 5)

All gates green, nothing committed by the unit.

## Changes

- `src/server/helpers.ts`: the four Base64 helpers deleted with their TSDoc (export *
  barrel, so they left the surface; no codec re-export). `signToken` encodes payload and
  signature via `encodeBase64URL`. `verifyToken`: signature decode moved out of the `try`
  to an `undefined` check; `catch` wraps only the WebCrypto loop with a comment naming what
  it contains. `decodeTokenPayload`: decode moved out; `try` covers `JSON.parse` + the
  narrowing. TSDoc updated to name the codec decoder and its totality.
- `tests/src/server/helpers.test.ts`: the codec describe block removed (DOMException row
  included); the exp-tamper token test retooled onto the codec pair; token tests otherwise
  untouched and green.
- `guides/server.md`: the four helper rows removed.
- Imports: `decodeBase64URL`, `encodeBase64URL` from `@orkestrel/codec` in source and test.

## Gates

format:check clean (48 files); lint:check clean; check clean; test:src 238 passed (5
files); test:guides 28; test:policy 111; test:config 46.

## Finding: the brief's whitespace observation was wrong — the change closes a
signature malleability

Differential probe (tmp/probe, deleted) driving the real token functions beside the retired
implementation reconstructed from HEAD 33b39c7: a space spliced into the SIGNATURE segment
verified as `client` on the old path (`atob` stripped it; decoded bytes identical to the
clean signature; HMAC matched) and refuses (`undefined`) on the codec path. The old
acceptance meant a token had more than one accepted spelling of its signature. The payload
segment and garbage inputs were `undefined` on both paths (the old payload refusal was
incidental: length-dependent padding arithmetic, not a systematic repair). Negative
control: the untouched token verified `client` under both implementations. Clean-signature
coverage: the existing token tests, green.

## Decided in latitude / carried rows

- WebCrypto typing friction: codec's `decodeBase64URL` declares `Uint8Array`
  (`ArrayBufferLike`), rejected by `BufferSource` (TS2345, SharedArrayBuffer arm);
  `verifyToken` copies once into `new Uint8Array(decoded)` before the candidate loop.
  CARRIED as a codec fix: declare `Uint8Array<ArrayBuffer>` on both decoders (the
  implementation allocates fresh); every WebCrypto consumer pays the copy until then.
- The `verifyToken` catch stays: `importKey` throws only on zero-length key material on
  this host (probed, Node v24.19.0), unreachable through `normalizeSecret` — kept because
  host WebCrypto varies; comment narrowed to say so.
- `JSON.parse` vs contract's total `parseJSON`: swap would remove the last catch; exceeds
  scope; recorded as a future server row.

166,925 tokens, 59 tool uses, 602s.

## Orchestrator settlement addendum (round 3, claim 2)

The unit's whitespace-only statement of the token delta was too narrow. The settlement
probe (built dist vs the retired decoder transcribed from 33b39c7, byte-equality oracle,
live controls) found four old-ACCEPT/new-refuse classes: unused-bit sibling of the final
signature character, appended padding, url-to-standard alphabet swap, and an inserted tab.
All are second spellings of the same signature — the malleability closure in full. No fix:
the shipped code is correct and strictly better than reported.
