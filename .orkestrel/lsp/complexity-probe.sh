#!/usr/bin/env bash
# Cyclomatic-complexity probe over lsp (minus U1-owned validators.ts) and mcp calibration files.
# Negative control first: max=1 must flag broadly, or the instrument is not firing.
set -u
SCRATCH="C:/Users/mikes/AppData/Local/Temp/claude/C--Users-mikes-WebstormProjects-lsp/8e5e604c-8a51-490a-a938-abe3f3a807f9/scratchpad"
LSP="C:/Users/mikes/WebstormProjects/lsp"
MCP="C:/Users/mikes/WebstormProjects/mcp"
OX="$LSP/node_modules/.bin/oxlint"
LSP_FILES="src/core/LSPClient.ts src/core/parsers.ts src/core/helpers.ts src/core/errors.ts src/server/transports/StdioTransport.ts"

echo "== CONTROL max=1 (must flag broadly) =="
(cd "$LSP" && "$OX" -c "$SCRATCH/complexity-1.json" $LSP_FILES 2>&1 | tail -3)

echo "== lsp max=10 =="
(cd "$LSP" && "$OX" -c "$SCRATCH/complexity-10.json" $LSP_FILES 2>&1)

echo "== lsp max=20 (oxlint default) =="
(cd "$LSP" && "$OX" -c "$SCRATCH/complexity-20.json" $LSP_FILES 2>&1)

echo "== mcp calibration max=10 =="
(cd "$MCP" && "$OX" -c "$SCRATCH/complexity-10.json" src/core/MCPClient.ts src/core/MCPServer.ts 2>&1 | grep -E "complexity|found" | tail -30)

echo "== mcp calibration max=20 =="
(cd "$MCP" && "$OX" -c "$SCRATCH/complexity-20.json" src/core/MCPClient.ts src/core/MCPServer.ts 2>&1 | grep -E "complexity|found" | tail -30)
