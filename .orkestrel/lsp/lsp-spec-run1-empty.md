Primary sources were not loaded. WebFetch, WebSearch, and HTTP GET against the named LSP 3.18 URLs (and against `https://example.com/` as a control) were rejected by this harness before any page body arrived. The brief forbids answering from memory, so the sections below are empty of spec facts.

## Base protocol

No evidence. The 3.18 specification page did not load, so header/content framing, JSON-RPC 2.0 shapes, error-code ranges, `$/` notifications, `$/cancelRequest`, and message-ordering rules were not read from the source.

## Lifecycle

No evidence. `initialize`/`initialized`, ClientCapabilities/ServerCapabilities, `client/registerCapability`/`client/unregisterCapability`, `shutdown`/`exit`, and server lifetime rules were not read from the source.

## Progress model -- exhaustive

No evidence. `$/progress`, WorkDoneProgress Begin/Report/End, `window/workDoneProgress/create` and `window/workDoneProgress/cancel`, client- vs server-initiated work-done progress, `partialResultToken`, and `workDoneToken` attachment were not read from the source.

## Document synchronization

No evidence. `textDocument/didOpen`/`didChange`, full vs incremental `TextDocumentContentChangeEvent`, versioning, `willSave`/`didSave`/`didClose`, position encoding, and `Position`/`Range`/`Location`/`DocumentUri` semantics were not read from the source.

## Structure-bearing language features (the AST-adjacent surface)

No evidence. `textDocument/documentSymbol`, `foldingRange`, `selectionRange`, `semanticTokens`, `inlayHint`, `documentLink`, and resolve-provider sites were not read from the source.

## Diagnostics

No evidence. Push vs pull diagnostic models, severity/tag/related-information types, result ids, and unchanged reports were not read from the source.

## Remaining language features, as one taxonomy table

No evidence. Completion, hover, signatureHelp, definition, declaration, typeDefinition, implementation, references, rename (+ prepareRename), codeAction, codeLens, formatting, callHierarchy, typeHierarchy, moniker, linkedEditingRange, inline value, and inline completion were not read from the source. No capability keys or request/response shapes can be cited.

## Workspace features

No evidence. Workspace folders, `workspace/configuration`, file operations, `workspace/applyEdit`/`WorkspaceEdit`, and workspace symbols were not read from the source.

## Versioning and evolution machinery

No evidence. Proposed-feature marking, `since` annotations, the metaModel, deprecation practice, capability-gated compatibility, project progress tracking, and 3.18-vs-3.17 deltas were not read from the specification or from sibling overview/changelog/metaModel pages.

## Implementation considerations the spec itself states

No evidence. Staleness/invalidation on document change, error recovery, `ContentModified`, and request-ordering obligations were not read from the source.

## Unknowns

- **Authoritative spec URL did not load:** `https://microsoft.github.io/language-server-protocol/specifications/lsp/3.18/specification/` — WebFetch returned `User Rejected`; a Python `urllib` GET was also rejected before a status or body.
- **Control fetch also rejected:** `https://example.com/` — same `User Rejected` result, so this is a harness network block, not a missing LSP page.
- **WebSearch rejected:** sibling overview, 3.18 upgrade notes, and metaModel routes under `https://microsoft.github.io/language-server-protocol/` were not discovered from the live site.
- **Alternate spec fetch rejected:** `https://raw.githubusercontent.com/microsoft/language-server-protocol/gh-pages/_specifications/lsp/3.18/specification.md` — WebFetch `User Rejected`.
- **Sibling pages not fetched (URLs therefore unverified):** protocol overview page(s); 3.18 change/upgrade notes relative to 3.17; `metaModel.json` and its schema/overview page.
- **No local fallback:** this workspace has no copy of the specification, metaModel, or LSP-related source that could substitute for those pages.

Nothing in this answer is a paraphrase of the 3.18 spec. The bounded question cannot be answered until the named primary sources can be fetched and read.
