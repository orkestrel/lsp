#!/bin/bash
set -o pipefail
cd /home/user/lsp || exit 9
codex exec \
  --cd /home/user/lsp \
  --sandbox workspace-write \
  --json \
  --output-last-message /home/user/scaffold/tmp/codex/l2-core-last.md \
  - < /home/user/scaffold/tmp/codex/l2-core-brief.md \
  > /home/user/scaffold/tmp/codex/l2-core.jsonl 2>> /home/user/scaffold/tmp/codex/l2-core-err.log
echo "EXEC_EXIT=$?"
