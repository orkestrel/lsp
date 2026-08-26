1. **What changed**

- [src/core/parsers.ts](/home/user/html/src/core/parsers.ts): Finds every matching implied-close entry through represented and overflow stacks, closes the reachable chain, and stops at the candidate’s scope barrier. Implicit spans end at the incoming tag start.
- [src/core/constants.ts](/home/user/html/src/core/constants.ts): Exports the frozen `IMPLIED_BARRIERS` record with frozen rows and WHATWG-derived TSDoc.
- [tests/src/core/parsers.test.ts](/home/user/html/tests/src/core/parsers.test.ts): Pins nested `p`, button scope, nested lists, inline and barrier `dt`, every adopted barrier, and overflow scanning.
- [tests/src/core/HTML.test.ts](/home/user/html/tests/src/core/HTML.test.ts): Pins `p` `[0, 7)`, `b` `[3, 7)`, and `div` `[7, 13)`.
- [tests/src/core/constants.test.ts](/home/user/html/tests/src/core/constants.test.ts): Pins barrier membership and immutability.
- [guides/html.md](/home/user/html/guides/html.md): Documents `IMPLIED_BARRIERS`, deep implied closes, the barrier rule, and the required example.

2. **Barrier sets**

The anchor is WHATWG HTML §13.2.6.

- `p`: `applet`, `button`, `html`, `marquee`, `object`, `select`, `template`. Button scope supplies the scope barriers. `select` adapts the in-select behavior that would otherwise make the trigger unreachable. `caption`, `table`, `td`, and `th` are omitted because their starts already close `p`.
- `li`: `applet`, `article`, `aside`, `basefont`, `bgsound`, `blockquote`, `body`, `button`, `caption`, `center`, `colgroup`, `dd`, `details`, `dir`, `dl`, `dt`, `fieldset`, `figcaption`, `figure`, `footer`, `form`, `frame`, `frameset`, `h1`–`h6`, `head`, `header`, `hgroup`, `html`, `iframe`, `keygen`, `listing`, `main`, `marquee`, `menu`, `nav`, `noembed`, `noframes`, `noscript`, `object`, `ol`, `param`, `plaintext`, `pre`, `search`, `section`, `select`, `summary`, `table`, `tbody`, `td`, `template`, `tfoot`, `th`, `thead`, `tr`, `ul`, `xmp`.
- `dt`: the preceding special-element set with `li`, excluding `dd` and `dt`.
- `dd`: identical to `dt`.
- The `li`, `dt`, and `dd` rows follow the special-element loop. They exclude the specified pass-through elements `address`, `div`, and `p`; parser-void and raw/literal elements that cannot expose a nested trigger; close targets; and namespace integration points because this AST has no namespaces.
- `option`: `select`. This adapts WHATWG’s current-node and in-select rules to a deep scan.
- `optgroup`: `select`, for the same adaptation.
- `rt`: `ruby`. This adapts ruby-scope implied-end-tag processing.
- `rp`: `ruby`, for the same adaptation.
- `td`, `th`, `tr`, `thead`, `tbody`, `tfoot`: `html`, `table`, `template`. These use WHATWG table scope without departure.

3. **Red-first evidence**

- Nested `p`:  
  `npx vitest run --config vite.config.ts --no-cache --project src:core tests/src/core/parsers.test.ts -t "closes a keyed ancestor through intervening inline elements"`  
  Before: `1 failed`. After: `1 passed`.
- Inline `dt`:  
  `npx vitest run --config vite.config.ts --no-cache --project src:core tests/src/core/parsers.test.ts -t "closes a description entry through an intervening inline element"`  
  Before: `1 failed`. After: `1 passed`.
- Overflow path:  
  `npx vitest run --config vite.config.ts --no-cache --project src:core tests/src/core/parsers.test.ts -t "reaches a represented implied closer through the depth overflow stack"`  
  Before: `1 failed`. After: `1 passed`.
- Nested spans:  
  `npx vitest run --config vite.config.ts --no-cache --project src:core tests/src/core/HTML.test.ts -t "ends every element implicitly closed through an inline element at the trigger"`  
  Before: `1 failed`. After: `1 passed`.
- The button, nested-list, and nested-`dl` barrier rows were green before the source edit and remain green under the same focused commands. They are preservation controls rather than red-first rows.

4. **Mutation account**

A top-only condition disabled deep matching.

- Nested-close command: `1 failed`.
- `npx vitest run --config vite.config.ts --no-cache --project src:core tests/src/core/parsers.test.ts -t "keeps a paragraph open across a button scope barrier"`: exit `0`.
- `npx vitest run --config vite.config.ts --no-cache --project src:core tests/src/core/parsers.test.ts -t "keeps entry-keyed ancestors open across every configured scope barrier"`: exit `0`.
- Restoration: `cmp src/core/parsers.ts tmp/h3-implied-close/parsers.ts` exited `0`.

5. **Unknowns readings**

- Overflow is reachable. The focused overflow command initially returned `1 failed`, receiving a deepest `p` containing `xy`; it returns `1 passed` with `p` and `div` as siblings.
- The first deep-selection implementation reddened the owned sanitize reparse-fixpoint row because it closed `td` without also closing `tr`. Continuing through the reachable matching chain repaired that row. The focused command and the final source-core project exit `0`.
- No row outside the owned files reddened. The final source-core project is green.

6. **Observations outside scope**

None.

7. **Scoped gate readings**

- `npm run check:src:core`: exit `0`.
- `npx vitest run --config vite.config.ts --no-cache --project src:core`: exit `0`; `303 passed`.
- `npm run test:guides`: exit `0`; `18 passed`.
- Scoped `oxfmt --check`: exit `0`.
- Scoped `oxlint --deny-warnings`: exit `0`.
- `git diff --check`: exit `0`.

8. **Claims needing host verification**

- The Orchestrator must capture the authoritative diff, status, and host gate receipts.
- The `prove` MCP receipt remains unavailable in this sandbox.
- Network denial prevented an independent fetch of WHATWG HTML; the derivation uses the brief’s §13.2.6 ruling.