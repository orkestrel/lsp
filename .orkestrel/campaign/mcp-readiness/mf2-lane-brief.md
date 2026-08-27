# A-MF2 — cross-engine check of the mcp fix round

You are the objective cross-engine check of a fix round written by Opus. Attempt to refute every
claim from source; you cannot execute, so rule from the code and the supplied evidence, marking
`UNRESOLVED` what only a run could settle. `CONFIRMED` requires naming the attack you tried that
failed. Edit nothing, spawn nothing. You are rooted in a detached worktree at the audited commit;
the main checkout is out of bounds.

## Subject

mcp `6b21881` (the MF2 fix round). The accepted findings it lands:
`C:\Users\mikes\WebstormProjects\lsp\.orkestrel\campaign\mcp-readiness\am-reconciliation.md`.
Evidence beside this brief: `mf2.diff` (the commit), `mf2-report.md` (the writer's report,
testimony — its recorded run counts are writer-produced).

## What the round decides

Whether the A-M audit round closes. Prescription-verbatim rows carry the writer's failing-first
and revert records; your subject is the DESIGN DEPARTURES and silent drops.

## Claims

1. The port-door gate is complete: every path by which `prompts/get` or `resources/read` can
   answer an `input_required` result passes the forwarded `inputRequests` through the gate
   before stamping, and a result carrying only a continuation carrier (no requests) is stamped
   ungated — which is sound because it asks the client for nothing.
2. The widened `MCPSampleContent` union matches the pinned mirror's `CreateMessageResult.content`
   `anyOf` exactly — nothing admitted the schema refuses (resource arms stay refused), nothing
   refused the schema admits (`tests/mirrors/ext-tasks-2026-07-28-schema.json:1858-1881`).
3. The mixed-round capability composition is exact: URL-only missing → `{ url: {} }`, form-only
   missing → `{}`, both missing → `{ form: {}, url: {} }` — wait: verify the FORM key's actual
   spelling against what `isFormElicitationSupported` reads; a `{ form: {} }` member that the
   support predicate never reads would be a new unactionable payload. Rule on what a client must
   DECLARE to satisfy each payload the function can emit, and whether declaring exactly that
   passes the gate on the identical round.
4. The unified `-32602` defensive reading is consistent at every door, the ingress remains the
   only reachable answerer of an unparsable modern context, and no reachable wire behavior
   changed (the writer's probe record claims this; attack it from the routes in source).
5. The stateless-retry seam is coherent end to end: the client omits `requestState` exactly when
   absent; this package's own server always seals, so its `#retry` pairing requirement cannot
   refuse a retry this package's server caused; a FOREIGN stateless server's round is answerable
   through the public client.
6. The `selector` rename left no `round`-keyed option reference anywhere (`src/`, `tests/`,
   `guides/`), and no `{ round: … }` application-state literal was wrongly renamed.
7. Every row of the reconciliation's "Accepted findings → fix unit MF2" list landed in the diff
   or is named in the report's departures — none silently dropped. Walk the list.
8. The guide's corrected cells and narrative are true against the shipped code: the conformance
   baseline paragraph, the input-policy section's URL-mode and round-size sentences, the
   no-longer-deprecated-carrier cells, and the repaired table row renders three columns.

## Verdict shape

Numbered verdicts (`CONFIRMED` with the failed attack / `BROKEN` with the exact failing input,
state, or interleaving plus the smallest fix / `UNRESOLVED` with what would settle it /
`NOT-EVIDENCED`), findings outside the claims to the `BROKEN` standard, then exactly one
terminal line:

```text
VERDICT: PASS — <m> of <m> confirmed, no findings outside the claims
VERDICT: FAIL — <n> broken, <u> unresolved, <e> not-evidenced, <x> findings outside the claims
```

No process diary.
