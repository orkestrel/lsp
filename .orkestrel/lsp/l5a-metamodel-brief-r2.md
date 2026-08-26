# Unit L5-A r2 — finish the metaModel mirror under the mirrors convention

Supersession: this brief supersedes `l5a-metamodel-brief.md` after its run surfaced that the
tree-wide `format:check` gate flags the fixture at `tests/fixtures/metaModel.json` — the
mirror must keep its fetched bytes, and both formatter ignore carriers (`.oxfmtrc.json` and
`.prettierignore`) are vendored files a target must not edit. The Orchestrator's ruling: a
fleet convention — fetched-bytes mirrors live under `tests/mirrors/`, which the canonical
vendored `.prettierignore` ignores. The canonical line is landed in the scaffold host
inventory; the lsp copy carries the same line ahead of the next scaffold release, a
recorded converging drift.

Role and engine: `builder`, Sonnet, native subagent, sole writer in `/home/user/lsp`. You
perform this assignment directly and spawn nothing.

## Standing conditions — the tree is expectedly dirty

The predecessor run and the Orchestrator's probe left this state; verify it, then build on
it rather than re-deriving it:

- `tests/mirrors/metaModel.json` exists (moved from `tests/fixtures/`), SHA-256
  `caae8df639a4248520a3f589fd72945365e9d8ebca5baf564161a515430d9d41`, 434,788 bytes.
- `tests/fixtures/` is removed.
- `.prettierignore` ends with the comment line
  `# Fetched-bytes mirrors keep their upstream bytes and stay out of the formatter.` and
  the entry `tests/mirrors/` — leave that file exactly as it stands; it is otherwise
  vendored and off-limits.
- `scripts/metamodel.sh` and the `## Conformance` section of `guides/lsp.md` still name
  `tests/fixtures/metaModel.json` — the two stale paths are this unit's work.
- `npm run format:check` over this tree exits 0 (the Orchestrator's probe, 2026-08-26).

## The work

1. Update `scripts/metamodel.sh` so its destination is `tests/mirrors/metaModel.json`.
2. Update the `## Conformance` passage in `guides/lsp.md` to the same path.
3. Re-verify the landed fixture: SHA-256 equals the pin, byte length 434,788,
   `metaData.version` reads `3.18.0`.
4. Run the script once to prove the refresh still reproduces the file byte-identically at
   the corrected destination; if the fetch fails, report the outcome and leave the
   verified bytes in place.

## Scope

Owned files: `scripts/metamodel.sh`, `guides/lsp.md`, `tests/mirrors/metaModel.json`.
Off-limits: everything else, `.prettierignore` included (its present bytes stand).

Allowed tools: read, edit, and scoped shell commands in `/home/user/lsp`. No commit, no
push, no `git checkout`/`restore`/`stash`/`reset`/`clean`.

## Execution

You are a native subagent: do the work yourself, directly, and spawn nothing. Run scoped
checks only; the Orchestrator takes the authoritative gates after you exit.

## Output

Your final message is the unit report: each owned file's delta with the guide passage
quoted; the script's printed digest and version from the re-run; the fixture's verified
digest and byte length; scoped `oxfmt --check` over `scripts/metamodel.sh` and
`guides/lsp.md` plus `git diff --check`, each with its exit code; observations outside
scope; claims needing host verification. No process diary.

## Deviation contract

A conflict with the primary objective stops the unit: report expected, found, exact
evidence, done or not done, and at most one short hypothesis. The named stop condition: the
fixture's digest no longer matches the pin. Ancillary wording inside the passage is yours
to decide and record.

## Acceptance criteria

1. `scripts/metamodel.sh` and `guides/lsp.md` name `tests/mirrors/metaModel.json` and no
   `tests/fixtures` path survives in either.
2. The fixture verifies against the pin and parses with `metaData.version` `3.18.0`.
3. Scoped `oxfmt --check` over the script and guide exits 0; `git diff --check` exits 0.

## Review evidence

The Orchestrator captures the actual diff and status after you exit; your report's claims
are audited against them.
