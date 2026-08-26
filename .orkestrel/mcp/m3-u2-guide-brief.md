# Unit M3-U2 — the guide's subscription surface

Role and engine: `implementer`, Claude Opus 5, native subagent, sole writer in
`/home/user/mcp`. You perform this assignment directly and spawn nothing. The tree is
expectedly dirty with the uncommitted M3-U1 and M3-U1.1 working set — build on it, never
revert it; the Orchestrator commits the round after your unit.

Before working, read in order: `/home/user/mcp/AGENTS.md`; the rules
`.claude/rules/names.md`, `.claude/rules/documentation.md`, `.claude/rules/writing.md`,
`.claude/rules/tests.md`, `.claude/rules/quality.md`; no skill binds this unit; the design
record `/home/user/scaffold/.orkestrel/campaign/m3-design-reconciliation.md`; the landed
surface itself — `src/core/types.ts` (the `MCPSubscriptionStream`, `MCPListenOptions`, and
`listen` contracts), `src/core/MCPClient.ts` (the shipped behavior), and the U1 report at
`/home/user/scaffold/.orkestrel/campaign/m3-u1-subscription-report.md`.

## Objective

`guides/mcp.md` documents the client subscription surface truthfully against the shipped
code: the `listen` method, its stream and options types, the lifecycle obligations, and
the two Streamable-HTTP gap entries replaced by the residual limit — with the parity
project green.

## Context — the shipped facts your prose must match

- `listen(notifications: MCPSubscriptionFilter | undefined, options: MCPListenOptions):
  MCPSubscriptionStream` on `MCPClientInterface`; the `options` bag is required because
  the required `signal` lives in it; `capacity` defaults to
  `DEFAULT_MCP_SUBSCRIPTION_CAPACITY` (64).
- An `undefined` filter sends `params.notifications: {}` on the wire.
- The stream yields the acknowledgement (`notifications/subscriptions/acknowledged`)
  first, then every stamped notification as an owned frame, and returns the validated
  `MCPSubscriptionResult` on graceful closure; the terminal is a correlated JSON-RPC
  result, not a notification.
- No request timeout applies. A pre-aborted signal rejects the first read without
  sending. Abort rejects parked reads with the signal reason and sends
  `notifications/cancelled` on a duplex carrier. `return()` raises the same closure. A
  frame arriving at a full queue fails the subscription loudly. `disconnect()` and
  transport loss reject every active subscription. A late stamped frame is dropped.
- A consumer that drops the stream without abort or `return()` remains its owner: the
  registration stays live and no timer reclaims it — the abandonment obligation the guide
  must state.
- New public exports owed documentation for parity: `MCPSubscriptionStream`,
  `MCPListenOptions`, `isMCPSubscriptionResult`, `DEFAULT_MCP_SUBSCRIPTION_CAPACITY`, and
  the `listen` member row in the `MCPClientInterface` methods table.

## The gap entries

The entry "Client-side consumption of a held-open Streamable HTTP exchange — unreachable,
not unfixed" (near `guides/mcp.md:3812`) is now false in its premise: the client carries a
`subscriptions/listen` initiator and a stream API. REPLACE it with the residual limit: the
subscription API consumes incrementally over duplex carriers, while the HTTP client
transports still buffer a `text/event-stream` reply to completion, so a `listen` over an
HTTP client transport yields its frames only when the stream closes. Closer: the
transport-ingress backpressure capability the campaign registers — a per-request awaited
delivery handler and signal on `send`, with incremental HTTP decoding.

The neighbouring entry "A per-request abort on the HTTP client transport — unreachable for
the same reason" (near `:3824-3832`) is partially moved: `listen` carries a required
per-subscription signal whose abort closes the subscription and cancels on duplex
carriers, while `MCPClientTransportInterface.send` still takes no per-request options, so
the signal cannot cancel one in-flight HTTP fetch. REWRITE the entry to that state with
the same closer. Keep both entries in the gap section's established voice: the clause,
what it costs, and who could close it.

## Red-first

Record `npm run test:guides` (or the repository's guides project command) red over the
current tree before your edits — the undocumented new exports are the expected red — and
the same command green after. If the parity project is green before any edit, stop and
report: the expectation is red, and a green start means the parity mechanism is not
guarding the new surface.

## Executable example

Where the guide's client section carries executable fences, add the `listen` example in
the same form, importing from `@orkestrel/mcp`, driving a real server the way the
neighbouring fences do, and asserting the acknowledgement-first order and the returned
result. Follow the guide-fence conventions the file already uses; if the flagship-fence
runner cannot carry a subscription example for a reason you can name, record the reason
and pin the behavioral sentences with executed assertions per
`.claude/rules/documentation.md` § Parity instead.

## Scope

Owned files: `guides/mcp.md`, `tests/guides.test.ts` (only if the fence registration
requires it — report any touch).

Report-only: everything the M3-U1 working set touched; `src/**` read-only.

Off-limits: everything else.

Allowed tools: read, edit, and scoped shell commands in `/home/user/mcp`. No commit, no
push, no `git checkout`/`restore`/`stash`/`reset`/`clean`, no tree-wide `format` or
`lint --fix`.

## Execution

You are a native subagent: do the work yourself, directly, and spawn nothing.

## Output

Your final message is the unit report, in this shape and nothing else:

1. What changed: each guide section touched with the delta, and the replacement entries
   quoted in full.
2. The red-first record: the parity red and green commands with exact readings.
3. The example's form and its executed proof, or the recorded reason and the substitute
   assertions.
4. Scoped gate readings with exit codes: the guides project, scoped `oxfmt --check` over
   the owned files, `git diff --check`.
5. Observations outside scope, each named against the capability that owns it.
6. Claims you flag as needing host verification.

No process diary.

## Deviation contract

A conflict with the primary objective stops the unit: report expected, found, exact
evidence, done or not done, and at most one short hypothesis. The named stop conditions:
the parity project is green before any edit; a shipped behavior contradicts a fact in
Context. Ancillary conflicts — section placement, entry wording within the gap voice — are
yours to decide, record, and carry on from.

## Acceptance criteria

1. `git diff --check` exits 0 and the diff touches only owned files.
2. Scoped `oxfmt --check` over the owned files exits 0.
3. The parity red is recorded and the guides project exits 0 after.
4. Every export named in Context has its documentation and the methods table matches
   `MCPClientInterface` exactly.
5. The two gap entries read as replaced, in the section's voice, and no sentence in the
   new prose contradicts the shipped behavior.

## Review evidence

The Orchestrator captures the actual diff and status after you exit; the M3 round's audit
lanes rule on the combined units, and your report's claims are audited against the diff.
