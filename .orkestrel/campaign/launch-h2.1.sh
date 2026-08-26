#!/bin/bash
set -o pipefail
cd /home/user/markdown || exit 9
codex exec \
  --cd /home/user/markdown \
  --sandbox workspace-write \
  --json \
  --output-last-message /home/user/lsp/tmp/codex/h2.1-derive-last.md \
  - < /home/user/lsp/tmp/codex/h2.1-derive-brief.md \
  > /home/user/lsp/tmp/codex/h2.1-derive.jsonl 2>> /home/user/lsp/tmp/codex/h2.1-derive-err.log
echo "EXEC_EXIT=$?"
