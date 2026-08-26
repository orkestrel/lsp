# Brief: distill LSP 3.18 specification (primary sources only)

## Transport note (read first)

You are the Cursor Grok engine invoked directly through the `agent` CLI. Perform this
research yourself, in this process. Do not spawn a subagent, do not delegate, do not
answer from memory alone -- use your web-research tooling to fetch and read the primary
sources named below. This is read-only work: no repository edits, no file writes outside
your own answer, no decisions, no recommendations, no application to any codebase.

## Bounded question

Distill the Language Server Protocol (LSP) 3.18 specification into the evidence set an
audit campaign needs, from primary sources only.

## Primary sources, in priority order

1. https://microsoft.github.io/language-server-protocol/specifications/lsp/3.18/specification/
   -- the full single-page 3.18 specification. This is the authoritative source; read it
   directly rather than a summary or a mirror.
2. Sibling routes under https://microsoft.github.io/language-server-protocol/ that the
   audit needs: the protocol overview page(s), the 3.18 change/upgrade notes (what moved
   from 3.17), and the metaModel description (`metaModel.json` and/or its schema/overview
   page), if reachable from the site.

Fetch and read the actual pages. Do not rely on a search-result snippet in place of the
page itself.

## Required coverage

Cover every item below as its own named section in your answer. Do not merge sections.

1. **Base protocol.** Header/content framing, JSON-RPC 2.0 request/response/notification
   shape, error codes and their numeric ranges, `$/` notifications, `$/cancelRequest`
   cancellation semantics, message ordering rules.
2. **Lifecycle.** `initialize`/`initialized`, the shape of ClientCapabilities/
   ServerCapabilities negotiation, dynamic registration
   (`client/registerCapability`/`client/unregisterCapability`), `shutdown`/`exit`, server
   lifetime rules.
3. **Progress model -- exhaustive.** This is the audit's center, so give it the most
   detail: `$/progress`, WorkDoneProgress (Begin/Report/End payload fields, title/message/
   percentage rules, the `cancellable` flag), `window/workDoneProgress/create` and
   `window/workDoneProgress/cancel`, client-initiated vs server-initiated work-done
   progress, partial results through `partialResultToken`, and how progress tokens attach
   to requests (`workDoneToken` field placement).
4. **Document synchronization.** `textDocument/didOpen`/`didChange` (full vs incremental
   `TextDocumentContentChangeEvent`), document versioning, `willSave`/`didSave`/
   `didClose`, position encoding negotiation (utf-8/utf-16/utf-32), and the exact
   semantics of `Position`/`Range`/`Location`/`DocumentUri` (zero-based lines, what a
   character offset counts).
5. **Structure-bearing language features (the AST-adjacent surface).**
   `textDocument/documentSymbol` (hierarchical `DocumentSymbol` vs flat
   `SymbolInformation`, the `SymbolKind` enum), `foldingRange`, `selectionRange`,
   `semanticTokens` (legend, full/range/delta encodings, the integer-array encoding
   scheme), `inlayHint`, `documentLink`. Note every place the resolve-provider
   lazy-resolution pattern appears.
6. **Diagnostics.** Push (`textDocument/publishDiagnostics`) vs pull
   (`textDocument/diagnostic`, `workspace/diagnostic`) models, `DiagnosticSeverity`/
   `DiagnosticTag`/`DiagnosticRelatedInformation`, result ids and unchanged reports.
7. **Remaining language features, as one taxonomy table.** One row each for: completion,
   hover, signatureHelp, definition, declaration, typeDefinition, implementation,
   references, rename (+ prepareRename), codeAction (kinds, resolve), codeLens,
   the formatting family, callHierarchy, typeHierarchy, moniker, linkedEditingRange,
   inline value, inline completion (3.18). Each row: purpose, request/response shape in
   one line, capability key.
8. **Workspace features.** Workspace folders, `workspace/configuration`, file operations
   (`willCreateFiles`/`didCreateFiles` etc.), `workspace/applyEdit` and `WorkspaceEdit`
   (`documentChanges`, `TextDocumentEdit`, resource operations, `AnnotatedTextEdit`,
   change annotations), workspace symbols.
9. **Versioning and evolution machinery.** How 3.18 marks `proposed` features, `since`
   annotations, the metaModel as the machine-readable protocol description, deprecation
   practice, capability-gated backward compatibility, how the LSP project tracks spec
   progress. List what is new or proposed in 3.18 relative to 3.17.
10. **Implementation considerations the spec itself states.** Staleness and result
    invalidation on document change, error recovery, `ContentModified`, request ordering
    obligations.

## Return shape

- State facts as facts, each with the spec's own heading or anchor as its pointer (for
  example: "Section Progress Support, `workDoneProgress/create`"). No raw text dumps of
  the spec -- paraphrase and cite the anchor.
- End with an **Unknowns** section listing anything unreachable (page did not load,
  anchor not found) or ambiguous in the source text.
- Do not recommend anything. Do not apply any of this to a repository or codebase. Do not
  make a decision. Return evidence only.
