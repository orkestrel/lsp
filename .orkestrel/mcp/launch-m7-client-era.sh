#!/bin/bash
set -o pipefail
cd /home/user/mcp || exit 9
codex exec \
  --cd /home/user/mcp \
  --sandbox workspace-write \
  --json \
  --output-last-message /home/user/scaffold/tmp/codex/m7-client-era-last.md \
  - < /home/user/scaffold/tmp/codex/m7-client-era-brief.md \
  > /home/user/scaffold/tmp/codex/m7-client-era.jsonl 2>> /home/user/scaffold/tmp/codex/m7-client-era-err.log
echo "EXEC_EXIT=$?"
