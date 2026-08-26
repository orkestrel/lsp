1. **CONFIRMED**

   The blocked path uses `continue`, and each candidate reads its own barrier row at [parsers.ts](/home/user/html/src/core/parsers.ts:162). The current built artifact produced:

   - Deep: `<table><tr><td><p><button>x</button></p></td><td>y</td></tr></table>`
   - Control: `<table><tr><td><p>x</p></td><td>y</td></tr></table>`

   The source map matched the current parser, helpers, and constants byte-for-byte. The literal regression row is at [parsers.test.ts](/home/user/html/tests/src/core/parsers.test.ts:158). The retained [H3 probe](/home/user/scaffold/.orkestrel/campaign/h3-impliedChain-probe.txt) records the old malformed rendering, establishing the negative state. I relied on the supplied [WHATWG transcription](/home/user/scaffold/.orkestrel/campaign/h3-whatwg-diff.md) because the network is denied.

2. **UNRESOLVED**

   The depth scan, overflow seam, and shallowest-unblocked selection held under direct execution of the current built artifact:

   - `<p><b>x<div>y` closed through `b`.
   - The `MAX_DEPTH` overflow vector closed `p` and preserved the surrounding chain.
   - `<table><tr><td>x<tr>y` closed the cell and row before opening the next row.

   The diff changes no pre-H3.1 test row except removal of the self-derived barrier loop. However, the universal claim that every earlier row passes needs an independent project run. The supplied green result is the writer’s report and cannot establish that claim. The direct command failed before collection because the read-only filesystem refused Vite’s transient `node_modules/.vite-temp` and `/tmp/*/ssr` writes.

   A writable host must settle it with:

   `npx vitest run --config vite.config.ts --no-cache --project src:core`

3. **CONFIRMED**

   The behavioral tests no longer import `IMPLIED_BARRIERS` or `IMPLIED_CLOSERS`. The replacement vectors use literal inputs and literal expected renderings at [parsers.test.ts](/home/user/html/tests/src/core/parsers.test.ts:158). The constants tests still enumerate the tables only to prove membership and freezing; they do not derive parser behavior from the implementation table.

   An in-memory mutation run used the built artifact whose source map matched the current sources:

   - Current implementation: no targeted vector failed.
   - Barrier check disabled: the button, nested-list, nested-description-list, `applet`, `object`, `marquee`, `template`, special-list, table-list, `select`, and `ruby` barrier vectors failed; the deep, inline, and overflow controls stood.
   - `continue` changed to `break`: only the deep vector failed, producing the old malformed rendering.

4. **BROKEN**

   The named H3.1 guide and barrier-TSDoc edits hold: [html.md](/home/user/html/guides/html.md:194) describes per-candidate skipping, the recovery row names the barrier bound at [html.md](/home/user/html/guides/html.md:205), and [constants.ts](/home/user/html/src/core/constants.ts:125) records the `html` departure and `select` base-scope membership. The guide examples also match direct runs. The `select` judgment relies on the supplied WHATWG transcription.

   However, the adjacent public `IMPLIED_CLOSERS` TSDoc remains false at [constants.ts](/home/user/html/src/core/constants.ts:95). It says the parser walks innermost outward and stops at the first open element whose entry does not contain the incoming tag. With `<p><b>x<div>y`, `b` has no closer entry, so that prose predicts a stop at `b`. The current artifact instead renders `<p><b>x</b></p><div>y</div>`, correctly crossing `b`.

   The smallest fix is documentation-only: describe collecting matching open candidates across intervening elements, applying each candidate’s barrier row, and selecting the shallowest unblocked candidate. The parser and current guide behavior do not need to change.

5. **CONFIRMED**

   `findOpenPosition` and `projectDepth` are exported pure leaves at [helpers.ts](/home/user/html/src/core/helpers.ts:103) and covered by literal helper tests at [helpers.test.ts](/home/user/html/tests/src/core/helpers.test.ts:66). The parser routes closing-tag lookup, candidate lookup, sorting, and barrier lookup through those helpers. Direct map access remaining in the parser only maintains position arrays.

   The core barrel publishes helpers through [index.ts](/home/user/html/src/core/index.ts:5), and the guide documents each helper at [html.md](/home/user/html/guides/html.md:102).

6. **CONFIRMED**

   The repository diff and supplied H3.1 diff have the same SHA-256 digest: `1c37a41603c162cc716cb6b9762f1a779880a07376faf934af3744498ff445b6`. The diff changes only the files named in [h3.1-status.txt](/home/user/scaffold/tmp/units/h3.1-status.txt). `git diff --check 0b71f48 37e5ca5` returned clean.

   The added TypeScript contains no banned construct. The guide’s space-insensitive diff leaves the substantive sentence, recovery-row, and helper-row edits plus the formatter-widened Markdown separator; the other table churn is alignment padding.

## Findings outside the claims

None.

## Claims attacked and not broken

Claims 1, 3, 5, and 6 held. Claim 2’s depth scan, overflow seam, and shallowest-selection behaviors held, but its universal test-run assertion remains unresolved. Claim 4’s named H3.1 edits held; the stale adjacent public TSDoc falsified the broader prose claim.

VERDICT: FAIL — 1 broken, 1 unresolved, 0 not-evidenced, 0 findings outside the claims