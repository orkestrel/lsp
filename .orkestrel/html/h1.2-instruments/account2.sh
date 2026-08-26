#!/usr/bin/env bash
# One mutation account: back up byte-exact, apply the quoted-line mutation, prove the
# backup differs while mutated, run the whole test file unfiltered, restore, prove cmp 0.
# usage: account2.sh <spec.json> <label>
set -u
cd /home/user/html || exit 9
SPEC="$1"
LABEL="$2"
FILE=$(node -e "console.log(JSON.parse(require('node:fs').readFileSync(process.argv[1],'utf8')).file)" "$SPEC")
BACKUP="tmp/mutation/${LABEL}.backup"
LOG="tmp/mutation/${LABEL}.log"
cp "$FILE" "$BACKUP"
echo "=== ${LABEL}: file ${FILE} ==="
node tmp/mutation/apply.mjs "$SPEC" || { cp "$BACKUP" "$FILE"; echo "NOT APPLIED"; exit 3; }
cmp "$BACKUP" "$FILE" >/dev/null 2>&1
echo "cmp under mutation exit=$? (non-zero proves the instrument can report a difference)"
npx vitest run --config vite.config.ts --no-cache --project src:core tests/src/core/HTML.test.ts >"$LOG" 2>&1
echo "vitest exit=$?"
grep -E "^( FAIL| Tests| Test Files)|AssertionError|to deeply equal|to be undefined" "$LOG" | head -40
cp "$BACKUP" "$FILE"
cmp "$BACKUP" "$FILE"
echo "cmp after restore exit=$?"
