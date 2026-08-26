# Unit g1-process — report

## Sentence landed

Extended the existing passage at `guides/process.md:269` (in `## Supervised children`, right
after the sentence documenting carriage-return redraw framing) with:

> This line stream is the package's progress surface: a consumer reads a child's progress off
> the lines it already receives, so the package exposes no separate progress channel.

Placement: inline extension of the paragraph at `:269`, immediately before "Standard error is
decoded...", per the brief's first option.

## Gate readings

1. `npm run format:check` — exit 0.

```
> @orkestrel/process@0.0.6 format:check
> oxfmt --config .oxfmtrc.json --check .

Checking formatting...

All matched files use the correct format.
Finished in 6366ms on 147 files using 4 threads.
```

2. `npm run test:guides` (repository declares this script; ran it in place of the raw
   `npx vitest run --project guides` invocation) — exit 0.

```
> @orkestrel/process@0.0.6 test:guides
> vitest run --config vite.config.ts --no-cache --reporter=dot --project guides

 RUN  v4.1.11 /home/user/process

·································································································-···

 Test Files  1 passed (1)
      Tests  100 passed | 1 skipped (101)
   Start at  11:55:31
   Duration  3.24s (transform 787ms, setup 74ms, import 1.14s, tests 1.76s, environment 0ms)
```

## Diff

```diff
diff --git a/guides/process.md b/guides/process.md
index f96ef27..a87161b 100644
--- a/guides/process.md
+++ b/guides/process.md
@@ -267,7 +267,9 @@ name ids and `void` when you stop every child.
 `readline`, including a final line written without a trailing newline. A line feed, a CRLF pair, and
 a bare carriage return each terminate a line, and a CRLF split across delivered chunks joins as one
 break. A child that redraws a progress bar with a carriage return therefore yields one line per
-redraw, and consecutive carriage returns yield an empty line between them. Standard error is decoded
+redraw, and consecutive carriage returns yield an empty line between them. This line stream is the
+package's progress surface: a consumer reads a child's progress off the lines it already receives,
+so the package exposes no separate progress channel. Standard error is decoded
 and forwarded live as the `stderr` event, while a byte-bounded raw tail is retained as `evidence` —
 the diagnostic to attach to a failed exit. The typed `emitter` also carries the child `error` cause
 on a spawn fault, a `ProcessError` coded `protocol` whose cause is a host-reported standard-input
```

## Status output

```
 M guides/process.md
```

## Flags

None. The pre-existing skipped test (`1 skipped`) predates this change and is unrelated to
`guides/process.md`; no other file was touched.

## Summary

Landed the progress-surface ruling as an inline extension of `guides/process.md:269`; both
gates (`format:check`, `test:guides`) exit 0, and `git status --short` shows only
`guides/process.md` modified.
