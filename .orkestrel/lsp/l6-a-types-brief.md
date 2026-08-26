# Unit L6-A — the inspection bound contract in the types file

Role and engine: `implementer`, Claude Opus 5, native subagent in `/home/user/lsp`. You perform
this assignment directly and spawn nothing.

Read before editing, in order: the repository `AGENTS.md`, the `.claude/rules/names.md`,
`.claude/rules/typescript.md`, and `.claude/rules/writing.md` files, then the ruling this unit
implements — `.orkestrel/lsp/l6-design-reconciliation.md` and the adopted contract in
`.orkestrel/lsp/l6-design-analyst-ruling.md` (§ Ruling and § Contract prose). No skill applies.

## Objective

Land the ruled `open` contract in `src/core/types.ts` and the one revised prose line in
`src/core/factories.ts`. Types only — the client implementation, the tests, and the guide belong
to later units.

## Context, measured 2026-08-26 on the clean `ca2cb13` tree

The `open` member today (`grep -n "open(" src/core/types.ts`):

```text
279:	open(document: LSPTextDocumentItem): Promise<readonly LSPDiagnostic[]>
```

`LSPOpenOptions` is unclaimed (`grep -n "LSPOpenOptions" src/core/types.ts` returns nothing).
`LSPClientOptions` members `timeout` and `signal` sit at `types.ts:269-270` with no member TSDoc.
The factories prose (`grep -n "deadline" src/core/factories.ts`):

```text
7: * @param options - The transport, workspace, deadline, abort signal, and initial event hooks.
```

## The change

1. Declare `LSPOpenOptions` in `src/core/types.ts` beside `LSPClientOptions`: a required
   `readonly signal: AbortSignal` member, with the TSDoc the analyst's Contract prose section
   states — the already-aborted refusal before `textDocument/didOpen`, and the post-write abort
   rejecting with an `LSPError` coded `aborted`.
2. Change the `open` member to
   `open(document: LSPTextDocumentItem, options: LSPOpenOptions): Promise<readonly LSPDiagnostic[]>`
   and give it the TSDoc block from the Contract prose section: the path selection, the required
   signal's scope, the returns line, the thrown codes (`closed`, `duplicate`, `protocol`,
   `aborted`), the statement that the signal controls this operation only and the constructor
   timeout does not bound this wait, and the retained URI ownership after a post-write abort.
3. Add member TSDoc on `LSPClientOptions.timeout` and `LSPClientOptions.signal` per the Contract
   prose section: `timeout` bounds initialize and shutdown requests and destroy-time settlement,
   Default: 30,000 ms, and does not bound diagnostics requested by `open`; `signal` aborts the
   client, rejects its pending operations with an `LSPError` coded `aborted`, and begins
   destruction.
4. Revise the `src/core/factories.ts` `@param options` line from "deadline" to "lifecycle
   timeout", keeping the rest of the sentence.

Follow `.claude/rules/typescript.md` § Comments and API documentation for every block: third
person `-s` first sentence that never repeats the symbol's name, "Thrown when …" for errors,
"Default: …" for the default. Follow the writing rules: no `should`, no counts, spaced em dashes.

## Standing condition, named so you do not stop on it

The client and the tests have not caught up, by design: after this change, `npm run check` reports
the `LSPClient` class no longer satisfying `LSPClientInterface.open` and every one-argument
`.open(` call site in `tests/src/core/LSPClient.test.ts` and `tests/src/server/integration.test.ts`
as missing-argument diagnostics. Those files are off-limits here and their repair is the next
unit's. Report the exact diagnostic list as an observation. Do not edit any file outside your
scope to silence one.

## Scope

Owned files: `src/core/types.ts`; `src/core/factories.ts` (the named `@param` line, and TSDoc
prose only). Report-only: `src/core/LSPClient.ts`, `tests/`, `guides/`. Off-limits: everything
else. No commit, no push, no `git checkout`/`restore`/`stash`/`reset`/`clean`, no installs, no
tree-wide `format` or `lint --fix`.

Ancillary decision, yours to take and record: the `destroy` TSDoc at `types.ts:281-289` says
"configured deadline" — align its vocabulary with the revised `timeout` prose or leave it, and
record the choice.

## Output

Your final report, in this shape and nothing else:

1. What changed in each owned file, as the exact behavioral or prose delta.
2. The full `git diff` of the owned files.
3. The `npm run check` standing diagnostic list, verbatim.
4. Scoped gate readings with exit codes: `npx oxfmt --check src/core/types.ts
   src/core/factories.ts` and `npx oxlint --deny-warnings src/core/types.ts
   src/core/factories.ts`.
5. Observations outside scope, each named against the unit that owns it.

## Deviation contract

A conflict with the ruled contract stops the unit: report expected, found, exact evidence, done or
not done, and at most one short hypothesis. The standing red named earlier is not a deviation.
Prose wording within the analyst's stated content is yours to decide.

## Acceptance criteria

1. `git status --short` shows only the owned files changed.
2. The scoped `oxfmt --check` and `oxlint --deny-warnings` runs over the owned files exit 0.
3. `src/core/types.ts` typechecks with no diagnostic of its own — every `npm run check`
   diagnostic names `src/core/LSPClient.ts` or a test file.
4. The declared contract matches the analyst ruling's `LSPOpenOptions` and `open` signature
   exactly.
