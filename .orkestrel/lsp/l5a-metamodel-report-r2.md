## Unit report

**`scripts/metamodel.sh`** — destination changed:
```
-DEST_PATH="tests/fixtures/metaModel.json"
+DEST_PATH="tests/mirrors/metaModel.json"
```
and the header comment now reads `lands it as a byte-exact copy at tests/mirrors/metaModel.json. Takes no arguments.`

**`guides/lsp.md`** (`## Conformance`) — quoted passage now reads:
> This package tracks Language Server Protocol 3.18. The mirror at `tests/mirrors/metaModel.json` holds the protocol's metaModel instance as fetched bytes, refreshed by running `scripts/metamodel.sh`. The conformance proof covers the subset of the protocol this package speaks, and the diagnostic surface is the string-message form matching the client's advertised

**Script re-run (`bash scripts/metamodel.sh`)** — exit 0, printed:
`metamodel.sh: fetched version 3.18.0, sha256 caae8df639a4248520a3f589fd72945365e9d8ebca5baf564161a515430d9d41`

**Fixture verification** (`tests/mirrors/metaModel.json`, both before and after the re-run):
- SHA-256: `caae8df639a4248520a3f589fd72945365e9d8ebca5baf564161a515430d9d41` (matches pin)
- Byte length: 434,788 (matches pin)
- `metaData.version`: `3.18.0`

**Scoped gates:**
- `npx oxfmt --check scripts/metamodel.sh guides/lsp.md` → exit 0 ("All matched files use the correct format.")
- `git diff --check` → exit 0

**Grep confirmation:** no `tests/fixtures` path remains in either `scripts/metamodel.sh` or `guides/lsp.md`.

**Observations outside scope:** `git status --short` shows `scripts/metamodel.sh` as untracked (`??`) alongside `tests/mirrors/` and modified `guides/lsp.md`/`.prettierignore` — reflects the predecessor run's untracked/moved state plus this unit's edits; `.prettierignore` bytes were not touched by this unit.

**Claims needing host verification:** none — every claim above was measured directly in this run.
