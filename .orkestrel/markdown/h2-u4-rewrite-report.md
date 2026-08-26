1. What changed

`rewriteDocument` is copy-on-write. Unchanged subtrees retain identity. Changed children rebuild their ancestor spine. Handler replacements and rebuilt parents map to their input nodes. Discarded slot-mismatch results and synthetic descendants remain absent from the derivation map.

Collapse arms compare each accepted child with its original during collapse. A final output-membership pass only removes derivations for discarded results.

Printed signature:

```ts
(document: MarkdownDocument, rewrite: MarkdownRewriteHandler) =>
	MarkdownDerivation<MarkdownDocument>
```

2. Red-first records per cluster

Identity pins:

```text
npm run test:src:core -- tests/src/core/helpers.test.ts -t "keeps the document identity|rebuilds and maps only"
```

Red: exit 1. Tests reported `2 failed | 285 skipped`; each failed because the old result was not iterable.

Green: exit 0. Tests reported `2 passed | 288 skipped`.

Derivation rows:

```text
npm run test:src:core -- tests/src/core/helpers.test.ts -t "maps a handler replacement|leaves joined, normalized|keeps a slot-mismatch"
```

Red: exit 1. Tests reported `3 failed | 287 skipped`; each failed because the old result was not iterable.

Green: exit 0. Tests reported `3 passed | 287 skipped`.

Surviving rows:

```text
npm run test:src:core -- tests/src/core/helpers.test.ts
```

Red after the signature change: exit 1. Tests reported `5 failed | 285 passed`. Every failure was an old bare-document consumer.

```text
npm run test:src:core -- tests/src/core/helpers.test.ts -t "rewrites bottom-up|never passes the document root|never mutates the input|reflects a text-value|rewrites image alternative|caps descent|identity rewrite reuses a wide|sparse adopted arrays isolated"
```

Green: exit 0. Tests reported `8 passed | 282 skipped`.

3. Re-ruled rows

- `keeps every iterative AST engine total across a very wide document`: previously read `.children` directly from the return. It now destructures the tuple and asserts that an identity rewrite reuses the document.
- `keeps sparse adopted arrays isolated instead of consuming a sibling result`: previously passed the bare return to `renderHTML`. It now destructures the tuple and states that changed spines rebuild without consuming sibling results.
- `reflects a text-value rewrite in the output`: previously treated the return as a document. It now destructures the rewritten document.
- `rewrites image alternative children and preserves hard-break leaves`: previously compared the complete return with a document. It now compares the destructured document.
- `caps descent at MAX_DEPTH — a subtree at the cap passes through unchanged, by reference`: previously traversed the bare return. It now traverses the destructured document and retains the cap identity assertion.

The bottom-up, root-exclusion, and input-mutation rows also destructure the tuple and remain green.

No row in `tests/src/core/helpers.test.ts` asserted the old unconditional-parent-rebuilding contract.

4. Unknowns and diagnostics

Search scope:

```text
rg -n "rewriteDocument\(" --glob '!node_modules/**' --glob '!.git/**' .
```

This covered the repository’s non-ignored working tree.

The only production consumer beyond the helper itself is `src/core/Markdown.ts:94`, owned by U5. `tests/src/core/helpers.test.ts` contains the owned test consumers. `guides/markdown.md:622` is a guide example owned by U6. `guides/html.md:482` calls the separate `@orkestrel/html` helper.

This unit adds the following external diagnostic, attributed to U5:

```text
src/core/Markdown.ts(94,23): TS2345
Argument of type 'MarkdownDerivation<MarkdownDocument>' is not assignable to
parameter of type 'string | MarkdownDocument'.
```

The remaining standing U5 diagnostics are:

```text
src/core/Markdown.ts(40,14): TS2420 — Markdown lacks span
src/core/Markdown.ts(94,3): TS2741 — returned Markdown lacks span
src/core/factories.ts(81,2): TS2741 — returned Markdown lacks span
```

5. Scoped gate readings

```text
npm run test:src:core -- tests/src/core/helpers.test.ts
```

Exit 0: `290 passed`.

```text
npx oxfmt --config .oxfmtrc.json --check src/core/helpers.ts tests/src/core/helpers.test.ts guides/markdown.md
```

Exit 0: all matched files use the correct format.

```text
npx oxlint --config .oxlintrc.json --deny-warnings src/core/helpers.ts tests/src/core/helpers.test.ts guides/markdown.md
```

Exit 0 with no warnings.

```text
npm run check:src:core
```

Exit 2 with only the U5 diagnostics listed earlier. No diagnostic remains in this unit’s files.

```text
git diff --check
```

Exit 0.

The owned diff adds no `any`, type assertion, non-null assertion, suppression directive, compatibility shim, or dependency.

6. Observations outside scope

- Campaign artifact retention: the binding records were absent from `/home/user/scaffold/.orkestrel/campaign/`. They were readable at `/home/user/scaffold/tmp/units/h2-design-reconciliation.md` and `h2-design-analyst-ruling.md`.
- U5 handle carrier: `Markdown.map`, the `span` method, factories, and `tests/src/core/Markdown.test.ts` remain for U5.
- U6 guide parity: `guides/markdown.md:622` still binds the tuple to the name `rewritten`; this unit owned only the signature row.
- H2 campaign integration: the initial and final status populations contain the standing U1–U3 edits in `src/core/types.ts`, `src/core/parsers.ts`, and `tests/src/core/parsers.test.ts`. This unit changed only its owned regions.

7. Claims needing host verification

- The `probe` MCP receipt required for the TypeScript mutation claim could not be produced under the brief’s `approval policy never` sandbox condition. The host must run that instrument if the campaign requires its receipt.
- Authoritative whole-suite and post-U5/U6 gates remain for the Orchestrator’s host verification.