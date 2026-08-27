A dedicated L0 package (option D) is the home. One decoder function cannot serve mcp, server, browser, and msg without a behavior change; a purpose-built leaf is the only option that stays layer-legal, keeps mcp core off a CDP or email-parser module, and confines a codec bump to the packages that import it.

## Ranking

Scores are 0–10 on layer legality, face safety, decoder-policy fit, release-wave coupling, mcp-core bundle, and migration surface.

1. **Option D — dedicated L0 package — 8.** Catalog layer L0 satisfies the L2-or-below rule. The face can be ES-only (no `atob`/`btoa`/`Buffer`), which is what a host-independent core needs; mcp core already types `atob` through `lib: ["ESNext", "WebWorker"]`, but a shared leaf must not take that host. The leaf can export RFC 4648 §4 encode plus a strict decode (and §5 base64url) for mcp and server, and a separate lenient decode later for browser, so the home does not force one algorithm on every consumer. A codec bump re-pins only the packages that declare the leaf: mcp and server in the first wave, then probe (runtime on mcp) and toolbox (catalog runtime on server). mcp’s peer pin on server moves in the same server bump. That cascade is smaller than a `contract` bump, and it does not couple HTTP/MCP releases to CFB/MIME fixes in msg.

2. **Option C — contract — 6.** Layer L0 and already a runtime dependency of mcp (`^0.0.13`) and server (`^0.0.13`). The published face is core-only and already inside mcp core, so browser-safety of the import graph is proven. Incremental bundle is the codec’s own bytes on a module mcp already loads. `isStandardBase64` is a total guard and `isUint8Array` already lives on this package, so membership can sit on contract without a new edge. A contract bump still republishes every catalog row that lists `@orkestrel/contract`, and then every later layer that pins those packages. Codec defects then move abort, emitter, database, agent, and the rest of that DAG. Contract’s published description and guide name guards, combinators, parsers, and a shape DSL; encode/decode are not that surface, so the guide must be rewritten to stay true. Contract parsers return `undefined` and guards do not throw, so preserving server’s `DOMException` on `decodeBase64('not base64!')` takes a server-side wrapper or a published throw-type change.

3. **Option A — msg — 5.** Layer L0, zero runtime dependents in the catalog, charter names a pure-ES encoding layer including Base64, and the guide claims a DOM/Node-free core. Those facts pass the hard constraints on paper. The guide documents `decodeBase64` only as `(text: string) => Uint8Array` and documents `decodeMIMEEncoding` as throwing `MSGError('MALFORMED')` on invalid Base64 — a different error type than server’s `DOMException` and mcp’s total `undefined`. There is no local checkout and no installed `@orkestrel/msg` in the mcp tree, so decoder leniency, throw vs return, padding, and the helpers module graph are unverified. mcp importing `decodeBase64` from a single `@src/core` barrel can evaluate the whole helpers module that also holds CFB and MIME leaves. After adoption, a CFB bugfix still bumps msg and then mcp and server, even when the codec is unchanged.

4. **Option E — status quo — 3.** No layer violation, no new pin, no bundle change, no throw-type change. mcp’s sentinel path and server’s helpers are the same padded `btoa`/`atob` loop; mcp adds `isStandardBase64` and `attempt` around it. That is a proven semantic match the reuse rule would share. Status quo keeps that duplicate and lets a third copy appear the next time an L3 package needs RFC 4648. It is the only option that leaves browser’s lenient decoder and msg’s MIME decoder untouched, which is also why it does not answer the shared-home question for the pair that already matches.

5. **Option B — browser — 0.** Catalog layer L3, same layer as mcp and server. A same-layer runtime dependency inverts publish order; the constraint set forbids it. The core face is environment-agnostic (table encoder, no `atob`/`btoa`/`Buffer`), but the decoder is lenient: it strips non-alphabet characters, treats padded and unpadded input as equal, and never throws (`helpers.test.ts` pins `'AQ ID\n'` and `'AQ!ID'`). Server’s suite requires `DOMException` on `'not base64!'`. `encodeBase64`/`decodeBase64` live in `src/core/helpers.ts` beside the CDP helper surface, so an import of one function evaluates that module. npm would also install `@orkestrel/html` (not already a mcp runtime dep) plus contract, emitter, and websocket (mcp already has the last three). Call sites: `BrowserRoute.ts`, `BrowserPage.ts`, `BrowserNetworkManager.ts`, `BrowserLocator.ts`, `BrowserHARManager.ts`, and `helpers.ts`.

## Winner

Option D.

## Steelman

Option C is the strongest alternative that does not invent a package. mcp and server already pay `contract`’s release wave; putting the codec there adds no dependency edge and no extra install. The bytes land in a module mcp core already bundles. `isStandardBase64` is kind-correct beside `isUint8Array`. The fleet already accepted that a contract fix republishes the DAG; a codec fix would ride a topology that exists. That argument still loses: it uses the foundation package’s bump to ship a transform the package does not claim, and it makes a codec defect a fleet event rather than an mcp/server event.

## Consequences

First wave: stand up the L0 package (repo, scaffold target, catalog row, `0.0.1` publish), then mcp and server declare it and delete their local `btoa`/`atob` loops.

- **mcp** — `package.json` runtime dep; `src/core/helpers.ts` `encodeSentinel`/`decodeSentinel` (the `btoa` at the sentinel encode and the `atob` inside `attempt`); sentinel tests; `guides/mcp.md`. `isStandardBase64` in `validators.ts` can stay: it is JSON Schema `byte` membership for blob/image/audio and the sentinel payload, which is MCP protocol policy, not the transform. Call sites of that guard stay in `validators.ts`.
- **server** — `package.json` runtime dep; `src/server/helpers.ts` `encodeBase64`/`decodeBase64`/`encodeBase64Url`/`decodeBase64Url` (token sign/verify call the url pair); `tests/src/server/helpers.test.ts`; `guides/server.md`. The documented `DOMException` throw does not survive a table decoder.
- **probe** — re-pin `@orkestrel/mcp` after mcp publishes.
- **toolbox** — re-pin `@orkestrel/server` after server publishes (catalog runtime edge; no local checkout here).
- **browser** — no first-wave change; keep the lenient pair in `src/core/helpers.ts`.
- **msg** — no first-wave change; MIME `MSGError('MALFORMED')` stays local.

Caret-pins-exact on `0.0.x` means every later codec fix republishes mcp and server and then probe and toolbox. It does not republish the contract DAG.

Risk that cannot be ruled out: a table-based strict decoder disagrees with `atob` on an input `isStandardBase64` accepts, or `atob` accepts an input the guard rejects and a caller bypasses the guard. No cross-fixture matrix against Node’s `atob` and the browser table decoder exists in this brief.

## Unknowns

- msg `decodeBase64` body: padding, whitespace, invalid-alphabet handling, throw vs return, and whether `decodeMIMEEncoding` is the only throwing wrapper. Guide signature only; no checkout; not installed under mcp.
- msg `helpers.ts` module graph and published `dist/` size, so mcp-core bundle cost of option A is unmeasured.
- contract core `tsconfig` `lib` in source (the installed tarball ships `dist/src` only). Whether `atob` would typecheck in contract core is unverified; the published declarations contain no Base64 codec (`encodeLeaf` is JSON, not Base64).
- Name, repo, and catalog-admission process for another L0 leaf.
- Exact toolbox manifest and pin (catalog lists `@orkestrel/toolbox` on server `^0.0.16`; no local checkout).
- Whether mcp’s public `isStandardBase64` has consumers outside mcp. lsp does not import it; other fleet trees were not searched.
