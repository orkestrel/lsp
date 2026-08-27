# Design brief: the charter, naming families, and membership bar of @orkestrel/codec

One brief, two blind lanes. You hold the lane your dispatch message names. Perform the
assignment directly and spawn nothing. Read-only: no edits anywhere. Missing facts go in
Unknowns — do not improvise them.

## Decision already taken (do not relitigate)

The fleet is standing up `@orkestrel/codec`: a new L0 leaf, pure ES, browser-safe, no
dependency on any fleet package. Its first residents are settled: the RFC 4648 Base64 family
(`encodeBase64`/`decodeBase64` §4, `encodeBase64Url`/`decodeBase64Url` §5), replacing the
copies in `@orkestrel/server` (src/server/helpers.ts) and backing `@orkestrel/mcp`'s sentinel
inlines. The user has ruled the package will be `codec`, not `base64`: broader than one
encoding, and doctrinally "a lot like contract, but not in contract."

## What you decide

1. **Charter statement** — one paragraph, the package's guide opening: what codec IS and is
   NOT.
2. **Naming families and their laws** — contract's model is three sibling families with
   jobs and laws (`is*` validators: total, never throw; `*Of` combinators; `parse*` parsers:
   coerce-or-undefined, each a SOUND PAIR with its output guard, so parse-then-trust). Define
   codec's equivalent: the prefixes (`encode*`/`decode*` presumed operative — confirm or
   amend), each family's job, its totality/error law (total-undefined vs throwing vs coded
   refusals — pick ONE doctrine and defend it), the soundness law between pairs (round-trip
   identity, canonicalization direction), and whether grammar guards (`is*`) and size
   arithmetic (`*Size`) belong as codec families or stay with consumers.
3. **Membership bar** — the written admission rule, plus a ruling per inventory cluster:
   IN wave 1 / CONVERGES LATER / NEVER, with one sentence each.
4. **Wave-1 surface** — the exact export list codec 0.0.1 ships.
5. **Consequences** — which packages change in wave 1 and what couples to what.

## Evidence

- Full fleet inventory (every encode/decode surface, semantics, spec, environment,
  file:line): `C:/Users/mikes/WebstormProjects/lsp/tmp/cursor/codec-inventory.log`. Read it
  in full — it is the ground your ruling stands on.
- Contract's doctrine (the model to mirror, not to copy):
  `C:/Users/mikes/WebstormProjects/scaffold/guides/contract.md` lines 3-25 — three sibling
  families, universal totality, sound guard/parser pairs, coded `ContractError` refusals at
  reader boundaries.
- Caveat: the inventory's guide-vs-source parity notes used the scaffold MIRRORS, which lag
  unpushed local work. The server checkout's own guides/server.md DOES document
  encodeBase64/decodeBase64 (local commit 33b39c7). Treat mirror-lag parity notes as stale,
  not as findings.
- Constraint set from the prior ruling (archived, settled): codec sits at L0; mcp core must
  stay browser-safe (lib ESNext+WebWorker); the three existing Base64 decoders disagree
  (browser: lenient skip-junk; server: throws DOMException via atob; mcp sentinel: total
  undefined after strict isStandardBase64 grammar); browser converges only via an explicitly
  NAMED lenient variant if at all; msg (no local checkout, guide-only semantics) is L0
  zero-dep and taking codec as a dep costs it that registry line.

## Key tensions your ruling must resolve (both lanes, each through its own lens)

- One decode doctrine for the whole package, when existing consumers hold three policies.
  Named variants (`decodeBase64Lenient`) vs one strict door vs guard-then-decode composition
  (`isBase64` + total `decodeBase64`).
- Platform-wrapped codecs: UTF-8 via TextEncoder/TextDecoder is already the platform's codec
  (browser, websocket, lsp, console, terminal all wrap it ad hoc, fatal and non-fatal mixed);
  msg hand-rolls pure-ES UTF-8 because its charter forbids TextDecoder. Does codec ship UTF-8
  (and with which implementation law), or is wrapping the platform a NEVER?
- Hex (RFC 4648 §8 base16): msg ships toHexLower; probe uses hex digests. In or out?
- Charset decoders (Latin-1, Windows-1252, UTF-16LE — spec-backed, pure-ES, currently msg's):
  codec members someday, or msg domain forever?
- Percent-encoding (RFC 3986: router lenient, middleware strict, server cookies): three
  policies again, all wrapping platform decodeURIComponent. In, later, or never?
- Base64 arithmetic (workspace decodedSize): a codec family (`*Size`), or stays put?
- mcp's isStandardBase64: with a full codec charter, does the GRAMMAR move to codec as
  `isBase64` (mcp keeping only the JSON-Schema-byte policy naming), or stay whole in mcp?
- The gravity rule: what written sentence keeps compression, framing, structural escapes
  (HTML entities, CSV quoting, markdown), JSON, and value mapping OUT permanently.

## The lanes

- **Subjective lane**: charter voice, family naming, what the package should feel like to
  import, coherence with the fleet's one-noun-one-job taste, where the doctrine's elegance
  is worth a consumer's inconvenience and where it is not.
- **Objective lane**: what each candidate family costs and breaks — behavior deltas per
  consumer at each extraction, environment legality, bundle and layer math, soundness-law
  feasibility against the three existing decode policies, migration order, release coupling.

## Output shape (both lanes)

- Charter: the paragraph.
- Families: name, job, law — for every family you admit; and the rejected alternatives.
- Membership bar: the written rule.
- Cluster rulings: IN-1 / LATER / NEVER per inventory cluster, one sentence each.
- Wave-1 exports: the list.
- Consequences: packages changed, coupling, the risk you cannot rule out.
- Unknowns.

Do not hedge: one charter, one doctrine, one list.
