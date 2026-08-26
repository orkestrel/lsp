# Unit H2-U4 — the rewrite engine: identity-preserving reuse and derivations

Role and engine: Sol `implementer`, GPT-5.6 Sol, reached through `codex exec`, sandbox
`workspace-write`, working directory `/home/user/markdown`. You perform this assignment
directly and spawn nothing beyond the shell commands your work needs. Red-first for
every behavioral cluster.

Before working, read in order: `/home/user/markdown/AGENTS.md`; the rules —
`.claude/rules/names.md`, `.claude/rules/typescript.md`, `.claude/rules/architecture.md`,
`.claude/rules/tests.md`, `.claude/rules/documentation.md`, `.claude/rules/writing.md`,
`.claude/rules/quality.md`; no skill binds this unit; the guide `guides/markdown.md`
§ Helpers; the design record —
`/home/user/scaffold/.orkestrel/campaign/h2-design-reconciliation.md` (binding, its
ruled fork on `rewriteDocument`) with the analyst lane ruling beside it
(`h2-design-analyst-ruling.md`), whose per-operation derivation semantics are this
unit's acceptance detail.

## Objective

`rewriteDocument` becomes true copy-on-write and returns
`MarkdownDerivation<MarkdownDocument>`: an unchanged subtree keeps its reference
identity, a changed one rebuilds, and the derivations map records exactly the rebuilt
edges — so provenance survives a rewrite instead of ending at it.

## Context — standing conditions and the ruled mechanism

- The tree is expectedly dirty with the uncommitted H2 round: U1 (`src/core/types.ts`),
  U2 and U3 (`src/core/helpers.ts`, `src/core/parsers.ts`, their test files, guide
  signature rows). Build on them; never revert them. The core check exits 2 with
  exactly the U5 unit's expected diagnostics — the missing `span` method at
  `src/core/Markdown.ts:40`, `:94`, and `src/core/factories.ts:81`. Your signature
  change adds the `map` call-boundary diagnostic in `src/core/Markdown.ts` (the
  `rewriteDocument` consumer): name every diagnostic your change adds there in your
  report as the U5 unit's granted standing red, and clear every diagnostic inside your
  own files.
- The contract is already declared: `MarkdownDerivation<T>` at `src/core/types.ts:417`,
  whose TSDoc names it "what `rewriteDocument` returns" and fixes the semantics —
  `derivations` is keyed by the nodes of the OUTPUT; a node mapped to an input node
  takes that input's span; a node mapped to `undefined` was produced from separate
  sources; an absent entry means the output node kept its own identity. Never edit
  `src/core/types.ts`.
- The engine today: `rewriteDocument` at `src/core/helpers.ts:2852`, an iterative
  stack walk that rebuilds EVERY parent unconditionally — each collapse arm builds a
  fresh object even when every child came back reference-identical, and the document
  arm always builds a fresh root. The guide already promises copy-on-write at
  `guides/markdown.md:41` (the `MarkdownRewriteHandler` row), `:99` (the
  `rewriteDocument` row), and `:177` (the `map` row); this unit makes the promise true
  and owns the `:99` signature row. The depth-cap behavior stays: a subtree at
  `MAX_DEPTH` passes through unchanged (the existing row at
  `tests/src/core/helpers.test.ts:1950-1963` asserts the node AT the cap is the same
  reference — that row survives and strengthens).
- The ruled derivation semantics, binding (the analyst ruling's per-operation rows):
  - a handler-returned replacement maps to the input node it replaced — a one-source
    rewrite keeps the region;
  - a parent the ENGINE rebuilds because a child changed maps to the input parent;
  - slot-mismatch reuse — the collapse arms' fallback branches that keep the original
    child when the rewritten slot does not fit — retains the reused original child by
    identity, ABSENT from the map, never as a synthesis;
  - a node the handler synthesizes from separate sources — a joined text run, a
    synthesized paragraph — and every brand-new descendant the handler introduces is
    ABSENT from the map, so a handle resolves it to no span; standalone helpers invoked
    on bare nodes acquire no provenance implicitly;
  - an untouched subtree keeps reference identity and is ABSENT from the map.
- This is a named contract change, not a side effect: the allocation contract moves
  from "every parent is rebuilt" to "an unchanged subtree keeps its identity". The
  design record re-rules the pinned rows deliberately. In your owned test file, locate
  every row the change reddens by RUNNING the suite, and re-rule each red row
  deliberately with the new contract stated in its title or comment; where no row in
  your owned files asserts the old unconditional rebuilding, record that reading. The
  `tests/src/core/Markdown.test.ts` rows (`:113-118` among them) belong to the U5 unit
  — report-only, never edited.

## Red-first sequence

1. The tuple and identity pins, red against the current engine: an identity rewrite
   returns the SAME document reference with an EMPTY derivations map; a single
   text-value rewrite rebuilds exactly the spine — the changed node's ancestors — with
   each rebuilt node mapped to its input, while every untouched sibling subtree keeps
   reference identity and stays absent from the map.
2. The derivation rows: the handler-returned replacement mapping; the join and
   normalization rows — a handler substituting a node whose children are a joined text
   run and a synthesized paragraph: the substituted node maps to its input, the joined
   and synthesized descendants are absent from the map; the slot-mismatch reuse row —
   the reused original child keeps identity and stays absent.
3. The surviving rows re-run green: bottom-up order, root never passed to the handler,
   input never mutated, the depth-cap identity row, the text-value rewrite reflection
   (each updated mechanically to destructure the tuple).

## Host environment and bench limits

Linux container, Node and npm on PATH, network DENIED in your sandbox — no installs, no
fetches. Dependencies are installed. Nested `git` invocations from a spawned tool can
report "not a git repository" while your own `git status` succeeds; that is the
sandbox. The `probe` MCP instrument refuses in this sandbox (approval policy `never`,
measured by the U2 unit) — record any claim needing it as a host observation. Never
make a whole-suite or timing-sensitive gate a criterion for yourself; the Orchestrator
takes the authoritative gates after the round's remaining units land.

## Unknowns

- Whether any consumer beyond `Markdown.map` calls `rewriteDocument`; derive the set
  with a repository search, report it with the search's scope, and update only call
  sites inside your owned files — a consumer outside them is reported as a granted
  standing red with its exact diagnostic, never edited.
- Whether the collapse arms can decide "every child identical" without a second pass;
  the internal shape — a changed flag per frame, a comparison at collapse — is yours to
  decide and record.

## Scope

Owned files: `src/core/helpers.ts` (the `rewriteDocument` region only),
`tests/src/core/helpers.test.ts` (the `rewriteDocument` describe and the new derivation
rows only), `guides/markdown.md` (the `rewriteDocument` signature row `:99` only).

Report-only: `src/core/types.ts`, `src/core/Markdown.ts`, `src/core/factories.ts`,
`src/core/parsers.ts`, `tests/src/core/Markdown.test.ts`, `tests/guides.test.ts`.

Off-limits: everything else.

Allowed tools: read, edit, and scoped shell commands in `/home/user/markdown`. No
commit, no push, no `git checkout`/`restore`/`stash`/`reset`/`clean`, no tree-wide
`format` or `lint --fix`, no installs.

## Execution

You are the bench engine reading this brief inside your own CLI: do the work yourself,
directly, and spawn nothing beyond the shell commands your work needs.

## Output

Your final message is the unit report, in this shape and nothing else:

1. What changed: the engine's behavioral delta and the printed signature.
2. The red-first records per cluster: exact commands, red readings, green readings.
3. The re-ruled row list: each row the change reddened, its old assertion, its new
   ruling — or the recorded reading that none asserted the old contract.
4. The Unknowns' answers with the search scope named, and every diagnostic your change
   adds outside your files, each attributed to its owning unit.
5. Scoped gate readings with exit codes: the helpers test file's project run, scoped
   `oxfmt --check` and `oxlint --deny-warnings` over the owned files, the core
   type-check with every remaining diagnostic attributed, `git diff --check`.
6. Observations outside scope, each named against the capability that owns it.
7. Claims you flag as needing host verification.

No process diary.

## Deviation contract

A conflict with the primary objective stops the unit: report expected, found, exact
evidence, done or not done, and at most one short hypothesis. The named stop
conditions: a derivation semantic the declared `MarkdownDerivation` TSDoc cannot
express; an identity decision that cannot be made without mutating caller input; a
diagnostic your change adds outside `src/core/Markdown.ts` and your own files.
Ancillary conflicts — the changed-flag shape, test titles, the guide row's wording —
are yours to decide, record, and carry on from.

## Acceptance criteria

Ordered cheap-first.

1. `git diff --check` exits 0 and the diff touches only owned files.
2. Scoped `oxfmt --check` and `oxlint --deny-warnings` over the owned files exit 0.
3. The identity pins are green red-first: same document reference and empty map for an
   identity rewrite; exact-spine rebuild with sibling identity for a one-node change.
4. The derivation rows are green red-first, the join, synthesis, and slot-mismatch
   rows included, each matching the declared TSDoc semantics.
5. The surviving rows are green with the tuple destructuring; the depth-cap identity
   row unchanged in meaning.
6. The helpers test project exits 0 scoped; the core check's remaining diagnostics are
   exactly U5's three plus the named `Markdown.ts` call-boundary set your report
   attributes to U5.
7. The guide's `rewriteDocument` row states the landed signature; no banned construct
   anywhere in the diff.

## Review evidence

The Orchestrator captures the actual diff and the actual `git status` output after you
exit; the round's `reviewer` lane — the engine that did not write this unit — audits
your report's claims against the diff.
