# Unit H1 — source provenance for the html package

## Role and engine

`sol` implementer route: you are the GPT-5.6 Sol engine, reached through `codex exec`, sandbox
`workspace-write`, working directory `/home/user/html`. You perform this assignment directly and
spawn nothing beyond the shell commands your work needs.

## Objective

The `HTML` entity answers `span(node)` with the half-open UTF-16 region of the ORIGINAL input
that produced the node, across the parsed, sanitized, and distilled trees, with the proofs this
brief names, from the committed `7d82b86` baseline.

## Context

- Read before editing: `/home/user/html/AGENTS.md`; `.claude/rules/names.md`, `typescript.md`,
  `architecture.md`, `patterns.md`, `tests.md`, `documentation.md`, `quality.md`;
  `guides/html.md`. Skill: none.
- The terrain evidence with verified `file:line` pointers is at
  `/home/user/scaffold/.orkestrel/campaign/h-terrain-distillate.md` — read its html half. Its
  load-bearing pointers were re-verified against source on 2026-08-25: the pre-scan rewrite
  `const source = html.replace(/\r\n?/g, '\n').replaceAll('\0', '�')` at
  `src/core/parsers.ts:25`; the `category` discriminant on every node; the sanitize path that
  reparses comments and doctypes through `parseDocument(renderHTML(node))` at
  `src/core/HTML.ts:284-289`; `sanitize`, `distill`, and `map` each returning a fresh
  `HTMLInterface` at `src/core/types.ts:322`, `:338`, `:344`.
- Baseline: the tree sits at `7d82b86`, clean. Do not commit; the Orchestrator commits.
- Dependencies installed; network denied; never install.
- Scoped commands (`tsc`, `oxlint`, `oxfmt`, `vitest`) work in this sandbox. The core test
  project name and config mirror the repository's `vite.config.ts`; read it before running.
- The `prove` instrument of the `probe` MCP server is unreachable inside this exec (the harness
  refuses the call under an approval policy of never). Where `.claude/rules/quality.md`
  § Instruments requires a compiler-backed receipt, record the exact case and control edit as an
  observation naming the settling command; the Orchestrator takes the receipt on the host.

## The contract

Types first, in `src/core/types.ts`:

- `HTMLSpan` — `{ readonly start: number; readonly end: number }`. Half-open `[start, end)` in
  UTF-16 code units. The offsets address the ORIGINAL string given to the entity, before the
  CRLF and null rewrite at `src/core/parsers.ts:25`.
- `span(node: HTMLNode): HTMLSpan | undefined` on `HTMLInterface`, implemented by the `HTML`
  class. `undefined` means the node has no provenance: the entity was constructed from an
  `HTMLDocument` value rather than a string, the node does not belong to this entity's tree, or
  the node was synthesized with no single source node. Absence is `undefined`; invent no
  sentinel.
- Nodes gain NO member. The terrain distillate's blast set — exact-key validators at
  `src/core/validators.ts:144` and `:146`, closed shapers, and the tree-equality rows across the
  suite — is the recorded reason: provenance is a side-lookup on the entity, and every existing
  tree, guard, shaper, and equality row stays byte-identically true.

## The rulings the implementation binds to

- **Original-input offsets.** Every scan cursor addresses the normalized string, so the parser
  records the normalization mapping of the single rewrite at `parsers.ts:25` and reports spans
  in original coordinates. A `\r\n` collapses to `\n` (one code unit removed); a bare `\r` and a
  `\0` rewrite in place (no shift). The mapping's representation is yours; it is module-scope
  logic, so it is exported from its centralized home and tested directly.
- **Parse-time coverage.** Every node `parseDocument` constructs gets a span: the region the
  scanner consumed for it. A text node coalesced from adjacent runs spans the union of its
  constituents' regions. An element's span runs from its start tag's first `<` to the end of its
  extent — the close of its end tag where one exists, otherwise the end of the region that
  closed it.
- **Derivation propagation.** A rebuilt node that derives from exactly one source node carries
  that node's span: the copy-on-write rebuilds in `pruneDocument`, the `#cleanNode` and
  `#pruneRegion` and `#keepContent` element rebuilds, and the sanitize reparse of a comment or
  doctype at `HTML.ts:284-289` (the reparsed node carries the ORIGINAL node's span, not offsets
  into the rendered fragment). A node synthesized from several nodes — `mergeText` and
  `collapseText` joins — or from none has no entry. A shared reference keeps its entry by
  identity.
- **Entity travel.** `sanitize`, `distill`, and `map` return fresh entities; `span` answers on
  the derived entity for every provenanced node its tree carries. The store lives with the
  entities — no module-scope hidden state; its threading shape is yours, recorded in the report.
- **Purity preserved.** `parseDocument` keeps its exported signature and produces byte-identical
  trees for every existing input. Whether provenance comes from an optional recorder argument, a
  sibling exported parse function, or another centralized shape is yours within the design laws
  (centralize by kind, export and test reusable logic, no superfluous wrapper), recorded in the
  report.

## Required proofs

New rows are red before the implementation lands (the capability does not exist at `7d82b86`)
and green after; record the exact command and counts each way.

1. **Slice equality, parsed.** For every provenanced node of a document parsed from a string
   with CRLF line endings and at least one astral character before a probed node: the original
   input sliced at the node's span, after the same CRLF and null rewrite, equals the exact
   source text the scanner consumed for that node. Cover text, element, comment, and doctype.
2. **Normalized-offset negative control.** An input carrying `\r\n` before a probed node, where
   the original-coordinate span differs from the normalized-string offset by the count of
   collapsed pairs: assert the original coordinates and assert the normalized offset value is
   NOT the reported start. This is the row that catches an implementation reporting normalized
   offsets.
3. **Astral control.** A `𝕏`-class character (two UTF-16 code units) before a probed node: the
   span counts code units, not code points.
4. **Slice equality, sanitized and distilled.** After `sanitize()` and after `distill()`, every
   provenanced node in the derived tree — shared, rebuilt, and reparsed alike — answers `span`
   on the derived entity, and a reparsed comment keeps its original node's span. A node the
   prune synthesized from several sources answers `undefined`.
5. **Absence rows.** An entity constructed from an `HTMLDocument` value answers `undefined` for
   its nodes; a node from a different entity's tree answers `undefined`.
6. **Identity rows.** The identity `map` shares its root, and `span` still answers on the
   derived entity.
7. **Regression floor.** The whole existing core suite passes unchanged — no existing row is
   edited except where a row's own text names a fact this change makes false, and the report
   names any such row with the reason.

## Unknowns

- The normalization mapping's representation and the provenance store's threading shape: yours,
  recorded in the report with the reason.
- Whether the element-extent rule needs a special case for unclosed elements the parser
  auto-closes: settle it by running the parser on the case, record the behavior you found, and
  pin it with a row.

## Scope

- Owned: `src/core/types.ts`, `src/core/HTML.ts`, `src/core/parsers.ts`, `src/core/helpers.ts`,
  `src/core/factories.ts`, `src/core/index.ts`, `tests/src/core/*.test.ts`, `tests/setup.ts`,
  `guides/html.md`, and the report file below.
- Off-limits: `package.json`, `package-lock.json`, `node_modules/`, `.claude/`, `.agents/`,
  `configs/`, `vite.config.ts`, `tsconfig.json`, `src/core/validators.ts`,
  `src/core/shapers.ts`, `tests/guides.test.ts` — deviation-report if a fix appears to need one.
  The validators and shapers stay untouched because nodes gain no member; a change reaching them
  means the design drifted, so stop and report.
- No commits, no pushes, no installs, no `git checkout`/`restore`/`stash`/`reset`/`clean`.

## Execution

Perform the assignment directly in this CLI and spawn nothing. Work types-first: land `HTMLSpan`
and the `span` member in `types.ts`, typecheck the contract, then the parser mapping, the
propagation, the suite, and the guide.

## Output

Write the report to `/home/user/html/tmp/h1-provenance-report.md` and return its path plus a
short summary as your final message. The report carries: the store and mapping shapes with the
reason; per-proof the red command with its failing count and the green command; the unclosed-
element ruling with its executed evidence; the scoped gate readings (`npx oxfmt --config
.oxfmtrc.json --check <owned files>`, `npx oxlint --config .oxlintrc.json --deny-warnings
<owned files>`, the scoped `tsc` project, the scoped vitest run with counts); and any claim of
your own you could not fully prove. No process diary.

## Deviation contract

Stop and report — expected, found, exact evidence, done or not done, at most one hypothesis —
when the design cannot avoid touching a node shape, a validator, or a shaper; when a fix needs
an off-limits file; or when a required proof will not go red or green as named. An ancillary
choice (helper naming, row placement, guide wording) is yours to decide and record. A
whole-suite timing failure is an observation with your reading; the Orchestrator takes the
authoritative run after you exit.

## Acceptance criteria

1. Scoped format and lint checks over the owned files exit 0.
2. The scoped core typecheck exits 0.
3. The scoped core vitest run exits 0 with every required proof row present.
4. Every proof has its recorded red and green commands with counts.
5. `grep -n "span" src/core/types.ts` shows `HTMLSpan` and the `span` member;
   `git diff --stat` touches no validator, shaper, or guides-parity test.
6. `guides/html.md` lists `HTMLSpan` in Surface Types and `span` in the `HTMLInterface` Methods
   table, and the AST-model section states the original-input coordinate rule.
7. The report exists at the named path with the per-proof evidence.

## Review evidence

The Orchestrator supplies the diff and status to the round's audit lanes. Your report is the
auditors' subject: write it so each claim is checkable against the diff.
