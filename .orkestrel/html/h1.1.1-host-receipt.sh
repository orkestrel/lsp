#!/bin/bash
# H1.1.1 host receipt: mutation red control over the reused-identity clause in
# rewriteDocument (src/core/helpers.ts:1319). Fallback instrument: the prove tool is
# unregistered in this session, so this script is the receipt, with its own control.
# Coverage: the strengthened reused-existing-node identity claim ONLY; the remaining
# rows carry the unit's in-sandbox cmp-proven mutation accounts.
set -o pipefail
cd /home/user/html || exit 9
SCRATCH=/tmp/claude-0/-home-user/e44afe43-d783-57c4-9b94-e1b722b0b4a2/scratchpad
BACKUP="$SCRATCH/helpers.ts.h111-receipt-backup"
LOG="$SCRATCH/h1.1.1-host-receipt.log"
: > "$LOG"
cp src/core/helpers.ts "$BACKUP" || exit 9

ROW="leaves a node returned for separate sources unprovenanced|carries root provenance through an identity map"

# Mutation: delete the outputs-ambiguity clause at its exact line.
sed -i '1319{/else if (source !== current) derivations.set(rewritten, undefined)/d}' src/core/helpers.ts
if cmp -s src/core/helpers.ts "$BACKUP"; then
	echo "MUTATION_NOT_APPLIED"
	exit 8
fi

npx vitest run --config vite.config.ts --no-cache --reporter=verbose --project src:core \
	tests/src/core/HTML.test.ts -t "$ROW" >> "$LOG" 2>&1
MUTATED=$?
echo "MUTATED_RUN exit=$MUTATED"

cp "$BACKUP" src/core/helpers.ts || exit 9
if cmp -s src/core/helpers.ts "$BACKUP"; then
	echo "RESTORE_CMP_OK"
else
	echo "RESTORE_CMP_FAILED"
	exit 7
fi

npx vitest run --config vite.config.ts --no-cache --reporter=verbose --project src:core \
	tests/src/core/HTML.test.ts -t "$ROW" >> "$LOG" 2>&1
RESTORED=$?
echo "RESTORED_RUN exit=$RESTORED"

grep -E "✓|×|✗|failed|passed" "$LOG" | tail -20

if [ "$MUTATED" -ne 0 ] && [ "$RESTORED" -eq 0 ]; then
	echo "RECEIPT_OK: mutation reddened the row, restoration green, cmp exact"
else
	echo "RECEIPT_FAILED"
	exit 6
fi
