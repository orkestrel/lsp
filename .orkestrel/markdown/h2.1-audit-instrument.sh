#!/bin/bash
# h2.1 audit evidence instrument — Orchestrator-run, 2026-08-26.
# Produces: the isolated h2.1 diff, the green runs, the revert-proof controls, and an exact restore.
set -u
S=/tmp/claude-0/-home-user/e78ce9cf-999c-5254-92bf-205d07ca630a/scratchpad
PRE=$S/h2iso/pre
MD=/home/user/markdown
OUT=$S/h2.1-evidence
mkdir -p $OUT

echo "== step 1: isolated h2.1 diff (pre-h2.1 reconstruction vs committed d310eea) =="
( cd $PRE && git -C $MD rev-parse HEAD > /dev/null
  for f in $(cd $MD && git ls-files); do
    if ! cmp -s "$PRE/$f" "$MD/$f" 2>/dev/null; then echo "DIFFERS: $f"; fi
  done ) | tee $OUT/differing-files.txt

echo "== step 2: full unified isolated diff over the differing files =="
> $OUT/h2.1-isolated-diff.txt
while read -r line; do
  f=${line#DIFFERS: }
  diff -u --label "pre-h2.1/$f" --label "h2.1/$f" "$PRE/$f" "$MD/$f" >> $OUT/h2.1-isolated-diff.txt
done < $OUT/differing-files.txt
wc -l $OUT/h2.1-isolated-diff.txt

echo "== step 3: green runs at d310eea =="
cd $MD
npx vitest run --project src:core tests/src/core/Markdown.test.ts -t 'does not cross an input identity into its separate output derivation' > $OUT/green-derive.txt 2>&1
echo "derive green exit: $?" | tee -a $OUT/green-derive.txt
npx vitest run --project src:core tests/src/core/helpers.test.ts -t 'projects a zero-width abutment through the later segment' > $OUT/green-project.txt 2>&1
echo "project green exit: $?" | tee -a $OUT/green-project.txt

echo "== step 4: revert-proof controls (pre-h2.1 sources under the h2.1 tests) =="
cp $PRE/src/core/Markdown.ts $MD/src/core/Markdown.ts
cp $PRE/src/core/helpers.ts $MD/src/core/helpers.ts
npx vitest run --project src:core tests/src/core/Markdown.test.ts -t 'does not cross an input identity into its separate output derivation' > $OUT/control-derive.txt 2>&1
echo "derive control exit: $?" | tee -a $OUT/control-derive.txt
npx vitest run --project src:core tests/src/core/helpers.test.ts -t 'projects a zero-width abutment through the later segment' > $OUT/control-project.txt 2>&1
echo "project control exit: $?" | tee -a $OUT/control-project.txt
echo "-- harness validity under revert: full two files, expect only the two named rows red --"
npx vitest run --project src:core tests/src/core/Markdown.test.ts tests/src/core/helpers.test.ts > $OUT/control-fullfiles.txt 2>&1
echo "fullfiles control exit: $?" | tee -a $OUT/control-fullfiles.txt

echo "== step 5: exact restore of the committed sources =="
git -C $MD checkout -- src/core/Markdown.ts src/core/helpers.ts
git -C $MD status --porcelain > $OUT/post-restore-status.txt
echo "post-restore status bytes: $(wc -c < $OUT/post-restore-status.txt)"

echo "== step 6: restored green re-run (proves the restore) =="
npx vitest run --project src:core tests/src/core/Markdown.test.ts -t 'does not cross an input identity into its separate output derivation' > $OUT/restored-derive.txt 2>&1
echo "restored derive exit: $?" | tee -a $OUT/restored-derive.txt
echo "DONE"
