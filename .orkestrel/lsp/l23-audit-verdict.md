# Audit verdict — @orkestrel/lsp core chain (L2 + L2.1 + L3)

Round run 2026-08-25 on subject `3d4e57e..cd414f1` in `/home/user/lsp`, brief
`.orkestrel/campaign/l23-audit-brief.md`. Lanes, blind on the identical brief:

- Subjective: `reviewer`, Opus 5, native — the non-writer lane. Immutable return:
  `l23-audit-reviewer-verdict.md`. `FAIL`.
- Objective: `analyst`, GPT-5.6 Sol, `codex exec` read-only, journal
  `tmp/codex/l23-audit-analyst.jsonl`. Told its engine wrote the whole chain; it executed its
  attacks in-process through `node` evaluations. Immutable return:
  `l23-audit-analyst-verdict.md`. `FAIL`.
- `checker`: not run; the mechanical criteria were re-run by the Orchestrator at each commit.

The lanes converge on the same regions with independent methods — the reviewer derived, the
analyst executed — and each surfaced defects the other missed. Orchestrator reproductions before
ruling: the analyst's findings carry executed evidence; the reviewer-only structural findings
verified by direct read (`close` carries no lifecycle guard; `#diagnostics` has no clear site;
`satisfies` appears nowhere in source; `LSPHeader` occurs once, as its own declaration).

## Reconciled rulings

- **Claim 1 — SPLIT.** The fault-carry, both limits, and unknown-field tolerance hold under both
  lanes' attacks (reviewer enumerated every throw site; analyst executed the limits). Broken on
  one adjacent door the repair opened: a malformed `Content-Type` parameter with no `=` is
  silently skipped instead of refused. Carrier: L3.1 item 5.
- **Claim 2 — SPLIT.** The `LSPDecodeState` arithmetic held every adversarial schedule both
  lanes ran or traced, including the seam-offset line the reviewer attacked hardest. Broken on
  ownership: the state aliases the caller's mutable chunk, and mutating a delivered buffer after
  the call corrupts the continuation — executed by the analyst. The reviewer's finding A is the
  same ownership defect from the other end: the remainder `subarray` pins a whole frame buffer
  behind a one-byte tail. One rule closes both: retained bytes are owned copies. Carrier: L3.1
  item 5.
- **Claim 3 — BROKEN**, the round's principal cluster. Concurrent `start` double-handshakes
  (both lanes; analyst executed the `initialize#1, initialize#2` sequence); `close` is entirely
  ungated (reviewer; verified); a hung shutdown draws a protocol-forbidden `$/cancelRequest`
  after `shutdown` (analyst, executed — and a test row positively requires the violation); a
  deadline on `initialize` itself cancels pre-handshake (reviewer); a transport exit does not
  gate later writes, so `destroy` writes `exit` into a dead generation (analyst, executed).
  Carrier: L3.1 item 1, a lifecycle state machine rather than door-by-door patches.
- **Claim 4 — BROKEN.** The push path has no deadline (both lanes; analyst executed the hang);
  a full report that omits `resultId` leaves the prior session's id in play (analyst, executed);
  `#diagnostics` survives exits and teardowns entirely (reviewer; verified — no clear site
  exists). Carrier: L3.1 item 2. The rest of the diagnostics contract held both lanes' attacks,
  double-settlement included.
- **Claim 5 — SPLIT.** The declared settlement paths are total and correctly coded under the
  reviewer's walk. Broken one layer down: a transport whose `send` throws synchronously escapes
  the settlement path as a raw `Error` and leaks its pending entry (analyst, executed).
  Carrier: L3.1 item 3, with the reviewer's null-id error-response note folded in.
- **Claim 6 — SPLIT.** Bounded and idempotent under the reviewer's hostile-peer attacks through
  the declared promise contract. Broken against a synchronously throwing `close` (analyst,
  executed: `destroy` rejects with the emitter alive) and the `exit` write is unbounded when
  `send` never settles. The reviewer's findings B and C bound the same seam: the transport
  interface documents no obligations, and a close rejection after the deadline is swallowed by
  the destroyed emitter. Carrier: L3.1 item 4.
- **Claim 7 — BROKEN.** The correlation row cannot detect mis-correlation, the abort row proves
  nothing about self-destruction, the method-literal pin never ran red, the hung-shutdown row
  requires the forbidden cancellation, and the schedules L4 will exercise are unpinned (both
  lanes, complementary lists). Carrier: L3.1 item 6.
- **Claim 8 — SPLIT.** The law held under the analyst's sweep (placement, naming, syntax,
  host-independence, ownership). Broken on the types-first law the reviewer read: the client
  sends its wire payloads unbound to the declared payload types, and `LSPHeader` has no
  consumer at all after the L2.1 state redesign. Carrier: L3.1 item 7. Ruling on `LSPHeader`:
  the capability it named — a public parsed-header artifact — is superseded by
  `LSPDecodeState`; the declaration is struck, and this verdict corrects the reconciliation's
  ruling 13 on the record.

## Rulings the fixes bind to

- **The client owns a lifecycle state machine.** One state answers every door: what `start`,
  `open`, `close`, `destroy`, a write, and a cancel notification may do is read from the state,
  never from a scattered field. Only `exit` follows `shutdown`; nothing but the handshake
  precedes the initialize result; a dead generation refuses writes with `closed`.
- **`start` after a failed handshake or a peer exit is a fresh transport generation.** The
  client calls `transport.start()` again; the transport interface documents that `start` may be
  invoked again only after its `close` resolved or its `exit` fired, and an implementation that
  cannot reconnect rejects that call. This settles the reviewer's pre-L4 referral as a
  documented obligation on the seam, per the reachability rule.
- **The transport interface carries its obligations in TSDoc**: `send` and `close` reject
  rather than throw; post-`close` `send` resolves `false`; the client still defends both
  directions (a synchronous throw is treated as a rejection), because a foreign implementation
  is exactly what the seam admits.
- **Retained bytes are owned.** The decoder copies what it keeps — chunk retention and frame
  remainder alike — and the state it returns is safe against caller mutation and does not pin
  delivered frames.
- **Session state lives and dies with the session.** Diagnostics result ids clear wherever
  capabilities clear, and a full report without `resultId` deletes the prior entry.
- **A close failure after the destroy deadline is surfaced before the emitter dies**, and the
  ordering is pinned.

## Terminal ruling

`FAIL` — fix unit L3.1 carries every retained finding on the Sol bench from the committed
`cd414f1` baseline; its auditor is the `reviewer` lane (the engine that did not write it) over
the repaired rows, riding with a mutation-probe close for the prescriptions adopted verbatim.
L4 does not open until L3.1 lands green and its re-check passes. No finding was dropped; both
lanes' verdicts stand immutable beside this file.
