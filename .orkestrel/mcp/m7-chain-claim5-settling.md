# Claim 5 settling probe — held for reconciliation (not shown to the analyst lane)

Reviewer's unresolved leg: M7's refusal reading `-t "names the legacy adapter"` recorded
`Tests 6 failed | 129 skipped (135)` red, and the final tree has only two rows matching that
filter, so the count was uncheckable from the supplied evidence.

Orchestrator run, 2026-08-25:

    git -C /home/user/mcp show 06d7f4a:tests/src/core/MCPClient.test.ts | grep -n "names the legacy adapter"

    829:  'refuses discovery error %i and names the legacy adapter',      (it.each over [JSONRPC_METHOD_NOT_FOUND, JSONRPC_INVALID_REQUEST] -> 2 rows)
    855:  ('refuses %s and names the legacy adapter', ...)                (it.each over the unrecognized-400, unrecognized-404, and send-failure scenarios -> 3 rows)
    1093: it('bounds a silent discovery probe and names the legacy adapter in the refusal')  (1 row)

Expansion total under the filter at 06d7f4a: 6 rows. The recorded `6 failed` is exactly
consistent. Claim 5's unresolved leg settles CONFIRMED at reconciliation.
