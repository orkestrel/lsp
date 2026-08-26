# Design brief — the lsp client's inspection bound

The subject is one public-API fork in `@orkestrel/lsp`, revealed by its first real
consumer. Rule on it adversarially from your lane's perspective. The Orchestrator
reconciles; you propose and argue, you never accept.

## The falsified conflation, with evidence

`LSPClientOptions.timeout` (default `30_000`, inlined at
`src/core/LSPClient.ts:106`) bounds every wait the client takes:

- correlated requests — `initialize`, `shutdown`, and the pull-path
  `textDocument/diagnostic` — through `#request` (`src/core/LSPClient.ts:343`);
- the push-path publication wait — `#openPush` builds
  `AbortSignal.timeout(this.#timeout)` for the `textDocument/publishDiagnostics`
  arrival (`src/core/LSPClient.ts:316`);
- the destroy and close settlement bounds (`src/core/LSPClient.ts:612`, `:623`).

The guide's Surface row names the option one undifferentiated "deadline"
(`guides/lsp.md:163`), and the L3 design record's `open` ruling (empty publication
resolves empty; `unchanged` without a prior `resultId` is a `protocol` error; the path
derived per open) never split the diagnostics wait from the request bound.

The first real consumer breaks on the conflation. The probe package's `LintStage`
(unit P1, report `p1-adoption-report.md` beside this brief) needs lifecycle requests
bounded at its own 2000 ms teardown discipline while the INSPECTION budget belongs to
the probe coordinator — `ProbeOptions.deadline`, caller-set, default `30_000`, proved by
the rows `replaces a lint stage its deadline destroyed` and `names arming in a boot
expiry and arms again for the next claim` in `tests/src/server/Probe.test.ts`, each
asserting the coordinator's refusal `The lint stage exceeded 6000 ms`. No value of the
single knob expresses the split: `timeout: 2000` preempts the coordinator (measured:
`STALL elapsed=2076ms message=The lint stage could not serve (The LSP diagnostic
publication exceeded its deadline)`), and `timeout: 30_000` ties the coordinator's own
default and races it.

## The fork

Rule on the shape that restores the split, over at least these candidates, and rule on
every candidate you consider:

1. `open` gains a per-call options bag carrying `signal` — the caller-owned inspection
   budget rides an abort signal, on the push wait AND the pull request alike, rejecting
   with the existing `aborted` code; the constructor `timeout` keeps the lifecycle
   requests and settlement bounds. Decide whether the push wait keeps any client-level
   default bound when no signal is passed, or parks unbounded on the caller's signal
   obligation (the mcp sibling's `listen` REQUIRES the signal for exactly that reason).
2. A grouped constructor knob splitting the bounds by name — request bounds distinct
   from the diagnostics wait — with no per-call surface.
3. No lsp change: the consumer bounds externally by racing `destroy()` against its own
   deadline. Rule on what that does to every other consumer and to the `open` contract's
   honesty.

## Constraints that bind the ruling

- The house precedent: the mcp sibling's per-call bags — `MCPCallOptions.signal`,
  `MCPListenOptions.signal` (required, in a required bag) — and the root law "park idle
  work on events and abort signals".
- Single-word members; options grouped under entity nouns; absence is `undefined`;
  minimal public API expanded with its first real consumer — the consumer exists and is
  named; no compatibility shims — every consumer updates in the same change (the
  consumers today: probe's `LintStage`, the lsp test suites, the guide fences).
- The `close(uri)`, `initialize`, and `shutdown` request bounds are NOT the fork; keep
  them wherever your ruling leaves them explicitly stated.
- State the exit criterion your ruling implies: the types delta, the `LSPClient` paths
  that change, the test rows that pin the split (the caller-signal abort on each
  diagnostics path, the lifecycle bound surviving), the guide rows, and what the probe
  consumer then passes — so the Orchestrator can cut units from it.
- Registered observation to carry, not to rule on: the inlined `30_000` default against
  the constants placement law, and the guide's undifferentiated "deadline" wording.

## Output

A single ruling in your lane's voice: the chosen shape with exact signatures, the
contract prose for each changed TSDoc block, the default-bound decision with its
justification, the failure-mode table (which code each path rejects with under the
caller's abort, the client's own bound where one remains, and teardown), the pinned-row
list, the consumer rewiring shape for probe's `LintStage`, and the candidates you
rejected with the cost that rejected each. No process diary.
