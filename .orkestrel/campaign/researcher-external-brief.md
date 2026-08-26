# Unit: researcher-external — TypeScript 7 LSP server and MCP 2026-07-28 anchor

## Role and engine

Role `researcher`, engine Sonnet (native Claude subagent). Read-only plus web research; no `Edit`, no `Write`, no shell. Ladder substitution recorded by the Orchestrator: the Cursor Grok bench cannot perform web fetches in unattended mode (proven 2026-08-25, journal `tmp/cursor/lsp-spec.log`), and the Codex bench exec sandbox denies network by contract, so this bounded primary-source research runs on the native Sonnet lane.

## Objective

A cited capability matrix on two external subjects the LSP audit design round needs. Evidence only; no recommendations, no application to any repository.

## Context

- The campaign audits an Orkestrel TypeScript fleet against LSP 3.18. One design question is whether to align the fleet's progress model with LSP WorkDoneProgress or with the Model Context Protocol (MCP) revision dated 2026-07-28. Another is whether the `probe` package's language-server usage is ready for the TypeScript 7 native toolchain's own LSP server.
- Web access works in this harness through the preconfigured proxy: use WebFetch and WebSearch.
- Today is 2026-08-25. Prefer sources dated 2026 over your training memory; where a fact comes from memory rather than a fetched page, mark it as such.

## Unknowns the unit resolves

1. **TypeScript 7 / typescript-go LSP server.** From primary sources (the microsoft/typescript-go repository, the TypeScript team's devblogs posts on the native port, npm `@typescript/native-preview`, official docs):
   - Does the native toolchain ship an LSP server, and under what command or flag?
   - Which LSP protocol version does it target, and what is its capability coverage as of 2026-08 — which LSP features are implemented, partial, or absent, compared with the old `tsserver` custom protocol?
   - What migration guidance the TypeScript team publishes for tools that drive `tsserver` or the `tsc` API today.
   - Release state: what ships as TypeScript 7, what remains preview, and the dates the sources give.
2. **MCP revision 2026-07-28.** From modelcontextprotocol.io (specification pages and changelog for that revision):
   - The changelog of 2026-07-28 relative to 2025-11-25.
   - The exact progress model: notification names, token fields, payload shapes, percentage semantics, and where the token rides on a request.
   - The cancellation model: notification names and semantics.
   - Capability negotiation: how client and server capabilities are declared and versioned.
   - How the MCP project marks revision membership and proposed or draft features — its evolution machinery.

## Scope

- Web: modelcontextprotocol.io, github.com/microsoft/typescript-go, devblogs.microsoft.com, npmjs.com, and pages they link. Local: nothing — do not read the fleet checkouts; another lane owns them.
- Write no files. Run no commands.

## Execution

Perform this assignment directly yourself and spawn nothing.

## Output

Return, and nothing else:

1. **TS7 LSP matrix**: rows of LSP capability areas (lifecycle, sync, diagnostics push/pull, completion, hover, definition/references, rename, documentSymbol, semanticTokens, foldingRange, inlayHint, codeAction, formatting, workspace features, progress), each ruled implemented / partial / absent / unknown for the native LSP server, with the citation (URL and its date) per row.
2. **MCP 2026-07-28 anchor**: the changelog delta, the progress model, the cancellation model, and capability negotiation, each as stated facts with the page URL as pointer.
3. **Unknowns**: what no fetched source settles, named as unknown. A memory-only claim goes in Unknowns, marked memory-only, never in the matrix.

## Deviation contract

You are read-only; there is no writing deviation. If a domain is unreachable, name it in Unknowns with the exact failure and continue the remaining sources.

## Acceptance criteria

- Every matrix row carries a fetched citation or sits in Unknowns.
- The MCP section quotes the revision string it found on the page.
- No recommendation appears anywhere in the return.
