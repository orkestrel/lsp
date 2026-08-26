#!/bin/bash
# M3.2 closure: mutation probes for a verbatim-adoption fix round.
# Disable the snapshot and the reorder each in turn; the adopted pin must fail;
# restore byte-exact and prove it with cmp.
set -u
cd /home/user/mcp || exit 9
SCRATCH="/tmp/claude-0/-home-user/e44afe43-d783-57c4-9b94-e1b722b0b4a2/scratchpad"
BASE="$SCRATCH/MCPClient.m32-baseline.ts"
cp src/core/MCPClient.ts "$BASE" || exit 8

node "$SCRATCH/m3.2-mutate.cjs" snapshot || { echo "MUTATE_A_FAILED"; exit 7; }
echo "=== MUTATION A (deferred signal read) applied; accessor pin must FAIL ==="
npm run test:src:core -- tests/src/core/MCPClient.test.ts -t 'snapshots an accessor signal before a later read aborts it' >"$SCRATCH/m32-probe-a.log" 2>&1
echo "MUTATION_A_EXIT=$?"
grep -E "Tests .*(failed|passed)" "$SCRATCH/m32-probe-a.log" | tail -2
cp "$BASE" src/core/MCPClient.ts
cmp "$BASE" src/core/MCPClient.ts && echo "RESTORE_A_BYTE_IDENTICAL"

node "$SCRATCH/m3.2-mutate.cjs" reorder || { echo "MUTATE_B_FAILED"; exit 6; }
echo "=== MUTATION B (discard before progress) applied; claimed-progress pin must FAIL, discard pin must PASS ==="
npm run test:src:core -- tests/src/core/MCPClient.test.ts -t 'claims stale-stamped progress for the active call before subscription routing' >"$SCRATCH/m32-probe-b1.log" 2>&1
echo "MUTATION_B_CLAIM_EXIT=$?"
grep -E "Tests .*(failed|passed)" "$SCRATCH/m32-probe-b1.log" | tail -2
npm run test:src:core -- tests/src/core/MCPClient.test.ts -t 'discards stale-stamped frames that no active call or subscription claims' >"$SCRATCH/m32-probe-b2.log" 2>&1
echo "MUTATION_B_DISCARD_EXIT=$?"
grep -E "Tests .*(failed|passed)" "$SCRATCH/m32-probe-b2.log" | tail -2
cp "$BASE" src/core/MCPClient.ts
cmp "$BASE" src/core/MCPClient.ts && echo "RESTORE_B_BYTE_IDENTICAL"

echo "=== RESTORED: both pins must PASS again ==="
npm run test:src:core -- tests/src/core/MCPClient.test.ts -t 'snapshots an accessor signal before a later read aborts it' >"$SCRATCH/m32-probe-r1.log" 2>&1
echo "RESTORED_ACCESSOR_EXIT=$?"
npm run test:src:core -- tests/src/core/MCPClient.test.ts -t 'claims stale-stamped progress for the active call before subscription routing' >"$SCRATCH/m32-probe-r2.log" 2>&1
echo "RESTORED_CLAIM_EXIT=$?"
echo "PROBES_DONE"
