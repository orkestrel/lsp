# Unit: codec-inventory — every encode/decode surface in the @orkestrel fleet

Role: grok (Cursor Grok, ask mode). Read-only. Perform this reading yourself and spawn
nothing. Return evidence only — no recommendation, no charter proposal, no ranking.

## Question

What does every `@orkestrel` package currently encode, decode, escape, or otherwise
reversibly transform, and what are the exact semantics of each such surface?

## Context

The fleet is standing up a new L0 leaf, `@orkestrel/codec`, whose charter will own
spec-backed reversible data transforms (the settled first resident: the RFC 4648 Base64
family). The charter decision needs a complete inventory of everything in the fleet that
LOOKS like a codec, so a later pass can rule what moves in, what converges later, and what
stays out. Operative words: encode, decode. Synonyms to sweep: escape, unescape, serialize,
deserialize, stringify, entities, sentinel, base64, base64url, utf8/utf-16/latin/windows-1252,
charset, hex, percent, uri/url-encode, quoted-printable, varint, frame codec, TextEncoder,
TextDecoder, btoa, atob, charCodeAt/fromCharCode loops.

A seed exists: `C:/Users/mikes/WebstormProjects/lsp/tmp/cursor/prior-codec-surface-rows.md`
holds a prior per-guide survey with codec-surface rows. Use it to aim, then go deeper.

## Scope

Two source classes, in this priority:

1. Local source checkouts (read the actual implementations):
   `C:/Users/mikes/WebstormProjects/<name>/src/` for: agent, browser, console, guide, html,
   lsp, markdown, mcp, probe, process, sea, server, terminal, test, websocket, worker,
   workflow. Sweep for the operative words and synonyms above; read each hit enough to state
   its semantics.
2. Guide mirrors in `C:/Users/mikes/WebstormProjects/scaffold/guides/` for every package with
   NO local checkout (msg especially — its guide documents a pure-ES encoding layer: Base64,
   UTF-8, Latin-1, Windows-1252, quoted-printable, RFC 2047 encoded words; also csv, sse,
   ndjson, router, database, contract, workspace, middleware, toolbox and the rest).

Do not read tests except where a fixture is the only statement of leniency/strictness. Make
no edits anywhere.

## Evidence sought — one row per transform surface

- symbol(s) and package, with `file:line` (source preferred, guide line where no checkout).
- transforms WHAT to WHAT (e.g. bytes<->base64 text; HTML text<->character references;
  keypress bytes->key event; JS value<->SQLite storage value).
- spec, if one is named or evident (RFC 4648, WHATWG, RFC 2045 quoted-printable, RFC 6455,
  ECMA-404...), or 'none/domain'.
- direction: pair (both ways), encode-only, decode-only.
- semantics: strict (rejects malformed) / lenient (repairs or skips) / throwing (and what
  type) / total (returns undefined) — as the code or guide states.
- environment: browser-safe / node-only, judged by imports at the implementation site.
- stateful or stateless (a streaming parser with carry-over state is stateful).
- coupling: what else in its module the symbol drags along if imported (module graph note),
  and whether the surface is exported/published or internal.

Aim for completeness over polish: a missed transform surface is the failure mode, a terse row
is fine. Group rows by package.

## Output shape

- Question: one line.
- Inventory: the rows, grouped by package.
- Clusters: purely descriptive grouping of the rows by transform kind (byte<->text codecs,
  charset decoders, structural escapes, protocol framing, value mapping, ...) with the rows
  each cluster holds. No ranking, no recommendation.
- Unknowns: packages or symbols whose semantics could not be read, and why.

No raw dumps. No process diary. No recommendation.
