# Brief: distill LSP 3.18 specification — run 2, locally staged sources

## Supersession record

This brief supersedes `tmp/cursor/lsp-spec-brief.md` in its source-access instructions only.
Run 1 returned no evidence: this CLI's WebFetch, WebSearch, and HTTP tooling are rejected in
unattended mode (journal `tmp/cursor/lsp-spec.log`, Unknowns). The Orchestrator staged the
primary sources as local files. Every other section of the original brief — the transport
note, the bounded question, all ten required-coverage sections, and the return shape — binds
unchanged. Read the original brief for those sections before answering.

## Source access — replaces "Primary sources" in the original

Do not attempt any web access; it fails in this harness. Read these local files instead,
relative to the working directory `/home/user/scaffold`:

1. `tmp/cursor/sources/lsp-3.18-specification.html` — the complete rendered 3.18
   specification page (1,008,330 bytes), fetched 2026-08-25 from
   https://microsoft.github.io/language-server-protocol/specifications/lsp/3.18/specification/.
   This is the authoritative document for coverage sections 1 through 8 and 10.
2. `tmp/cursor/sources/lsp-3.18-metaModel.json` — the 3.18.0 machine-readable metaModel
   (434,788 bytes; `metaData.version` reads `3.18.0`). Use it for coverage section 9
   (versioning and evolution machinery: `proposed` flags, `since` annotations, the model's
   own structure) and to cross-check request/capability names in the taxonomy table.
3. `tmp/cursor/sources/lsp-3.18-specification.md` — the Jekyll source shell (44,091 bytes).
   Its body is include directives, so it is NOT the spec text; read only its own prose — the
   "What's new in 3.18" introduction and the change-log pointer — as evidence for section 9.
4. `tmp/cursor/sources/lsp-overview.html` — the protocol overview page (48,765 bytes), for
   architecture framing where the spec page assumes it.

Cite pointers as the spec's own section headings and anchor names as they appear in the
HTML (`name="..."` anchors survive in the file). State in your Unknowns anything the staged
files do not carry that the original brief asked for — the staged set has no separate
3.17-to-3.18 upgrade-notes page, so derive the 3.18 delta from the spec's own "What's new"
and change-log sections plus `@since 3.18` / `proposed` markers in the text and metaModel.
