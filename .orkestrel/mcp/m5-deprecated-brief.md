# Unit brief: m5-deprecated — the deprecated-surface markers

## Role and engine

`builder` — Sonnet, native subagent. You write in `/home/user/mcp`, the sole writer in
that checkout, from the clean committed baseline `11c879c` on branch
`claude/lsp-spec-audit-est33d`. You perform the assignment directly yourself and spawn
nothing.

## Objective

The deprecated protocol families carry `@deprecated` markers on their declarations, with
the guide rows aligned, and the scoped gates green. The other halves of the M5 plan row
are already the tree's state and close as retained evidence, not edits.

## Context

- Read before editing: `/home/user/mcp/AGENTS.md`; `/home/user/mcp/.claude/rules/` —
  `typescript.md` (the `@deprecated` form: replacement first, then reason), `writing.md`,
  `documentation.md`; no skill (explicit none).
- The enumeration evidence:
  `/home/user/lsp/.orkestrel/mcp/m5-sweep-distillate.md`. Its load-bearing readings, which
  you verify at each site before editing: no producer and no registration exists for the
  `roots`, `sampling`, or `logging` families; `isMCPInputRequest` admits the
  `sampling/createMessage` and `roots/list` arms and both are present in the vendored
  2026-07-28 schema; logging is inbound metadata validation only
  (`MCPLoggingLevel`, `isMCPLoggingLevel`, the `io.modelcontextprotocol/logLevel` read).
- Standing rulings, fixed by the Orchestrator:
  - `MCPLoggingLevel`, `isMCPLoggingLevel`, and the metadata read are live mechanisms a
    consumer must keep calling — they get NO `@deprecated` tag.
  - The receipt arms of `MCPInputRequest` stay legal; the union's TSDoc at
    `src/core/types.ts:559` already narrates the deprecation — verify it names both arms
    and the elicitation replacement, and strengthen it only where one of those is absent.
- Baselines at `11c879c`: conformance `42 passed (42)`, guides `144 passed (144)`, the
  four-file scoped core suite `596 passed (596)`.

## Scope

- Owned: `src/core/types.ts` (the three capability members and, only per the ruling, the
  `MCPInputRequest` TSDoc), `guides/mcp.md` (the rows documenting those members).
- Off-limits: everything else — `tests/mirrors/` above all, every validator body, every
  producer path. A consequence outside the owned set is a deviation, never an edit.

## Deliverables

1. `@deprecated` TSDoc on `MCPClientCapabilities.roots` (`src/core/types.ts:224`) and
   `MCPClientCapabilities.sampling` (`:225`): the replacement first — elicitation through
   `{@link MCPElicitRequest}` for input flows — then the reason: the 2026-07-28 era
   produces no roots or sampling traffic, and the member stays legal only for a peer that
   still advertises it.
2. `@deprecated` TSDoc on `MCPServerCapabilities.logging` (`:239`): the replacement first
   — a local emitter for log observation, as the guide's not-built row states — then the
   reason: the 2026-07-28 era defines no MCP logging capability, and the member stays
   legal only for a peer that still advertises it.
3. The `MCPInputRequest` union TSDoc verified per the standing ruling, edited only where
   an arm or the replacement is unnamed.
4. The `guides/mcp.md` rows documenting the three capability members carry the deprecated
   note matching the tags; locate the rows by the member names, and touch none of the
   already-correct deprecation rows the distillate lists.

## Execution

You perform the assignment directly and spawn nothing. Validate scoped, cheap-first:

```text
npx oxfmt --config .oxfmtrc.json --check src/core/types.ts guides/mcp.md
npx --no-install oxlint --config .oxlintrc.json --deny-warnings src/core/types.ts
npm run check
npm run test:guides
npx vitest run --config vite.config.ts --no-cache --reporter=dot --project conformance
npx vitest run --config vite.config.ts --no-cache --reporter=dot --project src:core tests/src/core/validators.test.ts
```

## Deviation contract

Stop and report — expected, found, exact evidence — when a site's current text differs
from the distillate's reading, when a tag's honest replacement is not the one the ruling
names, when a gate reds outside your edits, or when a guide row you must align sits inside
a fence whose reading you cannot verify. Wording inside a deliverable's stated shape is
yours to decide and record.

## Acceptance criteria, cheap-first

1. Scoped format and lint exit 0; `npm run check` exit 0.
2. `grep -c "@deprecated" src/core/types.ts` reports a value covering exactly the tagged
   members; name each tagged site.
3. Guides `144 passed (144)` exit 0; conformance `42 passed (42)` exit 0; the validators
   scoped run exit 0 at its pre-edit count.
4. A writing-rules sweep over your added and changed prose lines passes, pattern and
   population named.

## Output

Write the report to `/home/user/lsp/tmp/units/m5-deprecated-report.md`: each deliverable
with before and after, the union-TSDoc verification reading, the gate readings with exit
codes, the sweep, and the actual `git status --short` and `git diff --stat` output. Your
final message is a short summary naming the report path.
