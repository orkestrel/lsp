# Acceptance: M6 — the mcp naming cascade

Accepted by the Orchestrator on 2026-08-26 at `aa20c37`, closing the M wave: M4 accepted
(`m4-acceptance.md`), M5 closed with no code change under the user's no-deprecation
ruling (`m5-closure.md`), M6 accepted here.

The basis:

- The m6-naming unit (Opus implementer, baseline `11c879c`) landed the ruled cascade —
  `SUPPORTED_PROTOCOL_VERSIONS` to `SUPPORTED_MODERN_PROTOCOL_VERSIONS`,
  `SUPPORTED_CLIENT_PROTOCOL_VERSIONS` to `SUPPORTED_MCP_VERSIONS`,
  `MCP_PROTOCOL_VERSION` to `MCP_HANDSHAKE_VERSION`, `MCP_LEGACY_VERSION` to
  `MCP_FALLBACK_VERSION` — with the `MCPLegacy` family and
  `MCP_PROTOCOL_VERSION_HEADER` untouched, no alias or shim, and `tests/mirrors/`
  vendored bytes intact. Record: `m6-naming-brief.md`, `m6-naming-report.md`.
- The Orchestrator repaired the one false TSDoc sentence the unit flagged
  (`MCP_FALLBACK_VERSION`), under the ruling recorded in the campaign ledger; the ruled
  name stays.
- The Orchestrator's own gates before commit, each exit 0: the zero-residual
  word-boundary greps, `check`, `format:check`, `lint:check`, guides `144 passed`,
  conformance `42 passed`.
- The checker lane (Sonnet, an engine the writer and the Orchestrator do not share for
  the Orchestrator-authored sentence) returned PASS on every claim:
  `m6-checker-verdict.md`.
- The reviewer lane did not run this round: the subject is a mechanical rename whose
  acceptance criteria are population greps and gate readings, the subjective naming
  judgment was already taken as the delegated M6 ruling recorded in the routing ledger,
  and the checker plus the Orchestrator's own gate evidence close it. Recorded here per
  the audit step's requirements.

`package.json` is untouched; the version bump the moved published surface obliges runs
with the release, per the publish skill. The mcp fleet verifier runs next for the exit
criterion.
