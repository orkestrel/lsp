#!/bin/sh
# A-MF2 cross-engine check — Cursor Grok, read-only, worktree at 6b21881.
set -e
cd /c/Users/mikes/WebstormProjects/mcp/tmp/worktrees/audit-mf2
git status --porcelain > tmp/audit/containment-before.txt
E=/c/Users/mikes/AppData/Local/cursor-agent/versions/2026.08.25-3e8eec8
"$E/node.exe" "$E/index.js" -p --trust --mode=ask --model cursor-grok-4.6-high "Read tmp/audit/brief.md and perform exactly that assignment." | tee tmp/audit/objective.log
git status --porcelain > tmp/audit/containment-after.txt
