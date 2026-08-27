# M3 — a `send` on a closed WebSocket rejects

- **Role and engine**: `implementer`, Opus 5, native. Writing unit, sole writer in the mcp
  checkout.
- **Objective**: the browser WebSocket client transport and the server-side WebSocket carrier
  honor the package's own `send` contract — a write the channel cannot confirm rejects — with
  the queue-until-open behavior preserved and the server pump proven tolerant of a rejected
  write to a disconnected peer.

## Context

- Repository: `C:\Users\mikes\WebstormProjects\mcp`, clean `main` at the commit the dispatch
  names. Commit nothing. Never touch `tmp/worktrees/`.
- Read first: `AGENTS.md`, `.claude/rules/typescript.md`, `.claude/rules/tests.md`.
- The contract, in this package's own words (`src/core/types.ts` around `:2247-2258`): a `send`
  that fails must fail by REJECTING, never by throwing synchronously, and a transport whose
  channel cannot confirm a write answers a closed channel from its own state.
- Current state, design-round verified: the browser client queues sends until open (correct —
  keep it) and RESOLVES silently after close (`src/browser/transports/WebSocketClientTransport.ts`
  around `:40`, `:118-125`); the server carrier no-ops a closed socket
  (`src/server/transports/WebSocketServerTransport.ts` around `:32`, `:85-88`). The Node
  client already rejects (an `async`-context throw) — the model to match in outcome.
- The caller's symptom, audit-recorded: a silent resolve leaves the caller's `call` pending to
  its deadline for a frame that was never written.

## Tasks

1. Both faces reject a `send` after close (and after the underlying socket reports closed) with
   an `MCPError` naming the closed channel, asynchronously. The browser face's pre-open queue
   still flushes in order; only the closed state rejects.
2. The server side: read how the bound pump (`bindServer` / the WebSocket upgrade wiring)
   handles a rejected response write for a peer that disconnected mid-request, and pin the
   behavior — a disconnect must not become an unhandled rejection or crash the pump; the
   rejection is observable where the wiring reports faults. If the pump today assumes `send`
   never rejects, make it tolerate the rejection as part of this unit and pin that.
3. Failing-first for each behavioral change, with the caller-visible symptom asserted (the
   pending-call symptom or its unit-level equivalent), not only the rejection itself.
4. Guide: the WebSocket transport rows state the closed-send rejection; verify the sections
   already name WebSocket as a non-normative extension (the spec defines stdio and Streamable
   HTTP only) and add the sentence where absent.

## Scope

- Owned: `src/browser/transports/WebSocketClientTransport.ts`,
  `src/server/transports/WebSocketServerTransport.ts`, the wiring file only as task 2 requires
  (name it in the report if touched — expected `src/server/factories.ts` or the helpers the
  upgrade path uses), their test files, `guides/mcp.md` (the named rows only).
- Off-limits: everything else.

## Execution

Perform the assignment directly and spawn nothing. Validate scoped: `npm run check`, scoped
oxlint and oxfmt `--check`, `npm run test:src:browser`, `npm run test:src:server`,
`npm run test:integration` (the WS composition row), `npm run test:guides`. No tree-wide
commands.

## Output

Report to `tmp/units/m3-report.md` and as your final message: per-task landing, failing-first
records, what task 2 found and pinned, run counts.

## Deviation contract

Stop and report when: the pump cannot tolerate a rejecting `send` without a change outside the
owned files; or a test outside the owned files reddens. Ancillary choices are yours to decide
and record.

## Acceptance criteria

1. Both faces reject closed-channel sends; queue-until-open preserved and proven.
2. The pump's disconnect tolerance pinned.
3. Scoped runs green; guide rows true.
