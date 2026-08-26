# Reconciliation — L4 audit round (lsp `d354cab`)

Both lanes ran blind on the shared claim set (`l4-audit-claims.md`): the analyst (GPT-5.6 Sol,
bench, objective; journal `tmp/codex/l4-audit-analyst.jsonl`, session
`01a03b92-896f-7173-a481-a3e88c42c38e`) returned FAIL — 4 broken — and the reviewer (Opus 5,
native, subjective) returned FAIL — 2 broken, 2 findings outside. The immutable lane returns
are `l4-audit-analyst-verdict.md` and `l4-audit-reviewer-verdict.md`. The Orchestrator
verified the load-bearing behavioral claims against source before reconciling
(`l4-audit-instruments/l4-orchestrator-verification.md`) and measured the reviewer's
interleaving derivation with executed probes on 2026-08-26
(`l4-audit-instruments/l4-stale-exit.test.ts`, `l4-stale-exit-stubborn.test.ts`).

## Per-claim rulings

1. **BROKEN**, with the mechanism reconciled across the lanes and the probes.
   - Standing from source, measurement-independent: `close()` assigns `#child = undefined`
     before `await waitForExit`, so a `start()` issued while `close()` is in flight passes the
     `duplicate` guard and spawns a second child beside the live first one; a concurrent
     second `close()` returns immediately while termination is unsettled; and `stopChild`'s
     `false` return is unread, so a kill the helper could not confirm resolves `close()` with
     the reference already discarded — the analyst's claims 1 and 3, verified line by line.
   - Refuted as stated: the reviewer's "deterministic rather than probabilistic" ordering.
     Both measured paths — cooperative stdin-end exit and the `--stubborn` `stopChild` kill —
     returned `atCloseResolve: 1, afterBeat: 1`: the generation's `exit` emitted before
     `close()` resolved, and no stale emit followed.
   - Standing structurally despite that refutation: nothing ever detaches a generation's
     listeners, and Node fires a child's `close` only after its stdio streams close — which a
     grandchild inheriting the pipes delays past `exit` arbitrarily. A real language server
     spawns workers, so the stale-`exit`-into-the-replacement-generation leg is reachable;
     the binding row uses a fixture child that spawns a pipe-holding grandchild and exits.
2. **CONFIRMED.** Both lanes; bytes never frames, stderr never joins.
3. Analyst BROKEN, reviewer CONFIRMED-with-observation, on the same fact read at different
   severities: the discarded `stopChild` boolean. Reconciled into claim 1's carrier — the
   close rework answers `stopChild === false` by retaining the reference and rejecting
   `close()` with a coded error, so no path resolves `close()` over a child nobody holds.
4. **CONFIRMED.** Both lanes; the option shape, both `spawn` doors, inheritance, the barrel.
5. Analyst BROKEN, reviewer CONFIRMED-with-weaknesses; reconciled to the union of their
   findings. The M9 mutation (`#live()` forced true) reddens nearly every row, so the
   reconnect row has no isolating control — replace it with the one-row mutation the reviewer
   named (refuse `start` whenever `#child !== undefined`). The Oxlint integration row's
   client teardown and pid reaping move into `finally` so an assertion failure cannot leak
   the child. `readChildProcesses` in `tests/setupServer.ts` carries the no-orphan receipt's
   load-bearing intersection with no proof of its own — the `setup` project registers and a
   `tests/setup*.test.ts` proof lands, which requires granting `vite.config.ts`.
6. **BROKEN.** Both lanes: the guide ships a second methods table keyed by the concrete
   `StdioTransport` class against the one-table-per-interface law, and the unit deferred a
   known violation to L6. The table is deleted and its behavior sentences fold into the
   `## Stdio transport` prose. The `guides/lsp.md:82-84` reconnect sentence is re-read after
   claim 1's repair, which is what makes it honest.

## Findings outside the claims

- Reviewer F1: `#launch` hand-composes what the installed `@orkestrel/process` publishes as
  `buildSpawn(command, options): SpawnInput`, and drops `verbatim`, leaving Windows quoting
  unset. Carried: `#launch` adopts `buildSpawn` and spawns its result. The public
  `command: readonly string[]` stays: ruling 10 fixed the option shape, and importing a
  dependency's `ProcessCommand` into this package's public options couples the published
  contract to the dependency for no consumer gain — the positional form converts to
  `ProcessCommand` inside `#launch`. Decision recorded here.
- Reviewer F2: the retained L4 report states row counts and one is false. The report is the
  unit's immutable return and stays verbatim; this reconciliation corrects the record beside
  it: the transport suite's rows are empty command, unlaunchable executable, second start,
  split frame, coalesced frames, directory and environment, inherited environment, send
  before start and after close, cooperative close, grace escalation, unprompted exit, and
  reconnect, beside the factories, integration, and barrel rows the suite also reports.
- Reviewer referral (the client's `#receiveExit` trusts any `exit`): reconciled per the
  reachability law. With item 2's generation-scoped emission, the shipped transport never
  emits a stale `exit`; the remaining exposure is a hypothetical foreign
  `LSPTransportInterface` implementation, so the obligation is documented on the contract —
  the `exit` event is emitted only for the transport's current generation — and no client
  machinery is built against it.

## Carriers — the L4.1 fix round

Unit L4.1, native Opus `implementer` (the subject's child pipes are unmeasurable on the
bench), baseline `d354cab`; the fix-round auditor is the Sol `analyst` (non-writer). Brief:
`tmp/units/l4.1-transport-repairs-brief.md`.

1. Generation-owned `close()`: the child reference is retained until termination settles;
   `start()` during an in-flight `close()` is refused `duplicate`; a concurrent `close()`
   awaits the same settlement instead of resolving early; `stopChild === false` retains the
   reference and rejects with a coded error. Red-first per seam.
2. Generation-scoped emission: a terminated generation's listeners are detached or its emits
   dropped, proven by the pipe-holding-grandchild row — the replacement generation observes
   no stale `exit` or `chunk`.
3. `#launch` adopts `buildSpawn` from `@orkestrel/process`, spawning its `SpawnInput`
   including `verbatim`; the public option type is unchanged.
4. The `### StdioTransport` methods table is deleted, its sentences folded into the section
   prose; the reconnect sentence at `guides/lsp.md:82-84` re-read against the repaired close.
5. Suite repairs: the one-row reconnect mutation replaces M9's account; integration teardown
   and pid reaping in `finally`; the `setup` project registers with a `tests/setupServer`
   proof for `readChildProcesses` (`vite.config.ts` granted for exactly that registration).
6. The transport contract documents the generation obligation: the `exit` event is emitted
   only for the current generation, stated on the event map and the interface remarks, so a
   foreign implementation meets the requirement in writing.

Every retained finding names exactly one carrier; the walk found no dropped finding.

VERDICT: FAIL — reconciled to the L4.1 carrier set; L5 conformance stays gated on the L4.1
re-check
