# U0 — verify the carried fleet findings

Read-only. Modify no file. Return evidence with `file:line` or commit pointers. No raw dumps, no
decisions.

## Question

Which rows of `C:/Users/mikes/WebstormProjects/lsp/ROADMAP.md` § "Fleet findings carried forward"
(lines 123-153) are already shipped in their owning repository's `main`, which stay open, and
which cannot be verified from here?

## Scope

The owning repositories under `C:/Users/mikes/WebstormProjects/`: `scaffold`, `mcp`, `markdown`,
`html`, `probe`, and the lsp ROADMAP itself. Read each repo's sources, guides, and
`git log --oneline -20` on `main` as needed. Nothing else; no file modification anywhere.

## Evidence sought, one row per finding

1. **scaffold — session-assembly duplication** (byte-identical instruction files injected per
   attached checkout): any landed slimming decision or attach-scoping change.
2. **scaffold — inert `.oxlintignore` under oxlint 1.80.0**: whether `--ignore-path` is wired or
   the file is retired; check scaffold's vendored host files and any target evidence.
3. **fleet — guides-execution gap** (parity drop-in resolves names but executes no fence in
   pre-executed-fence packages; drop-in header carries a count and the word "below"): whether the
   markdown package's `tests/guides.test.ts` shape moved.
4. **mcp — transport-ingress backpressure**: any landed change naming it.
5. **mcp — the `below`/`above` file-wide sweep**: whether it ran.
6. **markdown — vocabulary sweep** (pre-existing `via` at `guides/markdown.md:158,194,227,453`,
   `src/core/helpers.ts:2669`, `src/core/parsers.ts:193`; imperative TSDoc openers at
   `helpers.ts:434,500`): check whether those exact sites still carry the hits.
7. **markdown — CommonMark `U+0000` replacement question**: any ruling landed.
8. **markdown and html — reused-identity engine divergence**: any landed reconciliation.
9. **html — spans-to-markdown inbound projection; barrel membership of `findOpenPosition` and
   `projectDepth`**: whether those symbols joined the barrel or the projection landed.
10. **probe — RuntimeStage frame-basis dependence on Vitest's un-remapped stacks**: whether the
    guard chain or a Vitest change moved it.

## Return shape

- `Question`: one line.
- `Evidence`: a table — finding, verdict (shipped with commit; open; unverifiable with reason),
  pointer.
- `Distillate`: the strike/keep list for the ROADMAP edit.
- `Unknowns`: unresolved facts.
- `Deviation`: only if something blocked the reading.
