#!/bin/sh
# A-M objective lane — Cursor Grok, source verdicts over supplied executed records.
set -e
cd /c/Users/mikes/WebstormProjects/mcp/tmp/worktrees/audit-minput
git status --porcelain > tmp/audit/containment-before.txt
E=/c/Users/mikes/AppData/Local/cursor-agent/versions/2026.08.25-3e8eec8
"$E/node.exe" "$E/index.js" -p --trust --mode=ask --model cursor-grok-4.6-high "Read tmp/audit/brief.md. You hold the OBJECTIVE lane: correctness, constraints, and what the code and contracts actually permit. You cannot execute; rule from source, the supplied diff, and the supplied run records, and mark UNRESOLVED what only a run could settle. Return exactly the brief's verdict shape." | tee tmp/audit/objective.log
git status --porcelain > tmp/audit/containment-after.txt
