# Verdict — H1 source provenance (html `3348c1b`), subjective lane

Lane held: **subjective** — design acceptance, API and vocabulary, architecture fit, simplification, guide voice. I executed nothing; every ruling below rests on the supplied diff, the tree at `/home/user/html`, the retained pair, and hand-derivation of the two pure functions. Per `.claude/rules/quality.md` § Rounds and verdicts, treat the behavioural half of this verdict as a review of the source.

## 1. `HTML.span(node)` meets its documented contract exactly — UNRESOLVED

The mechanism is present for every category the claim names, and I could not break it by reading: `/home/user/html/src/core/parsers.ts:154` (element extent), `:181` (raw text), `:203` (void element), `:258` and `:276` (coalesced text union), `:283` (document); `/home/user/html/src/core/HTML.ts:310-326` (`#derive` chain resolution); `/home/user/html/src/core/helpers.ts:1486-1495` (the `!child` guard that stops an unwrapped child inheriting its parent's region). The reparsed comment at `HTML.ts:344` reaches `pruneDocument`'s single-replacement branch and resolves to the original comment, as the contract requires.

What I cannot settle is the seam the claim itself names: **a chain composing `sanitize` then `distill` then `map`**. No committed row drives a derivation on top of a derivation on top of a derivation, and I cannot run one. The recorded rows in `tests/src/core/HTML.test.ts:862-901` derive from `page` once, never twice.

Settling scenario for the Orchestrator: `const page = new HTML('<!DOCTYPE html><main><p class="x">A <b>b</b> C</p><!--n--></main>')`, then `const chained = page.sanitize({ comments: true }).distill().map((node) => node)`, then assert that for every node `chained.span(node)` is either `undefined` or a region whose `source.slice(start, end)` equals the text that node came from, and that at least the re-rooted `main` and the `p` still answer. The row belongs beside the propagation row in `tests/src/core/HTML.test.ts`.

## 2. The boundary map is correct at its seams — BROKEN

The named seams I could derive by hand all hold. `'A\r\n𝕏\r\0B'` yields `offsets = [0,1,3,4,5,6,7,8]` and source `'A\n𝕏\n\uFFFDB'`, matching `tests/src/core/parsers.test.ts:24-27`. Consecutive CRLF pairs (`'A\r\n\r\nB'` → `[0,1,3,5,6]`), a carriage return at end of input (`'A\r'` → `[0,1,2]`), a null substitution abutting a boundary, and astral advance through both code units are each correct at `src/core/parsers.ts:293-312`.

The seam the claim names last is where it breaks. **A boundary no offset entry covers is answered with a fabricated region, not reported.**

```ts
export function parseHTMLSpan(offsets: readonly number[], start: number, end: number): HTMLSpan {
	const originalStart = offsets[start] ?? 0
	return { start: originalStart, end: offsets[end] ?? originalStart }
}
```

`/home/user/html/src/core/parsers.ts:322-325`. An uncovered `end` collapses the region to zero width at `originalStart`; an uncovered `start` relocates the region to offset `0`. Both are in-band invented values for "no answer" — the sentinel `AGENTS.md` § Design laws forbids under **Absence is `undefined`**, and the opposite of the kind contract `parsers.ts` carries in `.claude/rules/patterns.md` § Validation and contracts, which is a coercer returning `T | undefined`.

Why it matters here rather than in the abstract: `parseHTMLSpan` is barrelled through `src/core/index.ts:4`, documented at `guides/html.md:89`, and taught with a worked fence at `guides/html.md:132-134`, so a consumer who scans the normalized string themselves and passes an end one past the source length receives a plausible-looking span rather than a refusal, and nothing downstream can tell it from a real one.

What right looks like: declare `parseHTMLSpan(offsets, start, end): HTMLSpan | undefined`, return `undefined` when either `offsets[start]` or `offsets[end]` is absent, and have each call site in `parseDocument` record nothing rather than record a fabricated span. Every internal call site passes boundaries in range, so no shipped behaviour moves; the change is that the uncovered case becomes visible. Bounded: the covered arithmetic is correct and stays exactly as written.

I refer the correctness half — whether any internal call site can reach an uncovered boundary — to the objective lane; my ruling is on the contract shape.

## 3. The unclosed-element ruling holds — CONFIRMED

I attacked nested unclosed elements, a raw-text element unclosed at end of input, and the recovered-close path, and could not break any of them.

`src/core/parsers.ts:152-155` selects the closer boundary: `const end = tag.closing && removed.name === tag.name ? tag.next : tokenStart`. For `<div><p>x</div>` the mismatched pop gives `p` the closer's opening `<` and the matching pop gives `div` the offset past `>`. `src/core/parsers.ts:234-239` drains the stack at end of input to `source.length`. A raw-text element never enters the stack (`src/core/parsers.ts:163-192` returns through `continue`), so its extent comes from `raw.next` at `:183` and the drain cannot touch it. The recovered close is measured by the scanner itself, which is what `tests/src/core/helpers.test.ts` pins with `'a</script <fake>>tail'` → `{ start: 0, end: 1 }`; I re-derived that value from the shipped `scanRawText` and it matches.

The unit's executed values (`h1-provenance-report.md:123`: `div [0, 9)`, `p [5, 9)`, `p [0, 4)`, `div [4, 16)`) agree with my independent derivation from the shipped source, which is two mechanisms rather than one.

## 4. Provenance state is entity-owned and inert — BROKEN

Most of the claim holds and I could not break it. No module-scope provenance state exists: every map is a `#` field (`src/core/HTML.ts:70`) or an operation-local value (`HTML.ts:141`, `:233`, `:280`, `:290`, `:295`). An adopted document starts empty (`HTML.ts:72-75`). `span` returns a fresh value rather than the stored one (`HTML.ts:88-91`), so the map never escapes. Two entities parsing the same string get disjoint maps keyed by their own node objects, and a derivation reads exactly its own ancestor (`HTML.ts:291` and `:296` call `#derive` on `clean` and `rooted`, not on `this`).

The clause that fails is the last one: **the recorders mutate caller-owned inputs, and that is their entire mechanism.**

`parseDocument(html, spans)` writes into a `Map` the caller constructed and still holds (`src/core/parsers.ts:283`), and so do `scanRawText`, `rewriteDocument`, `collapseText`, `extractRegion`, and `pruneDocument` (`guides/html.md:104`, `:117`, `:119`, `:120`, `:121`). `.claude/rules/typescript.md` § Immutability states it without qualification — "Never mutate caller-owned inputs", "Return copies or readonly views; never leak a mutable internal reference" — and `AGENTS.md` requires public return collections to be readonly. This design inverts that idiom on six published functions at once: instead of returning provenance, the API accepts a mutable caller-owned collection and writes into it, which is the one shape the package's own laws single out.

What right looks like, in order of how much it moves: the smallest correct fix is to keep the recorder only where a caller has a real reason to hold it — `parseDocument` — and to return provenance everywhere else, because every other site already returns a record the value fits in (see finding under claim 6 for `scanRawText`). Where the recorder stays, state the mutation on the parameter's TSDoc as the deliberate exception, so the next reader meets the departure where it lives rather than inferring it from the type. Bounded: no node, no tree, and no input string is mutated anywhere in this diff — `scanRawText` builds its node before recording (`h1-diff.txt:344-348`), and the shipped trees are byte-identical to the baseline's. The defect is the shape of the seam, not a corrupted tree.

## 5. Each recorded control binds the row it names — BROKEN

One control produced every red for four of the recorded rows. `h1-provenance-report.md:63-97` names the same control — "the `HTML.span` implementation was renamed so the public method was absent" — for the propagation row, the absence row, the identity row, and the regression floor, and `h1-provenance-report.md:109` confirms the shape: one control, "6 failed and 284 passed". A control that deletes the method under test reddens every row that calls it simultaneously, so it discriminates among none of them.

The consequence is specific, not procedural. The absence row (`tests/src/core/HTML.test.ts:843-860`) asserts that adopted, foreign, and joined nodes answer `undefined`. An implementation that recorded **no** spans at all — an empty `#spans` on every entity — passes that row unchanged, and the recorded control still goes red. So the row's red does not bind to the defect the row claims. The same holds for the propagation row: removing `span` proves the method exists, not that `#derive` walks the chain.

Two rows do carry binding controls and I do not fault them: the parsed-slice row and the original-coordinate row both used "`parseHTMLSpan` returned normalized boundaries directly" (`h1-provenance-report.md:23`, `:37`), which is a mutation of the load-bearing line and reddens exactly what it names.

What right looks like — two mutation controls, each reddening one row while the other stays green:

- For the absence row: make `#derive` record the first source of a multi-source join (record `merged` against `text[0]` at `src/core/parsers.ts:249-259`). The absence row must go red on the joined-text assertion; the propagation row must stay green.
- For the propagation row: delete the chain step `source = derivations.get(source)` at `src/core/HTML.ts:322`. The propagation row must go red on the rebuilt and reparsed slices; the parsed-slice row must stay green.

The unit flagged the missing chronology itself (`h1-provenance-report.md:177`), which is honest; this finding is the narrower one it did not flag — that the substitute controls it offered in place of the chronology do not bind row by row.

## 6. The diff stays inside the law and the owned scope — BROKEN

Held, and I could not break: no banned construct appears in the diff (no `any`, no `as`, no non-null assertion, no suppression comment); `span` is a one-word method whose noun-accessor shape matches the sanctioned `entity(key)` lookup form in `.claude/rules/patterns.md` § Accessors and sits first in both the interface (`src/core/types.ts:314-321`) and the guide's Methods table (`guides/html.md:158`); no hidden module helper is introduced, and every new declaration is exported and reachable through `src/core/index.ts:4`; `src/core/validators.ts`, `src/core/shapers.ts`, and `tests/guides.test.ts` are untouched by the diff; and the status at `/home/user/scaffold/tmp/units/h1-status.txt` is empty. The added AST-model paragraph (`guides/html.md:183`) reads in the guide's voice and claims only what the code earns — I hand-verified both new fence values, `page.span(page.document) // { start: 0, end: 40 }` (`guides/html.md:115`, the source string is 40 code units) and `parseHTMLSpan(offsets, 2, 4) // { start: 3, end: 5 }` (`guides/html.md:132-134`).

Two clauses fail.

### 6a. `parseHTMLSource` and `parseHTMLSpan` are misplaced, and their names were chosen to fit the misplacement

Both are pure, total, class-free leaves that `parseDocument` composes: `src/core/parsers.ts:293-312` and `:322-325`, called at `:154`, `:181`, `:183`, `:203`, `:237`, and `:283`. That is the membership rule for `helpers.ts`, stated in the package's own guide at `guides/html.md:93` — "Pure, total leaves from `helpers.ts` — the lexical scanners `parseDocument` composes" — and in `.claude/rules/architecture.md` § Kind purity, which gives this exact case as its worked example: "A `scan*` in `parsers.ts` is a pure lexical leaf that belongs in `helpers.ts`. The barrel star-exports both, so the move leaves the published surface identical."

The names are the tell. `.claude/rules/architecture.md` § Kind purity says "Never let the name choose" and "Placement follows what the function is; the name form follows placement." Here the function's own TSDoc names what it is — "**Project** a normalized half-open region through an original-input boundary map" (`src/core/parsers.ts:315`) — while the identifier says `parse`. A reader meets `parseHTMLSpan` and expects a coercer of HTML text into a span; it is array arithmetic over an offset table and returns no `undefined`. Neither function is a coercer, and `parsers.ts` holds coercers returning `T | undefined` per `.claude/rules/patterns.md`.

The guide records the damage in one paragraph. `guides/html.md:83` still reads "The document coercer, from `parsers.ts`. `parseDocument` is the spine … Every lexical piece it composes is a pure leaf in `helpers.ts`" — and the table directly beneath it now lists two of the lexical pieces `parseDocument` composes. The section's own sentence contradicts its own rows.

What right looks like: move both into `src/core/helpers.ts` and rename to the `{verb}{Noun}` helper form its TSDoc already uses — `normalizeSource(html)` and `projectSpan(offsets, start, end)`. Their rows move from the Parsers table to the Helpers table, the Parsers intro at `guides/html.md:83` becomes true again without an edit, `parsers.ts` imports them the way it already imports `scanComment` and `scanDoctype`, and no cycle appears because the leaf pair imports no class. The barrel star-exports both files, so the published surface is the same set of names with two corrected spellings. Take the rename with the move rather than separately, per the same rule's repair table.

### 6b. The `scanRawText` recorder is a leaked implementation detail, not a designed seam

`parseDocument` allocates a whole `Map` to carry one value out of one call and then deletes the entry:

```ts
const raw = scanRawText(source, index, tag.name, LITERAL_ELEMENTS.includes(tag.name), rawSpans)
const rawSpan = rawSpans?.get(raw.node)
// ...
rawSpans?.delete(raw.node)
```

`/home/user/html/src/core/parsers.ts:163-192`, with the map allocated per parse at the top of `parseDocument`. `scanRawText` already returns a record — `{ node, next, closed }` — so the region has an obvious home in the value the function returns. Using a keyed collection as a single-slot mailbox is the awkward conceptual machinery the **No superfluous wrappers** and **Simplification** laws exist to catch, and it is the one recorder in this diff with no consumer story: a caller of `scanRawText` who wants the region wants it beside `next`, not in a `Map` they must construct, index by an object they just received, and clear.

It also puts a second coordinate space into one type. `HTMLSpan` documents itself at `src/core/types.ts:153-165` as addressing "the string before parser normalization"; `scanRawText` records offsets into whatever string it was handed, which inside `parseDocument` is the **normalized** source (`src/core/parsers.ts:164`, then projected at `:181`). One type now carries both original-coordinate and normalized-coordinate values, and only the caller knows which. The guide compounds it at `guides/html.md:104` by describing the parameter as recording "the exact source region", where "source" reads as the original input the type promises.

What right looks like: drop the fifth parameter from `scanRawText`, add `readonly span: HTMLSpan` to the record it already returns, and have `parseDocument` project `raw.span` the way it projects everything else. The `Map`, the `get`, and the `delete` at `src/core/parsers.ts:163-192` all disappear; `guides/html.md:104` returns to a four-parameter signature; and `HTMLSpan` stops carrying two coordinate spaces at the one public site that mixed them. Bounded: the recorder on `parseDocument` is a genuine seam and stays — a caller who wants provenance without building an `HTML` handle has no other door, and its values are in original coordinates as the type declares. The rulings on `rewriteDocument`, `collapseText`, `extractRegion`, and `pruneDocument` are the shape question raised under claim 4, not this one; do not fold them into this fix.

Non-blocking note, recorded rather than filed as a finding: `map`, `sanitize`, and `distill` narrowed their class return type from `HTMLInterface` to `HTML` (`src/core/HTML.ts:140`, `:227`, `:275`) only so `#derive` is reachable across instances at `:291` and `:296`. Nothing breaks — the interface at `src/core/types.ts` is unchanged and the guide documents the interface — but an implementation constraint is visible in a published signature, and resolving the spans through a leaf that returns a fresh map would let those return types stay at `HTMLInterface`. Separately, the import list at `tests/src/core/HTML.test.ts:24-25` places `parseHTMLSource` before `parseDocument`; the file already carried one out-of-order pair at `:20-21`, so I am not filing this as drift.

## Findings outside the claims

### F1. The change falsifies an existing guide sentence about `map`

`guides/html.md:117` and the class TSDoc at `src/core/HTML.ts:133-135` both state that "a subtree nothing changed keeps its reference, so **an identity rewrite allocates nothing**." That sentence is no longer true of the operation. `map` now allocates a derivations `Map` (`src/core/HTML.ts:141`), a fresh `HTML` with a fresh spans `Map` (`:311`), and one `WeakSet` per node in the tree (`:314`, inside the walk at `:312`). The recorded row at `tests/src/core/HTML.test.ts:903-908` proves the root is still shared, which keeps the subtree half true, and nothing pins the allocation half — so the prose survived because nothing tries to break it, exactly as `.claude/rules/documentation.md` warns under "Re-read the prose last, against what actually shipped."

No claim covers this: the claim set scopes claim 6 to "the guide's **added** examples", and this is an untouched sentence the change made false.

What right looks like, taking both halves: restate the sentence in both places to the property that survives — "a subtree nothing changed keeps its reference, so an identity rewrite copies no node" — and hoist the visited set out of the per-node loop in `#derive` so a derivation allocates one guard rather than one per node. The chain guard is worth keeping; a hostile `HTMLRewriteHandler` can return a node already present in `derivations`, so the loop needs a terminator. Bounded: `stream`, `fold`, and `walk` allocate exactly as before, and the copy-on-write sharing itself is unchanged and correct.

### Struck, on the record

The two new value-claiming fences at `guides/html.md:115` and `:132-134` sit under no executed assertion, because this package's `tests/guides.test.ts` performs name and example-presence parity only and carries no fence transcription. I struck this as a finding: the file is off-limits to the unit (`h1-provenance-brief.md:125`), the gap predates the change, and demanding it here asks for new capability rather than naming a defect. Both values are correct by hand-derivation. Carry it to the package's own successor scope, not to an H1 fix round.

## Claims attacked and not broken

- Claim 3 in full — nested unclosed elements, a raw-text element unclosed at end of input, and the recovered-close path through `scanRawText` all hold, by independent derivation from the shipped source that agrees with the unit's executed values.
- The covered arithmetic of claim 2 — consecutive CRLF pairs, a carriage return at end of input, a null substitution abutting a measured boundary, and astral advance through two UTF-16 code units.
- The entity-ownership half of claim 4 — no module-scope state, an empty map on adoption, no node or tree altered by any recorder, and no escape of `#spans` through `span`.
- The scope and law half of claim 6 — banned constructs, the one-word `span` method and its accessor shape, barrel exposure, the untouched validators, shapers, and guides-parity test, the empty status, and the voice and accuracy of the added guide prose.

VERDICT: FAIL — 4 broken, 1 unresolved, 0 not-evidenced, 1 finding outside the claims
