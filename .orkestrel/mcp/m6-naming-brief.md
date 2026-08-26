# Unit brief: m6-naming — the mcp naming cascade under the delegated ruling

## Role and engine

`implementer` — Opus 5, native subagent. You write in `/home/user/mcp`, the sole writer in
that checkout, from the clean committed baseline named under Unknowns on branch
`claude/lsp-spec-audit-est33d`. You perform the assignment directly yourself and spawn
nothing.

## Objective

Land the ruled rename set — every declaration, consumer, test, and guide row in one change —
with the scoped gates green. The published surface moves; the version bump itself is not
yours (the release owns it).

## Context

- Read before editing: `/home/user/mcp/AGENTS.md`; `/home/user/mcp/.claude/rules/` —
  `names.md`, `typescript.md`, `writing.md`, `documentation.md`; no skill (explicit none).
- The ruling and its reasoning: `/home/user/lsp/.orkestrel/campaign/routing-2026-08-26-resume.md`
  § "The M6 ruling, taken under the delegated final say". The findings behind it:
  `/home/user/lsp/.orkestrel/mcp/m-audit-reviewer-verdict.md` 8b and
  `/home/user/lsp/.orkestrel/mcp/m7-chain-audit-reviewer-verdict.md` F3.
- The rename map, exact old → new:
  - `SUPPORTED_PROTOCOL_VERSIONS` → `SUPPORTED_MODERN_PROTOCOL_VERSIONS`
  - `SUPPORTED_CLIENT_PROTOCOL_VERSIONS` → `SUPPORTED_MCP_VERSIONS`
  - `MCP_PROTOCOL_VERSION` → `MCP_HANDSHAKE_VERSION`
  - `MCP_LEGACY_VERSION` → `MCP_FALLBACK_VERSION`
- The refused rename: the `MCPLegacy` family (`MCPLegacy`, `createMCPLegacy`,
  `MCPLegacyClientTransport`, `createMCPLegacyClientTransport`) keeps its names. Touch no
  class, factory, or type identifier.
- Measured populations at `11c879c`, word-boundary grep over `src`, `tests` (excluding
  `tests/mirrors/`), `guides`, `configs`:
  - `SUPPORTED_PROTOCOL_VERSIONS`: `guides/mcp.md` 4, `src/core/MCPClient.ts` 2,
    `src/core/MCPServer.ts` 2, `src/core/constants.ts` 2, `src/core/helpers.ts` 2,
    `src/core/inferers.ts` 3, `src/core/validators.ts` 3, and test hits in
    `MCPClient.test.ts` 2, `MCPServer.test.ts` 3, `inferers.test.ts` 4,
    `integration.test.ts` 2, `validators.test.ts` 2.
  - `SUPPORTED_CLIENT_PROTOCOL_VERSIONS`: `guides/mcp.md` 2, `src/core/constants.ts` 1,
    `src/core/validators.ts` 3, `validators.test.ts` 2.
  - `MCP_PROTOCOL_VERSION`: `guides/mcp.md` 4, `src/core/MCPLegacy.ts` 2,
    `src/core/MCPLegacyClientTransport.ts` 2, `src/core/constants.ts` 2,
    `src/core/helpers.ts` 2, `src/server/inferers.ts` 3, plus test hits across
    `tests/src/core/` and `tests/src/server/` (the acceptance grep re-derives the set).
  - `MCP_LEGACY_VERSION`: `guides/mcp.md` 3, `src/core/constants.ts` 2, plus test hits in
    `tests/integration.test.ts` and across `tests/src/`.
  - Every target spelling has zero existing hits, measured 2026-08-26.
- Standing condition: `MCP_PROTOCOL_VERSION_HEADER` (`src/server/constants.ts`, used in
  `src/server/handlers.ts` and `src/server/inferers.ts`) names the wire header and is NOT in
  the rename map. The word-boundary form of your search keeps it out; leave it and its
  consumers untouched.
- The vendored `tests/mirrors/` tree is off-limits and contains no hit.

## Unknowns

- The baseline commit: the M5 acceptance commit, named in the dispatch message. Verify
  `git log --oneline -1` matches it and `git status --short` is empty before editing; a
  mismatch is a deviation.
- Whether any TSDoc or guide sentence around a renamed constant asserts the OLD meaning in
  prose (for example a sentence reading the unqualified name as the superset). Where the
  rename makes a sentence false or stale, repair that sentence minimally in the renamed
  symbol's voice, and record each such repair in the report.

## Scope

- Owned: every file a word-boundary search for the old spellings names under `src/`,
  `tests/` (excluding `tests/mirrors/`), and `guides/mcp.md`, plus the TSDoc lines attached
  to the renamed declarations in `src/core/constants.ts`.
- Off-limits: `tests/mirrors/`, `package.json` (no version bump here), every class and
  factory identifier, `MCP_PROTOCOL_VERSION_HEADER` and its consumers' header logic,
  everything else.

## Deliverables

1. Rename the tokens per the map at every site, `import` lists included, with no
   compatibility alias, re-export, or deprecation shim left behind.
2. Repair the TSDoc of the renamed declarations so each first sentence still states what
   the symbol does without repeating its name, and the `{@link}` references across the tree
   resolve to the new spellings.
3. Update every `guides/mcp.md` row, fence, and sentence naming an old spelling; where the
   surrounding prose leaned on the old name's (wrong) superset reading, align the sentence
   with the ruling's meaning.

## Execution

You perform the assignment directly and spawn nothing. Validate scoped, cheap-first:

```text
npx oxfmt --config .oxfmtrc.json --check <owned files>
npx --no-install oxlint --config .oxlintrc.json --deny-warnings <owned source and test files>
npm run check
npx vitest run --config vite.config.ts --no-cache --reporter=dot --project src:core
npm run test:guides
npx vitest run --config vite.config.ts --no-cache --reporter=dot --project conformance
```

Baselines at `11c879c`: guides `144 passed (144)`, conformance `42 passed (42)`; take the
`src:core` count from your own pre-edit run and report both readings.

## Deviation contract

Stop and report — expected, found, exact evidence — when a rename forces an edit outside
the owned set, when a word-boundary search surfaces a hit whose sense is not the renamed
constant (quote it and stop rather than ruling on it), when a gate reds outside your edits,
or when the baseline mismatches. Sentence-level wording inside deliverable 3 is yours to
decide and record.

## Acceptance criteria, cheap-first

1. A word-boundary grep for each old spelling over `src/`, `tests/` excluding
   `tests/mirrors/`, and `guides/` reports zero hits; `MCP_PROTOCOL_VERSION_HEADER` still
   resolves untouched.
2. Scoped format and lint exit 0; `npm run check` exit 0.
3. `src:core` exit 0 at your pre-edit count; guides `144 passed (144)` exit 0; conformance
   `42 passed (42)` exit 0.
4. A writing-rules sweep over your added and changed prose lines passes, pattern and
   population named.

## Output

Write the report to `/home/user/lsp/tmp/units/m6-naming-report.md`: the per-file site list
each rename touched, every prose repair from Unknowns with before and after, the gate
readings with exit codes, the sweep, and the actual `git status --short` and
`git diff --stat` output. Your final message is a short summary naming the report path.
