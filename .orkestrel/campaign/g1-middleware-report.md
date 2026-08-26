# Unit g1-middleware — report

## Summary

Landed the two-sentence progress ruling beside the multipart material in `guides/middleware.md`,
after the "Multipart limits — direct resolution" fence and before "### Assets: in-memory source"
(new lines 680-681). Both gates exit 0.

## Sentence landed and where

Inserted after `guides/middleware.md:679` (the closing fence of the `resolveMultipartLimits`
example), before the `### Assets: in-memory source` heading:

> Multipart processing reports no progress. A consumer's request for upload progress is the
> condition under which a reporter callback would join `MultipartOptions`.

This sits closer to the multipart material than the `:652-720` seam-adaptations block, and reads
naturally as the closing note on the multipart section before the guide moves to assets. It names
no key and shows no option, matching the brief's constraint that `MultipartOptions` carries no
such key on 2026-08-26.

## Gate readings

1. `npm run format:check` — exit 0.
   ```
   Checking formatting...
   All matched files use the correct format.
   Finished in 4928ms on 155 files using 4 threads.
   ```
2. `npm run test:guides` (repository's declared script) — exit 0.
   ```
    RUN  v4.1.11 /home/user/middleware
   ·································
    Test Files  1 passed (1)
         Tests  33 passed (33)
      Start at  11:56:03
      Duration  957ms
   ```

## Diff

```diff
diff --git a/guides/middleware.md b/guides/middleware.md
index 2bb72b8..5af3e23 100644
--- a/guides/middleware.md
+++ b/guides/middleware.md
@@ -677,6 +677,9 @@ import { resolveMultipartLimits } from '@orkestrel/middleware/server'
 resolveMultipartLimits({ file: 1_048_576 }) // fills in every other default cap
 ```
 
+Multipart processing reports no progress. A consumer's request for upload progress is the
+condition under which a reporter callback would join `MultipartOptions`.
+
 ### Assets: in-memory source
 
 ```ts
```

## Status

```
 M guides/middleware.md
```

## Flags

None. No parity failure encountered; the sentence names no option key so `tests/guides.test.ts`
has nothing new to resolve against a public export, and the existing 33 guide tests pass
unchanged.

Summary: Landed a two-sentence progress ruling in `guides/middleware.md` beside the multipart
material; `format:check` and `test:guides` both exit 0.
