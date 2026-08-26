# Unit g1-tool — report

## Sentence landed

Extended the "Mechanism only." blockquote at `guides/tool.md:20-25` with two sentences joining
the existing framing: "Progress reporting belongs there too: it is a property of the invoking
consumer's execution context, one layer up — the @orkestrel/mcp package's execution context
carries a progress reporter — never of the tool contract itself." The `@orkestrel/mcp` token is
unbackticked because it names a foreign package, not a public export of this package; backticking
it would fail the guide's parity gate, which requires every backticked API to resolve to a real
export of `@orkestrel/tool`.

## Gate readings

1. `npm run format:check` — exit 0. `oxfmt` reports "All matched files use the correct format."
   across 130 files.
2. `npm run test:guides` (repository-declared script: `vitest run --config vite.config.ts
   --no-cache --reporter=dot --project guides`) — exit 0. 1 test file, 23 tests, all passed.

## Diff

```diff
diff --git a/guides/tool.md b/guides/tool.md
index ee96cd4..af8252e 100644
--- a/guides/tool.md
+++ b/guides/tool.md
@@ -21,7 +21,9 @@
 > nothing, validates no arguments against a tool's schema, authorizes no call, and ships no
 > concrete tools. Optional caller context is consumer-asserted and forwarded without
 > verification. Each trust decision belongs to the invoking consumer, to a policy layer, or to
-> the tool itself.
+> the tool itself. Progress reporting belongs there too: it is a property of the invoking
+> consumer's execution context, one layer up — the @orkestrel/mcp package's execution context
+> carries a progress reporter — never of the tool contract itself.
 
 Two nouns carry the runtime. A `Tool` is inert — a definition plus a handler, with no lifecycle
 and no failure handling of its own. A `ToolManager` is the live surface a caller holds: it hands
```

## Status

```
 M guides/tool.md
```

Only the owned file changed. No other file in the repository was touched.

## Claims flagged

None. No parity failure occurred, and no edit required an off-limits file.
