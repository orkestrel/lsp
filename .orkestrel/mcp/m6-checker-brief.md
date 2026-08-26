# Unit brief: m6-checker — mechanical closure of the M6 naming cascade

## Role and engine

`checker` — Sonnet, native subagent, read-only (Read, Grep, Glob; no Write, no Bash). You
perform the assignment directly yourself and spawn nothing.

## Objective

A per-claim verdict over the m6-naming unit's mechanical acceptance criteria, on the
landed commit `aa20c37` in `/home/user/mcp`.

## Context

- The subject: `/home/user/lsp/.orkestrel/mcp/m6-naming-report.md` (the unit's report) and
  `/home/user/lsp/.orkestrel/mcp/m6-naming-brief.md` (its brief).
- Supplied evidence, because your allowlist has no Bash: the full commit diff at
  `/home/user/lsp/tmp/units/m6-evidence-diff.txt` and the post-commit
  `git status --short` output at `/home/user/lsp/tmp/units/m6-evidence-status.txt`
  (empty — the tree is clean at `aa20c37`).
- The checkout at `/home/user/mcp` is live at `aa20c37`; read it directly for any claim
  the diff alone cannot settle.
- The ruling context: the campaign ledger section "The M6 landing and the
  fallback-sentence ruling, 2026-08-26" in
  `/home/user/lsp/.orkestrel/campaign/routing-2026-08-26-resume.md`. The claim-9 sentence
  was written by the Orchestrator, so your verdict on it is the independent audit the
  acceptance laws require.
- Skill: none. Verdict shape per the `orkestrel-falsify` value set: per-claim
  CONFIRMED or BROKEN with evidence, one terminal `VERDICT:` line.

## The claims

1. A word-boundary search for each old spelling — `SUPPORTED_PROTOCOL_VERSIONS`,
   `SUPPORTED_CLIENT_PROTOCOL_VERSIONS`, `MCP_PROTOCOL_VERSION`, `MCP_LEGACY_VERSION` —
   over `src/`, `tests/` excluding `tests/mirrors/`, and `guides/mcp.md` returns nothing,
   with `MCP_PROTOCOL_VERSION_HEADER` exempt as its own word.
2. `MCP_PROTOCOL_VERSION_HEADER` is declared unchanged at `src/server/constants.ts:27`
   and `src/browser/constants.ts:22`, and neither file appears in the diff.
3. The four new names are declared in `src/core/constants.ts`, and every `{@link}`
   reference in `src/core/inferers.ts` and `src/core/validators.ts` resolves to a new
   spelling.
4. The `MCPLegacy` family — `MCPLegacy`, `createMCPLegacy`, `MCPLegacyClientTransport`,
   `createMCPLegacyClientTransport` — is untouched: no class, factory, or type identifier
   appears in the diff.
5. No alias, re-export, wrapper, or `@deprecated` tag exists for any old or new spelling
   anywhere in `src/`, `tests/`, or `guides/`.
6. `tests/mirrors/` is untouched by the diff.
7. `package.json` is untouched by the diff, so the version bump stays with the release.
8. The `SUPPORTED_MODERN_PROTOCOL_VERSIONS` TSDoc names the modern set alone, and the
   `SUPPORTED_MCP_VERSIONS` TSDoc names the `isMCPVersion` guard, which reads that
   constant in `src/core/validators.ts`.
9. The `MCP_FALLBACK_VERSION` TSDoc — "The older legacy revision the optional legacy
   decorator accepts and an adapter can pin." — is true of the code: the constant is a
   member of `SUPPORTED_LEGACY_PROTOCOL_VERSIONS` (the set the optional legacy decorator
   accepts), an adapter can pin it through `MCPLegacyClientTransportOptions.version`, and
   no code path assigns it the unsupported-revision fallback role (that resolves to
   `MCP_HANDSHAKE_VERSION` in `src/server/inferers.ts` and `src/core/helpers.ts`).

## Output

Your final message is the verdict: one numbered row per claim, CONFIRMED or BROKEN with
the exact evidence (path, line, and the text read), and a single terminal line
`VERDICT: PASS` (every claim CONFIRMED) or `VERDICT: FAIL` (any claim BROKEN). No process
diary.
