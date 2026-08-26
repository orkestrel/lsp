# Campaign state — pickup record, written 2026-08-26

Read this beside `plan.md` (the ruled plan and routing) and `audit.md` (the original
ten-repo audit report). This file is the session-boundary snapshot: what is accepted,
what is in flight, what each working tree holds, and what only the user can decide.
Re-derive anything live — tree state, gate results, bench liveness — rather than
trusting this snapshot as current. The `ROADMAP.md` file in the lsp repository carries
the product-facing overview of the lsp package, the campaign's main subject.

## Wave status

| Wave | Subject | Standing |
|---|---|---|
| W — workflow | Progress adopted in the mcp shape, `unit` removed | Accepted and pushed |
| M — mcp | Era 2026-07-28 native, repairs, subscriptions | M1-M3.1 landed through `f0ad416`; analyst audit of the M3 round and M3.1 repairs RUNNING; then M4 (tasks proof), M5 (deprecated surface), M6 naming cascade (user blessing pending) |
| L — lsp | The package: contract, codec, client, transport, conformance | L2-L5 accepted through `c1f5cea`; L6 (the open-bound split) in its design round — planner ruling returned, analyst lane queued on the bench |
| H — html and markdown | Provenance | html accepted through `a533947` (H1, H3 rounds). markdown mid-round: H2-U1 (types), H2-U2 (coordinate engine), H2-U3 (span threading) landed UNCOMMITTED; H2-U4 (rewrite engine), H2-U5 (handle), H2-U6 (guide), H2-U7 (verifier) queued; the round commits as one commit behind one green chain |
| P — probe | Adopts `@orkestrel/lsp` | P1 landed UNCOMMITTED with a ruled deviation (see following); P2 (`Issue` range) queued behind it; P3 (`@typescript/native-preview`) deferred pending the user's install approval |

## Held working trees, 2026-08-26

- **mcp** — clean at `f0ad416`. No writer until the analyst verdict returns.
- **lsp** — clean at `c1f5cea` plus the `ROADMAP.md` addition. The L6 design round
  rules the next change.
- **markdown** — dirty with the uncommitted H2 round (U1+U2+U3). One writer at a time;
  the core check's only diagnostics are the U5 unit's expected three (`span` missing on
  `Markdown.ts:40`, `:94`, `factories.ts:81`); the guides project is red awaiting U6.
  Never revert; the round commits whole.
- **probe** — dirty with the uncommitted P1 adoption plus the Orchestrator's tarball
  swap (`@orkestrel/lsp` 0.0.1 as a `file:` runtime range, swap script and
  replaced-range record in `p1-tarball-swap.sh` and `p1-integration-note.md`) plus the
  applied P1 fixture patch. `tests/src/server/Probe.test.ts` holds 2 red rows on the
  L6 fork's subject — deliberate, closed by the L6 ruling's consumer rewiring.
- **scaffold, workflow, process, tool, queue, middleware, html** — clean and pushed.

## The L6 fork, the campaign's open design question

The P1 unit proved `LSPClientOptions.timeout` conflates the client's lifecycle bounds
with the caller-owned inspection budget (`p1-adoption-report.md` § 5, the
`l6-open-bound-design-brief.md` brief). The planner lane ruled for a per-open options
bag carrying the caller's `AbortSignal` on both diagnostics paths, the client `timeout`
keeping lifecycle and settlement, with named tensions for the objective lane
(`l6-design-planner-ruling.md`). The analyst lane runs on the bench after the M3 audit
(`l6-design-analyst-cover.md` beside the brief). Reconciliation, the unit cut
(L6-A through L6-F in the planner's ruling), and the probe rewiring follow both lanes.

## Bench and lane discipline

One Sol lane at a time through `codex exec` script files under the scratchpad, journals
under `tmp/codex/`, a Monitor per exec filtered to milestones and exiting on the
terminal event. The queue at this writing: the M3 analyst audit (running), the L6
design analyst, then the H2-U4 brief (written from the H2 design record after the U3
evidence, `h2-design-reconciliation.md`). Native Opus lanes dispatch through the Agent
tool; writers serialize per checkout; parallel writers run only across disjoint
checkouts.

## Only the user can decide

- The M6 naming blessing: the mcp rename cascade, `SUPPORTED_CLIENT_PROTOCOL_VERSIONS`
  and the adapter family name included.
- The P3 `@typescript/native-preview` install.
- Publishing, at campaign end: the user's decision and credential, run through the
  `orkestrel-publish` skill in layer order; probe re-pins its tarball range to the
  registry release then.

## Registered capabilities, carried not scheduled

Transport-ingress backpressure (mcp); the html-spans-to-markdown inbound projection
(never infer html spans from bare `HTMLNode` input); the CommonMark `U+0000`
replacement question (markdown); barrel membership of `findOpenPosition` and
`projectDepth` (html); the lsp guides-parity project; the lsp vocabulary pass (the
`isInstalledDiagnostic` annotation, the inlined `30_000` default); the `MarkdownSegment`
TSDoc run-length reconciliation (H2-U6's carrier); the mcp `below`/`above` file-wide
sweep; the pre-publish observation list in `plan.md`.

## Where everything lives

The campaign record lives in the lsp repository under `.orkestrel/`, one folder per
package — `lsp/`, `mcp/`, `markdown/`, `html/`, `probe/`, `workflow/` — with the
cross-package record (the plan, the original audit, this state file, the opening
design round, the fleet sweeps, the shared research, and the H-wave terrain) under
`.orkestrel/campaign/`. Each package folder holds its units' briefs, reports, audit
verdicts, settling receipts, instruments, and acceptance records, one file set per
unit, named `<unit>-<noun>.md`. Retention lands new artifacts here directly. Live
bench journals: `tmp/codex/` in the scaffold repository, swept at each round's
acceptance. Launch and gate scripts: the session scratchpad, with the executed copies
retained beside their units at acceptance. Every repository works on the
`claude/lsp-spec-audit-est33d` branch.
