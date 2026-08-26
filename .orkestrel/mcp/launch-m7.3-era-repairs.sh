#!/bin/bash
set -o pipefail
cd /home/user/mcp || exit 9
codex exec \
  --cd /home/user/mcp \
  --sandbox workspace-write \
  --json \
  --output-last-message /home/user/scaffold/tmp/codex/m7.3-era-repairs-last.md \
  - < /home/user/scaffold/tmp/codex/m7.3-era-repairs-brief.md \
  > /home/user/scaffold/tmp/codex/m7.3-era-repairs.jsonl 2>> /home/user/scaffold/tmp/codex/m7.3-era-repairs-err.log
echo "EXEC_EXIT=$?"
