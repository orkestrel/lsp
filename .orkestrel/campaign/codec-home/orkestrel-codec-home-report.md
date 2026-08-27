# orkestrel-codec-home — returned evidence (native catalog agent)

## Positions

- `@orkestrel/mcp` — catalog layer L3. Runtime deps (manifest): contract ^0.0.13, emitter
  ^0.0.8, process ^0.0.7, sse ^0.0.5, tool ^0.0.12, websocket ^0.0.10 (peers: router, server).
- `@orkestrel/server` — catalog layer L3. Runtime deps (manifest): abort ^0.0.8, contract
  ^0.0.13, emitter ^0.0.8, router ^0.0.12, timeout ^0.0.8.
- A shared codec home must sit at or below L2 (a same-layer or higher runtime dep inverts the
  publish round order). Band per catalog: L0 = contract, msg, sse, test; L1 = abort, budget,
  csv, emitter, html, indexeddb, ndjson, timeout, tool; L2 = console, database, form, pool,
  process, reason, router, table, template, websocket.

## Intersection

Runtime deps common to both mcp and server: `contract` (L0, no runtime deps, 0.0.13) and
`emitter` (L1, dep contract ^0.0.13, 0.0.8). Catalog-table readings, not re-derived from those
packages' own manifests.

## Dependents of mcp and server

- On mcp: `probe` (^0.0.26, L4) — confirmed in probe's manifest.
- On server: `toolbox` (^0.0.16, L6) — catalog-only, no local checkout.
- Nothing at or below L2 depends on mcp or server: no cycle risk anywhere in the band.

## Leaf primitives

Catalog L0 (no runtime deps): contract 0.0.13, msg 0.0.8, sse 0.0.5, test 0.0.11. Functional
ownership not read in this unit (positional data only).

## Unknowns (as returned)

Additional dependents of contract/emitter not exhaustively cross-referenced; functional
ownership of L0 leaves unread; catalog L3 accuracy vs installed state unverified; transitive
closure of L2 candidates not walked; no live registry reading in this unit.

Sources: local manifests (mcp, server, probe, lsp, websocket, process) + the catalog table in
the role file. 27,821 tokens, 7 tool uses, 43s.
