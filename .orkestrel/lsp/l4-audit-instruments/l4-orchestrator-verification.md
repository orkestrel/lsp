# Orchestrator source verification — L4 analyst BROKEN claims (lsp `d354cab`)

Read directly from `/home/user/lsp/src/server/transports/StdioTransport.ts` on 2026-08-26,
before reconciliation, per the bench law that a bench output is a proposal until verified
against source.

- Claim 1 (ownership race) — VERIFIED. `close()` assigns `this.#child = undefined` at `:124`
  before `await waitForExit(child, this.#grace)` at `:129`. During that await, `#live()`
  (`:134-137`) reads `#child === undefined` and returns false, so `start()` (`:69-71` duplicate
  guard) passes and spawns a second child while the first is still terminating. A concurrent
  second `close()` reads `#child === undefined` at `:123` and returns immediately while the
  first close's termination is unsettled, so `close()` resolution stops meaning the child is
  gone — against the `LSPTransportInterface` remarks the claim cites.
- Claim 3 (orphan path) — VERIFIED. `stopChild(child, this.#grace, this.#grace)` at `:131` has
  its boolean result unread; when it reports `false` the child is live, the reference is
  already discarded, and `close()` resolves. Explicit orphan.
- Stale generation into the emitter — VERIFIED. `#observe` (`:162-168`) attaches `data`,
  `error`, and `close` listeners that are never detached; a terminated generation's late
  `close` emits `exit` (`:165-167`) and residual `data` emits `chunk` into the shared emitter
  after a replacement child starts.
- Unprompted exit needs no ownership clear: `#live()` and `send()` both test
  `exitCode`/`signalCode`, so a self-exited child blocks nothing. The defect cluster is
  close-path ownership, not the exit path.

Claim 5's evidence sits in the committed `l4-instruments/mutations.json` rows the analyst
cites; claim 6's table drift is self-flagged in the unit's report at
`l4-stdio-transport-report.md:333`.
