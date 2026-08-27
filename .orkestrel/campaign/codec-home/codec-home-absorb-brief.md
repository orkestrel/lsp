# Unit: codec-home-absorb — fleet guide survey for the Base64 codec placement ruling

Role: grok (Cursor Grok, ask mode). Read-only. You perform this reading yourself and spawn
nothing. Return evidence only — no recommendation, no decision, no design.

## Question

Which `@orkestrel/*` packages have a charter that could genuinely host a shared byte-level
Base64 codec, and what does every package's guide say that rules it in or out?

## Context

The artifact being placed is a pure, dependency-free byte<->string Base64 codec:
`encodeBase64`/`decodeBase64` (RFC 4648 §4, standard alphabet, padded) plus base64url
variants, built on the isomorphic globals `btoa`/`atob` (browser and Node >= 16). It exists
twice today: `@orkestrel/server` ships it in `src/server/helpers.ts` (Node-only HTTP server
library), and `@orkestrel/mcp` keeps a private sentinel codec in core because mcp's browser
face cannot depend on the Node-only server package.

A viable home must be: browser-safe (no `node:` imports on the face mcp core would import),
free of dependency cycles (must not depend on `@orkestrel/mcp` or `@orkestrel/server`), and
charter-fitting — the codec must belong to what the package IS, not sit there as a utils dump.
For reference: mcp core's runtime deps are contract, emitter, process, sse, tool, websocket;
server's are abort, contract, emitter, router, timeout.

## Scope

Read every guide mirror in `C:/Users/mikes/WebstormProjects/scaffold/guides/` EXCEPT
`README.md`, `scaffold.md`, `mcp.md`, `server.md` — that is 46 files: abort, agent, brief,
browser, budget, console, contract, csv, database, emitter, form, guide, html, indexeddb,
interpret, lsp, markdown, middleware, msg, ndjson, ollama, pool, probe, process, program,
qualifier, queue, rater, reason, relation, router, sea, sqlite, sse, table, template,
terminal, test, timeout, tool, toolbox, websocket, worker, workflow, workspace.

These mirrors are the authoritative surface documentation for each published package. Do not
read anything outside that directory. Make no edits anywhere.

## Evidence sought

For EVERY package, one compact row:

- charter: one sentence, what the package IS, distilled from the guide's opening.
- environment: browser-safe / node-only / isomorphic / unstated — with the guide line
  (`file:line`) that proves it (a `node:` import in examples, a stated browser face, a
  stated runtime posture).
- codec surface: any existing encoding/decoding/byte-level symbols the guide documents
  (search terms: base64, encode, decode, bytes, Uint8Array, binary, codec) — name the
  symbols with `file:line`, or state none.
- dependency note: any runtime dependency on `@orkestrel/mcp` or `@orkestrel/server` the
  guide reveals (cycle evidence), or none visible.

Then a candidates section: the packages whose charter language could cover a shared byte
codec, each with the exact quoted charter sentence and `file:line`. Include borderline cases
with the quote that makes them borderline. Do not rank, do not recommend.

## Output shape

- Question: one line.
- Evidence: the per-package rows, compact, every claim with `file:line`.
- Candidates: quoted charter evidence per candidate, no ranking.
- Unknowns: anything a guide leaves unstated that the ruling would need.

No raw file dumps. No process diary. No recommendation.
