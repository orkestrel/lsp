# Reconciliation — the M-chain audit round (M7 + M7.1 + M7.2.1)

Subject: mcp commits `06d7f4a`, `33be98b`, and `e5ac674` from baseline `a379b08`, audited on one
identical brief (`m7-chain-audit-brief.md`) by the subjective `reviewer` lane (Opus 5, native)
and the objective `analyst` lane (GPT-5.6 Sol, `codex exec` read-only, journal
`tmp/codex/m7-audit-analyst.jsonl`, session `01a03b53-618f-7ea3-b7b4-49d64d6f2a01`). The lanes
ran serialized on the bench and blind: neither saw the other's return before both landed — the
reviewer verdict was held in the Orchestrator's scratchpad until the analyst exited. Both
verdicts sit beside this file verbatim. Both returned FAIL.

## Per-claim reconciliation

- **Claim 1 (modern-only client).** The code legs hold in both lanes: no negotiation, pin, or
  fallback; `MCPClientOptions.version` admits only `MCPModernVersion`; only discovery
  method-not-found names the adapter; no production type widened. The reviewer broke the claim's
  universal "a legacy peer met directly draws a refusal that names the adapter" with the
  reference-population split the campaign's own deleted guide text sourced: a Python-SDK-style
  peer answers `-32602` and gets no guidance. Both lanes agree the classifier stays narrow —
  `-32602` is not proof of a missing method. Ruling: the code stands; the false universal is a
  guide and claim-wording defect. Carrier: M7.3 item 7's boundary prose.
- **Claim 2 (faithful translation).** The reviewer confirmed under its attacks; the analyst
  broke it with an executed attack the reviewer did not try: a valid legacy `initialize` result
  carrying `instructions` loses the field — both legacy schemas permit it and modern discovery
  carries it optionally. Retained on the analyst's evidence. Carrier: M7.3 item 3.
- **Claim 3 (one implementation, shared projections).** CONFIRMED in both lanes. Closed.
- **Claim 4 (migrated rows prove what they name).** Broken in both lanes on disjoint rows, all
  retained: the migrated CONTROL row that can no longer fail and the missing negative row for
  the `isMCPLegacyResult` gate (reviewer 4a → M7.3 item 5); the misnamed, misplaced refusal row
  with its dead fixture branch (reviewer 4b → M7.3 item 6); the superseded parked-write race
  replaced by a timeout row that never supersedes (analyst 4 → M7.3 item 4).
- **Claim 5 (recorded proofs bind).** The reviewer's unresolved leg settled CONFIRMED by the
  Orchestrator's probe (`m7-chain-claim5-settling.md`): the `it.each` expansions at `06d7f4a`
  yield exactly the 6 rows the recorded red claims. The analyst's leg stands: no recorded
  runtime red binds the reworked bounded-write row from M7.1. Carrier: M7.3 item 4's rebuild
  carries its own red and mutation proof, which subsumes the gap.
- **Claim 6 (guide truth).** Broken in both lanes with complementary evidence, all retained:
  the self-contradicting universal at `guides/mcp.md:4321`, the deleted sourced
  reference-server statement, and the stdio example at `:2428` that drives a possibly legacy
  child through an undecorated bare client and claims `client.version` can become legacy.
  Carrier: M7.3 item 7.
- **Claim 7 (inside the law).** Broken in both lanes, union retained: the empty conditional
  with a live condition (`src/core/MCPClient.ts:542-552` region) and its
  `JSONRPC_INVALID_REQUEST` import (both lanes → M7.3 item 1); the factory and options TSDoc
  still describing the removed `initialize` handshake (`factories.ts:73-82`, `types.ts:2253`;
  the analyst's outside-finding adds the `StdioClientTransport` example TSDoc at `:62`) and the
  stale suite name at `MCPClient.test.ts:649` (→ M7.3 item 2); the four exported,
  guide-documented era helpers with no test anywhere in `tests/` (reviewer 7d → M7.3 item 9).
- **Claim 8 (exact classification).** CONFIRMED in both lanes. The analyst ruled the
  Orchestrator-written id-less message pin exact — the fixture emits the stated peer message
  and the settlement path prefixes it exactly as asserted, with the row's isolation subject
  intact — which closes the acceptance-law requirement that an Orchestrator-written part be
  audited by an engine the Orchestrator does not share. Closed.
- **Claim 9 (transport seam).** The analyst settled it as a defect, overturning the interim
  "deadline is the honest surface" reading: `MCPClientTransportInterface.send`
  (`types.ts:2135`) requires a request/response transport to emit its synchronous reply and
  reject when the exchange fails, and the server `HTTPClientTransport` instead resolves
  silently on a `401` JSON body that is not JSON-RPC — proven by an injected-fetch attack both
  ways. The reviewer's lane contribution stands with it: the bearer row's name and comment are
  honest for what shipped, and the guide documents no auth model for the transport. Carrier:
  M7.3 item 8, which re-pins the bearer socket row to the auth-shaped rejection and adds the
  guide's auth prose.

## Findings outside the claims

- **F1 (hand-rolled stamp).** The adapter rebuilds the modern-result literal that
  `buildModernResult` owns. Retained → M7.3 item 10.
- **F2 (id-0 reservation undocumented).** Retained → M7.3 item 11.
- **F3 (`SUPPORTED_CLIENT_PROTOCOL_VERSIONS` misnomer).** Retained, but its remedy renames a
  published token, which belongs to the M6 naming cascade the user blesses. Carrier: the M6
  ask list, beside the `SUPPORTED_PROTOCOL_VERSIONS` rename and the adapter family name.
- **Analyst outside-finding (stdio example TSDoc).** Folded into M7.3 item 2.

## The reviewer's referrals, ruled

The reviewer referred, with `file:line` evidence and no verdict, the adapter-lifecycle trio:
`#methods` grows without bound when requests settle by client deadline; a malformed legacy
result costs the caller a deadline rather than an error; discovery before the handshake emits
an `error` event and never answers. The analyst did not see them. Ruling: all three are one
seam — a request the adapter cannot answer or translate leaves its correlated pending request
to die silently — and they go to M7.3 item 12 as a resolved-and-proven obligation: the adapter
answers a correlated request it cannot serve with a correlated JSON-RPC error (which also
deletes the `#methods` entry), and the growth bound is stated and pinned. The unit stops and
reports if the resolution requires a public type change.

## Dropped findings

None. Every finding either lane raised is substantiated and carries exactly one carrier named
in this file.

## Round consequences

- The M7 chain is not accepted. M7.3 (Sol `implementer`, mcp, baseline `e5ac674`) precedes M2
  in the M-wave queue and carries items 1-12; its fix-round auditor is the `reviewer` (the
  engine that did not write it), with the `analyst` lane added on FAIL or where its claims span
  both correctness and shape again.
- F3 joins the M6 blessing list rather than M7.3.
- The lanes ran serialized on one bench with blindness preserved; the checker did not run — the
  acceptance criteria here are behavioral, not mechanical counts.

VERDICT: FAIL — reconciled to the M7.3 carrier set; claims 3 and 8 closed, claim 5's reviewer
leg settled by the Orchestrator's probe
