# Unit M7 — the mcp client era boundary

## Supersession record

Added by the user's 2026-08-25 addendum in
`.orkestrel/campaign/direction-2026-08-25.md` (its final section), which supersedes the
m-audit verdict's ruling 5 (the retained automatic fallback) on the record. Successor context:
M1 (`m1-revision-boundary-*`), M1.1, M1.2 — their constraints on versions, lockfile, and commits
bind here. The M6 naming cascade runs after this unit and finalizes family names; propose within
the family this brief names and expect M6 to rename coherently.

## Role and engine

You are the GPT-5.6 Sol engine, reached through `codex exec`, running the `implementer` route.
Sandbox: `workspace-write`. Working directory: `/home/user/mcp`. Perform this assignment directly
yourself and spawn nothing beyond the scoped commands named here.

## Objective

The bare `MCPClient` negotiates the modern revision only — no automatic legacy fallback, no
legacy pin — and a consumer facing a legacy-only peer opts into an explicit adapter that performs
the legacy handshake and converts the peer's era so the consumer-visible surface stays
`2026-07-28` whatever the peer speaks. Every behavior change lands red-first against the tests
and prose that pin the old behavior.

## Context

Read, in order: `/home/user/mcp/AGENTS.md`; `/home/user/mcp/.claude/rules/` (`names.md`,
`typescript.md`, `architecture.md`, `patterns.md`, `tests.md`); the user ruling in
`/home/user/scaffold/.orkestrel/campaign/direction-2026-08-25.md` (the client era-boundary
addendum — it is the binding posture); `/home/user/mcp/guides/mcp.md` for every section you
touch; the era facts in
`/home/user/scaffold/.orkestrel/campaign/researcher-external-report.md`. Skill: none.

Standing conditions: tree at the head of `claude/lsp-spec-audit-est33d` (`a379b08` at brief
time), clean; dependencies installed; network denied; loopback listeners and a child's child
denied — the wrapper's tests drive an in-process fixture transport, never a spawned server or a
real socket; scoped commands (`tsc`, `oxlint`, `oxfmt`, scoped `vitest` projects) work in the
sandbox; never run the whole `npm test` chain. Vendored scaffold files off-limits.

Facts measured by the Orchestrator against the tree at `a379b08`:

- `MCPClientOptions.version?: MCPVersion` (`src/core/types.ts:2242` block) admits legacy pins;
  `MCPVersion = MCPModernVersion | MCPLegacyVersion` (`types.ts:196`).
- The automatic fallback lives in the negotiation catch: on a discovery failure that is not
  `-32022` and with no era yet, the client calls
  `#initialize(generation, MCP_PROTOCOL_VERSION)` (`src/core/MCPClient.ts:704-712`); the
  explicit legacy pin path calls the same handshake at `:677`; `#initialize` is declared at
  `:873`.
- `MCPClientTransportInterface` (`types.ts:2100`) is the message-boundary seam: `emitter`,
  `session`, `duplex`, `start`, `send`, and close; the server-side era adapter (`MCPLegacy`,
  `src/core/MCPLegacy.ts`) already holds the era translation precedent at the equivalent
  server seam, including result translation between eras.
- The fallback sequence is pinned by tests around `tests/src/core/MCPClient.test.ts:1190` and
  documented at `guides/mcp.md:2831` and `:4202-4210` (line readings from the audit round;
  re-derive exact rows by running the client suite after the change).

## The items

1. **The bare client is modern-only.** `MCPClientOptions.version` narrows to
   `MCPModernVersion`; the legacy arm of the pin path and the automatic fallback leave
   `MCPClient`; `#initialize` and every legacy-handshake read in the client move out (to the
   adapter, item 2). Negotiation is `server/discover` only: a peer answering discovery with
   `-32601`, `-32600`, or an unrecognized failure yields an `MCPError` whose message names the
   adapter as the accommodation. `-32022` retry stays modern-only as it is. Red-first: correct
   the fallback-sequence rows in `tests/src/core/MCPClient.test.ts` to the refusal FIRST,
   record the failing counts against the unfixed source, land the change, record green.
2. **The adapter is an explicit transport decorator in `src/core`.** A factory taking an inner
   `MCPClientTransportInterface` and returning one: on `start` it performs the legacy
   `initialize` handshake with the peer (negotiating the newest legacy revision the peer
   supports, or a caller-named one); it answers the wrapped client's `server/discover` locally
   with a modern-shaped discovery synthesized from the handshake; it strips or supplies modern
   `_meta` as the legacy wire requires on the way down and converts legacy replies to the
   modern result shapes on the way up, reusing or inverting the era-translation logic the
   server decorator already centralizes rather than duplicating it (extract shared translation
   into the centralized helpers where both need it). The consumer-visible client behaves fully
   modern through it. Name the entity within the `MCPLegacy` family for M6 to rename (record
   your choice); the factory follows the `create*` pattern; single-word members throughout.
3. **The wrapper is proved against a legacy fixture peer.** A mirrored test file drives the
   adapter with an in-process fixture implementing the inner transport: the legacy handshake
   exchange, the synthesized modern discovery, a `tools/list` and `tools/call` round trip whose
   consumer-visible results are modern-shaped, a peer refusing the legacy handshake (the
   adapter surfaces a clear failure), and a negative control proving the fixture can report a
   violation. The bare-client refusal (item 1) gets its own row naming the adapter in the
   error.
4. **The guide states the new boundary.** The fallback sections become the adapter's sections:
   the bare client's modern-only negotiation and its refusal, the adapter's opt-in role, one
   fence showing the wrap, and the era conversion described as forcing the consumer surface to
   the latest revision. Run the scoped guides project and read it.

## Unknowns

- Which client tests beyond the fallback rows the narrowing of `version` makes false. Derive
  the set by running the client suite after item 1 and rule each red by source truth over test
  convenience, reporting the ruling per row.
- Whether the era translation extraction ripples into `MCPLegacy`. Keep `MCPLegacy` behavior
  identical; a shared helper extraction that both consume is in scope, a behavior change there
  is a deviation stop.

## Scope

Owned: `src/core/MCPClient.ts`, `src/core/types.ts` (the client options narrowing and the
adapter's declarations only), the new adapter file in `src/core/`, `src/core/factories.ts` or
the factory's prescribed home, `src/core/helpers.ts` (shared era translation only),
`src/core/index.ts` (barrel), `src/core/MCPLegacy.ts` (only the mechanical rerouting onto an
extracted shared helper, behavior identical), `guides/mcp.md` (the named sections),
`tests/src/core/MCPClient.test.ts`, the adapter's mirrored test file,
`tests/src/core/MCPLegacy.test.ts` (only if the extraction forces a mechanical import update).
Off-limits: every rename M6 owns, `package.json`, the lockfile, `src/server/`, `src/browser/`,
`src/core/MCPServer.ts`, `src/core/constants.ts` beyond an adapter-required constant,
`src/core/validators.ts` beyond an adapter-required guard, vendored files, commits and pushes —
the Orchestrator commits.

## Deviation contract

A change that must alter `MCPLegacy` behavior, a server-side file, or a reserved rename stops
the unit: expected, found, evidence, done or not done, one short hypothesis. Ancillary choices
(the provisional entity name, fixture scripting, row wording, where the shared translation
helper lands within the centralized files) are yours to decide and record.

## Acceptance criteria

1. Scoped `oxfmt --check` and `oxlint --deny-warnings` over owned files exit 0.
2. `npm run check` exits 0.
3. The red-first proofs in item 1 recorded with exact commands and counts; every item 3 row
   green including the negative control.
4. The scoped `src:core` project and the scoped `guides` project exit 0.
5. `git status --porcelain` shows only owned files.

## Output

Return, and nothing else: a per-item table (item, what changed, proof command with red and
green counts verbatim); the adapter's name, seam, and translation decisions with the shared
helper's home; the per-row rulings for tests the narrowing made false; deviations or none; and
the actual `git diff --stat` and `git status --porcelain` output.
