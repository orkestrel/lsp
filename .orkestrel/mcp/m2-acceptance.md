# M2 acceptance evidence

Subject: the M2 input-continuation unit, committed as mcp `fa11c89` on the
`claude/lsp-spec-audit-est33d` branch, 2026-08-26. Baseline was mcp `a6b319c` with a clean
tree. The status at capture listed exactly the owned files: `guides/mcp.md`,
`src/core/MCPClient.ts`, `src/core/types.ts`, and `tests/src/core/MCPClient.test.ts`;
`tests/guides.test.ts` was granted and lawfully unedited because existing parity coverage
accepted the guide edit.

## Host gate chain

The Orchestrator's independent run over the uncommitted tree (`m2-host-gates.sh`,
2026-08-26): `format:check` exit 0, `lint:check` exit 0, `check` exit 0, `build` exit 0,
`npm test` exit 0, terminal line `GATE_CHAIN_GREEN`. The run settles the two claims the unit
flagged for host verification: the `src:core` project passed with the loopback HTTP rows the
bench sandbox refused, and the guides project passed in full (139 passed) with the stdio
transcription rows the bench's grandchild-stdio limit made unmeasurable there.

## Unknowns closed in-unit

- The legacy adapter transits the continuation pair: `modernInvocationToLegacy` copies every
  top-level parameter that is not `_meta` (`src/core/helpers.ts:850-865`), read before any
  edit.
- The guide's continuation section had the wire contract and no client retry; the fence at
  `guides/mcp.md:1177` closes that gap.

## Open at capture

The audit lane over M2 (native Opus `reviewer` — the engine that did not write the unit)
rules on the report against the committed diff; its verdict lands beside this file.
