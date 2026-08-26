# Design brief L5 — the lsp conformance project's shape

One brief, two lanes. The subjective lane (`planner`, Claude Opus 5, native subagent) argues
shape, naming, ergonomics, and design fit; the objective lane (`analyst`, GPT-5.6 Sol,
`codex exec`, sandbox `read-only`, working directory `/home/user/lsp`) argues correctness,
constraints, and what the code and contracts actually permit. Each lane reads this brief and
its evidence slice, works blind to the other, performs the assignment directly, and spawns
nothing. Neither lane edits anything.

Before ruling, read in order: `/home/user/lsp/AGENTS.md`; the applicable rules —
`.claude/rules/tests.md`, `.claude/rules/workspace.md`, `.claude/rules/architecture.md`,
`.claude/rules/names.md`, `.claude/rules/documentation.md`, `.claude/rules/quality.md`; no
skill binds this round; the guide `guides/lsp.md`; the terrain distillate at
`/home/user/scaffold/tmp/units/l5-terrain-distillate.md` (spot-check any pointer you lean
on).

## The question

Design the conformance project for `@orkestrel/lsp`: the package's protocol surface proven
against the upstream authority, with everything foreign on the development-dependency side
and nothing entering the runtime graph.

## Fixed by prior rulings (not yours to reopen)

- The upstream authority is `vscode-languageserver-protocol@^3.18.2`, installed as a
  development dependency at lsp `6690bc7`.
- The LSP 3.18.0 metaModel instance is fetched (434,788 bytes,
  `metaData.version` `3.18.0`) and will be vendored into the repository as test data; where
  it sits is yours to rule.
- The client forces the latest protocol; the package targets LSP 3.18.
- mcp's conformance mechanism — driving the upstream project's own live conformance runner
  — is unavailable here: no LSP equivalent of `@modelcontextprotocol/conformance` exists.
  The mechanism transforms; the intent stands.

## Rule on at least these axes

1. **What conformance means here.** Which comparisons earn their keep: the `LSP_METHODS`
   table against the metaModel's request and notification method names; the error numerals
   against the metaModel's enumerations and the installed package's constants; the
   capability structures and validator guards against the metaModel's structures for the
   surface the package actually speaks; anything the installed package's namespaces prove
   that the metaModel cannot, and the reverse. Name what is deliberately out — a package
   speaking a subset of LSP owes conformance on the subset it speaks plus the completeness
   claim it makes, not on all 69 requests.
2. **Failure naming.** A drifted member must fail naming the drifted symbol and the
   authority's value. Rule on the assertion shape that achieves it.
3. **Where the metaModel lives.** A vendored JSON instance is fetched bytes (a mirror, per
   `.claude/rules/documentation.md`); rule on its path, how its refresh is recorded, and
   whether a digest pins it.
4. **Project wiring.** The `conformance` Vitest project slot, its setup file, and how
   `tests/config.test.ts:115-127` (which already treats `tests/conformance.test.ts` as the
   trigger filename) constrains the layout. The mcp precedent's version-pin assertion — the
   suite asserts the pinned upstream version so an unnoticed bump cannot silently change
   the authority — and what its analogue is here.
5. **The missing protocol-version constant.** No protocol-version constant exists in
   `src/` while the client forces the latest protocol. Rule whether conformance requires
   one as a public export (with its first real consumer being the conformance suite and
   the client's initialize path), or whether pinning the metaModel's `metaData.version` in
   the suite alone is honest. The Minimal-public-API law binds: a capability enters with
   its first real consumer.
6. **Unit decomposition.** The implementation units this design yields, each with owned
   files, red-first proof obligations, and independently checkable acceptance criteria —
   sized for one bench implementer unit where possible.

## Output

Your final message is your lane's ruling: per-axis positions with `file:line` evidence
where the code constrains the choice, the risks you see, at most one recommended shape per
axis, and the unit decomposition with acceptance criteria. Name any fact you could not
verify. No process diary.
