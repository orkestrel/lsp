# Unit m4-contract.1 — apply the three falsified-row patches in the mcp tree

This brief is the successor to `m4-contract-brief.md`. It carries the deviation that unit
reported: three rows outside its granted scope became false under repairs the brief mandated,
and the unit returned exact patches rather than editing files it was denied. The original brief
and report stay; this unit closes what they could not.

## Role and engine

`builder`, Sonnet, native subagent. You are the sole writer in `/home/user/mcp` for this unit's
duration. You perform the assignment directly and spawn nothing. Every patch here is exact
old-text and new-text; you apply them verbatim and decide nothing about their content.

## Objective

`npm run check` and `npm run test:src:core` return exit 0 in `/home/user/mcp`, with the three
named rows carrying the replacement off-contract vector.

## Context

Read before editing: `/home/user/mcp/AGENTS.md` and `.claude/rules/tests.md` in that repository.
The full unit record is `/home/user/lsp/.orkestrel/mcp/m4-contract-report.md`; its "Off-limits
patches" section is the source of every patch here, reproduced below so you never need to
reconcile two copies — if the report and this brief disagree, this brief wins.

Standing conditions:

- `/home/user/mcp` is DIRTY on the `claude/lsp-spec-audit-est33d` branch: the held `m4-era` prose
  sweep and the held `m4-contract` surface both sit uncommitted. Work on top of them and never
  revert any part of either. A `git status` listing those files is expected.
- The tree is RED right now, and these three rows are the only reason. `npm run check` exits 2
  and `npm run test:src:core` exits 1 with `770 passed | 2 failed`. Both go green when the
  patches land.
- The replacement vector — a fractional `ttlMs` where the schema formats the field as an integer
  — was proven against the real server by the previous unit's throwaway probe: `1_000.5` answered
  `-32603` and `1_000` answered `resultType: 'complete'`. The rows themselves were never executed
  under it; your run is that execution.
- No `git checkout`, `git restore`, `git stash`, `git reset`, or `git clean`. No commit, no push,
  no install.

## The patches, verbatim

### Patch 1 — `tests/src/core/helpers.test.ts`, the filter key pin (near line 1617)

Old:

```ts
		expectTypeOf<keyof MCPSubscriptionFilter>().toEqualTypeOf<
			'toolsListChanged' | 'promptsListChanged' | 'resourcesListChanged' | 'resourceSubscriptions'
		>()
```

New:

```ts
		expectTypeOf<keyof MCPSubscriptionFilter>().toEqualTypeOf<
			| 'toolsListChanged'
			| 'promptsListChanged'
			| 'resourcesListChanged'
			| 'resourceSubscriptions'
			| 'taskIds'
		>()
```

### Patch 2 — `tests/src/core/MCPServer.test.ts`, the malformed-snapshot read (near line 5563)

Old:

```ts
		// Off-contract in a way TypeScript accepts and the wire cannot: a `_meta` key outside the
		// dated metadata grammar, which is exactly the class of defect a declared type cannot catch.
		const malformed = new Map<string, MCPTaskDetail>([
			[
				'lying',
				{
					taskId: 'lying',
					status: 'completed',
					createdAt: 'a',
					lastUpdatedAt: 'b',
					ttlMs: null,
					result: { resultType: 'complete', _meta: { 'not a legal key': 1 } },
				},
			],
		])
```

New:

```ts
		// Off-contract in a way TypeScript accepts and the wire cannot: a FRACTIONAL `ttlMs`, where
		// the declared type says `number | null` and the schema formats the field `int`. That is
		// exactly the class of defect a declared type cannot catch.
		const malformed = new Map<string, MCPTaskDetail>([
			[
				'lying',
				{
					taskId: 'lying',
					status: 'completed',
					createdAt: 'a',
					lastUpdatedAt: 'b',
					ttlMs: 1_000.5,
					result: { resultType: 'complete' },
				},
			],
		])
```

### Patch 3 — `tests/src/core/MCPServer.test.ts`, the unproven update and cancellation (near line 5902)

Old:

```ts
		const lying = watchedTaskManager(
			() =>
				Promise.resolve({
					taskId: 'lying',
					status: 'completed',
					createdAt: 'a',
					lastUpdatedAt: 'b',
					ttlMs: null,
					// Off-contract in a way TypeScript accepts and the published union does not:
					// a `_meta` key outside the dated metadata grammar.
					result: { resultType: 'complete', _meta: { 'not a legal key': 1 } },
				}),
			invoked,
		)
```

New:

```ts
		const lying = watchedTaskManager(
			() =>
				Promise.resolve({
					taskId: 'lying',
					status: 'completed',
					createdAt: 'a',
					lastUpdatedAt: 'b',
					// Off-contract in a way TypeScript accepts and the published union does not:
					// a fractional `ttlMs`, where the schema formats the field `int`.
					ttlMs: 1_000.5,
					result: { resultType: 'complete' },
				}),
			invoked,
		)
```

## Unknowns

None. Every patch is exact. If an old-text block does not match the file byte for byte after
allowing for tab indentation, stop and report per the deviation contract rather than adapting it.

## Scope

- Owned: `tests/src/core/helpers.test.ts` and `tests/src/core/MCPServer.test.ts`, each scoped to
  the patch this brief names in it.
- Off-limits: every other file, including all of `src/`, `guides/`, `tests/setup.ts`,
  `package.json`, and the lockfile.
- Allowed tools: read, edit, and the acceptance-criteria commands.

## Execution

Do the work yourself, in this checkout, and spawn nothing.

## Deviation contract

An old-text block that does not match, or a gate that stays red after all three patches land,
stops the unit: report expected, found, the exact failing output, done or not done, and at most
one short hypothesis. Do not adapt a patch, do not repair a different file, and do not widen the
scope.

## Acceptance criteria, cheap-first

1. `npm run format:check` exits 0.
2. `npm run lint:check` exits 0.
3. `npm run check` exits 0.
4. `npm run test:src:core` exits 0; record the reported passing count.

## Output

Write the report to `/home/user/lsp/tmp/units/m4-contract.1-report.md`: which patch landed in
which file at which line, the gate readings with exit codes, the `git status --short` output, and
any claim you flag. No process diary.
