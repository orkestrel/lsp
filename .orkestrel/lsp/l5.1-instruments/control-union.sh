#!/usr/bin/env bash
# Control 4: edit the LSPDiagnosticSeverity union in src/core/types.ts and read the typecheck.
set -u
cd /home/user/lsp
BACKUP=tmp/l51/types.union.bak
cp src/core/types.ts "$BACKUP"
node tmp/l51/breakUnion.mjs
echo "== cmp while mutated =="
cmp -s src/core/types.ts "$BACKUP"
echo "cmp=$?"
echo "== npm run check while mutated =="
npm run check 2>&1 | tail -12
cp "$BACKUP" src/core/types.ts
echo "== cmp after restore =="
cmp -s src/core/types.ts "$BACKUP"
echo "cmp=$?"
echo "== git status of src/core/types.ts after restore =="
git status --porcelain src/core/types.ts
echo "== npm run check after restore =="
npm run check 2>&1 | tail -3
echo "check exit=$?"
