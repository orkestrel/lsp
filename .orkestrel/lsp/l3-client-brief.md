# Unit L3 — the LSPClient entity

## Role and engine

You are the GPT-5.6 Sol engine, reached through `codex exec`, running the `implementer` route.
Sandbox: `workspace-write`. Working directory: `/home/user/lsp`. Perform this assignment directly
yourself and spawn nothing beyond the scoped commands named here.

## Objective

`LSPClient` exists in `src/core/LSPClient.ts`, conforms exactly to `LSPClientInterface` in
`src/core/types.ts`, and its behavior is proved green by a mirrored suite driving an in-process
protocol-faithful fixture peer — no child process, no listener.

## Context

Read, in order, before editing: `/home/user/lsp/AGENTS.md`; the applicable
`/home/user/lsp/.claude/rules/` files (`names.md`, `typescript.md`, `architecture.md`,
`patterns.md`, `tests.md`); the reconciled design record at
`/home/user/scaffold/.orkestrel/campaign/lsp-design-reconciliation.md` — rulings 4 and 6 through
11 specify this entity's behavior and are binding; the L2 report at
`/home/user/scaffold/.orkestrel/campaign/l2-core-report.md` and the L2.1 repair report at
`/home/user/scaffold/.orkestrel/campaign/l2.1-codec-repair-report.md` for what the codec
provides — the parse carry is the `LSPDecodeState` union after L2.1, faults carry
already-decoded messages in the error context, and your read loop must drain
`context.messages` before surfacing a framing fault;
the LSP distillate at `/home/user/scaffold/.orkestrel/campaign/lsp-spec-distillate.md` for the
lifecycle, cancellation, and diagnostics sections. Precedent worth reading for shape:
`/home/user/mcp/src/core/MCPClient.ts` (composition, emitter pattern, request bookkeeping).
Skill: none.

Standing conditions:

- The tree sits at the head of `claude/lsp-spec-audit-est33d` (L2 landed at `073d7d2`; a small
  audit-driven repair may sit above it — build on the head, whatever it is). Clean at dispatch.
- Dependencies installed; network denied; never install.
- The sandbox denies loopback listeners and a child's child — which is why the fixture peer is an
  in-process `LSPTransportInterface` implementation, not a spawned server. Do not spawn anything.
- Scoped commands (`tsc`, `oxlint`, `oxfmt`, `vitest --project src:core`) work in this sandbox.
  Never run the whole `npm test` chain.
- Vendored scaffold files (`tests/setupPolicy.ts`, `tests/policy.test.ts`, and siblings) are
  off-limits.
- Core imports only `@orkestrel/contract` and `@orkestrel/emitter`; no `node:` import, no host
  global — `check:src:core` compiles core with no host types and will refuse them.

## Behavior, binding

Implement exactly the reconciled semantics:

- **`start`** drives the transport's `start`, sends `initialize` built from `workspace` and the
  package's fixed `LSPClientCapabilities` advertisement (UTF-16 only), consumes
  `LSPInitializeResult`, stores `capabilities`, then sends `initialized`. `encoding` is derived,
  never stored: `undefined` before `start` resolves, then the server's `positionEncoding` or the
  `utf-16` default. A server selecting an encoding the client did not offer fails `start` with
  `LSPError` code `protocol` before any document traffic. `start` after an `exit` event may run
  again; the client implements no restart policy.
- **`open`** refuses a URI already open with code `duplicate`; refuses when synchronization
  support is absent (`textDocumentSync` missing, `0`, or an options form without
  `openClose: true`) with code `protocol`; sends `textDocument/didOpen` with the complete item;
  then takes the diagnostics path derived per call from `capabilities.diagnosticProvider` — pull
  (`textDocument/diagnostic`, returning a `full` report's items; an `unchanged` report with no
  stored prior `resultId` is a `protocol` error) or push (resolve on the first
  `textDocument/publishDiagnostics` for that URI; an empty publication resolves as an empty
  array). Push and pull never merge. A publication for a URI nobody opened reaches the
  `notification` event, never a promise.
- **`close`** sends `textDocument/didClose`, releases the ownership slot, and returns a promise
  that reports the write.
- **`destroy`** sends `shutdown`, awaits its response, sends `exit`, closes the transport, and
  destroys the emitter; it is bounded — a shutdown that never answers within the deadline still
  ends in transport close, and `destroy` is idempotent.
- **Correlation**: request ids are unique per client; responses resolve their request regardless
  of arrival order; a response correlating to nothing raises the `error` event with an `LSPError`
  coded `protocol` and is otherwise ignored; inbound server requests the client does not
  implement are answered `-32601`; inbound notifications the client does not claim reach the
  `notification` event.
- **Deadlines and abort**: `timeout` bounds each request — on expiry the client sends
  `$/cancelRequest` for that id and rejects that request with code `timeout`. The client-wide
  `signal` aborts every pending request with code `aborted` and begins bounded destruction. There
  is no per-call signal.
- **Faults**: transport `exit` re-emits as the client's `exit` event and rejects every pending
  request with code `closed`; malformed inbound frames from the codec surface as `error` events
  coded `framing`; a JSON-RPC error response rejects its request with code `server`, the wire
  error preserved in the context.

`createLSPClient` joins `src/core/factories.ts` (create the file now — this is its first
consumer) following the fleet factory pattern, and the barrel exports both.

## Tests

Mirror source: `tests/src/core/LSPClient.test.ts` (and `factories.test.ts`). Build the fixture
peer in the test file or in `tests/setup.ts` extensions ONLY if the repository's test rules place
shared infrastructure there — read `.claude/rules/tests.md` and follow its placement law. The
fixture implements `LSPTransportInterface` in process, speaks real encoded frames through the L2
codec (bytes in, bytes out — never bypassing the framing), and is scriptable per scenario.

Prove at minimum, each as a named row: the full `start` handshake ordering (`initialize` before
anything, `initialized` after the result, nothing else between); encoding default, negotiated
`utf-8` refusal after a UTF-16-only offer; sync gating (absent, `0`, numeric, options with and
without `openClose`); push resolution including the empty publication; pull resolution including
the `unchanged`-without-prior refusal; unowned-URI publication reaching `notification`; duplicate
`open`; out-of-order responses; unknown-id response; inbound server request answered `-32601`;
timeout sending `$/cancelRequest` and rejecting only that request; abort rejecting all with
`aborted`; transport exit rejecting pending with `closed` and re-emitting `exit`; `destroy`
ordering (`shutdown` then `exit` then close) and its bounded fallback when shutdown never
answers; `destroy` idempotence. Give the fixture a negative control: one row proving the fixture
can report a violation (a scripted wrong-order server that the ordering assertion catches).

## Unknowns

- Whether the L2 codec's parser surface is sufficient for the client's incremental consumption.
  If a genuinely missing codec capability blocks you, that is a deviation stop — do not extend
  `parsers.ts` silently; it is off-limits.

## Scope

Owned: `src/core/LSPClient.ts`, `src/core/factories.ts`, `src/core/index.ts` (barrel additions
only), `tests/src/core/LSPClient.test.ts`, `tests/src/core/factories.test.ts`. Off-limits:
`src/core/types.ts` (the contract is settled — a needed change is a deviation stop),
`src/core/parsers.ts`, `src/core/helpers.ts`, `src/core/validators.ts`, `src/core/constants.ts`,
`src/core/errors.ts`, `src/server/`, `package.json`, the lockfile, `guides/`, every vendored
file. No commits, pushes, installs, or renames; the Orchestrator commits.

## Deviation contract

A conflict with the binding behavior or a needed change to an off-limits file stops the unit:
expected, found, evidence, done or not done, one short hypothesis. Ancillary choices (fixture
scripting shape, row naming, private field layout) are yours to decide and record.

## Acceptance criteria

1. `npx oxfmt --config .oxfmtrc.json --check <owned files>` and
   `npx oxlint --config .oxlintrc.json --deny-warnings <owned files>` exit 0.
2. `npm run check:src:core` exits 0.
3. `npm run check` exits 0.
4. `npx vitest run --config vite.config.ts --no-cache --reporter=verbose --project src:core`
   exits 0 with every named row green, the fixture's negative control included.
5. `git status --porcelain` shows only owned files.

## Output

Return, and nothing else: what exists per owned file and the load-bearing decisions (fixture
placement per the tests rule, the request-bookkeeping shape, the destroy bound); the exact
commands for every acceptance criterion with final summary lines verbatim; deviations or none;
and the actual `git diff --stat` and `git status --porcelain` output.
