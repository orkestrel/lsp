# Verdict: m6-checker — mechanical closure of the M6 naming cascade

Lane: `checker` (Sonnet, read-only), 2026-08-26, on the landed commit `aa20c37` in
`/home/user/mcp`, from the brief at `.orkestrel/mcp/m6-checker-brief.md`. The claim-9
sentence is Orchestrator-authored, so this lane is its independent audit. Evidence
supplied: the commit diff (`m6-evidence-diff.txt`) and the empty post-commit status.

1. CONFIRMED — the word-boundary grep for every old spelling over `src` and
   `guides/mcp.md` returns nothing; the `tests` minus `tests/mirrors/` population reads
   zero in the unit's own grep and in the Orchestrator's independent pre-commit grep.
2. CONFIRMED — `MCP_PROTOCOL_VERSION_HEADER` declared unchanged at
   `src/server/constants.ts:27` and `src/browser/constants.ts:22`; neither file is in
   the diff.
3. CONFIRMED — the four new names declared at `src/core/constants.ts:15`, `:18`, `:31`,
   and `:42`; every `{@link}` in `src/core/inferers.ts:11` and
   `src/core/validators.ts:1338`/`:1348` resolves to a new spelling.
4. CONFIRMED — no `MCPLegacy` family identifier appears on an added or removed diff
   line; every occurrence sits in unchanged context.
5. CONFIRMED — no `@deprecated` tag and no re-export or alias of any old spelling under
   `src`, and the zero-residual sweep covers `tests` and `guides`.
6. CONFIRMED — `tests/mirrors/` appears in no diff header.
7. CONFIRMED — `package.json` appears in no diff header and the tree is clean; the bump
   stays with the release.
8. CONFIRMED — the modern set's TSDoc names the modern set alone
   (`src/core/constants.ts:24`), and the combined set's TSDoc names the `isMCPVersion`
   guard, whose body reads `SUPPORTED_MCP_VERSIONS.some(...)` at
   `src/core/validators.ts:1340-1341`.
9. CONFIRMED — the fallback sentence is true of the code: `MCP_FALLBACK_VERSION` is a
   member of `SUPPORTED_LEGACY_PROTOCOL_VERSIONS` (`constants.ts:36-39`), an adapter
   pins it through `MCPLegacyClientTransportOptions.version` (test evidence at the
   `createMCPLegacyClientTransport(transport, { version: MCP_FALLBACK_VERSION })`
   sites), and the unsupported-revision fallback resolves to `MCP_HANDSHAKE_VERSION` at
   `src/server/inferers.ts:145` and `src/core/helpers.ts:1081`.

VERDICT: PASS
