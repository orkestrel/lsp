#!/bin/bash
set -o pipefail
cd /home/user/probe || exit 9
codex exec \
  --cd /home/user/probe \
  --sandbox read-only \
  --json \
  --output-last-message /home/user/lsp/tmp/codex/p1.1-recheck-last.md \
  - < /home/user/lsp/tmp/codex/p1.1-recheck-brief.md \
  > /home/user/lsp/tmp/codex/p1.1-recheck.jsonl 2>> /home/user/lsp/tmp/codex/p1.1-recheck-err.log
echo "EXEC_EXIT=$?"
