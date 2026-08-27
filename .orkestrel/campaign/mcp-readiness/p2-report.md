# P2 report — probe's default bounds move to the constants file

## Diff summary

- `src/core/constants.ts`: added `PROBE_DEADLINE` (`30_000`), `LINT_DEADLINE` (`2_000`), and
  `PROBE_KEYS` (`4096`), each an exported `const` with TSDoc carrying the moved measurement and
  design sentences, following the existing `PROBE_*` style.
- `src/server/Probe.ts`: imports `PROBE_DEADLINE` from `@src/core`; `#deadline` now reads
  `options?.deadline ?? PROBE_DEADLINE` in place of the inline `30_000`.
- `src/server/stages/LintStage.ts`: imports `LINT_DEADLINE` from `@src/core`; the `#deadline`
  class field now reads `LINT_DEADLINE` in place of the inline `2_000`.
- `src/server/ProbeServer.ts`: imports `PROBE_KEYS` from `@src/core`; the `#limits.keys` field now
  reads `PROBE_KEYS` in place of the inline `4096`.
- `guides/probe.md`: added three rows to the `### Constants` Surface table — `PROBE_DEADLINE`,
  `LINT_DEADLINE`, `PROBE_KEYS` — each matching its constant's TSDoc.

No behavioral edit: each site now reads an imported constant carrying the same literal value it
held before.

## Constants and sites

| Constant         | Value    | Site                                                              |
| ---------------- | -------- | ------------------------------------------------------------------ |
| `PROBE_DEADLINE` | `30_000` | `src/server/Probe.ts` constructor, `#deadline` default            |
| `LINT_DEADLINE`  | `2_000`  | `src/server/stages/LintStage.ts`, `#deadline` class field         |
| `PROBE_KEYS`     | `4096`   | `src/server/ProbeServer.ts`, `#limits.keys` class field           |

Barrel check: `src/core/index.ts` re-exports `./constants.js` with `export *`, so the three new
constants reach `@src/core` and the published `@orkestrel/probe` core specifier without a barrel
edit.

## Commands and results

- `npm run check` — passes: `tsc --noEmit --project tsconfig.json`, `check:src:core`,
  `check:src:server`, `check:src:bin` all exit clean, no diagnostics printed.
- `npx oxlint src/core/constants.ts src/server/Probe.ts src/server/stages/LintStage.ts src/server/ProbeServer.ts`
  — no diagnostics printed (pass).
- `npx oxfmt --check src/core/constants.ts src/server/Probe.ts src/server/stages/LintStage.ts src/server/ProbeServer.ts guides/probe.md`
  — "All matched files use the correct format." Finished in 521 ms on 5 files.
- `npm run test:src:server` — Test Files 7 passed (7); Tests 173 passed | 4 skipped (177). One
  `stderr` line printed by `RuntimeStage.test.ts`'s pre-existing "recycles the resident runner"
  case (`failed to load config from …orkestrel-test-VaPHq0\vite.config.ts`) is that test's own
  fixture teardown message, unrelated to this unit's owned files, and the suite still reports 0
  failures.
- `npm run test:guides` — Test Files 1 passed (1); Tests 13 passed (13).
- `npm run test:policy` — Test Files 1 passed (1); Tests 93 passed (93).

No test file needed a new parity row beyond the guide table edit already covered by
`test:guides`.

## Deviations

None. No prescribed name collided, no test outside the owned files reddened, and no site's
observable behavior changed.
