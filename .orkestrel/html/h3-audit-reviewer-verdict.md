## 1. The invariant holds as ruled — UNRESOLVED

What I could settle held. The deep scan reaches an entry-keyed ancestor across intervening elements (`src/core/parsers.ts:150-163` collects the deepest open occurrence per `IMPLIED_CLOSERS` key rather than reading only the stack top), the overflow seam projects an overflow position into a comparable depth (`src/core/parsers.ts:165-166`, `:171-173`) and pops the whole overflow when the target sits in the represented stack (`src/core/parsers.ts:199-200`), and the chain continuation walks from the deepest candidate outward and keeps the shallowest unblocked one (`src/core/parsers.ts:169-194`), which is what closes an open cell and its row on one `tr`.

What I cannot settle is the stop condition, and it is the part the claim names. The `break` at `src/core/parsers.ts:192` abandons the whole candidate list when the **deepest** candidate is blocked, including shallower candidates whose own `IMPLIED_BARRIERS` row does not contain that barrier. Reading the source, `<table><tr><td><p><button>x<td>y` reaches the incoming `td` with `td` open at stack index 3, `p` at 4, and `button` at 5. The `p` candidate is blocked (`button` sits in `IMPLIED_BARRIERS.p`, `src/core/constants.ts:138`), the loop breaks, and the `td` candidate — whose row is `['html', 'table', 'template']` (`src/core/constants.ts:333`) and which no open barrier of its own protects — is never reached, so nothing closes and the second `td` nests inside the `button`.

I carry no execution tool, so that is a source trace and not a run, and I will not report it as a falsification. Two rival readings both fit the shipped code, and the design has not chosen between them on the record:

- **Per-entry barriers.** Each key's search is stopped only by its own row. `td` closes. This is the reading `src/core/constants.ts:122` ("Bounds each implied-close search"), `guides/html.md:50` ("for each implied-close entry, the open containers that stop its ancestor search"), and `guides/html.md:192` ("stops when `IMPLIED_BARRIERS` names a scope container for the candidate") all describe.
- **Transitive barriers.** A container protecting any candidate protects every entry outside it, because closing the outer entry tears through that container. Nothing closes. This is what the code does, and it is a defensible reading of the ruling's constraint sentence, but no document in the tree states it.

What settles it: run the input and read the output, rather than asserting an expected shape, because the expected shape is what is contested. Put a probe at `tmp/probe/impliedChain.test.ts` importing `parseDocument` and `renderHTML` from `@src/core`, log `renderHTML(parseDocument('<table><tr><td><p><button>x<td>y'))`, and run `npx vitest run --config vite.config.ts --no-cache --project probe tmp/probe/impliedChain.test.ts` in `/home/user/html`. Pair it with the control `<table><tr><td><p>x<td>y` (same shape, no `button`), which must close the cell under either reading; a control that also fails to close means my trace is wrong and the finding drops. Then rule which reading the design owes and align `src/core/constants.ts:122`, `guides/html.md:50`, and `guides/html.md:192` with it, because all three read per-entry and the code is transitive.

## 2. The barrier sets are sound derivations — UNRESOLVED

The anchor is not in the tree and I cannot fetch it. `guides/` carries no WHATWG mirror, the unit's own report flags the same limit ("Network denial prevented an independent fetch of WHATWG HTML"), and answering the conformance question from memory of the special-element list would be the weaker instrument the Falsification law tells me to refuse. So the claim's core — that each row bounds its key the way 13.2.6 prescribes — stays open.

Every membership I could check against this package's own vocabularies held, and I state the coverage so the next round does not repeat it:

- The `p` row (`src/core/constants.ts:138`) omits `caption`, `table`, `td`, and `th` on the argument that their starts already close `p`. The argument holds under the shipped scan: those names sit in `BLOCK_ELEMENTS` (`src/core/constants.ts:47-93`), which is `IMPLIED_CLOSERS.p` itself (`src/core/constants.ts:105`), so a table element can only sit above an open `p` when a `p` barrier already blocks the close, and popping that barrier pops everything above it (`src/core/parsers.ts:211-222`). No member of the `p` row is a `BLOCK_ELEMENTS` member, so none of them wrongly protects by being unreachable.
- The `li`, `dt`, and `dd` rows exclude exactly each key's own close targets: `li` omits `li` while `dt` and `dd` carry it, and `dt` and `dd` omit `dt` and `dd` while `li` carries them. That asymmetry follows from `IMPLIED_CLOSERS` (`src/core/constants.ts:106-108`) and is consistent.
- The rows omit `area`, `base`, `br`, `col`, `embed`, `hr`, `img`, `input`, `link`, `meta`, `source`, `track`, and `wbr` (`VOID_ELEMENTS`, `src/core/constants.ts:10-24`), `script` and `style` (`RAW_ELEMENTS`, `:33`), and `textarea` and `title` (`LITERAL_ELEMENTS`, `:40`), each of which this parser never places on the open stack, so each is genuinely unreachable as a barrier. They keep `basefont`, `bgsound`, `frame`, `keygen`, and `param`, which this parser does stack. That split matches the departure the TSDoc records at `src/core/constants.ts:129-131`.
- The `td`, `th`, `tr`, `thead`, `tbody`, and `tfoot` rows are `['html', 'table', 'template']` (`src/core/constants.ts:333-338`), the table-scope triple, and the report calls them departure-free.

One departure is unrecorded: `html` sits in the `p` row (`src/core/constants.ts:138`) and in the table rows, and in a conforming tree builder a nested `<html>` start tag never enters the stack at all, so it can never act as a barrier there. Here it does. The TSDoc at `src/core/constants.ts:122-136` records the `select`, `ruby`, and namespace departures and not this one. Naming it costs one clause.

What settles the claim: fetch WHATWG HTML 13.2.6 on the host, compare its special-element list and its button-scope and table-scope definitions row by row against `src/core/constants.ts:137-339`, and rule each omission as one of the recorded departure categories — pass-through element, close target, parser-void or raw or literal element, or namespace integration point — with any leftover named as a new departure in the TSDoc.

## 3. The rows bind — BROKEN

`tests/src/core/parsers.test.ts:160-170` is an assertion a wrong implementation still passes, and it is the only row that reaches more than a handful of barriers:

```ts
for (const [open, barriers] of Object.entries(IMPLIED_BARRIERS)) {
	const incoming = IMPLIED_CLOSERS[open]?.[0]
	...
	expect(renderHTML(parseDocument(`<${open}><${barrier}>x<${incoming}>y`))).toBe(
		`<${open}><${barrier}>x<${incoming}>y</${incoming}></${barrier}></${open}>`,
	)
}
```

Both the population and the expected output are generated from `IMPLIED_BARRIERS`, which is the same table `src/core/parsers.ts:174-176` reads to decide the behavior. Add `span` to `IMPLIED_BARRIERS.p` and the row grows a case asserting that `<p><span>x<address>y` keeps `p` open, and the parser does exactly that, so the row stays green while the package's paragraph recovery is broken for every inline element. Remove `button` and the case disappears with the behavior. `.claude/rules/tests.md` bans this shape by name: "Never assert an implementation against itself. Compare the answer to a declaration, a fixture, or a second mechanism that could disagree with it. Re-deriving the answer the same way the source derives it produces a test that passes for every value the source ever returns, and it reads exactly like a real one." The brief's constraint said "pin every barrier you adopt with a vector"; a loop over the table pins none of them.

The mutation account has the matching gap. The commit message (`h3-diff.txt:17`) offers "the top-only mutation reddens the nested rows while every barrier row holds" as isolation, and the report repeats it at its mutation section. Under a top-only scan the barrier rows hold because no deep scan exists to be stopped — the report itself records that those rows "were green before the source edit", meaning they also pass against the shallow scan that had no barrier machinery at all. So that half of the account excludes no rival reading, which is what `.claude/rules/quality.md` § Instruments requires of a control.

What binds, and what a wrong implementation would not pass, so the fix stays bounded: `tests/src/core/parsers.test.ts:132-134`, `:136-140`, `:142-146`, `:148-152`, `:154-158`, and `tests/src/core/HTML.test.ts:122-132` each name a concrete input and a literal expected render, and each fails for the defect it names — deleting the barrier check reddens `:136-140`, and reverting the deep scan reddens `:132-134`. `tests/src/core/constants.test.ts:274-323` pins membership against hard-coded literals, so a silent table edit reddens it. Those rows are sound and want no change.

Smallest correct fix: replace the self-derived loop at `tests/src/core/parsers.test.ts:160-170` with hand-written vectors whose expected renders are literals, one per adopted barrier class rather than one per member — `applet`, `object`, `marquee`, and `template` for `p`; a special element and a table element for `li`; `select` for `option`; `ruby` for `rt`; `table` for `td` — and add the missing control to the mutation account: disable the barrier check at `src/core/parsers.ts:177-191` while leaving the deep scan intact, record that `:136-140` and `:154-158` redden, and restore with `cmp`.

## 4. The guide is true against the shipped code — BROKEN

The recovery row the ruling's Interface clause promised would "stay true as written" is the row the change made false. `guides/html.md:203` reads:

```text
| New `li` / `dt` / `dd` / `option` / `optgroup` / `rt` / `rp`, a block start while `p` is open, a table row/cell sequence | Implied close per `IMPLIED_CLOSERS` |
```

`<p><button>x<div>y` is a block start while `p` is open, and no implied close happens. That is not a derivation: `tests/src/core/parsers.test.ts:136-140` pins `renderHTML(parseDocument('<p><button>x<div>y'))` as `'<p><button>x<div>y</div></button></p>'`, and the Orchestrator's host acceptance of 2026-08-26 records `npm test` exit 0 over that tree. The row states a trigger and an unconditional consequence, and the shipped parser has a documented class of inputs where the consequence does not follow. The qualification exists only in the paragraph after the table (`guides/html.md:217`), and `.claude/rules/writing.md` § Structure keeps a required fact in the main flow rather than in a following note. `.claude/rules/documentation.md` names this exact shape: "Re-read the prose last, against what actually shipped … prose rulings survive because nothing tries."

A weaker instance sits at `guides/html.md:192`: "The implied-close search crosses intervening inline elements and stops when `IMPLIED_BARRIERS` names a scope container for the candidate." The search crosses any intervening element the candidate's row does not name, inline or not — with `td` open, an intervening `figure` is not in `['html', 'table', 'template']`, so the cell closes across a block element. The sentence describes a narrower crossing than the code performs. It also reads "for the candidate", singular and per-entry, which is the reading claim 1 leaves unresolved.

What is true and needs no edit: the `IMPLIED_BARRIERS` surface row at `guides/html.md:50` resolves to a real public export and states its type correctly; the frozen-table sentence at `guides/html.md:286` now names `IMPLIED_BARRIERS` beside `IMPLIED_CLOSERS` and `NAMED_ENTITIES`, and `tests/src/core/constants.test.ts:232-234` proves each row frozen; the example at `guides/html.md:217` is accurate for the input it names.

Smallest correct fix: qualify the row's Behavior cell to "Implied close per `IMPLIED_CLOSERS`, bounded by `IMPLIED_BARRIERS`", and change `guides/html.md:192` from "intervening inline elements" to "intervening elements".

## 5. The diff stays inside the law and the owned scope — CONFIRMED

I attacked scope, banned constructs, naming, freezing, and status, and each held.

The commit touches `guides/html.md`, `src/core/constants.ts`, `src/core/parsers.ts`, `tests/src/core/HTML.test.ts`, `tests/src/core/constants.test.ts`, and `tests/src/core/parsers.test.ts`, and nothing else; `h3-diff.txt` is the full `git show` and carries no hunk for `src/core/helpers.ts` or `src/core/types.ts`. Every file is on the brief's owned list. `h3-status.txt` is empty.

A pattern sweep for `any`, `@ts-nocheck`, `@ts-ignore`, `@ts-expect-error`, `eslint-disable`, `oxlint-disable`, a type assertion, and a non-null assertion over the whole of `src/core/parsers.ts` and `src/core/constants.ts` returns no match; the same sweep over `tests/src/core/*.test.ts` returns only the word "any" inside two prose comments at `tests/src/core/parsers.test.ts:303` and `tests/src/core/helpers.test.ts:137`. The scan adds no nested function declaration: the only in-body function expression is the comparator passed directly to `sort` at `src/core/parsers.ts:164-168`, which `AGENTS.md` § Design laws permits.

`IMPLIED_BARRIERS` (`src/core/constants.ts:137`) follows `{QUALIFIER}_{NOUN}`, matches its sibling `IMPLIED_CLOSERS`, and is frozen at both levels — `Object.freeze` on the record and on every row, proved at `tests/src/core/constants.test.ts:228` and `:232-234`. It sits in `constants.ts`, the kind file the architecture rule assigns, and reaches the barrel through the existing star export, which `tests/src/core/constants.test.ts:1-28` exercises by importing it from `@src/core`.

## Findings outside the claims

### F1. The depth projection and the deepest-position lookup are each written out at every site instead of once

`src/core/parsers.ts:164-194` computes the same "project an open position into a comparable depth" expression at four places — `:165`, `:166`, `:171-173`, and `:184-185` — and the last of them writes the ternary in the reverse order from the other three, so a reader must check each one separately to see they agree. The same block asks "what is the deepest open position for this name" three times in three spellings: the closing-tag branch at `:132-142`, the candidate collection at `:150-163`, and the barrier check at `:179-185`.

`AGENTS.md` § Design laws requires centralizing a pattern repeated twice and extracting pure leaves, and `.claude/rules/architecture.md` § Functions puts a "pure self-contained computation (key, format, compare, convert, lookup, projection, one unification)" in an exported helper. Both of these are exactly that: a lookup and a projection, over arguments the caller already holds, with no reach into `parseProvenance` state. Keeping them inline grew the start-tag branch of `parseProvenance` past fifty lines and left the barrier rule with no seam a test can drive except through the whole parser, which is part of why the only barrier row available to claim 3 had to be written as a loop over the table.

Right looks like: two exported leaves in `src/core/helpers.ts` — one returning the deepest open position of a name across the represented and overflow stacks, one projecting that position into a comparable depth — each unit-tested in `tests/src/core/helpers.test.ts`, with `src/core/parsers.ts:132-142`, `:150-163`, `:164-168`, `:169-194` all routed through them. `helpers.ts` is report-only under the H3 brief, so this lands as its own successor unit with the returned patch, not as an edit inside this one.

## Claims I attacked and could not break

Claim 5 in full: the owned-file boundary, the untouched shared files, the banned-construct sweep over both changed source files and both changed test files, the constant's name form, its freeze at both levels, its barrel reachability, and the empty status.

Within claim 1: the deep reach across intervening elements, the overflow-to-represented seam, and the chain continuation across distinct keys — each traced through `src/core/parsers.ts:150-202` and each consistent with the green rows at `tests/src/core/parsers.test.ts:132-178`.

Within claim 2: the omission arguments for `caption`, `table`, `td`, and `th` from the `p` row, the close-target exclusions across the `li`, `dt`, and `dd` rows, and the parser-void, raw, and literal exclusions, all checked against this package's own vocabularies at `src/core/constants.ts:10-119`.

Within claim 3: the concrete-input rows at `tests/src/core/parsers.test.ts:132-134`, `:136-140`, `:142-146`, `:148-152`, `:154-158`, the span row at `tests/src/core/HTML.test.ts:122-132`, the membership pin at `tests/src/core/constants.test.ts:274-323`, and the immutability rows at `:135-147` and `:232-234`.

Within claim 4: the surface row at `guides/html.md:50`, the frozen-table sentence at `guides/html.md:286`, and the example at `guides/html.md:217`.

I held the subjective lane — design acceptance, API and vocabulary, architecture fit, simplification, and guide voice. Claim 1's rival readings and claim 2's anchor conformance are referrals to the objective lane, addressed to the Orchestrator with the probe and the fetch that settle each.

VERDICT: FAIL — 2 broken, 2 unresolved, 0 not-evidenced, 1 findings outside the claims
