#!/bin/bash
set -o pipefail
cd /home/user/html || exit 9
codex exec \
  --cd /home/user/html \
  --sandbox workspace-write \
  --json \
  --output-last-message /home/user/scaffold/tmp/codex/h1.1.1-provenance-repairs-last.md \
  - < /home/user/scaffold/tmp/codex/h1.1.1-provenance-repairs-brief.md \
  > /home/user/scaffold/tmp/codex/h1.1.1-provenance-repairs.jsonl 2>> /home/user/scaffold/tmp/codex/h1.1.1-provenance-repairs-err.log
echo "EXEC_EXIT=$?"
