#!/usr/bin/env bash
# Build and pack @orkestrel/process at b07ba7f, then install the tarball into lsp.
# The replaced range and restoration obligation are recorded in
# .orkestrel/campaign/tarball-swap.md. Re-run this file whenever the process source moves.
set -eu
PROCESS="C:/Users/mikes/WebstormProjects/process"
LSP="C:/Users/mikes/WebstormProjects/lsp"
DEST="$LSP/tmp/tarballs"
mkdir -p "$DEST"
cd "$PROCESS"
npm pack --pack-destination "$DEST"
cd "$LSP"
npm install "$DEST/orkestrel-process-0.0.6.tgz"
node -e "const p=require('C:/Users/mikes/WebstormProjects/lsp/node_modules/@orkestrel/process/package.json'); console.log('installed', p.name, p.version)"
grep -n "@orkestrel/process" "$LSP/package.json"
