#!/usr/bin/env bash
# Control 3: set SEVERITY_HINT outside LSPDiagnosticSeverity and read the typecheck.
set -u
cd /home/user/lsp
BACKUP=tmp/l51/setupConformance.severity.bak
cp tests/setupConformance.ts "$BACKUP"
node tmp/l51/breakSeverity.mjs
echo "== cmp while mutated =="
cmp -s tests/setupConformance.ts "$BACKUP"
echo "cmp=$?"
echo "== npm run check while mutated =="
npm run check 2>&1 | tail -12
cp "$BACKUP" tests/setupConformance.ts
echo "== cmp after restore =="
cmp -s tests/setupConformance.ts "$BACKUP"
echo "cmp=$?"
echo "== npm run check after restore =="
npm run check 2>&1 | tail -4
echo "check exit=$?"
