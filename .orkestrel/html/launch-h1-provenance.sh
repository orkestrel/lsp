#!/bin/bash
set -o pipefail
cd /home/user/html || exit 9
codex exec \
  --cd /home/user/html \
  --sandbox workspace-write \
  --json \
  --output-last-message /home/user/scaffold/tmp/codex/h1-provenance-last.md \
  - < /home/user/scaffold/tmp/codex/h1-provenance-brief.md \
  > /home/user/scaffold/tmp/codex/h1-provenance.jsonl 2>> /home/user/scaffold/tmp/codex/h1-provenance-err.log
echo "EXEC_EXIT=$?"
