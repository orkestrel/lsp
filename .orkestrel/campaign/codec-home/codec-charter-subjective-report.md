# codec-charter subjective lane — returned report (planner, Opus 5, clean context)

## Charter

Codec — the fleet's byte<->text codings. A coding is a spec-named, stateless mapping with one
canonical spelling per input — RFC 4648 Base64 and base64url today — written as an `encode*`
that produces only the canonical form, a `decode*` that accepts exactly that form and answers
`undefined` for everything else, and an `is*` guard that names the exact set its decoder
accepts. Every function is pure ES over `string` and `Uint8Array`: no `atob`, no `btoa`, no
`Buffer`, no `TextEncoder`, no `TextDecoder`, no `node:*`, no dependency on another
`@orkestrel` package. The same code runs in a browser, a worker, and Node, and its totality
is implemented rather than caught. It is NOT a formats package. It does not compress, frame a
stream, escape a document, map a value into a store, or read JSON — each of those needs a
buffer held across calls, a tuning parameter, a document grammar, or a caller policy to say
which of several valid outputs is right, and each stays with the consumer that owns that
policy. Codec ships no error type, no options bag, no class, and no type of its own, so
importing it adds functions over the platform's own primitives and nothing else.

Why "a lot like contract, but not in contract": contract's coded refusals exist because a
caller-owned container can lie (getter throws, proxy traps, cycles), so invalid and
unreadable are different answers. Codec's inputs are `string` and `Uint8Array` — nothing can
be unreadable — so `undefined` carries the whole answer and codec ships no error type. Same
shape, one rung simpler, which is exactly why it is a separate package and not a contract
module.

## Families

Direction convention: `encode*` moves toward the coding's WIRE form, `decode*` toward its
NATIVE form. For Base64 wire is text; for UTF-8 that inverts — `encodeUTF8(text) -> bytes`,
matching what msg already ships.

- `encode*` / `decode*` — the codings. One function per direction per coding, the coding
  named in the suffix. Law: a direction is total and answers `undefined` exactly when its
  input lies outside the coding's domain — never otherwise. `encodeBase64` cannot fail; for
  UTF-8, later, both directions can (a lone surrogate has no canonical byte form) under the
  same sentence.
- `is*` — the membership guards. `(value: unknown) => value is string`, total, never throws —
  contract's `Guard<T>` contract, so codec guards compose in contract's combinators. Law:
  `decodeBase64(text) !== undefined` iff `isBase64(text)`.
- `measure*` — the arithmetic. `measureBase64(text): number | undefined`; law
  `measureBase64(text) === decodeBase64(text)?.length`. Named for websocket's
  `measureWebSocketFrame` precedent; `*Size` would violate the count/length/size root law.

The pairing law, and how it differs from contract's: contract's parsers pair with the guard
on their OUTPUT type; codec's decoders pair with the guard on their INPUT, because a codec's
hard question is membership of the encoded text. Written out:
- `decode*(encode*(value))` equals `value`, for every value of the parameter type.
- `encode*(decode*(text))` equals `text`, for every `text` where `is*(text)`.
The second identity is load-bearing: it forces `isBase64` to reject non-canonical trailing
bits — `'aa=='` passes an alphabet-and-padding regex but re-encodes as `'0w=='` — so
`isBase64` is the canonical-form grammar, strictly narrower than alphabet-plus-padding.

Rejected: throwing decode (server's own consumer catches it under a "stay total" comment);
`CodecError` (codes separate invalid from unreadable; nothing here is unreadable); Result
duals (the failure carries no information); a leniency option (reopens the doctrine at every
call site, makes the round-trip law unstateable); a `Base64Codec` class (export pure leaves;
entity methods strip the coding's name); `parse*` (contract owns it; names no direction);
`to*`/`from*` (fleet spends `to*` on value formatting; leaves the guard homeless);
`encodeBase64Url` spelling (URL is a canonical initialism — the name is `encodeBase64URL`);
publishing alphabet constants (invites hand-rolling).

## Membership bar

A coding joins codec when every line holds: named by a public specification; a stateless
mapping between `string` and `Uint8Array` needing no argument beyond the value; every input
has exactly one canonical encoded form; the set of canonical forms is decidable by a total
guard this package ships; encoding-then-decoding returns the input and decoding-then-encoding
returns the text for every guard-admitted text; a real fleet consumer wants it now.

Gravity rule: a transform that carries state across calls, takes a tuning parameter, reads a
document grammar, or needs a caller policy to choose among several valid outputs is not a
coding and never becomes a member — however reversible. It stays with the consumer that owns
the policy. (Excludes: compression — level parameter and a stream; framing — buffer across
calls; HTML/CSV/markdown escaping — document grammar; JSON — value grammar, not bytes<->text;
percent-encoding — the reserved set is per-context caller policy, which is why router,
middleware, and server hold three different ones; value mapping — domain semantics.)

Leniency: a repair (skip junk, strip line wraps, restore padding) produces many texts that
decode to the same bytes, so encode-after-decode is not identity and the law dies. Codec
ships no lenient door, ever. Browser's junk-skipping decoder is a CDP repair and stays
browser's; msg's line-unwrapping is a MIME repair and stays msg's.

## Cluster rulings

- Base64 §4 pair — IN-1 (three fleet copies with three policies is the disease codec cures).
- base64url §5 pair — IN-1.
- Canonical grammar — IN-1 as `isBase64`/`isBase64URL` (each decoder's stated law).
- `mcp.isStandardBase64` — NEVER moves: answers a different question (JSON Schema `byte`
  over foreign blob/image/audio payloads mcp never decodes); wider set with a policy name.
- `workspace.decodedSize` — LATER as `measureBase64` (creation gate holds it until workspace
  converts).
- `browser.decodeBase64` — NEVER (a repair, not a coding; rename in browser to say so);
  `browser.encodeBase64` LATER.
- UTF-8 — LATER: passes the bar, the fleet's biggest instance of the same disorder
  (fatal-throw, silent-replace, total-undefined all live); waits because its strict door is a
  member and its lossy door is not; a design unit of its own. Wrapping the platform is not
  the objection — codec hand-rolls it, as msg proves possible.
- Hex §8 — LATER as `encodeHex`/`decodeHex`/`isHex` (scaffold.bytesToHex and digest-hex
  consumers exist; nothing in wave 1 opens those checkouts). `msg.toHexLower` — NEVER
  (number->text, not byte<->text).
- Charset decoders — LATER (Latin-1 passes outright; UTF-16LE/Windows-1252 once undefined
  slots and lone surrogates answer `undefined`); held until a second consumer exists.
- MIME/2045/2047, percent/URI/cookie, HTML/markdown escapes, CSV, JSON, framing,
  compression, value mapping, ANSI — NEVER, each by a gravity clause, none by taste.
- msg as a consumer — NEVER: zero-dependency is a published promise; codec buys it nothing.

## Wave-1 exports

`encodeBase64` (bytes->string), `decodeBase64` (string->bytes|undefined), `isBase64`,
`encodeBase64URL`, `decodeBase64URL`, `isBase64URL`. No types, no constants, no errors, no
classes, no faces. One environment, one barrel.

## Consequences

- server: declares codec; deletes the four helpers (whose module imports node:net/
  node:events — importing Base64 from server today drags Node bindings, fixed for free);
  verifyToken/decodeTokenPayload replace the decode try/catch with an undefined check, the
  catch narrowing to crypto.subtle/JSON.parse; guide rows move; spelling corrected to
  `Base64URL` on the way (greenfield, unpublished).
- mcp: declares codec; sentinel drops btoa/atob and fromCharCode loops; core stops depending
  on atob/btoa globals — strengthens the browser-safe charter. `isStandardBase64` stays for
  validators.
- Coupling: both already carry contract (L0), so codec adds no new class of dependency.
  Release order codec -> server+mcp -> downstream. browser, workspace, msg untouched.
- Accepted behavior delta: mcp's sentinel currently admits non-canonical trailing bits
  (`'QR=='` -> `'\x11'`); under `decodeBase64` it refuses. Ruled correct: a header field with
  two spellings of one value is a defect; encodeSentinel emits only canonical; the protocol
  requires rejection of invalid payloads.
- Risk: pure-ES throughput vs native atob/btoa on multi-MB payloads is unmeasured; if a
  benchmark goes against it, the repair is isBase64-then-atob inside the same signature —
  contract, doctrine, and laws survive; one charter sentence is spent. Smaller: a live peer
  sending line-wrapped/non-canonical Base64 sees a refusal at a protocol boundary.

## Unknowns (as returned)

msg.decodeBase64 semantics (no checkout); workspace binary data spelling; whether JSON Schema
`byte` forbids non-canonical trailing bits (if so, isStandardBase64 collapses into isBase64);
whether CDP IO.read ever emits line-wrapped Base64; whether the oldest supported targets
carry Uint8Array.fromBase64/toBase64 (scaffold notes the oldest Node lacks toHex — codec's
contract differs from the native API's regardless and may later delegate its body); ten
packages ruled on guide text only.

104,069 tokens, 25 tool uses, 463s.
