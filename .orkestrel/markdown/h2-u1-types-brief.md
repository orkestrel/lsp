# Unit H2-U1 — the markdown provenance contract

Role and engine: `implementer`, Claude Opus 5, native subagent, sole writer in
`/home/user/markdown`. You perform this assignment directly and spawn nothing. Baseline:
the markdown tree is clean at dispatch; verify with `git status` before editing.

Before working, read in order: `/home/user/markdown/AGENTS.md`; the rules
`.claude/rules/names.md`, `.claude/rules/typescript.md`, `.claude/rules/architecture.md`,
`.claude/rules/writing.md`; no skill binds this unit; the guide `guides/markdown.md`
§ Surface and § Types; the design record —
`/home/user/scaffold/.orkestrel/campaign/h2-design-reconciliation.md` (binding) with the
lane rulings beside it for rationale.

## Objective

`src/core/types.ts` declares the provenance contract the H2 units implement, with
complete TSDoc, and the scoped type-check reports errors only where the implementation
has not caught up.

## Context — the reconciled contract, binding

```ts
interface MarkdownSpan {
	readonly start: number
	readonly end: number
}

interface MarkdownSegment {
	readonly offset: number
	readonly start: number
	readonly end: number
}

interface MarkdownSource {
	readonly text: string
	readonly segments: readonly MarkdownSegment[]
}

type MarkdownParseResult = readonly [
	document: MarkdownDocument,
	spans: ReadonlyMap<MarkdownNode, MarkdownSpan>,
]

type MarkdownDerivation<T> = readonly [
	value: T,
	derivations: ReadonlyMap<MarkdownNode, MarkdownNode | undefined>,
]

interface MarkdownInterface {
	span(node: MarkdownNode): MarkdownSpan | undefined
}
```

- `MarkdownSpan` is a half-open region of the ORIGINAL constructor string in UTF-16 code
  units. `MarkdownSegment.offset` addresses `MarkdownSource.text`; `start` and `end`
  address the original string; the run length derives from `end - start` and no length
  member exists.
- `span` joins the existing `MarkdownInterface` members; the TSDoc states the accessor
  returns a fresh value, that an adopted document reports `undefined` for every node, and
  that a join or a node with no single source has none.
- `MarkdownDerivation` documents that a mapped `undefined` marks an output identity
  returned for separate sources and an absent entry means the output kept its own
  identity.
- Place each declaration where the file's existing kind ordering puts it, matching the
  sibling html package's provenance vocabulary; nodes gain no field.
- Do not change `MarkdownRewriteHandler` or any function signature in this unit — the
  implementation units own `splitLines`, `parseProvenance`, and `rewriteDocument`; type
  errors those signatures raise later are theirs, not yours.

## Scope

Owned files: `src/core/types.ts`.

Off-limits: everything else, `src/core/index.ts` included (the existing star export
carries the new types).

Allowed tools: read, edit, and scoped shell commands in `/home/user/markdown`. No commit,
no push, no `git checkout`/`restore`/`stash`/`reset`/`clean`.

## Execution

You are a native subagent: do the work yourself, directly, and spawn nothing.

## Output

Your final message is the unit report: each declaration as landed with its TSDoc, the
scoped readings — `npx tsc --noEmit -p configs/src/tsconfig.core.json` (or the
repository's core check) with any remaining diagnostics listed and each attributed to the
unit that owns it, scoped `oxfmt --check` and `oxlint --deny-warnings` over
`src/core/types.ts`, `git diff --check` — and observations outside scope. No process
diary.

## Deviation contract

A conflict with the primary objective stops the unit: report expected, found, exact
evidence, done or not done, and at most one short hypothesis. The named stop condition: a
declared member cannot land without editing another file. Ancillary conflicts — TSDoc
phrasing, placement among the existing declarations — are yours to decide, record, and
carry on from.

## Acceptance criteria

1. `git diff --check` exits 0 and the diff touches only `src/core/types.ts`.
2. Scoped `oxfmt --check` and `oxlint --deny-warnings` over the file exit 0.
3. The contract above appears exactly, every property `readonly`, no banned construct.
4. The core type-check's remaining diagnostics, if any, each name a signature an
   implementation unit owns, and `MarkdownInterface` implementations failing on the
   missing `span` method are the expected red the U5 unit closes — record them.

## Review evidence

The Orchestrator captures the diff and status after you exit; the round's `analyst` lane
audits this contract with the H2 units.
