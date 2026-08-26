# Unit L6-D — the inspection bound in the guide

Role and engine: `implementer`, Claude Opus 5, native subagent in `/home/user/lsp`. You perform
this assignment directly and spawn nothing.

Read before editing, in order: the repository `AGENTS.md`, the `.claude/rules/writing.md` and
`.claude/rules/documentation.md` files, then the ruling this unit documents —
`.orkestrel/lsp/l6-design-reconciliation.md` and the adopted contract with its guide-parity list
in `.orkestrel/lsp/l6-design-analyst-ruling.md` (§ Contract prose, § Guide parity). No skill
applies.

## Objective

Bring `guides/lsp.md` to parity with the ruled contract that unit L6-A landed in
`src/core/types.ts` (the `LSPOpenOptions` interface at `types.ts:286` and the two-parameter `open`
member at `types.ts:319`, both on the working tree — the round is uncommitted by design).

## Context, measured 2026-08-26 on the held tree

The guide lines the ruling makes false (`grep -n "deadline\|## Methods\|## Surface\|open(" guides/lsp.md`):

```text
13:The client accepts `open()` and `close()` only during a ready generation. A dead generation refuses
27:const diagnostics = await client.open({
50:during teardown. A close failure that settles before the deadline is emitted before the client
51:destroys its emitter. At the deadline, the client emits an `LSPError` coded `timeout` and absorbs
132:| `open`    | `open(document: LSPTextDocumentItem): Promise<readonly LSPDiagnostic[]>` | Opens a document and resolves its pull or push diagnostics.                              |
163:| `LSPClientOptions`      | Configures transport, workspace, deadline, abort signal, and event hooks.                         |
```

Section map: `## Client lifecycle` (:6), `## Transport seam` (:36), `## Stdio transport` (:54),
`## Framing state` (:106), `## Conformance` (:113), `## Methods` (:123), `## Surface` (:146).

Standing condition: this workspace runs no `guides` test project, so no gate reads this file —
parity here is by inspection against the ruling and the landed types, and the missing project is a
registered `ROADMAP.md` item outside this unit.

## The change, per the analyst's Guide parity list

1. The lifecycle section distinguishes the lifecycle `timeout`, the client-wide constructor
   `signal`, and the required per-open signal, each with its scope.
2. The client example passes `{ signal }` to `open` and closes the admitted URI — use the
   analyst's revised example shape (an `AbortSignal.timeout(30_000)` armed by the caller, the
   `open` call with the options bag, then `await client.close(uri)`).
3. The `## Methods` table's `open` row carries
   `open(document: LSPTextDocumentItem, options: LSPOpenOptions): Promise<readonly LSPDiagnostic[]>`.
4. The `## Surface` table gains an `LSPOpenOptions` row.
5. The `LSPClientOptions` surface row reads as configuring transport, workspace, lifecycle
   timeout, client abort, and hooks.
6. No row or sentence calls `timeout` an undifferentiated diagnostics deadline; the teardown
   prose at guide lines 50-51 may keep "deadline" only where it names the instant the `timeout`
   duration fixes, matching the ruling's vocabulary split that L6-A recorded for the `destroy`
   TSDoc.

Guide fences import through `@orkestrel/lsp`, never `@src/*`. Writing rules bind: no `should`, no
counts, spaced em dashes, present tense.

## Scope

Owned file: `guides/lsp.md`. Report-only: `src/core/types.ts`, `src/core/LSPClient.ts`,
`guides/README.md`. Off-limits: everything else. No commit, no push, no
`git checkout`/`restore`/`stash`/`reset`/`clean`, no installs, no tree-wide `format` or
`lint --fix`. The `src` files on the tree are another unit's uncommitted work — touch nothing
outside the owned file.

## Output

Your final report, written to `/home/user/lsp/tmp/units/l6-d-guide-report.md` and returned as your
final message:

1. What changed, section by section, as the exact prose delta.
2. The full `git diff -- guides/lsp.md`.
3. The parity reading: each backticked API the revised guide names, confirmed against
   `src/core/types.ts` and the `src/core/index.ts` barrel by inspection, with any name that fails
   to resolve reported as a deviation.
4. `npx oxfmt --check guides/lsp.md` with its exit code, and `git status --short`.
5. Observations outside scope, each named against the unit that owns it.

## Deviation contract

A conflict with the ruled contract or a guide claim you cannot square with the landed types stops
the unit: report expected, found, exact evidence, done or not done, and at most one short
hypothesis. Sentence wording within the analyst's stated content is yours to decide, recorded in
the report.

## Acceptance criteria

1. `git status --short` shows `guides/lsp.md` as the only new modification beside the standing
   `src/core/factories.ts` and `src/core/types.ts` entries.
2. `npx oxfmt --check guides/lsp.md` exits 0.
3. Every item of the analyst's Guide parity list is closed by a named line in the diff.
4. The example fence compiles against the ruled signature by inspection: the options bag is
   required and supplied.
