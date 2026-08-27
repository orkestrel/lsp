# @orkestrel/codec charter — verdict and reconciliation (round 2)

Round 1 (archived below in this folder) placed the codec in a new L0 leaf. The user ruled:
`codec`, not `base64` — "a lot like contract, but not in contract" — and asked for a fleet
inventory of everything that encodes/decodes, then a pass over it for the charter decision.

## Evidence chain

- Grok inventory lane (`codec-inventory-distillate.md`): every transform surface in the
  fleet, ten clusters, semantics/spec/environment/statefulness per symbol with file:line.
  Read local sources for 17 checkouts, guide mirrors for the rest. Caveat recorded: mirror
  parity notes lag unpushed local work (server.md rows exist locally at 33b39c7).
- Contract doctrine read: three sibling families (`is*`/`*Of`/`parse*`), universal totality,
  sound guard/parser pairs, coded refusals at reader boundaries.
- Orchestrator verifications: mcp `isStandardBase64` is alphabet+padding regex ONLY (admits
  non-canonical trailing bits, `validators.ts:173`); server Base64 module imports `node:net`/
  `node:events` (helpers.ts:1,16-17) so the symbols drag Node bindings today; server's
  throwing decode is documented "callers catch to stay total"; scaffold hand-rolls
  `bytesToHex` (`helpers.ts:52`); fleet initialism precedent `isAbsoluteURI`.

## Lane convergence (blind, one brief)

Both lanes independently ruled: pure-ES charter (no `atob`/`btoa`/`Buffer`/`TextEncoder`/
`node:*`, no fleet deps, one barrel, no faces); decode doctrine total-`undefined`, no error
type, no options, no lenient door ever (leniency is consumer policy, named where it lives);
families `encode*`/`decode*`/`is*` with sound-pair laws; wave-1 = the Base64 six; browser
unchanged in wave 1 (its skip-junk decoder is a CDP repair); msg untouched (zero-dep line is
a published promise); NEVER for framing, compression, structural escapes, JSON,
percent-encoding, MIME, value mapping, ANSI, one-way digests; release order codec ->
mcp+server -> probe/toolbox re-pins.

## Forks and rulings (Opus weighted higher; Grok claims verified)

1. **Guard strictness.** Objective: alphabet+padding grammar (mcp's regex). Subjective:
   canonical form — the second identity `encode*(decode*(text)) === text` for every
   `is*`-admitted text forces rejection of non-canonical trailing bits (`'aa=='` re-encodes
   as `'0w=='`). RULED: subjective. The round-trip pair of laws IS the doctrine's backbone —
   it is what makes codec "like contract" (parse-then-trust becomes decode-then-trust).
   `isBase64` is the canonical-form grammar.
2. **`isStandardBase64`.** Objective: delete, import `isBase64` (published rename).
   Subjective: stays in mcp. RULED: stays — now on verified ground: the predicates are
   extensionally different (mcp's admits non-canonical trailing bits), and mcp's names a
   JSON Schema `byte` policy over FOREIGN content it never decodes (liberal-receive), while
   the sentinel is fleet-owned wire form (strict-canonical). Content validation stays
   liberal; the wire goes canonical.
3. **Spelling.** `encodeBase64URL`/`decodeBase64URL`/`isBase64URL` — the fleet preserves
   non-leading initialisms (`isAbsoluteURI`); server's `Base64Url` (landed this week,
   unpublished) is corrected in the extraction. Greenfield, no shim.
4. **UTF-8.** Objective NEVER (platform wraps, fatality disagreement); subjective LATER
   (hand-rolled strict door only, msg proves pure-ES feasibility; lossy/replacement stays
   with consumers). RULED: LATER, strict-door-only scope, its own design unit.
5. **Hex.** Both LATER; consumers exist (scaffold `bytesToHex`, digest hex). `encodeHex`/
   `decodeHex`/`isHex` when a wave opens those checkouts.
6. **Arithmetic.** LATER as `measure*` (`measureBase64`), subjective's naming — websocket's
   `measureWebSocketFrame` is the fleet precedent; law `measureBase64(text) ===
   decodeBase64(text)?.length`.

## The charter (adopted)

Codec — the fleet's byte<->text codings. A coding is a spec-named, stateless mapping with one
canonical spelling per input, written as `encode*` (produces only the canonical form),
`decode*` (accepts exactly that form, `undefined` for everything else), and `is*` (names the
exact set its decoder accepts). Pure ES over `string` and `Uint8Array`: no `atob`/`btoa`/
`Buffer`/`TextEncoder`/`TextDecoder`/`node:*`, no fleet dependency, no error type, no options
bag, no class, one barrel. Membership bar: named public spec; stateless; no argument beyond
the value; one canonical form per input; decidable membership by a shipped total guard; both
round-trip identities hold; a real fleet consumer wants it now. Gravity rule: a transform
that carries state across calls, takes a tuning parameter, reads a document grammar, or needs
a caller policy to choose among valid outputs is never a member.

## Wave-1 exports

`encodeBase64`, `decodeBase64`, `isBase64`, `encodeBase64URL`, `decodeBase64URL`,
`isBase64URL`. Nothing else — no types, constants, errors, classes, or faces.

## Wave-1 consequences

- server: +codec dep; delete the four helpers (their module drags node:net today — a defect
  this fixes); verifyToken/decodeTokenPayload catch narrows to crypto/JSON; tests move
  `DOMException` expectation to `undefined`; guide rows move to codec.
- mcp: +codec dep; sentinel drops btoa/atob loops for codec calls (strengthens browser-safe
  charter); `isStandardBase64` stays for JSON Schema `byte` content checks. ACCEPTED
  behavior delta: sentinel refuses non-canonical trailing-bit payloads it previously
  accepted (one spelling per value at a fleet-owned wire form; fail-closed receive).
- Release order: codec 0.0.1 -> mcp + server -> probe/toolbox re-pins. browser, workspace,
  msg untouched.

## Risks carried

- Pure-ES throughput vs native `atob`/`btoa` on multi-MB payloads: unmeasured. Escape hatch
  ruled acceptable: `isBase64`-then-`atob` inside the same signature spends one charter
  sentence, no public contract change. Benchmark belongs in the codec repo's suite.
- A live MCP peer emitting non-canonical Base64 would see a refusal at the sentinel; no such
  peer is known.
- External importers of server's four helpers or mcp's predicate see removal/no-shim
  (unpublished spelling; fleet-internal risk only).

Implementation awaits the user's word. Routing: inventory = Cursor Grok; subjective = Opus 5
(native, clean context); objective = Cursor Grok substituting for user-excluded Sol
(standing routing, recorded); verification + reconciliation + acceptance = Orchestrator.
