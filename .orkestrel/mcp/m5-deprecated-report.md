# Unit report: m5-deprecated — the deprecated-surface markers

## Deliverable 1: `MCPClientCapabilities.roots` and `.sampling`

Before (`src/core/types.ts:222-228`, baseline `11c879c`):

```ts
export type MCPClientCapabilities = Readonly<Record<string, MCPMetaObject>> & {
	readonly experimental?: Readonly<Record<string, MCPMetaObject>>
	readonly roots?: MCPMetaObject
	readonly sampling?: MCPMetaObject & {
		readonly context?: MCPMetaObject
		readonly tools?: MCPMetaObject
	}
```

After:

```ts
export type MCPClientCapabilities = Readonly<Record<string, MCPMetaObject>> & {
	readonly experimental?: Readonly<Record<string, MCPMetaObject>>
	/**
	 * @deprecated Use elicitation through {@link MCPElicitRequest} for input flows instead. The
	 * 2026-07-28 era produces no roots traffic, and the member stays legal only for a peer that
	 * still advertises it.
	 */
	readonly roots?: MCPMetaObject
	/**
	 * @deprecated Use elicitation through {@link MCPElicitRequest} for input flows instead. The
	 * 2026-07-28 era produces no sampling traffic, and the member stays legal only for a peer that
	 * still advertises it.
	 */
	readonly sampling?: MCPMetaObject & {
		readonly context?: MCPMetaObject
		readonly tools?: MCPMetaObject
	}
```

Each tag names the replacement first (elicitation through `MCPElicitRequest`), then the reason (no
2026-07-28 traffic, legal only for an advertising peer), per `.claude/rules/typescript.md`.

## Deliverable 2: `MCPServerCapabilities.logging`

Before (`src/core/types.ts:237-239`, baseline `11c879c`):

```ts
export type MCPServerCapabilities = Readonly<Record<string, MCPMetaObject>> & {
	readonly experimental?: Readonly<Record<string, MCPMetaObject>>
	readonly logging?: MCPMetaObject
```

After:

```ts
export type MCPServerCapabilities = Readonly<Record<string, MCPMetaObject>> & {
	readonly experimental?: Readonly<Record<string, MCPMetaObject>>
	/**
	 * @deprecated Use a local emitter for log observation instead. The 2026-07-28 era defines no
	 * MCP logging capability, and the member stays legal only for a peer that still advertises it.
	 */
	readonly logging?: MCPMetaObject
```

The replacement (a local emitter, matching the guide's not-built row at line 3861) names first,
then the reason.

## Deliverable 3: `MCPInputRequest` union TSDoc verification

Read at `src/core/types.ts:558-561` (unchanged, no edit made):

```ts
/**
 * @remarks
 * This package produces only {@link MCPElicitRequest}. The deprecated sampling and roots
 * requests remain legal protocol union members and therefore retain their open parameter
 * records here without gaining package-owned producers.
 */
```

Verification against the standing ruling: the remark names both deprecated arms — "sampling and
roots requests" — and the elicitation replacement — `{@link MCPElicitRequest}`. Both required
elements are present, so no strengthening was made, per the ruling's "edited only where an arm or
the replacement is unnamed."

## Deliverable 4: `guides/mcp.md` rows

The distillate's guide-site list (`.orkestrel/mcp/m5-sweep-distillate.md`) named no dedicated row
for `roots`, `sampling`, or `logging` as individual members; the rows documenting those members are
the type-level rows for their declaring interfaces, `MCPClientCapabilities` (line 2119) and
`MCPServerCapabilities` (line 2120) — the interface's readonly members stay in that row per
`.claude/rules/documentation.md`, and no other row in the distillate's guide-site list names these
three members. Neither row carried a deprecation note before this edit.

Before (`guides/mcp.md:2119-2120`):

```text
| `MCPClientCapabilities`            | type      | Open client capability map with JSON-object values and exact dated known fields.                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `MCPServerCapabilities`            | type      | Open server capability map with JSON-object values and exact dated known fields.                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
```

After:

```text
| `MCPClientCapabilities`            | type      | Open client capability map with JSON-object values and exact dated known fields. `roots` and `sampling` are deprecated: use elicitation through `MCPElicitRequest` for input flows instead.                                                                                                                                                                                                                                                                                                                                                                    |
| `MCPServerCapabilities`            | type      | Open server capability map with JSON-object values and exact dated known fields. `logging` is deprecated: use a local emitter for log observation instead.                                                                                                                                                                                                                                                                                                                                                                                                    |
```

None of the distillate's listed already-correct rows (`113`, `640`, `1141`, `1169`, `1294-1295`,
`1993`, `2044`, `2118`, `2173`, `3861`, `3864`) were touched.

## Gate readings

| Gate | Command | Result |
| --- | --- | --- |
| Format check | `npx oxfmt --config .oxfmtrc.json --check src/core/types.ts guides/mcp.md` | Initially exit 1 on `guides/mcp.md` (table column realignment forced by longer cell text). Ran `npx oxfmt --config .oxfmtrc.json guides/mcp.md` (mutating, table realignment only — see diff below), then re-ran `--check`: exit 0 |
| Lint | `npx --no-install oxlint --config .oxlintrc.json --deny-warnings src/core/types.ts` | Exit 0, no output |
| Typecheck | `npm run check` | Exit 0 (`tsc --noEmit --project tsconfig.json` and all three `check:src:*` scopes) |
| Guides parity | `npx vitest run --config vite.config.ts --no-cache --reporter=dot --project guides` | `Test Files 1 passed (1)`, `Tests 144 passed (144)`, exit 0 |
| Conformance | `npx vitest run --config vite.config.ts --no-cache --reporter=dot --project conformance` | `Test Files 1 passed (1)`, `Tests 42 passed (42)`, exit 0 |
| Validators scoped | `npx vitest run --config vite.config.ts --no-cache --reporter=dot --project src:core tests/src/core/validators.test.ts` | `Test Files 1 passed (1)`, `Tests 138 passed (138)`, exit 0 |

`grep -c "@deprecated" src/core/types.ts` reports `3`, covering exactly `MCPClientCapabilities.roots`
(`:225`), `MCPClientCapabilities.sampling` (`:231`), and `MCPServerCapabilities.logging` (`:250`).

## Writing-rules sweep

Pattern: the `.claude/rules/writing.md` substitution table, swept case-insensitively across
inflections. Population: every added or changed prose line in the diff below (the three TSDoc
blocks and the two guide-row sentences). No hit in the population.

## `git status --short`

```text
 M guides/mcp.md
 M src/core/types.ts
```

## `git diff --stat`

```text
 guides/mcp.md     |  4 ++--
 src/core/types.ts | 14 ++++++++++++++
 2 files changed, 16 insertions(+), 2 deletions(-)
```

## Full diff

```diff
diff --git a/guides/mcp.md b/guides/mcp.md
index 02f0274..a2f318f 100644
--- a/guides/mcp.md
+++ b/guides/mcp.md
@@ -2116,8 +2116,8 @@ Passing a legacy revision to
 | `MCPResultMetaObject`              | type      | Open result metadata with an optional exact reserved `io.modelcontextprotocol/serverInfo` identity.                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
 | `MCPNotificationMetaObject`        | type      | Open notification metadata with an OPTIONAL reserved `io.modelcontextprotocol/subscriptionId`. A frame delivered down a `subscriptions/listen` stream carries the stamp; the same notification delivered any other way carries none, so a required key would refuse a frame the protocol permits.                                                                                                                                                                                                                                                              |
 | `MCPLoggingLevel`                  | type      | The dated debug-through-emergency logging-level literals.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
-| `MCPClientCapabilities`            | type      | Open client capability map with JSON-object values and exact dated known fields.                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
-| `MCPServerCapabilities`            | type      | Open server capability map with JSON-object values and exact dated known fields.                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
+| `MCPClientCapabilities`            | type      | Open client capability map with JSON-object values and exact dated known fields. `roots` and `sampling` are deprecated: use elicitation through `MCPElicitRequest` for input flows instead.                                                                                                                                                                                                                                                                                                                                                                    |
+| `MCPServerCapabilities`            | type      | Open server capability map with JSON-object values and exact dated known fields. `logging` is deprecated: use a local emitter for log observation instead.                                                                                                                                                                                                                                                                                                                                                                                                     |
 | `MCPEra`                           | type      | `'modern' \| 'legacy'` — the structural wire era, and a genuine protocol discriminant rather than a boolean switch: it names which published wire shape a request took and is published on the `request` event.                                                                                                                                                                                                                                                                                                                                                |
 | `MCPRole`                          | type      | `'user' \| 'assistant'` — the intended audience of annotated content.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
 | `MCPAnnotations`                   | interface | Optional audience, priority, and last-modified hints.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
diff --git a/src/core/types.ts b/src/core/types.ts
index ff5bd14..8628753 100644
--- a/src/core/types.ts
+++ b/src/core/types.ts
@@ -221,7 +221,17 @@ export type MCPLoggingLevel =
 /** The open dated client-capability declaration carried by modern requests. */
 export type MCPClientCapabilities = Readonly<Record<string, MCPMetaObject>> & {
 	readonly experimental?: Readonly<Record<string, MCPMetaObject>>
+	/**
+	 * @deprecated Use elicitation through {@link MCPElicitRequest} for input flows instead. The
+	 * 2026-07-28 era produces no roots traffic, and the member stays legal only for a peer that
+	 * still advertises it.
+	 */
 	readonly roots?: MCPMetaObject
+	/**
+	 * @deprecated Use elicitation through {@link MCPElicitRequest} for input flows instead. The
+	 * 2026-07-28 era produces no sampling traffic, and the member stays legal only for a peer that
+	 * still advertises it.
+	 */
 	readonly sampling?: MCPMetaObject & {
 		readonly context?: MCPMetaObject
 		readonly tools?: MCPMetaObject
@@ -236,6 +246,10 @@ export type MCPClientCapabilities = Readonly<Record<string, MCPMetaObject>> & {
 /** The open dated server-capability declaration returned by discovery. */
 export type MCPServerCapabilities = Readonly<Record<string, MCPMetaObject>> & {
 	readonly experimental?: Readonly<Record<string, MCPMetaObject>>
+	/**
+	 * @deprecated Use a local emitter for log observation instead. The 2026-07-28 era defines no
+	 * MCP logging capability, and the member stays legal only for a peer that still advertises it.
+	 */
 	readonly logging?: MCPMetaObject
 	readonly completions?: MCPMetaObject
 	readonly prompts?: MCPMetaObject & { readonly listChanged?: boolean }
```

## Deviations

None. Every scoped site matched the distillate's reading before editing, both `MCPInputRequest`
union arms and the elicitation replacement were already named, and every gate ran green at first
pass except the format gate, which converged with one scoped mutating `oxfmt` run over the single
file the table realignment touched, then re-passed non-mutating.
