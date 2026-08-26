#!/bin/bash
set -o pipefail
cd /home/user/lsp || exit 9
codex exec \
  --cd /home/user/lsp \
  --sandbox workspace-write \
  --json \
  --output-last-message /home/user/lsp/tmp/codex/l6.1-fix-last.md \
  - < /home/user/lsp/tmp/codex/l6.1-fix-brief.md \
  > /home/user/lsp/tmp/codex/l6.1-fix.jsonl 2>> /home/user/lsp/tmp/codex/l6.1-fix-err.log
echo "EXEC_EXIT=$?"
