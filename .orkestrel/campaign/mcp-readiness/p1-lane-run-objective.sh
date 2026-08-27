#!/bin/sh
# A-P objective lane — Cursor Grok, executed attacks, rooted in the audit worktree.
set -e
cd /c/Users/mikes/WebstormProjects/probe/tmp/worktrees/audit-p1
git status --porcelain > tmp/audit/containment-before.txt
E=/c/Users/mikes/AppData/Local/cursor-agent/versions/2026.08.25-3e8eec8
"$E/node.exe" "$E/index.js" -p --trust --mode=ask --model cursor-grok-4.6-high "Read tmp/audit/brief.md. You hold the OBJECTIVE lane: correctness and constraints, with execution. Attack every claim with real runs, probes, and seeded mutations per the brief's ground rules; restore every mutation exactly. Return exactly the brief's verdict shape." | tee tmp/audit/objective.log
git status --porcelain > tmp/audit/containment-after.txt
