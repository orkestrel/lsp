#!/bin/bash
set -o pipefail
cd /home/user/mcp || exit 9
codex exec \
  --cd /home/user/mcp \
  --sandbox workspace-write \
  --json \
  --output-last-message /home/user/scaffold/tmp/codex/m7.1-client-era-continuation-last.md \
  - < /home/user/scaffold/tmp/codex/m7.1-client-era-continuation-brief.md \
  > /home/user/scaffold/tmp/codex/m7.1-client-era-continuation.jsonl 2>> /home/user/scaffold/tmp/codex/m7.1-client-era-continuation-err.log
echo "EXEC_EXIT=$?"
