# Unit H1 provenance report

## Result

`HTML.span(node)` returns the half-open UTF-16 region of the original constructor string for parsed nodes and for one-source nodes carried through `map`, `sanitize`, and `distill`. It returns `undefined` for adopted documents, foreign nodes, multi-source joins, and nodes with no source.

Node shapes did not change. `src/core/validators.ts`, `src/core/shapers.ts`, and `tests/guides.test.ts` remain untouched.

## Mapping and store shapes

`parseHTMLSource` returns `[source, offsets]`. `source` contains the parser's normalized input. `offsets[normalizedBoundary]` is the corresponding boundary in the original input. A CRLF pair emits one newline boundary mapped after the pair. A bare carriage return and a null replacement preserve width. Astral characters advance through their two UTF-16 code units. This boundary map makes each scanner boundary an O(1) original-coordinate projection through `parseHTMLSpan`.

`parseDocument` keeps its document return and accepts an optional `Map<HTMLNode, HTMLSpan>` recorder. `scanRawText` accepts the same optional recorder so its text extent comes from the scanner's actual matching-close boundary, including recovered close tags. Neither recorder changes a node or the returned tree.

Each `HTML` owns a private `Map<HTMLNode, HTMLSpan>`. A string constructor fills it during parsing. An adopted `HTMLDocument` starts with an empty map. Each derivation uses an operation-local `Map<HTMLNode, HTMLNode>` from rebuilt node to its single source. The new entity resolves those chains into the prior entity's span map. Shared references resolve directly by identity. Multi-source `mergeText` joins have no derivation entry. A one-source `collapseText` rebuild records its source; a collapse over a prior multi-source join still resolves to no span. No provenance state lives at module scope.

## Proof receipts

The `prove` MCP instrument was unavailable in this executor under the approval policy of `never`. No compiler-backed receipt was obtainable here. Each case below instead records the exact Vitest case and a load-bearing control edit. The Orchestrator must take the host receipt for any claim that requires `.claude/rules/quality.md` § Instruments.

### Parsed slice equality

Control: `parseHTMLSpan` returned normalized boundaries directly.

Red command:

```text
NODE_PATH=/home/user/scaffold/node_modules npx vitest run --config vite.config.ts --no-cache --reporter=dot --project src:core tests/src/core/HTML.test.ts -t 'reports original-input slices for every parsed node category'
```

Exit 1: 1 failed, 96 skipped. The failing slices covered the document, doctype, text, element, nested text, and comment.

Green: the same command exited 0 with 1 passed and 96 skipped.

### Original-coordinate negative control

Control: `parseHTMLSpan` returned normalized boundaries directly.

Red command:

```text
NODE_PATH=/home/user/scaffold/node_modules npx vitest run --config vite.config.ts --no-cache --reporter=dot --project src:core tests/src/core/HTML.test.ts -t 'reports original offsets after collapsed CRLF pairs and astral code units'
```

Exit 1: 1 failed, 96 skipped. The paragraph reported normalized `{ start: 3, end: 11 }` instead of original `{ start: 4, end: 12 }`.

Green: the same command exited 0 with 1 passed and 96 skipped.

The mapping leaf had its own control:

```text
NODE_PATH=/home/user/scaffold/node_modules npx vitest run --config vite.config.ts --no-cache --reporter=dot --project src:core tests/src/core/parsers.test.ts -t 'maps normalized boundaries back to original UTF-16 offsets'
```

Exit 1 under the normalized-boundary control: 1 failed, 46 skipped. Green after restoration: 1 passed, 46 skipped.

### Astral UTF-16 control

The original-coordinate command above is also the astral control. `𝕏` precedes the paragraph and occupies two UTF-16 code units. The control was red with 1 failed; the implementation was green with 1 passed.

### Sanitized and distilled propagation

Control: the `HTML.span` implementation was renamed so the public method was absent.

Red command:

```text
NODE_PATH=/home/user/scaffold/node_modules npx vitest run --config vite.config.ts --no-cache --reporter=dot --project src:core tests/src/core/HTML.test.ts -t 'propagates shared, rebuilt, reparsed, and re-rooted provenance'
```

Exit 1: 1 failed, 96 skipped. Green after restoration: 1 passed, 96 skipped. The green row checks sanitized slices for shared text, rebuilt roots and elements, and a reparsed comment. It checks distilled slices for the re-rooted document, rebuilt elements, shared literal text, and one-source collapsed text.

The multi-source join is pinned in the absence row below. It was red when `span` was absent and green after restoration.

### Absence

Control: the `HTML.span` implementation was renamed so the public method was absent.

Red command:

```text
NODE_PATH=/home/user/scaffold/node_modules npx vitest run --config vite.config.ts --no-cache --reporter=dot --project src:core tests/src/core/HTML.test.ts -t 'returns undefined for adopted, foreign, and synthesized nodes'
```

Exit 1: 1 failed, 96 skipped. Green after restoration: 1 passed, 96 skipped. The green row covers an adopted root and child, a foreign root, and the text synthesized by joining `A`, `B`, and `C` after an unwrap.

### Identity map

Control: the `HTML.span` implementation was renamed so the public method was absent.

Red command:

```text
NODE_PATH=/home/user/scaffold/node_modules npx vitest run --config vite.config.ts --no-cache --reporter=dot --project src:core tests/src/core/HTML.test.ts -t 'carries root provenance through an identity map'
```

Exit 1: 1 failed, 97 skipped. Green after restoration: 1 passed, 97 skipped. The row proves root identity and equal span values on the fresh derived entity.

### Regression floor

Control: the `HTML.span` implementation was renamed so the public method was absent.

Red command:

```text
NODE_PATH=/home/user/scaffold/node_modules npx vitest run --config vite.config.ts --no-cache --reporter=dot --project src:core
```

Exit 1: 6 failed and 284 passed. Every failure was a new provenance assertion; the pre-existing core rows remained green.

Green after restoration: the same command exited 0 with 290 passed across 7 test files. No existing row was changed.

## Unclosed-element ruling

An element closed by a later implied closer ends at the closer token's opening `<`. An element still open at EOF ends at the original input length. The parser needs these distinct boundaries because the implied closer is not part of the prior element, while EOF is the last consumed boundary available.

Executed command:

```text
NODE_PATH=/home/user/scaffold/node_modules npx vitest run --config vite.config.ts --no-cache --reporter=dot --project src:core tests/src/core/HTML.test.ts -t 'ends unclosed elements at EOF or the implied closer boundary'
```

Exit 0: 1 passed, 97 skipped. `<div><p>x` produced `div [0, 9)` and `p [5, 9)`. `<p>x<div>y</div>` produced `p [0, 4)` and `div [4, 16)`.

## Scoped gates

Format:

```text
npx oxfmt --config .oxfmtrc.json --check src/core/types.ts src/core/parsers.ts src/core/helpers.ts src/core/HTML.ts tests/src/core/parsers.test.ts tests/src/core/helpers.test.ts tests/src/core/HTML.test.ts guides/html.md
```

Exit 0. Oxfmt reported that every matched file uses the correct format.

Lint:

```text
npx oxlint --config .oxlintrc.json --deny-warnings src/core/types.ts src/core/parsers.ts src/core/helpers.ts src/core/HTML.ts tests/src/core/parsers.test.ts tests/src/core/helpers.test.ts tests/src/core/HTML.test.ts
```

Exit 0 with no warnings.

Core typecheck:

```text
NODE_PATH=/home/user/scaffold/node_modules npx tsc --noEmit -p configs/src/tsconfig.core.json
```

Exit 0 with no diagnostics. The workspace had no local `node_modules`; `NODE_PATH` points at the installed dependency tree in `/home/user/scaffold/node_modules`. Without it, the compiler could not resolve `@orkestrel/contract`.

Core suite:

```text
NODE_PATH=/home/user/scaffold/node_modules npx vitest run --config vite.config.ts --no-cache --reporter=dot --project src:core
```

Exit 0: 290 passed across 7 test files.

Guide parity:

```text
NODE_PATH=/home/user/scaffold/node_modules npx vitest run --config vite.config.ts --no-cache --reporter=dot --project guides
```

The first run found the new `parseHTMLSource`, `parseHTMLSpan`, and `span` names lacked examples: exit 1 with 2 failed and 16 passed. After adding examples to `guides/html.md`, exit 0 with 18 passed.

Policy parity:

```text
NODE_PATH=/home/user/scaffold/node_modules npx vitest run --config vite.config.ts --no-cache --reporter=dot --project policy
```

Exit 0: 93 passed.

## Limits and unproved claims

The host-only `prove` receipts remain outstanding because the instrument was unreachable in this executor. The red evidence was taken through explicit mutation controls after the implementation existed; this executor did not preserve a chronological run of the new test files against the untouched `7d82b86` source. The controls prove that the named rows fail when their load-bearing behavior is removed, but they do not replace that missing chronology.

No other implementation claim in this report is known to be unproved within the executed scope.
