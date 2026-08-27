# A-M2 — falsification of the `x-mcp-header` unit

You are the objective cross-engine lane auditing a unit written by Opus. Attempt to refute every
claim from source; you cannot execute — rule from the code and the supplied evidence, marking
`UNRESOLVED` what only a run could settle. `CONFIRMED` requires naming the attack you tried that
failed. Edit nothing, spawn nothing. Rooted in a detached worktree at the audited commit; the
main checkout is out of bounds.

## Subject

mcp `a7d245c` (M2): the sentinel-marker centralization, the client-side `x-mcp-header`
projection and violating-tool exclusion on both HTTP faces (derive-from-traffic: cache from
delivered `tools/list` results), and the server-side per-call `Mcp-Param-*` validation through a
synthetic `tools/list` dispatch. Evidence beside this brief: `m2.diff`, `m2-report.md`
(testimony; run counts writer-produced). The spec rules are restated in the report and in
`C:\Users\mikes\WebstormProjects\lsp\.orkestrel\campaign\mcp-readiness\r1-report.md`.

## Claims

1. The markers are one spelling (`MCP_SENTINEL_PREFIX`/`MCP_SENTINEL_SUFFIX`, both functions
   reading them), the overlap boundary is pinned (a value too short to hold both markers is
   literal), and the encode membership rule is unchanged.
2. `buildHeaderParameters` is exact against the constraint list, and the reachability decision
   (count-anywhere versus properties-chain walk) admits every legal position and refuses every
   illegal one. Attack it with adversarial schemas: a PROPERTY literally named `items` or
   `oneOf` whose subschema carries a legal annotation (the walk must not confuse a property
   name with a keyword); an annotation on the schema root; `patternProperties`; a cycle; depth
   at the bound.
3. The client cache is correct across LISTINGS: a paginated `tools/list` (a result carrying
   `nextCursor`, then a second page) must not forget page-one projections when page two
   arrives, and the rebuilt result preserves `resultType`, `ttlMs`, `cacheScope`, and
   `nextCursor`. Attack the cache's replace-versus-accumulate behavior and the rebuild's field
   preservation.
4. The server lookup validates the forgery case (a client that never listed) and is itself
   complete across pagination: the synthetic `tools/list` dispatch reads one page — attack
   whether a tool beyond the first page escapes validation (its schema unfound, its
   `Mcp-Param-*` headers treated as unrecognized and forwarded), and rule what the built-in
   page size makes reachable. Also: the synthetic request's id `0` never leaves the handler; a
   held-open answer is stopped; refusals never echo the supplied header value.
5. The exclusion drops exactly the invalid definitions: valid siblings survive, entries that
   are not records or carry no string name are kept, and the reported exclusion rides the
   `error` event without disturbing pending requests.
6. Scope honesty: the diff touches exactly the sixteen files; no banned construct; the
   conformance baseline rewrites are internally consistent (derived red lists now empty; the
   comments state rules, not populations).
7. The guide's rewritten entries are true against the shipped code, including the declared
   SHOULD departure (re-list-and-retry) and the retitled `-32020` entry.
8. The writer's sound-and-unchanged verdicts hold. Attack at least: the grep-based claim that
   no stdio/WebSocket/MessagePort module reaches the projection; and the claim that
   `tests/conformanceClient.ts` needed no change BECAUSE the exclusion changes what it calls.
   Say how many you attacked.

## Verdict shape

Numbered verdicts (`CONFIRMED` with the failed attack / `BROKEN` with the exact failing input,
state, or interleaving plus the smallest fix / `UNRESOLVED` with what would settle it /
`NOT-EVIDENCED`), findings outside the claims to the `BROKEN` standard, then exactly one
terminal line in the standard `VERDICT: PASS|FAIL` form. No process diary.
