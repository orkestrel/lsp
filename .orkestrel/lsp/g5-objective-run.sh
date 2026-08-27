#!/usr/bin/env bash
set -u
cd "C:/Users/mikes/WebstormProjects/lsp"
ENTRY_DIR="C:/Users/mikes/AppData/Local/cursor-agent/versions/2026.08.25-3e8eec8"
CURSOR_GROK_MODEL=cursor-grok-4.6-high
"$ENTRY_DIR/node.exe" "$ENTRY_DIR/index.js" -p --trust --mode=ask --model "$CURSOR_GROK_MODEL" "You hold the OBJECTIVE lane of an adversarial design round: correctness, constraints, and what the code and installed contracts actually permit. Read the brief at C:/Users/mikes/WebstormProjects/lsp/tmp/units/design-brief.md and answer its numbered questions as verdicts with evidence. You are read-only: modify no file. Argue from what you can verify in the repository at C:/Users/mikes/WebstormProjects/lsp (and the read-only evidence the brief cites); when the brief's evidence pack conflicts with what you read, say so with the pointer. Be decisive: every numbered question gets a ruling, not a survey. Return only the numbered verdicts, open questions, and proposed units." | tee "C:/Users/mikes/WebstormProjects/lsp/tmp/cursor/g5-objective.log"
