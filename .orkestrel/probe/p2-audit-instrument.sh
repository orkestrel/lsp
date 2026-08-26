#!/bin/bash
# Orchestrator instrument for the p2-range audit: re-run every row of the unit's red-first
# mutation table against the held tree, as supplied executed evidence for the read-only Sol
# analyst lane. Each row: prove the target string unique, apply the report's exact mutation,
# run the report's exact command (red), restore from a byte copy proven identical with cmp,
# run again (green). Every reading prints bare with its own exit marker.
set -u
SCRATCH=/tmp/claude-0/-home-user/e78ce9cf-999c-5254-92bf-205d07ca630a/scratchpad
EVID="$SCRATCH/p2-audit-instrument-evidence.txt"
cd /home/user/probe || exit 90
: > "$EVID"

run_row() {
	local name="$1" file="$2" target="$3" replacement="$4"
	shift 4
	echo "=== ROW $name ===" >> "$EVID"
	local count
	count=$(grep -F -c "$target" "$file")
	echo "TARGET_OCCURRENCES:$count ($file :: $target)" >> "$EVID"
	if [ "$count" != "1" ]; then
		echo "ROW_ABORTED:target not unique" >> "$EVID"
		return 1
	fi
	cp "$file" "$SCRATCH/orig-$name"
	TARGET="$target" REPLACEMENT="$replacement" perl -0pi -e 's/\Q$ENV{TARGET}\E/$ENV{REPLACEMENT}/' "$file"
	echo "--- red run: $*" >> "$EVID"
	"$@" > "$SCRATCH/row-$name-red.log" 2>&1
	echo "RED_EXIT:$?" >> "$EVID"
	grep -E "Tests |expected" "$SCRATCH/row-$name-red.log" | head -3 >> "$EVID"
	cp "$SCRATCH/orig-$name" "$file"
	cmp "$SCRATCH/orig-$name" "$file"
	echo "RESTORE_CMP_EXIT:$?" >> "$EVID"
	echo "--- green run: $*" >> "$EVID"
	"$@" > "$SCRATCH/row-$name-green.log" 2>&1
	echo "GREEN_EXIT:$?" >> "$EVID"
	grep -E "Tests " "$SCRATCH/row-$name-green.log" | head -2 >> "$EVID"
}

run_row renderer src/core/helpers.ts \
	'range.start.line + 1' 'range.start.line' \
	npx vitest run --config vite.config.ts --no-cache --project src:core tests/src/core/helpers.test.ts

run_row typestage src/server/stages/TypeStage.ts \
	'range: { start, end }' 'range: { start: { line: start.line + 1, character: start.character }, end }' \
	npx vitest run --config vite.config.ts --no-cache --project src:server tests/src/server/stages/TypeStage.test.ts -t 'stores a diagnostic zero-based'

run_row lintstage src/server/stages/LintStage.ts \
	'line: diagnostic.range.start.line,' 'line: diagnostic.range.start.line + 1,' \
	npx vitest run --config vite.config.ts --no-cache --project src:server tests/src/server/stages/LintStage.test.ts -t 'stores a published span zero-based'

run_row runtimeline src/server/stages/RuntimeStage.ts \
	'stack.line - 1' 'stack.line' \
	npx vitest run --config vite.config.ts --no-cache --project src:server tests/src/server/stages/RuntimeStage.test.ts -t 'stores the reported frame zero-based'

echo "=== FINAL TREE CHECK ===" >> "$EVID"
git status --short >> "$EVID"
git diff --stat -- src/ >> "$EVID"
echo "INSTRUMENT_DONE" >> "$EVID"
cat "$EVID"
