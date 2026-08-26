Owned prose and script files pass. The fixture is fetched bytes, excluded per the mirror law. Final report:

## Unit report — L5-A metaModel mirror

**1. What changed**

- `tests/fixtures/metaModel.json` — new file, the fetched LSP 3.18.0 metaModel instance, byte-exact, 434,788 bytes.
- `scripts/metamodel.sh` — new file, the refresh script (chmod `+x`), fetching the canonical URL and moving the parsed result to the destination path.
- `guides/lsp.md` — added a `## Conformance` section between `## Framing state` and `## Methods`:

  > This package tracks Language Server Protocol 3.18. The mirror at `tests/fixtures/metaModel.json`
  > holds the protocol's metaModel instance as fetched bytes, refreshed by running
  > `scripts/metamodel.sh`. The conformance proof covers the subset of the protocol this package
  > speaks, and the diagnostic surface is the string-message form matching the client's advertised
  > capability.

- `guides/README.md` — untouched. Its concept index carries one `Package` row (Spec/Source/Tests); the conformance passage lives inside the existing `guides/lsp.md` spec entry and owes no new row or path under the index's present shape.

**2. Fetch outcome**

`scripts/metamodel.sh` printed: `metamodel.sh: fetched version 3.18.0, sha256 caae8df639a4248520a3f589fd72945365e9d8ebca5baf564161a515430d9d41`. The landed file's independently computed SHA-256 is `caae8df639a4248520a3f589fd72945365e9d8ebca5baf564161a515430d9d41`, 434,788 bytes — matches the pin exactly. The staged-copy fallback did not run; the live network fetch through the preconfigured proxy succeeded on the first attempt.

**3. Scoped gate readings**

- `npx oxfmt --check scripts/metamodel.sh guides/lsp.md guides/README.md` — exit `0`.
- `npx oxlint --deny-warnings scripts/metamodel.sh guides/lsp.md guides/README.md tests/fixtures/metaModel.json` — exit `1`, "No files found to lint." `oxlint`'s configured extensions cover no `.sh`, `.md`, or `.json` file, so it accepts none of the owned files; this is the tool's applicability, not a defect in them.
- `git diff --check` — exit `0`.

**4. Observations outside scope**

- `npx oxfmt --check` over the fixture alone reports a formatting difference (`tests/fixtures/metaModel.json`). This is expected: the mirror law in `.claude/rules/documentation.md` fixes the fixture as fetched bytes, so it is excluded from the owned prose/script formatting check and never reformatted. No capability owns a fix here.
- L5-B (not this unit's scope) builds the conformance suite over this fixture.

**5. Claims flagged for host verification**

- The `oxlint` "no files found" result reflects the tool's own file-extension scope as observed in this run; the Orchestrator's authoritative gate run should confirm this matches the tree-wide configuration rather than a scoping mistake in the command given here.
- `git diff --check` reported clean; the Orchestrator's own `git status` and diff capture is the audited source of truth per the brief's Review evidence.
