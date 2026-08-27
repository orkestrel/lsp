# codec-home subjective lane — returned report (planner, Opus 5, clean context)

## Ranking (shape, taste, naming, ergonomics, design fit)

**D. New leaf package — 9/10.** The only option where the manifest line reads correctly to a
stranger. The fleet's taste is settled and visible: 49 packages, one noun each, one job each —
abort, timeout, budget, sse, csv, ndjson, html. Three of those are smaller in concept than a
Base64 codec; recent leaves prove the fleet adds packages without ceremony. "Too small for its
own package" is an objection this fleet has already overruled forty times. Three of the four
existing implementations independently converged on `encodeBase64`/`decodeBase64` — the fleet
telling you the concept is shared and its name settled. Wanted manifest line:
`"@orkestrel/codec": "^0.0.1"`; wanted charter: byte<->text codecs, pure ES — RFC 4648 §4 and
§5, plus UTF-8; no `btoa`/`atob`, no `Buffer`. Taste risk: the name's gravity (see risks).

**C. contract — 6/10.** Unbeatable on ergonomics and nothing else. 44 of 49 manifests already
declare contract; zero new edges. Half the codec fits (`parseBase64` is textbook contract
doctrine, and mcp's `isStandardBase64` is a JSON-Schema-format validator marooned in a
protocol package). But the encode half has no family: the guide's spine is `is*` / `*Of` /
`parse*`, and `encodeBase64` is a fourth thing — a formatter. Contract has visibly been
DEFENDED, down to an INTRINSICS table naming every host operation it dispatches; a codec
breaks that doctrine either way it is built. What goes into contract goes into 90% of the
fleet's dependency closure while four packages want base64. The manifest line stays clean; the
charter line stops being true — and the charter line is what a reader trusts.

**E. Status quo — 4/10.** More defensible than it gets credit for: the four implementations
are four different CONTRACTS wearing one name (throwing / strict-validating / lenient /
undocumented), and unifying four contracts under one signature is how you get an abstraction
that lies to three of its callers. What sinks it: a fleet that extracted `abort` and `timeout`
into standalone leaves does not get to plead locality on its fourth copy of RFC 4648.

**A. msg — 3/10.** Mechanically cheapest, semantically most misleading, permanently. msg's
charter sentence is load-bearing and INTERNAL: the encoding layer exists "so the whole surface
stays usable in the core's DOM/Node-free environment" — a justification for an email parser's
implementation choice, not an offer of a codec service. Nobody has ever added an email parser
to get Base64. Every consumer's reader loses a minute to a question with no interesting
answer, forever. The tell: to make A comfortable you would split msg's encoding layer out —
and the moment you split it out, A IS D. A is D done dishonestly, with the extraction skipped
and the confusion capitalized into the dependency graph.

**B. browser — 1/10.** Wrong on every axis this lane owns. mcp depending on browser states,
in the one line a consumer reads, that MCP needs a browser — a flat falsehood dragging html
and websocket behind it. And it would publish as a GENERAL codec a decoder whose leniency is a
domain judgment (helpers.ts:107 strips every non-alphabet character, ignores padding, never
throws — correct for trusted CDP payloads, a silent-corruption footgun as a fleet primitive).
Leniency chosen for one trust model must not be exported as everyone's contract.

## Winner

D — a new `@orkestrel` L0 leaf, named `@orkestrel/codec`.

## Steelman for the runner-up (C)

Reframe the codec as a CROSSING rather than a transform and the dilution charge inverts:
contract's own mission is "validation is where untrusted data crosses into typed code," and
decoding Base64 IS that crossing — untrusted text becoming trusted bytes — the one such
crossing contract currently declines, despite shipping `isUint8Array` on one side and
`parseJSON` on the other. C also repatriates `isStandardBase64` as `parseBase64`'s guard
partner, and is the only option unifying four implementations with zero new edges, no new
repo, no new guide, no 50th package. If the fleet's scarce resource is package count and
coordination surface rather than charter purity, C wins outright.

## Consequences of D

- New: `@orkestrel/codec` repo, L0, zero deps, guide, catalog entry. Changed: mcp (one
  manifest line; sentinel inlines at helpers.ts ~1240/~1278 replaced; `isStandardBase64`
  STAYS — strict pre-check is MCP protocol policy); server (one manifest line; the four
  helpers replaced — they are substrate for signToken/verifyToken, which stay).
- Release coupling: mcp 0.0.27 + server 0.0.17 take codec ^0.0.1; every codec patch obliges
  their republish and the downstream layer order (probe behind mcp, toolbox behind server).
  RFC 4648 has not changed since 2006; the release count should approach one.
- browser's six call sites migrate ONLY if the leaf ships a NAMED lenient variant
  (`decodeBase64Lenient`); silently swapping a forgiving decoder for a throwing one is a
  behavior change dressed as a refactor.
- Risk that cannot be ruled out: THE LEAF STRANDS. If browser and msg never converge, the
  fleet has five implementations where it had four, and the package's justification becomes a
  promise about a migration nobody scheduled. Second-order: the name's gravity — `codec`
  invites hex, percent-encoding, UTF-16, JSON canonicalization. Ship a written membership
  bar (byte<->text codecs with a named RFC/WHATWG spec; no domain formats, no parsers) or
  narrow the name to `@orkestrel/base64`.

## Unknowns (as returned)

Written admission bar for new packages (inferred from behavior, not policy); msg's decoder
semantics (no checkout; refused to guess); migration ownership and whether browser is in or
out; whether a lenient variant is wanted in the shared surface at all; repo-count/maintenance
budget — the one number that could move C above D.

71,122 tokens, 21 tool uses, 225s.
