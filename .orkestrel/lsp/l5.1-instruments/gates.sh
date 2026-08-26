#!/usr/bin/env bash
# Final scoped gate readings for unit L5.1.
set -u
cd /home/user/lsp
OWNED="tests/setup.ts tests/setupServer.ts tests/setupConformance.ts tests/conformance.test.ts"
npm run test:conformance >tmp/l51/conformance.log 2>&1
echo "test:conformance exit=$?"
tail -4 tmp/l51/conformance.log | head -2
npx vitest run --config vite.config.ts --no-cache --reporter=dot --project setup >tmp/l51/setup.log 2>&1
echo "setup project exit=$?"
tail -5 tmp/l51/setup.log | head -2
npm run check >tmp/l51/check.log 2>&1
echo "check exit=$?"
npx oxfmt --config .oxfmtrc.json --check $OWNED guides/lsp.md >tmp/l51/fmt.log 2>&1
echo "oxfmt --check exit=$?"
npx oxlint --config .oxlintrc.json --deny-warnings $OWNED >tmp/l51/lint.log 2>&1
echo "oxlint --deny-warnings exit=$?"
git diff --check
echo "git diff --check exit=$?"
git status --porcelain
