# Brief: inventory LSP-audit-relevant surfaces across the Orkestrel fleet

## Role and engine

You are the Cursor Grok bench engine (`cursor-grok-4.6-high`), reached through the `agent` CLI.
You perform this assignment directly, in-process, and spawn nothing.

## Objective

Inventory, at absorption depth with `file:line` evidence, the LSP-audit-relevant surfaces of
nine Orkestrel fleet checkouts: the MCP protocol implementation, the language-server client
usage, the HTML/Markdown AST position machinery, and the progress/cancellation mechanisms
across five app-layer packages. Return distilled evidence only. Never decide, design, or
recommend how LSP support should be added anywhere.

## Standing conditions -- read before touching any tool

- **No web access, ever.** This CLI's web tooling (WebFetch, WebSearch, HTTP calls of any
  kind) is rejected in unattended mode. Do not attempt it, do not retry it, do not report it as
  a failure requiring escalation -- just do not use it. Every source you need is a local file.
- **Read-only.** Make no edits, run no probes, install nothing, write no file except your final
  answer to the conversation. You are not a subagent-spawning orchestrator; you read files and
  report.
- **Sibling checkouts sit outside the working directory.** The working directory is
  `/home/user/scaffold`. The nine checkouts under inventory are separate directories on the same
  host: `/home/user/mcp`, `/home/user/probe`, `/home/user/html`, `/home/user/markdown`,
  `/home/user/workflow`, `/home/user/process`, `/home/user/tool`, `/home/user/queue`,
  `/home/user/middleware`. Read them by their absolute paths; none of them is reachable through
  a relative path from `/home/user/scaffold`.
- **No raw file dumps.** Cite exact `file:line` (or `file:line-line` for a range) pointers and
  quote only the smallest snippet that proves the claim. A full-file paste is not evidence, it
  is a refusal to distill.

## Context -- read first, before searching the checkouts

1. `tmp/cursor/lsp-spec-2.log` (in `/home/user/scaffold`) -- a prior distillate of the LSP 3.18
   specification. It fixes the vocabulary this sweep's questions use: `initialize`,
   `capabilities`, `textDocument/publishDiagnostics`, progress tokens, `$/cancelRequest`,
   position encoding, `documentSymbol`, `foldingRange`, `selectionRange`, `semanticTokens`, and
   so on. Read it to know what each question is asking for before you search for it.
2. `tmp/units/orkestrel-fleet-report.md` (in `/home/user/scaffold`) -- a prior shallow map of the
   same fleet. Its `file:line` pointers are a seed for your search, not a ceiling on it, and its
   Unknowns section names exactly the gaps this deeper sweep exists to close. Read its Unknowns
   before starting each numbered question below, and close every one you can with evidence.

## The four questions

Answer each as its own numbered section, in order. Within each section, answer every
sub-question by name; do not fold two sub-questions into one paragraph without a pointer for
each.

### 1. mcp protocol truth (`/home/user/mcp`)

- Every occurrence of the literal `2026-07-28` in the tree -- search `src/`, `tests/`, and
  `guides/` -- each with `file:line`.
- The exact declared values of `MCP_PROTOCOL_VERSION`, `MCP_LEGACY_VERSION`, and
  `SUPPORTED_PROTOCOL_VERSIONS` (the prior map places these at `src/core/constants.ts:15,18,32`
  -- confirm or correct that pointer) and every file that imports or reads each constant, with
  `file:line` for each consumer.
- The package's progress surface: does it define or handle progress tokens, progress
  notifications, or `_meta` progress fields anywhere? Name every declaration and handler with
  `file:line`, or state plainly that none exists and name the directories you searched.
- The package's cancellation surface: same treatment -- every `$/cancelRequest`-equivalent
  declaration or handler, or its absence.
- The package's capability-negotiation shape: what capability object or type does it declare
  for `initialize`, and where is it built and read, with `file:line`.
- From the tree's own guides and tests only (not your outside knowledge of MCP): which features
  does the tree itself attribute to the `2026-07-28` revision, quoting the attributing text with
  its pointer. State whether the version-type/constants mismatch -- `types.ts:191` (per the prior
  map) admits the literal `'2026-07-28'` as a type member while the `SUPPORTED_PROTOCOL_VERSIONS`
  array does not include it -- is explained, tested, or acknowledged anywhere in the tree, with
  a pointer if so or a statement of absence if not.

### 2. probe language-server inventory (`/home/user/probe`)

- The complete list of LSP methods `probe` sends or handles, each with `file:line` for the
  literal method string. The prior map found `initialize`, `initialized`, `didOpen`, `didClose`,
  and `publishDiagnostics` in `src/server/stages/LintStage.ts` plus a `shutdown` -- confirm each
  pointer, find any the prior map missed, and correct any it got wrong.
- The exact `initialize` request params and client `capabilities` object `probe` sends, quoted
  with `file:line`.
- What server capabilities `probe` reads back from the `initialize` response, and what it
  receives but ignores (state ignored fields as ignored, not as absent).
- The JSON-RPC framing implementation: does `probe` implement its own `Content-Length` header
  parsing, or does it use a library, and where, with `file:line`.
- Position, range, and URI handling: how `probe` represents a position or range internally, and
  whether it is aware of UTF-8/UTF-16/UTF-32 position-encoding negotiation (LSP 3.17+ feature) --
  quote the handling code or state its absence.
- The diagnostics consumption shape: how `probe` receives and structures `publishDiagnostics`
  payloads, with `file:line`.
- The teardown sequence: the exact call order for `shutdown`/`exit` or equivalent, with
  `file:line`.
- Separately: what engine drives the TYPE stage -- `tsserver`, the `tsc` programmatic API,
  `tsgo`, or something else -- with `file:line` evidence, and whether any stage besides lint
  speaks LSP at all.
- Any occurrence of `tsgo`, `typescript-go`, or "TypeScript 7" anywhere in the tree, with
  `file:line`, or a statement that none exists.

### 3. html and markdown AST shape (`/home/user/html`, `/home/user/markdown`)

- For every node type declared in `/home/user/html/src/core/types.ts`: exactly which
  position/offset/range fields it carries, in what unit (the prior map states html nodes carry
  UTF-16 offsets -- confirm the exact field names, types, and the unit statement's source), and
  which node types carry no position information at all. Quote each field declaration with
  `file:line`.
- The same treatment for every node type in `/home/user/markdown/src/core/types.ts`.
- Any outline, heading-tree, symbol-table, or folding-range-like derivation anywhere in either
  package -- search html's distill surface and markdown's heading handling specifically -- with
  `file:line`, or a statement of absence naming the directories searched.
- Whether a markdown node's position can be traced back to a source offset through the html
  layer (state the exact call path if so, with `file:line` at each hop) or whether no such trace
  exists anywhere in either tree.
- The public parse/render/walk surfaces each package exports (its barrel file plus the
  underlying declarations) that an LSP-style feature -- `textDocument/documentSymbol`,
  `foldingRange`, `selectionRange`, `semanticTokens` -- would need to build on, each with
  `file:line`.

### 4. progress mechanisms at implementation depth (`/home/user/workflow`, `/home/user/process`,
   `/home/user/tool`, `/home/user/queue`, `/home/user/middleware`)

For each of the five packages, in its own subsection:

- Every emitter event name and its payload type: the type declaration's `file:line` and every
  emit call site's `file:line`.
- Every state or phase transition the package's lifecycle machinery defines, quoting the union
  or enum declaration with `file:line`.
- Any percentage, count, or ratio field reported as part of progress, with `file:line`, or a
  statement of absence.
- Cancellation propagation: does the package plumb an `AbortSignal` (or equivalent) through its
  lifecycle, and where is it read and honoured, with `file:line` at each point, or a statement of
  absence.
- Any partial-result surface -- a mechanism for reporting incremental output before completion --
  with `file:line`, or a statement of absence.
- The package's fixed lifecycle vocabulary (its own naming rule for verbs such as start, run,
  stop, if it states one) as declared in its own rule or type files, with `file:line`.

Where a package has none of a given item, say so explicitly and name the exact directories or
files you searched to reach that conclusion. An unmarked absence reads as an unfinished search,
not as a clean result.

## Unknowns

State, in your own Unknowns section at the end, anything either input document asked you to
resolve that you could not resolve from the checkouts as they exist on disk, and name exactly
what you searched before giving up on it.

## Deviation contract

Stop and report, rather than improvise, only for a conflict with this brief's primary
objective: a checkout path that does not exist, a tool denial that blocks reading a file
outright, or a question this brief asks that the tree cannot answer at all. Do not stop over an
ancillary judgment call, such as which subsection heading to use for a sub-answer -- decide it
yourself, record the choice, and continue.

## Output -- the exact distillate to return

Return only:

- **Evidence**, organized as the four numbered sections above, each answering every named
  sub-question with `file:line` pointers and minimal quoted snippets.
- **Unknowns**, as specified.
- No Distillate-of-a-Distillate summary, no recommendations, no design proposal, no application
  of LSP concepts to the fleet's roadmap. This lane returns evidence, never a decision.
