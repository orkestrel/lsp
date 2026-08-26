#!/usr/bin/env bash
# Control A: disable the barrier check in src/core/parsers.ts, leaving the deep scan intact.
set -u
cd /home/user/html
cp src/core/parsers.ts tmp/h3.1/parsers.controlA.bak
python3 - <<'PY'
from pathlib import Path
p = Path('src/core/parsers.ts')
text = p.read_text(encoding='utf-8')
old = 'if (projectDepth(match.overflow, match.position, stack.length) > candidateDepth) {'
new = 'if (false && projectDepth(match.overflow, match.position, stack.length) > candidateDepth) {'
assert text.count(old) == 1, text.count(old)
p.write_text(text.replace(old, new), encoding='utf-8')
PY
echo "--- mutated line ---"
grep -n 'false && projectDepth' src/core/parsers.ts
cmp src/core/parsers.ts tmp/h3.1/parsers.controlA.bak
echo "CMP_WHILE_MUTATED=$?"
npx vitest run --config vite.config.ts --no-cache --reporter=verbose --project src:core tests/src/core/parsers.test.ts > tmp/h3.1/controlA.log 2>&1
echo "MUTATED_EXIT=$?"
grep -E '^ (FAIL|✓|×)|Tests  ' tmp/h3.1/controlA.log | grep -E 'FAIL|Tests  ' 
grep -E '×' tmp/h3.1/controlA.log
cp tmp/h3.1/parsers.controlA.bak src/core/parsers.ts
cmp src/core/parsers.ts tmp/h3.1/parsers.controlA.bak
echo "CMP_AFTER_RESTORE=$?"
npx vitest run --config vite.config.ts --no-cache --reporter=dot --project src:core tests/src/core/parsers.test.ts > tmp/h3.1/controlA.restored.log 2>&1
echo "RESTORED_EXIT=$?"
tail -5 tmp/h3.1/controlA.restored.log
