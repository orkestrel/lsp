# Unit H2-U5 report — the Markdown handle carries provenance (2026-08-26)

Done, no deviation. `npm run check:src:core` exits 0 with every granted diagnostic closed and none
added, and `npm run test:src:core -- tests/src/core/Markdown.test.ts` exits 0 at 55 passed.

## 1. What changed

`src/core/Markdown.ts` — the handle stores, reads, and derives provenance.

- The class gains `readonly #spans: Map<MarkdownNode, MarkdownSpan>`. String construction runs
  `parseProvenance` once and stores the document plus `new Map(spans)`, a copy of the parse's map.
  Adopted `MarkdownDocument` input keeps the existing adopt-by-reference behaviour and starts with
  an empty map. The import moved from `parseDocument` to `parseProvenance`, so the string path
  parses once.
- `span(node)` returns `{ start, end }` built fresh on every call, and `undefined` for a node the
  map does not carry — a foreign node, an adopted document's nodes, and a synthetic node included.
- `map` destructures the `rewriteDocument` tuple and returns `#derive`'s handle. It still returns a
  new `Markdown` instance always; an identity rewrite reuses the document tree inside it.
- `#derive(document, derivations)` creates the new handle and resolves each output node.
- TSDoc: the class remarks state the provenance contract (string construction exposes original-input
  regions, adoption exposes none, values are fresh, no-single-source nodes report `undefined`, and
  what `map` carries), and `map`'s own TSDoc states the carry and the identity-rewrite reuse.

`tests/src/core/Markdown.test.ts` — the `Markdown — span` and `Markdown — map provenance` describes
are added and the pinned identity row is re-ruled. Details in sections 2 and 3.

`src/core/factories.ts` — unchanged. Its `TS2741` diagnostic closed when the class gained `span`,
and no sentence in the `createMarkdown` TSDoc is made false by the provenance contract: it describes
what the string path builds and what the returned interface is, and it never claims the surface is
closed. Per the brief's "touch the factory TSDoc only where the provenance contract makes a sentence
false", the file is owned and untouched.

**The `#derive` ordering, in one sentence.** For each output node the walk reads that candidate's
own span before following its derivation entry, hopping only when the candidate carries no span, and
a visited set stops the walk on a cycle.

## 2. Red-first records

Command for every row cluster: `npm run test:src:core -- tests/src/core/Markdown.test.ts`.

- **Before the implementation:** exit 1, `Tests 11 failed | 44 passed (55)`. The failing rows:
  - `Markdown — span > reports the region of the original input each parsed node came from`
  - `Markdown — span > returns a fresh value per call, so a mutated return never reaches the next`
  - `Markdown — span > reports undefined for a foreign node and for every node of an adopted document`
  - `Markdown — span > keeps two handles over the same text on independent maps`
  - `Markdown — map > an identity rewrite returns a NEW Markdown instance reusing the document tree`
  - `Markdown — map > never mutates the original instance (copy-on-write)`
  - `Markdown — map > chains — md.map(a).map(b) applies both rewrites`
  - `Markdown — map provenance > carries every region through an identity rewrite`
  - `Markdown — map provenance > gives a one-source replacement its source region and a rebuilt ancestor its original one`
  - `Markdown — map provenance > leaves an output node assembled from separate sources without a region`
  - `Markdown — map provenance > resolves a moved original to its own region and its replacement to the region it vacated`
- **After the implementation:** exit 0, `Tests 55 passed (55)`.

The three `Markdown — map` rows that were already in the file reddened from the standing H2-U4 state,
where `map` passed the whole `MarkdownDerivation` tuple to the constructor and adopted it as a
document; they are listed because the same command reports them, and the fix closes them.

Each brief row maps to a test named for what it proves:

| Brief row | Test |
|---|---|
| `span` on parsed nodes returns the original-input region | `reports the region of the original input each parsed node came from` |
| `span` returns a fresh value per call | `returns a fresh value per call, so a mutated return never reaches the next` |
| a foreign node and an adopted document return `undefined` | `reports undefined for a foreign node and for every node of an adopted document` |
| separate handles hold independent maps | `keeps two handles over the same text on independent maps` |
| a one-source replacement and a rebuilt ancestor | `gives a one-source replacement its source region and a rebuilt ancestor its original one` |
| an output from separate sources resolves to `undefined` | `leaves an output node assembled from separate sources without a region` |
| the chain-termination case | `resolves a moved original to its own region and its replacement to the region it vacated` |
| the re-ruled identity-rewrite row | `an identity rewrite returns a NEW Markdown instance reusing the document tree` plus `carries every region through an identity rewrite` |

## 3. Re-ruled rows and the ordering decision

**The pinned identity row (`tests/src/core/Markdown.test.ts:113-118` at dispatch).** Re-ruled from
`expect(rewritten.document).toEqual(markdown.document)` to `expect(rewritten.document).toBe(...)`,
with the title changed from "with a deep-equal document" to "reusing the document tree". Reason: the
H2-U4 engine is copy-on-write, so an identity rewrite returns the same document object, and
`toEqual` passes for both the reuse the design ruled and the unconditional copying it replaced. The
row keeps `expect(rewritten).not.toBe(markdown)`, so the new-handle-always contract still binds. The
provenance half of the identity case sits in its own row, `carries every region through an identity
rewrite`, which compares the whole walk's spans between the two handles.

**The `#derive` starting hop, decided and recorded.** The brief's contract fixes the ordering as
"read the resolved candidate's span BEFORE following its own derivation entry". I implemented that
uniformly: the walk starts at `source = node` and reads `#spans.get(node)` before consulting
`derivations`. The html precedent differs in one detail — `/home/user/html/src/core/HTML.ts:316`
consults the entry once for the node being resolved, and reads span-first only from the second hop
onward. Both orderings satisfy the html comment's stated property, because both read a later hop's
span before following that hop's entry. They differ on one observable case, and the brief's own row
names the answer: a handler-returned original node placed in another slot must report its own
region, not the slot's. The uniform ordering returns its own region; the html starting hop returns
the slot's. The analyst ruling's "a returned identity already present in the source handle resolves
directly" says the same thing, so the uniform ordering is what the ruled design asks for. I measured
the difference before choosing rather than deriving it — see section 5.

**The separate-sources law, as implemented.** `undefined` is reached through the derivation entry,
so it governs a SYNTHESIZED output node, which is what the test uses: one new text node returned for
two different source text nodes resolves to no region. An ORIGINAL node reused in two slots would
instead resolve to its own region, because its own span is read first. That is the identity case the
analyst ruling separates from synthesis ("retain provenance for the reused original child, as an
identity rather than a synthesis"), and it is the same rule as the chain-termination row.

## 4. Scoped gate readings

Every command was run from `/home/user/markdown` on 2026-08-26.

| Command | Exit |
|---|---|
| `npx oxfmt --config .oxfmtrc.json --check src/core/Markdown.ts src/core/factories.ts tests/src/core/Markdown.test.ts` | 0 — "All matched files use the correct format", 3 files |
| `npx oxlint --config .oxlintrc.json --deny-warnings src/core/Markdown.ts src/core/factories.ts tests/src/core/Markdown.test.ts` | 0 — no diagnostics |
| `npm run check:src:core` | 0 |
| `npm run test:src:core -- tests/src/core/Markdown.test.ts` | 0 — `Tests 55 passed (55)` |

The lint reading is a silent pass, so it carries a negative control drawn from outside the owned
population: `tmp/probe/lintcontrol.ts` containing `export const x: any = 1` reported
`typescript(no-explicit-any)` and exit 1 under the same command and config. The control file was
removed after the reading; `tmp/` is git-ignored and the tree shows no trace of it.

`npm run check:src:core` before the implementation exited 2 with exactly the four granted
diagnostics named in the brief, and after it exits 0. No diagnostic outside the granted list appeared
at any point.

## 5. Observation: the whole `src:core` project, and the instrument behind the ordering

`npm run test:src:core` (unfiltered) exits 0: `Test Files 6 passed (6)`, `Tests 590 passed (590)`,
duration 4.64 s. The authoritative run is the Orchestrator's.

The ordering decision in section 3 rests on a runtime probe, not on reading: `tmp/probe/spans.test.ts`
printed the real span map for `'# Title\n\npara'` (document 0..13, heading 0..7, text `Title` 2..7,
paragraph 9..13, text `para` 9..13), the real derivation map a swap rewrite records — the moved
original `Title` carries its own span 2..7 AND an entry pointing at the vacated slot's source at
9..13, and the replacement node carries an entry pointing at the moved original — and that an
identity rewrite returns the same document object. Those readings are what the chain-termination row
and the re-ruled identity row assert. The probe was a printer rather than a claim-settler, so it is
deleted; its readings are promoted into the two tests named earlier, which fail if any of them
changes.

## 6. Tree state

`git status --short`:

```text
 M guides/markdown.md
 M src/core/Markdown.ts
 M src/core/helpers.ts
 M src/core/parsers.ts
 M src/core/types.ts
 M tests/src/core/Markdown.test.ts
 M tests/src/core/helpers.test.ts
 M tests/src/core/parsers.test.ts
```

Beyond the standing held H2-U1 through H2-U4 entries, this unit adds `src/core/Markdown.ts` and
`tests/src/core/Markdown.test.ts` and nothing else.

`git diff --stat` over the whole tree:

```text
 guides/markdown.md              |  78 ++--
 src/core/Markdown.ts            |  98 +++++-
 src/core/helpers.ts             | 764 ++++++++++++++++++++++++++++++++--------
 src/core/parsers.ts             | 167 +++++++--
 src/core/types.ts               | 116 +++++-
 tests/src/core/Markdown.test.ts | 106 +++++-
 tests/src/core/helpers.test.ts  | 452 ++++++++++++++++++++++--
 tests/src/core/parsers.test.ts  | 217 +++++++++++-
 8 files changed, 1728 insertions(+), 270 deletions(-)
```

`git diff --stat` over the owned files alone:

```text
 src/core/Markdown.ts            |  98 +++++++++++++++++++++++++++++++++----
 tests/src/core/Markdown.test.ts | 106 +++++++++++++++++++++++++++++++++++++++-
 2 files changed, 193 insertions(+), 11 deletions(-)
```

## 7. Observations outside scope

Each names the unit that owns it. None was acted on.

- **H2-U6 owns the guide.** `guides/markdown.md` needs the `span` method row on the
  `MarkdownInterface` table, the provenance passage, and the tuple example at `:622`. Tree-wide
  `npm run check` stays red on the guides project until that lands, per the brief's standing state.
- **H2-U6 owns the vocabulary drift in the shipped types TSDoc.** `src/core/types.ts` calls the
  handle a "workspace" where it means the handle: `MarkdownInterface.span`'s remarks read
  "Provenance is per workspace and per node identity" and "A workspace constructed from an adopted
  {@link MarkdownDocument}" (`:466-479`), `MarkdownSpan`'s remarks read "the string the workspace was
  constructed from" (`:44`), and `MarkdownDerivation`'s remarks read "the source workspace's own
  spans" (`:409`). `workspace` names the repository elsewhere in this fleet, so a reader meets two
  senses of one word in the published declarations. The file is report-only for this unit and the
  wording is prose the documentation unit carries. The exact patch, if H2-U6 takes it, is
  `workspace` → `handle` at those four sites and nowhere else in the file.
- **H2-U4 owns the reused-identity collision, if the campaign wants html parity.** The markdown
  rewrite engine records `derivations.set(accepted, undefined)` only when the same object is accepted
  for two different sources within one pass; the html engine additionally keys an `outputs` map so a
  node emitted at its own position and again in another slot collapses to `undefined`
  (`/home/user/html/src/core/helpers.ts:1374-1377`). Under the markdown engine that node keeps its
  own region, which is what this unit's ordering reports and what the analyst's identity rule asks
  for, so nothing here is broken. Recorded only because the two engines differ on the case.
