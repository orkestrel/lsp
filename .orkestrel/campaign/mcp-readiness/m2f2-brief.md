# M2F2 — fix round for the A-M23F broken claim (concurrent-listing cache race)

- **Role and engine**: `implementer`, Opus 5, native. Writing unit, sole writer in the mcp
  checkout. Fix round: one prescription, generation-guarded caching, with the ruling below.
- **Objective**: on both HTTP client faces, the projection table always describes one listing
  lineage — the latest fresh listing and its own continuations — whatever order overlapping
  `tools/list` responses arrive in.

## Context

- Repository: `C:\Users\mikes\WebstormProjects\mcp`, clean `main` at the commit the dispatch
  names (after M5). Commit nothing. Never touch `tmp/worktrees/`.
- The A-M23F verdict, claim 4
  (`C:\Users\mikes\WebstormProjects\lsp\.orkestrel\campaign\mcp-readiness\am23f-verdict.md`).
  Read it first.
- The defect, Orchestrator-confirmed from source at `854a621`: `send` opens an independent
  fetch per call with no serialization (`src/server/transports/HTTPClientTransport.ts:129-137`),
  `#deliver` → `#select` mutates the shared `#parameters` in arrival order, and the
  fresh-versus-continuation split reads only the sent `cursor`. The failing interleaving: a
  continuation listing in flight, a fresh cursorless listing sent after it, the fresh response
  arriving first (clear + cache), the stale continuation arriving last and accumulating onto
  the new table. The table is then the union of two listings, and a later `tools/call` can
  project a header the last delivered listing did not advertise.

## The fix (ruling)

Generation-guarded caching, identical on both faces:

- The transport holds a listing generation counter. Sending a modern cursorless `tools/list`
  increments it; every modern `tools/list` send is stamped with the counter's value at send
  time (keyed by the sent message object — `#exchange` hands `#select` that same object).
- `#select` applies its cache mutations — the clear and every `set` — only when the sent
  request's stamp equals the current counter. A response whose listing was superseded before
  it arrived is delivered to the caller exactly as today — violating-tool exclusion and the
  `error` emission still apply to the DELIVERED message unconditionally — but never touches
  the table.
- Stale under-projection is the safe direction and is the accepted contract: a caller who
  works from a superseded page projects nothing for its tools, and the server's own bounded
  lookup (M2F) remains the validation authority.

## Pins (failing-first, both faces)

Use the transport's `fetch` injection seam (`HTTPClientTransportOptions.fetch`) to script
deterministic arrival order with deferred responses — an inert protocol-faithful stub, not a
mock of project-owned behavior. The pin on each face:

1. Send a continuation `tools/list` (cursor present) whose response is held; its page carries
   an annotated tool the fresh listing will not.
2. Send a fresh cursorless `tools/list`; resolve it first with a page omitting that tool.
3. Release the held continuation response.
4. A `tools/call` for the stale tool projects nothing (no `Mcp-Param-*` header on the wire).

Predicted red: the stale header is projected — the union table. Keep a companion row proving
the well-ordered case still accumulates: a fresh listing, then ITS continuation resolved
after it, projects tools from either page.

## Documentation

The guide's replace-versus-accumulate sentences — the client-projection entry and each face's
API clause — gain the concurrent rule in one sentence: a listing superseded before its answer
arrives is delivered but never cached. Update the TSDoc comment over `#select` the same way.

## Carried findings (amendment, 2026-08-27, from the M5 report)

The M5 report routed these findings here; this brief is each one's sole carrier.

1. **The `DEFAULT_MCP_LIMITS` TSDoc carries the `keys` drift** M5 corrected on
   `MCPLimitOptions`. Apply this exact patch at `src/core/constants.ts:163`:

   ```diff
   - * memory; 64 metadata keys admits the reserved keys plus many extensions; 128 concurrent
   + * memory; 64 keys admits `_meta`'s reserved keys plus many extensions, and bounds a produced
   + * result's breadth by the same leaf; 128 concurrent
   ```

2. **The legacy door has no modern-method row.** `tests/src/core/MCPLegacy.test.ts:239-247`
   pins the decorator's `default` arm only through the generic `unknown/method` case. Add a
   row of the same shape with `server/discover` as the method, named for what it proves. It
   pins existing behavior, so it runs green from the start — record it as a tripwire addition,
   not a failing-first fix.

## Scope

- Owned: `src/server/transports/HTTPClientTransport.ts`,
  `src/browser/transports/HTTPClientTransport.ts`,
  `tests/src/server/transports/HTTPClientTransport.test.ts`,
  `tests/src/browser/transports/HTTPClientTransport.test.ts`, `guides/mcp.md` (the named
  clauses only), `src/core/constants.ts` (the carried patch only),
  `tests/src/core/MCPLegacy.test.ts` (the carried row only).
- Off-limits: everything else. No public type changes: the counter and stamps are private
  state; `MCPClientTransportInterface` is unchanged.

## Execution

Perform the assignment directly and spawn nothing. Failing-first on both faces. Validate
scoped: `npm run check`, scoped oxlint and oxfmt `--check` on the owned files,
`npm run test:src:core` (the carried row), `npm run test:src:server`,
`npm run test:src:browser`, `npm run test:guides`; `npm run build:src` then
`npm run test:conformance` (no baseline movement expected — report if one moves). No
tree-wide mutating commands.

## Output

Report to `tmp/units/m2f2-report.md` and as your final message: the failing-first records
(commands, red and green counts, the failing assertion text), the guide and TSDoc sentences
as landed, and the scoped run table.

## Deviation contract

Stop and report when a conformance row moves, a test outside the owned files reddens, or the
generation guard breaks a shipped sequential pin. Ancillary choices — the stamp container,
naming, row placement — are yours to decide and record.

## Acceptance criteria

1. The out-of-order interleaving pinned red-then-green on each face; the companion
   well-ordered row green throughout; every shipped sequential pin still green.
2. Delivered messages unchanged in every case: exclusion and the `error` emission fire for a
   stale listing exactly as for a current one.
3. The guide and TSDoc sentences landed; scoped runs green; conformance unchanged at the
   recorded baseline.
