#!/bin/bash
set -o pipefail
cd /home/user/mcp || exit 9
codex exec \
  --cd /home/user/mcp \
  --sandbox read-only \
  --json \
  --output-last-message /home/user/scaffold/tmp/codex/m-audit-analyst-last.md \
  - < /home/user/scaffold/tmp/codex/m-audit-analyst-brief.md \
  > /home/user/scaffold/tmp/codex/m-audit-analyst.jsonl 2>> /home/user/scaffold/tmp/codex/m-audit-analyst-err.log
echo "EXEC_EXIT=$?"
