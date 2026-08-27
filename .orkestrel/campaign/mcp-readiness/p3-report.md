# P3 report — probe adopts the renamed lsp surface

Done. Every acceptance criterion closed. No deviation.

## Touched files

- `src/server/stages/LintStage.ts` — imports and calls `createStdioClientTransport`; the `@remarks`
  sentence naming the factory rewrapped at the file's 100-column comment width.
- `guides/probe.md` — the **How the lint stage speaks the protocol** transport bullet names
  `createStdioClientTransport`; the **See also** list gains the `lsp.md` mirror row.
- `guides/lsp.md` — new, the vendored `@orkestrel/lsp` mirror.

Diffstat over tracked owned files:

```text
 guides/probe.md                |  6 ++++--
 src/server/stages/LintStage.ts | 13 +++++++------
 2 files changed, 11 insertions(+), 8 deletions(-)
```

`guides/lsp.md` is untracked and 27949 bytes.

`package.json` and `package-lock.json` are modified in the tree exactly as the brief described them
on arrival. This unit did not edit either. `tmp/worktrees/` was neither read nor written, and every
command run was scoped to `src`, `tests`, `guides`, or a named test project whose globs reach
`{app,src}`, `tests`, `configs`, `scripts`, root code files, `.agents/skills`, and `.claude/skills`
— none of them `tmp/`.

## Sweep

Pattern: `createStdioTransport|StdioTransport(Options|Interface)?`. That alternation reaches
`createStdioTransport`, `StdioTransport`, `StdioTransportOptions`, and `StdioTransportInterface`, and
does not match the renamed `StdioClientTransport*` names.

Scope run before the change, over tracked files: `git grep -n -E … -- src tests guides`.
`git status --short --untracked-files=all -- src tests guides` reported no untracked file in those
directories, so the tracked population was the whole population.

Hits and resolutions:

| Hit | Resolution |
| --- | --- |
| `src/server/stages/LintStage.ts:6` — `import { createStdioTransport } from '@orkestrel/lsp/server'` | Renamed to `createStdioClientTransport`. |
| `src/server/stages/LintStage.ts:22` — `@remarks` naming the factory | Renamed and the paragraph rewrapped. |
| `src/server/stages/LintStage.ts:148` — `transport: createStdioTransport({ … })` | Renamed. |
| `guides/probe.md:770` — **The transport is `createStdioTransport` from `@orkestrel/lsp/server`.** | Renamed and the bullet rewrapped. |

`tests/src/server/stages/LintStage.test.ts` names no lsp surface symbol at all — the pattern found
nothing there, and neither did a `lsp|Stdio|transport` search of that file. The brief scoped it
"only if it names the old surface", so it is unchanged.

Sweep after the change, over tracked and untracked files together:

```text
$ grep -rn -E 'createStdioTransport|StdioTransport(Options|Interface)?' src tests guides
exit=1
```

Widened once more to the whole repository, excluding `node_modules`, `tmp`, `.git`, and `dist`:

```text
$ grep -rn -E 'createStdioTransport|StdioTransport(Options|Interface)?' . \
    --exclude-dir=node_modules --exclude-dir=tmp --exclude-dir=.git --exclude-dir=dist
exit=1
```

`@orkestrel/mcp`'s own transport names were never at risk: the pattern returned no hit outside the
rows in the preceding table, so nothing belonging to that package was read or rewritten.

## Installed declarations

Read at `node_modules/@orkestrel/lsp/dist/src/server/index.d.ts`, installed version `0.0.3`. The
renamed surface declares `createStdioClientTransport(options: StdioClientTransportOptions):
StdioClientTransportInterface`, and `StdioClientTransportOptions` carries the same shape the call
site already passes: `server.command`, optional `server.directory`, optional `server.environment`,
and optional `grace`. The rename is therefore the whole adoption — no option key, no argument, and
no awaited result changed.

## Mirror

Source: `C:\Users\mikes\WebstormProjects\lsp\guides\lsp.md`.

SHA-256: `eb10bd40d8657794781323a68336eda8f37077a9204e2e7c52d0f0892b41eaad`
Size: 27949 bytes.

The copy at `guides/lsp.md` reports the same SHA-256 and the same size, and `cmp` against the source
reported no difference. The file was copied, never rewritten.

## Where the mirror is named

`guides/probe.md` § See also carries this repository's dependency-mirror list, and the new row sits
between the `mcp.md` and `tool.md` rows:

```markdown
- [`lsp.md`](lsp.md) — the dependency mirror for `@orkestrel/lsp`, whose client and stdio client
  transport carry the lint stage's conversation with the Oxlint language server.
```

`guides/README.md` is unchanged, and this is the ancillary decision the deviation contract left to
me. Its directory index lists source directories with their guide and their tests, and its concept
index lists the package. Neither index carries a mirror row: `mcp.md`, `tool.md`, and `contract.md`
are all absent from it. Adding `lsp.md` alone would have invented a shape the file does not have, so
the mirror is named where the other mirrors are named. A repository-wide search for
`dependency mirror|mirrored guide` across Markdown found no other list that owes an `lsp.md` row.

## Failing proof, then green

Before the change, the exact command and its output:

```text
$ npm run check
src/server/stages/LintStage.ts(6,10): error TS2724: '"@orkestrel/lsp/server"' has no exported member
named 'createStdioTransport'. Did you mean 'createStdioClientTransport'?
```

After the change, the same command:

```text
$ npm run check
(tsc --noEmit --project tsconfig.json, then check:src:core, check:src:server, check:src:bin —
no diagnostic, exit 0)
```

## Scoped validation

Every run below was taken in the probe main checkout on 2026-08-27.

| Command | Result |
| --- | --- |
| `npm run check` | Green, no diagnostic. |
| `npx oxlint --config .oxlintrc.json --deny-warnings src/server/stages/LintStage.ts` | Green, exit 0. |
| `npx oxfmt --config .oxfmtrc.json --check src/server/stages/LintStage.ts` | "All matched files use the correct format." |
| `npx oxfmt --config .oxfmtrc.json --check guides/probe.md guides/lsp.md` | "All matched files use the correct format." |
| `npm run test:src:server` | 7 files passed, 173 passed, 4 skipped, 118.62 s. |
| `npm run test:guides` | 1 file passed, 13 passed, 4.61 s. |
| `npm run test:policy` | 1 file passed, 93 passed, 1.53 s. |

The scoped format check is beyond the brief's list. I ran it because the comment rewrap and the
guide rewrap both move line breaks, and a formatter-dirty file would surface later as someone else's
red.

## The real-oxlint proof

`npx vitest run --config vite.config.ts --no-cache --reporter=verbose --project src:server
tests/src/server/stages/LintStage.test.ts` returned 28 passed and 2 skipped in 18.65 s. Those rows
construct `LintStage` against a real workspace, which reaches `createStdioClientTransport` through
`#warm`, spawns the workspace's own installed Oxlint entry with `--lsp`, and reads what that server
publishes. The rows that make the integration unambiguous:

- `reports a workspace lint issue at the declared path`
- `applies the workspace lint overrides the declared path selects`
- `applies an override the workspace anchors to one exact path`
- `reports nothing for a path the target workspace excludes from linting`
- `ends the language server process it owns when teardown settles`, which printed
  `the lint stage owns language server process 70432`

## Claims I could not close

Neither of these is mine to close, and neither blocks the acceptance criteria.

- **The two skipped `LintStage` rows.** `restores progress to its pre-inspection reading while its
  close cleanup is still pending` and `refuses an inspection through a stage fault when the language
  server closes its input` both carry a host-conditional skip reason written into the test: this
  Windows host settles a close-sized write into a child that never reads, and accepts a write to a
  child that closed its own standard input, so neither fixture can break the pipe it needs. They
  skip for the host rather than for the rename, and their reasons predate this unit.
- **The whole-suite gates.** `npm test`, `npm run build`, `npm run format:check`, and
  `npm run lint:check` were not run. They are tree-wide, and this unit validates read-only and
  scoped to its own files.
