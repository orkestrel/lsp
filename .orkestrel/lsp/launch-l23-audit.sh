#!/bin/bash
set -o pipefail
cd /home/user/lsp || exit 9
codex exec \
  --cd /home/user/lsp \
  --sandbox read-only \
  --json \
  --output-last-message /home/user/scaffold/tmp/codex/l23-audit-analyst-last.md \
  - < /home/user/scaffold/tmp/codex/l23-audit-analyst-brief.md \
  > /home/user/scaffold/tmp/codex/l23-audit-analyst.jsonl 2>> /home/user/scaffold/tmp/codex/l23-audit-analyst-err.log
echo "EXEC_EXIT=$?"
