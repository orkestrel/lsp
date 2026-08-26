#!/usr/bin/env bash
# Control 1: drop one encodings row from CONFORMANCE_VALUES and read the membership assertion.
set -u
cd /home/user/lsp
BACKUP=tmp/l51/setupConformance.encodings.bak
cp tests/setupConformance.ts "$BACKUP"
node tmp/l51/dropEncodings.mjs
echo "== cmp while mutated =="
cmp -s tests/setupConformance.ts "$BACKUP"
echo "cmp=$?"
echo "== conformance run while mutated =="
npx vitest run --config vite.config.ts --no-cache --reporter=verbose --project conformance -t 'LSP_ENCODINGS' 2>&1 | tail -30
cp "$BACKUP" tests/setupConformance.ts
echo "== cmp after restore =="
cmp -s tests/setupConformance.ts "$BACKUP"
echo "cmp=$?"
echo "== conformance run after restore =="
npx vitest run --config vite.config.ts --no-cache --reporter=dot --project conformance 2>&1 | tail -6
