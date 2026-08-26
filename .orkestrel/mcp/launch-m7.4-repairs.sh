#!/bin/bash
set -o pipefail
cd /home/user/mcp || exit 9
codex exec \
  --cd /home/user/mcp \
  --sandbox workspace-write \
  --json \
  --output-last-message /home/user/scaffold/tmp/codex/m7.4-guide-and-shape-last.md \
  - < /home/user/scaffold/tmp/codex/m7.4-guide-and-shape-brief.md \
  > /home/user/scaffold/tmp/codex/m7.4-guide-and-shape.jsonl 2>> /home/user/scaffold/tmp/codex/m7.4-guide-and-shape-err.log
echo "EXEC_EXIT=$?"
