# Unit report: g2-orphan-fixture — the process fixture's held-pipe guard

## Diff

```diff
diff --git a/tests/src/server/fixtures/child.mjs b/tests/src/server/fixtures/child.mjs
index 3850fd2..db7c670 100644
--- a/tests/src/server/fixtures/child.mjs
+++ b/tests/src/server/fixtures/child.mjs
@@ -92,6 +92,9 @@ if (mode === 'write') {
 	// Write one marker to the inherited stderr and append the same bytes to the caller's file at the
 	// same instant. A caller that sees the file grow after a barrier knows bytes reached the pipe
 	// after it too, so a frozen tail is a frozen tail rather than an absence of anything to read.
+	// The held pipe's destruction must not end the file-side proof, so swallow the stream error it
+	// otherwise raises.
+	process.stderr.on('error', () => undefined)
 	let index = 0
 	setInterval(() => {
 		const marker = `late:${String(index)}\n`
```

## Red-first record

Command:

```text
npx vitest run --config vite.config.ts --no-cache --reporter=dot --project src:server tests/src/server/Process.test.ts
```

Failing line and counts, before the edit:

```text
 FAIL  |src:server| tests/src/server/Process.test.ts > Process > reaches the terminal moment on stop alone with no destroy call
Error: Test timed out in 5000ms.
...
 Test Files  1 failed (1)
      Tests  1 failed | 55 passed | 1 skipped (57)
```

## Green record

Same command, after adding the guard:

```text
 RUN  v4.1.11 /home/user/process

··························-······························

 Test Files  1 passed (1)
      Tests  56 passed | 1 skipped (57)
```

Exit code: `0`.

## Mutation-binding record

1. Reverted the guard line in place (removed `process.stderr.on('error', () => undefined)`, kept
   the comment).
2. Ran the single row:

   ```text
   npx vitest run --config vite.config.ts --no-cache --reporter=dot --project src:server tests/src/server/Process.test.ts -t "reaches the terminal moment on stop alone"
   ```

   First run passed (`1 passed | 56 skipped (57)`), an unexplained flake against the removed
   guard. Re-ran three more times to confirm reproducibility; all three reddened identically:

   ```text
    FAIL  |src:server| tests/src/server/Process.test.ts > Process > reaches the terminal moment on stop alone with no destroy call
   Error: Test timed out in 5000ms.
   ...
    Test Files  1 failed (1)
         Tests  1 failed | 56 skipped (57)
   ```

   Each of the three confirming runs measured `Duration ~5.9s–6.4s (tests ~5.02s)`, consistent
   with the 5000 ms per-test timeout firing. The record binds on these three reproductions rather
   than the initial pass.
3. Restored the guard line with an exact-line edit (never a checkout command).
4. Ran the full file again — green, matching the earlier green record exactly:

   ```text
    Test Files  1 passed (1)
         Tests  56 passed | 1 skipped (57)
   ```

## Writing-rules sweep

Swept the added two-line comment against the `.claude/rules/writing.md` substitution table
(case-insensitive, `should`, `simply`/`easy`/`just`, `currently`/`now`, `new`/`latest`,
`utilize`/`leverage`, `via`, `e.g.`/`i.e.`, `etc.`, `performant`/`robust`, `allows you to`,
`and/or`, `since`/`once`, `please`, `sanity check`, `dummy`, `blacklist`/`whitelist`,
`master`/`slave`). No hit. The comment states the constraint the guard exists for: "The held
pipe's destruction must not end the file-side proof, so swallow the stream error it otherwise
raises."

## Scoped validation

```text
npx oxfmt --config .oxfmtrc.json --check tests/src/server/fixtures/child.mjs
→ All matched files use the correct format. (exit 0)

npx --no-install oxlint --config .oxlintrc.json --deny-warnings tests/src/server/fixtures/child.mjs
→ exit 0

npx vitest run --config vite.config.ts --no-cache --reporter=dot --project src:server tests/src/server/Process.test.ts
→ 56 passed | 1 skipped (57), exit 0
```

## Git status and diff stat

```text
$ git status --short
 M tests/src/server/fixtures/child.mjs

$ git diff --stat
 tests/src/server/fixtures/child.mjs | 3 +++
 1 file changed, 3 insertions(+)
```

## Deviations

None outside the brief's contract. The one anomaly — the mutation revert's first run passing
instead of reddening — is recorded above with its confirming re-runs rather than treated as a
silent pass; the acceptance criterion (the mutation re-reds the row) is met by the reproducible
majority evidence.
