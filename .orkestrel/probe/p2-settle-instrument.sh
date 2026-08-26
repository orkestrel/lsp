#!/bin/bash
# p2 settling instrument, second pass, 2026-08-26: same readings as the first pass, written to a
# receipt file because the vitest console interception swallowed the prints. Mutate-and-restore
# on RuntimeStage.ts, byte-proven.
set -u
cd /home/user/probe || exit 90
SRC=src/server/stages/RuntimeStage.ts
BAK=/tmp/claude-0/-home-user/e78ce9cf-999c-5254-92bf-205d07ca630a/scratchpad/RuntimeStage.ts.p2settle2.bak
LOG=/tmp/claude-0/-home-user/e78ce9cf-999c-5254-92bf-205d07ca630a/scratchpad/p2settle2-run.log
READINGS=/home/user/probe/tmp/probe/p2settle-readings.txt
rm -f "$READINGS"
cp "$SRC" "$BAK" || exit 91

TARGET="			const character = 'column' in stack && typeof stack.column === 'number' ? stack.column - 1 : 0"
COUNT=$(grep -F -c "$TARGET" "$SRC")
echo "TARGET_OCCURRENCES:$COUNT"
if [ "$COUNT" != "1" ]; then exit 92; fi

export TARGET
export REPLACEMENT="			globalThis.process.stderr.write('RAW_FRAME ' + JSON.stringify({ file: stack.file, line: stack.line, column: 'column' in stack ? stack.column : null }) + '\\n')
$TARGET"
perl -0777 -i -pe 's/\Q$ENV{TARGET}\E/$ENV{REPLACEMENT}/' "$SRC"
echo "DEBUG_LINES:$(grep -c RAW_FRAME "$SRC")"

mkdir -p tmp/probe
cat > tmp/probe/p2settle.test.ts << 'EOF'
import { appendFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { RuntimeStage } from '@src/server'
import { it } from 'vitest'
import { WORKSPACE_ROOT } from '../../tests/setup.js'

const ROOT = fileURLToPath(WORKSPACE_ROOT)
const READINGS = 'tmp/probe/p2settle-readings.txt'

it('records the raw frame beside the stored range for the pinned column', { timeout: 120_000 }, async () => {
	const stage = new RuntimeStage(ROOT)
	const text = [
		"import { expect, test } from 'vitest'",
		'',
		'// padding',
		'// padding',
		"test('fails', () => {",
		'\texpect(2 + 2).toBe(5)',
		'})',
		'',
	].join('\n')
	try {
		const check = await stage.inspect({
			files: [],
			test: { path: 'tmp/probe/p2settle-pinned.test.ts', text },
		})
		appendFileSync(
			READINGS,
			'STORED_PINNED count=' + check.issues.length + ' range=' + JSON.stringify(check.issues[0]?.range) + ' message=' + JSON.stringify(check.issues[0]?.message?.slice(0, 120)) + '\n',
		)
	} finally {
		await stage.destroy()
	}
})

it('records the raw frame beside the stored range for a line-start construction', { timeout: 120_000 }, async () => {
	const stage = new RuntimeStage(ROOT)
	const text = [
		"import { test } from 'vitest'",
		'function make(): Error {',
		'\treturn (',
		"new Error('boom')",
		'\t)',
		'}',
		"test('fails', () => {",
		'\tthrow make()',
		'})',
		'',
	].join('\n')
	try {
		const check = await stage.inspect({
			files: [],
			test: { path: 'tmp/probe/p2settle-floor.test.ts', text },
		})
		appendFileSync(
			READINGS,
			'STORED_FLOOR count=' + check.issues.length + ' range=' + JSON.stringify(check.issues[0]?.range) + ' message=' + JSON.stringify(check.issues[0]?.message?.slice(0, 120)) + '\n',
		)
	} finally {
		await stage.destroy()
	}
})
EOF

npx vitest run --config vite.config.ts --no-cache --project probe tmp/probe/p2settle.test.ts > "$LOG" 2>&1
echo "RUN_EXIT:$?"
grep -E 'RAW_FRAME|passed|failed' "$LOG" | head -12
echo "---READINGS---"
cat "$READINGS" 2>/dev/null

cp "$BAK" "$SRC"
cmp "$SRC" "$BAK"
echo "RESTORE_CMP_EXIT:$?"
rm -f tmp/probe/p2settle.test.ts "$READINGS"
git status --short | head -15
