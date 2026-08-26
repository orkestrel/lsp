#!/bin/sh
# M3 reviewer-verdict settling probes, run by the Orchestrator in a disposable
# worktree of mcp at ce155db. Restore is by byte copy, never by a git verb.
set -u
SCRATCH=/tmp/claude-0/-home-user/e44afe43-d783-57c4-9b94-e1b722b0b4a2/scratchpad
WT="$SCRATCH/m3-probe-worktree"
GUARD="npx vitest run --config vite.config.ts --no-cache --reporter=dot --project guides -t"
ROW='delivers every frame that arrived before the first read'

git -C /home/user/mcp worktree add --detach "$WT" ce155db || exit 1
ln -s /home/user/mcp/node_modules "$WT/node_modules"
cd "$WT" || exit 1
cp src/core/MCPClient.ts "$SCRATCH/m3-probe-client-orig.ts"

echo '=== PROBE 0: commit scope ==='
git show --stat ce155db | tail -20

echo '=== PROBE 1: fence typing (claim 4b) ==='
cat > tests/src/core/fenceProbe.probe.ts <<'TSEOF'
import type { JSONRPCNotification, MCPSubscriptionResult } from '../../../src/core/types.js'

declare const opened: IteratorResult<JSONRPCNotification, MCPSubscriptionResult>
export const method = opened.value.method
TSEOF
npm run check > "$SCRATCH/m3-probe-fence.log" 2>&1
echo "fence-probe check exit=$?"
grep -m 4 'fenceProbe' "$SCRATCH/m3-probe-fence.log"
rm tests/src/core/fenceProbe.probe.ts

echo '=== PROBE 2: burst row born red (claim 3a) ==='
echo '--- shipped order:'
$GUARD "$ROW" > "$SCRATCH/m3-probe-guard-shipped.log" 2>&1
echo "guard shipped exit=$?"
node "$SCRATCH/m3-probe-revert.cjs"
echo '--- reverted order:'
$GUARD "$ROW" > "$SCRATCH/m3-probe-guard-reverted.log" 2>&1
echo "guard reverted exit=$?"
grep -m 2 'delivers every frame\|Tests ' "$SCRATCH/m3-probe-guard-reverted.log"
cp "$SCRATCH/m3-probe-client-orig.ts" src/core/MCPClient.ts
echo '--- restored:'
$GUARD "$ROW" > "$SCRATCH/m3-probe-guard-restored.log" 2>&1
echo "guard restored exit=$?"

echo '=== PROBE 3: routing mutation discriminates (claim 3b) ==='
echo '--- shipped, unfiltered client file:'
npx vitest run --config vite.config.ts --no-cache --reporter=dot --project src:core tests/src/core/MCPClient.test.ts > "$SCRATCH/m3-probe-client-shipped.log" 2>&1
echo "client shipped exit=$?"
grep -E 'Tests |Test Files ' "$SCRATCH/m3-probe-client-shipped.log" | tail -2
node "$SCRATCH/m3-probe-mutate.cjs"
echo '--- mutated, unfiltered client file:'
npx vitest run --config vite.config.ts --no-cache --reporter=dot --project src:core tests/src/core/MCPClient.test.ts > "$SCRATCH/m3-probe-client-mutated.log" 2>&1
echo "client mutated exit=$?"
grep -E 'Tests |Test Files ' "$SCRATCH/m3-probe-client-mutated.log" | tail -2
cp "$SCRATCH/m3-probe-client-orig.ts" src/core/MCPClient.ts
cmp src/core/MCPClient.ts "$SCRATCH/m3-probe-client-orig.ts" && echo RESTORED-BYTE-EXACT

cd /
rm "$WT/node_modules"
git -C /home/user/mcp worktree remove --force "$WT"
git -C /home/user/mcp worktree prune
echo M3_PROBES_DONE
