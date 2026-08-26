#!/bin/bash
# R1 probe, 2026-08-26: can the conformance digest row redden, or does the module-load
# digest check fail collection first? Flip one byte in the vendored mirror, run the
# conformance project, read the failure shape, restore byte-identical, re-run green.
set -u
cd /home/user/mcp || exit 90
MIRROR=tests/mirrors/ext-tasks-2026-07-28-schema.json
BAK=/tmp/claude-0/-home-user/e78ce9cf-999c-5254-92bf-205d07ca630a/scratchpad/mirror.r1.bak
cp "$MIRROR" "$BAK" || exit 91
printf '\n' >> "$MIRROR"
echo "MUTATED: appended one newline"
npx vitest run --config vite.config.ts --no-cache --reporter=dot --project conformance 2>&1 | tail -18
echo "RED_EXIT:${PIPESTATUS[0]}"
cp "$BAK" "$MIRROR"
cmp "$MIRROR" "$BAK"
echo "RESTORE_CMP_EXIT:$?"
npx vitest run --config vite.config.ts --no-cache --reporter=dot --project conformance 2>&1 | tail -4
echo "GREEN_EXIT:${PIPESTATUS[0]}"
git status --short | head -5
