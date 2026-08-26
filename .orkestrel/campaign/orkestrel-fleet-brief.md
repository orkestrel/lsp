# Unit: orkestrel-fleet — package map for the LSP audit campaign

## Role and engine

Role `orkestrel`, engine Sonnet (native Claude subagent). Read-only: no `Edit`, no `Write`, no shell.

## Objective

One package map of the fleet checkouts under `/home/user/`, with coarse `file:line` pointers to the surfaces the LSP 3.18 audit reads next. The map is evidence for a later design round; it decides nothing.

## Context

- Checkouts: `/home/user/scaffold`, `/home/user/workflow`, `/home/user/process`, `/home/user/tool`, `/home/user/queue`, `/home/user/mcp`, `/home/user/middleware`, `/home/user/markdown`, `/home/user/html`, `/home/user/probe`.
- Each is an Orkestrel TypeScript package: `src/` with per-environment `types.ts` files, `guides/`, `package.json`.
- The campaign audits the fleet against the Language Server Protocol (LSP) 3.18 specification: progress tracking, document/AST structures, and language-server client usage.
- Do not treat any embedded catalog in your role file as live state. Read the manifests in the checkouts.

## Unknowns

- Which repos carry a progress, status, or tracking surface, and under what names. Report what you find; absence in a repo is a finding, stated as absence.
- Which Model Context Protocol (MCP) revision the `mcp` package implements. Report the exact constant or literal with its `file:line`.

## Scope

- Read anywhere under the checkouts listed in Context. Write nothing. Run nothing.

## Execution

Perform this assignment directly yourself and spawn nothing.

## Output

Return, and nothing else:

1. **Package table**: name, version, runtime `dependencies`, one-line purpose from the package's own guide or README, per checkout.
2. **Audit pointers**, per checkout, as `file:line` with a one-line description:
   - `workflow`, `process`, `tool`, `queue`, `middleware`: every surface that models progress, status, phase, lifecycle events, cancellation, or partial results — the type declarations in `*/types.ts` and the emitting implementation.
   - `mcp`: the protocol revision it implements, plus its progress and cancellation surfaces.
   - `markdown`, `html`: the AST node type declarations — where the node shapes, positions/offsets/ranges, and any symbol or outline structures live.
   - `probe`: every place it starts, drives, or speaks to a language server — transport, requests used, capability handling.
   - `scaffold`: only what names LSP, language servers, or `tsgo`/TypeScript 7, if anything.
3. **Unknowns**: what you could not resolve, named as unknown.

No process diary. No recommendations.

## Deviation contract

You are read-only; there is no writing deviation. If a checkout listed in Context is missing or unreadable, stop reading that checkout and name it in Unknowns; continue the rest.

## Acceptance criteria

- Every checkout from Context appears in the package table or in Unknowns.
- Every audit pointer carries a `file:line`.
- The MCP revision row quotes the literal it found.
