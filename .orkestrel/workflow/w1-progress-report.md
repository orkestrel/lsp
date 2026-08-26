# Unit W1 progress report

## Result

`TaskProgress` has the MCP notification shape `{ progress, total?, message? }`. The validator,
cloner, fixtures, mapped core tests, and workflow guide use that shape. The removed `unit` progress
member has no compatibility path, and the validator has a regression row that refuses it as an
unknown key.

No source consumer beyond the terrain map required an edit. The core suite revealed no additional
file.

## Regression proof

The baseline source ran against the renamed expectations with this command:

```text
./node_modules/.bin/vitest run --config vite.config.ts --no-cache --reporter=dot --project src:core
```

The command exited `1` and reported:

```text
Test Files  3 failed | 16 passed (19)
Tests  3 failed | 787 passed (790)
```

The same command after the implementation exited `0` and reported:

```text
Test Files  19 passed (19)
Tests  790 passed (790)
```

The failed baseline run collected the renamed validator, cloner, and task activity expectations.
The `rejects the removed progress unit as an unknown key` row was also collected.

## Bounds mutation proof

The fixture rows named `rejects invalid input 1`, `rejects invalid input 2`, `rejects invalid input
3`, and `rejects invalid input 4` cover a non-finite `progress`, a negative `progress`, a `total`
below `progress`, and an empty `message`, respectively.

For the negative control, the validator clause
`total !== undefined && (!isFiniteNumber(total) || total < reported)` was changed temporarily to
`total !== undefined && !isFiniteNumber(total)`. This command exercised the `total < progress` row:

```text
./node_modules/.bin/vitest run --config vite.config.ts --no-cache --reporter=verbose --project src:core tests/src/core/validators.test.ts -t "rejects invalid input 3"
```

With the comparison disabled, the command exited `1` and reported:

```text
Tests  1 failed | 39 skipped (40)
AssertionError: expected true to be false
```

After restoring the exact clause, the same command exited `0` and reported:

```text
Tests  1 passed | 39 skipped (40)
```

The `mcp__probe__prove` instrument did not issue a receipt. The harness refused its invocation with
`MCP tool call requires approval, but approval policy is never`. The preceding direct mutation run
and reversal are the evidence used for this unit.

## Consumer sweep

The baseline read sweep used this pattern and population:

```text
rg -n '\.(current|unit)\b' src
```

It found progress-member reads only in these mapped paths:

```text
src/core/validators.ts:251: const current = progress.current
src/core/validators.ts:253: const unit = progress.unit
src/core/cloners.ts:127: const current = progressInput.current
src/core/cloners.ts:129: const unit = progressInput.unit
```

The declaration and object-key sweep used this pattern and population:

```text
rg -n '\b(current|unit)\s*[:?]' src
```

It found the mapped `TaskProgress` declarations in `src/core/types.ts`, the mapped cloner and
validator keys, and unrelated runner-unit declarations in `src/core/types.ts` and
`src/core/Runner.ts`. No missed progress consumer was present.

After the implementation, `rg -n '\.(current|unit)\b' src` returned no match. This targeted sweep
over the progress-bearing source and guide also returned no match:

```text
rg -n 'progress\s*:\s*\{[^\n]*(current|unit)|\{ current, total\?, unit\? \}|total < current' guides/workflow.md src/core/types.ts src/core/validators.ts src/core/cloners.ts
```

## Scoped gates

The format command exited `0`:

```text
./node_modules/.bin/oxfmt --config .oxfmtrc.json --check tmp/w1-progress-report.md src/core/types.ts src/core/validators.ts src/core/cloners.ts tests/setup.ts tests/src/core/validators.test.ts tests/src/core/cloners.test.ts tests/src/core/tasks/Task.test.ts guides/workflow.md
All matched files use the correct format.
```

The lint command exited `0` with no diagnostics:

```text
./node_modules/.bin/oxlint --config .oxlintrc.json --deny-warnings src/core/types.ts src/core/validators.ts src/core/cloners.ts tests/setup.ts tests/src/core/validators.test.ts tests/src/core/cloners.test.ts tests/src/core/tasks/Task.test.ts guides/workflow.md
```

The core typecheck exited `0` with no diagnostics:

```text
./node_modules/.bin/tsc --noEmit -p configs/src/tsconfig.core.json
```

The core Vitest command exited `0` and reported:

```text
Test Files  19 passed (19)
Tests  790 passed (790)
```

`git diff --check` exited `0` with no diagnostics.

## Deviation and unproved claims

The literal acceptance command
`grep -n "unit" src/core/types.ts src/core/validators.ts src/core/cloners.ts` does not return only
the `RunnerEventMap.unit` declaration. It also matches pre-existing runner prose in
`src/core/types.ts` about substrate units. The progress-related `unit` declarations and reads are
gone, and `RunnerEventMap.unit` is the only remaining `unit` member declaration in those source
files. No unrelated runner prose was edited. The likely reading is that the acceptance command
intended to constrain progress-member hits rather than every English use of `unit`.

No implementation claim remains unproved by the direct tests and scoped gates. The unavailable
`mcp__probe__prove` receipt is the instrument limit recorded earlier.
