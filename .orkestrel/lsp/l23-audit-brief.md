# Audit brief — the @orkestrel/lsp core: contract, codec, and client (L2 + L2.1 + L3)

## Subject

The chain on `claude/lsp-spec-audit-est33d` in `/home/user/lsp`, tip `cd414f1`, base `3d4e57e`
(the scaffold), written entirely by the GPT-5.6 Sol engine:

- `073d7d2` (L2): the v1 contract and base-protocol codec.
- `451a2f8` (L2.1): the codec repair from the first audit round — fault-surviving decode, the
  header-accumulation bound, unknown-field tolerance, the `LSPDecodeState` linear carry, the
  retention-path pins, `as const` method literals.
- `cd414f1` (L3): the `LSPClient` entity over the transport seam, proved against an in-process
  fixture peer.

This is the successor to the L2 round (`.orkestrel/campaign/l2-audit-verdict.md`). That round's
closed findings are established; attack what the repair and the client added, and attack the
repair round's own rulings first — a fix carries the next defect.

## What the round decides

Whether L4 (the stdio transport with host receipts against a real language server) and L5 (the
conformance suite) build on this core as settled, and whether the client's behavior contract is
what probe later adopts. A finding now costs one fix unit; after L4 it costs host-proof rework.

## Already established — do not re-run

Verified by the Orchestrator directly: the scoped gates re-run green on the host at each commit
(`check:src:core`, root `check`, the `src:core` suite at 51 tests across 5 files at `cd414f1`);
`npm run test:policy` green at `073d7d2` (93 passed); the trees clean at each commit; the L2
round's `CONFIRMED` claims (contract fidelity, wire verbatim, guard totality, naming law, TSDoc,
host independence) — do not re-derive them except where L2.1 or L3 changed the file the claim
reads on; the named client rows exist (the Orchestrator listed them by name, including the
ordering negative control, the fault-drain row, and the destroy triplet).

## Review evidence

The combined diff `/home/user/scaffold/tmp/units/l23-audit.diff` (base → tip); the tree at
`cd414f1`; the unit reports `l2-core-report.md`, `l2.1-codec-repair-report.md`,
`l3-client-report.md` under `/home/user/scaffold/.orkestrel/campaign/` (writers' claims, not
established facts); the reconciled design record `lsp-design-reconciliation.md` (rulings 4 and 6
through 11 bind the client's behavior); the L2 verdicts beside them; the distillate
`lsp-spec-distillate.md`; the staged meta model
`/home/user/scaffold/tmp/cursor/sources/lsp-3.18-metaModel.json`.

## Numbered falsifiable claims

`CONFIRMED` requires naming the attack you tried that failed. A claim you cannot decide is
`UNRESOLVED`, not `CONFIRMED` — say what would settle it. Do not hedge toward an imagined
consensus. Assume this chain has one more defect.

1. **The L2.1 rulings hold as implemented.** Every parser fault inside the decode loop carries
   the already-decoded messages in its error context — enumerate the throw sites yourself and
   check each, not the report's word; the boundary-free accumulation refuses at the published
   header limit; an unknown header field is skipped while a malformed known field still
   refuses; `LSP_CONTENT_LIMIT` still refuses before body buffering. Falsified by a throw site
   that drops decoded work or a bound with a gap.
2. **`LSPDecodeState` is correct, not merely linear.** The unresolved/resolved union with its
   segment chain preserves exact byte semantics across every continuation: a header resolved in
   an earlier call is never re-derived wrongly, a flattened frame equals the bytes delivered,
   and state from one framing generation cannot corrupt the next frame's parse. Attack with
   adversarial chunk schedules — one byte at a time through header and body, a chunk ending
   exactly at the boundary, exactly at `frameEnd`, and one byte past it. Falsified by a
   schedule that loses, duplicates, or corrupts a message.
3. **The client's protocol ordering is the specification's.** `initialize` is first and
   `initialized` follows the result before any other traffic; `shutdown` then `exit` on
   destroy; `$/cancelRequest` is a notification carrying the request id; nothing is sent after
   the transport closes. Falsified by an interleaving the fixture can script in which the
   client emits out of order.
4. **The diagnostics contract matches the reconciliation.** Pull when `diagnosticProvider` is
   advertised, push otherwise, derived per open and never stored; the `unchanged`-without-prior
   refusal; the empty publication resolving empty; an unowned URI's publication reaching only
   the `notification` event; `open`'s promise settling exactly once under every scriptable
   interleaving (a publication racing `didClose`, a pull response racing abort, an exit racing
   an open). Falsified by a double-settle, a hang, or a merged path.
5. **Failure semantics are total and correctly coded.** Every pending request settles on abort
   (`aborted`), transport exit (`closed`), deadline (`timeout`, with only that request
   rejected), and a server error reply (`server`, wire error preserved); a response correlating
   to nothing raises `error` without corrupting the pending map; an unsupported inbound request
   is answered `-32601` with the same id; a framing fault surfaces after its decoded messages
   drain. Falsified by a path that leaves a request pending forever, mis-codes an error, or
   answers with a mismatched id.
6. **`destroy` is bounded and idempotent under hostile peers.** A shutdown that never answers,
   a transport whose `close` hangs, an exit arriving mid-destroy, and a second `destroy` racing
   the first all end with the emitter destroyed and the promise settled. Falsified by a hang or
   a double-teardown fault.
7. **The suite proves what its rows name.** Pick the rows you judge most likely to pass under
   a mutation of the behavior they name — the ordering control included — and attack them the
   way the L2 round attacked the circular byte oracle. A row that cannot fail is a finding.
   Also rule the coverage sufficiency for L4: name any client behavior the stdio transport will
   exercise that no row pins, and rule each unpinned one safe or required.
8. **The chain stays inside the law on files it touched.** No placement, naming, TSDoc,
   assertion-syntax, or host-independence regression in the L2.1 and L3 hunks; the barrel
   exports exactly the public surface; only owned files changed per commit. Falsified by any
   hunk breaking a rule the L2 round confirmed for the earlier tree.

## Unknowns

- Whether an execution is needed to settle claims 2 through 6 beyond what reading proves.
  Where your lane cannot execute, return the claim `UNRESOLVED` with the exact scriptable
  scenario (fixture script plus assertion) that settles it; the Orchestrator runs it at
  reconciliation.

## Output

Return exactly the `orkestrel-falsify` verdict shape and nothing else: numbered verdicts in the
claims' order with evidence, findings fitting no claim substantiated to the `BROKEN` standard,
one terminal line. No process diary.
