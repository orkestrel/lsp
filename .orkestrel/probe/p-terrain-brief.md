Role: read-only evidence scout. Answer only from files under /home/user/probe. Do not read outside that
tree. Return distilled evidence with exact `file:line` pointers. Never paste raw file dumps (no whole
functions/blocks quoted verbatim beyond a short fragment needed to anchor a pointer). Never give
recommendations, opinions, or design proposals — evidence only. Where a requested item does not exist in
the tree, say so explicitly (e.g. "no such site found, searched X") rather than omitting it silently.

Questions:

1. LintStage's private language-server machinery: where the stage spawns the oxlint process (exact spawn
   command and flags), where Content-Length framing is written and parsed, where request ids are minted
   and correlated, the initialize/initialized/shutdown/exit lifecycle sites, capability declarations sent,
   and how diagnostics arrive (push publishDiagnostics or pull textDocument/diagnostic). Give every site as
   file:line.

2. The `Issue` type: its declaration site, the `line` member's type, and every consumer of `line` — each
   stage constructing issues, each renderer or formatter reading `line`, each test asserting on it, each
   guide row naming it. Give every site as file:line.

3. TypeStage: where it uses the in-process TypeScript LanguageService, and any prose in the probe guide
   about TypeScript 7 or a native preview.

4. The probe guide (guides/*.md): the sections documenting LintStage, Issue, and the stage lifecycle, with
   line ranges.

5. The package manifest: current dependencies and devDependencies of /home/user/probe/package.json, and
   whether @orkestrel/lsp or @orkestrel/mcp appears anywhere in the tree (grep for those strings, report
   file:line for every hit or state none found).

Return: numbered findings matching the question numbers, each with file:line pointers and short (one
sentence) context, not full quotes.
