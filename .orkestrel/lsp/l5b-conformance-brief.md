# Unit L5-B — the lsp conformance infrastructure, suite, and wiring

Role and engine: Sol `implementer`, GPT-5.6 Sol, reached through `codex exec`, sandbox
`workspace-write`, working directory `/home/user/lsp`. You perform this assignment directly
and spawn nothing beyond the shell commands your work needs. Red-first for every behavioral
row, with the prescribed mutation controls.

Before working, read in order: `/home/user/lsp/AGENTS.md`; the applicable rules —
`.claude/rules/names.md`, `.claude/rules/typescript.md`, `.claude/rules/tests.md`,
`.claude/rules/workspace.md`, `.claude/rules/documentation.md`, `.claude/rules/writing.md`,
`.claude/rules/quality.md`; no skill binds this unit; the guide `guides/lsp.md`
§ Conformance; the design record —
`/home/user/scaffold/.orkestrel/campaign/l5-design-reconciliation.md` and its amendment
`l5-design-reconciliation-r2.md` beside it (the amendment's mirrors path supersedes every
`tests/fixtures` reference in the earlier files).

## Objective

The conformance project proves the package's protocol surface against the vendored LSP
3.18.0 metaModel and the installed `vscode-languageserver-protocol` release, with per-row
failures naming the drifted symbol and the authority's value, wired exactly as the vendored
configuration proof requires.

## Context

Baseline: lsp commit `586758d`, tree clean at dispatch. The L5-A unit landed the mirror
at `tests/mirrors/metaModel.json` (SHA-256
`caae8df639a4248520a3f589fd72945365e9d8ebca5baf564161a515430d9d41`, 434,788 bytes,
`metaData.version` `3.18.0`), the refresh script, and the guide's `## Conformance` passage.
`.prettierignore` already ignores `tests/mirrors/`.

The design round's reconciled rulings, binding here:

- **The comparisons.** One exported table per comparison in `tests/setupConformance.ts`:
  - `CONFORMANCE_METHODS` — every `LSP_METHODS` value (`src/core/constants.ts`) against
    the metaModel's `requests` or `notifications` entry: the method string and the entry's
    `messageDirection`. Where the installed package's public entry exposes the matching
    namespace's `.method` value (initialize, initialized, shutdown, exit, open, close,
    publish, diagnostic), the row carries it as a second coordinate; `cancel`
    (`$/cancelRequest`) compares against the metaModel alone — the public exports do not
    reach the cancellation namespace, and no private subpath import is taken. The table's
    membership assertion equals the exact `Object.keys(LSP_METHODS)` set.
  - `CONFORMANCE_NUMERALS` — every error constant the package declares
    (`src/core/constants.ts:17-42`; derive the exact list from the file) against BOTH the
    metaModel's `ErrorCodes` and `LSPErrorCodes` enumeration values AND the installed
    runtime namespaces (`ErrorCodes` through the public entry, `LSPErrorCodes` likewise).
    The assertion message leads with the installed value.
  - `CONFORMANCE_VALUES` — `LSP_ENCODINGS` against the metaModel `PositionEncodingKind`
    values (`utf-8`, `utf-16`, `utf-32`) and the installed namespace; the
    `LSPTextDocumentSyncKind` union values against `TextDocumentSyncKind`
    (`None` 0, `Full` 1, `Incremental` 2); and, where the package declares diagnostic
    severity or tag unions (re-derive from `src/core/types.ts` and
    `src/core/validators.ts`), their values against the matching metaModel enumerations
    and installed namespaces. Claim no exhaustiveness over open string enumerations — the
    metaModel permits custom position encodings.
  - `CONFORMANCE_STRUCTURES` — for the wire structures the client produces or consumes
    (initialize params and capabilities, initialize result and server capabilities,
    document open and close params, diagnostic request params and reports, publish
    params, position, range, location, code description, related information, diagnostic,
    text-document identifier and item — re-derive the exact local set from
    `src/core/types.ts` and the guards in `src/core/validators.ts`): per projected local
    member, the named metaModel structure declares it, requiredness matches (the
    instance's `optional` field is flat — probe-confirmed), and where the property's
    descriptor is a base kind, the base-type name matches. A non-base descriptor row
    asserts existence and requiredness only; the metaModel's type-union grammar is never
    interpreted.
  - Guard parity — rows feed authority-shaped values through the local guards, and the
    installed executable guards corroborate where the public entry exposes them
    (`Position.is`, `Range.is`, `Location.is`, `CodeDescription.is`,
    `DiagnosticRelatedInformation.is`, and `Diagnostic.is3_17` — the string-message form
    matching this client's advertised empty diagnostic capability).
  - The dependency boundary — the upstream protocol family
    (`vscode-languageserver-protocol`, `vscode-languageserver-types`, `vscode-jsonrpc`)
    appears in no `dependencies`, `peerDependencies`, or `optionalDependencies` field and
    in no `src/**` import. Read the imports through TypeScript's own compiler API (the
    `typescript` module is installed), never a regex.
  - The pins — the mirror's raw bytes hash to the digest constant before parsing;
    `metaData.version` reads `3.18.0`; the installed release (the manifest resolved from
    the package's public entry — where the exports map blocks a `package.json` subpath
    import, read it with `node:fs` anchored the way `tests/setupServer.ts` anchors
    `WORKSPACE_ROOT`) sits in the `3.18` line; the lockfile records that same release;
    the declared range in the workspace manifest is `^3.18.2`.
- **Failure naming.** Parameterized per-row cases: the local symbol in the case title, one
  direct comparison in the body, the authoritative value in the assertion message
  (`${symbol} drifted; ${authority}=${value}`). No aggregate object diffs; no tallies —
  membership assertions name symbol sets, never counts. Tables parse at import so rows
  exist at collection.
- **Placement law.** `tests/setupConformance.ts` holds the loader, tables, lookup helpers
  (`read`-prefixed, `undefined` on a miss, matching the repository's `read*` vocabulary),
  and drift-message formatting; it contains no `describe`, `it`, or `expect`, and every
  declaration in it is exported. `tests/conformance.test.ts` imports it and registers the
  rows. `tests/setupConformance.test.ts` proves the exported infrastructure — the loader
  parses the mirror, each lookup helper answers a hit and a miss, and each shared
  instrument can fail: on synthesized drifted inputs (a wrong method, a wrong numeral, a
  wrong structure member, a byte-perturbed copy of the mirror built in the ignored `tmp/`
  area, a synthesized forbidden import source), the comparison or formatter reports the
  drift naming the symbol and authority value. The `setup` project collects that file
  through its existing glob.
- **Wiring.** `vite.config.ts` exports a factory named `conformance` — `include:
  ['tests/conformance.test.ts']`, `environment: 'node'`, browser disabled, `setupFiles`
  exactly `['./tests/setup.ts']`, no timeout — listed in `projects` between `config` and
  `distribution`. `package.json` gains `"test:conformance": "vitest run --config
  vite.config.ts --no-cache --reporter=dot --project conformance"`, reachable from `test`
  in the repository's script-chain shape. The vendored proof `tests/config.test.ts`
  auto-registers the project from the trigger filename and refuses a second setup entry —
  never edit that file; if it cannot pass, stop and report.

## Mutation controls

Each control backs the mutated file up byte-exact under the ignored `tmp/` area, runs the
named scope unfiltered, restores from the backup, and proves restoration with `cmp` run
while mutated (expect 1) and after restore (expect 0).

- The planted coordinate: point one numeral row's authority coordinate at the wrong
  installed member inside `tests/setupConformance.ts` (an owned file; a plain edit, no
  backup ritual needed) — `npm run test:conformance` red naming that symbol; restore;
  green.
- The source control: change `LSP_METHODS.initialize` to `initialize/control` in
  `src/core/constants.ts` (report-only, temporary-mutation allowance, `cmp`-restored) —
  the conformance run red naming `LSP_METHODS.initialize` with authority value
  `initialize`; restore; green.

## Red-first sequence

Register the project and create the trigger file before adding the script:
`npm run test:config` red because the registered project is unreachable from a gate;
record the exact failure; add `test:conformance` and its `test` chain entry; the same
command green. Then the two mutation controls above, then the unfiltered green runs.

## Host environment and bench limits

Linux container, Node and npm on PATH, network DENIED in your sandbox — no installs, no
fetches; the mirror is on disk. Dependencies are installed, `typescript` included. Nested
`git` invocations from a spawned tool can report "not a git repository" while your own
`git status` succeeds; that is the sandbox. The `prove` MCP instrument is unreachable;
red-first records and `cmp`-proven restorations are your instrument evidence. Never make a
whole-suite or timing-sensitive gate a criterion for yourself: run the scoped projects
(`test:config`, `test:setup`, `test:conformance`, `check`), record any whole-suite reading
as an observation, and the Orchestrator takes the authoritative gates after you exit.

## Unknowns

- Whether the package declares diagnostic severity and tag unions for `CONFORMANCE_VALUES`
  to cover; re-derive from `src/core/types.ts` and `src/core/validators.ts` and report the
  set you covered.
- The collection-time parse cost of the 434,788-byte mirror; report the `conformance`
  project's own duration reading as an observation.

## Scope

Owned files: `tests/setupConformance.ts`, `tests/setupConformance.test.ts`,
`tests/conformance.test.ts`, `vite.config.ts`, `package.json`.

Report-only: `tests/config.test.ts` (never edited); `src/core/constants.ts` (the one
temporary-mutation control, `cmp`-restored); `tests/mirrors/metaModel.json` (read and
hashed, never written); everything under `src/**` read-only.

Off-limits: everything else, the lockfile and `.prettierignore` included.

Allowed tools: read, edit, and scoped shell commands in `/home/user/lsp`. No commit, no
push, no `git checkout`/`restore`/`stash`/`reset`/`clean`, no tree-wide `format` or
`lint --fix`.

## Execution

You are the bench engine reading this brief inside your own CLI: do the work yourself,
directly, and spawn nothing beyond the shell commands your work needs.

## Output

Your final message is the unit report, in this shape and nothing else:

1. What changed: each owned file with the exact behavioral delta.
2. The table populations: the symbol sets each table covers, with the derivation source.
3. The red-first sequence: the `test:config` red and green with exact readings.
4. The mutation accounts: each control's mutated line, the exact red case title, `cmp`
   readings, and the restored green.
5. The Unknowns readings.
6. Scoped gate readings with exit codes: `npm run check`, `npm run test:config`,
   `npm run test:setup`, `npm run test:conformance`, scoped `oxfmt --check` and
   `oxlint --deny-warnings` over the owned files, `git diff --check`.
7. Observations outside scope, each named against the capability that owns it.
8. Claims you flag as needing host verification.

No process diary.

## Deviation contract

A conflict with the primary objective stops the unit: report expected, found, exact
evidence, done or not done, and at most one short hypothesis. The named stop conditions:
`tests/config.test.ts` cannot pass without an edit to it; the mirror's digest fails the
pin; a comparison cannot be expressed without interpreting the metaModel's type-union
grammar; the installed public entry exposes neither a needed namespace nor a lawful
manifest path. Ancillary conflicts — helper naming within the `read*` form, suite block
ordering, the drift message's exact wording — are yours to decide, record, and carry on
from.

## Acceptance criteria

Ordered cheap-first.

1. `tests/setupConformance.ts` carries no `describe`, `it`, or `expect`, and every
   declaration in it is exported.
2. The factory, project slot, script string, and `test` chain match the wiring ruling
   exactly; `npm run test:config` exits 0, with the recorded red between registration and
   script.
3. `npm run test:setup` exits 0, with the loader, lookup-miss, and can-fail control rows
   present in `tests/setupConformance.test.ts`.
4. Every `LSP_METHODS` key has a row and the membership assertion holds; the numeral,
   value, structure, guard-parity, dependency-boundary, and pin rows are present and
   green.
5. Both mutation controls red exactly their named case and restore `cmp` 0.
6. `npm run test:conformance` exits 0 unfiltered.
7. `npm run check` exits 0.
8. No banned construct anywhere in the diff.

## Review evidence

The Orchestrator captures the actual diff and the actual `git status` output after you
exit; your report's claims are audited against them. Flag any claim you could not close
rather than rounding it up.
