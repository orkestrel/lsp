# H2 design brief — porting source provenance to `@orkestrel/markdown`

One brief, two blind lanes. You hold exactly one lane — the lane your dispatch names — and
you never run, simulate, or reconcile the other. The Orchestrator reconciles.

Subject repository: `/home/user/markdown`. Read there, read-only. The evidence slice is the
Grok terrain distillate at
`/home/user/scaffold/.orkestrel/campaign/h2-terrain-distillate.md` — its `file:line`
pointers are unverified; spot-check each pointer you rely on before it enters your ruling.
The ported precedent lives in `/home/user/html` (readable): `parseProvenance`
(`src/core/parsers.ts:34-46`), the `HTML` handle's `span` accessor and `#derive`
(`src/core/HTML.ts:95-98`, `:305-327`), the normalization and projection helpers
(`src/core/helpers.ts:37-76`), and the guide's provenance passage (`guides/html.md:188`
area). Read `/home/user/markdown/AGENTS.md` and the applicable `.claude/rules/*.md` files —
`names.md`, `typescript.md`, `architecture.md`, `patterns.md`, `tests.md`,
`documentation.md` — plus `guides/markdown.md`, before ruling.

## Objective

A design for markdown source provenance in the html package's mold: spans of the original
constructor string beside the tree, never on the nodes, surviving the transforms that can
carry them and honestly absent where no single source exists.

## The axes to rule

1. **The span coordinate system and the parse thread.** The markdown parse is two walks —
   block detection over split lines, then `parseInline` over trimmed and rejoined
   fragments — and `splitLines` discards offsets. Rule how original-string offsets thread
   the line split, the block-marker stripping, and the paragraph rebuild, and what the
   normalization pass (line endings, `U+0000`) does to coordinates. Name the entry point's
   shape (`parseProvenance` analogue or another door) and what it returns.
2. **The carrier.** Nodes gain no field (the html law). Rule where provenance lives —
   the `Markdown` handle, a side map, the factory — and the accessor's name and shape
   against the single-word law.
3. **Derivation under rebuilding parents.** `rewriteDocument` always allocates new parents
   and reuses subtrees by reference only at the depth cap and on identity `rewrite`
   returns. Rule what a one-source rebuild means here: which transforms carry provenance
   forward, through what mechanism, and whether `rewriteDocument` itself changes (an
   identity-preserving reuse like html's is a behavior change with its own blast radius —
   rule on it explicitly, either way on evidence).
4. **The no-single-source surfaces.** `coalesceText`, `normalizeInlines`, `trimInlines`,
   `mergeProjections`, the slot-mismatch child reuse, and adopted documents. The html law:
   a join or a node with no single source has no provenance. Rule which surfaces drop
   provenance, which could lawfully keep it, and what the guide must promise.
5. **The cross-package boundary.** `htmlToMarkdown` consumes installed
   `@orkestrel/html@0.0.6` nodes, which carry no spans. Rule whether inbound projection
   participates in this change or is excluded on evidence with a recorded register entry
   for the day the html release carries spans.
6. **Unit decomposition.** Bounded units with owned files, red-first obligations, and
   independently checkable acceptance criteria, routed by work class.

## Constraints that bind every ruling

- `*/types.ts` is authoritative and types come first; readonly properties; no `any`, no
  assertions, no sentinels — absence is `undefined`.
- Single-word entity APIs; module helpers `{verb}{Noun}`; one concept, one term — the html
  package's provenance vocabulary is the precedent to match or to deliberately depart from,
  with the departure named.
- Minimal public API: the capability lands with its first real consumer — name the consumer
  each exposed symbol serves.
- No second parser; the existing walks gain coordinates, they are not duplicated.
- Tests are real implementations — no mocks, no fake clocks; parity: every public export
  documented, every guide claim executable or pinned.

## Output

One ruling — your lane's — in this shape: per-axis positions with `file:line` evidence
where the code constrains the choice, the risks you see, at most one recommended shape per
axis, and the unit decomposition with acceptance criteria. Name any fact you could not
verify. No process diary.
