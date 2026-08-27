# Unit: orkestrel-codec-home — ecosystem evidence for the Base64 codec placement ruling

Role and engine: `orkestrel` (native catalog agent). Read-only. You perform this assignment
directly and spawn nothing.

## Objective

Produce the dependency-position evidence a placement ruling needs: where in the fleet's layer
order a shared byte-level Base64 codec could live such that both `@orkestrel/mcp` (browser-safe
core face) and `@orkestrel/server` could depend on it without cycles or tier inversions.

## Context

The codec: `encodeBase64`/`decodeBase64` (RFC 4648 §4, padded) + base64url variants, pure,
dependency-free, built on isomorphic `btoa`/`atob`. Duplicated today in
`C:/Users/mikes/WebstormProjects/server/src/server/helpers.ts` and (as a private sentinel
engine) in mcp core. mcp's browser face is why it cannot import server.

Local manifests you may read: `C:/Users/mikes/WebstormProjects/mcp/package.json`,
`C:/Users/mikes/WebstormProjects/server/package.json`,
`C:/Users/mikes/WebstormProjects/probe/package.json`,
`C:/Users/mikes/WebstormProjects/lsp/package.json`,
`C:/Users/mikes/WebstormProjects/websocket/package.json`,
`C:/Users/mikes/WebstormProjects/process/package.json`.
Measured facts supplied: mcp runtime deps = contract, emitter, process, sse, tool, websocket
(peers: router, server); server runtime deps = abort, contract, emitter, router, timeout.
Your own catalog table is the layer-order reading; treat it as catalog, not live state, and
say so where it is the only source.

## Evidence sought

1. The layer positions of mcp and server, and the set of packages at or below BOTH their
   dependency tiers (packages either could add or already has as a runtime dep without a
   layer inversion).
2. For each package both already depend on (intersection of their runtime dep sets):
   its own runtime deps and layer, per the catalog.
3. Which fleet packages the catalog shows depending on mcp or server (anything that would
   make a home living above them cyclic).
4. Where low-level cross-cutting primitives currently live in the fleet, per the catalog:
   the layer-0/leaf packages and what each owns.

## Scope

Owned: nothing (read-only). Off-limits: every write. Tools: Read, Grep, Glob only.

## Output

Return as your final message, structured: Positions / Intersection / Dependents-of-mcp-and-server /
Leaf-primitives map / Unknowns. Every claim names its source (manifest path or catalog table).
No recommendation — evidence only.
