# Unit: mcp-utf8 — the sentinel's decode side converges on codec's strict UTF-8

Role and engine: implementer, Opus 5 (native). Writing unit in
`C:\Users\mikes\WebstormProjects\mcp` (baseline: the HEAD the dispatch message names, plus
an Orchestrator lockfile refresh — expected, leave it). Perform directly, spawn nothing,
commit nothing. Read `mcp/AGENTS.md` pointers first. The codec guide
(`C:\Users\mikes\WebstormProjects\codec\guides\codec.md`) documents `decodeUTF8`: strict
RFC 3629, total-`undefined`, and — unlike the platform decoder's default — a leading BOM is
PRESERVED as U+FEFF (the round-trip law forces it).

## Objective

`decodeSentinel`'s UTF-8 step moves from `new TextDecoder('utf-8', { fatal: true })` (with
its try/catch) to codec's `decodeUTF8` — and the change FIXES a real round-trip defect:
today a sentinel whose value leads with U+FEFF does not survive encode-then-decode, because
the platform decoder strips the BOM. The ENCODE side stays `TextEncoder` deliberately: its
replacement semantics on ill-formed input are mcp's documented policy, and `encodeUTF8`'s
total-`undefined` shape would be an API change this unit does not make. Record that ruling
in the sentinel TSDoc.

## Work — failing proof first

1. Add the test FIRST, in the sentinel describe: `decodeSentinel(encodeSentinel('\uFEFFx'))`
   equals `'\uFEFFx'` (choose the exact door the neighbouring rows use). Run scoped and
   RECORD the exact red (today the BOM is stripped and the value comes back `'x'`).
2. `src/core/helpers.ts`: in `decodeSentinel`, replace the fatal-TextDecoder step and
   whatever try/catch exists solely for its throw with `decodeUTF8(bytes)` and an
   `undefined` check, importing `decodeUTF8` from `@orkestrel/codec` (extend the existing
   import). Everything else — OWS trim, markers, literal passthrough, the codec Base64
   step — stays untouched.
3. TSDoc: the payload's text step is codec's strict `decodeUTF8` (RFC 3629,
   total-`undefined`, BOM-preserving); name the encode-side TextEncoder ruling.
4. Grep `src/core` for remaining `TextDecoder` uses; report the sites (do not change any
   outside the sentinel). Re-run the new row green, the sentinel describe, then the gates.
5. `guides/mcp.md`: update any sentence describing the sentinel's UTF-8 step; parity green.

## Scope

Owned: `src/core/helpers.ts`, the sentinel test file, `guides/mcp.md`. Off-limits:
everything else including package.json/lockfile.

## Gates (exact tails)

format then format:check; lint:check; check; test:src:core then full test:src;
test:guides; test:policy; test:config. All exit 0.

## Deviation contract

A fixture or conformance row that depends on BOM-stripping, or any codec semantics
mismatch, stops the unit (expected/found/evidence). Phrasing is yours.

## Output

The red reading (exact) then the green; changes per file; the TextDecoder site inventory;
every gate tail; latitude decisions.
