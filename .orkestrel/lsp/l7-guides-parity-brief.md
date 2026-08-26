# Unit brief: l7-guides-parity — the lsp guides project in the fleet-standard shape

## Role and engine

`implementer` — Opus 5, native subagent. You write in `/home/user/lsp`, the sole writer in
that checkout, from the clean committed baseline `cfb743d` on branch `main`. You perform
the assignment directly yourself and spawn nothing.

## Objective

The workspace runs a `guides` test project in the fleet-standard drop-in shape, its parity
suite green, and the whole test chain green with the pre-unit counts unchanged.

## Context

- Read before editing: `/home/user/lsp/AGENTS.md`; `/home/user/lsp/.claude/rules/` —
  `documentation.md`, `architecture.md` (§ Barrel exports), `tests.md`, `workspace.md`,
  `writing.md`; no skill (explicit none).
- The fleet-standard drop-in is `/home/user/markdown/tests/guides.test.ts` (170 lines): a
  consumer-side parity suite over `@orkestrel/guide` and `@orkestrel/test`, whose header
  states that the constants block (`FENCE_LANGUAGES`, `EXAMPLE_LANGUAGE`, `MODULES`,
  `INTERNAL`, `ROOT_FILES`) is the only part a sibling package changes. Read it whole, and
  read `/home/user/markdown/vite.config.ts` for the `guides` project shape and
  `/home/user/markdown/package.json` for the script wiring.
- Both dependencies are declared and installed here: `@orkestrel/guide` `^0.0.14` and
  `@orkestrel/test` `^0.0.11` (`package.json:83,86`). Read their installed declarations
  under `node_modules/@orkestrel/` before wiring — never guess a helper's contract.
- This workspace: `src/core` and `src/server`; the published specifiers are
  `@orkestrel/lsp` (core) and `@orkestrel/lsp/server` (server), per the `exports` map.
- The guide inventory: `guides/README.md` (the manifest), `guides/lsp.md` (the package
  guide), and `guides/guide.md` plus `guides/scaffold.md` (vendored dependency mirrors,
  outside local parity per `.claude/rules/documentation.md`).
- Pre-unit baselines, measured 2026-08-26 at `cfb743d`, `npm test` exit 0: src `104 passed`,
  policy `93 passed`, setup `16 passed`, config `46 passed`, conformance `243 passed`.
- Host facts: Node and npm on PATH; no network needed; foreground commands finish inside
  the shape the baselines show.

## Unknowns

- Whether the installed `parseManifest` maps this manifest's one "Package" concept with a
  two-directory Source list into one entry per source or one entry per concept. Read the
  installed declaration and behavior first; where the fleet shape needs per-directory
  concept entries, reshape `guides/README.md` to say the same truth in the shape the
  machinery reads, and record the reshaping in the report.
- The `INTERNAL` set for this package. Derive it from the first run's stranded-symbol
  reading and rule each stranded export per `.claude/rules/architecture.md` § Barrel
  exports — barrel it when a consumer can construct it from values they already hold,
  intern it (name it in `INTERNAL` with the file's justification comment) when its
  constructor needs an owner-produced value or the public value is a projection. Record
  every ruling with its reasoning in the report.
- What parity drift the first run surfaces in `guides/lsp.md`. Repair drift in the guide's
  established voice; the drift set is unknown until the run reports it.

## Scope

- Owned: `tests/guides.test.ts` (new), `vite.config.ts` (the `guides` project and its
  projects-array row), `package.json` (the `test:guides` script and the `test` chain row
  only), `guides/README.md`, `guides/lsp.md`, `src/core/index.ts` and `src/server/index.ts`
  (barrel membership only).
- Off-limits: `.orkestrel/`, `tmp/`, `ROADMAP.md`, `AGENTS.md`, `.claude/`, `.agents/`,
  the vendored `guides/guide.md` and `guides/scaffold.md` mirrors, and every `src/` file
  except the two barrels. A parity failure whose repair needs any other `src/` edit is a
  deviation, never an edit.

## Deliverables

1. `tests/guides.test.ts` in the drop-in shape, adapted only in the constants block:
   `MODULES` mapping `@orkestrel/lsp` → `src/core`, `@orkestrel/lsp/server` → `src/server`,
   and the workspace's own aliases; `FENCE_LANGUAGES`/`EXAMPLE_LANGUAGE` matching what
   `guides/lsp.md` actually uses and the rules permit; `ROOT_FILES` covering the root files
   the guides link to; `INTERNAL` per the Unknowns ruling.
2. The `guides` vite project in the fleet shape, registered in the projects array, with the
   `test:guides` script and its membership in the `test` chain.
3. Every parity failure the suite surfaces repaired — guide rows in the guide's voice,
   manifest reshaping if the Unknowns require it, barrel membership per the ruling — until
   the project reads green.

## Execution

You perform the assignment directly and spawn nothing. Validate scoped, cheap-first:

```text
npx oxfmt --config .oxfmtrc.json --check <owned files>
npx --no-install oxlint --config .oxlintrc.json --deny-warnings tests/guides.test.ts vite.config.ts
npm run check
npm run test:guides
npm test
```

## Deviation contract

Stop and report — expected, found, exact evidence — when a parity repair needs a `src/`
edit beyond the barrels, when the installed `@orkestrel/guide` machinery cannot express
this workspace's manifest truth, when a pre-unit count moves, or when a gate reds outside
your edits. Guide wording inside a repair is yours to decide and record.

## Acceptance criteria, cheap-first

1. Scoped format and lint exit 0; `npm run check` exit 0.
2. `npm run test:guides` exit 0 with at least one test per manifest concept.
3. `npm test` exit 0 with src `104 passed`, policy `93 passed`, setup `16 passed`, config
   `46 passed`, conformance `243 passed` unchanged, plus the guides project's own reading.
4. A writing-rules sweep over your added and changed prose lines passes, pattern and
   population named.

## Output

Write the report to `/home/user/lsp/tmp/units/l7-guides-parity-report.md`: the manifest
mapping reading from the installed declarations, every `INTERNAL` and barrel ruling with
reasoning, every parity repair with before and after, the gate readings with exit codes,
the sweep, and the actual `git status --short` and `git diff --stat` output. Your final
message is a short summary naming the report path.
