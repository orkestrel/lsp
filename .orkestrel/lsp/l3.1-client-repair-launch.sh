#!/bin/bash
set -o pipefail
cd /home/user/lsp || exit 9
codex exec \
  --cd /home/user/lsp \
  --sandbox workspace-write \
  --json \
  --output-last-message /home/user/scaffold/tmp/codex/l3.1-client-repair-last.md \
  - < /home/user/scaffold/tmp/codex/l3.1-client-repair-brief.md \
  > /home/user/scaffold/tmp/codex/l3.1-client-repair.jsonl 2>> /home/user/scaffold/tmp/codex/l3.1-client-repair-err.log
echo "EXEC_EXIT=$?"
