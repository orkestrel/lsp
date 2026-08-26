# Unit g1-queue — report

## Sentence landed

Extended the existing CUT clause in invariant 8 at `guides/queue.md:149` (the `## Surface` list),
appending a clause rather than a new sentence, since the CUT list already names the progress /
message channels there and the addition reads as one continuous ruling:

> Still deliberately CUT: scheduling / delay / activation / expiration, priority ordering, an
> explicit `sequential` flag (use `concurrency: 1`), bail, and the progress / message channels —
> progress belongs to the job the queue runs and reaches the consumer through that job's own
> contract, so the queue observes lifecycle only and never duplicates a surface the job already
> owns.

The prose intro's CUT mention at `guides/queue.md:29` (`no delay / progress / message channels`)
was left unchanged: the brief's objective named the passage at `:149` as the one to extend, and the
intro sentence already reads as a short summary that the invariant list details.

## Gate readings

1. `npm run format:check` — exit 0. Output: "All matched files use the correct format."
2. `npm run test:guides` — exit 0. Output: `Test Files 1 passed (1)`, `Tests 23 passed (23)`.

## Diff

```diff
diff --git a/guides/queue.md b/guides/queue.md
index ddabbae..d264a23 100644
--- a/guides/queue.md
+++ b/guides/queue.md
@@ -146,7 +146,7 @@ These invariants hold across `src/core` ↔ `queue.md`:
 5. **Per-attempt timeout + cancellation, over L1.** ...
 6. **Retries, but abort never retries.** ...
 7. **Lifecycle (§10).** ...
-8. **Observable + de-bloated.** ... Still deliberately CUT: scheduling / delay / activation / expiration, priority ordering, an explicit `sequential` flag (use `concurrency: 1`), bail, and the progress / message channels.
+8. **Observable + de-bloated.** ... Still deliberately CUT: scheduling / delay / activation / expiration, priority ordering, an explicit `sequential` flag (use `concurrency: 1`), bail, and the progress / message channels — progress belongs to the job the queue runs and reaches the consumer through that job's own contract, so the queue observes lifecycle only and never duplicates a surface the job already owns.
 9. **DOC ↔ SOURCE method bijection.** ...
 10. **Persistence holds outstanding-only — the dual-store convention.** ...
 11. **Durability is wired into the `Queue` (outstanding-only, restartable).** ...
```

(Full unabridged diff available via `git diff` in `/home/user/queue`; only invariant 8's line
changed.)

## Status output

```
 M guides/queue.md
```

## Flags

None. No off-limits file needed a change; the reason fit inside the existing sentence at the named
line.

## Summary

Landed the queue-owns-lifecycle-only ruling as an appended clause on invariant 8 in
`guides/queue.md:149`; `format:check` and `test:guides` both exit 0.
