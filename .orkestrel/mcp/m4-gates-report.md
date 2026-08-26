# Gate report: m4-gates

## Opening status

- `git status --short`: empty (tree clean).
- `git log --oneline -1`: `c2a35d4 Document the tasks surface and land the era sweep's guide half`.

## Gate results

| Gate | Command | Exit code |
| --- | --- | --- |
| Format check | `npm run format:check` | 0 |
| Lint check | `npm run lint:check` | 0 |
| Typecheck | `npm run check` | 0 |
| Build | `npm run build` | 0 |
| Test | `npm test` | 0 |

## Test project summary lines

- `test:src`: Test Files 32 passed (32); Tests 1151 passed | 1 skipped (1152)
- `test:policy`: Test Files 1 passed (1); Tests 93 passed (93)
- `test:config`: Test Files 1 passed (1); Tests 46 passed (46)
- `test:setup`: Test Files 5 passed (5); Tests 75 passed (75)
- `test:guides`: Test Files 1 passed (1); Tests 144 passed (144)
- `test:conformance`: Test Files 1 passed (1); Tests 42 passed (42)
- `test:integration`: Test Files 1 passed (1); Tests 4 passed (4)

No red rows. Every gate passed; no failure excerpt applies.
