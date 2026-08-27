# MCP readiness campaign — final report

Campaign run 2026-08-27 across `@orkestrel/mcp`, `@orkestrel/probe`, and the lsp-in-probe
integration, against MCP specification revision `2026-07-28`. The registry (`registry.md`)
holds the full routing ledger; the plan (`plan.md`) holds the reconciled design and its
rejections of record.

## Outcome

The exit criterion is met, pending the independent verifier's gate table (V1, recorded in
this file's closing section when it returns).

- **Conformance**: the server suite went from the recorded `74 passed, 21 failed` baseline
  (M0, failing-first) to `110 passed, 0 failed`, and the client harness (MC) runs every
  non-auth scenario green. The `auth/*` client scenarios are excluded and declared: the
  package implements no OAuth client (guide Declared non-goals, conformance TSDoc, executed
  presence proof).
- **Standard headers (MUST)**: `Mcp-Name` on `tools/call`, `resources/read`, and
  `prompts/get`; the Base64 sentinel codec (`encodeSentinel` / `decodeSentinel`, routed
  through the existing `isStandardBase64`); modern refusal codes; both HTTP client faces
  stamp through the encoder (M1).
- **`x-mcp-header` (MUST for HTTP clients)**: derive-from-traffic projection with
  violating-tool exclusion on both HTTP faces; server-side anti-forgery validation through a
  per-call synthetic `tools/list` (M2), later hardened with a bounded `nextCursor` walk
  (`MCP_LOOKUP_PAGES`, M2F) and lineage-stamped caching that no arrival order can corrupt
  (M2F2).
- **MRTR**: multi-request rounds, sampling and roots kinds, consumer keys, per-kind
  `-32021` gating (M-input), the conformance fixture family (MF), and the stateless retry
  seam (MF2).
- **WebSocket**: closed-channel sends reject on every face — browser client, server carrier
  (M3), and the Node client face including the handshake-`head` close window (M3F); the
  browser pre-open queue is discarded at close (M5).
- **stdio**: the ingress contract is named (`StdioServerInterface`, M4) and its lifetime
  claims are standing tests (M5).
- **Guide honesty**: every declared-gap entry ruled against shipped code; the `MCPLegacy`
  modern-only-surfaces consequence, the M8 fail-closed departure, the stdio signal-first
  posture, `createMCPContinuation` as the `requestState` protector, the
  `MCPLimitOptions.keys` both-uses correction, and the `buildModernResult` SHOULD departure
  all stated (M5).
- **probe**: `prove` returns `structuredContent` beside the text block through both eras
  (P1), bounds centralized (P2), the renamed lsp surface adopted through the tarball swap
  with a real-oxlint proof (P3), and the graduated fallback makes "the receipt always
  answers" true at every size (P4).
- **lsp-in-probe**: the push path is proven against the real spawned oxlint child with a
  coded diagnostic; the pull path is proven at client level against a protocol-faithful
  framing fixture (G-L). The rename adoption runs in probe through the swap tarballs today.

## The audit record

Every round ran adversarially with at least one lane on an engine that did not write the
work (Grok as the recorded Sol substitute, per the standing user directive), clean-contexted
and worktree-isolated. Every round until the last found something real; the final focused
check returned PASS with nothing broken, nothing unresolved, and nothing not-evidenced —
the convergence point. Sharp findings were Orchestrator-reproduced before entering a fix
brief. Verdicts: `ap-*`, `am-*`, `am1`–`am3`, `amf2`, `am23f`, `am2f2`, `ap4` in this
folder.

## Deliberate exclusions (rejections of record)

From `plan.md`: `outputSchema` and annotations on `prove` (no field in `@orkestrel/tool`);
`MCPLegacy` widening; legacy `Last-Event-ID` resume; the `MCPClientTransportInterface`
rename (surfaced as an option, not taken); a `Session` byte face for mcp stdio; a second
language server in probe; the mcp-builder evaluation XML; unary-HTTP cancellation
(structural, declared); the M8 re-request SHOULD (fail-closed departure, declared); the
conformance `alpha.10 → alpha.11` bump (the user's call; `alpha.10` carries every needed
scenario).

## Carried findings, outside this campaign's scope

- SEP-2663: a future tasks namespace would extend `Mcp-Name` scope.
- Dead-peer WebSocket liveness needs an RFC 6455 ping/pong deadline; the guide states the
  bound.
- A standard padded-Base64 codec is an upstream candidate for `@orkestrel/server`, which
  ships base64url only; the browser face's need kept the codec in mcp core.
- The publish canon assumes a dist-independent `check`; mcp's `check` reads `dist/`, so
  `prepublishOnly` runs `build` before `check` (MC's measured reorder) — a fleet-level canon
  tension.
- Pre-existing nested functions (recorded during audits, outside every unit's scope).
- lsp suite gaps: `identifier` forwarding, unchanged-with-prior-`resultId` reuse, and pull
  across real child stdio are unproven in lsp's own suite.
- The scaffold complexity-rule prompt from the earlier campaign stays user-owned.

## The release wave (the user's decision)

Nothing publishes without the user. The prepared order, from `tarball-swap-probe.md` and the
layer rules:

1. `process` publishes `0.0.7` (the Session face).
2. `lsp` restores `@orkestrel/process` to `^0.0.7`, re-runs gates, bumps, publishes.
3. `mcp` re-pins process `^0.0.7`; its own surface moved substantially this campaign
   (headers, MRTR, WebSocket, stdio contract, the `x-mcp-header` system), so it bumps and
   publishes on its own account.
4. `probe` drops the `overrides` entry and the `file:` lsp range, re-pins the registry
   releases, re-runs its gates against registry artifacts, bumps, publishes.

Until then probe runs against the swap tarballs under `tmp/tarballs/` (git-ignored, swept at
the wave).

## Remaining risk

- The client projection cache survives a `close()`/`start()` cycle by the existing contract;
  a consumer that re-listing-refreshes after reconnect is unaffected, and the server-side
  walk remains the validation authority either way.
- The bounded lookup's residual: a replacement `tools/list` paging a tool beyond
  `MCP_LOOKUP_PAGES` leaves its headers forwarded untouched — stated in the guide as the
  residual limit.
- Bench audit lanes ran in ask mode (no execution); behavioral evidence came from
  failing-first records and Orchestrator-executed run records, with the independent verifier
  as the authoritative tree-wide reading.

## Gate evidence (V1, independent verifier, 2026-08-27)

mcp at `afca2f8`, clean before and after the chain, every gate exit 0: `format:check` (218
files), `lint:check`, `build`, `check` (all four projects), and `npm test` — src 1330 passed,
policy 93, config 46, setup 86, guides 149, conformance 47, integration 4.

probe at `d6e5750`, clean before and after the chain: `lint:check`, `build`, `check`, and
`npm test` all exit 0 (src 216 passed with 10 environment-skips, policy 93, config 46, setup
3, guides 13). `format:check` alone failed: the tarball-swap edit had landed the `overrides`
block out of key order in `package.json`. The Orchestrator applied the formatter
(`oxfmt --write package.json`, a key reorder with no content change), committed probe
`59bae32`, and the deciding `format:check` re-read is green on 159 files. One anomaly
recorded: an expected stderr line from the RuntimeStage bad-config probe inside an all-pass
suite.

Both chains are green. The campaign is accepted; the release wave is the open decision.
