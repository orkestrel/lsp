#!/bin/bash
set -o pipefail
cd /home/user/workflow || exit 9
SCRATCH=/tmp/claude-0/-home-user/e44afe43-d783-57c4-9b94-e1b722b0b4a2/scratchpad
LOG="$SCRATCH/w1-f1-receipt.log"
: > "$LOG"
FILE=src/core/validators.ts
BAK="$SCRATCH/validators.ts.w1f1.bak"
cp "$FILE" "$BAK" || exit 9
ROW='./node_modules/.bin/vitest run --config vite.config.ts --no-cache --project src:core tests/src/core/validators.test.ts -t rejects the removed progress unit as an unknown key'

node -e "
const fs = require('fs');
const path = 'src/core/validators.ts';
const text = fs.readFileSync(path, 'utf8');
const target = \"(key) => key === 'progress' || key === 'total' || key === 'message',\";
const mutated = \"(key) => key === 'progress' || key === 'total' || key === 'message' || key === 'unit',\";
if (!text.includes(target)) { console.error('TARGET_ABSENT'); process.exit(2); }
fs.writeFileSync(path, text.replace(target, mutated));
console.log('MUTATED');
" || exit 2

cmp -s "$FILE" "$BAK"
echo "CMP_UNDER_MUTATION=$?"

./node_modules/.bin/vitest run --config vite.config.ts --no-cache --project src:core tests/src/core/validators.test.ts -t "rejects the removed progress unit as an unknown key" >> "$LOG" 2>&1
echo "ROW_UNDER_MUTATION_EXIT=$?"

cp "$BAK" "$FILE" || exit 9
cmp -s "$FILE" "$BAK"
echo "CMP_AFTER_RESTORE=$?"

./node_modules/.bin/vitest run --config vite.config.ts --no-cache --project src:core tests/src/core/validators.test.ts -t "rejects the removed progress unit as an unknown key" >> "$LOG" 2>&1
echo "ROW_AFTER_RESTORE_EXIT=$?"

grep -E "Tests |AssertionError|expected" "$LOG" | tail -6
echo "RECEIPT_DONE"
