1. **BROKEN** — `map` mishandles one object returned for separate source nodes. For `new HTML('<i>a</i><b>b</b>').map(node => node.category === 'text' ? shared : node)`, the second `Map.set` overwrites the first derivation. `span(shared)` therefore reports `[11, 12)` instead of `undefined` for a multi-source node. Evidence: `src/core/helpers.ts:1267-1268`, `src/core/HTML.ts:312-323`.  
   Fix: detect conflicting derivations for one output identity, mark that node ambiguous, and omit its span.

2. **BROKEN** — `parseHTMLSpan([0, 1], 1, 2)` fabricates `{ start: 1, end: 1 }` although boundary `2` has no entry. The public contract documents a projection but specifies no fallback or prerequisite. Evidence: `src/core/parsers.ts:315-324`, `guides/html.md:89`.  
   Fix: validate the requested boundaries and return `undefined` or throw the documented invalid-argument error instead of inventing offsets.

3. **BROKEN** — Nested inline elements prevent a documented implied close. For `<p><b>x<div>y`, `div` should close the open `p`, but the scan stops at `b`, which has no closer entry. EOF then records the `p` as `[0, 13)` instead of ending it at the `div` opening, `[0, 7)`. Evidence: `src/core/constants.ts:47-58`, `src/core/constants.ts:104-105`, `src/core/parsers.ts:131-139`, `src/core/parsers.ts:234-238`, `guides/html.md:198`.  
   Fix: search outward for the nearest ancestor closed by the incoming tag, then close it and its intervening descendants at `tokenStart`.

4. **BROKEN** — The recorder maps are caller-owned inputs and are mutated directly. `parseDocument('<p>x</p>', spans)` writes node spans into `spans`; `scanRawText` and the derivation helpers do the same. This contradicts the claim and the immutability rule. Evidence: `src/core/parsers.ts:25`, `src/core/parsers.ts:48-52`, `src/core/helpers.ts:496-521`, `src/core/helpers.ts:1264-1268`, `.claude/rules/typescript.md:34-38`.  
   Fix: replace mutable output parameters with operation-owned provenance results and restore nonmutating public helper signatures.

5. **BROKEN** — The propagation, absence, and identity controls remove `HTML.span` itself. Those rows then fail because the method is missing, not because the named provenance rule is broken. The report also admits that no chronological baseline red was preserved. Evidence: `/home/user/scaffold/.orkestrel/campaign/h1-provenance-report.md:63-73`, `:77-97`, `:175-177`; `tests/src/core/HTML.test.ts:122-138`, `:141-187`; `.claude/rules/tests.md:40-41`.  
   Fix: use row-specific semantic mutations, confirm only the named row reddens, and obtain the required host receipts.

6. **BROKEN** — `parseHTMLSpan` is a projection, not a coercing parser, yet it lives in `parsers.ts` and returns `HTMLSpan` rather than `HTMLSpan | undefined`. The guide also claims provenance at `guides/html.md:183` while still denying any node-position model at `guides/html.md:214`. Mutable recorder parameters additionally leak provenance internals into the public helper surface. Evidence: `.claude/rules/names.md:152-155`, `.claude/rules/architecture.md:64-75`, `src/core/parsers.ts:293-324`, `guides/html.md:87-121`, `guides/html.md:183`, `guides/html.md:214`.  
   Fix: move and rename normalization/projection helpers by their actual kind, remove public mutable recorders, and correct the contradictory guide text.

## Findings outside the claims

None.

## Claims attacked and not broken

None.

VERDICT: FAIL — 6 broken, 0 unresolved, 0 not-evidenced, 0 findings outside the claims