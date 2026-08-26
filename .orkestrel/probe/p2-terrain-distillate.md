# P2 terrain distillate — Cursor Grok, 2026-08-26

Returned by the `grok` driver (Cursor Grok, `cursor-grok-4.6-high`) from a bounded read-only
sweep of `/home/user/probe`, clean at `42e0b1e` on the `claude/lsp-spec-audit-est33d` branch;
`git status --porcelain` empty before and after. Preserved verbatim.

**Question:** Map the blast radius of replacing `Issue.line` (one-based `number`) with a zero-based UTF-16 `range`, rendered one-based at format time.

**Evidence**

Declaration:
- `/home/user/probe/src/core/types.ts:183-192` — `Issue` interface: `origin`, `path`, `message`, `readonly line?: number` (comment line 190: "One-based line the tool reported, or absent when it reported none"). TSDoc remarks at `types.ts:169-171` state absence semantics. `@example` blocks at `types.ts:175-180` and `:291-296` embed `line: 1`.

Producers (each computes a coordinate differently):
- `/home/user/probe/src/server/stages/TypeStage.ts:456-459` — `diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start)` returns zero-based `position.line`; producer adds `+ 1` to reach the stored one-based `line`.
- `/home/user/probe/src/server/stages/LintStage.ts:270-276` — `diagnostic.range.start.line + 1`, where `diagnostic.range` is an LSP `Range`/`Position` from `LSPDiagnostic` (zero-based per LSP spec), `+1` applied at construction.
- `/home/user/probe/src/server/stages/RuntimeStage.ts:895-923` — `stack.line` taken verbatim from a Vitest stack frame (already one-based; no adjustment), guarded at line 918 (`!('line' in stack) || typeof stack.line !== 'number'`).

Consumer:
- `/home/user/probe/src/core/helpers.ts:28` — `formatIssue`: `` issue.line === undefined ? issue.path : `${issue.path}:${issue.line}` ``. This is the sole rendering site; it prints the stored value as-is (today one-based, no conversion happening here — conversion already happened at each producer).

Validator:
- `/home/user/probe/src/core/validators.ts:175` — `isIssue` shape guard: `{ origin: isParty, path: isString, message: isString, line: isNumber }` (an optional-member guard entry, exact form needs confirming against surrounding lines, but `line: isNumber` is the checked type).

Guide/prose:
- `/home/user/probe/guides/probe.md:41` — `Issue` row: `` `{ origin, path, message, line? }` ``, states line absence semantics.
- `probe.md:103` — `isIssue` row: "optional line."
- `probe.md:115` — `formatIssue` row: `` `[origin] path:line message` ``, drops `:line` when absent.
- `probe.md:296,311,338,378` — prose referencing `Issue.origin`, unaffected by this change but co-located.
- `probe.md:733,767` — LSP hookup section: "`@orkestrel/lsp` owns everything between them, and the hookup is fixed" — names the LSP boundary this range type would sit against.

Tests whose expectations the replacement falsifies (search scope: `grep line[:=] tests/`, `src/`):
- `/home/user/probe/tests/src/core/helpers.test.ts:47,65,82,108` — `formatIssue` fixtures using `line: <n>`.
- `/home/user/probe/tests/src/core/validators.test.ts:74` — `isIssue({ ...issue, line: '1' })` expects `false`; asserts the guard rejects a string `line`.
- `/home/user/probe/tests/src/server/stages/RuntimeStage.test.ts:152,197` — `line: expect.any(Number)` on stage output.
- Not in scope (confirmed unrelated): `/home/user/probe/tests/setupPolicy.ts:301,453,845,1223,1993` and `/home/user/probe/tests/policy.test.ts:363,410` and `/home/user/probe/tests/config.test.ts:852-853` all reference a `PolicyViolation.line` (defined `tests/setupPolicy.ts:37`), a distinct type from `Issue`.

**Unknowns**
- `@orkestrel/lsp`'s exported `Range`/`Position` shape could not be inspected: `node_modules` is entirely absent from `/home/user/probe` (no install has run against `package.json`'s `file:../lsp/tmp/tarballs/orkestrel-lsp-0.0.1.tgz` reference). The implementer must install or inspect the tarball/source at `/home/user/lsp/tmp/tarballs/orkestrel-lsp-0.0.1.tgz` or `/home/user/lsp` directly before deciding whether `Issue.range` reuses that type or declares its own.
- Whether `TypeStage`'s `diagnostic.file.getLineAndCharacterOfPosition` result (TypeScript's own `LineAndCharacter`, `{line, character}`, zero-based UTF-16 already) can populate `range` directly or needs a distinct local shape wasn't checked against `@orkestrel/lsp`'s type; that comparison needs the install above.
- `isIssue`'s exact validator line for optional-member handling (`combinators.ts` usage) wasn't read in full; confirm the exact guard composition before editing.

**Deviation:** none — clean read-only sweep, `git status --porcelain` empty before and after (repo was already clean at `42e0b1e`).
