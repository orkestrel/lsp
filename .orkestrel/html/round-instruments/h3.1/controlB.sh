#!/usr/bin/env bash
# Control B: revert the per-entry skip to the whole-walk stop.
set -u
cd /home/user/html
cp src/core/parsers.ts tmp/h3.1/parsers.controlB.bak
python3 - <<'PY'
from pathlib import Path
p = Path('src/core/parsers.ts')
text = p.read_text(encoding='utf-8')
old = 'if (blocked) continue'
new = 'if (blocked) break'
assert text.count(old) == 1, text.count(old)
p.write_text(text.replace(old, new), encoding='utf-8')
PY
echo "--- mutated line ---"
grep -n 'if (blocked) break' src/core/parsers.ts
cmp src/core/parsers.ts tmp/h3.1/parsers.controlB.bak
echo "CMP_WHILE_MUTATED=$?"
npx vitest run --config vite.config.ts --no-cache --reporter=verbose --project src:core tests/src/core/parsers.test.ts > tmp/h3.1/controlB.log 2>&1
echo "MUTATED_EXIT=$?"
grep -E 'Tests  ' tmp/h3.1/controlB.log
grep -E '×' tmp/h3.1/controlB.log
grep -A 3 'Expected:' tmp/h3.1/controlB.log | head -6
cp tmp/h3.1/parsers.controlB.bak src/core/parsers.ts
cmp src/core/parsers.ts tmp/h3.1/parsers.controlB.bak
echo "CMP_AFTER_RESTORE=$?"
npx vitest run --config vite.config.ts --no-cache --reporter=dot --project src:core tests/src/core/parsers.test.ts > tmp/h3.1/controlB.restored.log 2>&1
echo "RESTORED_EXIT=$?"
tail -5 tmp/h3.1/controlB.restored.log
