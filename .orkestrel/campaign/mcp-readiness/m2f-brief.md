# M2F — fix round for the A-M2 broken claims

- **Role and engine**: `implementer`, Opus 5, native. Writing unit, sole writer in the mcp
  checkout. Fix round: prescriptions below; the two design points are rulings.
- **Objective**: the client projection cache tracks what the caller was last told; the server
  lookup cannot be escaped through a paged replacement listing within its stated bound; the
  synthetic dispatch is documented on its observation seam.

## Context

- Repository: `C:\Users\mikes\WebstormProjects\mcp`, clean `main` at the commit the dispatch
  names (after M3F). Commit nothing. Never touch `tmp/worktrees/`.
- The A-M2 verdict:
  `C:\Users\mikes\WebstormProjects\lsp\.orkestrel\campaign\mcp-readiness\am2-verdict.md`
  (claims 3 and 4, plus the claim-7 consumer-obligation note). Read it first.

## Fixes

1. **Fresh listing clears; continuation accumulates (prescription).** In both HTTP client
   faces' `#select` path: when the SENT `tools/list` carried no `cursor`, clear `#parameters`
   before caching the page; when it carried one, accumulate. Pin with the auditor's exact
   interleaving on at least one face (list a tool with an annotation → re-list without it →
   a `tools/call` for it projects nothing), and extend the rebuild-preservation assertions to
   cover `ttlMs` and `nextCursor` (the claim-3 test gaps). Update the guide's
   consumer-obligation sentence ("re-caches from that listing") so it is true for an omitted
   tool.
2. **The server lookup walks the pages, bounded (ruling).** The synthetic `tools/list` walk
   follows `nextCursor` until the named tool is found or the cursor is absent, capped by a
   named exported constant in `src/core/constants.ts` (pick a small bound and state its reason
   in TSDoc); a cap-hit treats the definition as unfound (headers forwarded unrecognized —
   today's behavior), and the guide's HTTP section states the bound as the residual limit. Do
   not change the built-in unpaged full-registry answer. Pin through the documented
   replacement seam: a fixture `methods.add('tools/list', …)` handler paging with size one,
   the annotated tool on a later page — its forged `Mcp-Param-*` header now refused, recorded
   red-then-green.
3. **The synthetic dispatch is documented (ruling).** The `request` observation event's TSDoc
   (`MCPServerEventMap.request`) and the guide's HTTP transport section name the per-call
   synthetic `tools/list` with its reserved id `0`, so an observer can recognize it. No
   interface widening.

## Scope

- Owned: `src/server/transports/HTTPClientTransport.ts`,
  `src/browser/transports/HTTPClientTransport.ts`, `src/server/handlers.ts`,
  `src/core/constants.ts` (the bound), `src/core/types.ts` (the event TSDoc sentence only),
  their mirrored test files, `tests/src/server/handlers.test.ts`, `guides/mcp.md` (the named
  rows), `tests/conformance.test.ts` (only if a baseline moves — none is expected; report if
  one does).
- Off-limits: everything else.

## Execution

Perform the assignment directly and spawn nothing. Failing-first for fixes 1 and 2. Validate
scoped: `npm run check`, scoped oxlint and oxfmt `--check`, `npm run test:src:core`,
`npm run test:src:server`, `npm run test:src:browser`, `npm run test:conformance` (after
`npm run build:src`, the authorized ancillary), `npm run test:guides`. No tree-wide commands.

## Output

Report to `tmp/units/m2f-report.md` and as your final message: failing-first records, the bound
chosen with its reason, the guide sentences as landed, run counts.

## Deviation contract

Stop and report when a conformance row moves unexpectedly, or a test outside the owned files
reddens. Ancillary choices are yours to decide and record.

## Acceptance criteria

1. The stale-projection interleaving pinned red-then-green; preservation assertions extended.
2. The paged-replacement escape pinned red-then-green within the named bound; the built-in
   answer unchanged.
3. The observation seam documented; scoped runs green; conformance unchanged at
   `110 passed, 0 failed` and the green client rows.
