# F2 report — the accepted A2 findings, both repositories

Baselines confirmed clean before editing: process `b07ba7f`, lsp `61d9a3a` (lsp carried one
pre-existing untracked file, `.orkestrel/campaign/a2-verdict.md`, which this unit did not create and
did not touch).

## Per-finding disposition

| Finding                        | Disposition | Where                                                                                                                             |
| ------------------------------ | ----------- | --------------------------------------------------------------------------------------------------------------------------------- |
| A2-1 validation order          | Landed      | `src/server/Process.ts` constructor prefix; regression rows in `tests/src/server/Process.test.ts`                                  |
| Rev-1 `Session` class TSDoc    | Landed      | `src/server/Session.ts` class `@remarks`                                                                                          |
| Rev-5 `end` unbounded flush    | Landed      | `src/core/types.ts` `SessionInterface.end`; `guides/process.md` `end` prose and the cooperative pattern                            |
| Rev-4 in-body function         | Landed      | `tests/src/server/Session.test.ts` — `owns` deleted, predicate inlined at its one use                                             |
| Rev-9 `pooled` rename          | Landed      | `tests/src/server/Session.test.ts` — see the recorded conflict                                                                    |
| Rev-6 `deliver` doc voice      | Landed      | `src/server/Supervisor.ts` — "Writes raw bytes to the open standard-input channel."                                               |
| Rev-7 `below` and `guarantee`  | Landed      | `Supervisor.ts` three sites, `Session.ts:54`, `Session.ts:198` recast; lsp `StdioClientTransport.ts` one site                      |
| Rev-8 options table            | Landed      | `guides/process.md` — deferring clause dropped, colon-terminated introducing sentence added                                       |
| Rev-2 shared `grace` window    | Landed      | lsp `src/server/types.ts` and `guides/lsp.md`; `StdioClientTransport.ts` `close` TSDoc untouched                                   |

## A2-1: failing first, then green

Command, run at `b07ba7f` with the two new rows added and `Process.ts` unmodified:

```
npx vitest run --config vite.config.ts --no-cache --reporter=verbose --project src:server -t "invalid"
Tests  1 failed | 6 passed | 170 skipped (177)
FAIL  Process validation > reports the command refusal when the command file and the backlog are both invalid
AssertionError: expected 'Invalid option \'backlog\'' to be 'Invalid command file'
```

The control row beside it, `reports the backlog refusal when the backlog alone is invalid`, passed in
that same red run, so the failure is the order rather than a lost `backlog` check.

The same command after the constructor fix:

```
Tests  7 passed | 170 skipped (177)
```

The fix reads every option and command property once in the constructor prefix, validates in the
`23808f2` engine order (command, workspace, grace, drain, delivery, evidence), validates `backlog`
after them, and constructs `Supervisor` from a plain literal. A caller getter therefore runs once
whether the construction succeeds or is refused, and `backlog` still refuses before anything spawns.

## Gate evidence

Process, all run after every process edit:

| Gate                     | Result                                                             |
| ------------------------ | ------------------------------------------------------------------ |
| `oxlint --deny-warnings` | exit 0                                                             |
| `npm run check`          | exit 0 (root, `src:core`, `src:server`)                            |
| `test:src:server`        | 8 files passed; Tests 171 passed \| 6 skipped (177)                |
| `test:guides`            | 1 file passed; Tests 106 passed \| 2 skipped (108)                 |
| `format:check`           | exit 0; all matched files correct, 151 files                       |

lsp, all run after every lsp edit:

| Gate                     | Result                                          |
| ------------------------ | ----------------------------------------------- |
| `oxlint --deny-warnings` | exit 0                                          |
| `check:src:server`       | exit 0                                          |
| `test:src:server`        | 4 files passed; Tests 20 passed (20)            |
| `test:guides`            | 1 file passed; Tests 27 passed (27)             |
| `format:check`           | exit 0; all matched files correct, 154 files    |

## Recorded conflicts

**Rev-9 name collision, resolved locally.** `host` was already taken at
`tests/src/server/Session.test.ts:96` by the control child-process handle, so renaming `pooled` to
`host` as prescribed would redeclare it. The prescription was adopted unchanged — the chunk array is
now `host` — and the spawn handle was renamed to `control`, which is what the surrounding comments
already call it ("the control spawn produced no stdout", "The control: every chunk the host's own
event yields is a `Buffer`"). Treated as an ancillary conflict rather than a stop, because the
prescription's own target landed verbatim.

**A2-1 duplicate validation calls.** `Process` now calls the engine's validators itself before
`backlog`, and `Supervisor` validates the same plain values again when it is constructed. Both routes
run the same `helpers.ts` implementations, and `Supervisor` keeps its own contract for `Session`,
which constructs it directly. This is what the prescribed order requires: nothing can spawn before
`backlog` is refused, and `command` must be refused before `backlog`.

## Observations, no action taken

- Referential `below` remains outside the named Rev-7 sites: `tests/src/server/Session.test.ts:324`
  and `:495`, `tests/src/server/Process.test.ts:1161`, `:1183`, and `:1250`, and
  `guides/process.md:1456`. Each predates this unit and none is a prescribed site.
- `Session.ts` and `Supervisor.ts` restate `end`'s flush in their own method TSDoc without the
  unbounded-flush sentence Rev-5 added to `src/core/types.ts` and the guide. Rev-5 named those two
  files only.
- `Supervisor`'s constructor TSDoc still says a face reads and validates its own settings before
  constructing the engine. That remains true; the `Process` face now also validates the engine's
  settings ahead of it.
- The guide's `end` prose gained a link to the "Close a byte session cooperatively" pattern, so the
  sentence naming the unbounded flush points at the pattern that races it.
