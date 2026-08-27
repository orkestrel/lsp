# Design brief: where does the fleet's standard Base64 codec live?

One brief, two blind lanes. You hold the lane your dispatch message names. Perform the
assignment directly and spawn nothing. Read-only: no edits anywhere. If a fact you need is
missing, name it as an unknown in your return — do not improvise it.

## Question

The `@orkestrel` fleet carries four separate Base64 implementations. Should a single shared
home own the byte<->Base64 codec, and if so which package is that home? Rank every option and
recommend exactly one.

## The four implementations (verified against source 2026-08-27)

1. `@orkestrel/server` `src/server/helpers.ts` — `encodeBase64`/`decodeBase64` (RFC 4648 §4,
   padded, built on `btoa`/`atob`) plus `encodeBase64Url`/`decodeBase64Url` routed through
   them. Landed this week (commit 33b39c7) as a campaign carry. server is Node-only, layer L3.
2. `@orkestrel/mcp` core — no byte codec: inline `atob` at `helpers.ts:1240` and `btoa` at
   `helpers.ts:1278` (the `=?base64?...?=` header sentinel), plus the strict validator
   `isStandardBase64` (`validators.ts:173`, "standard padded base64 as required by JSON
   Schema byte format") used for blob/image/audio content validation. mcp core must stay
   browser-safe. Layer L3.
3. `@orkestrel/browser` core `helpers.ts:107-150` — hand-rolled table-based pair (no
   `atob`/`btoa`/`Buffer`): padded standard-alphabet **encoder**; **lenient decoder** (strips
   every non-alphabet character, ignores padding, never throws). Used in six core files (HAR,
   locator, network, page, route). browser's charter is CDP automation, core face
   environment-agnostic.
4. `@orkestrel/msg` — `decodeBase64` `(text: string) => Uint8Array` (guide `msg.md:179`);
   **no encoder, no base64url**. Charter (guide `msg.md:11-15`): "pure-ES encoding layer
   (Base64, UTF-8, Latin-1, Windows-1252, quoted-printable, RFC 2047 encoded words)... so
   the whole surface stays usable in the core's DOM/Node-free environment." Registry: 0.0.8,
   zero dependencies, description "zero-dependency Outlook .msg (CFB/OLE2) and .eml (RFC
   2822/MIME) email parser... Part of the @orkestrel line." Layer L0 leaf. No local checkout;
   guide mirror and registry reading are the sources.

## Constraint set (measured)

- A shared home must be browser-safe (mcp core imports it), must not depend on mcp or server
  (cycle), and must sit at catalog layer L2 or below (mcp and server are both L3; a
  same-layer runtime dep inverts the publish round order).
- Runtime deps mcp and server already share: `contract` (L0, dependency-free; charter:
  "runtime type guards, guard combinators, flat parsers, and a shape DSL") and `emitter`
  (L1, typed event emitter).
- Fleet L0 leaves: `contract`, `msg`, `sse`, `test`. Nothing at or below L2 depends on mcp
  or server, so no cycle risk exists anywhere in the band.
- Semantics differ today: server's decoder throws `DOMException` on malformed input; mcp
  validates strictly before its inline `atob`; browser's decoder is lenient by design (CDP
  payloads are trusted); msg's decoder semantics are documented only as `(text) => Uint8Array`.
- Every fleet package is 0.0.x with caret-pins-exact semantics: adding a runtime dep to mcp
  or server couples their release waves to the home package's releases.

## Options to rank (all of them, no additions, no omissions)

- **A. msg** — the codec moves to `@orkestrel/msg`, whose charter already names Base64 in a
  pure-ES encoding layer; msg gains `encodeBase64` (+ base64url pair); mcp, server, and
  (optionally, later) browser converge on it.
- **B. browser** — `@orkestrel/browser` core already ships both directions; mcp and server
  import from it.
- **C. contract** — `@orkestrel/contract`, the one L0 package both already depend on; the
  codec joins the validation/parsing surface beside `isUint8Array`.
- **D. new leaf package** — a new `@orkestrel` L0 package purpose-built for byte codecs
  (base64, base64url, possibly the UTF-8 helpers), which everything converges on over time.
- **E. status quo** — no shared home: server keeps its pair, mcp keeps its sentinel inlines +
  validator, browser keeps its lenient pair, msg keeps its decoder. Duplication accepted as
  locality.

## The lanes

- **Subjective lane** argues shape, taste, naming, ergonomics, design fit: what does each
  option do to the meaning of the package that hosts it, to the dependency story a consumer
  reads in a manifest, and to the fleet's coherence? Is an email parser a codec home? Is a
  CDP package? Does the codec dilute contract's charter? What would you WANT the manifest
  line to say?
- **Objective lane** argues correctness and constraints: layer math, browser-safety of each
  option's actual face, decoder-semantics reconciliation (strict vs lenient vs throwing — can
  one codec serve all four consumers without behavior change?), release-wave coupling costs,
  bundle cost to mcp core, migration surface (which files change in which packages, which
  releases cascade), and what the guides/registry leave unknown.

## Output shape (both lanes)

- Ranking: every option A-E, scored, one paragraph of reasoning each through YOUR lane only.
- Winner: exactly one option.
- Steelman: the strongest argument for the runner-up you did not pick.
- Consequences: for your winner — which packages change, what their releases couple to, what
  the migration touches; name the risk you cannot rule out.
- Unknowns: facts missing from this brief that your lane needed.

No process diary. Do not hedge the winner: pick one.
