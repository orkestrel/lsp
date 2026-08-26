#!/bin/bash
set -o pipefail
cd /home/user/markdown || exit 9
codex exec \
  --cd /home/user/markdown \
  --sandbox read-only \
  --json \
  --output-last-message /home/user/lsp/tmp/codex/h2-audit-analyst-last.md \
  - < /home/user/lsp/tmp/codex/h2-audit-analyst-brief.md \
  > /home/user/lsp/tmp/codex/h2-audit-analyst.jsonl 2>> /home/user/lsp/tmp/codex/h2-audit-analyst-err.log
echo "EXEC_EXIT=$?"
