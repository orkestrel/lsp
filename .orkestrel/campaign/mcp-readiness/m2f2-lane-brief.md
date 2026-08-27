# A-M2F2 — focused cross-engine check of the listing-lineage guard

You are the objective audit lane, running on Cursor Grok as the recorded substitute for GPT-5.6
Sol. Perform this assignment directly and spawn nothing. This is a read-only source review of
this worktree (mcp at commit `afca2f8`); your mode cannot execute commands, so rule from source
and from the supplied evidence. Writer-produced run counts in `tmp/audit/m2f2-report.md` are
testimony; `tmp/audit/runs.txt` is the Orchestrator-executed record.

## Subject

The M2F2 fix round (`tmp/audit/m2f2.diff`, commit `afca2f8`): generation-guarded caching on
both HTTP client faces, plus the carried `DEFAULT_MCP_LIMITS` TSDoc patch and the
`server/discover` legacy-door row. The A-M23F verdict's claim 4 named the defect: overlapping
`tools/list` responses resolving out of order merged two listings into one projection table.

## Claims to falsify

Attack each claim. For each, return a verdict — CONFIRMED, BROKEN, UNRESOLVED, or
NOT-EVIDENCED — with the exact evidence (`file:line`) and the attack you ran. A claim is
CONFIRMED only if your attacks failed to break it.

1. **The guard closes the race in every arrival order.** The stamp is taken at send time
   (cursorless increments first, so a fresh listing's own stamp is current), and `#select`
   applies the clear and every `set` only when the stamp equals the current generation.
   Attack with orderings: the original interleaving (stale continuation resolving after a
   newer fresh listing); two fresh listings resolving out of order; a fresh listing and its
   OWN continuation overlapping. For the last one, note the structural fact and rule on it: a
   continuation's cursor comes from its fresh page's response, so a continuation cannot be in
   flight before its own fresh page resolved — unless a caller fabricates a cursor. Rule
   whether a fabricated-cursor send can corrupt the table beyond the documented safe
   direction (delivered but under-projected).
2. **Delivery is unchanged for a superseded listing.** The exclusion loop, the `error`
   emission, and the returned result run identically whatever the stamp says; only the cache
   mutations are gated. The writer's tripwire row pins it. Attack: a code path where the
   guard's placement skips or reorders anything a caller or observer can see.
3. **The stamp bookkeeping cannot leak or misfire.** The `WeakMap` is keyed by the sent
   message object; `send` → `#exchange` → `#deliver` → `#select` hand the same object
   through. Attack: a shipped path that reuses a sent message object (read
   `src/core/MCPClient.ts` and `tests/conformanceClient.ts`); a path where `#select` runs
   with a `sent` that was never stamped; retry or redirect logic that re-enters `#exchange`
   with the same object after the generation moved.
4. **The landed sentences are true.** The client-projection entry, each face's API clause,
   and the `#select` comments state: superseded listings are delivered whole and cache
   nothing, and under-projection is the safe direction because the server's bounded lookup
   is the validation authority. Attack: any touched `guides/mcp.md` sentence contradicted by
   the shipped code, including whether "the server's bounded lookup stays the validation
   authority" is true for the server this package ships (read `src/server/handlers.ts`).
5. **The carried findings landed exactly.** The `DEFAULT_MCP_LIMITS` TSDoc patch matches the
   M5 report's prescription word for word (rewrap allowed, no word changed), and the
   `server/discover` row pins the legacy decorator's `default` arm in
   `tests/src/core/MCPLegacy.test.ts` in the same shape as the existing case rows. Attack:
   a changed word; a row that would stay green if the decorator grew a `server/discover`
   case.
6. **Scope honesty.** The diff names exactly the files the report's table names; the
   implementation hunks add no `any`, no non-null assertion, no `as` assertion, no ts-ignore
   family, no eslint-disable, and no nested function declaration (an anonymous callback
   passed directly as an argument is permitted). Attack: grep the diff and touched source.

## Output

Write nothing to disk. Return, as your final message: a numbered verdict per claim with
evidence and the attack, any finding outside the claims, and one terminal line in exactly
this shape:

VERDICT: PASS — 0 broken, N unresolved, M not-evidenced
or
VERDICT: FAIL — K broken, N unresolved, M not-evidenced
