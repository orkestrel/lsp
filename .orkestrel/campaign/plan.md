# Implementation campaign plan — LSP audit follow-through

Date: 2026-08-25. Supersedes the roadmap section of `audit.md` where the user's post-audit
rulings changed it (`direction-2026-08-25.md`, second ruling set). The audit's findings and
evidence stand unchanged; this plan is the successor campaign that lands them.

Process law for every unit: implementation units run under the `orkestrel-harden-package`
phases their brief selects; cross-package integration follows `orkestrel-align-packages`;
every nontrivial unit is audited through `orkestrel-falsify` with at least one lane whose
engine did not write it; one independent `verifier` runs each touched checkout's gate chain;
every repair carries its red-before-green proof. Serialization: one writer per checkout from
a committed baseline; at most one Sol exec and one native writer live at a time, always in
different checkouts.

## Wave L — the lsp package (user-directed rescope)

- **L0 — repository creation. DONE 2026-08-25.** The user created `orkestrel/lsp`; the
  session attached it, and `scaffold new lsp --src core,server --deps @orkestrel/contract,
  @orkestrel/emitter,@orkestrel/process` wrote the workspace (131 files).
- **L1 — contract design round.** One brief, two blind lanes (`planner` Opus, `analyst`
  Sol): the `@orkestrel/lsp` v1 public contract, mirroring the mcp package's architecture —
  host-independent core (protocol types from the 3.18 spec and metaModel, validators,
  parsers, framing helpers, error codes) plus a server environment carrying the stdio child
  transport and `LSPClient`. v1 scope is probe's need, per the creation gate: lifecycle with
  real capability declaration and `InitializeResult` consumption, position-encoding
  negotiation, `didOpen`/`didClose`, sync-mode selection from server capability, push
  diagnostics plus pull selection from `diagnosticProvider`, `$/cancelRequest`,
  method-not-found responses to unsupported server requests, the shutdown/exit/kill
  teardown. Required v1 capability, per the user's ruling: a conformance suite in the mcp
  package's pattern (`mcp/tests/setupConformance.ts`, pinned conformance revision) proving
  parity with the 3.18 specification on a type basis and a runtime basis wherever possible,
  driven by the staged 3.18.0 `metaModel.json` as a vendored fixture — everything foreign
  stays a development dependency or fixture, never a runtime dependency. Excluded with
  recorded triggers: `didChange` (first re-inspecting consumer),
  work-done progress rendering (first rendering consumer), `LSPServer` (the user's named
  eventual trajectory — designed the way `MCPServer` was, when a serving consumer exists;
  the html/markdown structure exclusions in `audit.md` name this server as their admitting
  consumer path). The audit's client-surface ruling seeds the subjective lane: entity-scoped
  lifecycle and document operations, no generic request/notify escape hatch.
- **L2 — core implementation** (types, validators, parsers, framing, errors; fixture-testable
  without child processes) — `sol`, GPT-5.6 Sol.
- **L3 — server transport and `LSPClient`** (child over stdio, correlation, teardown,
  protocol-faithful fixture server, live run against the workspace's own `oxlint --lsp`) —
  Opus `implementer`, native: language-server children are unmeasurable inside bench
  sandboxes, so every proof here is a host run.

## Wave M — mcp repairs, then names (unchanged from the audit)

Serial on the mcp checkout, `sol` (GPT-5.6 Sol) unless named otherwise; listener and stdio
proofs taken on the host; the in-memory era matrix from the audit's risk section is each
unit's cheapest probe.

- **M1 — revision boundary.** Bare server strictly modern: rejects every non-modern stamped
  revision with `-32022` and era-scoped `supported` data; discovery advertises the modern
  set; legacy `initialize` and legacy `ping` exist only through the decorator; client
  negotiation cannot ride legacy revisions over modern metadata.
- **M2 — input continuation.** Grouped call options carry continuation state and input
  responses; an `input_required` outcome is answerable through the public client; altered
  or expired state fails; accepted responses resume the original execution.
- **M3 — subscription client.** Entity-scoped `listen` returning a backpressured async
  stream; ordered notifications; terminal result settles the stream; caller abort reaches
  the peer; proven through the real HTTP stream decoder.
- **M4 — tasks proof.** Orchestrator stages the authoritative `ext-tasks` schema locally
  first (network work stays out of bench execs); signatures verified against it; the
  `notifications/tasks` family lands so transitions arrive without polling.
- **M5 — deprecated surface** — `builder`, Sonnet. `@deprecated` markers on roots,
  sampling, and logging declarations; modern producers and removed registrations removed;
  parsing preserved only where the dated schema still permits receipt.
- **M6 — naming cascade** — Opus `implementer`, last so mcp bumps once. `MCPLegacy` to
  `MCPDualEra` with `createMCPDualEra`; `MCP_PROTOCOL_VERSION` to `MCP_HANDSHAKE_VERSION`;
  `MCP_LEGACY_VERSION` to `MCP_FALLBACK_VERSION`; every consumer, test, and guide fence in
  the same change, and the M7 wrapper's family name lands here beside them.
- **M7 — client era boundary** — `sol`, added by the user's 2026-08-25 addendum (see the
  direction record) and scheduled ahead of M2 so the client contract is stable before
  features build on it. The automatic legacy fallback and the built-in legacy pin path move
  out of `MCPClient` into an explicit consumer-opt-in wrapper mirroring the server's
  decorator: the wrapper performs the legacy handshake and converts the peer's era so the
  consumer-visible surface stays 2026-07-28 whatever the peer speaks; the bare client
  refuses a peer it cannot negotiate modern with, naming the wrapper in the error. The
  tests and guide rows pinning the fallback sequence (`MCPClient.test.ts` negotiation rows,
  the guide's fallback sections) are repaired red-first with the change. Auditor: the
  `reviewer` lane, the engine that did not write it.

## Wave H — html and markdown provenance (unchanged from the audit)

- **H1 — html provenance** — `sol`. Source-retaining parse entity; `HTMLSpan`
  `{ start, end }` half-open UTF-16; single-word `span(node)` lookup on the `HTML` entity;
  offsets index the original input across CRLF normalization; slice-equality proof over
  parsed, sanitized, and distilled trees; CRLF and astral-character probes with the
  normalized-offset negative control.
- **H2 — markdown provenance** — `sol`, after H1. Offset-aware block and inline parsing;
  `MarkdownSpan` and `span(node)` on the `Markdown` entity; same proofs; the conversion
  helpers document positionless output.
- **H3 — exclusions recorded** — `builder`. Outline, folding ranges, selection ranges, and
  semantic tokens recorded as intentionally excluded in both guides, each trigger naming the
  eventual `@orkestrel/lsp` server path as an admitting consumer.

## Wave P — probe adopts the lsp package (revised)

Serial on the probe checkout, Opus `implementer` (native — child-process proofs), after L3.

- **P1 — client adoption.** `@orkestrel/lsp` built from source, packed, and installed as a
  tarball (installed, never linked) until the package publishes; `LintStage` drops its
  private framing, correlation, and lifecycle for `LSPClient`; capabilities declared;
  `InitializeResult` kept; encoding derived; diagnostics path selected from the server's
  capability. Acceptance against the real oxlint binary on the host, and the recorded
  process-id teardown check.
- **P2 — `Issue` range.** `line` replaced by zero-based UTF-16 `range`, rendered one-based
  at format time; consumer set derived by running the suite; every stage and renderer in the
  same change.
- **P3 — TypeScript 7 receipt gate. STRUCK 2026-08-25 by the user's deferral.** TypeScript 7
  is not adopted in this campaign and `@typescript/native-preview` is not installed.
  `TypeStage` stays on the in-process LanguageService. probe's guide records the receipt
  gate as the trigger that reopens the adapter question (the seam prose rides the P-wave
  guide work).

## Wave W — workflow adopts MCP progress directly (user-directed reversal)

- **W1 — progress adoption** — `sol`. `TaskProgress { current, total?, unit? }` becomes
  `{ progress, total?, message? }` with MCP's semantics, no adapter. The `unit` retirement
  is ruled on evidence (direction file, third ruling set) and closed by the user's final
  word: the field goes, no loose ends. W1 removes the declaration, the cloner branch at
  `src/core/cloners.ts:129`, the validator branch at `src/core/validators.ts:253`, every
  test constructing `unit`, and the guide rows naming it, with the re-admitting trigger
  recorded in the guide.
  The unit resolves and proves the named constraints: monotonicity is scoped to one task
  execution (a new attempt is a new scope, mirroring MCP's per-request token scope); a
  regressing report within a scope is refused; the activity `note` overlap is reconciled so
  one field carries observer text. Failing proof: replay workflow's existing reporters
  against the monotonic rule, record the refusals red, fix the reporters, record green.
  Dependents re-pin when workflow bumps.
- **G1 — guide rulings** — `builder`. queue, process, tool, and middleware record why they
  stay untouched; middleware records the multipart-upload-progress trigger; tool records
  that progress lives one layer up in mcp's execution context.

## Order and parallelism

L0 and L1 first — L1 can run while M1 begins, on different checkouts and different engines.
Then two pipelines advance concurrently, one writer each: Sol works M1 through M4 serially
on mcp, then H1 and H2, then W1; the native Opus lane works L3, then P1 and P2. M5, M6, H3,
and G1 slot behind their dependencies. P3 runs whenever the user approves the preview
install. Publishing is a separate user decision at the end, in layer order, through the
`orkestrel-publish` skill.

## Exit criterion

Every audit-report row reaches implemented, repaired, retained, or intentionally excluded on
landed evidence: the mcp era matrix and continuation, subscription, and tasks proofs green;
the provenance slice proofs green across CRLF and astral inputs; probe running on
`@orkestrel/lsp` with range-carrying issues and the TS7 gate documented; workflow's adoption
proofs green with its reporters migrated; every falsify verdict on file, every touched
checkout's gate chain reported green by an independent `verifier`, and the campaign folder
pruned at acceptance. The `LSPServer` and the TypeScript 7 adapter close as recorded
trajectories, not as debt.

## Confirmations the plan carries

- Creating the `orkestrel/lsp` repository (L0) — awaiting the user's word.
- The mcp names in M6, the zero-based-stored coordinate ruling in P2, and the
  side-lookup provenance ruling in H1/H2 — adopted from the reconciliation; standing unless
  the user overrules.
- Installing `@typescript/native-preview` for P3 — deferred approval, asked when the gate
  runs.
- `unit` retiring from workflow's progress shape in W1 — the one acknowledged loss of the
  direct adoption; standing unless the user overrules.

## Re-baseline 2026-08-25, after the L3.1 phase

- **L3.1 satisfied.** The combined L2+L2.1+L3 falsification round returned FAIL on both
  lanes; the reconciled verdict's items landed as the L3.1 repair at lsp `9c343cf` with
  red-first proofs, mutation probes, and a host receipt for the `satisfies` control. The
  `reviewer` re-check runs; L4 opens only on its PASS.
- **L6 transformed.** L3.1 created `guides/lsp.md` per the `guides/README.md` instruction
  (the fix brief wrongly assumed the file existed; the executor's resolution stands). L6
  shrinks to extending that guide and recording the exclusions table with triggers.
- **Reconciliation ruling 13 struck.** `LSPHeader` is removed; `LSPDecodeState` supersedes
  the capability. The l23 audit verdict carries the correction.
- **M7 in flight** on the Sol bench from mcp `a379b08`: modern-only client, legacy reach
  through a client-transport decorator.
- **H1 and W1 added to the ready queue.** Both briefs are staged from retained Grok terrain
  distillates with spot-verified pointers: `tmp/codex/h1-provenance-brief.md` (html span
  side-lookup, original-input UTF-16 coordinates) and `tmp/codex/w1-progress-brief.md`
  (MCP-exact progress shape, `unit` removed). Bench order after M7 is settled at the M7
  re-baseline; the default is M2 next, with H1 and W1 slotting behind the M-wave unless a
  bench gap argues otherwise.
