# Unit M3-U1 — `MCPClient.listen`: the client subscription surface

Role and engine: Sol `implementer`, GPT-5.6 Sol, reached through `codex exec`, sandbox
`workspace-write`, working directory `/home/user/mcp`. You perform this assignment directly
and spawn nothing beyond the shell commands your work needs. Red-first for every behavioral
cluster.

Before working, read in order: `/home/user/mcp/AGENTS.md`; the applicable rules —
`.claude/rules/names.md`, `.claude/rules/typescript.md`, `.claude/rules/architecture.md`,
`.claude/rules/patterns.md`, `.claude/rules/tests.md`, `.claude/rules/writing.md`,
`.claude/rules/quality.md`; no skill binds this unit; the guide `guides/mcp.md` for the
server's subscription sequence; the design record —
`/home/user/scaffold/.orkestrel/campaign/m3-design-reconciliation.md` (the reconciled
rulings bind; where this brief and that record disagree, this brief wins and you report the
disagreement).

## Objective

`MCPClient` consumes a server subscription end to end: `listen` sends
`subscriptions/listen`, yields the acknowledgement and every stamped notification as owned
frames, returns the validated `MCPSubscriptionResult` on graceful closure, and closes
loudly on abort, overflow, peer error, disconnect, and transport loss — proved against a
real in-process `MCPServer`.

## Context

Baseline: mcp commit `c130277`, tree clean at dispatch.

The reconciled contract, binding:

```ts
type MCPSubscriptionStream = AsyncGenerator<JSONRPCNotification, MCPSubscriptionResult, unknown>

interface MCPListenOptions {
	readonly signal: AbortSignal
	readonly capacity?: number
}

interface MCPClientInterface {
	listen(notifications: MCPSubscriptionFilter | undefined, options: MCPListenOptions): MCPSubscriptionStream
}
```

- The `options` bag is required because the required `signal` lives in it. `capacity`
  bounds the frame queue; its default is a package constant in `src/core/constants.ts`
  named in the `{QUALIFIER}_{NOUN}` form beside its siblings.
- An `undefined` filter sends `params.notifications: {}` — the server requires the member
  (`src/core/MCPServer.ts:1292`) while the guard accepts the empty object
  (`src/core/validators.ts:1250`). Never omit the wire member.
- The server already speaks the whole sequence: acknowledgement, stamped matching
  notifications, then the complete result (`src/core/MCPServer.ts:1331`, `:1364`); every
  delivered frame and the terminator carry the listen request id through
  `MCP_META_SUBSCRIPTION` (`src/core/helpers.ts:932`, `:978`).
- Routing: add `#routeSubscription` as the sibling of `#reportProgress` at the
  server-initiated seam (`src/core/MCPClient.ts:593-596`). A stamped notification naming an
  active subscription goes only to that subscription's queue; the acknowledgement takes the
  same path with no special branch; a stamped frame naming no active subscription is late
  stream traffic and is DISCARDED, never published on the `notification` event; unstamped
  notifications keep the existing progress interception and `notification` event exactly.
- Correlation: the pending entry registers before the transport dispatch
  (`src/core/MCPClient.ts:474`, `:484`) — keep that order; the synchronous loopback
  delivers frames during `send` and the shipped progress rows prove the seam.
- The terminal: a response whose id matches the active subscription resolves iteration's
  return value after `isMCPSubscriptionResult` validates it (add the guard to
  `src/core/validators.ts`, exported and tested); a malformed terminal and a JSON-RPC error
  reject with `MCPError`.
- The queue: bounded at `capacity`, on the pending entry — no second map. A frame arriving
  at a full queue fails the subscription loudly (reject iteration naming the overflow) and
  releases the registration. A parked `next()` consumes directly.
- Closure: no request timeout applies — a subscription is long-lived. A pre-aborted signal
  returns a stream whose first read rejects without sending. A later abort rejects parked
  reads with the signal reason, releases the entry, and sends `notifications/cancelled`
  through the existing cancellation rule (`src/core/MCPClient.ts:876`). `return()` raises
  the same internal closure. `disconnect()` rejects every active subscription; transport
  `close` does the same — the constructor subscribes only to `message`
  (`src/core/MCPClient.ts:225`), so add the transport-loss handling.
- HTTP carriers are out of this unit: the HTTP client transports buffer
  `text/event-stream` to completion, so incremental delivery is duplex-only — the guide
  unit documents that limit; you neither test nor touch the HTTP paths.

The fixture: the loopback at `tests/setup.ts:910-930` discards a held-open answer
(`if (answer === undefined || Symbol.asyncIterator in answer) return`). Extend it so an
AsyncIterable answer is iterated and each frame emitted on `message` as iteration yields —
a strict extension: the fixture's own comment records that no existing scenario produces a
held-open answer, and the unfiltered client suite proves the extension changed nothing
else. The subscription rows then drive a REAL `createMCPServer` through that loopback —
`createSubscriptionRequest` (`tests/setup.ts:729`) shows the wire shape the server accepts.

## Unknowns

- Whether the repository's TypeScript lib surface gives the `MCPSubscriptionStream` alias
  disposal through the iterator protocol; report the reading (the design requires
  `return()` equivalence, not a wrapper interface — do not add one).
- Whether any existing client row produces a held-open answer through the loopback after
  the extension; the expectation is none, and a reddening row is a deviation to report.
- The exact server notification method names the acknowledgement and terminal carry;
  derive them from `src/core/MCPServer.ts` and report them.

## Scope

Owned files: `src/core/types.ts`, `src/core/validators.ts`, `src/core/constants.ts`,
`src/core/MCPClient.ts`, `tests/setup.ts`, `tests/src/core/MCPClient.test.ts`,
`tests/src/core/validators.test.ts`.

Report-only: `src/core/MCPServer.ts`, `src/core/helpers.ts`, `src/core/parsers.ts`,
`src/core/MCPStreamController.ts`, `guides/mcp.md` (the guide unit owns it), the barrel
`src/core/index.ts` (touch it only if a symbol cannot reach it through the existing star
exports, and report the touch).

Off-limits: everything else — the lockfile, `src/server/**`, `src/browser/**`, and every
transport implementation included.

Allowed tools: read, edit, and scoped shell commands in `/home/user/mcp`. No commit, no
push, no `git checkout`/`restore`/`stash`/`reset`/`clean`, no tree-wide `format` or
`lint --fix`, no installs.

## Execution

You are the bench engine reading this brief inside your own CLI: do the work yourself,
directly, and spawn nothing beyond the shell commands your work needs.

## Host environment and bench limits

Linux container, Node and npm on PATH, network DENIED in your sandbox — no installs, no
fetches. Dependencies are installed. Nested `git` invocations from a spawned tool can
report "not a git repository" while your own `git status` succeeds; that is the sandbox. A
loopback `listen` on any address fails `EPERM` — nothing in this unit needs one. Never make
a whole-suite or timing-sensitive gate a criterion for yourself: run the scoped projects
and record any whole-suite reading as an observation; the Orchestrator takes the
authoritative gates after you exit.

## Red-first sequence

1. Land the types and the validator; record the scoped type-check red where the
   implementation has not caught up, then green.
2. Write the subscription rows against the extended loopback and record the client test
   command red before the `MCPClient` implementation, then green. The rows, each with a
   literal expectation: request method and defaulted filter on the wire; acknowledgement
   yielded first; stamped frames yielded in order as owned snapshots; graceful terminal
   returns the exact validated result; concurrent subscriptions stay isolated; a
   non-subscription notification still reaches `client.emitter`; a late stamped frame is
   dropped; peer error rejects with `MCPError`; malformed terminal rejects; pre-aborted
   signal rejects the first read without sending; abort rejects a parked read and sends
   `notifications/cancelled`; overflow at `capacity` fails loudly; `disconnect()` and
   transport `close` reject.
3. One discriminating mutation control: make `#routeSubscription` claim nothing (return
   early), run the client project unfiltered, and record that the isolation row and the
   late-frame row redden while the progress rows stay green; restore from a byte-exact
   backup under the ignored `tmp/` area and prove restoration with `cmp` run while mutated
   (expect 1) and after restore (expect 0).

## Output

Your final message is the unit report, in this shape and nothing else:

1. What changed: each owned file with the exact behavioral delta, and the constant and
   guard names chosen.
2. The red-first records: each cluster's exact red and green commands with readings.
3. The mutation account: the mutated line, the exact red case titles, `cmp` readings, and
   the restored green.
4. The Unknowns readings.
5. Scoped gate readings with exit codes: the client and validators test projects, scoped
   `oxfmt --check` and `oxlint --deny-warnings` over the owned files, the scoped
   type-check, `git diff --check`.
6. Observations outside scope, each named against the capability that owns it.
7. Claims you flag as needing host verification.

No process diary.

## Deviation contract

A conflict with the primary objective stops the unit: report expected, found, exact
evidence, done or not done, and at most one short hypothesis. The named stop conditions:
the loopback extension reddens an existing row; the server's shipped sequence disagrees
with the contract above; the pending-entry queue cannot carry the bound without a second
map. Ancillary conflicts — the constant's exact name within its form, test titles, queue
internals — are yours to decide, record, and carry on from.

## Acceptance criteria

Ordered cheap-first.

1. `git diff --check` exits 0 and the diff touches only owned files (a reported barrel
   touch excepted).
2. Scoped `oxfmt --check` and `oxlint --deny-warnings` over the owned files exit 0.
3. The contract in Context appears in `src/core/types.ts` exactly, and the scoped
   type-check exits 0.
4. Every red-first cluster has its recorded red and its green, and the rows carry literal
   expectations.
5. The mutation control reds exactly its named cases and restores `cmp` 0.
6. The client and validators test projects exit 0 unfiltered.
7. No banned construct anywhere in the diff; interface properties readonly; the queue
   lives on the pending entry.

## Review evidence

The Orchestrator captures the actual diff and the actual `git status` output after you
exit; the round is audited by a `reviewer` lane whose engine did not write this unit, and
your report's claims are audited against the diff.
